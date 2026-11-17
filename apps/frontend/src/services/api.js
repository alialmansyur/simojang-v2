import { clearAuthSession, getBearerToken } from './auth'

const rawBase = import.meta.env.VITE_API_BASE_URL
export const API_BASE_URL = rawBase && rawBase.trim() ? rawBase.trim().replace(/\/+$/, '') : ''

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function buildHeaders(customHeaders = {}) {
  const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...customHeaders,
  }
  const token = getBearerToken()

  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  }

  return headers
}

const TECHNICAL_PATTERNS = [
  /^\s*</i,
  /\b(sqlstate|syntax error|fatal error|stack trace|uncaught|pdoexception|mysqli|errno|call to undefined|failed to fetch|networkerror|typeerror)\b/i,
  /\b(http|status)\s*\d{3}\b/i,
  /127\.0\.0\.1|localhost:\d+/i,
]

export function getStatusFallbackMessage(status) {
  if (status === 0) {
    return 'Tidak dapat terhubung ke layanan server. Periksa koneksi jaringan Anda lalu coba lagi.'
  }
  if (status === 400 || status === 422) {
    return 'Data yang dikirim belum lengkap atau tidak sesuai. Silakan periksa kembali.'
  }
  if (status === 401) {
    return 'Sesi masuk Anda telah berakhir. Silakan masuk kembali.'
  }
  if (status === 403) {
    return 'Anda tidak memiliki hak akses untuk melakukan tindakan ini.'
  }
  if (status === 404) {
    return 'Data atau layanan yang Anda tuju tidak ditemukan.'
  }
  if (status === 408 || status === 504) {
    return 'Waktu koneksi ke server habis. Silakan coba kembali beberapa saat lagi.'
  }
  if (status === 413) {
    return 'Ukuran berkas atau data yang dikirim melebihi batas yang diizinkan.'
  }
  if (status === 429) {
    return 'Terlalu banyak percobaan dalam waktu singkat. Silakan tunggu sebentar lalu coba lagi.'
  }
  if (status >= 500) {
    return 'Layanan sistem sedang mengalami gangguan sementara. Silakan coba beberapa saat lagi.'
  }
  return 'Permintaan belum dapat diproses saat ini. Silakan coba kembali.'
}

function toCleanUserMessage(rawMessage, status, fallbackMessage) {
  const defaultMsg = fallbackMessage || getStatusFallbackMessage(status)
  if (typeof rawMessage !== 'string') return defaultMsg

  const trimmed = rawMessage.trim()
  if (!trimmed) return defaultMsg

  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return defaultMsg
  }

  return trimmed
}

function readFirstMessageFromMap(map) {
  if (!map || typeof map !== 'object') return ''
  for (const key of Object.keys(map)) {
    const val = map[key]
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string' && val[0].trim()) {
      return val[0].trim()
    }
    if (typeof val === 'string' && val.trim()) {
      return val.trim()
    }
  }
  return ''
}

export function extractErrorMessage(body, fallbackMessage, status = 0) {
  const defaultMsg = fallbackMessage || getStatusFallbackMessage(status)
  if (!body) return defaultMsg
  if (typeof body === 'string') return toCleanUserMessage(body, status, defaultMsg)
  if (typeof body.message === 'string' && body.message.trim()) {
    return toCleanUserMessage(body.message, status, defaultMsg)
  }

  if (typeof body.messages === 'string' && body.messages.trim()) {
    return toCleanUserMessage(body.messages, status, defaultMsg)
  }

  const fromMessages = readFirstMessageFromMap(body.messages)
  if (fromMessages) {
    return toCleanUserMessage(fromMessages, status, defaultMsg)
  }

  const fromErrors = readFirstMessageFromMap(body.errors)
  if (fromErrors) {
    return toCleanUserMessage(fromErrors, status, defaultMsg)
  }

  return defaultMsg
}

export function handleUnauthorizedSession({ skipRedirect = false } = {}) {
  clearAuthSession()
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
  const loginPath = `${base}/login`
  if (!skipRedirect && typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
    window.location.replace(`${loginPath}?reason=expired`)
  }
}

let fetchInterceptorInstalled = false

/**
 * Install an idempotent global fetch guard so any internal API request
 * receiving HTTP 401 redirects the user cleanly to the login screen.
 */
