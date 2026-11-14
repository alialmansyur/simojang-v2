import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Pencil,
  KeyRound,
  Trash2,
  Power,
  MoreHorizontal,
  X,
  Save,
  Loader2,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Eye,
  Clock,
  User,
  Mail,
  Briefcase,
  Calendar,
  Hash,
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  fetchUsersList,
  fetchUserDetail,
  fetchRolesList,
  createUserAccount,
  updateUserAccount,
  resetUserPassword,
  toggleUserStatus,
  deleteUserAccount,
  lookupPegawaiForUser,
  fetchUserDirectPermissions,
  syncUserDirectPermissions,
} from '../../services/api/settingsApi'
import { SettingsSubpageHeader } from './components/SettingsSubpageHeader'
import { PmaKpiGrid } from '../../components/shared/services/pma/PmaKpiGrid'
import { PmaTableHeader } from '../../components/shared/services/pma/PmaTableCells'
import { PmaDetailDialog } from '../../components/shared/services/pma/PmaDetailDialog'
import { ServiceFilterToolbar } from '../../components/shared/services/ServiceFilterToolbar'
import { ServiceTablePagination } from '../../components/shared/services/ServiceTablePagination'
import { PmaDeleteConfirmDialog } from '../../components/shared/services/pma/PmaDeleteConfirmDialog'
import { formatDateTimeId } from '../../components/shared/services/pma/pmaFormatters'

function collectCheckedIds(nodes, out = new Set()) {
  if (!Array.isArray(nodes)) return out
  nodes.forEach((n) => {
    if (n.allowed) out.add(Number(n.id))
    if (Array.isArray(n.children)) collectCheckedIds(n.children, out)
  })
  return out
}

