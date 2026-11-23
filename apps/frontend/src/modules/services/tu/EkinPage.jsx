import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import {
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  Eye,
  Pencil,
  Trash2,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { TuDeleteConfirmDialog } from '../../../components/shared/services/tu/TuDeleteConfirmDialog'
import { EkinUploadModal } from './components/EkinUploadModal'
import { EkinDetailModal } from './components/EkinDetailModal'
import { EkinFormModal } from './components/EkinFormModal'
import {
  fetchEkinSummary,
  fetchEkinData,
  deleteEkinData,
  storeEkinBatch,
  fetchEkinChild,
} from '../../../services/api/tuServicesApi'

const STANDARD_SUB_UNITS = [
  { key: 'kepegawaian', shortLabel: 'Kepegawaian', match: 'Kepegawaian' },
  { key: 'keuangan', shortLabel: 'Perenc. & Keu', match: 'Perencanaan dan Keuangan' },
  { key: 'umum', shortLabel: 'Umum', match: 'Umum' },
  { key: 'tu', shortLabel: 'Bagian TU', match: 'Bagian Tata Usaha' },
  { key: 'serang', shortLabel: 'UPT Serang', match: 'Serang' },
]

export default function EkinPage() {
  const [selectedLog, setSelectedLog] = useState(null)
  const [manualEditItem, setManualEditItem] = useState(null)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)

  // State: Delete child upload confirmation
  const [deletingChild, setDeletingChild] = useState(null)
  const [isDeletingChild, setIsDeletingChild] = useState(false)
  const [shellRefreshKey, setShellRefreshKey] = useState(0)

  // Expand accordion state per period_date
  const [expandedDates, setExpandedDates] = useState({})
  const [childCache, setChildCache] = useState({})
  const [loadingDates, setLoadingDates] = useState({})

  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(Number(num || 0))

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const loadChildData = useCallback(async (periodDate) => {
    if (!periodDate) return []
    setLoadingDates((prev) => ({ ...prev, [periodDate]: true }))
    try {
      const list = await fetchEkinChild(periodDate)
      const resolvedList = Array.isArray(list) ? list : []
      setChildCache((prev) => ({ ...prev, [periodDate]: resolvedList }))
      return resolvedList
    } catch (err) {
      console.warn('Gagal load child ekin:', err)
      setChildCache((prev) => ({ ...prev, [periodDate]: [] }))
      return []
    } finally {
      setLoadingDates((prev) => ({ ...prev, [periodDate]: false }))
    }
  }, [])

  const toggleExpand = useCallback(async (periodDate) => {
    if (!periodDate) return
    const isCurrentlyExpanded = !!expandedDates[periodDate]

    if (isCurrentlyExpanded) {
      setExpandedDates((prev) => ({ ...prev, [periodDate]: false }))
      return
    }

    setExpandedDates((prev) => ({ ...prev, [periodDate]: true }))

    // If already cached, don't fetch again
    if (childCache[periodDate]) return
    await loadChildData(periodDate)
  }, [expandedDates, childCache, loadChildData])

  const handleConfirmDeleteChild = async () => {
    if (!deletingChild) return
    const deleteKey = deletingChild.ekin_key || deletingChild.id
    if (!deleteKey) {
      toast.error('Kunci data berkas tidak ditemukan.')
      return
    }

    try {
      setIsDeletingChild(true)
      const res = await deleteEkinData(deleteKey)
      if (res?.status === false || res?.error) {
        throw new Error(res?.message || 'Gagal menghapus berkas E-Kinerja.')
      }

      toast.success('Berkas E-Kinerja unit berhasil dihapus.')
      const targetDate = deletingChild.period_date
      setDeletingChild(null)

      // Reload child data for this date
      if (targetDate) {
        setChildCache((prev) => {
          const updated = { ...prev }
          delete updated[targetDate]
          return updated
        })
        await loadChildData(targetDate)
      }

      // Refresh parent summary and list
      setShellRefreshKey((prev) => prev + 1)
    } catch (err) {
      console.error('Gagal menghapus berkas:', err)
      toast.error(err.message || 'Gagal menghapus berkas E-Kinerja.')
    } finally {
      setIsDeletingChild(false)
    }
  }

  const categories = [
    { value: '', label: 'Semua Tim Kerja' },
    { value: 'Kepegawaian', label: 'Kepegawaian' },
    { value: 'Perencanaan dan Keuangan', label: 'Perencanaan & Keuangan' },
    { value: 'Umum', label: 'Umum' },
    { value: 'Bagian Tata Usaha', label: 'Tata Usaha' },
    { value: 'Serang', label: 'UPSCP Serang' },
  ]

  const renderKpis = (summary) => [
    {
      id: 'total_data',
      label: 'TOTAL LOG TERUNGGAH',
      value: summary?.total_data ?? 0,
      unit: 'Log',
      context: 'Arsip batch log e-Kinerja',
      badge: '100% Tercatat',
      badgeColor: 'blue',
      icon: FileSpreadsheet,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_harian',
      label: 'HARI KERJA TERLAPOR',
      value: summary?.total_harian ?? 0,
      unit: 'Hari',
      context: 'Hari kerja dengan entri kinerja',
      badge: 'Periode Aktif',
      badgeColor: 'indigo',
      icon: Calendar,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'total_nip',
      label: 'PEGAWAI AKTIF E-KIN',
      value: summary?.total_nip ?? 0,
      unit: 'Pegawai',
      context: 'Partisipasi ASN pelapor kinerja',
      badge: 'Kepatuhan SKP',
      badgeColor: 'emerald',
      icon: Users,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_realisasi',
      label: 'KEGIATAN SELESAI',
      value: summary?.total_realisasi ?? 0,
      unit: 'Aktivitas',
      context: 'Capaian tuntas terverifikasi',
      badge: 'Terealisasi',
      badgeColor: 'amber',
      icon: CheckCircle2,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  // Kolom REALISASI dihilangkan sesuai permintaan user
  const columns = [
    { header: 'PERIODE HARIAN' },
    { header: 'STATUS KELENGKAPAN SUB UNIT' },
    { header: 'PARTISIPASI ASN' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const handleOpenManualForDate = (item) => {
    setManualEditItem({
      period_date: item.period_date,
      tanggal_kegiatan: item.period_date,
    })
    setIsManualModalOpen(true)
  }

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const isExpanded = !!expandedDates[item.period_date]
    const isLoadingChild = !!loadingDates[item.period_date]
    const childList = childCache[item.period_date] || []
    const displayDate = item.period_date_label || formatDate(item.period_date)

    // Check which sub-units are uploaded for this date
    const subUnitStr = (item.sub_unit_list || '').toLowerCase()

    return (
      <>
        {/* Main Date Group Row */}
        <tr
          key={item.period_date || item.id || rowNo}
          className={`transition-colors border-b border-slate-100 dark:border-slate-800 ${
            isExpanded
              ? 'bg-blue-50/40 dark:bg-slate-800/60'
              : 'hover:bg-slate-50/75 dark:hover:bg-slate-800/30'
          }`}
        >
          {/* Kolom 1: PERIODE HARIAN (Grouping Tanggal & Toggle Accordion) */}
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => toggleExpand(item.period_date)}
                className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  isExpanded
                    ? 'bg-blue-100 text-[#175CD3] dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isExpanded ? 'Tutup Rincian Sub Unit' : 'Lihat Rincian Sub Unit Terunggah'}
              >
                {isLoadingChild ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              <TuDataOriginIcon isExcel={true} />

              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedLog(item)}
                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                  title={displayDate}
                >
                  {displayDate}
                </button>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="text-[#175CD3] dark:text-blue-400">
                    {item.total_upload ? `${item.total_upload} Berkas Upload` : 'Log Harian'}
                  </span>
                </div>
              </div>
            </div>
          </td>

          {/* Kolom 2: STATUS KELENGKAPAN 5 SUB UNIT */}
          <td className="px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {STANDARD_SUB_UNITS.map((su) => {
                const isUploaded = subUnitStr.includes(su.match.toLowerCase())
                return (
                  <span
                    key={su.key}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                      isUploaded
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40'
                        : 'bg-rose-50 text-rose-600 border-rose-200/70 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 opacity-75'
                    }`}
                    title={
                      isUploaded
                        ? `${su.shortLabel}: Sudah Terunggah`
                        : `${su.shortLabel}: Belum Diunggah pada tanggal ini`
                    }
                  >
                    {isUploaded ? (
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    )}
                    <span>{su.shortLabel}</span>
                  </span>
                )
              })}
            </div>
          </td>

          {/* Kolom 3: PARTISIPASI ASN */}
          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatNumber(item.total_nip)}
              </span>
              <span>Pegawai</span>
            </div>
          </td>

          {/* Kolom 4: TANGGAL */}
          <td className="px-4 py-3.5 whitespace-nowrap">
            <TuTanggalCell value={item.period_date || item.created_at} />
          </td>

          {/* Kolom 5: PETUGAS */}
          <td className="px-4 py-3.5 whitespace-nowrap">
            <TuPetugasCell value={item.petugas || item.created_by || 'Admin E-Kinerja'} />
          </td>

          {/* Kolom 6: AKSI */}
          <td className="px-4 py-3.5 text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedLog(item)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                title="Lihat Semua Aktivitas Tanggal Ini"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenManualForDate(item)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                title="Tambah / Koreksi Kegiatan Manual"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {/* Expandable Child Table (Per Unit Detail Upload Breakdown) */}
        {isExpanded && (
          <tr className="bg-slate-50/80 dark:bg-slate-850/60 border-b border-slate-200/80 dark:border-slate-800">
            <td colSpan={columns.length} className="px-6 py-3.5">
              {isLoadingChild ? (
                <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-[#175CD3]" />
                  <span>Memuat daftar berkas upload per unit...</span>
                </div>
              ) : childList.length === 0 ? (
                <div className="py-2.5 text-xs text-slate-500 italic">
                  Belum ada berkas terunggah yang tercatat untuk tanggal {displayDate}.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Daftar Berkas Terunggah per Sub Unit ({childList.length} Berkas)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Klik ikon detail untuk membuka rincian kegiatan unit terkait
                    </span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-800/20">
                        <th className="px-3.5 py-2">SUB UNIT</th>
                        <th className="px-3.5 py-2">BERKAS EXCEL</th>
                        <th className="px-3.5 py-2 text-center">PEGAWAI</th>
                        <th className="px-3.5 py-2 text-center">TOTAL AKTIVITAS</th>
                        <th className="px-3.5 py-2">WAKTU UPLOAD</th>
                        <th className="px-3.5 py-2 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {childList.map((ch) => (
                        <tr
                          key={ch.ekin_key || ch.id}
                          className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{ch.sub_unit || ch.unit || 'Tata Usaha'}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1 max-w-[200px] truncate" title={ch.file_name}>
                              <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{ch.file_name || '-'}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                            {formatNumber(ch.total_nip)} ASN
                          </td>
                          <td className="px-3.5 py-2.5 text-center font-semibold text-blue-600 dark:text-blue-400">
                            {formatNumber(ch.total_kegiatan)}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                            {ch.created_at || '-'}
                          </td>
                          <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLog({
                                    ...ch,
                                    period_date: item.period_date,
                                    period_date_label: displayDate,
                                    target_sub_unit: ch.sub_unit,
                                    key: ch.ekin_key || ch.id,
                                  })
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
                                title="Lihat Data Detail Aktivitas Sub Unit Ini"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail Unit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeletingChild({
                                    ...ch,
                                    period_date: item.period_date,
                                    period_date_label: displayDate,
                                  })
                                }
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title={`Hapus Berkas ${ch.sub_unit || ch.file_name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </td>
          </tr>
        )}
      </>
    )
  }

  return (
    <>
      <TuCrudLayoutShell
        key={shellRefreshKey}
        layananId={36}
        serviceTitle="Manajemen E-Kinerja"
        shortTitle="E-Kinerja Pegawai"
        description="Monitoring kelengkapan unggahan dan evaluasi realisasi kinerja harian pegawai."
        timKerjaTitle="Tata Usaha"
        timKerjaPath="/tim-kerja/tu"
        templateUrl="/templates/tu/template-ekin.xlsx"
        templateName="template-ekin.xlsx"
        fetchSummaryFn={fetchEkinSummary}
        fetchDataFn={fetchEkinData}
        deleteDataFn={null}
        batchUploadFn={storeEkinBatch}
        UploadModalComponent={EkinUploadModal}
        FormComponent={EkinFormModal}
        isPrimaryUpload={false}
        addNewLabel="Input Data"
        batchUploadLabel="Upload Data"
        categories={categories}
        renderKpis={renderKpis}
        columns={columns}
        renderRow={renderRow}
        searchPlaceholder="Cari tanggal kegiatan, sub-unit, NIP pegawai..."
      />

      {/* Detail Rincian Aktivitas Modal */}
      {selectedLog && (
        <EkinDetailModal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          logItem={selectedLog}
          onEditItem={(act) => {
            setManualEditItem(act)
            setIsManualModalOpen(true)
          }}
        />
      )}

      {/* Secondary Direct Manual Entry Modal triggered from table row or detail */}
      {isManualModalOpen && (
        <EkinFormModal
          isOpen={isManualModalOpen}
          onClose={() => {
            setIsManualModalOpen(false)
            setManualEditItem(null)
          }}
          onSuccess={() => {
            setIsManualModalOpen(false)
            setManualEditItem(null)
            setShellRefreshKey((prev) => prev + 1)
          }}
          item={manualEditItem}
        />
      )}

      {/* Delete Child Confirmation Dialog */}
      <TuDeleteConfirmDialog
        isOpen={!!deletingChild}
        onClose={() => !isDeletingChild && setDeletingChild(null)}
        onConfirm={handleConfirmDeleteChild}
        isLoading={isDeletingChild}
        title="Konfirmasi Hapus Berkas E-Kinerja"
        message={
          deletingChild
            ? `Apakah Anda yakin ingin menghapus data berkas "${deletingChild.file_name || 'E-Kinerja'}" (${deletingChild.sub_unit || 'Unit Terkait'}) pada tanggal ${deletingChild.period_date_label || deletingChild.period_date}? Seluruh data aktivitas pegawai pada berkas ini akan dihapus permanen.`
            : 'Apakah Anda yakin ingin menghapus data berkas ini?'
        }
      />
    </>
  )
}
