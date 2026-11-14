/**
 * Utilitas encoding/decoding parameter URL yang aman (URL-safe & obfuscated)
 * untuk modul Fasilitasi CAT (Rekap Data, Rekapitulasi, Laporan).
 *
 * Menggunakan XOR stream + UTF-8 safe Base64URL agar:
 * 1. Parameter sensitif / ID internal tidak tampil telanjang di URL.
 * 2. Tetap 100% deterministik & reversible saat browser di-refresh (F5) atau dibagikan.
 */

const SALT_KEY = 'SIMOJANG_CAT_BKN_KANREG3_2026'
const TOKEN_PREFIX = 'ct1_'

function xorTransform(str) {
  const bytes = new TextEncoder().encode(str)
  const keyBytes = new TextEncoder().encode(SALT_KEY)
  const out = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length]
  }
  return out
}

function xorReverse(bytes) {
  const keyBytes = new TextEncoder().encode(SALT_KEY)
  const out = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length]
  }
  return new TextDecoder().decode(out)
}

function toBase64Url(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function encodeCatToken(payload) {
  try {
    if (!payload || typeof payload !== 'object') return ''
    const json = JSON.stringify(payload)
    const transformed = xorTransform(json)
    return `${TOKEN_PREFIX}${toBase64Url(transformed)}`
  } catch {
    return ''
  }
}

export function decodeCatToken(token) {
  try {
    if (!token || typeof token !== 'string') return null
    const clean = token.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : token
    if (!clean) return null
    const bytes = fromBase64Url(clean)
    const json = xorReverse(bytes)
    const parsed = JSON.parse(json)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function encodeCatJenisToken(jenisObj) {
  if (!jenisObj) return ''
  return encodeCatToken({
    id: jenisObj.id,
    j: jenisObj.jenis_tes_id || jenisObj.id,
    p: jenisObj.periode,
    k: jenisObj.jenis_tes_kode || '',
    n: jenisObj.display_nama || jenisObj.jenis_tes_nama || '',
  })
}

export function decodeCatJenisToken(token) {
  const data = decodeCatToken(token)
  if (!data || !data.id) return null
  return {
    id: data.id,
    jenis_tes_id: data.j || data.id,
    periode: data.p || '',
    jenis_tes_kode: data.k || '',
    display_nama: data.n || '',
    jenis_tes_nama: data.n || '',
  }
}

export function encodeCatFilterToken(filters) {
  if (!filters) return ''
  const payload = {}
  if (filters.seleksiId) payload.s = String(filters.seleksiId)
  if (filters.tilokUid) payload.t = String(filters.tilokUid)
  if (Array.isArray(filters.instansiIds) && filters.instansiIds.length > 0) {
    payload.i = filters.instansiIds.map(String)
  }
  if (filters.tglMulai) payload.m = String(filters.tglMulai)
  if (filters.tglSelesai) payload.e = String(filters.tglSelesai)

  if (Object.keys(payload).length === 0) return ''
  return encodeCatToken(payload)
}

export function decodeCatFilterToken(token) {
  const data = decodeCatToken(token)
  if (!data) return null
  return {
    seleksiId: data.s || '',
    tilokUid: data.t || '',
    instansiIds: Array.isArray(data.i) ? data.i.map(String) : [],
    tglMulai: data.m || '',
    tglSelesai: data.e || '',
  }
}

const ACTIVE_JENIS_STORAGE_KEY = 'simojang_cat_active_jenis_token'
const ACTIVE_FILTER_STORAGE_KEY = 'simojang_cat_active_filter_state'

/**
 * Mengambil token Jenis Tes aktif bersama dari sessionStorage untuk
 * menyinkronkan pilihan Jenis Tes antar halaman Rekap Data, Rekapitulasi, dan Laporan.
 */
export function getActiveCatJenisToken() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return ''
    const token = window.sessionStorage.getItem(ACTIVE_JENIS_STORAGE_KEY) || ''
    if (!token) return ''
    if (!decodeCatJenisToken(token)) {
      window.sessionStorage.removeItem(ACTIVE_JENIS_STORAGE_KEY)
      return ''
    }
    return token
  } catch {
    return ''
  }
}

export function setActiveCatJenisToken(token) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return
    if (token && decodeCatJenisToken(token)) {
      const prev = window.sessionStorage.getItem(ACTIVE_JENIS_STORAGE_KEY)
      if (prev && prev !== token) {
        window.sessionStorage.removeItem(ACTIVE_FILTER_STORAGE_KEY)
      }
      window.sessionStorage.setItem(ACTIVE_JENIS_STORAGE_KEY, token)
    }
  } catch {
    // Abaikan error storage (misal mode privasi ketat)
  }
}

