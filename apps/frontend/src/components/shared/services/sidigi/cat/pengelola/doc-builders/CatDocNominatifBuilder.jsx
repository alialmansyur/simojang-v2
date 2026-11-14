import { useState } from 'react'
import {
  formatAngkaId,
  resolveDocAutoYear,
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

export function CatDocNominatifBuilder({ doc, onDocUpdated }) {
  const autoYear = resolveDocAutoYear(doc)
  const [form, setForm] = useState(() =>
    extractInitialDocForm(doc, {
      mak: '2664.PBA.004.051.A.522151',
      judul_tabel: 'DAFTAR NOMINATIF PEMBAYARAN HONORARIUM / UANG SAKU TIM PELAKSANA',
    })
  )

  const [signers, setSigners] = useState(() =>
    normalizeSignersFromDoc(doc, {
      kiri: { sign_role: 'ppk', sign_title: 'Mengetahui / Setuju Dibayar,', jabatan: 'Pejabat Pembuat Komitmen' },
      kanan: { sign_role: 'bendahara', sign_title: 'Lunas Dibayar,', jabatan: 'Bendahara Pengeluaran' },
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
        doc_type: 'nominatif',
        title: form.title,
        doc_number: form.doc_number,
        doc_date: form.doc_date,
        status: autoStatus,
        jadwal_id: doc.jadwal_id,
        instansi_ids: form.instansi_ids,
        instansi_names: form.instansi_names,
        mak: form.mak,
        notes: form.notes,
        meta_data: {
          kota_ttd: form.kota_ttd,
          tahun_anggaran: autoYear,
          judul_tabel: form.judul_tabel,
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
  const sumJumlah = personelList.reduce((acc, r) => acc + Number(r.jumlah || 0), 0)
  const sumPajak = personelList.reduce((acc, r) => acc + Number(r.pajak_nominal || 0), 0)
  const sumDiterima = personelList.reduce((acc, r) => acc + Number(r.jumlah_diterima || r.jumlah || 0), 0)
  const instansiLabel = form.instansi_names?.length ? form.instansi_names.join(', ') : doc?.instansi_nama || '-'

  return (
    <CatDocBuilderShell
      doc={doc}
      docTypeLabel="Daftar Nominatif"
      orientation="landscape"
      saving={saving}
      savedNotice={savedNotice}
      onSave={handleSave}
      signers={signers}
      fileName={`NOMINATIF_${(form.doc_number || doc.uid).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`}
      childrenParams={
        <div className="space-y-7">
          <CatDocCommonMetaEditor
            form={form}
            setForm={setForm}
            childrenExtra={
              <>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>MAK (Tahun {autoYear})</label>
                  <div>
                    <input
                      type="text"
                      value={form.mak || ''}
                      onChange={(e) => setForm((p) => ({ ...p, mak: e.target.value }))}
                      className={`${CAT_FORM_INPUT_CLS} font-mono`}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Judul Header Daftar Nominatif</label>
                  <input
                    type="text"
                    value={form.judul_tabel || ''}
                    onChange={(e) => setForm((p) => ({ ...p, judul_tabel: e.target.value }))}
                    className={`${CAT_FORM_INPUT_CLS} font-semibold`}
                  />
                </div>
              </>
            }
          />

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <CatDocPersonelTableSection
              doc={doc}
              onDocUpdated={onDocUpdated}
              title="C. Daftar Penerima Nominatif (Drag & Drop Urutan)"
              showNominatifFields
              showPeranField
              showInstansiAsal
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <CatDocSignatureSection
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
          style={{ width: '1123px', minHeight: '794px', padding: '32px 42px', ...PDF_ARIAL_PAGE_STYLE }}
        >
          <CatDocKopSurat />

          <div data-pdf-block="true" className="text-center mb-4 space-y-0.5 text-black">
            <div className="text-[12px] font-bold uppercase">{form.judul_tabel}</div>
            <div className="text-[12px] font-semibold">
              {doc?.nama_seleksi || 'SELEKSI CAT BKN'} — {instansiLabel}
            </div>
            <div className="text-[12px]">
              MAK: {form.mak || '-'} | Tahun Anggaran: {autoYear} | Lokasi: {doc?.nama_tilok || '-'}
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-[12px] text-black">
            <thead>
              <tr data-pdf-block="true" className="bg-slate-100 font-bold text-center">
                <th className="border border-black px-1.5 py-2 w-8">No</th>
                <th className="border border-black px-2 py-2 text-left">Nama / NIP</th>
                <th className="border border-black px-1.5 py-2">Gol</th>
                <th className="border border-black px-2 py-2">NIK</th>
                <th className="border border-black px-2 py-2 text-left">Bank &amp; No. Rekening</th>
                <th className="border border-black px-2 py-2 text-left">Jabatan / Peran</th>
                <th className="border border-black px-2 py-2 text-right">Jumlah (Rp)</th>
                <th className="border border-black px-2 py-2 text-right">Pajak PPh Psl 21 (Rp)</th>
                <th className="border border-black px-2 py-2 text-right">Jumlah Diterima (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {personelList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-black p-4 text-center italic">
                    Belum ada data penerima pada daftar nominatif ini.
                  </td>
                </tr>
              ) : (
                personelList.map((p, idx) => (
                  <tr key={p.id || idx} data-pdf-block="true">
                    <td className="border border-black px-1.5 py-1.5 text-center">{idx + 1}.</td>
                    <td className="border border-black px-2 py-1.5">
                      <div className="font-bold">{p.nama}</div>
                      <div>{p.nip ? `NIP. ${p.nip}` : '-'}</div>
                    </td>
                    <td className="border border-black px-1.5 py-1.5 text-center">{p.pangkat_gol || '-'}</td>
                    <td className="border border-black px-2 py-1.5 text-center font-mono">{p.nik || '-'}</td>
                    <td className="border border-black px-2 py-1.5">
                      <div>{p.bank_nama || '-'}</div>
                      <div className="font-mono">{p.no_rekening || '-'}</div>
                    </td>
                    <td className="border border-black px-2 py-1.5">
                      <div>{p.jabatan || '-'}</div>
                      {p.peran && <div>({p.peran})</div>}
                    </td>
                    <td className="border border-black px-2 py-1.5 text-right">{formatAngkaId(p.jumlah || 0)}</td>
                    <td className="border border-black px-2 py-1.5 text-right">{formatAngkaId(p.pajak_nominal || 0)}</td>
                    <td className="border border-black px-2 py-1.5 text-right font-bold">
                      {formatAngkaId(p.jumlah_diterima || p.jumlah || 0)}
                    </td>
                  </tr>
                ))
              )}
              <tr data-pdf-block="true" className="bg-slate-100 font-bold">
                <td colSpan={6} className="border border-black px-2 py-2 text-center uppercase">Jumlah Total</td>
                <td className="border border-black px-2 py-2 text-right">{formatAngkaId(sumJumlah)}</td>
                <td className="border border-black px-2 py-2 text-right">{formatAngkaId(sumPajak)}</td>
                <td className="border border-black px-2 py-2 text-right">{formatAngkaId(sumDiterima)}</td>
              </tr>
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
