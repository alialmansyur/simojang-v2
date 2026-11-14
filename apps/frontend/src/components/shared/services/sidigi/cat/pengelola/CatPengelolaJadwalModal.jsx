import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, CalendarClock, FileCheck2, Info } from 'lucide-react'
import { SearchableSelect } from '../../../../../ui/SearchableSelect'
import {
  fetchCatMasterJenisTes,
  fetchCatPengelolaMasterJenisPeriode,
  fetchCatPengelolaMasterKegiatan,
  fetchCatPengelolaMasterTilok,
  fetchCatInstansiMasterOptions,
  saveCatPengelolaJadwal,
} from '../../../../../../services/api/sidigiCatServicesApi'

const jadwalSchema = z.object({
  uid: z.string().optional(),
  jenis_tes_id: z.string().min(1, 'Jenis Tes wajib dipilih'),
  jenis_periode_id: z.string().min(1, 'Periode wajib dipilih'),
  seleksi_id: z.string().min(1, 'Kegiatan / Seleksi wajib dipilih'),
  tilok_id: z.string().min(1, 'Titik Lokasi wajib dipilih'),
  nama_jadwal: z.string().min(3, 'Nama jadwal minimal 3 karakter'),
  tanggal_mulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tanggal_selesai: z.string().min(1, 'Tanggal selesai wajib diisi'),
  status: z.enum(['draft', 'aktif', 'selesai', 'batal']),
  st_menyusul: z.boolean(),
  nomor_st: z.string().optional(),
  tanggal_st: z.string().optional(),
  catatan: z.string().optional(),
})

