import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Eye, EyeOff, AlertCircle, RefreshCw, Info } from 'lucide-react'
import { refreshAuthSession, saveAuthSession } from '../../services/auth'
import { apiRequest, checkBackendHealth } from '../../services/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('reason') === 'expired'
      ? 'Sesi Anda telah berakhir. Silakan masuk kembali.'
      : ''
  })
  const [showResetInfo, setShowResetInfo] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [shakeInputs, setShakeInputs] = useState(false)
  const navigate = useNavigate()

  const triggerShake = () => {
    setShakeInputs(true)
    setTimeout(() => setShakeInputs(false), 500)
  }

  useEffect(() => {
    let isMounted = true
    checkBackendHealth().then((isAlive) => {
      if (isMounted) {
        setBackendStatus(isAlive ? 'connected' : 'disconnected')
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    if (!username.trim()) {
      setError('NIP atau nama pengguna wajib diisi.')
      triggerShake()
      return
    }

    if (!password) {
      setError('Kata sandi wajib diisi.')
      triggerShake()
      return
    }

    if (password.length < 8) {
      setError('Kata sandi minimal harus terdiri dari 8 karakter.')
      triggerShake()
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('o_userlogin', username.trim())
      formData.append('o_password', password)
      formData.append('remember_login', rememberMe ? '1' : '0')

      const res = await apiRequest('/authprocess', {
        method: 'POST',
        body: formData,
        skipAuthRedirect: true,
      })

      if (res?.token) {
        // Cek apakah user login dengan password bawaan (password sama dengan username)
        const isDefaultPassword =
          Boolean(res?.default_password) ||
          password.trim() === username.trim() ||
          password.trim().toLowerCase() === username.trim().toLowerCase()

        if (isDefaultPassword) {
          sessionStorage.setItem('simojang_prompt_default_password', 'true')
        } else {
          sessionStorage.removeItem('simojang_prompt_default_password')
        }

        const session = {
          token: res.token,
          remember_login: rememberMe,
          must_change_password: isDefaultPassword,
          expires_at: res.expires_in
            ? new Date(Date.now() + Math.min(Number(res.expires_in), 3600) * 1000).toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString(),
          user: {
            username: username.trim(),
            roles: [res.role || 'pegawai'],
            role: res.role || 'pegawai',
            must_change_password: isDefaultPassword,
          },
        }

        saveAuthSession(session)

        try {
          await refreshAuthSession()
        } catch {
          // Pertahankan sesi awal jika sinkronisasi profil sementara gagal
        }

        setBackendStatus('connected')
        setIsSubmitting(false)
        navigate('/dashboard')
        return
      }

      triggerShake()
      setError(res?.message || 'Kredensial tidak valid. Periksa kembali NIP dan kata sandi Anda.')
      setIsSubmitting(false)
    } catch (err) {
      setIsSubmitting(false)
      triggerShake()

      const status = err?.status
      if (status === 0 || typeof status === 'undefined' || status === 502 || status === 503 || status === 504) {
        setBackendStatus('disconnected')
        setError('Tidak dapat terhubung ke layanan server. Periksa koneksi jaringan Anda lalu coba lagi.')
        return
      }

      setBackendStatus('connected')
      setError(err?.message || 'Gagal masuk ke sistem. Silakan periksa kembali NIP dan kata sandi Anda.')
    }
  }

  return (
    <div className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* ========================================================
          SISI KIRI: FORMULIR LOGIN (COL-5 / 41.7%)
         ======================================================== */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 min-h-[100dvh] lg:min-h-auto z-10 bg-white dark:bg-slate-950">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Logo BKN"
            className="h-9 w-auto object-contain"
          />
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white block leading-none">
              SIMOJANG
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-1">
              Kanreg III BKN
            </span>
          </div>
        </div>

        {/* Center Container: Form */}
        <div className="w-full max-w-[380px] mx-auto my-auto py-8">
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Masuk ke Akun
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Masukkan NIP dan kata sandi Anda untuk melanjutkan.
            </p>
          </div>

          {/* Error Banner */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="login-error-banner"
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden mb-5"
              >
                <div className="p-3.5 rounded-xl bg-[#FEF3F2] dark:bg-rose-950/35 border border-[#FECDCA]/80 dark:border-rose-900/70 text-xs text-[#B42318] dark:text-[#FDA29B] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Helpdesk Notice */}
          <AnimatePresence>
            {showResetInfo && (
              <motion.div
                key="reset-info-banner"
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden mb-5"
              >
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#175CD3] dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Untuk bantuan lupa kata sandi atau reset akun, silakan hubungi Helpdesk Tata Usaha Kanreg III BKN.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Inputs */}
          <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
            {/* Input NIP / Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-username"
                className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                NIP / Nama Pengguna
              </label>
              <div className={`relative ${shakeInputs ? 'animate-shake' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Masukkan 18 digit NIP"
                  autoComplete="off"
                  className={`w-full h-11 pl-10 pr-3.5 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none transition-all ${
                    shakeInputs
                      ? 'border-[#B42318] ring-2 ring-[#B42318]/20 dark:border-rose-600'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#175CD3] focus:ring-4 focus:ring-[#175CD3]/10'
                  }`}
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Kata Sandi
              </label>
              <div className={`relative ${shakeInputs ? 'animate-shake' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="••••••••"
                  autoComplete="off"
                  className={`w-full h-11 pl-10 pr-10 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none transition-all ${
                    shakeInputs
                      ? 'border-[#B42318] ring-2 ring-[#B42318]/20 dark:border-rose-600'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#175CD3] focus:ring-4 focus:ring-[#175CD3]/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#175CD3] focus:ring-[#175CD3]/20 cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>

              <button
                type="button"
                onClick={() => setShowResetInfo((prev) => !prev)}
                className="text-xs sm:text-sm font-semibold text-[#175CD3] dark:text-blue-400 hover:underline cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 px-4 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-400 dark:text-slate-500 text-center lg:text-left">
          © 2026 Kantor Regional III BKN Bandung
        </div>
      </div>

      {/* ========================================================
          SISI KANAN: BRAND VISUAL & GEDUNG BKN ANCHORED DI BOTTOM (COL-7 / 58.3%)
         ======================================================== */}
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between bg-gradient-to-b from-[#1250C4] via-[#0E42A8] to-[#0A3078] text-white overflow-hidden min-h-[100dvh]">
        {/* Soft Circular Glow Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        {/* Minimal Headline Text di Bagian Atas */}
        <div className="relative z-10 p-12 lg:p-16 max-w-xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-blue-100 tracking-wide mb-3">
            Kantor Regional III BKN Bandung
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            SIMOJANG
          </h2>
          <p className="text-sm text-blue-100/80 mt-2 font-normal leading-relaxed">
            Sistem Informasi Monitoring Kinerja Layanan Kepegawaian.
          </p>
        </div>

        {/* Ilustrasi Gedung BKN: Menempel Presisi di Bagian Paling Bawah */}
        <div className="relative z-10 mt-auto w-full flex justify-center pointer-events-none select-none">
          <img
            src={`${import.meta.env.BASE_URL}bkn-illustration.png`}
            alt="Gedung Kanreg III BKN Bandung"
            className="w-full max-w-3xl max-h-[64vh] object-contain object-bottom drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  )
}
