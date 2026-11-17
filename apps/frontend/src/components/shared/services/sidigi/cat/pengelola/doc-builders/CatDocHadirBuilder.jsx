import { useState } from 'react'
import {
  formatHariId,
  formatTanggalPanjangId,
  PDF_ARIAL_PAGE_STYLE,
  CAT_FORM_LABEL_CLS,
  CAT_FORM_INPUT_CLS,
} from '../pengelolaConstants'
import { saveCatPengelolaDocument } from '../../../../../../../services/api/sidigiCatServicesApi'
import {
  CatDocBuilderShell,
  CatDocCommonMetaEditor,
  CatDocKopSurat,
  CatDocPersonelTableSection,
  CatDocSignatureSection,
  CatDocSignaturePrintBlock,
} from './CatDocBuilderShared'
import { extractInitialDocForm, normalizeSignersFromDoc } from './catDocBuilderUtils'

export function CatDocHadirBuilder({ doc, onDocUpdated }) {
  const [form, setForm] = useState(() =>
    extractInitialDocForm(doc, {
      judul_hadir: 'DAFTAR HADIR PETUGAS PELAKSANA SELEKSI CAT',
      tempat_pelaksanaan: doc?.nama_tilok || 'Kantor Regional III BKN Bandung',
      keterangan_sesi: '',
    })
  )

  const [signers, setSigners] = useState(() =>
    normalizeSignersFromDoc(doc, {
      kanan: { sign_role: 'koordinator', sign_title: 'Mengetahui,', jabatan: 'Penanggung Jawab Pelaksanaan' },
    })
  )
  const [saving, setSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const autoStatus = ['kiri', 'tengah', 'kanan'].some((k) => signers?.[k]?.isSigned)
        ? 'final'
        : 'draft'
      const res = await saveCatPengelolaDocument({
        key: doc.uid,
        doc_type: 'hadir',
        title: form.title,
        doc_number: form.doc_number,
        doc_date: form.doc_date,
        status: autoStatus,
        jadwal_id: doc.jadwal_id,
        instansi_ids: form.instansi_ids,
        instansi_names: form.instansi_names,
        notes: form.notes,
        meta_data: {
          kota_ttd: form.kota_ttd,
          judul_hadir: form.judul_hadir,
          tempat_pelaksanaan: form.tempat_pelaksanaan,
          keterangan_sesi: form.keterangan_sesi,
        },
      })
      if (res?.data && onDocUpdated) onDocUpdated(res.data)
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const personelList = Array.isArray(doc?.personel) ? doc.personel : []
  const hariText = formatHariId(form.doc_date)
  const tanggalText = formatTanggalPanjangId(form.doc_date)

  return (
    <CatDocBuilderShell
      doc={doc}
      docTypeLabel="Daftar Hadir Petugas"
      orientation="landscape"
      saving={saving}
      savedNotice={savedNotice}
      onSave={handleSave}
      signers={signers}
      fileName={`DAFTAR_HADIR_${(form.doc_date || doc.uid)}.pdf`}
      childrenParams={
        <div className="space-y-7">
          <CatDocCommonMetaEditor
            form={form}
            setForm={setForm}
            childrenExtra={
              <>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className={CAT_FORM_LABEL_CLS}>Titik Lokasi / Tempat</label>
                  <input
                    type="text"
                    value={form.tempat_pelaksanaan || ''}
                    onChange={(e) => setForm((p) => ({ ...p, tempat_pelaksanaan: e.target.value }))}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Judul Daftar Hadir</label>
                  <input
                    type="text"
                    value={form.judul_hadir || ''}
                    onChange={(e) => setForm((p) => ({ ...p, judul_hadir: e.target.value }))}
                    className={`${CAT_FORM_INPUT_CLS} font-semibold`}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Keterangan / Sesi (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Sesi I s.d IV / Hari Ke-1"
                    value={form.keterangan_sesi || ''}
                    onChange={(e) => setForm((p) => ({ ...p, keterangan_sesi: e.target.value }))}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
              </>
            }
          />

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <CatDocPersonelTableSection
              doc={doc}
              onDocUpdated={onDocUpdated}
              title="C. Daftar Hadir Tim & Personel (Drag & Drop Urutan, Mendukung NIP Luar Instansi)"
              showInstansiAsal
              showPeranField
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <CatDocSignatureSection
              doc={doc}
              docUid={doc.uid}
              signers={signers}
              onChangeSigners={setSigners}
              onSaved={onDocUpdated}
              sectionLetter="D"
            />
          </div>
        </div>
      }
      renderPreviewTemplate={() => (
        <div
          className="document-a4-page mx-auto bg-white text-black shadow-lg"
          style={{ width: '1123px', minHeight: '794px', padding: '32px 48px', ...PDF_ARIAL_PAGE_STYLE }}
        >
          <CatDocKopSurat />

          <div data-pdf-block="true" className="text-center mb-4 text-black">
            <div className="text-[12px] font-bold uppercase underline">{form.judul_hadir}</div>
            {doc?.nama_seleksi && <div className="text-[12px] font-semibold mt-0.5">{doc.nama_seleksi}</div>}
          </div>

          <div data-pdf-block="true" className="text-[12px] text-black grid grid-cols-2 gap-x-8 gap-y-1 mb-3">
            <div className="flex gap-2">
              <span className="w-28 font-semibold">Hari / Tanggal</span>
              <span>:</span>
              <span className="font-semibold">{hariText}, {tanggalText}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-28 font-semibold">Lokasi / Tilok</span>
              <span>:</span>
              <span>{form.tempat_pelaksanaan || '-'}</span>
            </div>
            {form.keterangan_sesi && (
              <div className="flex gap-2 col-span-2">
                <span className="w-28 font-semibold">Keterangan</span>
                <span>:</span>
                <span>{form.keterangan_sesi}</span>
              </div>
            )}
          </div>

          <table className="w-full border-collapse border border-black text-[12px] text-black">
            <thead>
              <tr data-pdf-block="true" className="bg-slate-100 font-bold text-center">
                <th className="border border-black px-2 py-2 w-12">No</th>
                <th className="border border-black px-3 py-2 text-left">Nama / NIP</th>
                <th className="border border-black px-3 py-2 text-left">Instansi / Jabatan</th>
                <th colSpan={2} className="border border-black px-3 py-2 w-64">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody>
              {personelList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border border-black p-4 text-center italic">
                    Belum ada daftar hadir petugas yang ditambahkan.
                  </td>
                </tr>
              ) : (
                personelList.map((p, idx) => (
                  <tr key={p.id || idx} data-pdf-block="true">
                    <td className="border border-black px-2 py-2.5 text-center font-semibold">{idx + 1}.</td>
                    <td className="border border-black px-3 py-2.5">
                      <div className="font-bold">{p.nama}</div>
                      <div>{p.nip ? `NIP/NIK. ${p.nip}` : '-'}</div>
                    </td>
                    <td className="border border-black px-3 py-2.5">
                      <div>{p.instansi_asal || 'Kanreg III BKN Bandung'}</div>
                      {(p.peran || p.jabatan) && (
                        <div>{p.peran || p.jabatan}</div>
                      )}
                    </td>
                    <td className="border border-black px-2 py-2.5 w-32 align-top">
                      {idx % 2 === 0 ? `${idx + 1}. ....................` : ''}
                    </td>
                    <td className="border border-black px-2 py-2.5 w-32 align-top">
                      {idx % 2 === 1 ? `${idx + 1}. ....................` : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <CatDocSignaturePrintBlock
            signers={signers}
            kotaTtd={form.kota_ttd}
            tanggalTtd={form.doc_date}
          />
        </div>
      )}
    />
  )
}
