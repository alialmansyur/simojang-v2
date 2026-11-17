/**
 * SIDIGI - Fasilitasi Computer Assisted Test (CAT) Services API Client
 * Kantor Regional III BKN Bandung
 * Layanan ID: 28 (Fasilitasi Seleksi Metode CAT)
 * 100% Real Production Data Client (Zero Mockup / Dummy Data)
 */
import { ApiError, apiRequest } from '../api'

function toFormData(fields = {}) {
  const formData = new FormData()
  Object.entries(fields).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (Array.isArray(v)) {
      v.forEach((item) => formData.append(`${k}[]`, String(item)))
    } else if (v instanceof Blob) {
      formData.append(k, v)
    } else {
      formData.append(k, String(v))
    }
  })
  return formData
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '' && v !== 'all') {
      qs.set(k, String(v).trim())
    }
  })
  const str = qs.toString()
  return str ? `?${str}` : ''
}

function mapSeleksiOption(item) {
  return {
    id: String(item.seleksi_id || item.id),
    uid: item.uid || '',
    seleksi_id: String(item.seleksi_id || item.id),
    jenis_tes_id: item.jenis_tes_id ? String(item.jenis_tes_id) : '',
    jenis_tes_kode: item.jenis_tes_kode || '',
    nama_seleksi: item.nama_seleksi,
    periode: item.periode,
    jenis_tes: item.jenis_tes,
  }
}