export function installAuthFetchInterceptor() {
  if (fetchInterceptorInstalled || typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return
  }

  const nativeFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const response = await nativeFetch(input, init)
    if (response.status === 401) {
      const url = typeof input === 'string' ? input : (input?.url || '')
      const isInternal =
        url.startsWith('/') ||
        url.includes('/api/') ||
        url.includes('/auth/') ||
        (typeof window !== 'undefined' && url.startsWith(window.location.origin)) ||
        (Boolean(API_BASE_URL) && url.startsWith(API_BASE_URL))
      const isLoginRequest = url.includes('/authprocess')

      if (isInternal && !isLoginRequest) {
        handleUnauthorizedSession()
      }
    }
    return response
  }

  fetchInterceptorInstalled = true
}

export async function parseFetchResponse(
  response,
  { skipAuthRedirect = false, fallbackMessage, responseType = 'json', allowBusinessError = false } = {},
) {
  if (responseType === 'blob') {
    if (response.ok) {
      return response.blob()
    }
  }

  const contentType = response.headers.get('content-type') || ''
  let body
  try {
    body = contentType.includes('application/json')
      ? await response.json()
      : await response.text()
  } catch {
    body = null
  }

  if (response.ok) {
    if (
      !allowBusinessError &&
      body &&
      typeof body === 'object' &&
      (body.status === 'error' || body.status === false || body.success === false)
    ) {
      throw new ApiError(
        extractErrorMessage(body, fallbackMessage || getStatusFallbackMessage(400), 400),
        { status: response.status, details: body },
      )
    }
    return body
  }

  if (response.status === 401) {
    handleUnauthorizedSession({ skipRedirect: skipAuthRedirect })
  }

  throw new ApiError(
    extractErrorMessage(body, fallbackMessage || getStatusFallbackMessage(response.status), response.status),
    { status: response.status, details: body },
  )
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      cache: 'no-store',
    })
    if (!res.ok) return false
    const data = await res.json()
    return data?.status === 'ok'
  } catch {
    return false
  }
}

export async function apiRequest(path, options = {}) {
  const method = options.method || 'GET'
  const targetUrl = options.url || `${API_BASE_URL}${path}`

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const isUrlParams = typeof URLSearchParams !== 'undefined' && options.body instanceof URLSearchParams
  const isRawString = typeof options.body === 'string'
  const isJsonObject = options.body !== undefined && options.body !== null && !isFormData && !isUrlParams && !isRawString

  const contentTypeHeaders = isJsonObject ? { 'Content-Type': 'application/json' } : {}
  const requestBody = isFormData || isUrlParams || isRawString
    ? options.body
    : isJsonObject
      ? JSON.stringify(options.body)
      : undefined

  let response
  try {
    response = await fetch(targetUrl, {
      method,
      headers: {
        ...buildHeaders(contentTypeHeaders),
        ...(options.headers || {}),
      },
      body: requestBody,
      signal: options.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw err
    }
    throw new ApiError(getStatusFallbackMessage(0), { status: 0 })
  }

  const skipAuthRedirect = options.skipAuthRedirect ?? String(path).startsWith('/authprocess')
  return parseFetchResponse(response, {
    skipAuthRedirect,
    fallbackMessage: options.fallbackMessage,
    responseType: options.responseType || 'json',
    allowBusinessError: Boolean(options.allowBusinessError),
  })
}

export async function apiDownload(path, fallbackFileName = 'download', options = {}) {
  const targetUrl = options.url || `${API_BASE_URL}${path}`
  let response
  try {
    response = await fetch(targetUrl, {
      method: options.method || 'GET',
      headers: {
        ...buildHeaders({ Accept: '*/*' }),
        ...(options.headers || {}),
      },
      signal: options.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw err
    }
    throw new ApiError(getStatusFallbackMessage(0), { status: 0 })
  }

  if (!response.ok) {
    await parseFetchResponse(response, {
      skipAuthRedirect: Boolean(options.skipAuthRedirect),
      fallbackMessage: options.fallbackMessage,
    })
  }

  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^";\n]+)"?/i)
  const fileName = match?.[1] || fallbackFileName
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
  return fileName
}

export function uploadWithProgress(path, file, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}${path}`)

    const token = getBearerToken()
    xhr.setRequestHeader('Accept', 'application/json')
    if (token) {
      xhr.setRequestHeader('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`)
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== 'function') return
      onProgress(Math.round((event.loaded / event.total) * 100))
    }

    xhr.onload = () => {
      const raw = xhr.responseText || ''
      let body
      try { body = raw ? JSON.parse(raw) : null } catch { body = raw }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body)
        return
      }

      if (xhr.status === 401) {
        handleUnauthorizedSession()
      }

      reject(new ApiError(
        extractErrorMessage(body, getStatusFallbackMessage(xhr.status), xhr.status),
        { status: xhr.status, details: body },
      ))
    }

    xhr.onerror = () => reject(new ApiError('Koneksi terputus saat mengunggah berkas. Silakan coba kembali.', { status: 0 }))

    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}
