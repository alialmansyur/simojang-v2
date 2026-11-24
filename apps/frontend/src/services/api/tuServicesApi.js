/**
 * Tata Usaha (TU) Services API Client
 * Kantor Regional III BKN Bandung
 * Melayani 12 Layanan di bawah Tim Kerja Tata Usaha (Tim Kerja ID: 6)
 */
import { apiRequest } from '../api'

function toFormData(payload = {}) {
  if (payload instanceof FormData) return payload
  const fd = new FormData()
  if (payload && typeof payload === 'object') {
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      if (Array.isArray(v)) {
        v.forEach((item) => fd.append(`${k}[]`, item ?? ''))
      } else {
        fd.append(k, v instanceof Blob ? v : String(v))
      }
    })
  }
  return fd
}

async function postSummary(path, body = new FormData(), fallbackMessage = 'Gagal memuat ringkasan.') {
  const json = await apiRequest(path, { method: 'POST', body, fallbackMessage })
  return json?.summary || json?.data || null
}

async function postList(path, params = {}, extra = {}, fallbackMessage = 'Gagal memuat daftar data.') {
  const fd = toFormData({
    start: params.start ?? 0,
    length: params.length ?? 10,
    'search[value]': params.search || '',
    ...extra,
  })
  const json = await apiRequest(path, {
    method: 'POST',
    body: fd,
    signal: params.signal,
    fallbackMessage,
  })
  return {
    data: json?.data || [],
    recordsTotal: json?.recordsTotal || 0,
    recordsFiltered: json?.recordsFiltered || 0,
  }
}

function postSimpleSummary(path, filters = {}, fallbackMessage) {
  const fd = new FormData()
  if (filters.bulan && filters.bulan.length) fd.append('bulan', filters.bulan.join(','))
  return postSummary(path, fd, fallbackMessage)
}

function deleteByKey(path, key, fallbackMessage) {
  return apiRequest(path, {
    method: 'POST',
    body: toFormData({ key }),
    fallbackMessage,
  })
}

// =========================================================================
// 01. LAYANAN 29 — PAGU & REALISASI ANGGARAN
// =========================================================================
export function fetchAnggaranSummary(filters = {}) {
  const fd = toFormData({
    tahun: filters.tahun || undefined,
    date_mode: filters.date_mode || undefined,
    date_start: filters.date_start || undefined,
    date_end: filters.date_end || undefined,
  })
  return postSummary('/fetch/summary-anggaran', fd, 'Gagal memuat ringkasan anggaran.')
}

export function fetchAnggaranData(params = {}) {
  const extra = {
    ...(params.tahun ? { tahun: params.tahun } : {}),
    ...(params.date_mode ? { date_mode: params.date_mode } : {}),
    ...(params.date_start ? { date_start: params.date_start } : {}),
    ...(params.date_end ? { date_end: params.date_end } : {}),
    ...(params.status ? { status: params.status } : {}),
  }
  return postList('/fetch/data-anggaran', params, extra, 'Gagal memuat data anggaran.')
}

export async function fetchAnggaranOptions(tahun = '', realisasiId = '') {
  const fd = toFormData({
    ...(tahun ? { tahun } : {}),
    ...(realisasiId ? { realisasi_id: realisasiId } : {}),
  })
  const json = await apiRequest('/fetch/options-anggaran', {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal memuat opsi anggaran.',
  })
  return json?.data || json || {}
}

export async function fetchAnggaranSettings(tahunMaster = '') {
  const fd = toFormData({
    ...(tahunMaster ? { tahun_master: tahunMaster } : {}),
  })
  const json = await apiRequest('/fetch/settings-anggaran', {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal memuat konfigurasi master anggaran.',
  })
  return json || {}
}

export async function fetchAnggaranStrukturSelect(search = '', tahun = '', limit = 1000) {
  const fd = toFormData({
    search: search || undefined,
    tahun: tahun || undefined,
    limit: limit || 1000,
  })
  const json = await apiRequest('/fetch/select2-struktur-anggaran', {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal memuat struktur anggaran.',
  })
  return json?.results || []
}

export async function fetchAnggaranDetail(key) {
  const json = await apiRequest('/fetch/detail-anggaran', {
    method: 'POST',
    body: toFormData({ key }),
    fallbackMessage: 'Gagal memuat rincian anggaran.',
  })
  return json?.data || null
}

