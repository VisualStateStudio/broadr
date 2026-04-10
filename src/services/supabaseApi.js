import { supabase } from './supabase.js'

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

export async function fetchClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function insertClient(client) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteClient(id) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchAgencyClient() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_agency', true)
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────

export async function fetchCampaigns(clientId) {
  let query = supabase
    .from('campaigns')
    .select('*, clients(id, name)')
    .order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function insertCampaign(campaign) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateCampaign(id, updates) {
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteCampaign(id) {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── CAMPAIGN PERFORMANCE ─────────────────────────────────────────────────────

export async function fetchPerformance(campaignId) {
  const { data, error } = await supabase
    .from('campaign_performance')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchPerformanceByClient(clientId) {
  const { data, error } = await supabase
    .from('campaign_performance')
    .select('*, campaigns!inner(client_id, name, platform)')
    .eq('campaigns.client_id', clientId)
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function upsertPerformance(record) {
  const { data, error } = await supabase
    .from('campaign_performance')
    .upsert(record, { onConflict: 'campaign_id,date' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ─── CREATIVE ASSETS ──────────────────────────────────────────────────────────

export async function fetchCreativeAssets(clientId) {
  let query = supabase
    .from('creative_assets')
    .select('*, campaigns(name)')
    .order('created_at', { ascending: false })
  if (clientId) query = query.eq('client_id', clientId)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function insertCreativeAsset(asset) {
  const { data, error } = await supabase
    .from('creative_assets')
    .insert(asset)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateCreativeAsset(id, updates) {
  const { data, error } = await supabase
    .from('creative_assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteCreativeAsset(id, fileUrl) {
  if (fileUrl) {
    const path = fileUrl.split('/storage/v1/object/public/creatives/')[1]
    if (path) await supabase.storage.from('creatives').remove([decodeURIComponent(path)])
  }
  const { error } = await supabase.from('creative_assets').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadCreativeFile(file, clientId) {
  const ext  = file.name.split('.').pop().toLowerCase()
  const path = `${clientId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('creatives')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = supabase.storage.from('creatives').getPublicUrl(path)
  return publicUrl
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export async function fetchAnalytics(clientId, startDate, endDate) {
  const { data, error } = await supabase
    .from('campaign_performance')
    .select('date, spend, impressions, clicks, conversions, revenue, campaigns!inner(client_id, name, platform)')
    .eq('campaigns.client_id', clientId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

// ─── DASHBOARD KPIs ───────────────────────────────────────────────────────────

export async function fetchDashboardKPIs(clientId) {
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const today      = now.toISOString().slice(0, 10)

  const [campaignsRes, perfRes] = await Promise.all([
    supabase.from('campaigns').select('id, status, platform').eq('client_id', clientId),
    supabase
      .from('campaign_performance')
      .select('spend, conversions, revenue, campaigns!inner(client_id)')
      .eq('campaigns.client_id', clientId)
      .gte('date', monthStart)
      .lte('date', today),
  ])

  if (campaignsRes.error) throw new Error(campaignsRes.error.message)
  if (perfRes.error)      throw new Error(perfRes.error.message)

  const campaigns   = campaignsRes.data ?? []
  const perf        = perfRes.data ?? []
  const totalSpend  = perf.reduce((s, r) => s + Number(r.spend), 0)
  const totalConv   = perf.reduce((s, r) => s + Number(r.conversions), 0)
  const totalRev    = perf.reduce((s, r) => s + Number(r.revenue), 0)
  const roas        = totalSpend > 0 ? totalRev / totalSpend : 0
  const active      = campaigns.filter(c => c.status === 'active').length

  return { totalSpend, totalConversions: totalConv, roas, activeCampaigns: active, totalCampaigns: campaigns.length }
}
