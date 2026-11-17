import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Save,
  RotateCcw,
  CheckCheck,
  Plus,
  Trash2,
  Sliders,
  Check,
  Sparkles,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { SignerPositionCol } from '../../../document-builder/DocumentBuilderShell'
import { DocumentPdfPreview } from '../../../document-builder/DocumentPdfPreview'
import {
  CatFormulirSarprasTemplate,
  DEFAULT_SARPRAS_CHECKLIST_ITEMS,
  DEFAULT_SARPRAS_INVENTORY_ITEMS,
} from '../../../document-builder/templates/CatFormulirSarprasTemplate'
import { fetchCatUserSigners } from '../../../../../services/api/sidigiCatServicesApi'

function createDefaultSigners(instansiNama = '', baseToken = '') {
  const ts = Date.now().toString(36)
  const tokenPrefix = baseToken || `cat_sarpras_${ts}`

  return {
    kiri: {
      position: 'kiri',
      title: '1. Posisi Kiri',
      sublabel: 'Pihak BKN',
      jabatan: 'Panitia Pelaksana\nBadan Kepegawaian Negara',
      nama: '',
      nip: '',
      isSigned: false,
      signatureData: null,
      signedAt: '',
      token: `${tokenPrefix}_kiri`,
      signToken: `${tokenPrefix}_kiri`,
    },
    tengah: {
      position: 'tengah',
      title: '2. Posisi Tengah',
      sublabel: 'Opsional: Petugas TI / Saksi',
      jabatan: '',
      nama: '',
      nip: '',
      isSigned: false,
      signatureData: null,
      signedAt: '',
      token: `${tokenPrefix}_tengah`,
      signToken: `${tokenPrefix}_tengah`,
    },
    kanan: {
      position: 'kanan',
      title: '3. Posisi Kanan',
      sublabel: 'Panitia Instansi Pengusul',
      jabatan: instansiNama
        ? `Panitia Pelaksana\n${instansiNama}`
        : 'Panitia Pelaksana Instansi',
      nama: '',
      nip: '',
      isSigned: false,
      signatureData: null,
      signedAt: '',
      token: `${tokenPrefix}_kanan`,
      signToken: `${tokenPrefix}_kanan`,
    },
  }
}

function createDefaultParams(tilokKota = '') {
  return {
    nomorDokumen: '',
    kotaTtd: tilokKota || '',
    tanggalPengecekan: '',
    rekomendasiStatus: '', // Kosong (belum dipilih)
    catatanRekomendasi: '',
  }
}

function createDefaultChecklist() {
  return DEFAULT_SARPRAS_CHECKLIST_ITEMS.map((item) => ({
    ...item,
    instansi: false,
    bkn: false,
    keterangan: '',
  }))
}

function createDefaultInventory() {
  return DEFAULT_SARPRAS_INVENTORY_ITEMS.map((item) => ({
    ...item,
    jumlah: '',
    keterangan: '',
  }))
}

