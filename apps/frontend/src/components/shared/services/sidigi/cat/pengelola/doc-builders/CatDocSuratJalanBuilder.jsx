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
  CatDocItemsTableSection,
  CatDocSignatureSection,
  CatDocSignaturePrintBlock,
} from './CatDocBuilderShared'
import { extractInitialDocForm, normalizeSignersFromDoc } from './catDocBuilderUtils'

export function CatDocSuratJalanBuilder({ doc, onDocUpdated }) {
  const [form, setForm] = useState(() =>
    extractInitialDocForm(doc, {
      vendor_name: doc?.meta_data?.vendor_name || '',
      vendor_address: 'Bandung',
      vendor_phone: '',
      lokasi_pengiriman: doc?.nama_tilok || 'Kantor Regional III BKN Bandung',
      penerima_tujuan: 'Panitia Fasilitasi Seleksi CAT Kantor Regional III BKN',
    })
  )

  const [signers, setSigners] = useState(() =>
    normalizeSignersFromDoc(doc, {
      kiri: { sign_role: 'pengirim', sign_title: 'Yang Menyerahkan / Pengirim,', jabatan: 'Penyedia Katering' },
      kanan: { sign_role: 'penerima', sign_title: 'Yang Menerima,', jabatan: 'Panitia / Petugas Tilok' },
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
        doc_type: 'surat_jalan',
        title: form.title,
        doc_number: form.doc_number,
        doc_date: form.doc_date,
        status: autoStatus,
        jadwal_id: doc.jadwal_id,
        instansi_ids: form.instansi_ids,
        instansi_names: form.instansi_names,
        vendor_name: form.vendor_name,
        notes: form.notes,
        meta_data: {
          kota_ttd: form.kota_ttd,
          vendor_address: form.vendor_address,
          vendor_phone: form.vendor_phone,
          lokasi_pengiriman: form.lokasi_pengiriman,
          penerima_tujuan: form.penerima_tujuan,
        },
      })
      if (res?.data && onDocUpdated) onDocUpdated(res.data)
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const items = Array.isArray(doc?.items) ? doc.items : []
  const hariText = formatHariId(form.doc_date)
  const tanggalText = formatTanggalPanjangId(form.doc_date)

  return (
    <CatDocBuilderShell
      doc={doc}
      docTypeLabel="Surat Jalan Jamuan"
      saving={saving}
      savedNotice={savedNotice}
      onSave={handleSave}
      signers={signers}
      fileName={`SURAT_JALAN_${(form.doc_number || doc.uid).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`}
      childrenParams={
        <div className="space-y-7">
          <CatDocCommonMetaEditor
            form={form}
            setForm={setForm}
            childrenExtra={
              <>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Nama Penyedia / Rekanan</label>
                  <input
                    type="text"
                    value={form.vendor_name || ''}
                    onChange={(e) => setForm((p) => ({ ...p, vendor_name: e.target.value }))}
                    placeholder="Contoh: CV Boga Rasa Mandiri"
                    className={`${CAT_FORM_INPUT_CLS} font-semibold`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Alamat &amp; No. Telp Penyedia</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Alamat"
                      value={form.vendor_address || ''}
                      onChange={(e) => setForm((p) => ({ ...p, vendor_address: e.target.value }))}
                      className={`flex-1 ${CAT_FORM_INPUT_CLS}`}
                    />
                    <input
                      type="text"
                      placeholder="Telp"
                      value={form.vendor_phone || ''}
                      onChange={(e) => setForm((p) => ({ ...p, vendor_phone: e.target.value }))}
                      className={`w-36 ${CAT_FORM_INPUT_CLS}`}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Kepada Yth. (Penerima Tujuan)</label>
                  <input
                    type="text"
                    value={form.penerima_tujuan || ''}
                    onChange={(e) => setForm((p) => ({ ...p, penerima_tujuan: e.target.value }))}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Lokasi Pengiriman / Titik Lokasi</label>
                  <input
                    type="text"
                    value={form.lokasi_pengiriman || ''}
                    onChange={(e) => setForm((p) => ({ ...p, lokasi_pengiriman: e.target.value }))}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
              </>
            }
          />

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <CatDocItemsTableSection
              doc={doc}
              onDocUpdated={onDocUpdated}
              title="C. Daftar Pengiriman Menu Konsumsi (Snack Pagi / Makan Siang / Snack Sore)"
              showPrice={false}
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
          style={{ width: '794px', minHeight: '1123px', padding: '42px 50px', ...PDF_ARIAL_PAGE_STYLE }}
        >
          <div data-pdf-block="true" className="flex justify-between items-start border-b-2 border-black pb-3 mb-5 text-black">
            <div>
              <div className="text-[12px] font-bold uppercase">{form.vendor_name || 'PENYEDIA KATERING'}</div>
              <div className="text-[12px]">{form.vendor_address || 'Bandung'}</div>
              {form.vendor_phone && <div className="text-[12px]">Telp: {form.vendor_phone}</div>}
            </div>
            <div className="text-right">
              <div className="text-[12px] font-bold uppercase underline">SURAT JALAN</div>
              <div className="text-[12px] mt-1">No. Surat Jalan : <strong>{form.doc_number || '-'}</strong></div>
              <div className="text-[12px]">Tanggal : <strong>{hariText}, {tanggalText}</strong></div>
            </div>
          </div>

          <div data-pdf-block="true" className="text-[12px] text-black mb-5 space-y-1">
            <div><strong>Kepada Yth.</strong> {form.penerima_tujuan}</div>
            <div><strong>Lokasi Pengiriman :</strong> {form.lokasi_pengiriman}</div>
            <div><strong>Kegiatan :</strong> {doc?.nama_seleksi || form.title}</div>
          </div>

          <p data-pdf-block="true" className="text-[12px] text-black mb-3">
            Bersama ini kami kirimkan barang konsumsi / jamuan kegiatan seleksi CAT dengan rincian sebagai berikut:
          </p>

          <table className="w-full border-collapse border border-black text-[12px] text-black mb-6">
            <thead>
              <tr data-pdf-block="true" className="bg-slate-100 font-bold text-center">
                <th className="border border-black px-2 py-2 w-10">No</th>
                <th className="border border-black px-3 py-2 text-left">Waktu / Jenis Paket</th>
                <th className="border border-black px-3 py-2 text-left">Rincian Menu</th>
                <th className="border border-black px-3 py-2 w-32">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-black p-4 text-center italic">
                    Belum ada daftar pengiriman jamuan ditambahkan.
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const menuParts = String(it.spesifikasi || '')
                    .split(/[\n,;]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                  return (
                    <tr key={it.id || idx} data-pdf-block="true">
                      <td className="border border-black px-2 py-2.5 text-center align-top">{idx + 1}.</td>
                      <td className="border border-black px-3 py-2.5 font-bold align-top">{it.item_name}</td>
                      <td className="border border-black px-3 py-2.5 align-top">
                        {menuParts.length > 0 ? (
                          <ul className="list-disc pl-4 space-y-0.5">
                            {menuParts.map((m, mi) => (
                              <li key={mi}>{m}</li>
                            ))}
                          </ul>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="border border-black px-3 py-2.5 text-center font-bold align-top">
                        {it.quantity} {it.satuan || 'Dus'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          <p data-pdf-block="true" className="text-[12px] text-black mb-6">
            Demikian surat jalan pengiriman ini dibuat untuk diperiksa kesesuaian jumlah dan jenisnya pada saat serah terima.
          </p>

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
