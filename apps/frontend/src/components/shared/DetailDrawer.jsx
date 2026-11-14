import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, User, Building, Calendar, Tag } from 'lucide-react'

export function DetailDrawer({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end modal-backdrop-animated">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-[#EAECF0] dark:border-slate-800 shadow-2xl flex flex-col h-full"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EAECF0] dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF2FC] dark:bg-[#123B73]/30 border border-[#175CD3]/20 dark:border-[#175CD3]/40 flex items-center justify-center text-[#123B73] dark:text-[#93C5FD]">
              <User className="w-5 h-5 text-[#175CD3]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Rincian Usul Layanan
              </h3>
              <p className="text-xs text-[#123B73] dark:text-[#93C5FD] mt-0.5 font-mono font-bold">
                NIP: {data.nip || '-'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
          {/* Status Badge Block */}
          <div className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-slate-800/60 border border-[#EAECF0] dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status Verifikasi</div>
              <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{data.status || 'Diproses'}</div>
            </div>
            <span className={`px-2.5 py-1 text-xs font-black rounded-full border ${
              data.status?.toLowerCase().includes('selesai') || data.status?.toLowerCase().includes('valid') || data.status?.toLowerCase().includes('disetujui')
                ? 'bg-[#ECFDF3] text-[#067647] border-[#A6F4C5] dark:bg-[#067647]/20 dark:text-[#75E0A7]'
                : data.status?.toLowerCase().includes('bts') || data.status?.toLowerCase().includes('tolak')
                ? 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA] dark:bg-[#B42318]/20 dark:text-[#FDA29B]'
                : 'bg-[#FFFAEB] text-[#B54708] border-[#FEDF89] dark:bg-[#B54708]/20 dark:text-[#FEC84B]'
            }`}>
              {data.status || 'Menunggu'}
            </span>
          </div>

          {/* Details list */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-400">Nama Lengkap ASN</div>
              <div className="text-sm font-bold text-slate-800 dark:text-white mt-1">{data.nama || '-'}</div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="text-xs font-semibold text-slate-400">Instansi Pengusul</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {data.instansi || '-'}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="text-xs font-semibold text-slate-400">Jabatan / Golongan</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {data.jabatan || data.golongan || '-'}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="text-xs font-semibold text-slate-400">Nomor Berkas / Surat Usul</div>
              <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 mt-1">
                {data.nomorSk || data.nomorUsul || '800/120/BKPSDM/2026'}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="text-xs font-semibold text-slate-400">Tanggal Pengajuan</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {data.tanggal || data.tanggalUsul || '27 Okt 2026'}
              </div>
            </div>

            {data.keterangan && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="text-xs font-semibold text-slate-400">Catatan Tambahan</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  {data.keterangan}
                </div>
              </div>
            )}
          </div>

          {/* Audit Timeline */}
          <div className="border-t border-[#EAECF0] dark:border-slate-800 pt-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Riwayat Perjalanan Berkas
            </div>
            <div className="space-y-3 pl-2 border-l-2 border-[#175CD3]/30 dark:border-[#175CD3]/40">
              <div className="relative pl-4">
                <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-[#123B73]" />
                <div className="text-xs font-bold text-slate-800 dark:text-white">Berkas Diunggah ke Sistem</div>
                <div className="text-[11px] text-slate-400">Oleh Admin BKPSDM Instansi Pengusul</div>
              </div>
              <div className="relative pl-4">
                <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-[#175CD3]" />
                <div className="text-xs font-bold text-slate-800 dark:text-white">Verifikasi Teknis Berkas</div>
                <div className="text-[11px] text-slate-400">Tim Kerja Kanreg III BKN Bandung</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
