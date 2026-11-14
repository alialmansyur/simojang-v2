import { Plus, RefreshCw, FileSpreadsheet, Tag } from 'lucide-react'

export function ServiceHeader({
  serviceTitle = 'Layanan Kepegawaian',
  description = 'Daftar berkas usul, riwayat unggahan, dan verifikasi data instansi',
  timKerjaTitle = 'Pengangkatan & Mutasi',
  badgeColor,
  onUploadClick,
  uploadLabel = 'Upload Data',
  onAddEntryClick,
  addEntryLabel = 'Input Data',
  onManageEventsClick,
  onReloadClick,
  isReloading = false,
  extraActions = null,
  borderless = false,
}) {
  const secondaryBtnSurfaceClass = borderless
    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs'
    : 'border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs'
  // Determine badge styling based on team or explicit badgeColor
  const getBadgeStyle = () => {
    if (
      badgeColor === 'rose' ||
      timKerjaTitle?.toLowerCase().includes('pengawasan') ||
      timKerjaTitle?.toLowerCase().includes('wasdal')
    ) {
      return {
        wrapper: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-300',
        dot: 'bg-rose-500',
      }
    }
    // Tata Usaha, Status & Pemberhentian, serta Sistem Informasi & Digitalisasi pakai badge success (Emerald / Hijau)
    if (
      badgeColor === 'emerald' ||
      badgeColor === 'success' ||
      timKerjaTitle?.toLowerCase().includes('tata usaha') ||
      timKerjaTitle?.toLowerCase().includes('tu') ||
      timKerjaTitle?.toLowerCase().includes('pemberhentian') ||
      timKerjaTitle?.toLowerCase().includes('status') ||
      timKerjaTitle?.toLowerCase().includes('informasi') ||
      timKerjaTitle?.toLowerCase().includes('digital') ||
      timKerjaTitle?.toLowerCase().includes('sidigi')
    ) {
      return {
        wrapper: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        dot: 'bg-emerald-500',
      }
    }
    if (badgeColor === 'amber') {
      return {
        wrapper: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-500',
      }
    }
    // Default & PnM (Pengangkatan & Mutasi) theme: Emerald
    return {
      wrapper: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    }
  }

  const badgeTheme = getBadgeStyle()

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
      {/* Title, Ringkas Tim Kerja Badge & Description */}
      <div className="space-y-1.5 min-w-0">
        {timKerjaTitle && (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide ${badgeTheme.wrapper}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeTheme.dot}`} />
            <span>{timKerjaTitle}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          {serviceTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Buttons (Right - Matching /layanan/sistem-merit & /layanan/cltn) */}
      <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
        {onReloadClick && (
          <button
            type="button"
            onClick={onReloadClick}
            disabled={isReloading}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl ${secondaryBtnSurfaceClass} text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0`}
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isReloading ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        )}

        {onManageEventsClick && (
          <button
            type="button"
            onClick={onManageEventsClick}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl ${secondaryBtnSurfaceClass} text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer shrink-0`}
            title="Kelola Event / Kategori Usul"
          >
            <Tag className="w-4 h-4 text-amber-500" />
            <span>Kelola Event</span>
          </button>
        )}

        {extraActions}

        {/* Header Action Buttons adhering to SIMOJANG Master SSOT */}
        {/* Skenario 1: Layanan memiliki entry form manual sekaligus batch upload pendamping */}
        {onAddEntryClick && onUploadClick && (
          <>
            {/* Tombol Pendamping: Upload Data (Versi Sekunder, icon emerald) */}
            <button
              type="button"
              onClick={onUploadClick}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl ${secondaryBtnSurfaceClass} text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer shrink-0`}
              title={uploadLabel}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{uploadLabel}</span>
            </button>

            {/* Tombol Utama: Input Data (Primer Biru BKN #175CD3, icon Plus putih stroke-[2.5]) */}
            <button
              type="button"
              onClick={onAddEntryClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              title={addEntryLabel}
            >
              <Plus className="w-4 h-4 stroke-[2.5] text-white" />
              <span>{addEntryLabel}</span>
            </button>
          </>
        )}

        {/* Skenario 2: Halaman bertipe 'Input Data' manual saja (tanpa batch upload) */}
        {onAddEntryClick && !onUploadClick && (
          <button
            type="button"
            onClick={onAddEntryClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title={addEntryLabel}
          >
            <Plus className="w-4 h-4 stroke-[2.5] text-white" />
            <span>{addEntryLabel}</span>
          </button>
        )}

        {/* Skenario 3: Halaman bertipe 'Upload Data' saja (batch import Excel) */}
        {onUploadClick && !onAddEntryClick && (
          <button
            type="button"
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title={uploadLabel}
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>{uploadLabel}</span>
          </button>
        )}
      </div>
    </div>
  )
}
export default ServiceHeader
