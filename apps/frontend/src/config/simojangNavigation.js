/**
 * Simojang Navigation Configuration
 * Kantor Regional III BKN Bandung
 * 
 * 6 Tim Kerja (Divisions) + Main Menu + Office + Settings
 * Semua menu dan sub-menu terurut alfabetis A-Z sesuai standar desain.
 */

export const TIM_KERJA_LIST = [
  {
    id: 'tu',
    code: 'tim-tu',
    title: 'Tata Usaha',
    shortTitle: 'Tata Usaha',
    icon: 'Building2',
    color: 'indigo',
    description: 'Anggaran DIPA, PNBP, IKPA, survei IKM, persuratan dinas, dan kehumasan/protokoler.',
    services: [
      { id: 'anggaran', title: 'Anggaran DIPA & Realisasi', path: '/layanan/anggaran', type: 'form_crud' },
      { id: 'ikpa', title: 'Capaian IKPA Kanreg', path: '/layanan/ikpa', type: 'form_crud' },
      { id: 'ikm', title: 'Hasil Survey IKM', path: '/layanan/ikm', type: 'form_crud' },
      { id: 'lost-and-found', title: 'Informasi Barang Hilang (L&F)', path: '/layanan/lost-and-found', type: 'form_crud' },
      { id: 'humas', title: 'Kehumasan & Publikasi', path: '/layanan/humas', type: 'form_crud' },
      { id: 'manage-assets', title: 'Manajemen Aset BMN', path: '/layanan/manage-assets', type: 'form_crud' },
      { id: 'ikk', title: 'Manajemen Capaian IKK', path: '/layanan/ikk', type: 'form_crud' },
      { id: 'ekin', title: 'Manajemen E-Kinerja', path: '/layanan/ekin', type: 'form_crud' },
      { id: 'manage-project', title: 'Manajemen Proyek', path: '/layanan/manage-project', type: 'form_crud' },
      { id: 'konsultasi', title: 'Pelayanan Konsultasi', path: '/layanan/konsultasi', type: 'form_crud' },
      { id: 'surat', title: 'Pengelolaan Persuratan', path: '/layanan/surat', type: 'form_crud' },
      { id: 'statistik-internal', title: 'Statistik Kepegawaian Internal', path: '/layanan/statistik-internal', type: 'form_crud' },
    ],
  },
  {
    id: 'pembinaan',
    code: 'tim-pembinaan',
    title: 'Pembinaan Manajemen ASN',
    shortTitle: 'Pembinaan ASN',
    icon: 'Award',
    color: 'emerald',
    description: 'Manajemen talenta instansi, evaluasi kinerja ASN, pembinaan disiplin dan budaya kerja, serta penilaian kompetensi dan kelayakan karier.',
    services: [
      { id: 'manajemen-talenta', title: 'Manajemen Talenta', path: '/layanan/manajemen-talenta', type: 'form_crud' },
      { id: 'pembinaan-kinerja', title: 'Pembinaan Kinerja & Penghargaan', path: '/layanan/pembinaan-kinerja', type: 'form_crud' },
      { id: 'pengembangan-kompetensi', title: 'Pengembangan Kompetensi', path: '/layanan/pengembangan-kompetensi', type: 'form_crud' },
      { id: 'disiplin-budaya-citra', title: 'Pembinaan Disiplin & Citra', path: '/layanan/disiplin-budaya-citra', type: 'form_crud' },
      { id: 'penilaian-kompetensi', title: 'Penilaian Kompetensi', path: '/layanan/penilaian-kompetensi', type: 'form_crud' },
      { id: 'penilaian-karier', title: 'Penilaian Karier', path: '/layanan/penilaian-karier', type: 'form_crud' },
    ],
  },
  {
    id: 'pm',
    code: 'tim-pm',
    title: 'Pengangkatan & Mutasi',
    shortTitle: 'P & M',
    icon: 'UserCheck',
    color: 'emerald',
    description: 'Layanan kenaikan pangkat, pencantuman gelar, penetapan NIP CPNS/PPPK, peninjauan masa kerja, dan pindah instansi.',
    services: [
      { id: 'kenaikan-pangkat', title: 'Kenaikan Pangkat', path: '/layanan/kenaikan-pangkat', type: 'excel_upload' },
      { id: 'pencantuman-gelar', title: 'Pencantuman Gelar', path: '/layanan/pencantuman-gelar', type: 'excel_upload' },
      { id: 'penetapan-nip', title: 'Penetapan NIP CPNS / NI PPPK', path: '/layanan/penetapan-nip', type: 'excel_upload' },
      { id: 'peninjauan-masa-kerja', title: 'Peninjauan Masa Kerja', path: '/layanan/peninjauan-masa-kerja', type: 'excel_upload' },
      { id: 'pindah-instansi', title: 'Pindah Instansi', path: '/layanan/pindah-instansi', type: 'excel_upload' },
    ],
  },
  {
    id: 'wasdal',
    code: 'tim-wasdal',
    title: 'Pengawasan & Pengendalian',
    shortTitle: 'Wasdal',
    icon: 'FileCheck2',
    color: 'rose',
    description: 'Audit kepegawaian, evaluasi NSPK, penerapan Sistem Merit, dan penegakan regulasi ASN.',
    services: [
      { id: 'sistem-merit', title: 'Pengawasan Sistem Merit', path: '/layanan/sistem-merit', type: 'form_crud' },
      { id: 'indeks-nspk', title: 'Pengukuran Indeks NSPK', path: '/layanan/indeks-nspk', type: 'form_crud' },
      { id: 'wasdal-netralitas', title: 'Pengawasan Netralitas & Disiplin', path: '/layanan/wasdal-netralitas', type: 'form_crud' },
    ],
  },
  {
    id: 'sidigi',
    code: 'tim-sidigi',
    title: 'Sistem Informasi & Digitalisasi',
    shortTitle: 'SIDIGI',
    icon: 'Cpu',
    color: 'primary',
    description: 'Statistik data kepegawaian, peremajaan data SIASN, disparitas anomali data, integrasi SIMPEG, pengelolaan arsip Takah & DMS, serta dokumen PNBP CAT.',
    services: [
      { id: 'statistik-pegawai', title: 'Statistik Data Kepegawaian', path: '/layanan/statistik-pegawai', type: 'excel_upload' },
      { id: 'peremajaan-data', title: 'Peremajaan Data ASN (PDM)', path: '/layanan/peremajaan-data', type: 'form_crud' },
      { id: 'disparitas-data', title: 'Pendampingan Disparitas Data', path: '/layanan/disparitas-data', type: 'excel_upload' },
      { id: 'integrasi-siasn', title: 'Integrasi SIASN & SIMPEG', path: '/layanan/integrasi-siasn', type: 'form_crud' },
      { id: 'arsip-takah', title: 'Pengelolaan Dokumen Arsip (Takah)', path: '/layanan/arsip-takah', type: 'excel_upload' },
      { id: 'arsip-dms', title: 'Digitalisasi Arsip (DMS)', path: '/layanan/arsip-dms', type: 'excel_upload' },
      { id: 'fasilitasi-cat', title: 'Fasilitasi Seleksi Metode CAT', path: '/layanan/fasilitasi-cat', type: 'specialized' },
      { id: 'pnbp-cat', title: 'Dokumen Seleksi PNBP CAT', path: '/layanan/pnbp-cat', type: 'specialized' },
    ],
  },
  {
    id: 'sp',
    code: 'tim-sp',
    title: 'Status & Pemberhentian',
    shortTitle: 'S & P',
    icon: 'ShieldAlert',
    color: 'emerald',
    description: 'Layanan CLTN, pengaktifan ASN, pengangkatan CPNS-PNS, pertek pensiun, SK pensiun, dan registrasi pensiun.',
    services: [
      { id: 'cltn', title: 'Cuti Diluar Tanggungan Negara', path: '/layanan/cltn', type: 'excel_upload' },
      { id: 'asn-aktif', title: 'Pengaktifan kembali sebagai ASN', path: '/layanan/asn-aktif', type: 'excel_upload' },
      { id: 'cpns-pns', title: 'Pengangkatan CPNS menjadi PNS', path: '/layanan/cpns-pns', type: 'excel_upload' },
      { id: 'pertek-pensiun', title: 'Penetapan Pertek Pensiun PNS', path: '/layanan/pertek-pensiun', type: 'excel_upload' },
      { id: 'sk-pensiun', title: 'Penetapan SK Pensiun Janda/Duda', path: '/layanan/sk-pensiun', type: 'excel_upload' },
      { id: 'regis-pensiun', title: 'Pendaftaran Pensiunan Menikah Kembali', path: '/layanan/regis-pensiun', type: 'excel_upload' },
    ],
  },
]

