import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Search,
  Loader2,
  FileSpreadsheet,
  Building2,
  AlertCircle,
} from 'lucide-react'
import { fetchEkinDetail } from '../../../../services/api/tuServicesApi'

export function EkinDetailModal({ isOpen, onClose, logItem }) {
  const [details, setDetails] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubUnit, setSelectedSubUnit] = useState('')

  useEffect(() => {
    if (!isOpen || !logItem) return

    let isMounted = true
    setIsLoading(true)
    setSearchTerm('')

    // Default selectedSubUnit if explicitly targeted from child table
    const initialSubUnit = logItem.target_sub_unit || ''
    setSelectedSubUnit(initialSubUnit)

    const targetParam = logItem.key || logItem.id || logItem.period_date || logItem.tanggal_kegiatan || ''

    fetchEkinDetail(targetParam, initialSubUnit)
      .then((data) => {
        if (!isMounted) return
        if (Array.isArray(data) && data.length > 0) {
          setDetails(data)
        } else {
          setDetails([])
        }
      })
      .catch((err) => {
        console.warn('Gagal fetch detail ekin:', err)
        setDetails([])
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, logItem])

  // Get distinct sub-units from loaded records
  const subUnitList = useMemo(() => {
    const set = new Set()
    details.forEach((d) => {
      if (d.sub_unit) set.add(d.sub_unit)
    })
    return Array.from(set)
  }, [details])

  // Filter by selected sub_unit and search
  const filteredDetails = useMemo(() => {
    let list = details
    if (selectedSubUnit) {
      list = list.filter((d) => (d.sub_unit || '').includes(selectedSubUnit))
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter(
        (it) =>
          it.nama?.toLowerCase().includes(q) ||
          it.nip?.includes(q) ||
          it.kegiatan?.toLowerCase().includes(q)
      )
    }
    return list
  }, [details, selectedSubUnit, searchTerm])

  const displayDate =
    logItem?.period_date_label || logItem?.period_date || logItem?.tanggal_kegiatan || 'Harian'

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !logItem) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[94vh] modal-dialog-animated">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Data Aktivitas E-Kinerja ({displayDate})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedSubUnit || logItem?.sub_unit || logItem?.sub_unit_list || 'Semua Tim Kerja / Sub Unit'} • Kanreg III BKN
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Filter Tim Kerja / Sub Unit & Search Input */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          {/* Sub Unit Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 whitespace-nowrap">Tim Kerja:</span>
            <select
              value={selectedSubUnit}
              onChange={(e) => setSelectedSubUnit(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="">Semua Tim Kerja ({details.length} Baris)</option>
              {subUnitList.map((unit) => {
                const count = details.filter((d) => (d.sub_unit || '') === unit).length
                return (
                  <option key={unit} value={unit}>
                    {unit} ({count})
                  </option>
                )
              })}
            </select>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, NIP, kegiatan..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Main Data Table */}
        <div className="overflow-auto flex-1 clean-scrollbar">
          {isLoading ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#175CD3]" />
              <p className="text-xs text-slate-500">Memuat rincian aktivitas data Excel...</p>
            </div>
          ) : filteredDetails.length === 0 ? (
            <div className="py-16 text-center space-y-2 px-4">
              <AlertCircle className="w-8 h-8 text-amber-500/80 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tidak ada data aktivitas yang sesuai filter atau pencarian.
              </p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                {details.length === 0
                  ? `Tidak ada berkas log kinerja yang tercatat untuk tanggal ${displayDate}. Pastikan file Excel telah diunggah untuk unit ini.`
                  : 'Coba ubah kata kunci pencarian atau pilih filter Tim Kerja yang berbeda.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 z-10">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200/60 dark:border-slate-700/60">No</th>
                  <th className="py-2.5 px-3 w-48 border-r border-slate-200/60 dark:border-slate-700/60">Nama Pegawai</th>
                  <th className="py-2.5 px-3 w-40 border-r border-slate-200/60 dark:border-slate-700/60">NIP</th>
                  <th className="py-2.5 px-3 w-32 text-center border-r border-slate-200/60 dark:border-slate-700/60">Waktu</th>
                  <th className="py-2.5 px-3 border-r border-slate-200/60 dark:border-slate-700/60">Uraian Kegiatan</th>
                  <th className="py-2.5 px-3 w-44">Sub Unit / Tim Kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
                {filteredDetails.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-normal border-r border-slate-100 dark:border-slate-800">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800">
                      {row.nama || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                      {row.nip}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
                      {row.waktu || '-'}
                    </td>
                    <td className="py-2.5 px-3 leading-relaxed border-r border-slate-100 dark:border-slate-800">
                      {row.kegiatan}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                      {row.sub_unit || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-slate-900 text-xs">
          <span className="text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredDetails.length}</span> baris aktivitas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default EkinDetailModal
