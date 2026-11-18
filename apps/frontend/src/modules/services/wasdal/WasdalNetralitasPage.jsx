import {
  Pencil,
  Trash2,
  Eye,
  Layers,
  Clock,
  FileSpreadsheet,
  Building2,
  Calendar,
  ArrowUpDown,
  User,
} from 'lucide-react'
import { WasdalCrudLayoutShell } from '../../../components/shared/services/wasdal/WasdalCrudLayoutShell'
import { WasdalNetralitasFormModal } from '../../../components/shared/services/wasdal/WasdalNetralitasFormModal'
import {
  DataOriginIcon,
  isExcelOrigin,
} from '../../../components/shared/services/wasdal/WasdalDataOriginIcon'
import {
  fetchWasdalSummary,
  fetchWasdalData,
  deleteWasdalData,
  importBatchWasdal,
} from '../../../services/api/wasdalServicesApi'

export default function WasdalNetralitasPage() {
  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(Number(num ?? 0))

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return String(dateStr)
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return String(dateStr)
    }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return String(dateStr)
      const datePart = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      const timePart = d
        .toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        .replace(':', '.')
      return `${datePart}, ${timePart} WIB`
    } catch {
      return String(dateStr)
    }
  }

  const formatWilayah = (wilayah, kanreg) => {
    const w = String(wilayah || '').trim().toUpperCase()
    if (w === 'JABAR' || w === 'JAWA BARAT') return 'Jawa Barat'
    if (w === 'BANTEN') return 'Banten'
    if (w) return wilayah
    if (kanreg) return `Kanreg ${kanreg} BKN`
    return 'Kanreg III BKN'
  }

  const formatAuditor = (item) => {
    const name = String(item?.created_by_name || '').trim()
    const nip = String(item?.created_by || '').trim()
    if (name) return name
    if (nip) return nip
    return '-'
  }

  const getPermasalahanStyle = (permasalahan) => {
    const p = String(permasalahan || '').toLowerCase()
    if (p.includes('netralitas'))
      return 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
    if (p.includes('disiplin'))
      return 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    if (p.includes('kode etik') || p.includes('etik'))
      return 'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
    return 'bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  }

  const renderKpis = (summary) => [
    {
      id: 'total_file',
      label: 'TOTAL DATA PENGAWASAN',
      value: summary?.total_data ?? 0,
      unit: 'Data',
      context: 'Rekapitulasi laporan tercatat',
      badge: '100% Total',
      badgeColor: 'blue',
      icon: FileSpreadsheet,
      iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_detail',
      label: 'TOTAL KASUS',
      value: summary?.total_kasus ?? 0,
      unit: 'Kasus',
      context: 'Total akumulasi kasus terlapor',
      badge: 'Realisasi',
      badgeColor: 'emerald',
      icon: Layers,
      iconColor:
        'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_instansi',
      label: 'TOTAL INSTANSI',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Instansi dalam pengawasan',
      badge: 'Jabar & Banten',
      badgeColor: 'amber',
      icon: Building2,
      iconColor: 'bg-amber-50/80 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'last_upload',
      label: 'PEMBARUAN TERAKHIR',
      value: formatDate(summary?.last_update || summary?.last_upload),
      unit: '',
      isText: true,
      context: 'Sinkronisasi data terakhir',
      badge: 'Terbaru',
      badgeColor: 'indigo',
      icon: Clock,
      iconColor:
        'bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  // 5 Kolom Standar (Bold Typography)
  const columns = [
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>INSTANSI &amp; WILAYAH</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>PERIODE</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>JENIS PELANGGARAN</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>TANGGAL</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>PETUGAS</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: <span className="font-bold">AKSI</span>,
      className: 'text-right',
    },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const permasalahanStyle = getPermasalahanStyle(item.permasalahan)
    const kodeInstansi = item.kodeins || item.instansi_id

    return (
      <tr
        key={item.id || item.uid || rowNo}
        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors font-semibold"
      >
        {/* Kolom 1 — INSTANSI & WILAYAH */}
        <td className="px-4 sm:px-5 py-3.5 font-semibold">
          <div className="flex items-center gap-3">
            <DataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewDetail && onViewDetail(item)}
                title={item.instansi_name || `Kode Instansi: ${kodeInstansi || '-'}`}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
              >
                {item.instansi_name || `Kode Instansi: ${kodeInstansi || '-'}`}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="truncate max-w-xs sm:max-w-sm">
                  {formatWilayah(item.wilayah, item.kanreg)}
                  {kodeInstansi ? ` • Kode: ${kodeInstansi}` : ''}
                </span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2 — PERIODE */}
        <td className="py-3.5 px-4 sm:px-5 font-semibold">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/60 whitespace-nowrap">
            <Calendar className="w-3 h-3 text-slate-400" />
            {item.period || '-'}
          </span>
          {(item.period_start_date || item.period_end_date) && (
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
              {formatDate(item.period_start_date)} – {formatDate(item.period_end_date)}
            </div>
          )}
        </td>

        {/* Kolom 3 — JENIS PELANGGARAN */}
        <td className="py-3.5 px-4 sm:px-5 font-semibold">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${permasalahanStyle}`}
          >
            {item.permasalahan || 'Tidak Terklasifikasi'}
          </span>
        </td>

        {/* Kolom 4 — TANGGAL */}
        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatDateTime(item.created_at)}</span>
          </div>
        </td>

        {/* Kolom 5 — PETUGAS */}
        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-200">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span
              className="font-semibold truncate max-w-[180px]"
              title={formatAuditor(item)}
            >
              {formatAuditor(item)}
            </span>
          </div>
        </td>

        {/* Kolom 6 — AKSI */}
        <td className="py-3.5 px-4 sm:px-5 font-medium">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap text-right">
            <button
              type="button"
              onClick={() => onViewDetail && onViewDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors"
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition-colors"
              title="Ubah Data"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
              title="Hapus Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const categories = [
    { value: 'Disiplin', label: 'Disiplin' },
    { value: 'Kode Etik', label: 'Kode Etik' },
    { value: 'Netralitas', label: 'Netralitas' },
    { value: 'Lainnya', label: 'Lainnya' },
  ]

  return (
    <WasdalCrudLayoutShell
      layananId={20}
      serviceTitle="Pengawasan Penerapan Netralitas, Disiplin, Kode Etik dan Perilaku"
      shortTitle="Netralitas, Disiplin & Kode Etik"
      timKerjaTitle="Pengawasan & Pengendalian"
      description="Pencatatan dan pemantauan kasus pelanggaran netralitas, disiplin, dan kode etik ASN wilayah kerja Kanreg III BKN."
      templateUrl="/templates/wasdal/template-wasdal-netralitas.xlsx"
      templateName="template-wasdal-netralitas.xlsx"
      fetchSummaryFn={fetchWasdalSummary}
      fetchDataFn={fetchWasdalData}
      deleteDataFn={deleteWasdalData}
      batchUploadFn={importBatchWasdal}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={WasdalNetralitasFormModal}
      categories={categories}
      searchPlaceholder="Cari nama instansi, jenis pelanggaran, periode..."
      detailType="netralitas"
    />
  )
}
