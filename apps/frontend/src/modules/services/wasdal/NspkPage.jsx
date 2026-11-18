import {
  Pencil,
  Trash2,
  Eye,
  Award,
  Clock,
  FileSpreadsheet,
  Building2,
  Calendar,
  ArrowUpDown,
  User,
} from 'lucide-react'
import { WasdalCrudLayoutShell } from '../../../components/shared/services/wasdal/WasdalCrudLayoutShell'
import { NspkFormModal } from '../../../components/shared/services/wasdal/NspkFormModal'
import {
  DataOriginIcon,
  isExcelOrigin,
} from '../../../components/shared/services/wasdal/WasdalDataOriginIcon'
import {
  fetchNspkSummary,
  fetchNspkData,
  deleteNspkData,
  importBatchNspk,
} from '../../../services/api/wasdalServicesApi'

export default function NspkPage() {
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

  const levelMap = {
    A: {
      label: 'Sangat Baik',
      color:
        'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    },
    B: {
      label: 'Baik',
      color:
        'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    },
    C: {
      label: 'Cukup',
      color:
        'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    },
    D: {
      label: 'Kurang',
      color:
        'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    },
  }

  const renderKpis = (summary) => [
    {
      id: 'total_file',
      label: 'TOTAL EVALUASI NSPK',
      value: summary?.total_data ?? 0,
      unit: 'Data',
      context: 'Rekapitulasi evaluasi tercatat',
      badge: '100% Total',
      badgeColor: 'blue',
      icon: FileSpreadsheet,
      iconColor: 'bg-blue-50/80 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'level_a',
      label: 'PERINGKAT LEVEL A',
      value: summary?.level_a ?? 0,
      unit: 'Instansi',
      context: `Level B: ${summary?.level_b ?? 0} • Level C: ${summary?.level_c ?? 0}`,
      badge: 'Sangat Baik',
      badgeColor: 'emerald',
      icon: Award,
      iconColor:
        'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_instansi',
      label: 'TOTAL INSTANSI',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Instansi wilayah kerja',
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

  // 5 Kolom Standar (Bold Typography, 100% data aktual txn_nspk)
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
          <span>PERIODE EVALUASI</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
      ),
    },
    {
      header: (
        <div className="flex items-center gap-1.5 cursor-default font-bold">
          <span>PREDIKAT LEVEL</span>
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
    const levelKey = String(item.level || 'B').toUpperCase()
    const lc = levelMap[levelKey] || levelMap.B
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

        {/* Kolom 2 — PERIODE EVALUASI */}
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

        {/* Kolom 3 — PREDIKAT LEVEL */}
        <td className="py-3.5 px-4 sm:px-5 font-semibold">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${lc.color}`}
          >
            Level {levelKey}
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
    { value: 'A', label: 'Level A' },
    { value: 'B', label: 'Level B' },
    { value: 'C', label: 'Level C' },
    { value: 'D', label: 'Level D' },
  ]

  return (
    <WasdalCrudLayoutShell
      layananId={19}
      serviceTitle="Pengukuran Indeks NSPK"
      shortTitle="Indeks NSPK"
      timKerjaTitle="Pengawasan & Pengendalian"
      description="Monitoring evaluasi indeks norma, standar, prosedur, dan kriteria (NSPK) ASN instansi daerah wilayah kerja Kanreg III BKN."
      templateUrl="/templates/wasdal/template-indeks-nspk.xlsx"
      templateName="template-indeks-nspk.xlsx"
      fetchSummaryFn={fetchNspkSummary}
      fetchDataFn={fetchNspkData}
      deleteDataFn={deleteNspkData}
      batchUploadFn={importBatchNspk}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={NspkFormModal}
      categories={categories}
      searchPlaceholder="Cari nama instansi, wilayah, level, atau auditor..."
      detailType="nspk"
    />
  )
}