export function storeAnggaranData(formData) {
  let fd
  if (formData instanceof FormData) {
    fd = formData
  } else {
    fd = new FormData()
    if (typeof formData === 'object' && formData !== null) {
      Object.entries(formData).forEach(([k, v]) => {
        if (k === 'items' && Array.isArray(v)) {
          v.forEach((item) => {
            fd.append('item_struktur_id[]', item.struktur_id || item.id || '')
            fd.append('item_nominal[]', item.nominal || 0)
            fd.append('item_keterangan[]', item.keterangan || '')
          })
        } else {
          fd.append(k, v ?? '')
        }
      })
    }
  }

  return apiRequest('/store/save-data-anggaran', {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal menyimpan data anggaran.',
  })
}

export function deleteAnggaranData(id) {
  return deleteByKey('/kill/data-anggaran', id, 'Gagal menghapus data anggaran.')
}

export function storeTahunAnggaran(data) {
  return apiRequest('/store/save-tahun-anggaran', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan tahun anggaran.',
  })
}

export function deleteTahunAnggaran(id) {
  return deleteByKey('/kill/tahun-anggaran', id, 'Gagal menghapus tahun anggaran.')
}

export function storeStrukturAnggaran(data) {
  return apiRequest('/store/save-struktur-anggaran', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan struktur anggaran.',
  })
}

export function deleteStrukturAnggaran(id) {
  return deleteByKey('/kill/struktur-anggaran', id, 'Gagal menghapus struktur anggaran.')
}

export function getAnggaranExportUrl(filters = {}) {
  const params = new URLSearchParams()
  if (filters.tahun) params.append('tahun', filters.tahun)
  if (filters.date_mode) params.append('date_mode', filters.date_mode)
  if (filters.date_start) params.append('date_start', filters.date_start)
  if (filters.date_end) params.append('date_end', filters.date_end)
  if (filters.search) params.append('search', filters.search)
  const qs = params.toString()
  return `/export/excel-anggaran${qs ? `?${qs}` : ''}`
}

// =========================================================================
// 02. LAYANAN 30 — HASIL SURVEY IKM
// =========================================================================
export function fetchIkmSummary(filters = {}) {
  return postSimpleSummary('/fetch/summary-ikm', filters, 'Gagal memuat ringkasan survey IKM.')
}

export function fetchIkmData(params = {}) {
  return postList('/fetch/data-ikm', params, {}, 'Gagal memuat data survey IKM.')
}

export function storeIkmData(data) {
  return apiRequest('/store/save-data-ikm', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan data survey IKM.',
  })
}

export function deleteIkmData(id) {
  return deleteByKey('/kill/data-ikm', id, 'Gagal menghapus data survey IKM.')
}

// =========================================================================
// 03. LAYANAN 31 — KEHUMASAN & PUBLIKASI
// =========================================================================
export function fetchHumasSummary(filters = {}) {
  return postSimpleSummary('/fetch/summary-humas', filters, 'Gagal memuat ringkasan kehumasan.')
}

export function fetchHumasData(params = {}) {
  return postList('/fetch/data-humas', params, {}, 'Gagal memuat data kehumasan.')
}

export function storeHumasData(data) {
  return apiRequest('/store/save-data-humas', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan data kehumasan.',
  })
}

export function deleteHumasData(id) {
  return deleteByKey('/kill/data-humas', id, 'Gagal menghapus data kehumasan.')
}

// =========================================================================
// 04. LAYANAN 32 — PENGELOLAAN PERSURATAN
// =========================================================================
export function fetchSuratSummary(filters = {}) {
  const fd = new FormData()
  if (filters.bulan && filters.bulan.length) fd.append('bulan', filters.bulan.join(','))
  if (filters.jenis_id) fd.append('jenis_id', filters.jenis_id)
  return postSummary('/fetch/summary-surat', fd, 'Gagal memuat ringkasan persuratan.')
}

export function fetchSuratData(params = {}) {
  const extra = {}
  if (params.jenis_id) extra.jenis_id = params.jenis_id
  if (params.kategori) extra.jenis_id = params.kategori
  if (params.bulan && params.bulan.length) extra.bulan = params.bulan
  return postList('/fetch/data-surat', params, extra, 'Gagal memuat data persuratan.')
}

export async function fetchJenisNaskahList() {
  try {
    const json = await apiRequest('/jenis-naskah-list', {
      method: 'POST',
      fallbackMessage: 'Gagal memuat daftar jenis naskah.',
    })
    return Array.isArray(json) ? json : (json?.data || [])
  } catch (err) {
    console.warn('Fallback jenis naskah:', err)
    return [
      { id: '1', value: '1', label: 'Surat Masuk', kode: 'SM', nama: 'Surat Masuk' },
      { id: '2', value: '2', label: 'Surat Keluar', kode: 'SK', nama: 'Surat Keluar' },
    ]
  }
}