export const MAIN_MENU_ITEMS = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    id: 'activity-gallery',
    title: 'Galeri Kegiatan',
    path: '/activity-gallery',
    icon: 'Image',
  },
  {
    id: 'calendar-event',
    title: 'Kalender Kegiatan',
    path: '/calendar-event',
    icon: 'Calendar',
  },
  {
    id: 'my-tasks',
    title: 'Layanan Saya',
    path: '/my-tasks',
    icon: 'Briefcase',
    badge: '3',
  },
]

export const OFFICE_MENU_ITEMS = [
  {
    id: 'activity-gallery',
    title: 'Galeri Kegiatan',
    path: '/activity-gallery',
    icon: 'Image',
  },
  {
    id: 'calendar-event',
    title: 'Kalender Kegiatan',
    path: '/calendar-event',
    icon: 'Calendar',
  },
]

export const SETTINGS_MENU_ITEMS = [
  {
    id: 'settings-hub',
    title: 'Pengaturan',
    path: '/settings',
    icon: 'Settings',
  },
  {
    id: 'settings-ref',
    title: 'Referensi',
    path: '/settings/referensi',
    icon: 'Database',
  },
]

export const SETTINGS_SUBPAGE_ITEMS = [
  {
    id: 'settings-users',
    title: 'Manajemen Pengguna & Pegawai',
    path: '/settings/users',
    icon: 'Users',
  },
  {
    id: 'settings-roles',
    title: 'Manajemen Role & Menu RBAC',
    path: '/settings/roles',
    icon: 'ShieldCheck',
  },
  {
    id: 'settings-services',
    title: 'Manajemen Layanan & Hak Akses',
    path: '/settings/services',
    icon: 'Layers',
  },
  {
    id: 'settings-system',
    title: 'Pengaturan Sistem & Email SMTP',
    path: '/settings/system',
    icon: 'Sliders',
  },
  {
    id: 'settings-audit',
    title: 'Log Audit & Aktivitas Sistem',
    path: '/settings/audit',
    icon: 'FileText',
  },
]