async function openOrDownloadPdfBlob(path, fileName, download, fallbackMessage) {
  const blob = await apiRequest(path, {
    method: 'GET',
    responseType: 'blob',
    fallbackMessage,
  })
  const url = URL.createObjectURL(blob)
  if (download) {
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

// -------------------------------------------------------------
// 1. JENIS TES BESAR PERIODE TAHUNAN (Level 1 Workspace)
// -------------------------------------------------------------

export async function fetchCatJenisPeriodeList(tahun = '') {
  const json = await apiRequest('/fetch/jenis-periode-cat', {
    method: 'POST',
    body: toFormData(tahun ? { tahun } : {}),
    fallbackMessage: 'Gagal memuat daftar jenis tes CAT.',
  })
  return Array.isArray(json?.data) ? json.data : []
}

export async function fetchCatMasterJenisTes(search = '') {
  const json = await apiRequest(`/api/apps-cat/events?search=${encodeURIComponent(search)}`, {
    method: 'GET',
    fallbackMessage: 'Gagal memuat referensi master jenis tes.',
  })
  return Array.isArray(json?.data) ? json.data : []
}

export function createCatJenisTes({ kode, nama }) {
  return apiRequest('/api/apps-cat/events', {
    method: 'POST',
    body: toFormData({ kode, nama }),
    fallbackMessage: 'Gagal menambahkan jenis tes master.',
  })
}

export function createCatJenisPeriode({ jenis_tes_id, periode }) {
  return apiRequest('/store/save-data-seleksi-cat', {
    method: 'POST',
    body: toFormData({ jenis: jenis_tes_id, periode }),
    fallbackMessage: 'Gagal mendaftarkan jenis tes tahunan.',
  })
}

// -------------------------------------------------------------
// 2. TITIK LOKASI (TILOK) MANAGEMENT
// -------------------------------------------------------------

export async function fetchCatTilokList(jenis_periode_id = '', period = '', seleksi_id = '') {
  const json = await apiRequest('/fetch/data-tilok-cat', {
    method: 'POST',
    body: toFormData({
      jenis_periode_id: jenis_periode_id || undefined,
      period: period || undefined,
      seleksi_id: seleksi_id || undefined,
      start: 0,
      length: 1000,
    }),
    fallbackMessage: 'Gagal memuat daftar titik lokasi CAT.',
  })

  const rows = Array.isArray(json?.data) ? json.data : []
  return rows.map((item) => ({
    ...item,
    total_instansi: Number(item.total_instansi || 0),
    total_event: Number(item.total_event || 0),
    total_rekap: Number(item.total_rekap || 0),
    total_peserta: Number(item.total_peserta || 0),
    total_hadir: Number(item.total_hadir || 0),
  }))
}

export function saveCatTilok(data) {
  const fields = {
    action: data.key ? 'update' : 'create',
    jenis_periode_id: data.jenis_periode_id || '',
    seleksi_uid: data.seleksi_uid || '',
    jenis_tes_id: data.jenis_tes_id || '',
    period: data.period || new Date().getFullYear(),
    nama_tilok: data.nama_tilok || '',
    kapasitas: data.kapasitas || 0,
    startdate: data.startdate || '',
    enddate: data.enddate || '',
  }
  if (data.key) fields.key = data.key
  if (data.seleksi_id) fields.seleksi_id = data.seleksi_id

  return apiRequest('/store/save-data-tilok-cat', {
    method: 'POST',
    body: toFormData(fields),
    fallbackMessage: 'Gagal menyimpan data titik lokasi.',
  })
}

export function deleteCatTilok(key) {
  return apiRequest('/kill/data-tilok-cat', {
    method: 'POST',
    body: toFormData({ key }),
    fallbackMessage: 'Gagal menghapus titik lokasi.',
  })
}

// -------------------------------------------------------------
// 3. INSTANSI PER TILOK
// -------------------------------------------------------------

export async function fetchCatInstansiTilok(tilokUid, bulan = [], seleksi_id = '') {
  if (!tilokUid) return []

  const formData = toFormData({
    key: tilokUid,
    id: tilokUid,
    seleksi_id: seleksi_id || undefined,
  })
  if (Array.isArray(bulan) && bulan.length > 0) {
    bulan.forEach((b) => formData.append('bulan[]', b))
  }

  const json = await apiRequest('/fetch/instansi-tilok-cat', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal memuat instansi titik lokasi.',
  })

  const rawList = Array.isArray(json?.data) ? json.data : []
  return rawList.map((item) => ({
    id: item.instansi_id || item.id,
    instansi_id: item.instansi_id || item.id,
    nama: item.instansi_nama || item.nama || `Instansi ${item.instansi_id}`,
    kodeins: item.instansi_id || item.kodeins,
    total_sesi: Number(item.total_sesi || 0),
    total_peserta: Number(item.total_peserta || 0),
    total_hadir: Number(item.total_hadir || 0),
    total_tidak_hadir: Number(item.total_tidak_hadir || 0),
    last_update: item.last_update,
  }))
}

export function saveCatTilokInstansi({ tilok_id, instansi_id }) {
  return apiRequest('/store/save-data-tilok-instansi', {
    method: 'POST',
    body: toFormData({ tilok_id, key: tilok_id, instansi_id }),
    fallbackMessage: 'Gagal mendaftarkan instansi ke titik lokasi.',
  })
}

// -------------------------------------------------------------
// 4. EVENT / SUB-SELEKSI
// -------------------------------------------------------------

export function saveCatKegiatanSeleksi({ nama_seleksi, jenis_tes_id, periode }) {
  return apiRequest('/store/save-kegiatan-seleksi-cat', {
    method: 'POST',
    body: toFormData({
      nama_seleksi,
      jenis_tes_id,
      periode: periode || new Date().getFullYear(),
    }),
    fallbackMessage: 'Gagal menyimpan kegiatan seleksi.',
  })
}

export async function fetchCatSeleksiOptions(params = {}) {
  const jenisTesId = typeof params === 'object' ? params.jenis_tes_id : params
  const periode = typeof params === 'object' ? params.periode : ''
  const search = typeof params === 'object' ? params.search : ''
  const queryStr = buildQuery({ jenis_tes_id: jenisTesId, periode, search })

  const json = await apiRequest(`/fetch/seleksi-options-cat${queryStr}`, {
    method: 'GET',
    fallbackMessage: 'Gagal memuat opsi seleksi event.',
  })
  const raw = Array.isArray(json?.data) ? json.data : []
  return raw.map(mapSeleksiOption)
}

export async function fetchCatEventsByInstansi(tilokUid, instansiId) {
  const json = await apiRequest('/fetch/events-by-instansi-cat', {
    method: 'POST',
    body: toFormData({
      tilok_uid: tilokUid,
      key: tilokUid,
      id: tilokUid,
      instansi_id: instansiId,
    }),
    fallbackMessage: 'Gagal memuat event per instansi.',
  })
  const raw = Array.isArray(json?.data) ? json.data : []
  return raw.map(mapSeleksiOption)
}

// -------------------------------------------------------------
// 5. SESI & REKAP NILAI (Tabel Utama Entry Data)
// -------------------------------------------------------------

export async function fetchCatSessions({
  tilokUid,
  instansiId = '',
  seleksiId = '',
  tanggal = '',
  tgl_mulai = '',
  tgl_selesai = '',
  bulan = [],
  start = 0,
  length = 10,
  search = '',
}) {
  if (!tilokUid) {
    return { data: [], total: 0, filtered: 0 }
  }

  const formData = toFormData({
    key: tilokUid,
    id: tilokUid,
    instansi_id: instansiId || undefined,
    seleksi_id: seleksiId || undefined,
    tanggal: tanggal || undefined,
    tgl_mulai: tgl_mulai || undefined,
    tgl_selesai: tgl_selesai || undefined,
    start,
    length,
    'search[value]': search,
  })
  if (Array.isArray(bulan) && bulan.length > 0) {
    bulan.forEach((b) => formData.append('bulan[]', b))
  }

  const json = await apiRequest('/fetch/data-tilok-detail', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal memuat sesi ujian CAT.',
  })

  const rawRows = Array.isArray(json?.data) ? json.data : []
  const mappedData = rawRows.map((r) => ({
    id: r.id,
    uid: r.uid,
    seleksi_id: r.seleksi_id || null,
    jenis_tes_id: r.jenis_tes_id || null,
    period_date: r.period_date,
    sesi: Number(r.sesi || 1),
    tilok_nama: r.nama_tilok || r.tilok_nama || '',
    nama_tilok: r.nama_tilok || r.tilok_nama || '',
    instansi_nama: r.instansi_nama || `Instansi ${r.instansi_id}`,
    instansi_id: r.instansi_id,
    instansi_logo: r.instansi_logo || null,
    instansi_kodeins: r.instansi_kodeins || r.instansi_id,
    nama_seleksi: r.nama_seleksi || r.jenis_tes || 'Seleksi CAT',
    kuota: Number(r.hadir || 0) + Number(r.tidak_hadir || 0),
    hadir: Number(r.hadir || 0),
    tidak_hadir: Number(r.tidak_hadir || 0),
    nilai_min: r.nilai_min !== null && r.nilai_min !== undefined ? String(r.nilai_min) : '-',
    nilai_max: r.nilai_max !== null && r.nilai_max !== undefined ? String(r.nilai_max) : '-',
    memenuhi: Number(r.memenuhi || 0),
    tidak_memenuhi: Number(r.tidak_memenuhi || 0),
    reschedule: Number(r.reschedule || 0),
    scema_group: r.scema_group || null,
    is_batch: typeof r.scema_group === 'string' && r.scema_group.startsWith('batch_'),
    created_by: r.created_by || '-',
    created_at: r.created_at || '-',
  }))

  return {
    data: mappedData,
    total: Number(json?.recordsTotal || json?.total || rawRows.length),
    filtered: Number(json?.recordsFiltered || json?.filtered || rawRows.length),
    summary: json?.summary_stat || null,
  }
}

