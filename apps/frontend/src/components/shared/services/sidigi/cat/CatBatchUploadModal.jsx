import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
} from 'lucide-react'
import { resolveAssetUrl } from '../../../../../utils/url'

export function CatBatchUploadModal(props) {
  if (!props.isOpen) return null
  return <CatBatchUploadModalContent {...props} />
}

function CatBatchUploadModalContent({
  onClose,
  onSuccess,
  tilokUid,
  tilokNama,
  seleksiId,
  jenisTesId,
  uploadFn,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (file) => {
    setUploadError('')
    setUploadSuccess('')
    if (!file) return

    const validExtensions = ['.xlsx', '.xls']
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

    if (!hasValidExt) {
      setUploadError('Hanya file spreadsheet Excel (.xlsx, .xls) yang diperbolehkan.')
      setSelectedFile(null)
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal adalah 15 MB.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      setUploadError('Pilih berkas Excel terlebih dahulu.')
      return
    }

    try {
      setIsUploading(true)
      setUploadError('')

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('tilok_id', tilokUid || '')
      formData.append('seleksi_id', seleksiId || '')
      formData.append('jenis_tes_id', jenisTesId || '')

      if (uploadFn) {
        await uploadFn(formData)
      }

      setUploadSuccess('File rekap sesi CAT berhasil diunggah dan diproses ke sistem!')
      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 1200)
    } catch (err) {
      setUploadError(err.message || 'Gagal mengimpor file. Periksa format kolom Excel Anda.')
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !isUploading) onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isUploading, onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) onClose?.()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Upload Batch Rekap Sesi CAT
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tilokNama ? `Titik Lokasi: ${tilokNama}` : 'Impor data sesi dari file spreadsheet'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto clean-scrollbar">
          {/* Template Banner Above Dropzone (SSOT Compliance) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Format Excel Batch Resmi CAT
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Gunakan template standar sebelum mengisi data sesi
                </p>
              </div>
            </div>
            <a
              href={resolveAssetUrl('/templates/sidigi/template-fasilitasi-cat.xlsx')}
              download="template-fasilitasi-cat.xlsx"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#175CD3] dark:hover:text-blue-400 shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template</span>
            </a>
          </div>

          {/* Dropzone Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-[#175CD3] bg-blue-50/50 dark:bg-blue-950/20'
                : selectedFile
                ? 'border-emerald-400/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center mb-1">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              Tarik & lepaskan file Excel di sini, atau{' '}
              <span className="text-[#175CD3] dark:text-blue-400 underline font-bold">pilih file</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Format yang didukung: .xlsx, .xls (Maksimal 15 MB)
            </p>
          </div>

          {/* Selected File Badge */}
          {selectedFile && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Klik dropzone untuk mengganti
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Batalkan pilihan file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Alerts */}
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengimpor Data...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Impor Berkas Excel</span>
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
