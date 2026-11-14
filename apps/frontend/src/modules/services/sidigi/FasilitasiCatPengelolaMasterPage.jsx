import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Layers,
  CalendarRange,
  FolderKanban,
  MapPin,
  ShieldCheck,
  PenTool,
  Plus,
  Edit3,
  Trash2,
  ArrowUpRight,
  X,
  AlertCircle,
  Calendar,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import { PmaKpiGrid } from '../../../components/shared/services/pma/PmaKpiGrid'
import { ServiceFilterToolbar } from '../../../components/shared/services/ServiceFilterToolbar'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { CatPengelolaGateGuard } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaGateGuard'
import { CatPengelolaHeader } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaHeader'
import { CatPengelolaConfirmModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaConfirmModal'
import { formatTanggalId } from '../../../components/shared/services/sidigi/cat/pengelola/pengelolaConstants'
import {
  fetchCatMasterJenisTes,
  createCatJenisTes,
  updateCatJenisTes,
  deleteCatJenisTes,
  fetchCatPengelolaMasterJenisPeriode,
  saveCatPengelolaMasterJenisPeriode,
  deleteCatPengelolaMasterJenisPeriode,
  fetchCatPengelolaMasterKegiatan,
  saveCatPengelolaMasterKegiatan,
  deleteCatPengelolaMasterKegiatan,
  fetchCatPengelolaMasterTilok,
  saveCatTilok,
  deleteCatTilok,
  addCatPengelolaNip,
  removeCatPengelolaNip,
  fetchCatPengelolaSigners,
  saveCatPengelolaSigner,
  deleteCatPengelolaSigner,
} from '../../../services/api/sidigiCatServicesApi'

const MASTER_TABS = [
  { value: 'jenis-tes', label: 'Jenis Tes', icon: Layers },
  { value: 'jenis-periode', label: 'Jenis Tes / Tahun', icon: CalendarRange },
  { value: 'kegiatan', label: 'Kegiatan', icon: FolderKanban },
  { value: 'tilok', label: 'Titik Lokasi', icon: MapPin },
  { value: 'whitelist', label: 'Whitelist Pengelola', icon: ShieldCheck },
  { value: 'signers', label: 'Penandatangan', icon: PenTool },
]

function MasterContent({ accessInfo, refreshAccess }) {
  const currentYear = String(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState('jenis-tes')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Cascading hierarchy filters
  const [filterTahun, setFilterTahun] = useState('')
  const [filterJenisTesId, setFilterJenisTesId] = useState('')
  const [filterJenisPeriodeId, setFilterJenisPeriodeId] = useState('')
  const [filterSeleksiId, setFilterSeleksiId] = useState('')

  // Data stores
  const [jenisTesList, setJenisTesList] = useState([])
  const [jenisPeriodeList, setJenisPeriodeList] = useState([])
  const [kegiatanList, setKegiatanList] = useState([])
  const [tiloks, setTiloks] = useState([])
  const [signers, setSigners] = useState([])
  const whitelist = accessInfo?.whitelist || []

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modal state
  const [modalMode, setModalMode] = useState(null)
  const [editingRow, setEditingRow] = useState(null)
  const [formState, setFormState] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  // Delete confirm
  const [deletingTarget, setDeletingTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadAllMasters = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const [jt, jp, kg, tlk, sig] = await Promise.all([
        fetchCatMasterJenisTes('').catch(() => []),
        fetchCatPengelolaMasterJenisPeriode({}).catch(() => []),
        fetchCatPengelolaMasterKegiatan({}).catch(() => []),
        fetchCatPengelolaMasterTilok({}).catch(() => []),
        fetchCatPengelolaSigners().catch(() => []),
      ])
      setJenisTesList(Array.isArray(jt) ? jt : [])
      setJenisPeriodeList(Array.isArray(jp) ? jp : [])
      setKegiatanList(Array.isArray(kg) ? kg : [])
      setTiloks(Array.isArray(tlk) ? tlk : [])
      setSigners(Array.isArray(sig) ? sig : [])
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memuat master data CAT.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAllMasters()
  }, [loadAllMasters])

  useEffect(() => {
    setPage(1)
  }, [activeTab, searchTerm, filterTahun, filterJenisTesId, filterJenisPeriodeId, filterSeleksiId])

  const yearOptions = useMemo(() => {
    const yrs = new Set([currentYear, String(Number(currentYear) + 1), '2025'])
    jenisPeriodeList.forEach((item) => {
      if (item.periode) yrs.add(String(item.periode))
    })
    return Array.from(yrs).sort((a, b) => Number(b) - Number(a))
  }, [jenisPeriodeList, currentYear])

  // Cascaded options for filter & modal dropdowns
  const filteredKegiatanByPeriode = useMemo(() => {
    const jpId = formState.modal_jenis_periode_id || filterJenisPeriodeId
    if (!jpId) return kegiatanList
    const jpRow = jenisPeriodeList.find((j) => String(j.id) === String(jpId))
    if (!jpRow) return kegiatanList
    return kegiatanList.filter(
      (k) =>
        String(k.jenis_tes_id) === String(jpRow.jenis_tes_id) &&
        String(k.periode) === String(jpRow.periode)
    )
  }, [kegiatanList, jenisPeriodeList, formState.modal_jenis_periode_id, filterJenisPeriodeId])

  const filteredModalKegiatan = useMemo(() => {
    const jpId = formState.modal_jenis_periode_id
    if (!jpId) return kegiatanList
    const jpRow = jenisPeriodeList.find((j) => String(j.id) === String(jpId))
    if (!jpRow) return kegiatanList
    return kegiatanList.filter(
      (k) =>
        String(k.jenis_tes_id) === String(jpRow.jenis_tes_id) &&
        String(k.periode) === String(jpRow.periode)
    )
  }, [kegiatanList, jenisPeriodeList, formState.modal_jenis_periode_id])

  const resolveJenisPeriodeLabel = (jp) =>
    `${jp.jenis_tes_kode || 'CAT'} — ${jp.jenis_tes_nama || '-'} (${jp.periode})`

  const openCreateModal = () => {
    setErrorMsg('')
    setSuccessMsg('')
    setEditingRow(null)
    if (activeTab === 'jenis-tes') {
      setFormState({ kode: '', nama: '' })
    } else if (activeTab === 'jenis-periode') {
      setFormState({
        jenis_tes_id: filterJenisTesId || '',
        periode: filterTahun || currentYear,
      })
    } else if (activeTab === 'kegiatan') {
      setFormState({
        jenis_periode_id: filterJenisPeriodeId || '',
        nama_seleksi: '',
      })
    } else if (activeTab === 'tilok') {
      setFormState({
        modal_jenis_periode_id: filterJenisPeriodeId || '',
        seleksi_id: filterSeleksiId || '',
        nama_tilok: '',
        kapasitas: 200,
        startdate: '',
        enddate: '',
      })
    } else if (activeTab === 'whitelist') {
      setFormState({ nip: '', nama: '', keterangan: '' })
    } else if (activeTab === 'signers') {
      setFormState({
        kode: '',
        role_title: '',
        default_nip: '',
        default_nama: '',
        default_pangkat_gol: '',
        default_jabatan: '',
        is_active: 1,
      })
    }
    setModalMode(activeTab)
  }

  const openEditModal = (tabKey, row) => {
    setErrorMsg('')
    setSuccessMsg('')
    setEditingRow(row)
    if (tabKey === 'jenis-tes') {
      setFormState({ id: row.id, kode: row.kode || '', nama: row.nama || '' })
    } else if (tabKey === 'jenis-periode') {
      setFormState({
        key: row.uid || row.id,
        jenis_tes_id: row.jenis_tes_id ? String(row.jenis_tes_id) : '',
        periode: row.periode || currentYear,
      })
    } else if (tabKey === 'kegiatan') {
      const matchedJp = jenisPeriodeList.find(
        (jp) =>
          String(jp.jenis_tes_id) === String(row.jenis_tes_id) &&
          String(jp.periode) === String(row.periode)
      )
      setFormState({
        key: row.id || row.uid,
        jenis_periode_id: row.jenis_periode_id
          ? String(row.jenis_periode_id)
          : matchedJp
          ? String(matchedJp.id)
          : '',
        nama_seleksi: row.nama_seleksi || '',
      })
    } else if (tabKey === 'tilok') {
      const resolvedJpId = row.resolved_jenis_periode_id || row.jenis_periode_id || ''
      setFormState({
        key: row.uid || row.id,
        modal_jenis_periode_id: resolvedJpId ? String(resolvedJpId) : '',
        seleksi_id: row.seleksi_id ? String(row.seleksi_id) : '',
        nama_tilok: row.nama_tilok || '',
        kapasitas: row.kapasitas || 0,
        startdate: row.period_start_date || '',
        enddate: row.period_end_date || '',
      })
    } else if (tabKey === 'signers') {
      setFormState({
        id: row.id,
        kode: row.kode || '',
        role_title: row.role_title || '',
        default_nip: row.default_nip || '',
        default_nama: row.default_nama || '',
        default_pangkat_gol: row.default_pangkat_gol || '',
        default_jabatan: row.default_jabatan || '',
        is_active: Number(row.is_active ?? 1),
      })
    }
    setModalMode(tabKey)
  }

  const handleSaveModal = async (e) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      setErrorMsg('')
      if (modalMode === 'jenis-tes') {
        if (editingRow?.id) {
          await updateCatJenisTes({
            id: editingRow.id,
            kode: formState.kode,
            nama: formState.nama,
          })
          setSuccessMsg('Master Jenis Tes berhasil diperbarui.')
        } else {
          await createCatJenisTes({ kode: formState.kode, nama: formState.nama })
          setSuccessMsg('Master Jenis Tes berhasil ditambahkan.')
        }
        await loadAllMasters()
      } else if (modalMode === 'jenis-periode') {
        await saveCatPengelolaMasterJenisPeriode({
          key: formState.key || '',
          jenis_tes_id: formState.jenis_tes_id,
          periode: formState.periode,
        })
        setSuccessMsg('Master Jenis Tes per Tahun berhasil disimpan.')
        await loadAllMasters()
      } else if (modalMode === 'kegiatan') {
        await saveCatPengelolaMasterKegiatan({
          key: formState.key || '',
          jenis_periode_id: formState.jenis_periode_id,
          nama_seleksi: formState.nama_seleksi,
        })
        setSuccessMsg('Master Kegiatan berhasil disimpan.')
        await loadAllMasters()
      } else if (modalMode === 'tilok') {
        const selectedKg = kegiatanList.find(
          (k) => String(k.id) === String(formState.seleksi_id)
        )
        await saveCatTilok({
          key: formState.key || '',
          nama_tilok: formState.nama_tilok,
          kapasitas: Number(formState.kapasitas || 0),
          seleksi_id: formState.seleksi_id || '',
          jenis_periode_id: formState.modal_jenis_periode_id || '',
          jenis_tes_id: selectedKg?.jenis_tes_id || '',
          period: selectedKg?.periode || currentYear,
          startdate: formState.startdate || '',
          enddate: formState.enddate || '',
        })
        setSuccessMsg('Master Titik Lokasi berhasil disimpan.')
        await loadAllMasters()
      } else if (modalMode === 'whitelist') {
        await addCatPengelolaNip({
          nip: formState.nip,
          nama: formState.nama,
          keterangan: formState.keterangan,
        })
        setSuccessMsg('NIP berhasil ditambahkan ke whitelist Pengelola CAT.')
        await refreshAccess()
      } else if (modalMode === 'signers') {
        await saveCatPengelolaSigner(formState)
        setSuccessMsg('Master pejabat penandatangan berhasil disimpan.')
        await loadAllMasters()
      }
      setModalMode(null)
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menyimpan data master.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return
    try {
      setIsDeleting(true)
      setErrorMsg('')
      const { type, item } = deletingTarget
      if (type === 'jenis-tes') {
        await deleteCatJenisTes(item.id)
        setSuccessMsg('Master Jenis Tes berhasil dihapus.')
        await loadAllMasters()
      } else if (type === 'jenis-periode') {
        await deleteCatPengelolaMasterJenisPeriode(item.id || item.uid)
        setSuccessMsg('Jenis Tes per Tahun berhasil dihapus.')
        await loadAllMasters()
      } else if (type === 'kegiatan') {
        await deleteCatPengelolaMasterKegiatan(item.id || item.uid)
        setSuccessMsg('Kegiatan seleksi berhasil dihapus.')
        await loadAllMasters()
      } else if (type === 'tilok') {
        await deleteCatTilok(item.uid || item.id)
        setSuccessMsg('Master Titik Lokasi berhasil dihapus.')
        await loadAllMasters()
      } else if (type === 'whitelist') {
        await removeCatPengelolaNip(item.nip)
        setSuccessMsg('NIP berhasil dihapus dari whitelist.')
        await refreshAccess()
      } else if (type === 'signers') {
        await deleteCatPengelolaSigner(item.id)
        setSuccessMsg('Penandatangan berhasil dihapus.')
        await loadAllMasters()
      }
      setDeletingTarget(null)
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menghapus data master.')
      setDeletingTarget(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Drill-down shortcuts across the 4 connected tiers
  const drillToJenisPeriode = (jenisTes) => {
    setFilterJenisTesId(String(jenisTes.id))
    setFilterTahun('')
    setSearchTerm('')
    setActiveTab('jenis-periode')
  }

  const drillToKegiatan = (jenisPeriode) => {
    setFilterJenisPeriodeId(String(jenisPeriode.id))
    setFilterSeleksiId('')
    setSearchTerm('')
    setActiveTab('kegiatan')
  }

  const drillToTilok = (kegiatan) => {
    const matchedJp = jenisPeriodeList.find(
      (jp) =>
        String(jp.jenis_tes_id) === String(kegiatan.jenis_tes_id) &&
        String(jp.periode) === String(kegiatan.periode)
    )
    if (matchedJp) setFilterJenisPeriodeId(String(matchedJp.id))
    setFilterSeleksiId(String(kegiatan.id))
    setSearchTerm('')
    setActiveTab('tilok')
  }

  // Filtered list based on active tab + parent cascade filter + search
  const currentList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let list = []

    if (activeTab === 'jenis-tes') {
      list = jenisTesList
    } else if (activeTab === 'jenis-periode') {
      list = jenisPeriodeList.filter((item) => {
        if (filterTahun && String(item.periode) !== String(filterTahun)) return false
        if (filterJenisTesId && String(item.jenis_tes_id) !== String(filterJenisTesId)) return false
        return true
      })
    } else if (activeTab === 'kegiatan') {
      list = kegiatanList.filter((item) => {
        if (filterJenisPeriodeId) {
          const jpRow = jenisPeriodeList.find((j) => String(j.id) === String(filterJenisPeriodeId))
          if (
            jpRow &&
            (String(item.jenis_tes_id) !== String(jpRow.jenis_tes_id) ||
              String(item.periode) !== String(jpRow.periode))
          ) {
            return false
          }
        }
        return true
      })
    } else if (activeTab === 'tilok') {
      list = tiloks.filter((item) => {
        if (filterSeleksiId && String(item.seleksi_id) !== String(filterSeleksiId)) return false
        if (!filterSeleksiId && filterJenisPeriodeId) {
          const jpId = item.resolved_jenis_periode_id || item.jenis_periode_id
          if (String(jpId) !== String(filterJenisPeriodeId)) return false
        }
        return true
      })
    } else if (activeTab === 'whitelist') {
      list = whitelist
    } else if (activeTab === 'signers') {
      list = signers
    }

    if (!q) return list
    return list.filter((item) =>
      Object.values(item)
        .filter((v) => v !== null && v !== undefined)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [
    activeTab,
    jenisTesList,
    jenisPeriodeList,
    kegiatanList,
    tiloks,
    whitelist,
    signers,
    filterTahun,
    filterJenisTesId,
    filterJenisPeriodeId,
    filterSeleksiId,
    searchTerm,
  ])

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize
    return currentList.slice(start, start + pageSize)
  }, [currentList, page, pageSize])

  const categoryCounts = useMemo(
    () => ({
      'jenis-tes': jenisTesList.length,
      'jenis-periode': jenisPeriodeList.length,
      kegiatan: kegiatanList.length,
      tilok: tiloks.length,
      whitelist: whitelist.length,
      signers: signers.length,
    }),
    [
      jenisTesList.length,
      jenisPeriodeList.length,
      kegiatanList.length,
      tiloks.length,
      whitelist.length,
      signers.length,
    ]
  )

  const addButtonLabel =
    activeTab === 'jenis-tes'
      ? 'Tambah Jenis Tes'
      : activeTab === 'jenis-periode'
      ? 'Tambah Jenis Tes / Tahun'
      : activeTab === 'kegiatan'
      ? 'Tambah Kegiatan'
      : activeTab === 'tilok'
      ? 'Tambah Titik Lokasi'
      : activeTab === 'whitelist'
      ? 'Tambah NIP'
      : 'Tambah Penandatangan'

  const kpis = useMemo(
    () => [
      {
        label: 'Master Jenis Tes',
        value: jenisTesList.length,
        unit: 'jenis',
        context: `${jenisPeriodeList.length} jenis tes per tahun`,
        badge: 'Tier 1-2',
        badgeColor: 'indigo',
        icon: Layers,
      },
      {
        label: 'Kegiatan Seleksi',
        value: kegiatanList.length,
        unit: 'kegiatan',
        context: 'Relasi jenis tes & periode tahun',
        badge: 'Tier 3',
        badgeColor: 'blue',
        icon: FolderKanban,
      },
      {
        label: 'Titik Lokasi CAT',
        value: tiloks.length,
        unit: 'tilok',
        context: 'Lokasi & kapasitas pelaksanaan',
        badge: 'Tier 4',
        badgeColor: 'emerald',
        icon: MapPin,
      },
      {
        label: 'Akses & TTD',
        value: whitelist.length + signers.length,
        unit: 'entri',
        context: `${whitelist.length} whitelist • ${signers.length} penandatangan`,
        badge: 'Otoritas',
        badgeColor: 'amber',
        icon: ShieldCheck,
      },
    ],
    [
      jenisTesList.length,
      jenisPeriodeList.length,
      kegiatanList.length,
      tiloks.length,
      whitelist.length,
      signers.length,
    ]
  )

  const hasActiveFilters = Boolean(
    searchTerm || filterTahun || filterJenisTesId || filterJenisPeriodeId || filterSeleksiId
  )

  const handleResetFilters = () => {
    setSearchTerm('')
    setFilterTahun('')
    setFilterJenisTesId('')
    setFilterJenisPeriodeId('')
    setFilterSeleksiId('')
  }

  // Cascading parent filters rendered cleanly in ServiceFilterToolbar Tier 1.5 (parity /pengelola/tim)
  const secondaryFilterControls = useMemo(() => {
    const showDropdowns =
      activeTab === 'jenis-periode' || activeTab === 'kegiatan' || activeTab === 'tilok'
    if (!showDropdowns && !hasActiveFilters) return null

    return (
      <div className="flex flex-wrap items-center gap-2.5 w-full">
        {activeTab === 'jenis-periode' && (
          <>
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="">Semua Tahun</option>
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
            <select
              value={filterJenisTesId}
              onChange={(e) => setFilterJenisTesId(e.target.value)}
              className="h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden max-w-[260px] cursor-pointer"
            >
              <option value="">Semua Jenis Tes</option>
              {jenisTesList.map((jt) => (
                <option key={jt.id} value={jt.id}>
                  {jt.kode} — {jt.nama}
                </option>
              ))}
            </select>
          </>
        )}

        {activeTab === 'kegiatan' && (
          <select
            value={filterJenisPeriodeId}
            onChange={(e) => setFilterJenisPeriodeId(e.target.value)}
            className="h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden max-w-[300px] cursor-pointer"
          >
            <option value="">Semua Jenis Tes / Tahun</option>
            {jenisPeriodeList.map((jp) => (
              <option key={jp.id} value={jp.id}>
                {resolveJenisPeriodeLabel(jp)}
              </option>
            ))}
          </select>
        )}

        {activeTab === 'tilok' && (
          <>
            <select
              value={filterJenisPeriodeId}
              onChange={(e) => {
                setFilterJenisPeriodeId(e.target.value)
                setFilterSeleksiId('')
              }}
              className="h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden max-w-[260px] cursor-pointer"
            >
              <option value="">Semua Jenis Tes / Tahun</option>
              {jenisPeriodeList.map((jp) => (
                <option key={jp.id} value={jp.id}>
                  {resolveJenisPeriodeLabel(jp)}
                </option>
              ))}
            </select>
            <select
              value={filterSeleksiId}
              onChange={(e) => setFilterSeleksiId(e.target.value)}
              className="h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden max-w-[280px] cursor-pointer"
            >
              <option value="">Semua Kegiatan</option>
              {filteredKegiatanByPeriode.map((kg) => (
                <option key={kg.id} value={kg.id}>
                  {kg.nama_seleksi} ({kg.periode})
                </option>
              ))}
            </select>
          </>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3 h-[38px] rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Reset semua filter"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    )
  }, [
    activeTab,
    hasActiveFilters,
    filterTahun,
    filterJenisTesId,
    filterJenisPeriodeId,
    filterSeleksiId,
    yearOptions,
    jenisTesList,
    jenisPeriodeList,
    filteredKegiatanByPeriode,
  ])

  const activeTabMeta = useMemo(
    () => MASTER_TABS.find((t) => t.value === activeTab) || MASTER_TABS[0],
    [activeTab]
  )

  const renderLoadingRows = (colCount) =>
    Array.from({ length: 5 }).map((_, rIdx) => (
      <tr key={rIdx} className="animate-pulse">
        {Array.from({ length: colCount }).map((__, cIdx) => {
          if (cIdx === 0) {
            return (
              <td key={cIdx} className="py-4 px-3.5 sm:px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="h-3.5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </div>
                </div>
              </td>
            )
          }
          if (cIdx === colCount - 1) {
            return (
              <td key={cIdx} className="py-4 px-3.5 sm:px-4 text-right">
                <div className="inline-flex items-center justify-end gap-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                </div>
              </td>
            )
          }
          return (
            <td key={cIdx} className="py-4 px-3.5 sm:px-4">
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </td>
          )
        })}
      </tr>
    ))

  const renderEmptyRow = (colCount, heading, description) => {
    const TabIcon = activeTabMeta.icon || AlertCircle
    return (
      <tr>
        <td colSpan={colCount} className="py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <TabIcon className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{heading}</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            {description || 'Sesuaikan filter atau klik tombol tambah untuk membuat data baru.'}
          </p>
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <CatPengelolaHeader
        title="Master Data & Hak Akses CAT"
        description="Relasi hierarki terintegrasi: Jenis Tes → Jenis Tes / Tahun → Kegiatan → Titik Lokasi."
        onReload={() => {
          loadAllMasters()
          refreshAccess()
        }}
        isReloading={loading}
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{addButtonLabel}</span>
          </button>
        }
      />

      <PmaKpiGrid kpis={kpis} isLoading={loading} />

      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              loadAllMasters()
              refreshAccess()
            }}
            className="px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: FILTER & NAVIGASI TAB TERPISAH (Parity /pengelola/jadwal & /pengelola/tim) */}
      <ServiceFilterToolbar
        showMonthFilter={false}
        showAllCategory={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={MASTER_TABS}
        activeCategory={activeTab}
        onCategoryChange={setActiveTab}
        totalRecords={currentList.length}
        categoryCounts={categoryCounts}
        secondaryFilters={secondaryFilterControls}
        placeholder="Cari data master pada tab aktif..."
      />

      {/* SECTION 2: TABLE CONTAINER TERPISAH (Parity /pengelola/jadwal & /pengelola/tim) */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto clean-scrollbar">
          {/* TAB 1: MASTER JENIS TES */}
          {activeTab === 'jenis-tes' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Nama Master Jenis Tes</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Kode Jenis Tes</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">ID</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">Relasi Tahun</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading
                  ? renderLoadingRows(5)
                  : paginatedList.length === 0
                  ? renderEmptyRow(5, 'Belum Ada Data Jenis Tes', 'Tambahkan master jenis tes CAT untuk memulai konfigurasi hierarki.')
                  : paginatedList.map((row) => {
                      const yearCount = jenisPeriodeList.filter(
                        (jp) => String(jp.jenis_tes_id) === String(row.id)
                      ).length
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-3.5 sm:px-4">
                            <div className="flex items-center gap-3 max-w-[300px] xl:max-w-md">
                              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-blue-50 text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50">
                                <Layers className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div
                                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
                                  title={row.nama}
                                >
                                  {row.nama}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-300 border border-blue-200/50 font-mono text-[11px] font-bold">
                              {row.kode}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 sm:px-4 text-center font-mono font-semibold text-slate-400 whitespace-nowrap tabular-nums">
                            #{row.id}
                          </td>
                          <td className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => drillToJenisPeriode(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#175CD3] tabular-nums transition-colors cursor-pointer active:scale-95"
                              title="Lihat Jenis Tes per Tahun"
                            >
                              <span>{yearCount} Tahun</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal('jenis-tes', row)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:text-sky-400 dark:hover:bg-sky-950/40 transition-colors cursor-pointer active:scale-95"
                                title="Edit Jenis Tes"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTarget({ type: 'jenis-tes', item: row })}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                                title="Hapus Jenis Tes"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          )}

          {/* TAB 2: MASTER JENIS TES PER TAHUN */}
          {activeTab === 'jenis-periode' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Jenis Tes & Kode</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Tahun Pelaksanaan</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">Jumlah Kegiatan</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">Jumlah Tilok</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading
                  ? renderLoadingRows(5)
                  : paginatedList.length === 0
                  ? renderEmptyRow(5, 'Belum Ada Jenis Tes per Tahun', 'Sesuaikan filter tahun/jenis tes atau tambahkan relasi tahun baru.')
                  : paginatedList.map((row) => (
                      <tr
                        key={row.uid || row.id}
                        className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-3.5 sm:px-4">
                          <div className="flex items-center gap-3 max-w-[290px] xl:max-w-md">
                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-blue-50 text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50">
                              <CalendarRange className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
                                title={row.jenis_tes_nama || '-'}
                              >
                                {row.jenis_tes_nama || '-'}
                              </div>
                              <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                {row.jenis_tes_kode || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 font-bold text-[11px] tabular-nums">
                            Tahun {row.periode}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => drillToKegiatan(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#175CD3] tabular-nums transition-colors cursor-pointer active:scale-95"
                            title="Kelola Kegiatan di Jenis Tes & Tahun ini"
                          >
                            <span>{Number(row.total_kegiatan || 0)} Kegiatan</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-center tabular-nums font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {Number(row.total_tilok || 0)} Tilok
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal('jenis-periode', row)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:text-sky-400 dark:hover:bg-sky-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Edit Jenis Tes per Tahun"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTarget({ type: 'jenis-periode', item: row })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Hapus Jenis Tes per Tahun"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}

          {/* TAB 3: MASTER KEGIATAN (BERDASARKAN JENIS TES PER TAHUN) */}
          {activeTab === 'kegiatan' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Nama Kegiatan Seleksi</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Induk Jenis Tes / Tahun</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">Jumlah Tilok</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">Jadwal Terhubung</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading
                  ? renderLoadingRows(5)
                  : paginatedList.length === 0
                  ? renderEmptyRow(5, 'Belum Ada Data Kegiatan', 'Belum ada kegiatan seleksi sesuai filter saat ini.')
                  : paginatedList.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-3.5 sm:px-4">
                          <div className="flex items-center gap-3 max-w-[300px] xl:max-w-md">
                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-blue-50 text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50">
                              <FolderKanban className="w-4 h-4" />
                            </div>
                            <div
                              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug"
                              title={row.nama_seleksi}
                            >
                              {row.nama_seleksi}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4">
                          <div className="max-w-[230px]">
                            <div
                              className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate"
                              title={row.jenis_tes_nama || row.jenis_tes_kode || '-'}
                            >
                              {row.jenis_tes_nama || row.jenis_tes_kode || '-'}
                            </div>
                            <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              {row.jenis_tes_kode || 'CAT'} • Tahun {row.periode || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => drillToTilok(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#175CD3] tabular-nums transition-colors cursor-pointer active:scale-95"
                            title="Lihat Titik Lokasi di Kegiatan ini"
                          >
                            <span>{Number(row.total_tilok || 0)} Tilok</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-center tabular-nums font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {Number(row.total_jadwal || 0)} Jadwal
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal('kegiatan', row)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:text-sky-400 dark:hover:bg-sky-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Edit Kegiatan"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTarget({ type: 'kegiatan', item: row })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Hapus Kegiatan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}

          {/* TAB 4: MASTER TITIK LOKASI (BERDASARKAN KEGIATAN) */}
          {activeTab === 'tilok' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Titik Lokasi</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Kegiatan & Jenis Tes / Tahun</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Periode Pelaksanaan</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">Kapasitas</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading
                  ? renderLoadingRows(5)
                  : paginatedList.length === 0
                  ? renderEmptyRow(5, 'Belum Ada Titik Lokasi CAT', 'Sesuaikan filter kegiatan atau tambahkan titik lokasi baru.')
                  : paginatedList.map((row) => (
                      <tr
                        key={row.uid || row.id}
                        className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-3.5 sm:px-4">
                          <div className="flex items-center gap-3 max-w-[270px] xl:max-w-sm">
                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-blue-50 text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug"
                                title={row.nama_tilok}
                              >
                                {row.nama_tilok}
                              </div>
                              <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                {Number(row.total_instansi || 0)} instansi • {Number(row.total_jadwal || 0)} jadwal
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4">
                          <div className="max-w-[230px]">
                            <div
                              className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate"
                              title={row.nama_seleksi || 'Belum terhubung ke kegiatan'}
                            >
                              {row.nama_seleksi || 'Belum terhubung ke kegiatan'}
                            </div>
                            <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              {row.jenis_tes_kode || '-'} • Tahun {row.seleksi_periode || row.period || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {row.period_start_date
                                ? `${formatTanggalId(row.period_start_date)} – ${formatTanggalId(row.period_end_date || row.period_start_date)}`
                                : `Tahun ${row.period || '-'}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-center text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums whitespace-nowrap">
                          {Number(row.kapasitas || 0)} kursi
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal('tilok', row)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:text-sky-400 dark:hover:bg-sky-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Edit Titik Lokasi"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTarget({ type: 'tilok', item: row })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Hapus Titik Lokasi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}

          {/* TAB 5: WHITELIST PENGELOLA */}
          {activeTab === 'whitelist' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">NIP</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Nama Pegawai</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Keterangan Peran</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading
                  ? renderLoadingRows(4)
                  : paginatedList.length === 0
                  ? renderEmptyRow(4, 'Belum Ada Whitelist Pengelola', 'Tambahkan NIP pengelola yang diberi otoritas manajemen CAT.')
                  : paginatedList.map((row) => (
                      <tr
                        key={row.nip}
                        className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-blue-50 text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {row.nip}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {row.nama || '-'}
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-xs font-normal text-slate-500 dark:text-slate-400">
                          {row.keterangan || '-'}
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDeletingTarget({ type: 'whitelist', item: row })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                            title="Cabut Akses NIP"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}

          {/* TAB 6: DEFAULT PENANDATANGAN */}
          {activeTab === 'signers' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Nama Pejabat & NIP</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Kode</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Peran TTD</th>
                  <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Pangkat / Jabatan</th>
                  <th className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading
                  ? renderLoadingRows(5)
                  : paginatedList.length === 0
                  ? renderEmptyRow(5, 'Belum Ada Penandatangan Terdaftar', 'Tambahkan pejabat penandatangan default untuk dokumen CAT & PNBP.')
                  : paginatedList.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-3.5 sm:px-4">
                          <div className="flex items-center gap-3 max-w-[260px] xl:max-w-sm">
                            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-blue-50 text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50">
                              <PenTool className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate"
                                title={row.default_nama}
                              >
                                {row.default_nama}
                              </div>
                              <div className="text-[11px] font-mono font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                NIP {row.default_nip || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-300 border border-blue-200/50 font-mono text-[11px] font-bold">
                            {row.kode}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {row.role_title}
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4">
                          <div className="max-w-[230px]">
                            <div
                              className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate"
                              title={row.default_jabatan || '-'}
                            >
                              {row.default_jabatan || '-'}
                            </div>
                            {row.default_pangkat_gol && (
                              <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                {row.default_pangkat_gol}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal('signers', row)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:text-sky-400 dark:hover:bg-sky-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Edit Penandatangan"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTarget({ type: 'signers', item: row })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                              title="Hapus Penandatangan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
          <ServiceTablePagination
            page={page}
            pageSize={pageSize}
            totalRecords={currentList.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            unitLabel="data"
          />
        </div>
      </div>

      {/* Modal Form Master */}
      {modalMode && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop-animated bg-slate-900/50 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) setModalMode(null)
          }}
        >
          <div className="modal-dialog-animated w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRow ? `Edit ${addButtonLabel.replace('Tambah ', '')}` : addButtonLabel}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-3.5">
              {modalMode === 'jenis-tes' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Kode Jenis Tes
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.kode || ''}
                      onChange={(e) => setFormState((s) => ({ ...s, kode: e.target.value }))}
                      placeholder="Contoh: SKD CPNS, SELEKSI PPPK, UDIN/UPKP"
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Nama Master Jenis Tes
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.nama || ''}
                      onChange={(e) => setFormState((s) => ({ ...s, nama: e.target.value }))}
                      placeholder="Contoh: Seleksi Kompetensi Dasar CPNS"
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                    />
                  </div>
                </>
              )}

              {modalMode === 'jenis-periode' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Master Jenis Tes *
                    </label>
                    <select
                      required
                      value={formState.jenis_tes_id || ''}
                      onChange={(e) => setFormState((s) => ({ ...s, jenis_tes_id: e.target.value }))}
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                    >
                      <option value="">-- Pilih Master Jenis Tes --</option>
                      {jenisTesList.map((jt) => (
                        <option key={jt.id} value={jt.id}>
                          {jt.kode} — {jt.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Tahun Pelaksanaan *
                    </label>
                    <input
                      type="text"
                      required
                      pattern="\d{4}"
                      maxLength={4}
                      value={formState.periode || ''}
                      onChange={(e) => setFormState((s) => ({ ...s, periode: e.target.value }))}
                      placeholder="2026"
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-mono"
                    />
                  </div>
                </>
              )}

              {modalMode === 'kegiatan' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Jenis Tes per Tahun (Induk) *
                    </label>
                    <select
                      required
                      value={formState.jenis_periode_id || ''}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, jenis_periode_id: e.target.value }))
                      }
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                    >
                      <option value="">-- Pilih Jenis Tes per Tahun --</option>
                      {jenisPeriodeList.map((jp) => (
                        <option key={jp.id} value={jp.id}>
                          {resolveJenisPeriodeLabel(jp)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Nama Kegiatan *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.nama_seleksi || ''}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, nama_seleksi: e.target.value }))
                      }
                      placeholder="Contoh: Seleksi Kompetensi PPPK Tahap II"
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                    />
                  </div>
                </>
              )}

              {modalMode === 'tilok' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Filter Jenis Tes per Tahun
                    </label>
                    <select
                      value={formState.modal_jenis_periode_id || ''}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          modal_jenis_periode_id: e.target.value,
                          seleksi_id: '',
                        }))
                      }
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                    >
                      <option value="">-- Semua Jenis Tes per Tahun --</option>
                      {jenisPeriodeList.map((jp) => (
                        <option key={jp.id} value={jp.id}>
                          {resolveJenisPeriodeLabel(jp)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Kegiatan Seleksi (Induk) *
                    </label>
                    <select
                      required
                      value={formState.seleksi_id || ''}
                      onChange={(e) => setFormState((s) => ({ ...s, seleksi_id: e.target.value }))}
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                    >
                      <option value="">-- Pilih Kegiatan Seleksi --</option>
                      {filteredModalKegiatan.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama_seleksi} ({k.jenis_tes_kode} • {k.periode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Nama Titik Lokasi (Tilok) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.nama_tilok || ''}
                        onChange={(e) => setFormState((s) => ({ ...s, nama_tilok: e.target.value }))}
                        placeholder="Contoh: Kanreg III BKN Bandung"
                        className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Kapasitas (Kursi)
                      </label>
                      <input
                        type="number"
                        value={formState.kapasitas || 0}
                        onChange={(e) => setFormState((s) => ({ ...s, kapasitas: e.target.value }))}
                        className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={formState.startdate || ''}
                        onChange={(e) => setFormState((s) => ({ ...s, startdate: e.target.value }))}
                        className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Tanggal Selesai
                      </label>
                      <input
                        type="date"
                        value={formState.enddate || ''}
                        onChange={(e) => setFormState((s) => ({ ...s, enddate: e.target.value }))}
                        className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {modalMode === 'whitelist' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      NIP Pegawai (18 digit)
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.nip || ''}
                      onChange={(e) => setFormState((s) => ({ ...s, nip: e.target.value }))}
                      placeholder="199xxxxxxxxxxxxxxx"
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Nama Pegawai
                    </label>
                    <input
                      type="text"
                      value={formState.nama || ''}
                      onChange={(e) => setFormState((s) => ({ ...s, nama: e.target.value }))}
                      placeholder="Nama lengkap (opsional)"
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Keterangan
                    </label>
                    <input
                      type="text"
                      value={formState.keterangan || ''}
                      onChange={(e) => setFormState((s) => ({ ...s, keterangan: e.target.value }))}
                      placeholder="Contoh: Koordinator / Admin CAT SIDIGI"
                      className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                    />
                  </div>
                </>
              )}

              {modalMode === 'signers' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Kode Peran
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.kode || ''}
                        onChange={(e) => setFormState((s) => ({ ...s, kode: e.target.value }))}
                        placeholder="PPK, BPP, KPA, KAKANREG"
                        className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Judul Jabatan TTD
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.role_title || ''}
                        onChange={(e) => setFormState((s) => ({ ...s, role_title: e.target.value }))}
                        placeholder="Pejabat Pembuat Komitmen"
                        className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Nama Pejabat
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.default_nama || ''}
                        onChange={(e) => setFormState((s) => ({ ...s, default_nama: e.target.value }))}
                        className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        NIP Pejabat
                      </label>
                      <input
                        type="text"
                        value={formState.default_nip || ''}
                        onChange={(e) => setFormState((s) => ({ ...s, default_nip: e.target.value }))}
                        className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Pangkat / Golongan
                      </label>
                      <input
                        type="text"
                        value={formState.default_pangkat_gol || ''}
                        onChange={(e) =>
                          setFormState((s) => ({ ...s, default_pangkat_gol: e.target.value }))
                        }
                        className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Jabatan Struktural
                      </label>
                      <input
                        type="text"
                        value={formState.default_jabatan || ''}
                        onChange={(e) => setFormState((s) => ({ ...s, default_jabatan: e.target.value }))}
                        className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs sm:text-sm font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <CatPengelolaConfirmModal
        isOpen={Boolean(deletingTarget)}
        title="Hapus Data Master"
        description="Hapus data master terpilih secara permanen? Data yang masih memiliki relasi aktif ke level di bawahnya tidak dapat dihapus."
        isProcessing={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTarget(null)}
      />
    </div>
  )
}

export default function FasilitasiCatPengelolaMasterPage() {
  return (
    <CatPengelolaGateGuard>
      {({ accessInfo, refreshAccess }) => (
        <MasterContent accessInfo={accessInfo} refreshAccess={refreshAccess} />
      )}
    </CatPengelolaGateGuard>
  )
}
