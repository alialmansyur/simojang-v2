import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  FileEdit,
  UploadCloud,
  CalendarClock,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react'
import { SearchableSelect } from '../../../../../ui/SearchableSelect'
import { CatDocInstansiPicker } from './doc-builders/CatDocBuilderShared'
import {
  fetchCatPengelolaJadwal,
  saveCatPengelolaDocument,
  uploadCatPengelolaDocument,
} from '../../../../../../services/api/sidigiCatServicesApi'
import {
  CAT_DOC_DETAILS,
  formatDateRangeId,
  CAT_FORM_LABEL_CLS,
  CAT_FORM_INPUT_CLS,
  CAT_FORM_TEXTAREA_CLS,
} from './pengelolaConstants'

export function CatPengelolaDocCreateModal({
  isOpen,
  onClose,
  docType = 'sp',
  docTypeMeta = null,
  defaultJadwalId = '',
  onCreated,
}) {
  if (!isOpen) return null
  return (
    <CatPengelolaDocCreateModalInner
      key={`${docType}-${defaultJadwalId}`}
      onClose={onClose}
      docType={docType}
      docTypeMeta={docTypeMeta}
      defaultJadwalId={defaultJadwalId}
      onCreated={onCreated}
    />
  )
}

function CatPengelolaDocCreateModalInner({
  onClose,
  docType = 'sp',
  docTypeMeta = null,
  defaultJadwalId = '',
  onCreated,
}) {
  const detailMeta = CAT_DOC_DETAILS[docType] || {}
  const docTypeName = docTypeMeta?.name || detailMeta.title || docType.toUpperCase()

  const [sourceMode, setSourceMode] = useState('builder')
  const [jadwalList, setJadwalList] = useState([])
  const [loadingJadwal, setLoadingJadwal] = useState(true)

  const [jadwalId, setJadwalId] = useState(defaultJadwalId ? String(defaultJadwalId) : '')
  const [instansiIds, setInstansiIds] = useState([])
  const [instansiNames, setInstansiNames] = useState([])
  const [manualInstansiTouched, setManualInstansiTouched] = useState(false)

  const [title, setTitle] = useState(`${docTypeName}`)
  const [docNumber, setDocNumber] = useState('')
  const [docDate, setDocDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const [uploadFile, setUploadFile] = useState(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const fileInputRef = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const applyJadwalDefaults = (matched, isTouched) => {
    if (!matched) return
    if (!isTouched) {
      const list = Array.isArray(matched.instansi_list) ? matched.instansi_list : []
      if (list.length > 0) {
        setInstansiIds(list.map((i) => String(i.instansi_id || i.kodeins || '')).filter(Boolean))
        setInstansiNames(list.map((i) => i.instansi_nama || i.nama || '').filter(Boolean))
      } else if (matched.instansi_nama) {
        setInstansiIds(matched.instansi_id ? [String(matched.instansi_id)] : [])
        setInstansiNames([matched.instansi_nama])
      }
    }
    const baseName = matched.nama_jadwal || matched.nama_seleksi || ''
    if (baseName) {
      setTitle(`${docTypeName} — ${baseName}`)
    }
  }

  useEffect(() => {
    let active = true
    fetchCatPengelolaJadwal({ limit: 150 })
      .then((res) => {
        if (!active) return
        const rows = Array.isArray(res?.rows) ? res.rows : []
        setJadwalList(rows)
        if (defaultJadwalId) {
          const matched = rows.find((j) => String(j.id) === String(defaultJadwalId))
          if (matched) applyJadwalDefaults(matched, false)
        }
      })
      .catch(() => {
        if (active) setJadwalList([])
      })
      .finally(() => {
        if (active) setLoadingJadwal(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultJadwalId, docTypeName])

  const selectedJadwal = useMemo(
    () => jadwalList.find((j) => String(j.id) === String(jadwalId)) || null,
    [jadwalList, jadwalId]
  )

  const handleSelectJadwal = (val) => {
    setJadwalId(val)
    setManualInstansiTouched(false)
    const matched = jadwalList.find((j) => String(j.id) === String(val))
    if (matched) applyJadwalDefaults(matched, false)
  }

  const jadwalOptions = useMemo(
    () =>
      jadwalList.map((j) => {
        const jenis = [j.jenis_tes_nama || j.jenis_tes_kode, j.jenis_periode_tahun || j.seleksi_periode]
          .filter(Boolean)
          .join(' ')
        const tilok = j.nama_tilok || j.tilok_nama || '-'
        return {
          value: String(j.id),
          label: `${j.nama_jadwal || j.nama_seleksi || 'Jadwal CAT'}`,
          sublabel: [jenis, tilok, formatDateRangeId(j.tanggal_mulai, j.tanggal_selesai)]
            .filter(Boolean)
            .join(' • '),
        }
      }),
    [jadwalList]
  )

  const handleFilePick = (file) => {
    if (!file) return
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setErrorMsg('Hanya file dokumen format PDF (.pdf) yang diperbolehkan untuk mode Upload.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran maksimal file PDF adalah 15 MB.')
      return
    }
    setErrorMsg('')
    setUploadFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)
    const dropped = e.dataTransfer?.files?.[0]
    if (dropped) handleFilePick(dropped)
  }

  const handleSubmit = async (e, openBuilderImmediately = false) => {
    e.preventDefault()
    setErrorMsg('')

    if (!jadwalId) {
      setErrorMsg('Silakan pilih Jadwal Kegiatan CAT terlebih dahulu.')
      return
    }
    if (!title.trim()) {
      setErrorMsg('Judul / Perihal dokumen wajib diisi.')
      return
    }

    if (sourceMode === 'upload' && !uploadFile) {
      setErrorMsg('Silakan pilih atau jatuhkan file PDF dokumen yang ingin diunggah.')
      return
    }

    try {
      setSubmitting(true)
      if (sourceMode === 'upload') {
        const fd = new FormData()
        fd.append('file', uploadFile)
        fd.append('doc_type', docType)
        fd.append('jadwal_id', jadwalId)
        fd.append('title', title.trim())
        fd.append('doc_number', docNumber.trim())
        fd.append('doc_date', docDate)
        fd.append('notes', notes.trim())
        fd.append('instansi_ids', JSON.stringify(instansiIds))
        fd.append('instansi_names', JSON.stringify(instansiNames))

        const res = await uploadCatPengelolaDocument(fd)
        if (onCreated) onCreated(res?.data || null, 'upload', false)
        onClose()
      } else {
        const res = await saveCatPengelolaDocument({
          doc_type: docType,
          jadwal_id: Number(jadwalId),
          title: title.trim(),
          doc_number: docNumber.trim(),
          doc_date: docDate,
          notes: notes.trim(),
          instansi_ids: instansiIds,
          instansi_names: instansiNames,
          source_mode: 'builder',
          status: 'draft',
        })
        if (onCreated) onCreated(res?.data || null, 'builder', openBuilderImmediately)
        onClose()
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menyimpan data dokumen.')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose?.()
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider">
              {detailMeta.short || docType.toUpperCase()}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Tambah Data {docTypeName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={(e) => handleSubmit(e, false)}
          className="p-5 space-y-4 overflow-y-auto clean-scrollbar text-xs"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Pilihan Visual Mode: Input Builder vs Upload Arsip PDF */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-200">
              1. Pilih Metode Pengadaan Dokumen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSourceMode('builder')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                  sourceMode === 'builder'
                    ? 'border-[#175CD3] bg-blue-50/70 dark:bg-blue-950/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    sourceMode === 'builder'
                      ? 'bg-[#175CD3] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <FileEdit className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Input Data (Builder)</span>
                    {sourceMode === 'builder' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#175CD3]" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Susun isi dokumen, tim personel (drag &amp; drop / eksternal), serta TTD 3 kolom.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSourceMode('upload')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                  sourceMode === 'upload'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    sourceMode === 'upload'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Upload PDF Lama</span>
                    {sourceMode === 'upload' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Unggah langsung file PDF dokumen lama atau arsip yang sudah bertanda tangan.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Pilih Jadwal CAT */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-200">
              2. Pilih Jadwal Kegiatan CAT <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              options={jadwalOptions}
              value={jadwalId}
              onChange={handleSelectJadwal}
              isLoading={loadingJadwal}
              placeholder="-- Cari & pilih jadwal (sudah terikat Jenis Tes, Periode, Tilok) --"
            />

            {selectedJadwal && (
              <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#175CD3] dark:text-blue-300">
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Metadata Terikat Otomatis dari Jadwal:</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-2 gap-y-0.5">
                  <span>
                    <strong>Jenis Tes &amp; Periode:</strong>{' '}
                    {[
                      selectedJadwal.jenis_tes_nama || selectedJadwal.jenis_tes_kode,
                      selectedJadwal.jenis_periode_tahun || selectedJadwal.seleksi_periode,
                    ]
                      .filter(Boolean)
                      .join(' ') || '-'}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Kegiatan:</strong> {selectedJadwal.nama_seleksi || '-'}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Tilok:</strong>{' '}
                    {selectedJadwal.nama_tilok || selectedJadwal.tilok_nama || '-'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Multi-Instansi Manual */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className={`${CAT_FORM_LABEL_CLS} flex items-center gap-1.5`}>
                <Building2 className="w-3.5 h-3.5 text-[#175CD3]" />
                <span>3. Pilih Instansi (Bisa Multiple &amp; Input Manual)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Ketik nama instansi jika tidak ada di daftar master
              </span>
            </div>
            <CatDocInstansiPicker
              selectedIds={instansiIds}
              selectedNames={instansiNames}
              onChange={({ instansiIds: nextIds, instansiNames: nextNames }) => {
                if (manualInstansiTouched) {
                  setInstansiIds(nextIds)
                  setInstansiNames(nextNames)
                } else {
                  setManualInstansiTouched(true)
                  setInstansiIds(nextIds)
                  setInstansiNames(nextNames)
                }
              }}
            />
          </div>

          {/* 4. Judul, Nomor, Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2 space-y-1.5">
              <label className={CAT_FORM_LABEL_CLS}>
                Judul / Perihal Dokumen <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Contoh: ${docTypeName} Seleksi PPPK`}
                className={`${CAT_FORM_INPUT_CLS} font-semibold`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={CAT_FORM_LABEL_CLS}>
                Nomor Dokumen (Opsional saat buat)
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Bisa diisi/ubah di halaman builder"
                className={CAT_FORM_INPUT_CLS}
              />
            </div>

            <div className="space-y-1.5">
              <label className={CAT_FORM_LABEL_CLS}>
                Tanggal Dokumen
              </label>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className={CAT_FORM_INPUT_CLS}
              />
            </div>
          </div>

          {/* Dropzone Upload PDF (Hanya muncul pada mode Upload) */}
          {sourceMode === 'upload' && (
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-200">
                Unggah Dokumen PDF <span className="text-rose-500">*</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDraggingFile(true)
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`rounded-2xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
                  isDraggingFile
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30'
                    : uploadFile
                    ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/60 dark:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => handleFilePick(e.target.files?.[0])}
                />

                {uploadFile ? (
                  <div className="flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {uploadFile.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB • Siap diunggah
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setUploadFile(null)
                      }}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      title="Hapus file terpilih"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Tarik &amp; lepaskan file PDF ke sini, atau klik untuk memilih
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Format PDF (.pdf) maksimal 15 MB
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Keterangan / Catatan */}
          <div className="space-y-1.5">
            <label className={CAT_FORM_LABEL_CLS}>
              Keterangan Dokumen
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan dokumen (opsional)..."
              className={CAT_FORM_TEXTAREA_CLS}
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>

            {sourceMode === 'builder' && (
              <button
                type="button"
                disabled={submitting}
                onClick={(e) => handleSubmit(e, true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#175CD3]/30 bg-blue-50 hover:bg-blue-100 text-[#175CD3] font-bold cursor-pointer disabled:opacity-50"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Simpan &amp; Buka Builder</span>
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold shadow-xs cursor-pointer disabled:opacity-50 ${
                sourceMode === 'upload'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-[#175CD3] hover:bg-[#1248A8]'
              }`}
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : sourceMode === 'upload' ? (
                <UploadCloud className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                {submitting
                  ? 'Menyimpan...'
                  : sourceMode === 'upload'
                  ? 'Upload & Simpan ke Tabel'
                  : 'Simpan ke Tabel'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
