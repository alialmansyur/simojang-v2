import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Clock,
  History,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  ArrowUpRight,
  Calendar,
  User,
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  fetchIkkIndikatorLogs,
  deleteIkkIndikatorRealisasi,
} from '../../../../services/api/tuServicesApi'
import { TuDeleteConfirmDialog } from '../../../../components/shared/services/tu/TuDeleteConfirmDialog'

export function IkkLogHistoryModal({
  isOpen,
  onClose,
  indikatorId,
  onEditLog,
  onLogDeleted,
}) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingLog, setDeletingLog] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadLogs = useCallback(async () => {
    if (!indikatorId) return

    try {
      setIsLoading(true)
      setErrorMessage('')
      const res = await fetchIkkIndikatorLogs(indikatorId)
      setData(res)
    } catch (err) {
      console.warn('Gagal memuat riwayat log IKK:', err)
      setErrorMessage(err?.message || 'Gagal memuat data riwayat log IKK.')
    } finally {
      setIsLoading(false)
    }
  }, [indikatorId])

  useEffect(() => {
    if (isOpen && indikatorId) {
      loadLogs()
    }
  }, [isOpen, indikatorId, loadLogs])

  const handleConfirmDelete = async () => {
    if (!deletingLog?.id) return

    try {
      setIsDeleting(true)
      const res = await deleteIkkIndikatorRealisasi(deletingLog.id)
      if (res?.status === 'success') {
        toast.success(res.message || 'Data log realisasi berhasil dihapus.')
        setDeletingLog(null)
        await loadLogs()
        onLogDeleted && onLogDeleted(deletingLog)
      } else {
        toast.error(res?.message || 'Gagal menghapus data log realisasi.')
      }
    } catch (err) {
      console.warn('Gagal menghapus log IKK:', err)
      toast.error(err?.message || 'Terjadi kesalahan sistem saat menghapus data log.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  const indikator = data?.indikator
  const logs = data?.logs || []

  const renderBadge = (capaianDisplay) => {
    if (!capaianDisplay || capaianDisplay === 'NA' || capaianDisplay === '-') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          NA
        </span>
      )
    }

    const clean = parseFloat(String(capaianDisplay).replace(/[% ,]/g, ''))
    if (!isNaN(clean)) {
      if (clean >= 100) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{capaianDisplay}</span>
          </span>
        )
      }
      if (clean >= 80) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#175CD3] border border-blue-200">
            {capaianDisplay}
          </span>
        )
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>{capaianDisplay}</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
        {capaianDisplay}
      </span>
    )
  }

  const formatDateTime = (dtStr) => {
    if (!dtStr) return '-'
    try {
      const d = new Date(dtStr)
      if (isNaN(d.getTime())) return dtStr
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dtStr
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xl max-w-5xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#175CD3] text-white">
                  IKK {indikator?.no_urut || ''}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Satuan: {indikator?.satuan || '-'} | Target: {indikator?.target_volume || '-'}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  • Total Log: {logs.length} Entri
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                {indikator?.nama_indikator || 'Riwayat Log Realisasi & Capaian'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto clean-scrollbar text-xs flex-1">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#175CD3] mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Memuat riwayat log capaian...</p>
            </div>
          ) : errorMessage ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {errorMessage}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Belum ada rekaman log input untuk indikator ini.
              </p>
              <p className="text-xs text-slate-400">
                Setiap kali data diunggah atau diinput satuan, catatan log pergerakan capaian akan otomatis terekam di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline Pergerakan Capaian Ringkas */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#175CD3]" />
                  <span>Tren Pergerakan Capaian per Periode Input:</span>
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 clean-scrollbar">
                  {logs.map((log, idx) => (
                    <div
                      key={`pill-${log.id || idx}`}
                      className="shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center space-y-0.5 shadow-2xs"
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        {log.bulan_nama} {log.tahun}
                      </div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                        {log.realisasi_display}
                      </div>
                      <div>{renderBadge(log.capaian_display)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabel Log Lengkap */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-x-auto clean-scrollbar">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 whitespace-nowrap">Periode Log</th>
                      <th className="py-2.5 px-3 text-center">Target</th>
                      <th className="py-2.5 px-3 text-center">Realisasi</th>
                      <th className="py-2.5 px-3 text-center">Capaian</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Penjelasan / Progres</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Permasalahan</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Rencana Tindak Lanjut</th>
                      <th className="py-2.5 px-3 text-center">Bukti Eviden</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Waktu Input & Petugas</th>
                      <th className="py-2.5 px-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 align-top">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <div>{log.periode_formatted}</div>
                          <span className="text-[10px] font-normal text-slate-400">
                            Key: {log.periode_key}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                          {log.target_periode || '-'}
                        </td>

                        <td className="py-2.5 px-3 text-center font-black text-slate-900 dark:text-white">
                          {log.realisasi_display}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {renderBadge(log.capaian_display)}
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                          {log.penjelasan_capaian || <span className="text-slate-400 italic">-</span>}
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                          {log.permasalahan || <span className="text-slate-400 italic">-</span>}
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                          {log.rencana_tindak_lanjut || <span className="text-slate-400 italic">-</span>}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {log.bukti_dukung ? (
                            <a
                              href={log.bukti_dukung}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-[#175CD3] border border-blue-200 text-[10px] font-bold hover:bg-blue-100"
                              title={log.bukti_dukung}
                            >
                              <span>Buka Eviden</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[10px]">
                          <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDateTime(log.updated_at || log.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                            <User className="w-3 h-3" />
                            <span>{log.created_by || 'system'}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onClose()
                                onEditLog && onEditLog({
                                  ...indikator,
                                  ...log,
                                  log_id: log.id,
                                  realisasi: log.realisasi_display,
                                  capaian: log.capaian_display,
                                })
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors cursor-pointer"
                              title="Edit data log ini"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingLog(log)}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                              title="Hapus data log ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Menampilkan seluruh kronologi log input untuk indikator terpilih.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* DIALOG KONFIRMASI HAPUS (SWAL / TU CONFIRM DIALOG) */}
      <TuDeleteConfirmDialog
        isOpen={Boolean(deletingLog)}
        onClose={() => !isDeleting && setDeletingLog(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Konfirmasi Hapus Data Log IKK"
        message={`Apakah Anda yakin ingin menghapus catatan log periode ${deletingLog?.periode_formatted || deletingLog?.periode_key}? Nilai realisasi "${deletingLog?.realisasi_display || '-'}" dan capaian "${deletingLog?.capaian_display || '-'}" akan dihapus permanen.`}
      />
    </div>
  )
}