export async function fetchCatSessionSummary({ tilokUid, instansiId = '', seleksiId = '', tglMulai = '', tglSelesai = '' }) {
  if (!tilokUid) return null

  const formData = toFormData({
    key: tilokUid,
    id: tilokUid,
    seleksi_id: seleksiId || undefined,
    tgl_mulai: tglMulai || undefined,
    tgl_selesai: tglSelesai || undefined,
  })
  if (Array.isArray(instansiId)) {
    instansiId.filter(Boolean).forEach((id) => formData.append('instansi_id[]', id))
  } else if (instansiId) {
    formData.append('instansi_id', instansiId)
  }

  const json = await apiRequest('/fetch/summary-tilok-detail', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal memuat ringkasan KPI sesi.',
  })

  const s = json?.summary || json?.data || json || {}
  return {
    total_sesi: Number(s.total_rekap || s.total_sesi || 0),
    total_hadir: Number(s.total_hadir || 0),
    total_tidak_hadir: Number(s.total_tidak_hadir || 0),
    total_peserta: Number(s.total_peserta || 0),
    skor_min: s.min_nilai ?? s.skor_min ?? '-',
    skor_max: s.max_nilai ?? s.skor_max ?? '-',
    last_update: s.last_update || '-',
  }
}

export function saveCatSessionMultiRow({
  key,
  seleksi_id,
  jenis_tes_id,
  rows,
}) {
  const formData = toFormData({
    key,
    tilok_id: key,
    seleksi_id: seleksi_id || '1',
    jenis_tes_id: jenis_tes_id || '1',
  })

  rows.forEach((r) => {
    formData.append('instansi[]', r.instansi)
    formData.append('tanggal[]', r.tanggal)
    formData.append('sesi[]', r.sesi)
    formData.append('hadir[]', r.hadir || 0)
    formData.append('tidak_hadir[]', r.tidak_hadir || 0)
    formData.append('nilai_min[]', r.nilai_min || 0)
    formData.append('nilai_max[]', r.nilai_max || 0)
    formData.append('memenuhi[]', r.memenuhi || 0)
    formData.append('tidak_memenuhi[]', r.tidak_memenuhi || 0)
    formData.append('reschedule[]', r.reschedule || 0)
  })

  return apiRequest('/store/save-data-tilok-rekap', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal menyimpan rekap sesi ujian CAT.',
  })
}

