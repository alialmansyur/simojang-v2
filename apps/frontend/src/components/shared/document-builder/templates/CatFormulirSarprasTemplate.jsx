import { formatDateIndo } from '../documentBuilderUtils'
import { PDF_ARIAL_PAGE_STYLE } from '../../services/sidigi/cat/pengelola/pengelolaConstants'

export const DEFAULT_SARPRAS_CHECKLIST_ITEMS = [
  {
    id: 1,
    kegiatan: 'Melakukan koodinasi dengan panitia lokasi terkait kegiatan, tata tertib dan prosedur kegiatan',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 2,
    kegiatan: 'Melakukan koordinasi teknis TI terkait infrastruktur dan potensi kendala yang terjadi di tempat penyelenggaraan kegiatan',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 3,
    kegiatan: 'Memastikan perangkat yang digunakan menggunakan operating system (OS) Windows 10 atau 11.',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 4,
    kegiatan:
      'Memastikan adanya koneksi internet pada setiap PC client dengan kecepatan internet atau bandwith minimal adalah 0,5 Mbps (rekomendasi 2 Mbps). Maksimal reply latency koneksi internet ditetapkan sebesar 300 ms',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 5,
    kegiatan: 'Memastikan PC client terinstall SEB (safe exam browser)',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 6,
    kegiatan:
      'Melakukan pengecekan jaringan dengan ping beban 65500 bytes (Windows) dan 65507 bytes (Linux) dari seluruh PC Client ke server secara bersamaan',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 7,
    kegiatan: 'Memastikan kabel jaringan untuk PC Client dengan spesifikasi minimal 5e',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 8,
    kegiatan: 'Memastikan ruang kegiatan tersedia minimal 1 (satu) LCD Proyektor/TV dan terhubung ke PC sumber',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 9,
    kegiatan: 'Memastikan PC atau laptop dilengkapi Webcam yang masih berfungsi (opsional)',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 10,
    kegiatan: 'Memastikan ketersediaan genset atau UPS dalam keadaan baik dan layak pakai',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 11,
    kegiatan:
      'Memastikan ketersediaan cadangan jaringan internet dalam keadaan baik dan layak pakai, bisa berupa Router/ Modem Wi-Fi',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 12,
    kegiatan: 'Memastikan PC Client dapat mengakses halaman ujian',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 13,
    kegiatan: 'Memastikan ketersediaan microphone dan speaker dalam kondisi baik',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 14,
    kegiatan: 'Memastikan ketersediaan printer selama kegiatan',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 15,
    kegiatan: 'Memastikan ketersediaan ruang tunggu peserta',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 16,
    kegiatan: 'Memastikan ketersediaan tempat penitipan barang',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
  {
    id: 17,
    kegiatan: 'Memastikan ketersediaan meja pengawas di dalam ruang pelaksanaan',
    instansi: false,
    bkn: false,
    keterangan: '',
  },
]

export const DEFAULT_SARPRAS_INVENTORY_ITEMS = [
  { id: 1, nama: 'Ruang Lab Komputer', jumlah: '', keterangan: '' },
  { id: 2, nama: 'LCD Proyektor/TV + PC host', jumlah: '', keterangan: '' },
  { id: 3, nama: 'PC ujian', jumlah: '', keterangan: '' },
  { id: 4, nama: 'PC cadangan', jumlah: '', keterangan: '' },
  { id: 5, nama: 'Printer', jumlah: '', keterangan: '' },
  { id: 6, nama: 'Meja Operator dilengkapi stop kontak', jumlah: '', keterangan: '' },
]

export function CatFormulirSarprasTemplate({
  params = {},
  checklist = DEFAULT_SARPRAS_CHECKLIST_ITEMS,
  inventory = DEFAULT_SARPRAS_INVENTORY_ITEMS,
  signers = {},
}) {
  const activeSigners = {
    kiri: signers.kiri || {},
    tengah: signers.tengah || {},
    kanan: signers.kanan || {},
  }

  const isKiriFilled = Boolean(
    activeSigners.kiri.nama?.trim() ||
      activeSigners.kiri.jabatan?.trim() ||
      activeSigners.kiri.nip?.trim() ||
      activeSigners.kiri.signatureData
  )
  const isTengahFilled = Boolean(
    activeSigners.tengah.nama?.trim() ||
      activeSigners.tengah.jabatan?.trim() ||
      activeSigners.tengah.nip?.trim() ||
      activeSigners.tengah.signatureData
  )
  const isKananFilled = Boolean(
    activeSigners.kanan.nama?.trim() ||
      activeSigners.kanan.jabatan?.trim() ||
      activeSigners.kanan.nip?.trim() ||
      activeSigners.kanan.signatureData
  )

  const ttdDateLine = [
    params.kotaTtd?.trim() || '',
    params.tanggalPengecekan ? formatDateIndo(params.tanggalPengecekan) : '',
  ]
    .filter(Boolean)
    .join(', ')

  const rekomendasiStatus = params.rekomendasiStatus || ''
  const catatanRekomendasi = params.catatanRekomendasi || ''

  return (
    <>
      {/* =================================================================== */}
      {/* HALAMAN 1 (PAGE 1): JUDUL + TABEL 1 (17 KEGIATAN KESIAPAN TEKNIS) */}
      {/* =================================================================== */}
      <div
        className="document-a4-page bg-white text-black leading-snug text-left print:break-after-page"
        style={{
          ...PDF_ARIAL_PAGE_STYLE,
          width: '794px',
          minHeight: '1123px',
          maxWidth: '794px',
          padding: '36px 46px 36px 50px',
          boxSizing: 'border-box',
        }}
      >
        <div data-pdf-block="true">
          {/* JUDUL RESMI DENGAN BACKGROUND BIRU NAVY #215E99 (SESUAI FORMAT ASLI) */}
          <div className="mb-3 text-center">
            <div
              className="bg-[#215E99] print:bg-[#215E99] text-white py-2 px-3 border border-black shadow-none"
              style={{ backgroundColor: '#215E99', borderColor: '#000000' }}
            >
              <h1 className="text-[13px] font-bold tracking-wider uppercase leading-snug text-white">
                FORMULIR PENGECEKAN SARANA DAN PRASARANA
              </h1>
            </div>
          </div>

          {/* TABEL 1: 17 KEGIATAN KESIAPAN TEKNIS (HEADER #C1E4F5) */}
          <table className="w-full border-collapse border border-black text-[10.5px] leading-tight">
            <thead>
              <tr className="font-bold text-center text-black" style={{ backgroundColor: '#C1E4F5' }}>
                <th
                  rowSpan={2}
                  className="border border-black px-1.5 py-1 w-8 text-center text-black align-middle"
                  style={{ backgroundColor: '#C1E4F5', verticalAlign: 'middle' }}
                >
                  <div className="flex items-center justify-center min-h-[36px] font-bold text-center">
                    No.
                  </div>
                </th>
                <th
                  rowSpan={2}
                  className="border border-black px-2 py-1 text-center text-black align-middle"
                  style={{ backgroundColor: '#C1E4F5', verticalAlign: 'middle' }}
                >
                  <div className="flex items-center justify-center min-h-[36px] font-bold text-center">
                    Kegiatan
                  </div>
                </th>
                <th
                  colSpan={3}
                  className="border border-black px-1 py-1 text-center text-black align-middle"
                  style={{ backgroundColor: '#C1E4F5', verticalAlign: 'middle' }}
                >
                  Kesesuaian *)
                </th>
              </tr>
              <tr className="font-bold text-center text-black" style={{ backgroundColor: '#C1E4F5' }}>
                <th
                  className="border border-black px-1 py-1 w-14 text-center text-black align-middle"
                  style={{ backgroundColor: '#C1E4F5', verticalAlign: 'middle' }}
                >
                  Instansi
                </th>
                <th
                  className="border border-black px-1 py-1 w-14 text-center text-black align-middle"
                  style={{ backgroundColor: '#C1E4F5', verticalAlign: 'middle' }}
                >
                  BKN
                </th>
                <th
                  className="border border-black px-2 py-1 w-28 text-center text-black align-middle"
                  style={{ backgroundColor: '#C1E4F5', verticalAlign: 'middle' }}
                >
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="border border-black px-1.5 py-0.5 text-center align-top font-medium">
                    {idx + 1}
                  </td>
                  <td className="border border-black px-2 py-0.5 align-top text-justify">
                    {item.kegiatan}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-center align-middle font-bold text-sm">
                    {item.instansi ? '✓' : ''}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-center align-middle font-bold text-sm">
                    {item.bkn ? '✓' : ''}
                  </td>
                  <td className="border border-black px-2 py-0.5 align-top text-center">
                    {item.keterangan || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================================== */}
      {/* HALAMAN 2 (PAGE 2): TABEL 2 (INVENTARIS SARPRAS) + REKOMENDASI + TTD */}
      {/* =================================================================== */}
      <div
        className="document-a4-page bg-white text-black leading-snug text-left mt-6 print:mt-0 print:break-before-page"
        style={{
          ...PDF_ARIAL_PAGE_STYLE,
          width: '794px',
          minHeight: '1123px',
          maxWidth: '794px',
          padding: '44px 52px 44px 56px',
          boxSizing: 'border-box',
        }}
      >
        <div data-pdf-block="true">
          {/* TABEL 2: DAFTAR INVENTARIS SARANA DAN PRASARANA (HEADER #C1E4F5) */}
          <div className="mb-5">
            <table className="w-full border-collapse border border-black text-[11px] leading-tight">
              <thead>
                <tr className="font-bold text-center text-black" style={{ backgroundColor: '#C1E4F5' }}>
                  <th
                    className="border border-black px-1.5 py-1.5 w-8 text-black align-middle"
                    style={{ backgroundColor: '#C1E4F5', verticalAlign: 'middle' }}
                  >
                    No.
                  </th>
                  <th
                    className="border border-black px-2 py-1.5 text-left text-black align-middle"
                    style={{ backgroundColor: '#C1E4F5', verticalAlign: 'middle' }}
                  >
                    Sarana dan Prasarana
                  </th>
                  <th
                    className="border border-black px-2 py-1.5 text-center w-24 text-black align-middle"
                    style={{ backgroundColor: '#C1E4F5', verticalAlign: 'middle' }}
                  >
                    Jumlah
                  </th>
                  <th
                    className="border border-black px-2 py-1.5 text-left w-64 text-black align-middle"
                    style={{ backgroundColor: '#C1E4F5', verticalAlign: 'middle' }}
                  >
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((inv, idx) => (
                  <tr key={inv.id || idx} className="hover:bg-slate-50/50">
                    <td className="border border-black px-1.5 py-1 text-center align-middle font-medium">
                      {idx + 1}
                    </td>
                    <td className="border border-black px-2 py-1 align-middle font-medium">
                      {inv.nama}
                    </td>
                    <td className="border border-black px-2 py-1 text-center align-middle">
                      {inv.jumlah || '-'}
                    </td>
                    <td className="border border-black px-2 py-1 align-middle">
                      {inv.keterangan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TEKS REKOMENDASI KELAIKAN */}
          <div className="text-[11.5px] leading-relaxed mb-6 text-justify">
            <p>
              Berdasarkan hasil pengecekan di lokasi, maka Tim Pelaksana Badan Kepegawaian Negara memberikan
              rekomendasi bahwa uji coba{' '}
              <strong className="underline uppercase tracking-wide">
                {rekomendasiStatus === 'layak'
                  ? 'layak'
                  : rekomendasiStatus === 'catatan'
                  ? 'layak dengan catatan'
                  : rekomendasiStatus === 'tidak_layak'
                  ? 'tidak layak'
                  : '........................'}
              </strong>{' '}
              untuk dilaksanakan.
              {catatanRekomendasi && (
                <span className="italic block mt-1 text-[11px] text-slate-800">
                  Catatan: {catatanRekomendasi}
                </span>
              )}
            </p>
          </div>

          {/* AREA PENANDATANGANAN (STANDAR TTE RESMI BKN & INSTANSI) */}
          <div className="pt-2 text-[11.5px] leading-normal break-inside-avoid">
          {/* TANGGAL DI ATAS KOLOM KANAN */}
          <div className="flex justify-end mb-2">
            <div className="w-72 text-center font-medium">
              <p>{ttdDateLine}</p>
            </div>
          </div>

          {/* 2 / 3 KOLOM TTD */}
          <div className="flex justify-between items-start gap-6">
            {/* KOLOM KIRI (PIHAK BKN) */}
            {isKiriFilled && (
              <div className="flex-1 text-center space-y-1">
                <p className="font-medium whitespace-pre-line leading-tight min-h-[2.4em]">
                  {activeSigners.kiri.jabatan || 'Panitia Pelaksana\nBadan Kepegawaian Negara'}
                </p>
                <div className="h-18 flex items-center justify-center my-0.5">
                  {activeSigners.kiri.signatureData ? (
                    <img
                      src={activeSigners.kiri.signatureData}
                      alt="TTE Kiri"
                      className="max-h-full max-w-[130px] object-contain"
                    />
                  ) : (
                    <div className="h-16" />
                  )}
                </div>
                {activeSigners.kiri.nama && (
                  <p className="font-bold underline uppercase">{activeSigners.kiri.nama}</p>
                )}
                {activeSigners.kiri.nip && (
                  <p className="text-black">
                    {activeSigners.kiri.nip.startsWith('NIP.') ? activeSigners.kiri.nip : `NIP. ${activeSigners.kiri.nip}`}
                  </p>
                )}
              </div>
            )}

            {/* KOLOM TENGAH (OPSIONAL SAKSI) */}
            {isTengahFilled && (
              <div className="flex-1 text-center space-y-1">
                <p className="font-medium whitespace-pre-line leading-tight min-h-[2.4em]">
                  {activeSigners.tengah.jabatan || 'Petugas Teknis TI / Saksi'}
                </p>
                <div className="h-18 flex items-center justify-center my-0.5">
                  {activeSigners.tengah.signatureData ? (
                    <img
                      src={activeSigners.tengah.signatureData}
                      alt="TTE Tengah"
                      className="max-h-full max-w-[130px] object-contain"
                    />
                  ) : (
                    <div className="h-16" />
                  )}
                </div>
                {activeSigners.tengah.nama && (
                  <p className="font-bold underline uppercase">{activeSigners.tengah.nama}</p>
                )}
                {activeSigners.tengah.nip && (
                  <p className="text-black">
                    {activeSigners.tengah.nip.startsWith('NIP.') ? activeSigners.tengah.nip : `NIP. ${activeSigners.tengah.nip}`}
                  </p>
                )}
              </div>
            )}

            {/* KOLOM KANAN (PIHAK INSTANSI) */}
            {isKananFilled && (
              <div className="flex-1 text-center space-y-1">
                <p className="font-medium whitespace-pre-line leading-tight min-h-[2.4em]">
                  {activeSigners.kanan.jabatan || 'Panitia Pelaksana\nPemerintah Daerah'}
                </p>
                <div className="h-18 flex items-center justify-center my-0.5">
                  {activeSigners.kanan.signatureData ? (
                    <img
                      src={activeSigners.kanan.signatureData}
                      alt="TTE Kanan"
                      className="max-h-full max-w-[130px] object-contain"
                    />
                  ) : (
                    <div className="h-16" />
                  )}
                </div>
                {activeSigners.kanan.nama && (
                  <p className="font-bold underline uppercase">{activeSigners.kanan.nama}</p>
                )}
                {activeSigners.kanan.nip && (
                  <p className="text-black">
                    {activeSigners.kanan.nip.startsWith('NIP.') ? activeSigners.kanan.nip : `NIP. ${activeSigners.kanan.nip}`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
