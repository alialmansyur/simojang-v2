/**
 * Modular Services API Client
 * Kantor Regional III BKN Bandung
 * Melayani 6 Layanan SnP dan Layanan Modular Lainnya
 */
import { apiRequest } from '../api'

function buildFormData(entries = {}) {
  const fd = new FormData()
  Object.entries(entries).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fd.append(key, value instanceof Blob ? value : String(value))
    }
  })
  return fd
}

/**
 * Fetch list of upload logs from POST /fetch/data
 */
export async function fetchServiceUploadLogs({
  layananId,
  bulan = [],
  docCategory = '',
  category = '',
  start = 0,
  length = 10,
  search = '',
  signal,
}) {
  const activeCategory = docCategory || category || ''
  const formData = buildFormData({
    layanan: String(layananId),
    start: String(start),
    length: String(length),
    draw: String(Date.now()),
    'search[value]': search || '',
    doc_category: activeCategory,
  })

  if (Array.isArray(bulan) && bulan.length > 0) {
    bulan.forEach((b) => formData.append('bulan[]', String(b)))
  }

  const json = await apiRequest('/fetch/data', {
    method: 'POST',
    body: formData,
    signal,
    fallbackMessage: 'Gagal memuat log data usul.',
  })

  return {
    draw: json?.draw,
    total: json?.recordsTotal || 0,
    filtered: json?.recordsFiltered || 0,
    data: Array.isArray(json?.data) ? json.data : [],
  }
}

/**
 * Fetch KPI summary from POST /fetch/summary-uploaders
 */
export async function fetchServiceSummary({
  layananId,
  bulan = [],
  docCategory = '',
  category = '',
  signal,
}) {
  const activeCategory = docCategory || category || ''
  const formData = buildFormData({
    layanan: String(layananId),
    doc_category: activeCategory,
  })

  if (Array.isArray(bulan) && bulan.length > 0) {
    bulan.forEach((b) => formData.append('bulan[]', String(b)))
  }

  const json = await apiRequest('/fetch/summary-uploaders', {
    method: 'POST',
    body: formData,
    signal,
    fallbackMessage: 'Gagal memuat ringkasan KPI.',
  })

  return (
    json?.summary || {
      total_file: 0,
      total_all_files: 0,
      total_baris_detail: 0,
      total_instansi: 0,
      total_usul: 0,
      last_upload: null,
      first_upload: null,
      active_periods: 0,
      category_counts: {},
    }
  )
}

/**
 * Save manual entry record via POST /store/manual-entry
 */
export async function saveServiceManualEntry(payload) {
  const body = payload instanceof FormData ? payload : buildFormData(payload)

  return apiRequest('/store/manual-entry', {
    method: 'POST',
    body,
    fallbackMessage: 'Gagal menyimpan catatan usul layanan.',
  })
}

/**
 * Update existing upload log & detail via POST /store/update-log
 */
export async function updateServiceUploadLog(payload) {
  const body = payload instanceof FormData ? payload : buildFormData(payload)

  return apiRequest('/store/update-log', {
    method: 'POST',
    body,
    fallbackMessage: 'Gagal memperbarui data log layanan.',
  })
}

/**
 * Fetch detailed instansi rows from POST /fetch/data-detail
 */
export async function fetchServiceDetailData({
  key,
  start = 0,
  length = 100,
  search = '',
  signal,
}) {
  const formData = buildFormData({
    key: String(key),
    start: String(start),
    length: String(length),
    draw: String(Date.now()),
    'search[value]': search || '',
  })

  const json = await apiRequest('/fetch/data-detail', {
    method: 'POST',
    body: formData,
    signal,
    fallbackMessage: 'Gagal memuat rincian usul instansi.',
  })

  return {
    draw: json?.draw,
    total: json?.recordsTotal || 0,
    filtered: json?.recordsFiltered || 0,
    data: Array.isArray(json?.data) ? json.data : [],
  }
}

/**
 * Upload new Excel batch from POST /store/import-excel
 */
export async function uploadServiceExcel(payload) {
  const body = payload instanceof FormData ? payload : buildFormData(payload)

  return apiRequest('/store/import-excel', {
    method: 'POST',
    body,
    fallbackMessage: 'Upload berkas Excel gagal diproses.',
  })
}

/**
 * Delete upload log & cascade details via POST /kill/data-uploaders
 */
export async function deleteServiceUploadLog(key) {
  await apiRequest('/kill/data-uploaders', {
    method: 'POST',
    body: buildFormData({ key: String(key) }),
    fallbackMessage: 'Gagal menghapus berkas log.',
  })

  return true
}

/**
 * Fetch master instansi options from POST /instansi-list
 * Normalizes { id, text } into versatile structure { id, text, value, label, nama }
 */
export async function fetchInstansiOptions(search = '') {
  const data = await apiRequest('/instansi-list', {
    method: 'POST',
    body: buildFormData({ search }),
    fallbackMessage: 'Gagal memuat daftar instansi.',
  })

  const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
  return rows.map((item) => ({
    id: item.id || item.kodeins,
    value: item.id || item.kodeins,
    text: item.text || item.nama || '',
    label: item.text || item.nama || '',
    nama: item.nama || item.text || '',
  }))
}

/**
 * TapNIP Events API
 */
export async function fetchTapnipEvents() {
  const json = await apiRequest('/api/apps-tapnip/events', {
    method: 'GET',
    fallbackMessage: 'Gagal memuat daftar event TapNIP.',
  })
  return Array.isArray(json?.data) ? json.data : []
}

export async function saveTapnipEvent({ id, nama }) {
  const isUpdate = Boolean(id)
  const endpoint = isUpdate ? '/api/apps-tapnip/events/update' : '/api/apps-tapnip/events'
  const payload = isUpdate ? { id: String(id), nama } : { nama }

  return apiRequest(endpoint, {
    method: 'POST',
    body: buildFormData(payload),
    fallbackMessage: 'Gagal menyimpan event.',
  })
}

export async function deleteTapnipEvent(id) {
  return apiRequest('/api/apps-tapnip/events/delete', {
    method: 'POST',
    body: buildFormData({ id: String(id) }),
    fallbackMessage: 'Gagal menghapus event.',
  })
}
