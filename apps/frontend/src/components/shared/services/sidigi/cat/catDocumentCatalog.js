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
    title: 'Berita Acara Profiling ASN',
    category: 'Berita Acara Resmi',
    badgeText: 'Dokumen Utama',
    status: 'ready',
    description:
      'Pengesahan digital Berita Acara Pelaksanaan Pemetaan / Penilaian Potensi dan Kompetensi ASN dengan penempelan tanda tangan elektronik (TTE) pada berkas PDF resmi.',
    highlights: [
      'Unggah langsung berkas PDF Berita Acara dari Puspenkom/CAT',
      'Pembubuhan E-Sign otomatis 3 posisi (Kiri, Tengah, Kanan)',
      'Sinkronisasi spesimen tanda tangan session pegawai tersimpan',
      'Generate & ekspor PDF bertanda tangan resmi instan',
    ],
  },
  {
    id: 'formulir-sarpras-cat',
    slug: 'formulir-sarpras-cat',
    code: 'DOC-CAT-03',
    title: 'Formulir Pengecekan Sarana dan Prasarana',
    category: 'Pengecekan Teknis & Fasilitasi',
    badgeText: 'Dokumen Utama',
    status: 'ready',
    description:
      'Digitalisasi Formulir Pengecekan Sarana dan Prasarana CAT memuat 17 butir checklist kesiapan teknis, inventaris perangkat sarpras, rekomendasi kelaikan uji coba, serta pengesahan 2 pihak (BKN & Instansi).',
    highlights: [
      '17 Butir checklist kesiapan teknis (Instansi & BKN)',
      'Tabel inventaris sarana prasarana dinamis',
      'Rekomendasi kelaikan uji coba otomatis',
      'Pengesahan TTE 3 pihak fleksibel (BKN, Saksi, Instansi)',
    ],
  },
  {
    id: 'daftar-hadir-petugas',
    slug: 'daftar-hadir-petugas',
    code: 'DOC-CAT-04',
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
