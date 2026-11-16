import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  RefreshCw,
  Download,
  AlertCircle,
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

export function DocumentPdfPreview({
  fileName = 'Laporan_Pelaksanaan.pdf',
  title = 'Pratinjau Dokumen PDF A4 Resmi',
  orientation = 'portrait',
  children,
}) {
  const isLandscape = orientation === 'landscape'
  const hiddenContainerRef = useRef(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressTitle, setProgressTitle] = useState('Menyusun Dokumen...')
  const [progressSubtitle, setProgressSubtitle] = useState('Memproses layout dan menggabungkan format teks.')
  const [errorMsg, setErrorMsg] = useState(null)

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const generatePdfBlob = useCallback(async () => {
    if (!hiddenContainerRef.current) return

    try {
      setIsGenerating(true)
      setIsModalOpen(true)
      setErrorMsg(null)
      setProgress(5)
      setProgressTitle('Menyusun Dokumen...')
      setProgressSubtitle('Memproses layout dan menggabungkan format teks.')

      await wait(150)
      setProgress(15)

      // Pastikan semua gambar di dalam hidden container telah dimuat sempurna
      if (hiddenContainerRef.current) {
        const imgs = Array.from(hiddenContainerRef.current.querySelectorAll('img'))
        if (imgs.length > 0) {
          await Promise.all(
            imgs.map((img) => {
              if (img.complete) return Promise.resolve()
              return new Promise((resolve) => {
                img.onload = resolve
                img.onerror = resolve
              })
            })
          )
        }
      }

      setProgress(25)
      await wait(100)

      const pageElements = hiddenContainerRef.current.querySelectorAll('.document-a4-page')
      const pagesToRender = pageElements.length > 0 ? Array.from(pageElements) : [hiddenContainerRef.current]
      const totalPages = pagesToRender.length

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })

      const pdfWidth = isLandscape ? 297 : 210
      const pdfHeight = isLandscape ? 210 : 297
      const topMarginMm = 12
      const bottomMarginMm = 12
      let hasAddedAnyPage = false

      for (let i = 0; i < totalPages; i++) {
        const startPercent = 30 + Math.round((i / totalPages) * 50)
        setProgress(startPercent)
        setProgressSubtitle(`Merender halaman ${i + 1} dari ${totalPages}...`)
        await wait(120)

        const pageEl = pagesToRender[i]
        const domWidth = pageEl.offsetWidth || (isLandscape ? 1123 : 794)
        const domHeight = pageEl.offsetHeight || (isLandscape ? 794 : 1123)
        const pxPerMm = domWidth / pdfWidth
        const a4HeightPx = pdfHeight * pxPerMm
        const topMarginPx = topMarginMm * pxPerMm
        const bottomMarginPx = bottomMarginMm * pxPerMm
        const usableContinuationPx = a4HeightPx - topMarginPx - bottomMarginPx

        // Kumpulkan batas blok atomik agar pemotongan halaman tidak membelah teks/baris/TTD
        const pageRect = pageEl.getBoundingClientRect()
        const blockNodes = Array.from(pageEl.querySelectorAll('[data-pdf-block="true"]'))
        const blocks = blockNodes
          .map((node) => {
            const r = node.getBoundingClientRect()
            return {
              top: Math.max(0, r.top - pageRect.top),
              bottom: Math.max(0, r.bottom - pageRect.top),
            }
          })
          .filter((b) => b.bottom > b.top)
          .sort((a, b) => a.top - b.top)

        const slices = []
        const maxContentBottom = blocks.reduce((max, b) => Math.max(max, b.bottom), 0)

        if (blocks.length > 0 && maxContentBottom <= a4HeightPx - bottomMarginPx) {
          slices.push({
            startPx: 0,
            endPx: Math.min(domHeight, a4HeightPx),
            renderPdfY: 0,
          })
        } else if (blocks.length > 0) {
          let idx = 0
          let isFirstSlice = true

          while (idx < blocks.length) {
            const startPx = isFirstSlice ? 0 : Math.max(0, blocks[idx].top - 2)
            const renderPdfY = isFirstSlice ? 0 : topMarginMm
            const maxSlicePx = isFirstSlice ? a4HeightPx - bottomMarginPx : usableContinuationPx
            const limitBottomPx = startPx + maxSlicePx

            let lastFitIdx = -1
            for (let j = idx; j < blocks.length; j++) {
              if (blocks[j].bottom <= limitBottomPx) {
                lastFitIdx = j
              } else {
                break
              }
            }

            if (lastFitIdx < idx) {
              const forcedEnd = Math.min(domHeight, limitBottomPx)
              slices.push({ startPx, endPx: forcedEnd, renderPdfY })
              idx += 1
            } else {
              const lastFitBottom = blocks[lastFitIdx].bottom
              const nextBlock = blocks[lastFitIdx + 1]
              const safeEndPx = nextBlock
                ? Math.min(limitBottomPx, (lastFitBottom + nextBlock.top) / 2)
                : Math.min(domHeight, lastFitBottom + 12)
              slices.push({ startPx, endPx: safeEndPx, renderPdfY })
              idx = lastFitIdx + 1
            }

            isFirstSlice = false
          }
        } else {
          // Fallback jika tidak ada penanda data-pdf-block
          let cursorPx = 0
          let isFirstSlice = true
          while (cursorPx < domHeight - 2) {
            const sliceMaxPx = isFirstSlice ? a4HeightPx - bottomMarginPx : usableContinuationPx
            const endPx = Math.min(domHeight, cursorPx + sliceMaxPx)
            slices.push({
              startPx: cursorPx,
              endPx,
              renderPdfY: isFirstSlice ? 0 : topMarginMm,
            })
            cursorPx = endPx
            isFirstSlice = false
          }
        }

        const canvas = await html2canvas(pageEl, {
          scale: 2, // 300 DPI high resolution
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
        })

        const scaleRatio = canvas.height / domHeight

        for (const slice of slices) {
          const srcY = Math.max(0, Math.round(slice.startPx * scaleRatio))
          const srcH = Math.min(
            canvas.height - srcY,
            Math.max(1, Math.round((slice.endPx - slice.startPx) * scaleRatio))
          )
          if (srcH <= 1) continue

          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = canvas.width
          sliceCanvas.height = srcH
          const ctx = sliceCanvas.getContext('2d')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

          const sliceImg = sliceCanvas.toDataURL('image/jpeg', 0.95)
          const sliceHeightMm = (srcH / canvas.width) * pdfWidth

          if (hasAddedAnyPage) {
            pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait')
          }
          pdf.addImage(sliceImg, 'JPEG', 0, slice.renderPdfY, pdfWidth, sliceHeightMm)
          hasAddedAnyPage = true
        }

        const endPercent = 30 + Math.round(((i + 1) / totalPages) * 50)
        setProgress(endPercent)
      }

      setProgress(90)
      setProgressSubtitle('Menggabungkan format berkas PDF...')
      await wait(200)

      const blob = pdf.output('blob')
      const newUrl = URL.createObjectURL(blob)

      // Revoke previous blob url if exists
      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return newUrl
      })

      setProgress(100)
      setProgressSubtitle('Dokumen berhasil disusun dan siap dipratinjau.')
      await wait(450) // Jeda singkat agar pengguna melihat status 100% Selesai

      setIsModalOpen(false)
    } catch (err) {
      console.error('Gagal generate PDF preview:', err)
      setErrorMsg(err?.message || 'Gagal merender lembar PDF.')
      setProgressTitle('Kendala Penyusunan Dokumen')
      setProgressSubtitle('Terjadi kesalahan saat memproses layout dokumen PDF.')
    } finally {
      setIsGenerating(false)
    }
  }, [isLandscape])

  const handleManualDownload = () => {
    if (!pdfBlobUrl) return
    const a = document.createElement('a')
    a.href = pdfBlobUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="w-full space-y-4">
      {/* Top Toolbar */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h4>
            <p className="text-[11px] text-slate-500">
              Pratinjau PDF interaktif browser. Gunakan toolbar bawaan PDF untuk cetak, zoom, dan unduh berkas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={generatePdfBlob}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Muat ulang render PDF dari data parameter terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isGenerating ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Perbarui Pratinjau</span>
          </button>

          {pdfBlobUrl && (
            <button
              type="button"
              onClick={handleManualDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Native Browser PDF Preview Viewer Container */}
      <div className="w-full relative min-h-[82vh] bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs flex flex-col items-center justify-center">
        {pdfBlobUrl ? (
          <iframe
            src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
            className="w-full h-[85vh] border-none bg-white"
            title="PDF Preview Browser"
          />
        ) : (
          /* EMPTY STATE SEBELUM PDF DIGENERATE (HANYA MUNCUL JIKA FILE BELUM DIGENERATE) */
          <div className="p-10 sm:p-14 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-[#175CD3] dark:text-blue-400 flex items-center justify-center mx-auto shadow-2xs">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                PDF belum digenerate
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Klik tombol di bawah untuk menyusun dokumen PDF A4 resmi lengkap dengan tabel realisasi, tanda tangan, dan eviden.
              </p>
            </div>
            <button
              type="button"
              onClick={generatePdfBlob}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>Generate PDF Sekarang</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL PROGRESS GENERATE PDF (SESUAI GAMBAR ACUAN SSOT)                    */}
      {/* ========================================================================= */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full mx-auto text-center modal-dialog-animated">
            {/* Circular Spinner Container */}
            <div className="w-20 h-20 rounded-full bg-blue-50/80 dark:bg-blue-950/50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 animate-spin text-[#2563EB]" viewBox="0 0 50 50">
                <circle
                  className="opacity-20"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <circle
                  className="opacity-100"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray="80"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              {progressTitle}
            </h3>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
              {progressSubtitle}
            </p>

            {/* Horizontal Progress Bar Track */}
            <div className="w-full max-w-sm mx-auto bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2.5 shadow-inner">
              <div
                className="bg-[#2563EB] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Label Status Persentase */}
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {progress >= 100 ? '100% Selesai' : `${progress}% Selesai`}
            </p>

            {/* Error Fallback jika terjadi kendala */}
            {errorMsg && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* HIDDEN CONTAINER OFFSCREEN UNTUK CAPTURE HTML2CANVAS */}
      {/* Di-portal ke document.body dan diletakkan jauh di luar viewport (left: -99999px) agar tidak pernah bocor ke latar belakang UI */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={hiddenContainerRef}
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: '-99999px',
              width: isLandscape ? '1123px' : '794px', // 297mm atau 210mm di 96 DPI
              zIndex: -99999,
              pointerEvents: 'none',
              backgroundColor: '#ffffff',
            }}
          >
            {children}
          </div>,
          document.body
        )}
    </div>
  )
}
