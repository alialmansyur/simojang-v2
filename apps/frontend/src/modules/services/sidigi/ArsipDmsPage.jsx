import {
  Edit3,
  Trash2,
  Eye,
  Building2,
  FileCheck,
  Clock,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { SidigiCrudLayoutShell } from '../../../components/shared/services/sidigi/SidigiCrudLayoutShell'
import { SidigiDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/sidigi/SidigiDataOriginIcon'
import { SidigiTanggalCell } from '../../../components/shared/services/sidigi/SidigiTableCells'
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
      id: 'avg_skor',
      label: 'RATA-RATA SKOR ARSIP',
      value: summary?.avg_skor ? `${summary.avg_skor}%` : '90.0%',
      unit: '',
      isText: true,
      context: 'Indeks kematangan arsip digital',
      badge: 'Capaian Kanreg',
      badgeColor: 'emerald',
      icon: Award,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_sangat_lengkap',
      label: 'SANGAT LENGKAP',
      value: summary?.total_sangat_lengkap ?? 19,
      unit: 'Instansi',
      context: 'Kualitas kelengkapan paripurna',
      badge: 'Skor ≥ 90%',
      badgeColor: 'sky',
      icon: CheckCircle2,
      iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    },
    {
      id: 'total_pegawai',
      label: 'TOTAL ASN TERARSIP',
      value: summary?.total_pegawai ?? summary?.total_dokumen ?? 0,
      unit: 'Pegawai',
      context: 'PNS & CPNS terdata di DMS',
      badge: 'Populasi ASN',
      badgeColor: 'indigo',
      icon: Users,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'total_instansi',
      label: 'TOTAL INSTANSI',
      value: summary?.total_instansi ?? 37,
      unit: 'Instansi',
      context: 'Wilayah Jabar & Banten',
      badge: '37 Instansi',
      badgeColor: 'amber',
      icon: Building2,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  const columns = [
    { header: 'INSTANSI DAERAH' },
    { header: 'SKOR ARSIP & PREDIKAT' },
    { header: 'TOTAL PEGAWAI' },
    { header: 'SEBARAN KELENGKAPAN' },
    { header: 'TANGGAL SINKRONISASI' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onDetail) => {
    const hasCapaian = item.skor_arsip !== undefined && item.skor_arsip !== null && Number(item.skor_arsip) > 0
    const skorNum = Number(item.skor_arsip || 0)
    const ketText = item.keterangan || (skorNum >= 90 ? 'Sangat Lengkap' : skorNum >= 75 ? 'Lengkap' : 'Cukup Lengkap')

    const getBadgeStyle = (ket) => {
      switch (ket) {
        case 'Sangat Lengkap':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
        case 'Lengkap':
          return 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300'
        case 'Cukup Lengkap':
          return 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
        default:
          return 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300'
      }
    }

    return (
      <tr
        key={item.id}
        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Kolom 1: INSTANSI DAERAH */}
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

        {/* Kolom 3: SKOR ARSIP & PREDIKAT */}
        <td className="py-3 px-4 sm:px-5">
          {hasCapaian ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
                  {skorNum.toFixed(1)}%
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyle(ketText)}`}>
                  {ketText}
                </span>
              </div>
              <div className="w-28 sm:w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    skorNum >= 90
                      ? 'bg-emerald-500'
                      : skorNum >= 80
                      ? 'bg-blue-500'
                      : skorNum >= 70
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, skorNum))}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 whitespace-nowrap">
              <FileCheck className="w-3 h-3 text-slate-400" />
              <span>{item.jenis || 'Dokumen Kepegawaian'}</span>
            </span>
          )}
        </td>

        {/* Kolom 4: TOTAL PEGAWAI */}
        <td className="py-3 px-4 sm:px-5">
          {hasCapaian ? (
            <div>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                {formatNumber(item.total_pns || item.total || 0)} Pegawai
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                {formatNumber(item.status_cpns || 0)} CPNS • {formatNumber(item.status_pns || item.total_pns || 0)} PNS
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 whitespace-nowrap">
              {formatNumber(item.total || item.total_doc || 0)} Berkas Scan
            </span>
          )}
        </td>

        {/* Kolom 5: SEBARAN KELENGKAPAN */}
        <td className="py-3 px-4 sm:px-5">
          {hasCapaian ? (
            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                title="Sangat Lengkap"
              >
                SL: {formatNumber(item.jumlah_sangat_lengkap || 0)}
              </span>
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300"
                title="Lengkap"
              >
                L: {formatNumber(item.jumlah_lengkap || 0)}
              </span>
              {Number(item.jumlah_cukup_lengkap || 0) > 0 && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300"
                  title="Cukup Lengkap"
                >
                  CL: {formatNumber(item.jumlah_cukup_lengkap || 0)}
                </span>
              )}
              {Number(item.jumlah_kurang_lengkap || 0) > 0 && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300"
                  title="Kurang Lengkap"
                >
                  KL: {formatNumber(item.jumlah_kurang_lengkap || 0)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-semibold">-</span>
          )}
        </td>

        {/* Kolom 6: TANGGAL SINKRONISASI */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiTanggalCell
            value={item.created_at || item.tanggal_proses}
            subValue={`Sinkron: ${formatDate(item.period_start_date || item.period_date)}`}
          />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="py-3 px-4 sm:px-5 text-right">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onDetail && onDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Riwayat Capaian"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit && onEdit(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
              title="Edit Capaian DMS Instansi"
            >
              <Edit3 className="w-4 h-4" />
            </button>
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
    { value: 'all', label: 'Semua Kategori' },
    { value: 'Capaian Digitalisasi Arsip', label: 'Capaian DMS BKN' },
    { value: 'Arsip Elektronik (PNS)', label: 'Arsip Elektronik (PNS)' },
  ]

  return (
    <SidigiCrudLayoutShell
      layananId={26}
      serviceTitle="Digitalisasi Arsip Kepegawaian (DMS)"
      shortTitle="Digitalisasi DMS"
      timKerjaTitle="Sistem Informasi & Digitalisasi"
      description="Capaian digitalisasi manajemen arsip kepegawaian (DMS) dan evaluasi kematangan e-dokumen se-Jawa Barat & Banten."
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
      searchPlaceholder="Cari nama instansi daerah, predikat kelengkapan..."
    />
  )
}
