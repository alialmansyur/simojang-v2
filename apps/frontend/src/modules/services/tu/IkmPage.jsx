import { Star, Users, Award, Calendar, Pencil, Trash2, Eye, Layers } from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { IkmFormModal } from './components/IkmFormModal'
import { IkmDetailModal } from './components/IkmDetailModal'
import {
  fetchIkmSummary,
  fetchIkmData,
  deleteIkmData,
} from '../../../services/api/tuServicesApi'

export default function IkmPage() {
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
      id: 'rata_nilai',
      label: 'NILAI IKM KANREG',
      value: summary?.rata_nilai ?? 0,
      unit: 'Poin',
      context: 'Skala Indeks 100',
      badge: summary?.predikat || '-',
      badgeColor: 'emerald',
      icon: Star,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_responden',
      label: 'TOTAL RESPONDEN',
      value: summary?.total_responden ?? 0,
      unit: 'Orang',
      context: 'Responden terverifikasi',
      badge: 'Valid',
      badgeColor: 'blue',
      icon: Users,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_survei',
      label: 'SURVEI TERLAKSANA',
      value: summary?.total_survei ?? 0,
      unit: 'Periode',
      context: 'Pelaksanaan Triwulanan',
      badge: 'Periode',
      badgeColor: 'indigo',
      icon: Award,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'last_update',
      label: 'UPDATE SURVEI',
      value: formatDate(summary?.last_update),
      unit: '',
      isText: true,
      context: 'Pembaruan data',
      badge: 'Terbaru',
      badgeColor: 'amber',
      icon: Calendar,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  const columns = [
    { header: 'SURVEI IKM' },
    { header: 'KATEGORI' },
    { header: 'NILAI IKM & MUTU' },
    { header: 'JUMLAH RESPONDEN' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const val = Number(item.nilai || 0)
    let mutu = 'Kurang (D)'
    let mutuBadge = 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300'
    if (val >= 88.31) {
      mutu = 'Sangat Baik (A)'
      mutuBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
    } else if (val >= 76.61) {
      mutu = 'Baik (B)'
      mutuBadge = 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300'
    } else if (val >= 65) {
      mutu = 'Kurang Baik (C)'
      mutuBadge = 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
    }

    return (
      <tr key={item.id || rowNo} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors">
        {/* Kolom 1: SURVEI IKM */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <TuDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewDetail && onViewDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={`Hasil Survei Tahun ${item.period || '-'}`}
              >
                Tahun {item.period || '-'} - {item.sumber_data || item.jenis || '-'}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{item.sumber_data || item.jenis || '-'}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: KATEGORI */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>{item.jenis || 'TOTAL'}</span>
          </span>
        </td>

        {/* Kolom 3: NILAI IKM & MUTU */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
              {item.nilai}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${mutuBadge}`}>
              {mutu}
            </span>
          </div>
        </td>

        {/* Kolom 4: JUMLAH RESPONDEN */}
        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold">{item.jumlah_responden || 0} Responden</span>
          </div>
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuTanggalCell value={item.period_start_date || item.created_at} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuPetugasCell value={item.petugas || item.created_by || item.pengolah || 'Pengolah Data IKM'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="px-4 py-3.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onViewDetail && onViewDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Nilai IKM"
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
      layananId={30}
      serviceTitle="Hasil Survey IKM"
      shortTitle="Survey IKM"
      description="Rekapitulasi Indeks Kepuasan Masyarakat terhadap pelayanan kepegawaian."
      templateUrl="/templates/tu/template-ikm.xlsx"
      templateName="template-ikm.xlsx"
      fetchSummaryFn={fetchIkmSummary}
      fetchDataFn={fetchIkmData}
      deleteDataFn={deleteIkmData}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={IkmFormModal}
      DetailModalComponent={IkmDetailModal}
      searchPlaceholder="Cari berdasarkan tahun, instrumen, atau pengunggah..."
      categories={[
        { id: '', label: 'Semua Kategori' },
        { id: 'TOTAL', label: 'Total Layanan' },
        { id: 'LAYANAN', label: 'Pelayanan Teknis' },
        { id: 'PEMBINAAN', label: 'Pembinaan' },
      ]}
    />
  )
}
