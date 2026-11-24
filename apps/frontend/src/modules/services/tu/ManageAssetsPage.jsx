import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  MapPin,
  Pencil,
  Trash2,
  Eye,
  Tag,
  Clock,
  Image as ImageIcon,
  X,
  Settings2,
  Filter,
} from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { AssetFormModal } from './components/AssetFormModal'
import { AssetCategoryModal } from './components/AssetCategoryModal'
import { AssetDetailModal } from './components/AssetDetailModal'
import {
  fetchAssetsSummary,
  fetchAssetsData,
  deleteAssetData,
  fetchAssetCategories,
  importBatchAssets,
} from '../../../services/api/tuServicesApi'

export default function ManageAssetsPage() {
  const [previewImage, setPreviewImage] = useState(null)
  const [categories, setCategories] = useState([])
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [selectedKondisi, setSelectedKondisi] = useState('')
  const [selectedArea, setSelectedArea] = useState('')

  // Load Categories from API
  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchAssetCategories()
      if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch (err) {
      console.warn('Failed to load asset categories:', err)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Formatter Currency
  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0))
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // 4 Bento KPI Cards
  const renderKpis = (summary) => [
    {
      id: 'total_unit',
      label: 'TOTAL UNIT ASET',
      value: summary?.total_unit ?? summary?.total_data ?? 0,
      unit: 'Unit',
      context: 'Sarana BMN tercatat',
      badge: 'BMN Aktif',
      badgeColor: 'blue',
      icon: Package,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'kondisi_baik',
      label: 'ASET KONDISI BAIK',
      value: summary?.kondisi_baik ?? 0,
      unit: 'Unit',
      context: 'Kondisi siap operasional',
      badge: 'Siap Pakai',
      badgeColor: 'emerald',
      icon: CheckCircle2,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'rusak_ringan',
      label: 'PERLU PEMELIHARAAN',
      value: (summary?.rusak_ringan ?? 0) + (summary?.rusak_berat ?? 0),
      unit: 'Unit',
      context: 'Rusak ringan & berat',
      badge: 'Tindakan',
      badgeColor: (summary?.rusak_ringan || 0) + (summary?.rusak_berat || 0) > 0 ? 'rose' : 'slate',
      icon: AlertTriangle,
      iconColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    },
    {
      id: 'nilai_perolehan_total',
      label: 'KAPITALISASI BMN',
      value: formatRupiah(summary?.nilai_perolehan_total ?? summary?.total_nilai ?? 0),
      unit: '',
      isText: true,
      context: 'Total nilai buku kapitalisasi',
      badge: 'Nilai Buku',
      badgeColor: 'amber',
      icon: DollarSign,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  // Format categories for Segmented Category Pills in Toolbar Tier 2
  const toolbarCategories = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.uid || String(cat.id),
      label: cat.name,
    }))
  }, [categories])

  const columns = [
    { header: 'BARANG BMN' },
    { header: 'KATEGORI' },
    { header: 'KONDISI' },
    { header: 'NILAI PEROLEHAN' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    let kondisiBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
    if (item.kondisi === 'Rusak Ringan') {
      kondisiBadge = 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
    } else if (item.kondisi === 'Rusak Berat') {
      kondisiBadge = 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40'
    }

    const categoryLabel =
      item.category_name ||
      categories.find(
        (c) =>
          String(c.id) === String(item.category_id) ||
          c.uid === item.category_uid ||
          c.uid === item.category_id
      )?.name ||
      item.kategori ||
      '-'

    return (
      <tr
        key={item.id || item.uid || rowNo}
        className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors"
      >
        {/* Kolom 1: BARANG BMN */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <TuDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewDetail && onViewDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.uraian}
              >
                {item.uraian}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                <span>{item.kode}</span>
                <span>•</span>
                <span>NUP: {item.subcode || '-'}</span>
              </div>
              {item.nama_ruangan && (
                <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                  <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate max-w-[220px]">Ruang: {item.nama_ruangan}</span>
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Kolom 2: KATEGORI */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>{categoryLabel}</span>
          </span>
        </td>

        {/* Kolom 3: KONDISI */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${kondisiBadge}`}>
            {item.kondisi || 'Baik'}
          </span>
        </td>

        {/* Kolom 4: NILAI PEROLEHAN */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
            {formatRupiah(item.nilai_perolehan)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Kuantitas: {Number(item.qty || 1)} {item.satuan || 'unit'}
          </div>
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuTanggalCell value={item.created_at || item.updated_at || item.tahun_perolehan} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuPetugasCell value={item.pic || item.penanggung_jawab || item.created_by || 'Pengelola BMN'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="px-4 py-3.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onViewDetail && onViewDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Aset"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              title="Ubah Data Aset"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Data Aset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  // Extra filter toolbar actions: Kelola Kategori + Filter Kondisi + Filter Area
  const extraFilterActions = (
    <div className="flex items-center justify-between gap-3 w-full flex-wrap pt-1">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tombol Pengelolaan Kategori */}
        <button
          type="button"
          onClick={() => setIsCategoryModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
          title="Buka panel pengelolaan kategori aset"
        >
          <Settings2 className="w-3.5 h-3.5 text-[#175CD3]" />
          <span>Kelola Kategori</span>
        </button>

        {/* Filter Kondisi Cepat */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pl-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Kondisi:</span>
          </span>
          <select
            value={selectedKondisi}
            onChange={(e) => setSelectedKondisi(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-0 focus:ring-1 focus:ring-[#175CD3] cursor-pointer"
          >
            <option value="">Semua Kondisi</option>
            <option value="Baik">Baik</option>
            <option value="Rusak Ringan">Rusak Ringan</option>
            <option value="Rusak Berat">Rusak Berat</option>
          </select>
        </div>

        {/* Filter Area Kerja Cepat */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 pl-1.5">
            Area:
          </span>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-0 focus:ring-1 focus:ring-[#175CD3] cursor-pointer"
          >
            <option value="">Semua Area</option>
            <option value="Kantor Regional III BKN">Kantor Regional III</option>
            <option value="UPT Bandung">UPT Bandung</option>
            <option value="UPT Serang">UPT Serang</option>
          </select>
        </div>
      </div>
    </div>
  )

  const customFilterParams = useMemo(() => {
    const params = {}
    if (selectedKondisi) params.kondisi = selectedKondisi
    if (selectedArea) params.area = selectedArea
    return params
  }, [selectedKondisi, selectedArea])

  return (
    <>
      <TuCrudLayoutShell
        layananId={37}
        serviceTitle="Manajemen Aset BMN"
        shortTitle="Manajemen Aset"
        description="Inventarisasi dan pemantauan sarana prasarana serta BMN."
        templateUrl="/templates/tu/template-asset.xlsx"
        templateName="template-asset.xlsx"
        fetchSummaryFn={fetchAssetsSummary}
        fetchDataFn={fetchAssetsData}
        deleteDataFn={deleteAssetData}
        batchUploadFn={importBatchAssets}
        renderKpis={renderKpis}
        columns={columns}
        renderRow={renderRow}
        FormComponent={AssetFormModal}
        DetailModalComponent={AssetDetailModal}
        categories={toolbarCategories}
        searchPlaceholder="Cari kode BMN, uraian barang, ruangan, NUP..."
        extraFilterActions={extraFilterActions}
        customFilterParams={customFilterParams}
      />

      {/* Modal Pengelolaan Kategori Mandiri */}
      <AssetCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesChange={loadCategories}
      />

      {/* Lightbox Modal Image Preview */}
      {previewImage && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs modal-backdrop-animated"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden bg-black shadow-2xl modal-dialog-animated">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Preview Foto Aset"
              className="w-full h-full object-contain"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