export function FormulirSarprasCatBuilder({
  activeJenisTes,
  kegiatan,
  tilok,
  selectedInstansiList = [],
  instansiList = [],
  sessions = [],
  filterParams = {},
  initialData = null,
  onSaveDocument = null,
  onBack = null,
  documentTitle = 'Formulir Pengecekan Sarana dan Prasarana',
}) {
  const [activeTab, setActiveTab] = useState('params') // 'params' | 'preview'

  const activeInstansiIds = useMemo(() => {
    if (Array.isArray(selectedInstansiList) && selectedInstansiList.length > 0) {
      return selectedInstansiList.map(String)
    }
    if (Array.isArray(filterParams?.instansiIds) && filterParams.instansiIds.length > 0) {
      return filterParams.instansiIds.map(String)
    }
    return []
  }, [selectedInstansiList, filterParams?.instansiIds])

  const instansiKey = useMemo(() => {
    if (activeInstansiIds.length === 0) return 'all'
    return [...activeInstansiIds].sort().join('-')
  }, [activeInstansiIds])

  const seleksiId = kegiatan?.id || filterParams?.seleksiId || ''
  const tilokId = tilok?.uid || tilok?.id || filterParams?.tilokUid || ''
  const storageKey = useMemo(() => {
    return `cat_sarpras_${seleksiId || 'global'}_${tilokId || 'global'}_${instansiKey}`
  }, [seleksiId, tilokId, instansiKey])

  // Kunci lingkup bersama khusus instansi ini (untuk sinkronisasi parameter & TTE antar Berita Acara & Formulir Sarpras)
  const sharedScopeKey = useMemo(() => {
    return `cat_shared_scope_${seleksiId || 'global'}_${tilokId || 'global'}_${instansiKey}`
  }, [seleksiId, tilokId, instansiKey])

  const derivedInstansiNama = useMemo(() => {
    if (activeInstansiIds.length > 0) {
      // 1. Cek dari instansiList master jika tersedia
      if (Array.isArray(instansiList) && instansiList.length > 0) {
        const insMatch = instansiList.find((item) =>
          activeInstansiIds.includes(String(item.instansi_id || item.id || item.kodeins))
        )
        if (insMatch?.instansi_nama) return insMatch.instansi_nama
        if (insMatch?.nama) return insMatch.nama
      }
      // 2. Cek dari sessions
      if (sessions && sessions.length > 0) {
        const matched = sessions.find((item) =>
          activeInstansiIds.includes(String(item.instansi_id || item.kodeins || item.id_instansi))
        )
        if (matched?.nama_instansi) return matched.nama_instansi
        if (matched?.instansi_nama) return matched.instansi_nama
      }
    }
    return ''
  }, [sessions, instansiList, activeInstansiIds])

  const tilokKota = useMemo(() => {
    return tilok?.kota || tilok?.lokasi || ''
  }, [tilok])

  // Cek apakah ada cache di LocalStorage khusus storageKey instansi ini
  const initialSaved = useMemo(() => {
    try {
      if (typeof window === 'undefined') return null
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [storageKey])

  const initialShared = useMemo(() => {
    try {
      if (typeof window === 'undefined' || instansiKey === 'all') return null
      const raw = localStorage.getItem(sharedScopeKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [sharedScopeKey, instansiKey])

  // Signers 3 posisi (Master TTE Preset - jika dokumen ini belum pernah ditandatangani, warisi dari shared scope instansi ini)
  const [signers, setSigners] = useState(() => {
    if (initialSaved?.signers) return initialSaved.signers
    const defaultS = createDefaultSigners(derivedInstansiNama, storageKey)
    if (initialShared?.signers) {
      const adopted = { ...defaultS }
      ;['kiri', 'tengah', 'kanan'].forEach((pos) => {
        const sh = initialShared.signers[pos]
        if (sh && (sh.nama || sh.signatureData)) {
          adopted[pos] = {
            ...adopted[pos],
            nama: sh.nama || adopted[pos].nama,
            nip: sh.nip || adopted[pos].nip,
            jabatan: sh.jabatan || adopted[pos].jabatan,
            signatureData: sh.signatureData || null,
            isSigned: Boolean(sh.isSigned && sh.signatureData),
            signedAt: sh.signedAt || '',
          }
        }
      })
      return adopted
    }
    return defaultS
  })

  // Parameters (default kosong untuk instansi baru, mewarisi kotaTtd / tanggal dari shared scope jika ada)
  const [params, setParams] = useState(() => {
    if (initialSaved?.params) return initialSaved.params
    const defaultP = createDefaultParams(tilokKota)
    if (initialShared?.kotaTtd || initialShared?.tanggal) {
      return {
        ...defaultP,
        kotaTtd: initialShared.kotaTtd || defaultP.kotaTtd,
        tanggalPengecekan: initialShared.tanggal || defaultP.tanggalPengecekan,
      }
    }
    return defaultP
  })

  // 17 Butir Checklist Pertanyaan (default kosong)
  const [checklist, setChecklist] = useState(() => {
    if (Array.isArray(initialSaved?.checklist) && initialSaved.checklist.length > 0) {
      return initialSaved.checklist
    }
    return createDefaultChecklist()
  })

  // Inventaris Sarana dan Prasarana (default kosong)
  const [inventory, setInventory] = useState(() => {
    if (Array.isArray(initialSaved?.inventory) && initialSaved.inventory.length > 0) {
      return initialSaved.inventory
    }
    return createDefaultInventory()
  })

  const [isSavingDb, setIsSavingDb] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)
  const [savedUserPresets, setSavedUserPresets] = useState(null)
  const [docStatus, setDocStatus] = useState(() => initialData?.status || 'draft')

  useEffect(() => {
    if (initialData?.status) {
      setDocStatus(initialData.status)
    }
  }, [initialData?.status])

  const isPublished = docStatus === 'published' || initialData?.status === 'published'

  const signersSummary = useMemo(() => {
    const list = Object.values(signers)
    const active = list.filter((s) => s.nama || s.jabatan)
    const signed = list.filter((s) => s.isSigned)
    return {
      activeCount: active.length,
      signedCount: signed.length,
      isAllSigned: active.length > 0 && signed.length >= active.length,
    }
  }, [signers])

  // Persist State ke LocalStorage
  const persistState = useCallback(
    (currentSigners, currentParams, currentChecklist, currentInventory) => {
      try {
        const cs = currentSigners || signers
        const cp = currentParams || params
        const cc = currentChecklist || checklist
        const ci = currentInventory || inventory

        const payload = {
          storageKey,
          kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'PENGECEKAN SARPRAS CAT',
          tilokNama: tilok?.nama_tilok || 'KANTOR REGIONAL III BKN',
          params: cp,
          signers: cs,
          checklist: cc,
          inventory: ci,
        }
        localStorage.setItem(storageKey, JSON.stringify(payload))
        localStorage.setItem(`${storageKey}_signers`, JSON.stringify(cs))

        // Sinkronkan parameter kota, tanggal, dan TTE ke sharedScopeKey untuk instansi yang sama (sehingga tidak perlu 3x TTD)
        if (instansiKey !== 'all') {
          const hasSigners = Object.values(cs).some((s) => s.signatureData || s.nama)
          if (hasSigners || cp.kotaTtd || cp.tanggalPengecekan) {
            localStorage.setItem(
              sharedScopeKey,
              JSON.stringify({
                signers: cs,
                kotaTtd: cp.kotaTtd,
                tanggal: cp.tanggalPengecekan,
                updatedAt: new Date().toISOString(),
              })
            )
          }
        }

        // Update token public esign per position
        Object.entries(cs).forEach(([posKey, s]) => {
          const t = s.token || s.signToken
          if (t) {
            const tokenPayload = {
              ...payload,
              signerKey: posKey,
              positionKey: posKey,
              documentTitle: 'Formulir Pengecekan Sarana dan Prasarana',
              namaPenandatangan: s.nama,
              signerName: s.nama,
              nama: s.nama,
              nipPenandatangan: s.nip,
              signerNip: s.nip,
              nip: s.nip,
              jabatanPenandatangan: s.jabatan,
              signerJabatan: s.jabatan,
              jabatan: s.jabatan,
              isSigned: Boolean(s.isSigned),
              signatureData: s.signatureData || null,
              signedAt: s.signedAt || '',
            }
            localStorage.setItem(`cat_esign_token_${t}`, JSON.stringify(tokenPayload))
          }
        })
      } catch (err) {
        console.warn('Gagal menyimpan state sarpras ke localStorage:', err)
      }
    },
    [storageKey, signers, params, checklist, inventory, kegiatan, activeJenisTes, tilok]
  )

  // 1. Restore dari LocalStorage saat storageKey berubah
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.signers) {
          setSigners(parsed.signers)
        }
        if (parsed.params) {
          setParams(parsed.params)
        }
        if (Array.isArray(parsed.checklist) && parsed.checklist.length > 0) {
          setChecklist(parsed.checklist)
        }
        if (Array.isArray(parsed.inventory) && parsed.inventory.length > 0) {
          setInventory(parsed.inventory)
        }
      } else {
        // INSTANSI INI BELUM DIISI SECARA KHUSUS:
        // Cek apakah ada shared scope dari Berita Acara untuk instansi yang sama
        let inheritedSigners = null
        let inheritedParams = null
        if (instansiKey !== 'all') {
          try {
            const rawShared = localStorage.getItem(sharedScopeKey)
            if (rawShared) {
              const sharedData = JSON.parse(rawShared)
              if (sharedData?.signers) {
                const defaultS = createDefaultSigners(derivedInstansiNama, storageKey)
                const adopted = { ...defaultS }
                ;['kiri', 'tengah', 'kanan'].forEach((pos) => {
                  const sh = sharedData.signers[pos]
                  if (sh && (sh.nama || sh.signatureData)) {
                    adopted[pos] = {
                      ...adopted[pos],
                      nama: sh.nama || adopted[pos].nama,
                      nip: sh.nip || adopted[pos].nip,
                      jabatan: sh.jabatan || adopted[pos].jabatan,
                      signatureData: sh.signatureData || null,
                      isSigned: Boolean(sh.isSigned && sh.signatureData),
                      signedAt: sh.signedAt || '',
                    }
                  }
                })
                inheritedSigners = adopted
              }
              if (sharedData?.kotaTtd || sharedData?.tanggal) {
                const defaultP = createDefaultParams(tilokKota)
                inheritedParams = {
                  ...defaultP,
                  kotaTtd: sharedData.kotaTtd || defaultP.kotaTtd,
                  tanggalPengecekan: sharedData.tanggal || defaultP.tanggalPengecekan,
                }
              }
            }
          } catch {}
        }

        setSigners(inheritedSigners || createDefaultSigners(derivedInstansiNama, storageKey))
        setParams(inheritedParams || createDefaultParams(tilokKota))
        setChecklist(createDefaultChecklist())
        setInventory(createDefaultInventory())
      }
      const savedSigners = localStorage.getItem(`${storageKey}_signers`)
      if (savedSigners) {
        const parsedSigners = JSON.parse(savedSigners)
        if (parsedSigners && typeof parsedSigners === 'object') {
          setSigners((prev) => ({ ...prev, ...parsedSigners }))
        }
      }
    } catch (e) {
      console.warn('Gagal membaca cache sarpras:', e)
    }
  }, [storageKey, sharedScopeKey, instansiKey, derivedInstansiNama, tilokKota])

  // 2. Restore dari initialData (Database Snapshot) jika ada dan cocok untuk instansi ini
  useEffect(() => {
    if (initialData) {
      // Pastikan data database ini benar-benar milik instansi yang sedang dipilih
      if (activeInstansiIds.length > 0) {
        if (!initialData.instansi_id) return // Laporan DB tidak ber-instansi, jangan timpa form instansi aktif
        const savedIds = String(initialData.instansi_id).split(',').map((s) => s.trim())
        const isMatch = activeInstansiIds.some((id) => savedIds.includes(id))
        if (!isMatch) return // Milik instansi lain, jangan timpa state instansi aktif!
      }

      // Jika sudah ada sesi aktif di localStorage, jangan timpa dengan data DB lama saat refresh
      const localSaved = localStorage.getItem(storageKey)
      if (localSaved) return

      if (initialData.signers_json) {
        try {
          const parsed =
            typeof initialData.signers_json === 'string'
              ? JSON.parse(initialData.signers_json)
              : initialData.signers_json
          if (parsed && typeof parsed === 'object') {
            setSigners((prev) => ({ ...prev, ...parsed }))
          }
        } catch {}
      }

      if (initialData.params_json) {
        try {
          const parsedParams =
            typeof initialData.params_json === 'string'
              ? JSON.parse(initialData.params_json)
              : initialData.params_json
          if (parsedParams && typeof parsedParams === 'object') {
            setParams((prev) => ({ ...prev, ...parsedParams }))
          }
        } catch {}
      }

      if (initialData.data_snapshot_json) {
        try {
          const parsedSnap =
            typeof initialData.data_snapshot_json === 'string'
              ? JSON.parse(initialData.data_snapshot_json)
              : initialData.data_snapshot_json
          if (Array.isArray(parsedSnap?.checklist)) {
            setChecklist(parsedSnap.checklist)
          }
          if (Array.isArray(parsedSnap?.inventory)) {
            setInventory(parsedSnap.inventory)
          }
        } catch {}
      }
    }
  }, [initialData, storageKey, activeInstansiIds])

  // 3. Load Profil Penandatangan User yang Tersimpan di Database
  useEffect(() => {
    let active = true
    const jId = activeJenisTes?.id || activeJenisTes?.jenis_tes_id || ''
    const sId = kegiatan?.id || filterParams?.seleksiId || ''
    const tId = tilok?.uid || tilok?.id || filterParams?.tilokUid || ''

    if (!jId) return

    fetchCatUserSigners({ jenis_tes_id: jId, seleksi_id: sId, tilok_id: tId })
      .then((savedSigners) => {
        if (!active || !savedSigners) return
        setSavedUserPresets(savedSigners)
        setSigners((prev) => {
          const next = { ...prev }
          let hasChanges = false
          // Hanya isi identitas (nama, nip, jabatan) pihak BKN jika kosong. JANGAN auto-sign agar reset berfungsi sempurna!
          ;['kiri'].forEach((pos) => {
            const userPreset = savedSigners[pos]
            if (userPreset && !next[pos]?.nama) {
              next[pos] = {
                ...next[pos],
                nama: next[pos]?.nama || userPreset.nama || '',
                nip: next[pos]?.nip || userPreset.nip || '',
                jabatan: next[pos]?.jabatan || userPreset.jabatan || '',
              }
              hasChanges = true
            }
          })
          if (hasChanges) persistState(next, params, checklist, inventory)
          return hasChanges ? next : prev
        })
      })
      .catch((err) => {
        console.warn('Gagal memuat profil penandatangan pegawai:', err)
      })

    return () => {
      active = false
    }
  }, [activeJenisTes, kegiatan, tilok, filterParams, persistState, params, checklist, inventory])

  // 4. Sinkronisasi Real-Time E-Sign dari Tab HP / Publik via Storage Event
  useEffect(() => {
    const handleStorage = (e) => {
      if (!e.key) return

      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed && parsed.signers) {
            setSigners((prev) => {
              const next = { ...prev, ...parsed.signers }
              persistState(next, params, checklist, inventory)
              return next
            })
          }
        } catch (err) {
          console.warn('Gagal parse update storage:', err)
        }
        return
      }

      if (e.key.startsWith('cat_esign_token_') && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          if (data && data.isSigned && data.signatureData) {
            const targetPos = data.positionKey || data.signerKey
            if (targetPos && ['kiri', 'tengah', 'kanan'].includes(targetPos)) {
              setSigners((prev) => {
                if (
                  prev[targetPos]?.isSigned &&
                  prev[targetPos]?.signatureData === data.signatureData
                ) {
                  return prev
                }
                const next = {
                  ...prev,
                  [targetPos]: {
                    ...prev[targetPos],
                    signatureData: data.signatureData,
                    signedAt: data.signedAt || new Date().toLocaleString('id-ID'),
                    isSigned: true,
                  },
                }
                persistState(next, params, checklist, inventory)
                toast.success(`Tanda tangan ${targetPos.toUpperCase()} berhasil diterima dari perangkat HP!`)
                return next
              })
            }
          }
        } catch (err) {
          console.warn('Gagal sync e-sign storage:', err)
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [storageKey, persistState, params, checklist, inventory])

  // Signer change handlers
  const handleSignerChange = (posKey, field, val) => {
    setSigners((prev) => {
      const next = {
        ...prev,
        [posKey]: {
          ...prev[posKey],
          [field]: val,
        },
      }
      persistState(next, params, checklist, inventory)
      return next
    })
  }

  const handleSignPosition = (posKey, dataUrl) => {
    const timeStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    setSigners((prev) => {
      const next = {
        ...prev,
        [posKey]: {
          ...prev[posKey],
          signatureData: dataUrl,
          signedAt: timeStr,
          isSigned: true,
        },
      }
      persistState(next, params, checklist, inventory)
      return next
    })
    toast.success(`Tanda tangan posisi ${posKey.toUpperCase()} berhasil dibubuhkan.`)
  }

  const handleResetSigner = (posKey) => {
    setSigners((prev) => {
      const next = {
        ...prev,
        [posKey]: {
          ...prev[posKey],
          signatureData: null,
          signedAt: '',
          isSigned: false,
        },
      }
      persistState(next, params, checklist, inventory)
      return next
    })
    toast.info(`Tanda tangan posisi ${posKey.toUpperCase()} direset.`)
  }

  const handleCopyLink = (posKey) => {
    const s = signers[posKey]
    if (!s) return
    const token = s.token || s.signToken || `cat_sarpras_${posKey}`

    const payload = {
      storageKey,
      kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'PENGECEKAN SARPRAS CAT',
      tilokNama: tilok?.nama_tilok || 'KANTOR REGIONAL III BKN',
      signerKey: posKey,
      positionKey: posKey,
      documentTitle: 'Formulir Pengecekan Sarana dan Prasarana',
      namaPenandatangan: s.nama,
      signerName: s.nama,
      nama: s.nama,
      nipPenandatangan: s.nip,
      signerNip: s.nip,
      nip: s.nip,
      jabatanPenandatangan: s.jabatan,
      signerJabatan: s.jabatan,
      jabatan: s.jabatan,
      isSigned: Boolean(s.isSigned),
      signatureData: s.signatureData || null,
      signedAt: s.signedAt || '',
      params,
      signers,
      checklist,
      inventory,
    }

    try {
      localStorage.setItem(`cat_esign_token_${token}`, JSON.stringify(payload))
    } catch (e) {
      console.warn('Gagal persist token e-sign:', e)
    }

    const host = window.location.origin
    const url = `${host}/laporan/esign/${token}`
    navigator.clipboard.writeText(url)
    setCopiedKey(posKey)
    setTimeout(() => setCopiedKey(null), 2000)
    toast.info(`Tautan TTE ${posKey.toUpperCase()} disalin ke clipboard.`)
  }

  // Checklist Actions
  const handleChecklistChange = (id, field, val) => {
    setChecklist((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
      persistState(signers, params, next, inventory)
      return next
    })
  }

  const handleSetAllChecklistSesuai = () => {
    setChecklist((prev) => {
      const next = prev.map((item) => ({
        ...item,
        instansi: true,
        bkn: true,
        keterangan: 'Sesuai',
      }))
      persistState(signers, params, next, inventory)
      return next
    })
    toast.success('Seluruh 17 butir kegiatan disetel "Sesuai" (✓)')
  }

  const handleResetChecklist = () => {
    setChecklist((prev) => {
      const next = prev.map((item) => ({
        ...item,
        instansi: false,
        bkn: false,
        keterangan: '',
      }))
      persistState(signers, params, next, inventory)
      return next
    })
    toast.info('Seluruh centang kuesioner berhasil dikosongkan.')
  }

  // Inventory Actions
  const handleInventoryChange = (id, field, val) => {
    setInventory((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
      persistState(signers, params, checklist, next)
      return next
    })
  }

  const handleAddInventory = () => {
    const newId = Date.now()
    setInventory((prev) => {
      const next = [...prev, { id: newId, nama: '', jumlah: '1', keterangan: '' }]
      persistState(signers, params, checklist, next)
      return next
    })
  }

  const handleRemoveInventory = (id) => {
    setInventory((prev) => {
      const next = prev.filter((item) => item.id !== id)
      persistState(signers, params, checklist, next)
      return next
    })
  }

  const handleResetInventory = () => {
    const fresh = DEFAULT_SARPRAS_INVENTORY_ITEMS.map((item) => ({ ...item }))
    setInventory(fresh)
    persistState(signers, params, checklist, fresh)
    toast.info('Tabel sarana prasarana dikembalikan ke default.')
  }

  // Cetak Dokumen Langsung
  const handlePrint = () => {
    window.print()
  }

  // Simpan ke Database
  const handleSaveToDatabase = async (status = 'draft') => {
    if (typeof onSaveDocument !== 'function') return

    try {
      setIsSavingDb(true)
      await onSaveDocument({
        params: {
          ...params,
          nomorDokumen: params.nomorDokumen || 'FORM-SARPRAS-CAT',
          instansiIds: activeInstansiIds,
        },
        signers,
        evidenceMap: {},
        dataSnapshot: {
          checklist,
          inventory,
          rekomendasiStatus: params.rekomendasiStatus,
          catatanRekomendasi: params.catatanRekomendasi,
          kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'PENGECEKAN SARPRAS CAT',
          tilokNama: tilok?.nama_tilok || 'KANTOR REGIONAL III BKN',
          status,
          instansiIds: activeInstansiIds,
          instansiNama: derivedInstansiNama,
        },
        status,
      })

      setDocStatus(status)
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 3000)
      toast.success(
        status === 'published'
          ? 'Formulir Sarana dan Prasarana berhasil Diterbitkan!'
          : 'Draft Formulir Sarana dan Prasarana berhasil disimpan ke database!'
      )
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan Formulir ke database.')
    } finally {
      setIsSavingDb(false)
    }
  }

  return (
    <div className="space-y-5 w-full">
      {/* 1. TABS HEADER + ACTION CLUSTER */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl overflow-x-auto clean-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('params')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'params'
                ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Parameter &amp; Kuesioner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Pratinjau</span>
          </button>
        </div>

        {/* Action Cluster */}
        <div className="flex items-center gap-2 px-2 shrink-0 justify-end">
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tersimpan</span>
            </span>
          )}

          {!isPublished && (
            <button
              type="button"
              onClick={() => handleSaveToDatabase('draft')}
              disabled={isSavingDb}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingDb ? 'Menyimpan...' : 'Simpan Draft'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSaveToDatabase('published')}
            disabled={isSavingDb || isPublished}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all ${
              isPublished
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                : 'bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white active:scale-95 cursor-pointer disabled:opacity-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {isSavingDb
                ? 'Memproses...'
                : isPublished
                ? 'Sudah Diterbitkan'
                : 'Terbitkan Formulir'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Buka Pratinjau & Ekspor Dokumen PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#175CD3]" />
            <span>Pratinjau PDF</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: PARAMETER, KUESIONER, INVENTARIS */}
      {activeTab === 'params' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-2xs space-y-7">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#175CD3]" />
              <span>Formulir Pengecekan Sarana dan Prasarana CAT</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Isi parameter kuesioner kesesuaian teknis 17 kegiatan, inventaris sarpras, rekomendasi tim, serta penandatanganan resmi.
            </p>
          </div>

          {/* BAGIAN A: KUESIONER 17 BUTIR PENGECEKAN KESIAPAN TEKNIS */}
          <div className="space-y-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  A. Kuesioner Pengecekan Kesiapan Sarpras (17 Butir Kegiatan)
                </h4>
                <p className="text-[11px] text-slate-400 italic">
                  * Berikan tanda centang kesesuaian pada pihak Instansi dan BKN serta isi keterangan jika diperlukan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetAllChecklistSesuai}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Otomatis centang seluruh 17 kegiatan menjadi Sesuai"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Setel Semua Sesuai (✓)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetChecklist}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  title="Hapus semua centang kuesioner"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Hapus Semua Centang</span>
                </button>
              </div>
            </div>

            {/* Tabel Kuesioner Interaktif */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 w-10 text-center">No.</th>
                      <th className="py-2.5 px-3">Kegiatan Pengecekan</th>
                      <th className="py-2.5 px-3 w-28 text-center">Instansi</th>
                      <th className="py-2.5 px-3 w-28 text-center">BKN</th>
                      <th className="py-2.5 px-3 w-48 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {checklist.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 leading-snug">
                          {item.kegiatan}
                        </td>
                        {/* Checkbox Instansi (Cukup Checkbox Saja) */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={Boolean(item.instansi)}
                              onChange={(e) =>
                                handleChecklistChange(item.id, 'instansi', e.target.checked)
                              }
                              className="w-4 h-4 accent-[#175CD3] text-[#175CD3] rounded cursor-pointer transition-all"
                            />
                          </div>
                        </td>
                        {/* Checkbox BKN (Cukup Checkbox Saja) */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={Boolean(item.bkn)}
                              onChange={(e) =>
                                handleChecklistChange(item.id, 'bkn', e.target.checked)
                              }
                              className="w-4 h-4 accent-[#175CD3] text-[#175CD3] rounded cursor-pointer transition-all"
                            />
                          </div>
                        </td>
                        {/* Keterangan */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.keterangan || ''}
                            onChange={(e) =>
                              handleChecklistChange(item.id, 'keterangan', e.target.value)
                            }
                            placeholder="Sesuai"
                            className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* BAGIAN B: INVENTARIS SARANA DAN PRASARANA */}
          <div className="space-y-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  B. Inventaris Sarana dan Prasarana di Titik Lokasi
                </h4>
                <p className="text-[11px] text-slate-400 italic">
                  * Tambahkan atau sesuaikan jumlah perangkat PC, proyektor, genset, serta fasilitas lainnya.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddInventory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Sarpras</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetInventory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* Tabel Inventaris Dinamis */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 w-10 text-center">No.</th>
                      <th className="py-2.5 px-3">Nama Sarana dan Prasarana</th>
                      <th className="py-2.5 px-3 w-28 text-center">Jumlah</th>
                      <th className="py-2.5 px-3">Keterangan / Penyedia</th>
                      <th className="py-2.5 px-3 w-14 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inventory.map((inv, idx) => (
                      <tr
                        key={inv.id || idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={inv.nama || ''}
                            onChange={(e) =>
                              handleInventoryChange(inv.id, 'nama', e.target.value)
                            }
                            placeholder="Contoh: PC Ujian Client"
                            className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="text"
                            value={inv.jumlah || ''}
                            onChange={(e) =>
                              handleInventoryChange(inv.id, 'jumlah', e.target.value)
                            }
                            placeholder="1"
                            className="w-full h-8 px-2.5 text-xs text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={inv.keterangan || ''}
                            onChange={(e) =>
                              handleInventoryChange(inv.id, 'keterangan', e.target.value)
                            }
                            placeholder="Disediakan oleh: Instansi"
                            className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveInventory(inv.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Baris Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* BAGIAN C: PARAMETER LOKASI & REKOMENDASI KELAIKAN */}
          <div className="space-y-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              C. Parameter Lokasi &amp; Rekomendasi Kelaikan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Kota TTD */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kota Penandatanganan
                </label>
                <input
                  type="text"
                  value={params.kotaTtd || ''}
                  onChange={(e) => {
                    const next = { ...params, kotaTtd: e.target.value }
                    setParams(next)
                    persistState(signers, next, checklist, inventory)
                  }}
                  placeholder="Contoh: Cirebon"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Tanggal Pengecekan */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tanggal Pengecekan / Uji Coba
                </label>
                <input
                  type="date"
                  value={params.tanggalPengecekan || ''}
                  onChange={(e) => {
                    const next = { ...params, tanggalPengecekan: e.target.value }
                    setParams(next)
                    persistState(signers, next, checklist, inventory)
                  }}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Hasil Rekomendasi Kelaikan */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Status Rekomendasi BKN
                </label>
                <select
                  value={params.rekomendasiStatus || ''}
                  onChange={(e) => {
                    const next = { ...params, rekomendasiStatus: e.target.value }
                    setParams(next)
                    persistState(signers, next, checklist, inventory)
                  }}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="">-- Pilih Status Rekomendasi (Belum Ditentukan) --</option>
                  <option value="layak">Layak untuk dilaksanakan (Rekomendasi Utama)</option>
                  <option value="catatan">Layak dengan Catatan Perbaikan</option>
                  <option value="tidak_layak">Tidak Layak Dilaksanakan</option>
                </select>
              </div>

              {/* Catatan Rekomendasi */}
              <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan Rekomendasi Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={params.catatanRekomendasi || ''}
                  onChange={(e) => {
                    const next = { ...params, catatanRekomendasi: e.target.value }
                    setParams(next)
                    persistState(signers, next, checklist, inventory)
                  }}
                  placeholder="Contoh: Seluruh PC client dan jaringan cadangan telah dilakukan uji coba beban dan berjalan lancar."
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* BAGIAN D: PENANDATANGANAN & PENGESAHAN DOKUMEN (3 KOLOM FLEKSIBEL) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  D. Penandatanganan &amp; Pengesahan Dokumen (3 Kolom Fleksibel)
                </h4>
                {signersSummary.isAllSigned ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pengesahan Lengkap ({signersSummary.signedCount}/{signersSummary.activeCount} Sudah TTE)</span>
                  </span>
                ) : signersSummary.signedCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Progress TTE: {signersSummary.signedCount}/{signersSummary.activeCount} Selesai</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                    <span>Menunggu TTE (0/{signersSummary.activeCount || 2})</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Kolom yang tidak diisi otomatis tidak muncul di cetakan dokumen.
              </p>
            </div>

            {/* Form 3 Kolom Penandatangan Standar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-1">
              <SignerPositionCol
                positionKey="kiri"
                title="1. Posisi Kiri"
                sublabel="Panitia Pelaksana BKN"
                signer={signers.kiri}
                onChange={handleSignerChange}
                onSign={handleSignPosition}
                onReset={handleResetSigner}
                onCopyLink={handleCopyLink}
                isCopied={copiedKey === 'kiri'}
                savedPresetSignature={savedUserPresets?.kiri?.signature_data || savedUserPresets?.kiri?.signatureData}
              />

              <SignerPositionCol
                positionKey="tengah"
                title="2. Posisi Tengah"
                sublabel="Opsional: Petugas TI / Saksi"
                signer={signers.tengah}
                onChange={handleSignerChange}
                onSign={handleSignPosition}
                onReset={handleResetSigner}
                onCopyLink={handleCopyLink}
                isCopied={copiedKey === 'tengah'}
              />

              <SignerPositionCol
                positionKey="kanan"
                title="3. Posisi Kanan"
                sublabel="Panitia Instansi Pengusul"
                signer={signers.kanan}
                onChange={handleSignerChange}
                onSign={handleSignPosition}
                onReset={handleResetSigner}
                onCopyLink={handleCopyLink}
                isCopied={copiedKey === 'kanan'}
              />
            </div>
          </div>

          {/* Catatan Status Standar Dokumen CAT */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Seluruh isian parameter dan tanda tangan otomatis tersimpan di sesi lokal. Klik <strong>Simpan Draft</strong> atau <strong>Terbitkan Formulir</strong> di pojok kanan atas untuk menyimpan permanen ke database server.</span>
            </p>
            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tersimpan ke Database</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. TAB 2: PRATINJAU DOKUMEN PDF RESMI (NATIVE EMBEDDED PDF READER SAMA SEPERTI LAPORAN CAT) */}
      {activeTab === 'preview' && (
        <DocumentPdfPreview
          fileName={`Formulir_Pengecekan_Sarpras_CAT_${(params.kotaTtd || 'Cirebon').replace(/\s+/g, '_')}_${params.tanggalPengecekan || '2026'}.pdf`}
          title="Pratinjau PDF: Formulir Pengecekan Sarana dan Prasarana"
        >
          <CatFormulirSarprasTemplate
            params={params}
            checklist={checklist}
            inventory={inventory}
            signers={signers}
          />
        </DocumentPdfPreview>
      )}
    </div>
  )
}
