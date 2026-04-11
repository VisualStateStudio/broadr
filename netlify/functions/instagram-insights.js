exports.handler = async (event) => {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'META_ACCESS_TOKEN not set' }) }
  }

  const days  = parseInt(event.queryStringParameters?.days ?? '30', 10)
  const until = Math.floor(Date.now() / 1000)
  const since = until - days * 86400

  try {
    // 1. Discover Facebook Page + linked Instagram Business Account
    const accountsRes  = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${token}`)
    const accountsJson = await accountsRes.json()
    if (accountsJson.error) throw new Error(accountsJson.error.message)

    const page = accountsJson.data?.[0]
    if (!page) throw new Error('No Facebook Page found on this access token')

    const igId = page.instagram_business_account?.id
    if (!igId) throw new Error('No Instagram Business Account linked to this Facebook Page')

    // 2. Profile (followers)
    const profileRes  = await fetch(`https://graph.facebook.com/v19.0/${igId}?fields=followers_count,username&access_token=${token}`)
    const profile     = await profileRes.json()
    if (profile.error) throw new Error(profile.error.message)

    // 3. Daily insights — impressions, reach, profile_views
    const insightsRes  = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/insights` +
      `?metric=impressions,reach,profile_views` +
      `&period=day&since=${since}&until=${until}` +
      `&access_token=${token}`
    )
    const insightsJson = await insightsRes.json()
    if (insightsJson.error) throw new Error(insightsJson.error.message)

    // Build daily map keyed by date string
    const dailyMap = {}
    for (const metric of insightsJson.data ?? []) {
      for (const point of metric.values) {
        const date = point.end_time.slice(0, 10)
        if (!dailyMap[date]) dailyMap[date] = { date, impressions: 0, reach: 0, profile_views: 0 }
        dailyMap[date][metric.name] = point.value
      }
    }
    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

    const totalImpressions  = daily.reduce((s, d) => s + (d.impressions    ?? 0), 0)
    const totalReach        = daily.reduce((s, d) => s + (d.reach          ?? 0), 0)
    const totalProfileViews = daily.reduce((s, d) => s + (d.profile_views  ?? 0), 0)

    // 4. Recent 9 posts (likes + comments available directly on media)
    const mediaRes  = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/media` +
      `?fields=id,caption,media_type,thumbnail_url,media_url,timestamp,like_count,comments_count` +
      `&limit=9&access_token=${token}`
    )
    const mediaJson = await mediaRes.json()
    if (mediaJson.error) throw new Error(mediaJson.error.message)

    const posts = (mediaJson.data ?? []).map(p => ({
      id:        p.id,
      caption:   p.caption ? p.caption.slice(0, 80) : '',
      type:      p.media_type,
      url:       p.media_type === 'VIDEO' ? (p.thumbnail_url ?? null) : (p.media_url ?? null),
      timestamp: p.timestamp,
      likes:     p.like_count    ?? 0,
      comments:  p.comments_count ?? 0,
    }))

    // Engagement rate = (likes + comments across recent posts) / totalReach * 100
    const totalEngagement = posts.reduce((s, p) => s + p.likes + p.comments, 0)
    const engagementRate  = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0

    return {
      statusCode: 200,
      headers:    { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok:             true,
        followers:      profile.followers_count ?? 0,
        impressions:    totalImpressions,
        reach:          totalReach,
        profileViews:   totalProfileViews,
        engagementRate: +engagementRate.toFixed(2),
        daily,
        posts,
      }),
    }
  } catch (e) {
    return {
      statusCode: 200,
      headers:    { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: e.message }),
    }
  }
}
