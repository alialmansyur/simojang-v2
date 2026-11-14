import { useState } from 'react'
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
  Layers,
} from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { EkinUploadModal } from './components/EkinUploadModal'
import { EkinDetailModal } from './components/EkinDetailModal'
import { EkinFormModal } from './components/EkinFormModal'
import {
  fetchEkinSummary,
  fetchEkinData,
  deleteEkinData,
  storeEkinBatch,
} from '../../../services/api/tuServicesApi'

export default function EkinPage() {
  const [selectedLog, setSelectedLog] = useState(null)
  const [manualEditItem, setManualEditItem] = useState(null)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)

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

  const columns = [
    { header: 'LOG E-KINERJA' },
    { header: 'SUB UNIT' },
    { header: 'PARTISIPASI ASN' },
    { header: 'REALISASI' },
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
    const totalKeg = Number(item.total_kegiatan || 0)
    const totalReal = Number(item.total_realisasi || 0)
    const pct = totalKeg > 0 ? Math.min(100, Math.round((totalReal / totalKeg) * 100)) : 100
    const displayDate = item.period_date_label || formatDate(item.period_date)

    return (
      <tr
        key={item.period_date || item.id || rowNo}
        className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors"
      >
        {/* Kolom 1: LOG E-KINERJA */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <TuDataOriginIcon isExcel={true} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setSelectedLog(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={displayDate}
              >
                Log Kinerja Harian ASN
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{item.total_upload ? `${item.total_upload} Berkas Terunggah` : `${formatNumber(item.total_kegiatan)} Aktivitas`}</span>
                <span>•</span>
                <span>E-Kinerja BKN</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: SUB UNIT */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[140px]">{item.total_sub_unit ? `${item.total_sub_unit} Sub Unit` : 'Tata Usaha'}</span>
          </span>
        </td>

        {/* Kolom 3: PARTISIPASI ASN */}
        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white">{formatNumber(item.total_nip)}</span>
            <span>Pegawai</span>
          </div>
        </td>

        {/* Kolom 4: REALISASI */}
        <td className="px-4 py-3.5 whitespace-nowrap w-44">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="text-slate-600 dark:text-slate-400">
              {formatNumber(item.total_realisasi)} Selesai
            </span>
            <span className="text-[#175CD3] dark:text-blue-400 font-mono">{pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-[#175CD3]' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuTanggalCell value={item.period_date || item.created_at} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuPetugasCell value={item.petugas || item.created_by || 'Admin E-Kinerja'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="px-4 py-3.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedLog(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Rincian Data Excel"
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
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Data Log Periode Ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      <TuCrudLayoutShell
        layananId={36}
        serviceTitle="Manajemen E-Kinerja"
        shortTitle="E-Kinerja Pegawai"
        description="Monitoring dan evaluasi realisasi kinerja harian pegawai."
        timKerjaTitle="Tata Usaha"
        timKerjaPath="/tim-kerja/tu"
        templateUrl="/templates/tu/template-ekin.xlsx"
        templateName="template-ekin.xlsx"
        fetchSummaryFn={fetchEkinSummary}
        fetchDataFn={fetchEkinData}
        deleteDataFn={deleteEkinData}
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
          }}
          item={manualEditItem}
        />
      )}
    </>
  )
}
