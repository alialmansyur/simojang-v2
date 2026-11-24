import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Package,
  MapPin,
  Pencil,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

export function AssetDetailModal({ isOpen, onClose, data, onEdit }) {
  const [activeTab, setActiveTab] = useState('informasi')

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0))
  }

  const kondisiBadge = () => {
    if (data.kondisi === 'Rusak Ringan') {
      return {
        cls: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
        icon: AlertTriangle,
      }
    }
    if (data.kondisi === 'Rusak Berat') {
      return {
        cls: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
        icon: AlertTriangle,
      }
    }
    return {
      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
      icon: CheckCircle2,
    }
  }

  const badgeInfo = kondisiBadge()
  const KondisiIcon = badgeInfo.icon
  const photoUrl =
    data.foto_url ||
    (data.foto
      ? data.foto.startsWith('/') || data.foto.startsWith('http')
        ? data.foto
        : `/media/assets/${data.foto}`
      : null)

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                  {data.uraian || 'Rincian Aset BMN'}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeInfo.cls}`}>
                  <KondisiIcon className="w-3 h-3" />
                  {data.kondisi || 'Baik'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Kode BMN: <span className="font-semibold text-slate-800 dark:text-slate-200">{data.kode}</span> • NUP: <span className="font-semibold text-slate-800 dark:text-slate-200">{data.subcode || '-'}</span>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 gap-6 text-xs font-semibold shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('informasi')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'informasi'
                ? 'border-[#175CD3] text-[#175CD3] dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Spesifikasi & Nilai
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('foto')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'foto'
                ? 'border-[#175CD3] text-[#175CD3] dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Foto Fisik Resolusi Penuh
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto clean-scrollbar text-xs">
          {activeTab === 'informasi' && (
            <div className="space-y-4">
              {/* Bento Grid KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 font-semibold block">Nilai Perolehan</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                    {formatRupiah(data.nilai_perolehan)}
                  </span>
                  <span className="text-[10px] text-slate-400">Kapitalisasi BMN</span>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 font-semibold block">Kuantitas / Jumlah</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                    {data.qty || 1} {data.satuan || 'Unit'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Tercatat di SIMAK</span>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 font-semibold block">Tahun Perolehan</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {data.tahun_perolehan || '-'}
                  </span>
                  <span className="text-[10px] text-slate-400">Tahun Anggaran DIPA</span>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 font-semibold block">Kategori Aset</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5 block">
                    {data.category_name || data.kategori || 'Peralatan & Mesin'}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Klasifikasi BMN</span>
                </div>
              </div>

              {/* Detail Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolom Kiri: Spesifikasi & Fisik */}
                <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    <span>Spesifikasi Fisik Barang</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Merk / Tipe Pabrikan:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{data.merk || data.tipe || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Nomor Seri / Pabrik:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{data.no_seri || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Ukuran / Kapasitas:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{data.ukuran || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Keterangan / Spesifikasi:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[200px] text-right truncate">
                        {data.keterangan || 'Tidak ada catatan teknis'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Penanggung Jawab & Lokasi */}
                <div className="p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Penanggung Jawab & Lokasi Penempatan</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Pemegang / PIC:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{data.pic || data.penanggung_jawab || 'Pengelola BMN'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Ruangan Kantor:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {data.nama_ruangan ? `${data.nama_ruangan} ${data.kode_ruangan ? `(${data.kode_ruangan})` : ''}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Lokasi Penempatan:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{data.lokasi || 'Gedung Kanreg III'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Area Wilayah:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{data.area || 'Kantor Regional III BKN'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Unit Satker:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Kanreg III BKN Bandung (401928)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'foto' && (
            <div className="space-y-4">
              {photoUrl ? (
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-black max-h-[500px] flex items-center justify-center shadow-lg">
                    <img
                      src={photoUrl}
                      alt={data.uraian}
                      className="w-full h-full object-contain max-h-[480px]"
                    />
                  </div>
                  <p className="text-center text-slate-400 text-[11px]">
                    Foto dokumentasi fisik BMN Kanreg III BKN Bandung
                  </p>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 space-y-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <ImageIcon className="w-12 h-12 stroke-[1.2] mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">
                    Belum ada foto fisik barang
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Gunakan tombol Ubah Data untuk mengunggah foto dokumentasi aset.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <div className="text-[11px] text-slate-400">
            Terakhir diupdate: <span className="font-semibold text-slate-600 dark:text-slate-300">{data.updated_at ? new Date(data.updated_at).toLocaleDateString('id-ID') : 'Terkini'}</span>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEdit(data)
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-all active:scale-95 cursor-pointer text-xs shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5 text-[#175CD3]" />
                <span>Ubah Data</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all active:scale-95 cursor-pointer text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AssetDetailModal
