import { Share2, Eye, Users, Flame, Calendar, Pencil, Trash2, Layers } from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { HumasFormModal } from './components/HumasFormModal'
import { HumasDetailModal } from './components/HumasDetailModal'
import {
  fetchHumasSummary,
  fetchHumasData,
  deleteHumasData,
} from '../../../services/api/tuServicesApi'

export default function HumasPage() {
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

  const renderKpis = (summary) => [
    {
      id: 'total_konten',
      label: 'TOTAL KONTEN RILIS',
      value: summary?.total_konten ?? 0,
      unit: 'Postingan',
      context: 'Multi-kanal publikasi',
      badge: 'Multi-Kanal',
      badgeColor: 'blue',
      icon: Share2,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_viewers',
      label: 'TOTAL IMPRESI / TAYANGAN',
      value: summary?.total_viewers ?? 0,
      unit: 'Tayangan',
      context: 'Jangkauan audiens',
      badge: 'Organik',
      badgeColor: 'emerald',
      icon: Eye,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_followers',
      label: 'TOTAL FOLLOWERS',
      value: summary?.total_followers ?? 0,
      unit: 'Pengikut',
      context: 'Komunitas resmi BKN',
      badge: 'Komunitas',
      badgeColor: 'indigo',
      icon: Users,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'top_channel',
      label: 'KANAL PALING AKTIF',
      value: summary?.top_channel || '-',
      unit: '',
      isText: true,
      context: 'Engagement tertinggi',
      badge: 'Top Channel',
      badgeColor: 'rose',
      icon: Flame,
      iconColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    },
  ]

  const columns = [
    { header: 'KONTEN PUBLIKASI' },
    { header: 'KANAL MEDIA' },
    { header: 'VOLUME KONTEN' },
    { header: 'IMPRESI & AUDIENS' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    let channelColor = 'bg-slate-100 text-slate-700'
    const ch = (item.kanal || '').toLowerCase()
    if (ch.includes('instagram')) channelColor = 'bg-pink-50 text-pink-700 border-pink-200/60'
    else if (ch.includes('youtube')) channelColor = 'bg-red-50 text-red-700 border-red-200/60'
    else if (ch.includes('tiktok')) channelColor = 'bg-slate-900 text-white'
    else if (ch.includes('facebook')) channelColor = 'bg-blue-50 text-blue-700 border-blue-200/60'
    else if (ch.includes('website')) channelColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/60'

    return (
      <tr key={item.id || rowNo} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors">
        {/* Kolom 1: KONTEN PUBLIKASI */}
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

        {/* Kolom 2: KANAL MEDIA */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${channelColor}`}>
            {item.kanal || 'Lainnya'}
          </span>
        </td>

        {/* Kolom 3: VOLUME KONTEN */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>{item.jumlah_konten || 1} Rilis</span>
          </span>
        </td>

        {/* Kolom 4: IMPRESI & AUDIENS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
            {formatNumber(item.jumlah_viewers || 0)} Views
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Followers: {formatNumber(item.jumlah_followers || 0)}
          </div>
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuTanggalCell value={item.period_start_date || item.created_at} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuPetugasCell value={item.petugas || item.created_by || item.editor || 'Pranata Humas'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="px-4 py-3.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onViewDetail && onViewDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Publikasi"
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
      layananId={31}
      serviceTitle="Kehumasan & Publikasi"
      shortTitle="Humas & Publikasi"
      description="Rekapitulasi publikasi informasi kepegawaian melalui media sosial dan website."
      templateUrl="/templates/tu/template-humas.xlsx"
      templateName="template-humas.xlsx"
      fetchSummaryFn={fetchHumasSummary}
      fetchDataFn={fetchHumasData}
      deleteDataFn={deleteHumasData}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={HumasFormModal}
      DetailModalComponent={HumasDetailModal}
      searchPlaceholder="Cari kanal, topik informasi, atau pengunggah..."
      categories={[
        { id: '', label: 'Semua Kanal' },
        { id: 'Instagram', label: 'Instagram' },
        { id: 'YouTube', label: 'YouTube' },
        { id: 'TikTok', label: 'TikTok' },
        { id: 'Facebook', label: 'Facebook' },
        { id: 'Website', label: 'Website' },
      ]}
    />
  )
}
