import { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  Shield,
  Mail,
  Send,
  Save,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  fetchSystemSettings,
  saveSystemSettings,
  fetchSmtpSettings,
  saveSmtpSettings,
  testSmtpConnection,
  fetchRolesList,
} from '../../services/api/settingsApi'
import { SettingsSubpageHeader } from './components/SettingsSubpageHeader'

const INITIAL_SYSTEM = {
  'app.name': '',
  'app.logo': '',
  'app.favicon': '',
  'app.maintenance_mode': '0',
  'app.timezone': 'Asia/Jakarta',
  'env.flag': 'production',
  'pagination.default_per_page': '15',
  'upload.max_size_mb': '10',
  'upload.allowed_types': 'pdf,jpg,jpeg,png,xlsx,docx',
  'session.timeout_minutes': '120',
  'security.max_login_attempt': '5',
  'security.lock_duration_minutes': '15',
  'security.default_role_code': 'USR',
}

const INITIAL_SMTP = {
  'smtp.host': '',
  'smtp.port': '587',
  'smtp.username': '',
  'smtp.password': '',
  'smtp.encryption': 'tls',
  'smtp.from_name': 'SIMOJANG',
  'smtp.from_email': '',
  has_password: false,
}

export default function SettingsSystemPage() {
  const [activeTab, setActiveTab] = useState('system')
  const [systemForm, setSystemForm] = useState(INITIAL_SYSTEM)
  const [smtpForm, setSmtpForm] = useState(INITIAL_SMTP)
  const [roles, setRoles] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSavingSystem, setIsSavingSystem] = useState(false)
  const [isSavingSmtp, setIsSavingSmtp] = useState(false)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)

  const [testEmail, setTestEmail] = useState('')
  const [isTestingSmtp, setIsTestingSmtp] = useState(false)
  const [smtpTestResult, setSmtpTestResult] = useState(null)

  const loadData = useCallback(async (manual = false) => {
    try {
      setErrorMsg('')
      if (manual) setIsReloading(true)
      else setIsLoading(true)

      const [sysData, smtpData, rolesData] = await Promise.all([
        fetchSystemSettings(),
        fetchSmtpSettings(),
        fetchRolesList(true).catch(() => []),
      ])

      setSystemForm({
        ...INITIAL_SYSTEM,
        ...(sysData || {}),
        'app.maintenance_mode': String(sysData?.['app.maintenance_mode'] ?? '0') === '1' ? '1' : '0',
      })
      setSmtpForm({
        ...INITIAL_SMTP,
        ...(smtpData || {}),
        'smtp.password': '',
        has_password: Boolean(smtpData?.has_password),
      })
      setRoles(Array.isArray(rolesData) ? rolesData : [])
    } catch (err) {
      const msg = err.message || 'Gagal memuat konfigurasi sistem.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
      setIsReloading(false)
    }
  }, [])

  useEffect(() => {
    loadData(false)
  }, [loadData])

  const handleSaveSystem = async (e) => {
    e.preventDefault()
    setIsSavingSystem(true)
    try {
      const payload = {}
      Object.entries(systemForm).forEach(([dotKey, val]) => {
        payload[dotKey.replaceAll('.', '__')] = val
      })
      const res = await saveSystemSettings(payload)
      if (res?.data) {
        setSystemForm((prev) => ({
          ...prev,
          ...res.data,
          'app.maintenance_mode': String(res.data['app.maintenance_mode'] ?? '0') === '1' ? '1' : '0',
        }))
      }
      toast.success('Pengaturan sistem & keamanan berhasil disimpan.')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengaturan sistem.')
    } finally {
      setIsSavingSystem(false)
    }
  }

  const handleSaveSmtp = async (e) => {
    e.preventDefault()
    setIsSavingSmtp(true)
    try {
      const payload = {
        smtp__host: smtpForm['smtp.host'] || '',
        smtp__port: smtpForm['smtp.port'] || '',
        smtp__username: smtpForm['smtp.username'] || '',
        smtp__password: smtpForm['smtp.password'] || '',
        smtp__encryption: smtpForm['smtp.encryption'] || 'tls',
        smtp__from_name: smtpForm['smtp.from_name'] || '',
        smtp__from_email: smtpForm['smtp.from_email'] || '',
      }
      const res = await saveSmtpSettings(payload)
      setSmtpForm((prev) => ({
        ...prev,
        ...(res?.data || {}),
        'smtp.password': '',
        has_password: Boolean(res?.data?.has_password ?? prev.has_password),
      }))
      toast.success('Konfigurasi SMTP berhasil disimpan.')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan konfigurasi SMTP.')
    } finally {
      setIsSavingSmtp(false)
    }
  }

  const handleTestSmtp = async (e) => {
    e.preventDefault()
    if (!testEmail.trim()) {
      toast.error('Masukkan alamat email tujuan pengujian.')
      return
    }
    setIsTestingSmtp(true)
    setSmtpTestResult(null)
    try {
      const res = await testSmtpConnection(testEmail.trim())
      setSmtpTestResult({ ok: true, message: res?.message || 'Email uji coba berhasil dikirim.' })
      toast.success(res?.message || 'Email uji coba berhasil dikirim.')
    } catch (err) {
      setSmtpTestResult({ ok: false, message: err.message || 'Pengujian SMTP gagal.' })
      toast.error(err.message || 'Pengujian SMTP gagal.')
    } finally {
      setIsTestingSmtp(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-8">
      <SettingsSubpageHeader
        title="Konfigurasi Sistem & Email SMTP"
        description="Atur parameter umum aplikasi, batas unggahan, kebijakan keamanan login, serta server pengirim email notifikasi SIMOJANG."
        badgeLabel="Pengaturan • System & SMTP"
        onReloadClick={() => loadData(true)}
        isReloading={isReloading}
      />

      {errorMsg && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/90 dark:bg-rose-950/30 dark:border-rose-900/50 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="text-xs sm:text-sm font-medium">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Nav Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 w-fit">
        {[
          { id: 'system', label: 'Umum, Keamanan & Unggahan', icon: Settings },
          { id: 'smtp', label: 'Server SMTP & Uji Kirim Email', icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4 animate-pulse"
            >
              <div className="h-5 w-48 bg-slate-200/70 dark:bg-slate-800 rounded" />
              <div className="h-9 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-9 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-9 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            </div>
          ))}
        </div>
      ) : activeTab === 'system' ? (
        <form onSubmit={handleSaveSystem} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Identitas & Lingkungan Aplikasi */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Identitas & Runtime Aplikasi</h2>
                  <p className="text-[11px] text-slate-500">Nama sistem, zona waktu, dan status pemeliharaan</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Nama Aplikasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={systemForm['app.name'] || ''}
                    onChange={(e) => setSystemForm((p) => ({ ...p, 'app.name': e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                    placeholder="SIMOJANG"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Zona Waktu <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={systemForm['app.timezone'] || 'Asia/Jakarta'}
                      onChange={(e) => setSystemForm((p) => ({ ...p, 'app.timezone': e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                    >
                      <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                      <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                      <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Environment Flag <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={systemForm['env.flag'] || 'production'}
                      onChange={(e) => setSystemForm((p) => ({ ...p, 'env.flag': e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                    >
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      URL / Path Logo Aplikasi
                    </label>
                    <input
                      type="text"
                      value={systemForm['app.logo'] || ''}
                      onChange={(e) => setSystemForm((p) => ({ ...p, 'app.logo': e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                      placeholder="/assets/logo.png"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      URL / Path Favicon
                    </label>
                    <input
                      type="text"
                      value={systemForm['app.favicon'] || ''}
                      onChange={(e) => setSystemForm((p) => ({ ...p, 'app.favicon': e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                      placeholder="/favicon.ico"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemForm['app.maintenance_mode'] === '1'}
                    onChange={(e) =>
                      setSystemForm((p) => ({ ...p, 'app.maintenance_mode': e.target.checked ? '1' : '0' }))
                    }
                    className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      Aktifkan Mode Pemeliharaan (Maintenance Mode)
                    </div>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                      Menandai sistem sedang dalam jadwal perawatan terencana.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            {/* Keamanan, Sesi & Unggahan */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Keamanan, Sesi & Parameter Unggahan</h2>
                  <p className="text-[11px] text-slate-500">Kebijakan lock akun, default pagination, dan whitelist file</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Timeout Sesi (menit)
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={systemForm['session.timeout_minutes'] || ''}
                      onChange={(e) => setSystemForm((p) => ({ ...p, 'session.timeout_minutes': e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Default Baris per Halaman
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={systemForm['pagination.default_per_page'] || ''}
                      onChange={(e) => setSystemForm((p) => ({ ...p, 'pagination.default_per_page': e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Maksimal Percobaan Login
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={systemForm['security.max_login_attempt'] || ''}
                      onChange={(e) => setSystemForm((p) => ({ ...p, 'security.max_login_attempt': e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Durasi Kunci Login (menit)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={systemForm['security.lock_duration_minutes'] || ''}
                      onChange={(e) => setSystemForm((p) => ({ ...p, 'security.lock_duration_minutes': e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Role Default Akun Baru
                    </label>
                    {roles.length > 0 ? (
                      <select
                        value={systemForm['security.default_role_code'] || 'USR'}
                        onChange={(e) => setSystemForm((p) => ({ ...p, 'security.default_role_code': e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                      >
                        {roles.map((r) => (
                          <option key={r.role_code} value={r.role_code}>
                            {r.role_code} — {r.role_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={systemForm['security.default_role_code'] || 'USR'}
                        onChange={(e) => setSystemForm((p) => ({ ...p, 'security.default_role_code': e.target.value }))}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Batas Ukuran Upload (MB)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={systemForm['upload.max_size_mb'] || ''}
                      onChange={(e) => setSystemForm((p) => ({ ...p, 'upload.max_size_mb': e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Ekstensi File Diizinkan (pisahkan koma)
                  </label>
                  <input
                    type="text"
                    value={systemForm['upload.allowed_types'] || ''}
                    onChange={(e) => setSystemForm((p) => ({ ...p, 'upload.allowed_types': e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                    placeholder="pdf,jpg,jpeg,png,xlsx,docx"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingSystem || isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingSystem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Pengaturan Sistem</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Form SMTP */}
          <form onSubmit={handleSaveSmtp} className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Konfigurasi Server SMTP</h2>
                <p className="text-[11px] text-slate-500">Digunakan untuk notifikasi akun, reset sandi, dan pemberitahuan layanan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  SMTP Host <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={smtpForm['smtp.host'] || ''}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, 'smtp.host': e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Port <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={smtpForm['smtp.port'] || ''}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, 'smtp.port': e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                  placeholder="587"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  SMTP Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={smtpForm['smtp.username'] || ''}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, 'smtp.username': e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                  placeholder="noreply@bkn.go.id"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  SMTP Password{' '}
                  {smtpForm.has_password && (
                    <span className="text-[10px] font-semibold text-emerald-600">(Tersimpan — kosongkan jika tetap)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showSmtpPassword ? 'text' : 'password'}
                    value={smtpForm['smtp.password'] || ''}
                    onChange={(e) => setSmtpForm((p) => ({ ...p, 'smtp.password': e.target.value }))}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                    placeholder={smtpForm.has_password ? '••••••••••••' : 'Masukkan password / app key'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Enkripsi</label>
                <select
                  value={smtpForm['smtp.encryption'] || 'tls'}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, 'smtp.encryption': e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                >
                  <option value="tls">TLS (STARTTLS)</option>
                  <option value="ssl">SSL (SMTPS)</option>
                  <option value="none">Tanpa Enkripsi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Nama Pengirim</label>
                <input
                  type="text"
                  value={smtpForm['smtp.from_name'] || ''}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, 'smtp.from_name': e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                  placeholder="SIMOJANG"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Email Pengirim <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={smtpForm['smtp.from_email'] || ''}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, 'smtp.from_email': e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                  placeholder="noreply@bkn.go.id"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSmtp}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Konfigurasi SMTP</span>
              </button>
            </div>
          </form>

          {/* Panel Uji Kirim Email */}
          <form onSubmit={handleTestSmtp} className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Uji Koneksi & Kirim Email</h2>
                <p className="text-[11px] text-slate-500">Pastikan konfigurasi SMTP yang tersimpan dapat mengirim email</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Email Tujuan Pengujian
              </label>
              <input
                type="email"
                required
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                placeholder="admin@kanreg3.bkn.go.id"
              />
            </div>

            {smtpTestResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  smtpTestResult.ok
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                {smtpTestResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{smtpTestResult.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isTestingSmtp}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isTestingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Kirim Email Uji Coba</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
