import { apiRequest } from '../api'

function unwrap(res) {
  if (res && typeof res === 'object') {
    const ok = res.status !== false && res.success !== false && res.status !== 'error'
    if (!ok) {
      const err = new Error(res.message || 'Permintaan gagal diproses.')
      err.details = res.errors || res
      throw err
    }
    return {
      data: res.data ?? null,
      meta: res.meta ?? null,
      message: res.message || 'OK',
      raw: res,
    }
  }
  return { data: res, meta: null, message: 'OK', raw: res }
}

function toFormData(obj = {}) {
  const fd = new FormData()
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      fd.append(k, String(v))
    }
  })
  return fd
}

// ============================================================================
// USER MANAGER (/api/manage-user/* & /api/users/*)
// ============================================================================
export async function fetchUsersList(params = {}) {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.role) q.set('role', params.role)
  if (params.status) q.set('status', params.status)
  if (params.page) q.set('page', String(params.page))
  if (params.per_page) q.set('per_page', String(params.per_page))
  const res = await apiRequest(`/api/manage-user/list?${q.toString()}`)
  return unwrap(res).data
}

export async function fetchUserDetail(id) {
  const res = await apiRequest(`/api/manage-user/detail?id=${encodeURIComponent(id)}`)
  return unwrap(res).data
}

export async function createUserAccount(payload) {
  const res = await apiRequest('/api/manage-user/create', {
    method: 'POST',
    body: payload,
  })
  return unwrap(res)
}

export async function updateUserAccount(payload) {
  const res = await apiRequest('/api/manage-user/update', {
    method: 'POST',
    body: payload,
  })
  return unwrap(res)
}

export async function resetUserPassword(id, password) {
  const res = await apiRequest('/api/manage-user/reset-password', {
    method: 'POST',
    body: { id, password },
  })
  return unwrap(res)
}

export async function toggleUserStatus(id, active) {
  const res = await apiRequest('/api/manage-user/toggle-status', {
    method: 'POST',
    body: { id, active: active ? 1 : 0 },
  })
  return unwrap(res)
}

export async function deleteUserAccount(id) {
  const res = await apiRequest('/api/manage-user/delete', {
    method: 'POST',
    body: { id },
  })
  return unwrap(res)
}

export async function lookupPegawaiForUser(query = '', limit = 15) {
  const q = new URLSearchParams({ q: query, limit: String(limit) })
  const res = await apiRequest(`/api/manage-user/pegawai-lookup?${q.toString()}`)
  return unwrap(res).data || []
}

export async function syncDataPegawaiFromMaster() {
  const res = await apiRequest('/store/pull-datalist-pegawai', { method: 'POST' })
  return res
}

export async function fetchUserDirectPermissions(userId) {
  const res = await apiRequest(`/api/users/${encodeURIComponent(userId)}/permissions`)
  return unwrap(res).data
}

export async function syncUserDirectPermissions(userId, permissionIds) {
  const res = await apiRequest(`/api/users/${encodeURIComponent(userId)}/permissions`, {
    method: 'PUT',
    body: { permission_ids: permissionIds },
  })
  return unwrap(res)
}

// ============================================================================
// ROLE & MENU MANAGER (/api/manage-role/* & /api/menus/*)
// ============================================================================
export async function fetchRolesList(activeOnly = false) {
  const res = await apiRequest(`/api/manage-role/roles${activeOnly ? '?active=1' : ''}`)
  return unwrap(res).data || []
}

export async function createRoleItem(payload) {
  const res = await apiRequest('/api/manage-role/create-role', {
    method: 'POST',
    body: payload,
  })
  return unwrap(res)
}

export async function updateRoleItem(payload) {
  const res = await apiRequest('/api/manage-role/update-role', {
    method: 'POST',
    body: payload,
  })
  return unwrap(res)
}

export async function deleteRoleItem(roleId) {
  const res = await apiRequest('/api/manage-role/delete-role', {
    method: 'POST',
    body: { role_id: roleId },
  })
  return unwrap(res)
}