export async function fetchNaskahList(jenisId = null) {
  try {
    const fd = new FormData()
    if (jenisId) fd.append('jenis_id', jenisId)
    const json = await apiRequest('/naskah-list', {
      method: 'POST',
      body: fd,
      fallbackMessage: 'Gagal memuat daftar klasifikasi naskah.',
    })
    return Array.isArray(json) ? json : (json?.data || [])
  } catch (err) {
    console.warn('Fallback naskah list:', err)
    return []
  }
}

export function storeSuratData(data) {
  return apiRequest('/store/save-data-surat', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan data persuratan.',
  })
}

export function deleteSuratData(id) {
  return deleteByKey('/kill/data-surat', id, 'Gagal menghapus data persuratan.')
}

// =========================================================================
// 05. LAYANAN 33 — PELAYANAN KONSULTASI
// =========================================================================
export function fetchKonsulSummary(filters = {}) {
  return postSimpleSummary('/fetch/summary-konsultasi', filters, 'Gagal memuat ringkasan konsultasi.')
}

export function fetchKonsulData(params = {}) {
  return postList('/fetch/data-konsultasi', params, {}, 'Gagal memuat data konsultasi.')
}

export function storeKonsulData(data) {
  return apiRequest('/store/save-data-konsultasi', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan data konsultasi.',
  })
}

export function deleteKonsulData(id) {
  return deleteByKey('/kill/data-konsultasi', id, 'Gagal menghapus data konsultasi.')
}

// =========================================================================
// 06. LAYANAN 34 — ANALISA KINERJA PELAKSANAAN ANGGARAN (IKPA)
// =========================================================================
export function fetchIkpaSummary() {
  return postSummary('/fetch/summary-ikpa', new FormData(), 'Gagal memuat ringkasan IKPA.')
}

export function fetchIkpaData(params = {}) {
  return postList('/fetch/data-ikpa', params, {}, 'Gagal memuat data IKPA.')
}

export function fetchIkpaDetail(id) {
  return apiRequest('/fetch/detail-ikpa', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal memuat rincian IKPA.',
  })
}

export function storeIkpaBatch(formData) {
  return apiRequest('/store/import-ikpa-data', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengimpor berkas IKPA.',
  })
}

export function deleteIkpaData(id) {
  return deleteByKey('/kill/data-ikpa', id, 'Gagal menghapus data IKPA.')
}

// =========================================================================
// 07. LAYANAN 35 — STATISTIK KEPEGAWAIAN INTERNAL
// =========================================================================
export async function fetchStatistikPegawaiSummary(params = {}) {
  const fd = toFormData({
    mode: params.mode || undefined,
    unit: params.unit ? (Array.isArray(params.unit) ? params.unit : [params.unit]) : undefined,
  })

  const [summaryJson, accumJson] = await Promise.all([
    apiRequest('/fetch/summary-statistik-internal', {
      method: 'POST',
      body: fd,
      fallbackMessage: 'Gagal memuat ringkasan pegawai internal.',
    }),
    apiRequest('/fetch/data-statistik-accum', {
      method: 'POST',
      body: { unit: Array.isArray(params.unit) ? params.unit : [] },
      fallbackMessage: 'Gagal memuat statistik demografi pegawai.',
    }),
  ])

  const summaryData = summaryJson?.summary || summaryJson?.data || {}
  const accumData = accumJson?.list || {}

  return {
    total_pegawai: accumData.total_pegawai ?? summaryData.total_data ?? 0,
    total_aktif: accumData.total_aktif ?? summaryData.total_aktif ?? 0,
    persen_aktif: accumData.persen_aktif ?? 0,
    total_nonaktif: accumData.total_nonaktif ?? summaryData.total_nonaktif ?? 0,
    persen_nonaktif: accumData.persen_nonaktif ?? 0,
    total_pria: accumData.total_pria ?? summaryData.total_pria ?? 0,
    persen_pria: accumData.persen_pria ?? 0,
    total_wanita: accumData.total_wanita ?? summaryData.total_wanita ?? 0,
    persen_wanita: accumData.persen_wanita ?? 0,
    total_menjelang_bup: accumData.total_menjelang_bup ?? summaryData.total_menjelang_bup ?? 0,
    total_telah_bup: accumData.total_telah_bup ?? 0,
    total_pns: accumData.total_pns ?? summaryData.total_pns ?? 0,
    persen_pns: accumData.persen_pns ?? 0,
    total_pppk: accumData.total_pppk ?? summaryData.total_pppk ?? 0,
    persen_pppk: accumData.persen_pppk ?? 0,
    baby_boomer: accumData.baby_boomer ?? 0,
    gen_x: accumData.gen_x ?? 0,
    gen_y: accumData.gen_y ?? 0,
    gen_z: accumData.gen_z ?? 0,
    gen_alpha: accumData.gen_alpha ?? 0,
    last_update: summaryData.last_update || null,
  }
}

