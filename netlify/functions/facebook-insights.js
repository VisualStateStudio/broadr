exports.handler = async (event) => {
  const token = process.env.META_SOCIAL_TOKEN
  if (!token) {
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
    // 1. Get Facebook Page details (fan_count = total page likes)
    const pageRes  = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=id,name,fan_count&access_token=${token}`)
    const page     = await pageRes.json()
    if (page.error) throw new Error(page.error.message)

    // 2. Daily Page insights
    const metrics      = 'page_impressions,page_reach,page_engaged_users,page_fan_adds_unique'
    const insightsRes  = await fetch(
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
        if (!dailyMap[date]) dailyMap[date] = { date, page_impressions: 0, page_reach: 0, page_engaged_users: 0, page_fan_adds_unique: 0 }
        dailyMap[date][metric.name] = point.value
      }
    }
    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

    const totalImpressions = daily.reduce((s, d) => s + (d.page_impressions       ?? 0), 0)
    const totalReach       = daily.reduce((s, d) => s + (d.page_reach              ?? 0), 0)
    const totalEngaged     = daily.reduce((s, d) => s + (d.page_engaged_users      ?? 0), 0)
    const newFans          = daily.reduce((s, d) => s + (d.page_fan_adds_unique    ?? 0), 0)

    // 3. Recent 5 posts
    const postsRes  = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/posts` +
      `?fields=message,created_time,full_picture,likes.summary(true),comments.summary(true)` +
      `&limit=5&access_token=${token}`
    )
    const postsJson = await postsRes.json()
    if (postsJson.error) throw new Error(postsJson.error.message)

    const posts = (postsJson.data ?? []).map(p => ({
      id:        p.id,
      message:   p.message ? p.message.slice(0, 120) : '',
      image:     p.full_picture ?? null,
      timestamp: p.created_time,
      likes:     p.likes?.summary?.total_count    ?? 0,
      comments:  p.comments?.summary?.total_count ?? 0,
    }))

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
