// supabase/functions/generate-full-video/index.ts
//
// ASYNC PIPELINE — returns 200 immediately, runs in background via waitUntil.
//
// Request:  { project_id, selfie_url, prompts: string[6], audio_prompt? }
// Response: { job_id: string }   ← frontend polls video_jobs table by this id
//
// Pipeline (background):
//   Phase 1+2: Flux × 6 → FaceSwap × 6  (per-slot, fully parallel, retry ×2)
//   Phase 3:   Kling × 6 + Udio × 1      (parallel, retry ×2 each)
//   Phase 4:   Shotstack stitch           → video_url
//
// DB writes: video_jobs.status = processing → completed | failed

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PIAPI_BASE  = 'https://api.piapi.ai/api/v1/task'
const PIAPI_FETCH = (id: string) => `https://api.piapi.ai/api/v1/task/${id}`
const SHOTSTACK_RENDER = 'https://api.shotstack.io/v1/render'

// ─── Entry point ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const piApiKey     = Deno.env.get('PIAPI_API_KEY')
    const shotstackKey = Deno.env.get('SHOTSTACK_API_KEY')
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!piApiKey)     return json({ error: 'PIAPI_API_KEY not set' }, 500)
    if (!shotstackKey) return json({ error: 'SHOTSTACK_API_KEY not set' }, 500)

    const body = await req.json()
    const project_id: string  = body?.project_id
    const selfie_url: string  = body?.selfie_url
    const prompts: string[]   = body?.prompts
    const audio_prompt: string = body?.audio_prompt
      ?? 'cinematic inspirational ambient soundtrack, no lyrics, emotional, uplifting'

    if (!project_id)  return json({ error: 'project_id is required' }, 400)
    if (!selfie_url)  return json({ error: 'selfie_url is required' }, 400)
    if (!Array.isArray(prompts) || prompts.length !== 6)
      return json({ error: 'prompts must be an array of exactly 6 strings' }, 400)

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    // ── Create job record immediately ─────────────────────────────────────────
    const { data: job, error: jobError } = await supabase
      .from('video_jobs')
      .insert({ vision_project_id: project_id, user_id: body?.user_id ?? '00000000-0000-0000-0000-000000000000', status: 'processing' })
      .select('id')
      .single()

    if (jobError || !job) {
      console.error('Failed to create job:', jobError)
      return json({ error: 'Failed to create job record' }, 500)
    }

    const jobId = job.id
    console.log(`Job ${jobId} created for project ${project_id}`)

    // ── Fire-and-forget pipeline via waitUntil ────────────────────────────────
    // EdgeRuntime.waitUntil keeps the function alive after the response is sent.
    const pipeline = runPipeline({
      jobId, project_id, selfie_url, prompts, audio_prompt,
      piApiKey, shotstackKey, supabase,
    })

    // @ts-ignore — Deno Deploy / Supabase Edge Runtime global
    if (typeof EdgeRuntime !== 'undefined') {
      // deno-lint-ignore no-explicit-any
      (EdgeRuntime as any).waitUntil(pipeline)
    } else {
      // Local dev fallback — just run it (will block, but fine for testing)
      pipeline.catch((e) => console.error('Pipeline error (local):', e))
    }

    // ── Return immediately ────────────────────────────────────────────────────
    return json({ success: true, job_id: jobId })

  } catch (err) {
    console.error('Handler error:', err)
    return json({ error: String(err) }, 500)
  }
})

// ─── Background pipeline ──────────────────────────────────────────────────────

async function runPipeline(ctx: {
  jobId: string
  project_id: string
  selfie_url: string
  prompts: string[]
  audio_prompt: string
  piApiKey: string
  shotstackKey: string
  // deno-lint-ignore no-explicit-any
  supabase: any
}) {
  const { jobId, project_id, selfie_url, prompts, audio_prompt, piApiKey, shotstackKey, supabase } = ctx

  const fail = async (msg: string) => {
    console.error(`Job ${jobId} failed: ${msg}`)
    await supabase.from('video_jobs').update({ status: 'failed', error: msg }).eq('id', jobId)
    await supabase.from('vision_projects').update({ status: 'Failed' }).eq('id', project_id)
  }

  try {
    // ── Phase 1+2: Flux → FaceSwap per slot, all parallel, retry ×2 ──────────
    console.log(`Job ${jobId}: Phase 1+2 start`)
    const faceSwapResults = await Promise.all(
      prompts.map(async (prompt, i) => {
        const rawUrl = await withRetry(
          () => generateFluxImage(piApiKey, prompt),
          2, `Slot ${i} Flux`,
        )
        const finalUrl = await withRetry(
          () => faceSwap(piApiKey, rawUrl, selfie_url),
          2, `Slot ${i} FaceSwap`,
        )
        console.log(`Job ${jobId}: slot ${i} image ready`)
        return finalUrl
      })
    )

    // ── Phase 3: Kling × 6 + Udio × 1, parallel, retry ×2 ───────────────────
    console.log(`Job ${jobId}: Phase 3 start`)
    const [videoUrls, audioUrl] = await Promise.all([
      Promise.all(
        faceSwapResults.map((imgUrl, i) =>
          withRetry(
            () => generateKlingVideo(piApiKey, imgUrl, prompts[i]),
            2, `Slot ${i} Kling`,
          )
        )
      ),
      withRetry(() => generateUdioAudio(piApiKey, audio_prompt), 2, 'Udio'),
    ])

    console.log(`Job ${jobId}: Phase 3 done. Videos: ${videoUrls.length}, Audio: ${audioUrl}`)

    // ── Phase 4: Shotstack stitch ─────────────────────────────────────────────
    console.log(`Job ${jobId}: Phase 4 start`)
    const finalVideoUrl = await withRetry(
      () => stitchWithShotstack(shotstackKey, videoUrls, audioUrl),
      1, 'Shotstack',
    )

    // ── Done ──────────────────────────────────────────────────────────────────
    await supabase
      .from('video_jobs')
      .update({ status: 'completed', video_url: finalVideoUrl })
      .eq('id', jobId)

    await supabase
      .from('vision_projects')
      .update({ status: 'Completed' })
      .eq('id', project_id)

    console.log(`Job ${jobId}: completed → ${finalVideoUrl}`)

  } catch (err) {
    await fail(String(err))
  }
}