export function fetchStatistikPegawaiData(params = {}) {
  const rawMode = params.mode || params.category || ''
  const mode = rawMode && rawMode !== 'all' && rawMode !== 'pegawai' ? rawMode : 'pegawai'
  const unit = params.unit ? (Array.isArray(params.unit) ? params.unit : [params.unit]) : undefined

  return postList(
    '/fetch/data-statistik-pegawai',
    params,
    { mode, ...(unit ? { unit } : {}) },
    'Gagal memuat data pegawai internal.'
  )
}

export function storeStatistikPegawaiData(data) {
  return apiRequest('/store/save-data-statistik-internal', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan data pegawai.',
  })
}

export function deleteStatistikPegawaiData(id) {
  return deleteByKey('/kill/data-statistik-internal', id, 'Gagal menghapus data pegawai.')
}

export function toggleStatusPegawai(id, newStatus) {
  return apiRequest('/status-data', {
    method: 'POST',
    body: toFormData({ key: id, status: newStatus, tableinfo: 'pegawai' }),
    fallbackMessage: 'Gagal mengubah status pegawai.',
  })
}

// Master Data Fetchers for Statistik Internal
export function fetchMasterUnitKerja() {
  return apiRequest('/fetch/master-unit-kerja', { fallbackMessage: 'Gagal memuat master unit kerja.' })
}

export function fetchMasterUnitSK() {
  return apiRequest('/fetch/master-unit-sk', { fallbackMessage: 'Gagal memuat master unit SK.' })
}

export function fetchMasterJenisJabatan() {
  return apiRequest('/fetch/master-jenis-jabatan', { fallbackMessage: 'Gagal memuat master jenis jabatan.' })
}

export function fetchMasterJenisPegawai() {
  return apiRequest('/fetch/master-jenis-pegawai', { fallbackMessage: 'Gagal memuat master jenis pegawai.' })
}

export function fetchMasterJabatan(params = {}) {
  const qs = params.unit_sk ? `?unit_sk=${encodeURIComponent(params.unit_sk)}` : ''
  return apiRequest(`/fetch/master-jabatan${qs}`, { fallbackMessage: 'Gagal memuat master jabatan.' })
}

export function fetchMasterPendidikan() {
  return apiRequest('/fetch/master-pendidikan', { fallbackMessage: 'Gagal memuat master pendidikan.' })
}

export function fetchMasterAgama() {
  return apiRequest('/fetch/master-agama', { fallbackMessage: 'Gagal memuat master agama.' })
}

export function fetchMasterGolongan() {
  return apiRequest('/fetch/master-golongan', { fallbackMessage: 'Gagal memuat master golongan.' })
}

export function fetchMasterPangkat() {
  return apiRequest('/fetch/master-pangkat', { fallbackMessage: 'Gagal memuat master pangkat.' })
}

export function storeMasterStatistik(data) {
  return apiRequest('/store/save-data-master-statistik', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan master data.',
  })
}

export function deleteMasterStatistik(type, id) {
  return apiRequest('/store/delete-data-master-statistik', {
    method: 'POST',
    body: toFormData({ type, id }),
    fallbackMessage: 'Gagal menghapus master data.',
  })
}

export function importBatchStatistikPegawai(formData) {
  return apiRequest('/store/import-statistik-pegawai', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Terjadi kendala saat mengunggah batch pegawai.',
  })
}

// =========================================================================
// 08. LAYANAN 36 — MANAJEMEN E-KINERJA (EKIN)
// =========================================================================
export function fetchEkinSummary(params = {}) {
  const fd = new FormData()
  if (Array.isArray(params.bulan)) {
    params.bulan.forEach((b) => fd.append('bulan[]', b))
  }
  const subUnit = params.sub_unit || params.category || params.kategori || ''
  if (subUnit) fd.append('sub_unit', subUnit)

  return postSummary('/fetch/summary-ekin', fd, 'Gagal memuat ringkasan E-Kinerja.')
}

export function fetchEkinData(params = {}) {
  const subUnit = params.sub_unit || params.category || params.kategori || ''
  const extra = {}
  if (Array.isArray(params.bulan)) extra.bulan = params.bulan
  if (subUnit) extra.sub_unit = subUnit

  return postList('/fetch/data-ekin', params, extra, 'Gagal memuat data E-Kinerja.')
}

