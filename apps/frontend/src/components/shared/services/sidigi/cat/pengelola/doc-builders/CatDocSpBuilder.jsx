import { useState } from 'react'
import {
  formatAngkaId,
  formatTanggalPanjangId,
  PDF_ARIAL_PAGE_STYLE,
  CAT_FORM_LABEL_CLS,
  CAT_FORM_INPUT_CLS,
  CAT_FORM_TEXTAREA_CLS,
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

export function CatDocSpBuilder({ doc, onDocUpdated }) {
  const [form, setForm] = useState(() =>
    extractInitialDocForm(doc, {
      kop_variant: 'bkn_pusat',
      menimbang:
        'Bahwa dalam rangka kelancaran pelaksanaan Seleksi Computer Assisted Test (CAT) BKN, dipandang perlu menugaskan tim pelaksana pada Kantor Regional III BKN.',
      dasar_list:
        '1. Peraturan Pemerintah Nomor 2 Tahun 2024 tentang Jenis dan Tarif atas Jenis Penerimaan Negara Bukan Pajak yang Berlaku pada BKN;\n2. Surat Tugas Kepala Kantor Regional III BKN Bandung;\n3. Daftar Isian Pelaksanaan Anggaran (DIPA) Kantor Regional III BKN Tahun Anggaran berjalan.',
      untuk_tugas:
        'Melaksanakan tugas fasilitasi dan pengawasan ujian seleksi dengan metode Computer Assisted Test (CAT BKN) sesuai jadwal pelaksanaan dan titik lokasi yang telah ditetapkan.',
      mak: '2664.PBA.004.051.A.522151',
      tempat_pelaksanaan: doc?.nama_tilok || 'Kantor Regional III BKN Bandung',
      peserta_instansi_rows:
        Array.isArray(doc?.instansi_list) && doc.instansi_list.length > 0
          ? doc.instansi_list.map((x) => ({ instansi: x.nama, jumlah_peserta: '' }))
          : [{ instansi: '', jumlah_peserta: '' }],
      tembusan: '1. Kepala Badan Kepegawaian Negara;\n2. Sekretaris Utama BKN;\n3. Arsip.',
    })
  )

  const [signers, setSigners] = useState(() =>
    normalizeSignersFromDoc(doc, {
      kanan: { sign_role: 'kakanreg', sign_title: 'Dikeluarkan di Bandung', jabatan: 'Kepala Kantor Regional III BKN' },
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
        doc_type: 'sp',
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
          menimbang: form.menimbang,
          dasar_list: form.dasar_list,
          untuk_tugas: form.untuk_tugas,
          tempat_pelaksanaan: form.tempat_pelaksanaan,
          peserta_instansi_rows: form.peserta_instansi_rows,
          tembusan: form.tembusan,
        },
      })
      if (res?.data && onDocUpdated) onDocUpdated(res.data)
      setSavedNotice(true)
      setTimeout(() => setSavedNotice(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const pesertaRows = Array.isArray(form.peserta_instansi_rows) ? form.peserta_instansi_rows : []
  const updatePesertaRow = (idx, field, val) => {
    const next = [...pesertaRows]
    next[idx] = { ...next[idx], [field]: val }
    setForm((p) => ({ ...p, peserta_instansi_rows: next }))
  }

  const personelList = Array.isArray(doc?.personel) ? doc.personel : []

  return (
    <CatDocBuilderShell
      doc={doc}
      docTypeLabel="Surat Perintah (SP)"
      saving={saving}
      savedNotice={savedNotice}
      onSave={handleSave}
      signers={signers}
      fileName={`SP_${(form.doc_number || doc.uid).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`}
      childrenParams={
        <div className="space-y-7">
          <CatDocCommonMetaEditor
            form={form}
            setForm={setForm}
            childrenExtra={
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>
                  Kode Pembebanan (MAK)
                </label>
                <input
                  type="text"
                  value={form.mak || ''}
                  onChange={(e) => setForm((p) => ({ ...p, mak: e.target.value }))}
                  className={`${CAT_FORM_INPUT_CLS} font-mono`}
                />
              </div>
            }
          />

          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              C. Konten Surat Perintah &amp; Rincian Peserta
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>Menimbang</label>
                <textarea
                  rows={3}
                  value={form.menimbang || ''}
                  onChange={(e) => setForm((p) => ({ ...p, menimbang: e.target.value }))}
                  className={CAT_FORM_TEXTAREA_CLS}
                />
              </div>
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>Dasar Hukum / Surat (1 baris 1 poin)</label>
                <textarea
                  rows={4}
                  value={form.dasar_list || ''}
                  onChange={(e) => setForm((p) => ({ ...p, dasar_list: e.target.value }))}
                  className={CAT_FORM_TEXTAREA_CLS}
                />
              </div>
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>Untuk / Uraian Tugas</label>
                <textarea
                  rows={3}
                  value={form.untuk_tugas || ''}
                  onChange={(e) => setForm((p) => ({ ...p, untuk_tugas: e.target.value }))}
                  className={CAT_FORM_TEXTAREA_CLS}
                />
              </div>
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>Tembusan (1 baris 1 pihak)</label>
                <textarea
                  rows={3}
                  value={form.tembusan || ''}
                  onChange={(e) => setForm((p) => ({ ...p, tembusan: e.target.value }))}
                  className={CAT_FORM_TEXTAREA_CLS}
                />
              </div>
            </div>

            {/* Tabel Rincian Instansi & Jumlah Peserta pada SP */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <span className={CAT_FORM_LABEL_CLS}>
                  Tabel Instansi &amp; Jumlah Peserta pada SP
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      peserta_instansi_rows: [...pesertaRows, { instansi: '', jumlah_peserta: '' }],
                    }))
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                >
                  + Tambah Baris Instansi
                </button>
              </div>
              {pesertaRows.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nama Instansi"
                    value={r.instansi || ''}
                    onChange={(e) => updatePesertaRow(i, 'instansi', e.target.value)}
                    className={`flex-1 ${CAT_FORM_INPUT_CLS}`}
                  />
                  <input
                    type="text"
                    placeholder="Jml Peserta"
                    value={r.jumlah_peserta || ''}
                    onChange={(e) => updatePesertaRow(i, 'jumlah_peserta', e.target.value)}
                    className={`w-40 ${CAT_FORM_INPUT_CLS}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        peserta_instansi_rows: pesertaRows.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="h-[38px] px-3 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <CatDocPersonelTableSection
              doc={doc}
              onDocUpdated={onDocUpdated}
              title="D. Lampiran: Daftar Tim Panitia Pelaksana (Drag & Drop Urutan)"
              showHonorFields
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
              sectionLetter="E"
            />
          </div>
        </div>
      }
      renderPreviewTemplate={() => (
        <div className="space-y-6">
          {/* HALAMAN 1: SURAT PERINTAH */}
          <div
            className="document-a4-page mx-auto bg-white text-black shadow-lg"
            style={{ width: '794px', minHeight: '1123px', padding: '36px 52px', ...PDF_ARIAL_PAGE_STYLE }}
          >
            <CatDocKopSurat />

            <div data-pdf-block="true" className="text-center mb-4">
              <div className="text-[12px] font-bold uppercase tracking-wide underline">SURAT PERINTAH</div>
              <div className="text-[12px] font-semibold mt-0.5">Nomor : {form.doc_number || '......................................'}</div>
            </div>

            <div className="text-[12px] leading-relaxed space-y-2.5 text-black">
              <div data-pdf-block="true" className="flex gap-3">
                <div className="w-24 font-bold shrink-0">Menimbang</div>
                <div className="w-3 shrink-0">:</div>
                <div className="flex-1 text-justify">{form.menimbang}</div>
              </div>

              <div data-pdf-block="true" className="flex gap-3">
                <div className="w-24 font-bold shrink-0">Dasar</div>
                <div className="w-3 shrink-0">:</div>
                <div className="flex-1 whitespace-pre-line text-justify">{form.dasar_list}</div>
              </div>

              <div data-pdf-block="true" className="text-center font-bold uppercase tracking-wider pt-2">
                MEMERINTAHKAN :
              </div>

              <div data-pdf-block="true" className="flex gap-3">
                <div className="w-24 font-bold shrink-0">Kepada</div>
                <div className="w-3 shrink-0">:</div>
                <div className="flex-1">Daftar Tim Panitia Pelaksana Seleksi CAT (Terlampir).</div>
              </div>

              <div data-pdf-block="true" className="flex gap-3">
                <div className="w-24 font-bold shrink-0">Untuk</div>
                <div className="w-3 shrink-0">:</div>
                <div className="flex-1 space-y-2 text-justify">
                  <p>{form.untuk_tugas}</p>
                  {pesertaRows.some((r) => r.instansi) && (
                    <table className="w-full border-collapse border border-black text-[12px] text-black mt-1">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-black px-2 py-1 w-10 text-center">No</th>
                          <th className="border border-black px-2 py-1 text-left">Instansi Peserta</th>
                          <th className="border border-black px-2 py-1 w-32 text-center">Jumlah Peserta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pesertaRows.map((pr, idx) => (
                          <tr key={idx}>
                            <td className="border border-black px-2 py-1 text-center">{idx + 1}.</td>
                            <td className="border border-black px-2 py-1">{pr.instansi || '-'}</td>
                            <td className="border border-black px-2 py-1 text-center">{pr.jumlah_peserta || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <p>
                    Segala biaya yang timbul akibat pelaksanaan Surat Perintah ini dibebankan pada DIPA dengan MAK{' '}
                    <strong>{form.mak || '-'}</strong>.
                  </p>
                </div>
              </div>
            </div>

            <CatDocSignaturePrintBlock
              signers={signers}
              kotaTtd={form.kota_ttd}
              tanggalTtd={form.doc_date}
            />

            {form.tembusan && (
              <div data-pdf-block="true" className="mt-6 pt-2 text-[12px] text-black leading-snug">
                <div className="font-bold underline">Tembusan:</div>
                <div className="whitespace-pre-line">{form.tembusan}</div>
              </div>
            )}
          </div>

          {/* HALAMAN 2: LAMPIRAN TIM PANITIA */}
          <div
            className="document-a4-page mx-auto bg-white text-black shadow-lg"
            style={{ width: '794px', minHeight: '1123px', padding: '36px 46px', ...PDF_ARIAL_PAGE_STYLE }}
          >
            <div data-pdf-block="true" className="text-[12px] mb-3 space-y-0.5 text-black">
              <div className="font-bold">LAMPIRAN SURAT PERINTAH</div>
              <div>Nomor : {form.doc_number || '......................................'}</div>
              <div>Tanggal : {form.doc_date ? formatTanggalPanjangId(form.doc_date) : '-'}</div>
            </div>

            <div data-pdf-block="true" className="text-center font-bold text-[12px] uppercase mb-3 text-black">
              DAFTAR TIM PANITIA PELAKSANA SELEKSI {doc?.nama_seleksi || 'CAT BKN'}
            </div>

            <table className="w-full border-collapse border border-black text-[12px] text-black">
              <thead>
                <tr data-pdf-block="true" className="bg-slate-100 font-bold text-center">
                  <th className="border border-black px-1.5 py-1.5 w-8">No</th>
                  <th className="border border-black px-2 py-1.5 text-left">Nama / NIP</th>
                  <th className="border border-black px-1.5 py-1.5">Gol</th>
                  <th className="border border-black px-2 py-1.5 text-left">Unit Kerja</th>
                  <th className="border border-black px-2 py-1.5 text-left">Jabatan / Tugas</th>
                  <th className="border border-black px-2 py-1.5 text-right w-28">Honor Kegiatan (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {personelList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-black p-4 text-center italic">
                      Belum ada daftar tim pada dokumen ini.
                    </td>
                  </tr>
                ) : (
                  personelList.map((p, idx) => {
                    const biaya = Number(p.total_biaya || Number(p.uang_harian || 0) * Number(p.jumlah_hari || 1) + Number(p.transport || 0))
                    return (
                      <tr key={p.id || idx} data-pdf-block="true">
                        <td className="border border-black px-1.5 py-1.5 text-center">{idx + 1}.</td>
                        <td className="border border-black px-2 py-1.5">
                          <div className="font-bold">{p.nama}</div>
                          <div>NIP. {p.nip || '-'}</div>
                        </td>
                        <td className="border border-black px-1.5 py-1.5 text-center">{p.pangkat_gol || '-'}</td>
                        <td className="border border-black px-2 py-1.5">{p.instansi_asal || 'Kanreg III BKN'}</td>
                        <td className="border border-black px-2 py-1.5">
                          <div>{p.jabatan || '-'}</div>
                          {p.peran && <div className="font-semibold">({p.peran})</div>}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-right">{formatAngkaId(biaya)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            <CatDocSignaturePrintBlock
              signers={signers}
              kotaTtd={form.kota_ttd}
              tanggalTtd={form.doc_date}
            />
          </div>
        </div>
      )}
    />
  )
}
