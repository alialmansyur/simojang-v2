import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import { SearchableSelect } from '../../../SearchableSelect'
import {
  fetchInstansiOptions,
  fetchPnbpTilokOptions as fetchTilokOptions,
  savePnbpDocument,
} from '../../../../services/api/sidigiServicesApi'

export function PnbpFormModal({
  isOpen,
  onClose,
  onSuccess,
  serviceTitle = 'Dokumen Seleksi PNBP CAT',
}) {
  const [instansiList, setInstansiList] = useState([])
  const [tilokList, setTilokList] = useState([])
  const [selectedInstansi, setSelectedInstansi] = useState('')
  const [selectedTilok, setSelectedTilok] = useState('')
  const [docType, setDocType] = useState('Surat Perjanjian Kerja Sama (PKS)')
  const [docNumber, setDocNumber] = useState('')
  const [docDate, setDocDate] = useState(() => new Date().toISOString().split('T')[0])
  const [keterangan, setKeterangan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const docTypeOptions = [
    { value: 'Surat Perjanjian Kerja Sama (PKS)', label: 'Surat Perjanjian Kerja Sama (PKS)' },
    { value: 'Berita Acara Serah Terima (BAST)', label: 'Berita Acara Serah Terima (BAST)' },
    { value: 'Surat Permohonan Fasilitasi', label: 'Surat Permohonan Fasilitasi CAT' },
    { value: 'Laporan Realisasi PNBP', label: 'Laporan Realisasi PNBP' },
    { value: 'Berita Acara Pelaksanaan Ujian', label: 'Berita Acara Pelaksanaan Ujian' },
    { value: 'Bukti Setor Billing PNBP', label: 'Bukti Setor Billing PNBP Simponi' },
  ]

  useEffect(() => {
    if (isOpen) {
      fetchInstansiOptions()
        .then(setInstansiList)
        .catch((err) => setErrorMsg((prev) => prev || err?.message || 'Gagal memuat daftar instansi.'))
      fetchTilokOptions()
        .then(setTilokList)
        .catch((err) => setErrorMsg((prev) => prev || err?.message || 'Gagal memuat daftar titik lokasi.'))
      setDocNumber(`PNBP/CAT/III/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!docNumber || !docType) {
      setErrorMsg('Nomor Dokumen dan Jenis Dokumen wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const tilokObj = tilokList.find((t) => String(t.id) === String(selectedTilok))

      await savePnbpDocument({
        doc_type: docType,
        doc_number: docNumber,
        doc_date: docDate,
        instansi_id: selectedInstansi || null,
        tilok_id: selectedTilok || null,
        tilok_nama: tilokObj?.nama_tilok || 'Kantor Regional III BKN Bandung',
        keterangan: keterangan || 'Dokumen Pertanggungjawaban Seleksi PNBP CAT',
      })

      const successMsg = 'Dokumen pertanggungjawaban PNBP CAT berhasil dibuat.'
      toast.success(successMsg)

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const errMsg = err.message || 'Gagal menyimpan dokumen PNBP.'
      setErrorMsg(errMsg)
      toast.error(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header - Matching /layanan/cltn */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Buat Dokumen PNBP CAT Baru
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {serviceTitle} • Kantor Regional III BKN
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Jenis Dokumen PNBP <span className="text-rose-500">*</span>
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              >
                {docTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor Surat / Naskah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Instansi Mitra
              </label>
              <SearchableSelect
                value={selectedInstansi}
                onChange={(val) => setSelectedInstansi(val)}
                options={instansiList}
                placeholder="-- Pilih Instansi Mitra --"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Penetapan Dokumen <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Titik Lokasi (Tilok) Seleksi CAT
            </label>
            <select
              value={selectedTilok}
              onChange={(e) => setSelectedTilok(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            >
              <option value="">-- Tilok BKN Kanreg III Bandung (Utama) --</option>
              {tilokList.map((til) => (
                <option key={til.id} value={til.id}>
                  {til.nama_tilok || til.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Keterangan / Deskripsi Kegiatan
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Seleksi Mandiri Pengadaan Calon Pegawai ASN Tahun 2026."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          {/* Footer actions - Matching /layanan/cltn */}
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
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Dokumen</span>
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
