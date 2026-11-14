import { useLocation, Navigate, Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function GenericServicePage({ serviceId }) {
  const location = useLocation()
  const serviceKey = (serviceId || location.pathname.split('/').pop() || '').toLowerCase()

  if (
    serviceKey === 'kp' ||
    serviceKey === 'kenaikan-pangkat' ||
    serviceKey === '6' ||
    serviceKey === 'kp-reguler' ||
    serviceKey === 'kp-struktural'
  ) {
    return <Navigate to="/layanan/kenaikan-pangkat" replace />
  }
  if (serviceKey === 'pg' || serviceKey === 'pencantuman-gelar' || serviceKey === '4') {
    return <Navigate to="/layanan/pencantuman-gelar" replace />
  }
  if (serviceKey === 'tapnip' || serviceKey === 'penetapan-nip' || serviceKey === '2') {
    return <Navigate to="/layanan/penetapan-nip" replace />
  }
  if (serviceKey === 'pmk' || serviceKey === 'peninjauan-masa-kerja' || serviceKey === '5') {
    return <Navigate to="/layanan/peninjauan-masa-kerja" replace />
  }
  if (
    serviceKey === 'pi' ||
    serviceKey === 'pindah-instansi' ||
    serviceKey === 'mutasi' ||
    serviceKey === 'mutasi-instansi' ||
    serviceKey === '3'
  ) {
    return <Navigate to="/layanan/pindah-instansi" replace />
  }
  if (serviceKey === 'sistem-merit' || serviceKey === 'merit') {
    return <Navigate to="/layanan/sistem-merit" replace />
  }
  if (serviceKey === 'indeks-nspk' || serviceKey === 'nspk') {
    return <Navigate to="/layanan/indeks-nspk" replace />
  }
  if (
    serviceKey === 'wasdal-netralitas' ||
    serviceKey === 'wasdal' ||
    serviceKey === 'wasdal-evaluasi' ||
    serviceKey === 'audit-kepegawaian'
  ) {
    return <Navigate to="/layanan/wasdal-netralitas" replace />
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Layanan Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Halaman layanan <span className="font-mono font-semibold">{location.pathname}</span> tidak terdaftar atau belum diaktifkan.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
