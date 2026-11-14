import { Edit3, Trash2, Eye, Building2, Layers, FileSpreadsheet, Clock, BarChart3, Users, User } from 'lucide-react'
import { SidigiCrudLayoutShell } from '../../../components/shared/services/sidigi/SidigiCrudLayoutShell'
import { SidigiDataOriginIcon } from '../../../components/shared/services/sidigi/SidigiDataOriginIcon'
import { SidigiTanggalCell, SidigiPetugasCell } from '../../../components/shared/services/sidigi/SidigiTableCells'
import {
  fetchStatistikSummary,
  fetchStatistikData,
  fetchStatistikDetail,
  deleteStatistikData,
  importBatchStatistik,
} from '../../../services/api/sidigiServicesApi'

const STATISTIK_SAMPLE_MAP = {
  'Jumlah ASN': '/templates/sidigi/statistik_jumlah_asn.xlsx',
  'Golongan ASN': '/templates/sidigi/statistik_golongan_asn.xlsx',
  'Jenis Kelamin ASN': '/templates/sidigi/statistik_jenis_kelamin_asn.xlsx',
  'Pendidikan ASN': '/templates/sidigi/statistik_pendidikan_asn.xlsx',
  'Usia ASN': '/templates/sidigi/statistik_usia_asn.xlsx',
  'Generasi ASN': '/templates/sidigi/statistik_generasi_asn.xlsx',
  'Kelompok Jabatan ASN': '/templates/sidigi/statistik_kelompok_jabatan_asn.xlsx',
  'Masa Kerja ASN': '/templates/sidigi/statistik_masa_kerja_asn.xlsx',
}

export default function StatistikPegawaiPage() {
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
      id: 'total_file',
      label: 'TOTAL FILE',
      value: summary?.total_upload ?? 0,
      unit: 'File',
      context: 'Kapasitas arsip data',
      badge: '100% Total',
      badgeColor: 'sky',
      icon: FileSpreadsheet,
      iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    },
    {
      id: 'total_detail',
      label: 'TOTAL DATA ASN',
      value: summary?.total_data ?? 0,
      unit: 'Pegawai',
      context: 'Data agregasi tervalidasi',
      badge: 'Realisasi',
      badgeColor: 'emerald',
      icon: Users,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_instansi',
      label: 'TOTAL INSTANSI',
      value: summary?.total_instansi ?? 0,
      unit: 'Instansi',
      context: 'Wilayah Jabar & Banten',
      badge: 'Jabar & Banten',
      badgeColor: 'amber',
      icon: Building2,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'last_upload',
      label: 'UPLOAD TERAKHIR',
      value: formatDate(summary?.last_update),
      unit: '',
      isText: true,
      context: 'Pembaruan data demografi',
      badge: 'Terbaru',
      badgeColor: 'indigo',
      icon: Clock,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  const columns = [
    { header: 'BERKAS STATISTIK ASN' },
    { header: 'KATEGORI DEMOGRAFI' },
    { header: 'STATUS AGREGASI' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onDetail) => {
    return (
      <tr
        key={item.id}
        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Kolom 1: BERKAS STATISTIK ASN */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <SidigiDataOriginIcon isExcel={true} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onDetail && onDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.file_name}
              >
                {item.file_name || 'Berkas Data Statistik ASN'}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Periode {item.period || '-'}
                </span>
                <span>•</span>
                <span>{(Number(item.file_size || 0) / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: KATEGORI DEMOGRAFI */}
        <td className="py-3 px-4 sm:px-5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 whitespace-nowrap">
            <BarChart3 className="w-3 h-3 text-slate-400" />
            <span>{item.jenis || 'Jumlah ASN'}</span>
          </span>
        </td>

        {/* Kolom 3: STATUS AGREGASI */}
        <td className="py-3 px-4 sm:px-5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 whitespace-nowrap">
            {formatNumber(item.total || item.total_record || item.jumlah || 0)} Baris Data
          </span>
        </td>

        {/* Kolom 4: TANGGAL */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiTanggalCell
            value={item.created_at || item.period_date}
            subValue={`Tarikan: ${formatDate(item.period_start_date || item.period_date)}`}
          />
        </td>

        {/* Kolom 5: PETUGAS */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiPetugasCell value={item.created_by || 'Admin SIDIGI'} />
        </td>

        {/* Kolom 6: AKSI */}
        <td className="py-3 px-4 sm:px-5 text-right">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onDetail && onDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Rincian Instansi"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
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

  const categories = [
    { value: 'Jumlah ASN', label: 'Jumlah ASN' },
    { value: 'Golongan ASN', label: 'Golongan ASN' },
    { value: 'Jenis Kelamin ASN', label: 'Jenis Kelamin' },
    { value: 'Pendidikan ASN', label: 'Pendidikan' },
    { value: 'Usia ASN', label: 'Usia ASN' },
    { value: 'Generasi ASN', label: 'Generasi' },
    { value: 'Kelompok Jabatan ASN', label: 'Kelompok Jabatan' },
    { value: 'Masa Kerja ASN', label: 'Masa Kerja' },
  ]

  return (
    <SidigiCrudLayoutShell
      layananId={21}
      serviceTitle="Penyajian Statistik Data Kepegawaian"
      shortTitle="Statistik ASN"
      timKerjaTitle="Sistem Informasi & Digitalisasi"
      description="Penyajian visual dan agregasi data demografi ASN terintegrasi per instansi se-Jawa Barat & Banten."
      templateUrl="/templates/sidigi/statistik_jumlah_asn.xlsx"
      templateName="statistik_jumlah_asn.xlsx"
      categoryTemplates={STATISTIK_SAMPLE_MAP}
      fetchSummaryFn={fetchStatistikSummary}
      fetchDataFn={fetchStatistikData}
      fetchDetailFn={fetchStatistikDetail}
      deleteDataFn={deleteStatistikData}
      batchUploadFn={importBatchStatistik}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={null}
      detailType="statistik"
      categories={categories}
      defaultCategory="Jumlah ASN"
      requiresCategory={true}
      categoryLabel="Kategori Demografi ASN"
      searchPlaceholder="Cari nama berkas, periode, pengunggah..."
    />
  )
}
