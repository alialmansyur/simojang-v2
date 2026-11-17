import {
  getAuthSession,
  getCurrentUserMenuPaths,
  getCurrentUserMenuTree,
  getCurrentUserRawUrls,
  normalizeRole,
} from '../../services/auth'

const roleMeta = {
  admin: {
    label: 'Administrator Sistem',
    homePath: '/dashboard',
  },
  pegawai: {
    label: 'Pengelola Layanan (Pegawai)',
    homePath: '/dashboard',
  },
  pimpinan: {
    label: 'Pimpinan Kanreg III',
    homePath: '/dashboard',
  },
  user: {
    label: 'Pengguna',
    homePath: '/dashboard',
  },
}

export function getRoleMeta(roleRaw) {
  const role = normalizeRole(roleRaw)
  return roleMeta[role] || {
    label: role.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    homePath: '/dashboard',
  }
}

export function getRoleHomePath(roleRaw, session = getAuthSession()) {
  const menuTree = getCurrentUserMenuTree(session)
  const firstPath = menuTree
    .flatMap((item) => (Array.isArray(item.children) && item.children.length > 0 ? item.children : [item]))
    .find((item) => item?.path)?.path

  return firstPath || getRoleMeta(roleRaw).homePath
}

export function getRoleLabel(roleRaw) {
  return getRoleMeta(roleRaw).label
}

export function getRoleMenu(_roleRaw, session = getAuthSession()) {
  const menuTree = getCurrentUserMenuTree(session)
  if (menuTree && menuTree.length > 0) {
    return menuTree
  }
  return []
}

const PUBLIC_AUTHENTICATED_PATHS = new Set([
  '/',
  '/dashboard',
  '/home',
  '/activity-gallery',
  '/gallery',
  '/calendar-event',
  '/calendar',
  '/my-tasks',
  '/profile',
])

const SETTINGS_ROUTE_REQUIREMENTS = {
  '/settings/referensi': {
    paths: ['/settings/referensi', '/ref'],
    rawPrefixes: ['ref', 'manage-instansi', 'manage-iku'],
  },
  '/settings/users': {
    paths: ['/settings/users', '/manage-user'],
    rawPrefixes: ['manage-user', 'manage-pegawai'],
  },
  '/settings/roles': {
    paths: ['/settings/roles', '/manage-role'],
    rawPrefixes: ['manage-role'],
  },
  '/settings/services': {
    paths: ['/settings/services', '/manage-layanan', '/manage-service'],
    rawPrefixes: ['manage-layanan', 'manage-service'],
  },
  '/settings/system': {
    paths: ['/settings/system', '/manage-setting', '/manage-smtp'],
    rawPrefixes: ['manage-setting', 'manage-smtp'],
  },
  '/settings/audit': {
    paths: ['/settings/audit', '/manage-log'],
    rawPrefixes: ['manage-log'],
  },
}

