import { useState, useEffect, useMemo, useRef } from 'react'
import Select from 'react-select'
import { Building2, Loader2, Check } from 'lucide-react'
import { apiRequest } from '../../services/api'

// In-memory cache for master instansi options
let instansiCache = null
let instansiFetchPromise = null

async function getCachedInstansiList() {
  if (instansiCache && instansiCache.length > 0) {
    return instansiCache
  }
  if (instansiFetchPromise) {
    return instansiFetchPromise
  }

  instansiFetchPromise = (async () => {
    try {
      const formData = new FormData()
      formData.append('search', '') // Load full list (backend provides up to 300)

      const data = await apiRequest('/instansi-list', {
        method: 'POST',
        body: formData,
        fallbackMessage: 'Gagal memuat daftar instansi.',
      })
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
      instansiCache = list
      return list
    } catch (err) {
      console.error('Error fetching instansi list:', err)
      return []
    } finally {
      instansiFetchPromise = null
    }
  })()

  return instansiFetchPromise
}

export function SearchableInstansiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = '-- Pilih atau Cari Instansi Daerah --',
  required = false,
  error = '',
  name = 'instansi',
  initialLabel = '',
  options: externalOptions = null,
}) {
  const [options, setOptions] = useState(() => (externalOptions && externalOptions.length > 0 ? externalOptions : instansiCache || []))
  const [isLoading, setIsLoading] = useState(!instansiCache && (!externalOptions || externalOptions.length === 0))
  const [isDark, setIsDark] = useState(false)

  // Update options if externalOptions change
  useEffect(() => {
    if (externalOptions && Array.isArray(externalOptions) && externalOptions.length > 0) {
      setOptions(externalOptions)
      setIsLoading(false)
    }
  }, [externalOptions])

  // Detect dark mode from html element
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkDark()

    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  // Load options once on mount if not provided externally
  useEffect(() => {
    if (externalOptions && Array.isArray(externalOptions) && externalOptions.length > 0) return
    let active = true
    getCachedInstansiList().then((list) => {
      if (active) {
        setOptions(list)
        setIsLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [externalOptions])

  // Format options for react-select
  const selectOptions = useMemo(() => {
    return options.map((item) => ({
      value: String(item.id || item.kodeins),
      label: item.text || item.nama || `Instansi ${item.id}`,
      kodeins: item.kodeins || item.id,
      wilayah: item.wilayah || '',
      kanreg: item.kanreg,
    }))
  }, [options])

  // Resolve currently selected option
  const selectedOption = useMemo(() => {
    if (!value && value !== 0) return null
    const valStr = String(value)
    const found = selectOptions.find((opt) => opt.value === valStr)
    if (found) return found

    // Fallback if initial data is not in options yet
    if (initialLabel) {
      return {
        value: valStr,
        label: initialLabel,
        kodeins: valStr,
        wilayah: '',
      }
    }
    return {
      value: valStr,
      label: `Instansi Kode: ${valStr}`,
      kodeins: valStr,
      wilayah: '',
    }
  }, [value, selectOptions, initialLabel])

  // Custom styling for React-Select matching Neo-SaaS SSOT
  const customStyles = useMemo(() => {
    return {
      control: (base, state) => ({
        ...base,
        minHeight: '38px',
        height: '38px',
        backgroundColor: disabled
          ? isDark
            ? 'rgba(30, 41, 59, 0.4)'
            : 'rgba(241, 245, 249, 0.7)'
          : isDark
          ? '#1e293b'
          : '#ffffff',
        borderColor: error
          ? '#f43f5e'
          : state.isFocused
          ? '#175CD3'
          : isDark
          ? '#334155'
          : '#e2e8f0',
        borderRadius: '0.75rem', // rounded-xl
        paddingLeft: '2px',
        paddingRight: '2px',
        boxShadow: state.isFocused
          ? '0 0 0 3px rgba(23, 92, 211, 0.15)'
          : 'none',
        '&:hover': {
          borderColor: state.isFocused
            ? '#175CD3'
            : isDark
            ? '#475569'
            : '#cbd5e1',
        },
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.75rem', // 12px
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: 'all 0.15s ease-in-out',
      }),
      valueContainer: (base) => ({
        ...base,
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
      }),
      singleValue: (base) => ({
        ...base,
        color: isDark ? '#f1f5f9' : '#0f172a',
        fontWeight: '600',
        fontSize: '0.75rem',
      }),
      placeholder: (base) => ({
        ...base,
        color: isDark ? '#64748b' : '#94a3b8',
        fontSize: '0.75rem',
      }),
      input: (base) => ({
        ...base,
        color: isDark ? '#f1f5f9' : '#0f172a',
        fontSize: '0.75rem',
        margin: 0,
        padding: 0,
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        borderRadius: '0.75rem',
        boxShadow: isDark
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        padding: '4px',
        overflow: 'hidden',
      }),
      menuList: (base) => ({
        ...base,
        padding: '2px',
        maxHeight: '260px',
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 99999,
      }),
      option: (base, state) => {
        let bg = 'transparent'
        let color = isDark ? '#cbd5e1' : '#1e293b'

        if (state.isSelected) {
          bg = '#175CD3'
          color = '#ffffff'
        } else if (state.isFocused) {
          bg = isDark ? '#1e293b' : '#f1f5f9'
          color = isDark ? '#ffffff' : '#0f172a'
        }

        return {
          ...base,
          backgroundColor: bg,
          color: color,
          fontSize: '0.75rem',
          fontWeight: state.isSelected ? '700' : '500',
          borderRadius: '0.5rem',
          padding: '8px 10px',
          cursor: 'pointer',
          transition: 'all 0.12s ease',
          '&:active': {
            backgroundColor: '#1550B8',
            color: '#ffffff',
          },
        }
      },
      indicatorSeparator: () => ({
        display: 'none',
      }),
      dropdownIndicator: (base, state) => ({
        ...base,
        color: isDark ? '#64748b' : '#94a3b8',
        padding: '4px 8px',
        transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.2s ease',
        '&:hover': {
          color: isDark ? '#94a3b8' : '#64748b',
        },
      }),
      clearIndicator: (base) => ({
        ...base,
        color: isDark ? '#64748b' : '#94a3b8',
        padding: '4px',
        '&:hover': {
          color: '#f43f5e',
        },
      }),
      noOptionsMessage: (base) => ({
        ...base,
        fontSize: '0.75rem',
        color: isDark ? '#64748b' : '#94a3b8',
        padding: '12px',
      }),
      loadingMessage: (base) => ({
        ...base,
        fontSize: '0.75rem',
        color: isDark ? '#64748b' : '#94a3b8',
        padding: '12px',
      }),
    }
  }, [isDark, disabled, error])

  // Custom Option Component with Region Badges
  const formatOptionLabel = (option, { context }) => {
    if (context === 'value') {
      return (
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="truncate">{option.label}</span>
          {option.wilayah && (
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
              {option.wilayah}
            </span>
          )}
        </div>
      )
    }

    const wilUpper = (option.wilayah || '').toUpperCase()
    let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500'
    if (wilUpper.includes('JABAR')) {
      badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50'
    } else if (wilUpper.includes('BANTEN')) {
      badgeClass = 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200/50'
    }

    return (
      <div className="flex items-center justify-between gap-2 py-0.5">
        <div className="min-w-0">
          <div className="font-semibold truncate">{option.label}</div>
          <div className="text-[10px] opacity-70 flex items-center gap-2 mt-0.5">
            <span>Kode: {option.kodeins}</span>
          </div>
        </div>
        {option.wilayah && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase ${badgeClass}`}>
            {option.wilayah}
          </span>
        )}
      </div>
    )
  }

  const handleSelectChange = (selected) => {
    if (!onChange) return
    const val = selected ? selected.value : ''
    
    // Synthetic event to seamlessly support both:
    // Pattern 1: onChange={(val) => setField(val)}
    // Pattern 2: onChange={handleChange} where handleChange accesses e.target.name / e.target.value
    const syntheticEvent = {
      target: {
        name,
        value: val,
        label: selected ? selected.label : '',
      },
      value: val,
      label: selected ? selected.label : '',
      option: selected,
    }
    syntheticEvent.toString = () => val
    syntheticEvent.valueOf = () => val

    // Pass synthetic event as 1st arg if caller expects an event, but also pass val as 1st arg if caller expects value
    // By having .target.value on the returned object, if caller does `onChange={(e) => setInstansi(e.target ? e.target.value : e)}` it works.
    // If caller does `onChange={(val) => setInstansi(val)}`, val can be string or object with toString() === val!
    // But even better: let's pass syntheticEvent which has value, target, toString(), and pass selected as 2nd arg.
    onChange(syntheticEvent, selected)
  }

  return (
    <div className="relative">
      <Select
        name={name}
        value={selectedOption}
        onChange={handleSelectChange}
        options={selectOptions}
        styles={customStyles}
        formatOptionLabel={formatOptionLabel}
        placeholder={placeholder}
        isDisabled={disabled}
        isLoading={isLoading}
        isClearable={!required}
        isSearchable={true}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
        noOptionsMessage={({ inputValue }) =>
          inputValue
            ? `Tidak ada instansi yang cocok dengan "${inputValue}"`
            : 'Tidak ada daftar instansi'
        }
        loadingMessage={() => 'Memuat daftar instansi...'}
      />
      {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
    </div>
  )
}
