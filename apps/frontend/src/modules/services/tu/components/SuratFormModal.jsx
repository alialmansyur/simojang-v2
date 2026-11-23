import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Mail } from 'lucide-react'
import { SearchableSelect } from '../../../../components/ui/SearchableSelect'
import {
  storeSuratData,
  fetchJenisNaskahList,
  fetchNaskahList,
} from '../../../../services/api/tuServicesApi'

export const JENIS_NASKAH_MASTER = [
  { value: '1', label: 'Surat Masuk (SM)', kode: 'SM', nama: 'Surat Masuk' },
  { value: '2', label: 'Surat Keluar (SK)', kode: 'SK', nama: 'Surat Keluar' },
]

export const KLASIFIKASI_NASKAH_MASTER = [
  // Surat Masuk (jenis_id: 1)
  { value: '1', label: 'PR - PERENCANAAN', kode: 'PR', nama: 'PERENCANAAN', jenis_id: '1' },
  { value: '2', label: 'KU - KEUANGAN', kode: 'KU', nama: 'KEUANGAN', jenis_id: '1' },
  { value: '3', label: 'KP - KEPEGAWAIAN', kode: 'KP', nama: 'KEPEGAWAIAN', jenis_id: '1' },
  { value: '4', label: 'OT - ORGANISASI DAN TATA LAKSANA', kode: 'OT', nama: 'ORGANISASI DAN TATA LAKSANA', jenis_id: '1' },
  { value: '5', label: 'AR - KEARSIPAN', kode: 'AR', nama: 'KEARSIPAN', jenis_id: '1' },
  { value: '6', label: 'PL - PERLENGKAPAN', kode: 'PL', nama: 'PERLENGKAPAN', jenis_id: '1' },
  { value: '7', label: 'RT - RUMAHTANGGAAN', kode: 'RT', nama: 'RUMAHTANGGAAN', jenis_id: '1' },
  { value: '8', label: 'HM - HUBUNGAN MASYARAKAT', kode: 'HM', nama: 'HUBUNGAN MASYARAKAT', jenis_id: '1' },
  { value: '9', label: 'AI - AUDIT INTERNAL', kode: 'AI', nama: 'AUDIT INTERNAL', jenis_id: '1' },
  { value: '10', label: 'BM - PEMBINAAN MANAJEMEN KEPEGAWAIAN', kode: 'BM', nama: 'PEMBINAAN MANAJEMEN KEPEGAWAIAN', jenis_id: '1' },
  { value: '11', label: 'AU - PERATURAN PERUNDANGAN', kode: 'AU', nama: 'PERATURAN PERUNDANGAN', jenis_id: '1' },
  { value: '12', label: 'MP - MUTASI KEPEGAWAIAN', kode: 'MP', nama: 'MUTASI KEPEGAWAIAN', jenis_id: '1' },
  { value: '13', label: 'SI - SISTEM INFORMASI KEPEGAWAIAN', kode: 'SI', nama: 'SISTEM INFORMASI KEPEGAWAIAN', jenis_id: '1' },
  { value: '14', label: 'AK - PENGAWASAN DAN PENGENDALIAN', kode: 'AK', nama: 'PENGAWASAN DAN PENGENDALIAN', jenis_id: '1' },
  { value: '15', label: 'BP - KEBUTUHAN PEGAWAI', kode: 'BP', nama: 'KEBUTUHAN PEGAWAI', jenis_id: '1' },
  { value: '16', label: 'BJ - PEMBINAAN JABATAN FUNGSIONAL KEPEGAWAIAN', kode: 'BJ', nama: 'PEMBINAAN JABATAN FUNGSIONAL KEPEGAWAIAN', jenis_id: '1' },
  { value: '17', label: 'KS - PENGEMBANGAN SISTEM REKRUTMEN ASN', kode: 'KS', nama: 'PENGEMBANGAN SISTEM REKRUTMEN ASN', jenis_id: '1' },
  { value: '18', label: 'NK - PENILAIAN KOMPETENSI', kode: 'NK', nama: 'PENILAIAN KOMPETENSI', jenis_id: '1' },
  { value: '19', label: 'KA - PENGEMBANGAN ASN', kode: 'KA', nama: 'PENGEMBANGAN ASN', jenis_id: '1' },
  { value: '20', label: 'KB - KONSULTASI HUKUM', kode: 'KB', nama: 'KONSULTASI HUKUM', jenis_id: '1' },

  // Surat Keluar (jenis_id: 2)
  { value: '21', label: 'ST - SURAT TUGAS', kode: 'ST', nama: 'SURAT TUGAS', jenis_id: '2' },
  { value: '22', label: 'SD - SURAT DINAS', kode: 'SD', nama: 'SURAT DINAS', jenis_id: '2' },
  { value: '23', label: 'ND - NOTA DINAS', kode: 'ND', nama: 'NOTA DINAS', jenis_id: '2' },
  { value: '24', label: 'SKP - SURAT KEPUTUSAN', kode: 'SKP', nama: 'SURAT KEPUTUSAN', jenis_id: '2' },
  { value: '25', label: 'UI - UNDANGAN INTERNAL', kode: 'UI', nama: 'UNDANGAN INTERNAL', jenis_id: '2' },
  { value: '26', label: 'BA - BERITA ACARA', kode: 'BA', nama: 'BERITA ACARA', jenis_id: '2' },
  { value: '27', label: 'UE - UNDANGAN EKSTERNAL', kode: 'UE', nama: 'UNDANGAN EKSTERNAL', jenis_id: '2' },
  { value: '28', label: 'SKT - SURAT KETERANGAN', kode: 'SKT', nama: 'SURAT KETERANGAN', jenis_id: '2' },
  { value: '29', label: 'SP - SURAT PERINTAH', kode: 'SP', nama: 'SURAT PERINTAH', jenis_id: '2' },
  { value: '30', label: 'SUKU - SURAT KUASA', kode: 'SUKU', nama: 'SURAT KUASA', jenis_id: '2' },
]

