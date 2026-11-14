import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  ShieldCheck,
  Users,
  FolderTree,
  CheckSquare,
  Loader2,
  Save,
  X,
  Search,
  UserPlus,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  ChevronsUpDown,
  Link2,
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  fetchRolesList,
  fetchRoleTree,
  toggleRolePermissionItem,
  fetchRoleUsers,
  assignUserToRole,
  fetchMenusTree,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../../services/api/settingsApi'
import { SettingsSubpageHeader } from './components/SettingsSubpageHeader'
import { PmaKpiGrid } from '../../components/shared/services/pma/PmaKpiGrid'
import { PmaTableHeader, PmaActionButtons } from '../../components/shared/services/pma/PmaTableCells'
import { PmaDeleteConfirmDialog } from '../../components/shared/services/pma/PmaDeleteConfirmDialog'
import { ServiceFilterToolbar } from '../../components/shared/services/ServiceFilterToolbar'
import { ServiceTablePagination } from '../../components/shared/services/ServiceTablePagination'

function collectAllowedMap(nodes = [], map = new Map()) {
  nodes.forEach((n) => {
    map.set(Number(n.id), Boolean(n.allowed))
    if (Array.isArray(n.children) && n.children.length > 0) {
      collectAllowedMap(n.children, map)
    }
  })
  return map
}

function collectParentIds(nodes = [], out = new Set()) {
  nodes.forEach((n) => {
    if (Array.isArray(n.children) && n.children.length > 0) {
      out.add(Number(n.id))
      collectParentIds(n.children, out)
    }
  })
  return out
}

function mergeTreeWithPermissions(menuNodes = [], adminMap = new Map(), userMap = new Map(), depth = 0) {
  return menuNodes.map((node) => {
    const id = Number(node.id)
    const children = Array.isArray(node.children)
      ? mergeTreeWithPermissions(node.children, adminMap, userMap, depth + 1)
      : []
    return {
      ...node,
      id,
      depth,
      adminAllowed: adminMap.get(id) ?? false,
      userAllowed: userMap.get(id) ?? false,
      children,
    }
  })
}

function filterTreeNodes(nodes = [], search = '', permFilter = '') {
  const q = search.trim().toLowerCase()
  const out = []

  nodes.forEach((node) => {
    const filteredChildren = filterTreeNodes(node.children || [], search, permFilter)
    const matchesSearch =
      !q ||
      String(node.name || '').toLowerCase().includes(q) ||
      String(node.url || '').toLowerCase().includes(q)

    const matchesPerm =
      !permFilter ||
      (permFilter === 'admin' && node.adminAllowed) ||
      (permFilter === 'user' && node.userAllowed) ||
      (permFilter === 'both' && node.adminAllowed && node.userAllowed)

    if ((matchesSearch && matchesPerm) || filteredChildren.length > 0) {
      out.push({
        ...node,
        children: filteredChildren,
      })
    }
  })

  return out
}

function flattenVisibleTree(nodes = [], expandedIds = new Set(), forceExpandAll = false, out = []) {
  nodes.forEach((node) => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0
    const isExpanded = forceExpandAll || expandedIds.has(node.id)
    out.push({ ...node, hasChildren, isExpanded })
    if (hasChildren && isExpanded) {
      flattenVisibleTree(node.children, expandedIds, forceExpandAll, out)
    }
  })
  return out
}

function flattenAllMenus(nodes = [], depth = 0, out = []) {
  nodes.forEach((n) => {
    out.push({ ...n, depth })
    if (Array.isArray(n.children) && n.children.length > 0) {
      flattenAllMenus(n.children, depth + 1, out)
    }
  })
  return out
}

