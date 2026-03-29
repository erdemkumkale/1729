// supabase/functions/webhook-lemonsqueezy/index.ts
// Listens for Lemon Squeezy 'order_created' events.
// Verifies the HMAC signature, inserts a Payment record,
// and advances the VisionProject to 'Processing'.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'
import { encode as hexEncode } from 'https://deno.land/std@0.177.0/encoding/hex.ts'

const CORS = { 'Access-Control-Allow-Origin': '*' }

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const rawBody = await req.text()

  // ── Verify HMAC-SHA256 signature ──────────────────────────────────────────
  const secret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET')
  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not set')
    return new Response('Server misconfigured', { status: 500 })
  }

  const signature = req.headers.get('x-signature')
  if (!signature) return new Response('Missing signature', { status: 401 })

  const isValid = await verifySignature(secret, rawBody, signature)
  if (!isValid) {
    console.warn('Invalid webhook signature')
    return new Response('Invalid signature', { status: 401 })
  }

  // ── Parse payload ─────────────────────────────────────────────────────────
  let payload: LemonSqueezyPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const eventName = payload.meta?.event_name
  console.log('Received event:', eventName)

  // Only handle order_created
  if (eventName !== 'order_created') {
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Extract data ──────────────────────────────────────────────────────────
  const order          = payload.data?.attributes
  const customData     = payload.meta?.custom_data ?? {}
  const visionProjectId = customData.vision_project_id as string | undefined
  const lsTransactionId = String(payload.data?.id ?? '')
  const amount          = Number(order?.total ?? 0) / 100  // LS returns cents
  const orderStatus     = order?.status                    // 'paid' | 'refunded' etc.

  if (!visionProjectId) {
    console.error('No vision_project_id in custom_data', customData)
    return new Response('Missing vision_project_id in metadata', { status: 422 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── Idempotency: skip if already processed ────────────────────────────────
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('lemon_squeezy_transaction_id', lsTransactionId)
    .maybeSingle()

  if (existing) {
    console.log('Duplicate webhook, skipping:', lsTransactionId)
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Fetch project to get user_id ──────────────────────────────────────────
  const { data: project, error: projectError } = await supabase
    .from('vision_projects')
    .select('id, user_id, status')
    .eq('id', visionProjectId)
    .single()

  if (projectError || !project) {
    console.error('Project not found:', visionProjectId, projectError)
    return new Response('Project not found', { status: 404 })
  }

  const paymentStatus = orderStatus === 'paid' ? 'Success' : 'Failed'

  // ── Insert Payment record ─────────────────────────────────────────────────
  const { error: paymentError } = await supabase
    .from('payments')
    .insert([{
      user_id:                      project.user_id,
      vision_project_id:            visionProjectId,
      amount,
      status:                       paymentStatus,
      lemon_squeezy_transaction_id: lsTransactionId,
    }])

  if (paymentError) {
    console.error('Failed to insert payment:', paymentError)
    return new Response('Failed to record payment', { status: 500 })
  }

  // ── Advance project to Processing (only on success) ───────────────────────
  if (paymentStatus === 'Success') {
    const { error: updateError } = await supabase
      .from('vision_projects')
      .update({ status: 'Processing' })
      .eq('id', visionProjectId)

    if (updateError) {
      console.error('Failed to update project status:', updateError)
      // Payment is recorded — don't fail the webhook, log and continue
    }
  }

  console.log(`✅ Payment ${paymentStatus} for project ${visionProjectId}`)
  return new Response(JSON.stringify({ received: true, status: paymentStatus }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

// ─── HMAC-SHA256 verification ─────────────────────────────────────────────────

async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
  try {
    const encoder   = new TextEncoder()
    const keyData   = encoder.encode(secret)
    const bodyData  = encoder.encode(body)

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData)
    const computed = new TextDecoder().decode(hexEncode(new Uint8Array(signatureBuffer)))
    return computed === signature
  } catch (err) {
    console.error('Signature verification error:', err)
    return false
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LemonSqueezyPayload {
  meta?: {
    event_name?: string
    custom_data?: Record<string, unknown>
  }
  data?: {
    id?: string | number
    attributes?: {
      status?: string
      total?: number
      [key: string]: unknown
    }
  }
}