export async function fetchRoleTree(roleId) {
  const res = await apiRequest(`/api/manage-role/tree?role_id=${encodeURIComponent(roleId)}`)
  return unwrap(res).data
}

export async function toggleRolePermissionItem(payload) {
  const res = await apiRequest('/api/manage-role/toggle', {
    method: 'POST',
    body: payload,
  })
  return unwrap(res)
}

export async function fetchRoleUsers(roleId, q = '') {
  const params = new URLSearchParams({ role_id: String(roleId) })
  if (q) params.set('q', q)
  const res = await apiRequest(`/api/manage-role/users?${params.toString()}`)
  return unwrap(res).data
}

export async function assignUserToRole(userId, roleId) {
  const res = await apiRequest('/api/manage-role/assign-user', {
    method: 'POST',
    body: { user_id: userId, role_id: roleId },
  })
  return unwrap(res)
}

export async function fetchMenusTree() {
  const res = await apiRequest('/api/menus')
  return unwrap(res).data || []
}

export async function createMenuItem(payload) {
  const res = await apiRequest('/api/menus', {
    method: 'POST',
    body: payload,
  })
  return unwrap(res)
}

export async function updateMenuItem(id, payload) {
  const res = await apiRequest(`/api/menus/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: payload,
  })
  return unwrap(res)
}

export async function deleteMenuItem(id) {
  const res = await apiRequest(`/api/menus/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  return unwrap(res)
}

// ============================================================================
// SERVICES & ACCESS MANAGER (/api/manage-layanan/* & /api/manage-service/*)
// ============================================================================
export async function fetchLayananAccessList() {
  const res = await apiRequest('/api/manage-layanan/list')
  return unwrap(res).data || []
}

export async function fetchLayananAccessDetail(serviceId) {
  const res = await apiRequest(`/api/manage-layanan/detail?service_id=${encodeURIComponent(serviceId)}`)
  return unwrap(res).data
}

export async function searchLayananPegawai(q = '') {
  const res = await apiRequest(`/api/manage-layanan/pegawai?q=${encodeURIComponent(q)}`)
  return unwrap(res).data || []
}

export async function saveLayananAccessMode(layananId, accessMode) {
  const res = await apiRequest('/api/manage-layanan/mode', {
    method: 'POST',
    body: toFormData({ layanan_id: layananId, access_mode: accessMode }),
  })
  return unwrap(res)
}

export async function addLayananAssignee(layananId, nip) {
  const res = await apiRequest('/api/manage-layanan/assign/add', {
    method: 'POST',
    body: toFormData({ layanan_id: layananId, nip }),
  })
  return unwrap(res)
}

export async function removeLayananAssignee(layananId, nip) {
  const res = await apiRequest('/api/manage-layanan/assign/delete', {
    method: 'POST',
    body: toFormData({ layanan_id: layananId, nip }),
  })
  return unwrap(res)
}

export async function toggleLayananMaintenance(layananId, isMaintenance, maintenanceMsg = '') {
  const res = await apiRequest('/api/manage-layanan/maintenance', {
    method: 'POST',
    body: toFormData({
      layanan_id: layananId,
      is_maintenance: isMaintenance ? 1 : 0,
      maintenance_msg: maintenanceMsg,
    }),
  })
  window.dispatchEvent(
    new CustomEvent('simojang-maintenance-changed', {
      detail: { layananId, isMaintenance, maintenanceMsg },
    })
  )
  return unwrap(res)
}

export async function fetchMaintenanceServices() {
  try {
    const res = await apiRequest('/api/services/maintenance-status')
    const list = unwrap(res).data || []
    if (Array.isArray(list) && list.length > 0) {
      try {
        sessionStorage.setItem('simojang_maintenance_services', JSON.stringify(list))
      } catch (_e) {
        // Ignore session storage quota or access issues
      }
    }
    return list
  } catch {
    try {
      const res = await apiRequest('/api/public/maintenance-status')
      const list = unwrap(res).data || []
      if (Array.isArray(list) && list.length > 0) {
        sessionStorage.setItem('simojang_maintenance_services', JSON.stringify(list))
      }
      return list
    } catch {
      try {
        const fallback = JSON.parse(sessionStorage.getItem('simojang_maintenance_services') || '[]')
        if (Array.isArray(fallback)) return fallback
      } catch (_e) {
        // Ignore JSON parse or storage read issues
      }
      return []
    }
  }
}

export async function fetchServicePegawaiList(search = '') {
  const q = search ? `?search=${encodeURIComponent(search)}` : ''
  const res = await apiRequest(`/api/manage-service/pegawai${q}`)
  return unwrap(res).data || []
}

export async function fetchServicePegawaiTree(nip) {
  const res = await apiRequest(`/api/manage-service/tree?nip=${encodeURIComponent(nip)}`)
  return unwrap(res).data
}

export async function toggleServicePegawaiPermission({ nip, node_id, node_type = 'service', allowed }) {
  const res = await apiRequest('/api/manage-service/toggle', {
    method: 'POST',
    body: { nip, node_id, node_type, allowed },
  })
  return unwrap(res)
}

export async function resetServicePegawaiPermission(nip) {
  const res = await apiRequest('/api/manage-service/reset', {
    method: 'POST',
    body: { nip },
  })
  return unwrap(res)
}

export async function copyServicePegawaiPermission(sourceNip, targetNip) {
  const res = await apiRequest('/api/manage-service/copy', {
    method: 'POST',
    body: { source_nip: sourceNip, target_nip: targetNip },
  })
  return unwrap(res)
}

// ============================================================================
// SYSTEM & SMTP SETTINGS (/api/manage-setting/* & /api/manage-smtp/*)
// ============================================================================
export async function fetchSystemSettings() {
  const res = await apiRequest('/api/manage-setting/data')
  return unwrap(res).data || {}
}

export async function saveSystemSettings(payload) {
  const res = await apiRequest('/api/manage-setting/save', {
    method: 'POST',
    body: payload,
  })
  return unwrap(res)
}

export async function fetchSmtpSettings() {
  const res = await apiRequest('/api/manage-smtp/data')
  return unwrap(res).data || {}
}

export async function saveSmtpSettings(payload) {
  const res = await apiRequest('/api/manage-smtp/save', {
    method: 'POST',
    body: payload,
  })
  return unwrap(res)
}

export async function testSmtpConnection(testEmail) {
  const res = await apiRequest('/api/manage-smtp/test', {
    method: 'POST',
    body: { test_email: testEmail },
  })
  return unwrap(res)
}

// ============================================================================
// AUDIT LOG (/api/manage-log/*)
// ============================================================================
export async function fetchAuditSummary() {
  const res = await apiRequest('/api/manage-log/summary')
  return unwrap(res).data
}

export async function fetchAuditLogs(params = {}) {
  const q = new URLSearchParams()
  if (params.tab) q.set('tab', params.tab)
  if (params.page) q.set('page', String(params.page))
  if (params.per_page) q.set('per_page', String(params.per_page))
  if (params.search) q.set('search', params.search)
  if (params.date_from) q.set('date_from', params.date_from)
  if (params.date_to) q.set('date_to', params.date_to)
  if (params.event_name) q.set('event_name', params.event_name)
  if (params.layanan_id) q.set('layanan_id', String(params.layanan_id))

  const res = await apiRequest(`/api/manage-log/list?${q.toString()}`)
  const out = unwrap(res)
  return {
    rows: Array.isArray(out.data) ? out.data : [],
    meta: out.meta || { page: 1, per_page: 15, total: 0, total_page: 1 },
  }
}

export async function fetchAuditLogDetail(id) {
  const res = await apiRequest(`/api/manage-log/detail/${encodeURIComponent(id)}`)
  return unwrap(res).data
}
