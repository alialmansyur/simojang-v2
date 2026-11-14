import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Mail,
} from 'lucide-react'

export function SuratDetailModal({ isOpen, onClose, data }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

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

  const jenisNaskah = data.jenis_naskah || (Number(data.jenis_id) === 2 ? 'Nota Dinas' : 'Surat Keluar')

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                  {data.nomor_surat || data.perihal || jenisNaskah}
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 text-indigo-700 dark:text-indigo-300">
                  {jenisNaskah}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Periode: <span className="font-semibold text-slate-700 dark:text-slate-300">{data.period || '-'}</span>
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

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto clean-scrollbar text-xs">
          {/* Bento Grid 4 Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Periode Naskah</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                {data.period || '-'}
              </span>
              <span className="text-[10px] text-slate-400">Arsip Kearsipan</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Volume Naskah</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                {data.total ?? 0} Naskah
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">Tercatat Sistem</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Tanggal Mulai</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                {formatDate(data.period_start_date || data.created_at)}
              </span>
              <span className="text-[10px] text-slate-400">Periode Awal</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Tanggal Akhir</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                {formatDate(data.period_end_date || data.period_start_date)}
              </span>
              <span className="text-[10px] text-slate-400">Periode Akhir</span>
            </div>
          </div>

          {/* Detail Ringkasan */}
          <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
              Informasi Persuratan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Jenis Naskah:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{jenisNaskah}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nomor Surat / Agenda:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{data.nomor_surat || data.nomor || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Perihal / Keterangan:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.perihal || data.uraian || data.keterangan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Petugas Pengolah:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.created_by || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <span className="text-[11px] text-slate-400">
            Sistem Informasi Kearsipan Tata Usaha Kanreg III BKN
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

export default SuratDetailModal
