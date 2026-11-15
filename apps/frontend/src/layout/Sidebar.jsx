import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import * as LucideIcons from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { buildUserSummary, fetchUserMenuTree, logoutCurrentUser, subscribeAuthChange } from '../services/auth'
import { UserAvatar } from '../components/shared/UserAvatar'
import { getRoleMenu } from '../modules/navigation/config'
import { EXTERNAL_SERVICES_LIST } from '../config/simojangNavigation'

// Dynamic Icon Renderer with resilient fallbacks
const DynamicIcon = ({ name, className }) => {
  let iconName = name
  if (typeof iconName === 'string') {
    if (iconName.includes('grid') || iconName.includes('home')) iconName = 'LayoutDashboard'
    else if (iconName.includes('calendar')) iconName = 'Calendar'
    else if (iconName.includes('camera') || iconName.includes('image')) iconName = 'Image'
    else if (iconName.includes('chat') || iconName.includes('person') || iconName.includes('user')) iconName = 'Users'
    else if (iconName.includes('gear') || iconName.includes('setting')) iconName = 'Settings'
    else if (iconName.includes('slider')) iconName = 'Sliders'
    else if (iconName.includes('mail') || iconName.includes('envelope')) iconName = 'Mail'
    else if (iconName.includes('table')) iconName = 'Table'
    else if (iconName.includes('stack') || iconName.includes('layer')) iconName = 'Layers'
    else if (iconName.includes('file')) iconName = 'FileText'
    else if (iconName.includes('collection') || iconName.includes('folder')) iconName = 'FolderKanban'
  }
  const IconComponent = LucideIcons[iconName] || LucideIcons[name] || LucideIcons['Circle']
  return <IconComponent className={className} />
}

