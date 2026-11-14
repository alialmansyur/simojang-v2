import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  ArrowLeft,
  Save,
  Loader2,
  Database,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  fetchRefSchema,
  fetchRefList,
  createRefRow,
  updateRefRow,
  deleteRefRow,
} from '../../../services/api/refApi'
import { ServiceTablePagination } from '../../../components/shared/services/ServiceTablePagination'
import { PmaDeleteConfirmDialog } from '../../../components/shared/services/pma/PmaDeleteConfirmDialog'

function formatCellPreview(value, col) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-300 dark:text-slate-600">-</span>
  }

  if (col?.is_status_flag || col?.input_type === 'boolean') {
    const active = Number(value) === 1 || value === true || String(value).toLowerCase() === 'active'
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
          active
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        {active ? 'Aktif' : 'Nonaktif'}
      </span>
    )
  }

  if (col?.input_type === 'color' && /^#?[0-9a-f]{3,8}$/i.test(String(value))) {
    const hex = String(value).startsWith('#') ? String(value) : `#${value}`
    return (
      <span className="inline-flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-200">
        <span className="w-4 h-4 rounded-md border border-slate-200 dark:border-slate-700 shrink-0" style={{ backgroundColor: hex }} />
        <span>{hex}</span>
      </span>
    )
  }

  const text = String(value)
  if (text.length > 72) {
    return (
      <span title={text} className="line-clamp-2">
        {text.slice(0, 72)}...
      </span>
    )
  }

  return text
}

function buildInitialFormValues(columns, row = null) {
  const values = {}
  columns.forEach((col) => {
    if (!col.is_writable) return
    if (row) {
      const raw = row[col.name]
      if (col.input_type === 'boolean') {
        values[col.name] = Number(raw) === 1 || raw === true ? '1' : '0'
      } else {
        values[col.name] = raw === null || raw === undefined ? '' : String(raw)
      }
      return
    }
    if (col.input_type === 'boolean') {
      values[col.name] = col.default !== null && col.default !== undefined ? String(col.default) : '1'
    } else if (col.input_type === 'select' && Array.isArray(col.enum_values) && col.enum_values.length > 0) {
      values[col.name] = col.default && col.enum_values.includes(col.default) ? col.default : col.enum_values[0]
    } else {
      values[col.name] = col.default !== null && col.default !== undefined ? String(col.default) : ''
    }
  })
  return values
}

