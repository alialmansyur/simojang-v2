import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Plus,
  FileText,
  Edit3,
  Trash2,
  Eye,
  Download,
  Clock,
  CheckCircle2,
  Building2,
  Calendar,
  AlertCircle,
  X,
  Layers,
  RefreshCw,
  ArrowLeft,
  ChevronUp,
  BarChart3,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { PmaKpiGrid } from '../../../components/shared/services/pma/PmaKpiGrid'
import { ServiceFilterToolbar } from '../../../components/shared/services/ServiceFilterToolbar'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { CatPengelolaConfirmModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaConfirmModal'
import {
  fetchCatLaporanList,
  deleteCatLaporan,
  fetchCatUserSigners,
} from '../../../services/api/sidigiCatServicesApi'
import {
  decodeCatJenisToken,
  decodeCatFilterToken,
  buildCatModuleUrl,
} from '../../../utils/catRouteToken'
import { AVAILABLE_CAT_DOCUMENTS } from '../../../components/shared/services/sidigi/cat/catDocumentCatalog'
import { DocumentPdfPreview } from '../../../components/shared/document-builder/DocumentPdfPreview'
import { CatLaporanTemplate } from '../../../components/shared/document-builder/templates/CatLaporanTemplate'

const DOC_STATUS_CATEGORIES = [
  { value: 'all', label: 'Semua Status' },
  { value: 'published', label: 'Diterbitkan / Final' },
  { value: 'draft', label: 'Draft' },
]

const STATUS_BADGE_MAP = {
  draft: {
    label: 'Draft',
    cls: 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300',
  },
  published: {
    label: 'Diterbitkan',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
}

function formatDateIndo(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function FasilitasiCatLaporanDetailPage() {
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

  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Show / Hide Bento KPI
  const [showKpi, setShowKpi] = useState(() => {
    try {
      const saved = localStorage.getItem('cat_laporan_show_kpi')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })

  const toggleKpi = () => {
    setShowKpi((prev) => {
      const next = !prev
      try {
        localStorage.setItem('cat_laporan_show_kpi', String(next))
      } catch (err) {
        console.warn('Gagal menyimpan preferensi show_kpi:', err)
      }
      return next
    })
  }

  // Active saved signers for current user
  const [userSigners, setUserSigners] = useState(null)

  // Modals
  const [deletingDoc, setDeletingDoc] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const [resDocs, resSigners] = await Promise.all([
        fetchCatLaporanList({
          jenis_laporan: documentSlug || 'all',
          seleksi_id: decodedFilter?.seleksiId || '',
          tilok_id: decodedFilter?.tilokUid || '',
          jenis_tes_id: decodedJenis?.id || decodedJenis?.jenis_tes_id || '',
          status: statusFilter !== 'all' ? statusFilter : '',
          search: searchTerm,
          page: 1,
          limit: 100,
        }),
        fetchCatUserSigners({
          jenis_tes_id: decodedJenis?.id || decodedJenis?.jenis_tes_id || '',
          seleksi_id: decodedFilter?.seleksiId || '',
          tilok_id: decodedFilter?.tilokUid || '',
        }).catch(() => null),
      ])

      setRows(Array.isArray(resDocs?.rows) ? resDocs.rows : [])
      setSummary(resDocs?.summary || {})
      setUserSigners(resSigners)
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memuat daftar riwayat laporan.')
    } finally {
      setLoading(false)
    }
  }, [documentSlug, decodedFilter, decodedJenis, statusFilter, searchTerm])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const categoryCounts = useMemo(() => {
    const counts = { all: rows.length, published: 0, draft: 0 }
    for (const r of rows) {
      const s = r.status || 'draft'
      if (counts[s] !== undefined) counts[s] += 1
    }
    return counts
  }, [rows])

  const filteredRows = useMemo(() => {
    let list = rows
    if (statusFilter !== 'all') {
      list = list.filter((r) => (r.status || 'draft') === statusFilter)
    }
    const q = searchTerm.trim().toLowerCase()
    if (q) {
      list = list.filter((r) =>
        [
          r.nomor_dokumen,
          r.judul_laporan,
          r.nama_seleksi,
          r.nama_tilok,
          r.created_by_name,
          r.signers_summary?.kiri,
          r.signers_summary?.kanan,
          Array.isArray(r.instansi_names) ? r.instansi_names.join(' ') : '',
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q))
      )
    }
    return list
  }, [rows, statusFilter, searchTerm])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const kpis = useMemo(() => {
    const total = Number(summary?.total ?? rows.length)
    const pub = Number(summary?.published ?? rows.filter((r) => r.status === 'published').length)
    const dft = Number(summary?.draft ?? rows.filter((r) => r.status === 'draft').length)
    const hasSavedTte = Boolean(userSigners?.kanan?.signature_data || userSigners?.kiri?.signature_data)

    return [
      {
        label: 'Total Laporan',
        value: total,
        unit: 'laporan',
        context: currentDocument?.title || 'Dokumen Pelaksanaan',
        badge: currentDocument?.code || 'DOC-CAT',
        badgeColor: 'blue',
        icon: FileText,
      },
      {
        label: 'Diterbitkan / Final',
        value: pub,
        unit: 'dokumen',
        context: 'Laporan tervalidasi & siap unduh',
        badge: 'Published',
        badgeColor: 'emerald',
        icon: CheckCircle2,
      },
      {
        label: 'Draft Laporan',
        value: dft,
        unit: 'berkas',
        context: 'Dalam penyusunan / belum TTE',
        badge: 'Draft',
        badgeColor: 'amber',
        icon: Clock,
      },
      {
        label: 'Profil E-Sign Pegawai',
        value: hasSavedTte ? 1 : 0,
        unit: hasSavedTte ? 'Aktif' : 'Kosong',
        context: hasSavedTte
          ? `Tersimpan untuk ${userSigners?.kanan?.nama || 'Pegawai'}`
          : 'Belum disimpan di session ini',
        badge: hasSavedTte ? 'Tersimpan' : 'Perlu Setup',
        badgeColor: hasSavedTte ? 'indigo' : 'rose',
        icon: ShieldCheck,
      },
    ]
  }, [summary, rows, currentDocument, userSigners])

  const handleOpenBuilder = (reportUid = 'builder') => {
    const pToken = filterToken
    navigate(
      buildCatModuleUrl(
        `/layanan/fasilitasi-cat/laporan/${jenisToken}/${documentSlug}`,
        reportUid,
        pToken
      )
    )
  }

  const handleConfirmDelete = async () => {
    if (!deletingDoc?.uid) return
    try {
      setIsDeleting(true)
      await deleteCatLaporan(deletingDoc.uid)
      toast.success('Laporan berhasil dihapus.')
      setDeletingDoc(null)
      loadDocuments()
    } catch (err) {
      toast.error(err?.message || 'Gagal menghapus laporan.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBackToCatalog = () => {
    if (jenisToken) {
      navigate(buildCatModuleUrl('/layanan/fasilitasi-cat/laporan', jenisToken, filterToken))
    } else {
      navigate('/layanan/fasilitasi-cat/laporan')
    }
  }

  // Parse snapshot payload for instant on-the-fly rendering
  const parseSnapshotPayload = (row) => {
    if (!row) return null
    try {
      const params = typeof row.params === 'object' ? row.params : JSON.parse(row.params_json || '{}')
      const signers = typeof row.signers === 'object' ? row.signers : JSON.parse(row.signers_json || '{}')
      const evidenceMap = typeof row.evidence === 'object' ? row.evidence : JSON.parse(row.evidence_json || '{}')
      const snapshot = typeof row.data_snapshot === 'object' ? row.data_snapshot : JSON.parse(row.data_snapshot_json || '{}')

      return {
        row,
        params,
        signers,
        evidenceMap,
        tableData: snapshot.tableData || [],
        totalSummary: snapshot.totalSummary || { jumlah: 0, hadir: 0, tidakHadir: 0 },
        formattedInstansiNames: snapshot.formattedInstansiNames || 'INSTANSI DI WILAYAH KERJA KANREG III BKN',
        kegiatanNama: snapshot.kegiatanNama || row.nama_seleksi || 'Seleksi Pelaksanaan CAT BKN',
        tilokNama: snapshot.tilokNama || row.nama_tilok || 'KANTOR REGIONAL III BKN BANDUNG',
        calculatedHari: snapshot.calculatedHari || '',
        currentYear: snapshot.currentYear || new Date().getFullYear(),
      }
    } catch (err) {
      console.warn('Gagal parse snapshot payload:', err)
      return null
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* SERVICE HEADER */}
      <div className="no-print flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Sistem Informasi & Digitalisasi</span>
          </div>

          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {currentDocument?.title || 'Riwayat Laporan Pelaksanaan CAT'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Daftar riwayat laporan yang pernah dibuat. Seluruh dokumen disimpan dalam format data snapshot dan dapat diunduh ulang on-the-fly tanpa membebani penyimpanan server.
          </p>

          {decodedJenis && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">Jenis Tes:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700">
                <span>{decodedJenis.display_nama || decodedJenis.jenis_tes_nama}</span>
                {decodedJenis.periode && (
                  <span className="text-slate-400 font-semibold">({decodedJenis.periode})</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={handleBackToCatalog}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Kembali ke Katalog Dokumen"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Katalog Dokumen</span>
          </button>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenBuilder('builder')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Laporan Baru</span>
          </button>
        </div>
      </div>

      {/* BENTO KPI SUMMARY GRID (DILENGKAPI TOGGLE SHOW/HIDE) */}
      {showKpi && (
        <div className="animate-in fade-in duration-200">
          <PmaKpiGrid kpis={kpis} isLoading={loading} />
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={loadDocuments}
            className="px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold cursor-pointer shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* SUB-TOOLBAR & FILTER */}
      <ServiceFilterToolbar
        showMonthFilter={false}
        showAllCategory={false}
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val)
          setPage(1)
        }}
        categories={DOC_STATUS_CATEGORIES}
        activeCategory={statusFilter}
        onCategoryChange={(val) => {
          setStatusFilter(val)
          setPage(1)
        }}
        totalRecords={filteredRows.length}
        categoryCounts={categoryCounts}
        extraControls={
          <button
            type="button"
            onClick={toggleKpi}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
            title={showKpi ? 'Sembunyikan ringkasan KPI' : 'Tampilkan ringkasan KPI'}
          >
            {showKpi ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Sembunyikan KPI</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-3.5 h-3.5 text-[#175CD3]" />
                <span className="hidden sm:inline">Tampilkan KPI</span>
              </>
            )}
          </button>
        }
        placeholder="Cari nomor dokumen, judul laporan, nama penandatangan..."
      />

      {/* DATA TABLE (PEDOMAN_STANDARISASI_TABLE_MASTER.md - MAKS 5 KOLOM ADAPTIF) */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto clean-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Nomor &amp; Judul Laporan</th>
                <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Parameter Pelaksanaan</th>
                <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Penandatangan &amp; TTE</th>
                <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm font-medium">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-3.5 sm:px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-2.5 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3.5 sm:px-4">
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-3.5 sm:px-4">
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-3.5 sm:px-4 text-center">
                      <div className="h-5 w-16 mx-auto bg-slate-200 dark:bg-slate-800 rounded-full" />
                    </td>
                    <td className="py-4 px-3.5 sm:px-4 text-right">
                      <div className="h-7 w-24 ml-auto bg-slate-100 dark:bg-slate-800 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Belum Ada Riwayat Dokumen
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Klik tombol &quot;Buat Laporan Baru&quot; di atas untuk menyusun laporan CAT baru.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const statusMeta = STATUS_BADGE_MAP[row.status] || STATUS_BADGE_MAP.draft
                  const instansiText = Array.isArray(row.instansi_names) && row.instansi_names.length > 0
                    ? row.instansi_names.join(', ')
                    : 'Seluruh Instansi Tilok'
                  const tglDisplay = formatDateIndo(row.tanggal_pelaksanaan || row.tanggal_dokumen)

                  return (
                    <tr
                      key={row.uid || row.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Kolom 1: Nomor & Judul */}
                      <td className="py-3.5 px-3.5 sm:px-4">
                        <div className="flex items-start gap-3 max-w-[320px] xl:max-w-[380px]">
                          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-blue-50 text-[#175CD3] border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                              {row.judul_laporan || 'Laporan Pelaksanaan CAT'}
                            </div>
                            <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {row.nomor_dokumen || 'Tanpa Nomor Surat'}
                              </span>
                              <span>•</span>
                              <span>{tglDisplay}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Parameter Pelaksanaan */}
                      <td className="py-3.5 px-3.5 sm:px-4">
                        <div className="max-w-[220px] xl:max-w-[270px]">
                          <div
                            className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug text-xs sm:text-[13px]"
                            title={row.nama_seleksi}
                          >
                            {row.nama_seleksi || 'Seleksi CAT'}
                          </div>
                          <div
                            className="text-[11px] font-normal text-slate-400 dark:text-slate-500 truncate mt-0.5 flex items-center gap-1.5"
                            title={row.nama_tilok}
                          >
                            <span className="truncate">{row.nama_tilok || 'Titik Lokasi'}</span>
                          </div>
                          <div
                            className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1"
                            title={instansiText}
                          >
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{instansiText}</span>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 3: Penandatangan */}
                      <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {row.signers_summary?.kanan || row.created_by_name || 'Penandatangan Utama'}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          {row.signers_summary?.signed_count > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>{row.signers_summary.signed_count} TTE Terverifikasi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              <span>Belum Ada TTE</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kolom 4: Status */}
                      <td className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.cls}`}
                        >
                          {row.status === 'published' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{statusMeta.label}</span>
                        </span>
                      </td>

                      {/* Kolom 5: Aksi (Cluster Action Button) */}
                      <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          {/* Tombol Lihat / Pratinjau Dokumen On-The-Fly */}
                          <button
                            type="button"
                            onClick={() => {
                              const payload = parseSnapshotPayload(row)
                              if (payload) {
                                setPreviewDoc(payload)
                              } else {
                                toast.error('Format snapshot dokumen tidak valid.')
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300 transition-colors cursor-pointer"
                            title="Pratinjau & Unduh PDF On-The-Fly"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat PDF</span>
                          </button>

                          {/* Tombol Edit / Buka di Builder */}
                          <button
                            type="button"
                            onClick={() => handleOpenBuilder(row.uid)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Buka / Edit di Builder"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Tombol Hapus Dokumen */}
                          <button
                            type="button"
                            onClick={() => setDeletingDoc(row)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Laporan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <ServiceTablePagination
          page={page}
          pageSize={pageSize}
          totalRecords={filteredRows.length}
          onPageChange={setPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz)
            setPage(1)
          }}
        />
      </div>

      {/* MODAL PREVIEW & UNDUH PDF ON-THE-FLY DARI DATA SNAPSHOT DATABASE */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {previewDoc.row?.judul_laporan || 'Pratinjau Laporan CAT'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dokumen di-generate on-demand dari snapshot database ({previewDoc.row?.nomor_dokumen || 'Final'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body: Embedded PDF Previewer */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 clean-scrollbar bg-slate-100/60 dark:bg-slate-950/40">
              <DocumentPdfPreview
                fileName={`Laporan_${(previewDoc.kegiatanNama || 'CAT').replace(/\s+/g, '_')}_${previewDoc.params.tanggalPelaksanaan || 'Pelaksanaan'}.pdf`}
                title={`Pratinjau PDF: ${previewDoc.kegiatanNama || 'Laporan CAT'}`}
              >
                <CatLaporanTemplate
                  params={previewDoc.params}
                  calculatedHari={previewDoc.calculatedHari}
                  evidenceMap={previewDoc.evidenceMap}
                  signers={previewDoc.signers}
                  tableData={previewDoc.tableData}
                  totalSummary={previewDoc.totalSummary}
                  formattedInstansiNames={previewDoc.formattedInstansiNames}
                  kegiatanNama={previewDoc.kegiatanNama}
                  tilokNama={previewDoc.tilokNama}
                  currentYear={previewDoc.currentYear}
                />
              </DocumentPdfPreview>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS LAPORAN */}
      {deletingDoc && (
        <CatPengelolaConfirmModal
          isOpen={Boolean(deletingDoc)}
          onClose={() => setDeletingDoc(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          title="Hapus Laporan CAT"
          message={`Apakah Anda yakin ingin menghapus "${deletingDoc.judul_laporan || 'Laporan ini'}"? Data snapshot yang tersimpan di database akan dihapus.`}
          confirmLabel="Hapus Laporan"
        />
      )}
    </div>
  )
}
