import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, ShieldCheck, UserPlus, Search } from 'lucide-react'
import {
  storeDisiplinData,
  fetchDisiplinOptions,
} from '../../../../services/api/pmaServicesApi'
import { SearchableInstansiSelect } from './SearchableInstansiSelect'

function parseInitialPegawaiIds(rawIds) {
  if (Array.isArray(rawIds)) {
    return rawIds.map((v) => Number(v)).filter((n) => n > 0)
  }
  if (typeof rawIds === 'string' && rawIds.trim()) {
    return rawIds
      .split(/[,|]+/)
      .map((v) => Number(v.trim()))
      .filter((n) => n > 0)
  }
  return []
}

export function DisiplinCitraFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
  initialData = null,
}) {
  const activeItem = editingItem || initialData
  const isEdit = Boolean(activeItem?.id)

  const buildInitialForm = (item) => {
    if (item) {
      return {
        key: item.id || '',
        instansi: item.instansi_id || '',
        kategori_id: Number(item.kategori_id) || 1,
        period_year: Number(item.period_year) || new Date().getFullYear(),
        period_date: item.period_date ? String(item.period_date).split(' ')[0] : '',
        source_konsultasi: item.source_konsultasi || 'SURAT_MASUK',
        tempat_kegiatan: item.tempat_kegiatan || '',
        judul_kegiatan: item.judul_kegiatan || '',
        no_surat_kegiatan: item.no_surat_kegiatan || '',
        catatan: item.catatan || '',
        pegawai_ids: parseInitialPegawaiIds(item.pegawai_ids),
      }
    }
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    return {
      key: '',
      instansi: '',
      kategori_id: 1,
      period_year: now.getFullYear(),
      period_date: today,
      source_konsultasi: 'SURAT_MASUK',
      tempat_kegiatan: '',
      judul_kegiatan: '',
      no_surat_kegiatan: '',
      catatan: '',
      pegawai_ids: [],
    }
  }

  const [formData, setFormData] = useState(() => buildInitialForm(activeItem))
  const [prevSyncKey, setPrevSyncKey] = useState(() => `${isOpen ? '1' : '0'}:${activeItem?.id || 'new'}`)

  const [kategoriList, setKategoriList] = useState([
    { id: 1, jenis_layanan: 'ASISTENSI', nama: 'Asistensi Disiplin, Budaya Kerja & Citra Institusi' },
    { id: 2, jenis_layanan: 'KONSULTASI', nama: 'Konsultasi/Pendampingan Disiplin, Budaya Kerja & Citra Institusi' },
    { id: 3, jenis_layanan: 'REGULASI', nama: 'Regulasi budaya kerja berakhlak' },
  ])
  const [pegawaiList, setPegawaiList] = useState([])
  const [pegawaiSearch, setPegawaiSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const currentSyncKey = `${isOpen ? '1' : '0'}:${activeItem?.id || 'new'}`
  if (currentSyncKey !== prevSyncKey) {
    setPrevSyncKey(currentSyncKey)
    if (isOpen) {
      setFormData(buildInitialForm(activeItem))
      setPegawaiSearch('')
      setErrorMsg('')
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handler = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose?.()
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handler)
    }
  }, [isOpen, isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen) return

    let active = true
    fetchDisiplinOptions()
      .then((opt) => {
        if (!active) return
        if (Array.isArray(opt?.kategori) && opt.kategori.length > 0) {
          setKategoriList(opt.kategori)
        }
        if (Array.isArray(opt?.pegawai) && opt.pegawai.length > 0) {
          setPegawaiList(opt.pegawai)
        }
      })
      .catch((err) => {
        if (active) setErrorMsg((prev) => prev || err?.message || 'Gagal memuat opsi pembinaan disiplin.')
      })

    return () => {
      active = false
    }
  }, [isOpen])

  const selectedKategori = useMemo(() => {
    return (
      kategoriList.find((k) => Number(k.id) === Number(formData.kategori_id)) ||
      kategoriList[0] ||
      { id: 1, jenis_layanan: 'ASISTENSI' }
    )
  }, [kategoriList, formData.kategori_id])

  const jenisLayanan = String(selectedKategori?.jenis_layanan || 'ASISTENSI').toUpperCase()
  const requiresPegawai = jenisLayanan === 'ASISTENSI' || jenisLayanan === 'PEMBINAAN'
  const requiresKegiatanDetail =
    jenisLayanan === 'ASISTENSI' || jenisLayanan === 'PEMBINAAN' || jenisLayanan === 'REGULASI'

  const filteredPegawai = useMemo(() => {
    const q = pegawaiSearch.trim().toLowerCase()
    if (!q) return pegawaiList.slice(0, 20)
    return pegawaiList
      .filter(
        (p) =>
          String(p.nama || '').toLowerCase().includes(q) ||
          String(p.nip || '').toLowerCase().includes(q)
      )
      .slice(0, 20)
  }, [pegawaiList, pegawaiSearch])

  const selectedPegawaiObjects = useMemo(() => {
    const map = new Map(pegawaiList.map((p) => [Number(p.id), p]))
    const fallbackNames = String(activeItem?.pegawai_names || '')
      .split('||')
      .map((s) => s.trim())
      .filter(Boolean)
    const fallbackIds = parseInitialPegawaiIds(activeItem?.pegawai_ids)

    return (formData.pegawai_ids || []).map((id) => {
      const numId = Number(id)
      if (map.has(numId)) return map.get(numId)
      const fallbackIdx = fallbackIds.indexOf(numId)
      return {
        id: numId,
        nama: fallbackIdx >= 0 && fallbackNames[fallbackIdx] ? fallbackNames[fallbackIdx] : `Pegawai #${numId}`,
        nip: '',
      }
    })
  }, [formData.pegawai_ids, pegawaiList, activeItem])

  if (!isOpen || typeof document === 'undefined') return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'period_date' && value) {
        const y = Number(String(value).slice(0, 4))
        if (y > 2000) next.period_year = y
      }
      return next
    })
  }

  const togglePegawai = (pegawaiId) => {
    const numId = Number(pegawaiId)
    if (!numId) return
    setFormData((prev) => {
      const exists = prev.pegawai_ids.includes(numId)
      return {
        ...prev,
        pegawai_ids: exists
          ? prev.pegawai_ids.filter((id) => id !== numId)
          : [...prev.pegawai_ids, numId],
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.instansi) {
      setErrorMsg('Pilih instansi pengusul / daerah terlebih dahulu.')
      return
    }
    if (!formData.period_date) {
      setErrorMsg('Tanggal kegiatan wajib dipilih.')
      return
    }
    if (requiresKegiatanDetail && !formData.judul_kegiatan.trim()) {
      setErrorMsg('Judul kegiatan / regulasi wajib diisi.')
      return
    }
    if (requiresKegiatanDetail && !formData.no_surat_kegiatan.trim()) {
      setErrorMsg('Nomor surat / regulasi wajib diisi.')
      return
    }
    if ((jenisLayanan === 'ASISTENSI' || jenisLayanan === 'PEMBINAAN') && !formData.tempat_kegiatan.trim()) {
      setErrorMsg('Tempat kegiatan wajib diisi untuk layanan Asistensi / Pembinaan.')
      return
    }
    if (requiresPegawai && (!formData.pegawai_ids || formData.pegawai_ids.length === 0)) {
      setErrorMsg('Minimal satu petugas pelaksana (pegawai) wajib dipilih.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await storeDisiplinData({
        key: formData.key,
        instansi: formData.instansi,
        kategori_id: formData.kategori_id,
        period_year: formData.period_year,
        period_date: formData.period_date,
        source_konsultasi: formData.source_konsultasi,
        tempat_kegiatan: formData.tempat_kegiatan.trim() || null,
        judul_kegiatan: formData.judul_kegiatan.trim() || null,
        no_surat_kegiatan: formData.no_surat_kegiatan.trim() || null,
        catatan: formData.catatan || '',
        pegawai_ids: formData.pegawai_ids,
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data pembinaan disiplin & budaya kerja.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Ubah Agenda Pembinaan Disiplin' : 'Tambah Agenda Pembinaan Disiplin'}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Ubah Agenda Pembinaan Disiplin' : 'Tambah Agenda Pembinaan Disiplin'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Layanan 16 — Pembinaan Disiplin, Budaya Kerja & Citra Institusi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto clean-scrollbar">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Instansi Select (Searchable via react-select) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Instansi Pemerintah Daerah <span className="text-rose-500">*</span>
            </label>
            <SearchableInstansiSelect
              name="instansi"
              value={formData.instansi}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  instansi: typeof val === 'object' && val?.target ? val.target.value : val,
                }))
              }
              initialLabel={activeItem?.instansi_name || activeItem?.instansi}
              placeholder="Cari nama instansi pemerintah daerah..."
              required
            />
          </div>

          {/* Kategori & Sumber Konsultasi (2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kategori Layanan <span className="text-rose-500">*</span>
              </label>
              <select
                name="kategori_id"
                value={formData.kategori_id}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                {kategoriList.map((kat) => (
                  <option key={kat.id} value={kat.id}>
                    {kat.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kanal / Media Layanan {jenisLayanan === 'KONSULTASI' && <span className="text-rose-500">*</span>}
              </label>
              <select
                name="source_konsultasi"
                value={formData.source_konsultasi}
                onChange={handleChange}
                required={jenisLayanan === 'KONSULTASI'}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="SURAT_MASUK">Surat Masuk / Nota Dinas</option>
                <option value="ZOOM">Virtual Zoom / Daring</option>
                <option value="PPT">Tatap Muka Langsung (PPT / On-site)</option>
              </select>
            </div>
          </div>

          {/* Tanggal & No Surat (2 Kolom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tanggal Pelaksanaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="period_date"
                value={formData.period_date}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No. Surat / Regulasi {requiresKegiatanDetail && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                name="no_surat_kegiatan"
                value={formData.no_surat_kegiatan}
                onChange={handleChange}
                required={requiresKegiatanDetail}
                placeholder="Contoh: 800/123/BKD"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Judul Kegiatan / Konsultasi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Judul Kegiatan / Topik / Regulasi {requiresKegiatanDetail && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              name="judul_kegiatan"
              value={formData.judul_kegiatan}
              onChange={handleChange}
              placeholder="Contoh: Asistensi Penegakan Disiplin ASN Berdasarkan PP 94/2021"
              required={requiresKegiatanDetail}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Tempat Kegiatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tempat Kegiatan {(jenisLayanan === 'ASISTENSI' || jenisLayanan === 'PEMBINAAN') && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              name="tempat_kegiatan"
              value={formData.tempat_kegiatan}
              onChange={handleChange}
              required={jenisLayanan === 'ASISTENSI' || jenisLayanan === 'PEMBINAAN'}
              placeholder="Kanreg III BKN Bandung / Daring Zoom"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Petugas Pelaksana (Pegawai Multi-Select) */}
          <div className="space-y-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#175CD3] dark:text-blue-400" />
                <span>
                  Petugas Pelaksana (Pegawai BKN){' '}
                  {requiresPegawai && <span className="text-rose-500">*</span>}
                </span>
              </label>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {formData.pegawai_ids.length} dipilih
              </span>
            </div>

            {selectedPegawaiObjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedPegawaiObjects.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/60 text-xs font-semibold text-[#175CD3] dark:text-blue-300"
                  >
                    <span className="truncate max-w-[220px]">{p.nama}</span>
                    <button
                      type="button"
                      onClick={() => togglePegawai(p.id)}
                      className="text-blue-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                      title="Hapus petugas"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={pegawaiSearch}
                onChange={(e) => setPegawaiSearch(e.target.value)}
                placeholder="Cari nama atau NIP pegawai..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#175CD3]"
              />
            </div>

            <div className="max-h-32 overflow-y-auto clean-scrollbar divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900">
              {filteredPegawai.length === 0 ? (
                <p className="p-2.5 text-center text-[11px] text-slate-400">
                  Tidak ada pegawai yang cocok dengan pencarian.
                </p>
              ) : (
                filteredPegawai.map((p) => {
                  const isChecked = formData.pegawai_ids.includes(Number(p.id))
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50/70 dark:bg-blue-950/30 font-semibold text-[#175CD3] dark:text-blue-300'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePegawai(p.id)}
                          className="rounded border-slate-300 text-[#175CD3] focus:ring-[#175CD3]"
                        />
                        <span className="truncate">{p.nama}</span>
                      </div>
                      {p.nip && (
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {p.nip}
                        </span>
                      )}
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* Catatan / Tindak Lanjut */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Catatan / Kesimpulan Asistensi
            </label>
            <textarea
              name="catatan"
              rows={2}
              value={formData.catatan}
              onChange={handleChange}
              placeholder="Catatan poin kesepakatan atau tindak lanjut instansi terkait..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all clean-scrollbar"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white shadow-2xs hover:shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Perbarui Data' : 'Simpan Data'}</span>
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
