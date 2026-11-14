import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Save,
  FileText,
  Printer,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  GripVertical,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Users,
  Utensils,
  UserPlus,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react'
import { SignerPositionCol } from '../../../../../document-builder/DocumentBuilderShell'
import { DocumentPdfPreview } from '../../../../../document-builder/DocumentPdfPreview'
import { SearchableSelect } from '../../../../../../ui/SearchableSelect'
import { CatDocInstansiPicker } from '../../CatDocInstansiPicker'
import {
  resolveKopImageSrc,
  formatRupiah,
  formatTanggalPanjangId,
  CAT_FORM_LABEL_CLS,
  CAT_FORM_INPUT_CLS,
} from '../pengelolaConstants'
import {
  fetchCatPengelolaPegawaiOptions,
  syncCatPengelolaTimToDocument,
  saveCatPengelolaDocPersonel,
  reorderCatPengelolaDocPersonel,
  deleteCatPengelolaDocPersonel,
  saveCatPengelolaDocItem,
  deleteCatPengelolaDocItem,
  saveCatPengelolaDocSignatures,
} from '../../../../../../../services/api/sidigiCatServicesApi'
import { serializeSignersPayload } from './catDocBuilderUtils'

export { CatDocInstansiPicker }

export function CatDocKopSurat({ customTitle = '' }) {
  const src = resolveKopImageSrc('kanreg_3')
  if (!src) return null
  return (
    <div data-pdf-block="true" className="w-full mb-3">
      <img
        src={src}
        alt={customTitle || 'Kop Surat Resmi'}
        crossOrigin="anonymous"
        className="w-full h-auto block object-contain"
      />
    </div>
  )
}

