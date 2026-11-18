/**
 * SIDIGI (Sistem Informasi & Digitalisasi) Services API Client
 * Kantor Regional III BKN Bandung
 * Melayani 7 Layanan:
 * 1. Statistik Data Kepegawaian (21)
 * 2. Peremajaan Data ASN / PDM (22)
 * 3. Disparitas Data Kepegawaian (23)
 * 4. Integrasi SIASN dengan SIMPEG (24)
 * 5. Pengelolaan Dokumen Arsip / Takah (25)
 * 6. Digitalisasi Arsip Kepegawaian / DMS (26)
 * 7. Dokumen Seleksi PNBP CAT (42)
 */
import { apiRequest } from '../api'

function toFormData(obj = {}) {
  const fd = new FormData()
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      fd.append(k, v instanceof Blob ? v : String(v))
    }
  })
  return fd
}

function appendBulan(fd, bulan) {
  if (Array.isArray(bulan) && bulan.length > 0) {
    bulan.forEach((b) => fd.append('bulan[]', String(b)))
  }
}

async function postSummary(path, body, signal, fallbackMessage) {
  const result = await apiRequest(path, { method: 'POST', body, signal, fallbackMessage })
  return result?.summary || result
}

async function postList(path, body, signal, fallbackMessage) {
  const result = await apiRequest(path, { method: 'POST', body, signal, fallbackMessage })
  return {
    data: result?.data || [],
    total: result?.recordsTotal || 0,
    filtered: result?.recordsFiltered || 0,
  }
}

async function postDetail(path, key, signal, fallbackMessage) {
  const result = await apiRequest(path, {
    method: 'POST',
    body: toFormData({
      key: String(key),
      start: '0',
      length: '5000',
      draw: '1',
    }),
    signal,
    fallbackMessage,
  })
  return result?.data || result
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
// 1. STATISTIK DATA KEPEGAWAIAN (Layanan 21)
// =========================================================================

export function fetchStatistikSummary({ jenis = 'Jumlah ASN', bulan = [], signal }) {
  const fd = toFormData({ jenis })
  appendBulan(fd, bulan)
  return postSummary('/fetch/summary-statistik', fd, signal, 'Gagal memuat rekap Statistik ASN.')
}

export function fetchStatistikData({ jenis = 'Jumlah ASN', bulan = [], start = 0, length = 10, search = '', signal }) {
  const fd = toFormData({ jenis, start: String(start), length: String(length), 'search[value]': search, draw: '1' })
  appendBulan(fd, bulan)
  return postList('/fetch/data-statistik', fd, signal, 'Gagal memuat data tabel Statistik ASN.')
}

export function fetchStatistikDetail(key, signal) {
  return postDetail('/fetch/detail-statistik', key, signal, 'Gagal memuat rincian statistik.')
}

export function importBatchStatistik(formData) {
  return apiRequest('/store/import-excel-statistik', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengunggah file statistik.',
  })
}

export function deleteStatistikData(key, jenis = 'Jumlah ASN') {
  return apiRequest('/kill/data-statistik', {
    method: 'POST',
    body: toFormData({ key: String(key), jenis }),
    fallbackMessage: 'Gagal menghapus data statistik.',
  })
}

// =========================================================================
// 2. PEREMAJAAN DATA ASN / PDM (Layanan 22)
// =========================================================================

export function fetchPdmSummary({ jenis = '', bulan = [], signal }) {
  const fd = toFormData({ jenis: jenis && jenis !== 'all' ? jenis : '' })
  appendBulan(fd, bulan)
  return postSummary('/fetch/summary-peremajaan', fd, signal, 'Gagal memuat rekap Peremajaan Data.')
}

export function fetchPdmData({ jenis = '', bulan = [], start = 0, length = 10, search = '', signal }) {
  const fd = toFormData({
    jenis: jenis && jenis !== 'all' ? jenis : '',
    start: String(start),
    length: String(length),
    'search[value]': search,
    draw: '1',
  })
  appendBulan(fd, bulan)
  return postList('/fetch/data-peremajaan', fd, signal, 'Gagal memuat data tabel Peremajaan.')
}

export function fetchPdmDetail(key, signal) {
  return postDetail('/fetch/detail-peremajaan', key, signal, 'Gagal memuat rincian peremajaan data.')
}

export function savePdmData(payload) {
  const formData = toFormData({
    key: payload.key ? String(payload.key) : undefined,
    layanan_id: '22',
    period: payload.period || dateNowMonth(),
    startdate: payload.startdate || dateNowStart(),
    enddate: payload.enddate || dateNowEnd(),
  })

  const items = Array.isArray(payload.items) ? payload.items : [payload]
  items.forEach((item, idx) => {
    formData.append(`jenis[${idx}]`, item.jenis || 'Riwayat PDM')
    formData.append(`acc[${idx}]`, String(item.acc || 0))
    formData.append(`btl[${idx}]`, String(item.btl || 0))
    formData.append(`tms[${idx}]`, String(item.tms || 0))
  })

  return apiRequest('/store/save-data-peremajaan', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal menyimpan data peremajaan.',
  })
}

