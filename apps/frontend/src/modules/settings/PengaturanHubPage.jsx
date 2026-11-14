import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  ShieldCheck,
  Layers,
  Sliders,
  FileSearch,
  ArrowRight,
} from 'lucide-react'
import { ServiceHeader } from '../../components/shared/services/ServiceHeader'
import { getAuthSession } from '../../services/auth'
import { canAccessRoute } from '../navigation/config'
import {
  fetchUsersList,
  fetchRolesList,
  fetchLayananAccessList,
  fetchAuditSummary,
} from '../../services/api/settingsApi'

export default function PengaturanHubPage() {
  const navigate = useNavigate()
  const session = getAuthSession()

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalServices: 0,
    totalAuditEvents: 0,
  })
  const [isReloading, setIsReloading] = useState(false)

  const loadOverview = useCallback(async (manual = false) => {
    try {
      if (manual) setIsReloading(true)

      const canUsers = canAccessRoute('/settings/users')
      const canRoles = canAccessRoute('/settings/roles')
      const canServices = canAccessRoute('/settings/services')
      const canAudit = canAccessRoute('/settings/audit')

      const [usersRes, rolesRes, layananRes, auditRes] = await Promise.allSettled([
        canUsers ? fetchUsersList({ page: 1, per_page: 5 }) : Promise.resolve(null),
        canRoles ? fetchRolesList(false) : Promise.resolve([]),
        canServices ? fetchLayananAccessList() : Promise.resolve([]),
        canAudit ? fetchAuditSummary() : Promise.resolve(null),
      ])

      const stats = usersRes.status === 'fulfilled' ? usersRes.value?.stats || {} : {}
      const roles = rolesRes.status === 'fulfilled' && Array.isArray(rolesRes.value) ? rolesRes.value : []
      const layanan = layananRes.status === 'fulfilled' && Array.isArray(layananRes.value) ? layananRes.value : []
      const auditTotals = auditRes.status === 'fulfilled' ? auditRes.value?.totals || {} : {}

      setMetrics({
        totalUsers: Number(stats.total_users ?? 0),
        activeUsers: Number(stats.active_users ?? 0),
        totalRoles: Number(stats.total_roles ?? roles.length),
        totalServices: layanan.length,
        totalAuditEvents: Number(auditTotals.all ?? 0),
      })
    } finally {
      setIsReloading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview(false)
  }, [loadOverview])

  const formatCount = (num) => new Intl.NumberFormat('id-ID').format(Number(num || 0))

  const menuCards = useMemo(() => {
    const baseCards = [
      {
        id: 'users',
        moduleCode: '/settings/users',
        title: 'Manajemen Pengguna & Pegawai',
        description:
          'Kelola akun pengguna SIMOJANG, lookup & sinkronisasi data pegawai ASN, atur aktivasi akun, reset kata sandi, dan hak akses khusus per user.',
        badge: `${metrics.activeUsers > 0 ? `${formatCount(metrics.activeUsers)} aktif` : 'Users & Akun'}`,
        pillText: `${formatCount(metrics.totalUsers)} akun`,
        icon: Users,
        accent: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
        path: '/settings/users',
        cta: 'Kelola Data',
      },
      {
        id: 'roles',
        moduleCode: '/settings/roles',
        title: 'Manajemen Role & Struktur Menu',
        description:
          'Buat dan kelola role RBAC, atur centang matriks izin menu hierarkis (cascade otomatis), assign pengguna ke role, serta kelola master menu navigasi.',
        badge: 'RBAC & Menu',
        pillText: `${formatCount(metrics.totalRoles)} role`,
        icon: ShieldCheck,
        accent: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
        path: '/settings/roles',
        cta: 'Kelola Data',
      },
      {
        id: 'services',
        moduleCode: '/settings/services',
        title: 'Manajemen Layanan & Hak Akses',
        description:
          'Tentukan mode akses layanan (Semua Pegawai vs Pegawai Tertentu) beserta whitelist NIP pengelola, salin konfigurasi, atau reset ke default unit kerja.',
        badge: 'Layanan & NIP',
        pillText: `${formatCount(metrics.totalServices)} layanan`,
        icon: Layers,
        accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
        path: '/settings/services',
        cta: 'Kelola Data',
      },
      {
        id: 'system',
        moduleCode: '/settings/system',
        title: 'Pengaturan Sistem & Email SMTP',
        description:
          'Konfigurasi identitas aplikasi, zona waktu, mode pemeliharaan, kebijakan keamanan sesi & batas unggah, serta parameter SMTP dan uji kirim email.',
        badge: 'Sistem & SMTP',
        pillText: 'Konfigurasi',
        icon: Sliders,
        accent: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
        path: '/settings/system',
        cta: 'Kelola Data',
      },
      {
        id: 'audit',
        moduleCode: '/settings/audit',
        title: 'Log Audit & Aktivitas Sistem',
        description:
          'Pantau jejak audit perubahan RBAC/data sistem, log aktivitas harian layanan, riwayat unggahan dokumen transaksi, serta log perangkat masuk pengguna.',
        badge: '4 Sumber Log',
        pillText: `${formatCount(metrics.totalAuditEvents)} log`,
        icon: FileSearch,
        accent: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
        path: '/settings/audit',
        cta: 'Kelola Data',
      },
    ]

    return baseCards.filter((card) => canAccessRoute(card.path, session))
  }, [metrics, session])

  return (
    <div className="space-y-6 pb-8">
      <ServiceHeader
        serviceTitle="Pusat Pengaturan Sistem"
        description="Hub terpadu untuk manajemen akun pengguna, peran & struktur menu RBAC, hak akses layanan pegawai, konfigurasi sistem/SMTP, dan audit log."
        timKerjaTitle="Pengaturan & Tata Kelola"
        badgeColor="emerald"
        onReloadClick={() => loadOverview(true)}
        isReloading={isReloading}
        borderless
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {menuCards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => navigate(card.path)}
              className="group text-left bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 border border-transparent hover:border-[#175CD3]/30"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {card.pillText}
                  </span>
                </div>

                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 truncate">
                  {card.moduleCode}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#175CD3] transition-colors leading-snug mt-0.5">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-medium">
                  {card.badge}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-[#175CD3] dark:text-blue-400">
                  <span>{card.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
