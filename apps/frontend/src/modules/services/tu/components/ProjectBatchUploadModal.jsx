import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { importBatchProjects } from '../../../../services/api/tuServicesApi'
import { resolveAssetUrl } from '../../../../utils/url'

export function ProjectBatchUploadModal({
  isOpen,
  onClose,
  onSuccess,
  templateUrl = '/templates/tu/template-project.xlsx',
  templateName = 'template-project.xlsx',
}) {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) validateAndSetFile(droppedFile)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) validateAndSetFile(selectedFile)
  }

  const validateAndSetFile = (selectedFile) => {
    setErrorMsg('')
    setSuccessMsg('')
    const validExtensions = ['.xlsx', '.xls']
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()

    if (!validExtensions.includes(ext)) {
      setErrorMsg('Hanya file Excel (.xlsx, .xls) yang diperbolehkan.')
      return
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal adalah 15 MB.')
      return
    }

    setFile(selectedFile)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setErrorMsg('Silakan pilih file Excel terlebih dahulu.')
      return
    }

    try {
      setIsUploading(true)
      setErrorMsg('')
      setSuccessMsg('')

      const res = await importBatchProjects(file)
      if (res?.status === 'success' || res?.code === 200) {
        setSuccessMsg(res?.message || 'Data proyek berhasil diimpor.')
        setTimeout(() => {
          onSuccess?.()
          handleClose()
        }, 1200)
      } else {
        throw new Error(res?.message || 'Gagal mengimpor file Excel.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah file.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setErrorMsg('')
    setSuccessMsg('')
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header (SSOT Standard) */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Upload Data Batch Proyek
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inisiasi paket pekerjaan proyek fisik dan pengadaan TI via Excel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto clean-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200/60 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200/60 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Template Download Banner (Above Dropzone per SSOT) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Format Excel Batch Resmi
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Unduh template standar sebelum mengisi data
                </p>
              </div>
            </div>
            <a
              href={resolveAssetUrl(templateUrl)}
              download={templateName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#175CD3] dark:hover:text-blue-400 shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template</span>
            </a>
          </div>

          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-[#175CD3] bg-blue-50/50 dark:bg-blue-950/20'
                : file
                ? 'border-emerald-400/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center mb-1">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              Tarik & lepaskan file Excel di sini, atau{' '}
              <span className="text-[#175CD3] dark:text-blue-400 underline font-bold">
                pilih file
              </span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Format yang didukung: .xlsx, .xls (Maksimal 15 MB)
            </p>
          </div>

          {/* Selected File Badge */}
          {file && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • Siap diproses
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Batalkan pilihan file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <span>Mulai Upload</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
