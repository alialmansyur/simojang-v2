import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Database,
  Search,
  ArrowRight,
  Layers,
  Users,
  Building2,
  Target,
  Package,
  X,
} from 'lucide-react'
import { fetchRefTables } from '../../services/api/refApi'
import { ServiceHeader } from '../../components/shared/services/ServiceHeader'
import { ReferensiCrudModal } from './components/ReferensiCrudModal'

const CATEGORY_META = {
  all: { label: 'Semua Kategori', badge: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300', icon: Database },
  support: { label: 'Layanan & Support', badge: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300', icon: Layers },
  kepegawaian: { label: 'Kepegawaian ASN', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', icon: Users },
  kelembagaan: { label: 'Instansi & Kelembagaan', badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300', icon: Building2 },
  perencanaan: { label: 'Perencanaan & IKK', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', icon: Target },
  operasional: { label: 'Operasional & Aset', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', icon: Package },
}

export default function ReferensiPage() {
  const [tables, setTables] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedTable, setSelectedTable] = useState(null)

  const loadTables = useCallback(async (manual = false) => {
    try {
      if (manual) setIsReloading(true)
      else setIsLoading(true)
      setErrorMsg('')
      const rows = await fetchRefTables()
      setTables(Array.isArray(rows) ? rows : [])
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat daftar tabel referensi.')
    } finally {
      setIsLoading(false)
      setIsReloading(false)
    }
  }, [])

  useEffect(() => {
    loadTables(false)
  }, [loadTables])

  const categoryCounts = useMemo(() => {
    const counts = { all: tables.length }
    tables.forEach((t) => {
      const cat = t.category || 'support'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [tables])

  const availableCategories = useMemo(() => {
    return Object.keys(CATEGORY_META).filter((key) => key === 'all' || (categoryCounts[key] || 0) > 0)
  }, [categoryCounts])

  const filteredTables = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return tables.filter((item) => {
      const matchCat = activeCategory === 'all' || (item.category || 'support') === activeCategory
      const matchQuery =
        !q ||
        String(item.label || '').toLowerCase().includes(q) ||
        String(item.slug || '').toLowerCase().includes(q) ||
        String(item.table || '').toLowerCase().includes(q) ||
        String(item.description || '').toLowerCase().includes(q)
      return matchCat && matchQuery
    })
  }, [tables, activeCategory, searchTerm])

  return (
    <div className="space-y-6 pb-8">
      <ServiceHeader
        serviceTitle="Master Referensi Data"
        description="Katalog terpadu seluruh tabel referensi layanan, atribut kepegawaian, instansi, dan IKK dalam satu halaman dengan pengelolaan CRUD modal."
        timKerjaTitle="Pengaturan & Referensi"
        badgeColor="emerald"
        onReloadClick={() => loadTables(true)}
        isReloading={isReloading}
        borderless
      />

      {/* Search & Category Nav Pills Card (Mengikuti pola CatJenisTesSelectorSection & ServiceFilterToolbar) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari jenis referensi (contoh: jenis_tes, instansi, pangkat, agama...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan{' '}
            <span className="font-bold text-slate-800 dark:text-slate-100">{filteredTables.length}</span> dari{' '}
            <span className="font-bold text-slate-800 dark:text-slate-100">{tables.length}</span> tabel referensi
          </div>
        </div>

        {/* Category Nav Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 overflow-x-auto clean-scrollbar w-full sm:w-fit">
          {availableCategories.map((catKey) => {
            const meta = CATEGORY_META[catKey]
            const isActive = activeCategory === catKey
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setActiveCategory(catKey)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{meta.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    isActive
                      ? 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/50 dark:text-blue-300'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {categoryCounts[catKey] || 0}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 rounded-2xl p-4 text-xs sm:text-sm text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Grid Card List Referensi (Mengikuti pola 4 kolom CatJenisTesSelectorSection.jsx) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white dark:bg-slate-900 shadow-xs animate-pulse" />
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs">
          <Database className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Tidak ada tabel referensi yang cocok dengan pencarian
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Ubah kata kunci pencarian atau pilih kategori lain di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredTables.map((item) => {
            const catMeta = CATEGORY_META[item.category] || CATEGORY_META.support
            const CatIcon = catMeta.icon
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => setSelectedTable(item)}
                className="group text-left bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 border border-transparent hover:border-[#175CD3]/30"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${catMeta.badge}`}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {new Intl.NumberFormat('id-ID').format(Number(item.row_count || 0))} data
                    </span>
                  </div>

                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 truncate">
                    {item.table}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#175CD3] transition-colors leading-snug mt-0.5">
                    {item.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">
                    {item.column_count || 0} kolom
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#175CD3] dark:text-blue-400">
                    <span>Kelola Data</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Single-Page Modal CRUD */}
      <ReferensiCrudModal
        isOpen={Boolean(selectedTable)}
        tableMeta={selectedTable}
        onClose={() => setSelectedTable(null)}
        onDataMutated={() => loadTables(true)}
      />
    </div>
  )
}
