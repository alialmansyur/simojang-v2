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
  Bookmark,
  ArrowLeft,
  Loader2,
  PenTool,
  Sparkles,
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
import {
  fetchCatUserSigners,
  saveCatUserSigner,
  resetCatUserSigner,
} from '../../../services/api/sidigiCatServicesApi'

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
// Dibuat ringkas tanpa card pembungkus dan tanpa label statis (cukup placeholder sesuai spesifikasi UI)
export function SignerPositionCol({
  positionKey,
  title,
  sublabel,
  signer = {},
  onChange,
  onSign,
  onReset,
  onCopyLink,
  isCopied,
  allowSignTitle = false,
  savedPresetSignature = null,
}) {
  const canvasRef = useRef(null)
  const [showCanvas, setShowCanvas] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasStroke, setHasStroke] = useState(false)

  const posLabel = positionKey === 'kiri' ? 'kiri' : positionKey === 'tengah' ? 'tengah' : 'kanan'

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
    setShowCanvas(false)
    setHasStroke(false)
  }

  const inputBaseCls =
    'w-full h-9 px-3.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-2xs'

  return (
    <div className="flex flex-col space-y-2">
      {/* 0. Header Judul Posisi & Indikator Status TTE */}
      <div className="flex items-center justify-between gap-2 pb-0.5">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            {title || (positionKey === 'kiri' ? '1. Posisi Kiri' : positionKey === 'tengah' ? '2. Posisi Tengah' : '3. Posisi Kanan')}
          </p>
          {sublabel && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              {sublabel}
            </p>
          )}
        </div>

        {/* Badge Indikator Status TTE */}
        {signer.isSigned ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Sudah TTE</span>
          </span>
        ) : signer.nama || signer.jabatan ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Menunggu TTE</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 shrink-0">
            <span>Belum Terisi</span>
          </span>
        )}
      </div>

      {/* 1. Label Atas / Judul TTD (Opsional untuk format dokumen tertentu) */}
      {allowSignTitle && (
        <input
          type="text"
          disabled={signer.isSigned}
          placeholder={`ttd ${posLabel} label atas`}
          value={signer.sign_title || ''}
          onChange={(e) => onChange(positionKey, 'sign_title', e.target.value)}
          className={`${inputBaseCls} ${
            signer.sign_title
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium'
              : 'bg-slate-100/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 placeholder:text-slate-500 dark:placeholder:text-slate-400'
          }`}
        />
      )}

      {/* 2. Instansi / Jabatan */}
      <input
        type="text"
        disabled={signer.isSigned}
        placeholder={`ttd ${posLabel} instansi`}
        value={signer.jabatan || ''}
        onChange={(e) => onChange(positionKey, 'jabatan', e.target.value)}
        className={`${inputBaseCls} ${
          signer.jabatan
            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium'
            : 'bg-slate-100/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 placeholder:text-slate-500 dark:placeholder:text-slate-400'
        }`}
      />

      {/* 3. Nama Pejabat */}
      <input
        type="text"
        disabled={signer.isSigned}
        placeholder={`ttd ${posLabel} nama`}
        value={signer.nama || ''}
        onChange={(e) => onChange(positionKey, 'nama', e.target.value)}
        className={`${inputBaseCls} ${
          signer.nama
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold'
            : 'bg-slate-100/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 placeholder:text-slate-500 dark:placeholder:text-slate-400'
        }`}
      />

      {/* 4. NIP Pejabat */}
      <input
        type="text"
        disabled={signer.isSigned}
        placeholder={`ttd ${posLabel} nip`}
        value={signer.nip || ''}
        onChange={(e) => onChange(positionKey, 'nip', e.target.value)}
        className={`${inputBaseCls} ${
          signer.nip
            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium'
            : 'bg-slate-100/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 placeholder:text-slate-500 dark:placeholder:text-slate-400'
        }`}
      />

      {/* Area Aksi & Status E-Sign */}
      {signer.isSigned ? (
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 min-w-0">
            {signer.signatureData ? (
              <img
                src={signer.signatureData}
                alt="TTE"
                className="h-8 max-w-[80px] object-contain bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded px-1.5 py-0.5"
              />
            ) : null}
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <Check className="w-3.5 h-3.5" />
                <span>Terverifikasi TTE</span>
              </span>
              {signer.signedAt && (
                <p className="text-[10px] text-slate-400 truncate">
                  {signer.signedAt}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onReset(positionKey)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
              title="Reset tanda tangan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCanvas((prev) => !prev)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs ${
                showCanvas
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-[#175CD3]" />
              <span>{showCanvas ? 'Tutup Canvas' : 'Gores TTE'}</span>
            </button>

            {savedPresetSignature && (
              <button
                type="button"
                onClick={() => onSign(positionKey, savedPresetSignature)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Gunakan tanda tangan tersimpan di profil pegawai"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>TTE Tersimpan</span>
              </button>
            )}

            {typeof onCopyLink === 'function' && (
              <button
                type="button"
                onClick={() => onCopyLink(positionKey)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Salin tautan untuk ditandatangani via HP"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Link HP</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Canvas Drawer yang muncul jika tombol + Gores TTE diklik */}
          {showCanvas && (
            <div className="space-y-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 shadow-2xs">
              <div className="relative border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-900 touch-none">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={80}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-18 cursor-crosshair bg-white dark:bg-slate-900"
                />
                {!hasStroke && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[10px] text-slate-400">
                    Goreskan tanda tangan di sini
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                {hasStroke ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Bersihkan
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCanvas(false)}
                    className="px-2 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleApplySign}
                    disabled={!hasStroke}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#0B3264] hover:bg-[#175CD3] text-white text-[11px] font-bold shadow-2xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Terapkan TTE</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function DocumentBuilderShell({
  documentDomain = 'cat',
  activeJenisTes,
  kegiatan,
  tilok,
  selectedInstansiList = EMPTY_ARRAY,
  instansiList = EMPTY_ARRAY,
  sessions = EMPTY_ARRAY,
  filterParams = EMPTY_OBJECT,
  categories = DEFAULT_DOKUMENTASI_CATEGORIES,
  defaultParams = EMPTY_OBJECT,
  renderTemplate,
  publicEsignBaseUrl = '/layanan/fasilitasi-cat/laporan/esign',
  initialData = null,
  onSaveDocument = null,
  onBack = null,
  documentTitle = 'Laporan Pelaksanaan CAT',
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

  // Tanggal sesi yang tersedia dari database (diurutkan kronologis)
  const availableSessionDates = useMemo(() => {
    const dates = new Set()
    sessions.forEach((s) => {
      if (s.period_date) dates.add(s.period_date)
    })
    return Array.from(dates).sort()
  }, [sessions])

  const initialStartDate = availableSessionDates[0] || ''
  const initialEndDate = availableSessionDates[availableSessionDates.length - 1] || initialStartDate

  const buildEmptyParams = useCallback(
    () => {
      const activeIds = Array.isArray(selectedInstansiList) ? selectedInstansiList.map(String) : []
      const resolvedNames = activeIds.map((id) => {
        const found = instansiList.find((i) => String(i.id || i.instansi_id || i.kodeins) === id)
        return found ? (found.instansi_nama || found.nama || found.name) : id
      })
      return {
        instansiIds: activeIds,
        instansiNames: resolvedNames,
        nomorSuratDeputi: '',
        tanggalSuratDeputi: '',
        nomorSuratTugas: '',
        tanggalSuratTugas: '',
        tanggalPelaksanaan: initialStartDate,
        tanggalMulai: initialStartDate,
        tanggalSelesai: initialEndDate,
        waktuPelaksanaan: '08.00 s.d 17.00',
        tempatPelaksanaan: tilok?.nama_tilok || (tilok?.lokasi ? `${tilok.nama_tilok || ''} - ${tilok.lokasi}` : '') || '',
        kotaTtd: tilok?.kota || tilok?.lokasi || '',
        ...defaultParams,
      }
    },
    [initialStartDate, initialEndDate, tilok?.nama_tilok, tilok?.lokasi, tilok?.kota, defaultParams, selectedInstansiList, instansiList]
  )

  const buildEmptyParamsRef = useRef(buildEmptyParams)
  useEffect(() => {
    buildEmptyParamsRef.current = buildEmptyParams
  }, [buildEmptyParams])

  // Parameter Dokumen & Surat (kosong hingga diisi dan disimpan)
  const [params, setParams] = useState(buildEmptyParams)

  // Otomatis sinkronisasi default tempat pelaksanaan, waktu, dan range tanggal jika baru termuat
  useEffect(() => {
    setParams((prev) => {
      let changed = false
      const next = { ...prev }
      if (!next.tempatPelaksanaan && tilok?.nama_tilok) {
        next.tempatPelaksanaan = tilok.nama_tilok
        changed = true
      }
      if (!next.waktuPelaksanaan) {
        next.waktuPelaksanaan = '08.00 s.d 17.00'
        changed = true
      }
      if (!next.tanggalMulai && initialStartDate) {
        next.tanggalMulai = initialStartDate
        next.tanggalPelaksanaan = initialStartDate
        changed = true
      }
      if (!next.tanggalSelesai && initialEndDate) {
        next.tanggalSelesai = initialEndDate
        changed = true
      }
      if (!next.kotaTtd) {
        next.kotaTtd = 'Bandung'
        changed = true
      }
      return changed ? next : prev
    })
  }, [tilok?.nama_tilok, initialStartDate, initialEndDate])

  const currentYear = useMemo(
    () =>
      resolveDocAutoYear({
        jenis_periode_tahun: activeJenisTes?.periode || activeJenisTes?.tahun,
        doc_date: params?.tanggalMulai || params?.tanggalPelaksanaan || initialStartDate,
      }),
    [activeJenisTes?.periode, activeJenisTes?.tahun, params?.tanggalMulai, params?.tanggalPelaksanaan, initialStartDate]
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
  const [savedUserPresetSigners, setSavedUserPresetSigners] = useState(null)

  const [isSavingDb, setIsSavingDb] = useState(false)
  const [docStatus, setDocStatus] = useState(() => initialData?.status || 'draft')

  useEffect(() => {
    if (initialData?.status) {
      setDocStatus(initialData.status)
    }
  }, [initialData?.status])

  const isPublished = docStatus === 'published' || initialData?.status === 'published'

  const signersSummary = useMemo(() => {
    const list = Object.values(signers || {})
    const active = list.filter((s) => s?.nama || s?.jabatan)
    const signed = list.filter((s) => s?.isSigned)
    return {
      activeCount: active.length,
      signedCount: signed.length,
      isAllSigned: active.length > 0 && signed.length >= active.length,
    }
  }, [signers])

  // Load Persisted Data HANYA Saat storageKey atau initialData Berganti
  useEffect(() => {
    let active = true

    if (initialData) {
      const activeIds = Array.isArray(selectedInstansiList) ? selectedInstansiList.map(String) : []
      if (activeIds.length > 0) {
        if (initialData.instansi_id) {
          const savedIds = String(initialData.instansi_id).split(',').map((s) => s.trim())
          const isMatch = activeIds.some((id) => savedIds.includes(id))
          if (isMatch) {
            const localSaved = localStorage.getItem(storageKey)
            if (!localSaved) {
              if (initialData.params) setParams(initialData.params)
              if (initialData.evidence || initialData.evidenceMap) {
                setEvidenceMap(initialData.evidence || initialData.evidenceMap)
              }
              if (initialData.signers) setSigners(initialData.signers)
              setHasUnsavedChanges(false)
              return
            }
          }
        }
        // Jika activeIds terdefinisi namun tidak cocok dengan initialData, jangan load!
      } else if (!initialData.instansi_id) {
        const localSaved = localStorage.getItem(storageKey)
        if (!localSaved) {
          if (initialData.params) setParams(initialData.params)
          if (initialData.evidence || initialData.evidenceMap) {
            setEvidenceMap(initialData.evidence || initialData.evidenceMap)
          }
          if (initialData.signers) setSigners(initialData.signers)
          setHasUnsavedChanges(false)
          return
        }
      }
    }

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

        // Auto-load session signer profil BKN dari DB jika nama belum terisi
        const tId = tilok?.uid || tilok?.id || filterParams?.tilokUid || ''
        const sId = kegiatan?.id || filterParams?.seleksiId || ''
        const jId = activeJenisTes?.id || activeJenisTes?.jenis_tes_id || ''

        if (tId && jId) {
          fetchCatUserSigners({
            jenis_tes_id: jId,
            seleksi_id: sId,
            tilok_id: tId,
          })
            .then((res) => {
              if (!active) return
              if (res?.kiri) {
                setSavedUserPresetSigners(res)
                setSigners((prev) => {
                  const currentKiri = prev.kiri || {}
                  if (currentKiri.nama?.trim()) return prev
                  return {
                    ...prev,
                    kiri: {
                      ...currentKiri,
                      jabatan: currentKiri.jabatan || res.kiri.jabatan || '',
                      nama: currentKiri.nama || res.kiri.nama || '',
                      nip: currentKiri.nip || res.kiri.nip || '',
                      pangkat_gol: currentKiri.pangkat_gol || res.kiri.pangkat_gol || '',
                    },
                  }
                })
              }
            })
            .catch(() => {})
        }

        setHasUnsavedChanges(false)
      } catch (err) {
        console.warn('Gagal memuat cache storageKey:', err)
      }
    })
    return () => {
      active = false
    }
  }, [storageKey, initialData, tilok, kegiatan, filterParams, activeJenisTes])

  // Hari Pelaksanaan otomatis terhitung dari tanggalMulai dan tanggalSelesai
  const calculatedHari = useMemo(() => {
    const start = params.tanggalMulai || params.tanggalPelaksanaan || ''
    const end = params.tanggalSelesai || params.tanggalPelaksanaan || start
    if (!start) return '-'
    const hariMulai = getHariIndo(start)
    if (!end || end === start) return hariMulai
    const hariSelesai = getHariIndo(end)
    return hariMulai === hariSelesai ? hariMulai : `${hariMulai} s.d ${hariSelesai}`
  }, [params.tanggalMulai, params.tanggalSelesai, params.tanggalPelaksanaan])

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
    setParams((prev) => {
      const next = { ...prev, [field]: value }
      persistState(next, evidenceMap, signers)
      return next
    })
    setHasUnsavedChanges(true)
    setSavedNotice(false)
  }

  // Handler Perubahan Data Signer
  const handleSignerChange = (posKey, field, value) => {
    setSigners((prev) => {
      const next = {
        ...prev,
        [posKey]: {
          ...prev[posKey],
          [field]: value,
        },
      }
      persistState(params, evidenceMap, next)
      return next
    })
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
    const startDate = params.tanggalMulai || params.tanggalPelaksanaan || ''
    const endDate = params.tanggalSelesai || params.tanggalPelaksanaan || startDate

    if (startDate && endDate) {
      list = list.filter((s) => {
        if (!s.period_date) return true
        return s.period_date >= startDate && s.period_date <= endDate
      })
    } else if (startDate) {
      list = list.filter((s) => s.period_date === startDate)
    }

    if (activeInstansiIds.length > 0) {
      list = list.filter((s) =>
        activeInstansiIds.includes(String(s.instansi_id || s.kodeins))
      )
    }

    const displayTanggal = startDate
      ? (endDate && endDate !== startDate
          ? `${formatDateIndo(startDate)} s.d ${formatDateIndo(endDate)}`
          : formatDateIndo(startDate))
      : '-'

    if (list.length === 0) {
      if (activeInstansiNames.length > 0) {
        return activeInstansiNames.map((name, idx) => ({
          no: idx + 1,
          nama: name,
          tanggal: displayTanggal,
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
          tanggal: displayTanggal,
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
          tanggal: displayTanggal,
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
  }, [sessions, params.tanggalMulai, params.tanggalSelesai, params.tanggalPelaksanaan, activeInstansiIds, activeInstansiNames])

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

  // Handler Simpan TTE Spesimen ke Profil Akun Session Pegawai
  const handleSaveSignerToProfile = async (posKey) => {
    const s = signers[posKey]
    if (!s || !s.nama) {
      toast.warning('Isi nama penandatangan terlebih dahulu.')
      return
    }
    try {
      await saveCatUserSigner({
        jenis_tes_id: activeJenisTes?.id || activeJenisTes?.jenis_tes_id || '',
        seleksi_id: kegiatan?.id || filterParams?.seleksiId || '',
        tilok_id: tilok?.uid || tilok?.id || filterParams?.tilokUid || '',
        instansi_id: activeInstansiIds.length === 1 ? activeInstansiIds[0] : null,
        position_key: posKey,
        jabatan: s.jabatan,
        nama: s.nama,
        nip: s.nip,
        pangkat_gol: s.pangkat_gol,
        instansi_nama: s.instansi_nama,
        signature_data: s.signatureData,
      })
      toast.success(`Tanda tangan (${posKey.toUpperCase()}) berhasil disimpan ke profil akun Anda untuk tilok ini.`)
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan profil tanda tangan.')
    }
  }

  // Handler Simpan / Terbitkan Laporan ke Database (Snapshot Beku JSON)
  const handleSaveToDatabase = async (status = 'draft') => {
    if (typeof onSaveDocument === 'function') {
      try {
        setIsSavingDb(true)
        await onSaveDocument({
          params,
          signers,
          evidenceMap,
          dataSnapshot: {
            tableData,
            totalSummary,
            formattedInstansiNames,
            kegiatanNama: kegiatan?.nama_seleksi || activeJenisTes?.display_nama || 'SELEKSI PENGEMBANGAN KARIER',
            tilokNama: tilok?.nama_tilok || params.tempatPelaksanaan || 'KANTOR REGIONAL III BKN BANDUNG',
            calculatedHari,
            currentYear,
          },
          status,
        })
        setDocStatus(status)
        persistState(params, evidenceMap, signers)
        setHasUnsavedChanges(false)
        setSavedNotice(true)
        setTimeout(() => setSavedNotice(false), 3000)
        toast.success(status === 'published' ? 'Laporan berhasil Diterbitkan!' : 'Draft laporan berhasil disimpan ke database!')
      } catch (err) {
        toast.error(err?.message || 'Gagal menyimpan laporan ke database.')
      } finally {
        setIsSavingDb(false)
      }
    } else {
      handleSaveParameters()
    }
  }

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
            <span>Parameter</span>
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
            <span>Dokumentasi</span>
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
            <span>Pratinjau</span>
            {totalSignedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* 1 Area Aksi Utama Simpan & Terbitkan (Terpusat di Kanan Atas) */}
        <div className="flex items-center gap-2 px-2 shrink-0 justify-end">
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tersimpan</span>
            </span>
          )}

          {typeof onSaveDocument === 'function' ? (
            <>
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
                <span>{isSavingDb ? 'Memproses...' : isPublished ? 'Sudah Diterbitkan' : 'Terbitkan Laporan'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSaveParameters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Parameter</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PARAMETER FORM TERSIMPLIFIKASI (1 SINGLE CARD, 3-POSISI TTD TABLE) */}
      {/* ========================================================================= */}
      {activeTab === 'params' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-2xs space-y-7">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#175CD3]" />
              <span>Parameter Laporan & Pengesahan Dokumen</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Data sesi peserta otomatis dimuat dari server. Lengkapi parameter pelaksanaan, surat tugas, dan penandatangan.
            </p>
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

          {/* SECTION C: Tanggal & Pengesahan Pelaksanaan */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              C. Tanggal Pelaksanaan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Tanggal Mulai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={params.tanggalMulai || params.tanggalPelaksanaan || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    handleParamChange('tanggalMulai', val)
                    if (!params.tanggalSelesai || params.tanggalSelesai < val) {
                      handleParamChange('tanggalSelesai', val)
                    }
                    handleParamChange('tanggalPelaksanaan', val)
                  }}
                  className={`${CAT_FORM_INPUT_CLS} font-bold`}
                />
                <p className="text-[11px] text-slate-400">
                  Hari: <strong>{getHariIndo(params.tanggalMulai || params.tanggalPelaksanaan)}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Tanggal Selesai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={params.tanggalSelesai || params.tanggalPelaksanaan || ''}
                  min={params.tanggalMulai || params.tanggalPelaksanaan || ''}
                  onChange={(e) => handleParamChange('tanggalSelesai', e.target.value)}
                  className={`${CAT_FORM_INPUT_CLS} font-bold`}
                />
                <p className="text-[11px] text-slate-400">
                  Total Rentang: <strong>{calculatedHari}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Kota Penandatangan
                </label>
                <input
                  type="text"
                  value={params.kotaTtd || 'Bandung'}
                  onChange={(e) => handleParamChange('kotaTtd', e.target.value)}
                  placeholder="Bandung"
                  className={`${CAT_FORM_INPUT_CLS} font-medium`}
                />
              </div>
            </div>
          </div>

          {/* SECTION D: 3 SECTIONS TANDA TANGAN FLEKSIBEL (KIRI, TENGAH, KANAN) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  D. Penandatanganan &amp; Pengesahan Dokumen (3 Kolom Fleksibel)
                </h4>
                {signersSummary.isAllSigned ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pengesahan Lengkap ({signersSummary.signedCount}/{signersSummary.activeCount} TTE)</span>
                  </span>
                ) : signersSummary.signedCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Progress TTE: {signersSummary.signedCount}/{signersSummary.activeCount} Selesai</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                    <span>Belum Ada TTE (0/{signersSummary.activeCount || 2})</span>
                  </span>
                )}
              </div>
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
                sublabel="Panitia Pelaksana BKN"
                signer={signers.kiri}
                onChange={handleSignerChange}
                onSign={handleSignPosition}
                onReset={(key) => setResetTargetKey(key)}
                onCopyLink={handleCopyLink}
                isCopied={copiedKey === 'kiri'}
                savedPresetSignature={savedUserPresetSigners?.kiri?.signature_data || savedUserPresetSigners?.kiri?.signatureData}
              />

              {/* Kolom 2: Tengah */}
              <SignerPositionCol
                positionKey="tengah"
                title="2. Posisi Tengah"
                sublabel="Opsional: Petugas TI / Saksi"
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
                sublabel="Panitia Instansi Pengusul"
                signer={signers.kanan}
                onChange={handleSignerChange}
                onSign={handleSignPosition}
                onReset={(key) => setResetTargetKey(key)}
                onCopyLink={handleCopyLink}
                isCopied={copiedKey === 'kanan'}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Seluruh isian parameter dan tanda tangan otomatis tersimpan di sesi lokal. Klik <strong>Simpan Draft</strong> atau <strong>Terbitkan Laporan</strong> di pojok kanan atas untuk menyimpan permanen ke server database.</span>
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
