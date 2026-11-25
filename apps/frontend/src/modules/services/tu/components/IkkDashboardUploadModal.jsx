import { useState, useRef } from 'react'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Download,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { resolveAssetUrl } from '../../../../utils/url'
import { previewIkkDashboardExcel, importIkkDashboardExcel } from '../../../../services/api/tuServicesApi'

const BULAN_OPTIONS = [
  { value: '1', label: 'Bulan 1 - Januari' },
  { value: '2', label: 'Bulan 2 - Februari' },
  { value: '3', label: 'Bulan 3 - Maret' },
  { value: '4', label: 'Bulan 4 - April' },
  { value: '5', label: 'Bulan 5 - Mei' },
  { value: '6', label: 'Bulan 6 - Juni' },
  { value: '7', label: 'Bulan 7 - Juli' },
  { value: '8', label: 'Bulan 8 - Agustus' },
  { value: '9', label: 'Bulan 9 - September' },
  { value: '10', label: 'Bulan 10 - Oktober' },
  { value: '11', label: 'Bulan 11 - November' },
  { value: '12', label: 'Bulan 12 - Desember' },
]

export function IkkDashboardUploadModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTahun = new Date().getFullYear().toString(),
  defaultBulan = '9',
  defaultTriwulan = '3',
  templateUrl = '/templates/tu/template-realisasi-ikk.xlsx',
  templateName = 'Format Excel Batch Resmi',
}) {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [tahun, setTahun] = useState(defaultTahun)
  const [bulan, setBulan] = useState(defaultBulan || '9')
  const [triwulan, setTriwulan] = useState(defaultTriwulan || '3')
  const [isDragging, setIsDragging] = useState(false)

  // Step state: 'select' | 'preview'
  const [step, setStep] = useState('select')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [previewResult, setPreviewResult] = useState(null)

  if (!isOpen) return null

  const handleReset = () => {
    setSelectedFile(null)
    setStep('select')
    setIsPreviewing(false)
    setIsSubmitting(false)
    setErrorMessage('')
    setPreviewResult(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file) => {
    setErrorMessage('')
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls'].includes(ext)) {
      setErrorMessage('Format berkas tidak valid. Harap pilih file Microsoft Excel (.xlsx / .xls).')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('Ukuran file melebihi batas maksimal 20 MB.')
      return
    }
    setSelectedFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  // Step 1: Lakukan Pratinjau
  const handlePreview = async () => {
    if (!selectedFile) {
      setErrorMessage('Pilih file Excel terlebih dahulu.')
      return
    }

    try {
      setIsPreviewing(true)
      setErrorMessage('')

      const fd = new FormData()
      fd.append('file_excel', selectedFile)
      if (tahun) fd.append('tahun', tahun)
      if (bulan) fd.append('bulan', bulan)
      if (triwulan) fd.append('triwulan', triwulan)

      const res = await previewIkkDashboardExcel(fd)
      if (res?.status === 'success' && res.preview?.length > 0) {
        setPreviewResult(res)
        if (res.tahun) setTahun(String(res.tahun))
        if (res.bulan) setBulan(String(res.bulan))
        if (res.triwulan) setTriwulan(String(res.triwulan))
        setStep('preview')
      } else {
        setErrorMessage(res?.message || 'Tidak ada baris data IKK yang dapat terbaca dari sheet Excel.')
      }
    } catch (err) {
      console.warn('Gagal pratinjau Excel IKK:', err)
      setErrorMessage(err?.message || 'Terjadi kesalahan saat memproses pratinjau file Excel.')
    } finally {
      setIsPreviewing(false)
    }
  }

  // Step 2: Konfirmasi dan Simpan ke DB
  const handleCommitImport = async () => {
    if (!selectedFile) return

    try {
      setIsSubmitting(true)
      setErrorMessage('')

      const fd = new FormData()
      fd.append('file_excel', selectedFile)
      fd.append('tahun', tahun)
      fd.append('bulan', bulan)
      fd.append('triwulan', triwulan)

      const res = await importIkkDashboardExcel(fd)
      if (res?.status === 'success') {
        toast.success(res.message || 'Data capaian IKK berhasil diimpor ke database!')
        handleClose()
        onSuccess && onSuccess()
      } else {
        setErrorMessage(res?.message || 'Gagal menyimpan data import IKK.')
      }
    } catch (err) {
      console.warn('Gagal import Excel IKK:', err)
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat menyimpan data import IKK.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xl max-w-3xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Upload Excel Realisasi IKK Dashboard
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Impor data capaian kinerja dari sheet resmi &apos;REALISASI IKK UNTUK DASHBOARD&apos;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto clean-scrollbar text-xs">
          {/* Petunjuk Format Wajib */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Info className="w-4 h-4 text-[#175CD3] shrink-0" />
              <span>Petunjuk Format Import Realisasi IKK:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-800/90 dark:text-blue-300 ml-1">
              <li>
                File memuat sheet standar atau template (nama sheet bebas).
              </li>
              <li>
                Isian kolom wajib:{' '}
                <span className="font-semibold underline">
                  Target, Realisasi, Capaian, Penjelasan, Permasalahan, Rencana Tindak Lanjut, Link Bukti Dukung
                </span>
                .
              </li>
              <li>
                Data disimpan sebagai <strong>log historis</strong> per periode Bulan & Tahun (menampilkan snapshot terakhir tanpa manipulasi hitungan rasio).
              </li>
            </ul>
          </div>

          {/* STEP 1: PILIH FILE & PERIODE */}
          {step === 'select' && (
            <div className="space-y-4">
              {/* Filter Override Periode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tahun Anggaran:
                  </label>
                  <select
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Bulan Pelaporan:
                  </label>
                  <select
                    value={bulan}
                    onChange={(e) => {
                      const val = e.target.value
                      setBulan(val)
                      setTriwulan(String(Math.ceil(Number(val) / 3)))
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    {BULAN_OPTIONS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Periode Triwulan:
                  </label>
                  <select
                    value={triwulan}
                    onChange={(e) => setTriwulan(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    <option value="1">Triwulan I (Januari - Maret)</option>
                    <option value="2">Triwulan II / Semester I (Januari - Juni)</option>
                    <option value="3">Triwulan III (Januari - September)</option>
                    <option value="4">Triwulan IV / Tahunan (Januari - Desember)</option>
                  </select>
                </div>
              </div>

              {/* Template Download Banner (Above Dropzone - Matching Standard) */}
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
                      Unduh template standar sebelum mengisi data
                    </p>
                  </div>
                </div>
                <a
                  href={resolveAssetUrl(templateUrl)}
                  download="template-realisasi-ikk.xlsx"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#175CD3] dark:hover:text-blue-400 shadow-2xs transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template</span>
                </a>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#175CD3] bg-blue-50/50 dark:bg-blue-950/20'
                    : selectedFile
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-850/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      selectedFile
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                    }`}
                  >
                    {selectedFile ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk ganti berkas
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Tarik &amp; lepaskan file Excel di sini, atau{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold underline">
                            pilih file
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Format yang didukung: .xlsx, .xls (Maksimal 15 MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PRATINJAU HASIL PARSING SEBELUM COMMIT */}
          {step === 'preview' && previewResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    Pratinjau Data ({previewResult.total_rows} Indikator Terdeteksi)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Sheet: {previewResult.sheet_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#175CD3] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali Ganti File</span>
                </button>
              </div>

              {/* Tabel Pratinjau */}
              <div className="max-h-72 overflow-y-auto border border-slate-200/80 dark:border-slate-800 rounded-xl clean-scrollbar">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                      <th className="py-2 px-2.5">IKK</th>
                      <th className="py-2 px-2.5">Indikator Kinerja</th>
                      <th className="py-2 px-2 text-center">Target</th>
                      <th className="py-2 px-2 text-center">Realisasi</th>
                      <th className="py-2 px-2 text-center">Capaian</th>
                      <th className="py-2 px-2">Penjelasan Singkat</th>
                      <th className="py-2 px-2 text-center">Eviden</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {previewResult.preview?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-2.5 font-bold text-[#175CD3]">
                          {p.kode}
                        </td>
                        <td className="py-2 px-2.5 text-slate-800 dark:text-slate-200 font-medium truncate max-w-xs" title={p.nama_indikator}>
                          {p.nama_indikator}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold">
                          {p.target_periode || '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-900 dark:text-white">
                          {p.realisasi_text || p.jumlah_realisasi || '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-600">
                          {p.capaian_text || `${p.progres_capaian}%`}
                        </td>
                        <td className="py-2 px-2 text-slate-600 dark:text-slate-300 truncate max-w-xs" title={p.penjelasan_capaian || ''}>
                          {p.penjelasan_capaian || '-'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {p.bukti_dukung ? (
                            <span className="text-emerald-600 font-bold">Ada</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>

          {step === 'select' ? (
            <button
              type="button"
              disabled={!selectedFile || isPreviewing}
              onClick={handlePreview}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membaca Excel...</span>
                </>
              ) : (
                <>
                  <span>Periksa & Pratinjau</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCommitImport}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi & Simpan Capaian</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
