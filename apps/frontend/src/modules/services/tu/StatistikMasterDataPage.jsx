import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  Database,
  GraduationCap,
  Building2,
  FileText,
  UserCheck,
  Users,
  Award,
  Sparkles,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
} from 'lucide-react'
import {
  fetchMasterPendidikan,
  fetchMasterUnitKerja,
  fetchMasterUnitSK,
  fetchMasterJenisJabatan,
  fetchMasterJenisPegawai,
  fetchMasterAgama,
  fetchMasterGolongan,
  fetchMasterPangkat,
  storeMasterStatistik,
  deleteMasterStatistik,
} from '../../../services/api/tuServicesApi'

const MASTER_CATALOG = [
  {
    type: 'data_pegawai_pendidikan',
    title: 'Master Pendidikan',
    subtitle: 'Jenjang pendidikan formal ASN',
    icon: GraduationCap,
    iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    fetcher: fetchMasterPendidikan,
  },
  {
    type: 'data_pegawai_unit_kerja',
    title: 'Master Unit Kerja',
    subtitle: 'Tim kerja internal Kanreg III BKN',
    icon: Building2,
    iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    fetcher: fetchMasterUnitKerja,
  },
  {
    type: 'data_pegawai_unit_sk',
    title: 'Master Unit SK',
    subtitle: 'Unit SK induk (KRG & UPT)',
    icon: FileText,
    iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    fetcher: fetchMasterUnitSK,
  },
  {
    type: 'data_pegawai_jenis_jabatan',
    title: 'Master Jenis Jabatan',
    subtitle: 'Kategori jabatan (Struktural, JFT, Pelaksana)',
    icon: UserCheck,
    iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    fetcher: fetchMasterJenisJabatan,
  },
  {
    type: 'data_pegawai_jenis_pegawai',
    title: 'Master Status Kepegawaian',
    subtitle: 'Status ASN (PNS, PPPK, PPPK PW, MAGANG)',
    icon: Users,
    iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    fetcher: fetchMasterJenisPegawai,
  },
  {
    type: 'data_pegawai_agama',
    title: 'Master Agama',
    subtitle: 'Data referensi agama pegawai',
    icon: Sparkles,
    iconColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    fetcher: fetchMasterAgama,
  },
  {
    type: 'data_pegawai_golongan',
    title: 'Master Golongan Ruang',
    subtitle: 'Golongan ruang ASN (I/a s.d. IV/e, PPPK)',
    icon: Award,
    iconColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    fetcher: fetchMasterGolongan,
  },
  {
    type: 'data_pegawai_pangkat',
    title: 'Master Pangkat',
    subtitle: 'Nama jenjang kepangkatan ASN',
    icon: BookOpen,
    iconColor: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
    fetcher: fetchMasterPangkat,
  },
]