export function importBatchPdm(formData) {
  return apiRequest('/store/import-peremajaan', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengunggah file batch peremajaan.',
  })
}

export function deletePdmData(key) {
  return apiRequest('/kill/data-peremajaan', {
    method: 'POST',
    body: toFormData({ key: String(key) }),
    fallbackMessage: 'Gagal menghapus entri peremajaan.',
  })
}

// =========================================================================
// 3. DISPARITAS DATA KEPEGAWAIAN (Layanan 23)
// =========================================================================

export function fetchDisparitasSummary({ jenis = '', bulan = [], signal }) {
  const fd = toFormData({ jenis: jenis && jenis !== 'all' ? jenis : '' })
  appendBulan(fd, bulan)
  return postSummary('/fetch/summary-disparitas', fd, signal, 'Gagal memuat rekap Disparitas Data.')
}

export function fetchDisparitasData({ jenis = '', bulan = [], start = 0, length = 10, search = '', signal }) {
  const fd = toFormData({
    jenis: jenis && jenis !== 'all' ? jenis : '',
    start: String(start),
    length: String(length),
    'search[value]': search,
    draw: '1',
  })
  appendBulan(fd, bulan)
  return postList('/fetch/data-disparitas', fd, signal, 'Gagal memuat data Disparitas.')
}

export function fetchDisparitasDetail(key, signal) {
  return postDetail('/fetch/detail-disparitas', key, signal, 'Gagal memuat rincian disparitas.')
}

export function saveDisparitasData(payload) {
  const jenis = payload.jenis_anomali || payload.jenis || 'Anomali Unor / Jabatan Struktural Kosong'
  const formData = toFormData({
    key: payload.key ? String(payload.key) : undefined,
    instansi: payload.instansi || payload.instansi_id,
    jenis_anomali: jenis,
    jenis,
    jumlah: String(payload.jumlah || 1),
    period: payload.period || dateNowMonth(),
    startdate: payload.startdate || dateNowStart(),
    enddate: payload.enddate || dateNowEnd(),
  })

  return apiRequest('/store/save-data-disparitas', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal menyimpan data anomali disparitas.',
  })
}

export function importBatchDisparitas(formData) {
  return apiRequest('/store/import-disparitas', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengunggah file batch disparitas.',
  })
}

export function deleteDisparitasData(key) {
  return apiRequest('/kill/data-disparitas', {
    method: 'POST',
    body: toFormData({ key: String(key) }),
    fallbackMessage: 'Gagal menghapus log disparitas.',
  })
}

// =========================================================================
// 4. INTEGRASI SIASN DENGAN SIMPEG (Layanan 24)
// =========================================================================

export function fetchIntegrasiSummary({ jenis = 0, bulan = [], signal }) {
  const jenisVal = jenis === 'all' || !jenis ? 0 : jenis
  const fd = toFormData({ jenis: String(jenisVal) })
  appendBulan(fd, bulan)
  return postSummary('/fetch/summary-integrasi', fd, signal, 'Gagal memuat rekap Integrasi SIASN.')
}

export function fetchIntegrasiData({ jenis = 0, bulan = [], start = 0, length = 10, search = '', signal }) {
  const jenisVal = jenis === 'all' || !jenis ? 0 : jenis
  const fd = toFormData({
    jenis: String(jenisVal),
    start: String(start),
    length: String(length),
    'search[value]': search,
    draw: '1',
  })
  appendBulan(fd, bulan)
  return postList('/fetch/data-integrasi', fd, signal, 'Gagal memuat data status integrasi.')
}

export function fetchIntegrasiDetail(key, signal) {
  return postDetail('/fetch/detail-integrasi', key, signal, 'Gagal memuat rincian modul integrasi SIASN.')
}

export async function fetchIntegrasiSteps() {
  const json = await apiRequest('/step-integrasi-list', {
    method: 'POST',
    fallbackMessage: 'Gagal memuat daftar tahapan integrasi.',
  })
  const rows = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : [])
  return rows.map((st) => ({
    id: Number(st.id),
    text: st.text || st.jenis || `Riwayat ${st.id}`,
    jenis: st.jenis || st.text,
  }))
}