export async function fetchEkinChild(periodDate) {
  const json = await apiRequest('/fetch/child-ekin', {
    method: 'POST',
    body: toFormData({ period_date: periodDate }),
    fallbackMessage: 'Gagal memuat daftar E-Kinerja harian.',
  })
  return json?.list || []
}

export async function fetchEkinDetail(param, subUnit = '') {
  const fd = new FormData()
  if (typeof param === 'number' || (typeof param === 'string' && /^\d+$/.test(param))) {
    fd.append('key', param)
  } else if (typeof param === 'string') {
    fd.append('period_date', param)
  } else if (param && typeof param === 'object') {
    const keyVal = param.key || param.id || param.ekin_log_id || param.ekin_key
    if (keyVal) {
      fd.append('key', keyVal)
    }
    if (param.period_date || param.tanggal_kegiatan) {
      fd.append('period_date', param.period_date || param.tanggal_kegiatan)
    }
    if (param.sub_unit) {
      fd.append('sub_unit', param.sub_unit)
    }
  }

  if (subUnit && !fd.has('sub_unit')) {
    fd.append('sub_unit', subUnit)
  }

  const json = await apiRequest('/fetch/detail-ekin', {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal memuat detail E-Kinerja.',
  })
  return Array.isArray(json?.data) ? json.data : []
}

export function storeEkinBatch(formData) {
  return apiRequest('/store/import-ekin-data', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengimpor data E-Kinerja.',
  })
}

export function saveEkinManual(payload) {
  return apiRequest('/store/save-ekin-manual', {
    method: 'POST',
    body: toFormData(payload),
    fallbackMessage: 'Gagal menyimpan data E-Kinerja.',
  })
}

export function deleteEkinData(id) {
  return deleteByKey('/kill/data-ekin', id, 'Gagal menghapus data E-Kinerja.')
}

// =========================================================================
// 09. LAYANAN 37 — MANAJEMEN ASSET BMN
// =========================================================================
export function fetchAssetsSummary(params = {}) {
  const cat = params.category_uid || params.category_id || params.category || params.kategori || ''
  const fd = toFormData(cat && cat !== 'all' ? { category_uid: cat } : {})
  return postSummary('/fetch/summary-manage-assets', fd, 'Gagal memuat ringkasan aset BMN.')
}

export function fetchAssetsData(params = {}) {
  const cat = params.category_uid || params.category_id || params.category || params.kategori || ''
  const extra = cat && cat !== 'all' ? { category_uid: cat } : {}
  return postList('/fetch/data-manage-assets', params, extra, 'Gagal memuat daftar aset BMN.')
}

export async function fetchAssetCategories() {
  const json = await apiRequest('/fetch/asset-categories', {
    method: 'POST',
    body: new FormData(),
    fallbackMessage: 'Gagal memuat kategori aset BMN.',
  })
  return json?.data || json || []
}

export function storeAssetCategory(name) {
  return apiRequest('/store/save-asset-category', {
    method: 'POST',
    body: toFormData({ name }),
    fallbackMessage: 'Gagal menyimpan kategori aset.',
  })
}

export function updateAssetCategory(uid, name) {
  return apiRequest('/store/update-asset-category', {
    method: 'POST',
    body: toFormData({ uid, name }),
    fallbackMessage: 'Gagal memperbarui kategori aset.',
  })
}

export function deleteAssetCategory(uid) {
  return apiRequest('/kill/asset-category', {
    method: 'POST',
    body: toFormData({ uid }),
    fallbackMessage: 'Gagal menghapus kategori aset.',
  })
}

export function fetchAssetDetailData(categoryUid, params = {}) {
  return postList(
    '/apps-manage-assets-detail/get-data',
    params,
    { category_uid: categoryUid },
    'Gagal memuat detail barang aset.'
  )
}

export function storeAssetData(formData) {
  const fd = toFormData(formData)
  const endpoint = fd.get('id') ? '/apps-manage-assets-detail/update' : '/apps-manage-assets-detail/store'
  return apiRequest(endpoint, {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal menyimpan data aset.',
  })
}

export function deleteAssetData(id) {
  return apiRequest('/apps-manage-assets-detail/delete', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal menghapus data aset.',
  })
}

export function importBatchAssets(file) {
  return apiRequest('/store/import-asset-data', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor data aset.',
  })
}

// =========================================================================
// 09.5 LAYANAN MANAJEMEN RUANGAN (TATA USAHA)
// =========================================================================
export function fetchRoomsSummary(params = {}) {
  const kantor = params.kantor || params.area || params.category || ''
  const fd = toFormData(kantor && kantor !== 'all' ? { kantor } : {})
  if (params.status && params.status !== 'all') fd.append('status', params.status)
  return postSummary('/fetch/summary-manage-ruangan', fd, 'Gagal memuat ringkasan data ruangan.')
}

