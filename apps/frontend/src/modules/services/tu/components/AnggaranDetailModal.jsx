import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Receipt,
  Loader2,
} from 'lucide-react'
import { fetchAnggaranDetail } from '../../../../services/api/tuServicesApi'

export function AnggaranDetailModal({ isOpen, onClose, data }) {
  const [detail, setDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !data) return
    const key = data.key || data.id
    if (!key) return

    let isMounted = true
    setIsLoading(true)
    fetchAnggaranDetail(key)
      .then((res) => {
        if (isMounted) setDetail(res)
      })
      .catch(() => {
        if (isMounted) setDetail(null)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, data])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  const record = detail ? { ...data, ...detail } : data

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0))
  }

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

  const status = (record.status || 'POSTED').toUpperCase()
  let statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
  if (status === 'DRAFT') {
    statusBadge = 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300'
  } else if (status === 'VOID') {
    statusBadge = 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300'
  }

  const items = Array.isArray(record.items) ? record.items : []

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
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                  SPM: {record.no_spm || '-'}
                </h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge}`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                No. SP2D: <span className="font-semibold text-slate-800 dark:text-slate-200">{record.no_sp2d || '-'}</span> • KPPN Bandung
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
              <span className="text-[11px] text-slate-400 font-semibold block">Total Realisasi</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block truncate">
                {formatRupiah(record.total_nominal || record.nominal)}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Cair SP2D</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Tanggal SPM</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                {formatDate(record.spm_date || record.period_date)}
              </span>
              <span className="text-[10px] text-slate-400">Pengajuan PPSPM</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Tanggal SP2D</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                {formatDate(record.sp2d_date || record.period_date)}
              </span>
              <span className="text-[10px] text-slate-400">Pencairan KPPN</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <span className="text-[11px] text-slate-400 font-semibold block">Tahun Anggaran</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                {record.tahun || '-'}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">DIPA 401928</span>
            </div>
          </div>

          {/* Breakdown Rincian Belanja / Akun MAK */}
          <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Rincian Akun Mata Anggaran (MAK)</span>
              <span className="text-[10px] text-slate-400 font-normal">Belanja DIPA Kanreg III</span>
            </h4>
            {isLoading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#175CD3]" />
                <span>Memuat rincian akun MAK...</span>
              </div>
            ) : items.length === 0 ? (
              <p className="text-center py-4 text-slate-400 text-xs">
                Tidak ada rincian item akun MAK tercatat.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block">
                        {item.kode_akun || item.kode || '-'}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 text-[11px] block">
                        {item.nama_akun || item.uraian || item.keterangan || '-'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs shrink-0">
                      {formatRupiah(item.nominal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catatan / Keterangan Pembayaran */}
          <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
              Keterangan & Uraian Pembayaran:
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {record.keterangan || '-'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <span className="text-[11px] text-slate-400">
            Sistem Informasi Pengelolaan Anggaran Bagian Tata Usaha
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

export default AnggaranDetailModal
