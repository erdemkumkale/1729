// Supabase Edge Function: notify-expiring
// Runs daily via cron — sends email to users whose subscription ends in 5 days
// Deploy: paste this into Supabase Dashboard → Edge Functions → New function → "notify-expiring"
// Schedule: Supabase Dashboard → Database → Cron → Add: "0 9 * * *" → POST to function URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async () => {
  try {
    // Find invitations expiring in the next 5 days (but not already expired)
    const fiveDaysFromNow = new Date()
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5)

    const { data: expiring, error } = await supabase
      .from('invitations')
      .select('id, email, subscription_ends_at, duration_months')
      .eq('status', 'used')
      .eq('funded_by_inviter', true)
      .gt('subscription_ends_at', new Date().toISOString())
      .lte('subscription_ends_at', fiveDaysFromNow.toISOString())

    if (error) throw error
    if (!expiring || expiring.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    let sent = 0
    for (const inv of expiring) {
      const endsAt = new Date(inv.subscription_ends_at)
      const daysLeft = Math.ceil((endsAt.getTime() - Date.now()) / 86400000)
      const dateStr = endsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: '1729 <hello@1729.eco>',
          to: [inv.email],
          subject: `Your 1729 access ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0C0C0B;font-family:'DM Sans',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:48px auto;padding:0 16px;">
    <tr>
      <td>
        <div style="background:#141413;border:1px solid #2a2a28;border-radius:20px;padding:40px 36px;">
          <!-- Logo -->
          <div style="margin-bottom:32px;">
            <div style="width:36px;height:36px;border-radius:50%;background:#ffffff;display:inline-block;"></div>
          </div>

          <!-- Heading -->
          <h1 style="color:#F0EDE8;font-size:22px;font-weight:500;margin:0 0 16px;line-height:1.4;">
            Your access ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.
          </h1>

          <!-- Body -->
          <p style="color:#7a7a72;font-size:15px;line-height:1.7;margin:0 0 12px;">
            The person who brought you into 1729 is not renewing your subscription.
          </p>
          <p style="color:#7a7a72;font-size:15px;line-height:1.7;margin:0 0 28px;">
            If you'd like to stay, you can start your own subscription before <strong style="color:#F0EDE8;">${dateStr}</strong>.
            Otherwise, your access will end on that date.
          </p>

          <!-- CTA -->
          <a href="https://1729.eco" style="display:inline-block;background:#F0EDE8;color:#0C0C0B;font-size:14px;font-weight:500;padding:12px 24px;border-radius:10px;text-decoration:none;">
            Manage my subscription →
          </a>

          <!-- Footer -->
          <p style="color:#3a3a38;font-size:12px;margin:32px 0 0;font-family:'DM Mono',monospace;">
            1729.eco
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        }),
      })

      if (res.ok) sent++
      else {
        const err = await res.json()
        console.error(`Failed to send to ${inv.email}:`, err)
      }
    }

    return new Response(JSON.stringify({ sent, total: expiring.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-expiring error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
