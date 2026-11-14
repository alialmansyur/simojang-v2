import { API_BASE_URL, apiRequest } from '../api'

const AJAX_HEADERS = {
  'X-Requested-With': 'XMLHttpRequest',
}

const DEFAULT_GALLERY_DIR = 'media/gallery'

function cleanRelativeGalleryPath(rawPath) {
  let clean = String(rawPath || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^(?:\.\/)+/, '')
    .replace(/^\/+/, '')
    .replace(/^public\//i, '')
    .replace(/^apps\/assets\/uploads\//i, 'media/')

  if (!clean) return ''

  // If backend returned only filename without directory, default to centralized gallery media folder
  if (!clean.includes('/')) {
    clean = `${DEFAULT_GALLERY_DIR}/${clean}`
  }

  return clean
}

function buildPublicGalleryUrl(relativePath) {
  const clean = cleanRelativeGalleryPath(relativePath)
  if (!clean) return ''
  return API_BASE_URL ? `${API_BASE_URL}/${clean}` : `/${clean}`
}

/**
 * Resolve gallery image URL matching centralized BE (`apps/admin`: `media/gallery/...`)
 * across both Vite dev proxy mode and separated BE/FE deployment.
 */
export function resolveGalleryImageUrl(raw) {
  if (!raw) return ''

  // 1. Prefer explicit relative `img_path` from apps/admin getData()
  if (raw.img_path) {
    return buildPublicGalleryUrl(raw.img_path)
  }

  // 2. Construct from raw DB metadata (`file_path` + `file_name`) if available
  if (raw.file_name) {
    const fileName = String(raw.file_name).trim().replace(/^\/+/, '')
    const dir = String(raw.file_path || DEFAULT_GALLERY_DIR)
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '')
    const combined = dir.endsWith(`/${fileName}`) || dir === fileName
      ? dir
      : `${dir || DEFAULT_GALLERY_DIR}/${fileName}`
    return buildPublicGalleryUrl(combined)
  }

  // 3. Fallback to `raw.img` returned by legacy BE `base_url(...)`
  const imgStr = raw.img ? String(raw.img).trim() : ''
  if (!imgStr) return ''

  if (/^https?:\/\//i.test(imgStr)) {
    try {
      const parsed = new URL(imgStr)
      const markerMatch = parsed.pathname.match(/(\/(?:media|apps|uploads)\/.+)$/i)
      // In Vite proxy mode (empty API_BASE_URL), route `/media/...` (and legacy paths)
      // from localhost/legacy base_url through Vite proxy so images load automatically.
      if (!API_BASE_URL && markerMatch && /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)) {
        return markerMatch[1]
      }
      // When separated BE base URL is configured, rebase relative `/apps/...` onto API_BASE_URL
      if (API_BASE_URL && markerMatch) {
        return `${API_BASE_URL}${markerMatch[1]}`
      }
    } catch {
      // Ignore invalid URL parse and return raw string below
    }
    return imgStr
  }

  return buildPublicGalleryUrl(imgStr)
}

/**
 * Normalize single gallery record from apps/admin ActivityGalleryController::getData().
 */
export function normalizeGalleryItem(raw) {
  if (!raw) return null

  return {
    id: raw.id,
    uid: raw.uid || '',
    teamId: raw.team_id !== undefined && raw.team_id !== null ? String(raw.team_id) : '',
    teamName: raw.team_name || 'Tidak Diketahui',
    layananId: raw.layanan_id !== undefined && raw.layanan_id !== null ? String(raw.layanan_id) : '',
    layananName: raw.layanan_name || '',
    title: raw.title || 'Dokumentasi Kegiatan',
    date: raw.date || '',
    dateFormatted: raw.date_formatted || raw.date || '-',
    desc: raw.desc || '',
    img: resolveGalleryImageUrl(raw),
    imgPath: raw.img_path || '',
  }
}

/**
 * Fetch activity gallery list (paginated or full) from apps/admin backend.
 */