export function clearActiveCatJenisToken() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return
    window.sessionStorage.removeItem(ACTIVE_JENIS_STORAGE_KEY)
    window.sessionStorage.removeItem(ACTIVE_FILTER_STORAGE_KEY)
  } catch {
    // Abaikan error storage
  }
}

/**
 * Mengambil token Filter Parameter Pelaksanaan aktif bersama dari sessionStorage
 * yang terikat dengan jenisToken aktif agar lintas halaman tetap sinkron.
 */
export function getActiveCatFilterToken(jenisToken) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage || !jenisToken) return ''
    const raw = window.sessionStorage.getItem(ACTIVE_FILTER_STORAGE_KEY)
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.j !== jenisToken || !parsed.p) return ''
    if (!decodeCatFilterToken(parsed.p)) {
      window.sessionStorage.removeItem(ACTIVE_FILTER_STORAGE_KEY)
      return ''
    }
    return parsed.p
  } catch {
    return ''
  }
}

export function setActiveCatFilterToken(jenisToken, filterToken) {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return
    if (!jenisToken || !filterToken) {
      window.sessionStorage.removeItem(ACTIVE_FILTER_STORAGE_KEY)
      return
    }
    if (decodeCatFilterToken(filterToken)) {
      window.sessionStorage.setItem(
        ACTIVE_FILTER_STORAGE_KEY,
        JSON.stringify({ j: jenisToken, p: filterToken })
      )
    }
  } catch {
    // Abaikan error storage
  }
}

export function clearActiveCatFilterToken() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return
    window.sessionStorage.removeItem(ACTIVE_FILTER_STORAGE_KEY)
  } catch {
    // Abaikan error storage
  }
}

export function buildCatModuleUrl(basePath, jenisToken, filterToken = '') {
  if (!jenisToken) return basePath
  const pathWithJenis = `${basePath}/${jenisToken}`
  return filterToken ? `${pathWithJenis}?p=${encodeURIComponent(filterToken)}` : pathWithJenis
}

const VALID_PENGELOLA_DOC_TYPES = new Set([
  'sp',
  'st',
  'nominatif',
  'kwitansi',
  'hadir',
  'kwitansi_jamuan',
  'surat_jalan',
  'hadir_jamuan',
])

export function encodeCatPengelolaDocTypeToken(docType) {
  const code = String(docType || '').trim().toLowerCase()
  if (!code) return ''
  return encodeCatToken({ k: 'cat_doc_type', t: code })
}

export function decodeCatPengelolaDocTypeToken(rawToken) {
  const clean = String(rawToken || '').trim()
  if (!clean) return ''
  const decoded = decodeCatToken(clean)
  if (decoded && decoded.t) {
    const code = String(decoded.t).trim().toLowerCase()
    return VALID_PENGELOLA_DOC_TYPES.has(code) ? code : code
  }
  const lower = clean.toLowerCase()
  return VALID_PENGELOLA_DOC_TYPES.has(lower) ? lower : ''
}

export function encodeCatPengelolaDocToken({ docType = '', uid = '', jadwalId = '' } = {}) {
  if (!uid && !docType) return ''
  return encodeCatToken({
    k: 'cat_doc_builder',
    t: String(docType || '').trim().toLowerCase(),
    u: String(uid || '').trim(),
    j: jadwalId ? String(jadwalId).trim() : '',
  })
}

export function decodeCatPengelolaDocToken(rawToken) {
  const clean = String(rawToken || '').trim()
  if (!clean) return { docType: '', uid: '', jadwalId: '' }
  const decoded = decodeCatToken(clean)
  if (decoded && (decoded.u || decoded.t)) {
    return {
      docType: String(decoded.t || '').trim().toLowerCase(),
      uid: String(decoded.u || '').trim(),
      jadwalId: String(decoded.j || '').trim(),
    }
  }
  // Fallback bila dibuka memakai raw uid
  return { docType: '', uid: clean, jadwalId: '' }
}

export function buildCatPengelolaDocListUrl(docType) {
  const typeToken = encodeCatPengelolaDocTypeToken(docType)
  if (!typeToken) return '/layanan/fasilitasi-cat/pengelola/dokumen'
  return `/layanan/fasilitasi-cat/pengelola/dokumen/${typeToken}`
}

export function buildCatPengelolaDocBuilderUrl(docType, uid, jadwalId = '') {
  const typeToken = encodeCatPengelolaDocTypeToken(docType)
  const docToken = encodeCatPengelolaDocToken({ docType, uid, jadwalId })
  if (!typeToken || !docToken) return '/layanan/fasilitasi-cat/pengelola/dokumen'
  return `/layanan/fasilitasi-cat/pengelola/dokumen/${typeToken}/${docToken}`
}