// Normalizer rute layanan deskriptif untuk menjamin link sidebar selalu valid
export const normalizeServicePath = (child) => {
  const rawPath = String(child?.path || '').trim()
  const rawTitle = String(child?.title || '').trim().toLowerCase()

  // Tata Usaha (TU) Services Normalization
  if (rawPath === '/layanan/anggaran' || rawPath === '/apps-anggaran' || rawPath === 'apps-anggaran' || rawTitle.includes('anggaran dipa') || rawTitle.includes('realisasi anggaran')) {
    return '/layanan/anggaran'
  }
  if (rawPath === '/layanan/ikm' || rawPath === '/apps-ikm' || rawPath === 'apps-ikm' || rawTitle.includes('survey ikm') || rawTitle.includes('kepuasan masyarakat')) {
    return '/layanan/ikm'
  }
  if (rawPath === '/layanan/humas' || rawPath === '/apps-humas' || rawPath === 'apps-humas' || rawTitle.includes('kehumasan') || rawTitle.includes('publikasi humas')) {
    return '/layanan/humas'
  }
  if (rawPath === '/layanan/surat' || rawPath === '/apps-surat' || rawPath === 'apps-surat' || rawPath === '/apps-naskah' || rawTitle.includes('persuratan') || rawTitle.includes('naskah dinas')) {
    return '/layanan/surat'
  }
  if (rawPath === '/layanan/konsultasi' || rawPath === '/apps-konsultasi' || rawPath === 'apps-konsultasi' || rawTitle.includes('pelayanan konsultasi') || rawTitle.includes('konsultasi')) {
    return '/layanan/konsultasi'
  }
  if (rawPath === '/layanan/ikpa' || rawPath === '/apps-ikpa' || rawPath === 'apps-ikpa' || rawTitle.includes('ikpa') || rawTitle.includes('kinerja pelaksanaan anggaran')) {
    return '/layanan/ikpa'
  }
  if (rawPath === '/layanan/statistik-internal' || rawPath === '/apps-statistik-internal' || rawPath === 'apps-statistik-internal' || rawTitle.includes('statistik internal') || rawTitle.includes('kepegawaian internal')) {
    return '/layanan/statistik-internal'
  }
  if (rawPath === '/layanan/ekin' || rawPath === '/apps-ekin' || rawPath === 'apps-ekin' || rawTitle.includes('e-kinerja') || rawTitle.includes('ekin')) {
    return '/layanan/ekin'
  }
  if (rawPath === '/layanan/manage-assets' || rawPath === '/apps-manage-assets' || rawPath === 'apps-manage-assets' || rawPath === '/layanan/aset' || rawTitle.includes('manajemen aset') || rawTitle.includes('aset bmn')) {
    return '/layanan/manage-assets'
  }
  if (rawPath === '/layanan/manage-project' || rawPath === '/apps-manage-project' || rawPath === 'apps-manage-project' || rawPath === '/layanan/proyek' || rawTitle.includes('manajemen proyek') || rawTitle.includes('proyek')) {
    return '/layanan/manage-project'
  }
  if (rawPath === '/layanan/lost-and-found' || rawPath === '/apps-lost-and-found' || rawPath === 'apps-lost-and-found' || rawTitle.includes('barang hilang') || rawTitle.includes('lost and found')) {
    return '/layanan/lost-and-found'
  }
  if (rawPath === '/layanan/ikk' || rawPath === '/apps-ikk' || rawPath === 'apps-ikk' || rawTitle.includes('capaian ikk') || rawTitle.includes('manajemen capaian ikk')) {
    return '/layanan/ikk'
  }

  if (rawPath === '/layanan/kp' || rawPath === '/apps-kp' || rawPath === 'apps-kp' || rawTitle === 'kenaikan pangkat') {
    return '/layanan/kenaikan-pangkat'
  }
  if (rawPath === '/layanan/pg' || rawPath === '/apps-pg' || rawPath === 'apps-pg' || rawTitle === 'pencantuman gelar') {
    return '/layanan/pencantuman-gelar'
  }
  if (rawPath === '/layanan/tapnip' || rawPath === '/apps-tapnip' || rawPath === 'apps-tapnip' || rawTitle.includes('penetapan nip')) {
    return '/layanan/penetapan-nip'
  }
  if (rawPath === '/layanan/pmk' || rawPath === '/apps-pmk' || rawPath === 'apps-pmk' || rawTitle.includes('peninjauan masa kerja')) {
    return '/layanan/peninjauan-masa-kerja'
  }
  if (
    rawPath === '/layanan/pi' ||
    rawPath === '/apps-pi' ||
    rawPath === 'apps-pi' ||
    rawPath === '/layanan/mutasi' ||
    rawPath === '/layanan/mutasi-instansi' ||
    rawTitle.includes('pindah instansi') ||
    rawTitle.includes('mutasi antar instansi')
  ) {
    return '/layanan/pindah-instansi'
  }

  // Wasdal Services Normalization
  if (
    rawPath === '/layanan/merit' ||
    rawPath === '/apps-merit' ||
    rawPath === 'apps-merit' ||
    rawPath === '/layanan/sistem-merit' ||
    rawTitle.includes('sistem merit')
  ) {
    return '/layanan/sistem-merit'
  }
  if (
    rawPath === '/layanan/nspk' ||
    rawPath === '/apps-nspk' ||
    rawPath === 'apps-nspk' ||
    rawPath === '/layanan/indeks-nspk' ||
    rawTitle.includes('nspk') ||
    rawTitle.includes('indeks nspk')
  ) {
    return '/layanan/indeks-nspk'
  }
  if (
    rawPath === '/layanan/wasdal' ||
    rawPath === '/apps-wasdal' ||
    rawPath === 'apps-wasdal' ||
    rawPath === '/layanan/wasdal-netralitas' ||
    rawPath === '/layanan/netralitas-disiplin' ||
    rawPath === '/layanan/pengawasan-netralitas-disiplin' ||
    rawTitle.includes('netralitas') ||
    rawTitle.includes('pengawasan penerapan netralitas') ||
    (rawTitle.includes('disiplin') && (rawTitle.includes('pengawasan') || rawTitle.includes('kode etik') || rawTitle.includes('perilaku')))
  ) {
    return '/layanan/wasdal-netralitas'
  }

  // PMA Services Normalization
  if (rawPath === '/layanan/mt' || rawPath === '/apps-mt' || rawPath === 'apps-mt' || rawTitle.includes('manajemen talenta')) {
    return '/layanan/manajemen-talenta'
  }
  if (rawPath === '/layanan/kinerja' || rawPath === '/apps-pembinaan-kinerja' || rawPath === 'apps-pembinaan-kinerja' || rawTitle.includes('pembinaan kinerja')) {
    return '/layanan/pembinaan-kinerja'
  }
  if (
    rawPath === '/layanan/pembinaan-kompetensi-karier' ||
    rawPath === '/apps-pembinaan-kompetensi-karier' ||
    rawPath === 'apps-pembinaan-kompetensi-karier' ||
    rawTitle.includes('pengembangan kompetensi')
  ) {
    return '/layanan/pengembangan-kompetensi'
  }
  if (
    rawPath === '/layanan/pembinaan-disiplin-budaya-citra' ||
    rawPath === '/apps-pembinaan-disiplin-budaya-citra' ||
    rawPath === 'apps-pembinaan-disiplin-budaya-citra' ||
    rawPath === '/layanan/disiplin-budaya-citra' ||
    rawTitle.includes('budaya kerja') ||
    rawTitle.includes('citra institusi') ||
    (rawTitle.includes('disiplin') && rawTitle.includes('pembinaan'))
  ) {
    return '/layanan/disiplin-budaya-citra'
  }
  if (rawPath === '/layanan/kompetensi' || rawPath === '/apps-kompetensi' || rawPath === 'apps-kompetensi' || rawTitle.includes('penilaian kompetensi')) {
    return '/layanan/penilaian-kompetensi'
  }
  if (rawPath === '/layanan/karier' || rawPath === '/apps-karier' || rawPath === 'apps-karier' || rawTitle.includes('penilaian karier')) {
    return '/layanan/penilaian-karier'
  }

  // SIDIGI Services Normalization
  if (
    rawPath === '/layanan/statistik-pegawai' ||
    rawPath === '/apps-statistik' ||
    rawPath === 'apps-statistik' ||
    rawPath === '/layanan/statistik' ||
    rawPath === '/layanan/statistik-asn' ||
    rawTitle.includes('statistik data kepegawaian') ||
    rawTitle.includes('penyajian data statistik') ||
    rawTitle.includes('statistik pegawai')
  ) {
    return '/layanan/statistik-pegawai'
  }
  if (
    rawPath === '/layanan/peremajaan-data' ||
    rawPath === '/apps-pdm' ||
    rawPath === 'apps-pdm' ||
    rawPath === '/layanan/pdm' ||
    rawTitle.includes('peremajaan data') ||
    rawTitle.includes('pdm')
  ) {
    return '/layanan/peremajaan-data'
  }
  if (
    rawPath === '/layanan/disparitas-data' ||
    rawPath === '/apps-dispa' ||
    rawPath === 'apps-dispa' ||
    rawPath === '/layanan/dispa' ||
    rawPath === '/layanan/disparitas' ||
    rawTitle.includes('disparitas') ||
    rawTitle.includes('peningkatan kualitas data')
  ) {
    return '/layanan/disparitas-data'
  }
  if (
    rawPath === '/layanan/integrasi-siasn' ||
    rawPath === '/apps-integrasi' ||
    rawPath === 'apps-integrasi' ||
    rawPath === '/layanan/integrasi' ||
    rawTitle.includes('integrasi siasn') ||
    rawTitle.includes('integrasi')
  ) {
    return '/layanan/integrasi-siasn'
  }
  if (
    rawPath === '/layanan/arsip-takah' ||
    rawPath === '/apps-takah' ||
    rawPath === 'apps-takah' ||
    rawPath === '/layanan/takah' ||
    rawTitle.includes('takah') ||
    (rawTitle.includes('arsip') && !rawTitle.includes('digital') && !rawTitle.includes('dms'))
  ) {
    return '/layanan/arsip-takah'
  }
  if (
    rawPath === '/layanan/arsip-dms' ||
    rawPath === '/apps-dms' ||
    rawPath === 'apps-dms' ||
    rawPath === '/layanan/dms' ||
    rawTitle.includes('digitalisasi') ||
    rawTitle.includes('dms')
  ) {
    return '/layanan/arsip-dms'
  }
  if (
    rawPath === '/layanan/fasilitasi-cat' ||
    rawPath === '/apps-cat' ||
    rawPath === 'apps-cat' ||
    rawPath === '/layanan/cat' ||
    rawPath === 'cat' ||
    rawTitle.includes('fasilitasi seleksi') ||
    rawTitle.includes('computer assisted test') ||
    rawTitle.includes('fasilitasi cat') ||
    (rawTitle.includes('fasilitasi') && rawTitle.includes('cat')) ||
    (rawTitle.includes('seleksi') && rawTitle.includes('cat') && !rawTitle.includes('pnbp'))
  ) {
    return '/layanan/fasilitasi-cat'
  }
  if (
    rawPath === '/layanan/pnbp-cat' ||
    rawPath === '/apps-pnbp' ||
    rawPath === 'apps-pnbp' ||
    rawPath === '/layanan/pnbp' ||
    rawPath === '/layanan/pnbp-dokumen' ||
    rawTitle.includes('seleksi pnbp') ||
    rawTitle.includes('pnbp')
  ) {
    return '/layanan/pnbp-cat'
  }

  if (rawPath && !rawPath.startsWith('/') && !rawPath.startsWith('http')) {
    return `/${rawPath}`
  }

  return child?.path
}

/**
 * Intelligent post-processor to structure and sort all menus:
 * 1. Menu Navigasi Utama: Dashboard (Home/Beranda diubah jadi Dashboard), Galeri Kegiatan, Kalender Kegiatan, Layanan Saya
 * 2. Tim Kerja Layanan: Hanya 6 Tim Kerja dan sublayanannya (A-Z)
 * 3. Pengaturan & Referensi: Setting, Referensi, Hak Akses, Audit (A-Z)
 */
