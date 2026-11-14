import { Edit3, Trash2, Eye, Building2, Layers, CheckCircle2, Clock, UserCheck, AlertTriangle, XCircle, User } from 'lucide-react'
import { SidigiCrudLayoutShell } from '../../../components/shared/services/sidigi/SidigiCrudLayoutShell'
import { SidigiDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/sidigi/SidigiDataOriginIcon'
import { SidigiTanggalCell, SidigiPetugasCell } from '../../../components/shared/services/sidigi/SidigiTableCells'
import { PdmFormModal } from '../../../components/shared/services/sidigi/PdmFormModal'
import {
  fetchPdmSummary,
  fetchPdmData,
  fetchPdmDetail,
  deletePdmData,
  importBatchPdm,
} from '../../../services/api/sidigiServicesApi'

export default function PeremajaanDataPage() {
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

  const renderKpis = (summary) => {
    const totalAcc = Number(summary?.total_acc || 0)
    const totalBtl = Number(summary?.total_btl || 0)
    const totalTms = Number(summary?.total_tms || 0)
    const totalPending = totalBtl + totalTms

    return [
      {
        id: 'total_pdm',
        label: 'TOTAL USUL PDM',
        value: summary?.total_data ?? (totalAcc + totalPending),
        unit: 'Berkas',
        context: 'Volume usulan peremajaan',
        badge: '100% Usul',
        badgeColor: 'sky',
        icon: UserCheck,
        iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
      },
      {
        id: 'total_acc',
        label: 'USUL DISETUJUI (ACC)',
        value: totalAcc,
        unit: 'Berkas',
        context: 'Peremajaan berhasil disetujui',
        badge: 'Disetujui',
        badgeColor: 'emerald',
        icon: CheckCircle2,
        iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      },
      {
        id: 'total_btl_tms',
        label: 'BTL & TMS',
        value: totalPending,
        unit: 'Berkas',
        context: 'Perbaikan / Tidak Memenuhi',
        badge: 'Perhatian',
        badgeColor: 'amber',
        icon: AlertTriangle,
        iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      },
      {
        id: 'last_upload',
        label: 'UPLOAD TERAKHIR',
        value: formatDate(summary?.last_update),
        unit: '',
        isText: true,
        context: 'Pembaruan data verifikasi',
        badge: 'Terbaru',
        badgeColor: 'indigo',
        icon: Clock,
        iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
      },
    ]
  }

  const columns = [
    { header: 'BERKAS & RIWAYAT PDM' },
    { header: 'KATEGORI MODUL' },
    { header: 'STATUS PROSES' },
    { header: 'TOTAL USULAN' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onDetail) => {
    const acc = Number(item.total_acc || 0)
    const btl = Number(item.total_btl || 0)
    const tms = Number(item.total_tms || 0)
    const total = acc + btl + tms

    return (
      <tr
        key={item.id}
        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Kolom 1: BERKAS & RIWAYAT PDM */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <SidigiDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onDetail && onDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.jenis}
              >
                {item.jenis || 'Usul Peremajaan Data'}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span>Periode: {item.period || '-'}</span>
                <span>•</span>
                <span>Tarikan: {formatDate(item.period_start_date || item.period_date)} s.d. {formatDate(item.period_end_date || item.period_date)}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: KATEGORI MODUL */}
        <td className="py-3 px-4 sm:px-5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 whitespace-nowrap">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>{item.jenis || 'PDM ASN'}</span>
          </span>
        </td>

        {/* Kolom 3: STATUS PROSES */}
        <td className="py-3 px-4 sm:px-5">
          {acc > 0 ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 whitespace-nowrap">
              {formatNumber(acc)} Disetujui (ACC)
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 whitespace-nowrap">
              Perlu Verifikasi
            </span>
          )}
        </td>

        {/* Kolom 4: TOTAL USULAN */}
        <td className="py-3 px-4 sm:px-5">
          <div className="font-extrabold text-slate-900 dark:text-white text-xs tabular-nums">
            {formatNumber(total)} Usul
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            ACC: {formatNumber(acc)} • BTL: {formatNumber(btl)} • TMS: {formatNumber(tms)}
          </div>
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiTanggalCell value={item.created_at || item.period_date} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiPetugasCell value={item.created_by || 'Admin SIDIGI'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="py-3 px-4 sm:px-5 text-right">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onDetail && onDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Usul PDM"
            >
              <Eye className="w-4 h-4" />
            </button>
            {!isExcelOrigin(item) && (
              <button
                type="button"
                onClick={() => onEdit && onEdit(item)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="Edit Data Peremajaan"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Data Peremajaan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const categories = [
    { value: 'all', label: 'Semua Usul' },
    { value: 'Pangkat', label: 'Pangkat & Golongan' },
    { value: 'Pendidikan', label: 'Pendidikan & Gelar' },
    { value: 'Jabatan', label: 'Jabatan & Eselon' },
    { value: 'Diklat', label: 'Diklat & Kursus' },
    { value: 'Keluarga', label: 'Keluarga' },
  ]

  return (
    <SidigiCrudLayoutShell
      layananId={22}
      serviceTitle="Peremajaan Data ASN (PDM)"
      shortTitle="Peremajaan Data"
      timKerjaTitle="Sistem Informasi & Digitalisasi"
      description="Pencatatan, verifikasi, dan pemantauan peremajaan data kepegawaian ASN di lingkungan Kanreg III BKN."
      templateUrl="/templates/sidigi/template-peremajaan-data.xlsx"
      templateName="template-peremajaan-data.xlsx"
      fetchSummaryFn={fetchPdmSummary}
      fetchDataFn={fetchPdmData}
      fetchDetailFn={fetchPdmDetail}
      deleteDataFn={deletePdmData}
      batchUploadFn={importBatchPdm}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={PdmFormModal}
      detailType="pdm"
      categories={categories}
      defaultCategory="all"
      searchPlaceholder="Cari riwayat PDM, periode, pengunggah..."
    />
  )
}