export function fetchRoomsData(params = {}) {
  const kantor = params.kantor || params.area || params.category || ''
  const extra = {}
  if (kantor && kantor !== 'all') extra.kantor = kantor
  if (params.status && params.status !== 'all') extra.status = params.status
  if (params.lantai && params.lantai !== 'all') extra.lantai = params.lantai
  return postList('/fetch/data-manage-ruangan', params, extra, 'Gagal memuat daftar ruangan.')
}

export function fetchRoomDetail(id) {
  return apiRequest('/fetch/detail-manage-ruangan', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal memuat rincian data ruangan.',
  })
}

export function storeRoomData(formData) {
  const fd = toFormData(formData)
  const endpoint = fd.get('id') ? '/store/update-manage-ruangan' : '/store/save-manage-ruangan'
  return apiRequest(endpoint, {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal menyimpan data ruangan.',
  })
}

export function deleteRoomData(id) {
  return apiRequest('/kill/delete-manage-ruangan', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal menghapus data ruangan.',
  })
}

export function fetchRoomAssets(ruanganId) {
  return apiRequest('/fetch/room-assets', {
    method: 'POST',
    body: toFormData({ ruangan_id: ruanganId }),
    fallbackMessage: 'Gagal memuat daftar aset di ruangan ini.',
  })
}

export async function fetchAvailableAssets(kantor = null) {
  const fd = toFormData(kantor && kantor !== 'all' ? { kantor } : {})
  const json = await apiRequest('/fetch/available-assets', {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal memuat daftar aset yang tersedia.',
  })
  return json?.data || json || []
}

export function assignAssetToRoom(assetId, ruanganId) {
  return apiRequest('/store/assign-asset-ruangan', {
    method: 'POST',
    body: toFormData({ asset_id: assetId, ruangan_id: ruanganId }),
    fallbackMessage: 'Gagal mengalokasikan aset ke ruangan.',
  })
}

export function unassignAssetFromRoom(assetId) {
  return apiRequest('/store/unassign-asset-ruangan', {
    method: 'POST',
    body: toFormData({ asset_id: assetId }),
    fallbackMessage: 'Gagal melepas aset dari ruangan.',
  })
}

export async function fetchOptionsRuangan(kantor = null) {
  const fd = toFormData(kantor && kantor !== 'all' ? { kantor } : {})
  const json = await apiRequest('/fetch/options-ruangan', {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal memuat opsi ruangan.',
  })
  return json?.data || json || []
}

// =========================================================================
// 10. LAYANAN 38 — MANAJEMEN PROYEK
// =========================================================================
export function fetchProjectsSummary(params = {}) {
  const fd = new FormData()
  if (params.category && params.category !== 'all') fd.append('category', params.category)
  if (params.bulan) {
    fd.append('bulan', Array.isArray(params.bulan) ? params.bulan.join(',') : params.bulan)
  }
  return postSummary('/fetch/summary-manage-project', fd, 'Gagal memuat ringkasan proyek.')
}

export function fetchProjectsData(params = {}) {
  const extra = { type: 'projects' }
  if (params.category && params.category !== 'all') extra.category = params.category
  if (params.bulan) {
    extra.bulan = Array.isArray(params.bulan) ? params.bulan.join(',') : params.bulan
  }
  return postList('/fetch/data-manage-project', params, extra, 'Gagal memuat data proyek.')
}

export function storeProjectData(data) {
  const isUpdate = Boolean(data.project_uid || (data.id && typeof data.id === 'string' && data.id.length > 10))
  const endpoint = isUpdate ? '/store/update-project' : '/store/save-project'
  return apiRequest(endpoint, {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan data proyek.',
  })
}

export function importBatchProjects(file) {
  return apiRequest('/store/import-excel-project', {
    method: 'POST',
    body: toFormData({ file }),
    fallbackMessage: 'Gagal mengimpor batch data proyek.',
  })
}

export async function fetchProjectOverview(projectUid) {
  const json = await apiRequest('/fetch/project-overview', {
    method: 'POST',
    body: toFormData({ project_uid: projectUid }),
    fallbackMessage: 'Gagal memuat ringkasan proyek.',
  })
  return json?.data || null
}

export function fetchProjectSubData(projectUid, type = 'progress', params = {}) {
  return postList(
    '/fetch/data-manage-project',
    params,
    { project_uid: projectUid, type },
    'Gagal memuat sub-data proyek.'
  )
}