function PermissionTreePicker({ nodes = [], checkedIds, onToggle }) {
  if (!nodes.length) return null
  return (
    <ul className="space-y-1.5">
      {nodes.map((node) => {
        const id = Number(node.id)
        const checked = checkedIds.has(id)
        const hasChildren = Array.isArray(node.children) && node.children.length > 0
        return (
          <li key={id} className="space-y-1">
            <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(id)}
                  className="sr-only"
                />
                {checked ? (
                  <CheckSquare className="w-4 h-4 text-[#175CD3] shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {node.name}
                </span>
              </div>
              {node.url && (
                <span className="text-[10px] text-slate-400 shrink-0">{node.url}</span>
              )}
            </label>
            {hasChildren && (
              <div className="pl-5 border-l border-slate-200/70 dark:border-slate-800 ml-3">
                <PermissionTreePicker nodes={node.children} checkedIds={checkedIds} onToggle={onToggle} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function SettingsUsersPage() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ total_users: 0, active_users: 0, inactive_users: 0, total_roles: 0 })
  const [roles, setRoles] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [isLoading, setIsLoading] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [actionMenu, setActionMenu] = useState(null) // { user, top, right }

  // Modal Detail
  const [detailUser, setDetailUser] = useState(null)
  const [detailPayload, setDetailPayload] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailErrorMsg, setDetailErrorMsg] = useState('')

  // Modal Create / Edit User
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formState, setFormState] = useState({
    username: '',
    fullname: '',
    email: '',
    password: '',
    role: 'USR',
    active: true,
  })
  const [formError, setFormError] = useState('')
  const [isSavingUser, setIsSavingUser] = useState(false)

  // Lookup Pegawai
  const [pegawaiQuery, setPegawaiQuery] = useState('')
  const [pegawaiOptions, setPegawaiOptions] = useState([])
  const [isSearchingPegawai, setIsSearchingPegawai] = useState(false)

  // Modal Reset Password
  const [resetTarget, setResetTarget] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [isResettingPwd, setIsResettingPwd] = useState(false)

  // Modal Direct User Permissions
  const [permTarget, setPermTarget] = useState(null)
  const [permTree, setPermTree] = useState([])
  const [checkedPermIds, setCheckedPermIds] = useState(new Set())
  const [loadingPermTree, setLoadingPermTree] = useState(false)
  const [savingPermTree, setSavingPermTree] = useState(false)

  // Delete dialog
  const [deletingUser, setDeletingUser] = useState(null)
  const [isDeletingUser, setIsDeletingUser] = useState(false)

  const loadData = useCallback(
    async (manual = false) => {
      try {
        if (manual) setIsReloading(true)
        else setIsLoading(true)
        setErrorMsg('')

        const [usersData, rolesData] = await Promise.all([
          fetchUsersList({
            search: searchTerm,
            role: roleFilter,
            status: statusFilter === 'all' ? '' : statusFilter,
            page,
            per_page: pageSize,
          }),
          fetchRolesList(false),
        ])

        setUsers(Array.isArray(usersData?.data) ? usersData.data : [])
        setTotal(Number(usersData?.total ?? 0))
        if (usersData?.stats) setStats(usersData.stats)
        setRoles(Array.isArray(rolesData) ? rolesData : [])
      } catch (err) {
        const msg = err.message || 'Gagal memuat daftar pengguna.'
        setErrorMsg(msg)
        toast.error(msg)
      } finally {
        setIsLoading(false)
        setIsReloading(false)
      }
    },
    [searchTerm, roleFilter, statusFilter, page, pageSize]
  )

  useEffect(() => {
    loadData(false)
  }, [loadData])

  // Lookup Pegawai debounce saat modal tambah dibuka
  useEffect(() => {
    if (!formOpen || editingUser) return
    const q = pegawaiQuery.trim()
    if (q.length < 2) {
      setPegawaiOptions([])
      return
    }
    let active = true
    const timer = setTimeout(async () => {
      setIsSearchingPegawai(true)
      try {
        const res = await lookupPegawaiForUser(q, 10)
        if (active) setPegawaiOptions(res)
      } catch {
        if (active) setPegawaiOptions([])
      } finally {
        if (active) setIsSearchingPegawai(false)
      }
    }, 300)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [formOpen, editingUser, pegawaiQuery])

  const kpis = useMemo(
    () => [
      {
        id: 'total-users',
        label: 'TOTAL PENGGUNA',
        value: stats.total_users,
        unit: 'Akun',
        context: 'Terdaftar di sistem',
        badge: 'Database',
        badgeColor: 'blue',
        icon: Users,
      },
      {
        id: 'active-users',
        label: 'AKUN AKTIF',
        value: stats.active_users,
        unit: 'Akun',
        context: 'Dapat login ke sistem',
        badge: 'Aktif',
        badgeColor: 'emerald',
        icon: UserCheck,
      },
      {
        id: 'inactive-users',
        label: 'AKUN NONAKTIF',
        value: stats.inactive_users,
        unit: 'Akun',
        context: 'Ditangguhkan sementara',
        badge: 'Nonaktif',
        badgeColor: 'rose',
        icon: UserX,
      },
      {
        id: 'total-roles',
        label: 'ROLE TERSEDIA',
        value: stats.total_roles,
        unit: 'Role',
        context: 'Master role aktif',
        badge: 'RBAC',
        badgeColor: 'indigo',
        icon: ShieldCheck,
      },
    ],
    [stats]
  )

  const handleOpenDetail = async (u) => {
    setDetailUser(u)
    setDetailPayload(null)
    setDetailErrorMsg('')
    setIsDetailLoading(true)

    try {
      const detail = await fetchUserDetail(u.id).catch(() => u)
      const d = detail || u
      const isActive = Boolean(d.active)
      const displayName = d.display_name || d.fullname || d.pegawai_nama || d.username

      setDetailPayload({
        title: displayName,
        subtitle: `Username / NIP: ${d.username || '-'} • ${d.email || 'Email belum diatur'}`,
        badge: {
          label: isActive ? 'Akun Aktif' : 'Akun Nonaktif',
          className: isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
            : 'bg-slate-100 text-slate-600 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        },
        summary: [
          {
            label: 'Username / NIP',
            value: d.username || '-',
            hint: 'Identitas login utama',
            icon: Hash,
            tone: 'blue',
          },
          {
            label: 'Role Akses',
            value: `${d.role || '-'}${d.role_name && d.role_name !== d.role ? ` (${d.role_name})` : ''}`,
            hint: 'Peran RBAC aktif',
            icon: ShieldCheck,
            tone: 'indigo',
          },
          {
            label: 'Email',
            value: d.email || '-',
            hint: d.pegawai_phone ? `Telp: ${d.pegawai_phone}` : 'Kontak akun',
            icon: Mail,
            tone: 'slate',
          },
          {
            label: 'Jabatan Pegawai',
            value: d.pegawai_jabatan || '-',
            hint: d.pegawai_nip ? `NIP Master: ${d.pegawai_nip}` : 'Master Pegawai',
            icon: Briefcase,
            tone: 'emerald',
          },
          {
            label: 'Login Terakhir',
            value: d.last_login ? formatDateTimeId(d.last_login) : 'Belum pernah login',
            hint: `Dibuat: ${d.created_at ? formatDateTimeId(d.created_at) : '-'}`,
            icon: Calendar,
            tone: 'amber',
          },
        ],
        sections: [
          {
            title: 'Informasi Akun & Kepegawaian',
            icon: User,
            description: 'Rincian profil akun pengguna dan keterkaitan master pegawai.',
            rows: [
              { label: 'ID Akun', value: d.id },
              { label: 'Nama Lengkap', value: displayName },
              { label: 'Username / NIP', value: d.username || '-' },
              { label: 'Email', value: d.email || '-' },
              { label: 'Role', value: `${d.role || '-'} — ${d.role_name || d.role || '-'}` },
              { label: 'Status Akun', value: isActive ? 'Aktif' : 'Nonaktif' },
              { label: 'Nama di Master Pegawai', value: d.pegawai_nama || '-' },
              { label: 'Jabatan', value: d.pegawai_jabatan || '-' },
              { label: 'Telepon', value: d.pegawai_phone || '-' },
              { label: 'Login Terakhir', value: d.last_login ? formatDateTimeId(d.last_login) : 'Belum pernah' },
              { label: 'Tanggal Dibuat', value: d.created_at ? formatDateTimeId(d.created_at) : '-' },
              { label: 'Terakhir Diperbarui', value: d.updated_at ? formatDateTimeId(d.updated_at) : '-' },
            ],
          },
        ],
      })
    } catch (err) {
      setDetailErrorMsg(err.message || 'Gagal memuat detail pengguna.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormState({
      username: '',
      fullname: '',
      email: '',
      password: '',
      role: roles.find((r) => r.role_code === 'USR')?.role_code || roles[0]?.role_code || 'USR',
      active: true,
    })
    setPegawaiQuery('')
    setPegawaiOptions([])
    setFormError('')
    setFormOpen(true)
  }

  const openEditModal = (u) => {
    setEditingUser(u)
    setFormState({
      username: u.username || '',
      fullname: u.fullname || u.display_name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'USR',
      active: Boolean(u.active),
    })
    setFormError('')
    setFormOpen(true)
  }

  const handleSaveUser = async (e) => {
    e.preventDefault()
    setFormError('')
    setIsSavingUser(true)
    try {
      if (editingUser) {
        await updateUserAccount({
          id: editingUser.id,
          fullname: formState.fullname,
          email: formState.email,
          role: formState.role,
          active: formState.active ? 1 : 0,
        })
        toast.success('Data pengguna berhasil diperbarui.')
      } else {
        await createUserAccount({
          username: formState.username,
          fullname: formState.fullname,
          email: formState.email,
          password: formState.password,
          role: formState.role,
          active: formState.active ? 1 : 0,
        })
        toast.success('Akun pengguna baru berhasil dibuat.')
      }
      setFormOpen(false)
      await loadData(true)
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data pengguna.')
    } finally {
      setIsSavingUser(false)
    }
  }

  const handleToggleStatus = async (u) => {
    try {
      await toggleUserStatus(u.id, !u.active)
      toast.success(`Status akun ${u.username} diubah menjadi ${!u.active ? 'Aktif' : 'Nonaktif'}.`)
      await loadData(true)
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status pengguna.')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!resetTarget) return
    if (newPassword.length < 8) {
      toast.error('Kata sandi baru minimal 8 karakter.')
      return
    }
    setIsResettingPwd(true)
    try {
      await resetUserPassword(resetTarget.id, newPassword)
      toast.success(`Kata sandi akun ${resetTarget.username} berhasil direset.`)
      setResetTarget(null)
      setNewPassword('')
    } catch (err) {
      toast.error(err.message || 'Gagal mereset kata sandi.')
    } finally {
      setIsResettingPwd(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    setIsDeletingUser(true)
    try {
      await deleteUserAccount(deletingUser.id)
      toast.success(`Pengguna ${deletingUser.username} berhasil dihapus.`)
      setDeletingUser(null)
      await loadData(true)
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus pengguna.')
    } finally {
      setIsDeletingUser(false)
    }
  }

  const openDirectPermModal = async (u) => {
    setPermTarget(u)
    setLoadingPermTree(true)
    setPermTree([])
    try {
      const res = await fetchUserDirectPermissions(u.id)
      const tree = Array.isArray(res?.tree) ? res.tree : []
      setPermTree(tree)
      const ids = Array.isArray(res?.permission_ids)
        ? new Set(res.permission_ids.map(Number))
        : collectCheckedIds(tree)
      setCheckedPermIds(ids)
    } catch (err) {
      toast.error(err.message || 'Gagal memuat izin khusus pengguna.')
      setPermTarget(null)
    } finally {
      setLoadingPermTree(false)
    }
  }

  const handleSaveDirectPerms = async () => {
    if (!permTarget) return
    setSavingPermTree(true)
    try {
      await syncUserDirectPermissions(permTarget.id, Array.from(checkedPermIds))
      toast.success(`Izin khusus menu untuk ${permTarget.username} berhasil disimpan.`)
      setPermTarget(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan izin khusus pengguna.')
    } finally {
      setSavingPermTree(false)
    }
  }

  const handleOpenActionMenu = (e, user) => {
    e.stopPropagation()
    if (actionMenu?.user?.id === user.id) {
      setActionMenu(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const menuHeight = 236
    const openUpward = rect.bottom + menuHeight > window.innerHeight - 16
    setActionMenu({
      user,
      top: openUpward ? Math.max(12, rect.top - menuHeight - 6) : rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
    })
  }

  const hasFilter = Boolean(searchTerm || roleFilter || statusFilter !== 'all')

  return (
    <div className="space-y-4 sm:space-y-5 pb-8">
      <SettingsSubpageHeader
        title="Manajemen Pengguna & Pegawai"
        description="Kelola akun pengguna SIMOJANG, aktivasi status login, reset kata sandi, lookup data pegawai, serta izin menu khusus per akun."
        badgeLabel="Pengaturan • Manage Users"
        onReloadClick={() => loadData(true)}
        isReloading={isReloading || isLoading}
        onAddEntryClick={openCreateModal}
        addEntryLabel="Tambah Pengguna"
      />

      <PmaKpiGrid kpis={kpis} isLoading={isLoading} />

      <ServiceFilterToolbar
        borderless
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val)
          setPage(1)
        }}
        placeholder="Cari nama lengkap, NIP / username, atau email..."
        showMonthFilter={false}
        showAllCategory={false}
        totalRecords={total}
        totalLabel="Total Pengguna"
        categories={[
          { label: 'Semua Status', value: 'all' },
          { label: 'Aktif', value: 'active' },
          { label: 'Nonaktif', value: 'inactive' },
        ]}
        activeCategory={statusFilter}
        onCategoryChange={(val) => {
          setStatusFilter(val)
          setPage(1)
        }}
        extraControls={
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
          >
            <option value="">Semua Role</option>
            {roles.map((r) => (
              <option key={r.role_code} value={r.role_code}>
                {r.role_code} — {r.role_name}
              </option>
            ))}
          </select>
        }
      />

      {/* Single-Card Table (6 Columns) */}
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
                  <PmaTableHeader label="Pengguna & Pegawai" />
                </th>
                <th className="py-3.5 px-4 sm:px-5">
                  <PmaTableHeader label="Username / NIP" />
                </th>
                <th className="py-3.5 px-4 sm:px-5">
                  <PmaTableHeader label="Role" />
                </th>
                <th className="py-3.5 px-4 sm:px-5">
                  <PmaTableHeader label="Status" />
                </th>
                <th className="py-3.5 px-4 sm:px-5">
                  <PmaTableHeader label="Login Terakhir" />
                </th>
                <th className="py-3.5 px-4 sm:px-5 text-right">
                  <PmaTableHeader label="Aksi" align="right" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {Array.from({ length: 6 }).map((__, cIdx) => (
                      <td key={cIdx} className="py-4 px-4">
                        <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Search className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {hasFilter
                          ? 'Tidak ada akun pengguna yang sesuai dengan filter'
                          : 'Belum ada akun pengguna terdaftar'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {hasFilter
                          ? 'Coba ubah kata kunci pencarian atau bersihkan filter'
                          : 'Klik tombol Tambah Pengguna di atas untuk membuat akun baru'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const displayName = u.display_name || u.fullname || u.username
                  const nipLabel = u.pegawai_nip || u.username || '-'
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center shrink-0 text-[#175CD3] dark:text-blue-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(u)}
                              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs cursor-pointer"
                            >
                              {displayName}
                            </button>
                            <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5">
                              NIP. {nipLabel}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 sm:px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 whitespace-nowrap">
                          {u.username}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                            u.role === 'ADM'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40'
                              : 'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40'
                          }`}
                        >
                          {u.role}
                          {u.role_name && u.role_name !== u.role ? ` • ${u.role_name}` : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                            u.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                              : 'bg-slate-100 text-slate-600 border-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {u.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.last_login ? formatDateTimeId(u.last_login) : 'Belum pernah'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 sm:px-5 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleOpenActionMenu(e, u)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                            actionMenu?.user?.id === u.id
                              ? 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-300'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                          }`}
                          title="Menu Aksi"
                          aria-label={`Menu aksi untuk ${displayName}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800">
          <ServiceTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize)
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* Dropdown Aksi Baris (Titik Tiga Horizontal) */}
      {actionMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setActionMenu(null)}
          />
          <div
            style={{ top: `${actionMenu.top}px`, right: `${actionMenu.right}px` }}
            className="fixed z-50 w-52 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <button
              type="button"
              onClick={() => {
                const u = actionMenu.user
                setActionMenu(null)
                handleOpenDetail(u)
              }}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Lihat Detail</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const u = actionMenu.user
                setActionMenu(null)
                openEditModal(u)
              }}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4 text-[#175CD3] dark:text-blue-400 shrink-0" />
              <span>Ubah Data</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const u = actionMenu.user
                setActionMenu(null)
                openDirectPermModal(u)
              }}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Izin Menu Khusus</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const u = actionMenu.user
                setActionMenu(null)
                setResetTarget(u)
                setNewPassword('')
              }}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Reset Kata Sandi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const u = actionMenu.user
                setActionMenu(null)
                handleToggleStatus(u)
              }}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Power
                className={`w-4 h-4 shrink-0 ${
                  actionMenu.user.active ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              />
              <span>{actionMenu.user.active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}</span>
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            <button
              type="button"
              onClick={() => {
                const u = actionMenu.user
                setActionMenu(null)
                setDeletingUser(u)
              }}
              className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Hapus Akun</span>
            </button>
          </div>
        </>
      )}

      {/* Modal Detail Pengguna */}
      <PmaDetailDialog
        isOpen={Boolean(detailUser)}
        onClose={() => {
          setDetailUser(null)
          setDetailPayload(null)
          setDetailErrorMsg('')
        }}
        serviceTitle="Manajemen Pengguna & Pegawai"
        detail={detailPayload}
        isLoading={isDetailLoading}
        errorMsg={detailErrorMsg}
      />

      {/* Modal Tambah / Edit Pengguna */}
      {formOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden modal-dialog-animated">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingUser ? `Ubah Akun (${editingUser.username})` : 'Tambah Akun Pengguna'}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {!editingUser && (
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Ambil Cepat dari Master Pegawai (Opsional)
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={pegawaiQuery}
                      onChange={(e) => setPegawaiQuery(e.target.value)}
                      placeholder="Ketik NIP atau nama pegawai..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  {isSearchingPegawai && <div className="text-[11px] text-slate-400">Mencari pegawai...</div>}
                  {pegawaiOptions.length > 0 && (
                    <div className="max-h-32 overflow-y-auto clean-scrollbar divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900">
                      {pegawaiOptions.map((pg) => (
                        <button
                          key={pg.nip}
                          type="button"
                          onClick={() => {
                            setFormState((prev) => ({
                              ...prev,
                              username: pg.nip || prev.username,
                              fullname: pg.nama || prev.fullname,
                              email: pg.email || prev.email,
                            }))
                            setPegawaiOptions([])
                            setPegawaiQuery('')
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{pg.nama}</span>
                          <span className="text-[11px] text-slate-400">{pg.nip}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Username / NIP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={formState.username}
                    onChange={(e) => setFormState((p) => ({ ...p, username: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Role Akses <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formState.role}
                    onChange={(e) => setFormState((p) => ({ ...p, role: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm"
                  >
                    {roles.map((r) => (
                      <option key={r.role_code} value={r.role_code}>
                        {r.role_code} — {r.role_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.fullname}
                    onChange={(e) => setFormState((p) => ({ ...p, fullname: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm"
                  />
                </div>
                {!editingUser && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Kata Sandi Awal (min. 8 karakter) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={formState.password}
                      onChange={(e) => setFormState((p) => ({ ...p, password: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.active}
                    onChange={(e) => setFormState((p) => ({ ...p, active: e.target.checked }))}
                    className="rounded border-slate-300 text-[#175CD3]"
                  />
                  <span>Akun dalam status aktif</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSavingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Reset Password */}
      {resetTarget &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 space-y-4 modal-dialog-animated">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset Password • {resetTarget.username}
              </h3>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Kata Sandi Baru (min. 8 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isResettingPwd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] text-white text-xs font-bold cursor-pointer"
                >
                  {isResettingPwd && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Reset Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Izin Khusus Per Akun */}
      {permTarget &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden modal-dialog-animated">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Izin Khusus Menu • {permTarget.display_name || permTarget.username}
                </h3>
                <p className="text-xs text-slate-500">
                  Menambahkan/menimpa izin menu langsung di tingkat akun (auth_users_permissions).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPermTarget(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto clean-scrollbar flex-1">
              {loadingPermTree ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#175CD3]" />
                  Memuat struktur izin menu...
                </div>
              ) : (
                <PermissionTreePicker
                  nodes={permTree}
                  checkedIds={checkedPermIds}
                  onToggle={(id) =>
                    setCheckedPermIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(id)) next.delete(id)
                      else next.add(id)
                      return next
                    })
                  }
                />
              )}
            </div>
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">{checkedPermIds.size} menu dipilih</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPermTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveDirectPerms}
                  disabled={savingPermTree}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] text-white text-xs font-bold cursor-pointer"
                >
                  {savingPermTree ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Simpan Izin Akun</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <PmaDeleteConfirmDialog
        isOpen={Boolean(deletingUser)}
        onClose={() => !isDeletingUser && setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingUser}
        title={`Hapus Akun ${deletingUser?.username || ''}`}
        message={`Apakah Anda yakin ingin menghapus akun ${deletingUser?.display_name || deletingUser?.username || ''}? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  )
}
