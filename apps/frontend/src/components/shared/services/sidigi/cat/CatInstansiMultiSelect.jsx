import { useState, useRef, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'

/**
 * CatInstansiMultiSelect
 * Dropdown checklist multi-select instansi berstandar SSOT Simojang.
 * Mendukung "Pilih Semua", filter pencarian instansi, dan badge pilihan.
 */
export function CatInstansiMultiSelect({
  instansiList = [],
  selectedIds = [],
  onChange,
  disabled = false,
  isLoading = false,
  placeholder = '-- Pilih Instansi Peserta --',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Normalisasi list instansi
  const normalizedList = useMemo(() => {
    return instansiList.map((item) => {
      const id = String(item.id || item.instansi_id || item.kodeins || '')
      const nama = item.instansi_nama || item.nama || item.instansi_name || item.name || `Instansi ${id}`
      const kode = item.kodeins || item.instansi_id || ''
      return { id, nama, kode }
    })
  }, [instansiList])

  // Filter pencarian
  const filteredList = useMemo(() => {
    if (!search.trim()) return normalizedList
    const query = search.toLowerCase()
    return normalizedList.filter(
      (item) => item.nama.toLowerCase().includes(query) || item.kode.toLowerCase().includes(query)
    )
  }, [normalizedList, search])

  const isAllSelected =
    normalizedList.length > 0 && selectedIds.length === normalizedList.length

  const handleToggleAll = () => {
    if (isAllSelected) {
      onChange([])
    } else {
      onChange(normalizedList.map((item) => item.id))
    }
  }

  const handleToggleItem = (id) => {
    const exists = selectedIds.includes(id)
    if (exists) {
      onChange(selectedIds.filter((item) => item !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  // Label ringkas untuk trigger button
  const triggerLabel = useMemo(() => {
    if (isLoading) return 'Memuat instansi...'
    if (normalizedList.length === 0) return 'Belum ada instansi di tilok ini'
    if (selectedIds.length === 0) return placeholder
    if (isAllSelected) return `Semua Instansi Terpilih (${normalizedList.length})`
    if (selectedIds.length === 1) {
      const found = normalizedList.find((i) => i.id === selectedIds[0])
      return found ? found.nama : '1 Instansi Dipilih'
    }
    return `${selectedIds.length} Instansi Dipilih`
  }, [isLoading, normalizedList, selectedIds, isAllSelected, placeholder])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || isLoading || normalizedList.length === 0}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer ${
          disabled || normalizedList.length === 0
            ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-slate-900 border-[#175CD3] ring-3 ring-[#175CD3]/15 text-slate-800 dark:text-slate-100'
            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-800 dark:text-slate-100'
        }`}
      >
        <span className="truncate">{triggerLabel}</span>
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedIds.length > 0 && !disabled && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400">
              {selectedIds.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180 text-[#175CD3]' : ''}`} />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Header: Search & Toggle All */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari instansi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-[#175CD3]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <button
                type="button"
                onClick={handleToggleAll}
                className="font-bold text-[#175CD3] dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isAllSelected ? 'Batalkan Semua' : 'Pilih Semua Instansi'}
              </button>
              <span className="text-slate-400 font-medium">
                {selectedIds.length} dari {normalizedList.length} dipilih
              </span>
            </div>
          </div>

          {/* List Checkbox Items */}
          <div className="max-h-56 overflow-y-auto clean-scrollbar p-1.5 space-y-0.5">
            {filteredList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Tidak ada instansi yang cocok
              </div>
            ) : (
              filteredList.map((item) => {
                const checked = selectedIds.includes(item.id)
                return (
                  <label
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                      checked
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-300 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? 'bg-[#175CD3] border-[#175CD3] text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="leading-snug truncate">{item.nama}</p>
                      {item.kode && (
                        <p className="text-[10px] text-slate-400 font-normal">
                          Kode: {item.kode}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      title="Pilih hanya instansi ini"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        onChange([item.id])
                        setIsOpen(false)
                      }}
                      className="text-[10px] font-semibold text-[#175CD3] dark:text-blue-400 hover:underline px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 shrink-0"
                    >
                      Hanya Ini
                    </button>
                  </label>
                )
              })
            )}
          </div>

          {/* Footer Popover */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-[#175CD3] text-white text-xs font-semibold hover:bg-[#1550B8] transition-colors cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
