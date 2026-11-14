import { Edit3, Trash2, Eye, Building2, Layers, FileSpreadsheet, Clock, AlertTriangle, ShieldAlert, User } from 'lucide-react'
import { SidigiCrudLayoutShell } from '../../../components/shared/services/sidigi/SidigiCrudLayoutShell'
import { SidigiDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/sidigi/SidigiDataOriginIcon'
import { SidigiTanggalCell, SidigiPetugasCell } from '../../../components/shared/services/sidigi/SidigiTableCells'
import { DisparitasFormModal } from '../../../components/shared/services/sidigi/DisparitasFormModal'
import {
  fetchDisparitasSummary,
  fetchDisparitasData,
  fetchDisparitasDetail,
  deleteDisparitasData,
  importBatchDisparitas,
} from '../../../services/api/sidigiServicesApi'

export default function DisparitasDataPage() {
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

  const renderKpis = (summary) => [
    {
      id: 'total_file',
      label: 'TOTAL FILE',
      value: summary?.total_upload ?? 0,
      unit: 'File',
      context: 'Arsip log disparitas',
      badge: '100% Total',
      badgeColor: 'sky',
      icon: FileSpreadsheet,
      iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    },
    {
      id: 'total_anomali',
      label: 'TOTAL ANOMALI DATA',
      value: summary?.total_anomali ?? 0,
      unit: 'Anomali',
      context: 'Ketidaksesuaian data terdeteksi',
      badge: 'Perhatian',
      badgeColor: 'rose',
      icon: AlertTriangle,
      iconColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    },
    {
      id: 'total_instansi',
      label: 'INSTANSI TERDAMPAK',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Instansi daerah Jabar & Banten',
      badge: 'Jabar & Banten',
      badgeColor: 'amber',
      icon: Building2,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'last_upload',
      label: 'UPLOAD TERAKHIR',
      value: formatDate(summary?.last_update),
      unit: '',
      isText: true,
      context: 'Sinkronisasi anomali',
      badge: 'Terbaru',
      badgeColor: 'indigo',
      icon: Clock,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  const columns = [
    { header: 'BERKAS & PERIODE SINKRON' },
    { header: 'KATEGORI ANOMALI' },
    { header: 'STATUS ANOMALI' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onDetail) => {
    return (
      <tr
        key={item.id}
        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Kolom 1: BERKAS & PERIODE SINKRON */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <SidigiDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onDetail && onDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.file_name}
              >
                {item.file_name || 'Berkas Data Disparitas'}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Periode {item.period || '-'}
                </span>
                <span>•</span>
                <span>{(Number(item.file_size || 0) / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: KATEGORI ANOMALI */}
        <td className="py-3 px-4 sm:px-5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 whitespace-nowrap">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>{item.jenis_anomali_single || item.jenis || 'Unifikasi Data'}</span>
          </span>
        </td>

        {/* Kolom 3: STATUS ANOMALI */}
        <td className="py-3 px-4 sm:px-5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 whitespace-nowrap">
            {formatNumber(item.total || item.jumlah || 0)} Anomali
          </span>
        </td>

        {/* Kolom 4: TANGGAL */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiTanggalCell
            value={item.created_at || item.period_start_date || item.period_date}
            subValue={`Tarikan: ${formatDate(item.period_start_date || item.period_date)} s.d. ${formatDate(item.period_end_date || item.period_date)}`}
          />
        </td>

        {/* Kolom 5: PETUGAS */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiPetugasCell value={item.created_by || 'Admin SIDIGI'} />
        </td>

        {/* Kolom 6: AKSI */}
        <td className="py-3 px-4 sm:px-5 text-right">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onDetail && onDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Anomali per Instansi"
            >
              <Eye className="w-4 h-4" />
            </button>
            {!isExcelOrigin(item) && (
              <button
                type="button"
                onClick={() => onEdit && onEdit(item)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="Edit Data Disparitas"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Data Disparitas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const categories = [
    { value: 'all', label: 'Semua Anomali' },
    { value: 'Unor', label: 'Unor & Jabatan' },
    { value: 'Golongan', label: 'Pangkat & Golongan' },
    { value: 'Duplikasi', label: 'Duplikasi NIP / NIK' },
    { value: 'Pendidikan', label: 'Pendidikan' },
  ]

  return (
    <SidigiCrudLayoutShell
      layananId={23}
      serviceTitle="Pendampingan Peningkatan Kualitas Data ASN"
      shortTitle="Disparitas Data"
      timKerjaTitle="Sistem Informasi & Digitalisasi"
      description="Monitoring disparitas unifikasi data ASN dan pendampingan penyelesaian anomali data di wilayah Kanreg III BKN."
      templateUrl="/templates/sidigi/template-disparitas-data.xlsx"
      templateName="template-disparitas-data.xlsx"
      fetchSummaryFn={fetchDisparitasSummary}
      fetchDataFn={fetchDisparitasData}
      fetchDetailFn={fetchDisparitasDetail}
      deleteDataFn={deleteDisparitasData}
      batchUploadFn={importBatchDisparitas}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={DisparitasFormModal}
      detailType="disparitas"
      categories={categories}
      defaultCategory="all"
      searchPlaceholder="Cari nama berkas, anomali, instansi, pengunggah..."
    />
  )
}
