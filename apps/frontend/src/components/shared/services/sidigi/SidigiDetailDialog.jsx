import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Search,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Layers,
  Download,
  Clock,
  User,
  FolderArchive,
  ShieldAlert,
  Network,
  FileText,
  ExternalLink,
} from 'lucide-react'

const STAT_COLUMNS_MAP = {
  'Jumlah ASN': [
    { key: 'pns', label: 'PNS' },
    { key: 'pppk', label: 'PPPK' },
    { key: 'pppk_pw', label: 'PPPK PW' },
    { key: 'jumlah', label: 'Total ASN', highlight: true },
  ],
  'Golongan ASN': [
    { key: 'pns_gol_i', label: 'PNS I' },
    { key: 'pns_gol_ii', label: 'PNS II' },
    { key: 'pns_gol_iii', label: 'PNS III' },
    { key: 'pns_gol_iv', label: 'PNS IV' },
    { key: 'pppk_gol_v', label: 'PPPK V' },
    { key: 'pppk_gol_vii', label: 'PPPK VII' },
    { key: 'pppk_gol_ix', label: 'PPPK IX' },
    { key: 'pppk_gol_x', label: 'PPPK X' },
    { key: 'pppk_pw_gol_v_x', label: 'PPPK PW' },
    { key: 'jumlah', label: 'Total ASN', highlight: true },
  ],
  'Jenis Kelamin ASN': [
    { key: 'pns_pria', label: 'PNS Pria' },
    { key: 'pns_wanita', label: 'PNS Wanita' },
    { key: 'pppk_pria', label: 'PPPK Pria' },
    { key: 'pppk_wanita', label: 'PPPK Wanita' },
    { key: 'pppk_pw_pria', label: 'PPPK PW Pria' },
    { key: 'pppk_pw_wanita', label: 'PPPK PW Wanita' },
    { key: 'jumlah', label: 'Total ASN', highlight: true },
  ],
  'Pendidikan ASN': [
    { key: 'pns_sma', label: 'PNS SMA' },
    { key: 'pns_d3', label: 'PNS D3' },
    { key: 'pns_s1', label: 'PNS S1' },
    { key: 'pns_s2', label: 'PNS S2' },
    { key: 'pns_s3', label: 'PNS S3' },
    { key: 'pppk_sma', label: 'PPPK SMA' },
    { key: 'pppk_d3', label: 'PPPK D3' },
    { key: 'pppk_s1', label: 'PPPK S1' },
    { key: 'pppk_s2', label: 'PPPK S2' },
    { key: 'jumlah', label: 'Total ASN', highlight: true },
  ],
  'Usia ASN': [
    { key: 'pns_kurang_sama_31', label: 'PNS <=31' },
    { key: 'pns_31_40', label: 'PNS 31-40' },
    { key: 'pns_41_50', label: 'PNS 41-50' },
    { key: 'pns_lebih_sama_51', label: 'PNS >=51' },
    { key: 'pppk_kurang_sama_31', label: 'PPPK <=31' },
    { key: 'pppk_31_40', label: 'PPPK 31-40' },
    { key: 'pppk_41_50', label: 'PPPK 41-50' },
    { key: 'pppk_lebih_sama_51', label: 'PPPK >=51' },
    { key: 'jumlah', label: 'Total ASN', highlight: true },
  ],
  'Generasi ASN': [
    { key: 'pns_pppk_baby_boomer', label: 'Boomer' },
    { key: 'pns_pppk_gen_x', label: 'Gen X' },
    { key: 'pns_pppk_gen_y', label: 'Gen Y' },
    { key: 'pns_pppk_gen_z', label: 'Gen Z' },
    { key: 'pppk_pw_gen_x', label: 'PW Gen X' },
    { key: 'pppk_pw_gen_y', label: 'PW Gen Y' },
    { key: 'pppk_pw_gen_z', label: 'PW Gen Z' },
    { key: 'jumlah', label: 'Total ASN', highlight: true },
  ],
  'Kelompok Jabatan ASN': [
    { key: 'pns_jpt_pratama', label: 'JPT Pratama' },
    { key: 'pns_administrator', label: 'Administrator' },
    { key: 'pns_pengawas', label: 'Pengawas' },
    { key: 'pns_jf_guru', label: 'JF Guru' },
    { key: 'pns_jf_nakes', label: 'JF Nakes' },
    { key: 'pns_jf_teknis', label: 'JF Teknis' },
    { key: 'pns_pelaksana', label: 'Pelaksana' },
    { key: 'pppk_jf_guru', label: 'PPPK Guru' },
    { key: 'pppk_jf_nakes', label: 'PPPK Nakes' },
    { key: 'pppk_jf_teknis', label: 'PPPK Teknis' },
    { key: 'jumlah', label: 'Total ASN', highlight: true },
  ],
  'Masa Kerja ASN': [
    { key: 'masa_kerja_0_10', label: '0-10 Thn' },
    { key: 'masa_kerja_11_20', label: '11-20 Thn' },
    { key: 'masa_kerja_21_30', label: '21-30 Thn' },
    { key: 'masa_kerja_lebih_30', label: '>30 Thn' },
    { key: 'masa_kerja_pw', label: 'PPPK PW' },
    { key: 'jumlah', label: 'Total ASN', highlight: true },
  ],
}

