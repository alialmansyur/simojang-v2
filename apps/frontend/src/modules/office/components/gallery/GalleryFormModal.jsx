import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ImagePlus, Loader2, Trash2, UploadCloud, X } from 'lucide-react'
import { fetchGalleryLayanan } from '../../../../services/api/galleryApi'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB matching ActivityGalleryController::store
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const galleryFormSchema = z.object({
  timkerja: z.string().min(1, 'Tim Kerja wajib dipilih.'),
  layanan: z.string().optional(),
  tanggal: z.string().min(1, 'Tanggal kegiatan wajib diisi.'),
  judul: z.string().trim().min(1, 'Judul kegiatan wajib diisi.'),
  deskripsi: z.string().trim().min(1, 'Deskripsi kegiatan wajib diisi.'),
})

export default function GalleryFormModal({
  isOpen = false,
  editingItem = null,
  teams = [],
  isSubmitting = false,
  onClose,
  onSubmit,
}) {
  const isEditing = Boolean(editingItem)
  const fileInputRef = useRef(null)

  const [layananState, setLayananState] = useState({ teamId: '', list: [], loading: false })
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(() => editingItem?.img || '')
  const [fileError, setFileError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(galleryFormSchema),
    defaultValues: {
      timkerja: editingItem?.teamId || '',
      layanan: editingItem?.layananId || '',
      tanggal: editingItem?.date || '',
      judul: editingItem?.title || '',
      deskripsi: editingItem?.desc || '',
    },
  })

  const watchedTimKerja = useWatch({ control, name: 'timkerja' })

  // Fetch dependent Layanan options when Tim Kerja is selected
  useEffect(() => {
    if (!isOpen || !watchedTimKerja) return

    let cancelled = false

    fetchGalleryLayanan(watchedTimKerja)
      .then((list) => {
        if (cancelled) return
        setLayananState({ teamId: watchedTimKerja, list, loading: false })
        const currentLayanan =
          editingItem && editingItem.teamId === watchedTimKerja
            ? editingItem.layananId
            : ''
        if (currentLayanan && list.some((l) => String(l.id) === String(currentLayanan))) {
          setValue('layanan', String(currentLayanan))
        } else {
          setValue('layanan', '')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLayananState({ teamId: watchedTimKerja, list: [], loading: false })
        }
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, watchedTimKerja, editingItem, setValue])

  // Revoke object URL on unmount / change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (!isOpen) return null

  const layananOptions =
    watchedTimKerja && layananState.teamId === watchedTimKerja
      ? layananState.list
      : []
  const isLoadingLayanan =
    Boolean(watchedTimKerja) &&
    layananState.teamId !== watchedTimKerja

  const timkerjaRegister = register('timkerja', {
    onChange: (e) => {
      const nextTeam = e.target.value
      setValue('layanan', '')
      if (!nextTeam) {
        setLayananState({ teamId: '', list: [], loading: false })
      }
    },
  })

  const handleFilePicked = (file) => {
    setFileError('')
    if (!file) return

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError('Format file harus JPG, PNG, atau WEBP.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Ukuran file maksimal 2 MB.')
      return
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleClearFile = (e) => {
    e?.stopPropagation()
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(isEditing ? editingItem?.img || '' : '')
    setFileError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onFormSubmit = async (values) => {
    setSubmitError('')
    if (!isEditing && !selectedFile) {
      setFileError('Foto kegiatan wajib diunggah.')
      return
    }

    try {
      await onSubmit({
        id: editingItem?.id || '',
        timkerja: values.timkerja,
        layanan: values.layanan || '',
        tanggal: values.tanggal,
        judul: values.judul,
        deskripsi: values.deskripsi,
        foto: selectedFile,
      })
    } catch (err) {
      setSubmitError(err?.message || 'Gagal menyimpan dokumentasi kegiatan.')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden modal-backdrop-animated"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-form-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xl overflow-hidden modal-dialog-animated">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2
              id="gallery-form-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
            >
              {isEditing ? 'Edit Dokumentasi Kegiatan' : 'Tambah Dokumentasi Kegiatan'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lengkapi detail kegiatan dan unggah foto dokumentasi (maks. 2 MB).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4 flex-1 min-h-0 overflow-y-auto clean-scrollbar">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tim Kerja */}
            <div className="space-y-1.5">
              <label
                htmlFor="gallery-timkerja"
                className="block text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Tim Kerja <span className="text-rose-500">*</span>
              </label>
              <select
                id="gallery-timkerja"
                {...timkerjaRegister}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#175CD3]"
              >
                <option value="">Pilih Tim Kerja...</option>
                {teams.map((tk) => (
                  <option key={tk.id} value={String(tk.id)}>
                    {tk.nama}
                  </option>
                ))}
              </select>
              {errors.timkerja && (
                <p className="text-[11px] font-medium text-rose-600">{errors.timkerja.message}</p>
              )}
            </div>

            {/* Layanan */}
            <div className="space-y-1.5">
              <label
                htmlFor="gallery-layanan"
                className="block text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Layanan (Opsional)
              </label>
              <select
                id="gallery-layanan"
                {...register('layanan')}
                disabled={!watchedTimKerja || isLoadingLayanan || layananOptions.length === 0}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#175CD3] disabled:opacity-60"
              >
                {!watchedTimKerja ? (
                  <option value="">Pilih Tim Kerja terlebih dahulu</option>
                ) : isLoadingLayanan ? (
                  <option value="">Memuat layanan...</option>
                ) : layananOptions.length === 0 ? (
                  <option value="">Tidak ada layanan untuk tim kerja ini</option>
                ) : (
                  <>
                    <option value="">-- Pilih Layanan (Opsional) --</option>
                    {layananOptions.map((item) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.nama_layanan}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <label
              htmlFor="gallery-tanggal"
              className="block text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              Tanggal Kegiatan <span className="text-rose-500">*</span>
            </label>
            <input
              id="gallery-tanggal"
              type="date"
              {...register('tanggal')}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#175CD3]"
            />
            {errors.tanggal && (
              <p className="text-[11px] font-medium text-rose-600">{errors.tanggal.message}</p>
            )}
          </div>

          {/* Judul */}
          <div className="space-y-1.5">
            <label
              htmlFor="gallery-judul"
              className="block text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              Judul Kegiatan <span className="text-rose-500">*</span>
            </label>
            <input
              id="gallery-judul"
              type="text"
              placeholder="Contoh: Rapat Koordinasi Tahunan"
              {...register('judul')}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#175CD3]"
            />
            {errors.judul && (
              <p className="text-[11px] font-medium text-rose-600">{errors.judul.message}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label
              htmlFor="gallery-deskripsi"
              className="block text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              Deskripsi Singkat <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="gallery-deskripsi"
              rows={3}
              placeholder="Jelaskan secara singkat mengenai kegiatan ini..."
              {...register('deskripsi')}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#175CD3]"
            />
            {errors.deskripsi && (
              <p className="text-[11px] font-medium text-rose-600">{errors.deskripsi.message}</p>
            )}
          </div>

          {/* Upload Photo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Foto Kegiatan {!isEditing && <span className="text-rose-500">*</span>}
              </label>
              <span className="text-[11px] text-slate-400">
                Maksimal 2 MB (.jpg, .png, .webp)
              </span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragOver(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragOver(false)
                const droppedFile = e.dataTransfer.files?.[0]
                if (droppedFile) handleFilePicked(droppedFile)
              }}
              className={`relative rounded-2xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${
                isDragOver
                  ? 'border-[#175CD3] bg-[#EAF2FC]/60 dark:bg-blue-950/30'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-[#175CD3]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => handleFilePicked(e.target.files?.[0])}
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Preview foto kegiatan"
                    className="mx-auto max-h-44 rounded-xl object-contain border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <UploadCloud className="w-3.5 h-3.5 text-[#175CD3]" />
                      {selectedFile ? 'Ganti Foto Terpilih' : 'Klik untuk Ganti Foto'}
                    </span>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Batal Pilih</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                    Klik atau seret foto ke sini
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Otomatis dikonversi ke WebP oleh server • Maksimal 2 MB
                  </p>
                </div>
              )}
            </div>

            {fileError && (
              <p className="text-[11px] font-medium text-rose-600">{fileError}</p>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Simpan Perubahan' : 'Simpan Data'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
