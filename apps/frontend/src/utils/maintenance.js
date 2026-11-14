import { getCurrentUserMenuTree } from '../services/auth.js'

export const CANONICAL_SERVICE_MAP = {
  // PnM
  kp: '/layanan/kenaikan-pangkat',
  'apps-kp': '/layanan/kenaikan-pangkat',
  'kenaikan-pangkat': '/layanan/kenaikan-pangkat',

  pg: '/layanan/pencantuman-gelar',
  'apps-pg': '/layanan/pencantuman-gelar',
  'pencantuman-gelar': '/layanan/pencantuman-gelar',

  tapnip: '/layanan/penetapan-nip',
  'apps-tapnip': '/layanan/penetapan-nip',
  'penetapan-nip': '/layanan/penetapan-nip',

  pmk: '/layanan/peninjauan-masa-kerja',
  'apps-pmk': '/layanan/peninjauan-masa-kerja',
  'peninjauan-masa-kerja': '/layanan/peninjauan-masa-kerja',

  pi: '/layanan/pindah-instansi',
  'apps-pi': '/layanan/pindah-instansi',
  mutasi: '/layanan/pindah-instansi',
  'mutasi-instansi': '/layanan/pindah-instansi',
  'pindah-instansi': '/layanan/pindah-instansi',

  // SnP
  cltn: '/layanan/cltn',
  'apps-cltn': '/layanan/cltn',

  'asn-aktif': '/layanan/asn-aktif',
  'apps-asn-aktif': '/layanan/asn-aktif',

  'cpns-pns': '/layanan/cpns-pns',
  'apps-cpns-pns': '/layanan/cpns-pns',

  'pertek-pensiun': '/layanan/pertek-pensiun',
  'apps-pertek-pensiun': '/layanan/pertek-pensiun',

  'sk-pensiun': '/layanan/sk-pensiun',
  'apps-sk-pensiun': '/layanan/sk-pensiun',

  'regis-pensiun': '/layanan/regis-pensiun',
  'apps-regis-pensiun': '/layanan/regis-pensiun',

  // Wasdal
  merit: '/layanan/sistem-merit',
  'apps-merit': '/layanan/sistem-merit',
  'sistem-merit': '/layanan/sistem-merit',

  nspk: '/layanan/indeks-nspk',
  'apps-nspk': '/layanan/indeks-nspk',
  'indeks-nspk': '/layanan/indeks-nspk',

  wasdal: '/layanan/wasdal-netralitas',
  'apps-wasdal': '/layanan/wasdal-netralitas',
  'wasdal-netralitas': '/layanan/wasdal-netralitas',
  'netralitas-disiplin': '/layanan/wasdal-netralitas',
  'pengawasan-netralitas': '/layanan/wasdal-netralitas',

  // PMA
  mt: '/layanan/manajemen-talenta',
  'apps-mt': '/layanan/manajemen-talenta',
  'manajemen-talenta': '/layanan/manajemen-talenta',

  kinerja: '/layanan/pembinaan-kinerja',
  'apps-pembinaan-kinerja': '/layanan/pembinaan-kinerja',
  'pembinaan-kinerja': '/layanan/pembinaan-kinerja',

  'pembinaan-kompetensi-karier': '/layanan/pengembangan-kompetensi',
  'apps-pembinaan-kompetensi-karier': '/layanan/pengembangan-kompetensi',
  'pengembangan-kompetensi': '/layanan/pengembangan-kompetensi',

  'pembinaan-disiplin-budaya-citra': '/layanan/disiplin-budaya-citra',
  'apps-pembinaan-disiplin-budaya-citra': '/layanan/disiplin-budaya-citra',
  disiplin: '/layanan/disiplin-budaya-citra',
  'disiplin-budaya-citra': '/layanan/disiplin-budaya-citra',

  kompetensi: '/layanan/penilaian-kompetensi',
  'apps-kompetensi': '/layanan/penilaian-kompetensi',
  'penilaian-kompetensi': '/layanan/penilaian-kompetensi',

  karier: '/layanan/penilaian-karier',
  'apps-karier': '/layanan/penilaian-karier',
  'penilaian-karier': '/layanan/penilaian-karier',

  // SIDIGI
  cat: '/layanan/fasilitasi-cat',
  'apps-cat': '/layanan/fasilitasi-cat',
  'fasilitasi-cat': '/layanan/fasilitasi-cat',

  statistik: '/layanan/statistik-pegawai',
  'apps-statistik': '/layanan/statistik-pegawai',
  'statistik-asn': '/layanan/statistik-pegawai',
  'statistik-pegawai': '/layanan/statistik-pegawai',

  pdm: '/layanan/peremajaan-data',
  'apps-pdm': '/layanan/peremajaan-data',
  'peremajaan-data': '/layanan/peremajaan-data',

  dispa: '/layanan/disparitas-data',
  'apps-dispa': '/layanan/disparitas-data',
  disparitas: '/layanan/disparitas-data',
  'disparitas-data': '/layanan/disparitas-data',

  integrasi: '/layanan/integrasi-siasn',
  'apps-integrasi': '/layanan/integrasi-siasn',
  'integrasi-siasn': '/layanan/integrasi-siasn',

  takah: '/layanan/arsip-takah',
  'apps-takah': '/layanan/arsip-takah',
  'arsip-takah': '/layanan/arsip-takah',

  dms: '/layanan/arsip-dms',
  'apps-dms': '/layanan/arsip-dms',
  'arsip-dms': '/layanan/arsip-dms',

  pnbp: '/layanan/pnbp-cat',
  'apps-pnbp': '/layanan/pnbp-cat',
  'pnbp-dokumen': '/layanan/pnbp-cat',
  'dokumen-pnbp': '/layanan/pnbp-cat',
  'pnbp-cat': '/layanan/pnbp-cat',

  // TU
  anggaran: '/layanan/anggaran',
  'apps-anggaran': '/layanan/anggaran',

  ikm: '/layanan/ikm',
  'apps-ikm': '/layanan/ikm',

  humas: '/layanan/humas',
  'apps-humas': '/layanan/humas',

  surat: '/layanan/surat',
  'apps-surat': '/layanan/surat',

  konsultasi: '/layanan/konsultasi',
  'apps-konsultasi': '/layanan/konsultasi',

  ikpa: '/layanan/ikpa',
  'apps-ikpa': '/layanan/ikpa',

  'statistik-internal': '/layanan/statistik-internal',
  'apps-statistik-internal': '/layanan/statistik-internal',

  ekin: '/layanan/ekin',
  'apps-ekin': '/layanan/ekin',

  aset: '/layanan/manage-assets',
  'apps-manage-assets': '/layanan/manage-assets',
  'manage-assets': '/layanan/manage-assets',

  proyek: '/layanan/manage-project',
  'apps-manage-project': '/layanan/manage-project',
  'manage-project': '/layanan/manage-project',

  'lost-and-found': '/layanan/lost-and-found',
  'apps-lost-and-found': '/layanan/lost-and-found',

  ikk: '/layanan/ikk',
  'apps-ikk': '/layanan/ikk',
}

