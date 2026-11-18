/**
 * PMA (Pembinaan Manajemen ASN) Services API Client
 * Kantor Regional III BKN Bandung
 * Melayani 6 Layanan Tim Kerja PMA:
 * 1. Manajemen Talenta (13)
 * 2. Pembinaan Kinerja dan Penghargaan (14)
 * 3. Pengembangan Kompetensi (15)
 * 4. Pembinaan Disiplin, Budaya Kerja, dan Citra Institusi (16)
 * 5. Penilaian Kompetensi (39)
 * 6. Penilaian Karier (40)
 */
import { apiRequest } from '../api'

function toFormData(payload = {}) {
  const fd = new FormData()
  Object.entries(payload).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (Array.isArray(v)) {
      const arrayKey = k.endsWith('[]') ? k : `${k}[]`
      v.forEach((item) => {
        if (item !== undefined && item !== null) {
          fd.append(arrayKey, String(item))
        }
      })
      return
    }
    fd.append(k, v instanceof Blob ? v : String(v))
  })
  return fd
}

function appendBulan(fd, bulan) {
  if (Array.isArray(bulan) && bulan.length > 0) {
    bulan.forEach((b) => fd.append('bulan[]', String(b)))
  }
}

function appendMonths(fd, periodMonths) {
  if (Array.isArray(periodMonths) && periodMonths.length > 0) {
    periodMonths.forEach((m) => fd.append('period_months[]', String(m)))
  }
}

async function postSummary(path, body, fallbackMessage) {
  const json = await apiRequest(path, { method: 'POST', body, fallbackMessage })
  return json?.summary || json
}

async function postList(path, body, signal, fallbackMessage) {
  const json = await apiRequest(path, { method: 'POST', body, signal, fallbackMessage })
  return {
    data: json?.data || [],
    total: json?.recordsTotal ?? 0,
    filtered: json?.recordsFiltered ?? 0,
  }
}

// =========================================================================
// MASTER & SUPPORT OPTIONS
// =========================================================================

export async function fetchInstansiOptions(search = '') {
  const data = await apiRequest('/instansi-list', {
    method: 'POST',
    body: toFormData({ search }),
    fallbackMessage: 'Gagal memuat daftar instansi.',
  })
  const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
  return rows.map((row) => {
    const id = String(row.id || row.kodeins || '')
    const name = row.text || row.nama || String(id)
    return {
      value: id,
      label: name,
      id,
      kodeins: id,
      text: name,
      nama: name,
    }
  })
}

export async function fetchStepMtOptions() {
  const data = await apiRequest('/step-mt-list', {
    method: 'POST',
    fallbackMessage: 'Gagal memuat tahapan Manajemen Talenta.',
  })
  return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
}

export function fetchKinerjaOptions() {
  return apiRequest('/fetch/options-pembinaan-kinerja', {
    method: 'POST',
    fallbackMessage: 'Gagal memuat opsi pembinaan kinerja.',
  })
}

export function fetchDisiplinOptions() {
  return apiRequest('/fetch/options-pembinaan-disiplin-budaya-citra', {
    method: 'POST',
    fallbackMessage: 'Gagal memuat opsi pembinaan disiplin.',
  })
}

// =========================================================================
// 1. MANAJEMEN TALENTA (Layanan 13)
// =========================================================================

export function fetchMtSummary({ bulan = [], period_year = 'ALL', category = '' } = {}) {
  const payload = {
    period_year: String(period_year || 'ALL'),
  }
  if (category && category !== 'all') {
    payload.category = String(category)
  }
  const fd = toFormData(payload)
  appendBulan(fd, bulan)
  return postSummary('/fetch/summary-mt', fd, 'Gagal memuat ringkasan Manajemen Talenta.')
}

