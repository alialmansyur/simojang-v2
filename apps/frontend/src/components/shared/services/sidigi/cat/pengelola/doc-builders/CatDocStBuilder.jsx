import { useState } from 'react'
import {
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

export function CatDocStBuilder({ doc, onDocUpdated }) {
  const [form, setForm] = useState(() =>
    extractInitialDocForm(doc, {
      kop_variant: 'kanreg_3',
      menimbang:
        'Bahwa sehubungan dengan pelaksanaan kegiatan fasilitasi Seleksi Metode Computer Assisted Test (CAT) BKN di lingkungan kerja Kantor Regional III BKN, dipandang perlu menugaskan pejabat dan pegawai untuk kelancaran pelaksanaan dimaksud.',
      dasar_list:
        '1. Peraturan Pemerintah Nomor 2 Tahun 2024 tentang Jenis dan Tarif atas Jenis PNBP yang Berlaku pada BKN;\n2. Peraturan BKN tentang Tata Cara Penyelenggaraan Seleksi dengan Metode CAT;\n3. Surat Permohonan Fasilitasi CAT Instansi Terkait.',
      untuk_list:
        '1. Melaksanakan tugas sebagai Tim Pelaksana Fasilitasi CAT pada titik lokasi ujian yang telah ditentukan;\n2. Memastikan kesiapan sarana prasarana, aplikasi CAT, dan ketertiban peserta selama ujian;\n3. Berkoordinasi dengan Panitia Seleksi Instansi terkait selama pelaksanaan kegiatan;\n4. Melaporkan hasil pelaksanaan tugas kepada Kepala Kantor Regional III BKN.',
      tempat_pelaksanaan: doc?.nama_tilok || 'Kantor Regional III BKN Bandung',
      tembusan: '1. Kepala Badan Kepegawaian Negara;\n2. Arsip.',
    })
  )

  const [signers, setSigners] = useState(() =>
    normalizeSignersFromDoc(doc, {
      kanan: { sign_role: 'kakanreg', sign_title: 'Ditetapkan di Bandung', jabatan: 'Kepala Kantor Regional III BKN' },
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
        doc_type: 'st',
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
          menimbang: form.menimbang,
          dasar_list: form.dasar_list,
          untuk_list: form.untuk_list,
          tempat_pelaksanaan: form.tempat_pelaksanaan,
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

  const personelList = Array.isArray(doc?.personel) ? doc.personel : []
  const instansiLabel = form.instansi_names?.length ? form.instansi_names.join(', ') : doc?.instansi_nama || '-'

  return (
    <CatDocBuilderShell
      doc={doc}
      docTypeLabel="Surat Tugas (ST)"
      saving={saving}
      savedNotice={savedNotice}
      onSave={handleSave}
      signers={signers}
      fileName={`ST_${(form.doc_number || doc.uid).replace(/[/\\?%*:|"<>]/g, '_')}.pdf`}
      childrenParams={
        <div className="space-y-7">
          <CatDocCommonMetaEditor
            form={form}
            setForm={setForm}
            childrenExtra={
              <div className="space-y-1.5 sm:col-span-2">
                <label className={CAT_FORM_LABEL_CLS}>
                  Lokasi Penugasan / Tilok
                </label>
                <input
                  type="text"
                  value={form.tempat_pelaksanaan || ''}
                  onChange={(e) => setForm((p) => ({ ...p, tempat_pelaksanaan: e.target.value }))}
                  className={CAT_FORM_INPUT_CLS}
                />
              </div>
            }
          />

          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              C. Konten Surat Tugas
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
                <label className={CAT_FORM_LABEL_CLS}>Dasar (1 baris 1 poin)</label>
                <textarea
                  rows={4}
                  value={form.dasar_list || ''}
                  onChange={(e) => setForm((p) => ({ ...p, dasar_list: e.target.value }))}
                  className={CAT_FORM_TEXTAREA_CLS}
                />
              </div>
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>Untuk (Poin 1–4)</label>
                <textarea
                  rows={4}
                  value={form.untuk_list || ''}
                  onChange={(e) => setForm((p) => ({ ...p, untuk_list: e.target.value }))}
                  className={CAT_FORM_TEXTAREA_CLS}
                />
              </div>
              <div className="space-y-1.5">
                <label className={CAT_FORM_LABEL_CLS}>Tembusan</label>
                <textarea
                  rows={4}
                  value={form.tembusan || ''}
                  onChange={(e) => setForm((p) => ({ ...p, tembusan: e.target.value }))}
                  className={CAT_FORM_TEXTAREA_CLS}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <CatDocPersonelTableSection
              doc={doc}
              onDocUpdated={onDocUpdated}
              title="D. Lampiran: Daftar Pejabat / Pegawai Yang Ditugaskan"
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
          {/* HALAMAN 1: SURAT TUGAS */}
          <div
            className="document-a4-page mx-auto bg-white text-black shadow-lg"
            style={{ width: '794px', minHeight: '1123px', padding: '36px 52px', ...PDF_ARIAL_PAGE_STYLE }}
          >
            <CatDocKopSurat />

            <div data-pdf-block="true" className="text-center mb-4">
              <div className="text-[12px] font-bold uppercase tracking-wide underline">SURAT TUGAS</div>
              <div className="text-[12px] font-semibold mt-0.5">Nomor : {form.doc_number || '......................................'}</div>
            </div>

            <div className="text-[12px] leading-relaxed space-y-3 text-black">
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
                MEMBERI TUGAS :
              </div>

              <div data-pdf-block="true" className="flex gap-3">
                <div className="w-24 font-bold shrink-0">Kepada</div>
                <div className="w-3 shrink-0">:</div>
                <div className="flex-1">Daftar Pejabat dan Pegawai sebagaimana terlampir pada Surat Tugas ini.</div>
              </div>

              <div data-pdf-block="true" className="flex gap-3">
                <div className="w-24 font-bold shrink-0">Untuk</div>
                <div className="w-3 shrink-0">:</div>
                <div className="flex-1 space-y-1.5 text-justify">
                  <div className="whitespace-pre-line">{form.untuk_list}</div>
                  <div className="pt-1 text-[12px]">
                    <div><strong>Instansi:</strong> {instansiLabel}</div>
                    <div><strong>Lokasi:</strong> {form.tempat_pelaksanaan || '-'}</div>
                  </div>
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

          {/* HALAMAN 2: LAMPIRAN DAFTAR PEGAWAI */}
          <div
            className="document-a4-page mx-auto bg-white text-black shadow-lg"
            style={{ width: '794px', minHeight: '1123px', padding: '36px 48px', ...PDF_ARIAL_PAGE_STYLE }}
          >
            <div data-pdf-block="true" className="text-[12px] mb-3 space-y-0.5 text-black">
              <div className="font-bold">LAMPIRAN SURAT TUGAS</div>
              <div>Nomor : {form.doc_number || '......................................'}</div>
              <div>Tanggal : {form.doc_date ? formatTanggalPanjangId(form.doc_date) : '-'}</div>
            </div>

            <div data-pdf-block="true" className="text-center font-bold text-[12px] uppercase mb-3 text-black">
              DAFTAR PEJABAT / PEGAWAI YANG DITUGASKAN
            </div>

            <table className="w-full border-collapse border border-black text-[12px] text-black">
              <thead>
                <tr data-pdf-block="true" className="bg-slate-100 font-bold text-center">
                  <th className="border border-black px-2 py-1.5 w-10">No</th>
                  <th className="border border-black px-2 py-1.5 text-left">Nama / NIP</th>
                  <th className="border border-black px-2 py-1.5 w-24">Golongan</th>
                  <th className="border border-black px-2 py-1.5 text-left">Jabatan</th>
                  <th className="border border-black px-2 py-1.5 text-left w-36">Peran Dalam Tim</th>
                </tr>
              </thead>
              <tbody>
                {personelList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-black p-4 text-center italic">
                      Belum ada daftar pegawai pada surat tugas ini.
                    </td>
                  </tr>
                ) : (
                  personelList.map((p, idx) => (
                    <tr key={p.id || idx} data-pdf-block="true">
                      <td className="border border-black px-2 py-1.5 text-center">{idx + 1}.</td>
                      <td className="border border-black px-2 py-1.5">
                        <div className="font-bold">{p.nama}</div>
                        <div>NIP. {p.nip || '-'}</div>
                        {Number(p.is_external) === 1 && p.instansi_asal && (
                          <div className="italic">({p.instansi_asal})</div>
                        )}
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center">{p.pangkat_gol || '-'}</td>
                      <td className="border border-black px-2 py-1.5">{p.jabatan || '-'}</td>
                      <td className="border border-black px-2 py-1.5 font-semibold">{p.peran || 'Anggota Tim'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <CatDocSignaturePrintBlock
              signers={signers}
              kotaTtd={form.kota_ttd}
              tanggalTtd={form.doc_date}
              compact
            />
          </div>
        </div>
      )}
    />
  )
}
