import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Building2,
  FileSpreadsheet,
  Download,
  Search,
  Loader2,
  Calendar,
  Clock,
  User,
  Layers,
  FileText,
  RefreshCw,
  Pencil,
} from 'lucide-react'
import { fetchServiceDetailData } from '../../../services/api/modularServicesApi'

const resolveYesCount = (val) => {
  if (val === null || val === undefined || val === '') return 0
  const str = String(val).trim().toUpperCase()
  if (str === 'Y' || str === 'YA' || str === 'DONE' || str === 'SELESAI') return 1
  if (str === 'N' || str === 'TIDAK' || str === '-') return 0
  const num = Number(val)
  return Number.isFinite(num) ? num : 0
}

const getRowSisa = (row) => {
  if (row?.sisa !== null && row?.sisa !== undefined && row?.sisa !== '') {
    const parsed = Number(row.sisa)
    if (Number.isFinite(parsed)) return parsed
  }
  const usul = Number(row?.usul_masuk || 0)
  const processed = Number(row?.ms || 0) + Number(row?.bts || 0) + Number(row?.tms || 0)
  return Math.max(0, usul - processed)
}

const formatFileSize = (bytes) => {
  const num = Number(bytes)
  if (!num || !Number.isFinite(num)) return '-'
  const kb = num / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return (
      d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB'
    )
  } catch {
    return dateStr
  }
}