export function storeProjectProgress(formData) {
  return apiRequest('/store/save-project-progress', {
    method: 'POST',
    body: toFormData(formData),
    fallbackMessage: 'Gagal menyimpan progres proyek.',
  })
}

export function storeProjectBudget(formData) {
  return apiRequest('/store/save-project-budget', {
    method: 'POST',
    body: toFormData(formData),
    fallbackMessage: 'Gagal menyimpan pencairan anggaran.',
  })
}

export function deleteProjectProgress(id) {
  return apiRequest('/kill/project-progress', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal menghapus log progres proyek.',
  })
}

export function deleteProjectBudget(id) {
  return apiRequest('/kill/project-budget', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal menghapus pencairan anggaran.',
  })
}

export function deleteProjectData(id) {
  return apiRequest('/kill/data-project', {
    method: 'POST',
    body: toFormData({ uid: id, project_id: id }),
    fallbackMessage: 'Gagal menghapus data proyek.',
  })
}

// =========================================================================
// 11. LAYANAN 41 — LOST AND FOUND (BARANG HILANG & DITEMUKAN)
// =========================================================================
export function fetchLostFoundSummary() {
  return postSummary('/fetch/summary-lost-and-found', new FormData(), 'Gagal memuat ringkasan barang hilang.')
}

export function fetchLostFoundData(params = {}) {
  const extra = params.status_penyerahan ? { status: params.status_penyerahan } : {}
  return postList('/fetch/data-lost-and-found', params, extra, 'Gagal memuat data barang hilang.')
}

export function storeLostFoundData(formData) {
  return apiRequest('/store/save-data-lost-and-found', {
    method: 'POST',
    body: toFormData(formData),
    fallbackMessage: 'Gagal menyimpan data barang hilang.',
  })
}

export function deleteLostFoundData(id) {
  return deleteByKey('/kill/data-lost-and-found', id, 'Gagal menghapus data barang hilang.')
}

// =========================================================================
// 12. LAYANAN 43 — MANAJEMEN CAPAIAN IKK
// =========================================================================
export function fetchIkkSummary(filters = {}) {
  const fd = toFormData(filters)
  return postSummary('/fetch/ikk-summary', fd, 'Gagal memuat ringkasan capaian IKK.')
}

export async function fetchIkkHierarchy(filters = {}) {
  const fd = toFormData(filters)
  const json = await apiRequest('/fetch/ikk-hierarchy', {
    method: 'POST',
    body: fd,
    fallbackMessage: 'Gagal memuat hierarki IKK.',
  })
  return json?.tree || json?.data || []
}

// 12.1 Master Level 1: Sasaran Strategis
export function fetchIkkSasaran(params = {}) {
  return postList('/fetch/ikk-sasaran', params, {}, 'Gagal memuat sasaran strategis IKK.')
}

export function storeIkkSasaran(data) {
  return apiRequest('/store/ikk-sasaran', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan sasaran strategis IKK.',
  })
}

export function deleteIkkSasaran(id) {
  return apiRequest('/kill/ikk-sasaran', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal menghapus sasaran strategis IKK.',
  })
}

// 12.2 Master Level 2: Indikator Kinerja Kegiatan
export function fetchIkkIndikator(params = {}) {
  return postList('/fetch/ikk-indikator', params, {
    sasaran_id: params.sasaran_id || '',
    tahun: params.tahun || '',
    triwulan: params.triwulan || '',
  }, 'Gagal memuat indikator kinerja IKK.')
}

export function storeIkkIndikator(data) {
  return apiRequest('/store/ikk-indikator', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan indikator kinerja IKK.',
  })
}

export function deleteIkkIndikator(id) {
  return apiRequest('/kill/ikk-indikator', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal menghapus indikator kinerja IKK.',
  })
}

export async function fetchIkkIndikatorRealisasi(indikatorId, tahun) {
  const json = await apiRequest('/fetch/ikk-indikator-realisasi', {
    method: 'POST',
    body: toFormData({ indikator_id: indikatorId, tahun }),
    fallbackMessage: 'Gagal memuat data realisasi indikator.',
  })
  return json?.matrix || json?.data || []
}

export function storeIkkIndikatorRealisasi(data) {
  return apiRequest('/store/ikk-indikator-realisasi', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan evaluasi realisasi indikator.',
  })
}

export function deleteIkkIndikatorRealisasi(id) {
  return apiRequest('/kill/ikk-indikator-realisasi', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal menghapus evaluasi realisasi indikator.',
  })
}

