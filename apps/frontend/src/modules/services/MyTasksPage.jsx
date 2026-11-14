import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, CheckCircle2, Clock, AlertTriangle, ArrowRight, Eye, Check, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { apiRequest } from '../../services/api'
import { getAuthSession } from '../../services/auth'
import { KPI_TYPOGRAPHY } from '../../components/shared/services/kpiTokens'

export default function MyTasksPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const session = getAuthSession()
  const currentUsername = session?.user?.username || ''

  const loadEnrolledTasks = async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const json = await apiRequest('/fetch-layanan-enrolled', {
        method: 'POST',
        body: { username: currentUsername },
      })

      if (json?.status === 'success' && Array.isArray(json.list)) {
        const mapped = json.list.map((item, idx) => ({
          id: item.id || idx + 1,
          title: `Verifikasi & Pemrosesan Layanan ${item.nama_layanan || item.layanan || item.nama}`,
          layanan: item.nama_layanan || item.nama || 'Layanan Kepegawaian',
          divisi: item.tim_nama || 'Tim Kerja BKN',
          deadline: 'Periode Aktif 2026',
          totalItems: item.total_berkas || 0,
          priority: 'Normal',
          status: 'Aktif Diampu',
          path: item.slug ? `/layanan/${item.slug}` : '/layanan/tapnip',
        }))
        setTasks(mapped)
      } else {
        setTasks([])
      }
    } catch (err) {
      setTasks([])
      setErrorMsg(err?.message || 'Gagal memuat daftar tugas Anda. Silakan muat ulang.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEnrolledTasks()
  }, [])

  const handleMarkComplete = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EAECF0] dark:border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF2FC] text-[#123B73] border border-[#175CD3]/20">
              Antrean Kerja Pribadi
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Kantor Regional III BKN Bandung
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#123B73] dark:text-white tracking-tight">
            Layanan Saya (Antrean Tugas)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Daftar tugas verifikasi berkas dan approval usul kepegawaian yang diampu dan ditugaskan kepada akun Anda.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <button
            type="button"
            onClick={loadEnrolledTasks}
            disabled={isLoading}
            className="p-3 rounded-2xl border border-[#EAECF0] dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#F7F9FC] transition-colors cursor-pointer"
            title="Refresh Antrean"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#175CD3]' : ''}`} />
          </button>
          <div className="text-right p-4 rounded-2xl bg-[#EAF2FC] dark:bg-[#123B73]/20 border border-[#175CD3]/20">
            <div className={`${KPI_TYPOGRAPHY.label} text-[#123B73] dark:text-[#EAF2FC]`}>
              Tugas Aktif
            </div>
            <div className="mt-1 flex items-baseline justify-end gap-1.5">
              <span className={`${KPI_TYPOGRAPHY.valueNumeric} text-[#123B73] dark:text-white`}>
                {tasks.length}
              </span>
              <span className={KPI_TYPOGRAPHY.unit}>Layanan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={loadEnrolledTasks}
            className="text-xs font-bold underline cursor-pointer flex-shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EAECF0] dark:border-slate-800 p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#ECFDF3] text-[#067647] border border-[#A6F4C5] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-base font-bold text-slate-800 dark:text-white">
              Semua tugas telah diselesaikan!
            </div>
            <p className="text-xs text-slate-400">
              Tidak ada antrean verifikasi aktif yang menunggu tindak lanjut Anda saat ini.
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EAECF0] dark:border-slate-800 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#175CD3]/60 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF2FC] dark:bg-[#123B73]/30 text-[#175CD3] dark:text-[#93C5FD] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF2FC] text-[#123B73] dark:bg-[#123B73]/30 dark:text-[#EAF2FC]">
                      {task.divisi}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      •
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {task.layanan}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {task.deadline}
                    </span>
                    {task.totalItems > 0 && (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {task.totalItems} Berkas
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      task.priority === 'Tinggi'
                        ? 'bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]'
                        : 'bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]'
                    }`}>
                      Prioritas {task.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleMarkComplete(task.id)}
                  className="px-3.5 py-2.5 rounded-2xl border border-[#EAECF0] dark:border-slate-800 hover:bg-[#F7F9FC] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  title="Tandai Selesai"
                >
                  <Check className="w-4 h-4 text-[#067647]" />
                  <span>Selesai</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(task.path)}
                  className="px-4 py-2.5 rounded-2xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-xs font-black shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Buka Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
