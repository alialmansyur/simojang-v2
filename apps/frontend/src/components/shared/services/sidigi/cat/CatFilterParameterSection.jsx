import { useState } from 'react'
import { Plus, Search, Loader2, RotateCcw } from 'lucide-react'
import {
  saveCatKegiatanSeleksi,
  saveCatTilok,
  saveCatTilokInstansi,
} from '../../../../../services/api/sidigiCatServicesApi'
import { SearchableSelect } from '../../../SearchableSelect'
import { CatInstansiMultiSelect } from './CatInstansiMultiSelect'
import { CatQuickAddEventModal } from './CatQuickAddEventModal'
import { CatQuickAddTilokModal } from './CatQuickAddTilokModal'
import { CatQuickAddInstansiModal } from './CatQuickAddInstansiModal'

/**
 * Komponen Level 2 bersama (Single Source of Truth) untuk panel Filter Parameter Pelaksanaan CAT,
 * diadopsi dari /rekap-data agar seluruh halaman (/rekap-data, /rekapitulasi, /laporan)
 * memiliki fitur lengkap tambah Kegiatan, Tilok, dan Instansi secara seragam.
 */
export function CatFilterParameterSection({
  activeJenisTes,
  seleksiOptions = [],
  tilokOptions = [],
  instansiList = [],
  isSeleksiLoading = false,
  isTilokLoading = false,
  isInstansiLoading = false,
  filterSeleksiId = '',
  filterTilokUid = '',
  filterInstansiIds = [],
  onKegiatanChange,
  onTilokChange,
  onInstansiChange,
  currentSelectedTilok = null,
  onReloadKegiatan,
  onReloadTilok,
  onReloadInstansi,
  onSubmit,
  onResetFilter,
  isSubmitting = false,
  submitLabel = 'Cari Data',
  submitTitle = 'Cari Data',
  // Opsional: Rentang Tanggal di dalam form (digunakan pada halaman Rekapitulasi)
  showDateRange = false,
  filterTglMulai = '',
  filterTglSelesai = '',
  onTglMulaiChange,
  onTglSelesaiChange,
  onClearDateRange,
  // Opsional: Tombol aksi tambahan sebelum tombol submit (mis. "Buat Laporan CAT")
  extraActionButton = null,
  // Opsional: Kontrol eksternal untuk membuka modal Daftarkan Instansi (mis. dari Form Tambah Sesi)
  externalAddInstansiOpen = false,
  onCloseExternalAddInstansi,
}) {
  const currentYear = new Date().getFullYear().toString()
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [isAddTilokModalOpen, setIsAddTilokModalOpen] = useState(false)
  const [isAddInstansiModalOpen, setIsAddInstansiModalOpen] = useState(false)

  const hasAnyFilter = Boolean(
    filterSeleksiId ||
      filterTilokUid ||
      (filterInstansiIds && filterInstansiIds.length > 0) ||
      (showDateRange && (filterTglMulai || filterTglSelesai))
  )

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="no-print bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-5 sm:p-6 space-y-4"
      >
        {/* Top Quick Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Filter Parameter Pelaksanaan
          </h2>

          {/* Quick-Add Buttons (+ Kegiatan Baru, + Tilok Baru, + Daftarkan Instansi) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddEventModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#175CD3]" />
              <span>Kegiatan Baru</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddTilokModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#175CD3]" />
              <span>Tilok Baru</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddInstansiModalOpen(true)}
              disabled={!filterTilokUid}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#175CD3]" />
              <span>Daftarkan Instansi</span>
            </button>
          </div>
        </div>

        {/* 3 Cascading Selects: Kegiatan -> Titik Lokasi -> Instansi (Multi-Select) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* STEP 1: Kegiatan Seleksi (Wajib) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Kegiatan Seleksi <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              options={seleksiOptions}
              value={filterSeleksiId}
              onChange={onKegiatanChange}
              placeholder="-- Pilih Kegiatan (Wajib) --"
              isLoading={isSeleksiLoading}
              noOptionsText="Tidak ada kegiatan untuk jenis tes ini"
              isClearable={false}
            />
          </div>

          {/* STEP 2: Titik Lokasi (Tilok) - Wajib */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Titik Lokasi (Tilok) <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              options={tilokOptions}
              value={filterTilokUid}
              onChange={onTilokChange}
              placeholder={!filterSeleksiId ? '-- Pilih Kegiatan Terlebih Dahulu --' : '-- Pilih Titik Lokasi (Wajib) --'}
              isDisabled={!filterSeleksiId || isTilokLoading}
              isLoading={isTilokLoading}
              noOptionsText="Tidak ada tilok untuk kegiatan ini"
              isClearable={false}
            />
          </div>

          {/* STEP 3: Instansi Peserta (Multi-Select) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Instansi Peserta <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <CatInstansiMultiSelect
              instansiList={instansiList}
              selectedIds={filterInstansiIds}
              onChange={onInstansiChange}
              disabled={!filterTilokUid || isInstansiLoading}
              isLoading={isInstansiLoading}
              placeholder={!filterTilokUid ? '-- Pilih Tilok Terlebih Dahulu --' : '-- Pilih Instansi Peserta --'}
            />
          </div>
        </div>

        {/* Bottom Row / Optional Date Range Sub-Toolbar + Action Buttons */}
        <div
          className={`flex flex-col ${
            showDateRange ? 'md:flex-row md:items-center justify-between pt-2 border-t' : 'sm:flex-row sm:items-center justify-end pt-1.5'
          } gap-3 border-slate-100 dark:border-slate-800/60`}
        >
          {showDateRange && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Rentang Tanggal:</span>
              <input
                type="date"
                value={filterTglMulai}
                onChange={(e) => onTglMulaiChange && onTglMulaiChange(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                title="Tanggal Mulai Pelaksanaan"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={filterTglSelesai}
                onChange={(e) => onTglSelesaiChange && onTglSelesaiChange(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                title="Tanggal Selesai Pelaksanaan"
              />
              {(filterTglMulai || filterTglSelesai) && onClearDateRange && (
                <button
                  type="button"
                  onClick={onClearDateRange}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Bersihkan filter tanggal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {hasAnyFilter && (
              <button
                type="button"
                onClick={onResetFilter}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}

            {extraActionButton}

            <button
              type="submit"
              disabled={!filterSeleksiId || !filterTilokUid || isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title={submitTitle}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{submitLabel}</span>
            </button>
          </div>
        </div>
      </form>

      {/* QUICK ADD KEGIATAN SELEKSI MODAL */}
      <CatQuickAddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onSuccess={() => {
          if (onReloadKegiatan) onReloadKegiatan()
        }}
        jenisTesId={activeJenisTes ? activeJenisTes.jenis_tes_id || activeJenisTes.id : ''}
        periodeTahun={activeJenisTes ? activeJenisTes.periode : currentYear}
        onSubmitFn={saveCatKegiatanSeleksi}
      />

      {/* QUICK ADD TILOK MODAL */}
      <CatQuickAddTilokModal
        isOpen={isAddTilokModalOpen}
        onClose={() => setIsAddTilokModalOpen(false)}
        onSuccess={() => {
          if (onReloadTilok) onReloadTilok()
        }}
        jenisPeriodeId={activeJenisTes ? activeJenisTes.id : ''}
        jenisTesId={activeJenisTes ? activeJenisTes.jenis_tes_id || activeJenisTes.id : ''}
        seleksiId={filterSeleksiId}
        periodeTahun={activeJenisTes ? activeJenisTes.periode : currentYear}
        onSubmitFn={saveCatTilok}
      />

      {/* QUICK ADD INSTANSI MODAL */}
      <CatQuickAddInstansiModal
        isOpen={isAddInstansiModalOpen || externalAddInstansiOpen}
        onClose={() => {
          setIsAddInstansiModalOpen(false)
          if (onCloseExternalAddInstansi) onCloseExternalAddInstansi()
        }}
        onSuccess={() => {
          if (onReloadInstansi) onReloadInstansi()
        }}
        tilokId={currentSelectedTilok ? currentSelectedTilok.id : filterTilokUid}
        tilokNama={currentSelectedTilok ? currentSelectedTilok.nama_tilok : ''}
        onSubmitFn={saveCatTilokInstansi}
      />
    </>
  )
}
