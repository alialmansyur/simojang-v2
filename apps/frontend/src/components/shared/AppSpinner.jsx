import React from 'react'

/**
 * AppSpinner - Standar Tunggal Komponen Loader SIMOJANG
 * Dibuat tebal (bold stroke) dengan circular track halus & arc berputar 60fps.
 */
export function AppSpinner({
  size = 'md',
  className = '',
  color = 'primary',
  strokeWidth,
}) {
  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
    '2xl': 'w-14 h-14',
  }

  // Ketebalan seimbang & proporsional (clean medium-bold)
  const defaultStrokes = {
    xs: 2.2,
    sm: 2.5,
    md: 2.8,
    lg: 3.0,
    xl: 3.2,
    '2xl': 3.6,
  }

  const colorMap = {
    primary: 'text-[#175CD3] dark:text-[#3B82F6]',
    white: 'text-white',
    slate: 'text-slate-600 dark:text-slate-300',
    current: 'text-current',
  }

  const appliedSize = sizeMap[size] || (typeof size === 'string' && size.includes('w-') ? size : sizeMap.md)
  const appliedColor = colorMap[color] || colorMap.primary
  const appliedStroke = strokeWidth ?? (defaultStrokes[size] || 2.8)

  return (
    <svg
      className={`animate-spin shrink-0 ${appliedSize} ${appliedColor} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {/* Background Track Guide (Tebal & Halus) */}
      <circle
        className="opacity-20 dark:opacity-25"
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth={appliedStroke}
      />
      {/* Active Spinning Arc (Tebal dengan rounded linecap) */}
      <path
        className="opacity-100"
        fill="none"
        stroke="currentColor"
        strokeWidth={appliedStroke}
        strokeLinecap="round"
        d="M12 2.5 A9.5 9.5 0 0 1 20.23 16.75"
      />
    </svg>
  )
}

/**
 * AppPageLoader - Standar Tunggal Loader Halaman SIMOJANG
 * Digunakan untuk loaderpage setelah login, verifikasi sesi, & suspense fallback.
 */
export function AppPageLoader({
  message = 'Memuat halaman...',
  submessage,
  fullScreen = true,
  className = '',
}) {
  return (
    <div
      className={`${
        fullScreen ? 'min-h-[100dvh]' : 'min-h-[360px] h-full'
      } flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors ${className}`}
    >
      <div className="flex flex-col items-center gap-4 text-center px-4 max-w-sm">
        {/* Loader Standar Utama (Ketebalan Presisi & Elegan) */}
        <AppSpinner size="xl" strokeWidth={3.2} />

        {message && (
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-200">
              {message}
            </p>
            {submessage && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {submessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AppSpinner
