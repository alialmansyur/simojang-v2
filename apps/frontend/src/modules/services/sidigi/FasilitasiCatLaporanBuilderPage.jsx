import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  fetchCatSeleksiOptions,
  fetchCatTilokList,
  fetchCatSessions,
} from '../../../services/api/sidigiCatServicesApi'
import {
  decodeCatJenisToken,
  decodeCatFilterToken,
  setActiveCatJenisToken,
  setActiveCatFilterToken,
  buildCatModuleUrl,
} from '../../../utils/catRouteToken'
import { AVAILABLE_CAT_DOCUMENTS } from '../../../components/shared/services/sidigi/cat/catDocumentCatalog'
import { CatLaporanDocumentView } from '../../../components/shared/services/sidigi/cat/CatLaporanDocumentView'

export default function FasilitasiCatLaporanBuilderPage() {
  const navigate = useNavigate()
  const { jenisToken, documentSlug } = useParams()
  const [searchParams] = useSearchParams()
  const filterToken = searchParams.get('p') || ''

  const decodedJenis = useMemo(() => decodeCatJenisToken(jenisToken), [jenisToken])
  const decodedFilter = useMemo(() => decodeCatFilterToken(filterToken), [filterToken])
  const currentDocument = useMemo(
    () => AVAILABLE_CAT_DOCUMENTS.find((d) => d.slug === documentSlug || d.id === documentSlug),
    [documentSlug]
  )

  const [seleksiList, setSeleksiList] = useState([])
  const [tilokList, setTilokList] = useState([])
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const loadBuilderContext = useCallback(async () => {
    if (!decodedJenis || !decodedFilter?.tilokUid) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setErrorMsg('')

      const [resSeleksi, resTilok, resSessions] = await Promise.all([
        fetchCatSeleksiOptions({
          jenis_tes_id: decodedJenis.jenis_tes_id || decodedJenis.id,
          periode: decodedJenis.periode,
        }),
        decodedFilter.seleksiId
          ? fetchCatTilokList(decodedJenis.id, decodedJenis.periode, decodedFilter.seleksiId)
          : Promise.resolve([]),
        fetchCatSessions({
          tilokUid: decodedFilter.tilokUid,
          seleksiId: decodedFilter.seleksiId || '',
          length: 500,
        }),
      ])

      setSeleksiList(Array.isArray(resSeleksi) ? resSeleksi : [])
      setTilokList(Array.isArray(resTilok) ? resTilok : [])
      setSessions(Array.isArray(resSessions?.data) ? resSessions.data : [])
    } catch (err) {
      console.warn('Gagal memuat konteks builder dokumen CAT:', err)
      setErrorMsg(err?.message || 'Gagal memuat data pelaksanaan CAT.')
    } finally {
      setIsLoading(false)
    }
  }, [decodedJenis, decodedFilter])

  useEffect(() => {
    if (decodedJenis && jenisToken) {
      setActiveCatJenisToken(jenisToken)
      if (decodedFilter?.tilokUid && filterToken) {
        setActiveCatFilterToken(jenisToken, filterToken)
      }
    }
  }, [decodedJenis, jenisToken, decodedFilter, filterToken])

  useEffect(() => {
    loadBuilderContext()
  }, [loadBuilderContext])

  const currentKegiatan = useMemo(() => {
    if (!decodedFilter?.seleksiId) return null
    return seleksiList.find((s) => String(s.id || s.seleksi_id) === String(decodedFilter.seleksiId)) || null
  }, [seleksiList, decodedFilter])

  const currentTilok = useMemo(() => {
    if (!decodedFilter?.tilokUid) return null
    return tilokList.find((t) => String(t.uid || t.id) === String(decodedFilter.tilokUid)) || null
  }, [tilokList, decodedFilter])

  const handleBackToCatalog = () => {
    if (jenisToken) {
      navigate(buildCatModuleUrl('/layanan/fasilitasi-cat/laporan', jenisToken, filterToken))
    } else {
      navigate('/layanan/fasilitasi-cat/laporan')
    }
  }

  // Fallback jika token URL rusak / parameter tilok tidak ada
  if (!decodedJenis || !decodedFilter?.tilokUid) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs space-y-3 max-w-xl mx-auto mt-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Parameter Dokumen Tidak Lengkap atau Kedaluwarsa
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Silakan pilih kembali Jenis Tes, Kegiatan, dan Titik Lokasi pada katalog dokumen laporan CAT.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleBackToCatalog}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Katalog Dokumen</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* SERVICE HEADER */}
      <div className="no-print flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Sistem Informasi & Digitalisasi</span>
          </div>

          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {currentDocument?.title || 'Dokumen Builder Laporan CAT'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Penyusunan dan pratinjau dokumen resmi pelaksanaan CAT BKN.
          </p>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Jenis Tes:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700">
              <span>{decodedJenis.display_nama || decodedJenis.jenis_tes_nama}</span>
              {decodedJenis.periode && (
                <span className="text-slate-400 font-semibold">({decodedJenis.periode})</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={handleBackToCatalog}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Kembali ke Daftar Dokumen"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali</span>
          </button>

          <button
            type="button"
            onClick={loadBuilderContext}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#175CD3] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            Menyiapkan data pelaksanaan dan dokumen builder...
          </p>
        </div>
      ) : documentSlug === 'laporan-pelaksanaan-cat' ? (
        <CatLaporanDocumentView
          activeJenisTes={decodedJenis}
          kegiatan={currentKegiatan}
          tilok={currentTilok}
          selectedInstansiList={decodedFilter.instansiIds}
          sessions={sessions}
          filterParams={decodedFilter}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Template Dokumen Belum Diimplementasikan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Builder untuk dokumen ini sedang dalam tahap perancangan template. Silakan kembali ke daftar dokumen untuk memilih dokumen lainnya.
          </p>
          <button
            type="button"
            onClick={handleBackToCatalog}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Dokumen</span>
          </button>
        </div>
      )}
    </div>
  )
}
