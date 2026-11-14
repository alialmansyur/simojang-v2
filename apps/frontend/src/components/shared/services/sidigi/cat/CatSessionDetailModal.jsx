import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Calendar,
  Clock,
  Building2,
  MapPin,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react'
import { isExcelOrigin } from '../SidigiDataOriginIcon'
import { KPI_TYPOGRAPHY } from '../../kpiTokens'

export function CatSessionDetailModal({ isOpen, onClose, session }) {
  useEffect(() => {
    if (!isOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !session) return null

  const formatNumber = (val) => new Intl.NumberFormat('id-ID').format(Number(val || 0))
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const hadirNum = Number(session.hadir || 0)
  const tidakHadirNum = Number(session.tidak_hadir || 0)
  const totalPeserta = hadirNum + tidakHadirNum > 0 ? hadirNum + tidakHadirNum : Number(session.kuota || hadirNum)
  const pctHadir = totalPeserta > 0 ? Math.round((hadirNum / totalPeserta) * 100) : 0

  const skorMin = session.nilai_min !== null && session.nilai_min !== undefined && session.nilai_min !== ''
    ? session.nilai_min
    : '-'
  const skorMax = session.nilai_max !== null && session.nilai_max !== undefined && session.nilai_max !== ''
    ? session.nilai_max
    : '-'

  const rescheduleNum = Number(session.reschedule || 0)
  const memenuhiNum = session.memenuhi !== null && session.memenuhi !== undefined ? Number(session.memenuhi) : null
  const tidakMemenuhiNum = session.tidak_memenuhi !== null && session.tidak_memenuhi !== undefined ? Number(session.tidak_memenuhi) : null

  const isExcel = isExcelOrigin(session)

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden modal-dialog-animated">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#175CD3] dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/50 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#175CD3] dark:text-blue-400 uppercase tracking-wider">
                Rincian Data Rekap Sesi CAT
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Sesi {session.sesi} • {session.instansi_nama || 'Instansi Peserta'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto clean-scrollbar flex-1">
          {/* Instansi & Pelaksanaan Info Banner */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {session.instansi_nama}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{session.tilok_nama || session.nama_tilok || 'Lab CAT BKN'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs shrink-0 pl-13 sm:pl-0">
              <div className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(session.period_date)}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Sesi Ke-{session.sesi} {session.created_by ? `• PIC: ${session.created_by}` : ''}
              </div>
            </div>
          </div>

          {/* 4-Card Bento Data Riil Sesi Ujian */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* Card 1: Persentase Kehadiran */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col justify-between">
              <div className={`${KPI_TYPOGRAPHY.label} text-emerald-700 dark:text-emerald-400`}>
                Persentase Kehadiran
              </div>
              <div className={`${KPI_TYPOGRAPHY.valueNumeric} text-emerald-700 dark:text-emerald-300 my-1.5`}>
                {pctHadir}%
              </div>
              <div className="text-xs font-medium text-emerald-600/90 dark:text-emerald-400">
                {formatNumber(hadirNum)} / {formatNumber(totalPeserta)} Hadir
              </div>
            </div>

            {/* Card 2: Tidak Hadir */}
            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 flex flex-col justify-between">
              <div className={`${KPI_TYPOGRAPHY.label} text-rose-700 dark:text-rose-400`}>
                Tidak Hadir
              </div>
              <div className={`${KPI_TYPOGRAPHY.valueNumeric} text-rose-700 dark:text-rose-300 my-1.5`}>
                {formatNumber(tidakHadirNum)}
              </div>
              <div className="text-xs font-medium text-rose-600/90 dark:text-rose-400">
                {tidakHadirNum === 0 ? 'Semua Hadir' : 'Peserta Absen'}
              </div>
            </div>

            {/* Card 3: Skor Terendah (Nilai Min) */}
            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
              <div className={`${KPI_TYPOGRAPHY.label} flex items-center justify-center gap-1`}>
                <TrendingDown className="w-3 h-3 text-slate-400" />
                <span>Skor Min</span>
              </div>
              <div className={`${KPI_TYPOGRAPHY.valueNumeric} text-slate-800 dark:text-slate-100 my-1.5`}>
                {skorMin}
              </div>
              <div className={KPI_TYPOGRAPHY.context}>Nilai Terendah</div>
            </div>

            {/* Card 4: Skor Tertinggi (Nilai Max) */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex flex-col justify-between">
              <div className={`${KPI_TYPOGRAPHY.label} text-[#175CD3] dark:text-blue-400 flex items-center justify-center gap-1`}>
                <TrendingUp className="w-3 h-3 text-[#175CD3]" />
                <span>Skor Max</span>
              </div>
              <div className={`${KPI_TYPOGRAPHY.valueNumeric} text-[#175CD3] dark:text-blue-300 my-1.5`}>
                {skorMax}
              </div>
              <div className="text-xs font-normal text-[#175CD3]/80 dark:text-blue-400">Nilai Tertinggi</div>
            </div>
          </div>

          {/* Rincian Parameter Lengkap Sesi */}
          <div className="border border-slate-200/70 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-850/70 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#175CD3]" />
                <span>Rekapitulasi Parameter Sesi Pelaksanaan</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {isExcel ? 'Sumber: Impor Berkas Excel' : 'Sumber: Entri Manual'}
              </span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Instansi Peserta</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{session.instansi_nama}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Titik Lokasi (Tilok)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{session.tilok_nama || session.nama_tilok || 'Lab CAT BKN'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Tanggal Sesi</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{formatDate(session.period_date)}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Nomor Sesi</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right">Sesi {session.sesi}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Total Alokasi / Kuota</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right tabular-nums">{formatNumber(totalPeserta)} Peserta</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Peserta Hadir</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                  {formatNumber(hadirNum)} Peserta ({pctHadir}%)
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Peserta Tidak Hadir</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-right tabular-nums">{formatNumber(tidakHadirNum)} Peserta</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Reschedule / Jadwal Ulang</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-right tabular-nums">{formatNumber(rescheduleNum)} Peserta</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Rentang Skor (Min - Max)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right font-mono tabular-nums">
                  {skorMin} s/d {skorMax}
                </span>
              </div>

              {memenuhiNum !== null && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Memenuhi Syarat (MS)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                    {formatNumber(memenuhiNum)} Peserta
                  </span>
                </div>
              )}

              {tidakMemenuhiNum !== null && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Tidak Memenuhi Syarat (TMS)</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-right tabular-nums">
                    {formatNumber(tidakMemenuhiNum)} Peserta
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Penanggung Jawab / PIC</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right">{session.created_by || 'PIC Tilok CAT'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Waktu Pencatatan</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300 text-right">
                  {session.created_at ? formatDate(session.created_at) : formatDate(session.period_date)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0 text-xs">
          <div className="text-slate-400 text-[11px]">
            Data rekap sesi ujian terverifikasi resmi pada sistem CAT BKN
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
