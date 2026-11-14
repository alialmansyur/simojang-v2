import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import {
  FileText,
  Printer,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  RotateCcw,
  Lock,
  Image as ImageIcon,
  Save,
} from 'lucide-react'
import {
  formatDateIndo,
  getHariIndo,
  compressImageFile,
  DEFAULT_DOKUMENTASI_CATEGORIES,
} from './documentBuilderUtils'
import { DocumentEvidenceAccordion } from './DocumentEvidenceAccordion'
import { DocumentPdfPreview } from './DocumentPdfPreview'
import { CatDocInstansiPicker } from '../services/sidigi/cat/CatDocInstansiPicker'
import {
  resolveDocAutoYear,
  CAT_FORM_LABEL_CLS,
  CAT_FORM_INPUT_CLS,
} from '../services/sidigi/cat/pengelola/pengelolaConstants'

const EMPTY_ARRAY = []
const EMPTY_OBJECT = {}

function createDefaultSigners() {
  const ts = Date.now().toString(36)
  return {
    kiri: {
      jabatan: '',
      nama: '',
      nip: '',
      signatureData: null,
      signatureHash: '',
      signedAt: '',
      isSigned: false,
      token: `token_kiri_${Math.random().toString(36).substring(2, 7)}_${ts}`,
    },
    tengah: {
      jabatan: '',
      nama: '',
      nip: '',
      signatureData: null,
      signatureHash: '',
      signedAt: '',
      isSigned: false,
      token: `token_tengah_${Math.random().toString(36).substring(2, 7)}_${ts}`,
    },
    kanan: {
      jabatan: '',
      nama: '',
      nip: '',
      signatureData: null,
      signatureHash: '',
      signedAt: '',
      isSigned: false,
      token: `token_kanan_${Math.random().toString(36).substring(2, 7)}_${ts}`,
    },
  }
}

