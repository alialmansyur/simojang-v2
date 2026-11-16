import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, Eye, EyeOff, KeyRound, ShieldAlert } from 'lucide-react'
import { AppSpinner } from './AppSpinner'
import { toast } from 'react-toastify'
import { Modal } from '../ui/Modal'
import { COMPONENT_STYLES } from '../../config/colorGuide'
import { changeMyPassword } from '../../services/profile'

const INITIAL_FORM = {
  current_password: '',
  new_password: '',
  confirm_password: '',
}

function getFieldErrors(error) {
  const details = error?.details
  if (!details || typeof details !== 'object' || !details.errors || typeof details.errors !== 'object') {
    return {}
  }

  return Object.entries(details.errors).reduce((acc, [key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      acc[key] = value[0]
    } else if (typeof value === 'string') {
      acc[key] = value
    }
    return acc
  }, {})
}

function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  error,
  show,
  onToggleShow,
  autoComplete = 'off',
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${COMPONENT_STYLES.inputBase} pr-11 ${
            error ? 'border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]/25' : ''
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          aria-label={show ? `Sembunyikan ${label}` : `Tampilkan ${label}`}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error ? (
        <p className="text-xs font-semibold text-[#B42318] dark:text-[#FDA29B]">{error}</p>
      ) : null}
    </div>
  )
}

/**
 * Reusable modal popup untuk mengubah kata sandi pengguna mengikuti desain modal SIMOJANG.
 */
export function ChangePasswordModal({ isOpen, onClose, onSuccess, isDefaultPassword = false }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [visibility, setVisibility] = useState({
    current: false,
    next: false,
    confirm: false,
  })

  const resetModalState = () => {
    setForm(INITIAL_FORM)
    setErrors({})
    setGeneralError('')
    setVisibility({ current: false, next: false, confirm: false })
  }

  const handleRequestClose = () => {
    if (isSubmitting) return
    resetModalState()
    onClose?.()
  }

  const checks = useMemo(() => {
    const pwd = form.new_password
    return [
      { key: 'length', label: 'Minimal 8 karakter', met: pwd.length >= 8 },
      { key: 'upper', label: 'Mengandung huruf besar (A-Z)', met: /[A-Z]/.test(pwd) },
      { key: 'lower', label: 'Mengandung huruf kecil (a-z)', met: /[a-z]/.test(pwd) },
      { key: 'number', label: 'Mengandung angka (0-9)', met: /\d/.test(pwd) },
      { key: 'symbol', label: 'Mengandung simbol (!@#$%...)', met: /[\W_]/.test(pwd) },
      {
        key: 'different',
        label: 'Berbeda dari kata sandi saat ini',
        met: Boolean(pwd) && pwd !== form.current_password,
      },
    ]
  }, [form.new_password, form.current_password])

  const allRulesMet = checks.every((item) => item.met)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setGeneralError('')
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.current_password) {
      nextErrors.current_password = 'Kata sandi saat ini wajib diisi.'
    }
    if (!form.new_password) {
      nextErrors.new_password = 'Kata sandi baru wajib diisi.'
    } else if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/.test(form.new_password)) {
      nextErrors.new_password = 'Kata sandi baru belum memenuhi seluruh ketentuan keamanan.'
    } else if (form.new_password === form.current_password) {
      nextErrors.new_password = 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.'
    }

    if (!form.confirm_password) {
      nextErrors.confirm_password = 'Konfirmasi kata sandi baru wajib diisi.'
    } else if (form.new_password !== form.confirm_password) {
      nextErrors.confirm_password = 'Konfirmasi kata sandi baru tidak cocok.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    if (event) event.preventDefault()
    if (!validate()) return

    try {
      setIsSubmitting(true)
      setGeneralError('')
      const res = await changeMyPassword(form)
      toast.success(res?.message || 'Kata sandi berhasil diubah.')
      resetModalState()
      onSuccess?.()
      onClose?.()
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      }
      const message = err?.message || 'Gagal mengubah kata sandi.'
      setGeneralError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleRequestClose}
      size="sm"
      title="Ubah Kata Sandi"
      description="Masukkan kata sandi baru untuk akun Anda."
      footer={
        <>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleRequestClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="master-primary-btn inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <AppSpinner size="sm" color="white" strokeWidth={3.5} /> : <KeyRound className="w-4 h-4" />}
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Kata Sandi'}</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-[#FECDCA] bg-[#FEF3F2] px-3.5 py-3 text-xs font-semibold text-[#B42318] dark:border-[#B42318]/40 dark:bg-[#B42318]/15 dark:text-[#FDA29B]">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        ) : null}

        <PasswordInput
          id="change-pwd-current"
          name="current_password"
          label="Kata Sandi Saat Ini"
          value={form.current_password}
          onChange={handleChange}
          placeholder="Masukkan kata sandi saat ini"
          error={errors.current_password}
          show={visibility.current}
          onToggleShow={() => setVisibility((prev) => ({ ...prev, current: !prev.current }))}
          autoComplete="current-password"
        />

        <PasswordInput
          id="change-pwd-new"
          name="new_password"
          label="Kata Sandi Baru"
          value={form.new_password}
          onChange={handleChange}
          placeholder="Minimal 8 karakter kombinasi"
          error={errors.new_password}
          show={visibility.next}
          onToggleShow={() => setVisibility((prev) => ({ ...prev, next: !prev.next }))}
          autoComplete="new-password"
        />

        {/* Checklist Persyaratan Keamanan */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/50 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Ketentuan Kata Sandi</span>
            <span className={allRulesMet ? 'text-[#067647] dark:text-[#75E0A7]' : 'text-slate-400'}>
              {checks.filter((c) => c.met).length}/{checks.length} terpenuhi
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {checks.map((item) => (
              <div
                key={item.key}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  item.met
                    ? 'text-[#067647] dark:text-[#75E0A7]'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.met ? (
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <PasswordInput
          id="change-pwd-confirm"
          name="confirm_password"
          label="Konfirmasi Kata Sandi Baru"
          value={form.confirm_password}
          onChange={handleChange}
          placeholder="Ulangi kata sandi baru"
          error={errors.confirm_password}
          show={visibility.confirm}
          onToggleShow={() => setVisibility((prev) => ({ ...prev, confirm: !prev.confirm }))}
          autoComplete="new-password"
        />
      </form>
    </Modal>
  )
}
