import { useEffect, useState, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Wrench, AlertTriangle } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { EventRunningTicker } from '../components/shared/EventRunningTicker'
import { getAuthSession } from '../services/auth'
import { fetchMaintenanceServices } from '../services/api/settingsApi'
import { ServiceMaintenanceView } from '../components/shared/services/ServiceMaintenanceView'
import {
  matchServiceMaintenance,
  isSuperAdminUser,
  getMaintenanceServicesFromSession,
} from '../utils/maintenance'

export function AdminLayout({
  title,
  children,
  canvasClassName = 'bg-[#F7F9FC] dark:bg-slate-950',
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const [maintenanceServices, setMaintenanceServices] = useState(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem('simojang_maintenance_services') || '[]')
      if (Array.isArray(cached) && cached.length > 0) return cached
    } catch {
      // Ignore sessionStorage parsing errors
    }
    const sess = getAuthSession()
    return getMaintenanceServicesFromSession(sess)
  })

  const location = useLocation()
  const session = getAuthSession()

  const loadMaintenanceList = useCallback(async () => {
    try {
      const data = await fetchMaintenanceServices()
      if (Array.isArray(data)) {
        setMaintenanceServices(data)
      }
    } catch {
      // Ignore background fetch error
    }
  }, [])

  useEffect(() => {
    loadMaintenanceList()

    const onMaintenanceChanged = () => {
      loadMaintenanceList()
    }
    window.addEventListener('simojang-maintenance-changed', onMaintenanceChanged)
    return () => {
      window.removeEventListener('simojang-maintenance-changed', onMaintenanceChanged)
    }
  }, [loadMaintenanceList])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)')
    const onChange = (event) => {
      setIsMobile(event.matches)
      if (!event.matches) {
        setMobileSidebarOpen(false)
      }
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen((value) => !value)
      return
    }
    setCollapsed((value) => !value)
  }

  const activeMaintenance = useMemo(() => {
    return matchServiceMaintenance(location.pathname, maintenanceServices)
  }, [location.pathname, maintenanceServices])

  const isSuperAdmin = useMemo(() => {
    return isSuperAdminUser(session)
  }, [session])

  return (
    <div className="admin-ui-root flex h-[100dvh] bg-[#F7F9FC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden relative font-sans antialiased">
      <Sidebar
        collapsed={isMobile ? false : collapsed}
        isMobile={isMobile}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggleSidebar={handleToggleSidebar}
      />
      {isMobile && mobileSidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} onToggleSidebar={handleToggleSidebar} />
        <EventRunningTicker />
        <main className={`flex-1 overflow-y-auto ${canvasClassName} custom-scroll p-6 sm:p-8 lg:p-10 transition-colors`}>
          <div className="max-w-[1600px] mx-auto w-full">
            {activeMaintenance ? (
              isSuperAdmin ? (
                <>
                  <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                      <div>
                        <span className="font-bold">Mode Pemeliharaan Aktif (Bypass Superadmin):</span>{' '}
                        Halaman <strong>{activeMaintenance.nama_layanan}</strong> sedang ditutup untuk pengguna non-admin.
                        {activeMaintenance.maintenance_msg && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 font-normal">
                            Pesan Publik: &quot;{activeMaintenance.maintenance_msg}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-[10px] uppercase tracking-wider shrink-0">
                      <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Superadmin Bypass
                    </span>
                  </div>
                  {children}
                </>
              ) : (
                <ServiceMaintenanceView
                  service={activeMaintenance}
                  onRetry={loadMaintenanceList}
                />
              )
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
