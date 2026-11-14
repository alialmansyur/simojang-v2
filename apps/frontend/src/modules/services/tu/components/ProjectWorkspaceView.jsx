import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Briefcase,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Camera,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  X,
  Maximize2,
} from 'lucide-react'
import {
  fetchProjectOverview,
  fetchProjectSubData,
  deleteProjectProgress,
  deleteProjectBudget,
} from '../../../../services/api/tuServicesApi'
import { ProjectProgressModal } from './ProjectProgressModal'
import { ProjectBudgetModal } from './ProjectBudgetModal'
import { toast } from 'react-toastify'
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog'
import { KPI_TYPOGRAPHY } from '../../../../components/shared/services/kpiTokens'

export function ProjectWorkspaceView({ project, onBack, onProjectUpdated }) {
  const [activeTab, setActiveTab] = useState('progress') // 'progress' | 'budget'
  const [projectData, setProjectData] = useState(project)
  const [progressList, setProgressList] = useState([])
  const [budgetList, setBudgetList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)

  // State: Lightbox Photo Viewer
  const [lightboxPhoto, setLightboxPhoto] = useState(null)

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0))
  }

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

  const projectUid = project.uid || project.id || ''

  // Load Overview & Sub Data
  const loadWorkspaceData = useCallback(async () => {
    if (!projectUid) return
    setIsLoading(true)
    try {
      const [overviewRes, progRes, budRes] = await Promise.all([
        fetchProjectOverview(projectUid),
        fetchProjectSubData(projectUid, 'progress'),
        fetchProjectSubData(projectUid, 'budget'),
      ])

      if (overviewRes) setProjectData(overviewRes)
      if (progRes?.data) setProgressList(progRes.data)
      if (budRes?.data) setBudgetList(budRes.data)
    } catch (err) {
      console.warn('Gagal memuat detail proyek:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectUid])

  useEffect(() => {
    loadWorkspaceData()
  }, [loadWorkspaceData])

  const pagu = Number(projectData?.budget_amount || projectData?.pagu || 0)
  const realisasi = Number(projectData?.realized_budget_amount || projectData?.realisasi || 0)
  const sisa = Math.max(0, pagu - realisasi)
  const persenKeuangan = pagu > 0 ? ((realisasi / pagu) * 100).toFixed(1) : '0'
  const persenFisik = Number(projectData?.progress_percentage || projectData?.progress || 0)

  // Handle Deletes
  const handleDeleteProgress = (id) => {
    setConfirmDelete({ type: 'progress', id })
  }

  const handleDeleteBudget = (id) => {
    setConfirmDelete({ type: 'budget', id })
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    const { type, id } = confirmDelete
    setIsDeletingItem(true)
    try {
      if (type === 'progress') {
        await deleteProjectProgress(id)
        toast.success('Log progres fisik berhasil dihapus.')
      } else {
        await deleteProjectBudget(id)
        toast.success('Riwayat pencairan anggaran berhasil dihapus.')
      }
      setConfirmDelete(null)
      loadWorkspaceData()
      if (onProjectUpdated) onProjectUpdated()
    } catch (err) {
      toast.error(
        err.message ||
          (type === 'progress'
            ? 'Gagal menghapus log progres.'
            : 'Gagal menghapus pencairan anggaran.')
      )
    } finally {
      setIsDeletingItem(false)
    }
  }

  const getPhotoUrl = (log) => {
    if (log.foto_url) return log.foto_url
    if (log.file_name) {
      return `/media/projects/progress/${log.file_name}`
    }
    return null
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Navigation & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Kembali ke Portofolio Proyek"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60">
                {projectData.category || 'Infrastruktur Gedung'}
              </span>
              <span className="text-xs text-slate-400">• Lembar Kerja Proyek</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {projectData.name || projectData.nama_project}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'progress' ? (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null)
                setIsProgressModalOpen(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Catat Progres Fisik</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null)
                setIsBudgetModalOpen(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Catat Pencairan Dana</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Project Bento KPI Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fisik Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className={KPI_TYPOGRAPHY.label}>
              Kemajuan Fisik Lapangan
            </span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={KPI_TYPOGRAPHY.valueNumeric}>
              {persenFisik}%
            </span>
            <span className={KPI_TYPOGRAPHY.unit}>capaian riil</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                persenFisik >= 100 ? 'bg-emerald-500' : persenFisik >= 50 ? 'bg-[#175CD3]' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, persenFisik)}%` }}
            />
          </div>
        </div>

        {/* Keuangan Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className={KPI_TYPOGRAPHY.label}>
              Realisasi Anggaran Proyek
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={KPI_TYPOGRAPHY.valueNumeric}>
              {formatRupiah(realisasi)}
            </span>
            <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 leading-none">
              ({persenKeuangan}%)
            </span>
          </div>
          <div className={`${KPI_TYPOGRAPHY.context} flex justify-between gap-2`}>
            <span>Plafon: {formatRupiah(pagu)}</span>
            <span>Sisa: {formatRupiah(sisa)}</span>
          </div>
        </div>

        {/* Timeline & Rekanan */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className={KPI_TYPOGRAPHY.label}>
              Jadwal & Rekanan
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Mulai: {formatDate(projectData.start_date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Selesai: {formatDate(projectData.target_end_date || projectData.end_date)}</span>
            </div>
            <div className="text-[11px] text-slate-400 line-clamp-1 mt-1">
              {projectData.description || 'Pekerjaan proyek strategis Kanreg III BKN'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Tab Navigation Strip */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'progress'
              ? 'border-[#175CD3] text-[#175CD3] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Riwayat Progres Fisik ({progressList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'budget'
              ? 'border-[#175CD3] text-[#175CD3] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Pencairan Anggaran ({budgetList.length})</span>
        </button>
      </div>

      {/* 4. Tab Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
        {activeTab === 'progress' ? (
          /* Tab 1: Progres Fisik List & Eviden */
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, rIdx) => (
                <div key={rIdx} className="p-5 space-y-2.5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
                </div>
              ))
            ) : progressList.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-slate-400">
                <TrendingUp className="w-10 h-10 mx-auto stroke-[1.5]" />
                <p className="text-xs font-semibold">Belum ada rekaman log progres fisik untuk proyek ini.</p>
                <p className="text-[11px] text-slate-400">Gunakan tombol "Catat Progres Fisik" di atas untuk menambahkan laporan inspeksi.</p>
              </div>
            ) : (
              progressList.map((log, idx) => {
                const photoSrc = getPhotoUrl(log)
                return (
                  <div
                    key={log.id || idx}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Photo Thumbnail */}
                      {photoSrc ? (
                        <div
                          onClick={() => setLightboxPhoto({ url: photoSrc, log })}
                          className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700 cursor-pointer group shadow-2xs hover:shadow-xs transition-all"
                          title="Klik untuk memperbesar foto eviden"
                        >
                          <img
                            src={photoSrc}
                            alt="Eviden Progres"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex flex-col items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
                          <ImageIcon className="w-5 h-5" />
                          <span className="text-[9px] mt-0.5 font-medium">No Foto</span>
                        </div>
                      )}

                      {/* Log Info */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {log.title || 'Pemeriksaan Milestone Berkala'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 font-mono">
                            {log.actual_percentage}% Selesai
                          </span>
                          {log.target_percentage && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              (Target: {log.target_percentage}%)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                          {log.notes || 'Pekerjaan berjalan sesuai jadwal teknis.'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Tanggal: {formatDate(log.log_date || log.created_at)}
                          </span>
                          {log.start_date && log.end_date && (
                            <span>• Periode: {formatDate(log.start_date)} - {formatDate(log.end_date)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (SSOT Standard: flex items-center justify-end gap-1.5, p-1.5 rounded-lg) */}
                    <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(log)
                          setIsProgressModalOpen(true)
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="Ubah Log Progres"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProgress(log.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Hapus Log Progres"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          /* Tab 2: Pencairan Anggaran Table */
          <div className="overflow-x-auto clean-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 w-12 text-center">No</th>
                  <th className="px-4 py-3.5">Tanggal Realisasi</th>
                  <th className="px-4 py-3.5">Nominal Pencairan (Rp)</th>
                  <th className="px-4 py-3.5">Uraian / SPK & SP2D</th>
                  <th className="px-4 py-3.5">Dicatat Oleh</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200 font-semibold">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, rIdx) => (
                    <tr key={rIdx} className="animate-pulse">
                      {Array.from({ length: 6 }).map((_, cIdx) => (
                        <td key={cIdx} className="py-4 px-4">
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : budgetList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <DollarSign className="w-8 h-8 text-slate-400" />
                        <p className="text-xs font-semibold">Belum ada rekaman pencairan anggaran untuk proyek ini.</p>
                        <p className="text-[11px] text-slate-400">Gunakan tombol "Catat Pencairan Dana" di atas untuk menambahkan realisasi termin.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  budgetList.map((bud, idx) => (
                    <tr key={bud.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-semibold text-center">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(bud.realization_date)}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        {formatRupiah(bud.amount)}
                      </td>
                      <td className="px-4 py-3 max-w-sm text-slate-700 dark:text-slate-300">
                        {bud.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {bud.created_by || 'Bendahara'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(bud)
                              setIsBudgetModalOpen(true)
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Ubah Pencairan"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBudget(bud.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Pencairan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal Lightbox Photo Viewer */}
      {lightboxPhoto && createPortal(
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-zoom-out modal-backdrop-animated"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col cursor-default modal-dialog-animated"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#175CD3]" />
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {lightboxPhoto.log?.title || 'Dokumentasi Eviden Lapangan'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 flex items-center justify-center max-h-[60vh] overflow-hidden p-2">
              <img
                src={lightboxPhoto.url}
                alt="Dokumentasi Full"
                className="max-h-[58vh] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {lightboxPhoto.log?.notes || 'Tidak ada catatan tambahan.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tanggal Update: {formatDate(lightboxPhoto.log?.log_date)}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 font-mono self-start sm:self-center">
                Capaian: {lightboxPhoto.log?.actual_percentage}%
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 6. Form Modals */}
      {isProgressModalOpen && (
        <ProjectProgressModal
          isOpen={isProgressModalOpen}
          onClose={() => {
            setIsProgressModalOpen(false)
            setEditingItem(null)
          }}
          onSuccess={() => {
            loadWorkspaceData()
            if (onProjectUpdated) onProjectUpdated()
          }}
          projectUid={projectUid}
          initialData={editingItem}
        />
      )}

      {isBudgetModalOpen && (
        <ProjectBudgetModal
          isOpen={isBudgetModalOpen}
          onClose={() => {
            setIsBudgetModalOpen(false)
            setEditingItem(null)
          }}
          onSuccess={() => {
            loadWorkspaceData()
            if (onProjectUpdated) onProjectUpdated()
          }}
          projectUid={projectUid}
          initialData={editingItem}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={
          confirmDelete?.type === 'progress'
            ? 'Hapus Log Progres Fisik'
            : 'Hapus Pencairan Anggaran'
        }
        message={
          confirmDelete?.type === 'progress'
            ? 'Apakah Anda yakin ingin menghapus log progres fisik ini?'
            : 'Apakah Anda yakin ingin menghapus riwayat pencairan anggaran ini?'
        }
        confirmLabel="Hapus Data"
        tone="danger"
        isLoading={isDeletingItem}
        onConfirm={handleConfirmDelete}
        onClose={() => !isDeletingItem && setConfirmDelete(null)}
      />
    </div>
  )
}

export default ProjectWorkspaceView
