import { createClient } from './supabase'
import type { AppState } from '@/app/page'

export type Project = {
  id: string
  user_id: string
  name: string
  phase_reached: number
  created_at: string
  updated_at: string
  thumbnail_url?: string | null
}

export type ProjectDetail = Project & {
  logo_url?: string | null
  garment_url?: string | null
  composite_url?: string | null
  preview_urls?: string[]
  garment_type?: string
  garment_color?: string
  tech_pack?: {
    style_info: Record<string, string>
    measurements: Record<string, number[]>
    pantones: { color: string; name: string }[]
    placements: { location: string; description: string }[]
  } | null
}

const BUCKET = 'grace-assets'

async function uploadImage(supabase: ReturnType<typeof createClient>, userId: string, projectId: string, type: string, dataUrl: string): Promise<string | null> {
  try {
    const base64 = dataUrl.split(',')[1]
    if (!base64) return null
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const path = `${userId}/${projectId}/${type}.png`
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'image/png',
      upsert: true,
    })
    if (error) { console.error('Upload error', type, error); return null }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  } catch (e) {
    console.error('uploadImage failed', e)
    return null
  }
}

export async function saveProject(
  userId: string,
  state: AppState,
  projectId?: string,
  projectName?: string,
): Promise<string | null> {
  const supabase = createClient()
  if (!supabase) return null

  // Upsert project row
  const id = projectId ?? crypto.randomUUID()
  const { error: projErr } = await supabase.from('projects').upsert({
    id,
    user_id: userId,
    name: projectName ?? `Design ${new Date().toLocaleDateString()}`,
    phase_reached: state.currentPhase,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (projErr) { console.error('Project upsert error', projErr); return null }

  // Upload images in parallel
  const uploads = await Promise.all([
    state.logo?.dataUrl     ? uploadImage(supabase, userId, id, 'logo', state.logo.dataUrl) : Promise.resolve(null),
    state.garment?.dataUrl  ? uploadImage(supabase, userId, id, 'garment', state.garment.dataUrl) : Promise.resolve(null),
    state.design?.previewDataUrl ? uploadImage(supabase, userId, id, 'composite', state.design.previewDataUrl) : Promise.resolve(null),
    ...(state.preview?.images ?? []).map((img, i) => uploadImage(supabase, userId, id, `preview_${i}`, img)),
  ])

  const [logoUrl, garmentUrl, compositeUrl, ...previewUrls] = uploads
  const thumbnail = compositeUrl ?? garmentUrl ?? logoUrl

  // Update project with urls
  await supabase.from('projects').update({
    thumbnail_url: thumbnail,
    garment_type: state.garment?.type ?? null,
    garment_color: state.garment?.color ?? null,
    logo_url: logoUrl,
    garment_url: garmentUrl,
    composite_url: compositeUrl,
    preview_urls: previewUrls.filter(Boolean),
  }).eq('id', id)

  return id
}

export async function saveTechPack(
  projectId: string,
  techPack: ProjectDetail['tech_pack'],
): Promise<void> {
  const supabase = createClient()
  if (!supabase) return
  await supabase.from('tech_packs').upsert({
    project_id: projectId,
    ...techPack,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'project_id' })
}

export async function listProjects(userId: string): Promise<Project[]> {
  const supabase = createClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, name, phase_reached, created_at, updated_at, thumbnail_url')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function loadProject(projectId: string): Promise<ProjectDetail | null> {
  const supabase = createClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('projects')
    .select('*, tech_packs(*)')
    .eq('id', projectId)
    .single()
  if (error || !data) return null
  const tp = data.tech_packs?.[0]
  return {
    ...data,
    tech_pack: tp ? {
      style_info: tp.style_info,
      measurements: tp.measurements,
      pantones: tp.pantones,
      placements: tp.placements,
    } : null,
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) return
  await supabase.from('projects').delete().eq('id', projectId)
}
