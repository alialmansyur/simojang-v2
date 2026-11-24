import { useState } from 'react'
import {
  DoorOpen,
  Users,
  CheckCircle2,
  Package,
  Layers,
  MapPin,
  Pencil,
  Trash2,
  Eye,
  Camera,
  AlertTriangle,
} from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { RoomFormModal } from './components/RoomFormModal'
import { RoomDetailModal } from './components/RoomDetailModal'
import {
  fetchRoomsSummary,
  fetchRoomsData,
  deleteRoomData,
} from '../../../services/api/tuServicesApi'

const KANTOR_CATEGORIES = [
  { value: 'Kantor Regional III BKN', label: 'Kantor Regional III BKN' },
  { value: 'UPT BKN Serang', label: 'UPT BKN Serang' },
  { value: 'UPT BKN Bandung', label: 'UPT BKN Bandung' },
]

export default function ManageRuanganPage() {
  const [previewImage, setPreviewImage] = useState(null)

  // 4 Bento KPI Cards Sesuai SSOT
  const renderKpis = (summary) => [
    {
      id: 'total_ruangan',
      label: 'TOTAL RUANGAN',
      value: summary?.total_ruangan ?? summary?.total_data ?? 0,
      unit: 'Ruangan',
      context: 'Terdata di seluruh kantor',
      badge: 'Direktori Aktif',
      badgeColor: 'blue',
      icon: DoorOpen,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_kapasitas',
      label: 'TOTAL KAPASITAS',
      value: summary?.total_kapasitas ?? 0,
      unit: 'Orang',
      context: 'Akumulasi daya tampung peserta',
      badge: 'Daya Tampung',
      badgeColor: 'amber',
      icon: Users,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'ruangan_tersedia',
      label: 'RUANGAN TERSEDIA',
      value: summary?.ruangan_tersedia ?? 0,
      unit: 'Ruangan',
      context: 'Status siap digunakan',
      badge: 'Siap Pakai',
      badgeColor: 'emerald',
      icon: CheckCircle2,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_assets',
      label: 'ASET DI RUANGAN',
      value: summary?.total_assets ?? 0,
      unit: 'Item',
      context: 'Aset BMN terpetakan',
      badge: 'BMN Terpasang',
      badgeColor: 'sky',
      icon: Package,
      iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    },
  ]

  // Definisi Kolom Tabel (menggunakan header dan className agar sesuai TuCrudLayoutShell)
  const columns = [
    { header: 'NO', width: 'w-14', className: 'text-center' },
    { header: 'RUANGAN & FOTO' },
    { header: 'KANTOR & LANTAI' },
    { header: 'KAPASITAS', className: 'text-center' },
    { header: 'SPESIFIKASI & FASILITAS' },
    { header: 'ASET BMN', className: 'text-center' },
    { header: 'STATUS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  // Render Baris Data Sesuai SSOT
  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const photoUrl =
      item.foto_url ||
      (item.foto
        ? item.foto.startsWith('/') || item.foto.startsWith('http')
          ? item.foto
          : `/media/ruangan/${item.foto}`
        : null)

    const specs = item.spesifikasi
      ? item.spesifikasi.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const getStatusStyle = (st) => {
      switch (st) {
        case 'Tersedia':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
        case 'Digunakan':
          return 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
        case 'Pemeliharaan':
          return 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300'
        default:
          return 'bg-slate-50 text-slate-600 border-slate-200/60 dark:bg-slate-800 dark:text-slate-400'
      }
    }

    return (
      <tr
        key={item.id || item.uid || rowNo}
        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800/50"
      >
        {/* Kolom 1: No */}
        <td className="py-3 px-3.5 text-center text-xs text-slate-400 font-medium">
          {rowNo}
        </td>

        {/* Kolom 2: Ruangan & Foto */}
        <td className="py-3 px-3.5">
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <button
                type="button"
                onClick={() => setPreviewImage(photoUrl)}
                className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700 shrink-0 bg-slate-100 hover:opacity-90 transition-opacity cursor-pointer group"
                title="Klik untuk memperbesar foto"
              >
                <img
                  src={photoUrl}
                  alt={item.nama_ruangan}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </button>
            ) : (
              <div className="w-12 h-12 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 shrink-0 bg-slate-50 dark:bg-slate-800/40">
                <Camera className="w-4 h-4 mb-0.5" />
                <span className="text-[9px]">Foto</span>
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                {item.nama_ruangan}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Kode: <span className="text-slate-600 dark:text-slate-300 font-semibold">{item.kode_ruangan || '-'}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 3: Kantor & Lantai */}
        <td className="py-3 px-3.5">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {item.kantor}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{item.lantai || 'Lantai 1'}</span>
          </div>
        </td>

        {/* Kolom 4: Kapasitas */}
        <td className="py-3 px-3.5 text-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/60 dark:border-blue-900/40">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>{item.kapasitas} Org</span>
          </span>
        </td>

        {/* Kolom 5: Spesifikasi & Fasilitas */}
        <td className="py-3 px-3.5 max-w-xs">
          {specs.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {specs.slice(0, 3).map((sp, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium border border-slate-200/60 dark:border-slate-700 truncate max-w-[130px]"
                >
                  {sp}
                </span>
              ))}
              {specs.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200/60">
                  +{specs.length - 3} lainnya
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 text-xs italic">Standar kantor</span>
          )}
        </td>

        {/* Kolom 6: Jumlah Aset BMN */}
        <td className="py-3 px-3.5 text-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
            <Package className="w-3 h-3 text-indigo-500" />
            <span>{item.total_assets ?? 0} Item</span>
          </span>
        </td>

        {/* Kolom 7: Status */}
        <td className="py-3 px-3.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(
              item.status
            )}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                item.status === 'Tersedia'
                  ? 'bg-emerald-500'
                  : item.status === 'Digunakan'
                  ? 'bg-amber-500'
                  : item.status === 'Pemeliharaan'
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
              }`}
            />
            <span>{item.status || 'Tersedia'}</span>
          </span>
        </td>

        {/* Kolom 8: Aksi SSOT */}
        <td className="py-3 px-3.5">
          <div className="flex items-center justify-end gap-1.5">
            {/* 1. Detail / Rincian (Eye - Indigo) */}
            <button
              type="button"
              onClick={() => onViewDetail && onViewDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail & Aset Ruangan"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* 2. Ubah / Edit (Pencil - Biru BKN #175CD3) */}
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              title="Ubah Data Ruangan"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* 3. Hapus (Trash2 - Rose) */}
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Ruangan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      <TuCrudLayoutShell
        layananId={59}
        serviceTitle="Manajemen Ruangan"
        shortTitle="Ruangan"
        description="Direktori pengelolaan ruangan kantor, kapasitas peserta, spesifikasi sarana, foto fasilitas, dan pemetaan inventaris aset di dalamnya."
        timKerjaTitle="Tata Usaha"
        timKerjaPath="/tim-kerja/tu"
        fetchSummaryFn={fetchRoomsSummary}
        fetchDataFn={fetchRoomsData}
        deleteDataFn={deleteRoomData}
        renderKpis={renderKpis}
        columns={columns}
        renderRow={renderRow}
        FormComponent={RoomFormModal}
        DetailModalComponent={RoomDetailModal}
        categories={KANTOR_CATEGORIES}
        defaultCategory="all"
        searchPlaceholder="Cari nama ruangan, kode, lantai..."
        addNewLabel="Input Data"
        showMonthFilter={false}
      />

      {/* Modal Preview Foto Besar */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs modal-backdrop-animated"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl modal-dialog-animated">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Preview Besar Ruangan"
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}
