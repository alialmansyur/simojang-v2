import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, UploadCloud, FileSpreadsheet, Download, Loader2, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react'

export function EkinUploadModal({
  isOpen,
  onClose,
  onSuccess,
  serviceTitle = 'Manajemen E-Kinerja',
  templateUrl = '/templates/tu/template-ekin.xlsx',
  templateName = 'template-ekin.xlsx',
  uploadFn,
}) {
  const [file, setFile] = useState(null)
  const [period, setPeriod] = useState('Maret 2026')
  const [syncdate1, setSyncdate1] = useState(new Date().toISOString().slice(0, 8) + '01')
  const [syncdate2, setSyncdate2] = useState(new Date().toISOString().slice(0, 10))
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (!selected.name.match(/\.(xlsx|xls)$/i)) {
        setErrorMsg('Format file harus berformat Excel (.xlsx atau .xls).')
        setFile(null)
        return
      }
      setFile(selected)
      setErrorMsg('')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      if (!dropped.name.match(/\.(xlsx|xls)$/i)) {
        setErrorMsg('Format file harus berformat Excel (.xlsx atau .xls).')
        return
      }
      setFile(dropped)
      setErrorMsg('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setErrorMsg('Silakan pilih berkas Excel tarikan E-Kinerja terlebih dahulu.')
      return
    }

    if (!period || !syncdate1 || !syncdate2) {
      setErrorMsg('Harap lengkapi periode dan tanggal tarikan data E-Kinerja.')
      return
    }

    try {
      setIsUploading(true)
      setErrorMsg('')
      setSuccessMsg('')

      const fd = new FormData()
      fd.append('file', file)
      fd.append('period', period)
      fd.append('syncdate1', syncdate1)
      fd.append('syncdate2', syncdate2)

      const res = await uploadFn(fd)

      if (res?.status === 'success' || res?.status === true) {
        setSuccessMsg(res?.message || 'Data tarikan E-Kinerja berhasil diimpor dan disinkronkan!')
        setTimeout(() => {
          if (onSuccess) onSuccess()
          onClose()
        }, 1200)
      } else {
        throw new Error(res?.message || 'Gagal memproses berkas tarikan E-Kinerja.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah berkas E-Kinerja.')
    } finally {
      setIsUploading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header (Matching /layanan/cltn) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Upload Data E-Kinerja
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {serviceTitle} • Kantor Regional III BKN Bandung
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto clean-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Metadata Parameters */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nama Periode Tarikan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Contoh: Maret 2026"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tanggal Mulai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={syncdate1}
                  onChange={(e) => setSyncdate1(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tanggal Selesai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={syncdate2}
                  onChange={(e) => setSyncdate2(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50/50 dark:bg-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>
            </div>
          </div>

          {/* Template Info & Download (Above Dropzone - Matching /layanan/cltn) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {templateName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Format baku tarikan log E-Kinerja BKN
                </p>
              </div>
            </div>
            <a
              href={templateUrl}
              download={templateName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#175CD3] dark:hover:text-blue-400 shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template</span>
            </a>
          </div>

          {/* File Dropzone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Berkas Excel Tarikan E-Kinerja <span className="text-rose-500">*</span>
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-[#175CD3] dark:hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-850/40 relative"
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xs border border-slate-100 dark:border-slate-700 text-[#175CD3] dark:text-blue-400">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                {file ? (
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(1)} KB — Klik untuk ganti berkas</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Klik atau seret berkas <span className="text-[#175CD3] dark:text-blue-400">sample-ekin.xlsx</span> ke sini
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Format .xlsx atau .xls (Maksimal 15 MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons (Matching /layanan/cltn) */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Mengimpor...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Upload Data</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default EkinUploadModal
