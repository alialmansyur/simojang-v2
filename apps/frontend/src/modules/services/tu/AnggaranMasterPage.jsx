import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Layers,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  FolderTree,
} from 'lucide-react'
import {
  fetchAnggaranSettings,
  deleteStrukturAnggaran,
  deleteTahunAnggaran,
} from '../../../services/api/tuServicesApi'
import { AnggaranStrukturModal } from './components/AnggaranStrukturModal'
import { AnggaranTahunModal } from './components/AnggaranTahunModal'

export default function AnggaranMasterPage() {
  const navigate = useNavigate()

  // Data State from Backend
  const [years, setYears] = useState([])
  const [levelOrder, setLevelOrder] = useState([])
  const [rawStrukturList, setRawStrukturList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Active Tab: 'struktur' | 'tahun'
  const [activeTab, setActiveTab] = useState('struktur')

  // Struktur Filters & Collapse State
  const [selectedYear, setSelectedYear] = useState('')
  const [searchStruktur, setSearchStruktur] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [collapsedNodes, setCollapsedNodes] = useState({})

  // Tahun Filters
  const [searchTahun, setSearchTahun] = useState('')
  const [filterTahunStatus, setFilterTahunStatus] = useState('')

  // Modals State
  const [strukturModalConfig, setStrukturModalConfig] = useState({
    isOpen: false,
    mode: 'root', // 'root' | 'child' | 'edit'
    parentData: null,
    editData: null,
  })

  const [tahunModalConfig, setTahunModalConfig] = useState({
    isOpen: false,
    editData: null,
  })

  // Delete Confirm Dialog State
  const [deletingItem, setDeletingItem] = useState(null) // { type: 'struktur' | 'tahun', item }
  const [isDeleting, setIsDeleting] = useState(false)

  // Load Settings from Backend
  const loadSettings = async (targetYear = selectedYear) => {
    setIsLoading(true)
    try {
      const res = await fetchAnggaranSettings(targetYear || '')
      if (res?.status === 'success') {
        const yearList = res.years || []
        setYears(yearList)
        setLevelOrder(res.level_order || [])
        setRawStrukturList(res.struktur || [])

        // If no year selected yet, select the active year or first available
        if (!targetYear && yearList.length > 0) {
          const activeYr = yearList.find((y) => Number(y.is_active || 0) === 1) || yearList[0]
          setSelectedYear(String(activeYr.tahun))
        }
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memuat data master anggaran.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Currency & Number Formatters
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0))
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Pre-calculate parent-child map for expand/collapse visibility
  const { childMap, parentMap } = useMemo(() => {
    const cMap = {}
    const pMap = {}
    rawStrukturList.forEach((row) => {
      const id = Number(row.id)
      const pid = Number(row.parent_id || 0)
      pMap[id] = pid
      if (!cMap[pid]) cMap[pid] = []
      cMap[pid].push(id)
    })
    return { childMap: cMap, parentMap: pMap }
  }, [rawStrukturList])

  // Check if any ancestor of a node is collapsed
  const isNodeHiddenByAncestor = (nodeId) => {
    let currentPid = parentMap[nodeId]
    while (currentPid && currentPid > 0) {
      if (collapsedNodes[currentPid]) {
        return true
      }
      currentPid = parentMap[currentPid]
    }
    return false
  }

  // Filter Struktur List based on search, level, and year
  const filteredStrukturList = useMemo(() => {
    return rawStrukturList.filter((row) => {
      // Filter year
      if (selectedYear && String(row.tahun) !== String(selectedYear)) {
        return false
      }
      // Filter Level
      if (filterLevel && String(row.level).toUpperCase() !== filterLevel.toUpperCase()) {
        return false
      }
      // Filter Search
      if (searchStruktur.trim()) {
        const q = searchStruktur.toLowerCase().trim()
        const matchKode = (row.kode || '').toLowerCase().includes(q)
        const matchNama = (row.nama || '').toLowerCase().includes(q)
        if (!matchKode && !matchNama) return false
      }
      // If user is searching or filtering level, show all matching rows without hiding by ancestor collapse
      if (searchStruktur.trim() || filterLevel) {
        return true
      }
      // Normal tree view: check ancestor collapse
      return !isNodeHiddenByAncestor(Number(row.id))
    })
  }, [rawStrukturList, selectedYear, filterLevel, searchStruktur, collapsedNodes, parentMap])

  // Toggle Single Node
  const toggleCollapse = (nodeId) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }))
  }

  // Expand All
  const handleExpandAll = () => {
    setCollapsedNodes({})
  }

  // Collapse All (collapse every parent node)
  const handleCollapseAll = () => {
    const nextCollapsed = {}
    Object.keys(childMap).forEach((pid) => {
      if (Number(pid) > 0) {
        nextCollapsed[pid] = true
      }
    })
    setCollapsedNodes(nextCollapsed)
  }

  // Summary Metrics for Struktur
  const strukturMetrics = useMemo(() => {
    const currentYearRows = rawStrukturList.filter((r) =>
      selectedYear ? String(r.tahun) === String(selectedYear) : true
    )
    const rootNodes = currentYearRows.filter((r) => !r.parent_id || Number(r.parent_id) === 0)
    const leafNodes = currentYearRows.filter((r) => r.is_leaf || r.level === 'AKUN')

    const totalPaguRevisi = rootNodes.reduce((acc, r) => acc + Number(r.pagu_revisi || 0), 0)
    const totalPaguEfektif = rootNodes.reduce((acc, r) => acc + Number(r.pagu_efektif || 0), 0)

    return {
      totalNodes: currentYearRows.length,
      totalLeafAkun: leafNodes.length,
      totalPaguRevisi,
      totalPaguEfektif,
    }
  }, [rawStrukturList, selectedYear])

  // Filter Master Tahun List
  const filteredTahunList = useMemo(() => {
    return years.filter((y) => {
      if (searchTahun.trim()) {
        const q = searchTahun.toLowerCase()
        const matchTahun = String(y.tahun).includes(q)
        const matchTarget = String(y.target_persen || '').includes(q)
        if (!matchTahun && !matchTarget) return false
      }
      if (filterTahunStatus === 'active' && Number(y.is_active || 0) !== 1) return false
      if (filterTahunStatus === 'inactive' && Number(y.is_active || 0) === 1) return false
      return true
    })
  }, [years, searchTahun, filterTahunStatus])

  // Level Badge Styler
  const getLevelBadgeClass = (level) => {
    const lvl = (level || '').toUpperCase()
    switch (lvl) {
      case 'UNIT':
      case 'SATKER':
        return 'bg-blue-50 text-[#175CD3] border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300'
      case 'PROGRAM':
      case 'KEGIATAN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300'
      case 'OUTPUT':
      case 'SUBOUTPUT':
        return 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300'
      case 'KOMPONEN':
      case 'SUBKOMPONEN':
        return 'bg-violet-50 text-violet-700 border-violet-200/70 dark:bg-violet-950/40 dark:text-violet-300'
      case 'AKUN':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 font-mono'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      if (deletingItem.type === 'struktur') {
        const res = await deleteStrukturAnggaran(deletingItem.item.id)
        if (res?.status === 'success') {
          toast.success(res?.message || 'Struktur anggaran berhasil dihapus.')
          loadSettings()
        } else {
          toast.error(res?.message || 'Gagal menghapus struktur anggaran.')
        }
      } else if (deletingItem.type === 'tahun') {
        const res = await deleteTahunAnggaran(deletingItem.item.id)
        if (res?.status === 'success') {
          toast.success(res?.message || 'Tahun anggaran berhasil dihapus.')
          loadSettings()
        } else {
          toast.error(res?.message || 'Gagal menghapus tahun anggaran.')
        }
      }
      setDeletingItem(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Page Standard */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Bagian Tata Usaha</span>
          </div>

          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Master Data Anggaran DIPA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Konfigurasi pohon hierarki belanja 9 level, pembatasan lock pagu per MAK, dan penetapan target penyerapan tahun anggaran.
          </p>
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={() => navigate('/layanan/anggaran')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/70 dark:border-slate-800/70"
            title="Kembali ke Portal Anggaran"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Portal</span>
          </button>

          <button
            type="button"
            onClick={() => loadSettings()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/70 dark:border-slate-800/70 disabled:opacity-50"
            title="Muat ulang data master"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Bento Counting Cards (Master Anggaran SSOT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>TOTAL NODE STRUKTUR</span>
            <FolderTree className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {strukturMetrics.totalNodes}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Hierarki pohon DIPA TA {selectedYear || 'Semua'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>AKUN BELANJA (LEAF)</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {strukturMetrics.totalLeafAkun}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Akun 6-digit operasional pencairan</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>TOTAL PAGU REVISI</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatRupiah(strukturMetrics.totalPaguRevisi)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Akumulasi pagu revisi DIPA</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>PAGU EFEKTIF BELANJA</span>
            <TrendingUp className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-teal-600 dark:text-teal-400 truncate">
            {formatRupiah(strukturMetrics.totalPaguEfektif)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pagu setelah dipotong lock pagu</div>
        </div>
      </div>

      {/* 3. Segmented Navigation Tabs */}
      <div className="border-b border-slate-200/80 dark:border-slate-800">
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('struktur')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'struktur'
                ? 'border-[#175CD3] text-[#175CD3] dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Struktur Anggaran DIPA</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {rawStrukturList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tahun')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'tahun'
                ? 'border-[#175CD3] text-[#175CD3] dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Master Tahun Anggaran</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {years.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: STRUKTUR ANGGARAN DIPA */}
      {activeTab === 'struktur' && (
        <div className="space-y-4">
          {/* Toolbar & Filter Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
            <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-3 w-full">
              {/* Left Filters */}
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
                {/* Filter Tahun */}
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value)
                    loadSettings(e.target.value)
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Semua Tahun Anggaran</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.tahun}>
                      Tahun {y.tahun} {Number(y.is_active || 0) === 1 ? '★ (Aktif)' : ''}
                    </option>
                  ))}
                </select>

                {/* Search Struktur */}
                <div className="relative w-full sm:w-64 md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchStruktur}
                    onChange={(e) => setSearchStruktur(e.target.value)}
                    placeholder="Cari kode atau nama struktur..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#175CD3]"
                  />
                </div>

                {/* Filter Level */}
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Semua Level</option>
                  {levelOrder.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Level {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  title="Buka seluruh cabang"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Expand All</span>
                </button>

                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  title="Tutup seluruh cabang"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  <span>Collapse All</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStrukturModalConfig({
                      isOpen: true,
                      mode: 'root',
                      parentData: null,
                      editData: null,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Tambah Root</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tree Table Container (PEDOMAN_STANDARISASI_TABLE_MASTER.md - 5 Kolom Adaptif Anti-Scroll Samping) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto clean-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-3 sm:px-4 min-w-[260px]">STRUKTUR DIPA & KODE MAK</th>
                    <th className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">PAGU REVISI & LOCK</th>
                    <th className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">PAGU EFEKTIF</th>
                    <th className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">REALISASI</th>
                    <th className="py-3.5 px-3 sm:px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50 dark:bg-slate-800 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.4)] z-10">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, rIdx) => (
                      <tr key={rIdx} className="animate-pulse">
                        <td className="py-4 px-3 sm:px-4">
                          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                        </td>
                        <td className="py-4 px-3 sm:px-4 text-right">
                          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                        </td>
                        <td className="py-4 px-3 sm:px-4 text-right">
                          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                        </td>
                        <td className="py-4 px-3 sm:px-4 text-right">
                          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                        </td>
                        <td className="py-4 px-3 sm:px-4 text-right sticky right-0 bg-white dark:bg-slate-900 shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)]">
                          <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredStrukturList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">
                          Data struktur anggaran tidak ditemukan
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Belum ada struktur untuk filter ini. Klik "Tambah Root" untuk memulai pohon DIPA baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredStrukturList.map((row) => {
                      const rowId = Number(row.id)
                      const depth = Number(row.depth || 0)
                      const indentPx = Math.min(depth * 18, 140)
                      const children = childMap[rowId] || []
                      const hasChildren = children.length > 0
                      const isCollapsed = Boolean(collapsedNodes[rowId])
                      const canAppend = Boolean(row.next_level) && row.level !== 'AKUN'

                      const paguEfektif = Number(row.pagu_efektif || 0)
                      const paguRevisi = Number(row.pagu_revisi || 0)
                      const lockPagu = Number(row.lock_pagu || 0)
                      const realisasi = Number(row.realisasi || 0)
                      const pctSerap = paguEfektif > 0 ? ((realisasi / paguEfektif) * 100).toFixed(1) : '0.0'

                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* 1. STRUKTUR DIPA & KODE MAK (Tree Indent + Level Badge Inline) */}
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center gap-1.5" style={{ paddingLeft: `${indentPx}px` }}>
                              {hasChildren ? (
                                <button
                                  type="button"
                                  onClick={() => toggleCollapse(rowId)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer shrink-0"
                                  title={isCollapsed ? 'Buka cabang' : 'Tutup cabang'}
                                >
                                  {isCollapsed ? (
                                    <ChevronRight className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-5 h-5 shrink-0 inline-block" />
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {row.nama || '-'}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border ${getLevelBadgeClass(
                                      row.display_level || row.level
                                    )}`}
                                  >
                                    {row.display_level || row.level}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                                  <span>
                                    MAK: <strong className="text-slate-600 dark:text-slate-300">{row.kode || '-'}</strong>
                                  </span>
                                  {!selectedYear && <span>• TA {row.tahun}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. PAGU REVISI & LOCK (Stacked) */}
                          <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                            <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                              {formatRupiah(paguRevisi)}
                            </div>
                            <div className="text-[11px] font-mono mt-0.5">
                              {lockPagu > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  Lock: {formatRupiah(lockPagu)}
                                </span>
                              ) : (
                                <span className="text-slate-400">Lock: Rp 0</span>
                              )}
                            </div>
                          </td>

                          {/* 3. PAGU EFEKTIF */}
                          <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                            <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {formatRupiah(paguEfektif)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Siap Dibelanjakan
                            </div>
                          </td>

                          {/* 4. REALISASI & SERAPAN */}
                          <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                            <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                              {formatRupiah(realisasi)}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              Serapan: <span className="font-semibold text-slate-600 dark:text-slate-300">{pctSerap}%</span>
                            </div>
                          </td>

                          {/* 5. AKSI (Sticky Right Pinned - Always Visible) */}
                          <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 transition-colors shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit Node */}
                              <button
                                type="button"
                                onClick={() =>
                                  setStrukturModalConfig({
                                    isOpen: true,
                                    mode: 'edit',
                                    parentData: null,
                                    editData: row,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                title="Ubah Struktur"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Append Child Node */}
                              <button
                                type="button"
                                onClick={() =>
                                  setStrukturModalConfig({
                                    isOpen: true,
                                    mode: 'child',
                                    parentData: row,
                                    editData: null,
                                  })
                                }
                                disabled={!canAppend}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  canAppend
                                    ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                    : 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40'
                                }`}
                                title={canAppend ? `Tambah sub struktur level ${row.next_level}` : 'Batas level leaf (AKUN)'}
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>

                              {/* Delete Node */}
                              <button
                                type="button"
                                onClick={() =>
                                  setDeletingItem({
                                    type: 'struktur',
                                    item: row,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Hapus Struktur"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* TAB 2: MASTER TAHUN ANGGARAN */}
      {activeTab === 'tahun' && (
        <div className="space-y-4">
          {/* Toolbar Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchTahun}
                    onChange={(e) => setSearchTahun(e.target.value)}
                    placeholder="Cari tahun atau target..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#175CD3]"
                  />
                </div>

                <select
                  value={filterTahunStatus}
                  onChange={(e) => setFilterTahunStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Tahun Aktif Saja</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() =>
                  setTahunModalConfig({
                    isOpen: true,
                    editData: null,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Tambah Tahun</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto clean-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-5">TAHUN ANGGARAN</th>
                    <th className="py-3.5 px-4">TARGET PENYERAPAN</th>
                    <th className="py-3.5 px-4 text-center">STATUS AKTIF</th>
                    <th className="py-3.5 px-4">WAKTU DIBUAT</th>
                    <th className="py-3.5 px-4 sm:px-5 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {filteredTahunList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">
                          Data tahun anggaran belum tersedia
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTahunList.map((row) => {
                      const isActive = Number(row.is_active || 0) === 1
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                                {row.tahun}
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                Tahun Anggaran {row.tahun}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              <span>{Number(row.target_persen || 0).toFixed(2)}%</span>
                              <span className="text-[11px] text-slate-400 font-normal">capaian</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Aktif (Default)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/70 dark:bg-slate-800 dark:text-slate-400">
                                <XCircle className="w-3 h-3 text-slate-400" />
                                <span>Arsip / Nonaktif</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDate(row.created_at)}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setTahunModalConfig({
                                    isOpen: true,
                                    editData: row,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                title="Ubah Tahun"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeletingItem({
                                    type: 'tahun',
                                    item: row,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Hapus Tahun"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* Struktur Modal Dialog */}
      <AnggaranStrukturModal
        isOpen={strukturModalConfig.isOpen}
        onClose={() =>
          setStrukturModalConfig({
            isOpen: false,
            mode: 'root',
            parentData: null,
            editData: null,
          })
        }
        onSuccess={() => {
          toast.success('Struktur anggaran berhasil disimpan.')
          loadSettings()
        }}
        mode={strukturModalConfig.mode}
        parentData={strukturModalConfig.parentData}
        editData={strukturModalConfig.editData}
        levelOrder={levelOrder}
        defaultYear={Number(selectedYear) || new Date().getFullYear()}
      />

      {/* Tahun Modal Dialog */}
      <AnggaranTahunModal
        isOpen={tahunModalConfig.isOpen}
        onClose={() =>
          setTahunModalConfig({
            isOpen: false,
            editData: null,
          })
        }
        onSuccess={() => {
          toast.success('Data tahun anggaran berhasil disimpan.')
          loadSettings()
        }}
        editData={tahunModalConfig.editData}
      />

      {/* Delete Confirmation Modal */}
      {deletingItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-sm modal-dialog-animated text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus {deletingItem.type === 'struktur' ? 'Struktur Anggaran' : 'Tahun Anggaran'}?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {deletingItem.type === 'struktur'
                    ? `Yakin ingin menghapus node [${deletingItem.item.level}] "${deletingItem.item.nama}"? Aksi ini tidak dapat dibatalkan.`
                    : `Yakin ingin menghapus Tahun Anggaran ${deletingItem.item.tahun}? Data transaksi terkait dapat terpengaruh.`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
