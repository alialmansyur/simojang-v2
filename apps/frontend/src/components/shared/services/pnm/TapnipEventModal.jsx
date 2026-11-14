import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import {
  fetchTapnipEvents,
  saveTapnipEvent,
  deleteTapnipEvent,
} from '../../../../services/api/modularServicesApi'
import { ConfirmDialog } from '../../../ui/ConfirmDialog'

export function TapnipEventModal({ isOpen, onClose, onEventsUpdated }) {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [eventName, setEventName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      const data = await fetchTapnipEvents()
      setEvents(data)
    } catch {
      setErrorMsg('Gagal memuat daftar event TapNIP.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadEvents()
      setEditingId(null)
      setEventName('')
      setErrorMsg('')
      setSuccessMsg('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting && !confirmDeleteItem) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSubmitting, confirmDeleteItem, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const handleEdit = (item) => {
    setEditingId(item.id)
    setEventName(item.nama)
    setErrorMsg('')
  }

  const handleReset = () => {
    setEditingId(null)
    setEventName('')
    setErrorMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!eventName.trim()) {
      setErrorMsg('Nama event tidak boleh kosong.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await saveTapnipEvent({
        id: editingId,
        nama: eventName.trim(),
      })
      setSuccessMsg(
        editingId ? 'Event berhasil diperbarui.' : 'Event baru berhasil ditambahkan.'
      )
      handleReset()
      await loadEvents()
      if (onEventsUpdated) onEventsUpdated()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan event TapNIP.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (item) => {
    setConfirmDeleteItem(item)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteItem) return
    const targetItem = confirmDeleteItem
    setIsDeleting(true)
    try {
      await deleteTapnipEvent(targetItem.id)
      setSuccessMsg(`Event "${targetItem.nama}" berhasil dihapus.`)
      setConfirmDeleteItem(null)
      await loadEvents()
      if (onEventsUpdated) onEventsUpdated()
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus event.')
    } finally {
      setIsDeleting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (!isSubmitting && !confirmDeleteItem && e.target === e.currentTarget) {
          onClose?.()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tapnip-event-modal-title"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] modal-dialog-animated"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="tapnip-event-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                Kelola Event TapNIP
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kategori pengelompokan usul NIP CPNS / NI PPPK
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto clean-scrollbar space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Create / Update */}
          <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {editingId ? 'Ubah Nama Event' : 'Tambah Event Baru'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Contoh: 2026 - Penetapan NI PPPK Tahap I"
                required
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : editingId ? (
                  <Edit2 className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{editingId ? 'Simpan' : 'Tambah'}</span>
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                  title="Batalkan ubah"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Table List of Events */}
          <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/60 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-2.5">Nama Event / Kategori Usul</th>
                  <th className="px-4 py-2.5 text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-[#175CD3]" />
                      <span>Memuat data event...</span>
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-slate-400">
                      Belum ada data event khusus tersimpan.
                    </td>
                  </tr>
                ) : (
                  events.map((ev, idx) => (
                    <tr key={ev.id || ev.nama || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                        {ev.nama}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {ev.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(ev)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                              title="Ubah Nama Event"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ev)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Hapus Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500">
                            Arsip Log
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmDeleteItem)}
        title="Hapus Event TapNIP"
        message={`Apakah Anda yakin ingin menghapus event "${confirmDeleteItem?.nama || ''}"?`}
        confirmLabel="Hapus Event"
        tone="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => !isDeleting && setConfirmDeleteItem(null)}
      />
    </div>,
    document.body
  )
}
