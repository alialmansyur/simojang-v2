import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
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
  CalendarClock,
  UploadCloud,
  FileEdit,
  AlertCircle,
  X,
  Files,
} from 'lucide-react'
import { PmaKpiGrid } from '../../../components/shared/services/pma/PmaKpiGrid'
import { ServiceFilterToolbar } from '../../../components/shared/services/ServiceFilterToolbar'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { CatPengelolaGateGuard } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaGateGuard'
import { CatPengelolaHeader } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaHeader'
import { CatPengelolaConfirmModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaConfirmModal'
import { CatPengelolaDocCreateModal } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaDocCreateModal'
import {
  CAT_DOC_DETAILS,
  formatDateRangeId,
  formatTanggalId,
  formatRupiah,
} from '../../../components/shared/services/sidigi/cat/pengelola/pengelolaConstants'
import {
  fetchCatPengelolaDocuments,
  deleteCatPengelolaDocument,
  openCatPengelolaDocumentFileBlob,
} from '../../../services/api/sidigiCatServicesApi'
import {
  buildCatPengelolaDocBuilderUrl,
  decodeCatPengelolaDocTypeToken,
} from '../../../utils/catRouteToken'

const DOC_STATUS_CATEGORIES = [
  { value: 'all', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'generated', label: 'Siap Cetak' },
  { value: 'final', label: 'Final / Arsip' },
]

const STATUS_BADGE_MAP = {
  draft: {
    label: 'Draft',
    cls: 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300',
  },
  generated: {
    label: 'Siap Cetak',
    cls: 'bg-blue-50 text-[#175CD3] border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300',
  },
  final: {
    label: 'Final',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
}

function getInstansiDisplayText(row) {
  const list = Array.isArray(row?.instansi_list) ? row.instansi_list : []
  if (list.length > 0) {
    return list
      .map((i) => i.instansi_nama || i.nama || '')
      .filter(Boolean)
      .join(', ')
  }
  return row?.instansi_nama || 'Belum ditentukan'
}

function DokumenDetailContent() {
  const { docType: rawDocTypeToken = 'sp' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const docType = useMemo(() => {
    const decoded = decodeCatPengelolaDocTypeToken(rawDocTypeToken)
    if (decoded && CAT_DOC_DETAILS[decoded]) return decoded
    if (CAT_DOC_DETAILS[rawDocTypeToken]) return rawDocTypeToken
    return 'sp'
  }, [rawDocTypeToken])

  const jadwalIdParam = searchParams.get('jadwal_id') || ''

  const [rows, setRows] = useState([])
  const [docTypeMeta, setDocTypeMeta] = useState(null)
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceModeFilter, setSourceModeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [inspectDoc, setInspectDoc] = useState(null)
  const [deletingDoc, setDeletingDoc] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const res = await fetchCatPengelolaDocuments({
        doc_type: docType,
        jadwal_id: jadwalIdParam,
        limit: 200,
      })
      setRows(Array.isArray(res?.rows) ? res.rows : [])
      setDocTypeMeta(res?.docTypeMeta || null)
      setSummary(res?.summary || {})
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memuat daftar dokumen.')
    } finally {
      setLoading(false)
    }
  }, [docType, jadwalIdParam])

  useEffect(() => {
    let active = true
    fetchCatPengelolaDocuments({
      doc_type: docType,
      jadwal_id: jadwalIdParam,
      limit: 200,
    })
      .then((res) => {
        if (!active) return
        setErrorMsg('')
        setRows(Array.isArray(res?.rows) ? res.rows : [])
        setDocTypeMeta(res?.docTypeMeta || null)
        setSummary(res?.summary || {})
      })
      .catch((err) => {
        if (active) setErrorMsg(err?.message || 'Gagal memuat daftar dokumen.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [docType, jadwalIdParam])

  const categoryCounts = useMemo(() => {
    const counts = { all: rows.length, draft: 0, generated: 0, final: 0 }
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
    if (sourceModeFilter !== 'all') {
      list = list.filter((r) => (r.source_mode || 'builder') === sourceModeFilter)
    }
    const q = searchTerm.trim().toLowerCase()
    if (q) {
      list = list.filter((r) =>
        [
          r.doc_number,
          r.title,
          r.nama_jadwal,
          r.nama_tilok,
          r.nama_seleksi,
          r.jenis_tes_nama,
          getInstansiDisplayText(r),
          r.original_filename,
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q))
      )
    }
    return list
  }, [rows, statusFilter, sourceModeFilter, searchTerm])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const detailMeta = useMemo(() => CAT_DOC_DETAILS[docType] || {}, [docType])
  const pageTitle = docTypeMeta?.name || detailMeta.title || `Dokumen ${docType.toUpperCase()}`

  const kpis = useMemo(() => {
    const total = Number(summary?.total ?? rows.length)
    const builderCount = Number(
      summary?.total_builder ?? rows.filter((r) => (r.source_mode || 'builder') === 'builder').length
    )
    const uploadCount = Number(
      summary?.total_upload ?? rows.filter((r) => r.source_mode === 'upload').length
    )
    const readyCount = rows.filter((r) => r.status === 'generated' || r.status === 'final').length

    return [
      {
        label: `Total ${detailMeta.short || 'Dokumen'}`,
        value: total,
        unit: 'dokumen',
        context: jadwalIdParam ? `Terikat Jadwal #${jadwalIdParam}` : pageTitle,
        badge: detailMeta.short || docType.toUpperCase(),
        badgeColor: 'blue',
        icon: Files,
      },
      {
        label: 'Mode Input (Builder)',
        value: builderCount,
        unit: 'berkas',
        context: 'Disusun & pratinjau di builder',
        badge: 'Interactive',
        badgeColor: 'emerald',
        icon: FileEdit,
      },
      {
        label: 'Mode Upload (Arsip)',
        value: uploadCount,
        unit: 'file PDF',
        context: 'Dokumen lama hasil unggah PDF',
        badge: 'PDF Arsip',
        badgeColor: 'indigo',
        icon: UploadCloud,
      },
      {
        label: 'Siap Cetak / Final',
        value: readyCount,
        unit: 'dokumen',
        context: 'Status generated atau final',
        badge: 'Tervalidasi',
        badgeColor: 'amber',
        icon: CheckCircle2,
      },
    ]
  }, [summary, rows, detailMeta, docType, jadwalIdParam, pageTitle])

  const openDocWorkspace = (row) => {
    if (!row?.uid) return
    if (row.source_mode === 'upload') {
      openCatPengelolaDocumentFileBlob(row.uid, false).catch((err) =>
        setErrorMsg(err?.message || 'Gagal membuka file PDF arsip.')
      )
      return
    }
    navigate(buildCatPengelolaDocBuilderUrl(row.doc_type || docType, row.uid, jadwalIdParam))
  }

  const handleConfirmDelete = async () => {
    if (!deletingDoc?.uid) return
    try {
      setIsDeleting(true)
      await deleteCatPengelolaDocument(deletingDoc.uid)
      setDeletingDoc(null)
      if (inspectDoc?.uid === deletingDoc.uid) setInspectDoc(null)
      await loadDocuments()
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menghapus dokumen.')
    } finally {
      setIsDeleting(false)
    }
  }

  const modeFilterControls = (
    <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
      {[
        { key: 'all', label: 'Semua Mode' },
        { key: 'builder', label: 'Builder' },
        { key: 'upload', label: 'Upload PDF' },
      ].map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => {
            setSourceModeFilter(opt.key)
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            sourceModeFilter === opt.key
              ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <CatPengelolaHeader
        title={pageTitle}
        description={
          detailMeta.description ||
          'Catat data baru menggunakan Builder atau Upload PDF Lama. Klik jadwal / baris dokumen mode Builder untuk masuk ke halaman builder terpisah.'
        }
        backTo={
          jadwalIdParam
            ? `/layanan/fasilitasi-cat/pengelola/dokumen?jadwal_id=${encodeURIComponent(jadwalIdParam)}`
            : '/layanan/fasilitasi-cat/pengelola/dokumen'
        }
        backLabel="Katalog Dokumen"
        onReload={loadDocuments}
        isReloading={loading}
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1248A8] text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data</span>
          </button>
        }
      />

      {jadwalIdParam && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/40 text-xs text-sky-800 dark:text-sky-300">
          <span>
            Filter Konteks Jadwal: <strong>Jadwal #{jadwalIdParam}</strong>
          </span>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="font-bold underline cursor-pointer"
          >
            Tampilkan Semua Jadwal
          </button>
        </div>
      )}

      <PmaKpiGrid kpis={kpis} isLoading={loading} />

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
        extraControls={modeFilterControls}
        placeholder="Cari judul dokumen, nomor surat, nama jadwal, tilok, atau instansi..."
      />

      {/* Tabel Standar SSOT (Maks 5 Kolom, Klik Jadwal -> Builder) */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto clean-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Jadwal &amp; Dokumen</th>
                <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Tilok &amp; Instansi</th>
                <th className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">Tanggal &amp; Mode</th>
                <th className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm font-medium">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
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
                      <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
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
                        Belum Ada Data {pageTitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Klik tombol &quot;Tambah Data&quot; untuk membuat dokumen baru dengan Builder atau mengunggah file PDF arsip.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const isUpload = row.source_mode === 'upload'
                  const instansiText = getInstansiDisplayText(row)
                  const cleanedTilok = (row.nama_tilok || 'Titik Lokasi Belum Ditentukan').replace(
                    /^Tilok\s+/i,
                    ''
                  )
                  const jadwalLabel = row.nama_jadwal || row.title || 'Dokumen Tanpa Jadwal'
                  const subtitle = [
                    row.doc_number || 'Belum ada nomor',
                    row.jenis_tes_nama,
                    row.nama_seleksi,
                  ]
                    .filter(Boolean)
                    .join(' • ')
                  const statusMeta = STATUS_BADGE_MAP[row.status] || STATUS_BADGE_MAP.draft

                  return (
                    <tr
                      key={row.uid || row.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Kolom 1: Jadwal & Dokumen (Klik langsung menuju halaman Builder / PDF) */}
                      <td className="py-3.5 px-3.5 sm:px-4">
                        <button
                          type="button"
                          onClick={() => openDocWorkspace(row)}
                          className="group flex items-start gap-3 max-w-[300px] xl:max-w-[360px] text-left cursor-pointer"
                          title={
                            isUpload
                              ? 'Klik untuk pratinjau PDF arsip'
                              : 'Klik untuk membuka halaman Builder & Pratinjau dokumen'
                          }
                        >
                          <div
                            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border mt-0.5 ${
                              isUpload
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200/60 dark:bg-indigo-950/50 dark:text-indigo-400'
                                : 'bg-blue-50 text-[#175CD3] border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400'
                            }`}
                          >
                            {isUpload ? (
                              <UploadCloud className="w-4 h-4" />
                            ) : (
                              <CalendarClock className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#175CD3] dark:group-hover:text-blue-400 leading-snug line-clamp-2 transition-colors">
                              {jadwalLabel}
                            </div>
                            <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              {subtitle}
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* Kolom 2: Tilok & Instansi (Terstandarisasi dengan Halaman Jadwal) */}
                      <td className="py-3.5 px-3.5 sm:px-4">
                        <div className="max-w-[200px] xl:max-w-[250px]">
                          <div
                            className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug text-xs sm:text-[13px]"
                            title={cleanedTilok}
                          >
                            {cleanedTilok}
                          </div>
                          <div
                            className="text-[11px] font-normal text-slate-400 dark:text-slate-500 truncate mt-0.5 flex items-center gap-1.5"
                            title={instansiText}
                          >
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{instansiText}</span>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 3: Tanggal & Mode */}
                      <td className="py-3.5 px-3.5 sm:px-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {row.doc_date ? formatTanggalId(row.doc_date) : '-'}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isUpload
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                                : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                            }`}
                          >
                            {isUpload ? 'Arsip Upload' : 'Builder'}
                          </span>
                          {!isUpload && Number(row.personel_count || 0) > 0 && (
                            <span className="text-[10px] text-slate-400">
                              {row.personel_count} tim
                            </span>
                          )}
                          {isUpload && row.original_filename && (
                            <span
                              className="text-[10px] text-slate-400 max-w-[110px] truncate"
                              title={row.original_filename}
                            >
                              {row.original_filename}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kolom 4: Status */}
                      <td className="py-3.5 px-3.5 sm:px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.cls}`}
                        >
                          {row.status === 'final' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{statusMeta.label}</span>
                        </span>
                      </td>

                      {/* Kolom 5: Aksi */}
                      <td className="py-3.5 px-3.5 sm:px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openDocWorkspace(row)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              isUpload
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                                : 'bg-blue-50 hover:bg-blue-100 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300'
                            }`}
                            title={isUpload ? 'Pratinjau PDF' : 'Buka Builder Dokumen'}
                          >
                            {isUpload ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat PDF</span>
                              </>
                            ) : (
                              <>
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Builder</span>
                              </>
                            )}
                          </button>

                          {isUpload && (
                            <button
                              type="button"
                              onClick={() => openCatPengelolaDocumentFileBlob(row.uid, true)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                              title="Unduh file PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setInspectDoc(row)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Detail & keterangan dokumen"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingDoc(row)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Hapus dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      <ServiceTablePagination
        page={page}
        pageSize={pageSize}
        total={filteredRows.length}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next)
          setPage(1)
        }}
        unitLabel="dokumen"
      />

      {/* Modal Tambah Data (Builder vs Upload Dropzone) */}
      <CatPengelolaDocCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        docType={docType}
        docTypeMeta={docTypeMeta}
        defaultJadwalId={jadwalIdParam}
        onCreated={async (createdDoc, mode, openBuilderImmediately) => {
          await loadDocuments()
          if (openBuilderImmediately && createdDoc?.uid && mode === 'builder') {
            navigate(
              buildCatPengelolaDocBuilderUrl(
                createdDoc.doc_type || docType,
                createdDoc.uid,
                jadwalIdParam
              )
            )
          }
        }}
      />

      {/* Modal Detail & Keterangan Dokumen */}
      {inspectDoc && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs modal-backdrop-animated"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectDoc(null)
          }}
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-xs modal-dialog-animated">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#175CD3]">
                  Ringkasan Parameter Dokumen
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {inspectDoc.title || pageTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectDoc(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[10px] text-slate-400 font-semibold">Nomor Dokumen</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {inspectDoc.doc_number || '-'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[10px] text-slate-400 font-semibold">Tanggal Dokumen</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {inspectDoc.doc_date ? formatTanggalId(inspectDoc.doc_date) : '-'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[10px] text-slate-400 font-semibold">Jadwal Terkait</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {inspectDoc.nama_jadwal || '-'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatDateRangeId(inspectDoc.jadwal_tgl_mulai, inspectDoc.jadwal_tgl_selesai)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[10px] text-slate-400 font-semibold">Nominal / Tim</div>
                  <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {Number(inspectDoc.total_nominal || 0) > 0
                      ? formatRupiah(inspectDoc.total_nominal)
                      : `${Number(inspectDoc.personel_count || 0)} personel`}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="text-[10px] text-slate-400 font-semibold">Instansi Terkait</div>
                <div className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                  {getInstansiDisplayText(inspectDoc)}
                </div>
              </div>

              {inspectDoc.notes && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[10px] text-slate-400 font-semibold">Keterangan</div>
                  <div className="text-slate-700 dark:text-slate-200 mt-0.5">{inspectDoc.notes}</div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInspectDoc(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = inspectDoc
                  setInspectDoc(null)
                  openDocWorkspace(target)
                }}
                className="px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1248A8] text-white font-bold cursor-pointer"
              >
                {inspectDoc.source_mode === 'upload' ? 'Pratinjau PDF' : 'Buka Halaman Builder'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Konfirmasi Hapus */}
      <CatPengelolaConfirmModal
        isOpen={Boolean(deletingDoc)}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Hapus Dokumen CAT?"
        message={`Dokumen "${deletingDoc?.title || deletingDoc?.doc_number || 'ini'}" beserta daftar personel dan tanda tangannya akan dihapus permanen.`}
        confirmLabel="Ya, Hapus Dokumen"
      />
    </div>
  )
}

export default function FasilitasiCatPengelolaDokumenDetailPage() {
  return (
    <CatPengelolaGateGuard>
      <DokumenDetailContent />
    </CatPengelolaGateGuard>
  )
}
