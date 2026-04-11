exports.handler = async (event) => {
  const userToken = process.env.META_SOCIAL_TOKEN
  if (!userToken) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'META_SOCIAL_TOKEN not set' }) }
  }

  const days  = parseInt(event.queryStringParameters?.days ?? '30', 10)
  const until = Math.floor(Date.now() / 1000)
  const since = until - days * 86400

  const pageId = process.env.META_PAGE_ID
  if (!pageId) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'META_PAGE_ID not set — add your Facebook Page ID to Netlify environment variables' }) }
  }

  try {
    // 0. Exchange user token for a Page Access Token.
    //    The /insights endpoint requires a Page token, not a User token.
    //    me/accounts returns all pages the user manages, each with its own token.
    const accountsRes  = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`)
    const accountsJson = await accountsRes.json()
    if (accountsJson.error) throw new Error('Could not retrieve page token: ' + accountsJson.error.message)

    const pageAccount = (accountsJson.data ?? []).find(p => p.id === pageId)
    if (!pageAccount) throw new Error(`Page ${pageId} not found in this user's managed pages. Check META_PAGE_ID.`)
    const token = pageAccount.access_token

    // 1. Get Facebook Page details (fan_count = total page likes)
    const pageRes  = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=id,name,fan_count&access_token=${token}`)
    const page     = await pageRes.json()
    if (page.error) throw new Error(page.error.message)

    // 2. Daily Page insights — using v19-compatible metrics.
    //
    //    DEPRECATED (error 100 as of 2025): page_impressions, page_reach,
    //      page_engaged_users, page_fan_adds_unique
    //
    //    REPLACEMENTS confirmed working with a Page Access Token:
    //      page_impressions_unique  → unique accounts that saw any page content (closest to reach)
    //      page_post_engagements    → total engagements on page posts (replaces page_engaged_users)
    //      page_daily_follows_unique → unique new followers per day (replaces page_fan_adds_unique)
    //      page_views_total         → total page views (supplementary)
    //
    //    NOTE: page_impressions (total, non-unique) has no direct valid replacement in v19.
    //    We map impressions → page_impressions_unique as the closest available signal.
    //    Both reach and impressions will reflect the same metric; a comment is left below.
    const metrics     = 'page_impressions_unique,page_post_engagements,page_daily_follows_unique,page_views_total'
    const insightsRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/insights` +
      `?metric=${metrics}` +
      `&period=day&since=${since}&until=${until}` +
      `&access_token=${token}`
    )
    const insightsJson = await insightsRes.json()
    if (insightsJson.error) throw new Error(insightsJson.error.message)

    const dailyMap = {}
    for (const metric of insightsJson.data ?? []) {
      for (const point of metric.values) {
        const date = point.end_time.slice(0, 10)
        if (!dailyMap[date]) {
          dailyMap[date] = {
            date,
            // Legacy field names preserved for frontend compatibility
            page_impressions:    0,  // deprecated — populated from page_impressions_unique below
            page_reach:          0,  // deprecated — populated from page_impressions_unique below
            page_engaged_users:  0,  // deprecated — populated from page_post_engagements below
            page_fan_adds_unique:0,  // deprecated — populated from page_daily_follows_unique below
          }
        }
        // Map new metric names onto legacy field names the frontend expects
        if (metric.name === 'page_impressions_unique') {
          // page_impressions_unique = unique people reached; used for both impressions and reach
          // since page_impressions (total views) is no longer available in v19.
          dailyMap[date].page_impressions = point.value
          dailyMap[date].page_reach       = point.value
        } else if (metric.name === 'page_post_engagements') {
          dailyMap[date].page_engaged_users = point.value
        } else if (metric.name === 'page_daily_follows_unique') {
          dailyMap[date].page_fan_adds_unique = point.value
        }
        // page_views_total is stored on the raw dailyMap for potential future use
        // but is not surfaced in the legacy response shape
        dailyMap[date][metric.name] = point.value
      }
    }
    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

    const totalImpressions = daily.reduce((s, d) => s + (d.page_impressions       ?? 0), 0)
    const totalReach       = daily.reduce((s, d) => s + (d.page_reach              ?? 0), 0)
    const totalEngaged     = daily.reduce((s, d) => s + (d.page_engaged_users      ?? 0), 0)
    const newFans          = daily.reduce((s, d) => s + (d.page_fan_adds_unique    ?? 0), 0)

    // 3. Recent 5 posts
    //    NOTE: Requires the 'pages_read_engagement' permission on the Facebook App.
    //    If the app has not been granted this via App Review, the call returns error #10.
    //    We degrade gracefully to an empty array rather than failing the whole response.
    let posts = []
    try {
      const postsRes  = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/posts` +
        `?fields=message,created_time,full_picture,likes.summary(true),comments.summary(true)` +
        `&limit=5&access_token=${token}`
      )
      const postsJson = await postsRes.json()
      if (!postsJson.error) {
        posts = (postsJson.data ?? []).map(p => ({
          id:        p.id,
          message:   p.message ? p.message.slice(0, 120) : '',
          image:     p.full_picture ?? null,
          timestamp: p.created_time,
          likes:     p.likes?.summary?.total_count    ?? 0,
          comments:  p.comments?.summary?.total_count ?? 0,
        }))
      }
      // If postsJson.error, posts stays [] — app needs pages_read_engagement App Review approval
    } catch (_) {
      // Network error fetching posts — non-fatal
    }

    return {
      statusCode: 200,
      headers:    { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok:          true,
        pageName:    page.name,
        pageLikes:   page.fan_count ?? 0,
        impressions: totalImpressions,
        reach:       totalReach,
        engaged:     totalEngaged,
        newFans,
        daily,
        posts,
      }),
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers:    { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: e.message }),
    }
  }
}
