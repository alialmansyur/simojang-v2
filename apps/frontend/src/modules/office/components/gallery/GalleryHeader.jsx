import { Plus, RefreshCw } from 'lucide-react'

export default function GalleryHeader({
  isRefreshing = false,
  onReload,
  onCreateClick,
}) {
  return (
    <header className="font-sans">
      {/* Title & Action Buttons (Breadcrumb berada di Topbar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#0B3264] dark:text-white tracking-tight leading-tight">
            Galeri Kegiatan Kantor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Dokumentasi visual kegiatan kedinasan, koordinasi, dan layanan Kanreg III BKN Bandung.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={onReload}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-[#EAF2FC] hover:text-[#0B3264] dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Muat ulang galeri"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>
    </header>
  )
}