// ─── Retry wrapper ────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  label: string,
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt < maxRetries) {
        const delay = 3000 * (attempt + 1)  // 3s, 6s backoff
        console.warn(`${label} attempt ${attempt + 1} failed, retrying in ${delay}ms: ${err}`)
        await sleep(delay)
      }
    }
  }
  throw new Error(`${label} failed after ${maxRetries + 1} attempts: ${lastErr}`)
}

// ─── Step 1: Flux-1-dev text-to-image ────────────────────────────────────────

async function generateFluxImage(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(PIAPI_BASE, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'Qubico/flux1-dev',
      task_type: 'txt2img',
      input: {
        prompt,
        negative_prompt: 'multiple people, distorted face, extra limbs, blurry, low quality',
        width: 768,
        height: 1024,
        guidance_scale: 3.5,
        num_inference_steps: 28,
        process_mode: 'fast',
      },
    }),
  })
  if (!res.ok) throw new Error(`Flux submit (${res.status}): ${await res.text()}`)
  const data = await res.json()
  const taskId = data?.data?.task_id
  if (!taskId) throw new Error(`Flux no task_id: ${JSON.stringify(data)}`)
  return pollTask(apiKey, taskId, 'image_url', 30, 5000)
}

// ─── Step 2: Face Swap ────────────────────────────────────────────────────────

async function faceSwap(apiKey: string, targetImageUrl: string, swapImageUrl: string): Promise<string> {
  const res = await fetch(PIAPI_BASE, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'Qubico/image-toolkit',
      task_type: 'face-swap',
      input: { target_image: targetImageUrl, swap_image: swapImageUrl },
    }),
  })
  if (!res.ok) throw new Error(`FaceSwap submit (${res.status}): ${await res.text()}`)
  const data = await res.json()
  const taskId = data?.data?.task_id
  if (!taskId) throw new Error(`FaceSwap no task_id: ${JSON.stringify(data)}`)
  return pollTask(apiKey, taskId, 'image_url', 24, 5000)
}

// ─── Step 3a: Kling v1.5 image-to-video ──────────────────────────────────────

async function generateKlingVideo(apiKey: string, imageUrl: string, prompt: string): Promise<string> {
  const motionPrompt = `Cinematic slow motion, subtle atmospheric depth, gentle camera drift. ${prompt.slice(0, 180)}`
  const res = await fetch(PIAPI_BASE, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'kling',
      task_type: 'video_generation',
      input: {
        prompt: motionPrompt,
        negative_prompt: 'blurry, low quality, distorted, shaky, fast motion',
        image_url: imageUrl,
        duration: 5,
        aspect_ratio: '9:16',
        mode: 'std',
        version: '1.5',
        cfg_scale: 0.5,
      },
      config: { service_mode: '' },
    }),
  })
  if (!res.ok) throw new Error(`Kling submit (${res.status}): ${await res.text()}`)
  const data = await res.json()
  const taskId = data?.data?.task_id
  if (!taskId) throw new Error(`Kling no task_id: ${JSON.stringify(data)}`)
  return pollVideoTask(apiKey, taskId, 30, 10000)
}

// ─── Step 3b: Udio instrumental ──────────────────────────────────────────────

async function generateUdioAudio(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(PIAPI_BASE, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'music-u',
      task_type: 'generate_music',
      input: { gpt_description_prompt: prompt, lyrics_type: 'instrumental', seed: -1 },
    }),
  })
  if (!res.ok) throw new Error(`Udio submit (${res.status}): ${await res.text()}`)
  const data = await res.json()
  const taskId = data?.data?.task_id
  if (!taskId) throw new Error(`Udio no task_id: ${JSON.stringify(data)}`)
  return pollAudioTask(apiKey, taskId, 30, 8000)
}

