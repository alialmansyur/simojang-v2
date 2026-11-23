import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Plus, Trash2, Receipt, AlertCircle, Info } from 'lucide-react'
import { SearchableSelect } from '../../../../components/ui/SearchableSelect'
import {
  fetchAnggaranOptions,
  fetchAnggaranStrukturSelect,
  fetchAnggaranDetail,
  storeAnggaranData,
} from '../../../../services/api/tuServicesApi'

const STATUS_OPTIONS = [
  { value: 'POSTED', label: 'POSTED (Sah Cair)' },
  { value: 'PENDING', label: 'PENDING (Dalam Proses)' },
]

export function AnggaranFormModal({ isOpen, onClose, onSuccess, initialData }) {
  const [tahunId, setTahunId] = useState('1')
  const [periodDate, setPeriodDate] = useState(new Date().toISOString().slice(0, 10))
  const [noSpm, setNoSpm] = useState('')
  const [spmDate, setSpmDate] = useState(new Date().toISOString().slice(0, 10))
  const [noSp2d, setNoSp2d] = useState('')
  const [sp2dDate, setSp2dDate] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState('POSTED')
  const [keterangan, setKeterangan] = useState('')

  // Dynamic Item Realisasi Belanja
  const [items, setItems] = useState(() => [
    { id: Date.now(), struktur_id: '', nominal: '', keterangan: '' },
  ])

  // Options & Dropdowns
  const [yearOptions, setYearOptions] = useState([
    { id: 1, tahun: 2026, status: 'AKTIF' },
    { id: 2, tahun: 2025, status: 'ARSIP' },
  ])
  const [strukturOptions, setStrukturOptions] = useState([])
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch Options
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const loadInitOptions = async () => {
      try {
        const opts = await fetchAnggaranOptions()
        if (isMounted && opts?.years?.length) {
          setYearOptions(opts.years)
          const activeYr = opts.years.find((y) => Number(y.is_active || 0) === 1) || opts.years[0]
          if (!initialData?.id) {
            setTahunId(String(activeYr.id))
          }
        }
      } catch (err) {
        console.warn('Gagal memuat opsi tahun anggaran:', err)
      }
    }

    loadInitOptions()
    return () => {
      isMounted = false
    }
  }, [isOpen, initialData])

  // Fetch Struktur Options when tahunId or isOpen changes
  useEffect(() => {
    if (!isOpen) return
    let isMounted = true

    const selectedYrObj = yearOptions.find((y) => String(y.id) === String(tahunId))
    const targetYear = selectedYrObj?.tahun || ''

    fetchAnggaranStrukturSelect('', targetYear, 1000)
      .then((strukturs) => {
        if (isMounted && Array.isArray(strukturs)) {
          setStrukturOptions(strukturs)
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat opsi struktur anggaran:', err)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, tahunId, yearOptions])

  const formattedYearOptions = useMemo(() => {
    return yearOptions.map((y) => ({
      value: String(y.id),
      label: `Tahun ${y.tahun} ${y.status === 'AKTIF' || Number(y.is_active || 0) === 1 ? '(Aktif)' : ''}`.trim(),
      tahun: y.tahun,
    }))
  }, [yearOptions])

  const formattedStrukturOptions = useMemo(() => {
    return strukturOptions.map((st) => ({
      value: String(st.id ?? st.value),
      label: st.label || st.text || `${st.kode} - ${st.nama}`,
      kode: st.kode,
      nama: st.nama,
    }))
  }, [strukturOptions])

  // Handle Edit / Reset Form
  useEffect(() => {
    if (!isOpen) return

    setErrorMsg('')
    if (initialData?.id) {
      setTahunId(String(initialData.tahun_id || '1'))
      setPeriodDate(initialData.period_date || new Date().toISOString().slice(0, 10))
      setNoSpm(initialData.no_spm || '')
      setSpmDate(initialData.spm_date || new Date().toISOString().slice(0, 10))
      setNoSp2d(initialData.no_sp2d || '')
      setSp2dDate(initialData.sp2d_date || new Date().toISOString().slice(0, 10))
      setStatus(initialData.status || 'POSTED')
      setKeterangan(initialData.keterangan || '')

      // Fetch Detail Items from backend
      setIsLoadingDetail(true)
      fetchAnggaranDetail(initialData.id)
        .then((detail) => {
          if (detail?.items && detail.items.length > 0) {
            setItems(
              detail.items.map((it) => ({
                id: it.id || Math.random(),
                struktur_id: String(it.struktur_id || ''),
                nominal: String(it.nominal || ''),
                keterangan: it.keterangan || '',
              }))
            )
          } else {
            // Fallback to single item from header
            setItems([
              {
                id: Date.now(),
                struktur_id: '',
                nominal: String(initialData.nominal || ''),
                keterangan: initialData.keterangan || '',
              },
            ])
          }
        })
        .catch((err) => {
          console.warn('Gagal fetch detail anggaran:', err)
          setItems([
            {
              id: Date.now(),
              struktur_id: '',
              nominal: String(initialData.nominal || ''),
              keterangan: initialData.keterangan || '',
            },
          ])
        })
        .finally(() => {
          setIsLoadingDetail(false)
        })
    } else {
      // Create New
      setTahunId('1')
      setPeriodDate(new Date().toISOString().slice(0, 10))
      setNoSpm('')
      setSpmDate(new Date().toISOString().slice(0, 10))
      setNoSp2d('')
      setSp2dDate(new Date().toISOString().slice(0, 10))
      setStatus('POSTED')
      setKeterangan('')
      setItems([{ id: Date.now(), struktur_id: '', nominal: '', keterangan: '' }])
    }
  }, [initialData, isOpen])

  // Total Nominal Calculation
  const totalNominal = useMemo(() => {
    return items.reduce((acc, curr) => {
      const num = Number(String(curr.nominal).replace(/[^0-9]/g, '')) || 0
      return acc + num
    }, 0)
  }, [items])

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0))
  }

  // Row Manipulation
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), struktur_id: '', nominal: '', keterangan: '' },
    ])
  }

  const handleRemoveItem = (id) => {
    if (items.length <= 1) {
      setErrorMsg('Minimal satu item belanja harus ada dalam transaksi SPM/SP2D.')
      return
    }
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const handleItemChange = (id, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    )
  }

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!noSpm.trim() || !noSp2d.trim()) {
      setErrorMsg('Nomor SPM dan Nomor SP2D wajib diisi.')
      return
    }

    if (!items.length) {
      setErrorMsg('Minimal satu item belanja wajib ditambahkan.')
      return
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.struktur_id) {
        setErrorMsg(`Item belanja ke-${i + 1}: Silakan pilih Akun Belanja (Struktur DIPA).`)
        return
      }
      const nom = Number(String(it.nominal).replace(/[^0-9]/g, ''))
      if (!nom || nom <= 0) {
        setErrorMsg(`Item belanja ke-${i + 1}: Nominal belanja harus lebih dari 0.`)
        return
      }
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const res = await storeAnggaranData({
        key: initialData?.id || '',
        tahun_id: tahunId,
        period_date: periodDate,
        no_spm: noSpm.trim(),
        spm_date: spmDate,
        no_sp2d: noSp2d.trim(),
        sp2d_date: sp2dDate,
        nominal: totalNominal,
        status,
        keterangan: keterangan.trim(),
        items: items.map((it) => ({
          struktur_id: it.struktur_id,
          nominal: Number(String(it.nominal).replace(/[^0-9]/g, '')),
          keterangan: it.keterangan || '',
        })),
      })

      if (res?.status === 'success' || !res?.status) {
        if (onSuccess) onSuccess(res)
      } else {
        setErrorMsg(res?.message || 'Gagal menyimpan transaksi realisasi anggaran.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi realisasi anggaran.')
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Modal Header (Matching /layanan/cltn) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Realisasi Anggaran DIPA' : 'Input Transaksi Realisasi Belanja (SPM / SP2D)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan nomor dokumen penerbitan SPM & pencairan SP2D berjenjang multi-subkomponen/akun
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 clean-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoadingDetail && (
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Memuat rincian item transaksi realisasi...</span>
            </div>
          )}

          {/* Section 1: Header Dokumen */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1. Data Dokumen SPM & SP2D
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tahun Anggaran <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={formattedYearOptions}
                  value={tahunId}
                  onChange={(val) => {
                    const resolved = typeof val === 'object' && val !== null ? val.value : val
                    setTahunId(resolved ? String(resolved) : '')
                  }}
                  placeholder="-- Pilih Tahun --"
                  isClearable={false}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tanggal Transaksi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodDate}
                  onChange={(e) => setPeriodDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status Realisasi <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(val) => {
                    const resolved = typeof val === 'object' && val !== null ? val.value : val
                    setStatus(resolved ? String(resolved) : 'POSTED')
                  }}
                  placeholder="-- Status Realisasi --"
                  isClearable={false}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Surat Perintah Membayar (SPM)
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Nomor SPM</label>
                  <input
                    type="text"
                    value={noSpm}
                    onChange={(e) => setNoSpm(e.target.value)}
                    placeholder="00124/SPM-LS/2026"
                    required
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Tanggal Terbit SPM</label>
                  <input
                    type="date"
                    value={spmDate}
                    onChange={(e) => setSpmDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/30 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Surat Perintah Pencairan Dana (SP2D)
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Nomor SP2D</label>
                  <input
                    type="text"
                    value={noSp2d}
                    onChange={(e) => setNoSp2d(e.target.value)}
                    placeholder="260190100012891"
                    required
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Tanggal Terbit SP2D</label>
                  <input
                    type="date"
                    value={sp2dDate}
                    onChange={(e) => setSp2dDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Uraian Umum Transaksi / Catatan
              </label>
              <textarea
                rows={2}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Uraian ringkas belanja, tujuan pengeluaran, atau nomor kontrak pendukung..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
          </div>

          {/* Section 2: Detail Multi-Item Belanja */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                2. Rincian Item Belanja Subkomponen & Akun ({items.length} Item)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Item Belanja</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Hapus baris item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Struktur / Akun Belanja */}
                    <div className="sm:col-span-7 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Akun Belanja / Subkomponen DIPA <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={formattedStrukturOptions}
                        value={item.struktur_id}
                        onChange={(val) => {
                          const resolved = typeof val === 'object' && val !== null ? val.value : val
                          handleItemChange(item.id, 'struktur_id', resolved ? String(resolved) : '')
                        }}
                        placeholder="-- Cari kode akun / MAK / subkomponen --"
                        isClearable={false}
                        required
                      />
                    </div>

                    {/* Nominal Belanja */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Nominal Belanja (Rp) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.nominal}
                        onChange={(e) => handleItemChange(item.id, 'nominal', e.target.value)}
                        placeholder="Contoh: 15000000"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
                      />
                    </div>
                  </div>

                  {/* Keterangan Item */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Uraian Spesifik Item Belanja
                    </label>
                    <input
                      type="text"
                      value={item.keterangan}
                      onChange={(e) => handleItemChange(item.id, 'keterangan', e.target.value)}
                      placeholder="Misal: Pembayaran konsumsi rapat koordinasi / langganan bandwidth"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Kalkulasi Realisasi */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Total Realisasi Transaksi SPM & SP2D:
                </span>
              </div>
              <div className="text-base font-extrabold text-[#175CD3] dark:text-blue-400 font-mono">
                {formatRupiah(totalNominal)}
              </div>
            </div>
          </div>

          {/* Footer Submit (Matching /layanan/cltn) */}
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
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Transaksi Realisasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default AnggaranFormModal
