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
  CatDocPersonelTableSection,
  CatDocSignatureSection,
  CatDocSignaturePrintBlock,
} from './CatDocBuilderShared'
import { extractInitialDocForm, normalizeSignersFromDoc } from './catDocBuilderUtils'

export function CatDocKwitansiBuilder({ doc, onDocUpdated }) {
  const autoYear = resolveDocAutoYear(doc)
  const [form, setForm] = useState(() =>
    extractInitialDocForm(doc, {
      bukti_kas_no: '',
      akun: '522151',
      sudah_terima_dari: 'Kuasa Pengguna Anggaran Kantor Regional III BKN Bandung',
      untuk_pembayaran:
        'Biaya perjalanan dinas dan/atau honorarium tim pelaksana fasilitasi seleksi CAT BKN sesuai rincian daftar terlampir.',
      mak: '2664.PBA.004.051.A.522151',
    })
  )

  const [signers, setSigners] = useState(() =>
    normalizeSignersFromDoc(doc, {
      kiri: { sign_role: 'ppk', sign_title: 'Setuju Dibayar,', jabatan: 'Pejabat Pembuat Komitmen' },
      tengah: { sign_role: 'bendahara', sign_title: 'Lunas Dibayar,', jabatan: 'Bendahara Pengeluaran' },
      kanan: { sign_role: 'penerima', sign_title: 'Yang Menerima,', jabatan: 'Petugas Pelaksana' },
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
        doc_type: 'kwitansi',
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
          bukti_kas_no: form.bukti_kas_no,
          akun: form.akun,
          dipa_ta: autoYear,
          sudah_terima_dari: form.sudah_terima_dari,
          untuk_pembayaran: form.untuk_pembayaran,
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
  const grandTotal = personelList.reduce(
    (acc, p) => acc + Number(p.total_biaya || Number(p.uang_harian || 0) * Number(p.jumlah_hari || 1) + Number(p.transport || 0)),
    0
  )

  return (
    <CatDocBuilderShell
      doc={doc}
      docTypeLabel="Kwitansi Perjalanan Dinas"
      saving={saving}
      savedNotice={savedNotice}
      onSave={handleSave}
      signers={signers}
      fileName={`KWITANSI_${(form.doc_number || doc.uid).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`}
      childrenParams={
        <div className="space-y-7">
          <CatDocCommonMetaEditor
            form={form}
            setForm={setForm}
            childrenExtra={
              <>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Bukti Kas No.</label>
                  <input
                    type="text"
                    value={form.bukti_kas_no || ''}
                    onChange={(e) => setForm((p) => ({ ...p, bukti_kas_no: e.target.value }))}
                    placeholder="No. BKU / Kas"
                    className={CAT_FORM_INPUT_CLS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={CAT_FORM_LABEL_CLS}>Akun (DIPA T.A {autoYear})</label>
                  <input
                    type="text"
                    value={form.akun || ''}
                    onChange={(e) => setForm((p) => ({ ...p, akun: e.target.value }))}
                    className={`${CAT_FORM_INPUT_CLS} font-mono`}
                  />
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
            <CatDocPersonelTableSection
              doc={doc}
              onDocUpdated={onDocUpdated}
              title="C. Daftar Penerima Kwitansi (Drag & Drop Urutan)"
              showHonorFields
              showPeranField={false}
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
          style={{ width: '794px', minHeight: '1123px', padding: '36px 46px', ...PDF_ARIAL_PAGE_STYLE }}
        >
          {/* Box kanan atas: Dimasukan dalam buku pengeluaran */}
          <div data-pdf-block="true" className="flex justify-end mb-4">
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
                  <td className="border border-black px-2 py-1">Akun</td>
                  <td className="border border-black px-2 py-1 font-mono">{form.akun || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1">DIPA T.A</td>
                  <td className="border border-black px-2 py-1">{autoYear}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1">Paraf</td>
                  <td className="border border-black px-2 py-1 h-7">&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div data-pdf-block="true" className="text-center mb-4">
            <div className="text-[12px] font-bold uppercase tracking-wider underline">KUITANSI / BUKTI PEMBAYARAN</div>
            {form.doc_number && <div className="text-[12px] font-semibold">Nomor: {form.doc_number}</div>}
          </div>

          <div data-pdf-block="true" className="text-[12px] space-y-2 mb-4 text-black">
            <div className="flex gap-2">
              <div className="w-36 font-semibold shrink-0">Sudah Terima Dari</div>
              <div className="w-3 shrink-0">:</div>
              <div className="flex-1 font-bold">{form.sudah_terima_dari}</div>
            </div>
            <div className="flex gap-2">
              <div className="w-36 font-semibold shrink-0">Uang Sebanyak</div>
              <div className="w-3 shrink-0">:</div>
              <div className="flex-1">
                <span className="inline-block border border-black px-3 py-0.5 font-bold bg-slate-100 mr-2">
                  Rp {formatAngkaId(grandTotal)},-
                </span>
                <span className="italic font-semibold">({angkaTerbilang(grandTotal)})</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-36 font-semibold shrink-0">Untuk Pembayaran</div>
              <div className="w-3 shrink-0">:</div>
              <div className="flex-1 text-justify">{form.untuk_pembayaran}</div>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-[12px] text-black mb-4">
            <thead>
              <tr data-pdf-block="true" className="bg-slate-100 font-bold text-center">
                <th className="border border-black px-1.5 py-1.5 w-8">No</th>
                <th className="border border-black px-2 py-1.5 text-left">Nama / NIP</th>
                <th className="border border-black px-2 py-1.5 text-left">Jabatan</th>
                <th className="border border-black px-1.5 py-1.5 w-12">Hari</th>
                <th className="border border-black px-2 py-1.5 text-right">Uang Harian</th>
                <th className="border border-black px-2 py-1.5 text-right">Transport</th>
                <th className="border border-black px-2 py-1.5 text-right">Jumlah (Rp)</th>
                <th className="border border-black px-2 py-1.5 w-28">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody>
              {personelList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-black p-4 text-center italic">
                    Belum ada penerima ditambahkan.
                  </td>
                </tr>
              ) : (
                personelList.map((p, idx) => {
                  const total = Number(p.total_biaya || Number(p.uang_harian || 0) * Number(p.jumlah_hari || 1) + Number(p.transport || 0))
                  return (
                    <tr key={p.id || idx} data-pdf-block="true">
                      <td className="border border-black px-1.5 py-2 text-center">{idx + 1}.</td>
                      <td className="border border-black px-2 py-2">
                        <div className="font-bold">{p.nama}</div>
                        <div>{p.nip || '-'}</div>
                      </td>
                      <td className="border border-black px-2 py-2">{p.jabatan || '-'}</td>
                      <td className="border border-black px-1.5 py-2 text-center">{p.jumlah_hari || 1}</td>
                      <td className="border border-black px-2 py-2 text-right">{formatAngkaId(p.uang_harian || 0)}</td>
                      <td className="border border-black px-2 py-2 text-right">{formatAngkaId(p.transport || 0)}</td>
                      <td className="border border-black px-2 py-2 text-right font-bold">{formatAngkaId(total)}</td>
                      <td className="border border-black px-2 py-2">
                        {idx % 2 === 0 ? `${idx + 1}. .............` : `\u00A0\u00A0\u00A0\u00A0\u00A0${idx + 1}. .............`}
                      </td>
                    </tr>
                  )
                })
              )}
              <tr data-pdf-block="true" className="bg-slate-100 font-bold">
                <td colSpan={6} className="border border-black px-2 py-2 text-right uppercase">Total Dibayarkan</td>
                <td className="border border-black px-2 py-2 text-right">{formatAngkaId(grandTotal)}</td>
                <td className="border border-black">&nbsp;</td>
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
