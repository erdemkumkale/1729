// supabase/functions/test-shotstack-render/index.ts
//
// TEST UTILITY — no auth required (--no-verify-jwt)
//
// 1. Lists all .mp4 files in the vision-assets bucket root
// 2. Creates signed URLs (1 hour) for each using service role key
// 3. Submits a Shotstack render job stitching all 6 videos sequentially
// 4. Polls until done, returns the final .mp4 URL
//
// POST {} — no body needed

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOTSTACK_RENDER = 'https://api.shotstack.io/v1/render'
const BUCKET = 'vision-assets'

// Known video paths from bucket listing (root level, no subfolder)
const VIDEO_PATHS = [
  '1e292150-9658-455a-89ee-b8815dad64f5_raw_video.mp4',
  '3a22900f-6d31-440e-b327-a8300fe83080_raw_video.mp4',
  '728cbee9-c5de-40df-bfa7-7003fcc5f6ae_raw_video.mp4',
  '7e30ecb9-e158-4005-80a2-c86f0747ea10_raw_video.mp4',
  'eb37d3fd-bb3b-4c8e-b948-8ee841c41f7a_raw_video.mp4',
  'fd5bca20-25dd-4b5b-bb0c-45ef41a5c15c_raw_video.mp4',
]

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const shotstackKey = Deno.env.get('SHOTSTACK_API_KEY')
    if (!shotstackKey) return json({ error: 'SHOTSTACK_API_KEY not set' }, 500)

    // Service role client — bypasses RLS / storage policies
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    // ── Step 1: Generate signed URLs (1 hour) for each video ─────────────────
    console.log('Generating signed URLs for', VIDEO_PATHS.length, 'videos...')

    const signedUrls: string[] = []
    for (const path of VIDEO_PATHS) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 3600)  // 1 hour expiry

      if (error || !data?.signedUrl) {
        return json({ error: `Failed to sign ${path}: ${error?.message}` }, 500)
      }
      signedUrls.push(data.signedUrl)
      console.log(`Signed: ${path.slice(0, 20)}... → ${data.signedUrl.slice(0, 60)}...`)
    }

    console.log('All signed URLs ready. Submitting to Shotstack...')

    // ── Step 2: Build Shotstack edit — 6 clips sequential, no audio ──────────
    // Each clip: 10s, start = i * 10  (total 60s)
    // We don't know exact durations so we let Shotstack trim to 10s each.
    const videoClips = signedUrls.map((src, i) => ({
      asset: { type: 'video', src },
      start: i * 10,
      length: 10,
      ...(i === 0 ? { transition: { in: 'fade' } } : {}),
      ...(i === signedUrls.length - 1 ? { transition: { out: 'fade' } } : {}),
    }))

    const edit = {
      timeline: {
        soundtrack: {
          src: 'https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/unwritten-return.mp3',
          effect: 'fadeOut',
        },
        background: '#000000',
        tracks: [{ clips: videoClips }],
      },
      output: {
        format: 'mp4',
        resolution: 'hd',
        aspectRatio: '9:16',
      },
    }

    // ── Step 3: Submit render ─────────────────────────────────────────────────
    const renderRes = await fetch(SHOTSTACK_RENDER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': shotstackKey },
      body: JSON.stringify(edit),
    })

    if (!renderRes.ok) {
      const errText = await renderRes.text()
      return json({ error: `Shotstack submit failed (${renderRes.status}): ${errText}` }, 500)
    }

    const renderData = await renderRes.json()
    const renderId: string = renderData?.response?.id
    if (!renderId) return json({ error: `Shotstack no render id: ${JSON.stringify(renderData)}` }, 500)

    console.log(`Shotstack render queued: ${renderId}`)

    // ── Step 4: Poll until done (max 5 min) ───────────────────────────────────
    for (let attempt = 0; attempt < 60; attempt++) {
      await sleep(5000)

      const statusRes = await fetch(`${SHOTSTACK_RENDER}/${renderId}`, {
        headers: { 'x-api-key': shotstackKey },
      })

      if (!statusRes.ok) {
        console.warn(`Shotstack poll #${attempt + 1}: HTTP ${statusRes.status}`)
        continue
      }

      const d = await statusRes.json()
      const status: string = d?.response?.status ?? ''
      console.log(`Shotstack poll #${attempt + 1}: ${status}`)

      if (status === 'done') {
        const url: string = d?.response?.url
        if (!url) return json({ error: 'Shotstack done but no URL in response' }, 500)
        console.log('Render complete:', url)
        return json({
          success: true,
          render_id: renderId,
          video_url: url,
          signed_urls: signedUrls,
        })
      }

      if (status === 'failed') {
        return json({
          error: `Shotstack render failed: ${JSON.stringify(d?.response?.error)}`,
          render_id: renderId,
        }, 500)
      }
      // queued / rendering / saving — keep polling
    }

    return json({ error: 'Shotstack timed out after 5 minutes', render_id: renderId }, 500)

  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: String(err) }, 500)
  }
})

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