export function fetchMtData({ bulan = [], period_year = 'ALL', category = '', start = 0, length = 10, search = '', signal } = {}) {
  const payload = {
    period_year: String(period_year || 'ALL'),
    start: String(start),
    length: String(length),
    'search[value]': search,
  }
  if (category && category !== 'all') {
    payload.category = String(category)
  }
  const fd = toFormData(payload)
  appendBulan(fd, bulan)
  return postList('/fetch/data-mt', fd, signal, 'Gagal memuat data Manajemen Talenta.')
}

export function fetchMtDetail(id) {
  return apiRequest('/fetch/detail-mt', {
    method: 'POST',
    body: toFormData({ key: String(id) }),
    fallbackMessage: 'Gagal memuat detail Manajemen Talenta.',
  })
}

export function storeMtData(payload) {
  return apiRequest('/store/add-mt', {
    method: 'POST',
    body: toFormData(payload),
    fallbackMessage: 'Gagal menyimpan data Manajemen Talenta.',
  })
}

export function deleteMtData(id) {
  return apiRequest('/kill/data-mt', {
    method: 'POST',
    body: toFormData({ key: String(id) }),
    fallbackMessage: 'Gagal menghapus data Manajemen Talenta.',
  })
}

export function importBatchMt(file) {
  return apiRequest('/store/import-mt', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor data Manajemen Talenta.',
  })
}

// =========================================================================
// 2. PEMBINAAN KINERJA DAN PENGHARGAAN (Layanan 14)
// =========================================================================

export function fetchKinerjaSummary({ kategori_id = 0, period_year = new Date().getFullYear(), period_months = [] } = {}) {
  const fd = toFormData({
    kategori_id: String(kategori_id || 0),
    period_year: String(period_year || new Date().getFullYear()),
  })
  appendMonths(fd, period_months)
  return postSummary('/fetch/summary-pembinaan-kinerja', fd, 'Gagal memuat ringkasan Pembinaan Kinerja.')
}

export function fetchKinerjaData({ kategori_id = 0, period_year = new Date().getFullYear(), period_months = [], start = 0, length = 10, search = '', signal } = {}) {
  const fd = toFormData({
    kategori_id: String(kategori_id || 0),
    period_year: String(period_year || new Date().getFullYear()),
    start: String(start),
    length: String(length),
    'search[value]': search,
  })
  appendMonths(fd, period_months)
  return postList('/fetch/data-pembinaan-kinerja', fd, signal, 'Gagal memuat data Pembinaan Kinerja.')
}

export function storeKinerjaData(payload) {
  return apiRequest('/store/save-data-pembinaan-kinerja', {
    method: 'POST',
    body: toFormData(payload),
    fallbackMessage: 'Gagal menyimpan data Pembinaan Kinerja.',
  })
}

export function deleteKinerjaData(id) {
  return apiRequest('/kill/data-pembinaan-kinerja', {
    method: 'POST',
    body: toFormData({ key: String(id) }),
    fallbackMessage: 'Gagal menghapus data Pembinaan Kinerja.',
  })
}

export function importBatchKinerja(file) {
  return apiRequest('/store/import-pembinaan-kinerja', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor data Pembinaan Kinerja.',
  })
}

// =========================================================================
// 3. PENGEMBANGAN KOMPETENSI (Layanan 15)
// =========================================================================

export function fetchKompetensiKarierSummary({ period_year = new Date().getFullYear(), period_months = [] } = {}) {
  const fd = toFormData({ period_year: String(period_year || new Date().getFullYear()) })
  appendMonths(fd, period_months)
  return postSummary('/fetch/summary-pembinaan-kompetensi-karier', fd, 'Gagal memuat ringkasan Pengembangan Kompetensi.')
}

export function fetchKompetensiKarierData({ period_year = new Date().getFullYear(), period_months = [], category = '', start = 0, length = 10, search = '', signal } = {}) {
  const fd = toFormData({
    period_year: String(period_year || new Date().getFullYear()),
    start: String(start),
    length: String(length),
    'search[value]': search,
  })
  if (category) fd.append('category', category)
  appendMonths(fd, period_months)
  return postList('/fetch/data-pembinaan-kompetensi-karier', fd, signal, 'Gagal memuat data Pengembangan Kompetensi.')
}