export function updateCatSession(data) {
  const fields = {
    key: data.id || data.key || data.uid,
    instansi: data.instansi || data.instansi_id,
    tanggal: data.tanggal || data.period_date,
    sesi: data.sesi,
    hadir: data.hadir ?? 0,
    tidak_hadir: data.tidak_hadir ?? 0,
    reschedule: data.reschedule ?? 0,
    nilai_min: data.nilai_min !== '-' && data.nilai_min !== '' ? data.nilai_min : 0,
    nilai_max: data.nilai_max !== '-' && data.nilai_max !== '' ? data.nilai_max : 0,
  }
  if (data.memenuhi !== undefined) fields.memenuhi = data.memenuhi
  if (data.tidak_memenuhi !== undefined) fields.tidak_memenuhi = data.tidak_memenuhi

  return apiRequest('/store/update-data-hasil-cat', {
    method: 'POST',
    body: toFormData(fields),
    fallbackMessage: 'Gagal memperbarui data sesi ujian.',
  })
}

export function deleteCatSession(id) {
  return apiRequest('/kill/data-tilok-rekap', {
    method: 'POST',
    body: toFormData({ key: id, id }),
    fallbackMessage: 'Gagal menghapus data sesi ujian CAT.',
  })
}

// -------------------------------------------------------------
// 6. UPLOAD DATA BATCH EXCEL
// -------------------------------------------------------------

export function importCatBatchExcel(formData) {
  return apiRequest('/store/import-data-cat', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengimpor data sesi CAT dari Excel.',
  })
}

// -------------------------------------------------------------
// 7. ROLE & PENGELOLA ACCESS GATE (Limited NIP)
// -------------------------------------------------------------

export const CAT_AUTHORIZED_NIP_LIST = [
  '199707252024211004',
  '198707302008122001',
  '199612052024211008',
  '199011092022032007',
  '199506062024212040',
  '199509302024212031',
]
export const CAT_PENGELOLA_NIP_WHITELIST = CAT_AUTHORIZED_NIP_LIST

export function checkCatPengelolaAccess(user) {
  if (!user) return false
  const nip = String(user.nip || user.username || '').trim()
  if (!nip) return false
  return CAT_AUTHORIZED_NIP_LIST.includes(nip)
}
export const checkIsCatPengelola = checkCatPengelolaAccess

export async function fetchCatPengelolaAccess() {
  const json = await apiRequest('/api/apps-cat/pengelola/access', {
    method: 'GET',
    fallbackMessage: 'Gagal memverifikasi akses Pengelola CAT.',
  })

  return {
    authorized: Boolean(json?.authorized),
    nip: String(json?.nip || ''),
    whitelist: Array.isArray(json?.data) ? json.data : [],
  }
}

export async function addCatPengelolaNip({ nip, nama = '', keterangan = '' }) {
  const json = await apiRequest('/api/apps-cat/pengelola', {
    method: 'POST',
    body: toFormData({
      nip: String(nip || '').trim(),
      nama: nama ? String(nama).trim() : undefined,
      keterangan: keterangan ? String(keterangan).trim() : undefined,
    }),
    fallbackMessage: 'Gagal menambahkan NIP Pengelola CAT.',
  })

  return Array.isArray(json?.data) ? json.data : []
}

export async function removeCatPengelolaNip(nip) {
  const json = await apiRequest('/api/apps-cat/pengelola/delete', {
    method: 'POST',
    body: toFormData({ nip: String(nip || '').trim() }),
    fallbackMessage: 'Gagal menghapus NIP Pengelola CAT.',
  })

  return Array.isArray(json?.data) ? json.data : []
}

// -------------------------------------------------------------
// 8. LAPORAN GENERATOR DATA
// -------------------------------------------------------------

