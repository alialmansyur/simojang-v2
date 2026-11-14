import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ShieldAlert,
  CalendarClock,
  FileUp,
  MonitorSmartphone,
  Calendar,
  Search,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  fetchAuditSummary,
  fetchAuditLogs,
} from '../../services/api/settingsApi'
import { SettingsSubpageHeader } from './components/SettingsSubpageHeader'
import { PmaKpiGrid } from '../../components/shared/services/pma/PmaKpiGrid'
import { ServiceFilterToolbar } from '../../components/shared/services/ServiceFilterToolbar'
import { ServiceTablePagination } from '../../components/shared/services/ServiceTablePagination'
import { PmaTableHeader } from '../../components/shared/services/pma/PmaTableCells'

const TABS = [
  { id: 'system', label: 'Audit Sistem & RBAC', icon: ShieldAlert },
  { id: 'daily', label: 'Aktivitas Harian Layanan', icon: CalendarClock },
  { id: 'upload', label: 'Unggah Dokumen Layanan', icon: FileUp },
  { id: 'login', label: 'Riwayat Login & Perangkat', icon: MonitorSmartphone },
]

function formatBytes(bytes) {
  const n = Number(bytes || 0)
  if (!n) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function AuditSkeletonRows({ colCount }) {
  return Array.from({ length: 5 }).map((_, idx) => (
    <tr key={idx} className="animate-pulse border-b border-slate-100/70 dark:border-slate-800/60">
      {Array.from({ length: colCount }).map((__, cIdx) => (
        <td key={cIdx} className="px-4 sm:px-5 py-3">
          <div
            className={`h-4 bg-slate-200/70 dark:bg-slate-800 rounded ${
              cIdx === 1 ? 'w-32' : 'w-24'
            }`}
          />
          {cIdx === 1 && (
            <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded mt-1.5" />
          )}
        </td>
      ))}
    </tr>
  ))
}

export default function SettingsAuditPage() {
  const [activeTab, setActiveTab] = useState('system')
  const [summary, setSummary] = useState({
    totals: { system: 0, daily: 0, upload: 0, login: 0, all: 0 },
    today: { system: 0, daily: 0, upload: 0, login: 0, all: 0 },
    filters: { layanan: [], events: [] },
  })
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [searchTerm, setSearchTerm] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [layananFilter, setLayananFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [isLoadingRows, setIsLoadingRows] = useState(true)
  const [isReloading, setIsReloading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const loadSummary = useCallback(async () => {
    try {
      setIsLoadingSummary(true)
      const data = await fetchAuditSummary()
      if (data) setSummary(data)
    } catch (err) {
      toast.error(err.message || 'Gagal memuat ringkasan audit log.')
    } finally {
      setIsLoadingSummary(false)
    }
  }, [])

  const loadRows = useCallback(
    async (manual = false) => {
      try {
        setErrorMsg('')
        if (manual) setIsReloading(true)
        else setIsLoadingRows(true)

        const res = await fetchAuditLogs({
          tab: activeTab,
          page,
          per_page: pageSize,
          search: searchTerm.trim(),
          date_from: dateFrom,
          date_to: dateTo,
          event_name: activeTab === 'system' ? eventFilter : '',
          layanan_id: activeTab === 'daily' || activeTab === 'upload' ? layananFilter : '',
        })
        setRows(res.rows || [])
        setTotal(Number(res.meta?.total ?? 0))
      } catch (err) {
        const msg = err.message || 'Gagal memuat daftar log audit.'
        setErrorMsg(msg)
        toast.error(msg)
      } finally {
        setIsLoadingRows(false)
        setIsReloading(false)
      }
    },
    [activeTab, page, pageSize, searchTerm, dateFrom, dateTo, eventFilter, layananFilter]
  )

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    loadRows(false)
  }, [loadRows])

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab)
    setPage(1)
    setEventFilter('')
    setLayananFilter('')
  }

  const kpis = useMemo(
    () => [
      {
        id: 'audit-system',
        label: 'Audit Sistem & RBAC',
        value: summary?.totals?.system ?? 0,
        unit: 'log',
        context: `Hari ini: ${summary?.today?.system ?? 0} aktivitas`,
        badge: 'System',
        badgeColor: 'blue',
        icon: ShieldAlert,
      },
      {
        id: 'audit-daily',
        label: 'Aktivitas Harian Layanan',
        value: summary?.totals?.daily ?? 0,
        unit: 'log',
        context: `Hari ini: ${summary?.today?.daily ?? 0} input`,
        badge: 'Daily',
        badgeColor: 'emerald',
        icon: CalendarClock,
      },
      {
        id: 'audit-upload',
        label: 'Unggah Dokumen Layanan',
        value: summary?.totals?.upload ?? 0,
        unit: 'berkas',
        context: `Hari ini: ${summary?.today?.upload ?? 0} berkas`,
        badge: 'Upload',
        badgeColor: 'indigo',
        icon: FileUp,
      },
      {
        id: 'audit-login',
        label: 'Riwayat Login & Perangkat',
        value: summary?.totals?.login ?? 0,
        unit: 'sesi',
        context: `Hari ini: ${summary?.today?.login ?? 0} login`,
        badge: 'Auth',
        badgeColor: 'amber',
        icon: MonitorSmartphone,
      },
    ],
    [summary]
  )

  const colCount = 5

  return (
    <div className="space-y-4 sm:space-y-5 pb-8">
      <SettingsSubpageHeader
        title="Audit Log & Jejak Aktivitas"
        description="Pantau perubahan RBAC, master referensi, aktivitas harian layanan, unggahan dokumen, serta riwayat perangkat login pengguna."
        badgeLabel="Pengaturan • Audit Log"
        onReloadClick={() => {
          loadSummary()
          loadRows(true)
        }}
        isReloading={isReloading}
      />

      <PmaKpiGrid kpis={kpis} isLoading={isLoadingSummary} />

      {/* Nav Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Single-Card Table Container */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100/80 dark:border-slate-800/70">
          <ServiceFilterToolbar
            borderless
            searchTerm={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val)
              setPage(1)
            }}
            placeholder={
              activeTab === 'system'
                ? 'Cari aktor, event, target, path API, atau IP...'
                : activeTab === 'daily'
                  ? 'Cari nama pegawai, NIP, atau layanan...'
                  : activeTab === 'upload'
                    ? 'Cari nama file, jenis dokumen, pegawai, atau IP...'
                    : 'Cari username, nama lengkap, role, browser, atau IP...'
            }
            showMonthFilter={false}
            totalRecords={total}
            totalLabel="Total Log"
            extraControls={
              <div className="flex flex-wrap items-center gap-2">
                {activeTab === 'system' && (
                  <select
                    value={eventFilter}
                    onChange={(e) => {
                      setEventFilter(e.target.value)
                      setPage(1)
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                  >
                    <option value="">Semua Event</option>
                    {(summary?.filters?.events || []).map((ev) => (
                      <option key={ev} value={ev}>
                        {ev}
                      </option>
                    ))}
                  </select>
                )}

                {(activeTab === 'daily' || activeTab === 'upload') && (
                  <select
                    value={layananFilter}
                    onChange={(e) => {
                      setLayananFilter(e.target.value)
                      setPage(1)
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 max-w-[220px]"
                  >
                    <option value="">Semua Layanan</option>
                    {(summary?.filters?.layanan || []).map((lay) => (
                      <option key={lay.id} value={lay.id}>
                        {lay.nama_layanan}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value)
                      setPage(1)
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-200"
                    title="Dari Tanggal"
                  />
                  <span>–</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value)
                      setPage(1)
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-200"
                    title="Sampai Tanggal"
                  />
                </div>
              </div>
            }
          />
        </div>

        {/* Encapsulated Error State */}
        {errorMsg && (
          <div className="p-3.5 sm:p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex flex-wrap items-center justify-between gap-2 font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => loadRows(true)}
              className="px-3 py-1 rounded-lg border border-rose-200 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        <div className="overflow-x-auto clean-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {activeTab === 'system' && (
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Waktu" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Aktor" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Event" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Target" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Endpoint" />
                  </th>
                </tr>
              )}
              {activeTab === 'daily' && (
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="#" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Tanggal Layanan" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Layanan" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Petugas / Pegawai" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Dicatat Pada" />
                  </th>
                </tr>
              )}
              {activeTab === 'upload' && (
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Waktu" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Layanan" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Dokumen & Tipe" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Berkas & Ukuran" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Pengunggah" />
                  </th>
                </tr>
              )}
              {activeTab === 'login' && (
                <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Waktu Login" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Pengguna" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Role" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="Platform & Layar" />
                  </th>
                  <th className="py-3.5 px-4 sm:px-5">
                    <PmaTableHeader label="IP Address" />
                  </th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {isLoadingRows ? (
                <AuditSkeletonRows colCount={colCount} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="py-16 text-center px-4">
                    <div className="mx-auto flex flex-col items-center max-w-sm">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2.5">
                        <Search className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Tidak ada rekaman audit
                      </p>
                      <p className="text-[11px] font-normal text-slate-400 mt-1">
                        Tidak ada log audit yang sesuai dengan filter atau rentang tanggal yang dipilih.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  if (activeTab === 'system') {
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 sm:px-5 text-xs text-slate-500 whitespace-nowrap">
                          {r.created_at}
                        </td>
                        <td className="py-3 px-4 sm:px-5">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {r.actor_name || r.actor_username || 'System'}
                          </div>
                          <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                            {r.actor_username || '-'} • {r.actor_role || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 sm:px-5">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40 whitespace-nowrap">
                            {r.event_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-xs text-slate-600 dark:text-slate-300">
                          {r.target_type || '-'}
                          {r.target_id ? ` #${r.target_id}` : ''}
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-xs text-slate-500 max-w-xs truncate">
                          <span className="font-semibold text-slate-700 dark:text-slate-200 mr-1.5">
                            {r.request_method}
                          </span>
                          <span className="font-normal">{r.request_path}</span>
                        </td>
                      </tr>
                    )
                  }

                  if (activeTab === 'daily') {
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 sm:px-5 text-xs text-slate-400 tabular-nums">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {r.tanggal}
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-xs font-semibold text-[#175CD3] dark:text-blue-400">
                          {r.layanan_nama || `Layanan #${r.layanan_id}`}
                        </td>
                        <td className="py-3 px-4 sm:px-5">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {r.pegawai_nama || r.created_by}
                          </div>
                          <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">{r.created_by}</div>
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-xs text-slate-500 whitespace-nowrap">
                          {r.created_at}
                        </td>
                      </tr>
                    )
                  }

                  if (activeTab === 'upload') {
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 sm:px-5 text-xs text-slate-500 whitespace-nowrap">
                          {r.created_at}
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-xs font-semibold text-[#175CD3] dark:text-blue-400">
                          {r.layanan_nama || `Layanan #${r.layanan_id}`}
                        </td>
                        <td className="py-3 px-4 sm:px-5">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                            {r.doc_type || '-'}
                          </div>
                          <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                            {r.doc_category || '-'} {r.period ? `• ${r.period}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 sm:px-5">
                          <div
                            className="text-xs text-slate-700 dark:text-slate-200 max-w-[220px] truncate font-semibold"
                            title={r.file_name}
                          >
                            {r.file_name || '-'}
                          </div>
                          <div className="text-[11px] font-normal text-slate-400 mt-0.5 tabular-nums">
                            {formatBytes(r.file_size)}
                          </div>
                        </td>
                        <td className="py-3 px-4 sm:px-5">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {r.pegawai_nama || r.created_by}
                          </div>
                          <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">{r.created_by}</div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 sm:px-5 text-xs text-slate-500 whitespace-nowrap">
                        {r.created_at}
                      </td>
                      <td className="py-3 px-4 sm:px-5">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {r.fullname || r.username}
                        </div>
                        <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">{r.username}</div>
                      </td>
                      <td className="py-3 px-4 sm:px-5">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40 whitespace-nowrap">
                          {r.role || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 sm:px-5 text-xs text-slate-600 dark:text-slate-300">
                        <div>{r.platform || '-'}</div>
                        <div className="text-[11px] font-normal text-slate-400">
                          {r.screen_width && r.screen_height ? `${r.screen_width}×${r.screen_height}` : ''}{' '}
                          {r.timezone ? `• ${r.timezone}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4 sm:px-5 text-xs text-slate-500 whitespace-nowrap">
                        {r.ip_address || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/60">
          <ServiceTablePagination
            page={page}
            pageSize={pageSize}
            total={total}
            unitLabel="log"
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize)
              setPage(1)
            }}
          />
        </div>
      </div>
    </div>
  )
}
