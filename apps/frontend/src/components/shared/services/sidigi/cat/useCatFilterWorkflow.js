import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  fetchCatJenisPeriodeList,
  fetchCatSeleksiOptions,
  fetchCatTilokList,
  fetchCatInstansiTilok,
} from '../../../../../services/api/sidigiCatServicesApi'
import {
  encodeCatJenisToken,
  decodeCatJenisToken,
  encodeCatFilterToken,
  decodeCatFilterToken,
  getActiveCatJenisToken,
  setActiveCatJenisToken,
  clearActiveCatJenisToken,
  getActiveCatFilterToken,
  setActiveCatFilterToken,
  clearActiveCatFilterToken,
  buildCatModuleUrl,
} from '../../../../../utils/catRouteToken'

/**
 * Hook bersama untuk mengelola Level 1 (Jenis Tes CAT), Level 2 (Cascading Filter Parameter Pelaksanaan),
 * serta sinkronisasi token rute /:jenisToken?p=... dan sessionStorage lintas halaman
 * (/rekap-data, /rekapitulasi, /laporan).
 */
export function useCatFilterWorkflow({
  basePath,
  onExecuteQuery,
  onClearData,
  clearSubmittedOnCascadeChange = false,
  getRedirectOverrideWhenEmpty,
} = {}) {
  const navigate = useNavigate()
  const { jenisToken } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterToken = searchParams.get('p') || ''
  const currentYear = new Date().getFullYear().toString()

  // LEVEL 1: Grid Jenis Tes Besar CAT
  const [jenisPeriodeList, setJenisPeriodeList] = useState([])
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [isJenisLoading, setIsJenisLoading] = useState(true)

  // LEVEL 2: Active Selected Jenis Tes & Cascading Dropdown Lists
  const [activeJenisTes, setActiveJenisTes] = useState(null)
  const [seleksiList, setSeleksiList] = useState([])
  const [isSeleksiLoading, setIsSeleksiLoading] = useState(false)
  const [tilokList, setTilokList] = useState([])
  const [isTilokLoading, setIsTilokLoading] = useState(false)
  const [instansiList, setInstansiList] = useState([])
  const [isInstansiLoading, setIsInstansiLoading] = useState(false)

  // Unsubmitted Filter Inputs
  const [filterSeleksiId, setFilterSeleksiId] = useState('')
  const [filterTilokUid, setFilterTilokUid] = useState('')
  const [filterInstansiIds, setFilterInstansiIds] = useState([])
  const [filterTglMulai, setFilterTglMulai] = useState('')
  const [filterTglSelesai, setFilterTglSelesai] = useState('')

  // Gating & Submitted State
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState(null)

  // Refs untuk callback agar sync effect tidak loop jika pemanggil memberi inline function
  const onExecuteQueryRef = useRef(onExecuteQuery)
  const onClearDataRef = useRef(onClearData)
  const getRedirectOverrideRef = useRef(getRedirectOverrideWhenEmpty)

  useEffect(() => {
    onExecuteQueryRef.current = onExecuteQuery
  }, [onExecuteQuery])

  useEffect(() => {
    onClearDataRef.current = onClearData
  }, [onClearData])

  useEffect(() => {
    getRedirectOverrideRef.current = getRedirectOverrideWhenEmpty
  }, [getRedirectOverrideWhenEmpty])

  // Load Level 1: Jenis Tes Besar List
  const loadJenisPeriode = useCallback(async () => {
    try {
      setIsJenisLoading(true)
      const data = await fetchCatJenisPeriodeList('')
      setJenisPeriodeList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Gagal memuat jenis periode CAT:', err)
      setJenisPeriodeList([])
    } finally {
      setIsJenisLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJenisPeriode()
  }, [loadJenisPeriode])

  // STEP 1 CASCADING: Load Kegiatan for Active Jenis Tes
  const loadKegiatanForActiveJenis = useCallback(async (jenisObj) => {
    if (!jenisObj) {
      setSeleksiList([])
      return
    }
    try {
      setIsSeleksiLoading(true)
      const data = await fetchCatSeleksiOptions({
        jenis_tes_id: jenisObj.jenis_tes_id || jenisObj.id,
        periode: jenisObj.periode,
      })
      setSeleksiList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Gagal memuat daftar kegiatan seleksi:', err)
      setSeleksiList([])
    } finally {
      setIsSeleksiLoading(false)
    }
  }, [])

  // STEP 2 CASCADING: Load Tiloks for Selected Kegiatan
  const loadTiloksForKegiatan = useCallback(async (seleksiId, jenisObj) => {
    if (!seleksiId || !jenisObj) {
      setTilokList([])
      return
    }
    try {
      setIsTilokLoading(true)
      const data = await fetchCatTilokList(jenisObj.id, jenisObj.periode, seleksiId)
      setTilokList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Gagal memuat daftar titik lokasi:', err)
      setTilokList([])
    } finally {
      setIsTilokLoading(false)
    }
  }, [])

  // STEP 3 CASCADING: Load Instansi for Selected Tilok + Kegiatan
  const loadInstansiForTilokAndKegiatan = useCallback(
    async (tilokKey, seleksiId, { preserveSelection = false } = {}) => {
      if (!tilokKey) {
        setInstansiList([])
        if (!preserveSelection) setFilterInstansiIds([])
        return []
      }
      try {
        setIsInstansiLoading(true)
        const data = await fetchCatInstansiTilok(tilokKey, [], seleksiId)
        const list = Array.isArray(data) ? data : []
        const mappedIds = list.map((item) => String(item.id || item.instansi_id || item.kodeins || ''))
        setInstansiList(list)
        if (!preserveSelection) {
          setFilterInstansiIds(mappedIds)
        }
        return mappedIds
      } catch (err) {
        console.warn('Gagal memuat instansi untuk tilok & kegiatan:', err)
        setInstansiList([])
        if (!preserveSelection) setFilterInstansiIds([])
        return []
      } finally {
        setIsInstansiLoading(false)
      }
    },
    []
  )

  const resetLocalFilterState = useCallback(() => {
    setFilterSeleksiId('')
    setFilterTilokUid('')
    setFilterInstansiIds([])
    setFilterTglMulai('')
    setFilterTglSelesai('')
    setTilokList([])
    setInstansiList([])
    setHasSubmitted(false)
    setAppliedFilters(null)
    if (onClearDataRef.current) onClearDataRef.current()
  }, [])

  // SYNC ROUTE PARAMS & HASHED QUERY PARAMS -> STATE (REFRESH-SAFE & SHARED ACROSS MODULES)
  useEffect(() => {
    if (!jenisToken) {
      if (getRedirectOverrideRef.current) {
        const override = getRedirectOverrideRef.current()
        if (override?.jenisToken) {
          setActiveCatJenisToken(override.jenisToken)
          if (override.filterToken) {
            setActiveCatFilterToken(override.jenisToken, override.filterToken)
          }
          navigate(buildCatModuleUrl(basePath, override.jenisToken, override.filterToken), { replace: true })
          return
        }
      }

      const sharedJenisToken = getActiveCatJenisToken()
      if (sharedJenisToken) {
        const sharedFilterToken = getActiveCatFilterToken(sharedJenisToken)
        navigate(buildCatModuleUrl(basePath, sharedJenisToken, sharedFilterToken), { replace: true })
        return
      }

      setActiveJenisTes(null)
      setSeleksiList([])
      resetLocalFilterState()
      return
    }

    const decodedJenis = decodeCatJenisToken(jenisToken)
    if (!decodedJenis) {
      clearActiveCatJenisToken()
      navigate(basePath, { replace: true })
      return
    }

    setActiveCatJenisToken(jenisToken)
    setActiveJenisTes(decodedJenis)
    loadKegiatanForActiveJenis(decodedJenis)

    const decodedFilter = decodeCatFilterToken(filterToken)
    if (decodedFilter && decodedFilter.tilokUid) {
      setActiveCatFilterToken(jenisToken, filterToken)
      setFilterSeleksiId(decodedFilter.seleksiId || '')
      setFilterTilokUid(decodedFilter.tilokUid)
      setFilterInstansiIds(decodedFilter.instansiIds || [])
      setFilterTglMulai(decodedFilter.tglMulai || '')
      setFilterTglSelesai(decodedFilter.tglSelesai || '')

      if (decodedFilter.seleksiId) {
        loadTiloksForKegiatan(decodedFilter.seleksiId, decodedJenis)
      }
      loadInstansiForTilokAndKegiatan(decodedFilter.tilokUid, decodedFilter.seleksiId, {
        preserveSelection: true,
      })

      setAppliedFilters(decodedFilter)
      setHasSubmitted(true)
      if (onExecuteQueryRef.current) onExecuteQueryRef.current(decodedFilter)
    } else {
      resetLocalFilterState()
    }
  }, [
    jenisToken,
    filterToken,
    basePath,
    navigate,
    loadKegiatanForActiveJenis,
    loadTiloksForKegiatan,
    loadInstansiForTilokAndKegiatan,
    resetLocalFilterState,
  ])

  // Switch Level Handlers
  const handleSelectJenisTesCard = useCallback(
    (item) => {
      const token = encodeCatJenisToken(item)
      setActiveCatJenisToken(token)
      clearActiveCatFilterToken()
      navigate(buildCatModuleUrl(basePath, token))
    },
    [basePath, navigate]
  )

  const handleBackToLevel1 = useCallback(() => {
    clearActiveCatJenisToken()
    navigate(basePath)
  }, [basePath, navigate])

  // Cascading Input Handlers
  const handleKegiatanChange = useCallback(
    (val) => {
      const selectedId = typeof val === 'object' && val !== null ? val.value : val
      setFilterSeleksiId(selectedId || '')
      setFilterTilokUid('')
      setFilterInstansiIds([])
      setTilokList([])
      setInstansiList([])

      if (clearSubmittedOnCascadeChange) {
        setHasSubmitted(false)
        setAppliedFilters(null)
      }

      if (selectedId && activeJenisTes) {
        loadTiloksForKegiatan(selectedId, activeJenisTes)
      }
    },
    [activeJenisTes, clearSubmittedOnCascadeChange, loadTiloksForKegiatan]
  )

  const handleTilokChange = useCallback(
    (val) => {
      const selectedUid = typeof val === 'object' && val !== null ? val.value : val
      setFilterTilokUid(selectedUid || '')
      setFilterInstansiIds([])
      setInstansiList([])

      if (clearSubmittedOnCascadeChange) {
        setHasSubmitted(false)
        setAppliedFilters(null)
      }

      if (selectedUid) {
        loadInstansiForTilokAndKegiatan(selectedUid, filterSeleksiId)
      }
    },
    [clearSubmittedOnCascadeChange, filterSeleksiId, loadInstansiForTilokAndKegiatan]
  )

  // Apply explicit filter object -> update URL ?p= + shared sessionStorage + fetch
  const applyFilters = useCallback(
    (filters) => {
      const encoded = encodeCatFilterToken(filters)
      setAppliedFilters(filters)
      setHasSubmitted(true)
      if (jenisToken) {
        if (encoded) {
          setActiveCatFilterToken(jenisToken, encoded)
        } else {
          clearActiveCatFilterToken()
        }
      }
      setSearchParams(encoded ? { p: encoded } : {})
      if (onExecuteQueryRef.current) onExecuteQueryRef.current(filters)
    },
    [jenisToken, setSearchParams]
  )

  const handleSearchSubmit = useCallback(
    (e, { includeDateRange = true } = {}) => {
      if (e) e.preventDefault()
      if (!filterSeleksiId) {
        toast.warning('Silakan pilih Kegiatan terlebih dahulu.')
        return
      }
      if (!filterTilokUid) {
        toast.warning('Silakan pilih Titik Lokasi (Tilok) terlebih dahulu.')
        return
      }

      const filters = {
        seleksiId: filterSeleksiId,
        tilokUid: filterTilokUid,
        instansiIds: filterInstansiIds,
        tglMulai: includeDateRange ? filterTglMulai : '',
        tglSelesai: includeDateRange ? filterTglSelesai : '',
      }

      applyFilters(filters)
    },
    [filterSeleksiId, filterTilokUid, filterInstansiIds, filterTglMulai, filterTglSelesai, applyFilters]
  )

  const handleResetFilter = useCallback(() => {
    clearActiveCatFilterToken()
    resetLocalFilterState()
    setSearchParams({})
  }, [resetLocalFilterState, setSearchParams])

  // Options Memoization
  const seleksiOptions = useMemo(() => {
    return seleksiList.map((s) => ({
      value: String(s.id || s.seleksi_id),
      label: s.nama_seleksi || s.nama || `Kegiatan ${s.id}`,
    }))
  }, [seleksiList])

  const tilokOptions = useMemo(() => {
    return tilokList.map((t) => ({
      value: String(t.uid || t.id),
      label: t.nama_tilok ? `${t.nama_tilok}${t.period ? ` (${t.period})` : ''}` : `Tilok ${t.id}`,
    }))
  }, [tilokList])

  const currentSelectedKegiatan = useMemo(() => {
    return seleksiList.find((s) => String(s.id || s.seleksi_id) === String(filterSeleksiId))
  }, [seleksiList, filterSeleksiId])

  const currentSelectedTilok = useMemo(() => {
    return tilokList.find((t) => String(t.uid || t.id) === String(filterTilokUid))
  }, [tilokList, filterTilokUid])

  return {
    jenisToken,
    filterToken,
    currentYear,
    // Level 1
    jenisPeriodeList,
    selectedYear,
    setSelectedYear,
    isJenisLoading,
    loadJenisPeriode,
    // Level 2 & Dropdowns
    activeJenisTes,
    seleksiList,
    isSeleksiLoading,
    tilokList,
    isTilokLoading,
    instansiList,
    isInstansiLoading,
    seleksiOptions,
    tilokOptions,
    currentSelectedKegiatan,
    currentSelectedTilok,
    // Filter inputs & applied state
    filterSeleksiId,
    filterTilokUid,
    filterInstansiIds,
    setFilterInstansiIds,
    filterTglMulai,
    setFilterTglMulai,
    filterTglSelesai,
    setFilterTglSelesai,
    hasSubmitted,
    appliedFilters,
    setAppliedFilters,
    // Loaders & Handlers
    loadKegiatanForActiveJenis,
    loadTiloksForKegiatan,
    loadInstansiForTilokAndKegiatan,
    handleSelectJenisTesCard,
    handleBackToLevel1,
    handleKegiatanChange,
    handleTilokChange,
    applyFilters,
    handleSearchSubmit,
    handleResetFilter,
  }
}