export async function fetchCatLaporanReport({
  jenis_periode_id = '',
  tilok_id = '',
  instansi_id = '',
  tgl_mulai = '',
  tgl_selesai = '',
}) {
  const tilokList = await fetchCatTilokList(jenis_periode_id)
  const targetTilok = tilok_id
    ? tilokList.filter((t) => String(t.id) === String(tilok_id) || t.uid === tilok_id)
    : tilokList

  const results = await Promise.all(
    targetTilok.slice(0, 5).map((t) =>
      fetchCatSessions({
        tilokUid: t.uid || t.id,
        instansiId: instansi_id,
        length: 200,
      })
    )
  )

  const allSessions = results.flatMap((res) => (Array.isArray(res?.data) ? res.data : []))

  let filtered = allSessions
  if (tgl_mulai) {
    filtered = filtered.filter((s) => s.period_date >= tgl_mulai)
  }
  if (tgl_selesai) {
    filtered = filtered.filter((s) => s.period_date <= tgl_selesai)
  }

  const totalHadir = filtered.reduce((acc, cur) => acc + Number(cur.hadir || 0), 0)
  const totalTidakHadir = filtered.reduce((acc, cur) => acc + Number(cur.tidak_hadir || 0), 0)

  return {
    total_sesi: filtered.length,
    total_hadir: totalHadir,
    total_tidak_hadir: totalTidakHadir,
    total_peserta: totalHadir + totalTidakHadir,
    sessions: filtered,
  }
}

// -------------------------------------------------------------
// 9. PENGELOLA CAT: HUB, JADWAL, TIM, DOKUMEN (9 PNBP), MANAJEMEN DATA & SIGNERS
// -------------------------------------------------------------

async function requestCatPengelolaJson(endpoint, { method = 'GET', body = null, fallbackMessage = 'Permintaan gagal diproses' } = {}) {
  try {
    return await apiRequest(endpoint, {
      method,
      body: method !== 'GET' ? body : undefined,
      fallbackMessage,
    })
  } catch (err) {
    if (err instanceof ApiError) {
      err.conflicts = Array.isArray(err.details?.conflicts) ? err.details.conflicts : []
    }
    throw err
  }
}

function postCatPengelolaForm(endpoint, fields = {}, fallbackMessage = 'Permintaan gagal diproses') {
  return apiRequest(endpoint, {
    method: 'POST',
    body: toFormData(fields),
    fallbackMessage,
  })
}

export function updateCatJenisTes({ id, kode, nama }) {
  return postCatPengelolaForm('/api/apps-cat/events/update', { id, kode, nama }, 'Gagal memperbarui event CAT.')
}

export function deleteCatJenisTes(id) {
  return postCatPengelolaForm('/api/apps-cat/events/delete', { id }, 'Gagal menghapus event CAT.')
}

export async function fetchCatInstansiMasterOptions(keyword = '') {
  const json = await postCatPengelolaForm('/fetch/pnbp-options-instansi', { q: keyword }, 'Gagal memuat daftar instansi.')
  return Array.isArray(json?.data) ? json.data : []
}

export async function fetchCatPengelolaSummary() {
  const json = await requestCatPengelolaJson('/api/apps-cat/pengelola/summary', {
    fallbackMessage: 'Gagal memuat ringkasan Pengelola CAT.',
  })
  return json?.data || {}
}

export async function fetchCatPengelolaJadwal(params = {}) {
  const json = await requestCatPengelolaJson(`/api/apps-cat/pengelola/jadwal${buildQuery(params)}`, {
    fallbackMessage: 'Gagal memuat jadwal kegiatan CAT.',
  })
  return {
    rows: Array.isArray(json?.data) ? json.data : [],
    summary: json?.summary || {},
  }
}

export async function fetchCatPengelolaJadwalDetail(idOrUid) {
  const json = await requestCatPengelolaJson(`/api/apps-cat/pengelola/jadwal/detail/${encodeURIComponent(idOrUid)}`, {
    fallbackMessage: 'Gagal memuat detail jadwal CAT.',
  })
  return json?.data || null
}

export function saveCatPengelolaJadwal(payload) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/jadwal', {
    method: 'POST',
    body: payload,
    fallbackMessage: 'Gagal menyimpan jadwal CAT.',
  })
}

export function linkCatPengelolaJadwalSt(payload) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/jadwal/link-st', {
    method: 'POST',
    body: payload,
    fallbackMessage: 'Gagal menautkan Surat Tugas ke jadwal.',
  })
}

