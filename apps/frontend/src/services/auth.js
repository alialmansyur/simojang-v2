const AUTH_STORAGE_KEY = 'tapg-auth'
const AUTH_CHANGED_EVENT = 'tapg-auth-changed'

export function normalizeRole(input) {
  const role = String(input || '').trim().toLowerCase()
  return role || 'pegawai'
}

function emitAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

const SERVICE_URL_TO_ROUTE = {
  // PnM
  'apps-kp': '/layanan/kenaikan-pangkat',
  'apps-pg': '/layanan/pencantuman-gelar',
  'apps-tapnip': '/layanan/penetapan-nip',
  'apps-pmk': '/layanan/peninjauan-masa-kerja',
  'apps-pi': '/layanan/pindah-instansi',
  // Mutasi
  'apps-cltn': '/layanan/cltn',
  'apps-aktif': '/layanan/asn-aktif',
  'apps-cpns': '/layanan/cpns-pns',
  'apps-pensiun': '/layanan/pertek-pensiun',
  'apps-sk-pensiun': '/layanan/sk-pensiun',
  'apps-regis-pensiun': '/layanan/regis-pensiun',
  // Wasdal
  'apps-merit': '/layanan/sistem-merit',
  'apps-nspk': '/layanan/indeks-nspk',
  'apps-wasdal': '/layanan/wasdal-netralitas',
  // PMA
  'apps-mt': '/layanan/manajemen-talenta',
  'apps-pembinaan-kinerja': '/layanan/pembinaan-kinerja',
  'apps-pembinaan-kompetensi-karier': '/layanan/pengembangan-kompetensi',
  'apps-pembinaan-disiplin-budaya-citra': '/layanan/disiplin-budaya-citra',
  'apps-kompetensi': '/layanan/penilaian-kompetensi',
  'apps-karier': '/layanan/penilaian-karier',
  // SIDIGI
  'apps-statistik': '/layanan/statistik-pegawai',
  'apps-pdm': '/layanan/peremajaan-data',
  'apps-dispa': '/layanan/disparitas-data',
  'apps-integrasi': '/layanan/integrasi-siasn',
  'apps-takah': '/layanan/arsip-takah',
  'apps-dms': '/layanan/arsip-dms',
  'apps-cat': '/layanan/fasilitasi-cat',
  'apps-cat-rekap': '/layanan/fasilitasi-cat/rekap-data',
  'apps-cat-rekapitulasi': '/layanan/fasilitasi-cat/rekapitulasi',
  'apps-cat-laporan': '/layanan/fasilitasi-cat/laporan',
  'apps-cat-pengelola': '/layanan/fasilitasi-cat/pengelola',
  'layanan/fasilitasi-cat/rekap-data': '/layanan/fasilitasi-cat/rekap-data',
  'layanan/fasilitasi-cat/rekapitulasi': '/layanan/fasilitasi-cat/rekapitulasi',
  'layanan/fasilitasi-cat/laporan': '/layanan/fasilitasi-cat/laporan',
  'layanan/fasilitasi-cat/pengelola': '/layanan/fasilitasi-cat/pengelola',
  'apps-pnbp': '/layanan/pnbp-cat',
  // TU
  'apps-anggaran': '/layanan/anggaran',
  'apps-anggaran-master': '/layanan/anggaran/master',
  'apps-anggaran-realisasi': '/layanan/anggaran/realisasi',
  'layanan/anggaran/master': '/layanan/anggaran/master',
  'layanan/anggaran/realisasi': '/layanan/anggaran/realisasi',
  'apps-ikm': '/layanan/ikm',
  'apps-humas': '/layanan/humas',
  'apps-surat': '/layanan/surat',
  'apps-konsultasi': '/layanan/konsultasi',
  'apps-ikpa': '/layanan/ikpa',
  'apps-statistik-internal': '/layanan/statistik-internal',
  'apps-statistik-internal-pegawai': '/layanan/statistik-internal/data-pegawai',
  'apps-statistik-internal-peta': '/layanan/statistik-internal/peta-jabatan',
  'apps-statistik-internal-master': '/layanan/statistik-internal/master-data',
  'layanan/statistik-internal/data-pegawai': '/layanan/statistik-internal/data-pegawai',
  'layanan/statistik-internal/peta-jabatan': '/layanan/statistik-internal/peta-jabatan',
  'layanan/statistik-internal/master-data': '/layanan/statistik-internal/master-data',
  'apps-ekin': '/layanan/ekin',
  'apps-manage-assets': '/layanan/manage-assets',
  'apps-manage-project': '/layanan/manage-project',
  'apps-lost-and-found': '/layanan/lost-and-found',
  'apps-ikk': '/layanan/ikk',
}