export async function fetchGalleryPage({
  search = '',
  timkerja = '',
  bulan = '',
  months = [],
  page = 1,
  perPage = 12,
} = {}) {
  const formData = new FormData()
  formData.append('search', search)
  formData.append('timkerja', timkerja)
  formData.append('bulan', bulan)
  if (Array.isArray(months) && months.length > 0) {
    formData.append('months', months.join(','))
  }
  formData.append('page', String(page))
  formData.append('per_page', String(perPage))

  const response = await apiRequest('/activity-gallery/get-data', {
    method: 'POST',
    headers: AJAX_HEADERS,
    body: formData,
  })

  if (response?.status !== 'success') {
    throw new Error(response?.message || 'Gagal memuat data galeri kegiatan.')
  }

  const list = Array.isArray(response.data) ? response.data : []
  const items = list.map(normalizeGalleryItem).filter(Boolean)
  const rawTotal = response?.pagination?.total
  const total = rawTotal !== undefined && rawTotal !== null ? Number(rawTotal) : items.length
  const totalPages = Number(
    response?.pagination?.total_pages ?? (Math.ceil(total / perPage) || 1),
  )

  return {
    items,
    pagination: {
      total,
      page: Number(response?.pagination?.page ?? page),
      perPage: Number(response?.pagination?.per_page ?? perPage),
      totalPages,
    },
    summary: {
      totalAll: Number(response?.summary?.total_all ?? total),
      teamCounts: response?.summary?.team_counts || {},
    },
  }
}

export async function fetchGalleryItems(params = {}) {
  const res = await fetchGalleryPage({ ...params, page: 1, perPage: 100 })
  return res.items
}

/**
 * Fetch active Tim Kerja list for gallery filter & form dropdowns.
 */
export async function fetchGalleryTeams() {
  const response = await apiRequest('/activity-gallery/get-timkerja', {
    method: 'GET',
    headers: AJAX_HEADERS,
  })

  if (response?.status !== 'success') {
    throw new Error(response?.message || 'Gagal memuat daftar tim kerja.')
  }

  return Array.isArray(response.data) ? response.data : []
}

/**
 * Fetch active Layanan list dependent on selected Tim Kerja.
 */
export async function fetchGalleryLayanan(timkerjaId) {
  if (!timkerjaId) return []

  const formData = new FormData()
  formData.append('timkerja_id', String(timkerjaId))

  const response = await apiRequest('/activity-gallery/get-layanan', {
    method: 'POST',
    headers: AJAX_HEADERS,
    body: formData,
  })

  if (response?.status !== 'success') {
    throw new Error(response?.message || 'Gagal memuat daftar layanan.')
  }

  return Array.isArray(response.data) ? response.data : []
}

/**
 * Create or update activity gallery record (multipart/form-data matching ActivityGalleryController::store).
 */
export async function saveGalleryItem({
  id = '',
  timkerja,
  layanan = '',
  tanggal,
  judul,
  deskripsi,
  foto = null,
}) {
  const formData = new FormData()
  if (id) {
    formData.append('id', String(id))
  }
  formData.append('timkerja', String(timkerja))
  formData.append('layanan', layanan ? String(layanan) : '')
  formData.append('tanggal', tanggal)
  formData.append('judul', judul)
  formData.append('deskripsi', deskripsi)
  if (foto instanceof File) {
    formData.append('foto', foto)
  }

  const response = await apiRequest('/activity-gallery/store', {
    method: 'POST',
    headers: AJAX_HEADERS,
    body: formData,
  })

  if (response?.status !== 'success') {
    throw new Error(response?.message || 'Gagal menyimpan dokumentasi kegiatan.')
  }

  return response
}

/**
 * Delete activity gallery record by ID.
 */
export async function deleteGalleryItem(id) {
  const formData = new FormData()
  formData.append('id', String(id))

  const response = await apiRequest('/activity-gallery/delete', {
    method: 'POST',
    headers: AJAX_HEADERS,
    body: formData,
  })

  if (response?.status !== 'success') {
    throw new Error(response?.message || 'Gagal menghapus dokumentasi kegiatan.')
  }

  return response
}