export function deleteCatPengelolaJadwal(idOrUid) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/jadwal/delete', {
    method: 'POST',
    body: { uid: idOrUid },
    fallbackMessage: 'Gagal menghapus jadwal CAT.',
  })
}

export async function fetchCatPengelolaTim(params = {}) {
  const json = await requestCatPengelolaJson(`/api/apps-cat/pengelola/tim${buildQuery(params)}`, {
    fallbackMessage: 'Gagal memuat daftar tim fasilitasi CAT.',
  })
  return {
    rows: Array.isArray(json?.data) ? json.data : [],
    summary: json?.summary || {},
  }
}

export function saveCatPengelolaTim(payload) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/tim', {
    method: 'POST',
    body: payload,
    fallbackMessage: 'Gagal menyimpan anggota tim fasilitasi CAT.',
  })
}

export function deleteCatPengelolaTim(id) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/tim/delete', {
    method: 'POST',
    body: { id },
    fallbackMessage: 'Gagal menghapus anggota tim CAT.',
  })
}

export async function fetchCatPengelolaDocTypes(params = {}) {
  const json = await requestCatPengelolaJson(`/api/apps-cat/pengelola/dokumen/types${buildQuery(params)}`, {
    fallbackMessage: 'Gagal memuat katalog dokumen CAT.',
  })
  const rawList = Array.isArray(json?.data)
    ? json.data
    : json?.data && typeof json.data === 'object'
      ? Object.values(json.data)
      : []

  const types = rawList.map((item) => ({
    ...item,
    code: String(item?.code || item?.doc_type || ''),
  }))

  return {
    types,
    summary: json?.summary || {},
  }
}

export async function fetchCatPengelolaDocuments(params = {}) {
  const json = await requestCatPengelolaJson(`/api/apps-cat/pengelola/dokumen${buildQuery(params)}`, {
    fallbackMessage: 'Gagal memuat daftar dokumen pendukung CAT.',
  })
  return {
    rows: Array.isArray(json?.data) ? json.data : [],
    total: Number(json?.total || 0),
    page: Number(json?.page || 1),
    limit: Number(json?.limit || 50),
    summary: json?.summary || {},
    docTypeMeta: json?.doc_type_meta || null,
  }
}

export async function fetchCatPengelolaDocumentDetail(uid) {
  const json = await requestCatPengelolaJson(`/api/apps-cat/pengelola/dokumen/detail/${encodeURIComponent(uid)}`, {
    fallbackMessage: 'Gagal memuat detail parameter dokumen.',
  })
  return {
    doc: json?.data || null,
    docTypeMeta: json?.doc_type_meta || null,
  }
}

export function saveCatPengelolaDocument(payload) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/dokumen', {
    method: 'POST',
    body: payload,
    fallbackMessage: 'Gagal menyimpan parameter dokumen.',
  })
}

export function syncCatPengelolaTimToDocument({ document_uid, jadwal_id }) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/dokumen/sync-tim', {
    method: 'POST',
    body: { document_uid, jadwal_id },
    fallbackMessage: 'Gagal menarik daftar tim dari jadwal.',
  })
}

export function uploadCatPengelolaDocument(formData) {
  return apiRequest('/api/apps-cat/pengelola/dokumen/upload', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengunggah dokumen arsip PDF.',
  })
}

export function openCatPengelolaDocumentFileBlob(uid, download = false) {
  const suffix = download ? '?download=1' : ''
  return openOrDownloadPdfBlob(
    `/api/apps-cat/pengelola/dokumen/file/${encodeURIComponent(uid)}${suffix}`,
    `dokumen-cat-${uid}.pdf`,
    download,
    'Berkas PDF dokumen belum tersedia.'
  )
}

export function deleteCatPengelolaDocument(uid) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/dokumen/delete', {
    method: 'POST',
    body: { uid },
    fallbackMessage: 'Gagal menghapus dokumen CAT.',
  })
}

export function saveCatPengelolaDocPersonel(payload) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/dokumen/personel', {
    method: 'POST',
    body: payload,
    fallbackMessage: 'Gagal menyimpan personel dokumen.',
  })
}

export function reorderCatPengelolaDocPersonel(document_uid, ordered_ids) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/dokumen/personel/reorder', {
    method: 'POST',
    body: { document_uid, ordered_ids },
    fallbackMessage: 'Gagal memperbarui urutan tim/personel.',
  })
}

export function deleteCatPengelolaDocPersonel(id, document_uid = '') {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/dokumen/personel/delete', {
    method: 'POST',
    body: { id, document_uid },
    fallbackMessage: 'Gagal menghapus personel dokumen.',
  })
}