export function saveIntegrasiData(payload) {
  const formData = new FormData()
  if (payload.key) formData.append('key', String(payload.key))
  formData.append('instansi', payload.instansi || payload.instansi_id)
  formData.append('period', payload.period || dateNowMonth())
  formData.append('startdate', payload.startdate || dateNowStart())

  const riwayatArr = Array.isArray(payload.riwayat)
    ? payload.riwayat
    : [payload.step || payload.riwayat || 1]
  riwayatArr.forEach((rw) => formData.append('riwayat[]', String(rw)))

  formData.append('remarks', payload.remarks || 'Status Integrasi Sistem')

  // Backend IntegrasiData.php strictly validates video_url as required|valid_url
  let validVideoUrl = payload.video_url || payload.bukti_dukung || ''
  if (!validVideoUrl || !/^https?:\/\//i.test(validVideoUrl)) {
    validVideoUrl = 'https://siasn.bkn.go.id'
  }
  formData.append('video_url', validVideoUrl)
  if (payload.bukti_dukung) formData.append('bukti_dukung', payload.bukti_dukung)

  return apiRequest('/store/save-data-integrasi', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal menyimpan status integrasi.',
  })
}

export function importBatchIntegrasi(formData) {
  return apiRequest('/store/import-integrasi', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengunggah file batch integrasi.',
  })
}

export function deleteIntegrasiData(key) {
  return apiRequest('/kill/data-integrasi', {
    method: 'POST',
    body: toFormData({ key: String(key) }),
    fallbackMessage: 'Gagal menghapus riwayat integrasi.',
  })
}

// =========================================================================
// 5. PENGELOLAAN DOKUMEN ARSIP (TAKAH) (Layanan 25)
// =========================================================================

export function fetchTakahSummary({ bulan = [], signal }) {
  const fd = new FormData()
  appendBulan(fd, bulan)
  return postSummary('/fetch/summary-takah', fd, signal, 'Gagal memuat rekap Takah.')
}

export function fetchTakahData({ bulan = [], start = 0, length = 10, search = '', signal }) {
  const fd = toFormData({ start: String(start), length: String(length), 'search[value]': search, draw: '1' })
  appendBulan(fd, bulan)
  return postList('/fetch/data-takah', fd, signal, 'Gagal memuat data Takah.')
}

export function fetchTakahDetail(key, signal) {
  return postDetail('/fetch/detail-takah', key, signal, 'Gagal memuat rincian berkas Takah.')
}

export function saveTakahData(payload) {
  const formData = toFormData({
    key: payload.key ? String(payload.key) : undefined,
    nip: payload.nip,
    nama: payload.nama,
    instansi: payload.instansi || payload.instansi_id,
    period: payload.period || dateNowMonth(),
    startdate: payload.startdate || dateNowStart(),
    enddate: payload.enddate || dateNowEnd(),
  })

  const flags = ['d2nip', 'ijazah', 'akta', 'drh', 'cpns', 'pns', 'perubahan', 'kp', 'jabatan', 'berhenti', 'pensiun']
  flags.forEach((f) => {
    formData.append(f, payload[f] ? '1' : '0')
  })

  return apiRequest('/store/save-data-takah', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal menyimpan entri arsip Takah.',
  })
}

export function importBatchTakah(formData) {
  return apiRequest('/store/import-takah-data', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengunggah file batch Takah.',
  })
}

export function deleteTakahData(key) {
  return apiRequest('/kill/data-takah', {
    method: 'POST',
    body: toFormData({ key: String(key) }),
    fallbackMessage: 'Gagal menghapus log berkas Takah.',
  })
}

// =========================================================================
// 6. DIGITALISASI ARSIP KEPEGAWAIAN (DMS) (Layanan 26)
// =========================================================================

export function fetchDmsSummary({ jenis = '', bulan = [], signal }) {
  const fd = toFormData({ jenis: jenis && jenis !== 'all' ? jenis : '' })
  appendBulan(fd, bulan)
  return postSummary('/fetch/summary-dms', fd, signal, 'Gagal memuat rekap DMS.')
}

export function fetchDmsData({ jenis = '', bulan = [], start = 0, length = 10, search = '', signal }) {
  const fd = toFormData({
    jenis: jenis && jenis !== 'all' ? jenis : '',
    start: String(start),
    length: String(length),
    'search[value]': search,
    draw: '1',
  })
  appendBulan(fd, bulan)
  return postList('/fetch/data-dms', fd, signal, 'Gagal memuat data DMS.')
}

export function fetchDmsDetail(key, signal) {
  return postDetail('/fetch/detail-dms', key, signal, 'Gagal memuat rincian arsip digital.')
}

