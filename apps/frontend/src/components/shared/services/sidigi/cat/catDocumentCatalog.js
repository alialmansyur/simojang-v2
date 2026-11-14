/**
 * Katalog Dokumen Laporan Pelaksanaan CAT.
 * Setiap dokumen memiliki `slug` untuk URL terpisah:
 * /layanan/fasilitasi-cat/laporan/:jenisToken/:documentSlug
 */
export const AVAILABLE_CAT_DOCUMENTS = [
  {
    id: 'laporan-pelaksanaan-cat',
    slug: 'laporan-pelaksanaan-cat',
    code: 'DOC-CAT-01',
    title: 'Laporan Kegiatan Pelaksanaan CAT',
    category: 'Laporan Resmi Pelaksanaan',
    badgeText: 'Dokumen Utama',
    status: 'ready', // 'ready' | 'upcoming'
    description:
      'Laporan komprehensif pelaksanaan seleksi CAT memuat dasar surat tugas/deputi, tabel rekapitulasi realisasi kehadiran per instansi & per sesi, pengesahan 3 posisi penandatangan (kiri, tengah, kanan), dan dokumentasi eviden kegiatan.',
    highlights: [
      'Sinkronisasi otomatis realisasi sesi & presensi peserta',
      'Pengesahan fleksibel 3 pihak (Kiri, Tengah, Kanan)',
      'Dokumentasi 4 eviden foto terintegrasi',
      'Ekspor berkas PDF standar A4 resmi BKN',
    ],
  },
  {
    id: 'berita-acara-cat',
    slug: 'berita-acara-cat',
    code: 'DOC-CAT-02',
    title: 'Berita Acara Pelaksanaan Ujian CAT',
    category: 'Berita Acara Resmi',
    badgeText: 'Segera Hadir',
    status: 'upcoming',
    description:
      'Berita acara resmi serah terima segel sistem, naskah soal, dan jalannya sesi ujian CAT antara panitia instansi dan tim teknis BKN.',
    highlights: [
      'Format standar Berita Acara BKN',
      'Pencatatan kendala dan berita jalannya ujian',
      'Pengesahan Koordinator & Tim Teknis Tilok',
    ],
  },
  {
    id: 'daftar-hadir-petugas',
    slug: 'daftar-hadir-petugas',
    code: 'DOC-CAT-03',
    title: 'Daftar Hadir Petugas & Panitia CAT',
    category: 'Administrasi Tilok',
    badgeText: 'Segera Hadir',
    status: 'upcoming',
    description:
      'Daftar presensi harian pengawas ruang ujian, panitia instansi daerah, dan petugas operasional CAT di titik lokasi ujian.',
    highlights: [
      'Presensi per sesi ujian harian',
      'Rekapitulasi tanda tangan panitia tilok',
    ],
  },
]