export function saveCatPengelolaDocItem(payload) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/dokumen/items', {
    method: 'POST',
    body: payload,
    fallbackMessage: 'Gagal menyimpan item konsumsi/jamuan.',
  })
}

export function deleteCatPengelolaDocItem(id, document_uid = '') {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/dokumen/items/delete', {
    method: 'POST',
    body: { id, document_uid },
    fallbackMessage: 'Gagal menghapus item jamuan.',
  })
}

export function saveCatPengelolaDocSignatures(document_uid, signatures) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/dokumen/signatures', {
    method: 'POST',
    body: { document_uid, signatures },
    fallbackMessage: 'Gagal menyimpan pengesahan & penandatanganan dokumen.',
  })
}

export function saveCatPnbpHeader(fields) {
  return postCatPengelolaForm('/store/save-pnbp-header', fields, 'Gagal menyimpan keterangan header dokumen.')
}

export function saveCatPnbpPersonel(fields) {
  return postCatPengelolaForm('/store/save-pnbp-personel', fields, 'Gagal menyimpan personel dokumen.')
}

export function deleteCatPnbpPersonel(id) {
  return postCatPengelolaForm('/kill/data-pnbp-personel', { id }, 'Gagal menghapus personel dokumen.')
}

export function saveCatPnbpItem(fields) {
  return postCatPengelolaForm('/store/save-pnbp-items', fields, 'Gagal menyimpan item konsumsi/jamuan.')
}

export function deleteCatPnbpItem(id) {
  return postCatPengelolaForm('/kill/data-pnbp-item', { id }, 'Gagal menghapus item konsumsi/jamuan.')
}

export function saveCatPnbpSignersAll(fields) {
  return postCatPengelolaForm('/store/save-pnbp-signers-all', fields, 'Gagal menyimpan penandatangan dokumen.')
}

export function saveCatPnbpSignatureParam(fields) {
  return postCatPengelolaForm('/store/save-pnbp-signature-param', fields, 'Gagal menyimpan parameter penandatangan.')
}

export function deleteCatPnbpDocument(key) {
  return postCatPengelolaForm('/kill/data-pnbp-document', { key }, 'Gagal menghapus dokumen.')
}

export function generateCatPnbpPdf(uid) {
  return postCatPengelolaForm('/apps-pnbp/generate-pdf', { uid }, 'Gagal membuat PDF dokumen.')
}

export function openCatPnbpPdfBlob(uid, download = false) {
  const path = download ? `/apps-pnbp/download-pdf/${encodeURIComponent(uid)}` : `/apps-pnbp/preview-pdf/${encodeURIComponent(uid)}`
  return openOrDownloadPdfBlob(path, `dokumen-cat-${uid}.pdf`, download, 'PDF dokumen belum tersedia atau gagal diunduh.')
}

export async function fetchCatPengelolaRekapPegawai(params = {}) {
  const json = await requestCatPengelolaJson(`/api/apps-cat/pengelola/rekap-pegawai${buildQuery(params)}`, {
    fallbackMessage: 'Gagal memuat rekap beban tugas pegawai.',
  })
  return json?.data || { summary: {}, jenis_tes_columns: [], rows: [] }
}

export async function fetchCatPengelolaPegawaiOptions(search = '', limit = 50, unit_kerja_id = '') {
  const json = await requestCatPengelolaJson(`/api/apps-cat/pengelola/pegawai-options${buildQuery({ search, limit, unit_kerja_id })}`, {
    fallbackMessage: 'Gagal memuat daftar pegawai.',
  })
  return Array.isArray(json?.data) ? json.data : []
}

export async function fetchCatPengelolaUnitKerjaOptions() {
  const json = await requestCatPengelolaJson('/api/apps-cat/pengelola/unit-kerja-options', {
    fallbackMessage: 'Gagal memuat daftar tim kerja pegawai.',
  })
  return Array.isArray(json?.data) ? json.data : []
}

export async function fetchCatPengelolaSigners() {
  const json = await requestCatPengelolaJson('/api/apps-cat/pengelola/signers', {
    fallbackMessage: 'Gagal memuat master penandatangan.',
  })
  return Array.isArray(json?.data) ? json.data : []
}

export function saveCatPengelolaSigner(payload) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/signers', {
    method: 'POST',
    body: payload,
    fallbackMessage: 'Gagal menyimpan master penandatangan.',
  })
}