export const EXTERNAL_SERVICES_LIST = [
  {
    id: 'dashboard-executive',
    title: 'Dashboard Executive',
    path: 'https://kanreg3.id/dashboard-executive/',
    target_url: 'https://kanreg3.id/dashboard-executive/',
    icon: 'Gauge',
    is_external: true,
  },
  {
    id: 'dashboard-simanja',
    title: 'Dashboard Simanja',
    path: 'https://kanreg3.id/simanja-dashboard/',
    target_url: 'https://kanreg3.id/simanja-dashboard/',
    icon: 'LineChart',
    is_external: true,
  },
  {
    id: 'sikasep',
    title: 'Sikasep',
    path: 'https://kanreg3.id/sikasep/login',
    target_url: 'https://kanreg3.id/sikasep/login',
    icon: 'ShieldCheck',
    is_external: true,
  },
  {
    id: 'simanja',
    title: 'Simanja',
    path: 'https://kanreg3.id/simanja/',
    target_url: 'https://kanreg3.id/simanja/',
    icon: 'Briefcase',
    is_external: true,
  },
  {
    id: 'siwaregtilu',
    title: 'Siwaregtilu',
    path: 'https://kanreg3.id/siwaregtilu/',
    target_url: 'https://kanreg3.id/siwaregtilu/',
    icon: 'Globe',
    is_external: true,
  },
  {
    id: 'siolin',
    title: 'Siolin',
    path: 'https://kanreg3.id/siolin/',
    target_url: 'https://kanreg3.id/siolin/',
    icon: 'Layers',
    is_external: true,
  },
]

/**
 * Build the full menu tree for the sidebar
 * Memisahkan secara tegas Tim Kerja Layanan dari Kegiatan Kantor dan Pengaturan/Referensi
 */
export function buildSimojangMenuTree() {
  const timKerjaMenuItems = [...TIM_KERJA_LIST]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((tk) => ({
      id: tk.code,
      title: tk.title,
      icon: tk.icon,
      children: [...tk.services]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((svc) => ({
          title: svc.title,
          path: svc.path,
          badge: svc.badge,
        })),
    }))

  return [
    // 1. Navigasi Utama (Dashboard, Galeri Kegiatan, Kalender Kegiatan, Layanan Saya)
    ...MAIN_MENU_ITEMS,

    // 2. Tim Kerja Layanan (Eksklusif 6 Tim Kerja, Terurut A-Z)
    {
      id: 'group-timkerja',
      title: 'Tim Kerja Layanan',
      isHeader: true,
    },
    ...timKerjaMenuItems,

    // 3. Layanan Lainnya (Aplikasi Eksternal - Flat list langsung di bawah section header)
    {
      id: 'group-external-services',
      title: 'Layanan Lainnya',
      isHeader: true,
    },
    ...EXTERNAL_SERVICES_LIST,

    // 4. Pengaturan & Referensi Sistem
    {
      id: 'group-settings',
      title: 'Pengaturan & Referensi',
      isHeader: true,
    },
    {
      id: 'menu-settings-group',
      title: 'Pengaturan & Referensi',
      icon: 'Settings',
      children: [...SETTINGS_MENU_ITEMS].sort((a, b) => a.title.localeCompare(b.title)),
    },
  ]
}