const LEGACY_SERVICE_PATH_MAP = {
  // PnM
  '/layanan/kp': '/layanan/kenaikan-pangkat',
  '/apps-kp': '/layanan/kenaikan-pangkat',
  'apps-kp': '/layanan/kenaikan-pangkat',
  '/layanan/pg': '/layanan/pencantuman-gelar',
  '/apps-pg': '/layanan/pencantuman-gelar',
  'apps-pg': '/layanan/pencantuman-gelar',
  '/layanan/tapnip': '/layanan/penetapan-nip',
  '/apps-tapnip': '/layanan/penetapan-nip',
  'apps-tapnip': '/layanan/penetapan-nip',
  '/layanan/pmk': '/layanan/peninjauan-masa-kerja',
  '/apps-pmk': '/layanan/peninjauan-masa-kerja',
  'apps-pmk': '/layanan/peninjauan-masa-kerja',
  '/layanan/pi': '/layanan/pindah-instansi',
  '/apps-pi': '/layanan/pindah-instansi',
  'apps-pi': '/layanan/pindah-instansi',
  '/layanan/mutasi': '/layanan/pindah-instansi',
  '/layanan/mutasi-instansi': '/layanan/pindah-instansi',
  // Mutasi
  '/apps-cltn': '/layanan/cltn',
  'apps-cltn': '/layanan/cltn',
  '/apps-aktif': '/layanan/asn-aktif',
  'apps-aktif': '/layanan/asn-aktif',
  '/apps-cpns': '/layanan/cpns-pns',
  'apps-cpns': '/layanan/cpns-pns',
  '/apps-pensiun': '/layanan/pertek-pensiun',
  'apps-pensiun': '/layanan/pertek-pensiun',
  '/apps-sk-pensiun': '/layanan/sk-pensiun',
  'apps-sk-pensiun': '/layanan/sk-pensiun',
  '/apps-regis-pensiun': '/layanan/regis-pensiun',
  'apps-regis-pensiun': '/layanan/regis-pensiun',
  // Wasdal
  '/layanan/merit': '/layanan/sistem-merit',
  '/apps-merit': '/layanan/sistem-merit',
  'apps-merit': '/layanan/sistem-merit',
  '/layanan/nspk': '/layanan/indeks-nspk',
  '/apps-nspk': '/layanan/indeks-nspk',
  'apps-nspk': '/layanan/indeks-nspk',
  '/layanan/wasdal': '/layanan/wasdal-netralitas',
  '/apps-wasdal': '/layanan/wasdal-netralitas',
  'apps-wasdal': '/layanan/wasdal-netralitas',
  '/layanan/netralitas-disiplin': '/layanan/wasdal-netralitas',
  '/layanan/pengawasan-netralitas-disiplin': '/layanan/wasdal-netralitas',
  '/layanan/pengawasan-netralitas': '/layanan/wasdal-netralitas',
  '/layanan/wasdal-evaluasi': '/layanan/wasdal-netralitas',
  '/layanan/audit-kepegawaian': '/layanan/wasdal-netralitas',
  // PMA
  '/layanan/mt': '/layanan/manajemen-talenta',
  '/apps-mt': '/layanan/manajemen-talenta',
  'apps-mt': '/layanan/manajemen-talenta',
  '/layanan/kinerja': '/layanan/pembinaan-kinerja',
  '/apps-pembinaan-kinerja': '/layanan/pembinaan-kinerja',
  'apps-pembinaan-kinerja': '/layanan/pembinaan-kinerja',
  '/layanan/pembinaan-kompetensi-karier': '/layanan/pengembangan-kompetensi',
  '/apps-pembinaan-kompetensi-karier': '/layanan/pengembangan-kompetensi',
  'apps-pembinaan-kompetensi-karier': '/layanan/pengembangan-kompetensi',
  '/layanan/pembinaan-disiplin-budaya-citra': '/layanan/disiplin-budaya-citra',
  '/apps-pembinaan-disiplin-budaya-citra': '/layanan/disiplin-budaya-citra',
  'apps-pembinaan-disiplin-budaya-citra': '/layanan/disiplin-budaya-citra',
  '/layanan/disiplin': '/layanan/disiplin-budaya-citra',
  '/layanan/kompetensi': '/layanan/penilaian-kompetensi',
  '/apps-kompetensi': '/layanan/penilaian-kompetensi',
  'apps-kompetensi': '/layanan/penilaian-kompetensi',
  '/layanan/karier': '/layanan/penilaian-karier',
  '/apps-karier': '/layanan/penilaian-karier',
  'apps-karier': '/layanan/penilaian-karier',
  // SIDIGI
  '/layanan/cat': '/layanan/fasilitasi-cat',
  '/apps-cat': '/layanan/fasilitasi-cat',
  'apps-cat': '/layanan/fasilitasi-cat',
  '/layanan/statistik': '/layanan/statistik-pegawai',
  '/layanan/statistik-asn': '/layanan/statistik-pegawai',
  '/apps-statistik': '/layanan/statistik-pegawai',
  'apps-statistik': '/layanan/statistik-pegawai',
  '/layanan/pdm': '/layanan/peremajaan-data',
  '/apps-pdm': '/layanan/peremajaan-data',
  'apps-pdm': '/layanan/peremajaan-data',
  '/layanan/dispa': '/layanan/disparitas-data',
  '/layanan/disparitas': '/layanan/disparitas-data',
  '/apps-dispa': '/layanan/disparitas-data',
  'apps-dispa': '/layanan/disparitas-data',
  '/layanan/integrasi': '/layanan/integrasi-siasn',
  '/apps-integrasi': '/layanan/integrasi-siasn',
  'apps-integrasi': '/layanan/integrasi-siasn',
  '/layanan/takah': '/layanan/arsip-takah',
  '/apps-takah': '/layanan/arsip-takah',
  'apps-takah': '/layanan/arsip-takah',
  '/layanan/dms': '/layanan/arsip-dms',
  '/apps-dms': '/layanan/arsip-dms',
  'apps-dms': '/layanan/arsip-dms',
  '/layanan/pnbp': '/layanan/pnbp-cat',
  '/layanan/pnbp-dokumen': '/layanan/pnbp-cat',
  '/layanan/dokumen-pnbp': '/layanan/pnbp-cat',
  '/apps-pnbp': '/layanan/pnbp-cat',
  'apps-pnbp': '/layanan/pnbp-cat',
  // TU
  '/layanan/anggaran': '/layanan/anggaran',
  '/apps-anggaran': '/layanan/anggaran',
  'apps-anggaran': '/layanan/anggaran',
  '/layanan/ikm': '/layanan/ikm',
  '/apps-ikm': '/layanan/ikm',
  'apps-ikm': '/layanan/ikm',
  '/layanan/humas': '/layanan/humas',
  '/apps-humas': '/layanan/humas',
  'apps-humas': '/layanan/humas',
  '/layanan/surat': '/layanan/surat',
  '/apps-surat': '/layanan/surat',
  'apps-surat': '/layanan/surat',
  '/apps-naskah': '/layanan/surat',
  'apps-naskah': '/layanan/surat',
  '/layanan/konsultasi': '/layanan/konsultasi',
  '/apps-konsultasi': '/layanan/konsultasi',
  'apps-konsultasi': '/layanan/konsultasi',
  '/layanan/ikpa': '/layanan/ikpa',
  '/apps-ikpa': '/layanan/ikpa',
  'apps-ikpa': '/layanan/ikpa',
  '/layanan/statistik-internal': '/layanan/statistik-internal',
  '/apps-statistik-internal': '/layanan/statistik-internal',
  'apps-statistik-internal': '/layanan/statistik-internal',
  '/layanan/ekin': '/layanan/ekin',
  '/apps-ekin': '/layanan/ekin',
  'apps-ekin': '/layanan/ekin',
  '/layanan/aset': '/layanan/manage-assets',
  '/layanan/manage-assets': '/layanan/manage-assets',
  '/apps-manage-assets': '/layanan/manage-assets',
  'apps-manage-assets': '/layanan/manage-assets',
  '/layanan/proyek': '/layanan/manage-project',
  '/layanan/manage-project': '/layanan/manage-project',
  '/apps-manage-project': '/layanan/manage-project',
  'apps-manage-project': '/layanan/manage-project',
  '/layanan/lost-and-found': '/layanan/lost-and-found',
  '/apps-lost-and-found': '/layanan/lost-and-found',
  'apps-lost-and-found': '/layanan/lost-and-found',
  '/layanan/ikk': '/layanan/ikk',
  '/apps-ikk': '/layanan/ikk',
  'apps-ikk': '/layanan/ikk',
}

