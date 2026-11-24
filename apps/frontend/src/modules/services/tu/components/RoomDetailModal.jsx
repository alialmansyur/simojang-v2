import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  DoorOpen,
  MapPin,
  Pencil,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Users,
  Layers,
  Package,
  Info,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { SearchableSelect } from '../../../../components/shared/SearchableSelect'
import {
  fetchRoomAssets,
  fetchAvailableAssets,
  assignAssetToRoom,
  unassignAssetFromRoom,
} from '../../../../services/api/tuServicesApi'

export function RoomDetailModal({ isOpen, onClose, data, onEdit, onSuccess }) {
  const [activeTab, setActiveTab] = useState('informasi')
  const [assets, setAssets] = useState([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)

  // State Alokasi Aset
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [availableAssets, setAvailableAssets] = useState([])
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false)
  const [unassigningAssetId, setUnassigningAssetId] = useState(null)
  const [actionError, setActionError] = useState('')

  // Load assets in this room
  const loadAssets = useCallback(async () => {
    if (!data?.id) return
    setIsLoadingAssets(true)
    try {
      const res = await fetchRoomAssets(data.id)
      if (res?.status === 'success' && Array.isArray(res?.data)) {
        setAssets(res.data)
      } else {
        setAssets(data.assets || [])
      }
    } catch (err) {
      console.warn('Failed to fetch room assets:', err)
      setAssets(data?.assets || [])
    } finally {
      setIsLoadingAssets(false)
    }
  }, [data?.id, data?.assets])

  // Load available assets for selection
  const loadAvailableList = useCallback(async () => {
    setIsLoadingAvailable(true)
    try {
      const list = await fetchAvailableAssets(data?.kantor || null)
      if (Array.isArray(list)) {
        setAvailableAssets(list)
      }
    } catch (err) {
      console.warn('Failed to fetch available assets:', err)
    } finally {
      setIsLoadingAvailable(false)
    }
  }, [data?.kantor])

  useEffect(() => {
    if (isOpen && data?.id) {
      loadAssets()
    }
  }, [isOpen, data?.id, loadAssets])

  useEffect(() => {
    if (isAssignOpen) {
      loadAvailableList()
    }
  }, [isAssignOpen, loadAvailableList])

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Tersedia':
        return {
          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
          icon: CheckCircle2,
        }
      case 'Digunakan':
        return {
          cls: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
          icon: AlertTriangle,
        }
      case 'Pemeliharaan':
        return {
          cls: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
          icon: AlertTriangle,
        }
      default:
        return {
          cls: 'bg-slate-50 text-slate-600 border-slate-200/60 dark:bg-slate-800 dark:text-slate-400',
          icon: Info,
        }
    }
  }

  const statusBadge = getStatusBadge(data.status)
  const StatusIcon = statusBadge.icon

  const specsList = data.spesifikasi
    ? data.spesifikasi.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const photoUrl =
    data.foto_url ||
    (data.foto
      ? data.foto.startsWith('/') || data.foto.startsWith('http')
        ? data.foto
        : `/media/ruangan/${data.foto}`
      : null)

  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null
    return availableAssets.find((a) => String(a.id) === String(selectedAssetId))
  }, [availableAssets, selectedAssetId])

  const assetOptions = useMemo(() => {
    return availableAssets.map((ast) => {
      const kodePrefix = ast.kode ? `[${ast.kode}] ` : ''
      const statusLoc = ast.assigned_room_name
        ? `(Sedang di: ${ast.assigned_room_name})`
        : '(Belum ditempatkan)'
      return {
        value: String(ast.id),
        label: `${kodePrefix}${ast.uraian} • ${Number(ast.qty || 1)} ${ast.satuan || 'Unit'} ${statusLoc}`,
        raw: ast,
      }
    })
  }, [availableAssets])

  // Handler: Assign Aset ke Ruangan
  const handleAssignSubmit = async () => {
    if (!selectedAssetId || !data?.id) return
    setIsSubmittingAssign(true)
    setActionError('')
    try {
      const res = await assignAssetToRoom(selectedAssetId, data.id)
      if (res?.status === 'success') {
        setSelectedAssetId('')
        setIsAssignOpen(false)
        await loadAssets()
        await loadAvailableList()
        onSuccess?.()
      } else {
        setActionError(res?.message || 'Gagal mengalokasikan aset ke ruangan.')
      }
    } catch (err) {
      setActionError(err.message || 'Terjadi kesalahan sistem saat mengalokasikan aset.')
    } finally {
      setIsSubmittingAssign(false)
    }
  }

  // Handler: Lepas Aset dari Ruangan
  const handleUnassign = async (asset) => {
    if (!window.confirm(`Lepas aset "${asset.uraian}" dari ruangan ini?`)) return
    setUnassigningAssetId(asset.id)
    setActionError('')
    try {
      const res = await unassignAssetFromRoom(asset.id)
      if (res?.status === 'success') {
        await loadAssets()
        await loadAvailableList()
        onSuccess?.()
      } else {
        setActionError(res?.message || 'Gagal melepas aset dari ruangan.')
      }
    } catch (err) {
      setActionError(err.message || 'Terjadi kesalahan saat melepas aset.')
    } finally {
      setUnassigningAssetId(null)
    }
  }

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
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                  {data.nama_ruangan}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.cls}`}>
                  <StatusIcon className="w-3 h-3" />
                  {data.status || 'Tersedia'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Kode: <span className="font-semibold text-slate-800 dark:text-slate-200">{data.kode_ruangan || '-'}</span> • {data.kantor} • {data.lantai || '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEdit(data)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5 text-[#175CD3]" />
                <span>Ubah</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('informasi')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'informasi'
                ? 'border-[#175CD3] text-[#175CD3] dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Informasi & Spesifikasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('aset')}
            className={`inline-flex items-center gap-1.5 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'aset'
                ? 'border-[#175CD3] text-[#175CD3] dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Inventaris Aset di Ruangan</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold">
              {assets.length}
            </span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto clean-scrollbar p-6">
          {activeTab === 'informasi' ? (
            <div className="space-y-6">
              {/* Foto & Metrik Cepat */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Foto Ruangan */}
                <div className="md:col-span-5">
                  {photoUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-video md:aspect-4/3 relative group shadow-2xs">
                      <img
                        src={photoUrl}
                        alt={data.nama_ruangan}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 aspect-video md:aspect-4/3 flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
                      <span className="text-xs font-medium">Foto ruangan belum diunggah</span>
                    </div>
                  )}
                </div>

                {/* 3 Quick Highlight Cards */}
                <div className="md:col-span-7 flex flex-col justify-between gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Kapasitas Daya Tampung</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {data.kapasitas}{' '}
                        <span className="text-xs font-normal text-slate-500">Orang / Kursi</span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                        <Package className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Total Aset BMN</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {assets.length}{' '}
                        <span className="text-xs font-normal text-slate-500">Item Terpasang</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kantor & Lantai</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {data.kantor}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {data.lantai ? `Posisi: ${data.lantai}` : 'Lantai tidak dispesifikasikan'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fasilitas & Spesifikasi Ruangan (Sparkles Dihilangkan) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Fasilitas & Sarana Spesifikasi</span>
                </h3>
                {specsList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {specsList.map((spec, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{spec}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Belum ada data fasilitas atau spesifikasi yang didaftarkan.
                  </p>
                )}
              </div>

              {/* Deskripsi & Catatan Penggunaan */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Deskripsi & Peruntukan Ruangan
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                  {data.deskripsi || 'Tidak ada catatan tambahan untuk ruangan ini.'}
                </p>
              </div>
            </div>
          ) : (
            /* Tab: Daftar Aset BMN di Ruangan & Fitur Alokasi */
            <div className="space-y-4">
              {/* Header Tab Aset & Tombol Alokasi */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Daftar Inventaris Aset Terdata di {data.nama_ruangan}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aset BMN yang terpetakan berada di dalam ruangan ini secara relasional.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Total: <span className="font-bold text-indigo-600">{assets.length}</span> item
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssignOpen(!isAssignOpen)
                      setActionError('')
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#175CD3] hover:bg-[#1550b8] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAssignOpen ? 'Tutup Panel' : 'Alokasikan Aset'}</span>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Panel Form Alokasikan Aset Baru ke Ruangan */}
              {isAssignOpen && (
                <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-indigo-200/80 dark:border-indigo-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        +
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Alokasikan Aset Terdaftar ke Ruangan Ini
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Pilih dari master aset BMN
                    </span>
                  </div>

                  {isLoadingAvailable ? (
                    <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-[#175CD3]" />
                      <span>Memuat katalog aset BMN...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Cari & Pilih Aset BMN
                        </label>
                        <SearchableSelect
                          options={assetOptions}
                          value={selectedAssetId}
                          onChange={(val) => {
                            const rawVal = val ? String(val.value ?? val) : ''
                            setSelectedAssetId(rawVal)
                            setActionError('')
                          }}
                          placeholder={`-- Ketik untuk mencari aset (${availableAssets.length} item tersedia) --`}
                          isLoading={isLoadingAvailable}
                          noOptionsText="Tidak ada aset yang cocok dengan kata kunci"
                          isClearable
                        />
                      </div>

                      {/* Detail Pratinjau Aset Terpilih (QTY Terkunci Sesuai Master Data) */}
                      {selectedAsset && (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {selectedAsset.uraian}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                Kode BMN: {selectedAsset.kode || '-'} • NUP: {selectedAsset.subcode || '-'} • Kategori: {selectedAsset.category_name || '-'}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                              {selectedAsset.kondisi || 'Baik'}
                            </span>
                          </div>

                          {/* Kuantitas Berlandaskan Data Aset */}
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40">
                            <div>
                              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                                <Package className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Kuantitas Aset</span>
                              </span>
                              <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400">
                                Berlandaskan master data aset terdaftar
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300 font-mono">
                                {Number(selectedAsset.qty || 1)} {selectedAsset.satuan || 'Unit'}
                              </span>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {formatRupiah(selectedAsset.nilai_perolehan)}
                              </p>
                            </div>
                          </div>

                          {selectedAsset.assigned_room_name && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Catatan: Aset ini saat ini tercatat di ruangan "{selectedAsset.assigned_room_name}". Menyimpan akan memindahkan alokasi ke ruangan ini.</span>
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssetId('')
                                setIsAssignOpen(false)
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAssign}
                              onClick={handleAssignSubmit}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#175CD3] hover:bg-[#1550b8] text-white text-xs font-bold transition-all disabled:opacity-60 cursor-pointer shadow-2xs"
                            >
                              {isSubmittingAssign && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              <span>Alokasikan ke Ruangan</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tabel Daftar Aset di Ruangan */}
              {isLoadingAssets ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#175CD3]" />
                  <span className="text-xs font-medium">Memuat data aset ruangan...</span>
                </div>
              ) : assets.length > 0 ? (
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-12 text-center">NO</th>
                        <th className="py-2.5 px-3">KODE & URAIAN ASET</th>
                        <th className="py-2.5 px-3">KATEGORI</th>
                        <th className="py-2.5 px-3 text-center">QTY</th>
                        <th className="py-2.5 px-3">KONDISI</th>
                        <th className="py-2.5 px-3 text-right">NILAI PEROLEHAN</th>
                        <th className="py-2.5 px-3 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {assets.map((ast, idx) => (
                        <tr key={ast.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {ast.uraian}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Kode: {ast.kode || '-'} {ast.subcode ? `• NUP: ${ast.subcode}` : ''}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {ast.category_name || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                            {Number(ast.qty || 1)} {ast.satuan || ''}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                ast.kondisi === 'Baik'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                    : ast.kondisi === 'Rusak Ringan'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                                    : 'bg-rose-50 text-rose-700 border-rose-200/60'
                              }`}
                            >
                              {ast.kondisi || 'Baik'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300 font-mono">
                            {formatRupiah(ast.nilai_perolehan)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              disabled={unassigningAssetId === ast.id}
                              onClick={() => handleUnassign(ast)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Lepas aset dari ruangan ini"
                            >
                              {unassigningAssetId === ast.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-slate-800 text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Belum ada aset BMN yang dialokasikan ke ruangan ini.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Gunakan tombol <span className="font-bold text-[#175CD3]">"Alokasikan Aset"</span> di atas untuk memilih aset terdaftar, atau tentukan ruangan pada form Manajemen Aset.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
