import { useState, useEffect, useMemo } from 'react'
import { Building2, X } from 'lucide-react'
import { fetchCatInstansiMasterOptions } from '../../../../../services/api/sidigiCatServicesApi'
import { CatInstansiMultiSelect } from './CatInstansiMultiSelect'
import { CAT_FORM_INPUT_CLS } from './pengelola/pengelolaConstants'

export function CatDocInstansiPicker({
  selectedIds = [],
  selectedNames = [],
  onChange,
  disabled = false,
}) {
  const [instansiOptions, setInstansiOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [manualName, setManualName] = useState('')

  useEffect(() => {
    let active = true
    fetchCatInstansiMasterOptions('')
      .then((rows) => {
        if (active) setInstansiOptions(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (active) setInstansiOptions([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const idToName = useMemo(() => {
    const map = {}
    instansiOptions.forEach((item) => {
      const k = String(item.id || item.kodeins || '')
      if (k) map[k] = item.nama || item.name || k
    })
    return map
  }, [instansiOptions])

  const handleMultiChange = (nextIds) => {
    const cleanIds = Array.isArray(nextIds) ? nextIds.map(String) : []
    const nextNames = cleanIds.map((idVal) => {
      const prevIdx = selectedIds.indexOf(idVal)
      if (prevIdx !== -1 && selectedNames[prevIdx]) return selectedNames[prevIdx]
      return idToName[idVal] || idVal
    })
    onChange({ instansiIds: cleanIds, instansiNames: nextNames })
  }

  const handleAddManual = () => {
    const nameTrim = manualName.trim()
    if (!nameTrim) return
    const manualId = `MANUAL_${nameTrim.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 32)}`
    if (selectedNames.includes(nameTrim) || selectedIds.includes(manualId)) {
      setManualName('')
      return
    }
    onChange({
      instansiIds: [...selectedIds, manualId],
      instansiNames: [...selectedNames, nameTrim],
    })
    setManualName('')
  }

  const handleRemovePill = (idx) => {
    const nextIds = selectedIds.filter((_, i) => i !== idx)
    const nextNames = selectedNames.filter((_, i) => i !== idx)
    onChange({ instansiIds: nextIds, instansiNames: nextNames })
  }

  return (
    <div className="space-y-2.5">
      <CatInstansiMultiSelect
        instansiList={instansiOptions}
        selectedIds={selectedIds}
        onChange={handleMultiChange}
        disabled={disabled}
        isLoading={loading}
        placeholder="-- Pilih Instansi (bisa multiple) --"
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={manualName}
          disabled={disabled}
          onChange={(e) => setManualName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddManual()
            }
          }}
          placeholder="Atau tambah nama instansi manual (tekan Enter / Tambah)..."
          className={`flex-1 ${CAT_FORM_INPUT_CLS}`}
        />
        <button
          type="button"
          disabled={disabled || !manualName.trim()}
          onClick={handleAddManual}
          className="h-[38px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50 shrink-0"
        >
          + Tambah
        </button>
      </div>
      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedNames.map((nm, idx) => (
            <span
              key={`${nm}-${idx}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0B3264] dark:text-blue-300 border border-blue-200/70 text-xs font-semibold"
            >
              <Building2 className="w-3.5 h-3.5 text-[#175CD3]" />
              <span>{nm}</span>
              <button
                type="button"
                onClick={() => handleRemovePill(idx)}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
