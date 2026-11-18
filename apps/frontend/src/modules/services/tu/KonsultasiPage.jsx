import {
  MessageSquare,
  Users,
  Video,
  Calendar,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  Share2,
  Headphones,
  PhoneCall,
  Building2,
} from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { KonsulFormModal } from './components/KonsulFormModal'
import { KonsulDetailModal } from './components/KonsulDetailModal'
import {
  fetchKonsulSummary,
  fetchKonsulData,
  deleteKonsulData,
} from '../../../services/api/tuServicesApi'

export default function KonsultasiPage() {
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
      id: 'total_pelayanan',
      label: 'TOTAL SESI KONSULTASI',
      value: summary?.total_pelayanan ?? summary?.total_konsultasi ?? 0,
      unit: 'Sesi',
      context: 'Akumulasi konsultasi',
      badge: 'Total Sesi',
      badgeColor: 'blue',
      icon: MessageSquare,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_data',
      label: 'TOTAL KEGIATAN',
      value: summary?.total_data ?? 0,
      unit: 'Kegiatan',
      context: 'Frekuensi fasilitasi',
      badge: 'Kegiatan',
      badgeColor: 'emerald',
      icon: Users,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_kanal',
      label: 'KANAL LAYANAN AKTIF',
      value: summary?.total_kanal ?? 0,
      unit: 'Kanal',
      context: 'Media konsultasi',
      badge: 'Kanal',
      badgeColor: 'indigo',
      icon: Share2,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'last_update',
      label: 'UPDATE KONSULTASI',
      value: formatDate(summary?.last_update),
      unit: '',
      isText: true,
      context: 'Layanan terkini',
      badge: 'Terbaru',
      badgeColor: 'amber',
      icon: Calendar,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  const columns = [
    { header: 'KONSULTASI' },
    { header: 'KANAL LAYANAN' },
    { header: 'STATUS' },
    { header: 'SESI' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    return (
      <tr key={item.id || rowNo} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors">
        {/* Kolom 1: KONSULTASI */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <TuDataOriginIcon type="manual" />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewDetail && onViewDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.keterangan || '-'}
              >
                {item.keterangan || '-'}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span>Periode {item.period || '-'}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: KANAL LAYANAN */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          {(() => {
            const p = (item.pelayanan || '').toLowerCase()
            let icon = <Users className="w-3.5 h-3.5 text-slate-500" />
            let badgeStyle =
              'bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/60'

            if (p.includes('whatsapp') || p.includes('wa')) {
              icon = <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              badgeStyle =
                'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/50'
            } else if (p.includes('sosial') || p.includes('instagram') || p.includes('medsos')) {
              icon = <Share2 className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
              badgeStyle =
                'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200/70 dark:border-pink-800/50'
            } else if (p.includes('helpdesk')) {
              icon = <Headphones className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              badgeStyle =
                'bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-300 border-blue-200/70 dark:border-blue-800/50'
            } else if (p.includes('ptsp')) {
              icon = <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              badgeStyle =
                'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/50'
            } else if (p.includes('zoom') || p.includes('virtual')) {
              icon = <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              badgeStyle =
                'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/50'
            }

            return (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeStyle}`}>
                {icon}
                <span>{item.pelayanan || '-'}</span>
              </span>
            )
          })()}
        </td>

        {/* Kolom 3: STATUS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Selesai
          </span>
        </td>

        {/* Kolom 4: SESI */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
            {item.jumlah || 1} Sesi
          </span>
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuTanggalCell value={item.period_start_date || item.created_at} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuPetugasCell value={item.konselor || item.petugas || item.created_by || 'Konselor TU'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="px-4 py-3.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onViewDetail && onViewDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Konsultasi"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              title="Ubah Data"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <TuCrudLayoutShell
      layananId={33}
      serviceTitle="Pelayanan Konsultasi"
      shortTitle="Konsultasi ASN"
      description="Fasilitasi konsultasi kepegawaian bagi instansi daerah."
      templateUrl="/templates/tu/template-konsultasi.xlsx"
      templateName="template-konsultasi.xlsx"
      fetchSummaryFn={fetchKonsulSummary}
      fetchDataFn={fetchKonsulData}
      deleteDataFn={deleteKonsulData}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={KonsulFormModal}
      DetailModalComponent={KonsulDetailModal}
      searchPlaceholder="Cari kanal, topik konsultasi, pemohon..."
      categories={[
        { id: '', label: 'Semua Kanal' },
        { id: 'WhatsApp', label: 'WhatsApp' },
        { id: 'Helpdesk', label: 'Helpdesk' },
        { id: 'Media Sosial', label: 'Media Sosial' },
        { id: 'PTSP', label: 'PTSP' },
        { id: 'Tatap Muka', label: 'Tatap Muka' },
        { id: 'Virtual Zoom', label: 'Virtual Zoom' },
      ]}
    />
  )
}
