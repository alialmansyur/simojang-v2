import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  BarChart3,
  FileText,
  Database,
  ArrowRight,
  RefreshCw,
  Lock,
} from 'lucide-react'
import { canAccessRoute } from '../../navigation/config'
import { getAuthSession } from '../../../services/auth'

export default function FasilitasiCatHubPage() {
  const navigate = useNavigate()
  const session = getAuthSession()
  const roleCode = String(session?.user?.role || session?.user?.roles?.[0] || 'USR').trim().toUpperCase()
  const isAdmin = roleCode === 'ADM'

  const portalCards = [
    {
      id: 'pengelola',
      path: '/layanan/fasilitasi-cat/pengelola',
      title: 'Pengelola',
      badge: 'Limited NIP',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300',
      icon: ShieldCheck,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
      hoverBorder: 'hover:border-indigo-400/60 dark:hover:border-indigo-500/60',
      description: 'Konfigurasi master event CAT, pemetaan kapasitas titik lokasi, dan pengaturan hak akses staf pengelola resmi.',
      actionText: 'Buka Pengelola',
    },
    {
      id: 'rekapitulasi',
      path: '/layanan/fasilitasi-cat/rekapitulasi',
      title: 'Rekapitulasi',
      badge: 'Monitoring & Capaian',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300',
      icon: BarChart3,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      hoverBorder: 'hover:border-emerald-400/60 dark:hover:border-emerald-500/60',
      description: 'Dashboard agregasi capaian pelaksanaan CAT, statistik kehadiran peserta, dan monitoring tilok se-wilayah Jawa Barat & Banten.',
      actionText: 'Lihat Rekapitulasi',
    },
    {
      id: 'laporan',
      path: '/layanan/fasilitasi-cat/laporan',
      title: 'Laporan',
      badge: 'Dokumen & Berita Acara',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300',
      icon: FileText,
      iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
      hoverBorder: 'hover:border-sky-400/60 dark:hover:border-sky-500/60',
      description: 'Generator laporan rekapitulasi ujian CAT berkala, pencetakan Berita Acara pelaksanaan sesi, dan ekspor spreadsheet Excel.',
      actionText: 'Generate Laporan',
    },
    {
      id: 'rekap-data',
      path: '/layanan/fasilitasi-cat/rekap-data',
      title: 'Rekap Data',
      badge: 'Operasional Sesi',
      badgeColor: 'bg-blue-50 text-[#175CD3] border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300',
      icon: Database,
      iconBg: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
      hoverBorder: 'hover:border-[#175CD3]/60 dark:hover:border-blue-500/60',
      description: 'Pusat input data sesi ujian harian, kehadiran, rentang skor CAT, input multi-baris cepat, dan unggah berkas batch spreadsheet.',
      actionText: 'Buka Rekap Data',
    },
  ]

  // Saring kartu layanan sesuai izin akses RBAC / NIP session
  const visibleCards = useMemo(() => {
    if (isAdmin) return portalCards
    return portalCards.filter((card) => canAccessRoute(card.path, session))
  }, [isAdmin, session])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Page Standard (Matching /layanan/cltn & /layanan/wasdal-netralitas) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Title, Ringkas Tim Kerja Badge & Description */}
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Sistem Informasi & Digitalisasi</span>
          </div>
          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Fasilitasi Seleksi Menggunakan Metode Computer Assisted Test
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Portal terpadu operasional Computer Assisted Test Kantor Regional III BKN Bandung. Silakan pilih modul kerja yang ingin dituju.
          </p>
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Muat ulang data"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* Dedicated Portal Cards Grid (Hanya menampilkan sub-layanan yang di-assign) */}
      {visibleCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Belum Ada Sub-Layanan yang Ditugaskan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Akun atau Role Anda saat ini belum memiliki izin akses untuk modul kerja di dalam layanan ini. Silakan hubungi Administrator untuk penugasan hak akses.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
          {visibleCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.id}
                onClick={() => navigate(card.path)}
                className="group rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-full border bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:shadow-sm hover:border-[#175CD3]/50 dark:hover:border-blue-500/50 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-inner`}>
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold mb-1.5 transition-colors text-slate-900 dark:text-white group-hover:text-[#175CD3] dark:group-hover:text-blue-400">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {card.description}
                  </p>
                </div>

                <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs font-bold transition-colors text-slate-700 dark:text-slate-300 group-hover:text-[#175CD3] dark:group-hover:text-blue-400">
                    {card.actionText}
                  </span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 text-slate-400 group-hover:text-[#175CD3] dark:group-hover:text-blue-400 group-hover:translate-x-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