export function calcIkkFromKegiatan(indikatorId, tahun, triwulan) {
  return apiRequest('/fetch/ikk-calc-kegiatan-realisasi', {
    method: 'POST',
    body: toFormData({ indikator_id: indikatorId, tahun, triwulan }),
    fallbackMessage: 'Gagal menghitung agregasi realisasi kegiatan.',
  })
}

// 12.3 Master Level 3: Kegiatan Operasional & Pengampu
export function fetchIkkKegiatan(params = {}) {
  return postList('/fetch/ikk-kegiatan', params, {
    sasaran_id: params.sasaran_id || '',
    indikator_id: params.indikator_id || '',
    timkerja_id: params.timkerja_id || '',
  }, 'Gagal memuat kegiatan operasional IKK.')
}

export function storeIkkKegiatan(data) {
  return apiRequest('/store/ikk-kegiatan', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan kegiatan operasional IKK.',
  })
}

export function deleteIkkKegiatan(id) {
  return apiRequest('/kill/ikk-kegiatan', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal menghapus kegiatan operasional IKK.',
  })
}

export async function fetchIkkAssignedPengampu(relasiId, tipeRelasi = 'kegiatan') {
  const json = await apiRequest('/fetch/ikk-assigned-pengampu', {
    method: 'POST',
    body: toFormData({ relasi_id: relasiId, tipe_relasi: tipeRelasi }),
    fallbackMessage: 'Gagal memuat tim pengampu.',
  })
  return json?.assigned_timkerja_ids || json?.data || []
}

export function storeIkkPengampu(data) {
  return apiRequest('/store/ikk-pengampu', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan tim pengampu IKK.',
  })
}

export function deleteIkkPengampu(id) {
  return apiRequest('/kill/ikk-pengampu', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal menghapus pengampu IKK.',
  })
}

// 12.4 Level 4/5: Log Transaksi Harian & Eviden
export function fetchIkkTransaksi(params = {}) {
  return postList('/fetch/ikk-transaksi', params, {
    kegiatan_id: params.kegiatan_id || '',
    sasaran_id: params.sasaran_id || '',
    indikator_id: params.indikator_id || '',
    timkerja_id: params.timkerja_id || '',
    tahun: params.tahun || '',
    triwulan: params.triwulan || '',
  }, 'Gagal memuat transaksi capaian IKK.')
}

export function storeIkkTransaksi(data) {
  return apiRequest('/store/ikk-transaksi', {
    method: 'POST',
    body: toFormData(data),
    fallbackMessage: 'Gagal menyimpan transaksi IKK.',
  })
}

export function storeIkkTransaksiBatch(formData) {
  return apiRequest('/store/ikk-transaksi-import', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Gagal mengimpor transaksi IKK.',
  })
}

export function deleteIkkTransaksi(id) {
  return apiRequest('/kill/ikk-transaksi', {
    method: 'POST',
    body: toFormData({ id }),
    fallbackMessage: 'Gagal menghapus transaksi IKK.',
  })
}

// 12.5 Options & Helpers
export async function fetchIkkOptionsSasaran() {
  const json = await apiRequest('/fetch/ikk-options-sasaran', {
    method: 'POST',
    body: new FormData(),
    fallbackMessage: 'Gagal memuat opsi sasaran strategis.',
  })
  return Array.isArray(json) ? json : (json?.data || json?.results || [])
}

export async function fetchIkkOptionsIndikator(sasaranId) {
  const json = await apiRequest('/fetch/ikk-options-indikator', {
    method: 'POST',
    body: toFormData({ sasaran_id: sasaranId }),
    fallbackMessage: 'Gagal memuat opsi indikator kinerja.',
  })
  return Array.isArray(json) ? json : (json?.data || json?.results || [])
}

export async function fetchIkkOptionsKegiatan(indikatorId) {
  const json = await apiRequest('/fetch/ikk-options-kegiatan', {
    method: 'POST',
    body: toFormData({ indikator_id: indikatorId }),
    fallbackMessage: 'Gagal memuat opsi kegiatan IKK.',
  })
  return Array.isArray(json) ? json : (json?.data || json?.results || [])
}

export async function fetchIkkOptionsTimKerja() {
  const json = await apiRequest('/fetch/ikk-options-timkerja', {
    method: 'POST',
    body: new FormData(),
    fallbackMessage: 'Gagal memuat opsi tim kerja.',
  })
  return Array.isArray(json) ? json : (json?.data || json?.results || [])
}

export async function fetchIkkOptionsTahun() {
  const json = await apiRequest('/fetch/ikk-options-tahun', {
    method: 'POST',
    body: new FormData(),
    fallbackMessage: 'Gagal memuat opsi tahun.',
  })
  return Array.isArray(json) ? json : (json?.data || json?.results || [])
}