export function CatPengelolaJadwalModal({
  isOpen,
  onClose,
  onSuccess,
  editingItem = null,
  initialDates = null,
}) {
  const [jenisTesList, setJenisTesList] = useState([])
  const [jenisPeriodeList, setJenisPeriodeList] = useState([])
  const [seleksiList, setSeleksiList] = useState([])
  const [tilokList, setTilokList] = useState([])
  const [instansiList, setInstansiList] = useState([])
  const [selectedInstansiIds, setSelectedInstansiIds] = useState([])
  const [primaryInstansiId, setPrimaryInstansiId] = useState('')
  const [loadingMaster, setLoadingMaster] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jadwalSchema),
    defaultValues: {
      uid: '',
      jenis_tes_id: '',
      jenis_periode_id: '',
      seleksi_id: '',
      tilok_id: '',
      nama_jadwal: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      status: 'aktif',
      st_menyusul: true,
      nomor_st: '',
      tanggal_st: '',
      catatan: '',
    },
  })

  const watchedJenisTes = watch('jenis_tes_id')
  const watchedJenisPeriode = watch('jenis_periode_id')
  const watchedSeleksi = watch('seleksi_id')
  const watchedStMenyusul = watch('st_menyusul')

  useEffect(() => {
    if (!isOpen) return
    setLoadingMaster(true)
    Promise.all([
      fetchCatMasterJenisTes('').catch(() => []),
      fetchCatPengelolaMasterJenisPeriode({}).catch(() => []),
      fetchCatPengelolaMasterKegiatan({}).catch(() => []),
      fetchCatPengelolaMasterTilok({}).catch(() => []),
      fetchCatInstansiMasterOptions('').catch(() => []),
    ])
      .then(([jt, jp, sel, tlk, ins]) => {
        setJenisTesList(Array.isArray(jt) ? jt : [])
        setJenisPeriodeList(Array.isArray(jp) ? jp : [])
        setSeleksiList(Array.isArray(sel) ? sel : [])
        setTilokList(Array.isArray(tlk) ? tlk : [])
        setInstansiList(Array.isArray(ins) ? ins : [])
      })
      .finally(() => setLoadingMaster(false))
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setSubmitError('')

    if (editingItem) {
      const hasSt =
        editingItem.st_status === 'terhubung' ||
        Boolean(editingItem.resolved_nomor_st || editingItem.nomor_st)
      reset({
        uid: String(editingItem.uid || ''),
        jenis_tes_id: editingItem.jenis_tes_id ? String(editingItem.jenis_tes_id) : '',
        jenis_periode_id: editingItem.jenis_periode_id ? String(editingItem.jenis_periode_id) : '',
        seleksi_id: editingItem.seleksi_id ? String(editingItem.seleksi_id) : '',
        tilok_id: editingItem.tilok_id ? String(editingItem.tilok_id) : '',
        nama_jadwal: String(editingItem.nama_jadwal || ''),
        tanggal_mulai: editingItem.tanggal_mulai || '',
        tanggal_selesai: editingItem.tanggal_selesai || '',
        status: ['draft', 'aktif', 'selesai', 'batal'].includes(editingItem.status)
          ? editingItem.status
          : 'aktif',
        st_menyusul: !hasSt,
        nomor_st: editingItem.resolved_nomor_st || editingItem.nomor_st || '',
        tanggal_st: editingItem.tanggal_st || '',
        catatan: editingItem.catatan || '',
      })
      const multi = Array.isArray(editingItem.instansi_list)
        ? editingItem.instansi_list.map((i) => String(i.kodeins || i.instansi_id))
        : editingItem.instansi_id
        ? [String(editingItem.instansi_id)]
        : []
      setSelectedInstansiIds(multi)
      setPrimaryInstansiId(editingItem.instansi_id ? String(editingItem.instansi_id) : multi[0] || '')
    } else {
      reset({
        uid: '',
        jenis_tes_id: '',
        jenis_periode_id: '',
        seleksi_id: '',
        tilok_id: '',
        nama_jadwal: '',
        tanggal_mulai: initialDates?.startDate || '',
        tanggal_selesai: initialDates?.endDate || initialDates?.startDate || '',
        status: 'aktif',
        st_menyusul: true,
        nomor_st: '',
        tanggal_st: '',
        catatan: '',
      })
      setSelectedInstansiIds([])
      setPrimaryInstansiId('')
    }
  }, [isOpen, editingItem, initialDates, reset])

  // Auto-resolve jenis_periode_id when editing legacy jadwal rows that only saved jenis_tes_id + seleksi_periode
  useEffect(() => {
    if (!isOpen || !editingItem || watchedJenisPeriode || jenisPeriodeList.length === 0) return
    const targetJt = String(editingItem.jenis_tes_id || '')
    const targetPeriod = String(editingItem.seleksi_periode || editingItem.jenis_periode_tahun || '')
    if (!targetJt || !targetPeriod) return
    const matched = jenisPeriodeList.find(
      (jp) => String(jp.jenis_tes_id) === targetJt && String(jp.periode) === targetPeriod
    )
    if (matched) {
      setValue('jenis_periode_id', String(matched.id))
    }
  }, [isOpen, editingItem, watchedJenisPeriode, jenisPeriodeList, setValue])

  const selectedJp = useMemo(
    () => jenisPeriodeList.find((jp) => String(jp.id) === String(watchedJenisPeriode)) || null,
    [jenisPeriodeList, watchedJenisPeriode]
  )

  const jenisTesOptions = useMemo(
    () =>
      jenisTesList.map((j) => ({
        value: String(j.id),
        label: j.kode ? `${j.nama} (${j.kode})` : j.nama,
      })),
    [jenisTesList]
  )

  const periodeOptions = useMemo(() => {
    if (!watchedJenisTes) return []
    return jenisPeriodeList
      .filter((jp) => String(jp.jenis_tes_id || '') === String(watchedJenisTes))
      .map((jp) => ({
        value: String(jp.id),
        label: String(jp.periode),
      }))
  }, [jenisPeriodeList, watchedJenisTes])

  const seleksiOptions = useMemo(() => {
    if (!watchedJenisPeriode || !selectedJp) return []
    return seleksiList
      .filter(
        (s) =>
          String(s.jenis_periode_id || '') === String(watchedJenisPeriode) ||
          (String(s.jenis_tes_id || '') === String(selectedJp.jenis_tes_id) &&
            String(s.periode || '') === String(selectedJp.periode))
      )
      .map((s) => ({
        value: String(s.id),
        label: s.nama_seleksi,
      }))
  }, [seleksiList, watchedJenisPeriode, selectedJp])

  const tilokOptions = useMemo(() => {
    if (!watchedSeleksi) return []
    return tilokList
      .filter((t) => String(t.seleksi_id || '') === String(watchedSeleksi))
      .map((t) => ({
        value: String(t.id),
        label: t.kapasitas ? `${t.nama_tilok} (Kap. ${t.kapasitas})` : t.nama_tilok,
      }))
  }, [tilokList, watchedSeleksi])

  const instansiOptions = useMemo(
    () =>
      instansiList.map((i) => ({
        value: String(i.kodeins),
        label: i.nama,
      })),
    [instansiList]
  )

  const handleAddInstansiTag = (kodeins) => {
    if (!kodeins) return
    setPrimaryInstansiId((prev) => prev || String(kodeins))
    setSelectedInstansiIds((prev) =>
      prev.includes(String(kodeins)) ? prev : [...prev, String(kodeins)]
    )
  }

  const handleRemoveInstansiTag = (kodeins) => {
    setSelectedInstansiIds((prev) => {
      const next = prev.filter((id) => id !== kodeins)
      if (primaryInstansiId === kodeins) {
        setPrimaryInstansiId(next[0] || '')
      }
      return next
    })
  }

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true)
      setSubmitError('')

      const payload = {
        uid: values.uid || undefined,
        jenis_tes_id: Number(values.jenis_tes_id),
        jenis_periode_id: Number(values.jenis_periode_id),
        seleksi_id: Number(values.seleksi_id),
        tilok_id: Number(values.tilok_id),
        instansi_id: primaryInstansiId || selectedInstansiIds[0] || null,
        instansi_ids: selectedInstansiIds,
        nama_jadwal: values.nama_jadwal.trim(),
        tanggal_mulai: values.tanggal_mulai || null,
        tanggal_selesai: values.tanggal_selesai || null,
        status: values.status,
        st_status: values.st_menyusul ? 'menunggu' : values.nomor_st ? 'terhubung' : 'menunggu',
        nomor_st: values.st_menyusul ? null : values.nomor_st?.trim() || null,
        tanggal_st: values.st_menyusul ? null : values.tanggal_st || null,
        catatan: values.catatan?.trim() || null,
      }

      await saveCatPengelolaJadwal(payload)
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setSubmitError(err?.message || 'Gagal menyimpan jadwal kegiatan CAT.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop-animated bg-slate-900/50 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
    >
      <div className="modal-dialog-animated w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#175CD3] dark:text-blue-400 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {editingItem ? 'Edit Jadwal Kegiatan CAT' : 'Buat Jadwal Kegiatan CAT'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hierarki terhubung: Jenis Tes → Periode → Kegiatan → Titik Lokasi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto clean-scrollbar p-5 space-y-4">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {submitError}
            </div>
          )}

          {/* Tier 1 & 2: Jenis Tes -> Periode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                1. Jenis Tes <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="jenis_tes_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={jenisTesOptions}
                    value={field.value}
                    isLoading={loadingMaster}
                    placeholder="Pilih Jenis Tes..."
                    onChange={(val) => {
                      field.onChange(val || '')
                      setValue('jenis_periode_id', '')
                      setValue('seleksi_id', '')
                      setValue('tilok_id', '')
                    }}
                  />
                )}
              />
              {errors.jenis_tes_id && (
                <p className="text-[11px] text-rose-600">{errors.jenis_tes_id.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                2. Periode (Tahun) <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="jenis_periode_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={periodeOptions}
                    value={field.value}
                    isLoading={loadingMaster}
                    isDisabled={!watchedJenisTes}
                    placeholder={
                      watchedJenisTes ? 'Pilih Periode Tahun...' : 'Pilih Jenis Tes dahulu...'
                    }
                    onChange={(val) => {
                      field.onChange(val || '')
                      setValue('seleksi_id', '')
                      setValue('tilok_id', '')
                    }}
                  />
                )}
              />
              {errors.jenis_periode_id && (
                <p className="text-[11px] text-rose-600">{errors.jenis_periode_id.message}</p>
              )}
            </div>
          </div>

          {/* Tier 3 & 4: Kegiatan -> Tilok */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                3. Kegiatan / Seleksi <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="seleksi_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={seleksiOptions}
                    value={field.value}
                    isLoading={loadingMaster}
                    isDisabled={!watchedJenisPeriode}
                    placeholder={
                      watchedJenisPeriode ? 'Pilih Kegiatan / Seleksi...' : 'Pilih Periode dahulu...'
                    }
                    onChange={(val) => {
                      field.onChange(val || '')
                      setValue('tilok_id', '')
                    }}
                  />
                )}
              />
              {errors.seleksi_id && (
                <p className="text-[11px] text-rose-600">{errors.seleksi_id.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                4. Titik Lokasi (Tilok) <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="tilok_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={tilokOptions}
                    value={field.value}
                    isLoading={loadingMaster}
                    isDisabled={!watchedSeleksi}
                    placeholder={
                      watchedSeleksi ? 'Pilih Titik Lokasi...' : 'Pilih Kegiatan dahulu...'
                    }
                    onChange={(val) => field.onChange(val || '')}
                  />
                )}
              />
              {errors.tilok_id && (
                <p className="text-[11px] text-rose-600">{errors.tilok_id.message}</p>
              )}
            </div>
          </div>

          {/* Nama Jadwal & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Nama Jadwal Kegiatan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('nama_jadwal')}
                placeholder="Contoh: Pelaksanaan SKD CPNS Tilok Bandung Tahap I"
                className="w-full h-[38px] px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
              {errors.nama_jadwal && (
                <p className="text-[11px] text-rose-600">{errors.nama_jadwal.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Status Jadwal
              </label>
              <select
                {...register('status')}
                className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              >
                <option value="aktif">Aktif</option>
                <option value="draft">Draft</option>
                <option value="selesai">Selesai</option>
                <option value="batal">Batal</option>
              </select>
            </div>
          </div>

          {/* Tanggal Mulai & Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('tanggal_mulai')}
                className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
              {errors.tanggal_mulai && (
                <p className="text-[11px] text-rose-600">{errors.tanggal_mulai.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Tanggal Selesai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('tanggal_selesai')}
                className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
              />
              {errors.tanggal_selesai && (
                <p className="text-[11px] text-rose-600">{errors.tanggal_selesai.message}</p>
              )}
            </div>
          </div>

          {/* Instansi Opsional (Multi-tag) */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Instansi Terkait (Opsional — Bisa Kosong atau Banyak Instansi)
              </label>
              <span className="text-[11px] text-slate-500">
                {selectedInstansiIds.length} dipilih
              </span>
            </div>

            <SearchableSelect
              options={instansiOptions}
              value=""
              isLoading={loadingMaster}
              placeholder="+ Tambahkan instansi peserta (kosongkan jika lintas/umum)..."
              onChange={(val) => handleAddInstansiTag(val)}
            />

            {selectedInstansiIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedInstansiIds.map((kode) => {
                  const found = instansiList.find((i) => String(i.kodeins) === kode)
                  return (
                    <span
                      key={kode}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <span>{found?.nama || kode}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInstansiTag(kode)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* Relasi Surat Tugas (ST Bisa Menyusul) */}
          <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Relasi Surat Tugas (ST)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Nomor ST boleh belum terbit saat jadwal disusun dan dapat ditautkan menyusul.
                  </p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  {...register('st_menyusul')}
                  className="rounded border-amber-400 text-[#175CD3] focus:ring-[#175CD3]"
                />
                <span>ST Menyusul</span>
              </label>
            </div>

            {!watchedStMenyusul ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Nomor Surat Tugas
                  </label>
                  <input
                    type="text"
                    {...register('nomor_st')}
                    placeholder="Contoh: ST-124/KR.III/2026"
                    className="w-full h-[36px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Tanggal Surat Tugas
                  </label>
                  <input
                    type="date"
                    {...register('tanggal_st')}
                    className="w-full h-[36px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Jadwal akan disimpan dengan status <strong>ST Menyusul</strong> hingga nomor ST terbit.</span>
              </div>
            )}
          </div>

          {/* Keterangan */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Catatan / Keterangan Tambahan
            </label>
            <textarea
              rows={2}
              {...register('catatan')}
              placeholder="Catatan teknis lokasi, jumlah sesi/ruang, atau instruksi khusus..."
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20 focus:border-[#175CD3]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
