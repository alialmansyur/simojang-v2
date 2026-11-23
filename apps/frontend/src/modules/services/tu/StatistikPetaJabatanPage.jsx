import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Plus,
  Briefcase,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Pencil,
  Trash2,
  X,
  Loader2,
} from 'lucide-react'
import {
  fetchMasterJabatan,
  storeMasterStatistik,
  deleteMasterStatistik,
} from '../../../services/api/tuServicesApi'
import { TuDeleteConfirmDialog } from '../../../components/shared/services/tu/TuDeleteConfirmDialog'

export default function StatistikPetaJabatanPage() {
  const navigate = useNavigate()
  const [jabatans, setJabatans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUnitStatus, setSelectedUnitStatus] = useState('') // '' (semua), 'KRG', 'UPT'
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formNama, setFormNama] = useState('')
  const [formKelas, setFormKelas] = useState('')
  const [formKebutuhan, setFormKebutuhan] = useState('0')
  const [formUnit, setFormUnit] = useState('KRG')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Delete modal state
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchMasterJabatan({
        is_status: selectedUnitStatus || undefined,
      })
      setJabatans(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Gagal memuat data peta jabatan:', err)
      setJabatans([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedUnitStatus])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtered rows by search term
  const filteredJabatans = useMemo(() => {
    if (!searchTerm.trim()) return jabatans
    const term = searchTerm.toLowerCase()
    return jabatans.filter(
      (j) =>
        (j.nama && j.nama.toLowerCase().includes(term)) ||
        (j.kelas_jabatan && String(j.kelas_jabatan).includes(term))
    )
  }, [jabatans, searchTerm])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormNama('')
    setFormKelas('')
    setFormKebutuhan('0')
    setFormUnit(selectedUnitStatus || 'KRG')
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormNama(item.nama || '')
    setFormKelas(item.kelas_jabatan !== null && item.kelas_jabatan !== undefined ? String(item.kelas_jabatan) : '')
    setFormKebutuhan(String(item.kebutuhan ?? item.formasi ?? 0))
    setFormUnit(item.is_status || 'KRG')
    setErrorMsg('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formNama.trim()) {
      setErrorMsg('Nama jabatan wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')
      const payload = {
        type: 'data_pegawai_jabatan',
        nama: formNama.trim(),
        kelas_jabatan: formKelas !== '' ? formKelas : '',
        kebutuhan: formKebutuhan !== '' ? String(formKebutuhan) : '0',
        is_status: formUnit,
      }
      if (editingItem?.id !== undefined && editingItem?.id !== null && editingItem?.id !== '') {
        payload.id = editingItem.id
      }
      await storeMasterStatistik(payload)
      setIsModalOpen(false)
      toast.success(editingItem ? 'Data jabatan berhasil diperbarui.' : 'Jabatan baru berhasil ditambahkan.')
      loadData()
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menyimpan data jabatan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (item) => {
    setDeletingItem(item)
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    try {
      setIsDeleting(true)
      await deleteMasterStatistik('data_pegawai_jabatan', deletingItem.id)
      toast.success(`Jabatan "${deletingItem.nama}" berhasil dihapus.`)
      setDeletingItem(null)
      loadData()
    } catch (err) {
      toast.error(err?.message || 'Gagal menghapus jabatan.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Standard Header Page (Matching /layanan/fasilitasi-cat/rekap-data) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Bagian Tata Usaha</span>
          </div>
          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Peta Jabatan & Analisis Bezzeting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Perbandingan formasi kebutuhan jabatan terhadap riil pegawai yang menduduki jabatan, kelas jabatan, lowongan, dan evaluasi pemenuhan.
          </p>
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={() => navigate('/layanan/statistik-internal')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/60 dark:border-slate-800"
            title="Kembali ke Hub Statistik Internal"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/60 dark:border-slate-800"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Jabatan</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Unit Switcher Tabs */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedUnitStatus('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                selectedUnitStatus === ''
                  ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Semua Unit
            </button>
            <button
              type="button"
              onClick={() => setSelectedUnitStatus('KRG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                selectedUnitStatus === 'KRG'
                  ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Kantor Regional III (KRG)
            </button>
            <button
              type="button"
              onClick={() => setSelectedUnitStatus('UPT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                selectedUnitStatus === 'UPT'
                  ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              UPSCPKP ASN Serang (UPT)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama jabatan / kelas..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#175CD3]"
            />
          </div>
        </div>
      </div>

      {/* 3. Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3.5 text-center w-12">NO</th>
                <th className="px-4 py-3.5">NAMA JABATAN</th>
                <th className="px-4 py-3.5 text-center">KELAS</th>
                <th className="px-4 py-3.5 text-center">FORMASI</th>
                <th className="px-4 py-3.5 text-center">BEZZETING</th>
                <th className="px-4 py-3.5 text-center">LOWONGAN</th>
                <th className="px-4 py-3.5 text-center">STATUS PEMENUHAN</th>
                <th className="px-4 py-3.5 text-right w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200 font-semibold">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredJabatans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-normal">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Belum ada data jabatan untuk kategori yang dipilih.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJabatans.map((j, idx) => {
                  const formasiNum = Number(j.formasi ?? j.kebutuhan ?? 0)
                  const bezzetingNum = Number(j.bezzeting ?? 0)
                  const lowonganNum = Number(j.lowongan ?? (formasiNum - bezzetingNum))
                  const ket = j.keterangan || (lowonganNum === 0 ? 'Memenuhi' : lowonganNum < 0 ? 'Kelebihan' : 'Kekurangan')

                  let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
                  let StatusIcon = AlertTriangle
                  if (ket === 'Memenuhi') {
                    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                    StatusIcon = CheckCircle2
                  } else if (ket === 'Kelebihan') {
                    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300'
                    StatusIcon = XCircle
                  }

                  return (
                    <tr
                      key={j.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{j.nama}</span>
                          {j.is_status && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {j.is_status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {j.kelas_jabatan || '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                        {formasiNum}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {bezzetingNum}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono">
                        <span className={lowonganNum < 0 ? 'text-rose-600' : lowonganNum > 0 ? 'text-amber-600' : 'text-slate-500'}>
                          {lowonganNum > 0 ? `+${lowonganNum}` : lowonganNum}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeColor}`}>
                          <StatusIcon className="w-3 h-3 shrink-0" />
                          <span>{ket}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(j)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Ubah Jabatan / Formasi"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(j)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Jabatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah/Ubah Jabatan (Portaled to document.body at z-[100] to cover topbar & sidebar) */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmitting) setIsModalOpen(false)
            }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden modal-dialog-animated">
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingItem ? 'Ubah Data Jabatan' : 'Tambah Jabatan Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-700 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nama Jabatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Analis SDM Aparatur Ahli Muda"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Kelas Jabatan
                    </label>
                    <input
                      type="number"
                      value={formKelas}
                      onChange={(e) => setFormKelas(e.target.value)}
                      placeholder="9"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Formasi Kebutuhan
                    </label>
                    <input
                      type="number"
                      value={formKebutuhan}
                      onChange={(e) => setFormKebutuhan(e.target.value)}
                      placeholder="2"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Unit Penempatan
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="KRG">Kantor Regional III BKN (KRG)</option>
                    <option value="UPT">UPSCPKP ASN Serang (UPT)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4.5 py-2 rounded-xl text-xs font-bold bg-[#175CD3] hover:bg-[#1550B8] text-white flex items-center gap-1.5 shadow-xs"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingItem ? 'Simpan Perubahan' : 'Tambah Jabatan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Dialog Konfirmasi Hapus Jabatan */}
      <TuDeleteConfirmDialog
        isOpen={Boolean(deletingItem)}
        onClose={() => !isDeleting && setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Konfirmasi Hapus Jabatan"
        message={`Apakah Anda yakin ingin menghapus jabatan "${deletingItem?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  )
}
