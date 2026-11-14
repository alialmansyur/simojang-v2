import { useEffect, useRef, useState } from 'react'
import {
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Camera,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  PencilLine,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { COMPONENT_STYLES } from '../../config/colorGuide'
import { UserAvatar } from '../../components/shared/UserAvatar'
import { ChangePasswordModal } from '../../components/shared/ChangePasswordModal'
import {
  buildUserSummary,
  subscribeAuthChange,
} from '../../services/auth'
import { fetchMyProfile, updateMyProfile } from '../../services/profile'

function formatDateTime(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
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

function InfoFieldCard({ icon, label, value, mono = false }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/55 p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center text-action dark:text-blue-300 flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </div>
        <div
          className={`mt-1 text-sm font-bold text-slate-900 dark:text-white break-words ${
            mono ? 'tabular-nums' : ''
          }`}
        >
          {value || '-'}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [user, setUser] = useState(() => buildUserSummary())
  const [activeTab, setActiveTab] = useState('profil')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const [form, setForm] = useState({
    fullname: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
  })
  const [errors, setErrors] = useState({})
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const fileInputRef = useRef(null)

  const syncFormFromUser = (nextUser) => {
    setForm({
      fullname: nextUser.name || '',
      email: nextUser.email || '',
      phone: nextUser.phone || '',
    })
  }

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      setIsLoading(true)
      try {
        const fresh = await fetchMyProfile()
        if (isMounted && fresh) {
          setUser(fresh)
          syncFormFromUser(fresh)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadProfile()
    const unsubscribe = subscribeAuthChange(() => {
      const updated = buildUserSummary()
      setUser(updated)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const displayedAvatar = removeAvatar ? null : avatarPreview || user.avatarUrl

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleAvatarSelected = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format foto harus JPG, PNG, atau WEBP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2 MB.')
      return
    }

    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setRemoveAvatar(false)
    setIsEditing(true)
    setActiveTab('profil')
  }

  const handleCancelEdit = () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(false)
    setErrors({})
    syncFormFromUser(user)
    setIsEditing(false)
  }

  const handleSaveProfile = async (event) => {
    if (event) event.preventDefault()

    const nextErrors = {}
    if (!form.fullname.trim()) {
      nextErrors.fullname = 'Nama lengkap wajib diisi.'
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Alamat email wajib diisi.'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = 'Format alamat email tidak valid.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Periksa kembali data profil yang belum valid.')
      return
    }

    try {
      setIsSaving(true)
      let payload
      if (avatarFile || removeAvatar) {
        const formData = new FormData()
        formData.append('fullname', form.fullname.trim())
        formData.append('email', form.email.trim())
        formData.append('phone', form.phone.trim())
        if (avatarFile) {
          formData.append('avatar', avatarFile)
        }
        if (removeAvatar) {
          formData.append('remove_avatar', '1')
        }
        payload = formData
      } else {
        payload = {
          fullname: form.fullname.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        }
      }

      const res = await updateMyProfile(payload)
      const freshUser = buildUserSummary()
      setUser(freshUser)
      syncFormFromUser(freshUser)
      setAvatarFile(null)
      setAvatarPreview(null)
      setRemoveAvatar(false)
      setIsEditing(false)
      toast.success(res?.message || 'Profil berhasil diperbarui.')
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      }
      toast.error(err?.message || 'Gagal memperbarui profil.')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profil', label: 'Informasi Profil', icon: <User className="w-4 h-4" /> },
    { id: 'keamanan', label: 'Keamanan Akun', icon: <ShieldCheck className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header / Profile Identity Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-6 sm:p-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
            <div className="relative self-start sm:self-auto">
              <UserAvatar
                src={displayedAvatar}
                initials={user.avatar}
                name={user.name}
                size="xl"
                isActive={user.isActive}
                roundedClass="rounded-[1.5rem]"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Ubah Foto Profil"
                aria-label="Ubah Foto Profil"
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-xs text-slate-700 dark:text-slate-200 hover:text-action flex items-center justify-center transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelected}
                className="hidden"
              />
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={COMPONENT_STYLES.badgePrimary}>{user.roleName}</span>
                <span className={user.isActive ? COMPONENT_STYLES.badgeSuccess : COMPONENT_STYLES.badgeDanger}>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.isActive ? 'bg-[#067647]' : 'bg-[#B42318]'
                    }`}
                  />
                  {user.isActive ? 'Akun Aktif' : 'Non-Aktif'}
                </span>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {user.name}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {user.nip ? `NIP ${user.nip}` : user.username ? `Username: ${user.username}` : 'Pegawai Kanreg III BKN'}
                  {user.jabatan ? ` • ${user.jabatan}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            {isEditing ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className={COMPONENT_STYLES.btnNeutral}
              >
                <X className="w-4 h-4" />
                <span>Batal Edit</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('profil')
                  setIsEditing(true)
                }}
                className={COMPONENT_STYLES.btnNeutral}
              >
                <PencilLine className="w-4 h-4" />
                <span>Edit Profil</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="master-primary-btn inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Ubah Kata Sandi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-action text-white shadow-xs'
                      : 'bg-slate-100/75 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {isLoading ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Menyelaraskan data...</span>
            </div>
          ) : null}
        </div>

        <div className="p-5 sm:p-7">
          {activeTab === 'profil' ? (
            isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      Perbarui Informasi Profil
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Perubahan nama, kontak, dan foto avatar akan langsung tampil pada Topbar & Sidebar.
                    </p>
                  </div>

                  {(displayedAvatar || user.avatarUrl) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null)
                        setAvatarPreview(null)
                        setRemoveAvatar(true)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#B42318] bg-[#FEF3F2] hover:bg-[#FEE4E2] border border-[#FECDCA] transition-colors cursor-pointer self-start"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto Avatar</span>
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="profile-fullname" className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                      Nama Lengkap
                    </label>
                    <input
                      id="profile-fullname"
                      name="fullname"
                      value={form.fullname}
                      onChange={handleFieldChange}
                      placeholder="Masukkan nama lengkap beserta gelar"
                      className={COMPONENT_STYLES.inputBase}
                    />
                    {errors.fullname ? (
                      <p className="text-xs font-semibold text-[#B42318] dark:text-[#FDA29B]">{errors.fullname}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="profile-email" className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                      Alamat Email
                    </label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleFieldChange}
                      placeholder="nama@bkn.go.id"
                      className={COMPONENT_STYLES.inputBase}
                    />
                    {errors.email ? (
                      <p className="text-xs font-semibold text-[#B42318] dark:text-[#FDA29B]">{errors.email}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="profile-phone" className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                      No. Telepon / WhatsApp
                    </label>
                    <input
                      id="profile-phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleFieldChange}
                      placeholder="08xxxxxxxxxx"
                      className={COMPONENT_STYLES.inputBase}
                    />
                    {errors.phone ? (
                      <p className="text-xs font-semibold text-[#B42318] dark:text-[#FDA29B]">{errors.phone}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                      NIP / Username Login
                    </label>
                    <input
                      type="text"
                      value={user.nip || user.username || '-'}
                      disabled
                      className={`${COMPONENT_STYLES.inputBase} opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className={COMPONENT_STYLES.btnNeutral}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="master-primary-btn inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    Identitas Pengguna & Kepegawaian
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Ringkasan data akun terdaftar pada Kantor Regional III BKN Bandung.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoFieldCard
                    icon={<User className="w-4 h-4" />}
                    label="Nama Lengkap"
                    value={user.name}
                  />
                  <InfoFieldCard
                    icon={<BadgeCheck className="w-4 h-4" />}
                    label="NIP / Username"
                    value={user.nip || user.username || '-'}
                    mono
                  />
                  <InfoFieldCard
                    icon={<Mail className="w-4 h-4" />}
                    label="Alamat Email"
                    value={user.email || '-'}
                  />
                  <InfoFieldCard
                    icon={<Phone className="w-4 h-4" />}
                    label="No. Telepon"
                    value={user.phone || 'Belum dilengkapi'}
                    mono
                  />
                  <InfoFieldCard
                    icon={<Briefcase className="w-4 h-4" />}
                    label="Jabatan / Unit"
                    value={user.jabatan || 'Kantor Regional III BKN'}
                  />
                  <InfoFieldCard
                    icon={<ShieldCheck className="w-4 h-4" />}
                    label="Peran (Role)"
                    value={`${user.roleName} (${user.roleRaw.toUpperCase()})`}
                  />
                </div>
              </div>
            )
          ) : null}

          {activeTab === 'keamanan' ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Keamanan & Autentikasi Akun
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Kelola kata sandi dan pantau status sesi login JWT Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoFieldCard
                  icon={<CalendarClock className="w-4 h-4" />}
                  label="Login Terakhir"
                  value={formatDateTime(user.lastLogin)}
                />
                <InfoFieldCard
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  label="Status Verifikasi Akun"
                  value={user.isActive ? 'Terverifikasi Aktif' : 'Non-Aktif'}
                />
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/55 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Perbarui Kata Sandi Secara Berkala
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                    Gunakan kombinasi minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol unik untuk menjaga keamanan data layanan kepegawaian.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(true)}
                  className="master-primary-btn inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold cursor-pointer flex-shrink-0 self-start sm:self-center"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Ubah Kata Sandi</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  )
}
