import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Briefcase } from 'lucide-react'
import { storeProjectData } from '../../../../services/api/tuServicesApi'

export function ProjectFormModal({ isOpen, onClose, onSuccess, initialData }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Infrastruktur Gedung')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [realizedBudgetAmount, setRealizedBudgetAmount] = useState('')
  const [progressPercentage, setProgressPercentage] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [targetEndDate, setTargetEndDate] = useState('')
  const [status, setStatus] = useState('In Progress')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || initialData.nama_project || '')
      setCategory(initialData.category || 'Infrastruktur Gedung')
      setBudgetAmount(initialData.budget_amount || initialData.pagu || '')
      setRealizedBudgetAmount(initialData.realized_budget_amount || initialData.realisasi || '')
      setProgressPercentage(initialData.progress_percentage || initialData.progress || '0')
      setStartDate(initialData.start_date || '')
      setTargetEndDate(initialData.target_end_date || initialData.end_date || '')
      setStatus(initialData.status || 'In Progress')
      setDescription(initialData.description || initialData.keterangan || '')
    } else {
      setName('')
      setCategory('Infrastruktur Gedung')
      setBudgetAmount('')
      setRealizedBudgetAmount('0')
      setProgressPercentage('0')
      setStartDate(new Date().toISOString().slice(0, 10))
      setTargetEndDate('')
      setStatus('In Progress')
      setDescription('')
    }
    setErrorMsg('')
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Nama Proyek / Paket Pekerjaan wajib diisi.')
      return
    }
    if (!budgetAmount) {
      setErrorMsg('Pagu Anggaran wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const payload = {
        name,
        category,
        budget_amount: budgetAmount,
        realized_budget_amount: realizedBudgetAmount || '0',
        progress_percentage: progressPercentage || '0',
        start_date: startDate,
        target_end_date: targetEndDate,
        status,
        description,
      }

      if (initialData?.id || initialData?.uid) {
        payload.id = initialData.id || initialData.uid
        payload.project_id = initialData.uid || initialData.id
        payload.project_uid = initialData.uid || initialData.id
        payload.uid = initialData.uid || initialData.id
      }

      const res = await storeProjectData(payload)
      if (res?.status === 'success' || res?.code === 200 || !res?.error) {
        onSuccess?.()
        onClose()
      } else {
        setErrorMsg(res?.message || 'Gagal menyimpan data proyek.')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Terjadi kesalahan koneksi saat menyimpan data proyek.')
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Modal Header (Matching /layanan/cltn) */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Data Proyek' : 'Tambah Proyek & Pengadaan'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan paket pekerjaan dan realisasi progres fisik
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 clean-scrollbar flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Proyek / Pekerjaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Renovasi & Perluasan Ruang Server Command Center"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kategori Pekerjaan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              >
                <option value="Infrastruktur Gedung">Infrastruktur Gedung</option>
                <option value="Pengadaan Sarpras & BMN">Pengadaan Sarpras & BMN</option>
                <option value="Teknologi Informasi & Jaringan">Teknologi Informasi & Jaringan</option>
                <option value="Pemeliharaan & Renovasi">Pemeliharaan & Renovasi</option>
                <option value="Jasa Konsultansi">Jasa Konsultansi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Status Pelaksanaan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              >
                <option value="Planning">Perencanaan (Planning)</option>
                <option value="In Progress">Sedang Berjalan (In Progress)</option>
                <option value="Completed">Selesai (Completed)</option>
                <option value="Pending">Tertunda (Pending)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pagu Anggaran (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="450000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Realisasi Anggaran (Rp)
              </label>
              <input
                type="number"
                value={realizedBudgetAmount}
                onChange={(e) => setRealizedBudgetAmount(e.target.value)}
                placeholder="191250000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Progres Fisik (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={progressPercentage}
                onChange={(e) => setProgressPercentage(e.target.value)}
                placeholder="42.5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Selesai
              </label>
              <input
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ruang Lingkup & Keterangan
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rincian output pekerjaan, rekanan pelaksana, dan progres mingguan..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#175CD3] resize-none"
            />
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
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? 'Simpan Perubahan' : 'Tambah Proyek'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default ProjectFormModal
