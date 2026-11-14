import { useState, useRef, useEffect } from 'react'
import { Search, Calendar, ChevronDown, Check, X } from 'lucide-react'

const MONTH_OPTIONS = [
  { val: '01', text: 'Januari' },
  { val: '02', text: 'Februari' },
  { val: '03', text: 'Maret' },
  { val: '04', text: 'April' },
  { val: '05', text: 'Mei' },
  { val: '06', text: 'Juni' },
  { val: '07', text: 'Juli' },
  { val: '08', text: 'Agustus' },
  { val: '09', text: 'September' },
  { val: '10', text: 'Oktober' },
  { val: '11', text: 'November' },
  { val: '12', text: 'Desember' },
]

export function ServiceFilterToolbar({
  searchTerm = '',
  onSearchChange,
  selectedMonths = [],
  onMonthChange,
  categories = [],
  activeCategory = '',
  onCategoryChange,
  totalRecords = 0,
  totalAllRecords,
  totalLabel = 'Total Berkas',
  categoryCounts = {},
  placeholder,
  extraControls = null,
  secondaryFilters = null,
  showMonthFilter = true,
  showAllCategory = true,
  borderless = false,
}) {
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Local debounced search state
  const [localSearch, setLocalSearch] = useState(searchTerm)
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm)

  // Sync from prop if changed externally (e.g., reset filter)
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm)
    setLocalSearch(searchTerm)
  }

  // Debounce propagation to parent
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchTerm && onSearchChange) {
        onSearchChange(localSearch)
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [localSearch, searchTerm, onSearchChange])

  // Close month dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsMonthDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMonthToggle = (val) => {
    if (selectedMonths.includes(val)) {
      onMonthChange(selectedMonths.filter((m) => m !== val))
    } else {
      if (selectedMonths.length >= 2) {
        // limit to 2 months per backend requirement
        onMonthChange([selectedMonths[1], val])
      } else {
        onMonthChange([...selectedMonths, val])
      }
    }
  }

  const getMonthButtonLabel = () => {
    if (!selectedMonths || selectedMonths.length === 0) {
      return 'Semua Periode (0)'
    }
    const names = MONTH_OPTIONS.filter((m) => selectedMonths.includes(m.val)).map(
      (m) => m.text.substring(0, 3)
    )
    return `${names.join(', ')} (${selectedMonths.length})`
  }

  const hasCategories = Array.isArray(categories) && categories.length > 0

  return (
    <div
      className={`flex flex-col gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl ${
        borderless
          ? 'shadow-xs'
          : 'border border-slate-200/60 dark:border-slate-800/50 shadow-2xs'
      }`}
    >
      {/* Tier 1: Search Input & Multi-Month Dropdown Filter (Never Overlapped) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
          {/* Search Bar with Fixed Resilient Width */}
          <div className="relative w-full sm:w-72 md:w-80 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={placeholder || 'Cari nama file, NIP, pengunggah...'}
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3] transition-all"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('')
                  if (onSearchChange) onSearchChange('')
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Month Dropdown Button */}
          {showMonthFilter && (
            <div className="relative shrink-0 w-full sm:w-auto" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className={`w-full sm:w-auto inline-flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 shadow-2xs ${
                  selectedMonths.length > 0
                    ? 'border-[#175CD3]/60 bg-blue-50/70 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300'
                    : 'border-slate-200/60 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{getMonthButtonLabel()}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMonthDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800/60 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100/80 dark:border-slate-800/60 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Filter Bulan (Maks. 2)
                    </span>
                    {selectedMonths.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onMonthChange([])}
                        className="text-[#175CD3] dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto clean-scrollbar pr-1">
                    {MONTH_OPTIONS.map((m) => {
                      const isChecked = selectedMonths.includes(m.val)
                      return (
                        <button
                          key={m.val}
                          type="button"
                          onClick={() => handleMonthToggle(m.val)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                            isChecked
                              ? 'bg-[#175CD3] text-white font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{m.text}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extra Controls right beside Month/Period filter (e.g. Searchable Select Tim Kerja) */}
          {extraControls}
        </div>

        {/* Right Status Badge (Optional) */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>{totalLabel}:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
            {totalRecords}
          </span>
        </div>
      </div>

      {/* Tier 1.5: Optional Secondary Structured Filter Row (e.g. Select Dropdowns) */}
      {secondaryFilters && (
        <div className="w-full pt-2.5 border-t border-slate-100/90 dark:border-slate-800/70">
          {secondaryFilters}
        </div>
      )}

      {/* Tier 2: Dedicated Segmented Category Pills Strip (Zero Overlap Guaranteed) */}
      {hasCategories && (
        <div className="w-full pt-1 overflow-x-auto clean-scrollbar">
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 min-w-full sm:min-w-0">
            {showAllCategory && (
              <button
                type="button"
                onClick={() => onCategoryChange('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  !activeCategory
                    ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Semua ({totalAllRecords ?? totalRecords})
              </button>
            )}
            {categories.map((cat) => {
              const catVal = cat.value ?? cat.id
              const count = categoryCounts?.[catVal] ?? 0
              const hasCountMap = categoryCounts && Object.keys(categoryCounts).length > 0
              const isActive = activeCategory === catVal
              return (
                <button
                  key={catVal}
                  type="button"
                  onClick={() => onCategoryChange(catVal)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {cat.label} {hasCountMap ? `(${count})` : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
