// worker/video-worker.js
// MakeVision.video — VPS Video Processing Worker
//
// Polls Supabase every 10s for VisionProjects with status 'Processing'.
// For each: downloads media, concatenates with FFmpeg + 852Hz audio,
// uploads final MP4 to Supabase Storage, marks Completed, sends email via Resend.

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createClient } from '@supabase/supabase-js'
import ffmpeg from 'fluent-ffmpeg'
import fetch from 'node-fetch'
import { Resend } from 'resend'

// ─── Config ───────────────────────────────────────────────────────────────────

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'APP_URL',
]

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`)
    process.exit(1)
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const resend = new Resend(process.env.RESEND_API_KEY)

const POLL_INTERVAL_MS = 10_000
const STORAGE_BUCKET   = 'vision-assets'
const AUDIO_DIR        = path.resolve('./audio')

// ─── Entry point ──────────────────────────────────────────────────────────────

console.log('🎬 MakeVision Worker started. Polling every 10s...')
poll()

async function poll() {
  try {
    await processNextBatch()
  } catch (err) {
    console.error('❌ Unhandled poll error:', err)
  }
  setTimeout(poll, POLL_INTERVAL_MS)
}

// ─── Main batch processor ─────────────────────────────────────────────────────

async function processNextBatch() {
  const { data: projects, error } = await supabase
    .from('vision_projects')
    .select('id, user_id, status')
    .eq('status', 'Processing')
    .limit(3)   // process up to 3 concurrently per tick

  if (error) { console.error('DB poll error:', error.message); return }
  if (!projects?.length) return

  console.log(`📋 Found ${projects.length} project(s) to process`)

  // Process sequentially to avoid overwhelming the VPS
  for (const project of projects) {
    await processProject(project)
  }
}

// ─── Per-project pipeline ─────────────────────────────────────────────────────

async function processProject(project) {
  const { id: projectId, user_id: userId } = project
  console.log(`\n▶ Processing project: ${projectId}`)

  // Claim the project immediately to prevent double-processing
  const { error: claimError } = await supabase
    .from('vision_projects')
    .update({ status: 'Processing', updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('status', 'Processing')   // optimistic lock

  if (claimError) {
    console.warn(`⚠ Could not claim project ${projectId}, skipping`)
    return
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `mv-${projectId.slice(-8)}-`))
  console.log(`📁 Temp dir: ${tmpDir}`)

  try {
    // 1. Fetch media generations
    const { data: generations, error: genError } = await supabase
      .from('media_generations')
      .select('id, media_url, media_type')
      .eq('vision_project_id', projectId)
      .not('media_url', 'eq', '')
      .order('created_at', { ascending: true })

    if (genError || !generations?.length) {
      throw new Error(`No media found for project ${projectId}: ${genError?.message}`)
    }

    console.log(`📸 Found ${generations.length} media file(s)`)

    // 2. Download all media files
    const localFiles = await downloadAll(generations, tmpDir)

    // 3. Pick a random audio file
    const audioFile = pickRandomAudio()
    console.log(`🎵 Audio: ${audioFile ?? 'none (no audio dir)'}`)

    // 4. Concatenate with FFmpeg
    const outputPath = path.join(tmpDir, 'final.mp4')
    await concatenateWithFFmpeg(localFiles, audioFile, outputPath)
    console.log(`✅ FFmpeg done → ${outputPath}`)

    // 5. Upload to Supabase Storage
    const storagePath = `final-videos/${userId}/${projectId}.mp4`
    const finalVideoUrl = await uploadToStorage(outputPath, storagePath)
    console.log(`☁ Uploaded → ${finalVideoUrl}`)

    // 6. Mark project Completed
    await supabase
      .from('vision_projects')
      .update({ status: 'Completed', final_video_url: finalVideoUrl })
      .eq('id', projectId)

    // 7. Send congratulatory email
    const userEmail = await getUserEmail(userId)
    if (userEmail) {
      await sendCompletionEmail(userEmail, finalVideoUrl)
      console.log(`📧 Email sent to ${userEmail}`)
    }

    console.log(`🎉 Project ${projectId} completed successfully`)
  } catch (err) {
    console.error(`❌ Project ${projectId} failed:`, err.message)
    // Revert to Processing so it can be retried (or set a failed status)
    await supabase
      .from('vision_projects')
      .update({ status: 'Processing' })
      .eq('id', projectId)
  } finally {
    // 8. Clean up temp files
    fs.rmSync(tmpDir, { recursive: true, force: true })
    console.log(`🧹 Cleaned up ${tmpDir}`)
  }
}

// ─── Download helpers ─────────────────────────────────────────────────────────

async function downloadAll(generations, tmpDir) {
  const paths = []
  for (let i = 0; i < generations.length; i++) {
    const gen  = generations[i]
    const ext  = gen.media_type === 'Video' ? 'mp4' : 'jpg'
    const dest = path.join(tmpDir, `media-${String(i).padStart(2, '0')}.${ext}`)
    await downloadFile(gen.media_url, dest)
    paths.push({ path: dest, type: gen.media_type })
  }
  return paths
}

async function downloadFile(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  const buffer = await res.arrayBuffer()
  fs.writeFileSync(dest, Buffer.from(buffer))
}

// ─── Audio picker ─────────────────────────────────────────────────────────────

function pickRandomAudio() {
  if (!fs.existsSync(AUDIO_DIR)) return null
  const files = fs.readdirSync(AUDIO_DIR).filter((f) =>
    ['.mp3', '.wav', '.aac', '.m4a'].includes(path.extname(f).toLowerCase())
  )
  if (!files.length) return null
  const pick = files[Math.floor(Math.random() * files.length)]
  return path.join(AUDIO_DIR, pick)
}

// ─── FFmpeg pipeline ──────────────────────────────────────────────────────────
// Strategy:
//   - Images → treated as 3-second still clips
//   - Videos → used as-is
//   - All clips are scaled/padded to 1080x1920 (portrait 9:16)
//   - Audio is mixed in and trimmed to video duration

async function concatenateWithFFmpeg(mediaFiles, audioFile, outputPath) {
  return new Promise((resolve, reject) => {
    const concatListPath = outputPath.replace('final.mp4', 'concat.txt')

    // Build intermediate clips (convert images to short video clips)
    const clipPromises = mediaFiles.map((m, i) => {
      if (m.type === 'Image') {
        const clipPath = m.path.replace(/\.\w+$/, '_clip.mp4')
        return imageToClip(m.path, clipPath).then(() => clipPath)
      }
      return Promise.resolve(m.path)
    })

    Promise.all(clipPromises).then((clipPaths) => {
      // Write FFmpeg concat list
      const listContent = clipPaths.map((p) => `file '${p}'`).join('\n')
      fs.writeFileSync(concatListPath, listContent)

      const cmd = ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])

      if (audioFile) {
        cmd
          .input(audioFile)
          .outputOptions([
            '-c:v libx264',
            '-preset fast',
            '-crf 23',
            '-c:a aac',
            '-b:a 192k',
            '-shortest',          // trim to shortest stream (video)
            '-movflags +faststart',
            '-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
          ])
      } else {
        cmd.outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-an',
          '-movflags +faststart',
          '-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
        ])
      }

      cmd
        .output(outputPath)
        .on('start', (cmdLine) => console.log('  FFmpeg:', cmdLine.slice(0, 120) + '...'))
        .on('progress', (p) => process.stdout.write(`\r  Progress: ${Math.round(p.percent ?? 0)}%`))
        .on('end', () => { process.stdout.write('\n'); resolve() })
        .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
        .run()
    }).catch(reject)
  })
}

function imageToClip(imagePath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1', '-t 3'])   // 3-second still
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', (err) => reject(new Error(`imageToClip error: ${err.message}`)))
      .run()
  })
}

// ─── Supabase Storage upload ──────────────────────────────────────────────────

async function uploadToStorage(filePath, storagePath) {
  const fileBuffer = fs.readFileSync(filePath)

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath)

  return data.publicUrl
}

// ─── User email lookup ────────────────────────────────────────────────────────

async function getUserEmail(userId) {
  const { data } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', userId)
    .single()
  return data ? { email: data.email, name: data.name } : null
}

// ─── Resend email ─────────────────────────────────────────────────────────────

async function sendCompletionEmail(recipient, finalVideoUrl) {
  const { email, name } = recipient
  const firstName = name?.split(' ')[0] ?? 'Visionary'
  const dashboardUrl = `${process.env.APP_URL}/dashboard`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to:   email,
    subject: '✦ Your Vision is Ready',
    html: buildEmailHtml(firstName, dashboardUrl, finalVideoUrl),
  })
}

function buildEmailHtml(firstName, dashboardUrl, videoUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Vision is Ready</title>
</head>
<body style="margin:0;padding:0;background:#080810;font-family:Inter,system-ui,sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080810;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <span style="font-size:18px;font-weight:600;color:#a78bfa;letter-spacing:0.05em;">
                MakeVision<span style="color:#6b7280;">.video</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0f0f1a;border:1px solid #1e1e2e;border-radius:16px;padding:40px 36px;">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <div style="width:56px;height:56px;border-radius:50%;background:rgba(76,29,149,0.3);
                                border:1px solid #4c1d95;display:inline-flex;align-items:center;
                                justify-content:center;font-size:24px;line-height:56px;text-align:center;">
                      ✦
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <p style="margin:0 0 8px;font-size:24px;font-weight:600;color:#ffffff;text-align:center;line-height:1.3;">
                It's done, ${firstName}.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#9ca3af;text-align:center;line-height:1.6;">
                Your vision has been woven into existence.<br />
                The future you imagined is now a film.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${dashboardUrl}"
                       style="display:inline-block;padding:14px 32px;background:#7c3aed;
                              color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;
                              border-radius:10px;letter-spacing:0.01em;">
                      Watch Your Vision ✦
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #1e1e2e;margin:0 0 24px;" />

              <!-- Footer note -->
              <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;line-height:1.6;">
                If the button doesn't work, copy this link:<br />
                <a href="${dashboardUrl}" style="color:#a78bfa;word-break:break-all;">${dashboardUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:#374151;">
                MakeVision.video — You imagined it. We made it real.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