function organizeAndSortMenuTree(rawItems = []) {
  const safeRawItems = Array.isArray(rawItems) ? rawItems : []

  const timKerjaSection = []
  const settingsSection = []
  const externalSection = []

  // Filter out any raw/pre-existing headers to rebuild clean structure
  const items = safeRawItems.filter((i) => !i.isHeader)

  let dashboardItem = null
  let galeriItem = null
  let kalenderItem = null
  let myTasksItem = null

  for (const item of items) {
    const titleLower = String(item.title || '').toLowerCase().trim()
    const pathLower = String(item.path || '').toLowerCase().trim()
    const idLower = String(item.id || '').toLowerCase().trim()

    // 1. Layanan Lainnya / Aplikasi Eksternal (DIUTAMAKAN PERTAMA agar tidak tertangkap oleh filter dashboard internal)
    const isExternalApp = Boolean(
      item.is_external ||
      pathLower.startsWith('http://') ||
      pathLower.startsWith('https://') ||
      item.target_url ||
      idLower.includes('external') ||
      idLower.includes('layanan-lain') ||
      titleLower.includes('layanan lainnya') ||
      titleLower.includes('eksternal') ||
      titleLower.includes('dashboard executive') ||
      titleLower.includes('dashboard simanja') ||
      titleLower.includes('sikasep') ||
      titleLower.includes('simanja') ||
      titleLower.includes('siwaregtilu') ||
      titleLower.includes('siolin')
    )

    if (isExternalApp) {
      externalSection.push(item)
      continue
    }

    // 2. Dashboard Utama Internal SIMOJANG (Strict Match: Hanya Home / Beranda / Dashboard Utama)
    const isMainDashboard =
      pathLower === '/dashboard' ||
      pathLower === '/' ||
      pathLower === 'dashboard' ||
      pathLower === 'home' ||
      idLower === 'dashboard' ||
      idLower === 'home' ||
      idLower === 'menu-94' ||
      titleLower === 'dashboard' ||
      titleLower === 'home' ||
      titleLower === 'beranda' ||
      titleLower === 'dashboard utama'

    if (isMainDashboard) {
      dashboardItem = {
        id: 'dashboard',
        title: 'Dashboard',
        path: '/dashboard',
        icon: item.icon || 'LayoutDashboard',
      }
      continue
    }

    // 3. Galeri Kegiatan (Pindah ke bawah Dashboard)
    const isGaleri =
      pathLower === '/activity-gallery' ||
      pathLower === '/gallery' ||
      idLower === 'activity-gallery' ||
      idLower === 'gallery' ||
      idLower === 'menu-98' ||
      titleLower === 'galeri' ||
      titleLower === 'galeri kegiatan'

    if (isGaleri) {
      galeriItem = {
        id: 'activity-gallery',
        title: 'Galeri Kegiatan',
        path: '/activity-gallery',
        icon: item.icon || 'Image',
      }
      continue
    }

    // 4. Kalender Kegiatan (Pindah ke bawah Dashboard)
    const isKalender =
      pathLower === '/calendar-event' ||
      pathLower === '/calendar' ||
      idLower === 'calendar-event' ||
      idLower === 'calendar' ||
      idLower === 'menu-95' ||
      titleLower === 'kalender' ||
      titleLower === 'kalender kegiatan' ||
      titleLower === 'kalender kantor' ||
      titleLower === 'agenda'

    if (isKalender) {
      kalenderItem = {
        id: 'calendar-event',
        title: 'Kalender Kegiatan',
        path: '/calendar-event',
        icon: item.icon || 'Calendar',
      }
      continue
    }

    // 5. Layanan Saya
    if (
      pathLower === '/my-tasks' ||
      titleLower.includes('layanan saya') ||
      idLower.includes('my-tasks')
    ) {
      myTasksItem = item
      continue
    }

    // 6. Tim Kerja Layanan (Prioritaskan grup Tim Kerja agar layanan seperti manage-assets / manage-project tidak tertangkap filter setting)
    const isTimKerjaGroup =
      idLower.startsWith('tk-') ||
      idLower.startsWith('tim-') ||
      (Array.isArray(item.children) &&
        item.children.some((c) => String(c.path || '').toLowerCase().startsWith('/layanan/')))

    if (isTimKerjaGroup) {
      timKerjaSection.push(item)
      continue
    }

    // 7. Setting & Referensi -> Pengaturan & Referensi (termasuk parent group Pengaturan Sistem / Kelola Data)
    const hasSettingsChild =
      Array.isArray(item.children) &&
      item.children.some((c) => {
        const cp = String(c.path || '').toLowerCase().trim()
        const craw = String(c.raw_url || '').toLowerCase().trim()
        return (
          cp.startsWith('/settings') ||
          cp === '/ref' ||
          cp.startsWith('/ref/') ||
          craw === 'ref' ||
          craw.startsWith('ref/') ||
          craw.startsWith('manage-user') ||
          craw.startsWith('manage-pegawai') ||
          craw.startsWith('manage-role') ||
          craw.startsWith('manage-layanan') ||
          craw.startsWith('manage-service') ||
          craw.startsWith('manage-setting') ||
          craw.startsWith('manage-smtp') ||
          craw.startsWith('manage-log') ||
          craw.startsWith('manage-instansi') ||
          craw.startsWith('manage-iku')
        )
      })

    if (
      pathLower.includes('setting') ||
      pathLower === '/ref' ||
      pathLower.startsWith('/manage-') ||
      titleLower.includes('pengaturan') ||
      titleLower.includes('setting') ||
      titleLower.includes('referensi') ||
      titleLower.includes('hak akses') ||
      titleLower.includes('audit') ||
      titleLower.includes('kelola data') ||
      hasSettingsChild
    ) {
      settingsSection.push(item)
      continue
    }

    // 8. Fallback Tim Kerja Layanan (Divisi Kerja & Layanannya)
    timKerjaSection.push(item)
  }

  // Helper untuk mengurutkan sub-menu A-Z (menyingkirkan menu 'Ringkasan') dan auto-normalisasi path
  const sortSubItems = (children) => {
    if (!Array.isArray(children)) return []
    return children
      .filter((child) => !String(child.title || '').toLowerCase().startsWith('ringkasan'))
      .map((child) => ({
        ...child,
        path: normalizeServicePath(child),
      }))
      .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
  }

  // Helper penyederhana label Tim Kerja untuk menghilangkan truncation (...) di sidebar
  const simplifyTimKerjaTitle = (title) => {
    if (!title) return ''
    const raw = String(title).toLowerCase().trim()
    if (raw.includes('tata usaha')) return 'Tata Usaha'
    if (raw.includes('pembinaan')) return 'Pembinaan Manajemen ASN'
    if (raw.includes('pengangkatan') || raw.includes('mutasi')) return 'Pengangkatan & Mutasi'
    if (raw.includes('pengawasan') || raw.includes('wasdal') || raw.includes('pengendalian')) return 'Pengawasan & Pengendalian'
    if (raw.includes('sistem informasi') || raw.includes('digital') || raw.includes('sidigi')) return 'Sistem Informasi & Digitalisasi'
    if (raw.includes('status') || raw.includes('pemberhentian')) return 'Status & Pemberhentian'
    return title.replace(/^Tim Kerja\s+/i, '').replace(/\s+dan\s+/gi, ' & ')
  }

  // Sort Tim Kerja A-Z dan sub-layanan A-Z
  const sortedTimKerja = [...timKerjaSection]
    .map((tk) => ({
      ...tk,
      title: simplifyTimKerjaTitle(tk.title),
      icon: tk.icon || 'Briefcase',
      children: sortSubItems(tk.children),
    }))
    .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))

  // Sort Settings & Referensi A-Z
  const sortedSettings = [...settingsSection]
    .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
    .map((item) => ({
      ...item,
      icon: item.icon || 'Settings',
      children: sortSubItems(item.children),
    }))

  const tree = []

  // Section 1: Navigasi Utama (Dashboard, Galeri, Kalender, Layanan Saya)
  tree.push({
    id: 'hdr-utama',
    title: 'Menu Utama',
    isHeader: true,
  })
  
  tree.push(dashboardItem || {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
  })

  tree.push(galeriItem || {
    id: 'activity-gallery',
    title: 'Galeri Kegiatan',
    path: '/activity-gallery',
    icon: 'Image',
  })

  tree.push(kalenderItem || {
    id: 'calendar-event',
    title: 'Kalender Kegiatan',
    path: '/calendar-event',
    icon: 'Calendar',
  })

  if (myTasksItem) {
    tree.push(myTasksItem)
  }

  // Section 2: Tim Kerja Layanan (Hanya 6 Tim Kerja, Terurut A-Z)
  if (sortedTimKerja.length > 0) {
    tree.push({
      id: 'hdr-timkerja',
      title: 'Tim Kerja Layanan',
      isHeader: true,
    })
    tree.push(...sortedTimKerja)
  }

  // Section 3: Layanan Lainnya (Aplikasi Eksternal - Standalone Flat List Langsung di Bawah Section Header HR)
  const flattenedExternal = []
  if (externalSection.length > 0) {
    for (const ext of externalSection) {
      if (Array.isArray(ext.children) && ext.children.length > 0) {
        for (const child of ext.children) {
          flattenedExternal.push({
            id: child.id || `ext-${child.title}`,
            title: child.title,
            path: child.target_url || child.path || child.url,
            target_url: child.target_url || child.path || child.url,
            icon: child.icon || 'ExternalLink',
            is_external: true,
          })
        }
      } else if (ext.title && !ext.title.toLowerCase().includes('layanan lainnya')) {
        flattenedExternal.push({
          id: ext.id || `ext-${ext.title}`,
          title: ext.title,
          path: ext.target_url || ext.path || ext.url,
          target_url: ext.target_url || ext.path || ext.url,
          icon: ext.icon || 'ExternalLink',
          is_external: true,
        })
      }
    }
  }

  // Normalizer metadata & icon pencocokan dengan SSOT EXTERNAL_SERVICES_LIST
  const resolveExternalAppMeta = (item) => {
    const titleLower = String(item.title || '').toLowerCase().trim()
    const match = EXTERNAL_SERVICES_LIST.find((def) => {
      const defLower = def.title.toLowerCase().trim()
      return titleLower === defLower || titleLower.includes(defLower) || defLower.includes(titleLower)
    })

    return {
      id: item.id || match?.id || `ext-${item.title}`,
      title: item.title || match?.title, // Prioritaskan penulisan asli dari database
      path: item.target_url || item.path || item.url || match?.path || '#',
      target_url: item.target_url || item.path || item.url || match?.target_url || '#',
      icon: item.icon && item.icon !== 'Circle' && item.icon !== 'ExternalLink' ? item.icon : (match?.icon || 'ExternalLink'),
      is_external: true,
    }
  }

  const finalExternalList = []
  const seenTitles = new Set()

  // 1. Masukkan item yang berasal dari database API
  for (const rawExt of flattenedExternal) {
    const resolved = resolveExternalAppMeta(rawExt)
    const key = resolved.title.toLowerCase().trim()
    if (!seenTitles.has(key)) {
      seenTitles.add(key)
      finalExternalList.push(resolved)
    }
  }

  // 2. Pastikan keenam list lengkap (Dashboard Executive, Dashboard Simanja, SIKASEP, SIMANJA, SIWAREGTILU, SIOLIN)
  for (const defaultSvc of EXTERNAL_SERVICES_LIST) {
    const key = defaultSvc.title.toLowerCase().trim()
    if (!seenTitles.has(key)) {
      seenTitles.add(key)
      finalExternalList.push(defaultSvc)
    }
  }

  if (finalExternalList.length > 0) {
    tree.push({
      id: 'hdr-external',
      title: 'Layanan Lainnya',
      isHeader: true,
    })
    tree.push(...finalExternalList.map((svc) => ({
      ...svc,
      is_external: true,
      target_url: svc.target_url || svc.path,
      icon: svc.icon || 'ExternalLink',
      children: undefined, // Tanpa dropdown accordion, flat standalone items
    })))
  }

  // Section 4: Pengaturan & Referensi (Hanya tampil jika role memiliki izin pada RBAC backend)
  if (sortedSettings.length > 0) {
    const flatSettingsNodes = sortedSettings.flatMap((item) =>
      Array.isArray(item.children) && item.children.length > 0 ? [item, ...item.children] : [item]
    )

    const hasReferensiAccess = flatSettingsNodes.some((node) => {
      const p = String(node.path || '').toLowerCase()
      const raw = String(node.raw_url || '').toLowerCase()
      const t = String(node.title || '').toLowerCase()
      return (
        p === '/settings/referensi' ||
        p.startsWith('/ref') ||
        raw === 'ref' ||
        raw.startsWith('ref/') ||
        raw.startsWith('manage-instansi') ||
        raw.startsWith('manage-iku') ||
        t.includes('referensi')
      )
    })

    const hasSettingsAccess = flatSettingsNodes.some((node) => {
      const p = String(node.path || '').toLowerCase()
      const raw = String(node.raw_url || '').toLowerCase()
      return (
        (p.startsWith('/settings') && p !== '/settings/referensi') ||
        raw.startsWith('manage-user') ||
        raw.startsWith('manage-pegawai') ||
        raw.startsWith('manage-role') ||
        raw.startsWith('manage-layanan') ||
        raw.startsWith('manage-service') ||
        raw.startsWith('manage-setting') ||
        raw.startsWith('manage-smtp') ||
        raw.startsWith('manage-log')
      )
    })

    const settingsChildren = []
    if (hasSettingsAccess) {
      settingsChildren.push({ id: 'settings-hub', title: 'Pengaturan', path: '/settings' })
    }
    if (hasReferensiAccess) {
      settingsChildren.push({ id: 'settings-ref', title: 'Referensi', path: '/settings/referensi' })
    }

    if (settingsChildren.length > 0) {
      tree.push({
        id: 'hdr-pengaturan',
        title: 'Pengaturan & Referensi',
        isHeader: true,
      })

      tree.push({
        id: 'menu-settings-group',
        title: 'Pengaturan & Referensi',
        icon: 'Settings',
        children: settingsChildren,
      })
    }
  }

  return tree
}

