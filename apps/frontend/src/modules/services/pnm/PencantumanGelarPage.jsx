import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'

export default function PencantumanGelarPage() {
  return (
    <ServiceLayoutShell
      layananId={4}
      serviceTitle="Pencantuman Gelar"
      shortTitle="Pencantuman Gelar"
      docType="Pencantuman Gelar"
      sampleFile="/templates/pnm/template-rekapitulasi-pencantuman-gelar.xlsx"
      sampleFileName="template-rekapitulasi-pencantuman-gelar.xlsx"
      description="Pengelolaan dan verifikasi berkas usul peningkatan pendidikan serta pencantuman gelar akademik ASN wilayah kerja Kantor Regional III BKN Bandung."
      timKerjaTitle="Pengangkatan & Mutasi"
      timKerjaPath="/tim-kerja/pnm"
      borderless
    />
  )
}
