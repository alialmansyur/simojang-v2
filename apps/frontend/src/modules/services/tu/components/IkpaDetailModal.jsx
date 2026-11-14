import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Award, Loader2 } from 'lucide-react'
import { fetchIkpaDetail } from '../../../../services/api/tuServicesApi'

export function IkpaDetailModal({ isOpen, onClose, logId, satkerName }) {
  const [detail, setDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !logId) return
    let isMounted = true
    setIsLoading(true)
    setDetail(null)

    fetchIkpaDetail(logId)
      .then((res) => {
        if (isMounted) setDetail(res)
      })
      .catch((err) => {
        console.error(err)
        if (isMounted) setDetail(null)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, logId])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const indicators = Array.isArray(detail?.detail) ? detail.detail : []

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header (Matching /layanan/cltn) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Rincian 8 Indikator IKPA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {satkerName || 'KANTOR REGIONAL III BKN BANDUNG'}
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
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto clean-scrollbar">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#175CD3]" />
              <span className="text-xs">Memuat rincian indikator...</span>
            </div>
          ) : indicators.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              Rincian indikator IKPA belum tersedia untuk periode ini.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {indicators.map((ind, idx) => {
                  const val = Number(ind.nilai || 0)
                  const isExcellent = val >= 95
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {ind.nama_indikator}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Bobot Indikator: {ind.bobot}%
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`text-base font-black font-mono ${
                            isExcellent ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {val.toFixed(1)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">Poin</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