export function isSuperAdminUser(session) {
  if (!session) return false
  const role = String(
    session?.user?.role ||
    session?.user?.role_code ||
    session?.user?.roles?.[0] ||
    session?.role ||
    session?.roles?.[0] ||
    ''
  ).trim().toUpperCase()
  return role === 'ADM' || role === 'ADMIN' || role === 'SUPERADMIN'
}

export function getMaintenanceServicesFromSession(session) {
  const menuTree = getCurrentUserMenuTree(session)
  if (!Array.isArray(menuTree)) return []
  const result = []

  const traverse = (items) => {
    for (const item of items) {
      if (Number(item?.is_maintenance) === 1) {
        result.push(item)
      }
      if (Array.isArray(item?.children) && item.children.length > 0) {
        traverse(item.children)
      }
    }
  }

  traverse(menuTree)
  return result
}

function resolveServiceCanonicalPaths(svc) {
  const paths = new Set()
  if (svc.path) {
    paths.add(String(svc.path).split('?')[0].replace(/\/+$/, ''))
  }

  const rawUrl = svc.url ? String(svc.url).trim().toLowerCase() : ''
  const cleanRawUrl = rawUrl.replace(/^apps[-_]/, '')

  if (rawUrl) {
    paths.add(`/${rawUrl}`)
    if (CANONICAL_SERVICE_MAP[rawUrl]) {
      paths.add(CANONICAL_SERVICE_MAP[rawUrl])
    }
  }

  if (cleanRawUrl) {
    paths.add(`/layanan/${cleanRawUrl}`)
    if (CANONICAL_SERVICE_MAP[cleanRawUrl]) {
      paths.add(CANONICAL_SERVICE_MAP[cleanRawUrl])
    }
  }

  const slug = svc.slug ? String(svc.slug).trim().toLowerCase() : ''
  if (slug) {
    paths.add(`/layanan/${slug}`)
    if (CANONICAL_SERVICE_MAP[slug]) {
      paths.add(CANONICAL_SERVICE_MAP[slug])
    }
  }

  return Array.from(paths).filter(Boolean)
}

export function matchServiceMaintenance(pathname, servicesList = []) {
  if (!pathname || !Array.isArray(servicesList) || servicesList.length === 0) {
    return null
  }

  const cleanPath = String(pathname).split('?')[0].replace(/\/+$/, '') || '/'

  // Do not block core system, dashboard, or authentication routes
  if (
    cleanPath === '/' ||
    cleanPath === '/dashboard' ||
    cleanPath === '/home' ||
    cleanPath === '/login' ||
    cleanPath === '/profile' ||
    cleanPath === '/my-tasks' ||
    cleanPath.startsWith('/settings')
  ) {
    return null
  }

  const pathKey = cleanPath.replace(/^\/layanan\//, '').replace(/^\//, '').toLowerCase()
  const canonicalActivePath = CANONICAL_SERVICE_MAP[pathKey] || cleanPath

  for (const svc of servicesList) {
    if (Number(svc.is_maintenance) !== 1) {
      continue
    }

    const candidatePaths = resolveServiceCanonicalPaths(svc)

    for (const p of candidatePaths) {
      if (
        cleanPath === p ||
        canonicalActivePath === p ||
        cleanPath.startsWith(p + '/') ||
        canonicalActivePath.startsWith(p + '/')
      ) {
        return svc
      }
    }
  }

  return null
}
