import { Pencil, Trash2, Eye, Building2, Network, ExternalLink, Clock, CheckCircle2, ShieldCheck, User } from 'lucide-react'
import { SidigiCrudLayoutShell } from '../../../components/shared/services/sidigi/SidigiCrudLayoutShell'
import { SidigiDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/sidigi/SidigiDataOriginIcon'
import { SidigiTanggalCell, SidigiPetugasCell } from '../../../components/shared/services/sidigi/SidigiTableCells'
import { IntegrasiFormModal } from '../../../components/shared/services/sidigi/IntegrasiFormModal'
import {
  fetchIntegrasiSummary,
  fetchIntegrasiData,
  fetchIntegrasiDetail,
  deleteIntegrasiData,
  importBatchIntegrasi,
} from '../../../services/api/sidigiServicesApi'

export default function IntegrasiSiasnPage() {
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
      id: 'total_instansi',
      label: 'TOTAL INSTANSI',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Pemerintah daerah terdata',
      badge: 'Jabar & Banten',
      badgeColor: 'sky',
      icon: Building2,
      iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    },
    {
      id: 'total_data',
      label: 'TOTAL PROGRES INTEGRASI',
      value: summary?.total_data ?? 0,
      unit: 'Progres',
      context: 'Catatan tahapan konektivitas',
      badge: 'Realisasi',
      badgeColor: 'emerald',
      icon: Network,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_riwayat',
      label: 'RIWAYAT TERINTEGRASI',
      value: summary?.total_riwayat ?? 0,
      unit: 'Riwayat',
      context: 'Variasi modul integrasi aktif',
      badge: '8 Modul',
      badgeColor: 'amber',
      icon: ShieldCheck,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'last_upload',
      label: 'UPDATE TERAKHIR',
      value: formatDate(summary?.last_update),
      unit: '',
      isText: true,
      context: 'Pembaruan status koneksi',
      badge: 'Terbaru',
      badgeColor: 'indigo',
      icon: Clock,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  const columns = [
    { header: 'INSTANSI & KODE PEMDA' },
    { header: 'MODUL INTEGRASI SIASN' },
    { header: 'STATUS SINKRONISASI' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const getStepBadge = (stepId, stepName) => {
    const id = Number(stepId || 1)
    const label = stepName || (
      id === 1 ? 'Jabatan' :
      id === 2 ? 'Diklat' :
      id === 3 ? 'Hukdis' :
      id === 4 ? 'CPNS/PNS' :
      id === 5 ? 'Penghargaan' :
      id === 6 ? 'Angka Kredit' :
      id === 7 ? 'Kinerja' :
      id === 8 ? 'Profil' : `Riwayat ${id}`
    )

    switch (id) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>Riwayat {label.replace(/^Riwayat\s*/i, '')}</span>
          </span>
        )
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
            <span>Riwayat {label.replace(/^Riwayat\s*/i, '')}</span>
          </span>
        )
      case 3:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>Riwayat {label.replace(/^Riwayat\s*/i, '')}</span>
          </span>
        )
      case 4:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Riwayat {label.replace(/^Riwayat\s*/i, '')}</span>
          </span>
        )
      case 5:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>Riwayat {label.replace(/^Riwayat\s*/i, '')}</span>
          </span>
        )
      case 6:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            <span>Riwayat {label.replace(/^Riwayat\s*/i, '')}</span>
          </span>
        )
      case 7:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
            <span>Riwayat {label.replace(/^Riwayat\s*/i, '')}</span>
          </span>
        )
      case 8:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>Riwayat {label.replace(/^Riwayat\s*/i, '')}</span>
          </span>
        )
    }
  }

  const renderRow = (item, rowNo, onEdit, onDelete, onDetail) => {
    return (
      <tr
        key={item.id}
        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Kolom 1: INSTANSI & KODE PEMDA */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <SidigiDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onDetail && onDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.instansi_name || item.nama || item.nama_instansi}
              >
                {item.instansi_name || item.nama || item.nama_instansi || `Instansi ${item.instansi_id}`}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  Kode: {item.kodeins || item.kode_instansi || item.instansi_id || '-'}
                </span>
                <span>•</span>
                <span className="truncate">{item.wilayah || 'Wilayah III Jabar/Banten'}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: MODUL INTEGRASI SIASN */}
        <td className="py-3 px-4 sm:px-5">
          {getStepBadge(item.rw_integrasi_id, item.step_name || item.jenis)}
        </td>

        {/* Kolom 3: STATUS SINKRONISASI */}
        <td className="py-3 px-4 sm:px-5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3" />
            <span>Tersinkron API</span>
          </span>
        </td>

        {/* Kolom 4: TANGGAL */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiTanggalCell
            value={item.period_date || item.created_at}
            subValue={`Periode: ${item.period || '-'}`}
          />
        </td>

        {/* Kolom 5: PETUGAS */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiPetugasCell value={item.created_by || 'PIC SIASN'} />
        </td>

        {/* Kolom 6: AKSI */}
        <td className="py-3 px-4 sm:px-5 text-right">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onDetail && onDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Integrasi & Payload JSON"
            >
              <Eye className="w-4 h-4" />
            </button>
            {item.bukti_dukung && (
              <a
                href={item.bukti_dukung}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                title="Buka Dokumen Bukti Dukung"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              title="Ubah Data Integrasi"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Data Integrasi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const categories = [
    { value: '0', label: 'Semua Riwayat' },
    { value: '1', label: 'Jabatan' },
    { value: '2', label: 'Diklat' },
    { value: '3', label: 'Hukdis' },
    { value: '4', label: 'CPNS/PNS' },
    { value: '5', label: 'Penghargaan' },
    { value: '6', label: 'Angka Kredit' },
    { value: '7', label: 'Kinerja' },
    { value: '8', label: 'Profil' },
  ]

  return (
    <SidigiCrudLayoutShell
      layananId={24}
      serviceTitle="Pendampingan Integrasi SIASN dengan SIMPEG"
      shortTitle="Integrasi SIASN"
      timKerjaTitle="Sistem Informasi & Digitalisasi"
      description="Pemantauan implementasi konektivitas API Web Service SIASN dengan SIMPEG instansi pemerintah daerah."
      templateUrl="/templates/sidigi/template-integrasi-siasn.xlsx"
      templateName="template-integrasi-siasn.xlsx"
      fetchSummaryFn={fetchIntegrasiSummary}
      fetchDataFn={fetchIntegrasiData}
      fetchDetailFn={fetchIntegrasiDetail}
      deleteDataFn={deleteIntegrasiData}
      batchUploadFn={importBatchIntegrasi}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={IntegrasiFormModal}
      detailType="integrasi"
      categories={categories}
      defaultCategory="0"
      searchPlaceholder="Cari nama instansi, kode, catatan teknis, tanggal..."
    />
  )
}
