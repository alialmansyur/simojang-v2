import { ArrowLeft, Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function SettingsSubpageHeader({
  title,
  description,
  badgeLabel = 'Pengaturan Sistem',
  badgeColor = 'emerald',
  backTo = '/settings',
  backLabel = 'Kembali',
  showBackButton = true,
  onReloadClick,
  isReloading = false,
  onAddEntryClick,
  addEntryLabel,
  extraActions = null,
}) {
  const navigate = useNavigate()

  const getBadgeStyle = () => {
    if (badgeColor === 'rose') {
      return {
        wrapper:
          'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-300',
        dot: 'bg-rose-500',
      }
    }
    if (badgeColor === 'amber') {
      return {
        wrapper:
          'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-500',
      }
    }
    if (badgeColor === 'blue') {
      return {
        wrapper:
          'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40 text-[#175CD3] dark:text-blue-300',
        dot: 'bg-[#175CD3]',
      }
    }
    return {
      wrapper:
        'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    }
  }

  const badgeTheme = getBadgeStyle()
  const secondaryBtnClass =
    'inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0'

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div className="space-y-1.5 min-w-0">
        {badgeLabel && (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide ${badgeTheme.wrapper}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeTheme.dot}`} />
            <span>{badgeLabel}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto clean-scrollbar">
        {showBackButton && backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className={secondaryBtnClass}
            title={backLabel}
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>{backLabel}</span>
          </button>
        )}

        {onReloadClick && (
          <button
            type="button"
            onClick={onReloadClick}
            disabled={isReloading}
            className={secondaryBtnClass}
            title="Muat ulang data"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${isReloading ? 'animate-spin text-emerald-600' : ''}`}
            />
            <span>Muat Ulang</span>
          </button>
        )}

        {extraActions}

        {onAddEntryClick && addEntryLabel && (
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
      </div>
    </div>
  )
}
