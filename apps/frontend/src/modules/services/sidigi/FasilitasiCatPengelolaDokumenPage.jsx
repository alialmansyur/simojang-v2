import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { ServiceFilterToolbar } from '../../../components/shared/services/ServiceFilterToolbar'
import { CatPengelolaGateGuard } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaGateGuard'
import { CatPengelolaHeader } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaHeader'
import {
  CAT_DOC_DETAILS,
  DOC_CATEGORY_META,
} from '../../../components/shared/services/sidigi/cat/pengelola/pengelolaConstants'
import { fetchCatPengelolaDocTypes } from '../../../services/api/sidigiCatServicesApi'
import { buildCatPengelolaDocListUrl } from '../../../utils/catRouteToken'

function DokumenCatalogContent() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const jadwalIdParam = searchParams.get('jadwal_id') || ''

  const [docTypes, setDocTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const fetchCatalog = useCallback(async () => {
    const res = await fetchCatPengelolaDocTypes(
      jadwalIdParam ? { jadwal_id: jadwalIdParam } : {}
    )
    setDocTypes(Array.isArray(res?.types) ? res.types : [])
  }, [jadwalIdParam])

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      await fetchCatalog()
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memuat katalog dokumen PNBP CAT.')
    } finally {
      setLoading(false)
    }
  }, [fetchCatalog])

  useEffect(() => {
    let active = true
    fetchCatPengelolaDocTypes(jadwalIdParam ? { jadwal_id: jadwalIdParam } : {})
      .then((res) => {
        if (!active) return
        setErrorMsg('')
        setDocTypes(Array.isArray(res?.types) ? res.types : [])
      })
      .catch((err) => {
        if (active) setErrorMsg(err?.message || 'Gagal memuat katalog dokumen PNBP CAT.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [jadwalIdParam])

  const openDocumentPage = (code) => {
    navigate(buildCatPengelolaDocListUrl(code, jadwalIdParam))
  }

  const enrichedTypes = useMemo(() => {
    return docTypes.map((dt, index) => {
      const fallback = CAT_DOC_DETAILS[dt.code] || {}
      return {
        ...dt,
        detail: {
          ...fallback,
          ...(dt.detail || {}),
          categoryKey: fallback.categoryKey || dt.detail?.categoryKey || 'personel',
          number: dt.detail?.number || fallback.number || index + 1,
          short: dt.detail?.short || fallback.short || String(dt.code || '').toUpperCase(),
          category: dt.detail?.category || fallback.category || 'DOKUMEN CAT',
          description:
            dt.detail?.description ||
            fallback.description ||
            dt.description ||
            'Setup parameter & builder dokumen fasilitasi CAT.',
        },
      }
    })
  }, [docTypes])

  const categoryCounts = useMemo(() => {
    const counts = { all: enrichedTypes.length }
    for (const c of DOC_CATEGORY_META) {
      if (c.key !== 'all') counts[c.key] = 0
    }
    for (const item of enrichedTypes) {
      const k = item.detail.categoryKey
      if (counts[k] !== undefined) counts[k] += 1
    }
    return counts
  }, [enrichedTypes])

  const filteredTypes = useMemo(() => {
    let list = enrichedTypes
    if (activeCategory !== 'all') {
      list = list.filter((item) => item.detail.categoryKey === activeCategory)
    }
    const q = searchTerm.trim().toLowerCase()
    if (q) {
      list = list.filter((item) =>
        [item.name, item.code, item.detail.short, item.detail.category, item.detail.description]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q))
      )
    }
    return list
  }, [enrichedTypes, activeCategory, searchTerm])

  const filterCategories = useMemo(
    () => DOC_CATEGORY_META.map((c) => ({ value: c.key, label: c.label })),
    []
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <CatPengelolaHeader
        title="Manajemen Dokumen Pendukung CAT"
        description="Pilih salah satu dari 8 jenis dokumen resmi PNBP CAT untuk mencatat data baru (Builder atau Upload Arsip Lama), mengelola tim, dan mencetak PDF."
        onReload={loadCatalog}
        isReloading={loading}
      />

      {jadwalIdParam && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/40 text-xs text-sky-800 dark:text-sky-300">
          <span>
            Konteks Jadwal Aktif: <strong>Jadwal #{jadwalIdParam}</strong>
          </span>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="font-bold underline cursor-pointer"
          >
            Hapus Konteks Jadwal
          </button>
        </div>
      )}

      <ServiceFilterToolbar
        showMonthFilter={false}
        showAllCategory={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={filterCategories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        totalRecords={filteredTypes.length}
        categoryCounts={categoryCounts}
        placeholder="Cari nama dokumen, kode (SP, ST, NOM...), atau kategori..."
      />

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium">
          {errorMsg}
        </div>
      )}

      {/* 4-Col Compact Grid Cards dengan Aksi Arrow di Pojok Kanan */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div
              key={idx}
              className="min-h-44 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTypes.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-center text-xs sm:text-sm text-slate-500">
          Tidak ada jenis dokumen yang cocok dengan pencarian Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredTypes.map((docType, index) => {
            const detail = docType.detail || {}
            const stats = docType.stats || {}
            const totalCreated = Number(stats.total || 0)

            return (
              <div
                key={docType.code}
                onClick={() => openDocumentPage(docType.code)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl transition-all duration-200 p-4 sm:p-4.5 min-h-44 flex flex-col justify-between shadow-xs hover:shadow-sm hover:border-[#175CD3]/40 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300">
                      {detail.short || docType.code.toUpperCase()} #{detail.number || index + 1}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{totalCreated} Dok</span>
                    </span>
                  </div>

                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    {detail.category || 'DOKUMEN CAT'}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#175CD3] dark:group-hover:text-blue-400 transition-colors leading-snug mt-0.5">
                    {docType.name || detail.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {detail.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-[#175CD3] dark:group-hover:text-blue-400 transition-colors">
                    Kelola Data &amp; Builder
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 text-slate-400 group-hover:text-[#175CD3] dark:group-hover:text-blue-400 flex items-center justify-center transition-all group-hover:translate-x-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function FasilitasiCatPengelolaDokumenPage() {
  return (
    <CatPengelolaGateGuard>
      <DokumenCatalogContent />
    </CatPengelolaGateGuard>
  )
}
