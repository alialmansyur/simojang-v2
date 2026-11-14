import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Target,
  CheckCircle2,
  FileText,
  ExternalLink,
} from 'lucide-react'

export function IkkDetailModal({ isOpen, onClose, data }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  const target = Number(data.target_mingguan ?? data.target ?? 0)
  const realisasi = Number(data.jumlah_realisasi ?? data.realisasi ?? 0)
  const rawPct =
    data.progres_realisasi !== undefined && data.progres_realisasi !== null
      ? Number(data.progres_realisasi)
      : target > 0
        ? (realisasi / target) * 100
        : 0
  const pct = Math.round(rawPct * 10) / 10
  const isOverAchieved = pct > 100
  const isAchieved = pct >= 100 || (target > 0 && realisasi >= target)

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const evidenUrl = data.bukti_pekerjaan || data.link_eviden || data.eviden || ''
  const titleText = data.pelaksana_kegiatan_harian || data.nama_kegiatan || data.uraian || 'Capaian Indikator Kinerja Kegiatan'
  const pengampuText = data.pengampu_list || data.pengampu || '-'

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl sm:max-w-3xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                  {titleText}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isOverAchieved
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : isAchieved
                        ? 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {isOverAchieved ? `Melampaui Target (${pct}%)` : isAchieved ? 'Target Tercapai' : 'Proses Realisasi'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pengampu: <span className="font-semibold text-slate-700 dark:text-slate-300">{pengampuText}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto clean-scrollbar text-xs">
          {/* Bento Grid 4 Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Target Mingguan</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                {target} {data.satuan || ''}
              </span>
              <span className="text-[10px] text-slate-400">Target Rencana</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Jumlah Realisasi</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                {realisasi} {data.satuan || ''}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Capaian Aktual</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Progres Realisasi</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                {pct}%
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">Rasio Kinerja</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Periode Pelaksanaan</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                {formatDate(data.period_start_date || data.tanggal_kegiatan || data.created_at)}
              </span>
              {data.period_end_date && (
                <span className="text-[10px] text-slate-400">s.d. {formatDate(data.period_end_date)}</span>
              )}
            </div>
          </div>

          {/* Rincian Formula & Sasaran */}
          <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Hierarki Sasaran, Indikator & Kegiatan</span>
            </h4>
            <div className="space-y-2.5">
              <div>
                <span className="text-slate-400 block text-[11px]">Sasaran Strategis:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                  {data.nama_sasaran || '-'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Indikator Kinerja Kunci (IKK):</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                  {data.nama_indikator || '-'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Kegiatan:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                  {data.nama_kegiatan || '-'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Pelaksanaan Kegiatan Harian:</span>
                <p className="text-slate-700 dark:text-slate-300 text-xs mt-0.5">
                  {data.pelaksana_kegiatan_harian || data.keterangan || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Dokumen Bukti Dukung (Eviden) */}
          <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">
              Tautan Bukti Dukung (Eviden Pelaksanaan)
            </h4>
            {evidenUrl ? (
              <a
                href={evidenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#175CD3] dark:text-blue-400 hover:underline font-semibold break-all"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>{evidenUrl}</span>
              </a>
            ) : (
              <p className="text-slate-400 text-xs italic">
                Belum ada tautan eviden online yang dilampirkan.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <span className="text-[11px] text-slate-400">
            Sistem Pengukuran Perjanjian Kinerja Bagian Tata Usaha
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all active:scale-95 cursor-pointer text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default IkkDetailModal
