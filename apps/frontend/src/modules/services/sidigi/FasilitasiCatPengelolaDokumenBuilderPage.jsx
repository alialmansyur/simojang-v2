import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { CatPengelolaGateGuard } from '../../../components/shared/services/sidigi/cat/pengelola/CatPengelolaGateGuard'
import {
  CAT_DOC_DETAILS,
  formatTanggalId,
} from '../../../components/shared/services/sidigi/cat/pengelola/pengelolaConstants'
import {
  buildCatPengelolaDocListUrl,
  decodeCatPengelolaDocToken,
  decodeCatPengelolaDocTypeToken,
} from '../../../utils/catRouteToken'
import {
  fetchCatPengelolaDocumentDetail,
  openCatPengelolaDocumentFileBlob,
} from '../../../services/api/sidigiCatServicesApi'
import { CatDocSpBuilder } from '../../../components/shared/services/sidigi/cat/pengelola/doc-builders/CatDocSpBuilder'
import { CatDocStBuilder } from '../../../components/shared/services/sidigi/cat/pengelola/doc-builders/CatDocStBuilder'
import { CatDocNominatifBuilder } from '../../../components/shared/services/sidigi/cat/pengelola/doc-builders/CatDocNominatifBuilder'
import { CatDocKwitansiBuilder } from '../../../components/shared/services/sidigi/cat/pengelola/doc-builders/CatDocKwitansiBuilder'
import { CatDocHadirBuilder } from '../../../components/shared/services/sidigi/cat/pengelola/doc-builders/CatDocHadirBuilder'
import { CatDocKwitansiJamuanBuilder } from '../../../components/shared/services/sidigi/cat/pengelola/doc-builders/CatDocKwitansiJamuanBuilder'
import { CatDocSuratJalanBuilder } from '../../../components/shared/services/sidigi/cat/pengelola/doc-builders/CatDocSuratJalanBuilder'
import { CatDocHadirJamuanBuilder } from '../../../components/shared/services/sidigi/cat/pengelola/doc-builders/CatDocHadirJamuanBuilder'

const BUILDER_COMPONENT_MAP = {
  sp: CatDocSpBuilder,
  st: CatDocStBuilder,
  nominatif: CatDocNominatifBuilder,
  kwitansi: CatDocKwitansiBuilder,
  hadir: CatDocHadirBuilder,
  kwitansi_jamuan: CatDocKwitansiJamuanBuilder,
  surat_jalan: CatDocSuratJalanBuilder,
  hadir_jamuan: CatDocHadirJamuanBuilder,
}

