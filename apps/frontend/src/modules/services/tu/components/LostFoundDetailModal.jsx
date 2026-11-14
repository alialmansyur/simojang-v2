import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Package,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react'

export function LostFoundDetailModal({ isOpen, onClose, data }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  const isGiven = data.status_penyerahan === 'Diserahkan'

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

  const imageUrl = data.gambar || data.foto || data.foto_url

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
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                  {data.nama_barang || 'Barang Hilang / Temuan'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isGiven
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}
                >
                  {isGiven ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {data.status_penyerahan || 'Belum Diserahkan'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{data.lokasi_ditemukan || 'Gedung Kanreg III BKN'}</span>
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
          {/* Bento Grid Ringkasan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Tgl Ditemukan</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                {formatDate(data.tanggal_ditemukan)}
              </span>
              <span className="text-[10px] text-slate-400">Laporan Masuk</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Status Barang</span>
              <span className={`text-xs font-bold mt-1 block ${isGiven ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isGiven ? 'Tuntas Diserahkan' : 'Dalam Penyimpanan'}
              </span>
              <span className="text-[10px] text-slate-400">Security / TU</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Penerima Barang</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1 block">
                {isGiven ? data.penerima || 'Pemilik Sah' : 'Belum Ada'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isGiven ? formatDate(data.tanggal_diserahkan) : 'Menunggu Klaim'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Petugas Penyimpan</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1 block">
                {data.created_by || 'Petugas Keamanan'}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">Bagian Umum / TU</span>
            </div>
          </div>

          {/* Foto Fisik Barang Jika Tersedia */}
          {imageUrl && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                Dokumentasi Fisik Barang:
              </span>
              <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-black/5 max-h-52 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={data.nama_barang}
                  className="max-h-52 object-contain"
                />
              </div>
            </div>
          )}

          {/* Keterangan & Catatan Identifikasi */}
          <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
              Ciri Khusus & Keterangan Barang
            </h4>
            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
              {data.keterangan || '-'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <span className="text-[11px] text-slate-400">
            Layanan Pengamanan & Ketertiban Internal Kanreg III
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

export default LostFoundDetailModal
