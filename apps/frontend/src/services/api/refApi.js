import { apiRequest } from '../api'

function unwrapPayload(res) {
  if (res && typeof res === 'object') {
    const isOk = res.status !== false && res.success !== false && res.status !== 'error'
    if (!isOk) {
      const err = new Error(res.message || 'Permintaan gagal diproses.')
      err.details = res.errors || res
      throw err
    }
    return {
      data: res.data ?? [],
      meta: res.meta ?? {},
      message: res.message || 'OK',
    }
  }
  return { data: res, meta: {}, message: 'OK' }
}

export async function fetchRefTables() {
  const res = await apiRequest('/api/ref/tables')
  return unwrapPayload(res).data
}

export async function fetchRefSchema(slug) {
  const res = await apiRequest(`/api/ref/${encodeURIComponent(slug)}/schema`)
  return unwrapPayload(res).data
}

export async function fetchRefList(slug, params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.per_page) query.set('per_page', String(params.per_page))
  if (params.search) query.set('search', String(params.search))
  if (params.sort_by) query.set('sort_by', String(params.sort_by))
  if (params.sort_dir) query.set('sort_dir', String(params.sort_dir))

  const qs = query.toString()
  const res = await apiRequest(`/api/ref/${encodeURIComponent(slug)}${qs ? `?${qs}` : ''}`)
  const unwrapped = unwrapPayload(res)
  return {
    rows: Array.isArray(unwrapped.data) ? unwrapped.data : [],
    meta: unwrapped.meta || { page: 1, per_page: 10, total: 0, total_page: 1 },
  }
}

export async function createRefRow(slug, payload) {
  const res = await apiRequest(`/api/ref/${encodeURIComponent(slug)}`, {
    method: 'POST',
    body: payload,
  })
  return unwrapPayload(res)
}

export async function updateRefRow(slug, id, payload) {
  const res = await apiRequest(`/api/ref/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  })
  return unwrapPayload(res)
}

export async function deleteRefRow(slug, id) {
  const res = await apiRequest(`/api/ref/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  return unwrapPayload(res)
}