function DokumenBuilderContent() {
  const { docType: rawDocTypeToken = '', docToken = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const decodedTokenInfo = useMemo(() => decodeCatPengelolaDocToken(docToken), [docToken])
  const decodedDocUid = decodedTokenInfo?.uid || ''

  const decodedDocType = useMemo(() => {
    const t = decodeCatPengelolaDocTypeToken(rawDocTypeToken)
    if (t && BUILDER_COMPONENT_MAP[t]) return t
    if (BUILDER_COMPONENT_MAP[rawDocTypeToken]) return rawDocTypeToken
    if (decodedTokenInfo?.docType && BUILDER_COMPONENT_MAP[decodedTokenInfo.docType]) {
      return decodedTokenInfo.docType
    }
    return ''
  }, [rawDocTypeToken, decodedTokenInfo])

  const jadwalIdParam = searchParams.get('jadwal_id') || decodedTokenInfo?.jadwalId || ''

  const [doc, setDoc] = useState(null)
  const [docTypeMeta, setDocTypeMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [openingFile, setOpeningFile] = useState(false)

  const loadDocument = useCallback(async () => {
    if (!decodedDocUid) {
      setErrorMsg('Token parameter dokumen tidak valid atau kedaluwarsa.')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setErrorMsg('')
      const res = await fetchCatPengelolaDocumentDetail(decodedDocUid)
      if (!res?.doc) {
        setErrorMsg('Dokumen CAT tidak ditemukan di database.')
        setDoc(null)
      } else {
        setDoc(res.doc)
        setDocTypeMeta(res.docTypeMeta || null)
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal memuat data builder dokumen.')
    } finally {
      setLoading(false)
    }
  }, [decodedDocUid])

  useEffect(() => {
    let active = true
    if (!decodedDocUid) {
      Promise.resolve().then(() => {
        if (!active) return
        setErrorMsg('Token parameter dokumen tidak valid atau kedaluwarsa.')
        setLoading(false)
      })
      return () => {
        active = false
      }
    }
    fetchCatPengelolaDocumentDetail(decodedDocUid)
      .then((res) => {
        if (!active) return
        if (!res?.doc) {
          setErrorMsg('Dokumen CAT tidak ditemukan di database.')
          setDoc(null)
        } else {
          setErrorMsg('')
          setDoc(res.doc)
          setDocTypeMeta(res.docTypeMeta || null)
        }
      })
      .catch((err) => {
        if (active) setErrorMsg(err?.message || 'Gagal memuat data builder dokumen.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [decodedDocUid])

  const effectiveDocType = doc?.doc_type || decodedDocType || 'sp'
  const docDetail = CAT_DOC_DETAILS[effectiveDocType] || {}
  const listBackUrl = useMemo(
    () => buildCatPengelolaDocListUrl(effectiveDocType, jadwalIdParam),
    [effectiveDocType, jadwalIdParam]
  )

  const BuilderComponent = BUILDER_COMPONENT_MAP[effectiveDocType] || null

  const handleOpenUploadedFile = async (download = false) => {
    if (!doc?.uid) return
    try {
      setOpeningFile(true)
      await openCatPengelolaDocumentFileBlob(doc.uid, download)
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal membuka file PDF arsip.')
    } finally {
      setOpeningFile(false)
    }
  }

  // Fallback jika token URL rusak (Parity /layanan/fasilitasi-cat/laporan/*)
  if (!decodedDocUid) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs space-y-3 max-w-xl mx-auto mt-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Parameter Dokumen Tidak Lengkap atau Kedaluwarsa
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Silakan pilih kembali jadwal/dokumen pada daftar dokumen pengelola CAT.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate(listBackUrl)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Dokumen</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* SERVICE HEADER — Sama persis dengan /layanan/fasilitasi-cat/laporan/* */}
      <div className="no-print flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Sistem Informasi &amp; Digitalisasi</span>
          </div>

          <h1 className="text-2xl sm:text-[25px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {docTypeMeta?.name || docDetail.title || 'Dokumen Builder CAT'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
            {doc?.title || docDetail.description || 'Penyusunan dan pratinjau dokumen resmi pelaksanaan CAT BKN.'}
          </p>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {doc?.jenis_tes_nama && (
              <>
                <span className="text-xs text-slate-400 font-medium">Jenis Tes:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700">
                  <span>{doc.jenis_tes_nama}</span>
                  {doc.seleksi_periode && (
                    <span className="text-slate-400 font-semibold">({doc.seleksi_periode})</span>
                  )}
                </span>
              </>
            )}
            {doc?.nama_jadwal && (
              <>
                <span className="text-xs text-slate-400 font-medium">Jadwal:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700">
                  <span>{doc.nama_jadwal}</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-nowrap whitespace-nowrap overflow-x-auto">
          <button
            type="button"
            onClick={() => navigate(listBackUrl)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Kembali ke Daftar Dokumen"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali</span>
          </button>

          <button
            type="button"
            onClick={loadDocument}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin text-[#175CD3]' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#175CD3] mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            Menyiapkan data pelaksanaan dan dokumen builder...
          </p>
        </div>
      ) : doc?.source_mode === 'upload' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Arsip Dokumen PDF (Mode Upload)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Dokumen ini diunggah sebagai arsip PDF jadi ({doc.original_filename || 'dokumen.pdf'}).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={openingFile}
                onClick={() => handleOpenUploadedFile(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#175CD3] hover:bg-[#1248A8] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau PDF</span>
              </button>
              <button
                type="button"
                disabled={openingFile}
                onClick={() => handleOpenUploadedFile(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-[11px] text-slate-400 font-semibold">Nomor Dokumen</div>
              <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {doc.doc_number || '-'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-[11px] text-slate-400 font-semibold">Tanggal Dokumen</div>
              <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {doc.doc_date ? formatTanggalId(doc.doc_date) : '-'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-[11px] text-slate-400 font-semibold">Jadwal &amp; Tilok</div>
              <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {doc.nama_jadwal || doc.nama_tilok || '-'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-[11px] text-slate-400 font-semibold">File PDF Asli</div>
              <div className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                {doc.original_filename || 'Dokumen Arsip.pdf'}
              </div>
            </div>
          </div>

          {doc.notes && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-800 dark:text-slate-100">Keterangan: </span>
              {doc.notes}
            </div>
          )}
        </div>
      ) : doc && BuilderComponent ? (
        <BuilderComponent
          doc={doc}
          onDocUpdated={(updated) => {
            if (updated && typeof updated === 'object') {
              setDoc((prev) => ({ ...(prev || {}), ...updated }))
            }
          }}
        />
      ) : !errorMsg ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center shadow-xs space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Template Dokumen Belum Tersedia
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Builder untuk tipe dokumen &quot;{effectiveDocType}&quot; belum tersedia.
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default function FasilitasiCatPengelolaDokumenBuilderPage() {
  return (
    <CatPengelolaGateGuard>
      <DokumenBuilderContent />
    </CatPengelolaGateGuard>
  )
}
