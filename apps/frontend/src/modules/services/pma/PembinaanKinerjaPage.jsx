import {
  Target,
  Building2,
  CheckCircle2,
  TrendingUp,
  Calendar,
  User,
  MapPin,
  ClipboardList,
  MessageSquare,
} from 'lucide-react'
import { PmaCrudLayoutShell } from '../../../components/shared/services/pma/PmaCrudLayoutShell'
import { KinerjaFormModal } from '../../../components/shared/services/pma/KinerjaFormModal'
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
  formatKanregLabel,
  formatNip,
  formatWilayah,
  parsePercent,
} from '../../../components/shared/services/pma/pmaFormatters'

import {
  fetchPembinaanKinerjaSummary,
  fetchPembinaanKinerjaData,
  deletePembinaanKinerjaData,
  importBatchPembinaanKinerja,
} from '../../../services/api/pmaServicesApi'

export default function PembinaanKinerjaPage() {
  const renderKpis = (summary) => [
    {
      id: 'total_data',
      label: 'TOTAL EVALUASI',
      value: summary?.total_data ?? 0,
      unit: 'Data',
      context: 'Evaluasi & pelaporan SKP',
      badge: '100% Tercatat',
      badgeColor: 'blue',
      icon: Target,
      iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_instansi',
      label: 'INSTANSI TEREVALUASI',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Pemerintah daerah',
      badge: 'Wilayah Binaan',
      badgeColor: 'indigo',
      icon: Building2,
      iconColor: 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'total_tinggi',
      label: 'CAPAIAN TINGGI (>=90%)',
      value: summary?.total_tinggi ?? 0,
      unit: 'Instansi',
      context: 'Predikat Baik & Sangat Baik',
      badge: 'Target Tercapai',
      badgeColor: 'emerald',
      icon: CheckCircle2,
      iconColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'avg_capaian',
      label: 'RATA-RATA CAPAIAN',
      value: `${summary?.avg_capaian ?? 0}%`,
      unit: '',
      isText: true,
      context: 'Akumulasi kinerja wilayah',
      badge: Number(summary?.avg_capaian || 0) >= 80 ? 'Optimal' : 'Perlu Binaan',
      badgeColor: Number(summary?.avg_capaian || 0) >= 80 ? 'emerald' : 'amber',
      icon: TrendingUp,
      iconColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
  ]

  const columns = [
    { header: 'Instansi & Wilayah' },
    { header: 'Periode Asistensi' },
    { header: 'Kategori & Predikat' },
    { header: 'Tanggal' },
    { header: 'Petugas' },
    { header: 'Aksi', className: 'text-right', align: 'right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const percent = parsePercent(item.capaian_percent ?? item.capaian_persen ?? 0) ?? 0
    const isGood = percent >= 90
    const isMid = percent >= 50 && percent < 90
    const wilayahLabel = formatWilayah(item.wilayah, item.kanreg)
    const petugas = formatNip(item.updated_by || item.created_by || item.nip)

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
          <PmaPeriodeBadge weightClass="font-semibold">
            {item.period_year ? `Tahun ${item.period_year}` : formatDateId(item.period_date)}
          </PmaPeriodeBadge>
        </td>

        {/* 3. KATEGORI & PREDIKAT */}
        <td className="py-3.5 px-4 sm:px-5">
          <PmaStatusBadge
            tone={isGood ? 'emerald' : isMid ? 'blue' : 'amber'}
            weightClass="font-semibold"
          >
            {item.status_nama || (isGood ? 'Tinggi' : isMid ? 'Menengah' : 'Rendah')}
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
            petugas={petugas}
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

  const renderDetail = (item) => {
    const percent = parsePercent(item.capaian_percent ?? item.capaian_persen ?? 0) ?? 0
    const isGood = percent >= 90
    const wilayahLabel = formatWilayah(item.wilayah, item.kanreg)
    const kanregLabel = formatKanregLabel(item.kanreg)
    const petugas = formatNip(item.updated_by || item.created_by || item.nip)

    return {
      title: item.instansi_name || `Instansi Kode: ${item.instansi_id}`,
      subtitle: `Pembinaan Kinerja • ${
        item.period_year ? `Tahun ${item.period_year}` : '-'
      } • ${wilayahLabel}`,
      badge: {
        label: item.status_nama || (isGood ? 'Tinggi' : 'Perlu Binaan'),
        className: isGood
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
          : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
      },
      summary: [
        {
          label: 'Instansi',
          value: item.instansi_name || '-',
          hint: `Kode Instansi: ${item.instansi_id ?? '-'}`,
          icon: Building2,
          tone: 'blue',
        },
        {
          label: 'Wilayah',
          value: wilayahLabel,
          hint: kanregLabel,
          icon: MapPin,
          tone: 'indigo',
        },
        {
          label: 'Periode',
          value: item.period_year ? `Tahun ${item.period_year}` : '-',
          hint: item.period_date_label || formatDateId(item.period_date),
          icon: Calendar,
          tone: 'slate',
        },
        {
          label: 'Capaian Kinerja',
          value: `${percent}%`,
          hint: item.kategori_nama || '-',
          icon: Target,
          tone: isGood ? 'emerald' : 'amber',
        },
        {
          label: 'Asesor / PIC',
          value: petugas,
          hint: `Diperbarui ${formatDateTimeId(item.updated_at || item.created_at)}`,
          icon: User,
          tone: 'slate',
        },
      ],
      sections: [
        {
          title: 'Rincian Evaluasi Kinerja',
          icon: ClipboardList,
          description: 'Rincian teknis pelaporan dan pendampingan kinerja instansi.',
          rows: [
            { label: 'Kode Instansi', value: item.instansi_id ?? '-' },
            { label: 'Wilayah Kerja', value: wilayahLabel },
            { label: 'Kategori Layanan', value: item.kategori_nama || '-' },
            { label: 'Kode Kategori', value: item.kategori_code || '-' },
            { label: 'Jenis Kegiatan', value: item.kegiatan || '-' },
            { label: 'Aplikasi Kinerja', value: item.aplikasi || '-' },
            {
              label: 'Periode Pelaporan',
              value: item.period_year ? `Tahun ${item.period_year}` : '-',
            },
            {
              label: 'Tanggal Laporan',
              value: item.period_date_label || formatDateId(item.period_date),
            },
            { label: 'Capaian Kinerja', value: `${percent}%` },
            { label: 'Predikat', value: item.status_nama || '-' },
            {
              label: 'Pendampingan Terakhir',
              value: item.pendampingan_date_label || formatDateId(item.pendampingan_date),
            },
            { label: 'NIP Pengunggah', value: formatNip(item.created_by || item.nip) },
            { label: 'Diperbarui Oleh', value: formatNip(item.updated_by) },
            {
              label: 'Terakhir Diperbarui',
              value: formatDateTimeId(item.updated_at || item.created_at),
            },
          ],
        },
        {
          title: 'Catatan Pendampingan',
          icon: MessageSquare,
          description: 'Catatan teknis dari pendampingan penyusunan SKP dan e-kinerja.',
          rows: item.catatan
            ? [{ label: 'Catatan', value: item.catatan }]
            : [{ label: 'Catatan', value: 'Belum ada catatan pendampingan pada periode ini.' }],
        },
      ],
    }
  }

  const categories = [
    { value: '1', label: 'Pelaporan SKP' },
    { value: '2', label: 'Penyusunan SKP' },
    { value: '3', label: 'E-Kinerja' },
  ]

  return (
    <PmaCrudLayoutShell
      layananId={14}
      serviceTitle="Pembinaan Kinerja dan Penghargaan"
      shortTitle="Pembinaan Kinerja"
      timKerjaTitle="Pembinaan Manajemen ASN"
      description="Evaluasi pelaporan kinerja tahunan, pendampingan penyusunan SKP, dan monitoring e-kinerja ASN."
      templateUrl="/templates/pma/template-pembinaan-kinerja.xlsx"
      templateName="template-pembinaan-kinerja.xlsx"
      fetchSummaryFn={fetchPembinaanKinerjaSummary}
      fetchDataFn={fetchPembinaanKinerjaData}
      deleteDataFn={deletePembinaanKinerjaData}
      batchUploadFn={importBatchPembinaanKinerja}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      renderDetail={renderDetail}
      FormComponent={KinerjaFormModal}
      categories={categories}
      tableHeaderWeightClass="font-bold"
      tableBodyClassName="font-semibold"
      searchPlaceholder="Cari nama instansi, NIP, pengunggah..."
    />
  )
}