export function SuratFormModal({ isOpen, onClose, onSuccess, initialData }) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [jenis, setJenis] = useState('1')
  const [klasifikasi, setKlasifikasi] = useState('1')
  const [summary, setSummary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // State untuk master options dari API
  const [jenisOptions, setJenisOptions] = useState(JENIS_NASKAH_MASTER)
  const [allKlasifikasi, setAllKlasifikasi] = useState(KLASIFIKASI_NASKAH_MASTER)

  // Load master jenis naskah & klasifikasi dari backend jika tersedia
  useEffect(() => {
    let mounted = true

    async function loadMasters() {
      try {
        const [resJenis, resKlasifikasi] = await Promise.allSettled([
          fetchJenisNaskahList(),
          fetchNaskahList(),
        ])

        if (!mounted) return

        if (resJenis.status === 'fulfilled' && Array.isArray(resJenis.value) && resJenis.value.length > 0) {
          setJenisOptions(
            resJenis.value.map((item) => ({
              value: String(item.id || item.value),
              label: item.label || `${item.kode || ''} - ${item.nama || ''}`.trim(),
              kode: item.kode,
              nama: item.nama,
            }))
          )
        }

        if (resKlasifikasi.status === 'fulfilled' && Array.isArray(resKlasifikasi.value) && resKlasifikasi.value.length > 0) {
          setAllKlasifikasi(
            resKlasifikasi.value.map((item) => ({
              value: String(item.id || item.value),
              label: item.label || `${item.kode || ''} - ${item.nama || ''}`.trim(),
              kode: item.kode,
              nama: item.nama,
              jenis_id: String(item.jenis_id || ''),
            }))
          )
        }
      } catch (e) {
        console.warn('Error loading persuratan options:', e)
      }
    }

    if (isOpen) {
      loadMasters()
    }

    return () => {
      mounted = false
    }
  }, [isOpen])

  useEffect(() => {
    if (initialData) {
      const initJenis = String(initialData.jenis_id || '1')
      const initKlasifikasi = String(initialData.klasifikasi_id || '1')
      setPeriod(initialData.period || new Date().toISOString().slice(0, 7))
      setStartDate(initialData.period_start_date || new Date().toISOString().slice(0, 10))
      setEndDate(initialData.period_end_date || new Date().toISOString().slice(0, 10))
      setJenis(initJenis)
      setKlasifikasi(initKlasifikasi)
      setSummary(initialData.total || '')
    } else {
      setPeriod(new Date().toISOString().slice(0, 7))
      setStartDate(new Date().toISOString().slice(0, 10))
      setEndDate(new Date().toISOString().slice(0, 10))
      setJenis('1')
      setKlasifikasi('1')
      setSummary('')
    }
    setErrorMsg('')
  }, [initialData, isOpen])

  // Filter klasifikasi sesuai jenis_id yang dipilih
  const filteredKlasifikasiOptions = useMemo(() => {
    const list = allKlasifikasi.filter((item) => String(item.jenis_id) === String(jenis))
    return list.length > 0 ? list : allKlasifikasi
  }, [allKlasifikasi, jenis])

  // Handle pergantian jenis naskah -> sesuaikan klasifikasi otomatis jika tidak relevan
  const handleJenisChange = (newJenis) => {
    const resolvedJenis = typeof newJenis === 'object' && newJenis !== null ? newJenis.value : newJenis
    const nextJenisStr = String(resolvedJenis || '1')
    setJenis(nextJenisStr)

    // Periksa apakah klasifikasi terpilih saat ini valid di bawah jenis baru
    const validInNewJenis = allKlasifikasi.filter((item) => String(item.jenis_id) === nextJenisStr)
    const stillValid = validInNewJenis.some((item) => String(item.value) === String(klasifikasi))
    if (!stillValid && validInNewJenis.length > 0) {
      setKlasifikasi(String(validInNewJenis[0].value))
    }
  }

  const handleKlasifikasiChange = (newKlas) => {
    const resolvedKlas = typeof newKlas === 'object' && newKlas !== null ? newKlas.value : newKlas
    setKlasifikasi(String(resolvedKlas || ''))
  }

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!summary) {
      setErrorMsg('Harap lengkapi jumlah naskah dinas.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await storeSuratData({
        key: initialData?.id || '',
        period,
        syncdate1: startDate,
        syncdate2: endDate,
        jenis,
        klasifikasi,
        summary,
      })

      if (onSuccess) onSuccess()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data persuratan.')
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Data Naskah Dinas' : 'Input Data Naskah Dinas Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tata naskah dinas dan kearsipan Kantor Regional III BKN
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Periode</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Jenis Naskah <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                options={jenisOptions}
                value={jenis}
                onChange={handleJenisChange}
                placeholder="-- Pilih Jenis Naskah --"
                isClearable={false}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Selesai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Klasifikasi Kearsipan ({jenis === '1' ? 'Surat Masuk' : 'Surat Keluar'}) <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              options={filteredKlasifikasiOptions}
              value={klasifikasi}
              onChange={handleKlasifikasiChange}
              placeholder="-- Cari atau pilih klasifikasi naskah --"
              isClearable={false}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jumlah Naskah / Dokumen</label>
            <input
              type="number"
              min="1"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Misal: 48"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
            />
          </div>

          {/* Footer Actions */}
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
              <span>{initialData ? 'Simpan Perubahan' : 'Tambah Naskah'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
