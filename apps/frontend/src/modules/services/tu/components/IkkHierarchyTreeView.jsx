import { useState, useEffect } from 'react'
import {
  Target,
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Users,
  Loader2,
  FolderOpen,
  FolderClosed,
  FileText,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react'
import { fetchIkkHierarchy } from '../../../../services/api/tuServicesApi'

export function IkkHierarchyTreeView({ filterTahun = '', filterTriwulan = '' }) {
  const [treeData, setTreeData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [expandedSasaran, setExpandedSasaran] = useState({})
  const [expandedKegiatan, setExpandedKegiatan] = useState({})

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setErrorMsg('')
    fetchIkkHierarchy({ tahun: filterTahun, triwulan: filterTriwulan })
      .then((data) => {
        if (!isMounted) return
        if (Array.isArray(data) && data.length > 0) {
          setTreeData(data)
          const initSasExp = {}
          const initKegExp = {}
          data.forEach((s) => {
            initSasExp[s.id] = true
            const inds = s.indikators || s.indikator || []
            inds.forEach((ind) => {
              const kegs = ind.kegiatans || ind.kegiatan || []
              kegs.forEach((k) => {
                // Auto expand kegiatan if it has transactions
                const trxs = k.transaksis || k.transaksi || []
                if (trxs.length > 0) {
                  initKegExp[k.id] = true
                }
              })
            })
          })
          setExpandedSasaran(initSasExp)
          setExpandedKegiatan(initKegExp)
        } else {
          setTreeData([])
        }
      })
      .catch((err) => {
        console.warn('Gagal fetch hierarchy IKK:', err)
        if (isMounted) {
          setTreeData([])
          setErrorMsg(err?.message || 'Gagal memuat pohon hierarki IKK dari server.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [filterTahun, filterTriwulan])

  const toggleSasaran = (id) => {
    setExpandedSasaran((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleKegiatan = (id) => {
    setExpandedKegiatan((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const expandAll = () => {
    const sasExp = {}
    const kegExp = {}
    treeData.forEach((s) => {
      sasExp[s.id] = true
      const inds = s.indikators || s.indikator || []
      inds.forEach((ind) => {
        const kegs = ind.kegiatans || ind.kegiatan || []
        kegs.forEach((k) => {
          kegExp[k.id] = true
        })
      })
    })
    setExpandedSasaran(sasExp)
    setExpandedKegiatan(kegExp)
  }

  const collapseAll = () => {
    setExpandedSasaran({})
    setExpandedKegiatan({})
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-3 w-1/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="p-8 text-center space-y-2 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200/60 dark:border-rose-900/40">
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{errorMsg}</p>
      </div>
    )
  }

  if (treeData.length === 0) {
    return (
      <div className="p-12 text-center space-y-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Belum ada data pohon hierarki IKK.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Silakan tambahkan sasaran strategis dan indikator kinerja pada server.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xs">
      {/* Top Tree Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Matriks Monitoring Pohon Kinerja Renstra Kanreg III BKN</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
              5 Tingkat Berjenjang
            </span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Level 1: Sasaran Strategis → Level 2: Indikator (IKK) → Level 3: Kegiatan & Tim Pengampu → Level 4: Log Transaksi Realisasi & Eviden
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Buka Semua</span>
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <FolderClosed className="w-3.5 h-3.5" />
            <span>Tutup Semua</span>
          </button>
        </div>
      </div>

      {/* Hierarchical Tree Container */}
      <div className="space-y-3.5">
        {treeData.map((sasaran, sIdx) => {
          const isSasExpanded = !!expandedSasaran[sasaran.id]
          const indikators = sasaran.indikators || sasaran.indikator || sasaran.children || []

          return (
            <div
              key={sasaran.id}
              className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 overflow-hidden"
            >
              {/* LEVEL 1: SASARAN STRATEGIS NODE */}
              <button
                type="button"
                onClick={() => toggleSasaran(sasaran.id)}
                className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-900/50 text-[#175CD3] dark:text-blue-300">
                        Sasaran #{sasaran.no_urut || sIdx + 1}
                      </span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {sasaran.nama_sasaran}
                    </h5>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {indikators.length} Indikator
                  </span>
                  {isSasExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* LEVEL 2: INDIKATOR KINERJA CHILDREN */}
              {isSasExpanded && (
                <div className="p-3 sm:p-4 pt-1 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/60">
                  {indikators.length === 0 ? (
                    <div className="py-2 px-3 text-xs text-slate-400 italic">
                      Belum ada indikator terdaftar pada sasaran ini.
                    </div>
                  ) : (
                    indikators.map((ind, iIdx) => {
                      const kegiatans = ind.kegiatans || ind.kegiatan || ind.children || []
                      const rawPct = ind.periode_progres ?? ind.progres_capaian ?? ind.progres ?? 0
                      const indPct = Math.round(Number(rawPct) * 10) / 10
                      const isOver = indPct > 100

                      return (
                        <div
                          key={ind.id}
                          className="p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                        >
                          {/* Indikator Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                Indikator #{ind.no_urut || iIdx + 1}
                              </span>
                              <h6 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                {ind.nama_indikator}
                              </h6>
                              {ind.pengampu_list && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Users className="w-3 h-3 text-slate-400" />
                                  <span>Pengampu: {ind.pengampu_list}</span>
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isOver
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : indPct >= 100
                                      ? 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300'
                                      : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isOver ? `Melampaui Target (${indPct}%)` : `${indPct}%`}</span>
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold font-mono">
                                Target: {ind.target_volume || '-'} {ind.satuan || ''}
                              </span>
                            </div>
                          </div>

                          {/* LEVEL 3: KEGIATAN OPERASIONAL & TIM PENGAMPU */}
                          <div className="pl-3 sm:pl-4 border-l-2 border-indigo-200 dark:border-indigo-900/60 space-y-2.5 pt-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              <span>Kegiatan Operasional ({kegiatans.length}):</span>
                            </div>

                            {kegiatans.length === 0 ? (
                              <div className="py-1 text-xs text-slate-400 italic">
                                Belum ada kegiatan operasional terdaftar.
                              </div>
                            ) : (
                              kegiatans.map((k, kIdx) => {
                                const pengampus = k.pengampus || []
                                const transaksis = k.transaksis || k.transaksi || []
                                const isKegExpanded = !!expandedKegiatan[k.id]
                                const latestTrx = transaksis.length > 0 ? transaksis[0] : null
                                const latestPct =
                                  latestTrx && latestTrx.progres_realisasi !== null
                                    ? Number(latestTrx.progres_realisasi)
                                    : null

                                return (
                                  <div
                                    key={k.id}
                                    className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
                                  >
                                    {/* Kegiatan Row Header (Clickable to expand transactions) */}
                                    <div
                                      onClick={() => transaksis.length > 0 && toggleKegiatan(k.id)}
                                      className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                                        transaksis.length > 0
                                          ? 'hover:bg-slate-50/80 dark:hover:bg-slate-850 cursor-pointer'
                                          : ''
                                      }`}
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-900 dark:text-white">
                                            Kegiatan #{k.no_urut || kIdx + 1}: {k.nama_kegiatan}
                                          </span>
                                        </div>

                                        {/* Tim Pengampu Badges */}
                                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                          {pengampus.length > 0 ? (
                                            pengampus.map((p, pIdx) => (
                                              <span
                                                key={pIdx}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700"
                                              >
                                                <Users className="w-2.5 h-2.5 text-slate-400" />
                                                <span>{p.nama_timkerja}</span>
                                              </span>
                                            ))
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300">
                                              Belum Ada Pengampu
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Transaction Count & Progress Badge */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                          Target: {k.target_volume || '-'} {k.satuan || ''}
                                        </span>

                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                            transaksis.length > 0
                                              ? 'bg-blue-50 text-[#175CD3] border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300'
                                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                          }`}
                                        >
                                          <span>{transaksis.length} Transaksi</span>
                                        </span>

                                        {latestPct !== null && (
                                          <span
                                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                              latestPct >= 100
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
                                            }`}
                                          >
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            <span>{latestPct}%</span>
                                          </span>
                                        )}

                                        {transaksis.length > 0 && (
                                          <div className="text-slate-400">
                                            {isKegExpanded ? (
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            ) : (
                                              <ChevronRight className="w-3.5 h-3.5" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* LEVEL 4: LOG TRANSAKSI & BUKTI EVIDEN */}
                                    {isKegExpanded && transaksis.length > 0 && (
                                      <div className="bg-slate-50/75 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/70 p-3 space-y-2">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                          <FileText className="w-3 h-3 text-[#175CD3]" />
                                          <span>Log Pelaksanaan & Bukti Eviden Transaksi ({transaksis.length}):</span>
                                        </div>

                                        <div className="space-y-1.5">
                                          {transaksis.map((trx, tIdx) => {
                                            const tPct = Number(trx.progres_realisasi ?? 0)
                                            const isTrxOver = tPct > 100
                                            return (
                                              <div
                                                key={trx.id || tIdx}
                                                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                              >
                                                <div className="min-w-0">
                                                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                                                    {trx.pelaksana_kegiatan_harian || 'Pelaksanaan Kegiatan'}
                                                  </div>
                                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                      <Clock className="w-3 h-3" />
                                                      <span>{formatDate(trx.period_start_date)}</span>
                                                    </span>
                                                    <span>•</span>
                                                    <span className="font-mono">
                                                      Realisasi: {trx.jumlah_realisasi ?? '-'} / Target: {trx.target_mingguan ?? '-'}
                                                    </span>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-2.5 shrink-0">
                                                  <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                      isTrxOver
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                        : tPct >= 100
                                                          ? 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300'
                                                          : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
                                                    }`}
                                                  >
                                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                                    <span>{tPct}% Capaian</span>
                                                  </span>

                                                  {trx.bukti_pekerjaan && (
                                                    <a
                                                      href={trx.bukti_pekerjaan}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#175CD3] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition-colors"
                                                      title="Buka Link Eviden"
                                                    >
                                                      <span>Eviden</span>
                                                      <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default IkkHierarchyTreeView
