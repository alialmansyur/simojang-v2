import {
  Award,
  Building2,
  TrendingUp,
  CheckCircle,
  Calendar,
  User,
  MapPin,
  Target,
  History,
  FileSpreadsheet,
} from 'lucide-react'
import { PmaCrudLayoutShell } from '../../../components/shared/services/pma/PmaCrudLayoutShell'
import { MtFormModal } from '../../../components/shared/services/pma/MtFormModal'
import {
  DataOriginIcon,
  isExcelOrigin,
  PmaPeriodeBadge,
  PmaStatusBadge,
  PmaTanggalCell,
  PmaPetugasCell,
  PmaActionButtons,
} from '../../../components/shared/services/pma/PmaTableCells'
import {
  formatDateId,
  formatDateTimeId,
  formatNip,
  parsePercent,
} from '../../../components/shared/services/pma/pmaFormatters'

import {
  fetchMtSummary,
  fetchMtData,
  fetchMtDetail,
  deleteMtData,
  importBatchMt,
} from '../../../services/api/pmaServicesApi'

function formatWilayah(wilayah, kanreg) {
  const raw = String(wilayah || '').trim()
  if (raw) {
    const lower = raw.toLowerCase()
    if (lower === 'jabar') return 'Jawa Barat'
    if (lower === 'banten') return 'Banten'
    if (!/^\d+$/.test(raw)) return raw
  }
  return kanreg ? `Kanreg ${kanreg}` : '-'
}

function formatOriginLabel(activityType, action) {
  const normalized = String(activityType || '').toLowerCase().trim()
  if (normalized === 'import') return 'Impor Batch Excel'
  if (normalized === 'update') return 'Diperbarui via Form'
  if (normalized === 'create') return 'Input Manual Form'
  const actionNorm = String(action || '').toLowerCase().trim()
  if (actionNorm === 'import') return 'Impor Batch Excel'
  if (actionNorm === 'update') return 'Diperbarui via Form'
  if (actionNorm === 'create') return 'Input Manual Form'
  return '-'
}

