import { Mail, Send, FileText, Archive, Pencil, Trash2, Eye, Layers } from 'lucide-react'
import { TuCrudLayoutShell } from '../../../components/shared/services/tu/TuCrudLayoutShell'
import { TuDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/tu/TuDataOriginIcon'
import { TuTanggalCell, TuPetugasCell } from '../../../components/shared/services/tu/TuTableCells'
import { SuratFormModal } from './components/SuratFormModal'
import { SuratDetailModal } from './components/SuratDetailModal'
import {
  fetchSuratSummary,
  fetchSuratData,
  deleteSuratData,
} from '../../../services/api/tuServicesApi'

export default function SuratPage() {
  const renderKpis = (summary) => [
    {
      id: 'total_naskah',
      label: 'TOTAL NASKAH DINAS',
      value: summary?.total_naskah ?? summary?.total_surat ?? 0,
      unit: 'Naskah',
      context: 'Arsip terkelola',
      badge: 'Arsip',
      badgeColor: 'blue',
      icon: Mail,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'surat_masuk',
      label: 'SURAT MASUK',
      value: summary?.surat_masuk ?? 0,
      unit: 'Surat',
      context: 'Naskah masuk dari luar',
      badge: 'Masuk',
      badgeColor: 'emerald',
      icon: FileText,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'surat_keluar',
      label: 'SURAT KELUAR',
      value: summary?.surat_keluar ?? 0,
      unit: 'Surat',
      context: 'Naskah dinas keluar',
      badge: 'Keluar',
      badgeColor: 'blue',
      icon: Send,
      iconColor: 'bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      id: 'total_klasifikasi',
      label: 'TOTAL KLASIFIKASI',
      value: summary?.total_klasifikasi ?? 0,
      unit: 'Kategori',
      context: 'Klasifikasi aktif',
      badge: 'Kearsipan',
      badgeColor: 'indigo',
      icon: Archive,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  const columns = [
    { header: 'NASKAH DINAS' },
    { header: 'JENIS NASKAH' },
    { header: 'KLASIFIKASI' },
    { header: 'JUMLAH BERKAS' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const renderRow = (item, rowNo, onEdit, onDelete, onViewDetail) => {
    const jenisId = Number(item.jenis_id)
    const isMasuk = jenisId === 1 || item.jenis_naskah === 'Surat Masuk'
    const jenisNaskah = item.jenis_naskah || (isMasuk ? 'Surat Masuk' : 'Surat Keluar')
    const jenisBadge = isMasuk
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300'
      : 'bg-blue-50 text-[#175CD3] border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-300'

    const klasifikasiDisplay = item.klasifikasi_kode
      ? `${item.klasifikasi_kode} - ${item.klasifikasi_nama}`
      : (item.klasifikasi_nama || '-')

    return (
      <tr key={item.id || rowNo} className="hover:bg-slate-50/75 dark:hover:bg-slate-800/30 transition-colors">
        {/* Kolom 1: NASKAH DINAS */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <TuDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onViewDetail && onViewDetail(item)}
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.nomor_surat || item.perihal || `Periode ${item.period}`}
              >
                {item.nomor_surat || item.perihal || `Tata Naskah Periode ${item.period}`}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                <span>Periode {item.period || '-'}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: JENIS NASKAH */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${jenisBadge}`}>
            {jenisNaskah}
          </span>
        </td>

        {/* Kolom 3: KLASIFIKASI */}
        <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200">
          {klasifikasiDisplay}
        </td>

        {/* Kolom 4: JUMLAH BERKAS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>{item.total ?? 0} Dokumen</span>
          </span>
        </td>

        {/* Kolom 5: TANGGAL */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuTanggalCell value={item.period_start_date || item.created_at} />
        </td>

        {/* Kolom 6: PETUGAS */}
        <td className="px-4 py-3.5 whitespace-nowrap">
          <TuPetugasCell value={item.created_by || item.pengolah || item.pic || 'Pengolah Arsip'} />
        </td>

        {/* Kolom 7: AKSI */}
        <td className="px-4 py-3.5 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onViewDetail && onViewDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Naskah"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
              title="Ubah Data"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <TuCrudLayoutShell
      layananId={32}
      serviceTitle="Pengelolaan Persuratan"
      shortTitle="Tata Naskah & Surat"
      description="Pengelolaan tata naskah dinas dan kearsipan Kantor Regional III BKN."
      templateUrl="/templates/tu/template-surat.xlsx"
      templateName="template-surat.xlsx"
      fetchSummaryFn={fetchSuratSummary}
      fetchDataFn={fetchSuratData}
      deleteDataFn={deleteSuratData}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={SuratFormModal}
      DetailModalComponent={SuratDetailModal}
      searchPlaceholder="Cari nomor surat, klasifikasi, jenis naskah..."
      categories={[
        { id: '', label: 'Semua Naskah' },
        { id: '1', label: 'Surat Masuk' },
        { id: '2', label: 'Surat Keluar' },
      ]}
    />
  )
}
