import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Camera, DoorOpen, AlertCircle, Plus, Check, Package } from 'lucide-react'
import { SearchableSelect } from '../../../../components/shared/SearchableSelect'
import { storeRoomData, fetchRoomAssets, fetchAvailableAssets } from '../../../../services/api/tuServicesApi'

const KANTOR_OPTIONS = [
  'Kantor Regional III BKN',
  'UPT BKN Serang',
  'UPT BKN Bandung',
]

const STATUS_OPTIONS = [
  { value: 'Tersedia', label: 'Tersedia', color: 'text-emerald-700 bg-emerald-50 border-emerald-200/60' },
  { value: 'Digunakan', label: 'Digunakan', color: 'text-amber-700 bg-amber-50 border-amber-200/60' },
  { value: 'Pemeliharaan', label: 'Pemeliharaan', color: 'text-rose-700 bg-rose-50 border-rose-200/60' },
  { value: 'Nonaktif', label: 'Nonaktif', color: 'text-slate-600 bg-slate-50 border-slate-200/60' },
]

const QUICK_FACILITIES = [
  'AC',
  'Proyektor Laser',
  'Smart TV 65 Inch',
  'Sound System & Wireless Mic',
  'Video Conference Camera',
  'Whiteboard Magnetik',
  'High Speed WiFi',
  'Podium Dinas',
  'PC Client CAT',
  'Kursi Ergonomis',
]

