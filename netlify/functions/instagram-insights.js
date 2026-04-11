exports.handler = async (event) => {
  const token = process.env.META_SOCIAL_TOKEN
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'META_SOCIAL_TOKEN not set' }) }
  }

  const pageId = process.env.META_PAGE_ID
  if (!pageId) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'META_PAGE_ID not set' }) }
  }

  const days  = parseInt(event.queryStringParameters?.days ?? '30', 10)
  const until = Math.floor(Date.now() / 1000)
  const since = until - days * 86400

  try {
    // 1. Get Instagram Business Account ID from the Page
    const pageRes  = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${token}`)
    const pageJson = await pageRes.json()
    if (pageJson.error) throw new Error(pageJson.error.message)

    const igId = pageJson.instagram_business_account?.id
    if (!igId) throw new Error('No Instagram Business Account linked to this Facebook Page')

    // 2. Profile — follower count
    const profileRes = await fetch(`https://graph.facebook.com/v19.0/${igId}?fields=followers_count&access_token=${token}`)
    const profile    = await profileRes.json()
    if (profile.error) throw new Error(profile.error.message)

    // 3a. Daily reach for the chart (period=day supported for reach)
    const reachRes  = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/insights` +
      `?metric=reach` +
      `&period=day&since=${since}&until=${until}` +
      `&access_token=${token}`
    )
    const reachJson = await reachRes.json()
    if (reachJson.error) throw new Error(reachJson.error.message)

    const dailyMap = {}
    const reachMetric = (reachJson.data ?? []).find(m => m.name === 'reach')
    for (const point of reachMetric?.values ?? []) {
      const date = point.end_time.slice(0, 10)
      dailyMap[date] = { date, reach: point.value }
    }
    const daily    = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
    const totalReach = daily.reduce((s, d) => s + (d.reach ?? 0), 0)

    // 3b. Aggregate KPI totals — period=total_over_range gives one value for the whole window
    const totalsRes  = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/insights` +
      `?metric=profile_views,accounts_engaged,total_interactions` +
      `&period=total_over_range` +
      `&since=${since}&until=${until}` +
      `&access_token=${token}`
    )
    const totalsJson = await totalsRes.json()
    if (totalsJson.error) throw new Error(totalsJson.error.message)

    const totalsMap = {}
    for (const item of totalsJson.data ?? []) {
      totalsMap[item.name] = item.values?.[0]?.value ?? 0
    }

    // 4. Recent 9 posts
    const mediaRes  = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/media` +
      `?fields=id,caption,media_type,thumbnail_url,media_url,timestamp,like_count,comments_count` +
      `&limit=9&access_token=${token}`
    )
    const mediaJson = await mediaRes.json()
    if (mediaJson.error) throw new Error(mediaJson.error.message)

    const posts = (mediaJson.data ?? []).map(p => ({
      id:       p.id,
      caption:  p.caption ? p.caption.slice(0, 80) : '',
      type:     p.media_type,
      url:      p.media_type === 'VIDEO' ? (p.thumbnail_url ?? null) : (p.media_url ?? null),
      timestamp: p.timestamp,
      likes:    p.like_count     ?? 0,
      comments: p.comments_count ?? 0,
    }))

    return {
      statusCode: 200,
      headers:    { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok:           true,
        followers:    profile.followers_count          ?? 0,
        reach:        totalReach,
        profileViews: totalsMap.profile_views          ?? 0,
        engaged:      totalsMap.accounts_engaged       ?? 0,
        interactions: totalsMap.total_interactions     ?? 0,
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
