import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  Layers,
  Users,
  Globe,
  UserCheck,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  Wrench,
  AlertTriangle,
  CornerDownRight,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  fetchLayananAccessList,
  fetchLayananAccessDetail,
  searchLayananPegawai,
  saveLayananAccessMode,
  addLayananAssignee,
  removeLayananAssignee,
  toggleLayananMaintenance,
  fetchServicePegawaiList,
  fetchServicePegawaiTree,
  toggleServicePegawaiPermission,
  resetServicePegawaiPermission,
  copyServicePegawaiPermission,
} from '../../services/api/settingsApi'
import { fetchUserMenuTree } from '../../services/auth'
import { SettingsSubpageHeader } from './components/SettingsSubpageHeader'
import { ServiceFilterToolbar } from '../../components/shared/services/ServiceFilterToolbar'
import { ServiceTablePagination } from '../../components/shared/services/ServiceTablePagination'
import {
  PmaTableHeader,
  PmaActionButtons,
} from '../../components/shared/services/pma/PmaTableCells'

function TableSkeletonRows({ colCount = 6 }) {
  return Array.from({ length: 5 }).map((_, idx) => (
    <tr key={idx} className="animate-pulse border-b border-slate-100/70 dark:border-slate-800/60">
      <td className="px-4 sm:px-5 py-3">
        <div className="h-4 w-44 bg-slate-200/70 dark:bg-slate-800 rounded" />
        <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/60 rounded mt-1.5" />
      </td>
      <td className="px-4 sm:px-5 py-3">
        <div className="h-5 w-24 bg-slate-200/70 dark:bg-slate-800 rounded-full" />
      </td>
      <td className="px-4 sm:px-5 py-3">
        <div className="h-4 w-28 bg-slate-200/70 dark:bg-slate-800 rounded" />
      </td>
      <td className="px-4 sm:px-5 py-3">
        <div className="h-5 w-20 bg-slate-200/70 dark:bg-slate-800 rounded-full" />
      </td>
      {colCount > 5 && (
        <td className="px-4 sm:px-5 py-3">
          <div className="h-5 w-24 bg-slate-200/70 dark:bg-slate-800 rounded-full" />
        </td>
      )}
      {colCount > 4 && (
        <td className="px-4 sm:px-5 py-3 text-right">
          <div className="inline-flex gap-1.5">
            <div className="h-8 w-8 bg-slate-200/70 dark:bg-slate-800 rounded-lg" />
          </div>
        </td>
      )}
    </tr>
  ))
}

