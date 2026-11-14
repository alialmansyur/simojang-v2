import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  FolderPlus,
  Package,
} from 'lucide-react'
import {
  fetchAssetCategories,
  storeAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,
} from '../../../../services/api/tuServicesApi'
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog'

export function AssetCategoryModal({ isOpen, onClose, onCategoriesChange }) {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingUid, setEditingUid] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingUid, setDeletingUid] = useState(null)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      setErrorMsg('')
      const data = await fetchAssetCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load categories:', err)
      setErrorMsg('Gagal memuat daftar kategori.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      setNewCatName('')
      setEditingUid(null)
      setErrorMsg('')
      setSuccessMsg('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    try {
      setIsAdding(true)
      setErrorMsg('')
      setSuccessMsg('')
      await storeAssetCategory(newCatName.trim())
      setNewCatName('')
      setSuccessMsg('Kategori baru berhasil ditambahkan.')
      await loadCategories()
      if (onCategoriesChange) onCategoriesChange()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambahkan kategori.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleStartEdit = (cat) => {
    setEditingUid(cat.uid)
    setEditingName(cat.name)
    setErrorMsg('')
    setSuccessMsg('')
  }

  const handleCancelEdit = () => {
    setEditingUid(null)
    setEditingName('')
  }

  const handleSaveEdit = async (uid) => {
    if (!editingName.trim()) return

    try {
      setIsUpdating(true)
      setErrorMsg('')
      setSuccessMsg('')
      await updateAssetCategory(uid, editingName.trim())
      setEditingUid(null)
      setEditingName('')
      setSuccessMsg('Nama kategori berhasil diperbarui.')
      await loadCategories()
      if (onCategoriesChange) onCategoriesChange()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui kategori.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteCategory = (cat) => {
    const totalAssets = Number(cat.total_assets || 0)
    if (totalAssets > 0) {
      setErrorMsg(
        `Kategori "${cat.name}" memuat ${totalAssets} item aset. Hapus atau pindahkan item terlebih dahulu sebelum menghapus kategori.`
      )
      return
    }
    setConfirmDeleteCat(cat)
  }

  const handleConfirmDeleteCategory = async () => {
    if (!confirmDeleteCat) return
    const cat = confirmDeleteCat
    try {
      setDeletingUid(cat.uid)
      setErrorMsg('')
      setSuccessMsg('')
      await deleteAssetCategory(cat.uid)
      setSuccessMsg('Kategori berhasil dihapus.')
      setConfirmDeleteCat(null)
      await loadCategories()
      if (onCategoriesChange) onCategoriesChange()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus kategori.')
    } finally {
      setDeletingUid(null)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Kelola Kategori Aset
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tambah, perbarui, dan atur klasifikasi inventaris BMN
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

        {/* Form Tambah Kategori */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nama kategori baru (cth: Peralatan Jaringan, Lab CAT)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/30 focus:border-[#175CD3]"
                disabled={isAdding}
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !newCatName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-2xs"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>Tambah</span>
            </button>
          </form>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* List of Categories */}
        <div className="p-6 overflow-y-auto max-h-[50vh] clean-scrollbar space-y-2">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Daftar Kategori Aktif ({categories.length})
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#175CD3]" />
              <span className="text-xs font-semibold">Memuat kategori...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Belum ada kategori yang ditambahkan.</p>
            </div>
          ) : (
            categories.map((cat) => {
              const isEditing = editingUid === cat.uid
              const isDeleting = deletingUid === cat.uid
              const totalAssets = Number(cat.total_assets || 0)

              return (
                <div
                  key={cat.uid || cat.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#175CD3]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cat.uid)}
                        disabled={isUpdating || !editingName.trim()}
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                        title="Simpan"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 pr-3">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                          {cat.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {totalAssets} unit terdaftar
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          title="Ubah Nama Kategori"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                          title={
                            totalAssets > 0
                              ? 'Tidak dapat dihapus (masih memiliki item aset)'
                              : 'Hapus Kategori'
                          }
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmDeleteCat)}
        title="Hapus Kategori Aset"
        message={`Yakin ingin menghapus kategori "${confirmDeleteCat?.name || ''}"?`}
        confirmLabel="Hapus Kategori"
        tone="danger"
        isLoading={Boolean(deletingUid)}
        onConfirm={handleConfirmDeleteCategory}
        onClose={() => !deletingUid && setConfirmDeleteCat(null)}
      />
    </div>,
    document.body
  )
}