export function ServiceDetailDialog({
  isOpen,
  onClose,
  logItem,
  serviceTitle,
  layananId,
  onDownloadFile,
  onEditLog,
}) {
  const [details, setDetails] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const isTapnip = Boolean(
    Number(layananId) === 2 ||
      Number(logItem?.layanan_id) === 2 ||
      String(logItem?.doc_type || '').toLowerCase().includes('nip') ||
      String(serviceTitle || '').toLowerCase().includes('penetapan nip')
  )

  const loadDetailRows = useCallback(() => {
    if (!isOpen || !logItem?.id) return
    let cancelled = false
    setIsLoading(true)
    setErrorMsg('')

    fetchServiceDetailData({ key: logItem.id, length: 1000 })
      .then((res) => {
        if (!cancelled) {
          setDetails(Array.isArray(res?.data) ? res.data : [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Gagal memuat rincian data usul dari server.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, logItem?.id])

  useEffect(() => {
    if (!isOpen) return
    setSearchTerm('')
    const cleanup = loadDetailRows()
    return cleanup
  }, [isOpen, loadDetailRows])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const filteredDetails = useMemo(() => {
    if (!searchTerm.trim()) return details
    const q = searchTerm.trim().toLowerCase()
    return details.filter(
      (d) =>
        String(d.nama ?? '').toLowerCase().includes(q) ||
        String(d.instansi_id ?? '').toLowerCase().includes(q) ||
        String(d.formasi ?? '').toLowerCase().includes(q) ||
        String(d.target_tahun ?? '').toLowerCase().includes(q) ||
        String(d.target_bulan ?? '').toLowerCase().includes(q) ||
        String(d.keterangan ?? '').toLowerCase().includes(q)
    )
  }, [details, searchTerm])

  const totals = useMemo(() => {
    return filteredDetails.reduce(
      (acc, curr) => {
        acc.usul += Number(curr.usul_masuk || 0)
        acc.ms += Number(curr.ms || 0)
        acc.bts += Number(curr.bts || 0)
        acc.tms += Number(curr.tms || 0)
        acc.sisa += getRowSisa(curr)
        if (isTapnip) {
          acc.sudahCetak += Number(curr.sudah_cetak || 0)
          acc.belumCetak += Number(curr.belum_cetak || 0)
          acc.niDone += resolveYesCount(curr.ni_done)
          acc.skDone += resolveYesCount(curr.sk_pppk_done)
        }
        return acc
      },
      {
        usul: 0,
        ms: 0,
        bts: 0,
        tms: 0,
        sisa: 0,
        sudahCetak: 0,
        belumCetak: 0,
        niDone: 0,
        skDone: 0,
      }
    )
  }, [filteredDetails, isTapnip])

  if (!isOpen || typeof document === 'undefined') return null

  const handleExportCsv = () => {
    if (!filteredDetails.length) return

    let headers
    let rows

    if (isTapnip) {
      headers = [
        'Nama Instansi',
        'Formasi',
        'Usul Masuk',
        'MS',
        'BTS',
        'TMS',
        'Sisa',
        'Sudah Cetak',
        'Belum Cetak',
        'Proses SK',
        'Selesai SK',
        'Usul Input',
        'Proses NI',
        'Selesai NI',
        'Jadwal Tunggu',
        'SK Selesai',
        'Keterangan',
        'Upload By',
        'Tanggal Upload',
      ]

      rows = filteredDetails.map((r) => [
        `"${String(r.nama || '').replace(/"/g, '""')}"`,
        `"${String(r.formasi || '').replace(/"/g, '""')}"`,
        r.usul_masuk ?? 0,
        r.ms ?? 0,
        r.bts ?? 0,
        r.tms ?? 0,
        getRowSisa(r),
        r.sudah_cetak ?? 0,
        r.belum_cetak ?? 0,
        `"${r.sk_cpppk_proses || 'N'}"`,
        `"${r.sk_cpppk_done || 'N'}"`,
        `"${r.usul_input || 'N'}"`,
        `"${r.ni_proses || 'N'}"`,
        `"${r.ni_done || 'N'}"`,
        `"${r.jadwal_wait || '-'}"`,
        `"${r.sk_pppk_done || 'N'}"`,
        `"${String(r.keterangan || '').replace(/"/g, '""')}"`,
        `"${r.created_by || ''}"`,
        `"${r.created_at || ''}"`,
      ])
    } else {
      headers = [
        'Nama Instansi',
        'Target Tahun',
        'Target Bulan',
        'Usul Masuk',
        'MS',
        'BTS',
        'TMS',
        'Sisa',
        'SLA Bawah',
        'SLA Atas',
        'Keterangan',
        'Upload By',
        'Tanggal Upload',
      ]

      rows = filteredDetails.map((r) => [
        `"${String(r.nama || '').replace(/"/g, '""')}"`,
        r.target_tahun ?? '',
        r.target_bulan ?? '',
        r.usul_masuk ?? 0,
        r.ms ?? 0,
        r.bts ?? 0,
        r.tms ?? 0,
        getRowSisa(r),
        r.sla_bawah ?? '',
        r.sla_atas ?? '',
        `"${String(r.keterangan || '').replace(/"/g, '""')}"`,
        `"${r.created_by || ''}"`,
        `"${r.created_at || ''}"`,
      ])
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Detail_${logItem?.file_name?.replace(/\.[^/.]+$/, '') || 'Layanan'}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const periodRangeText =
    logItem?.period_start_date && logItem?.period_end_date
      ? `${logItem.period_start_date} s/d ${logItem.period_end_date}`
      : logItem?.period_date || '-'

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-detail-modal-title"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden modal-dialog-animated"
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
              <h2
                id="service-detail-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-md sm:max-w-xl"
                title={logItem?.file_name}
              >
                Rincian Usul Instansi: {logItem?.file_name || '-'}
              </h2>
              {isTapnip && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-[#175CD3] dark:bg-blue-950 dark:text-blue-300">
                  Format TapNIP
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {serviceTitle} • ID Log #{logItem?.id || '-'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEditLog && logItem && (
              <button
                type="button"
                onClick={() => {
                  onClose?.()
                  onEditLog(logItem)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5 text-[#175CD3] dark:text-blue-400" />
                <span>Ubah Data</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredDetails.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup rincian"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata Bento Strip (Full Log Information Delegated from Main Table) */}
        <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-200/60 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs shrink-0">
          <div className="flex items-start gap-2.5 min-w-0">
            <Calendar className="w-4 h-4 text-[#175CD3] dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Periode & Tanggal Sinkron
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                {logItem?.period || '-'} • <span className="font-medium text-slate-500 dark:text-slate-400">{periodRangeText}</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 min-w-0">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Kategori / Jenis Berkas
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-100 truncate" title={logItem?.doc_category || logItem?.doc_type || '-'}>
                {logItem?.doc_category || logItem?.doc_type || serviceTitle || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ukuran & Catatan Log
              </p>
              <p className="font-semibold text-slate-700 dark:text-slate-200 truncate" title={logItem?.remarks || '-'}>
                {formatFileSize(logItem?.file_size)} • {logItem?.remarks || 'Tanpa catatan tambahan'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 min-w-0">
            <User className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pengunggah & Waktu Upload
              </p>
              <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                NIP {logItem?.created_by || '-'} • {formatDateTime(logItem?.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar & Summary Bar */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute inset-y-0 left-3 my-auto text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama instansi, formasi, tahun..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-2.5 my-auto text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Bersihkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs overflow-x-auto pb-1 sm:pb-0 clean-scrollbar">
            <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold shrink-0">
              Instansi: <span className="font-bold text-slate-900 dark:text-white">{filteredDetails.length}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold shrink-0">
              Usul: <span className="font-bold text-[#175CD3] dark:text-blue-200">{totals.usul.toLocaleString('id-ID')}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold shrink-0">
              MS: <span className="font-bold text-emerald-600 dark:text-emerald-200">{totals.ms.toLocaleString('id-ID')}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold shrink-0">
              BTS: <span className="font-bold text-amber-600 dark:text-amber-200">{totals.bts.toLocaleString('id-ID')}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold shrink-0">
              TMS: <span className="font-bold text-rose-600 dark:text-rose-200">{totals.tms.toLocaleString('id-ID')}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold shrink-0">
              Sisa: <span className="font-bold text-slate-900 dark:text-white">{totals.sisa.toLocaleString('id-ID')}</span>
            </div>
            {isTapnip && (
              <>
                <div className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold shrink-0">
                  Sudah Cetak: <span className="font-bold text-indigo-600 dark:text-indigo-200">{totals.sudahCetak.toLocaleString('id-ID')}</span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold shrink-0">
                  Instansi Selesai SK: <span className="font-bold text-sky-600 dark:text-sky-200">{totals.skDone}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table Body Area */}
        <div className="flex-1 overflow-auto clean-scrollbar p-4 sm:p-6">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#175CD3] mb-2" />
              <p className="text-xs font-semibold">Memuat rekapan rincian usul instansi...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{errorMsg}</p>
              <button
                type="button"
                onClick={loadDetailRows}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Rincian</span>
              </button>
            </div>
          ) : filteredDetails.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {searchTerm
                  ? `Tidak ada instansi yang cocok dengan kata kunci "${searchTerm}"`
                  : 'Tidak ada baris rincian instansi pada berkas ini.'}
              </p>
            </div>
          ) : isTapnip ? (
            /* TABEL TAPNIP */
            <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[1220px]">
                <thead>
                  <tr className="bg-[#F8FAFC] dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="px-3 py-3 text-center w-10">No</th>
                    <th className="px-4 py-3">Nama Instansi</th>
                    <th className="px-3 py-3 text-center">Formasi</th>
                    <th className="px-3 py-3 text-center">Usul</th>
                    <th className="px-3 py-3 text-center text-emerald-600">MS</th>
                    <th className="px-3 py-3 text-center text-amber-600">BTS</th>
                    <th className="px-3 py-3 text-center text-rose-600">TMS</th>
                    <th className="px-3 py-3 text-center">Sisa</th>
                    <th className="px-3 py-3 text-center text-indigo-600">Cetak</th>
                    <th className="px-3 py-3 text-center text-slate-500">Blm Cetak</th>
                    <th className="px-3 py-3 text-center">Proses SK</th>
                    <th className="px-3 py-3 text-center">Selesai SK</th>
                    <th className="px-3 py-3 text-center">Usul Input</th>
                    <th className="px-3 py-3 text-center">Proses NI</th>
                    <th className="px-3 py-3 text-center">Selesai NI</th>
                    <th className="px-3 py-3 text-center">Tunggu</th>
                    <th className="px-3 py-3 text-center text-sky-600">SK Selesai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredDetails.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3 py-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                        {row.nama || 'Instansi #' + (row.instansi_id || '-')}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">
                        {row.formasi || '-'}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {row.usul_masuk ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                        {row.ms ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20">
                        {row.bts ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20">
                        {row.tms ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {getRowSisa(row)}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-indigo-600 dark:text-indigo-400">
                        {row.sudah_cetak ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-500">
                        {row.belum_cetak ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${row.sk_cpppk_proses === 'Y' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'text-slate-400'}`}>
                          {row.sk_cpppk_proses || 'N'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${row.sk_cpppk_done === 'Y' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'text-slate-400'}`}>
                          {row.sk_cpppk_done || 'N'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${row.usul_input === 'Y' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-400'}`}>
                          {row.usul_input || 'N'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${row.ni_proses === 'Y' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'text-slate-400'}`}>
                          {row.ni_proses || 'N'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${row.ni_done === 'Y' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'text-slate-400'}`}>
                          {row.ni_done || 'N'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-500">
                        {row.jadwal_wait || '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${row.sk_pppk_done === 'Y' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' : 'text-slate-400'}`}>
                          {row.sk_pppk_done || 'N'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* TABEL LAYANAN STANDAR (KP, PG, PMK, PI, CLTN, Pensiun, ASN Aktif, CPNS/PNS) */
            <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#F8FAFC] dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="px-3 py-3 text-center w-10">No</th>
                    <th className="px-4 py-3">Nama Instansi</th>
                    <th className="px-3 py-3 text-center">Tahun</th>
                    <th className="px-3 py-3 text-center">Bulan</th>
                    <th className="px-3 py-3 text-center">Usul</th>
                    <th className="px-3 py-3 text-center text-emerald-600">MS</th>
                    <th className="px-3 py-3 text-center text-amber-600">BTS</th>
                    <th className="px-3 py-3 text-center text-rose-600">TMS</th>
                    <th className="px-3 py-3 text-center">Sisa</th>
                    <th className="px-3 py-3 text-center">SLA Bawah</th>
                    <th className="px-3 py-3 text-center">SLA Atas</th>
                    <th className="px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredDetails.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3 py-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                        {row.nama || 'Instansi #' + (row.instansi_id || '-')}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">
                        {row.target_tahun ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">
                        {row.target_bulan ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {row.usul_masuk ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                        {row.ms ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20">
                        {row.bts ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20">
                        {row.tms ?? 0}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {getRowSisa(row)}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-500">
                        {row.sla_bawah ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-500">
                        {row.sla_atas ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[220px] truncate" title={row.keterangan || ''}>
                        {row.keterangan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Standardized Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Menampilkan <span className="font-bold text-slate-700 dark:text-slate-200">{filteredDetails.length}</span> dari{' '}
            <span className="font-bold text-slate-700 dark:text-slate-200">{details.length}</span> baris instansi
          </p>
          <div className="flex items-center gap-2">
            {onDownloadFile && logItem?.file_url && (
              <button
                type="button"
                onClick={() => onDownloadFile(logItem)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100/80 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Excel Asli</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
