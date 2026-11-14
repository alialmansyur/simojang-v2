import { Edit3, Trash2, Eye, Building2, Layers, FileSpreadsheet, Clock, FolderArchive, Users, User } from 'lucide-react'
import { SidigiCrudLayoutShell } from '../../../components/shared/services/sidigi/SidigiCrudLayoutShell'
import { SidigiDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/sidigi/SidigiDataOriginIcon'
import { SidigiTanggalCell, SidigiPetugasCell } from '../../../components/shared/services/sidigi/SidigiTableCells'
import { TakahFormModal } from '../../../components/shared/services/sidigi/TakahFormModal'
import {
  fetchTakahSummary,
  fetchTakahData,
  fetchTakahDetail, 
  deleteTakahData,
  importBatchTakah,
} from '../../../services/api/sidigiServicesApi'

export default function ArsipTakahPage() {
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
      context: 'Arsip log berkas fisik',
      badge: '100% Total',
      badgeColor: 'sky',
      icon: FileSpreadsheet,
      iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    },
    {
      id: 'total_nip',
      label: 'TOTAL PEGAWAI (NIP)',
      value: summary?.total_nip ?? 0,
      unit: 'Pegawai',
      context: 'Pegawai terarsip fisik',
      badge: 'Realisasi',
      badgeColor: 'emerald',
      icon: Users,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_dokumen',
      label: 'TOTAL DOKUMEN FISIK',
      value: summary?.total_dokumen ?? 0,
      unit: 'Dokumen',
      context: 'Kelengkapan 11 checklist',
      badge: 'Terverifikasi',
      badgeColor: 'amber',
      icon: FolderArchive,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'last_upload',
      label: 'UPLOAD TERAKHIR',
      value: formatDate(summary?.last_update),
      unit: '',
      isText: true,
      context: 'Pembaruan tata naskah',
      badge: 'Terbaru',
      badgeColor: 'indigo',
      icon: Clock,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  const columns = [
    { header: 'BERKAS TATA NASKAH (TAKAH)' },
    { header: 'KATEGORI ARSIP' },
    { header: 'STATUS KELENGKAPAN' },
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
        {/* Kolom 1: BERKAS TATA NASKAH (TAKAH) */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <SidigiDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onDetail && onDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.file_name}
              >
                {item.file_name || 'Berkas Tata Naskah Arsip (Takah)'}
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

        {/* Kolom 2: KATEGORI ARSIP */}
        <td className="py-3 px-4 sm:px-5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 whitespace-nowrap">
            <FolderArchive className="w-3 h-3 text-slate-400" />
            <span>{item.jenis || 'Tata Naskah Fisik'}</span>
          </span>
        </td>

        {/* Kolom 3: STATUS KELENGKAPAN */}
        <td className="py-3 px-4 sm:px-5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 whitespace-nowrap">
            11 Unsur Terarsip ({formatNumber(item.total || item.total_nip || 0)} Pegawai)
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
          <SidigiPetugasCell value={item.created_by || 'Arsiparis SIDIGI'} />
        </td>

        {/* Kolom 6: AKSI */}
        <td className="py-3 px-4 sm:px-5 text-right">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onDetail && onDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Checklist 11 Unsur & Histori Rak Takah"
            >
              <Eye className="w-4 h-4" />
            </button>
            {!isExcelOrigin(item) && (
              <button
                type="button"
                onClick={() => onEdit && onEdit(item)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                title="Edit Data Takah"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Data Takah"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const categories = [
    { value: 'all', label: 'Semua Berkas' },
    { value: 'Lengkap', label: 'Takah Lengkap' },
    { value: 'Parsial', label: 'Takah Belum Lengkap' },
    { value: 'Pensiun', label: 'Arsip Pensiun' },
  ]

  return (
    <SidigiCrudLayoutShell
      layananId={25}
      serviceTitle="Pengelolaan Dokumen Arsip (Takah)"
      shortTitle="Arsip Takah"
      timKerjaTitle="Sistem Informasi & Digitalisasi"
      description="Tata kelola berkas arsip fisik kepegawaian berdasarkan 11 elemen kelengkapan resmi BKN."
      templateUrl="/templates/sidigi/template-arsip-takah.xlsx"
      templateName="template-arsip-takah.xlsx"
      fetchSummaryFn={fetchTakahSummary}
      fetchDataFn={fetchTakahData}
      fetchDetailFn={fetchTakahDetail}
      deleteDataFn={deleteTakahData}
      batchUploadFn={importBatchTakah}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={TakahFormModal}
      detailType="takah"
      categories={categories}
      defaultCategory="all"
      searchPlaceholder="Cari berkas Takah, NIP, instansi, pengunggah..."
    />
  )
}
