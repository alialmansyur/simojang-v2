import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  UserX,
  Award,
  AlertTriangle,
  Pencil,
  Trash2,
  Eye,
  Clock,
  Building2,
  ArrowLeft,
} from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { StatistikPegawaiModal } from './components/StatistikPegawaiModal'
import { PegawaiDetailModal } from './components/PegawaiDetailModal'
import { SearchableSelect } from '../../../components/ui/SearchableSelect'
import {
  fetchStatistikPegawaiSummary,
  fetchStatistikPegawaiData,
  deleteStatistikPegawaiData,
  importBatchStatistikPegawai,
  fetchMasterUnitKerja,
  toggleStatusPegawai,
} from '../../../services/api/tuServicesApi'

export default function StatistikInternalPage() {
  const navigate = useNavigate()
  const [unitKerjaList, setUnitKerjaList] = useState([])
  const [selectedUnit, setSelectedUnit] = useState('')
  const [detailItem, setDetailItem] = useState(null)
  const [tableRefreshKey, setTableRefreshKey] = useState(0)

  // Load Unit Kerja for react-select Searchable Dropdown
  useEffect(() => {
    let active = true
    const loadUnit = async () => {
      try {
        const list = await fetchMasterUnitKerja()
        if (active) setUnitKerjaList(Array.isArray(list) ? list : [])
      } catch (err) {
        console.warn('Gagal memuat list unit kerja:', err)
      }
    }
    loadUnit()
    return () => {
      active = false
    }
  }, [])

  // Format unit kerja options for react-select SearchableSelect
  const unitOptions = useMemo(() => {
    return unitKerjaList.map((uk) => ({
      value: uk.nama,
      label: uk.nama,
    }))
  }, [unitKerjaList])

  // 4 Bento KPI Cards
  const renderKpis = (summary) => [
    {
      id: 'total_pegawai',
      label: 'TOTAL PEGAWAI INTERNAL',
      value: summary?.total_pegawai ?? 0,
      unit: 'Pegawai',
      context: 'Master seluruh ASN Kanreg III',
      badge: 'PNS & PPPK',
      badgeColor: 'blue',
      icon: Users,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_aktif',
      label: 'PEGAWAI AKTIF',
      value: summary?.total_aktif ?? 0,
      unit: 'ASN',
      context: `${summary?.persen_aktif ?? 0}% Tingkat Keaktifan`,
      badge: 'Aktif',
      badgeColor: 'emerald',
      icon: UserCheck,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_nonaktif',
      label: 'PEGAWAI NON-AKTIF',
      value: summary?.total_nonaktif ?? 0,
      unit: 'Pegawai',
      context: `${summary?.persen_nonaktif ?? 0}% Purna Tugas / Mutasi`,
      badge: 'Nonaktif',
      badgeColor: 'rose',
      icon: UserX,
      iconColor: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    },
    {
      id: 'menjelang_bup',
      label: 'MENJELANG BUP (57 TH)',
      value: summary?.total_menjelang_bup ?? 0,
      unit: 'Pegawai',
      context: 'Masa persiapan pensiun 1 tahun',
      badge: 'Proyeksi Pensiun',
      badgeColor: 'amber',
      icon: AlertTriangle,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
  ]

  // Nav/Tabs: Bersih tanpa ambigu "Semua" ganda:
  // Toolbar otomatis menyajikan tab default "Semua", diikuti kategori berikut:
  const categories = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'nonaktif', label: 'Nonaktif' },
    { value: 'bup', label: 'Menjelang BUP' },
    { value: 'pns', label: 'PNS' },
    { value: 'pppk', label: 'PPPK' },
    { value: 'pppk_pw', label: 'PPPK PW' },
    { value: 'magang', label: 'MAGANG' },
  ]

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

  // Handle Toggle Status Keaktifan Pegawai
  const handleToggleStatus = async (item) => {
    const currentStatus = item.is_status === 1 || item.is_status === '1' || item.is_status === true
    const newStatus = currentStatus ? 0 : 1
    const actionText = newStatus === 1 ? 'mengaktifkan' : 'menonaktifkan'

    if (!window.confirm(`Apakah Anda yakin ingin ${actionText} data pegawai "${item.nama}"?`)) {
      return
    }

    try {
      await toggleStatusPegawai(item.id, newStatus)
      setTableRefreshKey((prev) => prev + 1)
    } catch (err) {
      alert(err?.message || 'Gagal mengubah status pegawai.')
    }
  }

  // 6 Kolom Standar Adaptif Master SSOT
  const columns = [
    { header: 'PEGAWAI' },
    { header: 'UNIT KERJA' },
    { header: 'JABATAN' },
    { header: 'STATUS' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  // Table Row Renderer: Standar BKN Master SSOT
  const renderRow = (item, rowNo, onEdit, onDelete) => {
    const isAktif = item.is_status === 1 || item.is_status === '1' || item.is_status === true

    return (
      <tr
        key={item.id || rowNo}
        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Kolom 1: PEGAWAI (Info Golongan DIHILANGKAN sesuai instruksi) */}
        <td className="py-3.5 px-4">
          <div className="flex items-center gap-3">
            <TuDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setDetailItem(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.nama}
              >
                {item.nama}
              </button>
              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                NIP. {item.nip}
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: UNIT KERJA */}
        <td className="py-3.5 px-4">
          {item.unit_kerja ? (
            <div className="flex flex-wrap gap-1 max-w-[240px]" title={item.unit_kerja}>
              {item.unit_kerja.split(',').map((uk, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 truncate max-w-[220px]"
                >
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{uk.trim()}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </td>

        {/* Kolom 3: JABATAN */}
        <td className="py-3.5 px-4">
          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-xs">
            {item.jabatan || '-'}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {item.jenis_jabatan || '-'}
            </span>
            {item.status_pegawai && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                {item.status_pegawai}
              </span>
            )}
          </div>
        </td>

        {/* Kolom 4: STATUS (Murni Toggle Switch & Status Aktif/Tidak) */}
        <td className="py-3.5 px-4 whitespace-nowrap">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleToggleStatus(item)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAktif ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title={isAktif ? 'Klik untuk Menonaktifkan Pegawai' : 'Klik untuk Mengaktifkan Pegawai'}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAktif ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isAktif
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              {isAktif ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          {item.status_bup && item.status_bup !== 'Aktif' && (
            <div className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{item.status_bup}</span>
            </div>
          )}
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="py-3.5 px-4 whitespace-nowrap">
          <TuTanggalCell value={item.tmt_golongan || item.tmt_jabatan || item.created_at} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="py-3.5 px-4 whitespace-nowrap">
          <TuPetugasCell value={item.created_by || item.pengelola || 'Admin Kepegawaian'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="py-3.5 px-4 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setDetailItem(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Profil Pegawai"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              title="Ubah Data"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Pegawai"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  // Wrapper Fetcher to handle tab mode & unit filter
  const customFetchData = useCallback(
    (params) => {
      const modeParam = params.category || params.kategori || params.mode || ''
      return fetchStatistikPegawaiData({
        ...params,
        mode: modeParam && modeParam !== 'all' ? modeParam : 'pegawai',
        unit: selectedUnit ? [selectedUnit] : [],
      })
    },
    [selectedUnit, tableRefreshKey]
  )

  const customFetchSummary = useCallback(
    () => {
      return fetchStatistikPegawaiSummary({
        unit: selectedUnit ? [selectedUnit] : [],
      })
    },
    [selectedUnit, tableRefreshKey]
  )

  // Extra Toolbar Controls: Searchable react-select Tim Kerja di samping Filter Periode
  const extraToolbarControls = (
    <div className="w-full sm:w-64 md:w-72 shrink-0">
      <SearchableSelect
        options={unitOptions}
        value={selectedUnit}
        onChange={(val) => setSelectedUnit(val?.value ?? val ?? '')}
        placeholder="Pilih Tim Kerja / Bidang..."
        isClearable={true}
      />
    </div>
  )

  // Extra Header Actions: Tombol Kembali ke Hub
  const extraHeaderActions = (
    <button
      type="button"
      onClick={() => navigate('/layanan/statistik-internal')}
      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/60 dark:border-slate-800"
      title="Kembali ke Portal Hub Statistik Internal"
    >
      <ArrowLeft className="w-4 h-4 text-slate-500" />
      <span>Kembali ke Hub</span>
    </button>
  )

  // Banner Warning: Tepat di atas Section Filter (dinamis dari API summary)
  const bannerWarning = (summary) => {
    const bupCount = Number(summary?.total_menjelang_bup ?? 0)
    if (bupCount <= 0) return null
    return (
      <div className="p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-900/40 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold">Pemutakhiran Proyeksi Batas Usia Pensiun (BUP):</span>{' '}
            <span>
              Terdapat <strong>{bupCount} Pegawai</strong> yang berada dalam kategori menjelang BUP (usia 57 tahun).
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TuCrudLayoutShell
        key={tableRefreshKey}
        layananId={35}
        serviceTitle="Data Pegawai Internal"
        shortTitle="Pegawai Internal"
        timKerjaTitle="Tata Usaha"
        timKerjaPath="/tim-kerja/tu"
        description="Pengelolaan master profil pegawai internal, status keaktifan ASN, dan proyeksi batas usia pensiun."
        templateUrl="/templates/tu/template-statistik-pegawai-internal.xlsx"
        templateName="template-statistik-pegawai-internal.xlsx"
        fetchSummaryFn={customFetchSummary}
        fetchDataFn={customFetchData}
        deleteDataFn={deleteStatistikPegawaiData}
        batchUploadFn={importBatchStatistikPegawai}
        renderKpis={renderKpis}
        columns={columns}
        renderRow={renderRow}
        FormComponent={StatistikPegawaiModal}
        categories={categories}
        defaultCategory=""
        searchPlaceholder="Cari NIP, nama lengkap, jabatan..."
        addNewLabel="Tambah Pegawai"
        batchUploadLabel="Upload Excel"
        bannerSection={bannerWarning}
        extraToolbarControls={extraToolbarControls}
        extraHeaderActions={extraHeaderActions}
        showMonthFilter={false}
      />

      {/* Modal Detail Profil Pegawai */}
      {detailItem && (
        <PegawaiDetailModal
          isOpen={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          data={detailItem}
        />
      )}
    </div>
  )
}
