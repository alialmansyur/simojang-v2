import { useState } from 'react'
import {
  Briefcase,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Tag,
} from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { ProjectFormModal } from './components/ProjectFormModal'
import { ProjectWorkspaceView } from './components/ProjectWorkspaceView'
import { ProjectBatchUploadModal } from './components/ProjectBatchUploadModal'
import {
  fetchProjectsSummary,
  fetchProjectsData,
  deleteProjectData,
  importBatchProjects,
} from '../../../services/api/tuServicesApi'

export default function ManageProjectPage() {
  const [selectedProject, setSelectedProject] = useState(null)

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0))
  }

  const renderKpis = (summary) => [
    {
      id: 'total_proyek',
      label: 'TOTAL PROYEK',
      value: summary?.total_proyek ?? 0,
      unit: 'Paket',
      context: 'Pekerjaan fisik & pengadaan',
      badge: 'Tahun 2026',
      badgeColor: 'blue',
      icon: Briefcase,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_pagu',
      label: 'TOTAL PAGU PROYEK',
      value: formatRupiah(summary?.total_pagu ?? 0),
      unit: '',
      isText: true,
      context: 'Alokasi DIPA belanja modal',
      badge: 'Pagu DIPA',
      badgeColor: 'emerald',
      icon: DollarSign,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_realisasi',
      label: 'REALISASI ANGGARAN',
      value: formatRupiah(summary?.total_realisasi ?? 0),
      unit: '',
      isText: true,
      context: 'Realisasi pencairan termin',
      badge: 'Realisasi',
      badgeColor: 'amber',
      icon: TrendingUp,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'avg_progres',
      label: 'RATA-RATA PROGRES FISIK',
      value: `${summary?.avg_progres ?? 0}%`,
      unit: '',
      isText: true,
      context: 'Capaian pengerjaan lapangan',
      badge: 'Fisik Lapangan',
      badgeColor: 'sky',
      icon: CheckCircle2,
      iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    },
  ]

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

  const columns = [
    { header: 'PROYEK' },
    { header: 'KATEGORI' },
    { header: 'STATUS & PROGRES' },
    { header: 'PAGU & REALISASI' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const physical = Number(item.progress_percentage || item.progress || 0)
    const pagu = Number(item.budget_amount || item.pagu || 0)
    const realisasi = Number(item.realized_budget_amount || item.realisasi || 0)

    let statusBadge = 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300'
    if (item.status === 'Completed' || physical >= 100) {
      statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
    } else if (item.status === 'Pending') {
      statusBadge = 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300'
    }

    return (
      <tr
        key={item.uid || item.id || rowNo}
        className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors"
      >
        {/* Kolom 1: PROYEK */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <TuDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setSelectedProject(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.name || item.nama_project}
              >
                {item.name || item.nama_project}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                <span>{item.description || item.keterangan || '-'}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: KATEGORI */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>{item.category || '-'}</span>
          </span>
        </td>

        {/* Kolom 3: STATUS & PROGRES */}
        <td className="px-4 py-3.5 whitespace-nowrap w-44">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
              {item.status || 'Ongoing'}
            </span>
            <span className="text-[#175CD3] dark:text-blue-400 font-mono">{physical}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                physical >= 100 ? 'bg-emerald-500' : physical >= 50 ? 'bg-[#175CD3]' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, physical)}%` }}
            />
          </div>
        </td>

        {/* Kolom 4: PAGU & REALISASI */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
            {formatRupiah(pagu)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            Realisasi: {formatRupiah(realisasi)}
          </div>
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuTanggalCell value={item.start_date || item.created_at} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuPetugasCell value={item.pic || item.project_lead || item.created_by || 'Project Lead'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="px-4 py-3.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedProject(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Buka Lembar Kerja Proyek"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              title="Ubah Data Proyek"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Proyek"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const categories = [
    { id: '', label: 'Semua Proyek' },
    { id: 'Infrastruktur Gedung', label: 'Infrastruktur Gedung' },
    { id: 'Pengadaan Sarpras & BMN', label: 'Pengadaan Sarpras' },
    { id: 'Teknologi Informasi & Jaringan', label: 'Teknologi Informasi' },
    { id: 'Pemeliharaan & Renovasi', label: 'Pemeliharaan' },
  ]

  if (selectedProject) {
    return (
      <ProjectWorkspaceView
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onProjectUpdated={() => {
          // Callback when child logs are updated
        }}
      />
    )
  }

  return (
    <TuCrudLayoutShell
      layananId={38}
      serviceTitle="Manajemen Proyek"
      shortTitle="Manajemen Proyek"
      timKerjaTitle="Tata Usaha"
      timKerjaPath="/tim-kerja/tu"
      description="Monitoring paket pekerjaan konstruksi, renovasi gedung, pengadaan sarana IT, dan capaian serapan belanja modal Kanreg III BKN."
      templateUrl="/templates/tu/template-project.xlsx"
      templateName="template-project.xlsx"
      fetchSummaryFn={fetchProjectsSummary}
      fetchDataFn={fetchProjectsData}
      deleteDataFn={deleteProjectData}
      batchUploadFn={importBatchProjects}
      UploadModalComponent={ProjectBatchUploadModal}
      addNewLabel="Input Proyek"
      batchUploadLabel="Upload Data"
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={ProjectFormModal}
      searchPlaceholder="Cari nama proyek, paket pekerjaan, kategori, atau rekanan..."
      categories={categories}
    />
  )
}
