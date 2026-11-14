import { Package, CheckCircle2, Clock, MapPin, Calendar, Pencil, Trash2, Eye } from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { LostFoundFormModal } from './components/LostFoundFormModal'
import { LostFoundDetailModal } from './components/LostFoundDetailModal'
import {
  fetchLostFoundSummary,
  fetchLostFoundData,
  deleteLostFoundData,
} from '../../../services/api/tuServicesApi'

export default function LostAndFoundPage() {
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
      id: 'total_barang',
      label: 'TOTAL BARANG TEMUAN',
      value: summary?.total_barang ?? 0,
      unit: 'Barang',
      context: 'Inventaris barang hilang',
      badge: 'Inventaris',
      badgeColor: 'blue',
      icon: Package,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'belum_diserahkan',
      label: 'BELUM DIAMBIL',
      value: summary?.belum_diserahkan ?? 0,
      unit: 'Barang',
      context: 'Dalam penyimpanan aman',
      badge: 'Tersimpan',
      badgeColor: 'amber',
      icon: Clock,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'diserahkan',
      label: 'SUDAH DISERAHKAN',
      value: summary?.diserahkan ?? 0,
      unit: 'Barang',
      context: 'Dikembalikan ke pemilik',
      badge: 'Tuntas',
      badgeColor: 'emerald',
      icon: CheckCircle2,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'last_update',
      label: 'TEMUAN TERAKHIR',
      value: formatDate(summary?.last_update),
      unit: '',
      isText: true,
      context: 'Laporan barang terbaru',
      badge: 'Terbaru',
      badgeColor: 'indigo',
      icon: Calendar,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  const columns = [
    { header: 'NAMA BARANG' },
    { header: 'LOKASI' },
    { header: 'STATUS' },
    { header: 'KETERANGAN' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const isGiven = item.status_penyerahan === 'Diserahkan'
    return (
      <tr key={item.id || rowNo} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors">
        {/* Kolom 1: NAMA BARANG */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <TuDataOriginIcon type="manual" />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewDetail && onViewDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.nama_barang}
              >
                {item.nama_barang}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                <span>{item.lokasi_ditemukan || '-'}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: LOKASI */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate max-w-[140px]">{item.lokasi_ditemukan || '-'}</span>
          </span>
        </td>

        {/* Kolom 3: STATUS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isGiven
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            {isGiven ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {item.status_penyerahan || 'Belum Diserahkan'}
          </span>
        </td>

        {/* Kolom 4: KETERANGAN */}
        <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-xs">
          <div className="truncate">{item.keterangan || '-'}</div>
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuTanggalCell value={item.tanggal_ditemukan || item.created_at} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuPetugasCell value={item.petugas || item.penemu || item.created_by || 'Petugas Keamanan'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="px-4 py-3.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onViewDetail && onViewDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Barang"
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
      layananId={41}
      serviceTitle="Informasi Barang Hilang & Ditemukan"
      shortTitle="Lost and Found"
      description="Pengelolaan informasi barang hilang dan penyerahan kembali."
      templateUrl="/templates/tu/template-lost-found.xlsx"
      templateName="template-lost-found.xlsx"
      fetchSummaryFn={fetchLostFoundSummary}
      fetchDataFn={(params) =>
        fetchLostFoundData({
          ...params,
          status_penyerahan: params.category || params.status_penyerahan || '',
        })
      }
      deleteDataFn={deleteLostFoundData}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={LostFoundFormModal}
      DetailModalComponent={LostFoundDetailModal}
      searchPlaceholder="Cari nama barang, lokasi, penerima..."
      categories={[
        { id: '', label: 'Semua Status' },
        { id: 'Belum Diserahkan', label: 'Belum Diambil' },
        { id: 'Diserahkan', label: 'Sudah Diserahkan' },
      ]}
    />
  )
}
