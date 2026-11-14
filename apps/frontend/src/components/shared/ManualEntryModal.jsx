import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, PlusCircle, CheckCircle2, User, Building, FileBadge, Calendar, Hash, AlertCircle } from 'lucide-react'
import { InstansiSearchableSelect } from './InstansiSearchableSelect'

export function ManualEntryModal({
  isOpen,
  onClose,
  serviceTitle = 'Penetapan NIP ASN',
  layananId,
  onSubmitSuccess,
}) {
  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    instansi: '',
    instansiNama: '',
    jabatan: '',
    nomorSk: '',
    tanggalUsul: new Date().toISOString().split('T')[0],
    keterangan: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleInstansiChange = (val, selectedObj) => {
    setFormData((prev) => ({
      ...prev,
      instansi: val || '',
      instansiNama: selectedObj?.label || '',
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nip || !formData.nama) {
      setErrorMsg('Mohon isi Nomor Induk Pegawai (NIP) dan Nama Lengkap ASN.')
      return
    }
    if (!formData.instansi) {
      setErrorMsg('Silakan pilih instansi pengusul daerah.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    setTimeout(() => {
      setIsSubmitting(false)
      if (onSubmitSuccess) {
        onSubmitSuccess({
          ...formData,
          layananId,
          status: 'Menunggu Verifikasi',
          tanggal: formData.tanggalUsul,
        })
      }
      onClose()
    }, 500)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-[#175CD3]/20 dark:border-[#175CD3]/40 flex items-center justify-center text-[#175CD3] dark:text-blue-400">
              <PlusCircle className="w-5 h-5 text-[#175CD3]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Tambah Catatan Data Usul Manual
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Layanan: <span className="font-bold text-[#175CD3] dark:text-blue-400">{serviceTitle}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto clean-scrollbar p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* NIP Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Nomor Induk Pegawai (NIP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="nip"
                maxLength={18}
                value={formData.nip}
                onChange={handleChange}
                placeholder="199001012015011001"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 focus:border-[#175CD3] font-mono"
              />
            </div>

            {/* Nama ASN */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nama Lengkap ASN (dengan Gelar) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                placeholder="Drs. H. Mulyana, M.M."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 focus:border-[#175CD3] font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Searchable Instansi Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Instansi Pengusul Daerah <span className="text-rose-500">*</span>
              </label>
              <InstansiSearchableSelect
                value={formData.instansi}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    instansi: e.value || '',
                    instansiNama: e.label || '',
                  }))
                }}
                required
              />
            </div>

            {/* Jabatan Target */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileBadge className="w-3.5 h-3.5 text-slate-400" />
                Jabatan / Formasi Usul
              </label>
              <input
                type="text"
                name="jabatan"
                value={formData.jabatan}
                onChange={handleChange}
                placeholder="Analis Kebijakan Ahli Muda"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 focus:border-[#175CD3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nomor SK / Usul */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Nomor Surat Usul Instansi
              </label>
              <input
                type="text"
                name="nomorSk"
                value={formData.nomorSk}
                onChange={handleChange}
                placeholder="800/124/BKPSDM/2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 focus:border-[#175CD3]"
              />
            </div>

            {/* Tanggal Usul */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tanggal Usul Berkas
              </label>
              <input
                type="date"
                name="tanggalUsul"
                value={formData.tanggalUsul}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 focus:border-[#175CD3]"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan / Keterangan Tambahan
            </label>
            <textarea
              name="keterangan"
              rows={3}
              value={formData.keterangan}
              onChange={handleChange}
              placeholder="Catatan verifikator, kelengkapan berkas fisik/digital SIASN..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 focus:border-[#175CD3] resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Usul'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
