import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FileText,
  Calendar,
  MapPin,
  Lock,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  UserCheck,
} from 'lucide-react'

export default function CatPublicEsignPage() {
  const { token } = useParams()

  const [reportData, setReportData] = useState(null)
  const [isSigned, setIsSigned] = useState(false)
  const [signedAt, setSignedAt] = useState('')

  // Modal konfirmasi pengesahan pertama kali
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Canvas
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasStroke, setHasStroke] = useState(false)

  // Load report data by token
  useEffect(() => {
    try {
      const savedTokenData = localStorage.getItem(`cat_esign_token_${token}`)
      if (savedTokenData) {
        const parsed = JSON.parse(savedTokenData)
        setReportData(parsed)
        if (parsed.isSigned) {
          setIsSigned(true)
          setSignedAt(parsed.signedAt || '')
        }
      } else {
        // Fallback 1: Cari across all storage keys
        let found = false
        const allKeys = Object.keys(localStorage)
        for (const k of allKeys) {
          const raw = localStorage.getItem(k)
          if (!raw) continue
          if (raw.includes(token)) {
            try {
              const p = JSON.parse(raw)
              // Cek jika p menyimpan signers
              if (p?.signers) {
                const foundPos = Object.keys(p.signers).find(
                  (pos) => p.signers[pos]?.token === token || p.signers[pos]?.signToken === token || token.includes(pos)
                )
                if (foundPos) {
                  const s = p.signers[foundPos]
                  setReportData({
                    ...p,
                    storageKey: k,
                    positionKey: foundPos,
                    signerKey: foundPos,
                    namaPenandatangan: s.nama,
                    signerName: s.nama,
                    nama: s.nama,
                    nipPenandatangan: s.nip,
                    signerNip: s.nip,
                    nip: s.nip,
                    jabatanPenandatangan: s.jabatan,
                    signerJabatan: s.jabatan,
                    jabatan: s.jabatan,
                    isSigned: Boolean(s.isSigned),
                    signatureData: s.signatureData,
                    signedAt: s.signedAt,
                  })
                  if (s.isSigned) {
                    setIsSigned(true)
                    setSignedAt(s.signedAt || '')
                  }
                  found = true
                  break
                }
              }
              setReportData(p)
              if (p.isSigned) {
                setIsSigned(true)
                setSignedAt(p.signedAt || '')
              }
              found = true
              break
            } catch {}
          }
        }

        // Fallback 2: Jika token ada nama posisi ('kiri', 'kanan', 'tengah')
        if (!found && token) {
          const pos = token.includes('kiri') ? 'kiri' : token.includes('kanan') ? 'kanan' : 'tengah'
          for (const k of allKeys.filter((k) => k.startsWith('cat_ba_') || k.startsWith('cat_laporan_') || k.startsWith('doc_builder_'))) {
            try {
              const p = JSON.parse(localStorage.getItem(k) || '{}')
              if (p?.signers?.[pos]) {
                const s = p.signers[pos]
                setReportData({
                  ...p,
                  storageKey: k,
                  positionKey: pos,
                  signerKey: pos,
                  namaPenandatangan: s.nama,
                  signerName: s.nama,
                  nama: s.nama,
                  nipPenandatangan: s.nip,
                  signerNip: s.nip,
                  nip: s.nip,
                  jabatanPenandatangan: s.jabatan,
                  signerJabatan: s.jabatan,
                  jabatan: s.jabatan,
                  isSigned: Boolean(s.isSigned),
                  signatureData: s.signatureData,
                  signedAt: s.signedAt,
                })
                if (s.isSigned) {
                  setIsSigned(true)
                  setSignedAt(s.signedAt || '')
                }
                found = true
                break
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data token e-sign publik:', err)
    }
  }, [token])

  // Canvas drawing handlers (Touch & Mouse)
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDrawing = (e) => {
    if (isSigned) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getCanvasPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0B3264'
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing || isSigned) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getCanvasPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasStroke(true)
  }

  const stopDrawing = (e) => {
    if (!isDrawing || isSigned) return
    if (e) e.preventDefault()
    setIsDrawing(false)
  }

  const handleClearSignature = () => {
    if (isSigned) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
  }

  // Submit Signature Confirmation
  const handleConfirmSign = () => {
    setShowConfirmModal(false)
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    const uniqueHash = `DS-BKN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    const timeStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    setIsSigned(true)
    setSignedAt(timeStr)

    const updated = {
      ...(reportData || {}),
      isSigned: true,
      signatureData: dataUrl,
      signatureHash: uniqueHash,
      signedAt: timeStr,
    }

    try {
      localStorage.setItem(`cat_esign_token_${token}`, JSON.stringify(updated))
      if (reportData?.storageKey) {
        const existing = localStorage.getItem(reportData.storageKey)
        const parsed = existing ? JSON.parse(existing) : {}
        const signerKey = reportData.signerKey || reportData.positionKey
        if (parsed.signers && signerKey) {
          parsed.signers[signerKey] = {
            ...parsed.signers[signerKey],
            isSigned: true,
            signatureData: dataUrl,
            signatureHash: uniqueHash,
            signedAt: timeStr,
          }
        }
        localStorage.setItem(
          reportData.storageKey,
          JSON.stringify({
            ...parsed,
            isSigned: true,
            signatureData: dataUrl,
            signatureHash: uniqueHash,
            signedAt: timeStr,
          })
        )
      }
      window.dispatchEvent(new Event('storage'))
    } catch (err) {
      console.warn('Gagal menyimpan hasil ttd publik:', err)
    }
  }

  const judulLaporan = reportData?.kegiatanNama || 'LAPORAN KEGIATAN PELAKSANAAN'

  return (
    <div className="min-h-screen bg-[#F2F5FA] dark:bg-[#090E1A] p-4 sm:p-6 flex flex-col items-center justify-center font-sans">
      {/* Borderless Card Container */}
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs">
        {/* Header Lembar TTE */}
        <div className="bg-[#0B3264] text-white p-5 text-center space-y-1">
          <h1 className="text-base sm:text-lg font-bold uppercase tracking-tight leading-snug">
            {judulLaporan}
          </h1>
          <p className="text-xs text-blue-200 font-medium">
            Pengesahan Tanda Tangan Elektronik (E-Signature)
          </p>
        </div>

        {/* Ringkasan Dokumen */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/60 dark:bg-slate-850/40 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#175CD3] shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Titik Lokasi</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {reportData?.tilokNama || 'Kantor Regional III BKN'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-[#175CD3] shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Tanggal Pelaksanaan</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {reportData?.hari ? `${reportData.hari}, ` : ''}{reportData?.tanggalPelaksanaan || '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Pejabat Penandatangan</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {reportData?.namaPenandatangan || reportData?.signerName || reportData?.nama || 'Koordinator Pelaksana'}
              </p>
              <p className="text-[11px] text-slate-500">
                {reportData?.nipPenandatangan || reportData?.signerNip || reportData?.nip
                  ? (String(reportData.nipPenandatangan || reportData.signerNip || reportData.nip).startsWith('NIP.')
                      ? String(reportData.nipPenandatangan || reportData.signerNip || reportData.nip)
                      : `NIP. ${reportData.nipPenandatangan || reportData.signerNip || reportData.nip}`)
                  : '-'}
              </p>
              {(reportData?.jabatanPenandatangan || reportData?.signerJabatan || reportData?.jabatan) && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {reportData.jabatanPenandatangan || reportData.signerJabatan || reportData.jabatan}
                </p>
              )}
            </div>
            {isSigned && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sudah Ditandatangani</span>
              </span>
            )}
          </div>
        </div>

        {/* Area E-Signature */}
        <div className="p-6 space-y-4">
          {isSigned ? (
            /* TAMPILAN PUBLIK SETELAH DITANDATANGANI:
             * - Cukup tampilkan status SUDAH DI TTD
             * - TANPA pratinjau goresan e-sign
             * - TANPA tombol reset (hanya bisa di-reset di menu admin)
             */
            <div className="py-6 text-center space-y-3 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Dokumen Telah Ditandatangani
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tanda tangan elektronik resmi telah dibubuhkan dan tersimpan secara sah pada sistem SIMOJANG.
                </p>
              </div>

              {signedAt && (
                <div className="inline-block px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Waktu Pengesahan: {signedAt}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                <p>
                  * Catatan: Tanda tangan telah terkunci secara permanen pada tautan publik ini. Apabila terdapat koreksi atau kebutuhan tanda tangan ulang, silakan hubungi tim administrator terkait.
                </p>
              </div>
            </div>
          ) : (
            /* TAMPILAN BELUM DITANDATANGANI (CANVAS AKTIF) */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Bubuhkan Goresan Tanda Tangan Anda:
                </span>
                {hasStroke && (
                  <button
                    type="button"
                    onClick={handleClearSignature}
                    className="font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Bersihkan
                  </button>
                )}
              </div>

              {/* Canvas Touch-Ready */}
              <div className="relative border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-950 touch-none shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 cursor-crosshair"
                />
                {!hasStroke && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                    <p className="font-semibold">Sentuh atau gunakan stylus/mouse untuk menandatangani</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!hasStroke) {
                    toast.warning('Silakan buat goresan tanda tangan pada canvas terlebih dahulu.')
                    return
                  }
                  setShowConfirmModal(true)
                }}
                disabled={!hasStroke}
                className="w-full py-2.5 rounded-xl bg-[#0B3264] hover:bg-[#175CD3] active:bg-[#124196] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Sahkan Dokumen</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
          Sistem Informasi Manajemen Operasional Kepegawaian (SIMOJANG) • BKN Kanreg III Bandung
        </div>
      </div>

      {/* MODAL KONFIRMASI PENGESAHAN TTD */}
      {showConfirmModal && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs modal-backdrop-animated"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirmModal(false)
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4 shadow-xl modal-dialog-animated">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#175CD3] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Konfirmasi Pengesahan
                </h3>
                <p className="text-xs text-slate-500">
                  Pengesahan Tanda Tangan Elektronik
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin membubuhkan tanda tangan elektronik ini pada laporan? Tanda tangan akan langsung diterapkan pada dokumen resmi.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSign}
                className="px-4 py-2 rounded-xl bg-[#0B3264] hover:bg-[#175CD3] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Ya, Sahkan Dokumen
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