export function ReferensiCrudModal({ tableMeta, isOpen, onClose, onDataMutated }) {
  const [mode, setMode] = useState('list') // 'list' | 'form'
  const [schema, setSchema] = useState(null)
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, per_page: 10, total: 0, total_page: 1 })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortDir, setSortDir] = useState('desc')

  const [loadingSchema, setLoadingSchema] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Form state
  const [editingRow, setEditingRow] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Delete dialog state
  const [deletingRow, setDeletingRow] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const slug = tableMeta?.slug || ''
  const permissions = tableMeta?.permissions || { read: true, create: true, update: true, delete: true }

  // Reset saat tabel berubah / modal dibuka
  useEffect(() => {
    if (!isOpen || !slug) return
    setMode('list')
    setSchema(null)
    setRows([])
    setPage(1)
    setSearchInput('')
    setDebouncedSearch('')
    setSortBy('')
    setSortDir('desc')
    setEditingRow(null)
    setFormError('')
    setErrorMsg('')
  }, [isOpen, slug])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Fetch schema saat modal dibuka
  useEffect(() => {
    if (!isOpen || !slug) return
    let active = true
    setLoadingSchema(true)
    fetchRefSchema(slug)
      .then((res) => {
        if (!active) return
        setSchema(res)
        setSortBy(res?.pk || 'id')
      })
      .catch((err) => {
        if (!active) return
        setErrorMsg(err.message || 'Gagal memuat skema tabel referensi.')
      })
      .finally(() => {
        if (active) setLoadingSchema(false)
      })
    return () => {
      active = false
    }
  }, [isOpen, slug])

  const loadRows = useCallback(async () => {
    if (!isOpen || !slug) return
    setLoadingList(true)
    setErrorMsg('')
    try {
      const res = await fetchRefList(slug, {
        page,
        per_page: pageSize,
        search: debouncedSearch,
        sort_by: sortBy,
        sort_dir: sortDir,
      })
      setRows(res.rows)
      setMeta(res.meta)
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat daftar data referensi.')
    } finally {
      setLoadingList(false)
    }
  }, [isOpen, slug, page, pageSize, debouncedSearch, sortBy, sortDir])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const visibleColumns = useMemo(() => {
    const cols = schema?.columns || []
    // Prioritaskan kolom non-timestamp / non-uuid panjang agar tabel ringkas dibaca, maksimal 7 kolom
    const filtered = cols.filter((c) => {
      const lower = c.name.toLowerCase()
      if (['created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by', 'icon_svg'].includes(lower)) {
        return false
      }
      if ((lower === 'uid' || lower === 'uuid') && cols.length > 5) return false
      return true
    })
    return filtered.slice(0, 7)
  }, [schema])

  const writableColumns = useMemo(() => {
    return (schema?.columns || []).filter((c) => c.is_writable && !c.is_auto_uuid)
  }, [schema])

  const pkName = schema?.pk || tableMeta?.pk || 'id'

  if (!isOpen || !tableMeta) return null

  const openCreateForm = () => {
    setEditingRow(null)
    setFormValues(buildInitialFormValues(schema?.columns || [], null))
    setFormError('')
    setMode('form')
  }

  const openEditForm = (row) => {
    setEditingRow(row)
    setFormValues(buildInitialFormValues(schema?.columns || [], row))
    setFormError('')
    setMode('form')
  }

  const handleSort = (colName) => {
    if (sortBy === colName) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(colName)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleQuickToggleStatus = async (row, col) => {
    if (!permissions.update) return
    const current = Number(row[col.name]) === 1 ? 1 : 0
    const nextVal = current === 1 ? 0 : 1
    try {
      await updateRefRow(slug, row[pkName], { [col.name]: nextVal })
      toast.success(`Status ${tableMeta.label} diperbarui.`)
      await loadRows()
      if (onDataMutated) onDataMutated()
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status.')
    }
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setFormError('')

    // Validasi sederhana kolom wajib (not nullable & no default)
    for (const col of writableColumns) {
      const val = formValues[col.name]
      const isRequired = !col.is_nullable && (col.default === null || col.default === undefined) && col.input_type !== 'boolean'
      if (isRequired && (val === undefined || val === null || String(val).trim() === '')) {
        setFormError(`Kolom "${col.label}" wajib diisi.`)
        return
      }
    }

    const payload = {}
    writableColumns.forEach((col) => {
      const raw = formValues[col.name]
      if (col.input_type === 'boolean') {
        payload[col.name] = Number(raw) === 1 ? 1 : 0
      } else if (col.input_type === 'number') {
        payload[col.name] = raw === '' || raw === null || raw === undefined ? (col.is_nullable ? null : '') : Number(raw)
      } else {
        payload[col.name] = raw ?? ''
      }
    })

    setIsSubmitting(true)
    try {
      if (editingRow) {
        await updateRefRow(slug, editingRow[pkName], payload)
        toast.success(`Data ${tableMeta.label} berhasil diperbarui.`)
      } else {
        await createRefRow(slug, payload)
        toast.success(`Data ${tableMeta.label} berhasil ditambahkan.`)
      }
      setMode('list')
      setEditingRow(null)
      await loadRows()
      if (onDataMutated) onDataMutated()
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan data referensi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingRow) return
    setIsDeleting(true)
    try {
      await deleteRefRow(slug, deletingRow[pkName])
      toast.success(`Data #${deletingRow[pkName]} berhasil dihapus.`)
      setDeletingRow(null)
      await loadRows()
      if (onDataMutated) onDataMutated()
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden modal-dialog-animated">
          {/* Modal Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {mode === 'form' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('list')
                    setFormError('')
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Daftar</span>
                </button>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {mode === 'form'
                      ? editingRow
                        ? `Ubah Data ${tableMeta.label}`
                        : `Tambah Data ${tableMeta.label}`
                      : tableMeta.label}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {tableMeta.table}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {tableMeta.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {mode === 'list' && permissions.create && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  disabled={loadingSchema || !schema}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Data</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          {mode === 'list' ? (
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto clean-scrollbar flex-1">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={`Cari data di ${tableMeta.label}...`}
                    className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadRows}
                    disabled={loadingList}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin text-[#175CD3]' : ''}`} />
                    <span>Muat Ulang</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Single-Card Table Container */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto clean-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        {visibleColumns.map((col) => (
                          <th
                            key={col.name}
                            onClick={() => handleSort(col.name)}
                            className="py-3 px-3.5 cursor-pointer hover:text-[#175CD3] select-none whitespace-nowrap"
                          >
                            <span className="inline-flex items-center gap-1">
                              <span>{col.label}</span>
                              {sortBy === col.name && (
                                <span className="text-[#175CD3]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </span>
                          </th>
                        ))}
                        {(permissions.update || permissions.delete) && (
                          <th className="py-3 px-4 text-right w-28">Aksi</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200">
                      {loadingSchema || loadingList ? (
                        Array.from({ length: 5 }).map((_, idx) => (
                          <tr key={idx} className="animate-pulse">
                            <td colSpan={visibleColumns.length + 2} className="py-3.5 px-4">
                              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                            </td>
                          </tr>
                        ))
                      ) : rows.length === 0 ? (
                        <tr>
                          <td colSpan={visibleColumns.length + 2} className="py-12 text-center text-slate-400">
                            <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-xs sm:text-sm font-semibold text-slate-500">
                              Belum ada data ditemukan
                            </p>
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, idx) => (
                          <tr
                            key={row[pkName] ?? idx}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-3 px-4 text-center text-slate-400 font-semibold tabular-nums">
                              {(page - 1) * pageSize + idx + 1}
                            </td>
                            {visibleColumns.map((col) => (
                              <td key={col.name} className="py-3 px-3.5 max-w-[260px]">
                                {col.is_status_flag && permissions.update ? (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickToggleStatus(row, col)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    title="Klik untuk ubah status"
                                  >
                                    {formatCellPreview(row[col.name], col)}
                                  </button>
                                ) : (
                                  formatCellPreview(row[col.name], col)
                                )}
                              </td>
                            ))}
                            {(permissions.update || permissions.delete) && (
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  {permissions.update && (
                                    <button
                                      type="button"
                                      onClick={() => openEditForm(row)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                      title="Ubah data"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {permissions.delete && (
                                    <button
                                      type="button"
                                      onClick={() => setDeletingRow(row)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title="Hapus data"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/60">
                  <ServiceTablePagination
                    page={page}
                    pageSize={pageSize}
                    total={meta?.total || 0}
                    onPageChange={setPage}
                    onPageSizeChange={(nextSize) => {
                      setPageSize(nextSize)
                      setPage(1)
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Form Tambah / Ubah Data */
            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto clean-scrollbar space-y-4 flex-1">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/50 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {writableColumns.map((col) => {
                    const isWide = col.input_type === 'textarea' || writableColumns.length === 1
                    const isRequired =
                      !col.is_nullable && (col.default === null || col.default === undefined) && col.input_type !== 'boolean'
                    const value = formValues[col.name] ?? ''

                    return (
                      <div key={col.name} className={isWide ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                          {col.label}
                          {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
                          <span className="ml-1.5 text-[10px] font-mono font-normal text-slate-400">
                            ({col.data_type})
                          </span>
                        </label>

                        {col.input_type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={value}
                            onChange={(e) => setFormValues((prev) => ({ ...prev, [col.name]: e.target.value }))}
                            placeholder={`Masukkan ${col.label.toLowerCase()}...`}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                          />
                        ) : col.input_type === 'select' ? (
                          <select
                            value={value}
                            onChange={(e) => setFormValues((prev) => ({ ...prev, [col.name]: e.target.value }))}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                          >
                            {col.is_nullable && <option value="">-- Kosong --</option>}
                            {(col.enum_values || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : col.input_type === 'boolean' ? (
                          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800 w-fit">
                            {[
                              { val: '1', label: 'Aktif' },
                              { val: '0', label: 'Nonaktif' },
                            ].map((opt) => {
                              const active = String(value) === opt.val
                              return (
                                <button
                                  key={opt.val}
                                  type="button"
                                  onClick={() => setFormValues((prev) => ({ ...prev, [col.name]: opt.val }))}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    active
                                      ? 'bg-white dark:bg-slate-900 text-[#175CD3] shadow-2xs'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  {active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                  <span>{opt.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        ) : col.input_type === 'color' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#175CD3'}
                              onChange={(e) => setFormValues((prev) => ({ ...prev, [col.name]: e.target.value }))}
                              className="w-10 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer bg-white"
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => setFormValues((prev) => ({ ...prev, [col.name]: e.target.value }))}
                              placeholder="#175CD3"
                              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20"
                            />
                          </div>
                        ) : (
                          <input
                            type={col.input_type === 'datetime-local' ? 'datetime-local' : col.input_type}
                            maxLength={col.max_length || undefined}
                            step={col.data_type === 'decimal' || col.data_type === 'float' ? 'any' : undefined}
                            value={value}
                            onChange={(e) => setFormValues((prev) => ({ ...prev, [col.name]: e.target.value }))}
                            placeholder={`Masukkan ${col.label.toLowerCase()}...`}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMode('list')
                    setFormError('')
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingRow ? 'Simpan Perubahan' : 'Simpan Data'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>,
      document.body
    )}

      <PmaDeleteConfirmDialog
        isOpen={Boolean(deletingRow)}
        onClose={() => !isDeleting && setDeletingRow(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title={`Hapus Data ${tableMeta.label}`}
        description={`Apakah Anda yakin ingin menghapus data #${deletingRow?.[pkName] ?? ''} dari tabel ${tableMeta.table}? Tindakan ini tidak dapat dibatalkan.`}
      />
    </>
  )
}