export function RoomFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  activeKantor = '',
}) {
  const [kantor, setKantor] = useState('Kantor Regional III BKN')
  const [kodeRuangan, setKodeRuangan] = useState('')
  const [namaRuangan, setNamaRuangan] = useState('')
  const [lantai, setLantai] = useState('Lantai 1')
  const [kapasitas, setKapasitas] = useState('30')
  const [status, setStatus] = useState('Tersedia')
  const [spesifikasi, setSpesifikasi] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState('')
  const [removeFoto, setRemoveFoto] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // State Inventaris Aset di Ruangan
  const [assignedAssets, setAssignedAssets] = useState([])
  const [availableAssets, setAvailableAssets] = useState([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)

  // Inisialisasi Data Form
  useEffect(() => {
    if (initialData) {
      setKantor(initialData.kantor || 'Kantor Regional III BKN')
      setKodeRuangan(initialData.kode_ruangan || '')
      setNamaRuangan(initialData.nama_ruangan || '')
      setLantai(initialData.lantai || 'Lantai 1')
      setKapasitas(String(initialData.kapasitas ?? 30))
      setStatus(initialData.status || 'Tersedia')
      setSpesifikasi(initialData.spesifikasi || '')
      setDeskripsi(initialData.deskripsi || '')
      setFotoPreview(initialData.foto_url || '')
      setRemoveFoto(false)

      // Muat aset yang saat ini berada di ruangan jika sedang Ubah Data
      if (initialData.id) {
        setIsLoadingAssets(true)
        fetchRoomAssets(initialData.id)
          .then((res) => {
            if (res?.status === 'success' && Array.isArray(res?.data)) {
              setAssignedAssets(res.data)
            } else {
              setAssignedAssets(initialData.assets || [])
            }
          })
          .catch((err) => {
            console.warn('Gagal memuat aset ruangan:', err)
            setAssignedAssets(initialData.assets || [])
          })
          .finally(() => setIsLoadingAssets(false))
      } else {
        setAssignedAssets([])
      }
    } else {
      const defaultKantor = (activeKantor && KANTOR_OPTIONS.includes(activeKantor))
        ? activeKantor
        : 'Kantor Regional III BKN'
      setKantor(defaultKantor)
      setKodeRuangan('')
      setNamaRuangan('')
      setLantai('Lantai 1')
      setKapasitas('30')
      setStatus('Tersedia')
      setSpesifikasi('')
      setDeskripsi('')
      setFoto(null)
      setFotoPreview('')
      setRemoveFoto(false)
      setAssignedAssets([])
    }
    setErrorMsg('')
  }, [initialData, isOpen, activeKantor])

  // Muat daftar aset yang tersedia di kantor terkait
  useEffect(() => {
    if (!isOpen) return
    setIsLoadingAvailable(true)
    fetchAvailableAssets(kantor)
      .then((list) => {
        if (Array.isArray(list)) {
          setAvailableAssets(list)
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat katalog aset tersedia:', err)
      })
      .finally(() => setIsLoadingAvailable(false))
  }, [isOpen, kantor])

  // Opsi aset yang dapat dipilih (tidak termasuk yang sudah ada di assignedAssets)
  const selectableAssetOptions = useMemo(() => {
    const assignedIds = new Set(assignedAssets.map((a) => String(a.id)))
    return availableAssets
      .filter((ast) => !assignedIds.has(String(ast.id)))
      .map((ast) => {
        const kodePrefix = ast.kode ? `[${ast.kode}] ` : ''
        const statusLoc = ast.assigned_room_name
          ? `(Sedang di: ${ast.assigned_room_name})`
          : '(Belum dialokasikan)'
        return {
          value: String(ast.id),
          label: `${kodePrefix}${ast.uraian} • ${Number(ast.qty || 1)} ${ast.satuan || 'Unit'} ${statusLoc}`,
          raw: ast,
        }
      })
  }, [availableAssets, assignedAssets])

  if (!isOpen) return null

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Ukuran file foto ruangan maksimal 5MB.')
        return
      }
      setFoto(file)
      setFotoPreview(URL.createObjectURL(file))
      setRemoveFoto(false)
    }
  }

  const handleRemovePhoto = () => {
    setFoto(null)
    setFotoPreview('')
    setRemoveFoto(true)
  }

  const handleToggleFacility = (item) => {
    const current = spesifikasi ? spesifikasi.split(',').map((s) => s.trim()).filter(Boolean) : []
    const idx = current.indexOf(item)
    if (idx >= 0) {
      current.splice(idx, 1)
    } else {
      current.push(item)
    }
    setSpesifikasi(current.join(', '))
  }

  const handleAddAsset = (selectedOption) => {
    if (!selectedOption) return
    const assetId = selectedOption.value ?? selectedOption.id
    const item = availableAssets.find((a) => String(a.id) === String(assetId))
    if (item && !assignedAssets.some((a) => String(a.id) === String(item.id))) {
      setAssignedAssets((prev) => [...prev, item])
    }
  }

  const handleRemoveAsset = (assetId) => {
    setAssignedAssets((prev) => prev.filter((a) => String(a.id) !== String(assetId)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!namaRuangan.trim()) {
      setErrorMsg('Nama ruangan wajib diisi.')
      return
    }
    if (!kantor) {
      setErrorMsg('Kantor penempatan ruangan wajib dipilih.')
      return
    }
    const numKapasitas = Number(kapasitas)
    if (isNaN(numKapasitas) || numKapasitas < 0) {
      setErrorMsg('Kapasitas ruangan harus berupa angka yang valid.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const fd = new FormData()
      if (initialData?.id) {
        fd.append('id', initialData.id)
      }
      fd.append('nama_ruangan', namaRuangan.trim())
      fd.append('kode_ruangan', kodeRuangan.trim())
      fd.append('kantor', kantor)
      fd.append('lantai', lantai.trim())
      fd.append('kapasitas', numKapasitas)
      fd.append('status', status)
      fd.append('spesifikasi', spesifikasi.trim())
      fd.append('deskripsi', deskripsi.trim())

      // Kirim array ID aset yang dialokasikan ke ruangan ini
      fd.append('asset_ids', assignedAssets.map((a) => a.id).join(','))

      if (foto) {
        fd.append('foto', foto)
      }
      if (removeFoto) {
        fd.append('remove_foto', '1')
      }

      const res = await storeRoomData(fd)
      if (res?.status === 'success') {
        onSuccess?.(res)
        onClose()
      } else {
        setErrorMsg(res?.message || 'Gagal menyimpan data ruangan.')
      }
    } catch (err) {
      console.error('Error saving room data:', err)
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat menyimpan data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? 'Ubah Data Ruangan' : 'Input Data Ruangan Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Layanan Tata Usaha • Pengelolaan Sarana Ruangan & Aset Kantor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto clean-scrollbar p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200/80 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Baris 1: Kantor & Kode Ruangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Kantor Penempatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={kantor}
                onChange={(e) => setKantor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                required
              >
                {KANTOR_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Kode Ruangan
              </label>
              <input
                type="text"
                value={kodeRuangan}
                onChange={(e) => setKodeRuangan(e.target.value.toUpperCase())}
                placeholder="Otomatis (contoh: K3-RP-01)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
            </div>
          </div>

          {/* Baris 2: Nama Ruangan & Lantai */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Nama Ruangan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={namaRuangan}
                onChange={(e) => setNamaRuangan(e.target.value)}
                placeholder="Contoh: Ruang Rapat Tangkuban Parahu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Lantai
              </label>
              <input
                type="text"
                value={lantai}
                onChange={(e) => setLantai(e.target.value)}
                placeholder="Lantai 1, 2, dll."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
            </div>
          </div>

          {/* Baris 3: Kapasitas & Status Kesiapan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Kapasitas Peserta (Orang) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={kapasitas}
                onChange={(e) => setKapasitas(e.target.value)}
                placeholder="30"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Status Ruangan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 4: Fasilitas & Sarana Cepat */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Fasilitas & Sarana Ruangan
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FACILITIES.map((fac) => {
                const current = spesifikasi ? spesifikasi.split(',').map((s) => s.trim()) : []
                const isSelected = current.includes(fac)
                return (
                  <button
                    key={fac}
                    type="button"
                    onClick={() => handleToggleFacility(fac)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-50 text-[#175CD3] border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {isSelected ? `✓ ${fac}` : `+ ${fac}`}
                  </button>
                )
              })}
            </div>
            <input
              type="text"
              value={spesifikasi}
              onChange={(e) => setSpesifikasi(e.target.value)}
              placeholder="Atau ketik sarana dipisahkan dengan koma (contoh: AC, Sound System, Proyektor Laser)..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
            />
          </div>

          {/* Baris 5: Upload Foto Ruangan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Foto Ruangan
            </label>
            <div className="flex items-start gap-4">
              {fotoPreview ? (
                <div className="relative w-28 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 group">
                  <img
                    src={fotoPreview}
                    alt="Preview Ruangan"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer text-xs font-semibold gap-1"
                  >
                    <X className="w-4 h-4" /> Hapus
                  </button>
                </div>
              ) : (
                <div className="w-28 h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-slate-50 dark:bg-slate-800/40">
                  <Camera className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-[10px]">Tanpa Foto</span>
                </div>
              )}
              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  id="foto-ruangan-input"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="foto-ruangan-input"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
                >
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>{fotoPreview ? 'Ganti Foto Ruangan' : 'Pilih Foto Ruangan'}</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Format gambar JPG, PNG, atau WebP. Maksimal ukuran berkas 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Baris 6: Deskripsi / Catatan Tambahan */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Deskripsi & Catatan Tambahan
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Keterangan peruntukan ruangan, jadwal operasional, atau instruksi penggunaan..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
            />
          </div>

          {/* Baris 7: SECTION INVENTARIS ASET DI RUANGAN */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Inventaris Aset di Ruangan
                </label>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Total: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{assignedAssets.length}</span> item
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cari dan pilih aset BMN terdaftar di <span className="font-semibold text-slate-700 dark:text-slate-300">{kantor}</span> untuk ditempatkan di ruangan ini. Kuantitas otomatis berlandaskan master data aset.
            </p>

            {/* Selector berbasis react-select */}
            <div>
              <SearchableSelect
                options={selectableAssetOptions}
                value=""
                onChange={handleAddAsset}
                placeholder={`-- Cari dan tambah aset BMN (${selectableAssetOptions.length} tersedia) --`}
                isLoading={isLoadingAvailable}
                noOptionsText="Tidak ada aset yang dapat ditambahkan"
                isClearable
              />
            </div>

            {/* List Aset Terpilih */}
            {isLoadingAssets ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#175CD3]" />
                <span>Memuat data aset yang dialokasikan...</span>
              </div>
            ) : assignedAssets.length > 0 ? (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                {assignedAssets.map((ast, idx) => (
                  <div
                    key={ast.id || idx}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="w-5 text-center text-xs text-slate-400 font-medium shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {ast.uraian}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          {ast.kode ? `[${ast.kode}] ` : ''}
                          {ast.subcode ? `• NUP: ${ast.subcode} ` : ''}
                          • {ast.category_name || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 font-mono">
                        {Number(ast.qty || 1)} {ast.satuan || 'Unit'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAsset(ast.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Hapus dari alokasi ruangan ini"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 text-slate-400 text-xs">
                Belum ada aset yang dialokasikan ke ruangan ini. Gunakan kolom pencarian di atas untuk menambahkan.
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{initialData ? 'Perbarui Ruangan' : 'Simpan Ruangan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
