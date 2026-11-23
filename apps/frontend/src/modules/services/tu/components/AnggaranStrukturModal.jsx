import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Layers, AlertCircle, Info } from 'lucide-react'
import { storeStrukturAnggaran } from '../../../../services/api/tuServicesApi'

export function AnggaranStrukturModal({
  isOpen,
  onClose,
  onSuccess,
  mode = 'root', // 'root' | 'child' | 'edit'
  parentData = null,
  editData = null,
  levelOrder = [],
  defaultYear = new Date().getFullYear(),
}) {
  const [tahun, setTahun] = useState(defaultYear)
  const [level, setLevel] = useState('')
  const [kode, setKode] = useState('')
  const [nama, setNama] = useState('')
  const [paguRevisi, setPaguRevisi] = useState('')
  const [lockPagu, setLockPagu] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Currency Formatter Helpers
  const formatInputCurrency = (rawVal) => {
    if (!rawVal) return ''
    const num = String(rawVal).replace(/[^\d]/g, '')
    if (!num) return ''
    return new Intl.NumberFormat('id-ID').format(Number(num))
  }

  const parseCurrencyNumber = (formattedVal) => {
    if (!formattedVal) return 0
    const clean = String(formattedVal).replace(/[^\d]/g, '')
    return Number(clean) || 0
  }

  useEffect(() => {
    if (!isOpen) return

    setErrorMsg('')
    if (mode === 'edit' && editData) {
      setTahun(editData.tahun || defaultYear)
      setLevel(editData.level || '')
      setKode(editData.kode || '')
      setNama(editData.nama || '')
      setPaguRevisi(formatInputCurrency(editData.raw_pagu_revisi ?? editData.pagu_revisi ?? 0))
      setLockPagu(formatInputCurrency(editData.raw_lock_pagu ?? editData.lock_pagu ?? 0))
    } else if (mode === 'child' && parentData) {
      setTahun(parentData.tahun || defaultYear)
      const targetNextLevel = parentData.next_level || (levelOrder.length > 0 ? levelOrder[0] : 'SATKER')
      setLevel(targetNextLevel)
      setKode('')
      setNama('')
      setPaguRevisi('')
      setLockPagu('')
    } else {
      // Root mode
      setTahun(defaultYear)
      const rootLevel = levelOrder.length > 0 ? levelOrder[0] : 'UNIT'
      setLevel(rootLevel)
      setKode('')
      setNama('')
      setPaguRevisi('')
      setLockPagu('')
    }
  }, [isOpen, mode, parentData, editData, defaultYear, levelOrder])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!nama.trim()) {
      setErrorMsg('Nama struktur wajib diisi.')
      return
    }

    if (!level) {
      setErrorMsg('Level hierarki wajib dipilih.')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        tahun: Number(tahun),
        level,
        kode: kode.trim(),
        nama: nama.trim(),
        pagu_revisi: parseCurrencyNumber(paguRevisi),
        lock_pagu: parseCurrencyNumber(lockPagu),
      }

      if (mode === 'edit' && editData?.id) {
        payload.key = editData.id
        if (editData.parent_id !== undefined && editData.parent_id !== null && editData.parent_id !== '') {
          payload.parent_id = editData.parent_id
        }
      } else if (mode === 'child' && parentData?.id) {
        payload.parent_id = parentData.id
      }

      const res = await storeStrukturAnggaran(payload)
      if (res?.status === 'success') {
        if (onSuccess) onSuccess(res)
        onClose()
      } else {
        setErrorMsg(res?.message || 'Gagal menyimpan data struktur anggaran.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat menyimpan struktur.')
    } finally {
      setIsSubmitting(false)
    }
  }

  let title = 'Tambah Root Struktur Anggaran'
  let subHint = 'Mode: Tambah node teratas (Level UNIT)'
  if (mode === 'child' && parentData) {
    title = 'Tambah Sub-Struktur Anggaran'
    subHint = `Menambahkan child di bawah: [${parentData.level}] ${parentData.nama}`
  } else if (mode === 'edit' && editData) {
    title = 'Ubah Struktur Anggaran'
    subHint = `Mengubah node: [${editData.level}] ${editData.nama}`
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg sm:max-w-xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                {subHint}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="form-anggaran-struktur" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 clean-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tahun */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Tahun Anggaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="2026"
              />
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Level Hierarki <span className="text-rose-500">*</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
                disabled={mode === 'child' && parentData?.next_level}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60"
              >
                {levelOrder.length > 0 ? (
                  levelOrder.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="UNIT">UNIT</option>
                    <option value="SATKER">SATKER</option>
                    <option value="PROGRAM">PROGRAM</option>
                    <option value="KEGIATAN">KEGIATAN</option>
                    <option value="OUTPUT">OUTPUT</option>
                    <option value="SUBOUTPUT">SUBOUTPUT</option>
                    <option value="KOMPONEN">KOMPONEN</option>
                    <option value="SUBKOMPONEN">SUBKOMPONEN</option>
                    <option value="AKUN">AKUN (6 Digit)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Kode */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Kode Struktur
              </label>
              <input
                type="text"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                placeholder="cth: 511111"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Nama Struktur */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Nama Struktur / Uraian MAK <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                placeholder="Nama unit, program, komponen, atau akun belanja"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Pagu Revisi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Pagu Revisi (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  value={paguRevisi}
                  onChange={(e) => setPaguRevisi(formatInputCurrency(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Alokasi pagu belanja resmi setelah revisi.</p>
            </div>

            {/* Lock Pagu */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Lock Pagu / Automatic Adjustment (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  value={lockPagu}
                  onChange={(e) => setLockPagu(formatInputCurrency(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Nominal pagu yang diblokir/dikunci sementara.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              Pagu Efektif yang dapat dibelanjakan otomatis dihitung sebagai: <strong>Pagu Revisi - Lock Pagu</strong>. Jika memiliki child akun, total akan otomatis di-rollup ke parent.
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="form-anggaran-struktur"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Simpan Struktur</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
