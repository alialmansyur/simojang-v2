import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Loader2,
  UserCheck,
  AlertCircle,
  Building2,
  Award,
  ShieldCheck,
  KeyRound,
} from 'lucide-react'
import { SearchableSelect } from '../../../../components/ui/SearchableSelect'
import {
  storeStatistikPegawaiData,
  fetchMasterUnitKerja,
  fetchMasterUnitSK,
  fetchMasterJenisJabatan,
  fetchMasterJenisPegawai,
  fetchMasterJabatan,
  fetchMasterPendidikan,
  fetchMasterAgama,
  fetchMasterGolongan,
  fetchMasterPangkat,
} from '../../../../services/api/tuServicesApi'

const GENDER_OPTIONS = [
  { value: '1', label: 'Laki-laki (Pria)' },
  { value: '2', label: 'Perempuan (Wanita)' },
]

const NIKAH_OPTIONS = [
  { value: 'Menikah', label: 'Menikah' },
  { value: 'Belum Menikah', label: 'Belum Menikah' },
  { value: 'Duda / Janda', label: 'Duda / Janda' },
]

export function StatistikPegawaiModal({ isOpen, onClose, onSuccess, initialData }) {
  // Form State
  const [nip, setNip] = useState('')
  const [nama, setNama] = useState('')
  const [gender, setGender] = useState('1')
  const [tglLahir, setTglLahir] = useState('')
  const [menikah, setMenikah] = useState('Menikah')
  const [statusPegawaiId, setStatusPegawaiId] = useState('1')
  const [agamaId, setAgamaId] = useState('1')
  const [pendidikanId, setPendidikanId] = useState('9')
  const [unitKerjaId, setUnitKerjaId] = useState('13')
  const [unitSkId, setUnitSkId] = useState('1')
  const [jenisJabatanId, setJenisJabatanId] = useState('1')
  const [jabatanId, setJabatanId] = useState('')
  const [golId, setGolId] = useState('10')
  const [pangkatId, setPangkatId] = useState('10')
  const [tmtGol, setTmtGol] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingMaster, setIsLoadingMaster] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Raw Options State
  const [unitKerjaOptions, setUnitKerjaOptions] = useState([])
  const [unitSkOptions, setUnitSkOptions] = useState([])
  const [jenisJabatanOptions, setJenisJabatanOptions] = useState([])
  const [jenisPegawaiOptions, setJenisPegawaiOptions] = useState([])
  const [jabatanOptions, setJabatanOptions] = useState([])
  const [pendidikanOptions, setPendidikanOptions] = useState([])
  const [agamaOptions, setAgamaOptions] = useState([])
  const [golonganOptions, setGolonganOptions] = useState([])
  const [pangkatOptions, setPangkatOptions] = useState([])

  // Load Master Options
  useEffect(() => {
    let isMounted = true
    const loadMasterData = async () => {
      try {
        setIsLoadingMaster(true)
        const [uk, usk, jj, jp, pend, agm, gol, pkt] = await Promise.all([
          fetchMasterUnitKerja(),
          fetchMasterUnitSK(),
          fetchMasterJenisJabatan(),
          fetchMasterJenisPegawai(),
          fetchMasterPendidikan(),
          fetchMasterAgama(),
          fetchMasterGolongan(),
          fetchMasterPangkat(),
        ])
        if (isMounted) {
          setUnitKerjaOptions(Array.isArray(uk) ? uk : [])
          setUnitSkOptions(Array.isArray(usk) ? usk : [])
          setJenisJabatanOptions(Array.isArray(jj) ? jj : [])
          setJenisPegawaiOptions(Array.isArray(jp) ? jp : [])
          setPendidikanOptions(Array.isArray(pend) ? pend : [])
          setAgamaOptions(Array.isArray(agm) ? agm : [])
          setGolonganOptions(Array.isArray(gol) ? gol : [])
          setPangkatOptions(Array.isArray(pkt) ? pkt : [])
        }
      } catch (err) {
        console.warn('Gagal memuat master dropdown:', err)
      } finally {
        if (isMounted) setIsLoadingMaster(false)
      }
    }

    if (isOpen) {
      loadMasterData()
    }
    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Chained dropdown for Jabatan when unitSkId changes
  useEffect(() => {
    let isMounted = true
    const loadJabatan = async () => {
      try {
        const jList = await fetchMasterJabatan({ unit_sk: unitSkId })
        if (isMounted) {
          setJabatanOptions(Array.isArray(jList) ? jList : [])
          if (Array.isArray(jList) && jList.length > 0 && !jabatanId) {
            setJabatanId(String(jList[0].id))
          }
        }
      } catch (err) {
        console.warn('Gagal memuat list jabatan:', err)
      }
    }
    if (isOpen) {
      loadJabatan()
    }
    return () => {
      isMounted = false
    }
  }, [isOpen, unitSkId])

  // Populate Initial Data
  useEffect(() => {
    if (initialData) {
      setNip(initialData.nip || '')
      setNama(initialData.nama || '')
      setGender(String(initialData.gender || '1'))
      setTglLahir(initialData.tgl_lahir || '')

      // Normalisasi status pernikahan
      const rawMenikah = String(initialData.menikah || '').trim()
      if (rawMenikah === 'Belum Kawin') {
        setMenikah('Belum Menikah')
      } else if (rawMenikah === 'Janda' || rawMenikah === 'Janda / Duda' || rawMenikah === 'Duda') {
        setMenikah('Duda / Janda')
      } else {
        setMenikah(rawMenikah || 'Menikah')
      }

      // Normalisasi status kepegawaian (mendukung integer id maupun legacy string 'PNS', 'PPPK', dll)
      const rawStatus = String(initialData.status_pegawai_id || initialData.status_pegawai || '1').toUpperCase().trim()
      let resolvedStatus = '1'
      if (rawStatus === '2' || rawStatus === 'PPPK') {
        resolvedStatus = '2'
      } else if (rawStatus === '3' || rawStatus.includes('PW') || rawStatus.includes('PARUH')) {
        resolvedStatus = '3'
      } else if (rawStatus === '4' || rawStatus === 'PPNPN') {
        resolvedStatus = '4'
      } else if (rawStatus === '5' || rawStatus === 'MAGANG') {
        resolvedStatus = '5'
      } else if (/^\d+$/.test(rawStatus)) {
        resolvedStatus = rawStatus
      }
      setStatusPegawaiId(resolvedStatus)

      setAgamaId(String(initialData.agama_id || '1'))
      setPendidikanId(String(initialData.pendidikan_id || '9'))

      // Jika unit_kerja_id multiple dipisah koma (misal '18,22'), ambil unit utama yang pertama
      const rawUk = String(initialData.unit_kerja_id || '13').split(',')[0].trim()
      setUnitKerjaId(rawUk || '13')

      setUnitSkId(String(initialData.unit_sk_id || '1'))
      setJenisJabatanId(String(initialData.jenis_jabatan_id || '1'))
      setJabatanId(initialData.jabatan_id ? String(initialData.jabatan_id) : '')
      setGolId(String(initialData.gol_id || '10'))

      // Normalisasi pangkat: abaikan 0 atau null untuk PPPK
      const rawPkt = initialData.pangkat_id ? String(initialData.pangkat_id) : ''
      setPangkatId(rawPkt === '0' ? '' : rawPkt)

      setTmtGol(initialData.tmt_gol || '')
      setPhone(initialData.phone || '')
      setEmail(initialData.email || '')
    } else {
      setNip('')
      setNama('')
      setGender('1')
      setTglLahir('')
      setMenikah('Menikah')
      setStatusPegawaiId('1')
      setAgamaId('1')
      setPendidikanId('9')
      setUnitKerjaId('13')
      setUnitSkId('1')
      setJenisJabatanId('1')
      setJabatanId('')
      setGolId('10')
      setPangkatId('10')
      setTmtGol('')
      setPhone('')
      setEmail('')
    }
    setErrorMsg('')
  }, [initialData, isOpen])

  // Normalization for SearchableSelect options
  const mappedUnitKerja = useMemo(
    () => unitKerjaOptions.map((o) => ({ value: String(o.id), label: o.nama })),
    [unitKerjaOptions]
  )
  const mappedUnitSk = useMemo(
    () => unitSkOptions.map((o) => ({ value: String(o.id), label: o.nama })),
    [unitSkOptions]
  )
  const mappedJenisJabatan = useMemo(
    () => jenisJabatanOptions.map((o) => ({ value: String(o.id), label: o.nama })),
    [jenisJabatanOptions]
  )
  const mappedJenisPegawai = useMemo(
    () => jenisPegawaiOptions.map((o) => ({ value: String(o.id), label: o.nama })),
    [jenisPegawaiOptions]
  )
  const mappedJabatan = useMemo(
    () =>
      jabatanOptions.map((o) => ({
        value: String(o.id),
        label: `${o.nama}${o.kelas_jabatan ? ` (Kelas ${o.kelas_jabatan})` : ''}`,
      })),
    [jabatanOptions]
  )
  const mappedPendidikan = useMemo(
    () => pendidikanOptions.map((o) => ({ value: String(o.id), label: o.nama })),
    [pendidikanOptions]
  )
  const mappedAgama = useMemo(
    () => agamaOptions.map((o) => ({ value: String(o.id), label: o.nama })),
    [agamaOptions]
  )
  const mappedGolongan = useMemo(
    () => golonganOptions.map((o) => ({ value: String(o.id), label: o.nama })),
    [golonganOptions]
  )
  const mappedPangkat = useMemo(
    () => pangkatOptions.map((o) => ({ value: String(o.id), label: o.nama })),
    [pangkatOptions]
  )

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!nip || nip.length < 8) {
      setErrorMsg('NIP wajib diisi dengan minimal 8 karakter valid.')
      return
    }
    if (!nama || nama.trim().length < 3) {
      setErrorMsg('Nama lengkap wajib diisi minimal 3 karakter.')
      return
    }

    if (!statusPegawaiId) {
      setErrorMsg('Status Kepegawaian wajib dipilih.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg('')

      await storeStatistikPegawaiData({
        key: initialData?.id || '',
        nip: nip.trim(),
        nama: nama.trim(),
        gender,
        tgl_lahir: tglLahir,
        menikah,
        status_pegawai: statusPegawaiId,
        agama: agamaId,
        pendidikan: pendidikanId,
        unit_kerja: unitKerjaId,
        unit_sk: unitSkId,
        jenis_jabatan: jenisJabatanId,
        jabatan: jabatanId,
        golongan: golId,
        pangkat: pangkatId,
        tmt_gol: tmtGol,
        phone,
        email,
      })

      if (onSuccess) onSuccess()
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal menyimpan data pegawai.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs modal-backdrop-animated overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose?.()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden modal-dialog-animated my-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <UserCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Ubah Data Pegawai Internal' : 'Tambah Pegawai Internal Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan profil induk kepegawaian ASN Kantor Regional III BKN Bandung.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 clean-scrollbar">
          {/* Helper Banner Akun Login */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex items-center gap-3 text-xs text-[#175CD3] dark:text-blue-300">
            <KeyRound className="w-5 h-5 shrink-0 text-[#175CD3] dark:text-blue-400" />
            <div>
              <span className="font-bold">Otomatisasi Akun SIMOJANG:</span>{' '}
              <span>
                Pegawai yang ditambahkan otomatis memiliki akun pengguna dengan username <strong>NIP</strong> dan kata sandi default <strong>NIP</strong>.
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identitas Pokok Pegawai */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-4 h-4 text-[#175CD3]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Identitas Pokok Pegawai
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  NIP Pegawai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="199707252024211004"
                  required
                  readOnly={Boolean(initialData)}
                  className={`w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold ${
                    initialData
                      ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-500'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                  }`}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Ali Al Mansyur, S.Kom."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={GENDER_OPTIONS}
                  value={gender}
                  onChange={(val) => setGender(val?.value ?? val ?? '1')}
                  placeholder="Pilih Gender"
                  isClearable={false}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={tglLahir}
                  onChange={(e) => setTglLahir(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status Pernikahan
                </label>
                <SearchableSelect
                  options={NIKAH_OPTIONS}
                  value={menikah}
                  onChange={(val) => setMenikah(val?.value ?? val ?? 'Menikah')}
                  placeholder="Pilih Status"
                  isClearable={false}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Agama
                </label>
                <SearchableSelect
                  options={mappedAgama}
                  value={agamaId}
                  onChange={(val) => setAgamaId(val?.value ?? val ?? '')}
                  placeholder="Pilih Agama"
                  isLoading={isLoadingMaster}
                  isClearable={false}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status Kepegawaian <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={mappedJenisPegawai}
                  value={statusPegawaiId}
                  onChange={(val) => setStatusPegawaiId(val?.value ?? val ?? '')}
                  placeholder="PNS / PPPK / Magang"
                  isLoading={isLoadingMaster}
                  isClearable={false}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pendidikan Terakhir
                </label>
                <SearchableSelect
                  options={mappedPendidikan}
                  value={pendidikanId}
                  onChange={(val) => setPendidikanId(val?.value ?? val ?? '')}
                  placeholder="Pilih Jenjang Pendidikan"
                  isLoading={isLoadingMaster}
                  isClearable={false}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Penempatan & Jabatan */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Unit Penempatan & Jabatan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Unit Kerja / Tim Kerja <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={mappedUnitKerja}
                  value={unitKerjaId}
                  onChange={(val) => setUnitKerjaId(val?.value ?? val ?? '')}
                  placeholder="Pilih Tim Kerja"
                  isLoading={isLoadingMaster}
                  isClearable={false}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Unit SK Induk <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={mappedUnitSk}
                  value={unitSkId}
                  onChange={(val) => setUnitSkId(val?.value ?? val ?? '')}
                  placeholder="Kantor Regional III / UPT"
                  isLoading={isLoadingMaster}
                  isClearable={false}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Jenis Jabatan <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={mappedJenisJabatan}
                  value={jenisJabatanId}
                  onChange={(val) => setJenisJabatanId(val?.value ?? val ?? '')}
                  placeholder="Struktural / Fungsional / Pelaksana"
                  isLoading={isLoadingMaster}
                  isClearable={false}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Jabatan Riil <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={mappedJabatan}
                  value={jabatanId}
                  onChange={(val) => setJabatanId(val?.value ?? val ?? '')}
                  placeholder="Pilih atau cari jabatan..."
                  isClearable={false}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kepangkatan & Kontak */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. Kepangkatan & Kontak Dinas
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Golongan Ruang
                </label>
                <SearchableSelect
                  options={mappedGolongan}
                  value={golId}
                  onChange={(val) => setGolId(val?.value ?? val ?? '')}
                  placeholder="Pilih Golongan"
                  isLoading={isLoadingMaster}
                  isClearable={false}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pangkat
                </label>
                <SearchableSelect
                  options={mappedPangkat}
                  value={pangkatId}
                  onChange={(val) => setPangkatId(val?.value ?? val ?? '')}
                  placeholder="Pilih Pangkat"
                  isLoading={isLoadingMaster}
                  isClearable={false}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  TMT Golongan
                </label>
                <input
                  type="date"
                  value={tmtGol}
                  onChange={(e) => setTmtGol(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Dinas / Pribadi
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ali.mansyur@bkn.go.id"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white" />}
              <span>{initialData ? 'Simpan Perubahan' : 'Simpan Data Pegawai'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