export function storeKompetensiKarierData(payload) {
  return apiRequest('/store/save-data-pembinaan-kompetensi-karier', {
    method: 'POST',
    body: toFormData(payload),
    fallbackMessage: 'Gagal menyimpan agenda Pengembangan Kompetensi.',
  })
}

export function deleteKompetensiKarierData(id) {
  return apiRequest('/kill/data-pembinaan-kompetensi-karier', {
    method: 'POST',
    body: toFormData({ key: String(id) }),
    fallbackMessage: 'Gagal menghapus data Pengembangan Kompetensi.',
  })
}

export function importBatchKompetensiKarier(file) {
  return apiRequest('/store/import-pembinaan-kompetensi-karier', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor agenda Pengembangan Kompetensi.',
  })
}

// =========================================================================
// 4. PEMBINAAN DISIPLIN, BUDAYA KERJA & CITRA (Layanan 16)
// =========================================================================

export function fetchDisiplinSummary({ kategori_id = 0, period_year = new Date().getFullYear(), jenis_layanan = 'ALL', period_months = [] } = {}) {
  const fd = toFormData({
    kategori_id: String(kategori_id || 0),
    period_year: String(period_year || new Date().getFullYear()),
    jenis_layanan: jenis_layanan || 'ALL',
  })
  appendMonths(fd, period_months)
  return postSummary('/fetch/summary-pembinaan-disiplin-budaya-citra', fd, 'Gagal memuat ringkasan Disiplin & Citra.')
}

export function fetchDisiplinData({ kategori_id = 0, period_year = new Date().getFullYear(), jenis_layanan = 'ALL', period_months = [], start = 0, length = 10, search = '', signal } = {}) {
  const fd = toFormData({
    kategori_id: String(kategori_id || 0),
    period_year: String(period_year || new Date().getFullYear()),
    jenis_layanan: jenis_layanan || 'ALL',
    start: String(start),
    length: String(length),
    'search[value]': search,
  })
  appendMonths(fd, period_months)
  return postList('/fetch/data-pembinaan-disiplin-budaya-citra', fd, signal, 'Gagal memuat data Disiplin & Citra.')
}

export function fetchDisiplinDetail({ instansi_id, period_year = new Date().getFullYear(), jenis_layanan = 'ALL', kategori_id = 0, period_months = [] } = {}) {
  const fd = toFormData({
    instansi_id: String(instansi_id || ''),
    period_year: String(period_year || new Date().getFullYear()),
    jenis_layanan: jenis_layanan || 'ALL',
    kategori_id: String(kategori_id || 0),
  })
  appendMonths(fd, period_months)
  return apiRequest('/fetch/detail-pembinaan-disiplin-budaya-citra', {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal memuat riwayat detail Disiplin & Budaya.',
  })
}

export function storeDisiplinData(payload) {
  return apiRequest('/store/save-data-pembinaan-disiplin-budaya-citra', {
    method: 'POST',
    body: toFormData(payload),
    fallbackMessage: 'Gagal menyimpan agenda Pembinaan Disiplin & Budaya.',
  })
}

export function deleteDisiplinData(id) {
  return apiRequest('/kill/data-pembinaan-disiplin-budaya-citra', {
    method: 'POST',
    body: toFormData({ key: String(id) }),
    fallbackMessage: 'Gagal menghapus data Disiplin & Budaya.',
  })
}

export function importBatchDisiplin(file) {
  return apiRequest('/store/import-pembinaan-disiplin-budaya-citra', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor data Disiplin & Budaya.',
  })
}

// =========================================================================
// 5. PENILAIAN KOMPETENSI (Layanan 39)
// =========================================================================

