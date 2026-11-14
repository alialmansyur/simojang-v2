import GalleryCard from './GalleryCard'

export function GallerySkeleton() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      aria-label="Memuat galeri kegiatan"
    >
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
        >
          <div className="aspect-[16/10] bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-1/2 rounded bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
            <div className="h-3 w-full rounded bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function GalleryGrid({
  items = [],
  onOpenDetail,
  onEdit,
  onDelete,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {items.map((item, idx) => (
        <GalleryCard
          key={item.id}
          item={item}
          index={idx}
          onOpenDetail={onOpenDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