function normalizeServicePath(rawPath, rawTitle = '') {
  const p = String(rawPath || '').trim()
  const cleanKey = p.replace(/^\/+/, '').toLowerCase()
  const t = String(rawTitle || '').trim().toLowerCase()

  if (SERVICE_URL_TO_ROUTE[cleanKey]) {
    return SERVICE_URL_TO_ROUTE[cleanKey]
  }

  if (p === '/layanan/kp' || p === '/apps-kp' || t === 'kenaikan pangkat') return '/layanan/kenaikan-pangkat'
  if (p === '/layanan/pg' || p === '/apps-pg' || t === 'pencantuman gelar') return '/layanan/pencantuman-gelar'
  if (p === '/layanan/tapnip' || p === '/apps-tapnip' || t.includes('penetapan nip')) return '/layanan/penetapan-nip'
  if (p === '/layanan/pmk' || p === '/apps-pmk' || t.includes('peninjauan masa kerja')) return '/layanan/peninjauan-masa-kerja'
  if (
    p === '/layanan/pi' ||
    p === '/apps-pi' ||
    p === '/layanan/mutasi' ||
    p === '/layanan/mutasi-instansi' ||
    t.includes('pindah instansi') ||
    t.includes('mutasi antar instansi')
  ) {
    return '/layanan/pindah-instansi'
  }
  if (p === '/layanan/anggaran' || p === '/apps-anggaran' || t.includes('anggaran dipa') || t.includes('realisasi anggaran')) {
    return '/layanan/anggaran'
  }
  if (p === '/layanan/statistik-internal' || p === '/apps-statistik-internal' || t.includes('statistik internal') || t.includes('kepegawaian internal')) {
    return '/layanan/statistik-internal'
  }

  return rawPath
}

function normalizeMenuItem(raw) {
  if (!raw || typeof raw !== 'object') return null

  const children = Array.isArray(raw.children)
    ? raw.children.map(normalizeMenuItem).filter(Boolean)
    : []

  const finalPath = raw.path ? normalizeServicePath(raw.path, raw.title) : null

  return {
    ...raw,
    id: raw.id ?? raw.code ?? raw.path ?? '',
    code: raw.code ?? '',
    title: raw.title || '',
    path: finalPath,
    icon: raw.icon || 'Circle',
    isHeader: Boolean(raw.isHeader),
    badge: raw.badge || null,
    context_group: raw.context_group || null,
    children,
  }
}

function normalizeMenuTree(input) {
  if (!Array.isArray(input)) return []
  const items = input.map(normalizeMenuItem).filter(Boolean)

  const isUsersGroup = (item) =>
    item.code === 'group-users' ||
    item.id === 'group-users' ||
    String(item.title || '').trim().toLowerCase() === 'manajemen pengguna'

  const isSettingsGroup = (item) =>
    item.code === 'group-settings' ||
    item.id === 'group-settings' ||
    String(item.title || '').trim().toLowerCase() === 'pengaturan sistem'

  const usersGroupIndex = items.findIndex(isUsersGroup)

  if (usersGroupIndex !== -1) {
    const usersGroup = items[usersGroupIndex]
    const userChildren = usersGroup.children || []

    const settingsGroup = items.find(isSettingsGroup)

    if (settingsGroup) {
      const existingPaths = new Set((settingsGroup.children || []).map((c) => c.path).filter(Boolean))
      const toAdd = userChildren.filter((c) => !c.path || !existingPaths.has(c.path))
      settingsGroup.children = [...toAdd, ...(settingsGroup.children || [])]
      items.splice(usersGroupIndex, 1)
    } else {
      items[usersGroupIndex] = {
        ...usersGroup,
        code: 'group-settings',
        id: usersGroup.id === 'group-users' ? 'group-settings' : usersGroup.id,
        title: 'Pengaturan Sistem',
      }
    }
  }

  return items
}

function collectMenuPaths(menuTree, target = []) {
  menuTree.forEach((item) => {
    if (item?.path) {
      target.push(item.path)
    }

    if (Array.isArray(item?.children) && item.children.length > 0) {
      collectMenuPaths(item.children, target)
    }
  })

  return target
}

