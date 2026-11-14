import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Star } from 'lucide-react'

export function IkmDetailModal({ isOpen, onClose, data }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  const val = Number(data.nilai || 0)
  let mutu = 'Kurang (D)'
  let mutuBadge = 'bg-rose-50 text-rose-700 border-rose-200/60'
  if (val >= 88.31) {
    mutu = 'Sangat Baik (A)'
    mutuBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  } else if (val >= 76.61) {
    mutu = 'Baik (B)'
    mutuBadge = 'bg-blue-50 text-blue-700 border-blue-200/60'
  } else if (val >= 65) {
    mutu = 'Kurang Baik (C)'
    mutuBadge = 'bg-amber-50 text-amber-700 border-amber-200/60'
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                  Hasil Survei IKM - {data.jenis || '-'}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${mutuBadge}`}>
                  {mutu}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Periode {data.period || '-'} • Survei Kepuasan Masyarakat
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
              <span className="text-[11px] text-slate-400 font-semibold block">Indeks IKM Konversi</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                {data.nilai ?? '-'}
              </span>
              <span className="text-[10px] text-slate-400">Skala 100</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Mutu Pelayanan</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                {mutu}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Predikat Kinerja</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Periode / Tahun</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                {data.period || '-'}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">Pelaporan IKM</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Jenis Layanan</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1 block">
                {data.jenis || '-'}
              </span>
              <span className="text-[10px] text-slate-400">Kanreg III BKN</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
              Informasi Rekaman Survei
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Tanggal Periode:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {data.period_start_date || data.period || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Petugas Input:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {data.created_by || '-'}
                </span>
              </div>
              {data.keterangan && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Keterangan:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {data.keterangan}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <span className="text-[11px] text-slate-400">
            Hasil Evaluasi Pelayanan Publik Kanreg III BKN Bandung
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

export default IkmDetailModal