export function canAccessRoute(path, session = getAuthSession()) {
  if (!path) return false
  const cleanPath = String(path).split('?')[0].replace(/\/+$/, '') || '/'
  const roleCode = String(session?.user?.role || session?.user?.roles?.[0] || 'USR').trim().toUpperCase()

  if (PUBLIC_AUTHENTICATED_PATHS.has(cleanPath)) {
    return true
  }

  if (
    cleanPath.startsWith('/layanan/fasilitasi-cat/laporan/esign') ||
    cleanPath.startsWith('/public/cat-esign')
  ) {
    return true
  }

  if (roleCode === 'ADM') {
    return true
  }

  const menuTree = getCurrentUserMenuTree(session)
  const rawMenuPaths = getCurrentUserMenuPaths(session)
  const normalizedMenuPaths = Array.from(
    new Set(rawMenuPaths.map((p) => LEGACY_SERVICE_PATH_MAP[p] || p))
  )
  const rawUrls = getCurrentUserRawUrls(session)

  const hasSettingsRequirement = (rule) => {
    if (!rule) return false
    if (rule.paths.some((p) => normalizedMenuPaths.includes(p) || rawMenuPaths.includes(p))) return true
    return rule.rawPrefixes.some((prefix) =>
      rawUrls.some((raw) => raw === prefix || raw.startsWith(`${prefix}/`))
    )
  }

  if (cleanPath === '/settings') {
    return ['/settings/users', '/settings/roles', '/settings/services', '/settings/system', '/settings/audit'].some(
      (subPath) => hasSettingsRequirement(SETTINGS_ROUTE_REQUIREMENTS[subPath])
    )
  }

  if (SETTINGS_ROUTE_REQUIREMENTS[cleanPath]) {
    return hasSettingsRequirement(SETTINGS_ROUTE_REQUIREMENTS[cleanPath])
  }

  if (cleanPath.startsWith('/tim-kerja/')) {
    const tkSlug = cleanPath.replace('/tim-kerja/', '').toLowerCase()
    return menuTree.some(
      (item) =>
        String(item.id || '').toLowerCase() === `tk-${tkSlug}` &&
        Array.isArray(item.children) &&
        item.children.length > 0
    )
  }

  if (cleanPath.startsWith('/layanan/')) {
    if (cleanPath.startsWith('/layanan/fasilitasi-cat/pengelola')) {
      return (
        normalizedMenuPaths.includes('/layanan/fasilitasi-cat') ||
        normalizedMenuPaths.includes('/layanan/pnbp-cat')
      )
    }
    if (cleanPath.startsWith('/layanan/fasilitasi-cat')) {
      return normalizedMenuPaths.includes('/layanan/fasilitasi-cat')
    }

    // 1. Direct check for exact route
    const normalizedServicePath = LEGACY_SERVICE_PATH_MAP[cleanPath] || cleanPath
    if (
      normalizedMenuPaths.includes(normalizedServicePath) ||
      normalizedMenuPaths.includes(cleanPath) ||
      rawMenuPaths.includes(cleanPath)
    ) {
      return true
    }

    // 2. Base service route check for nested/child routes
    // e.g. /layanan/statistik-internal/data-pegawai -> base: /layanan/statistik-internal
    // e.g. /layanan/anggaran/master -> base: /layanan/anggaran
    const segments = cleanPath.split('/').filter(Boolean)
    if (segments.length >= 2) {
      const baseServicePath = `/${segments[0]}/${segments[1]}`
      const normalizedBasePath = LEGACY_SERVICE_PATH_MAP[baseServicePath] || baseServicePath
      const serviceSlug = segments[1]
      const hasRawMatch = rawUrls.some(
        (raw) =>
          raw === serviceSlug ||
          raw === `apps-${serviceSlug}` ||
          raw === `/apps-${serviceSlug}`
      )

      if (
        normalizedMenuPaths.includes(normalizedBasePath) ||
        normalizedMenuPaths.includes(baseServicePath) ||
        rawMenuPaths.includes(baseServicePath) ||
        hasRawMatch
      ) {
        return true
      }
    }

    return false
  }

  return normalizedMenuPaths.includes(cleanPath) || rawMenuPaths.includes(cleanPath)
}

export const ROLE_OPTIONS = Object.entries(roleMeta).map(([value, meta]) => ({
  value,
  label: meta.label,
  homePath: meta.homePath,
}))
