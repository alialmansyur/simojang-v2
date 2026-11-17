import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  RefreshCw,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react'
import { fetchCatSessions } from '../../../services/api/sidigiCatServicesApi'
import { CatJenisTesSelectorSection } from '../../../components/shared/services/sidigi/cat/CatJenisTesSelectorSection'
import { CatFilterParameterSection } from '../../../components/shared/services/sidigi/cat/CatFilterParameterSection'
import { useCatFilterWorkflow } from '../../../components/shared/services/sidigi/cat/useCatFilterWorkflow'
import { AVAILABLE_CAT_DOCUMENTS } from '../../../components/shared/services/sidigi/cat/catDocumentCatalog'
import {
  encodeCatJenisToken,
  encodeCatFilterToken,
  buildCatModuleUrl,
} from '../../../utils/catRouteToken'

export default function FasilitasiCatLaporanPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Sessions Data for Report
  const [, setSessions] = useState([])
  const [isSessionsLoading, setIsSessionsLoading] = useState(false)

  // Execute Query to fetch sessions when filter submitted
  const executeQuery = useCallback(async (filters) => {
    if (!filters?.tilokUid) return
    try {
      setIsSessionsLoading(true)
      const res = await fetchCatSessions({
        tilokUid: filters.tilokUid,
        seleksiId: filters.seleksiId || '',
        length: 500,
      })
      const rawSessions = Array.isArray(res.data) ? res.data : []
      setSessions(rawSessions)
    } catch (err) {
      console.warn('Gagal memuat data sesi untuk laporan:', err)
      setSessions([])
    } finally {
      setIsSessionsLoading(false)
    }
  }, [])

  const clearReportData = useCallback(() => {
    setSessions([])
  }, [])

  const getLegacyLocationOverride = useCallback(() => {
    if (!location.state?.activeJenisTes) return null
    const s = location.state
    return {
      jenisToken: encodeCatJenisToken(s.activeJenisTes),
      filterToken: s.tilokUid
        ? encodeCatFilterToken({
            seleksiId: s.seleksiId,
            tilokUid: s.tilokUid,
            instansiIds: s.instansiIds || [],
          })
        : '',
    }
  }, [location.state])

  const {
    jenisToken,
    filterToken,
    jenisPeriodeList,
    selectedYear,
    setSelectedYear,
    isJenisLoading,
    loadJenisPeriode,
    activeJenisTes,
    isSeleksiLoading,
    isTilokLoading,
    instansiList,
    isInstansiLoading,
    seleksiOptions,
    tilokOptions,
    currentSelectedTilok,
    filterSeleksiId,
    filterTilokUid,
    filterInstansiIds,
    setFilterInstansiIds,
    hasSubmitted,
    appliedFilters,
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
  } = useCatFilterWorkflow({
    basePath: '/layanan/fasilitasi-cat/laporan',
    onExecuteQuery: executeQuery,
    onClearData: clearReportData,
    clearSubmittedOnCascadeChange: true,
    getRedirectOverrideWhenEmpty: getLegacyLocationOverride,
  })

  // Buka Halaman Builder Terpisah sesuai Dokumen Pilihan
  const handleOpenDocumentBuilder = (doc) => {
    const liveFilters = {
      seleksiId: filterSeleksiId,
      tilokUid: filterTilokUid,
      instansiIds: filterInstansiIds,
    }
    const currentPToken = encodeCatFilterToken(liveFilters) || filterToken || encodeCatFilterToken(appliedFilters)
    navigate(buildCatModuleUrl(`/layanan/fasilitasi-cat/laporan/${jenisToken}`, doc.slug, currentPToken))
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* SERVICE HEADER (STANDARISASI_UI_UX_MASTER_SSOT.md) */}
      <div className="no-print flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Title, Ringkas Tim Kerja Badge & Description */}
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Sistem Informasi & Digitalisasi</span>
          </div>

          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Laporan Pelaksanaan Kegiatan CAT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Pusat pembuatan dan penerbitan laporan kegiatan pelaksanaan Computer Assisted Test (CAT).
          </p>

          {activeJenisTes && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-medium">Jenis Tes:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700">
                <span>{activeJenisTes.display_nama || activeJenisTes.jenis_tes_nama}</span>
                <span className="text-slate-400 font-semibold">({activeJenisTes.periode})</span>
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              if (activeJenisTes) {
                handleBackToLevel1()
              } else {
                navigate('/layanan/fasilitasi-cat')
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title={activeJenisTes ? 'Kembali ke Daftar Jenis Tes' : 'Kembali ke Portal CAT'}
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeJenisTes && appliedFilters) {
                executeQuery(appliedFilters)
              } else if (activeJenisTes) {
                loadKegiatanForActiveJenis(activeJenisTes)
              } else {
                loadJenisPeriode()
              }
            }}
            disabled={isJenisLoading || isSessionsLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isJenisLoading || isSessionsLoading ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* LEVEL 1: GRID JENIS TES BESAR CAT (SHARED COMPONENT) */}
      {!activeJenisTes && (
        <CatJenisTesSelectorSection
          jenisPeriodeList={jenisPeriodeList}
          isLoading={isJenisLoading}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onSelectJenisTes={handleSelectJenisTesCard}
          onReloadList={loadJenisPeriode}
        />
      )}

      {/* LEVEL 2: CASCADING FILTER WAJIB (KEGIATAN -> TILOK -> MULTI-INSTANSI) */}
      {activeJenisTes && (
        <div className="space-y-5">
          {/* PANEL FILTER PARAMETER PELAKSANAAN TERPADU (SHARED) */}
          <CatFilterParameterSection
            activeJenisTes={activeJenisTes}
            seleksiOptions={seleksiOptions}
            tilokOptions={tilokOptions}
            instansiList={instansiList}
            isSeleksiLoading={isSeleksiLoading}
            isTilokLoading={isTilokLoading}
            isInstansiLoading={isInstansiLoading}
            filterSeleksiId={filterSeleksiId}
            filterTilokUid={filterTilokUid}
            filterInstansiIds={filterInstansiIds}
            onKegiatanChange={handleKegiatanChange}
            onTilokChange={handleTilokChange}
            onInstansiChange={(nextIds) => {
              setFilterInstansiIds(nextIds)
              if (hasSubmitted && filterSeleksiId && filterTilokUid) {
                applyFilters({
                  seleksiId: filterSeleksiId,
                  tilokUid: filterTilokUid,
                  instansiIds: nextIds,
                })
              }
            }}
            currentSelectedTilok={currentSelectedTilok}
            onReloadKegiatan={() => activeJenisTes && loadKegiatanForActiveJenis(activeJenisTes)}
            onReloadTilok={() =>
              filterSeleksiId && activeJenisTes && loadTiloksForKegiatan(filterSeleksiId, activeJenisTes)
            }
            onReloadInstansi={async () => {
              if (filterTilokUid) {
                const newIds = await loadInstansiForTilokAndKegiatan(filterTilokUid, filterSeleksiId)
                if (appliedFilters) {
                  applyFilters({ ...appliedFilters, instansiIds: newIds })
                }
              }
            }}
            onSubmit={(e) => handleSearchSubmit(e, { includeDateRange: false })}
            onResetFilter={handleResetFilter}
            isSubmitting={isSessionsLoading}
            submitLabel="Cari Data & Tampilkan Dokumen"
            submitTitle="Terapkan Filter & Tampilkan Dokumen"
          />

          {/* GATING: STATE SEBELUM FILTER DI-SUBMIT */}
          {!hasSubmitted ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pt-1">
                Laporan Belum Dimuat
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Silakan tentukan <strong>Kegiatan Seleksi</strong> dan <strong>Titik Lokasi (Tilok)</strong> pada filter di atas, lalu klik tombol <strong>"Cari Data & Tampilkan Dokumen"</strong>.
              </p>
            </div>
          ) : (
            /* ========================================================================= */
            /* KATALOG JENIS DOKUMEN YANG AKAN DIGENERATE                                */
            /* ========================================================================= */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header List Dokumen */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Pilih Jenis Dokumen Laporan
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Pilih dokumen untuk masuk ke halaman builder.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{AVAILABLE_CAT_DOCUMENTS.length} Dokumen</span>
                  </span>
                </div>
              </div>

              {/* Grid Kartu Dokumen (4 Kolom Sejajar, Tinggi Setara Card Jenis Tes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {AVAILABLE_CAT_DOCUMENTS.map((doc) => {
                  const isReady = doc.status === 'ready'

                  return (
                    <div
                      key={doc.id}
                      onClick={() => isReady && handleOpenDocumentBuilder(doc)}
                      className={`group relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl transition-all duration-200 p-4 sm:p-4.5 min-h-40 flex flex-col justify-between shadow-xs ${
                        isReady
                          ? 'hover:shadow-sm hover:border-[#175CD3]/30 cursor-pointer'
                          : 'opacity-75 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300">
                            {doc.code}
                          </span>

                          {isReady ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{doc.badgeText}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{doc.badgeText}</span>
                            </span>
                          )}
                        </div>

                        {/* Jenis / Kategori & Nama Laporan */}
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                          {doc.category}
                        </div>
                        <h3
                          className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug mt-0.5 ${
                            isReady
                              ? 'group-hover:text-[#175CD3] dark:group-hover:text-blue-400 transition-colors'
                              : ''
                          }`}
                        >
                          {doc.title}
                        </h3>
                      </div>

                      {/* Footer Aksi */}
                      {isReady ? (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#175CD3] dark:group-hover:text-blue-400 transition-colors">
                            Buka Dokumen Builder
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 text-slate-400 group-hover:text-[#175CD3] dark:group-hover:text-blue-400 flex items-center justify-center transition-all group-hover:translate-x-1">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-slate-400">
                          <span className="text-xs font-semibold">
                            Dalam Tahap Pengembangan
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800/70 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
