import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Users,
  AlertTriangle,
  Plus,
  Trash2,
  CalendarClock,
  MapPin,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import { SearchableSelect } from '../../../../../ui/SearchableSelect'
import { PENGELOLA_ROLES, formatDateRangeId } from './pengelolaConstants'
import {
  fetchCatPengelolaJadwal,
  fetchCatPengelolaPegawaiOptions,
  fetchCatPengelolaUnitKerjaOptions,
  fetchCatPengelolaTim,
  saveCatPengelolaTim,
} from '../../../../../../services/api/sidigiCatServicesApi'

function createEmptyMemberRow(defaults = {}) {
  return {
    _key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    peran: defaults.peran || 'Pengawas',
    nip: defaults.nip ? String(defaults.nip) : '',
    nama: defaults.nama || '',
    pangkat_gol: defaults.pangkat_gol || '',
    jabatan: defaults.jabatan || '',
    tanggal_mulai: defaults.tanggal_mulai || '',
    tanggal_selesai: defaults.tanggal_selesai || '',
    catatan: defaults.catatan || '',
    _customDates: Boolean(defaults._customDates),
  }
}

export function CatPengelolaTimModal({
  isOpen,
  onClose,
  onSuccess,
  defaultJadwalId = '',
  defaultPrefill = null,
  editingMember = null,
}) {
  const [jadwalList, setJadwalList] = useState([])
  const [pegawaiList, setPegawaiList] = useState([])
  const [unitKerjaList, setUnitKerjaList] = useState([])
  const [existingTimRows, setExistingTimRows] = useState([])
  const [loadingJadwal, setLoadingJadwal] = useState(false)
  const [loadingPegawai, setLoadingPegawai] = useState(false)

  const [jadwalId, setJadwalId] = useState('')
  const [unitKerjaFilter, setUnitKerjaFilter] = useState('')
  const [memberRows, setMemberRows] = useState([createEmptyMemberRow()])

  const [allowConflict, setAllowConflict] = useState(false)
  const [conflicts, setConflicts] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load jadwal & unit kerja when modal opens
  useEffect(() => {
    if (!isOpen) return
    setErrorMsg('')
    setConflicts([])
    setAllowConflict(false)

    setLoadingJadwal(true)
    Promise.all([
      fetchCatPengelolaJadwal({}).catch(() => ({ rows: [] })),
      fetchCatPengelolaUnitKerjaOptions().catch(() => []),
    ])
      .then(([jRes, ukRes]) => {
        setJadwalList(Array.isArray(jRes?.rows) ? jRes.rows : [])
        setUnitKerjaList(Array.isArray(ukRes) ? ukRes : [])
      })
      .finally(() => setLoadingJadwal(false))
  }, [isOpen])

  // Load active pegawai options (filtered optionally by Tim Kerja)
  useEffect(() => {
    if (!isOpen) return
    setLoadingPegawai(true)
    fetchCatPengelolaPegawaiOptions('', 500, unitKerjaFilter)
      .then((rows) => setPegawaiList(Array.isArray(rows) ? rows : []))
      .catch(() => setPegawaiList([]))
      .finally(() => setLoadingPegawai(false))
  }, [isOpen, unitKerjaFilter])

  // Fetch already-assigned members whenever jadwalId changes
  useEffect(() => {
    if (!isOpen || !jadwalId) {
      setExistingTimRows([])
      return
    }
    fetchCatPengelolaTim({ jadwal_id: jadwalId })
      .then((res) => setExistingTimRows(Array.isArray(res?.rows) ? res.rows : []))
      .catch(() => setExistingTimRows([]))
  }, [isOpen, jadwalId])

  // Initialize form rows when modal opens
  useEffect(() => {
    if (!isOpen) return
    if (editingMember) {
      setJadwalId(String(editingMember.jadwal_id || ''))
      setUnitKerjaFilter('')
      setMemberRows([
        createEmptyMemberRow({
          peran: editingMember.peran || 'Pengawas',
          nip: editingMember.nip || '',
          nama: editingMember.nama || '',
          pangkat_gol: editingMember.pangkat_gol || '',
          jabatan: editingMember.pegawai_jabatan || editingMember.jabatan || '',
          tanggal_mulai: editingMember.tanggal_mulai || editingMember.jadwal_tanggal_mulai || '',
          tanggal_selesai: editingMember.tanggal_selesai || editingMember.jadwal_tanggal_selesai || '',
          catatan: editingMember.catatan || '',
          _customDates: true,
        }),
      ])
    } else {
      const targetId = defaultJadwalId ? String(defaultJadwalId) : ''
      setJadwalId(targetId)
      setUnitKerjaFilter(defaultPrefill?.unitKerjaId ? String(defaultPrefill.unitKerjaId) : '')
      setMemberRows([
        createEmptyMemberRow({
          peran: 'Pengawas',
          nip: defaultPrefill?.nip || '',
          nama: defaultPrefill?.nama || '',
          pangkat_gol: defaultPrefill?.pangkat_gol || '',
          jabatan: defaultPrefill?.jabatan || '',
          tanggal_mulai: defaultPrefill?.tanggalMulai || '',
          tanggal_selesai: defaultPrefill?.tanggalSelesai || '',
          _customDates: Boolean(defaultPrefill?.tanggalMulai || defaultPrefill?.tanggalSelesai),
        }),
      ])
    }
  }, [isOpen, editingMember, defaultJadwalId, defaultPrefill])

  const selectedJadwal = useMemo(
    () => jadwalList.find((j) => String(j.id) === String(jadwalId)) || null,
    [jadwalList, jadwalId]
  )

  // Backfill schedule default dates onto untouched empty rows once jadwalList loads
  useEffect(() => {
    if (!isOpen || editingMember || !selectedJadwal) return
    setMemberRows((prev) =>
      prev.map((row) => {
        if (row._customDates || row.tanggal_mulai || row.tanggal_selesai) return row
        return {
          ...row,
          tanggal_mulai: selectedJadwal.tanggal_mulai || '',
          tanggal_selesai: selectedJadwal.tanggal_selesai || '',
        }
      })
    )
  }, [isOpen, editingMember, selectedJadwal])

  const selectedJadwalInstansi = useMemo(() => {
    if (!selectedJadwal) return ''
    if (Array.isArray(selectedJadwal.instansi_list) && selectedJadwal.instansi_list.length > 0) {
      return selectedJadwal.instansi_list
        .map((i) => i.instansi_nama || i.nama || i.instansi_id)
        .join(', ')
    }
    return selectedJadwal.instansi_nama || 'Lintas / Umum'
  }, [selectedJadwal])

  const jadwalOptions = useMemo(
    () =>
      jadwalList.map((j) => {
        const periode = j.jenis_periode_tahun || j.seleksi_periode || ''
        const meta = [
          j.jenis_tes_kode || j.jenis_tes_nama,
          periode,
          j.nama_seleksi,
          j.nama_tilok,
        ]
          .filter(Boolean)
          .join(' • ')
        return {
          value: String(j.id),
          label: meta ? `${j.nama_jadwal} — ${meta}` : j.nama_jadwal,
          raw: j,
        }
      }),
    [jadwalList]
  )

  const unitKerjaOptions = useMemo(
    () =>
      unitKerjaList.map((u) => ({
        value: String(u.id),
        label: u.nama,
      })),
    [unitKerjaList]
  )

  // Merge pegawaiList with any already-selected NIP on rows so cross-unit multi-row remains visible
  const pegawaiSelectOptions = useMemo(() => {
    const map = new Map()
    pegawaiList.forEach((p) => {
      const nip = String(p.nip || '')
      if (!nip) return
      map.set(nip, {
        value: nip,
        label: `${nip} — ${p.nama}`,
        raw: p,
      })
    })
    memberRows.forEach((r) => {
      const nip = String(r.nip || '')
      if (nip && !map.has(nip)) {
        map.set(nip, {
          value: nip,
          label: `${nip} — ${r.nama || nip}`,
          raw: {
            nip,
            nama: r.nama || nip,
            jabatan: r.jabatan || '',
            pangkat_gol: r.pangkat_gol || '',
          },
        })
      }
    })
    return Array.from(map.values())
  }, [pegawaiList, memberRows])

  const handleSelectJadwal = (val, optionObj) => {
    setJadwalId(val || '')
    const raw = optionObj?.raw || jadwalList.find((j) => String(j.id) === String(val))
    const nextStart = raw?.tanggal_mulai || ''
    const nextEnd = raw?.tanggal_selesai || ''

    setMemberRows((prev) =>
      prev.map((row) =>
        row._customDates
          ? row
          : {
              ...row,
              tanggal_mulai: nextStart,
              tanggal_selesai: nextEnd,
            }
      )
    )
  }

  const handleRowChange = (key, patch) => {
    setMemberRows((prev) => prev.map((row) => (row._key === key ? { ...row, ...patch } : row)))
  }

  const handleSelectRowPegawai = (key, nipVal, optionObj) => {
    const raw = optionObj?.raw || pegawaiList.find((p) => String(p.nip) === String(nipVal))
    handleRowChange(key, {
      nip: nipVal || '',
      nama: raw?.nama || '',
      jabatan: raw?.jabatan || '',
      pangkat_gol: raw?.pangkat_gol || '',
    })
  }

  const handleAddRow = () => {
    setMemberRows((prev) => [
      ...prev,
      createEmptyMemberRow({
        peran: 'Pengawas',
        tanggal_mulai: selectedJadwal?.tanggal_mulai || '',
        tanggal_selesai: selectedJadwal?.tanggal_selesai || '',
      }),
    ])
  }

  const handleRemoveRow = (key) => {
    setMemberRows((prev) => {
      if (prev.length <= 1) {
        return [
          createEmptyMemberRow({
            peran: 'Pengawas',
            tanggal_mulai: selectedJadwal?.tanggal_mulai || '',
            tanggal_selesai: selectedJadwal?.tanggal_selesai || '',
          }),
        ]
      }
      return prev.filter((row) => row._key !== key)
    })
  }

  const filledMemberCount = useMemo(
    () => memberRows.filter((r) => Boolean(r.nip)).length,
    [memberRows]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!jadwalId) {
      setErrorMsg('Cari dan pilih Jadwal Kegiatan CAT terlebih dahulu.')
      return
    }

    if (editingMember) {
      const row = memberRows[0]
      if (!row || !row.nip) {
        setErrorMsg('Pilih NIP Pegawai terlebih dahulu.')
        return
      }
      const startDate = row.tanggal_mulai || selectedJadwal?.tanggal_mulai || null
      const endDate = row.tanggal_selesai || selectedJadwal?.tanggal_selesai || startDate || null
      if (startDate && endDate && endDate < startDate) {
        setErrorMsg('Tanggal selesai tugas tidak boleh lebih awal dari tanggal mulai.')
        return
      }

      try {
        setIsSubmitting(true)
        setErrorMsg('')
        setConflicts([])
        await saveCatPengelolaTim({
          id: editingMember.id,
          jadwal_id: Number(jadwalId),
          peran: row.peran || 'Pengawas',
          nip: row.nip,
          nama: row.nama,
          pangkat_gol: row.pangkat_gol || '',
          jabatan: row.jabatan || '',
          tanggal_mulai: startDate,
          tanggal_selesai: endDate,
          catatan: String(row.catatan || '').trim() || null,
          allow_conflict: allowConflict,
        })
        onSuccess?.()
        onClose?.()
      } catch (err) {
        setErrorMsg(err?.message || 'Gagal memperbarui penugasan tim.')
        if (Array.isArray(err?.conflicts) && err.conflicts.length > 0) {
          setConflicts(err.conflicts)
        }
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    const activeRows = memberRows.filter((r) => Boolean(r.nip))
    if (activeRows.length === 0) {
      setErrorMsg('Pilih minimal 1 pegawai pada tabel tim terlebih dahulu.')
      return
    }

    const membersToSave = []
    const seenPairs = new Set()
    for (let i = 0; i < activeRows.length; i++) {
      const row = activeRows[i]
      const startDate = row.tanggal_mulai || selectedJadwal?.tanggal_mulai || null
      const endDate = row.tanggal_selesai || selectedJadwal?.tanggal_selesai || startDate || null
      if (startDate && endDate && endDate < startDate) {
        setErrorMsg(
          `Tanggal selesai pada baris "${row.nama || row.nip}" tidak boleh lebih awal dari tanggal mulai.`
        )
        return
      }
      const pairKey = `${row.nip}|${row.peran}`
      if (seenPairs.has(pairKey)) continue
      seenPairs.add(pairKey)

      membersToSave.push({
        nip: row.nip,
        nama: row.nama,
        pangkat_gol: row.pangkat_gol || '',
        jabatan: row.jabatan || '',
        peran: row.peran || 'Pengawas',
        tanggal_mulai: startDate,
        tanggal_selesai: endDate,
        catatan: String(row.catatan || '').trim() || null,
      })
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')
      setConflicts([])

      await saveCatPengelolaTim({
        jadwal_id: Number(jadwalId),
        peran: membersToSave[0].peran,
        tanggal_mulai: selectedJadwal?.tanggal_mulai || null,
        tanggal_selesai: selectedJadwal?.tanggal_selesai || null,
        allow_conflict: allowConflict,
        members: membersToSave,
      })

      onSuccess?.()
      onClose?.()
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menyimpan penugasan tim.')
      if (Array.isArray(err?.conflicts) && err.conflicts.length > 0) {
        setConflicts(err.conflicts)
      }
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
      <div className="modal-dialog-animated w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {editingMember ? 'Edit Penugasan Tim' : 'Setup Tim'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih jadwal kegiatan lalu atur peran, NIP/nama pegawai, dan tanggal tugas langsung dalam tabel 1 baris.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto clean-scrollbar p-5 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 text-xs text-rose-700 dark:text-rose-300 space-y-2">
              <div className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              {conflicts.length > 0 && (
                <div className="space-y-1.5 pl-6">
                  {conflicts.map((c, idx) => (
                    <div key={`${c.nip}-${idx}`} className="text-[11px]">
                      • <strong>{c.nama || c.nip}</strong> bentrok dengan jadwal{' '}
                      <em>{c.conflict_jadwal}</em> ({c.conflict_dates}) sebagai{' '}
                      <span className="uppercase font-bold">{c.conflict_peran}</span>
                    </div>
                  ))}
                  <label className="inline-flex items-center gap-2 pt-1 font-semibold text-amber-800 dark:text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowConflict}
                      onChange={(e) => setAllowConflict(e.target.checked)}
                      className="rounded border-amber-400"
                    />
                    <span>Tetap simpan penugasan meskipun jadwal bertumpukan</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Pilih Jadwal Kegiatan */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              1. Pilih Jadwal Kegiatan CAT <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              options={jadwalOptions}
              value={jadwalId}
              isLoading={loadingJadwal}
              placeholder="Cari nama jadwal, jenis tes, kegiatan, atau tilok..."
              onChange={handleSelectJadwal}
            />

            {selectedJadwal && (
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-200/60 dark:border-blue-900/40 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedJadwal.jenis_tes_nama || '-'}
                  {selectedJadwal.jenis_periode_tahun || selectedJadwal.seleksi_periode
                    ? ` (${selectedJadwal.jenis_periode_tahun || selectedJadwal.seleksi_periode})`
                    : ''}
                  {selectedJadwal.nama_seleksi ? ` • ${selectedJadwal.nama_seleksi}` : ''}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedJadwal.nama_tilok || '-'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {selectedJadwalInstansi}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                    Periode:{' '}
                    <strong>
                      {formatDateRangeId(selectedJadwal.tanggal_mulai, selectedJadwal.tanggal_selesai)}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Tabel Setting Anggota Tim (1 Baris per Member) */}
          <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                2. {editingMember ? 'Pengaturan Anggota Tim' : `Daftar Anggota Tim (${memberRows.length} Baris)`}
              </span>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-64">
                  <SearchableSelect
                    options={unitKerjaOptions}
                    value={unitKerjaFilter}
                    placeholder="Filter Tim Kerja Pegawai..."
                    onChange={(val) => setUnitKerjaFilter(val || '')}
                  />
                </div>
                {!editingMember && (
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="inline-flex items-center gap-1.5 px-3.5 h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Tambah Baris</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto clean-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-3 text-center whitespace-nowrap w-10">No</th>
                    <th className="py-3 px-3 whitespace-nowrap">Peran Tim</th>
                    <th className="py-3 px-3 whitespace-nowrap">Pegawai (NIP — Nama)</th>
                    <th className="py-3 px-3 whitespace-nowrap">Tanggal Mulai</th>
                    <th className="py-3 px-3 whitespace-nowrap">Tanggal Akhir</th>
                    <th className="py-3 px-3 whitespace-nowrap">Catatan</th>
                    {!editingMember && (
                      <th className="py-3 px-3 text-center whitespace-nowrap w-14">Hapus</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {memberRows.map((row, idx) => (
                    <tr
                      key={row._key}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-400 font-semibold tabular-nums whitespace-nowrap">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <select
                          value={row.peran}
                          onChange={(e) => handleRowChange(row._key, { peran: e.target.value })}
                          className="h-[38px] w-[132px] px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
                        >
                          {PENGELOLA_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2.5 px-3 min-w-[290px]">
                        <SearchableSelect
                          options={pegawaiSelectOptions}
                          value={row.nip}
                          isLoading={loadingPegawai}
                          placeholder="Ketik NIP atau nama pegawai..."
                          onChange={(val, opt) => handleSelectRowPegawai(row._key, val, opt)}
                        />
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <input
                          type="date"
                          value={row.tanggal_mulai}
                          onChange={(e) =>
                            handleRowChange(row._key, {
                              tanggal_mulai: e.target.value,
                              _customDates: true,
                            })
                          }
                          className="h-[38px] w-[140px] px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                        />
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <input
                          type="date"
                          value={row.tanggal_selesai}
                          onChange={(e) =>
                            handleRowChange(row._key, {
                              tanggal_selesai: e.target.value,
                              _customDates: true,
                            })
                          }
                          className="h-[38px] w-[140px] px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                        />
                      </td>

                      <td className="py-2.5 px-3 min-w-[150px]">
                        <input
                          type="text"
                          value={row.catatan}
                          onChange={(e) => handleRowChange(row._key, { catatan: e.target.value })}
                          placeholder="Ruang / Tugas..."
                          className="w-full h-[38px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                        />
                      </td>

                      {!editingMember && (
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row._key)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Anggota Sudah Terdaftar */}
          {!editingMember && jadwalId && existingTimRows.length > 0 && (
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 px-3.5 py-2.5 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sudah Terdaftar di Jadwal Ini ({existingTimRows.length} petugas)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {existingTimRows.map((ex) => (
                  <span
                    key={ex.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-semibold">{ex.nama}</span>
                    <span className="text-slate-400">({ex.peran})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'Menyimpan...'
                : editingMember
                ? 'Simpan Perubahan'
                : `Simpan Penugasan Tim${filledMemberCount > 0 ? ` (${filledMemberCount})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