export function deleteCatPengelolaSigner(id) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/signers/delete', {
    method: 'POST',
    body: { id },
    fallbackMessage: 'Gagal menghapus master penandatangan.',
  })
}

export async function fetchCatPengelolaMasterJenisPeriode(params = {}) {
  const json = await requestCatPengelolaJson(
    `/api/apps-cat/pengelola/master/jenis-periode${buildQuery(params)}`,
    { fallbackMessage: 'Gagal memuat master jenis tes per tahun.' }
  )
  return Array.isArray(json?.data) ? json.data : []
}

export function saveCatPengelolaMasterJenisPeriode(payload) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/master/jenis-periode', {
    method: 'POST',
    body: payload,
    fallbackMessage: 'Gagal menyimpan master jenis tes per tahun.',
  })
}

export function deleteCatPengelolaMasterJenisPeriode(idOrUid) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/master/jenis-periode/delete', {
    method: 'POST',
    body: { id: idOrUid },
    fallbackMessage: 'Gagal menghapus master jenis tes per tahun.',
  })
}

export async function fetchCatPengelolaMasterKegiatan(params = {}) {
  const json = await requestCatPengelolaJson(
    `/api/apps-cat/pengelola/master/kegiatan${buildQuery(params)}`,
    { fallbackMessage: 'Gagal memuat master kegiatan seleksi.' }
  )
  return Array.isArray(json?.data) ? json.data : []
}

export function saveCatPengelolaMasterKegiatan(payload) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/master/kegiatan', {
    method: 'POST',
    body: payload,
    fallbackMessage: 'Gagal menyimpan master kegiatan seleksi.',
  })
}

export function deleteCatPengelolaMasterKegiatan(idOrUid) {
  return requestCatPengelolaJson('/api/apps-cat/pengelola/master/kegiatan/delete', {
    method: 'POST',
    body: { id: idOrUid },
    fallbackMessage: 'Gagal menghapus master kegiatan seleksi.',
  })
}

export async function fetchCatPengelolaMasterTilok(params = {}) {
  const json = await requestCatPengelolaJson(
    `/api/apps-cat/pengelola/master/tilok${buildQuery(params)}`,
    { fallbackMessage: 'Gagal memuat master titik lokasi CAT.' }
  )
  return Array.isArray(json?.data) ? json.data : []
}

// -------------------------------------------------------------
// 7. LAYANAN LAPORAN CAT & PERSISTENT USER SIGNERS
// -------------------------------------------------------------

export async function fetchCatLaporanList(params = {}) {
  const json = await apiRequest(`/api/apps-cat/laporan${buildQuery(params)}`, {
    method: 'GET',
    fallbackMessage: 'Gagal memuat daftar riwayat laporan CAT.',
  })
  return {
    rows: Array.isArray(json?.data) ? json.data : [],
    total: Number(json?.total ?? 0),
    page: Number(json?.page ?? 1),
    limit: Number(json?.limit ?? 20),
    summary: json?.summary || {},
  }
}

export async function fetchCatLaporanDetail(uid) {
  const json = await apiRequest(`/api/apps-cat/laporan/detail/${uid}`, {
    method: 'GET',
    fallbackMessage: 'Gagal memuat detail data laporan CAT.',
  })
  return json?.data || null
}

export function saveCatLaporan(payload) {
  return apiRequest('/api/apps-cat/laporan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    fallbackMessage: 'Gagal menyimpan laporan CAT.',
  })
}

export function deleteCatLaporan(uid) {
  return apiRequest('/api/apps-cat/laporan/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid }),
    fallbackMessage: 'Gagal menghapus laporan CAT.',
  })
}

export async function fetchCatUserSigners(params = {}) {
  const json = await apiRequest(`/api/apps-cat/laporan/user-signers${buildQuery(params)}`, {
    method: 'GET',
    fallbackMessage: 'Gagal memuat profil penandatangan pegawai.',
  })
  return json?.data || { kiri: null, tengah: null, kanan: null }
}

export function saveCatUserSigner(payload) {
  return apiRequest('/api/apps-cat/laporan/user-signers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    fallbackMessage: 'Gagal menyimpan profil tanda tangan pegawai.',
  })
}

export function resetCatUserSigner(params = {}) {
  return apiRequest('/api/apps-cat/laporan/user-signers/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    fallbackMessage: 'Gagal mereset tanda tangan pegawai.',
  })
}

