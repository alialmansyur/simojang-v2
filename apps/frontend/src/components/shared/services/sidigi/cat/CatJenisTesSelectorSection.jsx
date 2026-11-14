import { useState, useMemo } from 'react'
import { Monitor, Search, Plus } from 'lucide-react'
import { createCatJenisPeriode } from '../../../../../services/api/sidigiCatServicesApi'
import { CatJenisTesModal } from './CatJenisTesModal'

/**
 * Komponen Level 1 terpadu (Single Source of Truth) untuk pemilihan dan pengelolaan
 * Jenis Tes CAT per tahun di modul Rekap Data, Rekapitulasi, dan Laporan.
 */
export function CatJenisTesSelectorSection({
  jenisPeriodeList = [],
  isLoading = false,
  selectedYear,
  onYearChange,
  onSelectJenisTes,
  onReloadList,
}) {
  const currentYear = new Date().getFullYear().toString()
  const [jenisSearch, setJenisSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(Number(num || 0))

  const yearOptions = useMemo(() => {
    const years = new Set([currentYear, '2026', '2025', '2024'])
    jenisPeriodeList.forEach((j) => {
      if (j.periode) years.add(String(j.periode))
    })
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [jenisPeriodeList, currentYear])

  const filteredJenisPeriode = useMemo(() => {
    const q = jenisSearch.trim().toLowerCase()
    return jenisPeriodeList.filter((item) => {
      const matchYear = !selectedYear || String(item.periode) === String(selectedYear)
      const matchSearch =
        !q ||
        (item.display_nama || item.jenis_tes_nama || '').toLowerCase().includes(q) ||
        (item.jenis_tes_kode || '').toLowerCase().includes(q)
      return matchYear && matchSearch
    })
  }, [jenisPeriodeList, selectedYear, jenisSearch])

  const handleSubmitJenisTes = async (payload) => {
    const res = await createCatJenisPeriode(payload)
    if (payload?.periode && onYearChange && selectedYear && String(payload.periode) !== String(selectedYear)) {
      onYearChange(String(payload.periode))
    }
    return res
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari jenis tes besar (Ujian Dinas, Profiling, CASN...)"
            value={jenisSearch}
            onChange={(e) => setJenisSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedYear}
            onChange={(e) => onYearChange && onYearChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
          >
            <option value="">Semua Tahun</option>
            {yearOptions.map((yr) => (
              <option key={yr} value={yr}>
                Tahun {yr}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jenis Tes CAT</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white dark:bg-slate-900 shadow-xs animate-pulse" />
          ))}
        </div>
      ) : filteredJenisPeriode.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs">
          <Monitor className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Belum ada Jenis Tes CAT terdaftar pada tahun {selectedYear || 'terpilih'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Klik tombol "Tambah Jenis Tes CAT" di atas untuk mendaftarkan jenis tes pada tahun ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredJenisPeriode.map((item) => {
            const totalTilok = Number(item.total_tilok || 0)
            const totalPeserta = Number(item.total_peserta || 0)
            const isOngoing = Number(item.is_ongoing || 0) === 1

            return (
              <div
                key={item.id}
                onClick={() => onSelectJenisTes && onSelectJenisTes(item)}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-4.5 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300">
                      {item.periode}
                    </span>
                    {isOngoing ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Selesai
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    {item.jenis_tes_kode || 'CAT-BKN'}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#175CD3] transition-colors leading-snug mt-0.5">
                    {item.display_nama || item.jenis_tes_nama}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{totalTilok}</span> Tilok
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {formatNumber(totalPeserta)}
                    </span>{' '}
                    Peserta
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CatJenisTesModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => onReloadList && onReloadList()}
        defaultYear={selectedYear || currentYear}
        onSubmitFn={handleSubmitJenisTes}
      />
    </div>
  )
}
