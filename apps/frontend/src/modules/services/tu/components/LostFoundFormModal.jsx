import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, UploadCloud, CheckCircle2, PackageSearch } from 'lucide-react'
import { storeLostFoundData } from '../../../../services/api/tuServicesApi'

export function LostFoundFormModal({ isOpen, onClose, onSuccess, initialData }) {
  const [namaBarang, setNamaBarang] = useState('')
  const [tanggalDitemukan, setTanggalDitemukan] = useState(new Date().toISOString().slice(0, 10))
  const [lokasiDitemukan, setLokasiDitemukan] = useState('')
  const [statusPenyerahan, setStatusPenyerahan] = useState('Belum Diserahkan')
  const [tanggalDiserahkan, setTanggalDiserahkan] = useState('')
  const [penerima, setPenerima] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [gambar, setGambar] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (initialData) {
      setNamaBarang(initialData.nama_barang || '')
      setTanggalDitemukan(initialData.tanggal_ditemukan || new Date().toISOString().slice(0, 10))
      setLokasiDitemukan(initialData.lokasi_ditemukan || '')
      setStatusPenyerahan(initialData.status_penyerahan || 'Belum Diserahkan')
      setTanggalDiserahkan(initialData.tanggal_diserahkan || '')
      setPenerima(initialData.penerima || '')
      setKeterangan(initialData.keterangan || '')
    } else {
      setNamaBarang('')
      setTanggalDitemukan(new Date().toISOString().slice(0, 10))
      setLokasiDitemukan('')
      setStatusPenyerahan('Belum Diserahkan')
      setTanggalDiserahkan('')
      setPenerima('')
      setKeterangan('')
    }
    setGambar(null)
    setErrorMsg('')
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!namaBarang || !lokasiDitemukan) {
      setErrorMsg('Harap lengkapi nama barang dan lokasi ditemukan.')
      return
    }

    if (statusPenyerahan === 'Diserahkan' && (!tanggalDiserahkan || !penerima)) {
      setErrorMsg('Harap lengkapi tanggal diserahkan dan nama penerima.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const formData = new FormData()
      formData.append('key', initialData?.id || '')
      formData.append('nama_barang', namaBarang)
      formData.append('tanggal_ditemukan', tanggalDitemukan)
      formData.append('lokasi_ditemukan', lokasiDitemukan)
      formData.append('status_penyerahan', statusPenyerahan)
      formData.append('keterangan', keterangan)
      if (statusPenyerahan === 'Diserahkan') {
        formData.append('tanggal_diserahkan', tanggalDiserahkan)
        formData.append('penerima', penerima)
      }
      if (gambar) {
        formData.append('gambar', gambar)
      }

      await storeLostFoundData(formData)
      if (onSuccess) onSuccess()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data barang hilang.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header (Matching /layanan/cltn) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Data Barang Temuan' : 'Input Data Barang Temuan Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pusat informasi barang hilang & ditemukan (Lost and Found) Kanreg III BKN
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto clean-scrollbar">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nama / Deskripsi Barang <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              placeholder="Misal: Dompet Kulit Cokelat a.n. Hendra Gunawan"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Ditemukan</label>
              <input
                type="date"
                value={tanggalDitemukan}
                onChange={(e) => setTanggalDitemukan(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Penyerahan</label>
              <select
                value={statusPenyerahan}
                onChange={(e) => setStatusPenyerahan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="Belum Diserahkan">Belum Diserahkan (Tersimpan)</option>
                <option value="Diserahkan">Sudah Diserahkan ke Pemilik</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lokasi Ditemukan</label>
            <input
              type="text"
              value={lokasiDitemukan}
              onChange={(e) => setLokasiDitemukan(e.target.value)}
              placeholder="Misal: Kursi Tunggu Meja PTSP Lantai 1 Gedung A"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
            />
          </div>

          {statusPenyerahan === 'Diserahkan' && (
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Informasi Penyerahan Barang
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Tgl Diserahkan</label>
                  <input
                    type="date"
                    value={tanggalDiserahkan}
                    onChange={(e) => setTanggalDiserahkan(e.target.value)}
                    required={statusPenyerahan === 'Diserahkan'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Nama Penerima</label>
                  <input
                    type="text"
                    value={penerima}
                    onChange={(e) => setPenerima(e.target.value)}
                    placeholder="Nama & No. HP Penerima"
                    required={statusPenyerahan === 'Diserahkan'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Keterangan / Kondisi Barang</label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan ciri-ciri fisik barang atau identitas yang tertera..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unggah Foto Barang (Opsional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setGambar(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {/* Footer Actions (Matching /layanan/cltn) */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Barang Temuan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
