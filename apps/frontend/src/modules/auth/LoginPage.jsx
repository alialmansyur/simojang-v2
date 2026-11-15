import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, RefreshCw, Info } from 'lucide-react'
import { refreshAuthSession, saveAuthSession } from '../../services/auth'
import { apiRequest, checkBackendHealth } from '../../services/api'

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

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
    <div className="min-h-[100dvh] bg-[#F2F5FA] dark:bg-[#090E1A] flex flex-col items-center justify-center px-4 py-8 font-sans text-slate-900 dark:text-slate-100 antialiased">
      <main className="w-full max-w-[430px]">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-8 sm:p-10 dark:ring-1 dark:ring-slate-800/80 transition-colors"
        >
          {/* Brand Logo + Wordmark */}
          <div className="flex items-center gap-2.5 mb-8">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Logo BKN"
              className="h-8 w-auto object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Simojang
            </span>
          </div>

          {/* Crisp Heading & Subtitle */}
          <div className="mb-7">
            <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
              Masuk
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Selamat datang kembali! Masukkan detail akun Anda.
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
                <div className="p-3.5 rounded-xl bg-[#FEF3F2] dark:bg-rose-950/35 border border-[#FECDCA]/80 dark:border-rose-900/70 text-xs sm:text-[13px] text-[#B42318] dark:text-[#FDA29B] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium leading-relaxed">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forgot Password Inline Notice */}
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
                <div className="p-3.5 rounded-xl bg-action-soft/80 dark:bg-action/15 text-xs text-slate-700 dark:text-blue-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-action dark:text-blue-300 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Hubungi Helpdesk Tata Usaha atau Pengelola Sistem Kanreg III BKN untuk reset kata sandi.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clean Form */}
          <form onSubmit={handleLogin} autoComplete="off" className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="login-username"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                NIP / Username
              </label>
              <div className={shakeInputs ? 'animate-shake' : ''}>
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
                  className={`w-full h-11 px-3.5 rounded-xl border bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none transition-all ${
                    shakeInputs
                      ? 'border-[#B42318] ring-2 ring-[#B42318]/20 dark:border-rose-600'
                      : 'border-slate-300/90 dark:border-slate-700 focus:border-action focus:ring-4 focus:ring-action/10'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Kata Sandi
              </label>
              <div className={`relative ${shakeInputs ? 'animate-shake' : ''}`}>
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
                  className={`w-full h-11 pl-3.5 pr-10 rounded-xl border bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none transition-all ${
                    shakeInputs
                      ? 'border-[#B42318] ring-2 ring-[#B42318]/20 dark:border-rose-600'
                      : 'border-slate-300/90 dark:border-slate-700 focus:border-action focus:ring-4 focus:ring-action/10'
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

            {/* Remember + Forgot Password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-action focus:ring-action/20 cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>

              <button
                type="button"
                onClick={() => setShowResetInfo((prev) => !prev)}
                className="text-sm font-semibold text-action dark:text-blue-400 hover:underline cursor-pointer"
              >
                Lupa kata sandi
              </button>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 px-4 rounded-xl bg-action hover:bg-action-hover active:scale-[0.99] text-white text-sm font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Subtle Footer Status */}
          <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
            {backendStatus === 'disconnected'
              ? 'Layanan server sedang tidak terjangkau. Periksa koneksi Anda atau hubungi administrator.'
              : 'Kanreg III BKN Bandung'}
          </p>
        </motion.div>
      </main>
    </div>
  )
}
