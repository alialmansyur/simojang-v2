import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Camera, Package, AlertCircle } from 'lucide-react'
import { storeAssetData, fetchAssetCategories } from '../../../../services/api/tuServicesApi'

export function AssetFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  categories: propCategories = [],
  activeCategory = '',
}) {
  const [categories, setCategories] = useState(propCategories)
  const [categoryUid, setCategoryUid] = useState('')
  const [kode, setKode] = useState('')
  const [subcode, setSubcode] = useState('')
  const [uraian, setUraian] = useState('')
  const [satuan, setSatuan] = useState('Unit')
  const [qty, setQty] = useState('1')
  const [kondisi, setKondisi] = useState('Baik')
  const [lokasi, setLokasi] = useState('Lab Komputer CAT Gedung A')
  const [area, setArea] = useState('Kantor Regional III BKN')
  const [tahunPerolehan, setTahunPerolehan] = useState(new Date().getFullYear().toString())
  const [nilaiPerolehan, setNilaiPerolehan] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Load categories if not passed or empty
  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories)
    } else if (isOpen) {
      fetchAssetCategories()
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setCategories(res)
          }
        })
        .catch(() => {})
    }
  }, [propCategories, isOpen])

  useEffect(() => {
    if (initialData) {
      setCategoryUid(initialData.category_uid || String(initialData.category_id || ''))
      setKode(initialData.kode || '')
      setSubcode(initialData.subcode || '')
      setUraian(initialData.uraian || '')
      setSatuan(initialData.satuan || 'Unit')
      setQty(String(initialData.qty || '1'))
      setKondisi(initialData.kondisi || 'Baik')
      setLokasi(initialData.lokasi || 'Lab Komputer CAT Gedung A')
      setArea(initialData.area || 'Kantor Regional III BKN')
      setTahunPerolehan(String(initialData.tahun_perolehan || new Date().getFullYear()))
      setNilaiPerolehan(String(initialData.nilai_perolehan || ''))
      setKeterangan(initialData.keterangan || '')
      setFotoPreview(initialData.foto_url || '')
    } else {
      // Default to activeCategory if valid, or first category
      const defaultCat =
        activeCategory && activeCategory !== 'all'
          ? activeCategory
          : categories.length > 0
          ? categories[0].uid || String(categories[0].id)
          : ''
      setCategoryUid(defaultCat)
      setKode('')
      setSubcode('')
      setUraian('')
      setSatuan('Unit')
      setQty('1')
      setKondisi('Baik')
      setLokasi('Lab Komputer CAT Gedung A')
      setArea('Kantor Regional III BKN')
      setTahunPerolehan(new Date().getFullYear().toString())
      setNilaiPerolehan('')
      setKeterangan('')
      setFoto(null)
      setFotoPreview('')
    }
    setErrorMsg('')
  }, [initialData, isOpen, categories, activeCategory])

  if (!isOpen) return null

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg('Ukuran file foto maksimal 3MB.')
        return
      }
      setFoto(file)
      setFotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!kode.trim() || !uraian.trim() || !qty) {
      setErrorMsg('Harap lengkapi kode aset BMN, nama barang, dan kuantitas.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      const fd = new FormData()
      if (initialData?.id) fd.append('id', initialData.id)
      fd.append('category_uid', categoryUid)
      fd.append('category_id', categoryUid)
      fd.append('kode', kode.trim())
      fd.append('subcode', subcode.trim())
      fd.append('uraian', uraian.trim())
      fd.append('satuan', satuan.trim() || 'Unit')
      fd.append('qty', qty)
      fd.append('kondisi', kondisi)
      fd.append('lokasi', lokasi.trim())
      fd.append('area', area)
      fd.append('tahun_perolehan', tahunPerolehan)
      fd.append('nilai_perolehan', String(nilaiPerolehan).replace(/[^0-9]/g, '') || 0)
      fd.append('keterangan', keterangan.trim())
      if (foto) fd.append('foto', foto)

      await storeAssetData(fd)
      if (onSuccess) onSuccess()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data inventaris aset BMN.')
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
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Ubah Barang Inventaris BMN' : 'Input Aset BMN Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inventarisasi sarana prasarana dan perangkat TI Kanreg III BKN
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh] clean-scrollbar">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kategori Aset <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryUid}
                onChange={(e) => setCategoryUid(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.uid || c.id} value={c.uid || c.id}>
                      {c.name || c.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="2">Peralatan dan Mesin</option>
                    <option value="4">Jaringan</option>
                    <option value="3">Gedung dan Bangunan</option>
                    <option value="1">Tanah</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kondisi Barang <span className="text-rose-500">*</span>
              </label>
              <select
                value={kondisi}
                onChange={(e) => setKondisi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              >
                <option value="Baik">Baik (Siap Pakai)</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kode BMN <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                placeholder="3.05.01.04.001"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                NUP / Nomor Seri
              </label>
              <input
                type="text"
                value={subcode}
                onChange={(e) => setSubcode(e.target.value)}
                placeholder="PC-CAT-045"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Uraian / Nama Barang & Merk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              placeholder="PC Klien Ujian CAT HP ProDesk 400 G7 Intel Core i5"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kuantitas <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Satuan</label>
              <input
                type="text"
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                placeholder="Unit / Set / M2"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tahun Perolehan</label>
              <input
                type="number"
                min="1950"
                max="2100"
                value={tahunPerolehan}
                onChange={(e) => setTahunPerolehan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Area Wilayah
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
              >
                <option value="Kantor Regional III BKN">Kantor Regional III BKN</option>
                <option value="UPT Bandung">UPT Bandung</option>
                <option value="UPT Serang">UPT Serang</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nilai Perolehan (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={nilaiPerolehan}
                onChange={(e) => setNilaiPerolehan(e.target.value)}
                placeholder="12500000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Lokasi Ruangan / Gedung
            </label>
            <input
              type="text"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Lab Komputer CAT Gedung A Lantai 2"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Spesifikasi / Keterangan
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan inventaris atau kondisi fisik..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 font-semibold"
            />
          </div>

          {/* Upload Foto Fisik Aset */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Foto Fisik Aset BMN (Opsional, Maks. 3MB)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                <Camera className="w-4 h-4 text-[#175CD3]" />
                <span>{foto ? 'Ganti Foto' : 'Unggah Foto Barang'}</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              {fotoPreview && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={fotoPreview} alt="Preview Aset" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{initialData ? 'Simpan Perubahan' : 'Tambah Aset BMN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default AssetFormModal
