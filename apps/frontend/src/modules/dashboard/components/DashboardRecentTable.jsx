import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, Clock, User, ExternalLink } from 'lucide-react'
import { resolveServiceRoute } from '../../../services/api/dashboardApi'

function formatIndonesianDateTime(dateStr) {
  if (!dateStr) return '-'
  try {
    const normalized = String(dateStr).replace(' ', 'T')
    const d = new Date(normalized)
    if (isNaN(d.getTime())) return dateStr
    const datePart = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const timePart = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return `${datePart}, ${timePart} WIB`
  } catch {
    return dateStr
  }
}

export function DashboardRecentTable({ activities = [] }) {
  const navigate = useNavigate()

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      {/* Header Toolbar */}
      <div className="p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Aktivitas Unggahan Layanan Terbaru
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar unggahan berkas layanan kepegawaian terkini
          </p>
        </div>
      </div>

      {/* Simplified 4-Column SSOT Table */}
      <div className="overflow-x-auto clean-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr>
              <th className="py-3.5 px-4 sm:px-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                Layanan
              </th>
              <th className="py-3.5 px-4 sm:px-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                Petugas
              </th>
              <th className="py-3.5 px-4 sm:px-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                Waktu Unggah
              </th>
              <th className="py-3.5 px-4 sm:px-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 px-6 text-center text-xs text-slate-400">
                  Belum ada aktivitas unggahan layanan tercatat.
                </td>
              </tr>
            ) : (
              activities.map((row) => {
                const targetPath = resolveServiceRoute(row.layanan_url)
                const subLabel = [row.timkerja_nama, row.doc_category || row.file_name]
                  .filter(Boolean)
                  .join(' • ')

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Col 1: Layanan + Konteks Tim Kerja */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EAF2FC] dark:bg-[#123B73]/30 text-[#175CD3] dark:text-[#93C5FD] border border-[#175CD3]/15 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => navigate(targetPath)}
                            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-[#93C5FD] truncate block max-w-xs sm:max-w-md text-left cursor-pointer"
                          >
                            {row.nama_layanan}
                          </button>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs sm:max-w-md mt-0.5">
                            {subLabel}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Col 2: Petugas */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold truncate max-w-[180px]" title={row.uploader_nama}>
                          {row.uploader_nama}
                        </span>
                      </div>
                    </td>

                    {/* Col 3: Waktu Unggah */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatIndonesianDateTime(row.created_at)}</span>
                      </div>
                    </td>

                    {/* Col 4: Aksi */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(targetPath)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#175CD3] dark:text-[#93C5FD] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer active:scale-95"
                      >
                        <span>Buka</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