// Sub-komponen Input & Canvas E-Sign per Posisi (Kiri, Tengah, Kanan)
export function SignerPositionCol({
  positionKey,
  title,
  sublabel,
  signer,
  onChange,
  onSign,
  onReset,
  onCopyLink,
  isCopied,
  allowSignTitle = false,
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasStroke, setHasStroke] = useState(false)

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDrawing = (e) => {
    if (signer.isSigned) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getCanvasPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0B3264'
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing || signer.isSigned) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getCanvasPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasStroke(true)
  }

  const stopDrawing = (e) => {
    if (!isDrawing || signer.isSigned) return
    if (e) e.preventDefault()
    setIsDrawing(false)
  }

  const handleClear = () => {
    if (signer.isSigned) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
  }

  const handleApplySign = () => {
    if (!hasStroke) {
      toast.warning('Silakan buat goresan tanda tangan pada canvas terlebih dahulu.')
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    onSign(positionKey, dataUrl)
  }

  return (
    <div className="flex flex-col justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-3.5">
      {/* Header Kolom */}
      <div className="border-b border-slate-200/60 dark:border-slate-800 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {title}
          </span>
          {signer.isSigned ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Check className="w-3 h-3" />
              <span>Sudah TTD</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">Belum TTD</span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>
      </div>

      {/* Form Isian: Jabatan/Instansi, Nama, NIP */}
      <div className="space-y-2.5">
        {allowSignTitle && (
          <div className="space-y-1.5">
            <label className={CAT_FORM_LABEL_CLS}>
              Label Atas (Opsional)
            </label>
            <input
              type="text"
              disabled={signer.isSigned}
              placeholder="Contoh: Mengetahui / Setuju Dibayar,"
              value={signer.sign_title || ''}
              onChange={(e) => onChange(positionKey, 'sign_title', e.target.value)}
              className={`${CAT_FORM_INPUT_CLS} font-medium`}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <label className={CAT_FORM_LABEL_CLS}>
            Jabatan / Instansi
          </label>
          <input
            type="text"
            disabled={signer.isSigned}
            placeholder="Contoh: Kepala BKPSDM / Koordinator"
            value={signer.jabatan || ''}
            onChange={(e) => onChange(positionKey, 'jabatan', e.target.value)}
            className={`${CAT_FORM_INPUT_CLS} font-medium`}
          />
        </div>

        <div className="space-y-1.5">
          <label className={CAT_FORM_LABEL_CLS}>
            Nama Lengkap
          </label>
          <input
            type="text"
            disabled={signer.isSigned}
            placeholder="Nama Pejabat"
            value={signer.nama || ''}
            onChange={(e) => onChange(positionKey, 'nama', e.target.value)}
            className={`${CAT_FORM_INPUT_CLS} font-bold text-slate-900 dark:text-white`}
          />
        </div>

        <div className="space-y-1.5">
          <label className={CAT_FORM_LABEL_CLS}>
            NIP Pejabat
          </label>
          <input
            type="text"
            disabled={signer.isSigned}
            placeholder="19XXXXXXXX..."
            value={signer.nip || ''}
            onChange={(e) => onChange(positionKey, 'nip', e.target.value)}
            className={`${CAT_FORM_INPUT_CLS} font-medium`}
          />
        </div>
      </div>

      {/* Area E-Signature */}
      <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
        {signer.isSigned ? (
          <div className="text-center space-y-2 py-1">
            <div className="w-full h-20 flex items-center justify-center p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              {signer.signatureData ? (
                <img
                  src={signer.signatureData}
                  alt={`E-Sign ${title}`}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-[11px] text-slate-400">Tanda Tangan Terlampir</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate">
              {signer.signatureHash || 'DS-BKN-VERIFIED'}
            </div>
            <button
              type="button"
              onClick={() => onReset(positionKey)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all active:scale-95 cursor-pointer w-full"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset TTE {title}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Goresan TTE:
              </span>
              {hasStroke && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Bersihkan
                </button>
              )}
            </div>

            <div className="relative border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 touch-none shadow-inner">
              <canvas
                ref={canvasRef}
                width={300}
                height={90}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-20 cursor-crosshair bg-slate-50/40 dark:bg-slate-900"
              />
              {!hasStroke && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[10px] text-slate-400">
                  Goreskan tanda tangan di sini
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <button
                type="button"
                onClick={handleApplySign}
                disabled={!hasStroke}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B3264] hover:bg-[#175CD3] text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Bubuhkan</span>
              </button>

              {typeof onCopyLink === 'function' && (
              <button
                type="button"
                onClick={() => onCopyLink(positionKey)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 text-[#175CD3] dark:text-blue-300 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                title="Salin tautan untuk ditandatangani via HP"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-300">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function DocumentBuilderShell({
  documentDomain = 'cat',
  activeJenisTes,
  kegiatan,
  tilok,
  selectedInstansiList = EMPTY_ARRAY,
  sessions = EMPTY_ARRAY,
  filterParams = EMPTY_OBJECT,
  categories = DEFAULT_DOKUMENTASI_CATEGORIES,
  defaultParams = EMPTY_OBJECT,
  renderTemplate,
  publicEsignBaseUrl = '/layanan/fasilitasi-cat/laporan/esign',
}) {

  // 1. DYNAMIC STORAGE KEY:
  // Mengikat erat pada (Domain + Jenis + Kegiatan + Tilok + Gabungan Instansi)
  const instansiKey = useMemo(() => {
    if (!selectedInstansiList || selectedInstansiList.length === 0) return 'all'
    return [...selectedInstansiList].sort().join('-')
  }, [selectedInstansiList])

  const storageKey = useMemo(() => {
    const jId = activeJenisTes?.id || 'j0'
    const kId = kegiatan?.id || filterParams?.seleksiId || 'k0'
    const tId = tilok?.uid || tilok?.id || filterParams?.tilokUid || 't0'
    return `doc_builder_${documentDomain}_${jId}_${kId}_${tId}_${instansiKey}`
  }, [documentDomain, activeJenisTes, kegiatan, tilok, filterParams, instansiKey])

  // Active Tab
  const [activeTab, setActiveTab] = useState('params')

  // Tanggal sesi yang tersedia dari database
  const availableSessionDates = useMemo(() => {
    const dates = new Set()
    sessions.forEach((s) => {
      if (s.period_date) dates.add(s.period_date)
    })
    return Array.from(dates).sort().reverse()
  }, [sessions])

  const initialDate = availableSessionDates[0] || ''

  const buildEmptyParams = useCallback(
    () => ({
      instansiIds: Array.isArray(selectedInstansiList) ? selectedInstansiList.map(String) : [],
      instansiNames: [],
      nomorSuratDeputi: '',
      tanggalSuratDeputi: '',
      nomorSuratTugas: '',
      tanggalSuratTugas: '',
      tanggalPelaksanaan: initialDate,
      waktuPelaksanaan: '',
      tempatPelaksanaan: tilok?.nama_tilok || '',
      kotaTtd: '',
      ...defaultParams,
    }),
    [initialDate, tilok?.nama_tilok, defaultParams, selectedInstansiList]
  )

  const buildEmptyParamsRef = useRef(buildEmptyParams)
  useEffect(() => {
    buildEmptyParamsRef.current = buildEmptyParams
  }, [buildEmptyParams])

  // Parameter Dokumen & Surat (kosong hingga diisi dan disimpan)
  const [params, setParams] = useState(buildEmptyParams)

  const currentYear = useMemo(
    () =>
      resolveDocAutoYear({
        jenis_periode_tahun: activeJenisTes?.periode || activeJenisTes?.tahun,
        doc_date: params?.tanggalPelaksanaan || initialDate,
      }),
    [activeJenisTes?.periode, activeJenisTes?.tahun, params?.tanggalPelaksanaan, initialDate]
  )

  // 3-POSISI TANDA TANGAN (KIRI, TENGAH, KANAN) - kosong hingga diisi & disimpan
  const [signers, setSigners] = useState(createDefaultSigners)

  // Eviden Foto Dokumentasi
  const [evidenceMap, setEvidenceMap] = useState({})

  // Status simpan parameter
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  // Modal Reset Target
  const [resetTargetKey, setResetTargetKey] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)

  // Load Persisted Data HANYA Saat storageKey Berganti (bukan setiap re-render input)
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (!active) return
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.params) setParams(parsed.params)
          if (parsed.evidenceMap) setEvidenceMap(parsed.evidenceMap)

          if (parsed.signers) {
            setSigners(parsed.signers)
          } else if (parsed.params?.namaPenandatangan) {
            const fresh = createDefaultSigners()
            // Migrasi data format lama ke posisi kanan
            setSigners({
              ...fresh,
              kanan: {
                jabatan: parsed.params.jabatanPenandatangan || '',
                nama: parsed.params.namaPenandatangan || '',
                nip: parsed.params.nipPenandatangan || '',
                signatureData: parsed.signatureData || null,
                signatureHash: parsed.signatureHash || '',
                signedAt: parsed.signedAt || '',
                isSigned: Boolean(parsed.isSigned),
                token: parsed.esignToken || fresh.kanan.token,
              },
            })
          } else {
            setSigners(createDefaultSigners())
          }
        } else {
          setParams(buildEmptyParamsRef.current())
          setEvidenceMap({})
          setSigners(createDefaultSigners())
        }
        setHasUnsavedChanges(false)
      } catch (err) {
        console.warn('Gagal memuat cache storageKey:', err)
      }
    })
    return () => {
      active = false
    }
  }, [storageKey])

  // Hari Pelaksanaan otomatis terhitung dari tanggalPelaksanaan
  const calculatedHari = useMemo(() => {
    return getHariIndo(params.tanggalPelaksanaan)
  }, [params.tanggalPelaksanaan])

  // Sinkronisasi Storage Event (Jika ditandatangani via link publik)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed.signers) setSigners(parsed.signers)
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi token e-sign:', err)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [storageKey])

  // Helper Simpan State ke LocalStorage
  const persistState = useCallback(
    (newParams, newEvidence, newSigners) => {
      try {
        const currentParams = newParams || params
        const currentEvidence = newEvidence || evidenceMap
        const currentSigners = newSigners || signers

        const payload = {
          storageKey,
          kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'Seleksi CAT BKN',
          tilokNama: tilok?.nama_tilok || currentParams.tempatPelaksanaan,
          hari: calculatedHari,
          tanggalPelaksanaan: formatDateIndo(currentParams.tanggalPelaksanaan),
          params: currentParams,
          evidenceMap: currentEvidence,
          signers: currentSigners,
        }
        localStorage.setItem(storageKey, JSON.stringify(payload))

        // Update token individual per signer
        Object.entries(currentSigners).forEach(([posKey, s]) => {
          if (s.token) {
            localStorage.setItem(
              `cat_esign_token_${s.token}`,
              JSON.stringify({
                ...payload,
                signerKey: posKey,
                namaPenandatangan: s.nama,
                nipPenandatangan: s.nip,
                jabatanPenandatangan: s.jabatan,
                isSigned: s.isSigned,
                signatureData: s.signatureData,
                signatureHash: s.signatureHash,
                signedAt: s.signedAt,
              })
            )
          }
        })
      } catch (err) {
        console.warn('Gagal menyimpan cache document builder:', err)
      }
    },
    [
      storageKey,
      kegiatan,
      activeJenisTes,
      tilok,
      calculatedHari,
      params,
      evidenceMap,
      signers,
    ]
  )

  const handleParamChange = (field, value) => {
    setParams((prev) => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
    setSavedNotice(false)
  }

  // Handler Perubahan Data Signer
  const handleSignerChange = (posKey, field, value) => {
    setSigners((prev) => ({
      ...prev,
      [posKey]: {
        ...prev[posKey],
        [field]: value,
      },
    }))
    setHasUnsavedChanges(true)
    setSavedNotice(false)
  }

  // Simpan Parameter & Identitas Penandatangan ke LocalStorage
  const handleSaveParameters = () => {
    persistState(params, evidenceMap, signers)
    setHasUnsavedChanges(false)
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }

  // Handler Bubuhkan Tanda Tangan
  const handleSignPosition = (posKey, dataUrl) => {
    const uniqueHash = `DS-BKN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
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
          isSigned: true,
          signatureData: dataUrl,
          signatureHash: uniqueHash,
          signedAt: timeStr,
        },
      }
      persistState(params, evidenceMap, next)
      return next
    })
    window.dispatchEvent(new Event('storage'))
  }

  // Handler Reset TTE
  const handleConfirmReset = () => {
    if (!resetTargetKey) return
    const posKey = resetTargetKey
    setResetTargetKey(null)

    setSigners((prev) => {
      const next = {
        ...prev,
        [posKey]: {
          ...prev[posKey],
          isSigned: false,
          signatureData: null,
          signatureHash: '',
          signedAt: '',
        },
      }
      persistState(params, evidenceMap, next)
      return next
    })
    window.dispatchEvent(new Event('storage'))
  }

  // Handler Salin Tautan E-Sign Publik per Posisi
  const handleCopyLink = async (posKey) => {
    const signer = signers[posKey]
    if (!signer?.token) return
    persistState(params, evidenceMap, signers)

    const url = `${window.location.origin}${publicEsignBaseUrl}/${signer.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedKey(posKey)
      setTimeout(() => setCopiedKey(null), 2500)
    } catch {
      toast.info(`Link E-Sign: ${url}`)
    }
  }

  // Eviden Upload & Delete
  const handleUploadCategoryPhoto = async (categoryKey, file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.warning('Harap pilih berkas gambar valid (JPG, PNG, WEBP).')
      return
    }
    try {
      const compressedDataUrl = await compressImageFile(file, 1200, 0.75)
      setEvidenceMap((prev) => {
        const next = { ...prev, [categoryKey]: compressedDataUrl }
        persistState(params, next, signers)
        return next
      })
    } catch (err) {
      console.warn('Gagal kompres foto:', err)
      toast.error('Gagal memproses gambar.')
    }
  }

  const handleDeleteCategoryPhoto = (categoryKey) => {
    setEvidenceMap((prev) => {
      const next = { ...prev, [categoryKey]: null }
      persistState(params, next, signers)
      return next
    })
  }

  // Grouped table data per instansi khusus tanggal ini
  const activeInstansiIds = useMemo(() => {
    if (Array.isArray(params.instansiIds) && params.instansiIds.length > 0) {
      return params.instansiIds.map(String)
    }
    return Array.isArray(selectedInstansiList) ? selectedInstansiList.map(String) : []
  }, [params.instansiIds, selectedInstansiList])

  const activeInstansiNames = useMemo(
    () => (Array.isArray(params.instansiNames) ? params.instansiNames.filter(Boolean) : []),
    [params.instansiNames]
  )

  const tableData = useMemo(() => {
    let list = sessions
    if (params.tanggalPelaksanaan) {
      list = list.filter((s) => s.period_date === params.tanggalPelaksanaan)
    }
    if (activeInstansiIds.length > 0) {
      list = list.filter((s) =>
        activeInstansiIds.includes(String(s.instansi_id || s.kodeins))
      )
    }

    if (list.length === 0) {
      if (activeInstansiNames.length > 0) {
        return activeInstansiNames.map((name, idx) => ({
          no: idx + 1,
          nama: name,
          tanggal: formatDateIndo(params.tanggalPelaksanaan),
          sesi: 1,
          jumlah: 0,
          hadir: 0,
          tidakHadir: 0,
        }))
      }
      if (activeInstansiIds.length > 0) {
        return activeInstansiIds.map((id, idx) => ({
          no: idx + 1,
          nama: id,
          tanggal: formatDateIndo(params.tanggalPelaksanaan),
          sesi: 1,
          jumlah: 0,
          hadir: 0,
          tidakHadir: 0,
        }))
      }
      return []
    }

    const grouped = {}
    list.forEach((s) => {
      const insName = s.instansi_nama || `Instansi ${s.instansi_id || ''}`
      if (!grouped[insName]) {
        grouped[insName] = {
          nama: insName,
          tanggal: formatDateIndo(s.period_date || params.tanggalPelaksanaan),
          sesi: s.sesi || 1,
          jumlah: 0,
          hadir: 0,
          tidakHadir: 0,
        }
      }
      const h = Number(s.hadir || 0)
      const th = Number(s.tidak_hadir || 0)
      grouped[insName].hadir += h
      grouped[insName].tidakHadir += th
      grouped[insName].jumlah += s.kuota ? Number(s.kuota) : h + th
    })

    return Object.values(grouped).map((item, idx) => ({
      no: idx + 1,
      ...item,
    }))
  }, [sessions, params.tanggalPelaksanaan, activeInstansiIds, activeInstansiNames])

  const totalSummary = useMemo(() => {
    return tableData.reduce(
      (acc, cur) => {
        acc.jumlah += cur.jumlah
        acc.hadir += cur.hadir
        acc.tidakHadir += cur.tidakHadir
        return acc
      },
      { jumlah: 0, hadir: 0, tidakHadir: 0 }
    )
  }, [tableData])

  const formattedInstansiNames = useMemo(() => {
    const names = activeInstansiNames.length > 0 ? activeInstansiNames : tableData.map((t) => t.nama)
    if (names.length === 0) {
      return 'INSTANSI DI WILAYAH KERJA KANREG III BKN'
    }
    if (names.length === 1) return names[0]
    if (names.length === 2) return `${names[0]} dan ${names[1]}`
    return `${names.slice(0, -1).join(', ')}, serta ${names[names.length - 1]}`
  }, [tableData, activeInstansiNames])

  const totalUploadedEvidence = Object.values(evidenceMap).filter(Boolean).length
  const totalSignedCount = Object.values(signers).filter((s) => s.isSigned).length

  return (
    <div className="space-y-5 w-full">
      {/* 3-TIER TABS HEADER */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl overflow-x-auto clean-scrollbar">
          {/* Tab 1 */}
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
            <span>1. Parameter & Sesi</span>
          </button>

          {/* Tab 2 */}
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>2. Dokumentasi & Eviden</span>
            {totalUploadedEvidence > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-[#175CD3] dark:text-blue-300">
                {totalUploadedEvidence}/{categories.length}
              </span>
            )}
          </button>

          {/* Tab 3 */}
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
            <span>3. Pratinjau Laporan (PDF A4)</span>
            {totalSignedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Status Indikator Header */}
        <div className="flex items-center gap-2 px-2 shrink-0">
          {totalSignedCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{totalSignedCount} TTE Terverifikasi</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Draft Laporan (Belum TTD)</span>
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PARAMETER FORM TERSIMPLIFIKASI (1 SINGLE CARD, 3-POSISI TTD TABLE) */}
      {/* ========================================================================= */}
      {activeTab === 'params' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-2xs space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#175CD3]" />
                <span>Parameter Laporan & Pengesahan Dokumen</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Data sesi peserta otomatis dimuat dari server. Lengkapi parameter surat dan penandatangan lalu klik Simpan Parameter.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {savedNotice && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tersimpan</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveParameters}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{hasUnsavedChanges ? 'Simpan Parameter *' : 'Simpan Parameter'}</span>
              </button>
            </div>
          </div>

          {/* SECTION A: PILIH INSTANSI (TERPISAH DI PALING ATAS) */}
          <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                A. Pilih Instansi
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih satu atau lebih instansi peserta, atau tambahkan nama instansi manual bila diperlukan.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className={CAT_FORM_LABEL_CLS}>Pilih Instansi</label>
              <CatDocInstansiPicker
                selectedIds={activeInstansiIds}
                selectedNames={activeInstansiNames}
                onChange={({ instansiIds, instansiNames }) => {
                  setParams((prev) => ({
                    ...prev,
                    instansiIds,
                    instansiNames,
                  }))
                  setHasUnsavedChanges(true)
                  setSavedNotice(false)
                }}
              />
            </div>
          </div>

          {/* SECTION B: Dasar Rujukan Surat & Pelaksanaan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              B. Dasar &amp; Rujukan Surat
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Nomor Surat Deputi SIDIGI
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 7021/B-KS.04.01/SD/E/2026"
                  value={params.nomorSuratDeputi || ''}
                  onChange={(e) => handleParamChange('nomorSuratDeputi', e.target.value)}
                  className={`${CAT_FORM_INPUT_CLS} font-medium`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Tanggal Surat Deputi
                </label>
                <input
                  type="date"
                  value={params.tanggalSuratDeputi || ''}
                  onChange={(e) => handleParamChange('tanggalSuratDeputi', e.target.value)}
                  className={`${CAT_FORM_INPUT_CLS} font-medium`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Nomor Surat Tugas Kanreg III
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 624/KS.04/TU/KR.III/2026"
                  value={params.nomorSuratTugas || ''}
                  onChange={(e) => handleParamChange('nomorSuratTugas', e.target.value)}
                  className={`${CAT_FORM_INPUT_CLS} font-medium`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Tanggal Surat Tugas
                </label>
                <input
                  type="date"
                  value={params.tanggalSuratTugas || ''}
                  onChange={(e) => handleParamChange('tanggalSuratTugas', e.target.value)}
                  className={`${CAT_FORM_INPUT_CLS} font-medium`}
                />
              </div>
            </div>
          </div>

          {/* SECTION C: Waktu & Lokasi Pelaksanaan */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              C. Waktu &amp; Lokasi Pelaksanaan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={params.tanggalPelaksanaan || ''}
                  onChange={(e) => handleParamChange('tanggalPelaksanaan', e.target.value)}
                  className={`${CAT_FORM_INPUT_CLS} font-bold`}
                />
                <p className="text-xs text-slate-400">
                  Hari otomatis: <strong>{calculatedHari}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Waktu Pelaksanaan
                </label>
                <input
                  type="text"
                  value={params.waktuPelaksanaan || ''}
                  onChange={(e) => handleParamChange('waktuPelaksanaan', e.target.value)}
                  placeholder="Contoh: 09.00 s.d 12.00 WIB"
                  className={`${CAT_FORM_INPUT_CLS} font-medium`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Kota Penandatangan
                </label>
                <input
                  type="text"
                  value={params.kotaTtd || ''}
                  onChange={(e) => handleParamChange('kotaTtd', e.target.value)}
                  placeholder="Contoh: Bandung"
                  className={`${CAT_FORM_INPUT_CLS} font-medium`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Tempat / Titik Lokasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kantor Regional III BKN Bandung"
                  value={params.tempatPelaksanaan || ''}
                  onChange={(e) => handleParamChange('tempatPelaksanaan', e.target.value)}
                  className={`${CAT_FORM_INPUT_CLS} font-medium`}
                />
              </div>
            </div>
          </div>

          {/* SECTION D: 3 SECTIONS TANDA TANGAN FLEKSIBEL (KIRI, TENGAH, KANAN) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                D. Penandatanganan &amp; Pengesahan Dokumen (3 Kolom Fleksibel)
              </h4>
              <p className="text-[11px] text-slate-400 italic">
                * Kolom yang tidak diisi otomatis tidak muncul di cetakan dokumen.
              </p>
            </div>

            {/* Layout 3 Kolom Berdampingan Tanpa Border Kaku */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Kolom 1: Kiri */}
              <SignerPositionCol
                positionKey="kiri"
                title="1. Posisi Kiri"
                sublabel="Opsional: Pihak Pertama / Instansi Pengusul"
                signer={signers.kiri}
                onChange={handleSignerChange}
                onSign={handleSignPosition}
                onReset={(key) => setResetTargetKey(key)}
                onCopyLink={handleCopyLink}
                isCopied={copiedKey === 'kiri'}
              />

              {/* Kolom 2: Tengah */}
              <SignerPositionCol
                positionKey="tengah"
                title="2. Posisi Tengah"
                sublabel="Opsional: Mengetahui / Saksi / Koordinator Tilok"
                signer={signers.tengah}
                onChange={handleSignerChange}
                onSign={handleSignPosition}
                onReset={(key) => setResetTargetKey(key)}
                onCopyLink={handleCopyLink}
                isCopied={copiedKey === 'tengah'}
              />

              {/* Kolom 3: Kanan */}
              <SignerPositionCol
                positionKey="kanan"
                title="3. Posisi Kanan"
                sublabel="Utama: Koordinator / Pihak Kedua / Penanggung Jawab"
                signer={signers.kanan}
                onChange={handleSignerChange}
                onSign={handleSignPosition}
                onReset={(key) => setResetTargetKey(key)}
                onCopyLink={handleCopyLink}
                isCopied={copiedKey === 'kanan'}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {hasUnsavedChanges
                ? 'Ada perubahan parameter yang belum disimpan ke penyimpanan lokal.'
                : 'Parameter akan digunakan otomatis saat menyusun Pratinjau Laporan PDF.'}
            </p>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {savedNotice && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tersimpan</span>
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveParameters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Parameter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DOKUMENTASI & EVIDEN                                              */}
      {/* ========================================================================= */}
      {activeTab === 'evidence' && (
        <DocumentEvidenceAccordion
          categories={categories}
          evidenceMap={evidenceMap}
          onUpload={handleUploadCategoryPhoto}
          onDelete={handleDeleteCategoryPhoto}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRATINJAU LAPORAN (NATIVE EMBEDDED PDF PREVIEW TOOL BROWSER)     */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <DocumentPdfPreview
          fileName={`Laporan_Pelaksanaan_${(kegiatan?.nama_seleksi || 'CAT').replace(/\s+/g, '_')}_${params.tanggalPelaksanaan}.pdf`}
          title={`Pratinjau PDF: ${kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'Laporan CAT'}`}
        >
          {renderTemplate ? (
            renderTemplate({
              params,
              calculatedHari,
              evidenceMap,
              signers,
              tableData,
              totalSummary,
              formattedInstansiNames,
              kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'SELEKSI PENGEMBANGAN KARIER',
              tilokNama: tilok?.nama_tilok || params.tempatPelaksanaan || 'KANTOR REGIONAL III BKN BANDUNG',
              currentYear,
              categories,
            })
          ) : (
            <div className="p-8 text-center text-slate-500">
              Template belum dirender.
            </div>
          )}
        </DocumentPdfPreview>
      )}

      {/* MODAL KONFIRMASI RESET E-SIGN (ADMIN SAJA) */}
      {resetTargetKey &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4 shadow-xl modal-dialog-animated">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Reset Tanda Tangan?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reset E-Sign {resetTargetKey?.toUpperCase()}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tanda tangan pada posisi ini akan dihapus dan Anda dapat membubuhkan tanda tangan baru atau membagikan link e-sign ulang.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetKey(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Ya, Reset E-Sign
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
