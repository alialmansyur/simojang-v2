import { Link } from 'react-router-dom'
import {
  Wrench,
  ArrowLeft,
  RotateCw,
  ShieldAlert,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react'

export function ServiceMaintenanceView({ service, onRetry }) {
  const serviceName = service?.nama_layanan || 'Layanan Ini'
  const serviceUrl = service?.url || service?.slug || ''
  const customMessage = service?.maintenance_msg

  const handleRefresh = () => {
    if (typeof onRetry === 'function') {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-[65vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-xl w-full text-center">
        {/* Centered Icon Hero */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 ring-4 ring-amber-100 dark:ring-amber-950/40">
              <Wrench className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs">
              <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                <AlertTriangle className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Layanan Sedang Dalam Pemeliharaan
        </h1>

        {/* Service Name Pill */}
        <div className="mt-3 inline-block px-3.5 py-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm">
          {serviceName} {serviceUrl ? `(${serviceUrl})` : ''}
        </div>

        {/* Description / Message */}
        <div className="mt-6 text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed space-y-3">
          {customMessage ? (
            <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-left font-medium text-xs leading-relaxed max-w-lg mx-auto">
              <span className="font-bold mb-1 flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                Catatan Administrator:
              </span>
              {customMessage}
            </div>
          ) : null}

          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Mohon maaf atas ketidaknyamanannya. Halaman layanan ini sedang ditutup sementara untuk proses perawatan sistem atau sinkronisasi data teknis. Harap coba beberapa saat lagi.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            Coba Muat Ulang
          </button>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#154EB2] text-white font-semibold text-xs transition-colors shadow-xs shadow-blue-500/20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Footer note */}
        <div className="mt-10 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Butuh bantuan mendesak? Hubungi administrator atau tim IT Simojang.</span>
        </div>
      </div>
    </div>
  )
}