// ─── Step 4: Shotstack stitch ─────────────────────────────────────────────────

async function stitchWithShotstack(apiKey: string, videoUrls: string[], audioUrl: string): Promise<string> {
  const videoClips = videoUrls.map((src, i) => ({
    asset: { type: 'video', src },
    start: i * 5,
    length: 5,
    ...(i === 0 ? { transition: { in: 'fade' } } : {}),
    ...(i === videoUrls.length - 1 ? { transition: { out: 'fade' } } : {}),
  }))

  const renderRes = await fetch(SHOTSTACK_RENDER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      timeline: {
        soundtrack: { src: audioUrl, effect: 'fadeOut' },
        background: '#000000',
        tracks: [{ clips: videoClips }],
      },
      output: { format: 'mp4', resolution: 'sd' },
    }),
  })
  if (!renderRes.ok) throw new Error(`Shotstack submit (${renderRes.status}): ${await renderRes.text()}`)
  const renderData = await renderRes.json()
  const renderId = renderData?.response?.id
  if (!renderId) throw new Error(`Shotstack no render id: ${JSON.stringify(renderData)}`)

  console.log(`Shotstack render queued: ${renderId}`)
  for (let attempt = 0; attempt < 60; attempt++) {
    await sleep(5000)
    const statusRes = await fetch(`${SHOTSTACK_RENDER}/${renderId}`, {
      headers: { 'x-api-key': apiKey },
    })
    if (!statusRes.ok) { console.warn(`Shotstack poll #${attempt + 1}: HTTP ${statusRes.status}`); continue }
    const d = await statusRes.json()
    const status: string = d?.response?.status ?? ''
    console.log(`Shotstack poll #${attempt + 1}: ${status}`)
    if (status === 'done') {
      const url = d?.response?.url
      if (url) return url
      throw new Error('Shotstack done but no URL')
    }
    if (status === 'failed') throw new Error(`Shotstack failed: ${JSON.stringify(d?.response?.error)}`)
  }
  throw new Error('Shotstack timed out after 5 minutes')
}

// ─── PiAPI pollers ────────────────────────────────────────────────────────────

async function pollTask(apiKey: string, taskId: string, outputKey: string, maxAttempts: number, intervalMs: number): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs)
    const res = await fetch(PIAPI_FETCH(taskId), { headers: { 'X-API-Key': apiKey } })
    if (!res.ok) { console.warn(`Poll ${taskId} #${i + 1}: HTTP ${res.status}`); continue }
    const data = await res.json()
    const status: string = data?.data?.status ?? ''
    if (status === 'completed') {
      const url = data?.data?.output?.[outputKey] ?? data?.data?.output?.image_url ?? data?.data?.output?.image ?? data?.data?.output?.url
      if (url) return url
      throw new Error(`Task ${taskId} done but no URL: ${JSON.stringify(data?.data?.output)}`)
    }
    if (status === 'failed') throw new Error(`Task ${taskId} failed: ${JSON.stringify(data?.data?.error)}`)
  }
  throw new Error(`Task ${taskId} timed out`)
}

async function pollVideoTask(apiKey: string, taskId: string, maxAttempts: number, intervalMs: number): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs)
    const res = await fetch(PIAPI_FETCH(taskId), { headers: { 'X-API-Key': apiKey } })
    if (!res.ok) { console.warn(`Poll ${taskId} #${i + 1}: HTTP ${res.status}`); continue }
    const data = await res.json()
    const status: string = data?.data?.status ?? ''
    if (status === 'completed') {
      const url = data?.data?.output?.video_url ?? data?.data?.output?.url ?? data?.data?.output?.video
      if (url) return url
      throw new Error(`Task ${taskId} done but no video URL: ${JSON.stringify(data?.data?.output)}`)
    }
    if (status === 'failed') throw new Error(`Task ${taskId} failed: ${JSON.stringify(data?.data?.error)}`)
  }
  throw new Error(`Task ${taskId} timed out`)
}

async function pollAudioTask(apiKey: string, taskId: string, maxAttempts: number, intervalMs: number): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs)
    const res = await fetch(PIAPI_FETCH(taskId), { headers: { 'X-API-Key': apiKey } })
    if (!res.ok) { console.warn(`Poll ${taskId} #${i + 1}: HTTP ${res.status}`); continue }
    const data = await res.json()
    const status: string = data?.data?.status ?? ''
    if (status === 'completed') {
      const url = data?.data?.output?.songs?.[0]?.song_path ?? data?.data?.output?.audio_url ?? data?.data?.output?.url
      if (url) return url
      throw new Error(`Udio ${taskId} done but no audio URL: ${JSON.stringify(data?.data?.output)}`)
    }
    if (status === 'failed') throw new Error(`Udio ${taskId} failed: ${JSON.stringify(data?.data?.error)}`)
  }
  throw new Error(`Udio ${taskId} timed out`)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
