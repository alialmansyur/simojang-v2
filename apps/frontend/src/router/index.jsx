import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'

import {
  clearAuthSession,
  getAuthSession,
  isAuthenticated as checkIsAuthenticated,
  refreshAuthSession,
  subscribeAuthChange,
} from '../services/auth'
import { canAccessRoute } from '../modules/navigation/config'
import { AppErrorBoundary } from '../components/AppErrorBoundary'
import { AdminLayout } from '../layout/AdminLayout'
import { AppPageLoader } from '../components/shared/AppSpinner'

const SOFT_CANVAS_CLASS = 'bg-[#F2F5FA] dark:bg-[#090E1A]'

// Simojang Core Modules
const LoginPage = lazy(() => import('../modules/auth/LoginPage'))
const SimojangDashboard = lazy(() => import('../modules/dashboard/SimojangDashboard'))
const MyTasksPage = lazy(() => import('../modules/services/MyTasksPage'))
const CalendarPage = lazy(() => import('../modules/office/CalendarPage'))
const GalleryPage = lazy(() => import('../modules/office/GalleryPage'))
const TimKerjaHubPage = lazy(() => import('../modules/services/TimKerjaHubPage'))
const GenericServicePage = lazy(() => import('../modules/services/GenericServicePage'))
const PengaturanHubPage = lazy(() => import('../modules/settings/PengaturanHubPage'))
const ReferensiPage = lazy(() => import('../modules/settings/ReferensiPage'))
const SettingsUsersPage = lazy(() => import('../modules/settings/SettingsUsersPage'))
const SettingsRolesPage = lazy(() => import('../modules/settings/SettingsRolesPage'))
const SettingsServicesPage = lazy(() => import('../modules/settings/SettingsServicesPage'))
const SettingsSystemPage = lazy(() => import('../modules/settings/SettingsSystemPage'))
const SettingsAuditPage = lazy(() => import('../modules/settings/SettingsAuditPage'))
const ProfilePage = lazy(() => import('../modules/profile/ProfilePage'))

// 6 Dedicated Services under Tim Kerja Status dan Pemberhentian (SnP)
const CltnPage = lazy(() => import('../modules/services/snp/CltnPage'))
const AsnAktifPage = lazy(() => import('../modules/services/snp/AsnAktifPage'))
const CpnsPnsPage = lazy(() => import('../modules/services/snp/CpnsPnsPage'))
const PertekPensiunPage = lazy(() => import('../modules/services/snp/PertekPensiunPage'))
const SkPensiunPage = lazy(() => import('../modules/services/snp/SkPensiunPage'))
const RegisPensiunPage = lazy(() => import('../modules/services/snp/RegisPensiunPage'))

// 5 Dedicated Services under Tim Kerja Pengangkatan dan Mutasi (PnM)
const KpPage = lazy(() => import('../modules/services/pnm/KpPage'))
const PencantumanGelarPage = lazy(() => import('../modules/services/pnm/PencantumanGelarPage'))
const TapnipPage = lazy(() => import('../modules/services/pnm/TapnipPage'))
const PmkPage = lazy(() => import('../modules/services/pnm/PmkPage'))
const PindahInstansiPage = lazy(() => import('../modules/services/pnm/PindahInstansiPage'))

// 3 Dedicated Services under Tim Kerja Pengawasan dan Pengendalian (Wasdal)
const MeritPage = lazy(() => import('../modules/services/wasdal/MeritPage'))
const NspkPage = lazy(() => import('../modules/services/wasdal/NspkPage'))
const WasdalNetralitasPage = lazy(() => import('../modules/services/wasdal/WasdalNetralitasPage'))

// 6 Dedicated Services under Tim Kerja Pembinaan Manajemen ASN (PMA)
const ManajemenTalentaPage = lazy(() => import('../modules/services/pma/ManajemenTalentaPage'))
const PembinaanKinerjaPage = lazy(() => import('../modules/services/pma/PembinaanKinerjaPage'))
const PengembanganKompetensiPage = lazy(() => import('../modules/services/pma/PengembanganKompetensiPage'))
const DisiplinBudayaCitraPage = lazy(() => import('../modules/services/pma/DisiplinBudayaCitraPage'))
const PenilaianKompetensiPage = lazy(() => import('../modules/services/pma/PenilaianKompetensiPage'))
const PenilaianKarierPage = lazy(() => import('../modules/services/pma/PenilaianKarierPage'))

