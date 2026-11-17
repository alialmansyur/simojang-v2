import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Printer,
  Download,
  RefreshCw,
  FileCheck,
  Trash2,
  Save,
  Eye,
  Edit3,
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  Sliders,
  RotateCcw,
  Move,
  Maximize2,
  Check,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { PDFDocument } from 'pdf-lib'
import { SignerPositionCol } from '../../../document-builder/DocumentBuilderShell'
import {
  fetchCatUserSigners,
} from '../../../../../services/api/sidigiCatServicesApi'

/**
 * Storage Persisten Menggunakan IndexedDB untuk Berkas PDF Asli & Bertandatangan.
 * Memastikan dokumen yang telah diunggah dan dibubuhi TTE TIDAK HILANG saat halaman di-refresh.
 */
const DB_NAME = 'SimojangCatBaDb'
const STORE_NAME = 'documents'

function openBaDb() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null)
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function saveBaDocsToIdb(key, docs) {
  try {
    const db = await openBaDb()
    if (!db) return false
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const storable = docs.map((d) => ({
          id: d.id,
          name: d.name,
          size: d.size,
          pageCount: d.pageCount,
          originalBytes: d.originalBytes,
          stampedBytes: d.stampedBytes,
          isStamped: Boolean(d.isStamped),
          status: d.status || 'stamped',
        }))
        tx.objectStore(STORE_NAME).put(storable, key)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
      } catch {
        resolve(false)
      }
    })
  } catch {
    return false
  }
}

async function getBaDocsFromIdb(key) {
  try {
    const db = await openBaDb()
    if (!db) return null
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).get(key)
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => resolve(null)
      } catch {
        resolve(null)
      }
    })
  } catch {
    return null
  }
}

/**
 * Margin & Koordinat Presisi Penempatan Tanda Tangan di Dokumen Berita Acara A4 (595 x 842 pt).
 */
export const DEFAULT_STAMP_MARGINS = {
  baseY: 190,  // Posisi vertikal dari dasar halaman (tepat di tengah ruang kosong)
  kiriX: 98,   // Posisi horizontal kolom kiri (Pihak BKN)
  kananX: 386, // Posisi horizontal kolom kanan (Panitia Instansi)
  tengahX: 242,// Posisi horizontal kolom tengah (Opsional)
  width: 110,  // Lebar gambar tanda tangan
  height: 60,  // Tinggi gambar tanda tangan
}

