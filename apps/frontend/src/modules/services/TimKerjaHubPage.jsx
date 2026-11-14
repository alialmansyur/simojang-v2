import { useParams, useNavigate } from 'react-router-dom'
import {
  FileSpreadsheet,
  FileText,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Award,
  FileCheck2,
  Building2,
  UserCheck,
  ShieldAlert,
  Layers,
} from 'lucide-react'
import { TIM_KERJA_LIST } from '../../config/simojangNavigation'
import { KPI_TYPOGRAPHY } from '../../components/shared/services/kpiTokens'

const ICON_MAP = {
  UserCheck,
  ShieldAlert,
  Award,
  FileCheck2,
  Cpu,
  Building2,
}

export default function TimKerjaHubPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const currentTk = TIM_KERJA_LIST.find((tk) => tk.id === id) || TIM_KERJA_LIST[0]
  const TkIcon = ICON_MAP[currentTk.icon] || Layers

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Tim Kerja Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EAECF0] dark:border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-[#EAF2FC] dark:bg-[#123B73]/30 border border-[#175CD3]/20 dark:border-[#175CD3]/40 flex items-center justify-center text-[#123B73] dark:text-[#93C5FD] flex-shrink-0 shadow-xs">
            <TkIcon className="w-7 h-7 text-[#175CD3]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF2FC] text-[#123B73] border border-[#175CD3]/20">
                Divisi / Tim Kerja
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Kantor Regional III BKN Bandung
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#123B73] dark:text-white tracking-tight">
              {currentTk.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {currentTk.description}
            </p>
          </div>
        </div>

        <div className="text-right sm:self-center p-4 rounded-2xl bg-[#F7F9FC] dark:bg-slate-800/60 border border-[#EAECF0] dark:border-slate-800/80">
          <div className={KPI_TYPOGRAPHY.label}>
            Total Layanan Aktif
          </div>
          <div className="mt-1 flex items-baseline justify-end gap-1.5">
            <span className={`${KPI_TYPOGRAPHY.valueNumeric} text-[#123B73] dark:text-white`}>
              {currentTk.services.length}
            </span>
            <span className={KPI_TYPOGRAPHY.unit}>Layanan</span>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-black text-[#123B73] dark:text-white">
            Daftar Layanan {currentTk.shortTitle}
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            Pilih layanan untuk membuka workspace kerja
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentTk.services.map((svc, idx) => {
            const isExcel = svc.type === 'excel_upload'
            return (
              <div
                key={svc.id || idx}
                onClick={() => navigate(svc.path)}
                className="group bg-white dark:bg-slate-900 rounded-3xl border border-[#EAECF0] dark:border-slate-800 p-5 hover:border-[#175CD3]/60 dark:hover:border-[#175CD3] hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#EAF2FC] dark:bg-[#123B73]/30 border border-[#175CD3]/20 dark:border-[#175CD3]/40 flex items-center justify-center text-[#175CD3] dark:text-[#93C5FD]">
                      {isExcel ? (
                        <FileSpreadsheet className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${
                        isExcel
                          ? 'bg-[#ECFDF3] text-[#067647] border-[#A6F4C5]'
                          : 'bg-[#EAF2FC] text-[#123B73] border-[#175CD3]/20'
                      }`}
                    >
                      {isExcel ? 'Excel Upload' : 'Form CRUD'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#175CD3] dark:group-hover:text-[#93C5FD] transition-colors leading-snug">
                      {svc.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      Pengelolaan berkas dan verifikasi data {svc.title} wilayah Jawa Barat & Banten.
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#EAECF0] dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#175CD3] dark:text-[#93C5FD]">
                  <span>Buka Workspace</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
