import { useState } from 'react'

const SIZE_CLASSES = {
  sm: 'w-9 h-9 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
}

const DOT_CLASSES = {
  sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
  md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
  lg: 'w-3 h-3 bottom-0 right-0',
  xl: 'w-3.5 h-3.5 bottom-0.5 right-0.5',
}

/**
 * Reusable circular/rounded user avatar with image fallback to initials and active dot.
 */
export function UserAvatar({
  src,
  initials = 'KN',
  name = 'Pengguna',
  size = 'md',
  showStatusDot = true,
  isActive = true,
  roundedClass = 'rounded-full',
  className = '',
}) {
  const [failedSrc, setFailedSrc] = useState(null)
  const hasValidImage = Boolean(src) && failedSrc !== src
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md
  const dotClass = DOT_CLASSES[size] || DOT_CLASSES.md

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${sizeClass} ${roundedClass} ${
        hasValidImage
          ? 'bg-slate-100 dark:bg-slate-800'
          : 'bg-action text-white font-bold shadow-xs shadow-action/20'
      } ${className}`}
      title={name}
    >
      {hasValidImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailedSrc(src)}
          className={`w-full h-full object-cover ${roundedClass}`}
        />
      ) : (
        <span>{initials}</span>
      )}

      {showStatusDot ? (
        <span
          className={`absolute rounded-full ring-2 ring-white dark:ring-slate-900 ${dotClass} ${
            isActive ? 'bg-[#067647]' : 'bg-slate-400'
          }`}
          title={isActive ? 'Akun Aktif' : 'Akun Non-Aktif'}
        />
      ) : null}
    </div>
  )
}
