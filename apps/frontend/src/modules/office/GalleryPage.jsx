import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Image as ImageIcon, Plus, RotateCcw } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  deleteGalleryItem,
  fetchGalleryPage,
  fetchGalleryTeams,
  saveGalleryItem,
} from '../../services/api/galleryApi'
import GalleryHeader from './components/gallery/GalleryHeader'
import { ServiceFilterToolbar } from '../../components/shared/services/ServiceFilterToolbar'
import { ServiceTablePagination } from '../../components/shared/services/ServiceTablePagination'
import GalleryGrid, { GallerySkeleton } from './components/gallery/GalleryGrid'
import GalleryDetailLightboxModal from './components/gallery/GalleryDetailLightboxModal'
import GalleryFormModal from './components/gallery/GalleryFormModal'
import GalleryDeleteDialog from './components/gallery/GalleryDeleteDialog'

export default function GalleryPage() {
  const [items, setItems] = useState([])
  const [teams, setTeams] = useState([])
  const [summaryCounts, setSummaryCounts] = useState(null)

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Filters & Pagination matching /layanan/manajemen-talenta & apps/admin
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedMonths, setSelectedMonths] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [totalItems, setTotalItems] = useState(0)

  // Modal & Lightbox states
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load Tim Kerja options once
  useEffect(() => {
    let cancelled = false
    fetchGalleryTeams()
      .then((list) => {
        if (!cancelled) setTeams(list)
      })
      .catch(() => {
        // Non-blocking: falls back to teams derived from items if endpoint unavailable
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadGallery = useCallback(
    async ({ initial = false } = {}) => {
      if (initial) {
        setIsInitialLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)

      try {
        const res = await fetchGalleryPage({
          search: searchQuery,
          timkerja: selectedTeam,
          months: selectedMonths,
          page,
          perPage: pageSize,
        })
        setItems(res.items)
        setTotalItems(res.pagination.total)
        setSummaryCounts(res.summary)
      } catch (err) {
        setError(err?.message || 'Gagal memuat dokumentasi galeri kegiatan.')
      } finally {
        setIsInitialLoading(false)
        setIsRefreshing(false)
      }
    },
    [searchQuery, selectedTeam, selectedMonths, page, pageSize],
  )

  useEffect(() => {
    let cancelled = false

    fetchGalleryPage({
      search: searchQuery,
      timkerja: selectedTeam,
      months: selectedMonths,
      page,
      perPage: pageSize,
    })
      .then((res) => {
        if (cancelled) return
        setItems(res.items)
        setTotalItems(res.pagination.total)
        setSummaryCounts(res.summary)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.message || 'Gagal memuat dokumentasi galeri kegiatan.')
      })
      .finally(() => {
        if (cancelled) return
        setIsInitialLoading(false)
        setIsRefreshing(false)
      })

    return () => {
      cancelled = true
    }
  }, [searchQuery, selectedTeam, selectedMonths, page, pageSize])

  const availableTeams = useMemo(() => {
    if (teams.length > 0) return teams
    const map = new Map()
    items.forEach((item) => {
      if (item.teamId && item.teamName && !map.has(item.teamId)) {
        map.set(item.teamId, { id: item.teamId, nama: item.teamName })
      }
    })
    return Array.from(map.values())
  }, [teams, items])

  const filterCategories = useMemo(
    () =>
      availableTeams.map((team) => ({
        value: String(team.id),
        label: team.nama,
      })),
    [availableTeams],
  )

  const categoryCounts = useMemo(
    () => summaryCounts?.teamCounts || {},
    [summaryCounts],
  )

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedTeam || selectedMonths.length > 0,
  )

  const handleSearchChange = useCallback((val) => {
    setSearchQuery(val)
    setPage(1)
  }, [])

  const handleTeamChange = (val) => {
    setSelectedTeam(val)
    setPage(1)
  }

  const handleMonthChange = (months) => {
    setSelectedMonths(months)
    setPage(1)
  }

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedTeam('')
    setSelectedMonths([])
    setPage(1)
  }

  const handleOpenDetail = (item) => {
    const idx = items.findIndex((x) => x.id === item.id)
    setLightboxIndex(idx >= 0 ? idx : 0)
    setIsLightboxOpen(true)
  }

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false)
    setLightboxIndex(-1)
  }

  const handleOpenCreate = () => {
    setEditingItem(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (item) => {
    setIsLightboxOpen(false)
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true)
    try {
      const res = await saveGalleryItem(payload)
      toast.success(res?.message || 'Dokumentasi kegiatan berhasil disimpan.')
      setIsFormOpen(false)
      setEditingItem(null)
      await loadGallery()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      const res = await deleteGalleryItem(deletingItem.id)
      toast.success(res?.message || 'Dokumentasi kegiatan berhasil dihapus.')
      if (isLightboxOpen && items[lightboxIndex]?.id === deletingItem.id) {
        handleCloseLightbox()
      }
      setDeletingItem(null)
      if (items.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadGallery()
      }
    } catch (err) {
      toast.error(err?.message || 'Gagal menghapus dokumentasi kegiatan.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-7xl mx-auto pb-12 font-sans"
    >
      {/* Header */}
      <GalleryHeader
        isRefreshing={isRefreshing}
        onReload={() => loadGallery()}
        onCreateClick={handleOpenCreate}
      />

      {/* Filter Toolbar (Reused from /layanan/manajemen-talenta) */}
      <ServiceFilterToolbar
        searchTerm={searchQuery}
        onSearchChange={handleSearchChange}
        selectedMonths={selectedMonths}
        onMonthChange={handleMonthChange}
        categories={filterCategories}
        activeCategory={selectedTeam}
        onCategoryChange={handleTeamChange}
        totalRecords={summaryCounts?.totalAll ?? totalItems}
        categoryCounts={categoryCounts}
        placeholder="Cari judul kegiatan atau deskripsi..."
        borderless
      />

      {/* Loading Skeleton */}
      {isInitialLoading && <GallerySkeleton />}

      {/* Error State */}
      {!isInitialLoading && error && (
        <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            {error}
          </p>
          <button
            type="button"
            onClick={() => loadGallery({ initial: items.length === 0 })}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main Gallery Grid / Empty State */}
      {!isInitialLoading && !error && (
        <>
          {items.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF2FC] dark:bg-[#0B3264]/40 text-[#175CD3] flex items-center justify-center mx-auto">
                <ImageIcon className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h2 className="text-base sm:text-lg font-bold text-[#0B3264] dark:text-white">
                  {hasActiveFilters
                    ? 'Tidak Ada Dokumentasi yang Cocok'
                    : 'Belum Ada Galeri Kegiatan'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {hasActiveFilters
                    ? 'Coba ubah kata kunci pencarian, pilihan tim kerja, atau periode bulan untuk melihat dokumentasi lainnya.'
                    : 'Belum ada data dokumentasi kegiatan yang tersimpan. Silakan tambahkan dokumentasi baru.'}
                </p>
              </div>

              <div className="pt-1 flex items-center justify-center gap-2.5">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#EAF2FC] hover:text-[#0B3264] text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Filter</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1249A8] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Tambah Data Baru</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <GalleryGrid
                items={items}
                onOpenDetail={handleOpenDetail}
                onEdit={handleOpenEdit}
                onDelete={(item) => setDeletingItem(item)}
              />

              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs p-3.5 sm:p-4">
                <ServiceTablePagination
                  page={page}
                  pageSize={pageSize}
                  total={totalItems}
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[8, 12, 24, 48]}
                  pageSizeLabel="foto"
                  unitLabel="dokumentasi"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail + Lightbox Modal */}
      <GalleryDetailLightboxModal
        items={items}
        activeIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={handleCloseLightbox}
        onSelectIndex={setLightboxIndex}
        onEdit={handleOpenEdit}
        onDelete={(item) => setDeletingItem(item)}
      />

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <GalleryFormModal
          key={editingItem?.id ? `edit-${editingItem.id}` : 'create-gallery'}
          isOpen={isFormOpen}
          editingItem={editingItem}
          teams={availableTeams}
          isSubmitting={isSubmitting}
          onClose={() => {
            if (!isSubmitting) {
              setIsFormOpen(false)
              setEditingItem(null)
            }
          }}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <GalleryDeleteDialog
        isOpen={Boolean(deletingItem)}
        item={deletingItem}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) setDeletingItem(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </motion.div>
  )
}