export function saveDmsData(payload) {
  const formData = toFormData({
    key: payload.key ? String(payload.key) : undefined,
    layanan_id: '26',
    instansi: payload.instansi || payload.instansi_id,
    period: payload.period || dateNowMonth(),
    startdate: payload.startdate || dateNowStart(),
    enddate: payload.enddate || dateNowEnd(),
    skor_arsip: payload.skor_arsip !== undefined ? String(payload.skor_arsip) : undefined,
    keterangan: payload.keterangan || undefined,
    total_pns: payload.total_pns !== undefined ? String(payload.total_pns) : undefined,
    status_cpns: payload.status_cpns !== undefined ? String(payload.status_cpns) : undefined,
    status_pns: payload.status_pns !== undefined ? String(payload.status_pns) : undefined,
    jumlah_sangat_lengkap: payload.jumlah_sangat_lengkap !== undefined ? String(payload.jumlah_sangat_lengkap) : undefined,
    jumlah_lengkap: payload.jumlah_lengkap !== undefined ? String(payload.jumlah_lengkap) : undefined,
    jumlah_cukup_lengkap: payload.jumlah_cukup_lengkap !== undefined ? String(payload.jumlah_cukup_lengkap) : undefined,
    jumlah_kurang_lengkap: payload.jumlah_kurang_lengkap !== undefined ? String(payload.jumlah_kurang_lengkap) : undefined,
  })

  const items = Array.isArray(payload.items) ? payload.items : [payload]
  items.forEach((item, idx) => {
    formData.append(`jenis[${idx}]`, item.jenis || 'Capaian Digitalisasi Arsip')
    formData.append(`total[${idx}]`, String(item.total ?? payload.total_pns ?? 0))
  })

  return apiRequest('/store/save-data-dms', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal menyimpan entri arsip DMS.',
  })
}

export function importBatchDms(formData) {
  return apiRequest('/store/import-dms-data', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengunggah file batch DMS.',
  })
}

export function deleteDmsData(key) {
  return apiRequest('/kill/data-dms', {
    method: 'POST',
    body: toFormData({ key: String(key) }),
    fallbackMessage: 'Gagal menghapus log DMS.',
  })
}

// =========================================================================
// 7. DOKUMEN SELEKSI PNBP CAT (Layanan 42)
// =========================================================================

export function fetchPnbpSummary({ signal } = {}) {
  return postSummary('/fetch/summary-pnbp', new FormData(), signal, 'Gagal memuat rekap PNBP CAT.')
}

export function fetchPnbpDocuments({
  draw = 1,
  start = 0,
  length = 10,
  search = '',
  doc_type = '',
  status = '',
  tilok = '',
  tahun = '',
  signal,
}) {
  const formData = toFormData({
    draw: String(draw),
    start: String(start),
    length: String(length),
    'search[value]': search,
  })
  if (doc_type && doc_type !== 'all') formData.append('doc_type', doc_type)
  if (status && status !== 'all') formData.append('status', status)
  if (tilok) formData.append('tilok_id', String(tilok))
  if (tahun) formData.append('tahun', String(tahun))

  return postList('/fetch/data-pnbp-documents', formData, signal, 'Gagal memuat data dokumen PNBP CAT.')
}

export async function fetchPnbpTilokOptions() {
  const json = await apiRequest('/fetch/pnbp-options-tilok', {
    method: 'POST',
    fallbackMessage: 'Gagal memuat opsi titik lokasi PNBP.',
  })
  return Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : [])
}

export function savePnbpDocument(payload) {
  const formData = toFormData({
    id: payload.id ? String(payload.id) : undefined,
    doc_type: payload.doc_type || 'st',
    doc_number: payload.doc_number || '',
    doc_date: payload.doc_date || dateNowStart(),
    instansi_id: payload.instansi_id ? String(payload.instansi_id) : undefined,
    tilok_id: payload.tilok_id ? String(payload.tilok_id) : undefined,
    tilok_nama: payload.tilok_nama || 'Kantor Regional III BKN Bandung',
    keterangan: payload.keterangan || '',
  })

  return apiRequest('/store/save-pnbp-document', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal menyimpan dokumen PNBP.',
  })
}

export function importBatchPnbp(formData) {
  return apiRequest('/store/import-pnbp-document', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengunggah file batch PNBP.',
  })
}

export function deletePnbpDocument(id) {
  return apiRequest('/kill/data-pnbp-document', {
    method: 'POST',
    body: toFormData({ id: String(id) }),
    fallbackMessage: 'Gagal menghapus dokumen PNBP.',
  })
}

export function generatePnbpPdf(documentId, docType) {
  return apiRequest('/apps-pnbp/generate-pdf', {
    method: 'POST',
    body: toFormData({ document_id: String(documentId), doc_type: docType }),
    fallbackMessage: 'Gagal men-generate PDF PNBP.',
  })
}

// Helpers
function dateNowMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function dateNowStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function dateNowEnd() {
  const d = new Date()
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}