// 7 Dedicated Services under Tim Kerja Sistem Informasi dan Digitalisasi (SIDIGI)
const StatistikPegawaiPage = lazy(() => import('../modules/services/sidigi/StatistikPegawaiPage'))
const PeremajaanDataPage = lazy(() => import('../modules/services/sidigi/PeremajaanDataPage'))
const DisparitasDataPage = lazy(() => import('../modules/services/sidigi/DisparitasDataPage'))
const IntegrasiSiasnPage = lazy(() => import('../modules/services/sidigi/IntegrasiSiasnPage'))
const ArsipTakahPage = lazy(() => import('../modules/services/sidigi/ArsipTakahPage'))
const ArsipDmsPage = lazy(() => import('../modules/services/sidigi/ArsipDmsPage'))
const PnbpCatPage = lazy(() => import('../modules/services/sidigi/PnbpCatPage'))
const FasilitasiCatHubPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatHubPage'))
const FasilitasiCatRekapDataPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatRekapDataPage'))
const FasilitasiCatLaporanPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatLaporanPage'))
const FasilitasiCatLaporanDetailPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatLaporanDetailPage'))
const FasilitasiCatLaporanBuilderPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatLaporanBuilderPage'))
const FasilitasiCatPengelolaPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatPengelolaPage'))
const FasilitasiCatPengelolaJadwalPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatPengelolaJadwalPage'))
const FasilitasiCatPengelolaTimPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatPengelolaTimPage'))
const FasilitasiCatPengelolaDokumenPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatPengelolaDokumenPage'))
const FasilitasiCatPengelolaDokumenDetailPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatPengelolaDokumenDetailPage'))
const FasilitasiCatPengelolaDokumenBuilderPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatPengelolaDokumenBuilderPage'))
const FasilitasiCatPengelolaDataPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatPengelolaDataPage'))
const FasilitasiCatPengelolaMasterPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatPengelolaMasterPage'))
const FasilitasiCatRekapitulasiPage = lazy(() => import('../modules/services/sidigi/FasilitasiCatRekapitulasiPage'))
const CatPublicEsignPage = lazy(() => import('../modules/services/sidigi/CatPublicEsignPage'))

// 12 Dedicated Services under Tim Kerja Tata Usaha (TU)
const AnggaranHubPage = lazy(() => import('../modules/services/tu/AnggaranHubPage'))
const AnggaranMasterPage = lazy(() => import('../modules/services/tu/AnggaranMasterPage'))
const AnggaranRealisasiPage = lazy(() => import('../modules/services/tu/AnggaranRealisasiPage'))
const IkmPage = lazy(() => import('../modules/services/tu/IkmPage'))
const HumasPage = lazy(() => import('../modules/services/tu/HumasPage'))
const SuratPage = lazy(() => import('../modules/services/tu/SuratPage'))
const KonsultasiPage = lazy(() => import('../modules/services/tu/KonsultasiPage'))
const IkpaPage = lazy(() => import('../modules/services/tu/IkpaPage'))
const StatistikInternalPage = lazy(() => import('../modules/services/tu/StatistikInternalPage'))
const StatistikInternalHubPage = lazy(() => import('../modules/services/tu/StatistikInternalHubPage'))
const StatistikPetaJabatanPage = lazy(() => import('../modules/services/tu/StatistikPetaJabatanPage'))
const StatistikMasterDataPage = lazy(() => import('../modules/services/tu/StatistikMasterDataPage'))
const EkinPage = lazy(() => import('../modules/services/tu/EkinPage'))
const ManageAssetsPage = lazy(() => import('../modules/services/tu/ManageAssetsPage'))
const ManageRuanganPage = lazy(() => import('../modules/services/tu/ManageRuanganPage'))
const ManageProjectPage = lazy(() => import('../modules/services/tu/ManageProjectPage'))
const LostAndFoundPage = lazy(() => import('../modules/services/tu/LostAndFoundPage'))
const IkkPage = lazy(() => import('../modules/services/tu/IkkPage'))


