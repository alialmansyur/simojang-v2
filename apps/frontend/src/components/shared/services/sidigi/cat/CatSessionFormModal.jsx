import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Plus,
  Trash2,
  Copy,
  Loader2,
  Calendar,
  AlertCircle,
  Save,
} from 'lucide-react'

let nextRowKey = 1
const makeRowId = () => `cat_row_${nextRowKey++}`

export function CatSessionFormModal(props) {
  if (!props.isOpen) return null
  return <CatSessionFormModalContent {...props} />
}

function CatSessionFormModalContent({
  onClose,
  onSuccess,
  tilokUid,
  tilokNama,
  defaultInstansiId = '',
  instansiList = [],
  defaultSeleksiId = '',
  seleksiList = [],
  jenisTesId = '1',
  onSubmitFn,
  onRequestAddInstansi,
}) {
  const getToday = () => new Date().toISOString().split('T')[0]

  const getDefaultInstansi = () =>
    defaultInstansiId || (instansiList.length > 0 ? instansiList[0].instansi_id || instansiList[0].id : '')

  const [rows, setRows] = useState(() => [
    {
      id: makeRowId(),
      instansi: getDefaultInstansi(),
      tanggal: getToday(),
      sesi: 1,
      kuota: 200,
      hadir: 0,
      tidak_hadir: 0,
      nilai_min: '',
      nilai_max: '',
      memenuhi: 0,
      tidak_memenuhi: 0,
      reschedule: 0,
    },
  ])
  const selectedSeleksi = defaultSeleksiId || (seleksiList.length > 0 ? seleksiList[0].id : '1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, [field]: value }
        return updated
      })
    )
  }

  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1]
    const nextSesi = lastRow ? Number(lastRow.sesi || 0) + 1 : 1
    const nextTanggal = lastRow ? lastRow.tanggal : getToday()
    const nextInstansi = lastRow ? lastRow.instansi : defaultInstansiId

    setRows((prev) => [
      ...prev,
      {
        id: makeRowId(),
        instansi: nextInstansi,
        tanggal: nextTanggal,
        sesi: nextSesi,
        kuota: 200,
        hadir: 0,
        tidak_hadir: 0,
        nilai_min: '',
        nilai_max: '',
        memenuhi: 0,
        tidak_memenuhi: 0,
        reschedule: 0,
      },
    ])
  }

  const handleDuplicateRow = (row) => {
    setRows((prev) => [
      ...prev,
      {
        ...row,
        id: makeRowId(),
        sesi: Number(row.sesi || 0) + 1,
      },
    ])
  }

  const handleDeleteRow = (id) => {
    if (rows.length === 1) {
      setErrorMsg('Minimal satu baris sesi harus terisi.')
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== id))
    setErrorMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    // Validate
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (!r.instansi) {
        setErrorMsg(`Baris ke-${i + 1}: Instansi peserta belum dipilih.`)
        return
      }
      if (!r.tanggal) {
        setErrorMsg(`Baris ke-${i + 1}: Tanggal pelaksanaan belum diisi.`)
        return
      }
      if (!r.sesi || Number(r.sesi) <= 0) {
        setErrorMsg(`Baris ke-${i + 1}: Nomor sesi tidak valid.`)
        return
      }
    }

    try {
      setIsSubmitting(true)
      if (onSubmitFn) {
        await onSubmitFn({
          key: tilokUid,
          seleksi_id: selectedSeleksi,
          jenis_tes_id: jenisTesId,
          rows,
        })
      }
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data sesi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isSubmitting, onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Input Data Rekap Sesi Ujian CAT
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tilokNama ? `Titik Lokasi: ${tilokNama}` : 'Input data sesi harian dan kehadiran peserta'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (Table Grid) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 clean-scrollbar">
          {instansiList.length === 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Belum ada instansi peserta yang terdaftar pada tilok ini. Daftarkan instansi terlebih dahulu.</span>
              </div>
              {onRequestAddInstansi && (
                <button
                  type="button"
                  onClick={onRequestAddInstansi}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shrink-0 cursor-pointer"
                >
                  + Tambah Instansi
                </button>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto clean-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-850/70 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200/70 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 min-w-[190px]">Instansi Peserta *</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Tanggal Sesi *</th>
                    <th className="py-2.5 px-2 text-center w-16">Sesi *</th>
                    <th className="py-2.5 px-2 text-center w-20">Hadir</th>
                    <th className="py-2.5 px-2 text-center w-20">Tdk Hadir</th>
                    <th className="py-2.5 px-2 text-center w-20">Resched</th>
                    <th className="py-2.5 px-2 text-center w-20">Total</th>
                    <th className="py-2.5 px-2 text-center w-22">Skor Min</th>
                    <th className="py-2.5 px-2 text-center w-22">Skor Max</th>
                    <th className="py-2.5 px-2 text-center w-20">MS</th>
                    <th className="py-2.5 px-2 text-center w-20">TMS</th>
                    <th className="py-2.5 px-2 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {rows.map((row) => {
                    const totalPeserta = Number(row.hadir || 0) + Number(row.tidak_hadir || 0)
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        {/* Instansi */}
                        <td className="p-2">
                          <select
                            value={row.instansi}
                            onChange={(e) => handleRowChange(row.id, 'instansi', e.target.value)}
                            required
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                          >
                            <option value="">-- Pilih Instansi --</option>
                            {instansiList.map((ins) => (
                              <option key={ins.instansi_id || ins.id} value={ins.instansi_id || ins.id}>
                                {ins.nama || ins.instansi_name || `Instansi ${ins.instansi_id || ins.id}`}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Tanggal */}
                        <td className="p-2">
                          <input
                            type="date"
                            value={row.tanggal}
                            onChange={(e) => handleRowChange(row.id, 'tanggal', e.target.value)}
                            required
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                          />
                        </td>

                        {/* Sesi */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={row.sesi}
                            onChange={(e) => handleRowChange(row.id, 'sesi', e.target.value)}
                            required
                            className="w-14 px-1.5 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                          />
                        </td>

                        {/* Hadir */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={row.hadir}
                            onChange={(e) => handleRowChange(row.id, 'hadir', e.target.value)}
                            className="w-18 px-1.5 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                          />
                        </td>

                        {/* Tidak Hadir */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={row.tidak_hadir}
                            onChange={(e) => handleRowChange(row.id, 'tidak_hadir', e.target.value)}
                            className="w-18 px-1.5 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-rose-600 dark:text-rose-400"
                          />
                        </td>

                        {/* Reschedule */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={row.reschedule}
                            onChange={(e) => handleRowChange(row.id, 'reschedule', e.target.value)}
                            className="w-16 px-1.5 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-amber-600 dark:text-amber-400"
                          />
                        </td>

                        {/* Total Peserta Auto-calc */}
                        <td className="p-2 text-center font-bold text-slate-700 dark:text-slate-300">
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                            {totalPeserta}
                          </span>
                        </td>

                        {/* Nilai Min */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={row.nilai_min}
                            onChange={(e) => handleRowChange(row.id, 'nilai_min', e.target.value)}
                            className="w-20 px-1.5 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                          />
                        </td>

                        {/* Nilai Max */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={row.nilai_max}
                            onChange={(e) => handleRowChange(row.id, 'nilai_max', e.target.value)}
                            className="w-20 px-1.5 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-blue-600 dark:text-blue-400"
                          />
                        </td>

                        {/* Memenuhi (MS) */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={row.memenuhi}
                            onChange={(e) => handleRowChange(row.id, 'memenuhi', e.target.value)}
                            className="w-16 px-1 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200"
                          />
                        </td>

                        {/* Tidak Memenuhi (TMS) */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={row.tidak_memenuhi}
                            onChange={(e) => handleRowChange(row.id, 'tidak_memenuhi', e.target.value)}
                            className="w-16 px-1 py-1.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200"
                          />
                        </td>

                        {/* Action Buttons Soft-wrapped */}
                        <td className="p-2 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(row)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-600 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 transition-colors cursor-pointer"
                              title="Duplikasi Baris"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-600 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 transition-colors cursor-pointer"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 bg-slate-50/50 dark:bg-slate-850/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#175CD3]" />
                <span>Tambah Baris Sesi Baru</span>
              </button>
              <span className="text-[11px] text-slate-400">Total: {rows.length} baris sesi</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Rekap...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Rekap Sesi ({rows.length})</span>
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