export default function SettingsServicesPage() {
  const [activeTab, setActiveTab] = useState('per_layanan')

  // --- Tab 1: Per Layanan ---
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [servicesError, setServicesError] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [servicePage, setServicePage] = useState(1)
  const [servicePageSize, setServicePageSize] = useState(10)

  // Maintenance Toggle & Modal State
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false)
  const [selectedServiceForMaintenance, setSelectedServiceForMaintenance] = useState(null)
  const [maintenanceTargetStatus, setMaintenanceTargetStatus] = useState(false)
  const [maintenanceMsgInput, setMaintenanceMsgInput] = useState('')
  const [savingMaintenance, setSavingMaintenance] = useState(false)

  // Modal Kelola Layanan
  const [manageServiceOpen, setManageServiceOpen] = useState(false)
  const [activeServiceDetail, setActiveServiceDetail] = useState(null)
  const [loadingServiceDetail, setLoadingServiceDetail] = useState(false)
  const [savingMode, setSavingMode] = useState(false)

  // Search Pegawai to assign to Layanan
  const [assigneeQuery, setAssigneeQuery] = useState('')
  const [assigneeResults, setAssigneeResults] = useState([])
  const [searchingAssignee, setSearchingAssignee] = useState(false)
  const [addingNip, setAddingNip] = useState('')
  const [removingNip, setRemovingNip] = useState('')

  // --- Tab 2: Per Pegawai ---
  const [pegawaiList, setPegawaiList] = useState([])
  const [loadingPegawai, setLoadingPegawai] = useState(false)
  const [pegawaiError, setPegawaiError] = useState('')
  const [pegawaiSearch, setPegawaiSearch] = useState('')
  const [pegawaiPage, setPegawaiPage] = useState(1)
  const [pegawaiPageSize, setPegawaiPageSize] = useState(10)

  // Modal Kelola Izin Layanan Pegawai
  const [managePegawaiOpen, setManagePegawaiOpen] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState(null)
  const [pegawaiTree, setPegawaiTree] = useState([])
  const [pegawaiDetail, setPegawaiDetail] = useState(null)
  const [loadingTree, setLoadingTree] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({})
  const [expandedServices, setExpandedServices] = useState({})
  const [togglingNodeId, setTogglingNodeId] = useState('')
  const [resettingPegawai, setResettingPegawai] = useState(false)

  // Copy Permission sub-modal
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [copySourceNip, setCopySourceNip] = useState('')
  const [copyingPermission, setCopyingPermission] = useState(false)

  const loadServices = useCallback(async () => {
    setLoadingServices(true)
    setServicesError('')
    try {
      const data = await fetchLayananAccessList()
      setServices(Array.isArray(data) ? data : [])
    } catch (err) {
      const msg = err?.message || 'Gagal memuat daftar layanan.'
      setServicesError(msg)
      toast.error(msg)
    } finally {
      setLoadingServices(false)
    }
  }, [])

  const loadPegawaiList = useCallback(async (searchTerm = '') => {
    setLoadingPegawai(true)
    setPegawaiError('')
    try {
      const data = await fetchServicePegawaiList(searchTerm)
      setPegawaiList(Array.isArray(data) ? data : [])
    } catch (err) {
      const msg = err?.message || 'Gagal memuat daftar pegawai.'
      setPegawaiError(msg)
      toast.error(msg)
    } finally {
      setLoadingPegawai(false)
    }
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  useEffect(() => {
    if (activeTab === 'per_pegawai') {
      loadPegawaiList(pegawaiSearch)
    }
  }, [activeTab, loadPegawaiList, pegawaiSearch])

  // Escape handler for custom modals
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (maintenanceModalOpen) {
        setMaintenanceModalOpen(false)
      } else if (copyDialogOpen) {
        setCopyDialogOpen(false)
      } else if (manageServiceOpen) {
        setManageServiceOpen(false)
      } else if (managePegawaiOpen) {
        setManagePegawaiOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [maintenanceModalOpen, copyDialogOpen, manageServiceOpen, managePegawaiOpen])

  const handleOpenMaintenanceModal = (item) => {
    const isCurrentlyMaintenance = Number(item.is_maintenance) === 1
    setSelectedServiceForMaintenance(item)
    setMaintenanceTargetStatus(!isCurrentlyMaintenance)
    setMaintenanceMsgInput(item.maintenance_msg || '')
    setMaintenanceModalOpen(true)
  }

  const handleSaveMaintenance = async () => {
    if (!selectedServiceForMaintenance) return
    setSavingMaintenance(true)
    const targetStatus = maintenanceTargetStatus ? 1 : 0
    const msg = maintenanceMsgInput.trim()

    try {
      await toggleLayananMaintenance(selectedServiceForMaintenance.id, targetStatus, msg)
      setServices((prev) =>
        prev.map((s) =>
          s.id === selectedServiceForMaintenance.id
            ? {
                ...s,
                is_maintenance: targetStatus,
                maintenance_msg: msg || null,
                maintenance_updated_at: new Date().toISOString(),
              }
            : s
        )
      )
      toast.success(
        targetStatus === 1
          ? `Mode maintenance diaktifkan untuk "${selectedServiceForMaintenance.nama_layanan}".`
          : `Mode maintenance dinonaktifkan untuk "${selectedServiceForMaintenance.nama_layanan}".`
      )
      setMaintenanceModalOpen(false)
    } catch (err) {
      toast.error(err?.message || 'Gagal memperbarui status maintenance.')
    } finally {
      setSavingMaintenance(false)
    }
  }

  // Filtered & paginated services
  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase()
    return services.filter((item) => {
      const matchesMode =
        modeFilter === 'all' || (item.access_mode || 'everyone') === modeFilter
      if (!matchesMode) return false

      const itemLevel = String(item.level_id || (Number(item.is_subservice) === 1 || item.parent_id ? '3' : '2'))
      const matchesLevel = levelFilter === 'all' || itemLevel === levelFilter
      if (!matchesLevel) return false

      if (!q) return true
      return (
        (item.nama_layanan || '').toLowerCase().includes(q) ||
        (item.url || '').toLowerCase().includes(q) ||
        (item.alias || '').toLowerCase().includes(q) ||
        (item.timkerja_nama || '').toLowerCase().includes(q)
      )
    })
  }, [services, serviceSearch, modeFilter, levelFilter])

  const paginatedServices = useMemo(() => {
    const start = (servicePage - 1) * servicePageSize
    return filteredServices.slice(start, start + servicePageSize)
  }, [filteredServices, servicePage, servicePageSize])

  // Paginated pegawai
  const paginatedPegawai = useMemo(() => {
    const start = (pegawaiPage - 1) * pegawaiPageSize
    return pegawaiList.slice(start, start + pegawaiPageSize)
  }, [pegawaiList, pegawaiPage, pegawaiPageSize])

  // --- Handlers: Tab 1 (Per Layanan) ---
  const openManageServiceModal = async (service) => {
    setManageServiceOpen(true)
    setLoadingServiceDetail(true)
    setAssigneeQuery('')
    setAssigneeResults([])
    try {
      const res = await fetchLayananAccessDetail(service.id)
      setActiveServiceDetail(res)
    } catch (err) {
      toast.error(err?.message || 'Gagal memuat konfigurasi akses layanan.')
      setManageServiceOpen(false)
    } finally {
      setLoadingServiceDetail(false)
    }
  }

  const refreshActiveServiceDetail = async (serviceId) => {
    const res = await fetchLayananAccessDetail(serviceId)
    setActiveServiceDetail(res)
    loadServices()
  }

  const handleChangeAccessMode = async (mode) => {
    if (!activeServiceDetail?.service?.id) return
    setSavingMode(true)
    try {
      await saveLayananAccessMode(activeServiceDetail.service.id, mode)
      toast.success(
        `Mode akses diubah menjadi ${mode === 'everyone' ? 'Semua Pegawai' : 'Pegawai Tertentu'}.`
      )
      await refreshActiveServiceDetail(activeServiceDetail.service.id)
    } catch (err) {
      toast.error(err?.message || 'Gagal mengubah mode akses.')
    } finally {
      setSavingMode(false)
    }
  }

  useEffect(() => {
    if (!manageServiceOpen || !assigneeQuery.trim()) {
      return
    }
    const timer = setTimeout(async () => {
      setSearchingAssignee(true)
      try {
        const res = await searchLayananPegawai(assigneeQuery.trim())
        setAssigneeResults(Array.isArray(res) ? res : [])
      } catch {
        setAssigneeResults([])
      } finally {
        setSearchingAssignee(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [assigneeQuery, manageServiceOpen])

  const handleAddAssignee = async (nip) => {
    if (!activeServiceDetail?.service?.id || !nip) return
    setAddingNip(nip)
    try {
      await addLayananAssignee(activeServiceDetail.service.id, nip)
      toast.success(`Pegawai (${nip}) berhasil ditambahkan.`)
      setAssigneeQuery('')
      setAssigneeResults([])
      await refreshActiveServiceDetail(activeServiceDetail.service.id)
    } catch (err) {
      toast.error(err?.message || 'Gagal menambahkan pegawai.')
    } finally {
      setAddingNip('')
    }
  }

  const handleRemoveAssignee = async (nip) => {
    if (!activeServiceDetail?.service?.id || !nip) return
    setRemovingNip(nip)
    try {
      await removeLayananAssignee(activeServiceDetail.service.id, nip)
      toast.success(`Pegawai (${nip}) dihapus dari whitelist.`)
      await refreshActiveServiceDetail(activeServiceDetail.service.id)
    } catch (err) {
      toast.error(err?.message || 'Gagal menghapus pegawai.')
    } finally {
      setRemovingNip('')
    }
  }

  // --- Handlers: Tab 2 (Per Pegawai) ---
  const loadPegawaiTreeData = async (nip) => {
    setLoadingTree(true)
    try {
      const res = await fetchServicePegawaiTree(nip)
      const tree = Array.isArray(res?.tree) ? res.tree : []
      setPegawaiTree(tree)
      setPegawaiDetail(res?.detail || null)
      const initialExpanded = {}
      const initialExpandedServices = {}
      tree.forEach((group) => {
        initialExpanded[group.id] = true
        if (Array.isArray(group.children)) {
          group.children.forEach((c) => {
            if (Array.isArray(c.children) && c.children.length > 0) {
              initialExpandedServices[c.id] = true
            }
          })
        }
      })
      setExpandedGroups(initialExpanded)
      setExpandedServices(initialExpandedServices)
    } catch (err) {
      toast.error(err?.message || 'Gagal memuat tree izin pegawai.')
      setPegawaiTree([])
    } finally {
      setLoadingTree(false)
    }
  }

  const openManagePegawaiModal = async (pegawai) => {
    setSelectedPegawai(pegawai)
    setManagePegawaiOpen(true)
    await loadPegawaiTreeData(pegawai.nip)
  }

  const handleToggleTreeNode = async (node, nodeType) => {
    if (!selectedPegawai?.nip) return
    setTogglingNodeId(node.id)
    try {
      const nextAllowed = !node.allowed
      await toggleServicePegawaiPermission({
        nip: selectedPegawai.nip,
        node_id: node.raw_id || node.id,
        node_type: nodeType,
        allowed: nextAllowed,
      })
      await loadPegawaiTreeData(selectedPegawai.nip)
      loadPegawaiList(pegawaiSearch)
      fetchUserMenuTree().catch(() => null)
      toast.success('Izin layanan pegawai diperbarui.')
    } catch (err) {
      toast.error(err?.message || 'Gagal memperbarui izin layanan.')
    } finally {
      setTogglingNodeId('')
    }
  }

  const handleResetPegawai = async () => {
    if (!selectedPegawai?.nip) return
    setResettingPegawai(true)
    try {
      await resetServicePegawaiPermission(selectedPegawai.nip)
      toast.success('Izin layanan pegawai dikembalikan ke default.')
      await loadPegawaiTreeData(selectedPegawai.nip)
      loadPegawaiList(pegawaiSearch)
      fetchUserMenuTree().catch(() => null)
    } catch (err) {
      toast.error(err?.message || 'Gagal mereset izin pegawai.')
    } finally {
      setResettingPegawai(false)
    }
  }

  const handleCopyPegawaiPermission = async () => {
    if (!selectedPegawai?.nip || !copySourceNip) return
    setCopyingPermission(true)
    try {
      await copyServicePegawaiPermission(copySourceNip, selectedPegawai.nip)
      toast.success('Izin layanan berhasil disalin.')
      setCopyDialogOpen(false)
      setCopySourceNip('')
      await loadPegawaiTreeData(selectedPegawai.nip)
      loadPegawaiList(pegawaiSearch)
      fetchUserMenuTree().catch(() => null)
    } catch (err) {
      toast.error(err?.message || 'Gagal menyalin izin layanan.')
    } finally {
      setCopyingPermission(false)
    }
  }

  const handleRefresh = () => {
    if (activeTab === 'per_layanan') {
      loadServices()
    } else {
      loadPegawaiList(pegawaiSearch)
    }
  }

  const assignedNipsSet = useMemo(() => {
    const list = activeServiceDetail?.assignments || [];
    return new Set(list.map((a) => String(a.nip)))
  }, [activeServiceDetail])

  return (
    <div className="space-y-4 sm:space-y-5 pb-8">
      <SettingsSubpageHeader
        title="Hak Akses Layanan"
        description="Kelola visibilitas dan hak akses pegawai pada setiap modul layanan secara terpusat."
        badgeLabel="Kontrol Akses Layanan"
        badgeColor="blue"
        onReloadClick={handleRefresh}
        isReloading={
          activeTab === 'per_layanan' ? loadingServices : loadingPegawai
        }
      />

      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('per_layanan')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
            activeTab === 'per_layanan'
              ? 'bg-[#175CD3] text-white border-[#175CD3] shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Akses Per Layanan</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('per_pegawai')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
            activeTab === 'per_pegawai'
              ? 'bg-[#175CD3] text-white border-[#175CD3] shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Izin Per Pegawai</span>
        </button>
      </div>

      {/* TAB 1: AKSES PER LAYANAN (Single Main Table) */}
      {activeTab === 'per_layanan' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100/80 dark:border-slate-800/70">
            <ServiceFilterToolbar
              searchTerm={serviceSearch}
              onSearchChange={(val) => {
                setServiceSearch(val)
                setServicePage(1)
              }}
              placeholder="Cari nama layanan atau URL route..."
              totalRecords={filteredServices.length}
              totalLabel="Total Layanan"
              showMonthFilter={false}
              borderless
              extraControls={
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={levelFilter}
                    onChange={(e) => {
                      setLevelFilter(e.target.value)
                      setServicePage(1)
                    }}
                    className="h-9 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#175CD3]"
                  >
                    <option value="all">Semua Level</option>
                    <option value="2">Level 2: Sub Menu (Layanan Induk)</option>
                    <option value="3">Level 3: Layanan Sub Menu (Hub)</option>
                    <option value="4">Level 4: Layanan Eksternal</option>
                  </select>
                  <select
                    value={modeFilter}
                    onChange={(e) => {
                      setModeFilter(e.target.value)
                      setServicePage(1)
                    }}
                    className="h-9 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#175CD3]"
                  >
                    <option value="all">Semua Mode Akses</option>
                    <option value="everyone">Everyone (Semua Pegawai)</option>
                    <option value="assigned">Assigned Only (Tertentu)</option>
                  </select>
                </div>
              }
            />
          </div>

          {servicesError && (
            <div className="p-3.5 sm:p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex flex-wrap items-center justify-between gap-2 font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{servicesError}</span>
              </div>
              <button
                type="button"
                onClick={loadServices}
                className="px-3 py-1 rounded-lg border border-rose-200 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}

          <div className="overflow-x-auto clean-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Layanan" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Mode Akses" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Pegawai Ditugaskan" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Status" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5 text-center">
                    <PmaTableHeader label="Maintenance" align="center" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5 text-right">
                    <PmaTableHeader label="Aksi" align="right" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {loadingServices ? (
                  <TableSkeletonRows colCount={6} />
                ) : paginatedServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center px-4">
                      <div className="mx-auto flex flex-col items-center max-w-sm">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2.5">
                          <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Layanan tidak ditemukan
                        </p>
                        <p className="text-[11px] font-normal text-slate-400 mt-1">
                          Sesuaikan kata kunci pencarian atau filter mode akses untuk melihat daftar layanan.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedServices.map((item) => {
                    const isAssigned = (item.access_mode || 'everyone') === 'assigned'
                    const isShown = Number(item.is_show) === 1
                    const isMaint = Number(item.is_maintenance) === 1
                    const levelId = Number(item.level_id || (Number(item.is_subservice) === 1 || item.parent_id ? 3 : 2))
                    const isSub = levelId === 3
                    const isExternal = levelId === 4
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors ${
                          isSub
                            ? 'bg-slate-50/40 dark:bg-slate-800/20'
                            : isExternal
                              ? 'bg-purple-50/15 dark:bg-purple-950/10'
                              : ''
                        }`}
                      >
                        <td className={`px-4 sm:px-5 py-3 ${isSub ? 'pl-8 sm:pl-10' : ''}`}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isSub && (
                              <CornerDownRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            )}
                            {isExternal && (
                              <ExternalLink className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            )}
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {item.nama_layanan}
                            </div>
                            {levelId === 2 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 whitespace-nowrap">
                                Sub Menu {item.timkerja_nama ? `• ${item.timkerja_nama}` : ''}
                              </span>
                            )}
                            {isSub && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40 whitespace-nowrap">
                                Layanan Hub: {item.parent_nama || 'Induk Hub'}
                              </span>
                            )}
                            {isExternal && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40 whitespace-nowrap">
                                Layanan Eksternal
                              </span>
                            )}
                          </div>
                          <div className={`text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 ${isSub ? 'ml-5' : ''}`}>
                            {item.url ? (item.url.startsWith('http') ? item.url : `/${item.url}`) : '-'}
                          </div>
                        </td>
                        <td className="px-4 sm:px-5 py-3">
                          {isAssigned ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 whitespace-nowrap">
                              <UserCheck className="w-3.5 h-3.5" />
                              Assigned Only
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 whitespace-nowrap">
                              <Globe className="w-3.5 h-3.5" />
                              Everyone
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                          {isAssigned ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {item.total_assigned || 0} Pegawai
                            </span>
                          ) : (
                            <span className="font-normal text-slate-400">
                              Terbuka untuk semua
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                              isShown
                                ? 'bg-blue-50 text-[#175CD3] border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                          >
                            {isShown ? 'Aktif' : 'Tersembunyi'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isMaint}
                              onClick={() => handleOpenMaintenanceModal(item)}
                              title={
                                isMaint
                                  ? 'Klik untuk menonaktifkan mode maintenance'
                                  : 'Klik untuk mengaktifkan mode maintenance'
                              }
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                                isMaint ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  isMaint ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                isMaint
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {isMaint ? (
                                <>
                                  <Wrench className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                  Maint
                                </>
                              ) : (
                                'Normal'
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-5 py-3 text-right">
                          <PmaActionButtons onEdit={() => openManageServiceModal(item)} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/60">
            <ServiceTablePagination
              page={servicePage}
              pageSize={servicePageSize}
              total={filteredServices.length}
              unitLabel="layanan"
              onPageChange={setServicePage}
              onPageSizeChange={(size) => {
                setServicePageSize(size)
                setServicePage(1)
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: IZIN PER PEGAWAI (Single Main Table) */}
      {activeTab === 'per_pegawai' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100/80 dark:border-slate-800/70">
            <ServiceFilterToolbar
              searchTerm={pegawaiSearch}
              onSearchChange={(val) => {
                setPegawaiSearch(val)
                setPegawaiPage(1)
              }}
              placeholder="Cari nama pegawai, NIP, atau unit kerja..."
              totalRecords={pegawaiList.length}
              totalLabel="Total Pegawai"
              showMonthFilter={false}
              borderless
            />
          </div>

          {pegawaiError && (
            <div className="p-3.5 sm:p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex flex-wrap items-center justify-between gap-2 font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{pegawaiError}</span>
              </div>
              <button
                type="button"
                onClick={() => loadPegawaiList(pegawaiSearch)}
                className="px-3 py-1 rounded-lg border border-rose-200 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}

          <div className="overflow-x-auto clean-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Pegawai & NIP" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Unit Kerja" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Role" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Layanan Diizinkan" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5 text-right">
                    <PmaTableHeader label="Aksi" align="right" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {loadingPegawai ? (
                  <TableSkeletonRows colCount={5} />
                ) : paginatedPegawai.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center px-4">
                      <div className="mx-auto flex flex-col items-center max-w-sm">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2.5">
                          <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Pegawai tidak ditemukan
                        </p>
                        <p className="text-[11px] font-normal text-slate-400 mt-1">
                          Coba ubah kata kunci nama atau NIP pegawai yang dicari.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPegawai.map((peg) => (
                    <tr
                      key={peg.nip}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 sm:px-5 py-3">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {peg.nama || '-'}
                        </div>
                        <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                          NIP: {peg.nip}
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {peg.unit_kerja_nama || '-'}
                      </td>
                      <td className="px-4 sm:px-5 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 whitespace-nowrap">
                          {peg.role_name || peg.user_role || 'User'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {peg.total_allowed_services ?? 0}
                        </span>
                        <span className="font-normal text-slate-400">
                          {' '}
                          / {peg.total_active_services ?? 0} Layanan
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-right">
                        <PmaActionButtons onEdit={() => openManagePegawaiModal(peg)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/60">
            <ServiceTablePagination
              page={pegawaiPage}
              pageSize={pegawaiPageSize}
              total={pegawaiList.length}
              unitLabel="pegawai"
              onPageChange={setPegawaiPage}
              onPageSizeChange={(size) => {
                setPegawaiPageSize(size)
                setPegawaiPage(1)
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Kelola Hak Akses Layanan */}
      {manageServiceOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Kelola Hak Akses: {activeServiceDetail?.service?.nama_layanan || 'Layanan'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Atur mode akses layanan apakah terbuka untuk semua pegawai atau hanya pegawai yang ditugaskan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManageServiceOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {loadingServiceDetail ? (
                <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin text-[#175CD3]" />
                  <span>Memuat konfigurasi layanan...</span>
                </div>
              ) : (
                activeServiceDetail?.service && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Mode Akses Layanan
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          disabled={savingMode}
                          onClick={() => handleChangeAccessMode('everyone')}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            (activeServiceDetail.service.access_mode || 'everyone') === 'everyone'
                              ? 'border-[#175CD3] bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-[#175CD3]'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              Everyone (Semua Pegawai)
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Seluruh pegawai dengan akses menu dapat membuka layanan ini.
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          disabled={savingMode}
                          onClick={() => handleChangeAccessMode('assigned')}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            activeServiceDetail.service.access_mode === 'assigned'
                              ? 'border-[#175CD3] bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-[#175CD3]'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              Assigned Only (Pegawai Tertentu)
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Hanya pegawai yang masuk whitelist di bawah yang dapat mengakses.
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Whitelist Pegawai ({activeServiceDetail.assignments?.length || 0})
                      </label>

                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={assigneeQuery}
                          onChange={(e) => {
                            const val = e.target.value
                            setAssigneeQuery(val)
                            if (!val.trim()) setAssigneeResults([])
                          }}
                          placeholder="Ketik nama atau NIP pegawai untuk ditambahkan..."
                          className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#175CD3]"
                        />
                      </div>

                      {searchingAssignee && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 px-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Mencari pegawai...</span>
                        </div>
                      )}

                      {assigneeResults.length > 0 && (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto bg-slate-50/50 dark:bg-slate-800/30">
                          {assigneeResults.map((p) => {
                            const already = assignedNipsSet.has(String(p.nip))
                            return (
                              <div
                                key={p.nip}
                                className="flex items-center justify-between px-3 py-2 text-xs"
                              >
                                <div>
                                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                                    {p.nama}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {p.nip}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  disabled={already || addingNip === p.nip}
                                  onClick={() => handleAddAssignee(p.nip)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                                    already
                                      ? 'border border-slate-200 bg-white text-slate-500'
                                      : 'bg-[#175CD3] hover:bg-[#1550B8] text-white'
                                  }`}
                                >
                                  {already ? (
                                    'Sudah Ditugaskan'
                                  ) : addingNip === p.nip ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Tambah</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                        {(activeServiceDetail.assignments || []).length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500">
                            Belum ada pegawai yang ditugaskan secara khusus.
                          </div>
                        ) : (
                          activeServiceDetail.assignments.map((a) => (
                            <div
                              key={a.nip}
                              className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                            >
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-100">
                                  {a.nama || 'Pegawai'}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  NIP: {a.nip}
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={removingNip === a.nip}
                                onClick={() => handleRemoveAssignee(a.nip)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                                title="Hapus dari whitelist"
                              >
                                {removingNip === a.nip ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center justify-end px-5 sm:px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setManageServiceOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Kelola Izin Layanan Pegawai (Tree) */}
      {managePegawaiOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Izin Layanan: {selectedPegawai?.nama || 'Pegawai'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  NIP: {selectedPegawai?.nip || '-'} •{' '}
                  {pegawaiDetail?.unit_kerja_nama ||
                    selectedPegawai?.unit_kerja_nama ||
                    '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagePegawaiOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCopyDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin dari Pegawai Lain</span>
              </button>
              <button
                type="button"
                disabled={resettingPegawai}
                onClick={handleResetPegawai}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100/70 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {loadingTree ? (
                <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin text-[#175CD3]" />
                  <span>Memuat struktur tim kerja & layanan...</span>
                </div>
              ) : pegawaiTree.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  Tidak ada data layanan yang tersedia.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pegawaiTree.map((group) => {
                    const isExpanded = !!expandedGroups[group.id]
                    const isToggling = togglingNodeId === group.id
                    return (
                      <div
                        key={group.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                      >
                        <div className="flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedGroups((prev) => ({
                                  ...prev,
                                  [group.id]: !prev[group.id],
                                }))
                              }
                              className="p-0.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() =>
                                handleToggleTreeNode(group, 'tim_kerja')
                              }
                              className="text-slate-700 dark:text-slate-200 hover:text-[#175CD3] disabled:opacity-50 cursor-pointer"
                            >
                              {group.is_partial ? (
                                <MinusSquare className="w-4 h-4 text-amber-600" />
                              ) : group.allowed ? (
                                <CheckSquare className="w-4 h-4 text-[#175CD3]" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {group.name}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            {group.allowed_count ?? 0} / {group.total_count ?? 0}
                          </span>
                        </div>

                        {isExpanded && Array.isArray(group.children) && (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {group.children.map((child) => {
                              const childToggling = togglingNodeId === child.id
                              const hasSubChildren = Array.isArray(child.children) && child.children.length > 0
                              const isSubExpanded = !!expandedServices[child.id]
                              return (
                                <div key={child.id} className="transition-colors">
                                  <div className="flex items-center justify-between pl-8 sm:pl-10 pr-4 py-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                    <div className="flex items-center gap-1.5">
                                      {hasSubChildren && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedServices((prev) => ({
                                              ...prev,
                                              [child.id]: !prev[child.id],
                                            }))
                                          }
                                          className="p-0.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                                        >
                                          {isSubExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        disabled={childToggling}
                                        onClick={() =>
                                          handleToggleTreeNode(child, 'layanan')
                                        }
                                        className="flex items-center gap-2.5 text-left disabled:opacity-50 cursor-pointer"
                                      >
                                        {child.is_partial ? (
                                          <MinusSquare className="w-4 h-4 text-amber-600 shrink-0" />
                                        ) : child.allowed ? (
                                          <CheckSquare className="w-4 h-4 text-[#175CD3] shrink-0" />
                                        ) : (
                                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                        )}
                                        <div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-semibold">
                                              {child.name}
                                            </div>
                                            {hasSubChildren && (
                                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                Hub ({child.children.length} Sub-Layanan)
                                              </span>
                                            )}
                                          </div>
                                          {child.url && (
                                            <div className="text-[11px] font-normal text-slate-400">
                                              /{child.url}
                                            </div>
                                          )}
                                        </div>
                                      </button>
                                    </div>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                        child.allowed
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                                          : child.is_partial
                                          ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
                                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                      }`}
                                    >
                                      {child.allowed
                                        ? 'Diizinkan'
                                        : child.is_partial
                                        ? 'Sebagian'
                                        : 'Dibatasi'}
                                    </span>
                                  </div>

                                  {hasSubChildren && isSubExpanded && (
                                    <div className="divide-y divide-slate-100/70 dark:divide-slate-800/70 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                                      {child.children.map((subChild) => {
                                        const subToggling = togglingNodeId === subChild.id
                                        return (
                                          <div
                                            key={subChild.id}
                                            className="flex items-center justify-between pl-14 sm:pl-16 pr-4 py-2 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                                          >
                                            <button
                                              type="button"
                                              disabled={subToggling}
                                              onClick={() =>
                                                handleToggleTreeNode(subChild, 'subservice')
                                              }
                                              className="flex items-center gap-2 text-left disabled:opacity-50 cursor-pointer"
                                            >
                                              <CornerDownRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                              {subChild.allowed ? (
                                                <CheckSquare className="w-4 h-4 text-[#175CD3] shrink-0" />
                                              ) : (
                                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                              )}
                                              <div>
                                                <div className="text-xs text-slate-800 dark:text-slate-100 font-semibold">
                                                  {subChild.name}
                                                </div>
                                                {subChild.url && (
                                                  <div className="text-[10.5px] font-normal text-slate-400">
                                                    /{subChild.url}
                                                  </div>
                                                )}
                                              </div>
                                            </button>
                                            <span
                                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                subChild.allowed
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                                                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                              }`}
                                            >
                                              {subChild.allowed ? 'Diizinkan' : 'Dibatasi'}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end px-5 sm:px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setManagePegawaiOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Sub-modal Salin Izin dari Pegawai Lain */}
      {copyDialogOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Salin Izin Layanan Pegawai
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih pegawai sumber untuk menyalin seluruh konfigurasi izin ke{' '}
                <strong>{selectedPegawai?.nama}</strong>.
              </p>
            </div>
            <div className="p-5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Pegawai Sumber
              </label>
              <select
                value={copySourceNip}
                onChange={(e) => setCopySourceNip(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- Pilih Pegawai Sumber --</option>
                {pegawaiList
                  .filter((p) => p.nip !== selectedPegawai?.nip)
                  .map((p) => (
                    <option key={p.nip} value={p.nip}>
                      {p.nama} ({p.nip})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setCopyDialogOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!copySourceNip || copyingPermission}
                onClick={handleCopyPegawaiPermission}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {copyingPermission ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyalin...</span>
                  </>
                ) : (
                  <span>Salin Izin</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Pengaturan Mode Maintenance Layanan */}
      {maintenanceModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header Modal */}
              <div
                className={`px-6 py-5 border-b flex items-start justify-between gap-3 ${
                  maintenanceTargetStatus
                    ? 'border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20'
                    : 'border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      maintenanceTargetStatus
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                    }`}
                  >
                    {maintenanceTargetStatus ? (
                      <Wrench className="w-5 h-5" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {maintenanceTargetStatus
                        ? 'Aktifkan Mode Pemeliharaan'
                        : 'Nonaktifkan Mode Pemeliharaan'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Kelola status pemeliharaan untuk layanan ini.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Modal */}
              <div className="p-6 space-y-4">
                {/* Service Target Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Layanan Target
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedServiceForMaintenance?.nama_layanan}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    /{selectedServiceForMaintenance?.url || '-'}
                  </div>
                </div>

                {maintenanceTargetStatus ? (
                  <>
                    <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Dampak Mode Pemeliharaan:
                      </div>
                      <p>
                        Pengguna reguler yang membuka rute layanan ini akan otomatis dialihkan ke halaman pemeliharaan (maintenance) dan tidak dapat mengakses transaksi.
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        Superadmin tetap dapat membuka halaman dengan tanda banner kuning (Admin Bypass).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Pesan Pemeliharaan untuk Pengguna (Opsional)
                      </label>
                      <textarea
                        rows={3}
                        value={maintenanceMsgInput}
                        onChange={(e) => setMaintenanceMsgInput(e.target.value)}
                        placeholder="Contoh: Sedang dilakukan peningkatan sistem SIASN dan pemeliharaan basis data. Harap coba beberapa saat lagi."
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Pesan ini akan ditampilkan kepada pengguna saat mereka membuka halaman layanan.
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                      <Globe className="w-4 h-4 shrink-0" />
                      Membuka Kembali Layanan:
                    </div>
                    <p>
                      Mode pemeliharaan akan dinonaktifkan. Seluruh pengguna yang berhak akan dapat kembali mengakses halaman dan fungsi layanan ini secara normal.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60">
                <button
                  type="button"
                  onClick={() => setMaintenanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingMaintenance}
                  onClick={handleSaveMaintenance}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                    maintenanceTargetStatus
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  }`}
                >
                  {savingMaintenance ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>
                      {maintenanceTargetStatus ? 'Aktifkan Maintenance' : 'Buka Layanan'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
