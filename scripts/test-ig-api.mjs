/**
 * Test all Instagram Insights API calls in parallel and report all errors at once.
 * Usage: node scripts/test-ig-api.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env manually
const __dir = dirname(fileURLToPath(import.meta.url))
const env   = readFileSync(resolve(__dir, '../.env'), 'utf8')
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=')
  if (k && v.length) process.env[k.trim()] = v.join('=').trim()
}

const token  = process.env.META_SOCIAL_TOKEN
const pageId = process.env.META_PAGE_ID
const BASE   = 'https://graph.facebook.com/v19.0'

if (!token || !pageId) {
  console.error('Missing META_SOCIAL_TOKEN or META_PAGE_ID in .env')
  process.exit(1)
}

const days  = 30
const until = Math.floor(Date.now() / 1000)
const since = until - days * 86400

async function get(label, url) {
  try {
    const res  = await fetch(url)
    const json = await res.json()
    if (json.error) {
      return { label, ok: false, error: json.error.message, code: json.error.code }
    }
    return { label, ok: true, data: json }
  } catch (e) {
    return { label, ok: false, error: e.message }
  }
}

console.log('\n=== Instagram API Test ===\n')

// Step 1: get IG ID from page
const pageResult = await get(
  'Page → IG Account',
  `${BASE}/${pageId}?fields=instagram_business_account&access_token=${token}`
)

if (!pageResult.ok) {
  console.error('❌ FATAL:', pageResult.label, '-', pageResult.error)
  process.exit(1)
}
const igId = pageResult.data.instagram_business_account?.id
if (!igId) {
  console.error('❌ FATAL: No Instagram Business Account linked to this Facebook Page')
  process.exit(1)
}
console.log('✅ IG Account ID:', igId, '\n')

// Run all remaining calls in parallel
const results = await Promise.all([
  get('Profile (followers_count)',
    `${BASE}/${igId}?fields=followers_count&access_token=${token}`),

  get('Insights: reach (period=day)',
    `${BASE}/${igId}/insights?metric=reach&period=day&since=${since}&until=${until}&access_token=${token}`),

  get('Insights: profile_views (period=day)',
    `${BASE}/${igId}/insights?metric=profile_views&period=day&since=${since}&until=${until}&access_token=${token}`),

  get('Insights: reach+profile_views combined (period=day)',
    `${BASE}/${igId}/insights?metric=reach,profile_views&period=day&since=${since}&until=${until}&access_token=${token}`),

  get('Insights: accounts_engaged (metric_type=total_value, period=day)',
    `${BASE}/${igId}/insights?metric=accounts_engaged&metric_type=total_value&period=day&since=${since}&until=${until}&access_token=${token}`),

  get('Insights: total_interactions (metric_type=total_value, period=day)',
    `${BASE}/${igId}/insights?metric=total_interactions&metric_type=total_value&period=day&since=${since}&until=${until}&access_token=${token}`),

  get('Insights: accounts_engaged+total_interactions combined (metric_type=total_value, period=day)',
    `${BASE}/${igId}/insights?metric=accounts_engaged,total_interactions&metric_type=total_value&period=day&since=${since}&until=${until}&access_token=${token}`),

  get('Insights: accounts_engaged (period=day, NO metric_type)',
    `${BASE}/${igId}/insights?metric=accounts_engaged&period=day&since=${since}&until=${until}&access_token=${token}`),

  get('Insights: total_interactions (period=day, NO metric_type)',
    `${BASE}/${igId}/insights?metric=total_interactions&period=day&since=${since}&until=${until}&access_token=${token}`),

  get('Insights: accounts_engaged+total_interactions (period=total_over_range)',
    `${BASE}/${igId}/insights?metric=accounts_engaged,total_interactions&period=total_over_range&since=${since}&until=${until}&access_token=${token}`),

  get('Media (recent 9 posts)',
    `${BASE}/${igId}/media?fields=id,caption,media_type,thumbnail_url,media_url,timestamp,like_count,comments_count&limit=9&access_token=${token}`),
])

let allOk = true
for (const r of results) {
  if (r.ok) {
    const preview = JSON.stringify(r.data).slice(0, 120)
    console.log(`✅ ${r.label}\n   ${preview}\n`)
  } else {
    allOk = false
    console.log(`❌ ${r.label}\n   Error: ${r.error}\n`)
  }
}

if (allOk) {
  console.log('All calls succeeded!')
} else {
  console.log('Some calls failed — see above.')
}