export default function StatistikMasterDataPage() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState({})
  const [isLoadingCounts, setIsLoadingCounts] = useState(true)

  // Drawer / Sub-modal state for chosen master
  const [activeMaster, setActiveMaster] = useState(null)
  const [masterItems, setMasterItems] = useState([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [tableSearch, setTableSearch] = useState('')

  // Form add/edit in active master
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formNama, setFormNama] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const loadAllCounts = useCallback(async () => {
    try {
      setIsLoadingCounts(true)
      const results = await Promise.allSettled(
        MASTER_CATALOG.map((m) => m.fetcher())
      )
      const newCounts = {}
      results.forEach((res, idx) => {
        const type = MASTER_CATALOG[idx].type
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          newCounts[type] = res.value.length
        } else {
          newCounts[type] = 0
        }
      })
      setCounts(newCounts)
    } catch (err) {
      console.warn('Gagal memuat count master data:', err)
    } finally {
      setIsLoadingCounts(false)
    }
  }, [])

  useEffect(() => {
    loadAllCounts()
  }, [loadAllCounts])

  const openMasterModal = async (masterConfig) => {
    setActiveMaster(masterConfig)
    setTableSearch('')
    setIsLoadingItems(true)
    try {
      const data = await masterConfig.fetcher()
      setMasterItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Gagal memuat item master:', err)
      setMasterItems([])
    } finally {
      setIsLoadingItems(false)
    }
  }

  const reloadActiveMaster = async () => {
    if (!activeMaster) return
    setIsLoadingItems(true)
    try {
      const data = await activeMaster.fetcher()
      setMasterItems(Array.isArray(data) ? data : [])
      loadAllCounts()
    } catch (err) {
      console.warn('Gagal memuat ulang item master:', err)
    } finally {
      setIsLoadingItems(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormNama('')
    setErrorMsg('')
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormNama(item.nama || '')
    setErrorMsg('')
    setIsFormOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formNama.trim()) {
      setErrorMsg('Nama atau judul data master wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')
      await storeMasterStatistik({
        type: activeMaster.type,
        id: editingItem?.id || '',
        nama: formNama.trim(),
      })
      setIsFormOpen(false)
      reloadActiveMaster()
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menyimpan master data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus "${item.nama}" dari ${activeMaster.title}?`)) return
    try {
      await deleteMasterStatistik(activeMaster.type, item.id)
      reloadActiveMaster()
    } catch (err) {
      alert(err?.message || 'Gagal menghapus master data.')
    }
  }

  const filteredItems = masterItems.filter((i) =>
    (i.nama || '').toLowerCase().includes(tableSearch.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Standard Header Page */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-[11px] font-semibold text-[#175CD3] dark:text-blue-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#175CD3] shrink-0" />
            <span>Bagian Tata Usaha</span>
          </div>
          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Master Data Kepegawaian Internal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Pusat konfigurasi dan pemeliharaan 8 tabel data referensi dasar kepegawaian Kantor Regional III BKN Bandung.
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
            onClick={loadAllCounts}
            disabled={isLoadingCounts}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/60 dark:border-slate-800"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoadingCounts ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* 2. Grid 8 Kartu Master Data (Ukuran col-3 / 4 kolom per baris) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
        {MASTER_CATALOG.map((m) => {
          const Icon = m.icon
          const count = counts[m.type] ?? 0
          return (
            <div
              key={m.type}
              onClick={() => openMasterModal(m)}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs hover:shadow-sm border border-slate-200/60 dark:border-slate-800/60 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-11 h-11 rounded-xl ${m.iconColor} flex items-center justify-center shrink-0 shadow-inner`}>
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                    {isLoadingCounts ? '...' : `${count} Data`}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#175CD3] dark:group-hover:text-blue-400 transition-colors mb-1">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {m.subtitle}
                </p>
              </div>

              <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-xs font-bold text-[#175CD3] dark:text-blue-400">
                  Kelola Referensi
                </span>
                <span className="text-xs text-slate-400 group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Dialog Master Data List & CRUD (Portaled to document.body at z-[100]) */}
      {activeMaster &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isFormOpen) setActiveMaster(null)
            }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden modal-dialog-animated flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${activeMaster.iconColor} flex items-center justify-center shrink-0 shadow-inner`}>
                    <activeMaster.icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeMaster.title}
                    </h3>
                    <p className="text-xs text-slate-400">{activeMaster.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Tambah Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMaster(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Search Toolbar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Cari referensi..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#175CD3]"
                  />
                </div>
              </div>

              {/* Modal Table Body */}
              <div className="overflow-y-auto p-4 flex-1 clean-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] uppercase font-bold">
                      <th className="py-2.5 px-3 text-center w-12">NO</th>
                      <th className="py-2.5 px-3">NAMA / DESKRIPSI</th>
                      <th className="py-2.5 px-3 text-right w-20">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                    {isLoadingItems ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#175CD3] mb-1" />
                          <span className="text-xs">Memuat data referensi...</span>
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          Tidak ada data yang sesuai.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {item.nama}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                title="Ubah"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center text-xs text-slate-400 shrink-0">
                <span>Total: {filteredItems.length} referensi</span>
                <button
                  type="button"
                  onClick={() => setActiveMaster(null)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Sub-Modal Form Add / Edit Item (Portaled at z-[110]) */}
      {isFormOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmitting) setIsFormOpen(false)
            }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-sm overflow-hidden modal-dialog-animated">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {editingItem ? 'Ubah Data' : 'Tambah Data'} — {activeMaster?.title}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nama / Label Referensi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Masukkan nama..."
                    required
                    autoFocus
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#175CD3] hover:bg-[#1550B8] text-white flex items-center gap-1.5 shadow-xs"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingItem ? 'Simpan' : 'Tambahkan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