function ProtectedRoute({ authenticated, children }) {
  const location = useLocation()
  const session = getAuthSession()
  const isAuth = Boolean(authenticated && session && checkIsAuthenticated())

  // Jika sesi telah berakhir atau tidak ada data sesi valid, langsung arahkan ke /login tanpa side-effects saat render
  if (!isAuth) {
    return <Navigate to="/login?reason=expired" state={{ from: location }} replace />
  }

  // Pengecekan RBAC hanya untuk sesi pengguna yang sah & aktif
  if (!canAccessRoute(location.pathname, session)) {
    return (
      <AdminLayout title="Akses Dibatasi" canvasClassName={SOFT_CANVAS_CLASS}>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-2xl border border-rose-200/80 dark:border-rose-900/50 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Akses Halaman Dibatasi
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Role atau akun Anda tidak memiliki izin RBAC untuk membuka halaman ini.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#154EB2] text-white text-xs font-semibold transition-colors"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }
  return children
}

export function AppRouter() {
  const location = useLocation()
  const [authState, setAuthState] = useState(() => ({
    authenticated: checkIsAuthenticated(),
    version: 0,
  }))
  const [verifyingSession, setVerifyingSession] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname
      if (p === '/login' || p.endsWith('/login')) return false
    }
    return checkIsAuthenticated()
  })

  // Trigger saat klik halaman / navigasi berpindah rute:
  // Cek apakah session masih aktif secara real-time. Jika session habis, bersihkan & sinkronkan state.
  useEffect(() => {
    const isPublic =
      location.pathname === '/login' ||
      location.pathname.startsWith('/laporan/esign/') ||
      location.pathname.startsWith('/esign/') ||
      location.pathname.startsWith('/layanan/fasilitasi-cat/laporan/esign/') ||
      location.pathname.startsWith('/public/cat-esign')

    if (!isPublic) {
      if (!checkIsAuthenticated()) {
        clearAuthSession()
        setAuthState({
          authenticated: false,
          version: Date.now(),
        })
      }
    }
  }, [location.pathname])

  useEffect(() => {
    let active = true

    if (checkIsAuthenticated()) {
      // Safety timer (maks 2.5 detik) agar tidak pernah muter/loading tak terhingga jika backend lambat/macet
      const safetyTimer = setTimeout(() => {
        if (active) {
          setVerifyingSession(false)
        }
      }, 2500)

      refreshAuthSession()
        .catch(() => null)
        .finally(() => {
          clearTimeout(safetyTimer)
          if (active) {
            setVerifyingSession(false)
          }
        })
    } else {
      setVerifyingSession(false)
    }

    const unsubscribe = subscribeAuthChange(() => {
      setAuthState((current) => ({
        authenticated: checkIsAuthenticated(),
        version: current.version + 1,
      }))
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const isAuth = authState.authenticated

  if (verifyingSession) {
    return <AppPageLoader message="Memverifikasi sesi Anda..." />
  }

  return (
    <AppErrorBoundary>
      <Suspense fallback={<AppPageLoader message="Memuat halaman..." />}>
        <Routes>
          {/* Public Login Route - Redirects to /dashboard if already logged in */}
          <Route
            path="/login"
            element={isAuth ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />

          {/* Public E-Signature Routes (Shareable Link for CAT Report & BA) */}
          <Route
            path="/laporan/esign/:token"
            element={<CatPublicEsignPage />}
          />
          <Route
            path="/esign/:token"
            element={<CatPublicEsignPage />}
          />
          <Route
            path="/layanan/fasilitasi-cat/laporan/esign/:token"
            element={<CatPublicEsignPage />}
          />
          <Route
            path="/public/cat-esign/:token"
            element={<CatPublicEsignPage />}
          />

          {/* Root Redirect */}
          <Route
            path="/"
            element={<Navigate to={isAuth ? '/dashboard' : '/login'} replace />}
          />

          {/* Main Dashboard (Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout
                  title="Dashboard Utama"
                  canvasClassName={SOFT_CANVAS_CLASS}
                >
                  <SimojangDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Layanan Saya (Protected) */}
          <Route
            path="/my-tasks"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Layanan Saya">
                  <MyTasksPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Profil Pengguna (Protected) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Profil Saya" canvasClassName={SOFT_CANVAS_CLASS}>
                  <ProfilePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Kalender Kegiatan Kantor (Protected) */}
          <Route
            path="/calendar-event"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout
                  title="Kalender Kantor"
                  canvasClassName={SOFT_CANVAS_CLASS}
                >
                  <CalendarPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Galeri Dokumentasi Kegiatan (Protected) */}
          <Route
            path="/activity-gallery"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout
                  title="Galeri Kegiatan"
                  canvasClassName={SOFT_CANVAS_CLASS}
                >
                  <GalleryPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Tim Kerja Hub / Overview Page (Protected) */}
          <Route
            path="/tim-kerja/:id"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Tim Kerja Layanan">
                  <TimKerjaHubPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* 6 Dedicated Layanan Status dan Pemberhentian (SnP) */}
          <Route
            path="/layanan/cltn"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Cuti Diluar Tanggungan Negara" canvasClassName={SOFT_CANVAS_CLASS}>
                  <CltnPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/asn-aktif"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pengaktifan Kembali sebagai ASN" canvasClassName={SOFT_CANVAS_CLASS}>
                  <AsnAktifPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/cpns-pns"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pengangkatan CPNS menjadi PNS" canvasClassName={SOFT_CANVAS_CLASS}>
                  <CpnsPnsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/pertek-pensiun"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Penetapan Pertek Pensiun PNS" canvasClassName={SOFT_CANVAS_CLASS}>
                  <PertekPensiunPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/sk-pensiun"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Penetapan SK Pensiun Janda/Duda" canvasClassName={SOFT_CANVAS_CLASS}>
                  <SkPensiunPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/regis-pensiun"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pendaftaran Pensiunan Menikah Kembali" canvasClassName={SOFT_CANVAS_CLASS}>
                  <RegisPensiunPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* 5 Dedicated Services under Tim Kerja Pengangkatan dan Mutasi (PnM) */}
          <Route
            path="/layanan/kenaikan-pangkat"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Kenaikan Pangkat" canvasClassName={SOFT_CANVAS_CLASS}>
                  <KpPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/pencantuman-gelar"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pencantuman Gelar" canvasClassName={SOFT_CANVAS_CLASS}>
                  <PencantumanGelarPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/penetapan-nip"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Penetapan NIP CPNS / NI PPPK" canvasClassName={SOFT_CANVAS_CLASS}>
                  <TapnipPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/peninjauan-masa-kerja"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Peninjauan Masa Kerja" canvasClassName={SOFT_CANVAS_CLASS}>
                  <PmkPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/pindah-instansi"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pindah Instansi" canvasClassName={SOFT_CANVAS_CLASS}>
                  <PindahInstansiPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* 3 Dedicated Services under Tim Kerja Pengawasan dan Pengendalian (Wasdal) */}
          <Route
            path="/layanan/sistem-merit"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pengawasan Sistem Merit" canvasClassName={SOFT_CANVAS_CLASS}>
                  <MeritPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/indeks-nspk"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pengukuran Indeks NSPK" canvasClassName={SOFT_CANVAS_CLASS}>
                  <NspkPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/wasdal-netralitas"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pengawasan Penerapan Netralitas, Disiplin, Kode Etik dan Perilaku" canvasClassName={SOFT_CANVAS_CLASS}>
                  <WasdalNetralitasPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* 6 Dedicated Services under Tim Kerja Pembinaan Manajemen ASN (PMA) */}
          <Route
            path="/layanan/manajemen-talenta"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Talenta" canvasClassName={SOFT_CANVAS_CLASS}>
                  <ManajemenTalentaPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/pembinaan-kinerja"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pembinaan Kinerja dan Penghargaan" canvasClassName={SOFT_CANVAS_CLASS}>
                  <PembinaanKinerjaPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/pengembangan-kompetensi"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pengembangan Kompetensi" canvasClassName={SOFT_CANVAS_CLASS}>
                  <PengembanganKompetensiPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/disiplin-budaya-citra"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pembinaan Disiplin & Citra" canvasClassName={SOFT_CANVAS_CLASS}>
                  <DisiplinBudayaCitraPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/penilaian-kompetensi"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Penilaian Kompetensi" canvasClassName={SOFT_CANVAS_CLASS}>
                  <PenilaianKompetensiPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/penilaian-karier"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Penilaian Karier" canvasClassName={SOFT_CANVAS_CLASS}>
                  <PenilaianKarierPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Legacy Slugs & Old Admin Route Redirects to New Descriptive Routes */}
          <Route path="/layanan/kp" element={<Navigate to="/layanan/kenaikan-pangkat" replace />} />
          <Route path="/apps-kp" element={<Navigate to="/layanan/kenaikan-pangkat" replace />} />
          <Route path="/layanan/pg" element={<Navigate to="/layanan/pencantuman-gelar" replace />} />
          <Route path="/apps-pg" element={<Navigate to="/layanan/pencantuman-gelar" replace />} />
          <Route path="/layanan/tapnip" element={<Navigate to="/layanan/penetapan-nip" replace />} />
          <Route path="/apps-tapnip" element={<Navigate to="/layanan/penetapan-nip" replace />} />
          <Route path="/layanan/pmk" element={<Navigate to="/layanan/peninjauan-masa-kerja" replace />} />
          <Route path="/apps-pmk" element={<Navigate to="/layanan/peninjauan-masa-kerja" replace />} />
          <Route path="/layanan/pi" element={<Navigate to="/layanan/pindah-instansi" replace />} />
          <Route path="/apps-pi" element={<Navigate to="/layanan/pindah-instansi" replace />} />
          <Route path="/layanan/mutasi" element={<Navigate to="/layanan/pindah-instansi" replace />} />
          <Route path="/layanan/mutasi-instansi" element={<Navigate to="/layanan/pindah-instansi" replace />} />

          {/* Wasdal Slugs & Old Admin Route Redirects */}
          <Route path="/apps-merit" element={<Navigate to="/layanan/sistem-merit" replace />} />
          <Route path="/layanan/merit" element={<Navigate to="/layanan/sistem-merit" replace />} />
          <Route path="/apps-nspk" element={<Navigate to="/layanan/indeks-nspk" replace />} />
          <Route path="/layanan/nspk" element={<Navigate to="/layanan/indeks-nspk" replace />} />
          <Route path="/apps-wasdal" element={<Navigate to="/layanan/wasdal-netralitas" replace />} />
          <Route path="/layanan/wasdal" element={<Navigate to="/layanan/wasdal-netralitas" replace />} />
          <Route path="/layanan/netralitas-disiplin" element={<Navigate to="/layanan/wasdal-netralitas" replace />} />
          <Route path="/layanan/pengawasan-netralitas-disiplin" element={<Navigate to="/layanan/wasdal-netralitas" replace />} />
          <Route path="/layanan/pengawasan-netralitas" element={<Navigate to="/layanan/wasdal-netralitas" replace />} />
          <Route path="/layanan/wasdal-evaluasi" element={<Navigate to="/layanan/wasdal-netralitas" replace />} />
          <Route path="/layanan/audit-kepegawaian" element={<Navigate to="/layanan/wasdal-netralitas" replace />} />

          {/* PMA Slugs & Old Admin Route Redirects */}
          <Route path="/apps-mt" element={<Navigate to="/layanan/manajemen-talenta" replace />} />
          <Route path="/layanan/mt" element={<Navigate to="/layanan/manajemen-talenta" replace />} />
          <Route path="/apps-pembinaan-kinerja" element={<Navigate to="/layanan/pembinaan-kinerja" replace />} />
          <Route path="/layanan/kinerja" element={<Navigate to="/layanan/pembinaan-kinerja" replace />} />
          <Route path="/apps-pembinaan-kompetensi-karier" element={<Navigate to="/layanan/pengembangan-kompetensi" replace />} />
          <Route path="/layanan/pembinaan-kompetensi-karier" element={<Navigate to="/layanan/pengembangan-kompetensi" replace />} />
          <Route path="/apps-pembinaan-disiplin-budaya-citra" element={<Navigate to="/layanan/disiplin-budaya-citra" replace />} />
          <Route path="/layanan/pembinaan-disiplin-budaya-citra" element={<Navigate to="/layanan/disiplin-budaya-citra" replace />} />
          <Route path="/layanan/disiplin" element={<Navigate to="/layanan/disiplin-budaya-citra" replace />} />
          <Route path="/apps-kompetensi" element={<Navigate to="/layanan/penilaian-kompetensi" replace />} />
          <Route path="/layanan/kompetensi" element={<Navigate to="/layanan/penilaian-kompetensi" replace />} />
          <Route path="/apps-karier" element={<Navigate to="/layanan/penilaian-karier" replace />} />
          <Route path="/layanan/karier" element={<Navigate to="/layanan/penilaian-karier" replace />} />

          {/* 7 Dedicated Routes under Tim Kerja Sistem Informasi & Digitalisasi (SIDIGI) */}
          <Route
            path="/layanan/statistik-pegawai"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Statistik Data Kepegawaian" canvasClassName={SOFT_CANVAS_CLASS}>
                  <StatistikPegawaiPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/peremajaan-data"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Peremajaan Data ASN (PDM)" canvasClassName={SOFT_CANVAS_CLASS}>
                  <PeremajaanDataPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/disparitas-data"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Disparitas Data ASN" canvasClassName={SOFT_CANVAS_CLASS}>
                  <DisparitasDataPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/integrasi-siasn"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Integrasi SIASN & SIMPEG" canvasClassName={SOFT_CANVAS_CLASS}>
                  <IntegrasiSiasnPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/arsip-takah"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pengelolaan Arsip Takah" canvasClassName={SOFT_CANVAS_CLASS}>
                  <ArsipTakahPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/arsip-dms"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Digitalisasi Arsip (DMS)" canvasClassName={SOFT_CANVAS_CLASS}>
                  <ArsipDmsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/pnbp-cat"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Dokumen Seleksi PNBP CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <PnbpCatPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Portal Fasilitasi Seleksi CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatHubPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/rekap-data"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Rekap Data Sesi CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatRekapDataPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/rekap-data/:jenisToken"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Rekap Data Sesi CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatRekapDataPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/layanan/fasilitasi-cat/entry" element={<Navigate to="/layanan/fasilitasi-cat/rekap-data" replace />} />
          <Route
            path="/layanan/fasilitasi-cat/rekapitulasi"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Rekapitulasi Capaian CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatRekapitulasiPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/rekapitulasi/:jenisToken"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Rekapitulasi Capaian CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatRekapitulasiPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/laporan"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Laporan & Berita Acara CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatLaporanPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/laporan/:jenisToken"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Laporan & Berita Acara CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatLaporanPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/laporan/:jenisToken/:documentSlug"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Dokumen Builder Laporan CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatLaporanBuilderPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/laporan/:jenisToken/:documentSlug/:reportUid"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Dokumen Builder Laporan CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatLaporanBuilderPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/pengelola"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pengelola Layanan CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatPengelolaPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/pengelola/jadwal"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Jadwal CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatPengelolaJadwalPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/pengelola/tim"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Tim CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatPengelolaTimPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/pengelola/dokumen"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Dokumen CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatPengelolaDokumenPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/pengelola/dokumen/:docType"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Daftar Dokumen CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatPengelolaDokumenDetailPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/pengelola/dokumen/:docType/:docToken"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Builder & Pratinjau Dokumen CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatPengelolaDokumenBuilderPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/pengelola/manajemen-data"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Data Tugas CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatPengelolaDataPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/fasilitasi-cat/pengelola/master-data"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Master Data & Akses CAT" canvasClassName={SOFT_CANVAS_CLASS}>
                  <FasilitasiCatPengelolaMasterPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* SIDIGI Slugs & Old Admin Route Redirects */}
          <Route path="/apps-cat" element={<Navigate to="/layanan/fasilitasi-cat" replace />} />
          <Route path="/layanan/cat" element={<Navigate to="/layanan/fasilitasi-cat" replace />} />
          <Route path="/apps-cat-tilok/*" element={<Navigate to="/layanan/fasilitasi-cat" replace />} />
          <Route path="/apps-cat-detail/*" element={<Navigate to="/layanan/fasilitasi-cat" replace />} />
          <Route path="/apps-statistik" element={<Navigate to="/layanan/statistik-pegawai" replace />} />
          <Route path="/layanan/statistik" element={<Navigate to="/layanan/statistik-pegawai" replace />} />
          <Route path="/layanan/statistik-asn" element={<Navigate to="/layanan/statistik-pegawai" replace />} />
          <Route path="/apps-pdm" element={<Navigate to="/layanan/peremajaan-data" replace />} />
          <Route path="/layanan/pdm" element={<Navigate to="/layanan/peremajaan-data" replace />} />
          <Route path="/apps-dispa" element={<Navigate to="/layanan/disparitas-data" replace />} />
          <Route path="/layanan/dispa" element={<Navigate to="/layanan/disparitas-data" replace />} />
          <Route path="/layanan/disparitas" element={<Navigate to="/layanan/disparitas-data" replace />} />
          <Route path="/apps-integrasi" element={<Navigate to="/layanan/integrasi-siasn" replace />} />
          <Route path="/layanan/integrasi" element={<Navigate to="/layanan/integrasi-siasn" replace />} />
          <Route path="/apps-takah" element={<Navigate to="/layanan/arsip-takah" replace />} />
          <Route path="/layanan/takah" element={<Navigate to="/layanan/arsip-takah" replace />} />
          <Route path="/apps-dms" element={<Navigate to="/layanan/arsip-dms" replace />} />
          <Route path="/layanan/dms" element={<Navigate to="/layanan/arsip-dms" replace />} />
          <Route path="/apps-pnbp" element={<Navigate to="/layanan/pnbp-cat" replace />} />
          <Route path="/layanan/pnbp" element={<Navigate to="/layanan/pnbp-cat" replace />} />
          <Route path="/layanan/pnbp-dokumen" element={<Navigate to="/layanan/pnbp-cat" replace />} />
          <Route path="/layanan/dokumen-pnbp" element={<Navigate to="/layanan/pnbp-cat" replace />} />


          {/* 12 Dedicated Services under Tim Kerja Tata Usaha (TU) */}
          {/* Layanan 29: Pagu & Realisasi Anggaran (Hub + Master + Realisasi) */}
          <Route
            path="/layanan/anggaran"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Portal Pagu & Realisasi Anggaran DIPA" canvasClassName={SOFT_CANVAS_CLASS}>
                  <AnggaranHubPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/anggaran/master"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Master Data Anggaran DIPA" canvasClassName={SOFT_CANVAS_CLASS}>
                  <AnggaranMasterPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/anggaran/realisasi"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Realisasi Anggaran DIPA" canvasClassName={SOFT_CANVAS_CLASS}>
                  <AnggaranRealisasiPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/ikm"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Hasil Survey IKM" canvasClassName={SOFT_CANVAS_CLASS}>
                  <IkmPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/humas"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Kehumasan & Publikasi" canvasClassName={SOFT_CANVAS_CLASS}>
                  <HumasPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/surat"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pengelolaan Persuratan" canvasClassName={SOFT_CANVAS_CLASS}>
                  <SuratPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/konsultasi"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pelayanan Konsultasi" canvasClassName={SOFT_CANVAS_CLASS}>
                  <KonsultasiPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/ikpa"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Analisa Kinerja Pelaksanaan Anggaran (IKPA)" canvasClassName={SOFT_CANVAS_CLASS}>
                  <IkpaPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/statistik-internal"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Statistik Kepegawaian Internal" canvasClassName={SOFT_CANVAS_CLASS}>
                  <StatistikInternalHubPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/statistik-internal/data-pegawai"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Data Pegawai Internal" canvasClassName={SOFT_CANVAS_CLASS}>
                  <StatistikInternalPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/statistik-internal/peta-jabatan"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Peta Jabatan & Bezzeting" canvasClassName={SOFT_CANVAS_CLASS}>
                  <StatistikPetaJabatanPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/statistik-internal/master-data"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Master Data Kepegawaian" canvasClassName={SOFT_CANVAS_CLASS}>
                  <StatistikMasterDataPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/ekin"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen E-Kinerja" canvasClassName={SOFT_CANVAS_CLASS}>
                  <EkinPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/manage-assets"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Aset BMN" canvasClassName={SOFT_CANVAS_CLASS}>
                  <ManageAssetsPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/manage-ruangan"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Ruangan" canvasClassName={SOFT_CANVAS_CLASS}>
                  <ManageRuanganPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/manage-project"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Proyek" canvasClassName={SOFT_CANVAS_CLASS}>
                  <ManageProjectPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/lost-and-found"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Informasi Barang Hilang (Lost and Found)" canvasClassName={SOFT_CANVAS_CLASS}>
                  <LostAndFoundPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/layanan/ikk"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Capaian IKK" canvasClassName={SOFT_CANVAS_CLASS}>
                  <IkkPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Tata Usaha Legacy Route Redirects */}
          <Route path="/apps-anggaran" element={<Navigate to="/layanan/anggaran" replace />} />
          <Route path="/apps-ikm" element={<Navigate to="/layanan/ikm" replace />} />
          <Route path="/apps-humas" element={<Navigate to="/layanan/humas" replace />} />
          <Route path="/apps-surat" element={<Navigate to="/layanan/surat" replace />} />
          <Route path="/apps-naskah" element={<Navigate to="/layanan/surat" replace />} />
          <Route path="/apps-konsultasi" element={<Navigate to="/layanan/konsultasi" replace />} />
          <Route path="/apps-ikpa" element={<Navigate to="/layanan/ikpa" replace />} />
          <Route path="/apps-statistik-internal" element={<Navigate to="/layanan/statistik-internal" replace />} />
          <Route path="/apps-ekin" element={<Navigate to="/layanan/ekin" replace />} />
          <Route path="/apps-manage-assets" element={<Navigate to="/layanan/manage-assets" replace />} />
          <Route path="/layanan/aset" element={<Navigate to="/layanan/manage-assets" replace />} />
          <Route path="/apps-manage-ruangan" element={<Navigate to="/layanan/manage-ruangan" replace />} />
          <Route path="/layanan/ruangan" element={<Navigate to="/layanan/manage-ruangan" replace />} />
          <Route path="/apps-manage-project" element={<Navigate to="/layanan/manage-project" replace />} />
          <Route path="/layanan/proyek" element={<Navigate to="/layanan/manage-project" replace />} />
          <Route path="/apps-lost-and-found" element={<Navigate to="/layanan/lost-and-found" replace />} />
          <Route path="/apps-ikk" element={<Navigate to="/layanan/ikk" replace />} />

          {/* All 43 Services mapped dynamically via GenericServicePage (Protected) */}
          <Route
            path="/layanan/:serviceId"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Layanan Kepegawaian">
                  <GenericServicePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Legacy task & tim kerja aliases (Protected) */}
          <Route path="/explore-task" element={<Navigate to="/my-tasks" replace />} />
          <Route path="/resume-task" element={<Navigate to="/my-tasks" replace />} />
          <Route path="/history-task" element={<Navigate to="/my-tasks" replace />} />
          <Route path="/timkerja" element={<Navigate to="/tim-kerja/pnm" replace />} />

          {/* Settings & Referensi Routes (Protected) */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Pengaturan Sistem">
                  <PengaturanHubPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/referensi"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Referensi & Data Master">
                  <ReferensiPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/users"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Pengguna">
                  <SettingsUsersPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/roles"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Role & Menu RBAC">
                  <SettingsRolesPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/services"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Manajemen Layanan & Hak Akses">
                  <SettingsServicesPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/system"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Konfigurasi Sistem & SMTP">
                  <SettingsSystemPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/audit"
            element={
              <ProtectedRoute authenticated={isAuth}>
                <AdminLayout title="Audit Log & Aktivitas">
                  <SettingsAuditPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Legacy CI4 settings route aliases */}
          <Route path="/ref" element={<Navigate to="/settings/referensi" replace />} />
          <Route path="/manage-user" element={<Navigate to="/settings/users" replace />} />
          <Route path="/manage-role" element={<Navigate to="/settings/roles" replace />} />
          <Route path="/manage-layanan" element={<Navigate to="/settings/services" replace />} />
          <Route path="/manage-service" element={<Navigate to="/settings/services" replace />} />
          <Route path="/manage-setting" element={<Navigate to="/settings/system" replace />} />
          <Route path="/manage-smtp" element={<Navigate to="/settings/system" replace />} />
          <Route path="/manage-log" element={<Navigate to="/settings/audit" replace />} />

          {/* Catch-All Fallback */}
          <Route
            path="*"
            element={<Navigate to={isAuth ? '/dashboard' : '/login'} replace />}
          />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  )
}