export function mapMeResponse(raw) {
  const roles = Array.isArray(raw?.roles)
    ? raw.roles.map((role) => {
        if (typeof role === 'string') return role
        return role?.name || ''
      }).filter(Boolean)
    : []

  const permissions = Array.isArray(raw?.permissions)
    ? raw.permissions.map((permission) => {
        if (typeof permission === 'string') return permission
        return permission?.name || ''
      }).filter(Boolean)
    : []

  const menus = Array.isArray(raw?.menus)
    ? raw.menus.map((menu) => normalizeMenuItem(menu)).filter(Boolean)
    : []

  const menuTree = normalizeMenuTree(raw?.menu_tree)

  const rawAvatar = String(raw?.avatar_url || raw?.avatar || '').trim()
  const avatarUrl = rawAvatar || null

  return {
    id: raw?.id ?? null,
    name: raw?.name || raw?.fullname || '',
    fullname: raw?.fullname || raw?.name || '',
    username: raw?.username || '',
    nip: raw?.nip || raw?.pegawai?.nip || raw?.username || '',
    email: raw?.email || '',
    phone: raw?.phone || raw?.pegawai_phone || '',
    jabatan: raw?.jabatan || raw?.pegawai_jabatan || '',
    avatar: avatarUrl,
    avatar_url: avatarUrl,
    duty_location: raw?.duty_location || null,
    is_active: Boolean(raw?.is_active ?? true),
    must_reset_password: Boolean(raw?.must_reset_password),
    roles,
    permissions,
    role: raw?.role || null,
    role_name: raw?.role_name || raw?.role || '',
    last_login: raw?.last_login || null,
    created_at: raw?.created_at || null,
    menus,
    menu_tree: menuTree,
    scope: raw?.scope || null,
  }
}

export function getUserInitials(name) {
  const raw = String(name || '').trim()
  if (!raw) return 'KN'
  const words = raw.split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] || ''
  const second = words.length > 1 ? words[1]?.[0] || '' : words[0]?.[1] || ''
  return `${first}${second}`.toUpperCase() || 'KN'
}

export function buildUserSummary(session = getAuthSession()) {
  const rawUser = session?.user || {}
  const user = mapMeResponse(rawUser)
  const roleRaw = user?.roles?.[0] || user?.role || getCurrentRole()
  const rawNip = String(rawUser?.nip || rawUser?.pegawai?.nip || user?.nip || user?.username || '').trim()
  const nip = rawNip && rawNip.toLowerCase() !== 'adm' ? rawNip : ''
  const name = user?.name || 'Pegawai Kanreg III'

  return {
    id: user?.id ?? null,
    name,
    username: user?.username || '',
    nip,
    email: user?.email || '',
    phone: user?.phone || '',
    jabatan: user?.jabatan || '',
    roleRaw: roleRaw || 'pegawai',
    roleName: user?.role_name || roleRaw || 'Pegawai',
    avatar: getUserInitials(name || 'Kanreg Tiga'),
    avatarUrl: user?.avatar_url || user?.avatar || null,
    isActive: user?.is_active ?? true,
    lastLogin: user?.last_login || null,
    createdAt: user?.created_at || null,
  }
}

export function updateAuthSessionUser(partialUser) {
  const current = getAuthSession()
  if (!current) return null

  const mergedUser = {
    ...(current.user || {}),
    ...(partialUser || {}),
  }

  const nextSession = {
    ...current,
    user: {
      ...mergedUser,
      ...mapMeResponse(mergedUser),
    },
  }

  saveAuthSession(nextSession)
  return nextSession
}

export async function logoutCurrentUser() {
  const session = getAuthSession()
  const token = session?.token
  if (token) {
    const rawBase = import.meta.env.VITE_API_BASE_URL
    const apiBaseUrl = rawBase && rawBase.trim() ? rawBase.trim().replace(/\/+$/, '') : ''
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        },
      })
    } catch {
      // Abaikan gangguan jaringan saat keluar; sesi lokal tetap dibersihkan.
    }
  }
  clearAuthSession()
}

function getStorageForSession(rememberLogin) {
  return rememberLogin ? localStorage : sessionStorage
}

function readRawAuthSession() {
  const fromSession = sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (fromSession) {
    return { raw: fromSession, storage: sessionStorage, rememberLogin: false }
  }
  const fromLocal = localStorage.getItem(AUTH_STORAGE_KEY)
  if (fromLocal) {
    return { raw: fromLocal, storage: localStorage, rememberLogin: true }
  }
  return { raw: null, storage: null, rememberLogin: false }
}

export function getAuthSession() {
  const { raw, rememberLogin } = readRawAuthSession()
  if (!raw) return null

  try {
    const session = JSON.parse(raw)
    if (!session?.token || session?.is_offline_demo) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem('role')
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      sessionStorage.removeItem('role')
      return null
    }

    // Check expiration if available
    const expiresAt = session?.expires_at || session?.user?.token_expires_at
    if (expiresAt) {
      const expTime = new Date(expiresAt).getTime()
      if (!Number.isNaN(expTime) && Date.now() >= expTime) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem('role')
        sessionStorage.removeItem(AUTH_STORAGE_KEY)
        sessionStorage.removeItem('role')
        return null
      }
    }

    if (typeof session.remember_login === 'undefined') {
      session.remember_login = rememberLogin
    }

    return session
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function getCurrentRole() {
  const sessionRole = getAuthSession()?.user?.roles?.[0]
  const storedRole = sessionStorage.getItem('role') || localStorage.getItem('role')
  return normalizeRole(sessionRole || storedRole)
}