function createDefaultSigners(instansiNama = '', baseToken = '') {
  const ts = Date.now().toString(36)
  const tokenPrefix = baseToken || `cat_ba_${ts}`

  return {
    kiri: {
      position: 'kiri',
      title: '1. Posisi Kiri',
      sublabel: 'Pihak BKN',
      jabatan: 'Panitia Pelaksana BKN',
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
      sublabel: 'Opsional: Mengetahui / Saksi',
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
      jabatan: instansiNama ? `Panitia ${instansiNama}` : 'Panitia Pelaksana Instansi',
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
    tanggalBa: '',
  }
}

// Helper convert data URI ke Uint8Array
function dataUriToUint8Array(dataUri) {
  const base64 = dataUri.split(',')[1]
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Convert Uint8Array to base64
function uint8ArrayToBase64(bytes) {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Pure helper untuk membubuhkan tanda tangan ke Uint8Array PDF dengan margin presisi
 */
async function stampSignaturesToBytes(inputBytes, signers, margins = {}) {
  if (!inputBytes) return null
  try {
    const pdfDoc = await PDFDocument.load(inputBytes)
    const pages = pdfDoc.getPages()
    if (pages.length === 0) return null

    // Tempelkan pada Halaman 1 Berita Acara
    const page = pages[0]

    const baseY = margins.baseY ?? DEFAULT_STAMP_MARGINS.baseY
    const sigHeight = margins.height ?? DEFAULT_STAMP_MARGINS.height
    const sigWidth = margins.width ?? DEFAULT_STAMP_MARGINS.width

    // Koordinat penempatan 3 kolom dengan margin presisi
    const positions = {
      kiri: { x: margins.kiriX ?? DEFAULT_STAMP_MARGINS.kiriX, y: baseY, width: sigWidth, height: sigHeight },
      tengah: { x: margins.tengahX ?? DEFAULT_STAMP_MARGINS.tengahX, y: baseY, width: sigWidth, height: sigHeight },
      kanan: { x: margins.kananX ?? DEFAULT_STAMP_MARGINS.kananX, y: baseY, width: sigWidth, height: sigHeight },
    }

    for (const posKey of ['kiri', 'tengah', 'kanan']) {
      const s = signers[posKey]
      // Hanya tempelkan jika penandatangan sudah nyata bertandatangan DAN ada data gambar tanda tangannya
      if (!s || !s.isSigned || !s.signatureData) continue

      const sigDataUri = s.signatureData
      if (typeof sigDataUri !== 'string' || sigDataUri.length < 50) continue

      const pos = positions[posKey]
      try {
        const rawImg = dataUriToUint8Array(sigDataUri)
        let img
        if (sigDataUri.includes('image/jpeg') || sigDataUri.includes('image/jpg')) {
          img = await pdfDoc.embedJpg(rawImg)
        } else {
          img = await pdfDoc.embedPng(rawImg)
        }
        page.drawImage(img, {
          x: pos.x,
          y: pos.y,
          width: pos.width,
          height: pos.height,
        })
      } catch (err) {
        console.error(`Gagal embed tanda tangan ${posKey}:`, err)
      }
    }

    const finalBytes = await pdfDoc.save()
    return finalBytes
  } catch (err) {
    console.error('Gagal membubuhkan tanda tangan ke PDF:', err)
    return null
  }
}

export function BaProfilingAsnBuilder({
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
  documentTitle = 'Berita Acara Profiling ASN',
}) {
  const [activeTab, setActiveTab] = useState('params') // 'params' | 'preview'

  // Multi-Document Support: Setiap berkas BA per sesi disimpan dalam list
  const [documents, setDocuments] = useState([])
  const [activeDocIndex, setActiveDocIndex] = useState(0)

  // Pengaturan Margin & Presisi Tanda Tangan
  const [stampMargins, setStampMargins] = useState(() => {
    try {
      const saved = localStorage.getItem('cat_ba_stamp_margins')
      if (saved) return { ...DEFAULT_STAMP_MARGINS, ...JSON.parse(saved) }
    } catch {}
    return { ...DEFAULT_STAMP_MARGINS }
  })
  const [showMarginSettings, setShowMarginSettings] = useState(false)

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
    return `cat_ba_profiling_${seleksiId || 'global'}_${tilokId || 'global'}_${instansiKey}`
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

  // Cek cache localStorage awal (baik khusus dokumen ini atau dari shared scope instansi yang sama)
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
        tanggalBa: initialShared.tanggal || defaultP.tanggalBa,
      }
    }
    return defaultP
  })

  const [isProcessingPdf, setIsProcessingPdf] = useState(false)
  const [isSavingDb, setIsSavingDb] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)
  const [savedUserPresets, setSavedUserPresets] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
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

  const fileInputRef = useRef(null)
  const activeDoc = documents[activeDocIndex] || documents[0] || null

  // Simpan Margin ke LocalStorage
  const handleMarginChange = (field, val) => {
    setStampMargins((prev) => {
      const next = { ...prev, [field]: Number(val) }
      try {
        localStorage.setItem('cat_ba_stamp_margins', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleResetMargins = () => {
    setStampMargins({ ...DEFAULT_STAMP_MARGINS })
    try {
      localStorage.setItem('cat_ba_stamp_margins', JSON.stringify(DEFAULT_STAMP_MARGINS))
    } catch {}
    toast.info('Margin penempatan TTE dikembalikan ke setelan presisi default.')
  }

  // Persist State Helper ke LocalStorage
  const persistState = useCallback(
    (currentSigners, currentParams) => {
      try {
        const cs = currentSigners || signers
        const cp = currentParams || params
        const payload = {
          storageKey,
          kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'BERITA ACARA PROFILING ASN',
          tilokNama: tilok?.nama_tilok || 'KANTOR REGIONAL III BKN',
          tanggalPelaksanaan: cp.tanggalBa || new Date().toISOString().split('T')[0],
          params: cp,
          signers: cs,
          documentsCount: documents.length,
        }
        localStorage.setItem(storageKey, JSON.stringify(payload))
        localStorage.setItem(`${storageKey}_signers`, JSON.stringify(cs))

        // Sinkronkan parameter kota, tanggal, dan TTE ke sharedScopeKey untuk instansi yang sama (sehingga tidak perlu 3x TTD)
        if (instansiKey !== 'all') {
          const hasSigners = Object.values(cs).some((s) => s.signatureData || s.nama)
          if (hasSigners || cp.kotaTtd || cp.tanggalBa) {
            localStorage.setItem(
              sharedScopeKey,
              JSON.stringify({
                signers: cs,
                kotaTtd: cp.kotaTtd,
                tanggal: cp.tanggalBa,
                updatedAt: new Date().toISOString(),
              })
            )
          }
        }

        // Update each signer's individual public esign token
        Object.entries(cs).forEach(([posKey, s]) => {
          const t = s.token || s.signToken
          if (t) {
            const tokenPayload = {
              ...payload,
              signerKey: posKey,
              positionKey: posKey,
              documentTitle: 'Berita Acara Profiling ASN',
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
        console.warn('Gagal menyimpan state e-sign ke localStorage:', err)
      }
    },
    [storageKey, signers, params, kegiatan, activeJenisTes, tilok, documents.length]
  )

  // Helper sanitasi signers untuk membersihkan artefak dummy lawas
  const sanitizeLoadedSigners = useCallback((rawSigners) => {
    if (!rawSigners || typeof rawSigners !== 'object') return rawSigners
    const cleaned = { ...rawSigners }
    ;['kiri', 'tengah', 'kanan'].forEach((pos) => {
      const s = cleaned[pos]
      if (s) {
        // Jika bertanggal hardcoded '16 November 2026' dari default dummy lama, bersihkan
        if (s.signedAt === '16 November 2026') {
          cleaned[pos] = {
            ...s,
            isSigned: false,
            signatureData: null,
            signedAt: '',
          }
        }
      }
    })
    return cleaned
  }, [])

  // 1. Restore dari localStorage cache saat storageKey berubah
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.signers) {
          setSigners(sanitizeLoadedSigners(parsed.signers))
        }
        if (parsed.params) {
          setParams(parsed.params)
        }
      } else {
        // INSTANSI INI BELUM DIISI SECARA KHUSUS:
        // Cek apakah ada shared scope dari dokumen sejenis (Formulir Sarpras) untuk instansi yang sama
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
                  tanggalBa: sharedData.tanggal || defaultP.tanggalBa,
                }
              }
            }
          } catch {}
        }

        setSigners(inheritedSigners || createDefaultSigners(derivedInstansiNama, storageKey))
        setParams(inheritedParams || createDefaultParams(tilokKota))
      }
      const savedSigners = localStorage.getItem(`${storageKey}_signers`)
      if (savedSigners) {
        const parsedSigners = JSON.parse(savedSigners)
        if (parsedSigners && typeof parsedSigners === 'object') {
          setSigners((prev) => ({ ...prev, ...sanitizeLoadedSigners(parsedSigners) }))
        }
      }
    } catch (e) {
      console.warn('Gagal membaca cache BA:', e)
    }
  }, [storageKey, sharedScopeKey, instansiKey, derivedInstansiNama, tilokKota, sanitizeLoadedSigners])

  // 2. Restore Berkas PDF yang Pernah Diunggah & Dibubuhi dari IndexedDB (TIDAK HILANG SAAT REFRESH)
  useEffect(() => {
    let active = true

    getBaDocsFromIdb(storageKey).then((savedDocs) => {
      if (!active) return
      if (!savedDocs || !Array.isArray(savedDocs) || savedDocs.length === 0) {
        setDocuments([])
        return
      }

      const restored = savedDocs.map((doc) => {
        const bytesToUse = doc.stampedBytes || doc.originalBytes
        const blob = new Blob([bytesToUse], { type: 'application/pdf' })
        return {
          ...doc,
          stampedUrl: URL.createObjectURL(blob),
        }
      })

      setDocuments(restored)
    })

    return () => {
      active = false
    }
  }, [storageKey])

  // 3. Restore dari initialData (Database Snapshot) jika ada dan cocok untuk instansi ini
  useEffect(() => {
    if (initialData) {
      if (activeInstansiIds.length > 0) {
        if (!initialData.instansi_id) return // Laporan DB tidak ber-instansi, jangan timpa form instansi aktif
        const savedIds = String(initialData.instansi_id).split(',').map((s) => s.trim())
        const isMatch = activeInstansiIds.some((id) => savedIds.includes(id))
        if (!isMatch) return // Milik instansi lain, jangan timpa!
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
        } catch {
          // ignore
        }
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
        } catch {
          // ignore
        }
      }

      if (initialData.evidence_json) {
        try {
          const parsedEv =
            typeof initialData.evidence_json === 'string'
              ? JSON.parse(initialData.evidence_json)
              : initialData.evidence_json
          if (parsedEv?.pdfBase64) {
            const raw = atob(parsedEv.pdfBase64.split(',')[1] || '')
            const bytes = new Uint8Array(raw.length)
            for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)

            PDFDocument.load(bytes).then((doc) => {
              const pages = doc.getPageCount()
              const stamped = parsedEv.pdfBase64
              setDocuments((existing) => {
                if (existing.length > 0) return existing
                return [
                  {
                    id: 'doc_initial',
                    name: parsedEv.pdfFileName || 'Berita_Acara_Asli.pdf',
                    size: bytes.byteLength,
                    pageCount: pages,
                    originalBytes: bytes,
                    stampedBytes: bytes,
                    stampedUrl: stamped,
                    isStamped: true,
                    status: 'stamped',
                  },
                ]
              })
            })
          }
        } catch {
          // ignore
        }
      }
    }
  }, [initialData, storageKey, activeInstansiIds])

  // 4. Load Profil Penandatangan User yang Tersimpan di Database
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
          if (hasChanges) persistState(next, params)
          return hasChanges ? next : prev
        })
      })
      .catch((err) => {
        console.warn('Gagal memuat profil penandatangan pegawai:', err)
      })

    return () => {
      active = false
    }
  }, [activeJenisTes, kegiatan, tilok, filterParams, persistState, params])

  // 5. Sinkronisasi Real-Time E-Sign dari Tab HP / Publik via Storage Event
  useEffect(() => {
    const handleStorage = (e) => {
      if (!e.key) return

      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed && parsed.signers) {
            setSigners((prev) => {
              const next = { ...prev, ...parsed.signers }
              persistState(next, params)
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
                if (prev[targetPos]?.isSigned && prev[targetPos]?.signatureData === data.signatureData) {
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
                persistState(next, params)
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
  }, [storageKey, persistState, params])

  // Handler Unggah Berkas PDF (Bisa 1 atau banyak file sekaligus)
  const handleFilesAdded = async (fileList) => {
    const validFiles = Array.from(fileList).filter((f) => f.name.toLowerCase().endsWith('.pdf'))
    if (validFiles.length === 0) {
      toast.error('Format berkas harus berupa dokumen PDF (.pdf)')
      return
    }

    setIsProcessingPdf(true)
    const newDocs = []

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      try {
        const arrayBuffer = await file.arrayBuffer()
        const uint8 = new Uint8Array(arrayBuffer)
        const doc = await PDFDocument.load(uint8)
        const pages = doc.getPageCount()

        const originalBlob = new Blob([uint8], { type: 'application/pdf' })
        const previewUrl = URL.createObjectURL(originalBlob)

        newDocs.push({
          id: `doc_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          file,
          name: file.name,
          size: file.size,
          pageCount: pages,
          originalBytes: uint8,
          stampedBytes: null,
          stampedUrl: previewUrl,
          isStamped: false,
          status: 'uploaded',
        })
      } catch (err) {
        console.error(`Gagal membaca ${file.name}:`, err)
        toast.error(`Gagal memuat ${file.name}: pastikan berkas tidak terenkripsi.`)
      }
    }

    if (newDocs.length > 0) {
      setDocuments((prev) => {
        const next = [...prev, ...newDocs]
        saveBaDocsToIdb(storageKey, next)
        return next
      })
      toast.info(
        `${newDocs.length} berkas Berita Acara dimuat. Klik tombol "Bubuhkan TTE" untuk menempelkan tanda tangan resmi.`
      )
    }
    setIsProcessingPdf(false)
  }

  const [processingDocId, setProcessingDocId] = useState(null)

  // PEMBUBUHAN TTE UNTUK BERKAS TUNGGAL (PER FILE)
  const handleBubuhkanSingle = async (docId) => {
    const targetDoc = documents.find((d) => d.id === docId)
    if (!targetDoc) return

    const hasAnySignature = Object.values(signers).some((s) => s.isSigned && s.signatureData)
    if (!hasAnySignature) {
      toast.warning('Belum ada tanda tangan yang dibuat. Silakan gores TTE pada kolom penandatangan terlebih dahulu.')
      return
    }

    setProcessingDocId(docId)
    try {
      const stampedBytes = await stampSignaturesToBytes(targetDoc.originalBytes, signers, stampMargins)
      const finalBytes = stampedBytes || targetDoc.originalBytes
      if (targetDoc.stampedUrl) {
        URL.revokeObjectURL(targetDoc.stampedUrl)
      }
      const blob = new Blob([finalBytes], { type: 'application/pdf' })
      const updatedDoc = {
        ...targetDoc,
        stampedBytes: finalBytes,
        stampedUrl: URL.createObjectURL(blob),
        isStamped: true,
        status: 'stamped',
      }

      const updatedDocs = documents.map((d) => (d.id === docId ? updatedDoc : d))
      setDocuments(updatedDocs)
      await saveBaDocsToIdb(storageKey, updatedDocs)

      // Auto-save draft jika berkas pertama yang dibubuhi
      if (typeof onSaveDocument === 'function' && updatedDocs[0]?.id === docId) {
        let pdfBase64 = ''
        if (finalBytes) {
          pdfBase64 = `data:application/pdf;base64,${uint8ArrayToBase64(finalBytes)}`
        }
        onSaveDocument({
          params: {
            ...params,
            nomorDokumen: params.nomorDokumen || 'BA-PROFILING-ASN',
            stampMargins,
            instansiIds: activeInstansiIds,
          },
          signers,
          evidenceMap: {
            pdfBase64,
            pdfFileName: targetDoc.name || 'Berita_Acara.pdf',
            documentsCount: updatedDocs.length,
          },
          dataSnapshot: {
            pdfFileName: targetDoc.name || '',
            pdfPageCount: targetDoc.pageCount || 0,
            totalDocuments: updatedDocs.length,
            kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'PROFILING ASN',
            tilokNama: tilok?.nama_tilok || 'KANTOR REGIONAL III BKN',
            status: 'draft',
            instansiIds: activeInstansiIds,
            instansiNama: derivedInstansiNama,
          },
          status: 'draft',
        }).catch((err) => console.warn('Auto-save draft error:', err))
      }

      toast.success(`Tanda tangan berhasil dibubuhkan pada berkas "${targetDoc.name}"!`)
    } catch (err) {
      console.error('Gagal membubuhkan tanda tangan:', err)
      toast.error(`Gagal membubuhkan tanda tangan pada "${targetDoc.name}"`)
    } finally {
      setProcessingDocId(null)
    }
  }

  // EKSEKUSI PEMBUBUHAN TTE SECARA MASSAL (SEMUA BERKAS)
  const handleBubuhkan = async () => {
    if (documents.length === 0) {
      toast.warning('Silakan unggah minimal 1 berkas PDF Berita Acara terlebih dahulu.')
      return
    }

    const hasAnySignature = Object.values(signers).some((s) => s.isSigned && s.signatureData)
    if (!hasAnySignature) {
      toast.warning('Belum ada tanda tangan yang dibuat. Silakan gores TTE pada kolom penandatangan terlebih dahulu.')
      return
    }

    setIsProcessingPdf(true)
    try {
      const stampedList = await Promise.all(
        documents.map(async (doc) => {
          const stampedBytes = await stampSignaturesToBytes(doc.originalBytes, signers, stampMargins)
          const finalBytes = stampedBytes || doc.originalBytes
          if (doc.stampedUrl) {
            URL.revokeObjectURL(doc.stampedUrl)
          }
          const blob = new Blob([finalBytes], { type: 'application/pdf' })
          return {
            ...doc,
            stampedBytes: finalBytes,
            stampedUrl: URL.createObjectURL(blob),
            isStamped: true,
            status: 'stamped',
          }
        })
      )

      setDocuments(stampedList)

      // Simpan ke IndexedDB agar tidak hilang saat refresh
      await saveBaDocsToIdb(storageKey, stampedList)

      // Auto-save draft dokumen pertama ke database jika handler tersedia
      if (typeof onSaveDocument === 'function' && stampedList.length > 0) {
        const firstDoc = stampedList[0]
        let pdfBase64 = ''
        if (firstDoc?.stampedBytes) {
          pdfBase64 = `data:application/pdf;base64,${uint8ArrayToBase64(firstDoc.stampedBytes)}`
        }
        onSaveDocument({
          params: {
            ...params,
            nomorDokumen: params.nomorDokumen || 'BA-PROFILING-ASN',
            stampMargins,
            instansiIds: activeInstansiIds,
          },
          signers,
          evidenceMap: {
            pdfBase64,
            pdfFileName: firstDoc?.name || 'Berita_Acara.pdf',
            documentsCount: stampedList.length,
          },
          dataSnapshot: {
            pdfFileName: firstDoc?.name || '',
            pdfPageCount: firstDoc?.pageCount || 0,
            totalDocuments: stampedList.length,
            kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'PROFILING ASN',
            tilokNama: tilok?.nama_tilok || 'KANTOR REGIONAL III BKN',
            status: 'draft',
            instansiIds: activeInstansiIds,
            instansiNama: derivedInstansiNama,
          },
          status: 'draft',
        }).catch((err) => console.warn('Auto-save draft error:', err))
      }

      toast.success(
        `Tanda tangan berhasil dibubuhkan pada seluruh (${stampedList.length}) berkas Berita Acara!`
      )
      // Tetap berada di halaman ini tanpa redirect ke tab pratinjau sesuai permintaan user
    } catch (err) {
      console.error('Gagal membubuhkan tanda tangan:', err)
      toast.error('Terjadi kesalahan saat membubuhkan tanda tangan.')
    } finally {
      setIsProcessingPdf(false)
    }
  }

  // Hapus Berkas Tertentu
  const handleRemoveDoc = async (docId) => {
    setDocuments((prev) => {
      const target = prev.find((d) => d.id === docId)
      if (target?.stampedUrl) {
        URL.revokeObjectURL(target.stampedUrl)
      }
      const next = prev.filter((d) => d.id !== docId)
      saveBaDocsToIdb(storageKey, next)
      return next
    })
    toast.info('Berkas dihapus.')
  }

  // Hapus Semua Berkas
  const handleClearAllDocs = async () => {
    documents.forEach((d) => {
      if (d.stampedUrl) URL.revokeObjectURL(d.stampedUrl)
    })
    setDocuments([])
    setActiveDocIndex(0)
    await saveBaDocsToIdb(storageKey, [])
    toast.info('Seluruh berkas Berita Acara dihapus.')
  }

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
      persistState(next, params)
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
      persistState(next, params)
      return next
    })
    toast.success(`Tanda tangan posisi ${posKey.toUpperCase()} berhasil dibubuhkan & tertaut ke dokumen.`)
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
      persistState(next, params)
      return next
    })
    toast.info(`Tanda tangan posisi ${posKey.toUpperCase()} direset.`)
  }

  // Salin Tautan TTE Publik (Mobile/HP)
  const handleCopyLink = (posKey) => {
    const s = signers[posKey]
    if (!s) return
    const token = s.token || s.signToken || `cat_ba_${posKey}`

    const payload = {
      storageKey,
      kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'BERITA ACARA PROFILING ASN',
      tilokNama: tilok?.nama_tilok || 'KANTOR REGIONAL III BKN',
      tanggalPelaksanaan: params.tanggalBa || new Date().toISOString().split('T')[0],
      signerKey: posKey,
      positionKey: posKey,
      documentTitle: 'Berita Acara Profiling ASN',
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

  // Download Berkas Tunggal
  const handleDownloadDoc = (doc) => {
    const bytesToDownload = doc?.stampedBytes || doc?.originalBytes
    if (!bytesToDownload && !doc?.stampedUrl) return
    const blob = bytesToDownload
      ? new Blob([bytesToDownload], { type: 'application/pdf' })
      : null
    const url = blob ? URL.createObjectURL(blob) : doc.stampedUrl
    const link = document.createElement('a')
    link.href = url
    const baseName = doc.name.replace(/\.pdf$/i, '')
    link.download = `${baseName}_Bertandatangan_TTE.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    if (blob) URL.revokeObjectURL(url)
    toast.success(`Mengunduh ${link.download}`)
  }

  // Download Semua Berkas Secara Sekuensial
  const handleDownloadAll = async () => {
    if (documents.length === 0) {
      toast.warning('Belum ada berkas PDF yang diunggah.')
      return
    }
    toast.info(`Memulai pengunduhan ${documents.length} berkas Berita Acara...`)
    for (let i = 0; i < documents.length; i++) {
      handleDownloadDoc(documents[i])
      await new Promise((r) => setTimeout(r, 450))
    }
  }

  // Handler Simpan Dokumen ke Database
  const handleSaveToDatabase = async (status = 'draft') => {
    if (typeof onSaveDocument !== 'function') return

    try {
      setIsSavingDb(true)
      let pdfBase64 = ''
      if (activeDoc?.stampedBytes || activeDoc?.originalBytes) {
        const bytes = activeDoc.stampedBytes || activeDoc.originalBytes
        pdfBase64 = `data:application/pdf;base64,${uint8ArrayToBase64(bytes)}`
      }

      await onSaveDocument({
        params: {
          ...params,
          nomorDokumen: params.nomorDokumen || 'BA-PROFILING-ASN',
          stampMargins,
          instansiIds: activeInstansiIds,
        },
        signers,
        evidenceMap: {
          pdfBase64,
          pdfFileName: activeDoc?.name || 'Berita_Acara_Asli.pdf',
          documentsCount: documents.length,
        },
        dataSnapshot: {
          pdfFileName: activeDoc?.name || '',
          pdfPageCount: activeDoc?.pageCount || 0,
          totalDocuments: documents.length,
          kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'PROFILING ASN',
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
          ? 'Berita Acara Profiling ASN berhasil Diterbitkan!'
          : 'Draft Berita Acara berhasil disimpan ke database!'
      )
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan Berita Acara ke database.')
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
            <span>Parameter &amp; Unggah Berkas</span>
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
            {documents.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {documents.length}
              </span>
            )}
          </button>
        </div>

        {/* 1 Area Aksi Utama Simpan & Terbitkan */}
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
            <span>{isSavingDb ? 'Memproses...' : isPublished ? 'Sudah Diterbitkan' : 'Terbitkan Berita Acara'}</span>
          </button>

          {documents.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Unduh seluruh Berita Acara yang telah dibubuhi TTE"
            >
              <Download className="w-3.5 h-3.5 text-[#175CD3]" />
              <span>Unduh {documents.length > 1 ? `Semua (${documents.length})` : 'PDF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB 1: PARAMETER & UNGGAH BERKAS */}
      {activeTab === 'params' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-2xs space-y-7">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#175CD3]" />
              <span>Pengesahan Berita Acara Profiling ASN</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              1 Kali Pengaturan Parameter &amp; Tanda Tangan: Unggah berkas Berita Acara per sesi, lalu klik tombol "Bubuhkan TTE" untuk menempelkan tanda tangan resmi secara permanen.
            </p>
          </div>

          {/* BAGIAN A: PENANDATANGANAN & PENGESAHAN DOKUMEN (3 KOLOM FLEKSIBEL) */}
          <div className="space-y-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  A. Penandatanganan &amp; Pengesahan Dokumen (3 Kolom Fleksibel)
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

            {/* Form 3 Kolom Penandatangan Standar Selalu Terlihat */}
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

          {/* BAGIAN B: PENGATURAN MARGIN & PRESISI PENEMPATAN TANDA TANGAN (INTERAKTIF) */}
          <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#175CD3]" />
                  <span>B. Pengaturan Margin &amp; Presisi Penempatan TTE</span>
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-[#175CD3] dark:bg-blue-950/60 dark:text-blue-300">
                  Presisi Sempurna (Y: {stampMargins.baseY} pt)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetMargins}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Kembalikan margin ke setelan presisi default BKN"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMarginSettings((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#175CD3] dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {showMarginSettings ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Sembunyikan Pengaturan Margin</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Sesuaikan Margin (Atas, Bawah, Kiri, Kanan)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Panel Pengaturan Slider Margin (Collapsible) */}
            {showMarginSettings && (
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-850/40 space-y-4">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sesuaikan jarak vertikal (atas-bawah) dan horizontal (kiri-kanan) penempatan tanda tangan agar pas di ruang kosong antara jabatan dan nama pejabat.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Posisi Vertikal (Y Axis) */}
                  <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Move className="w-3 h-3 text-[#175CD3]" />
                        <span>Posisi Vertikal (Y)</span>
                      </label>
                      <span className="text-xs font-bold text-[#175CD3]">{stampMargins.baseY} pt</span>
                    </div>
                    <input
                      type="range"
                      min={150}
                      max={240}
                      step={2}
                      value={stampMargins.baseY}
                      onChange={(e) => handleMarginChange('baseY', e.target.value)}
                      className="w-full accent-[#175CD3] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Lebih Bawah (150)</span>
                      <span>Lebih Atas (240)</span>
                    </div>
                  </div>

                  {/* 2. Margin Horizontal Kiri (BKN) */}
                  <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Posisi Kiri (BKN X)
                      </label>
                      <span className="text-xs font-bold text-[#175CD3]">{stampMargins.kiriX} pt</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={160}
                      step={2}
                      value={stampMargins.kiriX}
                      onChange={(e) => handleMarginChange('kiriX', e.target.value)}
                      className="w-full accent-[#175CD3] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Ke Kiri (60)</span>
                      <span>Ke Kanan (160)</span>
                    </div>
                  </div>

                  {/* 3. Margin Horizontal Kanan (Instansi) */}
                  <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Posisi Kanan (Instansi X)
                      </label>
                      <span className="text-xs font-bold text-[#175CD3]">{stampMargins.kananX} pt</span>
                    </div>
                    <input
                      type="range"
                      min={330}
                      max={440}
                      step={2}
                      value={stampMargins.kananX}
                      onChange={(e) => handleMarginChange('kananX', e.target.value)}
                      className="w-full accent-[#175CD3] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Ke Kiri (330)</span>
                      <span>Ke Kanan (440)</span>
                    </div>
                  </div>

                  {/* 4. Ukuran Tanda Tangan */}
                  <div className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Maximize2 className="w-3 h-3 text-[#175CD3]" />
                        <span>Ukuran TTE</span>
                      </label>
                      <span className="text-xs font-bold text-[#175CD3]">{stampMargins.width} x {stampMargins.height} pt</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={150}
                      step={2}
                      value={stampMargins.width}
                      onChange={(e) => {
                        const w = Number(e.target.value)
                        const h = Math.round(w * (60 / 110))
                        setStampMargins((prev) => {
                          const next = { ...prev, width: w, height: h }
                          try {
                            localStorage.setItem('cat_ba_stamp_margins', JSON.stringify(next))
                          } catch {}
                          return next
                        })
                      }}
                      className="w-full accent-[#175CD3] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Kecil (80 pt)</span>
                      <span>Besar (150 pt)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BAGIAN C: UNGGAH BERKAS PDF */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  C. Berkas PDF Berita Acara Per Sesi
                </h4>
                <p className="text-[11px] text-slate-400 italic">
                  * Unggah berkas PDF Berita Acara, lalu bubuhkan tanda tangan per berkas atau sekaligus seluruhnya.
                </p>
              </div>

              {documents.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <FileCheck className="w-3.5 h-3.5 text-[#175CD3]" />
                  <span>{documents.length} Berkas Dimuat</span>
                </span>
              )}
            </div>

            {/* Dropzone Multi-File */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer?.files?.length) {
                  handleFilesAdded(e.dataTransfer.files)
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer space-y-3 group ${
                isDragging
                  ? 'border-[#175CD3] bg-blue-50/50 dark:bg-blue-950/40 ring-4 ring-blue-500/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-[#175CD3] dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-blue-50/30'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#175CD3] dark:text-blue-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Klik atau Seret Berkas PDF Berita Acara ke Sini (Bisa Banyak File Sekaligus)
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Unggah berkas BA Sesi 1, Sesi 2, Sesi 3, dst. Berkas akan tersimpan secara otomatis dan tidak akan hilang saat halaman direfresh.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) handleFilesAdded(e.target.files)
                  e.target.value = ''
                }}
                className="hidden"
              />
            </div>

            {/* DAFTAR BERKAS YANG DIUNGGAH */}
            {documents.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {documents.length} Berkas Berita Acara Terdaftar
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {documents.some((d) => d.isStamped)
                          ? 'Tanda tangan telah dibubuhkan dan tersimpan aman di sistem.'
                          : 'Berkas siap dibubuhi tanda tangan. Klik tombol "Bubuhkan TTE".'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleBubuhkan}
                      disabled={isProcessingPdf}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      title="Bubuhkan tanda tangan ke seluruh berkas sekaligus"
                    >
                      {isProcessingPdf ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Bubuhkan Semua ({documents.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#175CD3]" />
                      <span>Tambah Berkas</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadAll}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Semua</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAllDocs}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus Semua Berkas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* List Items */}
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {documents.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {doc.name}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>{doc.pageCount} Halaman</span>
                            <span>•</span>
                            <span>{(doc.size / 1024).toFixed(0)} KB</span>
                            <span>•</span>
                            {doc.isStamped ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>TTE Tertempel &amp; Tersimpan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>Menunggu Pembubuhan</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleBubuhkanSingle(doc.id)}
                          disabled={isProcessingPdf || processingDocId === doc.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            doc.isStamped
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                          title={doc.isStamped ? 'Bubuhkan ulang tanda tangan pada berkas ini' : 'Bubuhkan tanda tangan pada berkas ini'}
                        >
                          {processingDocId === doc.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileCheck className="w-3.5 h-3.5" />
                          )}
                          <span>{doc.isStamped ? 'Bubuhkan Ulang' : 'Bubuhkan'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveDocIndex(idx)
                            setActiveTab('preview')
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#175CD3]" />
                          <span>Pratinjau</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Unduh</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Hapus Berkas Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Catatan Status Standar Dokumen CAT */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Seluruh isian parameter dan tanda tangan otomatis tersimpan di sesi lokal. Klik <strong>Simpan Draft</strong> atau <strong>Terbitkan Berita Acara</strong> di pojok kanan atas untuk menyimpan permanen ke server database.</span>
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

      {/* 3. TAB 2: PRATINJAU DOKUMEN PDF DENGAN TANDA TANGAN */}
      {activeTab === 'preview' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#175CD3]" />
                <span>Pratinjau Berita Acara Bertandatangan</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tampilan akhir Berita Acara dengan tanda tangan elektronik Master yang telah tertaut &amp; tertempel presisi pada margin dokumen.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeDoc && (
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(activeDoc)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Berkas Ini</span>
                </button>
              )}
              {documents.length > 1 && (
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Semua ({documents.length} PDF)</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB SWITCHER DOKUMEN (JIKA ADA MULTIPLE BERKAS) */}
          {documents.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800 clean-scrollbar">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Pilih Berkas:</span>
              </span>
              {documents.map((doc, idx) => (
                <button
                  key={doc.id || idx}
                  type="button"
                  onClick={() => setActiveDocIndex(idx)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeDocIndex === idx
                      ? 'bg-[#175CD3] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="max-w-[150px] truncate">{doc.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      activeDocIndex === idx
                        ? 'bg-white/20 text-white'
                        : doc.isStamped
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {doc.isStamped ? 'TTE' : 'Upload'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {documents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Belum Ada Berkas PDF yang Diunggah
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Silakan kembali ke tab "Parameter" untuk mengunggah berkas PDF Berita Acara yang akan dibubuhi tanda tangan.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('params')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] text-white text-xs font-bold hover:bg-[#1550B8] transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Unggah Berkas PDF Sekarang</span>
              </button>
            </div>
          ) : activeDoc?.stampedUrl ? (
            <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-950">
              {isProcessingPdf && (
                <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 text-white text-xs font-semibold backdrop-blur-xs shadow-md">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Memperbarui TTE...</span>
                </div>
              )}
              <iframe
                src={activeDoc.stampedUrl}
                title={`Pratinjau PDF: ${activeDoc.name}`}
                className="w-full h-[750px] border-0"
              />
            </div>
          ) : (
            <div className="p-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#175CD3] mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Membubuhkan tanda tangan elektronik ke halaman PDF...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
