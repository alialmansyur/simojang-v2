/**
 * Wasdal (Pengawasan & Pengendalian) Services API Client
 * Kantor Regional III BKN Bandung
 * Melayani Layanan Sistem Merit (18), Indeks NSPK (19), dan Wasdal Netralitas/Disiplin (20)
 */
import { apiRequest } from '../api'

function toFormData(obj = {}) {
  const formData = new FormData()
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value instanceof Blob ? value : String(value))
    }
  })
  return formData
}

function appendBulan(formData, bulan) {
  if (Array.isArray(bulan) && bulan.length > 0) {
    bulan.forEach((b) => formData.append('bulan[]', String(b)))
  }
}

async function postSummary(path, { bulan = [], signal }, fallbackMessage) {
  const formData = new FormData()
  appendBulan(formData, bulan)
  const json = await apiRequest(path, { method: 'POST', body: formData, signal, fallbackMessage })
  return json?.summary || json
}

async function postList(path, { bulan = [], start = 0, length = 10, search = '', extra = {}, signal }, fallbackMessage) {
  const formData = toFormData({
    start: String(start),
    length: String(length),
    draw: String(Date.now()),
    'search[value]': search || '',
    ...extra,
  })
  appendBulan(formData, bulan)

  const json = await apiRequest(path, { method: 'POST', body: formData, signal, fallbackMessage })
  return {
    draw: json?.draw,
    total: json?.recordsTotal || 0,
    filtered: json?.recordsFiltered || 0,
    data: Array.isArray(json?.data) ? json.data : [],
  }
}

/**
 * Fetch master instansi options for dropdown/select
 */
export async function fetchInstansiOptions(search = '') {
  const data = await apiRequest('/instansi-list', {
    method: 'POST',
    body: toFormData({ search }),
    fallbackMessage: 'Gagal memuat daftar instansi.',
  })
  const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
  return rows.map((item) => {
    const id = String(item.id || item.kodeins || '')
    const text = item.text || item.nama || item.instansi_name || id
    return {
      id,
      kodeins: id,
      text,
      nama: text,
      value: id,
      label: text,
    }
  })
}

// =========================================================================
// 1. SISTEM MERIT (Layanan 18)
// =========================================================================

export function fetchMeritSummary(params) {
  return postSummary('/fetch/summary-merit', params, 'Gagal memuat rekap Sistem Merit.')
}

export function fetchMeritData({ category = '', ...rest }) {
  const extra = category ? { category, kategori: category } : {}
  return postList('/fetch/data-merit', { ...rest, extra }, 'Gagal memuat data Sistem Merit.')
}

export function saveMeritData(data) {
  return apiRequest('/store/save-data-merit', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan data Sistem Merit.',
  })
}

export function deleteMeritData(key) {
  return apiRequest('/kill/data-merit', {
    method: 'POST',
    body: toFormData({ key: String(key) }),
    fallbackMessage: 'Gagal menghapus data Sistem Merit.',
  })
}

export function importBatchMerit(file) {
  return apiRequest('/store/import-batch-merit', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor batch data Sistem Merit.',
  })
}

// =========================================================================
// 2. INDEKS NSPK (Layanan 19)
// =========================================================================

export function fetchNspkSummary(params) {
  return postSummary('/fetch/summary-nspk', params, 'Gagal memuat rekap Indeks NSPK.')
}

export function fetchNspkData({ category = '', ...rest }) {
  const extra = category ? { category, level: category, kategori: category } : {}
  return postList('/fetch/data-nspk', { ...rest, extra }, 'Gagal memuat data Indeks NSPK.')
}

export function saveNspkData(data) {
  return apiRequest('/store/save-data-nspk', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan data Indeks NSPK.',
  })
}

export function deleteNspkData(key) {
  return apiRequest('/kill/data-nspk', {
    method: 'POST',
    body: toFormData({ key: String(key) }),
    fallbackMessage: 'Gagal menghapus data Indeks NSPK.',
  })
}

export function importBatchNspk(file) {
  return apiRequest('/store/import-batch-nspk', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor batch data Indeks NSPK.',
  })
}

// =========================================================================
// 3. WASDAL NETRALITAS & DISIPLIN (Layanan 20)
// =========================================================================

export function fetchWasdalSummary(params) {
  return postSummary('/fetch/summary-wasdal', params, 'Gagal memuat rekap Pengawasan Netralitas.')
}

export function fetchWasdalData({ category = '', ...rest }) {
  const extra = category ? { category, kategori: category } : {}
  return postList('/fetch/data-wasdal', { ...rest, extra }, 'Gagal memuat data Pengawasan Netralitas.')
}

export function saveWasdalData(data) {
  return apiRequest('/store/save-data-wasdal', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan data Pengawasan Netralitas.',
  })
}

export function deleteWasdalData(key) {
  return apiRequest('/kill/data-wasdal', {
    method: 'POST',
    body: toFormData({ key: String(key) }),
    fallbackMessage: 'Gagal menghapus data Pengawasan Netralitas.',
  })
}

export function importBatchWasdal(file) {
  return apiRequest('/store/import-batch-wasdal', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor batch data Pengawasan Netralitas.',
  })
}
