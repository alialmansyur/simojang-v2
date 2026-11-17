import { forwardRef, useState, useEffect, useMemo } from 'react'
import Select from 'react-select'

/**
 * Reusable Searchable Select Component based on react-select
 * Styled strictly according to SIMOJANG SSOT Design Tokens:
 * - Font: Plus Jakarta Sans
 * - Soft borders & smooth rounded-xl
 * - Light & Dark mode support
 * - Searchable with instant fuzzy match
 * - Normalizes options with { value, label, text, id, nama }
 */
export const SearchableSelect = forwardRef(function SearchableSelect(
  {
    options = [],
    value,
    onChange,
    placeholder = '-- Pilih atau cari instansi --',
    isLoading = false,
    isDisabled = false,
    isClearable = true,
    isMulti = false,
    closeMenuOnSelect,
    name,
    required = false,
    className = '',
    menuPlacement = 'auto',
    id,
    noOptionsText = 'Tidak ada pilihan yang sesuai',
    loadingText = 'Memuat data...',
  },
  ref
) {
  const [isDark, setIsDark] = useState(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  // Normalize options to { value, label, raw }
  const normalizedOptions = useMemo(() => {
    const list = Array.isArray(options) ? options : []
    return list.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt, raw: opt }
      }
      const val = opt.value ?? opt.id ?? opt.kodeins ?? ''
      const lbl = opt.label ?? opt.text ?? opt.nama ?? opt.instansi_name ?? String(val)
      return {
        value: String(val),
        label: String(lbl),
        raw: opt,
      }
    })
  }, [options])

  // Find currently selected option (mencocokkan berdasarkan value, id, atau teks label secara case-insensitive)
  const selectedOption = useMemo(() => {
    if (isMulti) {
      let valArray = []
      if (Array.isArray(value)) {
        valArray = value
          .map((v) => (typeof v === 'object' && v !== null ? String(v.value ?? v.id ?? '') : String(v)))
          .map((s) => s.trim())
          .filter(Boolean)
      } else if (typeof value === 'string' && value.trim()) {
        valArray = value.split(',').map((s) => s.trim()).filter(Boolean)
      } else if (value && typeof value === 'object') {
        const v = String(value.value ?? value.id ?? '').trim()
        if (v) valArray = [v]
      }

      if (valArray.length === 0) return []

      return normalizedOptions.filter((opt) =>
        valArray.some((v) => String(opt.value) === v || String(opt.label).toLowerCase() === v.toLowerCase())
      )
    }

    if (value && typeof value === 'object') {
      const v = String(value.value ?? value.id ?? value.kodeins ?? value.nama ?? '').trim()
      if (!v) return null
      return (
        normalizedOptions.find(
          (opt) => String(opt.value) === v || String(opt.label).toLowerCase() === v.toLowerCase()
        ) || null
      )
    }
    const strVal = String(value ?? '').trim()
    if (!strVal) return null
    return (
      normalizedOptions.find(
        (opt) => String(opt.value) === strVal || String(opt.label).toLowerCase() === strVal.toLowerCase()
      ) || null
    )
  }, [isMulti, value, normalizedOptions])

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '38px',
      borderRadius: '0.75rem', // rounded-xl (12px)
      backgroundColor: isDark ? '#0f172a' : '#ffffff', // slate-900 or white
      borderColor: state.isFocused
        ? '#175CD3'
        : isDark
        ? 'rgba(51, 65, 85, 0.8)' // slate-700
        : 'rgba(203, 213, 225, 0.8)', // slate-300
      boxShadow: state.isFocused ? '0 0 0 3px rgba(23, 92, 211, 0.15)' : 'none',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '0.8125rem', // 13px
      transition: 'all 0.15s ease',
      '&:hover': {
        borderColor: state.isFocused ? '#175CD3' : isDark ? '#475569' : '#94a3b8',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 10px',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
      fontWeight: '500',
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: '0.8125rem',
    }),
    input: (base) => ({
      ...base,
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '0.8125rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      border: isDark ? '1px solid rgba(51, 65, 85, 0.9)' : '1px solid rgba(226, 232, 240, 0.9)',
      borderRadius: '0.75rem',
      boxShadow: isDark
        ? '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)'
        : '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
      overflow: 'hidden',
      zIndex: 9999,
      marginTop: '4px',
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      maxHeight: '220px',
      scrollbarWidth: 'thin',
    }),
    option: (base, state) => ({
      ...base,
      borderRadius: '0.5rem',
      margin: '2px 0',
      padding: '8px 12px',
      fontSize: '0.8125rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      cursor: 'pointer',
      backgroundColor: state.isSelected
        ? '#175CD3'
        : state.isFocused
        ? isDark
          ? 'rgba(30, 58, 138, 0.4)'
          : 'rgba(239, 246, 255, 0.9)'
        : 'transparent',
      color: state.isSelected
        ? '#ffffff'
        : isDark
        ? '#e2e8f0'
        : '#1e293b',
      fontWeight: state.isSelected ? '600' : '500',
      transition: 'all 0.1s ease',
      '&:active': {
        backgroundColor: '#175CD3',
        color: '#ffffff',
      },
    }),
    noOptionsMessage: (base) => ({
      ...base,
      fontSize: '0.8125rem',
      color: isDark ? '#64748b' : '#94a3b8',
      padding: '12px',
    }),
    loadingMessage: (base) => ({
      ...base,
      fontSize: '0.8125rem',
      color: isDark ? '#64748b' : '#94a3b8',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: isDark ? '#64748b' : '#94a3b8',
      padding: '6px',
      '&:hover': {
        color: isDark ? '#cbd5e1' : '#475569',
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: isDark ? '#64748b' : '#94a3b8',
      padding: '6px',
      '&:hover': {
        color: '#ef4444',
      },
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: isDark ? '#334155' : '#e2e8f0',
      margin: '6px 0',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? 'rgba(30, 58, 138, 0.45)' : '#eff6ff',
      borderRadius: '0.375rem',
      border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #bfdbfe',
      padding: '1px 2px',
      margin: '2px 4px 2px 0',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDark ? '#93c5fd' : '#1d4ed8',
      fontSize: '0.75rem',
      fontWeight: '600',
      padding: '2px 6px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDark ? '#93c5fd' : '#1d4ed8',
      borderRadius: '0 0.375rem 0.375rem 0',
      cursor: 'pointer',
      paddingLeft: '2px',
      paddingRight: '4px',
      ':hover': {
        backgroundColor: '#ef4444',
        color: '#ffffff',
      },
    }),
  }

  const handleChange = (selected) => {
    if (!onChange) return
    if (isMulti) {
      const selectedArr = Array.isArray(selected) ? selected : []
      const ids = selectedArr.map((s) => String(s.value))
      try {
        Object.assign(ids, {
          value: ids.join(','),
          options: selectedArr,
          values: ids,
        })
      } catch {}
      onChange(ids, selectedArr)
      return
    }

    if (!selected) {
      onChange('', null)
      return
    }
    // Kompatibilitas ganda: pass value payload yang aman diakses baik sebagai string langsung maupun properti .value
    const rawVal = String(selected.value ?? '')
    let valPayload = rawVal
    try {
      valPayload = Object.assign(new String(rawVal), {
        value: rawVal,
        label: selected.label,
        id: rawVal,
        toString: () => rawVal,
        valueOf: () => rawVal,
      })
    } catch {
      valPayload = rawVal
    }
    onChange(valPayload, selected)
  }

  return (
    <div className={`relative ${className}`}>
      <Select
        ref={ref}
        id={id}
        name={name}
        options={normalizedOptions}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isLoading={isLoading}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isSearchable
        isMulti={isMulti}
        closeMenuOnSelect={closeMenuOnSelect ?? !isMulti}
        menuPlacement={menuPlacement}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        styles={{
          ...customStyles,
          menuPortal: (base) => ({ ...base, zIndex: 99999 }),
        }}
        noOptionsMessage={() => noOptionsText}
        loadingMessage={() => loadingText}
      />
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
          value={
            isMulti
              ? Array.isArray(selectedOption) && selectedOption.length > 0
                ? selectedOption.map((o) => o.value).join(',')
                : ''
              : selectedOption
              ? selectedOption.value
              : ''
          }
          onChange={() => {}}
          required={required}
        />
      )}
    </div>
  )
})

export default SearchableSelect
