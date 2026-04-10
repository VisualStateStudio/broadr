/**
 * Netlify Function: meta-sync
 * Pulls campaign insights from Meta Marketing API and upserts into Supabase.
 *
 * POST /api/meta-sync
 * Body: { days: 30 }  (optional, defaults to 30)
 */

const { createClient } = require('@supabase/supabase-js')

const META_API_VERSION = 'v21.0'
const META_BASE        = `https://graph.facebook.com/${META_API_VERSION}`

// ── helpers ───────────────────────────────────────────────────────────────────

function getEnv(key) {
  const val = process.env[key]
  if (!val) throw new Error(`Missing environment variable: ${key}`)
  return val
}

async function metaGet(path, params = {}) {
  const url    = new URL(`${META_BASE}${path}`)
  const token  = getEnv('META_ACCESS_TOKEN')
  url.searchParams.set('access_token', token)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res  = await fetch(url.toString())
  const json = await res.json()
  if (json.error) throw new Error(`Meta API error: ${json.error.message}`)
  return json
}

// Fetch all pages of a paged Meta response
async function metaGetAll(path, params = {}) {
  let results = []
  let data    = await metaGet(path, params)
  results     = results.concat(data.data ?? [])
  while (data.paging?.next) {
    const res  = await fetch(data.paging.next)
    data       = await res.json()
    if (data.error) break
    results    = results.concat(data.data ?? [])
  }
  return results
}

// Extract a specific action value (e.g. conversions, purchase value) from actions array
function extractAction(actions = [], type) {
  const match = actions.find(a => a.action_type === type)
  return match ? Number(match.value) : 0
}

// ── main handler ──────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const body       = JSON.parse(event.body || '{}')
    const days       = Math.min(Number(body.days) || 30, 90)
    const adAccountId = getEnv('META_AD_ACCOUNT_ID') // e.g. act_123456789

    const supabase = createClient(
      getEnv('VITE_SUPABASE_URL'),
      getEnv('SUPABASE_SERVICE_ROLE_KEY'), // service role to bypass RLS
    )

    // ── 1. Find the agency client in Supabase ─────────────────────────────────
    const { data: agency, error: agencyErr } = await supabase
      .from('clients')
      .select('id')
      .eq('is_agency', true)
      .single()
    if (agencyErr) throw new Error('Could not find agency client: ' + agencyErr.message)

    // ── 2. Fetch all Meta campaigns ───────────────────────────────────────────
    const metaCampaigns = await metaGetAll(`/${adAccountId}/campaigns`, {
      fields: 'id,name,status,objective',
      limit:  100,
    })

    // ── 3. Upsert campaigns into Supabase ─────────────────────────────────────
    //    Match by meta_campaign_id; create if not exists
    const campaignMap = {} // meta_id → supabase id

    for (const mc of metaCampaigns) {
      const platform = 'meta'
      const status   = mc.status === 'ACTIVE' ? 'active'
                     : mc.status === 'PAUSED'  ? 'paused'
                     : 'draft'

      const { data: existing } = await supabase
        .from('campaigns')
        .select('id')
        .eq('meta_campaign_id', mc.id)
        .maybeSingle()

      if (existing) {
        // Update status
        await supabase.from('campaigns').update({ status }).eq('id', existing.id)
        campaignMap[mc.id] = existing.id
      } else {
        // Create new campaign
        const { data: created, error: createErr } = await supabase
          .from('campaigns')
          .insert({
            client_id:         agency.id,
            meta_campaign_id:  mc.id,
            name:              mc.name,
            platform,
            status,
            objective:         mc.objective ?? null,
          })
          .select('id')
          .single()
        if (createErr) throw new Error('Failed to create campaign: ' + createErr.message)
        campaignMap[mc.id] = created.id
      }
    }

    // ── 4. Fetch daily insights per campaign ──────────────────────────────────
    const endDate   = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - (days - 1))
    const since = startDate.toISOString().slice(0, 10)
    const until = endDate.toISOString().slice(0, 10)

    const insights = await metaGetAll(`/${adAccountId}/insights`, {
      level:        'campaign',
      fields:       'campaign_id,date_start,spend,impressions,clicks,actions,action_values',
      time_increment: 1,
      time_range:   JSON.stringify({ since, until }),
      limit:        500,
    })

    // ── 5. Upsert performance records ─────────────────────────────────────────
    let synced = 0
    for (const row of insights) {
      const supabaseCampaignId = campaignMap[row.campaign_id]
      if (!supabaseCampaignId) continue

      const conversions = extractAction(row.actions,       'offsite_conversion.fb_pixel_purchase')
                       || extractAction(row.actions,       'lead')
                       || extractAction(row.actions,       'purchase')
      const revenue     = extractAction(row.action_values, 'offsite_conversion.fb_pixel_purchase')
                       || extractAction(row.action_values, 'purchase')

      const { error: upsertErr } = await supabase
        .from('campaign_performance')
        .upsert({
          campaign_id:  supabaseCampaignId,
          date:         row.date_start,
          spend:        Number(row.spend)       || 0,
          impressions:  Number(row.impressions) || 0,
          clicks:       Number(row.clicks)      || 0,
          conversions,
          revenue,
        }, { onConflict: 'campaign_id,date' })

      if (upsertErr) console.error('Upsert error:', upsertErr.message)
      else synced++
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok:        true,
        campaigns: Object.keys(campaignMap).length,
        records:   synced,
        range:     { since, until },
      }),
    }

  } catch (err) {
    console.error('meta-sync error:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    }
  }
}
