import {
  Briefcase,
  Building2,
  UserCheck,
  CheckCircle2,
  Calendar,
  User,
  MapPin,
  ClipboardCheck,
  Users,
} from 'lucide-react'
import { PmaCrudLayoutShell } from '../../../components/shared/services/pma/PmaCrudLayoutShell'
import { PenilaianKarierFormModal } from '../../../components/shared/services/pma/PenilaianKarierFormModal'
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
  fetchPenilaianKarierSummary,
  fetchPenilaianKarierData,
  deletePenilaianKarierData,
  importBatchPenilaianKarier,
} from '../../../services/api/pmaServicesApi'

export default function PenilaianKarierPage() {
  const renderKpis = (summary) => [
    {
      id: 'total_data',
      label: 'TOTAL SESI SELEKSI',
      value: summary?.total_rekap ?? 0,
      unit: 'Sesi',
      context: 'Uji kompetensi perpindahan & promosi',
      badge: '100% Tercatat',
      badgeColor: 'blue',
      icon: Briefcase,
      iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_peserta',
      label: 'TOTAL PESERTA UJI',
      value: summary?.total_peserta ?? 0,
      unit: 'Pegawai',
      context: 'Peserta seleksi terdaftar',
      badge: 'Peserta Karier',
      badgeColor: 'indigo',
      icon: UserCheck,
      iconColor: 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'total_memenuhi',
      label: 'MEMENUHI SYARAT (MS)',
      value: summary?.total_memenuhi ?? 0,
      unit: 'Pegawai',
      context: 'Kualifikasi terpenuhi',
      badge: 'Memenuhi Syarat',
      badgeColor: 'emerald',
      icon: CheckCircle2,
      iconColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_lulus',
      label: 'DINYATAKAN LULUS',
      value: summary?.total_lulus ?? 0,
      unit: 'Pegawai',
      context: 'Rekomendasi penetapan karier',
      badge: 'Hasil Akhir',
      badgeColor: 'amber',
      icon: Building2,
      iconColor: 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  const columns = [
    { header: 'Instansi & Wilayah' },
    { header: 'Periode Asistensi' },
    { header: 'Jenis Seleksi' },
    { header: 'Tanggal' },
    { header: 'Petugas' },
    { header: 'Aksi', className: 'text-right', align: 'right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const totalPeserta = Number(item.total_peserta || 0)
    const lulus = Number(item.lulus || 0)
    const percent = totalPeserta > 0 ? Math.round((lulus / totalPeserta) * 100) : null
    const isGood = percent !== null && percent >= 80
    const wilayahLabel = formatWilayah(item.wilayah, item.kanreg)
    const periodeLabel = formatDateId(item.tanggal)
    const tanggalPetugasLabel = formatDateId(item.updated_at || item.created_at || item.tanggal)
    const petugas = formatNip(item.created_by || item.nip)

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

        {/* 3. JENIS SELEKSI */}
        <td className="py-3.5 px-4 sm:px-5">
          <PmaStatusBadge tone={isGood ? 'emerald' : 'blue'} weightClass="font-semibold">
            {item.jenis_penilaian || '-'}
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
    const totalPeserta = Number(item.total_peserta || 0)
    const memenuhi = Number(item.memenuhi || 0)
    const tidakMemenuhi = Number(item.tidak_memenuhi || 0)
    const lulus = Number(item.lulus || 0)
    const tidakLulus = Number(item.tidak_lulus || 0)
    const tidakHadir = Number(item.tidak_hadir || 0)
    const percent = totalPeserta > 0 ? Math.round((lulus / totalPeserta) * 100) : null
    const wilayahLabel = formatWilayah(item.wilayah, item.kanreg)
    const kanregLabel = formatKanregLabel(item.kanreg)
    const periodeLabel = formatDateId(item.tanggal)
    const petugas = formatNip(item.created_by || item.nip)

    return {
      title: item.instansi_nama || item.instansi_name || `Instansi Kode: ${item.instansi_id}`,
      subtitle: `Penilaian Karier • ${periodeLabel} • ${wilayahLabel}`,
      badge: {
        label: item.jenis_penilaian || '-',
        className:
          'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
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
          hint: 'Tanggal pelaksanaan seleksi',
          icon: Calendar,
          tone: 'slate',
        },
        {
          label: 'Total Peserta',
          value: `${formatNumber(totalPeserta)} Peserta`,
          hint: `Lulus: ${formatNumber(lulus)} (${percent === null ? '-' : `${percent}%`})`,
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
          title: 'Rincian Kualifikasi & Hasil Akhir',
          icon: ClipboardCheck,
          description: 'Rincian teknis kualifikasi dan penetapan hasil seleksi karier.',
          rows: [
            { label: 'Kode Instansi', value: item.instansi_id ?? '-' },
            { label: 'Wilayah Kerja', value: wilayahLabel },
            { label: 'Tanggal Pelaksanaan', value: periodeLabel },
            { label: 'Jenis Seleksi Karier', value: item.jenis_penilaian || '-' },
            { label: 'Total Peserta', value: formatNumber(totalPeserta) },
            { label: 'Memenuhi Syarat (MS)', value: formatNumber(memenuhi) },
            { label: 'Tidak Memenuhi Syarat (TMS)', value: formatNumber(tidakMemenuhi) },
            { label: 'Dinyatakan Lulus', value: formatNumber(lulus) },
            { label: 'Tidak Lulus', value: formatNumber(tidakLulus) },
            { label: 'Tidak Hadir', value: formatNumber(tidakHadir) },
            { label: 'NIP Pengunggah', value: petugas },
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
    {
      value: 'ud',
      label: 'Ujian Dinas (UD)',
      values: ['UD Tk 1', 'UD Tk 2', 'Ujian Dinas'],
    },
    {
      value: 'upkp',
      label: 'UPKP',
      values: ['UPKP SLTP/SMA', 'UPKP S1', 'UPKP S2'],
    },
    {
      value: 'seleksi-terbuka',
      label: 'Seleksi Terbuka',
      values: ['Seleksi Terbuka JPT Pratama', 'Seleksi Terbuka JPT Madya'],
    },
    {
      value: 'uji-kelayakan',
      label: 'Uji Kelayakan',
      values: [
        'Uji Kelayakan Administrator',
        'Uji Kelayakan Mutasi Eselon III',
        'Uji Kompetensi Jabatan Pengawas',
        'Uji Kompetensi Pengawas',
      ],
    },
    {
      value: 'evaluasi-kinerja',
      label: 'Evaluasi Kinerja',
      values: ['Evaluasi Kinerja Jabatan'],
    },
  ]

  return (
    <PmaCrudLayoutShell
      layananId={40}
      serviceTitle="Penilaian Karier"
      shortTitle="Penilaian Karier"
      timKerjaTitle="Pembinaan Manajemen ASN"
      description="Uji kompetensi perpindahan dari jabatan lain, kenaikan jenjang jabatan fungsional, dan promosi karier ASN."
      templateUrl="/templates/pma/template-penilaian-karier.xlsx"
      templateName="template-penilaian-karier.xlsx"
      fetchSummaryFn={fetchPenilaianKarierSummary}
      fetchDataFn={fetchPenilaianKarierData}
      deleteDataFn={deletePenilaianKarierData}
      batchUploadFn={importBatchPenilaianKarier}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      renderDetail={renderDetail}
      FormComponent={PenilaianKarierFormModal}
      categories={categories}
      tableHeaderWeightClass="font-bold"
      tableBodyClassName="font-semibold"
      searchPlaceholder="Cari instansi, jenis seleksi, NIP, pengunggah..."
    />
  )
}
