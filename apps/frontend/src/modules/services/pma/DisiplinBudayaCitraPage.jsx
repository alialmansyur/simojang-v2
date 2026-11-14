import {
  Shield,
  Building2,
  MessageSquare,
  BookOpen,
  Calendar,
  User,
  MapPin,
  History,
  ScrollText,
} from 'lucide-react'
import { PmaCrudLayoutShell } from '../../../components/shared/services/pma/PmaCrudLayoutShell'
import { DisiplinCitraFormModal } from '../../../components/shared/services/pma/DisiplinCitraFormModal'
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
  fetchDisiplinSummary,
  fetchDisiplinData,
  fetchDisiplinDetail,
  deleteDisiplinData,
  importBatchDisiplin,
} from '../../../services/api/pmaServicesApi'

export default function DisiplinBudayaCitraPage() {
  const renderKpis = (summary) => [
    {
      id: 'total_data',
      label: 'TOTAL AGENDA',
      value: summary?.total_data ?? 0,
      unit: 'Agenda',
      context: 'Asistensi, konsultasi & regulasi',
      badge: '100% Tercatat',
      badgeColor: 'blue',
      icon: Shield,
      iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_instansi',
      label: 'INSTANSI TERFASILITASI',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Wilayah binaan Kanreg III',
      badge: 'Jabar & Banten',
      badgeColor: 'indigo',
      icon: Building2,
      iconColor: 'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'total_konsultasi',
      label: 'LAYANAN KONSULTASI',
      value: summary?.total_konsultasi ?? 0,
      unit: 'Konsultasi',
      context: 'Tatap muka & daring ASN',
      badge: 'Responsif',
      badgeColor: 'emerald',
      icon: MessageSquare,
      iconColor: 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_regulasi',
      label: 'SOSIALISASI REGULASI',
      value: summary?.total_regulasi ?? 0,
      unit: 'Kegiatan',
      context: 'PP Disiplin & Kode Etik ASN',
      badge: 'Sosialisasi',
      badgeColor: 'amber',
      icon: BookOpen,
      iconColor: 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  const columns = [
    { header: 'Instansi & Wilayah' },
    { header: 'Periode Asistensi' },
    { header: 'Kategori Kegiatan' },
    { header: 'Tanggal' },
    { header: 'Petugas' },
    { header: 'Aksi', className: 'text-right', align: 'right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const kategori = item.kategori_nama || 'Agenda Pembinaan'
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
            {item.period_date_label || formatDateId(item.period_date)}
          </PmaPeriodeBadge>
        </td>

        {/* 3. KATEGORI KEGIATAN */}
        <td className="py-3.5 px-4 sm:px-5">
          <PmaStatusBadge
            tone={item.jenis_layanan === 'REGULASI' ? 'amber' : 'blue'}
            weightClass="font-semibold"
          >
            {kategori}
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

  const renderDetail = async (item) => {
    let historyList = []
    try {
      const res = await fetchDisiplinDetail({
        instansi_id: item.instansi_id,
        period_year: item.period_year,
      })
      if (Array.isArray(res)) {
        historyList = res
      }
    } catch (err) {
      console.warn('Gagal mengambil riwayat instansi Disiplin & Budaya Citra:', err)
    }

    const currentRecord =
      historyList.find((row) => String(row.id) === String(item.id)) || item
    const kategori = currentRecord.kategori_nama || item.kategori_nama || 'Agenda Pembinaan'
    const wilayahLabel = formatWilayah(item.wilayah, item.kanreg)
    const kanregLabel = formatKanregLabel(item.kanreg)
    const petugas = formatNip(item.updated_by || item.created_by || item.nip)
    const formattedPegawaiNames = String(
      currentRecord.pegawai_names || item.pegawai_names || ''
    )
      .split('||')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ')

    const historyExportRows = historyList.map((row, idx) => ({
      label: `Agenda #${idx + 1} (${row.period_date_label || formatDateId(row.period_date)})`,
      value: `${row.kategori_nama || '-'} (${row.jenis_layanan || '-'}) — ${
        row.judul_kegiatan || '-'
      } • Kanal: ${row.source_konsultasi || '-'}`,
    }))

    return {
      title: item.instansi_name || `Instansi Kode: ${item.instansi_id}`,
      subtitle: `Disiplin, Budaya Kerja & Citra • ${
        item.period_date_label || formatDateId(item.period_date)
      } • ${wilayahLabel}`,
      badge: {
        label: kategori,
        className:
          item.jenis_layanan === 'REGULASI'
            ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
            : 'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
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
          value: item.period_date_label || formatDateId(item.period_date),
          hint: `Tahun Pelaporan: ${item.period_year ?? '-'}`,
          icon: Calendar,
          tone: 'slate',
        },
        {
          label: 'Petugas Pelaksana',
          value: `${formatNumber(currentRecord.total_pegawai ?? item.total_pegawai ?? 0)} Pegawai`,
          hint: item.source_konsultasi
            ? `Kanal: ${item.source_konsultasi}`
            : 'Kanal belum tercatat',
          icon: History,
          tone: 'emerald',
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
          title: 'Rincian Agenda Disiplin & Budaya Kerja',
          icon: ScrollText,
          description: 'Rincian teknis kegiatan asistensi, konsultasi, dan sosialisasi regulasi.',
          rows: [
            { label: 'Kode Instansi', value: item.instansi_id ?? '-' },
            { label: 'Wilayah Kerja', value: wilayahLabel },
            { label: 'Kategori Kegiatan', value: kategori },
            { label: 'Jenis Layanan', value: item.jenis_layanan || '-' },
            { label: 'Judul Kegiatan / Topik', value: item.judul_kegiatan || '-' },
            {
              label: 'Tanggal Pelaksanaan',
              value: item.period_date_label || formatDateId(item.period_date),
            },
            { label: 'Kanal / Media Layanan', value: item.source_konsultasi || '-' },
            { label: 'Tempat Kegiatan', value: item.tempat_kegiatan || '-' },
            { label: 'No. Surat / Nota Dinas', value: item.no_surat_kegiatan || '-' },
            {
              label: 'Jumlah Petugas Pelaksana',
              value: formatNumber(currentRecord.total_pegawai ?? item.total_pegawai ?? 0),
            },
            { label: 'Daftar Petugas Terkait', value: formattedPegawaiNames || '-' },
            { label: 'NIP Pengunggah', value: formatNip(item.created_by || item.nip) },
            { label: 'Diperbarui Oleh', value: formatNip(item.updated_by) },
            {
              label: 'Terakhir Diperbarui',
              value: formatDateTimeId(item.updated_at || item.created_at),
            },
          ],
        },
        {
          title: 'Catatan & Kesimpulan Asistensi',
          icon: MessageSquare,
          description: 'Catatan poin kesepakatan atau tindak lanjut instansi terkait.',
          rows: [
            {
              label: 'Catatan',
              value:
                currentRecord.catatan ||
                item.catatan ||
                'Belum ada catatan pada agenda ini.',
            },
          ],
        },
        {
          title: 'Riwayat Pembinaan Instansi',
          icon: History,
          description: 'Seluruh agenda pembinaan disiplin, budaya kerja & citra pada instansi ini.',
          exportRows: historyExportRows,
          children:
            historyList.length > 0 ? (
              <div className="space-y-2.5">
                {historyList.map((row, idx) => (
                  <div
                    key={row.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 px-3.5 py-2.5"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-[#175CD3] border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/50">
                          {row.jenis_layanan || 'AGENDA'}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {row.judul_kegiatan || row.kategori_nama || '-'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {row.kategori_nama || '-'} • Kanal: {row.source_konsultasi || '-'} • Tempat:{' '}
                        {row.tempat_kegiatan || '-'}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                      {row.period_date_label || formatDateId(row.period_date)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Belum ada riwayat pembinaan lainnya.</p>
            ),
        },
      ],
    }
  }

  const categories = [
    { value: 'ASISTENSI', label: 'Asistensi' },
    { value: 'KONSULTASI', label: 'Konsultasi' },
    { value: 'REGULASI', label: 'Sosialisasi Regulasi' },
  ]

  return (
    <PmaCrudLayoutShell
      layananId={16}
      serviceTitle="Pembinaan Disiplin, Budaya Kerja & Citra ASN"
      shortTitle="Disiplin & Budaya Kerja"
      timKerjaTitle="Pembinaan Manajemen ASN"
      description="Konsultasi kode etik, penegakan disiplin ASN, dan penguatan budaya kerja BerAKHLAK pada instansi wilayah kerja."
      templateUrl="/templates/pma/template-disiplin-budaya-citra.xlsx"
      templateName="template-disiplin-budaya-citra.xlsx"
      fetchSummaryFn={fetchDisiplinSummary}
      fetchDataFn={fetchDisiplinData}
      deleteDataFn={deleteDisiplinData}
      batchUploadFn={importBatchDisiplin}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      renderDetail={renderDetail}
      FormComponent={DisiplinCitraFormModal}
      categories={categories}
      tableHeaderWeightClass="font-bold"
      tableBodyClassName="font-semibold"
      searchPlaceholder="Cari topik kegiatan, surat, NIP, pengunggah..."
    />
  )
}
