import {
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  Calendar,
  Presentation,
  FileCheck,
  ExternalLink,
} from 'lucide-react'
import { PmaCrudLayoutShell } from '../../../components/shared/services/pma/PmaCrudLayoutShell'
import { PengembanganKompetensiFormModal } from '../../../components/shared/services/pma/PengembanganKompetensiFormModal'
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
  formatNumber,
} from '../../../components/shared/services/pma/pmaFormatters'

import {
  fetchPengembanganKompetensiSummary,
  fetchPengembanganKompetensiData,
  deletePengembanganKompetensiData,
  importBatchPengembanganKompetensi,
} from '../../../services/api/pmaServicesApi'

export default function PengembanganKompetensiPage() {
  const renderKpis = (summary) => [
    {
      id: 'total_data',
      label: 'TOTAL AGENDA',
      value: summary?.total_data ?? 0,
      unit: 'Kegiatan',
      context: 'Pelatihan & workshop kompetensi',
      badge: '100% Tercatat',
      badgeColor: 'blue',
      icon: BookOpen,
      iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_partisipan',
      label: 'TOTAL PESERTA',
      value: summary?.total_partisipan ?? 0,
      unit: 'Pegawai',
      context: 'Aparatur Sipil Negara teredukasi',
      badge: 'SDM Wilayah',
      badgeColor: 'emerald',
      icon: Users,
      iconColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'metode_klasikal',
      label: 'METODE KLASIKAL',
      value: summary?.metode_klasikal ?? 0,
      unit: 'Kegiatan',
      context: 'Tatap muka / in-class workshop',
      badge: 'Tatap Muka',
      badgeColor: 'indigo',
      icon: GraduationCap,
      iconColor: 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'metode_daring',
      label: 'METODE DARING',
      value: summary?.metode_daring ?? 0,
      unit: 'Kegiatan',
      context: 'Webinar & blended learning online',
      badge: 'Virtual/Webinar',
      badgeColor: 'amber',
      icon: Layers,
      iconColor: 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  const columns = [
    { header: 'Agenda & Materi' },
    { header: 'Periode Asistensi' },
    { header: 'Metode Pelaksanaan' },
    { header: 'Tanggal' },
    { header: 'Petugas' },
    { header: 'Aksi', className: 'text-right', align: 'right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const metode = item.metode || '-'
    const isDaring = /daring|online|webinar/i.test(metode)
    const petugas = formatNip(item.updated_by || item.created_by || item.nip)

    return (
      <tr
        key={item.id}
        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors font-semibold"
      >
        {/* 1. ENTITAS (Agenda & Materi) */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <DataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewDetail && onViewDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
              >
                {item.judul_kegiatan || '-'}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="truncate max-w-xs sm:max-w-sm">
                  Materi: {item.materi || '-'} • {item.penyelenggara || '-'}
                </span>
              </div>
            </div>
          </div>
        </td>

        {/* 2. PERIODE ASISTENSI */}
        <td className="py-3.5 px-4 sm:px-5">
          <PmaPeriodeBadge weightClass="font-semibold">
            {item.tanggal_kegiatan_label || formatDateId(item.tanggal_kegiatan)}
          </PmaPeriodeBadge>
        </td>

        {/* 3. METODE / STATUS */}
        <td className="py-3.5 px-4 sm:px-5">
          <PmaStatusBadge tone={isDaring ? 'blue' : 'emerald'} weightClass="font-semibold">
            {metode}
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
    const metode = item.metode || '-'
    const isDaring = /daring|online|webinar/i.test(metode)
    const periodeLabel = item.tanggal_kegiatan_label || formatDateId(item.tanggal_kegiatan)

    return {
      title: item.judul_kegiatan || 'Detail Kegiatan',
      subtitle: `Pengembangan Kompetensi • ${periodeLabel} • ${item.penyelenggara || '-'}`,
      badge: {
        label: metode,
        className: isDaring
          ? 'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
      },
      summary: [
        {
          label: 'Judul Kegiatan',
          value: item.judul_kegiatan || '-',
          hint: `Materi: ${item.materi || '-'}`,
          icon: BookOpen,
          tone: 'blue',
        },
        {
          label: 'Periode',
          value: periodeLabel,
          hint: `Tahun Pelaporan: ${item.period_year ?? '-'}`,
          icon: Calendar,
          tone: 'slate',
        },
        {
          label: 'Metode',
          value: metode,
          hint: 'Pengembangan Kompetensi ASN',
          icon: Layers,
          tone: isDaring ? 'blue' : 'emerald',
        },
        {
          label: 'Total Partisipan',
          value: `${formatNumber(item.total_partisipan || 0)} Peserta`,
          hint: item.lokasi ? `Lokasi: ${item.lokasi}` : 'Lokasi belum tercatat',
          icon: Users,
          tone: 'indigo',
        },
        {
          label: 'Penyelenggara',
          value: item.penyelenggara || '-',
          hint: `Diperbarui ${formatDateTimeId(item.updated_at || item.created_at)}`,
          icon: Presentation,
          tone: 'slate',
        },
      ],
      sections: [
        {
          title: 'Rincian Kegiatan & Kompetensi',
          icon: Presentation,
          description: 'Rincian teknis pelaksanaan kegiatan pengembangan kompetensi.',
          rows: [
            { label: 'Judul Kegiatan', value: item.judul_kegiatan || '-' },
            { label: 'Materi', value: item.materi || '-' },
            { label: 'Metode Pelaksanaan', value: metode },
            { label: 'Tanggal Kegiatan', value: periodeLabel },
            {
              label: 'Total Partisipan',
              value: `${formatNumber(item.total_partisipan || 0)} Peserta`,
            },
            { label: 'Penyelenggara', value: item.penyelenggara || '-' },
            { label: 'Lokasi', value: item.lokasi || '-' },
            { label: 'NIP Pengunggah', value: formatNip(item.created_by || item.nip) },
            { label: 'Diperbarui Oleh', value: formatNip(item.updated_by) },
            {
              label: 'Terakhir Diperbarui',
              value: formatDateTimeId(item.updated_at || item.created_at),
            },
          ],
        },
        {
          title: 'Bukti Dukung & Catatan',
          icon: FileCheck,
          description: 'Dokumentasi serta catatan teknis pelaksanaan kegiatan.',
          rows: [
            {
              label: 'Bukti Dukung (Eviden)',
              value: item.eviden_link ? 'Tersedia (tautan eksternal)' : 'Belum dilampirkan',
            },
            { label: 'Catatan', value: item.catatan || 'Belum ada catatan pada agenda ini.' },
          ],
          children: item.eviden_link ? (
            <a
              href={item.eviden_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Buka Bukti Dukung</span>
            </a>
          ) : null,
        },
      ],
    }
  }

  const categories = [
    { value: 'klasikal', label: 'Klasikal', values: ['Klasikal', 'Tatap Muka', 'Offline'] },
    { value: 'daring', label: 'Daring', values: ['Daring (Zoom)', 'Online', 'Daring'] },
    { value: 'hybrid', label: 'Hybrid', values: ['Hybrid'] },
  ]

  return (
    <PmaCrudLayoutShell
      layananId={15}
      serviceTitle="Pengembangan Kompetensi"
      shortTitle="Pengembangan Kompetensi"
      timKerjaTitle="Pembinaan Manajemen ASN"
      description="Penyelenggaraan pelatihan, sosialisasi, dan bimbingan teknis peningkatan kompetensi manajerial, sosio-kultural, dan teknis ASN."
      templateUrl="/templates/pma/template-pengembangan-kompetensi.xlsx"
      templateName="template-pengembangan-kompetensi.xlsx"
      fetchSummaryFn={fetchPengembanganKompetensiSummary}
      fetchDataFn={fetchPengembanganKompetensiData}
      deleteDataFn={deletePengembanganKompetensiData}
      batchUploadFn={importBatchPengembanganKompetensi}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      renderDetail={renderDetail}
      FormComponent={PengembanganKompetensiFormModal}
      categories={categories}
      tableHeaderWeightClass="font-bold"
      tableBodyClassName="font-semibold"
      searchPlaceholder="Cari judul kegiatan, materi, NIP, pengunggah..."
    />
  )
}
