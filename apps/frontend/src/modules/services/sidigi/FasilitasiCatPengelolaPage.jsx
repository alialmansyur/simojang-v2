import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CatPengelolaGateGuard } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaGateGuard'
import { CatPengelolaHeader } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaHeader'
import { fetchCatPengelolaSummary } from '../../../services/api/sidigiCatServicesApi'

function PengelolaHubContent({ accessInfo }) {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchCatPengelolaSummary()
      setSummary(data)
    } catch {
      setSummary({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchCatPengelolaSummary()
      .then((data) => {
        if (active) setSummary(data)
      })
      .catch(() => {
        if (active) setSummary({})
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const portalCards = useMemo(() => {
    const s = summary || {}
    return [
      {
        id: 'jadwal',
        path: '/layanan/fasilitasi-cat/pengelola/jadwal',
        code: 'JADWAL',
        category: 'PERENCANAAN',
        title: 'Manajemen Jadwal',
        badgeText: `${Number(s.total_jadwal || 0)} Jadwal`,
        badgeClass:
          'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
        codeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
        actionText: 'Buka Manajemen Jadwal',
      },
      {
        id: 'tim',
        path: '/layanan/fasilitasi-cat/pengelola/tim',
        code: 'TIM CAT',
        category: 'PERSONEL & ST',
        title: 'Manajemen Tim',
        badgeText: `${Number(s.total_penugasan || 0)} Tugas`,
        badgeClass:
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        codeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        actionText: 'Buka Manajemen Tim',
      },
      {
        id: 'dokumen',
        path: '/layanan/fasilitasi-cat/pengelola/dokumen',
        code: 'PNBP CAT',
        category: '8 JENIS DOKUMEN',
        title: 'Manajemen Dokumen',
        badgeText: `${Number(s.total_dokumen || 0)} File`,
        badgeClass:
          'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
        codeClass: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300',
        actionText: 'Buka Manajemen Dokumen',
      },
      {
        id: 'manajemen-data',
        path: '/layanan/fasilitasi-cat/pengelola/manajemen-data',
        code: 'BEBAN KERJA',
        category: 'REKAP PENUGASAN',
        title: 'Manajemen Data',
        badgeText: `${Number(s.total_pegawai_tim || 0)} Pegawai`,
        badgeClass:
          'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        codeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        actionText: 'Buka Manajemen Data',
      },
      {
        id: 'master-data',
        path: '/layanan/fasilitasi-cat/pengelola/master-data',
        code: 'KONFIGURASI',
        category: 'EVENT, TILOK & AKSES',
        title: 'Master Data & Akses',
        badgeText: `${Number(s.total_tilok || 0)} Tilok`,
        badgeClass:
          'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
        codeClass: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
        actionText: 'Buka Master Data',
      },
    ]
  }, [summary])

  return (
    <div className="space-y-4 sm:space-y-5">
      <CatPengelolaHeader
        title="Hub Pengelola Layanan CAT"
        description="Pusat pengelolaan jadwal, tim pelaksana, dokumen pendukung, distribusi tugas, dan master data CAT."
        verifiedNip={accessInfo?.nip}
        backTo="/layanan/fasilitasi-cat"
        backLabel="Kembali"
        onReload={loadSummary}
        isReloading={loading}
      />

      {/* Grid 4 Kolom Compact dengan Aksi Arrow di Pojok Kanan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {portalCards.map((card) => (
          <div
            key={card.id}
            onClick={() => navigate(card.path)}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl transition-all duration-200 p-4 sm:p-4.5 min-h-40 flex flex-col justify-between shadow-xs hover:shadow-sm hover:border-[#175CD3]/30 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${card.codeClass}`}>
                  {card.code}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${card.badgeClass}`}>
                  {card.badgeText}
                </span>
              </div>

              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {card.category}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#175CD3] dark:group-hover:text-blue-400 transition-colors leading-snug mt-0.5">
                {card.title}
              </h3>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#175CD3] dark:group-hover:text-blue-400 transition-colors">
                {card.actionText}
              </span>
              <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 text-slate-400 group-hover:text-[#175CD3] dark:group-hover:text-blue-400 flex items-center justify-center transition-all group-hover:translate-x-1">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FasilitasiCatPengelolaPage() {
  return (
    <CatPengelolaGateGuard>
      {({ accessInfo }) => <PengelolaHubContent accessInfo={accessInfo} />}
    </CatPengelolaGateGuard>
  )
}
