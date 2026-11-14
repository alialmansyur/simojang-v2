/**
 * PMA — Modal Detail Komprehensif (Progressive Disclosure)
 * Acuan: ai-context/PEDOMAN_STANDARISASI_TABLE_MASTER.md §5 (POLA KOMPONEN MODAL DETAIL STANDAR)
 *
 * Struktur:
 * 1. Header Modal  — judul entitas, badge status/kategori, tombol close X
 * 2. Bento Card    — grid ringkasan metadata (2-4 kartu mini)
 * 3. Data Breakdown— rincian data teknis yang dipangkas dari tabel utama
 * 4. Footer Modal  — tombol Tutup + Unduh Dokumen
 */
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Loader2, AlertTriangle, FileSpreadsheet } from 'lucide-react'

function SummaryCard({ icon: Icon, label, value, hint, tone = 'slate' }) {
  const toneMap = {
    slate:
      'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50',
    emerald:
      'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40',
    blue: 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/40',
    amber:
      'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40',
    rose: 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/40',
    indigo:
      'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200/50 dark:border-indigo-800/40',
  }
  const iconMap = {
    slate: 'text-slate-500 dark:text-slate-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-[#175CD3] dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  }

  return (
    <div
      className={`rounded-xl border px-3.5 py-3 ${toneMap[tone] || toneMap.slate}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {Icon ? <Icon className={`w-3.5 h-3.5 ${iconMap[tone] || iconMap.slate}`} /> : null}
        <span className="truncate" title={label}>
          {label}
        </span>
      </div>
      <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white break-words">
        {value ?? '-'}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[11px] font-normal text-slate-500 dark:text-slate-400">
          {hint}
        </div>
      ) : null}
    </div>
  )
}

function DetailSection({ title, icon: Icon, description, rows = [], children }) {
  return (
    <section className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900/40 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
        {Icon ? <Icon className="w-4 h-4 text-[#175CD3] dark:text-blue-400 shrink-0" /> : null}
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 truncate">
            {title}
          </h3>
          {description ? (
            <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="p-4">
        {rows.length > 0 ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {rows.map((row, idx) => (
              <div
                key={`${row.label}-${idx}`}
                className="flex items-start justify-between gap-3 border-b border-dashed border-slate-100 dark:border-slate-800/80 pb-2 last:border-0 sm:last:border-b-0"
              >
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 shrink-0">
                  {row.label}
                </dt>
                <dd className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-right break-words">
                  {row.value ?? '-'}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {children}
      </div>
    </section>
  )
}

export function PmaDetailDialog({
  isOpen,
  onClose,
  serviceTitle = 'Layanan PMA',
  detail = null,
  isLoading = false,
  errorMsg = '',
  onDownload,
  downloadLabel = 'Unduh Dokumen',
}) {
  useEffect(() => {
    if (!isOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handler)
    }
  }, [isOpen, onClose])

  const handleDownload = () => {
    if (!onDownload) return
    try {
      onDownload()
    } catch (err) {
      console.warn('Gagal mengunduh dokumen PMA:', err)
    }
  }

  const csvRows = useMemo(() => {
    if (!detail) return []
    const rows = []
    ;(detail.summary || []).forEach((s) => {
      rows.push([s.label, s.value ?? '-'])
    })
    ;(detail.sections || []).forEach((sec) => {
      ;(sec.exportRows || sec.rows || []).forEach((r) => {
        rows.push([`${sec.title} — ${r.label}`, r.value ?? '-'])
      })
    })
    return rows
  }, [detail])

  const handleExportCsv = () => {
    if (!csvRows.length) return
    const csvContent =
      'data:text/csv;charset=utf-8,﻿' +
      [['Kolom', 'Nilai'], ...csvRows.map((r) => [`"${r[0]}"`, `"${r[1]}"`])]
        .map((r) => r.join(','))
        .join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute(
      'download',
      `Detail_${(detail?.title || serviceTitle).replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={detail?.title || serviceTitle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden modal-dialog-animated">
        {/* 1. Header Modal */}
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {detail?.title || 'Detail Data'}
                </h2>
                {detail?.badge ? (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                      detail.badge.className ||
                      'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40'
                    }`}
                  >
                    {detail.badge.label}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {detail?.subtitle || serviceTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto clean-scrollbar p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#175CD3] mb-2" />
              <p className="text-xs font-semibold">Memuat rincian detail...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-8 text-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-70" />
              <p className="text-sm font-bold">{errorMsg}</p>
            </div>
          ) : (
            <>
              {/* 2. Bento Card Ringkasan */}
              {detail?.summary?.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {detail.summary.map((card, idx) => (
                    <SummaryCard
                      key={`${card.label}-${idx}`}
                      icon={card.icon}
                      label={card.label}
                      value={card.value}
                      hint={card.hint}
                      tone={card.tone}
                    />
                  ))}
                </div>
              )}

              {/* 3. Data Breakdown Section */}
              {detail?.sections?.map((section, idx) => (
                <DetailSection
                  key={`${section.title}-${idx}`}
                  title={section.title}
                  icon={section.icon}
                  description={section.description}
                  rows={section.rows}
                >
                  {section.children}
                </DetailSection>
              ))}

              {(!detail?.sections || detail.sections.length === 0) && (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-xs font-semibold">Rincian detail belum tersedia.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Footer Modal */}
        <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!csvRows.length}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          {onDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{downloadLabel}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <span>Tutup</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