export function saveAuthSession(session, { silent = false } = {}) {
  if (!session || typeof session !== 'object') return
  const cleanSession = { ...session }
  delete cleanSession.is_offline_demo
  const hasExistingLocal = localStorage.getItem(AUTH_STORAGE_KEY) !== null
  const rememberLogin =
    typeof cleanSession.remember_login === 'boolean'
      ? cleanSession.remember_login
      : hasExistingLocal

  const normalizedSession = {
    ...cleanSession,
    remember_login: rememberLogin,
  }

  const targetStorage = getStorageForSession(rememberLogin)
  const otherStorage = getStorageForSession(!rememberLogin)

  otherStorage.removeItem(AUTH_STORAGE_KEY)
  otherStorage.removeItem('role')

  targetStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedSession))
  const role = normalizedSession?.user?.roles?.[0]
  if (role) {
    targetStorage.setItem('role', normalizeRole(role))
  }
  if (!silent) {
    emitAuthChanged()
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem('role')
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem('role')
  emitAuthChanged()
}

export function getBearerToken() {
  const session = getAuthSession()
  return session?.token ?? null
}

export function isAuthenticated() {
  return Boolean(getBearerToken())
}

export function subscribeAuthChange(listener) {
  window.addEventListener(AUTH_CHANGED_EVENT, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function getCurrentUserMenuTree(session = getAuthSession()) {
  return normalizeMenuTree(session?.user?.menu_tree)
}

export function getCurrentUserMenuPaths(session = getAuthSession()) {
  return Array.from(new Set(collectMenuPaths(getCurrentUserMenuTree(session), [])))
}

export function getCurrentUserRawUrls(session = getAuthSession()) {
  const urls = []
  const walk = (nodes) => {
    nodes.forEach((item) => {
      if (item?.raw_url) urls.push(String(item.raw_url).trim().replace(/^\/+/, '').toLowerCase())
      if (item?.url) urls.push(String(item.url).trim().replace(/^\/+/, '').toLowerCase())
      if (item?.path) urls.push(String(item.path).trim().replace(/^\/+/, '').toLowerCase())
      if (Array.isArray(item?.children) && item.children.length > 0) walk(item.children)
    })
  }
  walk(getCurrentUserMenuTree(session))
  return Array.from(new Set(urls))
}

export function hasMenuAccess(path, session = getAuthSession()) {
  if (!path) return false
  return getCurrentUserMenuPaths(session).includes(path)
}

export async function refreshAuthSession() {
  const session = getAuthSession()
  const token = session?.token
  if (!token) return null

  const rawBase = import.meta.env.VITE_API_BASE_URL
  const apiBaseUrl = rawBase && rawBase.trim() ? rawBase.trim().replace(/\/+$/, '') : ''
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuthSession()
    }
    return null
  }

  const body = await response.json()
  const mappedUser = mapMeResponse(body)

  const nextSession = {
    token,
    remember_login: Boolean(session?.remember_login),
    expires_at: body?.token_expires_at || session?.expires_at,
    user: {
      ...body,
      ...mappedUser,
    },
  }

  saveAuthSession(nextSession)
  return nextSession
}

export async function fetchUserMenuTree() {
  const session = getAuthSession()
  const token = session?.token
  if (!token) return null

  const rawBase = import.meta.env.VITE_API_BASE_URL
  const apiBaseUrl = rawBase && rawBase.trim() ? rawBase.trim().replace(/\/+$/, '') : ''

  try {
    const response = await fetch(`${apiBaseUrl}/api/user/menus`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    const tree = result?.data?.menu_tree
    if (Array.isArray(tree)) {
      const current = getAuthSession()
      if (current) {
        const prevSerialized = JSON.stringify(current?.user?.menu_tree || [])
        const normalizedTree = normalizeMenuTree(tree)
        const nextSerialized = JSON.stringify(normalizedTree)
        if (prevSerialized !== nextSerialized) {
          const nextSession = {
            ...current,
            user: {
              ...current.user,
              menu_tree: normalizedTree,
            },
          }
          saveAuthSession(nextSession, { silent: true })
        }
      }
      return tree
    }
  } catch (err) {
    console.warn('[SIMOJANG] Could not fetch menus from database:', err)
  }

  return null
}