export function Sidebar({ collapsed, isMobile = false, mobileOpen = false, onCloseMobile = null, onToggleSidebar = null }) {
  const navigate = useNavigate()
  const location = useLocation()

  // Modern Enterprise Surface: Unified seamless shell inspired by clean SaaS navigation
  const sidebarShellClass = 'bg-white dark:bg-[#0D152B] border-r border-slate-200/70 dark:border-white/[0.06] shadow-[1px_0_12px_-4px_rgba(15,23,42,0.04)]'

  // Crisp enterprise typography & architectural radius (rounded-xl)
  const menuButtonBaseClass = collapsed
    ? 'w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer select-none group relative'
    : 'w-full flex items-center gap-3 pl-1.5 pr-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer select-none group text-[14.5px] tracking-[-0.01em] relative'

  const menuItemIdleClass = 'font-bold text-slate-600 dark:text-slate-300/90 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.05]'
  const menuItemActiveClass = 'bg-[#F2F5FA] text-action dark:bg-white/[0.09] dark:text-white font-extrabold'
  const subItemIdleClass = 'font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/[0.05]'
  const subItemActiveClass = 'bg-white text-action dark:bg-white/[0.08] dark:text-blue-300 font-bold shadow-[0_1px_2px_rgba(15,23,42,0.04)]'

  const isServicePathActive = (childPath, currentPath) => {
    if (!childPath || !currentPath) return false
    const normChild = (childPath.startsWith('/') ? childPath : `/${childPath}`).replace(/\/+$/, '') || '/'
    const normCurrent = (currentPath.startsWith('/') ? currentPath : `/${currentPath}`).replace(/\/+$/, '') || '/'
    if (normChild === '/settings') {
      return (
        normCurrent === '/settings' ||
        (normCurrent.startsWith('/settings/') &&
          normCurrent !== '/settings/referensi' &&
          !normCurrent.startsWith('/settings/referensi/'))
      )
    }
    if (normChild === '/settings/referensi') {
      return normCurrent === '/settings/referensi' || normCurrent.startsWith('/settings/referensi/')
    }
    if (normCurrent === normChild || normCurrent.startsWith(normChild + '/')) return true

    const aliasMap = {
      // Tata Usaha (TU) Services Aliases
      '/layanan/anggaran': ['/apps-anggaran', 'apps-anggaran'],
      '/apps-anggaran': ['/layanan/anggaran'],
      'apps-anggaran': ['/layanan/anggaran'],
      '/layanan/ikm': ['/apps-ikm', 'apps-ikm'],
      '/apps-ikm': ['/layanan/ikm'],
      'apps-ikm': ['/layanan/ikm'],
      '/layanan/humas': ['/apps-humas', 'apps-humas'],
      '/apps-humas': ['/layanan/humas'],
      'apps-humas': ['/layanan/humas'],
      '/layanan/surat': ['/apps-surat', 'apps-surat', '/apps-naskah', 'apps-naskah'],
      '/apps-surat': ['/layanan/surat'],
      'apps-surat': ['/layanan/surat'],
      '/layanan/konsultasi': ['/apps-konsultasi', 'apps-konsultasi'],
      '/apps-konsultasi': ['/layanan/konsultasi'],
      'apps-konsultasi': ['/layanan/konsultasi'],
      '/layanan/ikpa': ['/apps-ikpa', 'apps-ikpa'],
      '/apps-ikpa': ['/layanan/ikpa'],
      'apps-ikpa': ['/layanan/ikpa'],
      '/layanan/statistik-internal': ['/apps-statistik-internal', 'apps-statistik-internal'],
      '/apps-statistik-internal': ['/layanan/statistik-internal'],
      'apps-statistik-internal': ['/layanan/statistik-internal'],
      '/layanan/ekin': ['/apps-ekin', 'apps-ekin'],
      '/apps-ekin': ['/layanan/ekin'],
      'apps-ekin': ['/layanan/ekin'],
      '/layanan/manage-assets': ['/apps-manage-assets', 'apps-manage-assets', '/layanan/aset'],
      '/apps-manage-assets': ['/layanan/manage-assets', '/layanan/aset'],
      'apps-manage-assets': ['/layanan/manage-assets', '/layanan/aset'],
      '/layanan/manage-project': ['/apps-manage-project', 'apps-manage-project', '/layanan/proyek'],
      '/apps-manage-project': ['/layanan/manage-project', '/layanan/proyek'],
      'apps-manage-project': ['/layanan/manage-project', '/layanan/proyek'],
      '/layanan/lost-and-found': ['/apps-lost-and-found', 'apps-lost-and-found'],
      '/apps-lost-and-found': ['/layanan/lost-and-found'],
      'apps-lost-and-found': ['/layanan/lost-and-found'],
      '/layanan/ikk': ['/apps-ikk', 'apps-ikk'],
      '/apps-ikk': ['/layanan/ikk'],
      'apps-ikk': ['/layanan/ikk'],

      // SIDIGI Services Aliases
      '/layanan/statistik-pegawai': ['/layanan/statistik', '/layanan/statistik-asn', '/apps-statistik', 'apps-statistik'],
      '/apps-statistik': ['/layanan/statistik-pegawai', '/layanan/statistik', '/layanan/statistik-asn'],
      'apps-statistik': ['/layanan/statistik-pegawai', '/layanan/statistik', '/layanan/statistik-asn'],
      '/layanan/peremajaan-data': ['/layanan/pdm', '/apps-pdm', 'apps-pdm'],
      '/apps-pdm': ['/layanan/peremajaan-data', '/layanan/pdm'],
      'apps-pdm': ['/layanan/peremajaan-data', '/layanan/pdm'],
      '/layanan/disparitas-data': ['/layanan/dispa', '/layanan/disparitas', '/apps-dispa', 'apps-dispa'],
      '/apps-dispa': ['/layanan/disparitas-data', '/layanan/dispa', '/layanan/disparitas'],
      'apps-dispa': ['/layanan/disparitas-data', '/layanan/dispa', '/layanan/disparitas'],
      '/layanan/integrasi-siasn': ['/layanan/integrasi', '/apps-integrasi', 'apps-integrasi'],
      '/apps-integrasi': ['/layanan/integrasi-siasn', '/layanan/integrasi'],
      'apps-integrasi': ['/layanan/integrasi-siasn', '/layanan/integrasi'],
      '/layanan/arsip-takah': ['/layanan/takah', '/apps-takah', 'apps-takah'],
      '/apps-takah': ['/layanan/arsip-takah', '/layanan/takah'],
      'apps-takah': ['/layanan/arsip-takah', '/layanan/takah'],
      '/layanan/arsip-dms': ['/layanan/dms', '/apps-dms', 'apps-dms'],
      '/apps-dms': ['/layanan/arsip-dms', '/layanan/dms'],
      'apps-dms': ['/layanan/arsip-dms', '/layanan/dms'],
      '/layanan/fasilitasi-cat': [
        '/layanan/cat',
        '/apps-cat',
        'apps-cat',
        '/layanan/fasilitasi-cat/pengelola',
        '/layanan/fasilitasi-cat/laporan',
        '/layanan/fasilitasi-cat/rekapitulasi',
        '/layanan/fasilitasi-cat/rekap-data',
        '/layanan/fasilitasi-cat/entry',
      ],
      '/apps-cat': [
        '/layanan/fasilitasi-cat',
        '/layanan/cat',
        '/layanan/fasilitasi-cat/pengelola',
        '/layanan/fasilitasi-cat/laporan',
        '/layanan/fasilitasi-cat/rekapitulasi',
        '/layanan/fasilitasi-cat/rekap-data',
      ],
      'apps-cat': [
        '/layanan/fasilitasi-cat',
        '/layanan/cat',
        '/layanan/fasilitasi-cat/pengelola',
        '/layanan/fasilitasi-cat/laporan',
        '/layanan/fasilitasi-cat/rekapitulasi',
        '/layanan/fasilitasi-cat/rekap-data',
      ],
      '/layanan/cat': ['/layanan/fasilitasi-cat', '/apps-cat', 'apps-cat'],
      '/layanan/pnbp-cat': ['/layanan/pnbp', '/layanan/pnbp-dokumen', '/apps-pnbp', 'apps-pnbp'],
      '/apps-pnbp': ['/layanan/pnbp-cat', '/layanan/pnbp', '/layanan/pnbp-dokumen'],
      'apps-pnbp': ['/layanan/pnbp-cat', '/layanan/pnbp', '/layanan/pnbp-dokumen'],

      // Wasdal Services
      '/layanan/sistem-merit': ['/layanan/merit', '/apps-merit', 'apps-merit'],
      '/layanan/merit': ['/layanan/sistem-merit', '/apps-merit', 'apps-merit'],
      '/layanan/indeks-nspk': ['/layanan/nspk', '/apps-nspk', 'apps-nspk'],
      '/layanan/nspk': ['/layanan/indeks-nspk', '/apps-nspk', 'apps-nspk'],
      '/layanan/wasdal-netralitas': ['/layanan/wasdal', '/layanan/wasdal-evaluasi', '/apps-wasdal', 'apps-wasdal', '/layanan/audit-kepegawaian', '/layanan/netralitas-disiplin', '/layanan/pengawasan-netralitas-disiplin'],
      '/layanan/wasdal': ['/layanan/wasdal-netralitas', '/layanan/wasdal-evaluasi', '/apps-wasdal', 'apps-wasdal', '/layanan/audit-kepegawaian', '/layanan/netralitas-disiplin', '/layanan/pengawasan-netralitas-disiplin'],
      '/layanan/netralitas-disiplin': ['/layanan/wasdal-netralitas', '/layanan/wasdal', '/apps-wasdal', 'apps-wasdal'],
      '/layanan/pengawasan-netralitas-disiplin': ['/layanan/wasdal-netralitas', '/layanan/wasdal', '/apps-wasdal', 'apps-wasdal'],

      // PnM Services
      '/layanan/kenaikan-pangkat': ['/layanan/kp', '/apps-kp', 'apps-kp'],
      '/layanan/pencantuman-gelar': ['/layanan/pg', '/apps-pg', 'apps-pg'],
      '/layanan/penetapan-nip': ['/layanan/tapnip', '/apps-tapnip', 'apps-tapnip'],
      '/layanan/peninjauan-masa-kerja': ['/layanan/pmk', '/apps-pmk', 'apps-pmk'],
      '/layanan/pindah-instansi': ['/layanan/pi', '/layanan/mutasi', '/apps-pi', 'apps-pi'],

      // PMA Services
      '/layanan/manajemen-talenta': ['/layanan/mt', '/apps-mt', 'apps-mt'],
      '/layanan/mt': ['/layanan/manajemen-talenta', '/apps-mt', 'apps-mt'],
      '/layanan/pembinaan-kinerja': ['/layanan/kinerja', '/apps-pembinaan-kinerja', 'apps-pembinaan-kinerja'],
      '/layanan/kinerja': ['/layanan/pembinaan-kinerja', '/apps-pembinaan-kinerja', 'apps-pembinaan-kinerja'],
      '/layanan/pengembangan-kompetensi': ['/layanan/pembinaan-kompetensi-karier', '/apps-pembinaan-kompetensi-karier', 'apps-pembinaan-kompetensi-karier'],
      '/layanan/pembinaan-kompetensi-karier': ['/layanan/pengembangan-kompetensi', '/apps-pembinaan-kompetensi-karier', 'apps-pembinaan-kompetensi-karier'],
      '/layanan/disiplin-budaya-citra': ['/layanan/pembinaan-disiplin-budaya-citra', '/layanan/disiplin', '/apps-pembinaan-disiplin-budaya-citra', 'apps-pembinaan-disiplin-budaya-citra'],
      '/layanan/pembinaan-disiplin-budaya-citra': ['/layanan/disiplin-budaya-citra', '/layanan/disiplin', '/apps-pembinaan-disiplin-budaya-citra', 'apps-pembinaan-disiplin-budaya-citra'],
      '/layanan/penilaian-kompetensi': ['/layanan/kompetensi', '/apps-kompetensi', 'apps-kompetensi'],
      '/layanan/kompetensi': ['/layanan/penilaian-kompetensi', '/apps-kompetensi', 'apps-kompetensi'],
      '/layanan/penilaian-karier': ['/layanan/karier', '/apps-karier', 'apps-karier'],
      '/layanan/karier': ['/layanan/penilaian-karier', '/apps-karier', 'apps-karier'],
    }

    const list = aliasMap[childPath] || aliasMap[normChild] || []
    if (list.includes(currentPath) || list.includes(normCurrent)) return true

    const currentAliases = aliasMap[currentPath] || aliasMap[normCurrent] || []
    return currentAliases.includes(childPath) || currentAliases.includes(normChild)
  }

  const findActiveGroupId = (items, currentPath) => {
    if (!Array.isArray(items) || !currentPath) return null
    for (const item of items) {
      if (!item.isHeader && Array.isArray(item.children) && item.children.length > 0) {
        if (
          item.children.some(
            (child) =>
              isServicePathActive(child.path, currentPath) ||
              isServicePathActive(normalizeServicePath(child), currentPath)
          )
        ) {
          return item.id || item.code || item.title
        }
      }
    }
    return null
  }
  
  const [currentUser, setCurrentUser] = useState(() => buildUserSummary())
  const [menuItems, setMenuItems] = useState(() => organizeAndSortMenuTree(getRoleMenu(currentUser.roleRaw)))
  const [openGroupId, setOpenGroupId] = useState(() => findActiveGroupId(menuItems, location.pathname))
  const [redirectModal, setRedirectModal] = useState(null)

  const lastPathRef = useRef(location.pathname)

  // Synchronize open accordion with active route ONLY when location.pathname actually changes (user navigation)
  useEffect(() => {
    if (lastPathRef.current !== location.pathname) {
      lastPathRef.current = location.pathname
      const matched = findActiveGroupId(menuItems, location.pathname)
      if (matched) {
        setOpenGroupId(matched)
      }
    }
  }, [location.pathname, menuItems])

  // Initial sync on mount/load if openGroupId is not yet set
  useEffect(() => {
    setOpenGroupId((prev) => {
      if (prev) return prev
      return findActiveGroupId(menuItems, location.pathname)
    })
  }, [menuItems, location.pathname])

  useEffect(() => {
    let isMounted = true

    const syncSidebar = async () => {
      const nextUser = buildUserSummary()
      setCurrentUser(nextUser)

      // Start with organized role-based menu immediately
      setMenuItems(organizeAndSortMenuTree(getRoleMenu(nextUser.roleRaw)))

      // Fetch dynamic menu tree from backend DB and organize A-Z
      try {
        const dbTree = await fetchUserMenuTree()
        if (isMounted && Array.isArray(dbTree) && dbTree.length > 0) {
          setMenuItems(organizeAndSortMenuTree(dbTree))
        }
      } catch (err) {
        // Fallback remains in place
      }
    }

    syncSidebar()
    const unsubscribe = subscribeAuthChange(syncSidebar)
    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await logoutCurrentUser()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      id="sidebar"
      className={`admin-sidebar ${sidebarShellClass} flex flex-col flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-[80px]' : 'w-[280px] sm:w-[292px]'} ${isMobile ? `fixed inset-y-0 left-0 z-50 shadow-2xl ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}` : 'relative z-[41] translate-x-0'}`}
    >
      {/* Brand Header & Official BKN Logo Section (Standardized Height 64px, seamless with Sidebar & Topbar) */}
      <div className={`h-16 relative flex items-center border-b border-slate-200/50 dark:border-white/[0.06] ${collapsed ? 'justify-center px-2.5' : 'justify-between px-4'}`}>
        {collapsed ? (
          <>
            <div
              className="w-11 h-11 mx-auto flex items-center justify-center"
              title="SIMOJANG - BKN Kanreg III Bandung"
            >
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Logo BKN"
                className="w-9 h-9 object-contain transition-transform duration-200 hover:scale-105"
              />
            </div>
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-[#131F3D] border border-slate-200/90 dark:border-white/15 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white shadow-sm hover:shadow transition-all flex items-center justify-center cursor-pointer"
                title="Buka Menu Sidebar"
                aria-label="Buka Menu Sidebar"
              >
                <LucideIcons.ChevronRight className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 pl-1.5 min-w-0">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                <img
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt="Logo BKN"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[17px] tracking-tight text-slate-950 dark:text-white leading-none">
                    Simojang
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-action-soft text-action dark:bg-white/10 dark:text-blue-200 uppercase tracking-wider">
                    v.2
                  </span>
                </div>
                <div className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 tracking-wide truncate mt-1">
                  Kanreg III BKN
                </div>
              </div>
            </div>
            {/* Collapse toggle button: Chevron Left '<' matching the reference layout */}
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
                title="Tutup Menu Sidebar"
                aria-label="Tutup Menu Sidebar"
              >
                <LucideIcons.ChevronLeft className="w-4 h-4 stroke-[1.75]" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Menu Navigation */}
      <nav className={`flex-1 overflow-y-auto custom-scroll ${collapsed ? 'px-2.5 py-4 space-y-1.5 overflow-x-visible' : 'px-4 py-4 space-y-1'}`}>
        {menuItems.map((item, idx) => {
          // Structured Enterprise Section Header
          if (item.isHeader) {
            if (collapsed) {
              return <div key={`hdr-${idx}`} className="my-2 mx-2 border-t border-slate-200/60 dark:border-white/[0.06]" />
            }
            return (
              <div
                key={`hdr-${idx}`}
                className={idx > 0 ? 'mt-4 pt-3 pb-1.5 pl-[15px] pr-3' : 'pt-1 pb-1.5 pl-[15px] pr-3'}
              >
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 select-none">
                  {item.title}
                </div>
              </div>
            )
          }

          const groupId = item.id || item.code || item.title || `group-${idx}`
          const hasChildren = Array.isArray(item.children) && item.children.length > 0
          const childActive = hasChildren && item.children.some((child) => isServicePathActive(child.path, location.pathname))
          const isDirectActive = !hasChildren && location.pathname === item.path
          const groupOpen = openGroupId === groupId

          if (!hasChildren) {
            const isExternalItem = Boolean(item.is_external || item.path?.startsWith('http://') || item.path?.startsWith('https://'))
            if (isExternalItem) {
              return (
                <div key={groupId} className="relative group">
                  <button
                    type="button"
                    title={item.title}
                    onClick={() => {
                      if (isMobile && typeof onCloseMobile === 'function') onCloseMobile()
                      setRedirectModal({
                        title: item.title,
                        url: item.target_url || item.path,
                      })
                    }}
                    className={`${menuButtonBaseClass} ${menuItemIdleClass}`}
                  >
                    <span className={collapsed ? 'flex items-center justify-center' : 'w-9 flex items-center justify-center flex-shrink-0'}>
                      <DynamicIcon name={item.icon} className="w-[18px] h-[18px] flex-shrink-0 stroke-[1.75] text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                    </span>
                    {!collapsed && <span className="text-left flex-1 truncate">{item.title}</span>}
                    {!collapsed && (
                      <LucideIcons.ExternalLink className="w-3.5 h-3.5 text-slate-400 stroke-[1.75]" />
                    )}
                  </button>

                  {/* Floating Tooltip when Collapsed */}
                  {collapsed && (
                    <div className="pointer-events-none fixed left-[88px] z-50 hidden group-hover:flex items-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-lg border border-slate-800 whitespace-nowrap animate-in fade-in duration-150">
                      {item.title}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div key={groupId} className="relative group">
                <NavLink
                  to={item.path}
                  end
                  title={item.title}
                  onClick={() => {
                    if (isMobile && typeof onCloseMobile === 'function') onCloseMobile()
                  }}
                  className={({ isActive }) => `${menuButtonBaseClass} ${isActive ? menuItemActiveClass : menuItemIdleClass}`}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className={
                            collapsed
                              ? 'absolute -left-2.5 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-action dark:bg-blue-400'
                              : 'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-action dark:bg-blue-400'
                          }
                          aria-hidden="true"
                        />
                      )}
                      <span className={collapsed ? 'flex items-center justify-center' : 'w-9 flex items-center justify-center flex-shrink-0'}>
                        <DynamicIcon
                          name={item.icon}
                          className={`w-[18px] h-[18px] flex-shrink-0 stroke-[1.75] transition-colors ${
                            isActive
                              ? 'text-action dark:text-blue-400'
                              : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                          }`}
                        />
                      </span>
                      {!collapsed && <span className="text-left flex-1 truncate">{item.title}</span>}
                      {!collapsed && item.badge ? (
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${isActive ? 'bg-action text-white' : 'bg-action-soft text-action dark:bg-white/10 dark:text-blue-200'}`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>

                {/* Floating Tooltip when Collapsed */}
                {collapsed && (
                  <div className="pointer-events-none fixed left-[88px] z-50 hidden group-hover:flex items-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-lg border border-slate-800 whitespace-nowrap animate-in fade-in duration-150">
                    {item.title}
                  </div>
                )}
              </div>
            )
          }

          const showCollapsedActive = collapsed && childActive
          const showClosedChildActive = !collapsed && childActive && !groupOpen

          return (
            <div
              key={groupId}
              className={`space-y-0.5 relative group transition-colors duration-200 ${
                !collapsed && groupOpen ? 'rounded-2xl bg-slate-100/65 dark:bg-white/[0.035] p-1 -mx-1 my-1' : ''
              }`}
            >
              <button
                type="button"
                title={item.title}
                onClick={() => {
                  if (collapsed) {
                    if (item.children?.[0]?.path) {
                      const firstChild = item.children[0]
                      if (firstChild.is_external || firstChild.path?.startsWith('http://') || firstChild.path?.startsWith('https://')) {
                        setRedirectModal({
                          title: firstChild.title,
                          url: firstChild.target_url || firstChild.path,
                        })
                      } else {
                        navigate(firstChild.path)
                      }
                    }
                    return
                  }
                  // Strict Single Accordion: Klik parent yang sedang terbuka akan menutupnya,
                  // klik parent lain otomatis menutup parent sebelumnya (zero dual-submenu)
                  setOpenGroupId((prev) => (prev === groupId ? null : groupId))
                }}
                className={`${menuButtonBaseClass} ${
                  showCollapsedActive || showClosedChildActive
                    ? menuItemActiveClass
                    : groupOpen
                    ? childActive
                      ? 'text-slate-950 dark:text-white font-extrabold hover:bg-white/60 dark:hover:bg-white/[0.04]'
                      : 'text-slate-900 dark:text-white font-bold hover:bg-white/60 dark:hover:bg-white/[0.04]'
                    : menuItemIdleClass
                }`}
              >
                {(showCollapsedActive || showClosedChildActive) && (
                  <span
                    className={
                      collapsed
                        ? 'absolute -left-2.5 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-action dark:bg-blue-400'
                        : 'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-action dark:bg-blue-400'
                    }
                    aria-hidden="true"
                  />
                )}
                <span className={collapsed ? 'flex items-center justify-center' : 'w-9 flex items-center justify-center flex-shrink-0'}>
                  <DynamicIcon
                    name={item.icon}
                    className={`w-[18px] h-[18px] flex-shrink-0 stroke-[1.75] transition-all duration-150 group-hover:scale-105 ${
                      showCollapsedActive || showClosedChildActive || (groupOpen && childActive)
                        ? 'text-action dark:text-blue-400'
                        : groupOpen
                        ? 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  />
                </span>
                {!collapsed && (
                  <span className="text-left flex-1 truncate">
                    {item.title}
                  </span>
                )}
                {!collapsed && (
                  <LucideIcons.ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ease-out stroke-[1.75] ${
                      groupOpen ? 'rotate-180 text-slate-600 dark:text-slate-300' : 'text-slate-400'
                    } ${showClosedChildActive ? 'text-action dark:text-blue-400' : ''}`}
                  />
                )}
              </button>

              {/* Floating Tooltip when Collapsed */}
              {collapsed && (
                <div className="pointer-events-none fixed left-[88px] z-50 hidden group-hover:flex items-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-lg border border-slate-800 whitespace-nowrap animate-in fade-in duration-150">
                  {item.title}
                </div>
              )}

              <AnimatePresence initial={false}>
                {!collapsed && groupOpen && (
                  <motion.div
                    key={`group-sub-${groupId}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    {/* Bullet-free clean typographic submenu aligned under parent label */}
                    <div className="pt-1 pb-1.5 space-y-0.5">
                      {item.children.map((child, cIdx) => {
                        const isExternalChild = Boolean(child.is_external || child.path?.startsWith('http://') || child.path?.startsWith('https://'))
                        return (
                          <motion.div
                            key={child.id || child.path || child.title || cIdx}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: cIdx * 0.015 }}
                          >
                            {isExternalChild ? (
                              <button
                                type="button"
                                title={child.title}
                                onClick={() => {
                                  if (isMobile && typeof onCloseMobile === 'function') onCloseMobile()
                                  setRedirectModal({
                                    title: child.title,
                                    url: child.target_url || child.path,
                                  })
                                }}
                                className={`group/sub w-full relative flex items-start justify-between gap-2.5 pl-[54px] pr-3 py-2 rounded-xl text-[13.5px] transition-all duration-150 cursor-pointer select-none ${subItemIdleClass}`}
                              >
                                <span className="text-left leading-snug whitespace-normal break-words">
                                  {child.title}
                                </span>
                                <LucideIcons.ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 mt-0.5 stroke-[1.75]" />
                              </button>
                            ) : (
                              <NavLink
                                to={child.path}
                                end
                                title={child.title}
                                onClick={() => {
                                  if (isMobile && typeof onCloseMobile === 'function') onCloseMobile()
                                }}
                                className={({ isActive }) => {
                                  const active = isActive || isServicePathActive(child.path, location.pathname)
                                  return `group/sub relative flex items-start justify-between gap-2.5 pl-[54px] pr-3 py-2 rounded-xl text-[13.5px] transition-all duration-150 cursor-pointer select-none ${active ? subItemActiveClass : subItemIdleClass}`
                                }}
                              >
                                {({ isActive }) => {
                                  const active = isActive || isServicePathActive(child.path, location.pathname)
                                  return (
                                    <>
                                      {active && (
                                        <span
                                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-action dark:bg-blue-400"
                                          aria-hidden="true"
                                        />
                                      )}
                                      <span className="text-left leading-snug whitespace-normal break-words">
                                        {child.title}
                                      </span>
                                      {child.badge && (
                                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md flex-shrink-0 mt-0.5 ${active ? 'bg-action text-white' : 'bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:text-slate-300'}`}>
                                          {child.badge}
                                        </span>
                                      )}
                                    </>
                                  )
                                }}
                              </NavLink>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* User Info Section on Sidebar (Seamless Integrated Footer) */}
      <div className={`border-t border-slate-200/50 dark:border-white/[0.06] ${collapsed ? 'p-2.5' : 'px-4 py-2.5'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="cursor-pointer rounded-full focus:outline-none"
              title={currentUser.nip ? `${currentUser.name} • NIP ${currentUser.nip}` : currentUser.name}
            >
              <UserAvatar
                src={currentUser.avatarUrl}
                initials={currentUser.avatar}
                name={currentUser.name}
                size="md"
                isActive={currentUser.isActive}
              />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#B42318] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Keluar dari Sistem"
              aria-label="Keluar dari Sistem"
            >
              <LucideIcons.LogOut className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 transition-colors">
            {/* User Avatar & Identity (clickable to open Profile) */}
            <button
              type="button"
              onClick={() => {
                if (isMobile && typeof onCloseMobile === 'function') onCloseMobile()
                navigate('/profile')
              }}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left pl-1 pr-2 py-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
              title="Buka Profil Saya"
            >
              <UserAvatar
                src={currentUser.avatarUrl}
                initials={currentUser.avatar}
                name={currentUser.name}
                size="md"
                isActive={currentUser.isActive}
              />
              <div className="flex-1 min-w-0">
                <div className="truncate text-[13.5px] font-bold text-slate-900 dark:text-white leading-tight group-hover:text-action dark:group-hover:text-blue-400 transition-colors" title={currentUser.name}>
                  {currentUser.name}
                </div>
                <p
                  className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums truncate"
                  title={currentUser.nip ? `NIP ${currentUser.nip}` : undefined}
                >
                  {currentUser.nip ? `NIP ${currentUser.nip}` : 'Kanreg III BKN'}
                </p>
              </div>
            </button>

            {/* Logout Action Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-[#B42318] dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer flex-shrink-0"
              title="Keluar dari Sistem"
              aria-label="Keluar dari Sistem"
            >
              <LucideIcons.LogOut className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>
        )}
      </div>
      {/* Modal Popup Konfirmasi Pengalihan Layanan Eksternal (Teleported ke document.body agar tepat di tengah layar) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {redirectModal && (
              <motion.div
                data-motion-modal="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
              >
                {/* Click backdrop to dismiss */}
                <div
                  className="absolute inset-0"
                  onClick={() => setRedirectModal(null)}
                  aria-hidden="true"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 6 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden relative z-10"
                  role="dialog"
                  aria-modal="true"
                >
                  {/* Header Icon + Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#EAF2FC] dark:bg-[#123B73]/30 border border-[#123B73]/15 flex items-center justify-center flex-shrink-0 text-[#123B73] dark:text-blue-300">
                      <LucideIcons.ExternalLink className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                        Pengalihan Layanan Eksternal
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Anda akan dialihkan keluar dari SIMOJANG ke aplikasi berikut:
                      </p>
                    </div>
                  </div>

                  {/* Target App Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 mb-4">
                    <div className="font-extrabold text-sm text-[#123B73] dark:text-blue-300 flex items-center justify-between">
                      <span>{redirectModal.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#123B73] dark:bg-blue-900/40 dark:text-blue-300">
                        Eksternal
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-mono break-all mt-1.5 flex items-start gap-1.5">
                      <LucideIcons.Globe className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 mt-0.5" />
                      <span className="select-all">{redirectModal.url}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    Aplikasi tujuan akan dibuka pada tab baru peramban Anda. Klik <strong className="text-slate-700 dark:text-slate-200">Mengerti & Lanjutkan</strong> untuk membuka tautan tersebut.
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRedirectModal(null)}
                      className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = redirectModal.url
                        setRedirectModal(null)
                        if (targetUrl) {
                          window.open(targetUrl, '_blank', 'noopener,noreferrer')
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#123B73] hover:bg-[#0E2D59] text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Mengerti & Lanjutkan</span>
                      <LucideIcons.ArrowRight className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </aside>
  )
}
