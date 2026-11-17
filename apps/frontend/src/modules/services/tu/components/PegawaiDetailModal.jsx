import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function PegawaiDetailModal({ isOpen, onClose, data }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  const isAktif = data.is_status === 1 || data.is_status === '1' || data.is_status === true

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-sm">
              {(data.nama || 'A').slice(0, 1)}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Rincian Profil Pegawai
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                NIP. {data.nip}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto clean-scrollbar text-xs">
          {/* Status Badge Strip */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold">Status Dinas & Kepegawaian</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {data.status_pegawai || 'PNS'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isAktif
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span>{isAktif ? 'Pegawai Aktif' : 'Nonaktif'}</span>
              </span>
              {data.status_bup && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400">
                  {data.status_bup}
                </span>
              )}
            </div>
          </div>

          {/* Section 1: Data Pokok */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
              1. Identitas Pokok & Biodata
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Lengkap & Gelar</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{data.nama}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nomor Induk Pegawai (NIP)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{data.nip}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Jenis Kelamin</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {data.gender == 1 || data.gender === 'Laki-laki' ? 'Laki-laki (Pria)' : 'Perempuan (Wanita)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tanggal Lahir / Generasi</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(data.tgl_lahir)} {data.generasi ? `(${data.generasi})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status Pernikahan</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.menikah || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Agama</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.agama || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Pendidikan Terakhir</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.pendidikan || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Penempatan & Jabatan */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
              2. Unit Kerja & Jabatan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[11px] mb-1">Unit Kerja / Tim Kerja</span>
                {data.unit_kerja ? (
                  <div className="flex flex-wrap gap-1.5">
                    {data.unit_kerja.split(',').map((uk, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60"
                      >
                        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>{uk.trim()}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-bold text-slate-800 dark:text-slate-100">-</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Unit SK Induk</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{data.unit_sk || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Jabatan</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{data.jabatan || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Jenis Jabatan</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{data.jenis_jabatan || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Kepangkatan & Kontak */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
              3. Kepangkatan & Kontak Dinas
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Golongan Ruang & Pangkat</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {data.golongan ? `Gol. ${data.golongan}` : '-'} {data.pangkat ? `(${data.pangkat})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">TMT Golongan</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(data.tmt_gol)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nomor Telepon / WhatsApp</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{data.phone || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email Resmi</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{data.email || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
