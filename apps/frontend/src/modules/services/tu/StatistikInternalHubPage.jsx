import { useNavigate } from 'react-router-dom'
import {
  Users,
  Briefcase,
  Database,
  ArrowRight,
  RefreshCw,
  Lock,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { canAccessRoute } from '../../navigation/config'

export default function StatistikInternalHubPage() {
  const navigate = useNavigate()

  const portalCards = [
    {
      id: 'data-pegawai',
      path: '/layanan/statistik-internal/data-pegawai',
      title: 'Data Pegawai',
      badge: 'Master Profil ASN',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300',
      icon: Users,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
      description: 'Pengelolaan data induk ASN internal Kanreg III, pemantauan batas usia pensiun (BUP), toggle keaktifan, dan unggah batch Excel.',
      actionText: 'Buka Data Pegawai',
    },
    {
      id: 'peta-jabatan',
      path: '/layanan/statistik-internal/peta-jabatan',
      title: 'Peta Jabatan',
      badge: 'Bezzeting & Formasi',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300',
      icon: Briefcase,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      description: 'Analisis perbandingan formasi kebutuhan terhadap riil pegawai terisi (bezzeting), kelas jabatan, lowongan formasi, serta status pemenuhan.',
      actionText: 'Buka Peta Jabatan',
    },
    {
      id: 'master-data',
      path: '/layanan/statistik-internal/master-data',
      title: 'Master Data',
      badge: '8 Tabel Referensi',
      badgeColor: 'bg-blue-50 text-[#175CD3] border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300',
      icon: Database,
      iconBg: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
      description: 'Konfigurasi 8 tabel referensi kepegawaian: Pendidikan, Unit Kerja, Unit SK, Jenis Jabatan, Status Kepegawaian, Agama, Golongan, dan Pangkat.',
      actionText: 'Kelola Master Data',
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Page Standard (Matching /layanan/fasilitasi-cat) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Title, Ringkas Tim Kerja Badge & Description */}
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>Bagian Tata Usaha</span>
          </div>
          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Statistik Kepegawaian Internal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            Pusat administrasi kepegawaian internal, peta formasi jabatan, dan manajemen data referensi Kantor Regional III BKN Bandung. Silakan pilih modul kerja yang ingin dituju.
          </p>
        </div>

        {/* Action Buttons (Right) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Muat ulang halaman"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* 2. Portal Cards Grid (Ukuran col-3 atau 4 kolom per baris di desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
        {portalCards.map((card) => {
          const Icon = card.icon
          const isAllowed = canAccessRoute(card.path)
          return (
            <div
              key={card.id}
              onClick={() => {
                if (isAllowed) {
                  navigate(card.path)
                } else {
                  toast.warning('Role atau akun Anda tidak memiliki hak akses untuk membuka modul ini.')
                }
              }}
              className={`group rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between h-full border ${
                isAllowed
                  ? 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:shadow-sm cursor-pointer'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 opacity-75 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-inner ${!isAllowed ? 'grayscale opacity-60' : ''}`}>
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  {isAllowed ? (
                    <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold border bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300">
                      <Lock className="w-3 h-3" />
                      Akses Dibatasi
                    </span>
                  )}
                </div>

                <h3 className={`text-base font-bold mb-1.5 transition-colors ${
                  isAllowed
                    ? 'text-slate-900 dark:text-white group-hover:text-[#175CD3] dark:group-hover:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {card.description}
                </p>
              </div>

              <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <span className={`text-xs font-bold transition-colors ${
                  isAllowed
                    ? 'text-slate-700 dark:text-slate-300 group-hover:text-[#175CD3] dark:group-hover:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {isAllowed ? card.actionText : 'Akses Dibatasi'}
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isAllowed
                    ? 'bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 text-slate-400 group-hover:text-[#175CD3] dark:group-hover:text-blue-400 group-hover:translate-x-1'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400'
                }`}>
                  {isAllowed ? (
                    <ArrowRight className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
