import { useState, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FolderClosed,
  ExternalLink,
  FileText,
  Pencil,
  Eye,
  Target,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowUpRight,
  X,
  History,
} from 'lucide-react'

export function IkkGroupedTable({
  sasarans = [],
  isLoading = false,
  searchTerm = '',
  onEditItem,
  onDetailItem,
  onViewLogs,
  filterTahun = '',
  filterTriwulan = '',
  filterBulan = '',
}) {
  // State untuk collapsible accordion: sasaran_id -> boolean (default all expanded)
  const [expandedSasaran, setExpandedSasaran] = useState(() => {
    const init = {}
    sasarans.forEach((s) => {
      init[s.id] = true
    })
    return init
  })

  // State untuk popover / modal detail analisis cepat
  const [activeAnalysisItem, setActiveAnalysisItem] = useState(null)

  const toggleSasaran = (id) => {
    setExpandedSasaran((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const expandAll = () => {
    const all = {}
    sasarans.forEach((s) => {
      all[s.id] = true
    })
    setExpandedSasaran(all)
  }

  const collapseAll = () => {
    setExpandedSasaran({})
  }

  // Filter pencarian
  const filteredSasarans = useMemo(() => {
    if (!searchTerm.trim()) return sasarans

    const term = searchTerm.toLowerCase()
    return sasarans
      .map((sas) => {
        const matchSasaran =
          sas.nama_sasaran?.toLowerCase().includes(term) ||
          sas.kode?.toLowerCase().includes(term)

        const matchedIndikators = (sas.indikators || []).filter(
          (ind) =>
            ind.nama_indikator?.toLowerCase().includes(term) ||
            ind.kode?.toLowerCase().includes(term) ||
            ind.penjelasan_capaian?.toLowerCase().includes(term) ||
            ind.permasalahan?.toLowerCase().includes(term) ||
            ind.rencana_tindak_lanjut?.toLowerCase().includes(term)
        )

        if (matchSasaran) {
          return sas
        }
        if (matchedIndikators.length > 0) {
          return {
            ...sas,
            indikators: matchedIndikators,
          }
        }
        return null
      })
      .filter(Boolean)
  }, [sasarans, searchTerm])

  // Helper badge capaian
  const renderCapaianBadge = (capaianDisplay, capaianNum) => {
    if (capaianDisplay === 'NA' || capaianDisplay === 'N/A' || capaianDisplay === '-') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
          NA
        </span>
      )
    }

    if (capaianNum !== null && capaianNum !== undefined) {
      if (capaianNum >= 100) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{capaianDisplay}</span>
          </span>
        )
      }
      if (capaianNum >= 80) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 shadow-2xs">
            <span>{capaianDisplay}</span>
          </span>
        )
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 shadow-2xs">
          <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{capaianDisplay}</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
        {capaianDisplay}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-2xs p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 animate-pulse">
            <div className="h-10 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/40"></div>
            <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg ml-6"></div>
            <div className="h-8 bg-slate-100 dark:bg-slate-800/60 rounded-lg ml-6"></div>
          </div>
        ))}
      </div>
    )
  }

  if (filteredSasarans.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-2xs p-12 text-center space-y-3">
        <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Tidak ada data Sasaran & Indikator IKK ditemukan.
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {searchTerm
            ? `Tidak ada hasil yang sesuai dengan kata kunci "${searchTerm}". Silakan bersihkan pencarian.`
            : 'Belum ada data IKK untuk periode yang dipilih. Silakan unggah file Excel atau lakukan input satuan.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-2xs overflow-hidden">
      {/* Top Table Header Action Bar */}
      <div className="px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-850/50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#175CD3]" />
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Matriks Capaian Kinerja Sasaran & Indikator (IKK)
          </span>
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
            {filterTriwulan ? `Triwulan ${filterTriwulan}` : 'Posisi Terakhir'} {filterTahun}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Buka Semua</span>
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <FolderClosed className="w-3.5 h-3.5 text-slate-500" />
            <span>Tutup Semua</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto clean-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-[42%]">
                SASARAN KINERJA KEGIATAN / INDIKATOR KINERJA KEGIATAN
              </th>
              <th className="py-3 px-3 text-center w-[9%]">SATUAN</th>
              <th className="py-3 px-3 text-center w-[9%]">TARGET</th>
              <th className="py-3 px-3 text-center w-[10%]">REALISASI</th>
              <th className="py-3 px-3 text-center w-[10%]">CAPAIAN</th>
              <th className="py-3 px-3 text-center w-[8%]">ANALISIS</th>
              <th className="py-3 px-3 text-center w-[6%]">EVIDEN</th>
              <th className="py-3 px-3 text-center w-[6%]">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredSasarans.map((sasaran) => {
              const isExpanded = !!expandedSasaran[sasaran.id]
              const indikators = sasaran.indikators || []

              return (
                <tbody key={`sasaran-${sasaran.id}`} className="contents">
                  {/* GROUP HEADER ROW: SASARAN STRATEGIS (Amber / Warm Gold Banner Matching Image 1) */}
                  <tr className="bg-[#FAF5EB] dark:bg-amber-950/30 hover:bg-[#F5ECD7] dark:hover:bg-amber-950/45 transition-colors border-y border-amber-200/80 dark:border-amber-900/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleSasaran(sasaran.id)}
                          className="p-1 rounded-md text-amber-800 dark:text-amber-200 hover:bg-amber-200/60 dark:hover:bg-amber-900/60 transition-colors shrink-0 cursor-pointer"
                          title={isExpanded ? 'Tutup Sasaran' : 'Buka Sasaran'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <div className="font-bold text-[#8A4B16] dark:text-amber-200 leading-snug">
                          <span className="font-black mr-1.5">{sasaran.kode}</span>
                          <span>{sasaran.nama_sasaran}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-[#8A4B16] dark:text-amber-300">
                      NSS:
                    </td>

                    <td className="py-3 px-3 text-center font-black text-[#8A4B16] dark:text-amber-200">
                      {sasaran.nss !== 'NA' && sasaran.nss !== null
                        ? `${sasaran.nss}%`
                        : 'NA'}
                    </td>

                    <td className="py-3 px-3 text-center text-slate-400 italic">
                      -
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800">
                        {sasaran.total_terisi}/{sasaran.total_indikator} Terisi
                      </span>
                    </td>

                    <td colSpan={3} className="py-3 px-3 text-right pr-4">
                      <span className="text-[11px] font-semibold text-amber-800/80 dark:text-amber-300/80">
                        {indikators.length} Indikator Kinerja
                      </span>
                    </td>
                  </tr>

                  {/* CHILD ROWS: INDIKATOR KINERJA KEGIATAN (IKK 1..18) */}
                  {isExpanded &&
                    (indikators.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-3 px-8 text-xs text-slate-400 italic bg-white dark:bg-slate-900"
                        >
                          Belum ada indikator kinerja terdaftar pada sasaran ini.
                        </td>
                      </tr>
                    ) : (
                      indikators.map((ind) => (
                        <tr
                          key={`ind-${ind.id}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900"
                        >
                          {/* Nama Indikator dengan Indentasi */}
                          <td className="py-3 px-4 pl-9">
                            <div className="flex items-start gap-2">
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                                {ind.kode}
                              </span>
                              <span className="font-medium text-slate-800 dark:text-slate-100 leading-snug">
                                {ind.nama_indikator}
                              </span>
                            </div>
                          </td>

                          {/* Satuan */}
                          <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300 font-medium">
                            {ind.satuan || '-'}
                          </td>

                          {/* Target */}
                          <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-100">
                            {ind.target_periode || ind.target_tahunan || '-'}
                          </td>

                          {/* Realisasi (Data Terakhir, Bukan Akumulatif) */}
                          <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                            {ind.realisasi || '-'}
                          </td>

                          {/* Capaian (%) - Ditampilkan Berdasarkan Nilai Capaian Database */}
                          <td className="py-3 px-3 text-center">
                            {renderCapaianBadge(ind.capaian, ind.capaian_num)}
                          </td>

                          {/* Analisis (Penjelasan, Permasalahan, Tindak Lanjut) */}
                          <td className="py-3 px-3 text-center">
                            {ind.penjelasan_capaian ||
                            ind.permasalahan ||
                            ind.rencana_tindak_lanjut ? (
                              <button
                                type="button"
                                onClick={() => setActiveAnalysisItem(ind)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-[#175CD3] dark:hover:text-blue-300 text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                                title="Lihat Penjelasan, Permasalahan, dan Tindak Lanjut"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Lihat</span>
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>

                          {/* Link Bukti Dukung */}
                          <td className="py-3 px-3 text-center">
                            {ind.bukti_dukung ? (
                              <a
                                href={ind.bukti_dukung}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 text-[#175CD3] dark:text-blue-400 transition-colors shadow-2xs cursor-pointer"
                                title="Buka Link Bukti Dukung (Google Drive)"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            )}
                          </td>

                          {/* Aksi: Riwayat Log & Edit Input Satuan */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onViewLogs && onViewLogs(ind)}
                                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 text-[#175CD3] dark:text-indigo-300 transition-colors shadow-2xs cursor-pointer"
                                title="Lihat Riwayat Log Capaian & Pergerakan Nilai"
                              >
                                <History className="w-3.5 h-3.5 text-[#175CD3] dark:text-indigo-400" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditItem && onEditItem(ind)}
                                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                                title="Input / Edit Realisasi Satuan"
                              >
                                <Pencil className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ))}
                </tbody>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DETAIL ANALISIS (PENJELASAN, PERMASALAHAN, TINDAK LANJUT) */}
      {activeAnalysisItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#175CD3] text-white">
                    {activeAnalysisItem.kode}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Periode: Triwulan {activeAnalysisItem.triwulan || filterTriwulan || '-'} {activeAnalysisItem.tahun || filterTahun}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {activeAnalysisItem.nama_indikator}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveAnalysisItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-5 space-y-4 overflow-y-auto clean-scrollbar text-xs">
              {/* Ringkasan Angka */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                    {activeAnalysisItem.target_periode || activeAnalysisItem.target_tahunan || '-'} {activeAnalysisItem.satuan}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Realisasi</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                    {activeAnalysisItem.realisasi || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Capaian</span>
                  <div className="mt-0.5">
                    {renderCapaianBadge(activeAnalysisItem.capaian, activeAnalysisItem.capaian_num)}
                  </div>
                </div>
              </div>

              {/* 1. Penjelasan Progress */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span>Penjelasan / Progress Capaian</span>
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {activeAnalysisItem.penjelasan_capaian || (
                    <span className="text-slate-400 italic">Tidak ada catatan penjelasan progres.</span>
                  )}
                </div>
              </div>

              {/* 2. Permasalahan */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Permasalahan / Kendala</span>
                </label>
                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {activeAnalysisItem.permasalahan || (
                    <span className="text-slate-400 italic">Tidak ada kendala yang dicatat.</span>
                  )}
                </div>
              </div>

              {/* 3. Rencana Tindak Lanjut */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Rencana Tindak Lanjut</span>
                </label>
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {activeAnalysisItem.rencana_tindak_lanjut || (
                    <span className="text-slate-400 italic">Tidak ada rencana tindak lanjut yang dicatat.</span>
                  )}
                </div>
              </div>

              {/* 4. Link Bukti Dukung */}
              {activeAnalysisItem.bukti_dukung && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Link Bukti Dukung (Eviden):
                  </span>
                  <a
                    href={activeAnalysisItem.bukti_dukung}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#175CD3] dark:text-blue-400 hover:underline break-all"
                  >
                    <span>{activeAnalysisItem.bukti_dukung}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const itm = activeAnalysisItem
                  setActiveAnalysisItem(null)
                  onEditItem && onEditItem(itm)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Data Ini</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAnalysisItem(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
