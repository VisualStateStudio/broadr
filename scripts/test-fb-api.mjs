/**
 * Test all Facebook Page Insights API metric variants in parallel and report all results.
 * Usage: node scripts/test-fb-api.mjs
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

function insightsUrl(metric, extra = '') {
  return `${BASE}/${pageId}/insights?metric=${metric}&period=day&since=${since}&until=${until}${extra}&access_token=${token}`
}

console.log('\n=== Facebook Page API Test ===')
console.log(`Page ID: ${pageId}`)
console.log(`Period: last ${days} days\n`)

const results = await Promise.all([
  // Page profile fields
  get('Page profile fields (id,name,fan_count)',
    `${BASE}/${pageId}?fields=id,name,fan_count&access_token=${token}`),

  // Individual metrics — period=day
  get('Metric: page_impressions (period=day)',
    insightsUrl('page_impressions')),

  get('Metric: page_reach (period=day)',
    insightsUrl('page_reach')),

  get('Metric: page_engaged_users (period=day)',
    insightsUrl('page_engaged_users')),

  get('Metric: page_fan_adds_unique (period=day)',
    insightsUrl('page_fan_adds_unique')),

  get('Metric: page_follows (period=day)',
    insightsUrl('page_follows')),

  get('Metric: page_post_engagements (period=day)',
    insightsUrl('page_post_engagements')),

  get('Metric: page_views_total (period=day)',
    insightsUrl('page_views_total')),

  // Combined calls
  get('Combined (CURRENT BROKEN): page_impressions,page_reach,page_engaged_users,page_fan_adds_unique',
    insightsUrl('page_impressions,page_reach,page_engaged_users,page_fan_adds_unique')),

  get('Combined: page_impressions,page_reach',
    insightsUrl('page_impressions,page_reach')),

  get('Combined: page_impressions,page_reach,page_engaged_users',
    insightsUrl('page_impressions,page_reach,page_engaged_users')),

  get('Combined: page_impressions,page_reach,page_post_engagements',
    insightsUrl('page_impressions,page_reach,page_post_engagements')),

  get('Combined: page_impressions,page_reach,page_engaged_users,page_post_engagements,page_views_total,page_follows',
    insightsUrl('page_impressions,page_reach,page_engaged_users,page_post_engagements,page_views_total,page_follows')),

  // Recent posts
  get('Posts (recent 5)',
    `${BASE}/${pageId}/posts?fields=message,created_time,full_picture,likes.summary(true),comments.summary(true)&limit=5&access_token=${token}`),
])

let allOk = true
for (const r of results) {
  if (r.ok) {
    const preview = JSON.stringify(r.data).slice(0, 200)
    console.log(`PASS  ${r.label}\n      ${preview}\n`)
  } else {
    allOk = false
    console.log(`FAIL  ${r.label}\n      Error [${r.code ?? '?'}]: ${r.error}\n`)
  }
}

if (allOk) {
  console.log('All calls succeeded!')
} else {
  console.log('Some calls failed — see above.')
}
