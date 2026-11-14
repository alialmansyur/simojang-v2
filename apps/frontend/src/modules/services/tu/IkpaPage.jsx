import { useState } from 'react'
import { Award, TrendingUp, CheckCircle2, ShieldCheck, Calendar, Eye, Trash2 } from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { IkpaDetailModal } from './components/IkpaDetailModal'
import {
  fetchIkpaSummary,
  fetchIkpaData,
  deleteIkpaData,
  storeIkpaBatch,
} from '../../../services/api/tuServicesApi'

export default function IkpaPage() {
  const [selectedLog, setSelectedLog] = useState(null)

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
      id: 'nilai_akhir',
      label: 'NILAI AKHIR IKPA',
      value: summary?.nilai_akhir ?? 0,
      unit: 'Poin',
      context: 'Skala Indeks 100',
      badge: summary?.kategori || '-',
      badgeColor: 'emerald',
      icon: Award,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'konversi_bobot',
      label: 'KONVERSI BOBOT',
      value: `${summary?.konversi_bobot ?? 0}%`,
      unit: '',
      isText: true,
      context: 'Evaluasi 8 Indikator Penuh',
      badge: 'Bobot',
      badgeColor: 'blue',
      icon: TrendingUp,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'dispensasi_spm',
      label: 'DISPENSASI SPM',
      value: summary?.dispensasi_spm ?? 0,
      unit: 'Kali',
      context: 'Kepatuhan batas SPM',
      badge: 'Dispensasi',
      badgeColor: 'indigo',
      icon: ShieldCheck,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
    {
      id: 'last_update',
      label: 'UPDATE EVALUASI',
      value: formatDate(summary?.last_update),
      unit: '',
      isText: true,
      context: 'Pembaruan evaluasi IKPA',
      badge: 'Terbaru',
      badgeColor: 'amber',
      icon: Calendar,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  const columns = [
    { header: 'SATKER' },
    { header: 'PREDIKAT' },
    { header: 'NILAI TOTAL & AKHIR' },
    { header: 'DISPENSASI SPM' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const nilaiAkhir = Number(item.nilai_akhir || item.nilai_total || 0)
    const isExcellent = nilaiAkhir >= 95

    return (
      <tr key={item.id || rowNo} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors">
        {/* Kolom 1: SATKER */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <TuDataOriginIcon isExcel={true} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setSelectedLog(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.uraian_satker || '-'}
              >
                {item.uraian_satker || '-'}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span>Satker: {item.kode_satker || '-'}</span>
                <span>•</span>
                <span>KPPN: {item.kode_kppn || '-'}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: PREDIKAT */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              isExcellent
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300'
            }`}
          >
            {item.kategori || (isExcellent ? 'SANGAT BAIK' : 'BAIK')}
          </span>
        </td>

        {/* Kolom 3: NILAI TOTAL & AKHIR */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
            {nilaiAkhir.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Total: {Number(item.nilai_total || 0).toFixed(1)} (Bobot {Number(item.konversi_bobot || 100).toFixed(0)}%)
          </div>
        </td>

        {/* Kolom 4: DISPENSASI SPM */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span>{item.dispensasi_spm || 0} Kali</span>
          </span>
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuTanggalCell value={item.period_date || item.created_at} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuPetugasCell value={item.petugas || item.created_by || 'Pengelola IKPA'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="px-4 py-3.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedLog(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Rincian 8 Indikator"
            >
              <Eye className="w-4 h-4" />
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
    <>
      <TuCrudLayoutShell
        layananId={34}
        serviceTitle="Analisa Kinerja Pelaksanaan Anggaran (IKPA)"
        shortTitle="Kinerja IKPA"
        description="Monitoring capaian indikator kinerja pelaksanaan anggaran (IKPA)."
        templateUrl="/templates/tu/template-ikpa.xlsx"
        templateName="template-ikpa.xlsx"
        fetchSummaryFn={fetchIkpaSummary}
        fetchDataFn={fetchIkpaData}
        deleteDataFn={deleteIkpaData}
        batchUploadFn={storeIkpaBatch}
        isPrimaryUpload={true}
        batchUploadLabel="Upload Data"
        renderKpis={renderKpis}
        columns={columns}
        renderRow={renderRow}
        searchPlaceholder="Cari berdasarkan periode, satker, KPPN..."
      />

      {selectedLog && (
        <IkpaDetailModal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          logId={selectedLog.id}
          satkerName={selectedLog.uraian_satker}
        />
      )}
    </>
  )
}
