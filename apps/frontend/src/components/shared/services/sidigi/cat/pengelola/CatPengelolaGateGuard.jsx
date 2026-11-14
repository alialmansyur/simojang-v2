import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react'
import { fetchCatPengelolaAccess } from '../../../../../../services/api/sidigiCatServicesApi'

export function CatPengelolaGateGuard({ children }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [accessInfo, setAccessInfo] = useState({
    authorized: false,
    nip: '',
    whitelist: [],
  })
  const [errorMsg, setErrorMsg] = useState('')

  const verifyAccess = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      const res = await fetchCatPengelolaAccess()
      setAccessInfo({
        authorized: Boolean(res?.authorized),
        nip: String(res?.nip || ''),
        whitelist: Array.isArray(res?.whitelist) ? res.whitelist : [],
      })
    } catch (err) {
      setAccessInfo({ authorized: false, nip: '', whitelist: [] })
      setErrorMsg(err?.message || 'Gagal memverifikasi hak akses Pengelola CAT.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    verifyAccess()
  }, [verifyAccess])

  if (!loading && !accessInfo.authorized) {
    return (
      <div className="max-w-xl mx-auto mt-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-7 text-center shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          {errorMsg ? <ShieldAlert className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Akses Terbatas Pengelola CAT
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {errorMsg ||
            'Modul Manajemen Jadwal, Tim, Dokumen, dan Master CAT hanya dapat diakses oleh pegawai dengan NIP terdaftar sebagai Pengelola Layanan CAT.'}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>NIP Aktif Anda:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {accessInfo.nip || 'Tidak terdeteksi'}
          </span>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/layanan/fasilitasi-cat')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Layanan CAT</span>
          </button>
        </div>
      </div>
    )
  }

  return typeof children === 'function'
    ? children({ accessInfo, refreshAccess: verifyAccess })
    : children
}
