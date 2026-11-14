import { useState } from 'react'
import { toast } from 'react-toastify'
import { Edit3, Trash2, Eye, FileText, Download, Clock, CheckCircle2, FileCheck2, Loader2, Sparkles, Building2, User } from 'lucide-react'
import { SidigiCrudLayoutShell } from '../../../components/shared/services/sidigi/SidigiCrudLayoutShell'
import { SidigiDataOriginIcon, isExcelOrigin } from '../../../components/shared/services/sidigi/SidigiDataOriginIcon'
import { SidigiTanggalCell, SidigiPetugasCell } from '../../../components/shared/services/sidigi/SidigiTableCells'
import { PnbpFormModal } from '../../../components/shared/services/sidigi/PnbpFormModal'
import {
  fetchPnbpSummary,
  fetchPnbpDocuments,
  deletePnbpDocument,
  importBatchPnbp,
  generatePnbpPdf,
} from '../../../services/api/sidigiServicesApi'

export default function PnbpCatPage() {
  const [generatingId, setGeneratingId] = useState(null)

  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(Number(num || 0))
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

  const renderKpis = (summary) => [
    {
      id: 'total_docs',
      label: 'TOTAL DOKUMEN PNBP',
      value: summary?.total_docs ?? 0,
      unit: 'Dokumen',
      context: 'Naskah dinas pertanggungjawaban',
      badge: '100% Total',
      badgeColor: 'sky',
      icon: FileText,
      iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    },
    {
      id: 'total_final',
      label: 'DOKUMEN FINAL / SIAP',
      value: summary?.total_final ?? 0,
      unit: 'Dokumen',
      context: 'Dokumen final disahkan',
      badge: 'Disahkan',
      badgeColor: 'emerald',
      icon: CheckCircle2,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      id: 'total_draft',
      label: 'DRAF DALAM PROSES',
      value: summary?.total_draft ?? 0,
      unit: 'Draf',
      context: 'Perlu verifikasi personel',
      badge: 'Draf',
      badgeColor: 'amber',
      icon: FileCheck2,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      id: 'last_upload',
      label: 'UPDATE TERAKHIR',
      value: formatDate(summary?.last_update),
      unit: '',
      isText: true,
      context: 'Pembaruan naskah PNBP',
      badge: 'Terbaru',
      badgeColor: 'indigo',
      icon: Clock,
      iconColor: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    },
  ]

  const columns = [
    { header: 'NASKAH DINAS & TILOK' },
    { header: 'JENIS DOKUMEN' },
    { header: 'STATUS PENERBITAN' },
    { header: 'TANGGAL' },
    { header: 'PETUGAS' },
    { header: 'AKSI', className: 'text-right' },
  ]

  const handleGeneratePdf = async (item) => {
    try {
      setGeneratingId(item.id)
      const res = await generatePnbpPdf(item.id, item.doc_type)
      if (res.download_url) {
        window.open(res.download_url, '_blank')
      } else {
        toast.success('PDF berhasil di-generate. Silakan unduh melalui tombol download.')
      }
    } catch (err) {
      toast.error(err.message || 'Gagal generate PDF.')
    } finally {
      setGeneratingId(null)
    }
  }

  const getDocTypeBadge = (type) => {
    const t = String(type || '').toLowerCase()
    switch (t) {
      case 'sp':
        return { label: 'Surat Perintah', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/60' }
      case 'st':
        return { label: 'Surat Tugas', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60' }
      case 'nominatif':
        return { label: 'Nominatif Transport', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60' }
      case 'kwitansi':
        return { label: 'Kwitansi Honor', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60' }
      case 'hadir':
        return { label: 'Daftar Hadir', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60' }
      default:
        return { label: t.toUpperCase(), color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60' }
    }
  }

  const renderRow = (item, rowNo, onEdit, onDelete, onDetail) => {
    const badge = getDocTypeBadge(item.doc_type)
    const isGenerating = generatingId === item.id

    return (
      <tr
        key={item.id}
        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
      >
        {/* Kolom 1: NASKAH DINAS & TILOK */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <SidigiDataOriginIcon isExcel={isExcelOrigin(item)} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onDetail && onDetail(item)}
                className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white hover:text-[#175CD3] dark:hover:text-blue-400 transition-colors text-left block truncate max-w-xs sm:max-w-sm cursor-pointer"
                title={item.doc_number}
              >
                {item.doc_number || 'N/A'}
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">
                <span>{item.tilok_nama || 'Tilok Mandiri BKN'}</span>
                <span>•</span>
                <span>{item.instansi_nama || 'Kanreg III BKN'}</span>
              </div>
            </div>
          </div>
        </td>

        {/* Kolom 2: JENIS DOKUMEN */}
        <td className="py-3 px-4 sm:px-5">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${badge.color}`}>
            {badge.label}
          </span>
        </td>

        {/* Kolom 3: STATUS PENERBITAN */}
        <td className="py-3 px-4 sm:px-5">
          {item.status === 'final' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Final Disahkan</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Draft</span>
            </span>
          )}
        </td>

        {/* Kolom 4: TANGGAL */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiTanggalCell
            value={item.doc_date || item.created_at}
            subValue={item.created_at ? `Dibuat ${formatDate(item.created_at)}` : null}
          />
        </td>

        {/* Kolom 5: PETUGAS */}
        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
          <SidigiPetugasCell value={item.created_by || 'PIC CAT'} />
        </td>

        {/* Kolom 6: AKSI */}
        <td className="py-3 px-4 sm:px-5 text-right">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onDetail && onDetail(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              title="Lihat Detail Naskah Dinas PNBP"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleGeneratePdf(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors disabled:opacity-50 cursor-pointer"
              title="Generate dan Preview PDF Resmi"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Hapus Dokumen PNBP"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const categories = [
    { value: 'all', label: 'Semua Dokumen' },
    { value: 'st', label: 'Surat Tugas (ST)' },
    { value: 'sp', label: 'Surat Perintah (SP)' },
    { value: 'nominatif', label: 'Nominatif Transport' },
    { value: 'kwitansi', label: 'Kwitansi Honor' },
    { value: 'hadir', label: 'Daftar Hadir' },
  ]

  return (
    <SidigiCrudLayoutShell
      layananId={42}
      serviceTitle="Dokumen Seleksi PNBP CAT"
      shortTitle="Dokumen PNBP CAT"
      timKerjaTitle="Sistem Informasi & Digitalisasi"
      description="Penyusunan otomatis naskah dinas, surat tugas, daftar hadir, kwitansi, dan pertanggungjawaban seleksi PNBP CAT."
      templateUrl="/templates/sidigi/template-pnbp-cat.xlsx"
      templateName="template-pnbp-cat.xlsx"
      fetchSummaryFn={fetchPnbpSummary}
      fetchDataFn={fetchPnbpDocuments}
      deleteDataFn={deletePnbpDocument}
      batchUploadFn={importBatchPnbp}
      renderKpis={renderKpis}
      columns={columns}
      renderRow={renderRow}
      FormComponent={PnbpFormModal}
      detailType="pnbp"
      categories={categories}
      defaultCategory="all"
      searchPlaceholder="Cari nomor dokumen, tilok, keterangan..."
    />
  )
}
