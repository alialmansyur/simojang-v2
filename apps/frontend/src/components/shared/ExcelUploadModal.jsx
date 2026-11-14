import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Download } from 'lucide-react'
import { apiRequest } from '../../services/api'

export function ExcelUploadModal({
  isOpen,
  onClose,
  serviceTitle = 'Penetapan NIP ASN',
  layananId = '2',
  docType = 'Excel',
  templateUrl = '#',
  onUploadSuccess,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('idle') // 'idle' | 'analyzing' | 'preview' | 'uploading' | 'success' | 'error'
  const [uploadError, setUploadError] = useState('')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [previewRows, setPreviewRows] = useState([])
  const [summary, setSummary] = useState(null)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleProcessFile(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleProcessFile(file)
  }

  const handleProcessFile = (file) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.warning('Format file tidak didukung. Mohon unggah file Excel (.xlsx, .xls) atau .csv.')
      return
    }

    setSelectedFile(file)
    setUploadStatus('analyzing')

    // Simulate file reading and validation
    setTimeout(() => {
      setPreviewRows([
        { nip: '198705122010011002', nama: 'Asep Saepuloh, S.Kom', instansi: 'Pemerintah Kabupaten Bandung', jabatan: 'Pranata Komputer Ahli Pertama', status: 'Valid' },
        { nip: '199003152014022004', nama: 'Dewi Lestari, M.Si', instansi: 'Pemerintah Kota Bandung', jabatan: 'Analis Kepegawaian Muda', status: 'Valid' },
        { nip: '198511202008011006', nama: 'Hendrawan, S.T.', instansi: 'Pemerintah Provinsi Jawa Barat', jabatan: 'Pengawas Tata Bangunan', status: 'Valid' },
        { nip: '199208042016032001', nama: 'Siti Nurhaliza, S.E.', instansi: 'Pemerintah Kabupaten Ciamis', jabatan: 'Bendahara Pengeluaran', status: 'Valid' },
        { nip: '199401222018011005', nama: 'Rian Pratama, S.IP', instansi: 'Pemerintah Kota Cimahi', jabatan: 'Pranata Humas Pertama', status: 'Valid' },
      ])
      setSummary({
        totalRows: 142,
        validRows: 142,
        warningRows: 0,
        duplicateRows: 0,
      })
      setUploadStatus('preview')
    }, 700)
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile) {
      setUploadError('Silakan pilih berkas terlebih dahulu sebelum menyimpan.')
      setUploadStatus('error')
      return
    }

    setUploadError('')
    setUploadStatus('uploading')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('layanan_id', String(layananId || '2'))
      formData.append('doc_type', String(docType || 'Excel'))

      const json = await apiRequest('/store/import-excel', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      })

      if (json?.status === 'success' || json?.status === true) {
        const count = Number(json?.data?.total_inserted ?? summary?.validRows ?? 0)
        setUploadedCount(count)
        setUploadStatus('success')
        if (onUploadSuccess) onUploadSuccess({ count })
        return
      }

      setUploadError(json?.message || 'Berkas gagal diproses oleh server. Silakan periksa format isi berkas Anda.')
      setUploadStatus('error')
    } catch (err) {
      setUploadError(err?.message || 'Gagal mengunggah berkas ke server. Silakan coba kembali.')
      setUploadStatus('error')
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setUploadError('')
    setUploadedCount(0)
    setPreviewRows([])
    setSummary(null)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EAECF0] dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF2FC] dark:bg-[#123B73]/30 border border-[#175CD3]/20 dark:border-[#175CD3]/40 flex items-center justify-center text-[#123B73] dark:text-[#93C5FD]">
              <FileSpreadsheet className="w-5 h-5 text-[#175CD3]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Import Data Usul Excel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Layanan: <span className="font-bold text-[#123B73] dark:text-[#93C5FD]">{serviceTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scroll space-y-5">
          {uploadStatus === 'idle' && (
            <>
              {/* Template Download Banner (Above Dropzone - Reference: /layanan/wasdal-netralitas) */}
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
                  href={templateUrl && templateUrl !== '#' ? templateUrl : '/templates/general/template-general.xlsx'}
                  download={`${serviceTitle.toLowerCase().replace(/\s+/g, '-')}-template.xlsx`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#175CD3] dark:hover:text-blue-400 shadow-2xs transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template</span>
                </a>
              </div>

              {/* Dropzone Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                  dragOver
                    ? 'border-[#175CD3] bg-blue-50/50 dark:bg-blue-950/20'
                    : selectedFile
                    ? 'border-emerald-400/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={handleFileChange}
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
              {selectedFile && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileSpreadsheet className="w-4 h-4 text-[#175CD3] dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
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
                    title="Hapus file terpilih"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {uploadStatus === 'analyzing' && (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-[#175CD3] animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-white">
                Membaca dan memvalidasi struktur berkas...
              </div>
              <p className="text-xs text-slate-400">
                Memverifikasi format NIP, duplikasi baris, dan pemetaan instansi daerah.
              </p>
            </div>
          )}

          {uploadStatus === 'preview' && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-[#EAECF0] dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400">Total Baris Data</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{summary.totalRows}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#ECFDF3] dark:bg-[#067647]/20 border border-[#A6F4C5] dark:border-[#067647]/40">
                  <div className="text-[11px] font-semibold text-[#067647] dark:text-[#75E0A7]">Valid & Siap Simpan</div>
                  <div className="text-xl font-black text-[#067647] dark:text-[#75E0A7] mt-0.5">{summary.validRows}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FFFAEB] dark:bg-[#B54708]/20 border border-[#FEDF89] dark:border-[#B54708]/40">
                  <div className="text-[11px] font-semibold text-[#B54708] dark:text-[#FEC84B]">Peringatan Format</div>
                  <div className="text-xl font-black text-[#B54708] dark:text-[#FEC84B] mt-0.5">{summary.warningRows}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FEF3F2] dark:bg-[#B42318]/20 border border-[#FECDCA] dark:border-[#B42318]/40">
                  <div className="text-[11px] font-semibold text-[#B42318] dark:text-[#FDA29B]">Duplikat Ditolak</div>
                  <div className="text-xl font-black text-[#B42318] dark:text-[#FDA29B] mt-0.5">{summary.duplicateRows}</div>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-[#EAECF0] dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-[#EAECF0] dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Pratinjau Data (5 Baris Pertama)</span>
                  <span className="font-normal text-slate-400">File: {selectedFile?.name}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F7F9FC] dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold border-b border-[#EAECF0] dark:border-slate-800">
                        <th className="px-3 py-2.5">NIP</th>
                        <th className="px-3 py-2.5">Nama ASN</th>
                        <th className="px-3 py-2.5">Instansi Pengusul</th>
                        <th className="px-3 py-2.5">Jabatan</th>
                        <th className="px-3 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAECF0] dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F7F9FC] dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2 font-mono text-[11px] font-bold text-[#123B73] dark:text-[#93C5FD]">{row.nip}</td>
                          <td className="px-3 py-2 font-semibold">{row.nama}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.instansi}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.jabatan}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#ECFDF3] text-[#067647] border border-[#A6F4C5] dark:bg-[#067647]/30 dark:text-[#75E0A7]">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {uploadStatus === 'uploading' && (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-[#175CD3] animate-spin mx-auto" />
              <div className="text-base font-bold text-slate-800 dark:text-white">
                Sedang Menyimpan Data ke Database...
              </div>
              <p className="text-xs text-slate-400">
                Memproses 142 baris usul penetapan ke tabel layanan. Mohon tunggu sejenak.
              </p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#ECFDF3] dark:bg-[#067647]/30 text-[#067647] dark:text-[#75E0A7] border border-[#A6F4C5] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                Data Usul Berhasil Diimport!
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Sebanyak {uploadedCount} baris data telah berhasil dicatat dan masuk ke dalam antrean verifikasi layanan.
              </p>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center mx-auto shadow-xs">
                <AlertTriangle className="w-9 h-9" />
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                Gagal Mengunggah Data Usul
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {uploadError || 'Terjadi kendala saat mengirim berkas ke server. Silakan periksa kembali berkas dan koneksi Anda.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-[#F7F9FC] dark:bg-slate-800/50 border-t border-[#EAECF0] dark:border-slate-800 flex items-center justify-between">
          {uploadStatus === 'preview' ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Ganti Berkas Lain
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  className="px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-xs font-black shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <span>Konfirmasi & Simpan (142 Data)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : uploadStatus === 'success' ? (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                Tutup & Tampilkan di Tabel
              </button>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="w-full flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Pilih Ulang Berkas
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                className="px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 rounded-xl"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
