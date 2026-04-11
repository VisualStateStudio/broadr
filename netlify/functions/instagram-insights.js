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

    // 3a. Daily reach + profile_views (classic metrics, period=day no metric_type)
    const dailyRes  = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/insights` +
      `?metric=reach,profile_views` +
      `&period=day&since=${since}&until=${until}` +
      `&access_token=${token}`
    )
    const dailyJson = await dailyRes.json()
    if (dailyJson.error) throw new Error(dailyJson.error.message)

    const dailyMap = {}
    for (const metric of dailyJson.data ?? []) {
      for (const point of metric.values ?? []) {
        const date = point.end_time.slice(0, 10)
        if (!dailyMap[date]) dailyMap[date] = { date, reach: 0, profile_views: 0 }
        dailyMap[date][metric.name] = (dailyMap[date][metric.name] ?? 0) + (point.value ?? 0)
      }
    }
    const daily        = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
    const totalReach   = daily.reduce((s, d) => s + (d.reach         ?? 0), 0)
    const totalPViews  = daily.reduce((s, d) => s + (d.profile_views ?? 0), 0)

    // 3b. Engagement metrics — fetched separately with metric_type=total_value + period=day
    //     (accounts_engaged & total_interactions require metric_type=total_value)
    let totalEngaged = 0
    let totalInteractions = 0
    const engRes  = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/insights` +
      `?metric=accounts_engaged,total_interactions` +
      `&metric_type=total_value` +
      `&period=day&since=${since}&until=${until}` +
      `&access_token=${token}`
    )
    const engJson = await engRes.json()
    if (!engJson.error) {
      for (const item of engJson.data ?? []) {
        // metric_type=total_value may return total_value.value or values[] depending on API version
        const val = item.total_value?.value
          ?? (item.values ?? []).reduce((s, v) => s + (v.value ?? 0), 0)
        if (item.name === 'accounts_engaged')  totalEngaged      = val
        if (item.name === 'total_interactions') totalInteractions = val
      }
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
      id:        p.id,
      caption:   p.caption ? p.caption.slice(0, 80) : '',
      type:      p.media_type,
      url:       p.media_type === 'VIDEO' ? (p.thumbnail_url ?? null) : (p.media_url ?? null),
      timestamp: p.timestamp,
      likes:     p.like_count     ?? 0,
      comments:  p.comments_count ?? 0,
    }))

    return {
      statusCode: 200,
      headers:    { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok:           true,
        followers:    profile.followers_count ?? 0,
        reach:        totalReach,
        profileViews: totalPViews,
        engaged:      totalEngaged,
        interactions: totalInteractions,
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