export function fetchPenilaianKompetensiSummary({ bulan = [], period_year = new Date().getFullYear(), category = '' } = {}) {
  const payload = {
    period_year: String(period_year || new Date().getFullYear()),
  }
  if (category && category !== 'all') {
    payload.category = String(category)
  }
  const fd = toFormData(payload)
  appendBulan(fd, bulan)
  return postSummary('/fetch/summary-kompetensi', fd, 'Gagal memuat ringkasan Penilaian Kompetensi.')
}

export function fetchPenilaianKompetensiData({ bulan = [], period_year = new Date().getFullYear(), category = '', start = 0, length = 10, search = '', signal } = {}) {
  const fd = toFormData({
    period_year: String(period_year || new Date().getFullYear()),
    start: String(start),
    length: String(length),
    'search[value]': search,
  })
  if (category && category !== 'all') fd.append('category', category)
  appendBulan(fd, bulan)
  return postList('/fetch/data-kompetensi', fd, signal, 'Gagal memuat data Penilaian Kompetensi.')
}

export function storePenilaianKompetensiData(payload) {
  return apiRequest('/store/save-data-kompetensi', {
    method: 'POST',
    body: toFormData(payload),
    fallbackMessage: 'Gagal menyimpan data Penilaian Kompetensi.',
  })
}

export function deletePenilaianKompetensiData(uidOrId) {
  return apiRequest('/kill/data-kompetensi', {
    method: 'POST',
    body: toFormData({ key: String(uidOrId) }),
    fallbackMessage: 'Gagal menghapus data Penilaian Kompetensi.',
  })
}

export function importBatchPenilaianKompetensi(file) {
  return apiRequest('/store/import-kompetensi', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor data Penilaian Kompetensi.',
  })
}

// =========================================================================
// 6. PENILAIAN KARIER (Layanan 40)
// =========================================================================

export function fetchPenilaianKarierSummary({ bulan = [], period_year = new Date().getFullYear(), category = '' } = {}) {
  const payload = {
    period_year: String(period_year || new Date().getFullYear()),
  }
  if (category && category !== 'all') {
    payload.category = String(category)
  }
  const fd = toFormData(payload)
  appendBulan(fd, bulan)
  return postSummary('/fetch/summary-karier', fd, 'Gagal memuat ringkasan Penilaian Karier.')
}

export function fetchPenilaianKarierData({ bulan = [], period_year = new Date().getFullYear(), category = '', start = 0, length = 10, search = '', signal } = {}) {
  const fd = toFormData({
    period_year: String(period_year || new Date().getFullYear()),
    start: String(start),
    length: String(length),
    'search[value]': search,
  })
  if (category && category !== 'all') fd.append('category', category)
  appendBulan(fd, bulan)
  return postList('/fetch/data-karier', fd, signal, 'Gagal memuat data Penilaian Karier.')
}

export function storePenilaianKarierData(payload) {
  return apiRequest('/store/save-data-karier', {
    method: 'POST',
    body: toFormData(payload),
    fallbackMessage: 'Gagal menyimpan data Penilaian Karier.',
  })
}

export function deletePenilaianKarierData(uidOrId) {
  return apiRequest('/kill/data-karier', {
    method: 'POST',
    body: toFormData({ key: String(uidOrId) }),
    fallbackMessage: 'Gagal menghapus data Penilaian Karier.',
  })
}

export function importBatchPenilaianKarier(file) {
  return apiRequest('/store/import-karier', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor data Penilaian Karier.',
  })
}

// Semantic Aliases for Dedicated Service Pages
export {
  fetchKinerjaSummary as fetchPembinaanKinerjaSummary,
  fetchKinerjaData as fetchPembinaanKinerjaData,
  deleteKinerjaData as deletePembinaanKinerjaData,
  importBatchKinerja as importBatchPembinaanKinerja,
  fetchKompetensiKarierSummary as fetchPengembanganKompetensiSummary,
  fetchKompetensiKarierData as fetchPengembanganKompetensiData,
  deleteKompetensiKarierData as deletePengembanganKompetensiData,
  importBatchKompetensiKarier as importBatchPengembanganKompetensi,
}
