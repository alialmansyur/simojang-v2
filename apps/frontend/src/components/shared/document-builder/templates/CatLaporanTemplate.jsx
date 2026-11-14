import { formatDateIndo, DEFAULT_DOKUMENTASI_CATEGORIES } from '../documentBuilderUtils'
import { PDF_ARIAL_PAGE_STYLE } from '../../services/sidigi/cat/pengelola/pengelolaConstants'

export function CatLaporanTemplate({
  params = {},
  calculatedHari = '-',
  evidenceMap = {},
  signers = {},
  tableData = [],
  totalSummary = { jumlah: 0, hadir: 0, tidakHadir: 0 },
  formattedInstansiNames = 'INSTANSI DI WILAYAH KERJA KANREG III BKN',
  kegiatanNama = 'SELEKSI PENGEMBANGAN KARIER',
  tilokNama = 'KANTOR REGIONAL III BKN BANDUNG',
  currentYear = new Date().getFullYear().toString(),
  categories = DEFAULT_DOKUMENTASI_CATEGORIES,
}) {
  // Normalisasi data signers tanpa nilai default hardcoded
  const activeSigners = {
    kiri: signers.kiri || {},
    tengah: signers.tengah || {},
    kanan: signers.kanan || {
      jabatan: params.jabatanPenandatangan || '',
      nama: params.namaPenandatangan || '',
      nip: params.nipPenandatangan || '',
      signatureData: params.signatureData || null,
    },
  }

  // Cek apakah masing-masing kolom terisi (minimal ada nama, jabatan, nip, atau tanda tangan)
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
    params.kotaTtd?.trim(),
    params.tanggalPelaksanaan ? formatDateIndo(params.tanggalPelaksanaan) : '',
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      {/* =================================================================== */}
      {/* HALAMAN 1 (PAGE 1): LEMBAR UTAMA LAPORAN KEGIATAN PELAKSANAAN */}
      {/* =================================================================== */}
      <div
        className="document-a4-page bg-white text-black leading-relaxed text-justify"
        style={{
          ...PDF_ARIAL_PAGE_STYLE,
          width: '794px',
          minHeight: '1123px',
          maxWidth: '794px',
          padding: '48px 50px',
          boxSizing: 'border-box',
        }}
      >
        {/* KOP / JUDUL LAPORAN */}
        <div data-pdf-block="true" className="text-center space-y-1 pb-6 border-b border-black">
          <h1 className="text-[12px] font-bold tracking-tight uppercase leading-snug">
            LAPORAN KEGIATAN PELAKSANAAN
          </h1>
          <h2 className="text-[12px] font-bold tracking-tight uppercase leading-snug">
            {kegiatanNama} DI LINGKUNGAN
          </h2>
          <h3 className="text-[12px] font-bold tracking-tight uppercase leading-snug">
            {formattedInstansiNames} TAHUN {currentYear}
          </h3>
          <h4 className="text-[12px] font-bold tracking-tight uppercase leading-snug">
            LOKASI {tilokNama}
          </h4>
        </div>

        {/* PENDAHULUAN */}
        <div className="pt-6 space-y-3 text-[12px] leading-relaxed">
          <div data-pdf-block="true" className="space-y-2.5">
            <h4 className="font-bold text-[12px] text-left">Pendahuluan</h4>
            <p>
              Pelaksanaan pengembangan karier melalui {kegiatanNama} bagi pegawai di lingkungan{' '}
              <strong>{formattedInstansiNames}</strong> diselenggarakan menggunakan metode Computer
              Assisted Test (CAT) Badan Kepegawaian Negara. Secara operasional, kegiatan ini
              berpedoman secara komprehensif pada Peraturan Kepala Badan Kepegawaian Negara Nomor 10
              Tahun 2024 tentang Pedoman Pelaksanaan Ujian Dinas dan Ujian Penyesuaian Kenaikan
              Pangkat dengan Metode CAT BKN. Regulasi ini menjadi landasan utama dalam mewujudkan
              proses uji kompetensi yang transparan, objektif, dan akuntabel berbasis teknologi
              digital, guna memastikan setiap Pegawai Negeri Sipil yang diusulkan untuk kenaikan
              pangkat maupun jenjang jabatan telah memenuhi standar kompetensi dan profesionalisme
              yang dipersyaratkan.
            </p>
          </div>
          <p data-pdf-block="true">
            Sesuai surat Deputi Bidang Sistem Informasi dan Digitalisasi Manajemen ASN Badan
            Kepegawaian Negara Nomor {params.nomorSuratDeputi || '-'} Tanggal{' '}
            {params.tanggalSuratDeputi ? formatDateIndo(params.tanggalSuratDeputi) : '-'}{' '}
            perihal tentang Fasilitasi Pelaksanaan Pengembangan Karier dengan menggunakan CAT BKN.
            Oleh karena itu, untuk menjamin kelancaran penyelenggaraan seleksi tersebut dipandang
            perlu membentuk Tim Pelaksana Kegiatan Dalam Rangka Fasilitasi Seleksi Pengembangan
            Karier di lingkungan {formattedInstansiNames} dengan Metode Computer Assisted Test (CAT) di{' '}
            {tilokNama} sesuai dengan Surat Tugas Kepala Kantor Regional III BKN Bandung Nomor{' '}
            {params.nomorSuratTugas || '-'} Tanggal{' '}
            {params.tanggalSuratTugas ? formatDateIndo(params.tanggalSuratTugas) : '-'} yaitu melaksanakan tugas
            sebagai Tim Pelaksana Seleksi Kegiatan Dalam Rangka Fasilitasi Seleksi Pengembangan
            Karier dengan menggunakan metode Computer Assisted Test Badan Kepegawaian Negara (CAT BKN).
          </p>
        </div>

        {/* PELAKSANAAN & JADWAL */}
        <div data-pdf-block="true" className="pt-5 space-y-2 text-[12px] leading-relaxed">
          <h4 className="font-bold text-[12px] text-left">Pelaksanaan</h4>
          <p>
            Kegiatan Dalam Rangka Fasilitasi Seleksi Pengembangan Karier di lingkungan{' '}
            {formattedInstansiNames} dengan Metode Computer Assisted Test (CAT) BKN dilaksanakan:
          </p>
          <div className="pl-4 space-y-1 font-medium">
            <div className="flex">
              <span className="w-24 shrink-0">Hari</span>
              <span className="w-4">:</span>
              <span className="font-semibold">{calculatedHari || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-24 shrink-0">Tanggal</span>
              <span className="w-4">:</span>
              <span className="font-semibold">
                {params.tanggalPelaksanaan ? formatDateIndo(params.tanggalPelaksanaan) : '-'}
              </span>
            </div>
            <div className="flex">
              <span className="w-24 shrink-0">Waktu</span>
              <span className="w-4">:</span>
              <span className="font-semibold">{params.waktuPelaksanaan || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-24 shrink-0">Tempat</span>
              <span className="w-4">:</span>
              <span className="font-semibold">{params.tempatPelaksanaan || '-'}</span>
            </div>
          </div>
        </div>

        {/* PELAKSANAAN KEGIATAN & TABEL REALISASI PER INSTANSI */}
        <div className="pt-5 space-y-3 text-[12px] leading-relaxed">
          <div data-pdf-block="true" className="space-y-3">
            <h4 className="font-bold text-[12px] text-left">Pelaksanaan Kegiatan</h4>
            <p>
              Sesuai surat tugas Kepala Kantor Regional III Badan Kepegawaian Negara Nomor{' '}
              {params.nomorSuratTugas || '-'} Tanggal{' '}
              {params.tanggalSuratTugas ? formatDateIndo(params.tanggalSuratTugas) : '-'} dengan hormat kami laporkan
              bahwa surat perintah tersebut telah kami laksanakan pada tanggal{' '}
              {params.tanggalPelaksanaan ? formatDateIndo(params.tanggalPelaksanaan) : '-'}{' '}
              dengan rincian sebagai berikut:
            </p>

            <p className="font-semibold text-[12px]">
              Daftar Instansi yang melaksanakan {kegiatanNama} Tahun {currentYear} :
            </p>
          </div>

          {/* TABEL RINCIAN KEHADIRAN (FORMAT RESMI BKN) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px] text-black border border-black border-collapse">
              <thead data-pdf-block="true">
                <tr className="bg-slate-100 text-black border-b border-black">
                  <th rowSpan={2} className="p-2 border-r border-black text-center w-10">No</th>
                  <th rowSpan={2} className="p-2 border-r border-black">Nama Instansi</th>
                  <th rowSpan={2} className="p-2 border-r border-black text-center">Tanggal</th>
                  <th rowSpan={2} className="p-2 border-r border-black text-center w-12">Sesi</th>
                  <th colSpan={3} className="p-1 border-b border-black text-center font-bold">Peserta</th>
                </tr>
                <tr className="bg-slate-100 text-black border-b border-black">
                  <th className="p-1.5 border-r border-black text-center w-24">Jumlah Peserta</th>
                  <th className="p-1.5 border-r border-black text-center w-16">Hadir</th>
                  <th className="p-1.5 text-center w-20">Tidak Hadir</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr data-pdf-block="true">
                    <td colSpan={7} className="p-4 text-center italic">
                      Tidak ada jadwal sesi ujian pada tanggal{' '}
                      {params.tanggalPelaksanaan ? formatDateIndo(params.tanggalPelaksanaan) : '-'}
                    </td>
                  </tr>
                ) : (
                  tableData.map((row) => (
                    <tr key={row.no} data-pdf-block="true" className="border-b border-black">
                      <td className="p-2 border-r border-black text-center">{row.no}.</td>
                      <td className="p-2 border-r border-black font-medium">{row.nama}</td>
                      <td className="p-2 border-r border-black text-center">{row.tanggal}</td>
                      <td className="p-2 border-r border-black text-center">{row.sesi}</td>
                      <td className="p-2 border-r border-black text-center font-semibold">{row.jumlah}</td>
                      <td className="p-2 border-r border-black text-center font-semibold">{row.hadir}</td>
                      <td className="p-2 text-center font-semibold">{row.tidakHadir}</td>
                    </tr>
                  ))
                )}
                <tr data-pdf-block="true" className="bg-slate-100 font-bold border-t-2 border-black">
                  <td colSpan={4} className="p-2 border-r border-black text-center">Total</td>
                  <td className="p-2 border-r border-black text-center">{totalSummary.jumlah}</td>
                  <td className="p-2 border-r border-black text-center">{totalSummary.hadir}</td>
                  <td className="p-2 text-center">{totalSummary.tidakHadir}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p data-pdf-block="true" className="pt-1">
            Selama pelaksanaan seleksi berjalan dengan lancar dan setiap sesi dilakukan
            pengecekan kesesuaian peserta yang berada di titik lokasi ujian dengan jumlah peserta
            pada sistem CAT BKN.
          </p>
        </div>

        {/* PENUTUP */}
        <div data-pdf-block="true" className="pt-5 space-y-2 text-[12px] leading-relaxed">
          <h4 className="font-bold text-[12px] text-left">Penutup</h4>
          <p>
            Tim Pelaksana CAT BKN dari Kantor Regional III BKN dan Tim Panitia Seleksi
            Pengembangan Karier {formattedInstansiNames} bekerja sama dengan baik sehingga
            pelaksanaan Seleksi Pengembangan Karier dapat berjalan dengan aman dan tertib.
          </p>
        </div>

        {/* =================================================================== */}
        {/* AREA TANDA TANGAN 3 POSISI DINAMIS (KIRI, TENGAH, KANAN)            */}
        {/* =================================================================== */}
        {(isKiriFilled || isTengahFilled || isKananFilled) && (
          <div data-pdf-block="true" className="pt-8 break-inside-avoid">
            <table className="w-full text-center border-collapse">
              <tbody>
                <tr>
                  {/* Posisi Kiri */}
                  <td className="w-1/3 align-top px-2">
                    {isKiriFilled && (
                      <div className="space-y-1 text-[12px] text-black">
                        <p className="invisible select-none pb-0.5">&nbsp;</p>
                        <p className="font-medium whitespace-pre-line leading-tight min-h-[1.25em]">
                          {activeSigners.kiri.jabatan || '\u00A0'}
                        </p>
                        <div className="h-20 flex items-center justify-center my-1">
                          {activeSigners.kiri.signatureData ? (
                            <img
                              src={activeSigners.kiri.signatureData}
                              alt="E-Signature Kiri"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : null}
                        </div>
                        {activeSigners.kiri.nama && (
                          <p className="font-bold underline uppercase">{activeSigners.kiri.nama}</p>
                        )}
                        {activeSigners.kiri.nip && (
                          <p className="text-black">NIP. {activeSigners.kiri.nip}</p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Posisi Tengah */}
                  <td className="w-1/3 align-top px-2">
                    {isTengahFilled && (
                      <div className="space-y-1 text-[12px] text-black">
                        <p className="invisible select-none pb-0.5">&nbsp;</p>
                        <p className="font-medium whitespace-pre-line leading-tight min-h-[1.25em]">
                          {activeSigners.tengah.jabatan || '\u00A0'}
                        </p>
                        <div className="h-20 flex items-center justify-center my-1">
                          {activeSigners.tengah.signatureData ? (
                            <img
                              src={activeSigners.tengah.signatureData}
                              alt="E-Signature Tengah"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : null}
                        </div>
                        {activeSigners.tengah.nama && (
                          <p className="font-bold underline uppercase">{activeSigners.tengah.nama}</p>
                        )}
                        {activeSigners.tengah.nip && (
                          <p className="text-black">NIP. {activeSigners.tengah.nip}</p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Posisi Kanan */}
                  <td className="w-1/3 align-top px-2">
                    {isKananFilled && (
                      <div className="space-y-1 text-[12px] text-black">
                        <p className="pb-0.5 min-h-[1.25em]">{ttdDateLine || '\u00A0'}</p>
                        <p className="font-medium whitespace-pre-line leading-tight min-h-[1.25em]">
                          {activeSigners.kanan.jabatan || '\u00A0'}
                        </p>
                        <div className="h-20 flex items-center justify-center my-1">
                          {activeSigners.kanan.signatureData ? (
                            <img
                              src={activeSigners.kanan.signatureData}
                              alt="E-Signature Kanan"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : null}
                        </div>
                        {activeSigners.kanan.nama && (
                          <p className="font-bold underline uppercase">{activeSigners.kanan.nama}</p>
                        )}
                        {activeSigners.kanan.nip && (
                          <p className="text-black">NIP. {activeSigners.kanan.nip}</p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* HALAMAN 2 (PAGE 2): LAMPIRAN DOKUMENTASI (HANYA JIKA ADA EVIDEN)   */}
      {/* =================================================================== */}
      {(() => {
        const uploadedCategories = categories.filter((cat) => Boolean(evidenceMap?.[cat.key]))
        if (uploadedCategories.length === 0) return null

        const rows = []
        for (let i = 0; i < uploadedCategories.length; i += 2) {
          rows.push(uploadedCategories.slice(i, i + 2))
        }

        return (
          <div
            className="document-a4-page bg-white text-black leading-relaxed"
            style={{
              ...PDF_ARIAL_PAGE_STYLE,
              width: '794px',
              minHeight: '1123px',
              maxWidth: '794px',
              padding: '48px 50px',
              boxSizing: 'border-box',
            }}
          >
            <div data-pdf-block="true" className="text-center pb-4 border-b border-black">
              <h4 className="font-bold text-[12px] tracking-widest uppercase">
                DOKUMENTASI PELAKSANAAN KEGIATAN
              </h4>
              <p className="text-[12px] text-black mt-0.5">
                Fasilitasi Seleksi Berbasis Computer Assisted Test (CAT)
                {params.tanggalPelaksanaan ? ` • ${formatDateIndo(params.tanggalPelaksanaan)}` : ''}
              </p>
            </div>

            {/* Grid Foto Dokumentasi per baris (agar aman terhadap page break) */}
            <div className="pt-6 space-y-6">
              {uploadedCategories.length === 1 ? (
                <div data-pdf-block="true" className="max-w-lg mx-auto space-y-2 text-center">
                  <div className="border border-black rounded-lg overflow-hidden aspect-16/10 bg-slate-100 flex items-center justify-center shadow-xs">
                    <img
                      src={evidenceMap[uploadedCategories[0].key]}
                      alt={uploadedCategories[0].label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[12px] font-bold text-black uppercase tracking-wide">
                    {uploadedCategories[0].label}
                  </p>
                </div>
              ) : (
                rows.map((pair, rIdx) => (
                  <div key={rIdx} data-pdf-block="true" className="grid grid-cols-2 gap-6">
                    {pair.map((cat) => (
                      <div key={cat.key} className="space-y-2 text-center">
                        <div className="border border-black rounded-lg overflow-hidden aspect-16/10 bg-slate-100 flex items-center justify-center shadow-xs">
                          <img
                            src={evidenceMap[cat.key]}
                            alt={cat.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[12px] font-bold text-black uppercase tracking-wide">
                          {cat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })()}
    </>
  )
}
