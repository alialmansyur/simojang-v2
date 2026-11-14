import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Share2,
  FileText,
} from 'lucide-react'

export function HumasDetailModal({ isOpen, onClose, data }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(Number(num || 0))
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

  let channelColor = 'bg-slate-100 text-slate-700'
  const ch = (data.kanal || '').toLowerCase()
  if (ch.includes('instagram')) channelColor = 'bg-pink-50 text-pink-700 border-pink-200/60'
  else if (ch.includes('youtube')) channelColor = 'bg-red-50 text-red-700 border-red-200/60'
  else if (ch.includes('tiktok')) channelColor = 'bg-slate-900 text-white'
  else if (ch.includes('facebook')) channelColor = 'bg-blue-50 text-blue-700 border-blue-200/60'
  else if (ch.includes('website')) channelColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/60'

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
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 border border-pink-200/60 dark:border-pink-800/60 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                  {data.keterangan || 'Publikasi Informasi Kehumasan'}
                </h2>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${channelColor}`}>
                  {data.kanal || 'Instagram'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Periode {data.period} • {formatDate(data.period_start_date)} s.d. {formatDate(data.period_end_date)}
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
          {/* Bento Grid 4 Ringkasan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Jumlah Konten</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                {data.jumlah_konten || 1} Rilis
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">Postingan Aktif</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Total Followers</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                {formatNumber(data.jumlah_followers)}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">Audiens BKN</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Total Impresi / View</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                {formatNumber(data.jumlah_viewers)}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Jangkauan Organik</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Admin Publikasi</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1 block">
                {data.created_by || 'Admin Humas'}
              </span>
              <span className="text-[10px] text-slate-400">Tim Publikasi TU</span>
            </div>
          </div>

          {/* Rincian Konten & Narasi */}
          <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Deskripsi & Narasi Publikasi</span>
            </h4>
            <div className="space-y-2">
              <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-semibold">
                {data.keterangan || '-'}
              </p>
              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500">
                <span>Tanggal Rilis: {formatDate(data.period_start_date || data.created_at)}</span>
                <span>•</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Kanal Resmi Kanreg III BKN Bandung</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <span className="text-[11px] text-slate-400">
            Monitoring Media & Informasi Publik Bagian Tata Usaha
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

export default HumasDetailModal