export function SidigiDetailDialog({
  isOpen,
  onClose,
  title = 'Rincian Detail Berkas',
  subtitle = 'Daftar audit dan verifikasi data aktual dari server.',
  data = [],
  isLoading = false,
  type = 'generic',
  selectedItem = null,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    if (!isOpen) return undefined
    setSearchTerm('')
    setPage(1)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const items = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) return data
    return selectedItem ? [selectedItem] : []
  }, [data, selectedItem])

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const q = searchTerm.toLowerCase()
    return items.filter((item) =>
      Object.entries(item).some(([k, val]) => {
        if (k === 'id' || k === 'uid' || k.endsWith('_id')) return false
        return String(val || '').toLowerCase().includes(q)
      })
    )
  }, [items, searchTerm])

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  const statColumns = useMemo(() => {
    const jenis = selectedItem?.jenis || items[0]?.jenis_kategori || 'Jumlah ASN'
    return STAT_COLUMNS_MAP[jenis] || STAT_COLUMNS_MAP['Jumlah ASN']
  }, [selectedItem, items])

  if (!isOpen || typeof document === 'undefined') return null

  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(Number(num || 0))
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '0000-00-00') return '-'
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

  const renderBadgeCheck = (val) => {
    const isOk = Number(val) === 1 || val === true || val === '1'
    return isOk ? (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded">
        <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
        <span>Ada</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
        <XCircle className="w-3 h-3" />
        <span>Nihil</span>
      </span>
    )
  }

  const handleExportCsv = () => {
    if (filteredItems.length === 0) return
    const excludedKeys = new Set(['id', 'uid', 'log_id', 'dms_log_id', 'takah_log_id', 'disparitas_log_id', 'asn_log_id', 'instansi_id', 'rw_integrasi_id', 'integrasi_id', 'modul_id', 'scema_group', 'logo'])
    const keys = Object.keys(filteredItems[0] || {}).filter((k) => !excludedKeys.has(k))
    const headers = keys.join(',')
    const rows = filteredItems.map((row) =>
      keys
        .map((k) => {
          const val = row[k] === null || row[k] === undefined ? '' : String(row[k])
          return `"${val.replace(/"/g, '""')}"`
        })
        .join(',')
    )
    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Detail_SIDIGI_${type}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const isDmsNipMode = type === 'dms' && (items[0]?.detail_mode === 'detail_nip' || items[0]?.nip)

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden modal-dialog-animated">
        {/* 1. Header Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/40 shrink-0">
              {type === 'takah' ? (
                <FolderArchive className="w-5 h-5" />
              ) : type === 'disparitas' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : type === 'integrasi' ? (
                <Network className="w-5 h-5" />
              ) : type === 'pnbp' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {title}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase shrink-0">
                  {type.toUpperCase()}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle} • {filteredItems.length} data tercatat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
              title="Unduh detail ke CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Tutup modal detail"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Bento Card Ringkasan */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/30 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>Entitas / Berkas</span>
              </div>
              <div
                className="font-bold text-slate-900 dark:text-white mt-1 truncate"
                title={selectedItem?.instansi_name || selectedItem?.nama_instansi || selectedItem?.file_name || selectedItem?.nama || 'Berkas Data'}
              >
                {selectedItem?.instansi_name || selectedItem?.nama_instansi || selectedItem?.file_name || selectedItem?.nama || selectedItem?.doc_number || 'Berkas Terarsip'}
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                {selectedItem?.period ? `Periode: ${selectedItem.period}` : 'Tersinkron'}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" />
                <span>Kategori / Modul</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-1 truncate">
                {selectedItem?.jenis || selectedItem?.jenis_anomali_single || selectedItem?.step_name || selectedItem?.doc_type || 'Data Kepegawaian'}
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                Layanan Sistem Informasi
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Waktu Log / Upload</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-1">
                {formatDate(selectedItem?.created_at || selectedItem?.period_date)}
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                {selectedItem?.period_date && selectedItem.period_date !== '0000-00-00'
                  ? `Tgl Periode: ${formatDate(selectedItem.period_date)}`
                  : 'Tanggal Pencatatan'}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Petugas / Pengunggah</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white mt-1 truncate">
                {selectedItem?.created_by || selectedItem?.pic || 'Admin SIDIGI'}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                Terverifikasi
              </div>
            </div>
          </div>
        </div>

        {/* 3. Toolbar Pencarian */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              placeholder="Cari NIP, nama, instansi, atau keterangan..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#175CD3]/20"
            />
          </div>

          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Ditemukan {filteredItems.length} Data
          </span>
        </div>

        {/* 4. Data Breakdown Section */}
        <div className="flex-1 overflow-auto clean-scrollbar p-6">
          {isLoading ? (
            <div className="py-20 text-center text-xs font-semibold text-slate-400 animate-pulse">
              Memuat detail data aktual dari server...
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="py-20 text-center text-xs font-semibold text-slate-400">
              Tidak ada data detail yang sesuai kriteria pencarian.
            </div>
          ) : type === 'takah' ? (
            /* Takah 11-Element Physical Checklist Table */
            <div className="overflow-x-auto clean-scrollbar border border-slate-200/60 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Pegawai & Instansi</th>
                    <th className="py-3 px-2 text-center">D2NIP</th>
                    <th className="py-3 px-2 text-center">Ijazah</th>
                    <th className="py-3 px-2 text-center">Akta</th>
                    <th className="py-3 px-2 text-center">DRH</th>
                    <th className="py-3 px-2 text-center">CPNS</th>
                    <th className="py-3 px-2 text-center">PNS</th>
                    <th className="py-3 px-2 text-center">Ubah</th>
                    <th className="py-3 px-2 text-center">KP</th>
                    <th className="py-3 px-2 text-center">Jabatan</th>
                    <th className="py-3 px-2 text-center">Berhenti</th>
                    <th className="py-3 px-2 text-center">Pensiun</th>
                    <th className="py-3 px-3 text-center">Kelengkapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {paginatedItems.map((row, idx) => {
                    const checks = [
                      row.d2nip, row.ijazah, row.akta, row.drh, row.cpns, row.pns,
                      row.perubahan, row.kp, row.jabatan, row.berhenti, row.pensiun,
                    ]
                    const filledCount = checks.filter((v) => Number(v) === 1 || v === true || v === '1').length
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-bold text-slate-500">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {row.nama || row.nip || '-'}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 flex-wrap">
                            {row.nip && <span className="font-mono">{row.nip}</span>}
                            {row.nip && row.nama_instansi && <span>•</span>}
                            <span>{row.nama_instansi || 'Instansi Daerah'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.d2nip)}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.ijazah)}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.akta)}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.drh)}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.cpns)}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.pns)}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.perubahan)}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.kp)}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.jabatan)}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.berhenti)}</td>
                        <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.pensiun)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300">
                            {filledCount}/11 Unsur
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : type === 'dms' && isDmsNipMode ? (
            /* DMS 10-Element Digital Checklist Table per NIP */
            <div className="overflow-x-auto clean-scrollbar border border-slate-200/60 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">NIP & Instansi</th>
                    <th className="py-3 px-2 text-center">D2NIP</th>
                    <th className="py-3 px-2 text-center">Ijazah</th>
                    <th className="py-3 px-2 text-center">DRH</th>
                    <th className="py-3 px-2 text-center">CPNS</th>
                    <th className="py-3 px-2 text-center">PNS</th>
                    <th className="py-3 px-2 text-center">KP</th>
                    <th className="py-3 px-2 text-center">Jabatan</th>
                    <th className="py-3 px-2 text-center">Ubah</th>
                    <th className="py-3 px-2 text-center">Berhenti</th>
                    <th className="py-3 px-2 text-center">Pensiun</th>
                    <th className="py-3 px-3 text-right">Total Dok</th>
                    <th className="py-3 px-3">PIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {paginatedItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-bold text-slate-500">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {row.nip || '-'}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500">
                          {row.nama_instansi || 'Instansi Daerah'}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.d2nip)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.ijazah)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.drh)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.cpns)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.pns)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.kp)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.jabatan)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.perubahan)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.berhenti)}</td>
                      <td className="py-2.5 px-2 text-center">{renderBadgeCheck(row.pensiun)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#175CD3] dark:text-blue-400">
                        {formatNumber(row.total_doc || 0)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {row.pic || row.upload_by || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : type === 'dms' ? (
            /* DMS Manual Entry Aggregate Table */
            <div className="overflow-x-auto clean-scrollbar border border-slate-200/60 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Instansi Daerah</th>
                    <th className="py-3 px-4">Jenis Dokumen Arsip</th>
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-4 text-right">Total Dokumen</th>
                    <th className="py-3 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {paginatedItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-500">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {row.nama_instansi || 'Instansi Daerah'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {row.jenis || '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        {row.period || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#175CD3] dark:text-blue-400">
                        {formatNumber(row.total || 0)} Dokumen
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                        {row.created_by || row.upload_by || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : type === 'disparitas' ? (
            /* Disparitas Anomaly Table */
            <div className="overflow-x-auto clean-scrollbar border border-slate-200/60 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Instansi Daerah</th>
                    <th className="py-3 px-4">Klasifikasi Anomali Data</th>
                    <th className="py-3 px-4 text-right">Jumlah Anomali</th>
                    <th className="py-3 px-4 text-center">Status Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {paginatedItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-500">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {row.nama_instansi || 'Instansi Daerah'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {row.jenis_anomali || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400">
                        {formatNumber(row.jumlah || 0)} Pegawai
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60">
                          Perlu Rekonsiliasi
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : type === 'pdm' ? (
            /* PDM Usul Breakdown Table */
            <div className="overflow-x-auto clean-scrollbar border border-slate-200/60 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Jenis Riwayat PDM</th>
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-4 text-center">Disetujui (ACC)</th>
                    <th className="py-3 px-4 text-center">Berkas BTL</th>
                    <th className="py-3 px-4 text-center">TMS</th>
                    <th className="py-3 px-4 text-right">Total Usulan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {paginatedItems.map((row, idx) => {
                    const acc = Number(row.total_acc || row.acc || 0)
                    const btl = Number(row.total_btl || row.btl || 0)
                    const tms = Number(row.total_tms || row.tms || 0)
                    const total = Number(row.total_usulan || 0) || (acc + btl + tms)
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-slate-500">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {row.jenis || 'Riwayat Kepegawaian'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                          {row.period || '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {formatNumber(acc)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                          {formatNumber(btl)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-rose-600 dark:text-rose-400">
                          {formatNumber(tms)}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                          {formatNumber(total)} Usul
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : type === 'integrasi' ? (
            /* Integrasi SIASN Real 8-Module Matrix Table */
            <div className="overflow-x-auto clean-scrollbar border border-slate-200/60 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Modul Integrasi SIASN</th>
                    <th className="py-3 px-4">Periode</th>
                    <th className="py-3 px-4">Catatan Teknis / Remarks</th>
                    <th className="py-3 px-4 text-center">Bukti Dukung</th>
                    <th className="py-3 px-4 text-center">Status Koneksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {paginatedItems.map((row, idx) => {
                    const isSynced = Number(row.is_synced) === 1 || Boolean(row.remarks || row.bukti_dukung)
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-slate-500">
                          {(page - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {row.nama_modul || row.jenis || 'Modul Web Service'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                          {row.period || '-'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 max-w-xs truncate" title={row.remarks}>
                          {row.remarks || (isSynced ? 'Terkoneksi' : 'Belum terintegrasi')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {row.bukti_dukung && /^https?:\/\//i.test(row.bukti_dukung) ? (
                            <a
                              href={row.bukti_dukung}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#175CD3] dark:text-blue-400 hover:underline font-bold"
                            >
                              <span>Buka Tautan</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isSynced ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Terkoneksi</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              <XCircle className="w-3 h-3" />
                              <span>Belum Aktif</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : type === 'statistik' ? (
            /* Statistik Pegawai Dynamic Demographic Table */
            <div className="overflow-x-auto clean-scrollbar border border-slate-200/60 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Instansi Daerah</th>
                    {statColumns.map((col) => (
                      <th key={col.key} className="py-3 px-3 text-right">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {paginatedItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-500">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {row.nama_instansi || 'Instansi Daerah'}
                      </td>
                      {statColumns.map((col) => (
                        <td
                          key={col.key}
                          className={`py-3 px-3 text-right tabular-nums ${
                            col.highlight
                              ? 'font-extrabold text-[#175CD3] dark:text-blue-400'
                              : 'font-semibold text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {formatNumber(row[col.key] || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : type === 'pnbp' ? (
            /* PNBP CAT Naskah Dinas Breakdown */
            <div className="overflow-x-auto clean-scrollbar border border-slate-200/60 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nomor Naskah & Tipe</th>
                    <th className="py-3 px-4">Titik Lokasi (Tilok)</th>
                    <th className="py-3 px-4">Tanggal Terbit</th>
                    <th className="py-3 px-4">Keterangan Penugasan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {paginatedItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-500">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {row.doc_number || '-'}
                        <div className="font-sans text-[11px] font-semibold text-slate-500 mt-0.5 uppercase">
                          {row.doc_type || 'Naskah Dinas'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {row.tilok_nama || 'Tilok Mandiri BKN'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {formatDate(row.doc_date || row.created_at)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400 max-w-xs truncate" title={row.keterangan}>
                        {row.keterangan || 'Pelaksanaan Seleksi PNBP CAT'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'final'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {row.status === 'final' ? 'Final Disahkan' : 'Draft Penelaahan'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Generic Detail Table */
            <div className="overflow-x-auto clean-scrollbar border border-slate-200/60 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Instansi / Subjek</th>
                    <th className="py-3 px-4">Kategori / Keterangan</th>
                    <th className="py-3 px-4 text-right">Jumlah / Nilai</th>
                    <th className="py-3 px-4">Tanggal / PIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {paginatedItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-500">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {row.nama_instansi || row.nama || row.nip || 'Instansi Daerah'}
                        </div>
                        {row.nip && (
                          <div className="text-[11px] font-semibold text-slate-500">
                            NIP: {row.nip}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {row.jenis || row.jenis_anomali || row.kategori || row.keterangan || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatNumber(row.total || row.jumlah || row.total_doc || 0)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
                        {formatDate(row.tanggal_proses || row.created_at) || row.pic || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. Footer Modal */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 text-xs">
          <div className="text-slate-600 dark:text-slate-300 font-semibold">
            Halaman {page} dari {totalPages} ({filteredItems.length} total baris)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 font-semibold cursor-pointer shadow-2xs"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 font-semibold cursor-pointer shadow-2xs"
            >
              Selanjutnya
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 px-4 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
