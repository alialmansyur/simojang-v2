import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import {
  X,
  PlusCircle,
  Pencil,
  Building2,
  Calendar,
  Layers,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { InstansiSearchableSelect } from '../InstansiSearchableSelect'
import { SearchableSelect } from '../../ui/SearchableSelect'
import {
  saveServiceManualEntry,
  updateServiceUploadLog,
  fetchServiceDetailData,
} from '../../../services/api/modularServicesApi'

export function ServiceManualEntryModal({
  isOpen,
  onClose,
  layananId,
  serviceTitle = 'Layanan Kepegawaian',
  shortTitle,
  categories = [],
  defaultCategory = '',
  editItem = null,
  onSuccess,
}) {
  const isEditMode = Boolean(editItem?.id)

  const [formData, setFormData] = useState({
    period: '',
    instansiId: '',
    instansiName: '',
    category: '',
    usulMasuk: 1,
    ms: 1,
    bts: 0,
    tms: 0,
    sisa: 0,
    targetTahun: new Date().getFullYear(),
    targetBulan: new Date().getMonth() + 1,
    slaBawah: 0,
    slaAtas: 0,
    formasi: '',
    remarks: '',
    detailId: 0,
  })

  const [detailRows, setDetailRows] = useState([])
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const applyDetailRowToForm = (row, basePeriod, baseCategory, baseRemarks) => {
    const usul = Number(row?.usul_masuk ?? 0)
    const msVal = Number(row?.ms ?? 0)
    const btsVal = Number(row?.bts ?? 0)
    const tmsVal = Number(row?.tms ?? 0)
    const sisaVal =
      row?.sisa !== null && row?.sisa !== undefined && row?.sisa !== ''
        ? Number(row.sisa)
        : Math.max(0, usul - (msVal + btsVal + tmsVal))

    setFormData((prev) => ({
      ...prev,
      period: basePeriod ?? prev.period,
      category: baseCategory ?? prev.category,
      remarks: baseRemarks ?? prev.remarks,
      detailId: Number(row?.id || 0),
      instansiId: String(row?.instansi_id || ''),
      instansiName: String(row?.nama || ''),
      usulMasuk: usul,
      ms: msVal,
      bts: btsVal,
      tms: tmsVal,
      sisa: sisaVal,
      targetTahun: row?.target_tahun ?? new Date().getFullYear(),
      targetBulan: row?.target_bulan ?? new Date().getMonth() + 1,
      slaBawah: Number(row?.sla_bawah ?? 0),
      slaAtas: Number(row?.sla_atas ?? 0),
      formasi: String(row?.formasi || ''),
    }))
  }

  useEffect(() => {
    if (!isOpen) return

    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setErrorMsg('')

    if (editItem?.id) {
      const initPeriod = editItem.period || currentPeriod
      const initCat = editItem.doc_category || defaultCategory || (categories?.[0]?.value ?? '')
      const initRemarks = editItem.remarks || ''

      setFormData({
        period: initPeriod,
        instansiId: '',
        instansiName: '',
        category: initCat,
        usulMasuk: 0,
        ms: 0,
        bts: 0,
        tms: 0,
        sisa: 0,
        targetTahun: now.getFullYear(),
        targetBulan: now.getMonth() + 1,
        slaBawah: 0,
        slaAtas: 0,
        formasi: '',
        remarks: initRemarks,
        detailId: 0,
      })

      let cancelled = false
      setIsLoadingDetail(true)
      fetchServiceDetailData({ key: editItem.id, length: 200 })
        .then((res) => {
          if (cancelled) return
          const rows = Array.isArray(res?.data) ? res.data : []
          setDetailRows(rows)
          if (rows.length > 0) {
            applyDetailRowToForm(rows[0], initPeriod, initCat, initRemarks)
          }
        })
        .catch(() => {
          if (!cancelled) setDetailRows([])
        })
        .finally(() => {
          if (!cancelled) setIsLoadingDetail(false)
        })

      return () => {
        cancelled = true
      }
    } else {
      setDetailRows([])
      setIsLoadingDetail(false)
      setFormData({
        period: currentPeriod,
        instansiId: '',
        instansiName: '',
        category: defaultCategory || (categories?.[0]?.value ?? ''),
        usulMasuk: 1,
        ms: 1,
        bts: 0,
        tms: 0,
        sisa: 0,
        targetTahun: now.getFullYear(),
        targetBulan: now.getMonth() + 1,
        slaBawah: 0,
        slaAtas: 0,
        formasi: '',
        remarks: '',
        detailId: 0,
      })
    }
  }, [isOpen, editItem, defaultCategory, categories])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const handleInstansiChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      instansiId: e?.value || '',
      instansiName: e?.label || '',
    }))
  }

  const handleSelectDetailRow = (detailIdStr) => {
    const selected = detailRows.find((r) => String(r.id) === String(detailIdStr))
    if (selected) {
      applyDetailRowToForm(selected, formData.period, formData.category, formData.remarks)
    }
  }

  const handleNumberChange = (field, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0)
    setFormData((prev) => {
      const updated = { ...prev, [field]: num }
      if (field === 'usulMasuk' || field === 'ms' || field === 'bts' || field === 'tms') {
        const total = field === 'usulMasuk' ? num : prev.usulMasuk
        const msVal = field === 'ms' ? num : prev.ms
        const btsVal = field === 'bts' ? num : prev.bts
        const tmsVal = field === 'tms' ? num : prev.tms
        updated.sisa = Math.max(0, total - (msVal + btsVal + tmsVal))
      }
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!isEditMode && !formData.instansiId) {
      setErrorMsg('Silakan pilih instansi pengusul daerah terlebih dahulu.')
      return
    }

    if (categories.length > 0 && !formData.category) {
      setErrorMsg('Silakan pilih kategori usul dokumen.')
      return
    }

    setIsSubmitting(true)

    try {
      const [yr, mo] = String(formData.period || '').split('-')
      const payload = {
        layanan_id: layananId,
        period: formData.period,
        doc_category: formData.category || '',
        remarks: formData.remarks || '',
        instansi_id: formData.instansiId || '',
        usul_masuk: formData.usulMasuk,
        ms: formData.ms,
        bts: formData.bts,
        tms: formData.tms,
        sisa: formData.sisa,
        target_tahun: yr ? Number(yr) : formData.targetTahun,
        target_bulan: mo ? Number(mo) : formData.targetBulan,
        sla_bawah: formData.slaBawah,
        sla_atas: formData.slaAtas,
        formasi: formData.formasi || '',
        keterangan: formData.remarks || '',
      }

      if (isEditMode) {
        await updateServiceUploadLog({
          ...payload,
          id: editItem.id,
          detail_id: formData.detailId || 0,
        })
        toast.success('Data usul layanan berhasil diperbarui.')
      } else {
        await saveServiceManualEntry(payload)
        toast.success('Catatan usul instansi berhasil disimpan.')
      }

      if (onSuccess) onSuccess()
      onClose?.()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan catatan usul layanan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (!isSubmitting && e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-manual-entry-title"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              {isEditMode ? <Pencil className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2
                id="service-manual-entry-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                {isEditMode ? 'Ubah Data Usul Layanan' : 'Catat Data Usul Manual'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {serviceTitle} • Kantor Regional III BKN Bandung
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto clean-scrollbar space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Grid Row 1: Periode & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Periode Bulan <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                value={formData.period}
                onChange={(e) => setFormData((p) => ({ ...p, period: e.target.value }))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
            </div>

            {categories && categories.length > 0 ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Kategori Usul <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={categories}
                  value={formData.category}
                  onChange={(val) => setFormData((p) => ({ ...p, category: val || '' }))}
                  placeholder="-- Pilih Kategori --"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Jenis Berkas Layanan
                </label>
                <input
                  type="text"
                  value={shortTitle || serviceTitle}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold"
                />
              </div>
            )}
          </div>

          {/* If editing a multi-row batch log, allow selecting which instansi row in the batch to edit */}
          {isEditMode && detailRows.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Baris Instansi dalam Berkas Batch ({detailRows.length} Instansi)
              </label>
              <select
                value={formData.detailId}
                onChange={(e) => handleSelectDetailRow(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 cursor-pointer"
              >
                {detailRows.map((r, i) => (
                  <option key={r.id || i} value={r.id}>
                    {i + 1}. {r.nama || `Instansi #${r.instansi_id}`} (Usul: {r.usul_masuk ?? 0}, MS: {r.ms ?? 0})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Instansi Searchable Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Instansi Pengusul Daerah (Cari / Ketik Nama) {!isEditMode && <span className="text-rose-500">*</span>}
            </label>
            {isLoadingDetail ? (
              <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#175CD3]" />
                <span>Memuat data instansi...</span>
              </div>
            ) : (
              <InstansiSearchableSelect
                value={formData.instansiId}
                onChange={handleInstansiChange}
                placeholder={formData.instansiName || 'Cari atau pilih nama Pemda / Instansi pengusul...'}
                required={!isEditMode}
              />
            )}
          </div>

          {/* Metric Volumes Card (Bento Container) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Rincian Rekap Usulan Instansi
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Usul Masuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.usulMasuk}
                  onChange={(e) => handleNumberChange('usulMasuk', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white font-bold text-center focus:ring-2 focus:ring-[#175CD3]/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                  MS (Memenuhi)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.ms}
                  onChange={(e) => handleNumberChange('ms', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs text-emerald-600 dark:text-emerald-400 font-bold text-center focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  BTS (Belum Lengkap)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bts}
                  onChange={(e) => handleNumberChange('bts', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs text-amber-600 dark:text-amber-400 font-bold text-center focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-1">
                  TMS (Tdk Memenuhi)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.tms}
                  onChange={(e) => handleNumberChange('tms', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-xs text-rose-600 dark:text-rose-400 font-bold text-center focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-500 dark:text-slate-400">
              <span>Sisa Usul Belum Diproses:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {formData.sisa} Berkas
              </span>
            </div>
          </div>

          {/* Remarks / Catatan Tambahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan / Nomor Usul / Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
              placeholder="Contoh: Usul susulan instansi no. surat 800/12/BKPSDM..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isEditMode && !formData.instansiId)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  {isEditMode ? <Pencil className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  <span>{isEditMode ? 'Simpan Perubahan' : 'Simpan Catatan Usul'}</span>
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
