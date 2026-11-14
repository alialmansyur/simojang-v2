import { useState } from 'react'
import {
  angkaTerbilang,
  formatAngkaId,
  formatTanggalPanjangId,
  resolveDocAutoYear,
  PDF_ARIAL_PAGE_STYLE,
  CAT_FORM_LABEL_CLS,
  CAT_FORM_INPUT_CLS,
  CAT_FORM_TEXTAREA_CLS,
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

/**
 * Kwitansi & Faktur Jamuan dalam 1 kesatuan:
 * - Halaman 1: Kuitansi Pembayaran Konsumsi / Jamuan
 * - Halaman 2+: Faktur / Invoice Penagihan dari Rekanan Katering
 */
export function CatDocKwitansiJamuanBuilder({ doc, onDocUpdated }) {
  const autoYear = resolveDocAutoYear(doc)
  const [form, setForm] = useState(() =>
    extractInitialDocForm(doc, {
      bukti_kas_no: '',
      akun: '521211',
      sudah_terima_dari: 'Kuasa Pengguna Anggaran Kantor Regional III BKN Bandung',
      untuk_pembayaran:
        'Belanja pengadaan konsumsi / jamuan kegiatan fasilitasi seleksi CAT BKN sesuai rincian faktur terlampir.',
      mak: '2664.PBA.004.051.A.521211',
      vendor_name: doc?.meta_data?.vendor_name || '',
      vendor_npwp: doc?.meta_data?.vendor_npwp || '',
      vendor_address: 'Bandung',
      faktur_number: '',
      faktur_date: doc?.doc_date || new Date().toISOString().split('T')[0],
    })
  )

  const [signers, setSigners] = useState(() =>
    normalizeSignersFromDoc(doc, {
      kiri: { sign_role: 'ppk', sign_title: 'Setuju Dibayar,', jabatan: 'Pejabat Pembuat Komitmen' },
      tengah: { sign_role: 'bendahara', sign_title: 'Lunas Dibayar,', jabatan: 'Bendahara Pengeluaran' },
      kanan: { sign_role: 'penerima', sign_title: 'Yang Menerima,', jabatan: 'Penyedia Katering' },
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
        doc_type: 'kwitansi_jamuan',
        title: form.title,
        doc_number: form.doc_number,
        doc_date: form.doc_date,
        status: autoStatus,
        jadwal_id: doc.jadwal_id,
        instansi_ids: form.instansi_ids,
        instansi_names: form.instansi_names,
        mak: form.mak,
        vendor_name: form.vendor_name,
        vendor_npwp: form.vendor_npwp,
        notes: form.notes,
        meta_data: {
          kota_ttd: form.kota_ttd,
          bukti_kas_no: form.bukti_kas_no,
          akun: form.akun,
          dipa_ta: autoYear,
          sudah_terima_dari: form.sudah_terima_dari,
          untuk_pembayaran: form.untuk_pembayaran,
          vendor_address: form.vendor_address,
          faktur_number: form.faktur_number,
          faktur_date: form.faktur_date,
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
  const grandTotal = items.reduce((acc, it) => acc + Number(it.total_harga || 0), 0)

  return (
    <CatDocBuilderShell
      doc={doc}
      docTypeLabel="Kwitansi & Faktur Jamuan (1 Kesatuan)"
      saving={saving}
      savedNotice={savedNotice}
      onSave={handleSave}
      signers={signers}
      fileName={`KWITANSI_FAKTUR_JAMUAN_${(form.doc_number || doc.uid).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`}
      childrenParams={
        <div className="space-y-7">
          <CatDocCommonMetaEditor
            form={form}
            setForm={setForm}
            childrenExtra={
              <>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Nama Penyedia / Rekanan Katering</label>
                  <input
                    type="text"
                    value={form.vendor_name || ''}
                    onChange={(e) => setForm((p) => ({ ...p, vendor_name: e.target.value }))}
                    placeholder="Contoh: CV Boga Rasa Mandiri"
                    className={`${CAT_FORM_INPUT_CLS} font-semibold`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>NPWP &amp; Alamat Penyedia</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="NPWP"
                      value={form.vendor_npwp || ''}
                      onChange={(e) => setForm((p) => ({ ...p, vendor_npwp: e.target.value }))}
                      className={`w-1/2 ${CAT_FORM_INPUT_CLS}`}
                    />
                    <input
                      type="text"
                      placeholder="Kota/Alamat"
                      value={form.vendor_address || ''}
                      onChange={(e) => setForm((p) => ({ ...p, vendor_address: e.target.value }))}
                      className={`w-1/2 ${CAT_FORM_INPUT_CLS}`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Nomor &amp; Tgl Faktur (Hal. 2)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="No. Faktur / Invoice"
                      value={form.faktur_number || ''}
                      onChange={(e) => setForm((p) => ({ ...p, faktur_number: e.target.value }))}
                      className={`flex-1 ${CAT_FORM_INPUT_CLS}`}
                    />
                    <input
                      type="date"
                      value={form.faktur_date || ''}
                      onChange={(e) => setForm((p) => ({ ...p, faktur_date: e.target.value }))}
                      className={`w-40 ${CAT_FORM_INPUT_CLS}`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Bukti Kas No. / Akun (T.A {autoYear})</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Kas No"
                      value={form.bukti_kas_no || ''}
                      onChange={(e) => setForm((p) => ({ ...p, bukti_kas_no: e.target.value }))}
                      className={`w-1/2 ${CAT_FORM_INPUT_CLS}`}
                    />
                    <input
                      type="text"
                      placeholder="Akun"
                      value={form.akun || ''}
                      onChange={(e) => setForm((p) => ({ ...p, akun: e.target.value }))}
                      className={`w-1/2 ${CAT_FORM_INPUT_CLS} font-mono`}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Sudah Terima Dari</label>
                  <input
                    type="text"
                    value={form.sudah_terima_dari || ''}
                    onChange={(e) => setForm((p) => ({ ...p, sudah_terima_dari: e.target.value }))}
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Untuk Pembayaran</label>
                  <textarea
                    rows={2}
                    value={form.untuk_pembayaran || ''}
                    onChange={(e) => setForm((p) => ({ ...p, untuk_pembayaran: e.target.value }))}
                    className={CAT_FORM_TEXTAREA_CLS}
                  />
                </div>
              </>
            }
          />

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <CatDocItemsTableSection
              doc={doc}
              onDocUpdated={onDocUpdated}
              title="C. Rincian Item Jamuan (Masuk Otomatis ke Halaman 2 Faktur & Total Kwitansi)"
              showPrice
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
        <div className="space-y-6">
          {/* HALAMAN 1: KUITANSI JAMUAN (DI ATAS) */}
          <div
            className="document-a4-page mx-auto bg-white text-black shadow-lg"
            style={{ width: '794px', minHeight: '1123px', padding: '42px 50px', ...PDF_ARIAL_PAGE_STYLE }}
          >
            <div data-pdf-block="true" className="flex justify-end mb-6">
              <table className="border-collapse border border-black text-[12px] text-black w-80">
                <thead>
                  <tr>
                    <th colSpan={2} className="border border-black px-2 py-1 text-center font-bold bg-slate-100">
                      DIMASUKAN DALAM BUKU PENGELUARAN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 w-28">Bukti Kas No.</td>
                    <td className="border border-black px-2 py-1 font-semibold">{form.bukti_kas_no || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">Tanggal</td>
                    <td className="border border-black px-2 py-1">{form.doc_date ? formatTanggalPanjangId(form.doc_date) : '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">Akun / MAK</td>
                    <td className="border border-black px-2 py-1 font-mono">{form.akun || form.mak || '-'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1">DIPA T.A</td>
                    <td className="border border-black px-2 py-1">{autoYear}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div data-pdf-block="true" className="text-center mb-6">
              <div className="text-[12px] font-bold uppercase tracking-widest underline">KUITANSI JAMUAN</div>
              {form.doc_number && <div className="text-[12px] font-semibold mt-0.5">Nomor : {form.doc_number}</div>}
            </div>

            <div data-pdf-block="true" className="border border-black p-5 space-y-4 text-[12px] text-black">
              <div className="flex gap-3">
                <div className="w-40 font-semibold shrink-0">Sudah Terima Dari</div>
                <div className="w-3 shrink-0">:</div>
                <div className="flex-1 font-bold">{form.sudah_terima_dari}</div>
              </div>
              <div className="flex gap-3">
                <div className="w-40 font-semibold shrink-0">Uang Sebanyak</div>
                <div className="w-3 shrink-0">:</div>
                <div className="flex-1 font-bold italic bg-slate-100 px-3 py-1.5 border border-black">
                  {angkaTerbilang(grandTotal)}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-40 font-semibold shrink-0">Untuk Pembayaran</div>
                <div className="w-3 shrink-0">:</div>
                <div className="flex-1 text-justify">
                  {form.untuk_pembayaran} (Rincian terlampir pada Faktur Nomor:{' '}
                  <strong>{form.faktur_number || form.doc_number || '-'}</strong>).
                </div>
              </div>
              <div className="flex gap-3 pt-2 items-center">
                <div className="w-40 font-semibold shrink-0">Jumlah Uang</div>
                <div className="w-3 shrink-0">:</div>
                <div className="inline-block border-2 border-black px-5 py-1.5 text-[12px] font-bold bg-slate-50">
                  Rp {formatAngkaId(grandTotal)},-
                </div>
              </div>
            </div>

            <div className="pt-6">
              <CatDocSignaturePrintBlock
                signers={signers}
                kotaTtd={form.kota_ttd}
                tanggalTtd={form.doc_date}
              />
            </div>
          </div>

          {/* HALAMAN 2: FAKTUR / INVOICE JAMUAN (HALAMAN SELANJUTNYA) */}
          <div
            className="document-a4-page mx-auto bg-white text-black shadow-lg"
            style={{ width: '794px', minHeight: '1123px', padding: '42px 50px', ...PDF_ARIAL_PAGE_STYLE }}
          >
            <div data-pdf-block="true" className="flex justify-between items-start border-b-2 border-black pb-3 mb-5 text-black">
              <div>
                <div className="text-[12px] font-bold uppercase">{form.vendor_name || 'PENYEDIA KATERING'}</div>
                <div className="text-[12px]">{form.vendor_address || 'Bandung'}</div>
                {form.vendor_npwp && <div className="text-[12px]">NPWP: {form.vendor_npwp}</div>}
              </div>
              <div className="text-right">
                <div className="text-[12px] font-bold uppercase underline">FAKTUR / INVOICE</div>
                <div className="text-[12px] mt-1">
                  Nomor : <strong>{form.faktur_number || form.doc_number || '-'}</strong>
                </div>
                <div className="text-[12px]">
                  Tanggal : <strong>{formatTanggalPanjangId(form.faktur_date || form.doc_date)}</strong>
                </div>
              </div>
            </div>

            <div data-pdf-block="true" className="text-[12px] mb-4 space-y-0.5 text-black">
              <div><strong>Kepada Yth.</strong></div>
              <div>{form.sudah_terima_dari}</div>
              <div>Kegiatan : {doc?.nama_seleksi || form.title}</div>
              <div>Lokasi : {doc?.nama_tilok || 'Kantor Regional III BKN Bandung'}</div>
            </div>

            <table className="w-full border-collapse border border-black text-[12px] text-black mb-4">
              <thead>
                <tr data-pdf-block="true" className="bg-slate-100 font-bold text-center">
                  <th className="border border-black px-2 py-2 w-10">No</th>
                  <th className="border border-black px-3 py-2 text-left">Uraian Menu / Item Jamuan</th>
                  <th className="border border-black px-2 py-2 w-24">Qty</th>
                  <th className="border border-black px-3 py-2 text-right w-28">Harga Satuan</th>
                  <th className="border border-black px-3 py-2 text-right w-32">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-black p-4 text-center italic">
                      Belum ada rincian menu jamuan ditambahkan.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={it.id || idx} data-pdf-block="true">
                      <td className="border border-black px-2 py-2 text-center">{idx + 1}.</td>
                      <td className="border border-black px-3 py-2">
                        <div className="font-bold">{it.item_name}</div>
                        {it.spesifikasi && <div>{it.spesifikasi}</div>}
                      </td>
                      <td className="border border-black px-2 py-2 text-center">
                        {it.quantity} {it.satuan}
                      </td>
                      <td className="border border-black px-3 py-2 text-right">{formatAngkaId(it.harga_satuan || 0)}</td>
                      <td className="border border-black px-3 py-2 text-right font-semibold">{formatAngkaId(it.total_harga || 0)}</td>
                    </tr>
                  ))
                )}
                <tr data-pdf-block="true" className="bg-slate-100 font-bold">
                  <td colSpan={4} className="border border-black px-3 py-2 text-right uppercase">Total Faktur</td>
                  <td className="border border-black px-3 py-2 text-right text-[12px]">Rp {formatAngkaId(grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            <div data-pdf-block="true" className="text-[12px] italic mb-6 text-black">
              Terbilang : <strong>{angkaTerbilang(grandTotal)}</strong>
            </div>

            <CatDocSignaturePrintBlock
              signers={signers}
              kotaTtd={form.kota_ttd}
              tanggalTtd={form.faktur_date || form.doc_date}
            />
          </div>
        </div>
      )}
    />
  )
}