export default function SettingsRolesPage() {
  const [activeTab, setActiveTab] = useState('matrix') // 'matrix' | 'users'
  const [roles, setRoles] = useState([])
  const [menusTree, setMenusTree] = useState([])
  const [adminAllowedMap, setAdminAllowedMap] = useState(new Map())
  const [userAllowedMap, setUserAllowedMap] = useState(new Map())

  const [expandedIds, setExpandedIds] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [permFilter, setPermFilter] = useState('')
  const [togglingKey, setTogglingKey] = useState('') // `${roleCode}:${menuId}`

  const [isLoading, setIsLoading] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Users per Role tab state
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [roleUsersData, setRoleUsersData] = useState({ assigned_users: [], available_users: [] })
  const [userSearch, setUserSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assigningUserId, setAssigningUserId] = useState(null)
  const [userPage, setUserPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(10)

  // Modal Menu Form
  const [menuModalOpen, setMenuModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState(null)
  const [menuForm, setMenuForm] = useState({
    parent_id: '',
    name: '',
    url: '',
    icon: 'bi bi-circle',
    sort: 0,
    is_active: true,
  })
  const [savingMenu, setSavingMenu] = useState(false)
  const [menuFormError, setMenuFormError] = useState('')
  const [deletingMenu, setDeletingMenu] = useState(null)
  const [isDeletingMenu, setIsDeletingMenu] = useState(false)

  const adminRole = useMemo(
    () => roles.find((r) => String(r.role_code || '').toUpperCase() === 'ADM') || null,
    [roles]
  )
  const userRole = useMemo(
    () => roles.find((r) => String(r.role_code || '').toUpperCase() === 'USR') || null,
    [roles]
  )

  const loadMatrixData = useCallback(async (manual = false) => {
    try {
      if (manual) setIsReloading(true)
      else setIsLoading(true)
      setErrorMsg('')

      const [rolesList, masterMenus] = await Promise.all([
        fetchRolesList(false),
        fetchMenusTree(),
      ])

      const safeRoles = Array.isArray(rolesList) ? rolesList : []
      const safeMenus = Array.isArray(masterMenus) ? masterMenus : []

      setRoles(safeRoles)
      setMenusTree(safeMenus)
      setSelectedRoleId((prev) => {
        if (prev && safeRoles.some((r) => r.id === prev)) return prev
        return safeRoles[0]?.id ?? null
      })

      setExpandedIds((prev) => {
        if (prev.size > 0) return prev
        return collectParentIds(safeMenus)
      })

      const adm = safeRoles.find((r) => String(r.role_code || '').toUpperCase() === 'ADM')
      const usr = safeRoles.find((r) => String(r.role_code || '').toUpperCase() === 'USR')

      const [admTreeRes, usrTreeRes] = await Promise.all([
        adm ? fetchRoleTree(adm.id) : Promise.resolve({ tree: [] }),
        usr ? fetchRoleTree(usr.id) : Promise.resolve({ tree: [] }),
      ])

      setAdminAllowedMap(collectAllowedMap(Array.isArray(admTreeRes?.tree) ? admTreeRes.tree : []))
      setUserAllowedMap(collectAllowedMap(Array.isArray(usrTreeRes?.tree) ? usrTreeRes.tree : []))
    } catch (err) {
      const msg = err.message || 'Gagal memuat matriks role dan menu.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
      setIsReloading(false)
    }
  }, [])

  const loadRoleUsers = useCallback(async (roleId, q = '') => {
    if (!roleId) return
    setLoadingUsers(true)
    setErrorMsg('')
    try {
      const res = await fetchRoleUsers(roleId, q)
      setRoleUsersData({
        assigned_users: Array.isArray(res?.assigned_users) ? res.assigned_users : [],
        available_users: Array.isArray(res?.available_users) ? res.available_users : [],
      })
    } catch (err) {
      const msg = err.message || 'Gagal memuat daftar pengguna role.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    loadMatrixData(false)
  }, [loadMatrixData])

  useEffect(() => {
    if (activeTab === 'users' && selectedRoleId) {
      loadRoleUsers(selectedRoleId, userSearch)
    }
  }, [activeTab, selectedRoleId, userSearch, loadRoleUsers])

  const mergedTree = useMemo(
    () => mergeTreeWithPermissions(menusTree, adminAllowedMap, userAllowedMap),
    [menusTree, adminAllowedMap, userAllowedMap]
  )

  const filteredTree = useMemo(
    () => filterTreeNodes(mergedTree, searchTerm, permFilter),
    [mergedTree, searchTerm, permFilter]
  )

  const isFiltering = Boolean(searchTerm.trim() || permFilter)

  const visibleRows = useMemo(
    () => flattenVisibleTree(filteredTree, expandedIds, isFiltering),
    [filteredTree, expandedIds, isFiltering]
  )

  const flatMenus = useMemo(() => flattenAllMenus(mergedTree), [mergedTree])
  const allParentIds = useMemo(() => collectParentIds(mergedTree), [mergedTree])
  const parentMenuOptions = useMemo(() => flatMenus.filter((m) => m.depth < 2), [flatMenus])

  const kpis = useMemo(() => {
    const totalMembers = roles.reduce((a, b) => a + Number(b.total_users || 0), 0)
    const adminPermCount = flatMenus.filter((m) => m.adminAllowed).length
    const userPermCount = flatMenus.filter((m) => m.userAllowed).length
    return [
      {
        id: 'total-menus',
        label: 'TOTAL MENU',
        value: flatMenus.length,
        unit: 'Menu',
        context: `${allParentIds.size} grup menu induk`,
        badge: 'Hierarki',
        badgeColor: 'blue',
        icon: FolderTree,
      },
      {
        id: 'admin-perms',
        label: 'IZIN ADMIN (ADM)',
        value: adminPermCount,
        unit: 'Menu',
        context: 'Menu diizinkan untuk Admin',
        badge: 'ADM',
        badgeColor: 'indigo',
        icon: ShieldCheck,
      },
      {
        id: 'user-perms',
        label: 'IZIN USER (USR)',
        value: userPermCount,
        unit: 'Menu',
        context: 'Menu diizinkan untuk User',
        badge: 'USR',
        badgeColor: 'emerald',
        icon: CheckSquare,
      },
      {
        id: 'assigned-users',
        label: 'PENGGUNA TERPETAKAN',
        value: totalMembers,
        unit: 'Akun',
        context: `${roles.length} role aktif di sistem`,
        badge: 'RBAC',
        badgeColor: 'amber',
        icon: Users,
      },
    ]
  }, [flatMenus, allParentIds.size, roles])

  const handleToggleExpand = (nodeId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  const isAllExpanded = allParentIds.size > 0 && Array.from(allParentIds).every((id) => expandedIds.has(id))

  const handleToggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedIds(new Set())
    } else {
      setExpandedIds(new Set(allParentIds))
    }
  }

  const handleTogglePermission = async (node, targetRoleCode) => {
    const targetRole = targetRoleCode === 'ADM' ? adminRole : userRole
    if (!targetRole) {
      toast.error(`Role ${targetRoleCode} tidak ditemukan di database.`)
      return
    }

    const currentAllowed = targetRoleCode === 'ADM' ? node.adminAllowed : node.userAllowed
    const nextAllowed = !currentAllowed
    const key = `${targetRoleCode}:${node.id}`

    setTogglingKey(key)
    try {
      await toggleRolePermissionItem({
        role_id: targetRole.id,
        menu_id: node.id,
        allowed: nextAllowed,
        cascade: true,
      })

      const [updatedTreeRes, updatedRoles] = await Promise.all([
        fetchRoleTree(targetRole.id),
        fetchRolesList(false),
      ])

      const nextMap = collectAllowedMap(Array.isArray(updatedTreeRes?.tree) ? updatedTreeRes.tree : [])
      if (targetRoleCode === 'ADM') {
        setAdminAllowedMap(nextMap)
      } else {
        setUserAllowedMap(nextMap)
      }
      if (Array.isArray(updatedRoles)) {
        setRoles(updatedRoles)
      }

      toast.success(
        `Akses ${targetRoleCode === 'ADM' ? 'Admin' : 'User'} untuk "${node.name}" ${
          nextAllowed ? 'diaktifkan' : 'dinonaktifkan'
        }.`
      )
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui permission role.')
    } finally {
      setTogglingKey('')
    }
  }

  const handleAssignUser = async (userId) => {
    if (!selectedRoleId) return
    setAssigningUserId(userId)
    try {
      await assignUserToRole(userId, selectedRoleId)
      const selectedRole = roles.find((r) => r.id === selectedRoleId)
      toast.success(`Pengguna berhasil dipindahkan ke role ${selectedRole?.role_code || ''}.`)
      await Promise.all([loadRoleUsers(selectedRoleId, userSearch), loadMatrixData(true)])
    } catch (err) {
      toast.error(err.message || 'Gagal menetapkan role pengguna.')
    } finally {
      setAssigningUserId(null)
    }
  }

  const openCreateMenu = () => {
    setEditingMenu(null)
    setMenuForm({ parent_id: '', name: '', url: '', icon: 'bi bi-circle', sort: 0, is_active: true })
    setMenuFormError('')
    setMenuModalOpen(true)
  }

  const openEditMenu = (menu) => {
    setEditingMenu(menu)
    setMenuForm({
      parent_id: menu.parent_id ? String(menu.parent_id) : '',
      name: menu.name || '',
      url: menu.url || '',
      icon: menu.icon || '',
      sort: Number(menu.sort ?? 0),
      is_active: Boolean(menu.is_active),
    })
    setMenuFormError('')
    setMenuModalOpen(true)
  }

  const handleSaveMenu = async (e) => {
    e.preventDefault()
    setMenuFormError('')
    setSavingMenu(true)
    try {
      const payload = {
        parent_id: menuForm.parent_id ? Number(menuForm.parent_id) : null,
        name: menuForm.name,
        url: menuForm.url,
        icon: menuForm.icon,
        sort: Number(menuForm.sort || 0),
        is_active: menuForm.is_active ? '1' : '0',
      }
      if (editingMenu) {
        await updateMenuItem(editingMenu.id, payload)
        toast.success('Menu berhasil diperbarui.')
      } else {
        await createMenuItem(payload)
        toast.success('Menu baru berhasil ditambahkan.')
      }
      setMenuModalOpen(false)
      await loadMatrixData(true)
    } catch (err) {
      setMenuFormError(err.message || 'Gagal menyimpan item menu.')
    } finally {
      setSavingMenu(false)
    }
  }

  const handleDeleteMenu = async () => {
    if (!deletingMenu) return
    setIsDeletingMenu(true)
    try {
      await deleteMenuItem(deletingMenu.id)
      toast.success('Menu berhasil dihapus.')
      setDeletingMenu(null)
      await loadMatrixData(true)
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus menu.')
    } finally {
      setIsDeletingMenu(false)
    }
  }

  // Combined user list for "Pengguna per Role" single table
  const combinedRoleUsers = useMemo(() => {
    const assigned = (roleUsersData.assigned_users || []).map((u) => ({ ...u, _isAssigned: true }))
    const available = (roleUsersData.available_users || []).map((u) => ({ ...u, _isAssigned: false }))
    return [...assigned, ...available]
  }, [roleUsersData])

  const paginatedRoleUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize
    return combinedRoleUsers.slice(start, start + userPageSize)
  }, [combinedRoleUsers, userPage, userPageSize])

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  )

  return (
    <div className="space-y-4 sm:space-y-5 pb-8">
      <SettingsSubpageHeader
        title="Manajemen Role & Struktur Menu"
        description="Kelola hak akses menu berbasis tree diagram (Admin & User) dengan relasi parent-child serta distribusi pengguna per role."
        badgeLabel="Pengaturan • Role & RBAC"
        onReloadClick={() => {
          loadMatrixData(true)
          if (activeTab === 'users' && selectedRoleId) {
            loadRoleUsers(selectedRoleId, userSearch)
          }
        }}
        isReloading={isReloading || isLoading}
        onAddEntryClick={activeTab === 'matrix' ? openCreateMenu : undefined}
        addEntryLabel={activeTab === 'matrix' ? 'Tambah Menu' : undefined}
      />

      <PmaKpiGrid kpis={kpis} isLoading={isLoading} />

      {/* Nav Pill Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 w-fit overflow-x-auto">
        {[
          { id: 'matrix', label: 'Matriks Izin Menu (Tree Diagram)' },
          { id: 'users', label: 'Pengguna per Role' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'matrix' ? (
        <>
          <ServiceFilterToolbar
            borderless
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Cari nama menu atau route halaman..."
            showMonthFilter={false}
            totalRecords={visibleRows.length}
            totalLabel="Menu Ditampilkan"
            categories={[
              { label: 'Diizinkan Admin', value: 'admin' },
              { label: 'Diizinkan User', value: 'user' },
              { label: 'Keduanya Aktif', value: 'both' },
            ]}
            activeCategory={permFilter}
            onCategoryChange={setPermFilter}
            extraControls={
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <ChevronsUpDown className="w-4 h-4 text-slate-400" />
                <span>{isAllExpanded ? 'Tutup Semua' : 'Buka Semua'}</span>
              </button>
            }
          />

          {/* Single-Card Tree Diagram Table: Nama Menu | Halaman/Routes | Admin | User | Aksi */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {errorMsg && (
              <div className="p-3.5 sm:p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="overflow-x-auto clean-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 sm:px-5">
                      <PmaTableHeader label="Nama Menu" />
                    </th>
                    <th className="py-3.5 px-4 sm:px-5">
                      <PmaTableHeader label="Halaman / Routes" />
                    </th>
                    <th className="py-3.5 px-4 sm:px-5 text-center w-28">
                      <PmaTableHeader label="Admin" align="center" />
                    </th>
                    <th className="py-3.5 px-4 sm:px-5 text-center w-28">
                      <PmaTableHeader label="User" align="center" />
                    </th>
                    <th className="py-3.5 px-4 sm:px-5 text-right w-32">
                      <PmaTableHeader label="Aksi" align="right" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, rIdx) => (
                      <tr key={rIdx} className="animate-pulse">
                        {Array.from({ length: 5 }).map((__, cIdx) => (
                          <td key={cIdx} className="py-4 px-4">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Search className="w-5 h-5 text-slate-400" />
                          </div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {isFiltering
                              ? 'Tidak ada menu yang sesuai dengan pencarian'
                              : 'Belum ada struktur menu terdaftar'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {isFiltering
                              ? 'Coba ubah kata kunci pencarian atau bersihkan filter'
                              : 'Klik tombol Tambah Menu di atas untuk menambahkan menu baru'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((node) => {
                      const isAdminBusy = togglingKey === `ADM:${node.id}`
                      const isUserBusy = togglingKey === `USR:${node.id}`
                      const formattedRoute = node.url
                        ? `/${String(node.url).replace(/^\/+/, '')}`
                        : '-'

                      return (
                        <tr
                          key={node.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            node.depth === 0 ? 'bg-slate-50/30 dark:bg-slate-800/10' : ''
                          }`}
                        >
                          {/* 1. Nama Menu (Tree Accordion) */}
                          <td className="py-3 px-4 sm:px-5">
                            <div
                              className="flex items-center gap-2 min-w-0"
                              style={{ paddingLeft: `${node.depth * 24}px` }}
                            >
                              {node.depth > 0 && (
                                <span className="w-3 h-3 border-l border-b border-slate-300 dark:border-slate-700 rounded-bl-sm shrink-0 -mt-1.5" />
                              )}

                              {node.hasChildren ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleExpand(node.id)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer shrink-0"
                                  title={node.isExpanded ? 'Ciutkan sub-menu' : 'Bentangkan sub-menu'}
                                >
                                  {node.isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-6 h-6 shrink-0" />
                              )}

                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  node.hasChildren
                                    ? 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {node.hasChildren ? (
                                  node.isExpanded ? (
                                    <FolderOpen className="w-3.5 h-3.5" />
                                  ) : (
                                    <Folder className="w-3.5 h-3.5" />
                                  )
                                ) : (
                                  <FileText className="w-3.5 h-3.5" />
                                )}
                              </div>

                              <span
                                className={`text-left truncate max-w-xs sm:max-w-sm ${
                                  node.depth === 0
                                    ? 'text-xs sm:text-sm font-bold text-slate-900 dark:text-white'
                                    : 'text-xs font-semibold text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                {node.name}
                              </span>

                              {node.hasChildren && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                                  {node.children.length}
                                </span>
                              )}

                              {!node.is_active && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 shrink-0">
                                  Tersembunyi
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Halaman / Routes */}
                          <td className="py-3 px-4 sm:px-5">
                            {formattedRoute !== '-' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 whitespace-nowrap">
                                <Link2 className="w-3 h-3 text-slate-400" />
                                <span>{formattedRoute}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>

                          {/* 3. Admin Checkbox */}
                          <td className="py-3 px-4 sm:px-5 text-center">
                            <label className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-blue-50/70 dark:hover:bg-blue-950/30 cursor-pointer">
                              {isAdminBusy ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#175CD3]" />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={Boolean(node.adminAllowed)}
                                  disabled={Boolean(togglingKey)}
                                  onChange={() => handleTogglePermission(node, 'ADM')}
                                  aria-label={`Akses Admin untuk ${node.name}`}
                                  className="w-4 h-4 rounded border-slate-300 text-[#175CD3] focus:ring-[#175CD3]/30 cursor-pointer accent-[#175CD3]"
                                />
                              )}
                            </label>
                          </td>

                          {/* 4. User Checkbox */}
                          <td className="py-3 px-4 sm:px-5 text-center">
                            <label className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-blue-50/70 dark:hover:bg-blue-950/30 cursor-pointer">
                              {isUserBusy ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#175CD3]" />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={Boolean(node.userAllowed)}
                                  disabled={Boolean(togglingKey)}
                                  onChange={() => handleTogglePermission(node, 'USR')}
                                  aria-label={`Akses User untuk ${node.name}`}
                                  className="w-4 h-4 rounded border-slate-300 text-[#175CD3] focus:ring-[#175CD3]/30 cursor-pointer accent-[#175CD3]"
                                />
                              )}
                            </label>
                          </td>

                          {/* 5. Aksi */}
                          <td className="py-3 px-4 sm:px-5">
                            <PmaActionButtons
                              onEdit={() => openEditMenu(node)}
                              onDelete={() => setDeletingMenu(node)}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Tab 2: Pengguna per Role (Single Table) */
        <>
          <ServiceFilterToolbar
            borderless
            searchTerm={userSearch}
            onSearchChange={(val) => {
              setUserSearch(val)
              setUserPage(1)
            }}
            placeholder="Cari username atau nama pengguna..."
            showMonthFilter={false}
            totalRecords={combinedRoleUsers.length}
            totalLabel="Total Pengguna"
            extraControls={
              <select
                value={selectedRoleId || ''}
                onChange={(e) => {
                  setSelectedRoleId(Number(e.target.value))
                  setUserPage(1)
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.role_code} — {r.role_name} ({r.total_users})
                  </option>
                ))}
              </select>
            }
          />

          <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {errorMsg && (
              <div className="p-3.5 sm:p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="overflow-x-auto clean-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 sm:px-5">
                      <PmaTableHeader label="Pengguna" />
                    </th>
                    <th className="py-3.5 px-4 sm:px-5">
                      <PmaTableHeader label="Username / NIP" />
                    </th>
                    <th className="py-3.5 px-4 sm:px-5">
                      <PmaTableHeader label="Role Saat Ini" />
                    </th>
                    <th className="py-3.5 px-4 sm:px-5">
                      <PmaTableHeader label="Status Keanggotaan" />
                    </th>
                    <th className="py-3.5 px-4 sm:px-5 text-right">
                      <PmaTableHeader label="Aksi" align="right" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {loadingUsers ? (
                    Array.from({ length: 5 }).map((_, rIdx) => (
                      <tr key={rIdx} className="animate-pulse">
                        {Array.from({ length: 5 }).map((__, cIdx) => (
                          <td key={cIdx} className="py-4 px-4">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginatedRoleUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Search className="w-5 h-5 text-slate-400" />
                          </div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Tidak ada pengguna yang sesuai dengan pencarian
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRoleUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {u.fullname || u.pegawai_nama || u.username}
                          </div>
                          <div className="text-[11px] text-slate-400">{u.email || '-'}</div>
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-xs text-slate-600 dark:text-slate-300">
                          {u.username}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#175CD3] border border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300">
                            {u.role} {u.current_role_name ? `• ${u.current_role_name}` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              u._isAssigned
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200/60 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {u._isAssigned ? `Anggota ${selectedRole?.role_code || ''}` : 'Role Lain'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-right">
                          {!u._isAssigned ? (
                            <button
                              type="button"
                              disabled={assigningUserId === u.id}
                              onClick={() => handleAssignUser(u.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {assigningUserId === u.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                              )}
                              <span>Assign ke {selectedRole?.role_code}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Terdaftar</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800">
              <ServiceTablePagination
                page={userPage}
                pageSize={userPageSize}
                total={combinedRoleUsers.length}
                onPageChange={setUserPage}
                onPageSizeChange={(next) => {
                  setUserPageSize(next)
                  setUserPage(1)
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Modal Form Master Menu */}
      {menuModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden modal-dialog-animated">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingMenu ? 'Ubah Item Menu' : 'Tambah Item Menu'}
              </h3>
              <button
                type="button"
                onClick={() => setMenuModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="p-5 space-y-3.5">
              {menuFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{menuFormError}</div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1">Parent Menu</label>
                <select
                  value={menuForm.parent_id}
                  onChange={(e) => setMenuForm((p) => ({ ...p, parent_id: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="">-- Menu Root (Utama) --</option>
                  {parentMenuOptions
                    .filter((m) => m.id !== editingMenu?.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.depth > 0 ? '↳ ' : ''}
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  Nama Menu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  URL / Route Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: manage-role atau ref/jenis_tes"
                  value={menuForm.url}
                  onChange={(e) => setMenuForm((p) => ({ ...p, url: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Icon</label>
                  <input
                    type="text"
                    value={menuForm.icon}
                    onChange={(e) => setMenuForm((p) => ({ ...p, icon: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Urutan</label>
                  <input
                    type="number"
                    min={0}
                    value={menuForm.sort}
                    onChange={(e) => setMenuForm((p) => ({ ...p, sort: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={menuForm.is_active}
                  onChange={(e) => setMenuForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                <span>Tampilkan di navigasi (is_show = 1)</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMenuModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingMenu}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] text-white text-xs font-bold cursor-pointer"
                >
                  {savingMenu ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Simpan Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <PmaDeleteConfirmDialog
        isOpen={Boolean(deletingMenu)}
        onClose={() => !isDeletingMenu && setDeletingMenu(null)}
        onConfirm={handleDeleteMenu}
        isDeleting={isDeletingMenu}
        title={`Hapus Menu ${deletingMenu?.name || ''}`}
        message="Menu beserta sub-menunya (jika ada) akan dihapus dari struktur auth_permissions."
      />
    </div>
  )
}