export function CatDocSignaturePrintBlock({
  signers,
  kotaTtd = 'Bandung',
  tanggalTtd = '',
}) {
  const kiri = signers?.kiri || {}
  const tengah = signers?.tengah || {}
  const kanan = signers?.kanan || {}

  const isFilled = (s) =>
    Boolean((s?.nama && s.nama.trim() !== '') || (s?.jabatan && s.jabatan.trim() !== '') || s?.isSigned)

  const kFilled = isFilled(kiri)
  const tFilled = isFilled(tengah)
  const nFilled = isFilled(kanan)

  if (!kFilled && !tFilled && !nFilled) return null

  const dateText = tanggalTtd ? `${kotaTtd ? `${kotaTtd}, ` : ''}${formatTanggalPanjangId(tanggalTtd)}` : ''

  const renderCell = (s, showDateTop = false) => (
    <div className="space-y-0.5 text-[12px] leading-snug text-black">
      <p className="min-h-[1.2em] font-normal">
        {showDateTop && dateText ? dateText : s.sign_title || '\u00A0'}
      </p>
      {showDateTop && dateText && s.sign_title ? (
        <p className="font-normal leading-tight">{s.sign_title}</p>
      ) : null}
      <p className="font-medium whitespace-pre-line leading-tight min-h-[1.2em]">
        {s.jabatan || '\u00A0'}
      </p>
      <div className="h-16 flex items-center justify-center my-1">
        {s.isSigned && s.signatureData ? (
          <img
            src={s.signatureData}
            alt={`TTD ${s.nama}`}
            className="max-h-full max-w-[140px] object-contain"
          />
        ) : (
          <span className="select-none">&nbsp;</span>
        )}
      </div>
      <p className="font-bold underline decoration-black underline-offset-2">
        {s.nama || '........................................'}
      </p>
      {s.nip ? <p className="text-[12px] text-black">NIP. {s.nip}</p> : null}
    </div>
  )

  return (
    <div data-pdf-block="true" className="pt-6 break-inside-avoid">
      <table className="w-full text-center border-collapse">
        <tbody>
          <tr>
            <td className="w-1/3 align-top px-2">{kFilled ? renderCell(kiri, false) : null}</td>
            <td className="w-1/3 align-top px-2">{tFilled ? renderCell(tengah, false) : null}</td>
            <td className="w-1/3 align-top px-2">{nFilled ? renderCell(kanan, true) : null}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export function CatDocSignatureSection({
  docUid,
  signers,
  onChangeSigners,
  onSaved,
  sectionLetter = 'D',
}) {
  const [savingSig, setSavingSig] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)
  const [resetTargetKey, setResetTargetKey] = useState(null)
  const [sigMsg, setSigMsg] = useState('')

  const handleFieldChange = (posKey, field, val) => {
    onChangeSigners((prev) => ({
      ...prev,
      [posKey]: { ...prev[posKey], [field]: val },
    }))
  }

  const persistSigners = async (nextSigners) => {
    if (!docUid) return
    setSavingSig(true)
    setSigMsg('')
    try {
      const payload = serializeSignersPayload(nextSigners)
      const res = await saveCatPengelolaDocSignatures(docUid, payload)
      if (onSaved && res?.data) {
        onSaved(res.data)
      }
      setSigMsg('Pengesahan dokumen tersimpan.')
      setTimeout(() => setSigMsg(''), 2500)
    } finally {
      setSavingSig(false)
    }
  }

  const handleSignPosition = async (posKey, signatureDataUrl) => {
    const hash = `DS-CAT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    const next = {
      ...signers,
      [posKey]: {
        ...signers[posKey],
        signatureData: signatureDataUrl,
        signatureHash: hash,
        signedAt: new Date().toISOString(),
        isSigned: true,
      },
    }
    onChangeSigners(next)
    await persistSigners(next)
  }

  const handleConfirmReset = async () => {
    if (!resetTargetKey) return
    const next = {
      ...signers,
      [resetTargetKey]: {
        ...signers[resetTargetKey],
        signatureData: null,
        signatureHash: '',
        signedAt: '',
        isSigned: false,
      },
    }
    onChangeSigners(next)
    setResetTargetKey(null)
    await persistSigners(next)
  }

  const handleCopyLink = (posKey) => {
    const target = signers[posKey] || {}
    const token = target.token || `cat_${docUid}_${posKey}`
    try {
      localStorage.setItem(
        `cat_esign_token_${token}`,
        JSON.stringify({
          positionKey: posKey,
          documentTitle: `Dokumen Pengelola CAT (${docUid})`,
          signerName: target.nama,
          signerJabatan: target.jabatan,
          signerNip: target.nip,
        })
      )
    } catch {
      // Abaikan jika storage dibatasi
    }
    const url = `${window.location.origin}/layanan/fasilitasi-cat/laporan/esign/${token}`
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopiedKey(posKey)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {sectionLetter}. Penandatanganan & Pengesahan Dokumen (3 Kolom Fleksibel)
          </h4>
          <p className="text-[11px] text-slate-400 italic mt-0.5">
            * Kolom yang tidak diisi otomatis tidak muncul di cetakan dokumen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sigMsg && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {sigMsg}
            </span>
          )}
          <button
            type="button"
            disabled={savingSig}
            onClick={() => persistSigners(signers)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingSig ? 'Menyimpan...' : 'Simpan Pengesahan'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SignerPositionCol
          positionKey="kiri"
          title="1. Posisi Kiri"
          sublabel="Opsional: Pihak Pertama / PPK / Pembuat"
          signer={signers.kiri}
          onChange={handleFieldChange}
          onSign={handleSignPosition}
          onReset={(key) => setResetTargetKey(key)}
          onCopyLink={handleCopyLink}
          isCopied={copiedKey === 'kiri'}
          allowSignTitle
        />
        <SignerPositionCol
          positionKey="tengah"
          title="2. Posisi Tengah"
          sublabel="Opsional: Bendahara / Saksi / Mengetahui"
          signer={signers.tengah}
          onChange={handleFieldChange}
          onSign={handleSignPosition}
          onReset={(key) => setResetTargetKey(key)}
          onCopyLink={handleCopyLink}
          isCopied={copiedKey === 'tengah'}
          allowSignTitle
        />
        <SignerPositionCol
          positionKey="kanan"
          title="3. Posisi Kanan"
          sublabel="Utama: Penanggung Jawab / Pimpinan / Penerima"
          signer={signers.kanan}
          onChange={handleFieldChange}
          onSign={handleSignPosition}
          onReset={(key) => setResetTargetKey(key)}
          onCopyLink={handleCopyLink}
          isCopied={copiedKey === 'kanan'}
          allowSignTitle
        />
      </div>

      {resetTargetKey && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs modal-backdrop-animated"
          onClick={(e) => {
            if (e.target === e.currentTarget) setResetTargetKey(null)
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4 shadow-xl modal-dialog-animated">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reset Tanda Tangan?</h3>
                <p className="text-xs text-slate-500">Posisi {resetTargetKey.toUpperCase()}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Goresan TTE pada kolom ini akan dihapus agar dapat dibubuhkan ulang.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetTargetKey(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Reset TTE
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export function CatDocPersonelTableSection({
  doc,
  onDocUpdated,
  title = 'Daftar Tim / Personel Dokumen',
  showHonorFields = false,
  showNominatifFields = false,
  showPeranField = true,
  showInstansiAsal = false,
}) {
  const personelList = useMemo(() => (Array.isArray(doc?.personel) ? doc.personel : []), [doc])
  const [pegawaiOptions, setPegawaiOptions] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)
  const [feedback, setFeedback] = useState({ type: '', text: '' })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [savingRow, setSavingRow] = useState(false)
  const [isExternal, setIsExternal] = useState(false)
  const [selectedPegawaiNip, setSelectedPegawaiNip] = useState('')
  const [form, setForm] = useState({
    nip: '',
    nama: '',
    instansi_asal: '',
    pangkat_gol: '',
    nik: '',
    jabatan: '',
    peran: 'Pengawas CAT',
    jumlah_hari: 1,
    uang_harian: 0,
    transport: 0,
    jumlah: 0,
    pajak_persen: 5,
    bank_nama: '',
    no_rekening: '',
  })

  useEffect(() => {
    fetchCatPengelolaPegawaiOptions('', 100)
      .then((rows) => setPegawaiOptions(Array.isArray(rows) ? rows : []))
      .catch(() => {})
  }, [])

  const pegawaiSelectOptions = useMemo(
    () =>
      pegawaiOptions.map((p) => ({
        value: p.nip || String(p.id),
        label: `${p.nama} — ${p.nip || '-'}`,
        sublabel: p.jabatan || p.golongan || '',
        raw: p,
      })),
    [pegawaiOptions]
  )

  const handleOpenAdd = () => {
    setEditingRow(null)
    setIsExternal(false)
    setSelectedPegawaiNip('')
    setForm({
      nip: '',
      nama: '',
      instansi_asal: '',
      pangkat_gol: '',
      nik: '',
      jabatan: '',
      peran: 'Pengawas CAT',
      jumlah_hari: 1,
      uang_harian: 0,
      transport: 0,
      jumlah: 0,
      pajak_persen: 5,
      bank_nama: '',
      no_rekening: '',
    })
    setIsFormOpen(true)
  }

  const handleOpenEdit = (row) => {
    const ext = Number(row.is_external) === 1
    setEditingRow(row)
    setIsExternal(ext)
    setSelectedPegawaiNip(ext ? '' : row.nip || '')
    setForm({
      nip: row.nip || '',
      nama: row.nama || '',
      instansi_asal: row.instansi_asal || '',
      pangkat_gol: row.pangkat_gol || '',
      nik: row.nik || '',
      jabatan: row.jabatan || '',
      peran: row.peran || '',
      jumlah_hari: Number(row.jumlah_hari || 1),
      uang_harian: Number(row.uang_harian || 0),
      transport: Number(row.transport || 0),
      jumlah: Number(row.jumlah || 0),
      pajak_persen: Number(row.pajak_persen ?? 5),
      bank_nama: row.bank_nama || '',
      no_rekening: row.no_rekening || '',
    })
    setIsFormOpen(true)
  }

  const handlePickInternalPegawai = (nipVal) => {
    setSelectedPegawaiNip(nipVal)
    const found = pegawaiOptions.find((p) => String(p.nip) === String(nipVal))
    if (found) {
      setForm((prev) => ({
        ...prev,
        nip: found.nip || '',
        nama: found.nama || '',
        pangkat_gol: found.golongan || prev.pangkat_gol,
        jabatan: found.jabatan || prev.jabatan,
        instansi_asal: prev.instansi_asal || 'Kanreg III BKN Bandung',
      }))
    }
  }

  const handleSyncFromJadwal = async () => {
    if (!doc?.uid || !doc?.jadwal_id) {
      setFeedback({ type: 'error', text: 'Dokumen ini belum tertaut ke Jadwal CAT.' })
      return
    }
    setSyncing(true)
    setFeedback({ type: '', text: '' })
    try {
      const res = await syncCatPengelolaTimToDocument({
        document_uid: doc.uid,
        jadwal_id: doc.jadwal_id,
      })
      if (res?.data && onDocUpdated) onDocUpdated(res.data)
      setFeedback({ type: 'success', text: res?.message || 'Tim jadwal berhasil disinkronkan.' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      setSyncing(false)
    }
  }

  const handleSubmitPersonel = async (e) => {
    e.preventDefault()
    if (!form.nama.trim()) {
      setFeedback({ type: 'error', text: 'Nama lengkap wajib diisi.' })
      return
    }
    setSavingRow(true)
    setFeedback({ type: '', text: '' })
    try {
      const res = await saveCatPengelolaDocPersonel({
        document_uid: doc.uid,
        id: editingRow?.id || 0,
        is_external: isExternal ? 1 : 0,
        ...form,
      })
      if (res?.data && onDocUpdated) onDocUpdated(res.data)
      setIsFormOpen(false)
      setFeedback({ type: 'success', text: 'Data personel berhasil disimpan.' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      setSavingRow(false)
    }
  }

  const handleDeleteRow = async (row) => {
    try {
      const res = await deleteCatPengelolaDocPersonel(row.id, doc.uid)
      if (res?.data && onDocUpdated) onDocUpdated(res.data)
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    }
  }

  const commitOrder = async (nextList) => {
    const orderedIds = nextList.map((r) => r.id)
    if (onDocUpdated) {
      onDocUpdated({ ...doc, personel: nextList })
    }
    setReordering(true)
    try {
      const res = await reorderCatPengelolaDocPersonel(doc.uid, orderedIds)
      if (res?.data && onDocUpdated) onDocUpdated(res.data)
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      setReordering(false)
    }
  }

  const handleDropRow = (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null)
      return
    }
    const next = [...personelList]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    setDragIdx(null)
    commitOrder(next)
  }

  const handleMoveStep = (index, delta) => {
    const target = index + delta
    if (target < 0 || target >= personelList.length) return
    const next = [...personelList]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    commitOrder(next)
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#175CD3]" />
            <span>{title}</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Seret baris tabel (<GripVertical className="w-3 h-3 inline" />) untuk mengubah urutan nama yang tampil pada dokumen cetak. Mendukung pegawai eksternal di luar instansi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {doc?.jadwal_id && (
            <button
              type="button"
              disabled={syncing}
              onClick={handleSyncFromJadwal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Tarik Tim Jadwal</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B3264] hover:bg-[#175CD3] text-white text-xs font-bold shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Personel / Tim</span>
          </button>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback({ type: '', text: '' })} className="cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isFormOpen && (
        <form
          onSubmit={handleSubmitPersonel}
          className="p-4 rounded-xl border border-blue-200/80 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-blue-200/50">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {editingRow ? 'Edit Data Personel' : 'Tambah Personel ke Dokumen'}
            </span>
            <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700 text-[11px]">
              <button
                type="button"
                onClick={() => setIsExternal(false)}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                  !isExternal ? 'bg-[#175CD3] text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Pegawai BKN (Internal)
              </button>
              <button
                type="button"
                onClick={() => setIsExternal(true)}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                  isExternal ? 'bg-amber-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Luar Instansi (Input Manual)
              </button>
            </div>
          </div>

          {!isExternal && (
            <div className="space-y-1.5">
              <label className={CAT_FORM_LABEL_CLS}>
                Cari Pegawai dari Master Pegawai (`data_pegawai`)
              </label>
              <SearchableSelect
                options={pegawaiSelectOptions}
                value={selectedPegawaiNip}
                onChange={handlePickInternalPegawai}
                placeholder="Ketik Nama atau NIP pegawai..."
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="space-y-1.5">
              <label className={CAT_FORM_LABEL_CLS}>
                {isExternal ? 'NIP / NIK (Input Manual)' : 'NIP'}
              </label>
              <input
                type="text"
                value={form.nip}
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
                placeholder={isExternal ? 'Isi NIP/NIK luar instansi' : 'Otomatis atau ketik NIP'}
                className={CAT_FORM_INPUT_CLS}
              />
            </div>
            <div className="space-y-1.5">
              <label className={CAT_FORM_LABEL_CLS}>
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama lengkap beserta gelar"
                className={`${CAT_FORM_INPUT_CLS} font-semibold`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={CAT_FORM_LABEL_CLS}>
                Pangkat / Golongan
              </label>
              <input
                type="text"
                value={form.pangkat_gol}
                onChange={(e) => setForm({ ...form, pangkat_gol: e.target.value })}
                placeholder="Contoh: Penata Muda / III-a"
                className={CAT_FORM_INPUT_CLS}
              />
            </div>
            <div className="space-y-1.5">
              <label className={CAT_FORM_LABEL_CLS}>
                Jabatan
              </label>
              <input
                type="text"
                value={form.jabatan}
                onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                placeholder="Jabatan struktural / fungsional"
                className={CAT_FORM_INPUT_CLS}
              />
            </div>

            {(isExternal || showInstansiAsal) && (
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Asal Instansi / Unit Kerja
                </label>
                <input
                  type="text"
                  value={form.instansi_asal}
                  onChange={(e) => setForm({ ...form, instansi_asal: e.target.value })}
                  placeholder="Contoh: BKPSDM Kab. Bandung"
                  className={CAT_FORM_INPUT_CLS}
                />
              </div>
            )}

            {showPeranField && (
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Peran / Tugas dalam Tim
                </label>
                <input
                  type="text"
                  value={form.peran}
                  onChange={(e) => setForm({ ...form, peran: e.target.value })}
                  placeholder="Koordinator / Pengawas CAT / IT"
                  className={CAT_FORM_INPUT_CLS}
                />
              </div>
            )}

            {showHonorFields && (
              <>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Jml Hari</label>
                  <input
                    type="number"
                    min={1}
                    value={form.jumlah_hari}
                    onChange={(e) => setForm({ ...form, jumlah_hari: Number(e.target.value || 1) })}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Honor / Uang Harian (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.uang_harian}
                    onChange={(e) => setForm({ ...form, uang_harian: Number(e.target.value || 0) })}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Transport (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.transport}
                    onChange={(e) => setForm({ ...form, transport: Number(e.target.value || 0) })}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
              </>
            )}

            {showNominatifFields && (
              <>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>NIK</label>
                  <input
                    type="text"
                    value={form.nik}
                    onChange={(e) => setForm({ ...form, nik: e.target.value })}
                    placeholder="16 digit NIK"
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Nama Bank</label>
                  <input
                    type="text"
                    value={form.bank_nama}
                    onChange={(e) => setForm({ ...form, bank_nama: e.target.value })}
                    placeholder="BRI / Mandiri / BNI / BJB"
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>No. Rekening</label>
                  <input
                    type="text"
                    value={form.no_rekening}
                    onChange={(e) => setForm({ ...form, no_rekening: e.target.value })}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Jumlah Bruto (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.jumlah}
                    onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value || 0) })}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Pajak PPh Psl 21 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={form.pajak_persen}
                    onChange={(e) => setForm({ ...form, pajak_persen: Number(e.target.value || 0) })}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingRow}
              className="px-4 py-1.5 rounded-lg bg-[#175CD3] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              {savingRow ? 'Menyimpan...' : 'Simpan Personel'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200/70">
            <tr>
              <th className="py-2.5 px-3 w-16 text-center">Urut</th>
              <th className="py-2.5 px-3">Nama / NIP</th>
              <th className="py-2.5 px-3">Gol / Jabatan</th>
              {showInstansiAsal && <th className="py-2.5 px-3">Instansi</th>}
              {showPeranField && <th className="py-2.5 px-3">Peran / Tugas</th>}
              {showHonorFields && <th className="py-2.5 px-3 text-right">Total Biaya</th>}
              {showNominatifFields && (
                <>
                  <th className="py-2.5 px-3">Bank / Rek</th>
                  <th className="py-2.5 px-3 text-right">Diterima</th>
                </>
              )}
              <th className="py-2.5 px-3 text-right w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {personelList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">
                  Belum ada daftar personel. Klik <strong>Tarik Tim Jadwal</strong> atau <strong>Tambah Personel / Tim</strong>.
                </td>
              </tr>
            ) : (
              personelList.map((row, idx) => (
                <tr
                  key={row.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropRow(idx)}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                    dragIdx === idx ? 'opacity-50 bg-blue-50/60' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1 cursor-grab active:cursor-grabbing text-slate-400">
                      <GripVertical className="w-3.5 h-3.5" />
                      <span className="font-bold text-slate-700 dark:text-slate-200">{idx + 1}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">{row.nama}</span>
                      {Number(row.is_external) === 1 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/70 text-[10px] font-bold">
                          Luar Instansi
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{row.nip || '-'}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    <div>{row.pangkat_gol || '-'}</div>
                    <div className="text-[11px] text-slate-400">{row.jabatan || '-'}</div>
                  </td>
                  {showInstansiAsal && (
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {row.instansi_asal || 'Kanreg III BKN Bandung'}
                    </td>
                  )}
                  {showPeranField && (
                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-200">
                      {row.peran || '-'}
                    </td>
                  )}
                  {showHonorFields && (
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-white">
                      {formatRupiah(row.total_biaya || Number(row.uang_harian || 0) * Number(row.jumlah_hari || 1) + Number(row.transport || 0))}
                    </td>
                  )}
                  {showNominatifFields && (
                    <>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        <div>{row.bank_nama || '-'}</div>
                        <div className="text-[11px] font-mono text-slate-400">{row.no_rekening || '-'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-300">
                        {formatRupiah(row.jumlah_diterima || row.jumlah || 0)}
                      </td>
                    </>
                  )}
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={reordering || idx === 0}
                        onClick={() => handleMoveStep(idx, -1)}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                        title="Naikkan urutan"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={reordering || idx === personelList.length - 1}
                        onClick={() => handleMoveStep(idx, 1)}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                        title="Turunkan urutan"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(row)}
                        className="p-1 rounded-md hover:bg-blue-50 text-[#175CD3] cursor-pointer"
                        title="Edit personel"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(row)}
                        className="p-1 rounded-md hover:bg-rose-50 text-rose-600 cursor-pointer"
                        title="Hapus personel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CatDocItemsTableSection({
  doc,
  onDocUpdated,
  title = 'Rincian Item Konsumsi / Jamuan',
  showPrice = true,
}) {
  const items = useMemo(() => (Array.isArray(doc?.items) ? doc.items : []), [doc])
  const [itemName, setItemName] = useState('')
  const [spesifikasi, setSpesifikasi] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [satuan, setSatuan] = useState('Box')
  const [hargaSatuan, setHargaSatuan] = useState(0)
  const [editingId, setEditingId] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleEdit = (item) => {
    setEditingId(item.id)
    setItemName(item.item_name || '')
    setSpesifikasi(item.spesifikasi || '')
    setQuantity(Number(item.quantity || 1))
    setSatuan(item.satuan || 'Box')
    setHargaSatuan(Number(item.harga_satuan || 0))
  }

  const handleReset = () => {
    setEditingId(0)
    setItemName('')
    setSpesifikasi('')
    setQuantity(1)
    setSatuan('Box')
    setHargaSatuan(0)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!itemName.trim()) return
    setSaving(true)
    try {
      const res = await saveCatPengelolaDocItem({
        document_uid: doc.uid,
        id: editingId,
        item_name: itemName,
        spesifikasi,
        quantity,
        satuan,
        harga_satuan: hargaSatuan,
      })
      if (res?.data && onDocUpdated) onDocUpdated(res.data)
      handleReset()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const res = await deleteCatPengelolaDocItem(id, doc.uid)
    if (res?.data && onDocUpdated) onDocUpdated(res.data)
  }

  const grandTotal = items.reduce((acc, it) => acc + Number(it.total_harga || 0), 0)

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-orange-600" />
          <span>{title}</span>
        </h4>
        {showPrice && (
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Total: {formatRupiah(grandTotal)}
          </span>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
      >
        <div className="sm:col-span-2 space-y-1.5">
          <label className={CAT_FORM_LABEL_CLS}>Item / Jenis Paket *</label>
          <input
            type="text"
            required
            placeholder="Contoh: Snack Pagi / Makan Siang"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className={CAT_FORM_INPUT_CLS}
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className={CAT_FORM_LABEL_CLS}>Rincian Menu</label>
          <input
            type="text"
            placeholder="Contoh: Lemper, Pisang Bolen, Air Mineral"
            value={spesifikasi}
            onChange={(e) => setSpesifikasi(e.target.value)}
            className={CAT_FORM_INPUT_CLS}
          />
        </div>
        <div className="space-y-1.5">
          <label className={CAT_FORM_LABEL_CLS}>Qty &amp; Satuan</label>
          <div className="flex gap-1.5">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value || 1))}
              className={`w-1/2 ${CAT_FORM_INPUT_CLS} px-2.5`}
            />
            <input
              type="text"
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              className={`w-1/2 ${CAT_FORM_INPUT_CLS} px-2.5`}
            />
          </div>
        </div>
        {showPrice ? (
          <div className="space-y-1.5">
            <label className={CAT_FORM_LABEL_CLS}>Harga Satuan</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                min={0}
                value={hargaSatuan}
                onChange={(e) => setHargaSatuan(Number(e.target.value || 0))}
                className={CAT_FORM_INPUT_CLS}
              />
              <button
                type="submit"
                disabled={saving}
                className="h-[38px] px-3.5 rounded-xl bg-[#0B3264] text-white font-bold shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full h-[38px] inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-[#0B3264] text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Update' : 'Tambah'}</span>
            </button>
          </div>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200/70">
            <tr>
              <th className="py-2 px-3 w-10 text-center">No</th>
              <th className="py-2 px-3">Paket / Menu</th>
              <th className="py-2 px-3 text-center">Qty</th>
              {showPrice && (
                <>
                  <th className="py-2 px-3 text-right">Harga Satuan</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </>
              )}
              <th className="py-2 px-3 text-right w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-5 text-center text-slate-400">
                  Belum ada rincian jamuan ditambahkan.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => (
                <tr key={it.id}>
                  <td className="py-2 px-3 text-center font-semibold">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{it.item_name}</div>
                    {it.spesifikasi && <div className="text-[11px] text-slate-500">{it.spesifikasi}</div>}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {it.quantity} {it.satuan}
                  </td>
                  {showPrice && (
                    <>
                      <td className="py-2 px-3 text-right">{formatRupiah(it.harga_satuan)}</td>
                      <td className="py-2 px-3 text-right font-bold">{formatRupiah(it.total_harga)}</td>
                    </>
                  )}
                  <td className="py-2 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => handleEdit(it)} className="p-1 rounded hover:bg-blue-50 text-[#175CD3] cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(it.id)} className="p-1 rounded hover:bg-rose-50 text-rose-600 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CatDocBuilderShell({
  doc,
  docTypeLabel,
  orientation = 'portrait',
  saving = false,
  savedNotice = false,
  onSave,
  signers,
  fileName,
  childrenParams,
  renderPreviewTemplate,
}) {
  const [activeTab, setActiveTab] = useState('params')
  const totalSigned = ['kiri', 'tengah', 'kanan'].filter((k) => signers?.[k]?.isSigned).length

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Sub-Tabs Navigation — Identik dengan /layanan/fasilitasi-cat/laporan/* */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('params')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'params'
                ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Parameter &amp; Isi Dokumen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-900 text-[#175CD3] dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>2. Pratinjau Dokumen (PDF A4{orientation === 'landscape' ? ' Landscape' : ''})</span>
            {totalSigned > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          </button>
        </div>

        {/* Status Indikator Header */}
        <div className="flex items-center gap-2 px-2 shrink-0">
          {totalSigned > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{totalSigned} TTE Terverifikasi</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Draft Dokumen (Belum TTD)</span>
            </span>
          )}
        </div>
      </div>

      {activeTab === 'params' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-2xs space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#175CD3]" />
                <span>Parameter {docTypeLabel} &amp; Pengesahan Dokumen</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Data jadwal dan tim pelaksana terhubung dari server. Lengkapi parameter dokumen dan penandatangan lalu klik Simpan Parameter.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {savedNotice && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tersimpan</span>
                </span>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] active:bg-[#124196] text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Parameter'}</span>
              </button>
            </div>
          </div>

          {childrenParams}
        </div>
      )}

      {activeTab === 'preview' && (
        <DocumentPdfPreview
          fileName={fileName || `${doc?.doc_type || 'dokumen'}_${doc?.uid || 'cat'}.pdf`}
          title={`Pratinjau PDF A4: ${doc?.title || docTypeLabel}`}
          orientation={orientation}
        >
          {renderPreviewTemplate()}
        </DocumentPdfPreview>
      )}
    </div>
  )
}

export function CatDocCommonMetaEditor({ form, setForm, childrenExtra = null }) {
  return (
    <div className="space-y-6">
      {/* SECTION A: PILIH INSTANSI (TERPISAH DI PALING ATAS) */}
      <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            A. Pilih Instansi
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih satu atau lebih instansi peserta, atau tambahkan nama instansi secara manual apabila tidak terdaftar.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className={CAT_FORM_LABEL_CLS}>Pilih Instansi</label>
          <CatDocInstansiPicker
            selectedIds={form.instansi_ids || []}
            selectedNames={form.instansi_names || []}
            onChange={({ instansiIds, instansiNames }) =>
              setForm((p) => ({
                ...p,
                instansi_ids: instansiIds,
                instansi_names: instansiNames,
              }))
            }
          />
        </div>
      </div>

      {/* SECTION B: PARAMETER UTAMA & IDENTITAS DOKUMEN */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          B. Parameter Utama &amp; Identitas Dokumen
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className={CAT_FORM_LABEL_CLS}>
              Judul / Perihal Dokumen <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className={`${CAT_FORM_INPUT_CLS} font-semibold`}
            />
          </div>
          <div className="space-y-1.5">
            <label className={CAT_FORM_LABEL_CLS}>Nomor Surat / Bukti</label>
            <input
              type="text"
              value={form.doc_number || ''}
              onChange={(e) => setForm((p) => ({ ...p, doc_number: e.target.value }))}
              placeholder="Nomor dokumen resmi"
              className={CAT_FORM_INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <label className={CAT_FORM_LABEL_CLS}>Tanggal Dokumen</label>
            <input
              type="date"
              value={form.doc_date || ''}
              onChange={(e) => setForm((p) => ({ ...p, doc_date: e.target.value }))}
              className={CAT_FORM_INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <label className={CAT_FORM_LABEL_CLS}>Kota Penetapan / TTD</label>
            <input
              type="text"
              value={form.kota_ttd || 'Bandung'}
              onChange={(e) => setForm((p) => ({ ...p, kota_ttd: e.target.value }))}
              className={CAT_FORM_INPUT_CLS}
            />
          </div>

          {childrenExtra}
        </div>
      </div>
    </div>
  )
}
