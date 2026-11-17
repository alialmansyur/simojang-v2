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
  fetchCatInstansiTilok,
  fetchCatLaporanDetail,
  fetchCatLaporanList,
  saveCatLaporan,
} from '../../../services/api/sidigiCatServicesApi'
import {
  decodeCatJenisToken,
  decodeCatFilterToken,
  encodeCatFilterToken,
  setActiveCatJenisToken,
  setActiveCatFilterToken,
  buildCatModuleUrl,
} from '../../../utils/catRouteToken'
import { AVAILABLE_CAT_DOCUMENTS } from '../../../components/shared/services/sidigi/cat/catDocumentCatalog'
import { CatLaporanDocumentView } from '../../../components/shared/services/sidigi/cat/CatLaporanDocumentView'
import { BaProfilingAsnBuilder } from '../../../components/shared/services/sidigi/cat/BaProfilingAsnBuilder'
import { FormulirSarprasCatBuilder } from '../../../components/shared/services/sidigi/cat/FormulirSarprasCatBuilder'

export default function FasilitasiCatLaporanBuilderPage() {
  const navigate = useNavigate()
  const { jenisToken, documentSlug, reportUid } = useParams()
  const [searchParams] = useSearchParams()
  const filterToken = searchParams.get('p') || ''

  const isEditingExisting = Boolean(reportUid && reportUid !== 'builder')

  const decodedJenis = useMemo(() => decodeCatJenisToken(jenisToken), [jenisToken])
  const decodedFilter = useMemo(() => decodeCatFilterToken(filterToken), [filterToken])
  const currentDocument = useMemo(
    () => AVAILABLE_CAT_DOCUMENTS.find((d) => d.slug === documentSlug || d.id === documentSlug),
    [documentSlug]
  )

  const [seleksiList, setSeleksiList] = useState([])
  const [tilokList, setTilokList] = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [sessions, setSessions] = useState([])
  const [existingReport, setExistingReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const activeInstansiId = useMemo(() => {
    if (decodedFilter?.instansiIds && decodedFilter.instansiIds.length === 1) {
      return String(decodedFilter.instansiIds[0])
    }
    return ''
  }, [decodedFilter])

  const loadBuilderContext = useCallback(async () => {
    if (!decodedJenis || !decodedFilter?.tilokUid) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setErrorMsg('')

      const activeInstansi =
        decodedFilter.instansiIds && decodedFilter.instansiIds.length === 1
          ? decodedFilter.instansiIds[0]
          : undefined

      const promises = [
        fetchCatSeleksiOptions({
          jenis_tes_id: decodedJenis.jenis_tes_id || decodedJenis.id,
          periode: decodedJenis.periode,
        }),
        decodedFilter.seleksiId
          ? fetchCatTilokList(decodedJenis.id, decodedJenis.periode, decodedFilter.seleksiId)
          : Promise.resolve([]),
        fetchCatInstansiTilok(
          decodedFilter.tilokUid,
          [],
          decodedFilter.seleksiId || ''
        ),
        fetchCatSessions({
          tilokUid: decodedFilter.tilokUid,
          seleksiId: decodedFilter.seleksiId || '',
          instansiId: activeInstansi,
          length: 500,
        }),
      ]

      if (isEditingExisting) {
        promises.push(fetchCatLaporanDetail(reportUid))
      } else if (decodedFilter.tilokUid && decodedFilter.seleksiId) {
        // Otomatis cek apakah laporan sudah pernah dibuat/disimpan untuk filter tilok, seleksi, dan instansi ini
        promises.push(
          fetchCatLaporanList({
            jenis_laporan: documentSlug || 'laporan-pelaksanaan-cat',
            seleksi_id: decodedFilter.seleksiId,
            tilok_id: decodedFilter.tilokUid,
            instansi_id: activeInstansi,
            limit: 1,
          }).then((res) => (res.rows && res.rows.length > 0 ? res.rows[0] : null))
        )
      } else {
        promises.push(Promise.resolve(null))
      }

      const [resSeleksi, resTilok, resInstansi, resSessions, resDetail] = await Promise.all(promises)

      setSeleksiList(Array.isArray(resSeleksi) ? resSeleksi : [])
      setTilokList(Array.isArray(resTilok) ? resTilok : [])
      setInstansiList(Array.isArray(resInstansi) ? resInstansi : [])
      setSessions(Array.isArray(resSessions?.data) ? resSessions.data : [])
      if (resDetail) {
        const activeIds = (decodedFilter?.instansiIds || []).map(String)
        if (activeIds.length > 0) {
          if (!resDetail.instansi_id) {
            setExistingReport(null)
          } else {
            const savedIds = String(resDetail.instansi_id).split(',').map((s) => s.trim())
            const isMatch = activeIds.some((id) => savedIds.includes(id))
            setExistingReport(isMatch ? resDetail : null)
          }
        } else {
          setExistingReport(resDetail)
        }
      } else {
        setExistingReport(null)
      }
    } catch (err) {
      console.warn('Gagal memuat konteks builder dokumen CAT:', err)
      setErrorMsg(err?.message || 'Gagal memuat data pelaksanaan CAT.')
    } finally {
      setIsLoading(false)
    }
  }, [decodedJenis, decodedFilter, isEditingExisting, reportUid, documentSlug])

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

  const handleSwitchInstansi = (newInstansiId) => {
    const nextFilter = {
      ...(decodedFilter || {}),
      instansiIds: newInstansiId ? [newInstansiId] : [],
    }
    const newFilterToken = encodeCatFilterToken(nextFilter)
    navigate(buildCatModuleUrl(`/layanan/fasilitasi-cat/laporan/${jenisToken}`, documentSlug, newFilterToken))
  }

  // Handler simpan laporan ke database (Snapshot JSON)
  const handleSaveDocument = useCallback(
    async ({ params, signers, evidenceMap, dataSnapshot, status }) => {
      const activeUid = existingReport?.uid || (isEditingExisting ? reportUid : undefined)
      const payload = {
        uid: activeUid,
        jenis_laporan: documentSlug || 'laporan-pelaksanaan-cat',
        nomor_dokumen: params.nomorSuratTugas || params.nomorSuratDeputi || 'Laporan CAT',
        judul_laporan: currentDocument?.title || 'Laporan Kegiatan Pelaksanaan CAT',
        tanggal_dokumen: params.tanggalPelaksanaan || new Date().toISOString().split('T')[0],
        tanggal_pelaksanaan: params.tanggalPelaksanaan || new Date().toISOString().split('T')[0],
        jenis_tes_id: decodedJenis?.id || decodedJenis?.jenis_tes_id || '',
        seleksi_id: decodedFilter?.seleksiId || '',
        tilok_id: decodedFilter?.tilokUid || '',
        instansi_id:
          Array.isArray(params.instansiIds) && params.instansiIds.length > 0
            ? params.instansiIds.join(',')
            : (decodedFilter?.instansiIds && decodedFilter.instansiIds.length > 0
                ? decodedFilter.instansiIds.join(',')
                : null),
        periode: decodedJenis?.periode || '',
        status: status || 'draft',
        params,
        signers,
        evidence: evidenceMap,
        data_snapshot: dataSnapshot,
      }

      const res = await saveCatLaporan(payload)
      if (res?.data) {
        setExistingReport(res.data)
      }
      return res
    },
    [existingReport, isEditingExisting, reportUid, documentSlug, currentDocument, decodedJenis, decodedFilter]
  )

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
              <span>Kembali ke Pilihan Dokumen</span>
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
            Penyusunan laporan dan pratinjau dokumen resmi pelaksanaan CAT BKN.
          </p>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Jenis Tes:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700">
              <span>{decodedJenis.display_nama || decodedJenis.jenis_tes_nama}</span>
              {decodedJenis.periode && (
                <span className="text-slate-400 font-semibold">({decodedJenis.periode})</span>
              )}
            </span>
            {currentTilok && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                <span>{currentTilok.nama_tilok}</span>
              </span>
            )}
            {instansiList.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Instansi:</span>
                <select
                  value={activeInstansiId}
                  onChange={(e) => handleSwitchInstansi(e.target.value)}
                  className="bg-transparent text-xs font-bold text-emerald-900 dark:text-emerald-100 focus:outline-hidden cursor-pointer max-w-[280px] truncate"
                  title="Pilih instansi untuk menyusun dokumen khusus instansi tersebut"
                >
                  <option value="">-- Pilih Instansi Peserta --</option>
                  {instansiList.map((ins) => {
                    const val = String(ins.instansi_id || ins.id || ins.kodeins || '')
                    const label = ins.instansi_nama || ins.nama || `Instansi ${val}`
                    return (
                      <option key={val} value={val} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                        {label}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={handleBackToCatalog}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Kembali ke Pilihan Dokumen Laporan"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Pilihan Dokumen</span>
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
          key={`${decodedFilter?.seleksiId || ''}_${decodedFilter?.tilokUid || ''}_${(decodedFilter?.instansiIds || []).slice().sort().join('-')}`}
          activeJenisTes={decodedJenis}
          kegiatan={currentKegiatan}
          tilok={currentTilok}
          selectedInstansiList={decodedFilter?.instansiIds || []}
          instansiList={instansiList}
          sessions={sessions}
          filterParams={decodedFilter}
          initialData={existingReport}
          onSaveDocument={handleSaveDocument}
          onBack={handleBackToCatalog}
          documentTitle={currentDocument?.title}
        />
      ) : documentSlug === 'berita-acara-cat' ? (
        <BaProfilingAsnBuilder
          key={`${decodedFilter?.seleksiId || ''}_${decodedFilter?.tilokUid || ''}_${(decodedFilter?.instansiIds || []).slice().sort().join('-')}`}
          activeJenisTes={decodedJenis}
          kegiatan={currentKegiatan}
          tilok={currentTilok}
          selectedInstansiList={decodedFilter?.instansiIds || []}
          instansiList={instansiList}
          sessions={sessions}
          filterParams={decodedFilter}
          initialData={existingReport}
          onSaveDocument={handleSaveDocument}
          onBack={handleBackToCatalog}
          documentTitle={currentDocument?.title}
        />
      ) : documentSlug === 'formulir-sarpras-cat' ? (
        <FormulirSarprasCatBuilder
          key={`${decodedFilter?.seleksiId || ''}_${decodedFilter?.tilokUid || ''}_${(decodedFilter?.instansiIds || []).slice().sort().join('-')}`}
          activeJenisTes={decodedJenis}
          kegiatan={currentKegiatan}
          tilok={currentTilok}
          selectedInstansiList={decodedFilter?.instansiIds || []}
          instansiList={instansiList}
          sessions={sessions}
          filterParams={decodedFilter}
          initialData={existingReport}
          onSaveDocument={handleSaveDocument}
          onBack={handleBackToCatalog}
          documentTitle={currentDocument?.title}
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
            <span>Kembali ke Pilihan Dokumen</span>
          </button>
        </div>
      )}
    </div>
  )
}
