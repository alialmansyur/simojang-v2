import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronRight, KeyRound, LogOut, Menu, Moon, Sun, User } from 'lucide-react'
import { TIM_KERJA_LIST, MAIN_MENU_ITEMS, OFFICE_MENU_ITEMS, SETTINGS_MENU_ITEMS, SETTINGS_SUBPAGE_ITEMS } from '../config/simojangNavigation'
import { UserAvatar } from '../components/shared/UserAvatar'
import { ChangePasswordModal } from '../components/shared/ChangePasswordModal'
import { buildUserSummary, logoutCurrentUser, subscribeAuthChange } from '../services/auth'

function fmtRelative(minsAgo) {
  if (minsAgo < 60) return `${minsAgo} menit lalu`
  const hours = Math.floor(minsAgo / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

export function Topbar({ onToggleSidebar }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [now, setNow] = useState(() => new Date())
  const [openNotif, setOpenNotif] = useState(false)
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [isDefaultPrompt, setIsDefaultPrompt] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => buildUserSummary())
  const [theme, setTheme] = useState(() => localStorage.getItem('tapg-theme') || 'light')
  const [notifications, setNotifications] = useState([])
  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    const syncUser = () => setCurrentUser(buildUserSummary())
    syncUser()
    return subscribeAuthChange(syncUser)
  }, [])

  useEffect(() => {
    // Munculkan modal popup password hanya sekali setiap pertama login jika password = username
    const promptKey = 'simojang_prompt_default_password'
    if (sessionStorage.getItem(promptKey) === 'true') {
      sessionStorage.removeItem(promptKey)
      setIsDefaultPrompt(true)
      setChangePasswordOpen(true)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('tapg-theme', theme)
  }, [theme])

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenNotif(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setOpenUserMenu(false)
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpenNotif(false)
        setOpenUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  // Resolve dynamic breadcrumbs based on current route
  const getBreadcrumbs = () => {
    const path = location.pathname

    if (path === '/' || path === '/dashboard') {
      return [{ title: 'Dashboard', path: '/dashboard' }]
    }

    if (path === '/profile') {
      return [{ title: 'Profil Saya', path: '/profile' }]
    }

    const mainItem = MAIN_MENU_ITEMS.find((m) => m.path === path)
    if (mainItem) {
      return [{ title: mainItem.title, path: mainItem.path }]
    }

    const officeItem = OFFICE_MENU_ITEMS.find((o) => o.path === path)
    if (officeItem) {
      return [
        { title: 'Kegiatan Kantor', path: '#' },
        { title: officeItem.title, path: officeItem.path },
      ]
    }

    for (const tk of TIM_KERJA_LIST) {
      if (path === `/tim-kerja/${tk.id}`) {
        return [
          { title: 'Tim Kerja', path: '#' },
          { title: tk.title, path: `/tim-kerja/${tk.id}` },
        ]
      }
      let svc = tk.services.find((s) => s.path === path)
      if (!svc) {
        svc = tk.services.find((s) => path.startsWith(s.path + '/'))
      }
      if (svc) {
        return [
          { title: tk.shortTitle, path: `/tim-kerja/${tk.id}` },
          { title: svc.title, path: svc.path },
        ]
      }
    }

    const settingSubItem = SETTINGS_SUBPAGE_ITEMS.find((s) => path === s.path || path.startsWith(s.path + '/'))
    if (settingSubItem) {
      return [
        { title: 'Pengaturan & Referensi', path: '#' },
        { title: 'Pengaturan', path: '/settings' },
        { title: settingSubItem.title, path: settingSubItem.path },
      ]
    }

    const settingItem = SETTINGS_MENU_ITEMS.find((s) => s.path === path)
    if (settingItem) {
      return [
        { title: 'Pengaturan & Referensi', path: '#' },
        { title: settingItem.title, path: settingItem.path },
      ]
    }

    return [{ title: 'Simojang BKN', path: '/dashboard' }]
  }

  const breadcrumbs = getBreadcrumbs()

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
  }

  const handleOpenNotification = (notif) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === notif.id ? { ...item, is_read: true } : item))
    )
    setOpenNotif(false)
    if (notif.path) navigate(notif.path)
  }

  const formattedDate = now.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const formattedTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  // Borderless, soft icon button styling (tanpa border card)
  const iconButtonClass = 'w-10 h-10 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95'

  return (
    <header
      id="topbar"
      className="admin-topbar relative z-40 overflow-visible h-16 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/50 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 transition-colors"
    >
      {/* Left: Swiss Hierarchical Large Breadcrumbs (Toggle '<' is placed inside sidebar logo area) */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile-only toggle button when sidebar is off-canvas drawer */}
        <button
          onClick={onToggleSidebar}
          className={`${iconButtonClass} lg:hidden flex-shrink-0`}
          title="Buka Menu Navigasi"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Dynamic Standard Breadcrumbs matching Sidebar typography */}
        <nav className="flex items-center gap-1.5 sm:gap-2 truncate select-none">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1
            return (
              <span key={idx} className="flex items-center gap-1.5 sm:gap-2 truncate">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 stroke-[2.2]" />}
                {isLast || !crumb.path || crumb.path === '#' ? (
                  <span
                    className={`truncate ${
                      isLast
                        ? 'text-sm sm:text-[14.5px] text-slate-900 dark:text-white font-bold tracking-[-0.01em]'
                        : 'text-sm sm:text-[14px] text-slate-500 dark:text-slate-400 font-medium'
                    }`}
                  >
                    {crumb.title}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(crumb.path)}
                    className="truncate text-sm sm:text-[14px] text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {crumb.title}
                  </button>
                )}
              </span>
            )
          })}
        </nav>
      </div>

      {/* Right: Operational Live Clock, Theme Switcher & Notifications (Borderless Icon Buttons) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Indonesian Live Clock with Operational Status Dot & Bold Typography */}
        <div className="hidden sm:flex flex-col text-right justify-center h-10 leading-tight">
          <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#067647] flex-shrink-0" title="Sistem Aktif & Terhubung" />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-slate-950 dark:text-white tabular-nums tracking-wide mt-0.5">
            {formattedTime} <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">WIB</span>
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="h-5 w-px bg-slate-200/60 dark:bg-slate-800/50 hidden sm:block mx-1" />

        {/* Theme Switcher Button (Borderless) */}
        <button
          onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          className={iconButtonClass}
          title={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
          aria-label="Ganti Tema Tampilan"
        >
          {theme === 'dark' ? <Moon className="w-5 h-5 stroke-[2.2]" /> : <Sun className="w-5 h-5 text-amber-500 stroke-[2.2]" />}
        </button>

        {/* Notification Bell Dropdown (Borderless) */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setOpenUserMenu(false)
              setOpenNotif((v) => !v)
            }}
            className={`${iconButtonClass} relative`}
            title="Notifikasi Aktivitas"
            aria-label="Buka Notifikasi Aktivitas"
          >
            <Bell className="w-5 h-5 stroke-[2.2]" />
            {unreadCount > 0 && (
              <span className="absolute 1.5 top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#B42318] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {openNotif && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 max-w-[92vw] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 overflow-hidden z-50 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100/80 dark:border-slate-800/50 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-950 dark:text-white">Notifikasi Aktivitas</div>
                  <div className="text-[11px] font-semibold text-slate-500">{unreadCount} belum dibaca</div>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-bold text-[#175CD3] hover:text-[#1249A8] dark:text-[#93C5FD] cursor-pointer"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto clean-scrollbar divide-y divide-slate-100/80 dark:divide-slate-800/50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs font-semibold text-slate-400">Belum ada notifikasi baru.</div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleOpenNotification(notif)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            !notif.is_read ? 'bg-[#175CD3]' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-slate-950 dark:text-white font-bold leading-snug">
                            {notif.title}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5 line-clamp-2">
                            {notif.message}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-1">{fmtRelative(notif.createdMins)}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Profile Dropdown (Far right corner) */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setOpenNotif(false)
              setOpenUserMenu((v) => !v)
            }}
            aria-expanded={openUserMenu}
            aria-haspopup="menu"
            aria-label="Menu Akun Pengguna"
            title={currentUser.name}
            className={`h-10 pl-1 pr-2.5 rounded-full flex items-center gap-2 transition-colors cursor-pointer active:scale-[0.98] ${
              openUserMenu
                ? 'bg-slate-100 dark:bg-slate-800 ring-2 ring-[#175CD3]/25'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserAvatar
              src={currentUser.avatarUrl}
              initials={currentUser.avatar}
              name={currentUser.name}
              size="sm"
              isActive={currentUser.isActive}
            />
            <span className="hidden md:inline-block truncate max-w-[110px] text-xs font-bold text-slate-900 dark:text-white">
              {String(currentUser.name || '').trim().split(/\s+/)[0] || 'Pengguna'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-150 ${
                openUserMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openUserMenu && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 max-w-[90vw] rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 overflow-hidden z-50 shadow-xl animate-in fade-in zoom-in-95 duration-150"
            >
              {/* User Summary Header */}
              <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-800/30 flex items-center gap-3">
                <UserAvatar
                  src={currentUser.avatarUrl}
                  initials={currentUser.avatar}
                  name={currentUser.name}
                  size="md"
                  isActive={currentUser.isActive}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-extrabold text-slate-950 dark:text-white">
                    {currentUser.name}
                  </div>
                  <div className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                    {currentUser.nip ? `NIP ${currentUser.nip}` : currentUser.username || 'Kanreg III BKN'}
                  </div>
                  <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF2FC] text-[#123B73] dark:bg-[#123B73]/40 dark:text-[#93C5FD]">
                    {currentUser.roleName}
                  </span>
                </div>
              </div>

              {/* Action Items */}
              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenUserMenu(false)
                    navigate('/profile')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-[#123B73] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Profil</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenUserMenu(false)
                    setChangePasswordOpen(true)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-[#123B73] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Ubah Kata Sandi</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/60 p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setOpenUserMenu(false)
                    await logoutCurrentUser()
                    navigate('/login', { replace: true })
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold text-[#B42318] dark:text-[#FDA29B] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Change Password Modal triggered from Topbar Dropdown or First Login with Default Password */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        isDefaultPassword={isDefaultPrompt}
        onClose={() => {
          setChangePasswordOpen(false)
          setIsDefaultPrompt(false)
        }}
        onSuccess={() => {
          setChangePasswordOpen(false)
          setIsDefaultPrompt(false)
          sessionStorage.removeItem('simojang_prompt_default_password')
        }}
      />
    </header>
  )
}
