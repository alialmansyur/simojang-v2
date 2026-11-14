import {
  Award,
  Building2,
  Users,
  Cpu,
  Calendar,
  User,
  MapPin,
} from 'lucide-react'
import { PmaCrudLayoutShell } from '../../../components/shared/services/pma/PmaCrudLayoutShell'
import { PenilaianKompetensiFormModal } from '../../../components/shared/services/pma/PenilaianKompetensiFormModal'
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
  formatNumber,
  formatWilayah,
} from '../../../components/shared/services/pma/pmaFormatters'

import {
  fetchPenilaianKompetensiSummary,
  fetchPenilaianKompetensiData,
  deletePenilaianKompetensiData,
  importBatchPenilaianKompetensi,
} from '../../../services/api/pmaServicesApi'

export default function PenilaianKompetensiPage() {
  const renderKpis = (summary) => [
    {
      id: 'total_data',
      label: 'TOTAL SESI PENILAIAN',
      value: summary?.total_rekap ?? 0,
      unit: 'Sesi',
      context: 'Pelaksanaan asesmen kompetensi',
      badge: '100% Tercatat',
      badgeColor: 'blue',
      icon: Award,
      iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_peserta',
      label: 'TOTAL PESERTA ASESMEN',
      value: summary?.total_peserta ?? 0,
      unit: 'Pegawai',
      context: 'Aparatur Sipil Negara dinilai',
      badge: 'Peserta Uji',
      badgeColor: 'emerald',
      icon: Users,
      iconColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_instansi',
      label: 'INSTANSI TERLAYANI',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Pemerintah daerah fasilitasi',
      badge: 'Wilayah Binaan',
      badgeColor: 'indigo',
      icon: Building2,
      iconColor: 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'cact_metode',
      label: 'SESI CACT BKN',
      value: summary?.cact_metode ?? 0,
      unit: 'Sesi',
      context: 'Computer Assisted Competency Test',
      badge: 'Metode Unggulan',
      badgeColor: 'amber',
      icon: Cpu,
      iconColor: 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  const columns = [
    { header: 'Instansi & Wilayah' },
    { header: 'Periode Asistensi' },
    { header: 'Metode Asesmen' },
    { header: 'Tanggal' },
    { header: 'Petugas' },
    { header: 'Aksi', className: 'text-right', align: 'right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const metode = item.metode || '-'
    const isCact = /cact/i.test(metode)
    const wilayahLabel = formatWilayah(item.wilayah, item.kanreg)
    const periodeLabel = formatDateId(item.tanggal)
    const petugas = formatNip(item.updated_by || item.created_by || item.nip)

    return (
      <tr
        key={item.id || item.uid}
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
                {item.instansi_nama || item.instansi_name || `Instansi Kode: ${item.instansi_id}`}
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
          <PmaPeriodeBadge weightClass="font-semibold">{periodeLabel}</PmaPeriodeBadge>
        </td>

        {/* 3. METODE ASESMEN */}
        <td className="py-3.5 px-4 sm:px-5">
          <PmaStatusBadge tone={isCact ? 'emerald' : 'blue'} weightClass="font-semibold">
            {metode}
          </PmaStatusBadge>
        </td>

        {/* 4. TANGGAL */}
        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
          <PmaTanggalCell
            dateTime={formatDateTimeId(item.updated_at || item.created_at || item.tanggal)}
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
    const isCact = /cact/i.test(metode)
    const wilayahLabel = formatWilayah(item.wilayah, item.kanreg)
    const kanregLabel = formatKanregLabel(item.kanreg)
    const periodeLabel = formatDateId(item.tanggal)
    const petugas = formatNip(item.updated_by || item.created_by || item.nip)

    return {
      title: item.instansi_nama || item.instansi_name || `Instansi Kode: ${item.instansi_id}`,
      subtitle: `Penilaian Kompetensi • ${periodeLabel} • ${wilayahLabel}`,
      badge: {
        label: metode,
        className: isCact
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
          : 'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
      },
      summary: [
        {
          label: 'Instansi',
          value: item.instansi_nama || item.instansi_name || '-',
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
          value: periodeLabel,
          hint: 'Tanggal pelaksanaan asesmen',
          icon: Calendar,
          tone: 'slate',
        },
        {
          label: 'Total Peserta',
          value: `${formatNumber(item.total_peserta || 0)} Peserta`,
          hint: 'Peserta asesmen kompetensi',
          icon: Users,
          tone: 'indigo',
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
          title: 'Rincian Sesi Asesmen Kompetensi',
          icon: Cpu,
          description: 'Rincian teknis pelaksanaan asesmen kompetensi terhadap pegawai.',
          rows: [
            { label: 'Kode Instansi', value: item.instansi_id ?? '-' },
            { label: 'Wilayah Kerja', value: wilayahLabel },
            { label: 'Tanggal Pelaksanaan', value: periodeLabel },
            { label: 'Metode Asesmen', value: metode },
            {
              label: 'Total Peserta',
              value: `${formatNumber(item.total_peserta || 0)} Peserta`,
            },
            { label: 'NIP Pengunggah', value: formatNip(item.created_by || item.nip) },
            { label: 'Diperbarui Oleh', value: formatNip(item.updated_by) },
            { label: 'Dibuat Pada', value: formatDateTimeId(item.created_at) },
            {
              label: 'Terakhir Diperbarui',
              value: formatDateTimeId(item.updated_at || item.created_at),
            },
          ],
        },
      ],
    }
  }

  const categories = [
    { value: 'cact', label: 'CACT BKN', values: ['CACT BKN', 'CACT'] },
    { value: 'proasn', label: 'Pro ASN', values: ['Pro ASN'] },
    { value: 'integrasi', label: 'Integrasi Data', values: ['Integrasi Data'] },
  ]

  return (
    <PmaCrudLayoutShell
      layananId={39}
      serviceTitle="Penilaian Kompetensi"
      shortTitle="Penilaian Kompetensi"
      timKerjaTitle="Pembinaan Manajemen ASN"
      description="Fasilitasi asesmen kompetensi ASN berbasis Computer Assisted Competency Test (CACT) dan Assessment Center."
      templateUrl="/templates/pma/template-penilaian-kompetensi.xlsx"
      templateName="template-penilaian-kompetensi.xlsx"
      fetchSummaryFn={fetchPenilaianKompetensiSummary}
      fetchDataFn={fetchPenilaianKompetensiData}
      deleteDataFn={deletePenilaianKompetensiData}
      batchUploadFn={importBatchPenilaianKompetensi}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      renderDetail={renderDetail}
      FormComponent={PenilaianKompetensiFormModal}
      categories={categories}
      tableHeaderWeightClass="font-bold"
      tableBodyClassName="font-semibold"
      searchPlaceholder="Cari instansi, metode uji, NIP, pengunggah..."
    />
  )
}