export default function ManajemenTalentaPage() {
  const renderKpis = (summary) => [
    {
      id: 'total_data',
      label: 'TOTAL CATATAN MT',
      value: summary?.total_data ?? 0,
      unit: 'Data',
      context: 'Riwayat implementasi talenta',
      badge: '100% Tercatat',
      badgeColor: 'blue',
      icon: Award,
      iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_instansi',
      label: 'TOTAL INSTANSI',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Pemerintah daerah binaan',
      badge: 'Jabar & Banten',
      badgeColor: 'indigo',
      icon: Building2,
      iconColor: 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'pengisian_jabatan',
      label: 'SUDAH PENGISIAN JABATAN',
      value: summary?.pengisian_jabatan ?? summary?.tahap_mandiri ?? 0,
      unit: 'Instansi',
      context: 'Tahap 1: Pengisian Jabatan',
      badge: 'Tahap 1',
      badgeColor: 'emerald',
      icon: CheckCircle,
      iconColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'avg_progress',
      label: 'RATA-RATA PROGRES',
      value: `${summary?.avg_progress ?? 0}%`,
      unit: '',
      isText: true,
      context: 'Capaian tahapan MT wilayah',
      badge: Number(summary?.avg_progress || 0) >= 50 ? 'Baik' : 'Pendampingan',
      badgeColor: Number(summary?.avg_progress || 0) >= 50 ? 'emerald' : 'amber',
      icon: TrendingUp,
      iconColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
  ]

  const columns = [
    { header: 'Instansi & Wilayah' },
    { header: 'Periode Asistensi' },
    { header: 'Tahapan & Status' },
    { header: 'Tanggal' },
    { header: 'Petugas' },
    { header: 'Aksi', className: 'text-right', align: 'right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const stepId = Number(item.rw_mt_id || 0)
    const stepTone = stepId === 1 ? 'emerald' : stepId === 2 ? 'blue' : stepId === 3 ? 'indigo' : 'amber'
    const wilayahLabel = formatWilayah(item.wilayah, item.kanreg)

    return (
      <tr
        key={item.id}
        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors font-semibold"
      >
        {/* 1. INSTANSI DAERAH */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <DataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewDetail && onViewDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
              >
                {item.instansi_name || `Instansi Kode: ${item.instansi_id}`}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="truncate max-w-xs sm:max-w-sm">
                  {wilayahLabel} • Kode: {item.instansi_id ?? '-'}
                </span>
              </div>
            </div>
          </div>
        </td>

        {/* 2. PERIODE ASISTENSI */}
        <td className="py-3.5 px-4 sm:px-5">
          <PmaPeriodeBadge weightClass="font-semibold">{item.period || '-'}</PmaPeriodeBadge>
        </td>

        {/* 3. TAHAPAN & STATUS */}
        <td className="py-3.5 px-4 sm:px-5">
          <PmaStatusBadge
            tone={stepTone}
            weightClass="font-semibold"
          >
            {item.step_name || (stepId ? `Tahap ${stepId}` : '-')}
          </PmaStatusBadge>
        </td>

        {/* 4. TANGGAL */}
        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
          <PmaTanggalCell
            dateTime={formatDateTimeId(item.updated_at || item.created_at)}
            weightClass="font-semibold"
          />
        </td>

        {/* 5. PETUGAS */}
        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
          <PmaPetugasCell
            petugas={formatNip(item.created_by || item.nip)}
            weightClass="font-semibold"
          />
        </td>

        {/* 6. AKSI */}
        <td className="py-3.5 px-4 sm:px-5">
          <PmaActionButtons
            onView={() => onViewDetail?.(item)}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
          />
        </td>
      </tr>
    )
  }

  const renderDetail = async (item) => {
    const detail = await fetchMtDetail(item.id || item.uid)
    const mt = detail?.mt
    if (!mt) {
      throw new Error('Data detail Manajemen Talenta tidak ditemukan.')
    }

    const activities = Array.isArray(detail.activities) ? detail.activities : []

    const stepId = Number(mt.rw_mt_id || 0)
    const isMandiri = stepId >= 7
    const percent = parsePercent(mt.total_percentase)
    const wilayahLabel = formatWilayah(mt.wilayah, mt.kanreg)
    const kanregLabel = mt.kanreg ? `Kanreg ${mt.kanreg} BKN` : '-'
    const originLabel = formatOriginLabel(mt.activity_type, mt.action)
    const startDateLabel = mt.period_date ? formatDateId(mt.period_date) : '-'

    const activityExportRows = activities.map((act, idx) => ({
      label: `Log #${idx + 1} (${formatDateTimeId(act.created_at)})`,
      value: `${act.description || act.activity_type || '-'} — Tahap ${act.rw_mt_id ?? '-'}${
        act.step_name ? ` (${act.step_name})` : ''
      } • Oleh ${formatNip(act.created_by)}`,
    }))

    return {
      title: mt.instansi_name || `Instansi Kode: ${mt.instansi_id}`,
      subtitle: `Manajemen Talenta • Periode ${mt.period || '-'} • ${wilayahLabel}`,
      badge: {
        label: mt.step_name || (stepId ? `Tahap ${stepId}` : '-'),
        className:
          stepId === 1
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
            : stepId === 2
            ? 'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40'
            : stepId === 3
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40'
            : 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
      },
      summary: [
        {
          label: 'Instansi',
          value: mt.instansi_name || '-',
          hint: `Kode Instansi: ${mt.instansi_id ?? '-'}`,
          icon: Building2,
          tone: 'blue',
        },
        {
          label: 'Wilayah & Kanreg',
          value: wilayahLabel,
          hint: kanregLabel,
          icon: MapPin,
          tone: 'indigo',
        },
        {
          label: 'Periode Asistensi',
          value: mt.period || '-',
          hint: `Mulai: ${startDateLabel}`,
          icon: Calendar,
          tone: 'slate',
        },
        {
          label: 'Capaian Progres',
          value: percent === null ? '-' : `${percent}%`,
          hint: isMandiri ? 'Kategori Mandiri' : 'Fasilitasi Pendampingan',
          icon: Target,
          tone: isMandiri ? 'emerald' : 'amber',
        },
        {
          label: 'Petugas / Pembuat',
          value: formatNip(mt.created_by),
          hint: `Diperbarui ${formatDateTimeId(mt.updated_at || mt.created_at)}`,
          icon: User,
          tone: 'slate',
        },
        {
          label: 'Sumber Entri',
          value: originLabel,
          hint: `${activities.length} riwayat aktivitas tercatat`,
          icon: FileSpreadsheet,
          tone: mt.activity_type === 'import' ? 'emerald' : 'blue',
        },
      ],
      sections: [
        {
          title: 'Detail Implementasi',
          icon: Target,
          description: 'Metadata aktual catatan implementasi manajemen talenta.',
          rows: [
            { label: 'Kode Instansi', value: mt.instansi_id ?? '-' },
            { label: 'Nama Instansi', value: mt.instansi_name || '-' },
            { label: 'Wilayah', value: wilayahLabel },
            { label: 'Periode Laporan', value: mt.period || '-' },
            { label: 'Tanggal Mulai Implementasi', value: startDateLabel },
            { label: 'Tahap MT', value: `Tahap ${stepId || '-'} — ${mt.step_name || '-'}` },
            { label: 'Total Capaian', value: percent === null ? '-' : `${percent}%` },
            { label: 'Kategori Pembinaan', value: isMandiri ? 'Tahap Mandiri' : 'Fasilitasi Pendampingan' },
            { label: 'Catatan Terakhir', value: mt.catatan || mt.description || '-' },
            { label: 'Metode Input Awal', value: originLabel },
            { label: 'Petugas Pembuat', value: formatNip(mt.created_by) },
            { label: 'Waktu Dibuat', value: formatDateTimeId(mt.created_at) },
            { label: 'Terakhir Diperbarui', value: formatDateTimeId(mt.updated_at) },
          ],
        },
        {
          title: 'Riwayat Aktivitas',
          icon: History,
          description: 'Log perubahan dan pencatatan tahapan aktual dari basis data.',
          exportRows: activityExportRows,
          children:
            activities.length > 0 ? (
              <div className="space-y-2.5">
                {activities.map((act, idx) => (
                  <div
                    key={act.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 px-3.5 py-2.5"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-[#175CD3] border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50">
                          {act.activity_type || 'log'}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {act.description || '-'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tahap {act.rw_mt_id ?? '-'}
                        {act.step_name ? ` (${act.step_name})` : ''} • Petugas: {formatNip(act.created_by)}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                      {formatDateTimeId(act.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Belum ada riwayat aktivitas tercatat.</p>
            ),
        },
      ],
    }
  }

  const categories = [
    { value: '1', label: '1. Sudah Pengisian Jabatan' },
    { value: '2', label: '2. Sudah Mendapat rekomendasi' },
    { value: '3', label: '3. Sudah ekspose' },
    { value: '4', label: '4. Siap Ekspose' },
  ]

  return (
    <PmaCrudLayoutShell
      layananId={13}
      serviceTitle="Manajemen Talenta"
      shortTitle="Manajemen Talenta"
      timKerjaTitle="Pembinaan Manajemen ASN"
      description="Tracking dan asistensi implementasi 4 tahapan progres manajemen talenta instansi daerah wilayah kerja."
      templateUrl="/templates/pma/template-manajemen-talenta.xlsx"
      templateName="template-manajemen-talenta.xlsx"
      fetchSummaryFn={fetchMtSummary}
      fetchDataFn={fetchMtData}
      deleteDataFn={deleteMtData}
      batchUploadFn={importBatchMt}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      renderDetail={renderDetail}
      FormComponent={MtFormModal}
      categories={categories}
      searchPlaceholder="Cari nama instansi, NIP, pengunggah..."
      tableHeaderWeightClass="font-bold"
      tableBodyClassName="font-semibold"
    />
  )
}
