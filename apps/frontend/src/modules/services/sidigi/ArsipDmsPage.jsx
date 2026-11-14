import { Edit3, Trash2, Eye, Building2, Layers, FileCheck, Clock, FileSpreadsheet, User } from 'lucide-react'
import { SidigiCrudLayoutShell } from '../../../components/shared/services/sidigi/SidigiCrudLayoutShell'
import { SidigiDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/sidigi/SidigiDataOriginIcon'
import { SidigiTanggalCell, SidigiPetugasCell } from '../../../components/shared/services/sidigi/SidigiTableCells'
import { DmsFormModal } from '../../../components/shared/services/sidigi/DmsFormModal'
import {
  fetchDmsSummary,
  fetchDmsData,
  fetchDmsDetail,
  deleteDmsData,
  importBatchDms,
} from '../../../services/api/sidigiServicesApi'

export default function ArsipDmsPage() {
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
      id: 'total_data',
      label: 'TOTAL ENTRI DMS',
      value: summary?.total_data ?? 0,
      unit: 'Entri',
      context: 'Volume log scanning arsip',
      badge: '100% Total',
      badgeColor: 'sky',
      icon: FileSpreadsheet,
      iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    },
    {
      id: 'total_dokumen',
      label: 'TOTAL E-DOKUMEN SCAN',
      value: summary?.total_dokumen ?? 0,
      unit: 'Dokumen',
      context: 'Dokumen digital terindeks',
      badge: 'Terverifikasi',
      badgeColor: 'emerald',
      icon: FileCheck,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_instansi',
      label: 'TOTAL INSTANSI',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Cakupan instansi daerah',
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
      context: 'Pembaruan arsip digital',
      badge: 'Terbaru',
      badgeColor: 'indigo',
      icon: Clock,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  const columns = [
    { header: 'INSTANSI & E-BERKAS' },
    { header: 'JENIS E-DOKUMEN' },
    { header: 'STATUS DIGITALISASI' },
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
        {/* Kolom 1: INSTANSI & E-BERKAS */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <SidigiDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onDetail && onDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.nama_instansi || item.nama}
              >
                {item.nama_instansi || item.nama || `Instansi ${item.instansi_id}`}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  Kode: {item.kodeins || item.kode_instansi || item.instansi_id || '-'}
                </span>
                <span>•</span>
                <span>Periode: {item.period || '-'}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: JENIS E-DOKUMEN */}
        <td className="py-3 px-4 sm:px-5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 whitespace-nowrap">
            <FileCheck className="w-3 h-3 text-slate-400" />
            <span>{item.jenis || 'Dokumen Kepegawaian'}</span>
          </span>
        </td>

        {/* Kolom 3: STATUS DIGITALISASI */}
        <td className="py-3 px-4 sm:px-5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 whitespace-nowrap">
            {formatNumber(item.total || item.total_doc || 0)} Berkas Scan
          </span>
        </td>

        {/* Kolom 4: TANGGAL */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiTanggalCell
            value={item.created_at || item.tanggal_proses}
            subValue={`Tarikan: ${formatDate(item.period_start_date || item.period_date)}`}
          />
        </td>

        {/* Kolom 5: PETUGAS */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiPetugasCell value={item.created_by || item.pic || 'Admin DMS'} />
        </td>

        {/* Kolom 6: AKSI */}
        <td className="py-3 px-4 sm:px-5 text-right">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onDetail && onDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Dokumen Digital"
            >
              <Eye className="w-4 h-4" />
            </button>
            {!isExcelOrigin(item) && (
              <button
                type="button"
                onClick={() => onEdit && onEdit(item)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="Edit Data DMS"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Data DMS"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const categories = [
    { value: 'all', label: 'Semua Dokumen' },
    { value: 'Arsip Elektronik (PNS)', label: 'Arsip Elektronik (PNS)' },
    { value: 'E-SK Pangkat & Jabatan', label: 'E-SK Pangkat & Jabatan' },
    { value: 'E-Ijazah & Transkrip Nilai', label: 'E-Ijazah & Transkrip Nilai' },
    { value: 'E-Karis / Karsu / Karpeg', label: 'E-Karis / Karsu / Karpeg' },
    { value: 'E-SK Pensiun & Hak Janda/Duda', label: 'E-SK Pensiun & Hak Janda/Duda' },
  ]

  return (
    <SidigiCrudLayoutShell
      layananId={26}
      serviceTitle="Digitalisasi Arsip Kepegawaian (DMS)"
      shortTitle="Digitalisasi DMS"
      timKerjaTitle="Sistem Informasi & Digitalisasi"
      description="Document Management System (DMS) untuk pengarsipan digital, scanning, dan temu kembali e-dokumen kepegawaian."
      templateUrl="/templates/sidigi/template-arsip-dms.xlsx"
      templateName="template-arsip-dms.xlsx"
      fetchSummaryFn={fetchDmsSummary}
      fetchDataFn={fetchDmsData}
      fetchDetailFn={fetchDmsDetail}
      deleteDataFn={deleteDmsData}
      batchUploadFn={importBatchDms}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={DmsFormModal}
      detailType="dms"
      categories={categories}
      defaultCategory="all"
      searchPlaceholder="Cari instansi, jenis dokumen, PIC..."
    />
  )
}
