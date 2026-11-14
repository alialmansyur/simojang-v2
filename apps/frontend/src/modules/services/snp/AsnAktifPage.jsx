import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'

export default function AsnAktifPage() {
  return (
    <ServiceLayoutShell
      layananId={8}
      serviceTitle="Pengaktifan Kembali sebagai ASN"
      shortTitle="Pengaktifan ASN"
      docType="Pengaktifan kembali sebagai ASN"
      sampleFile="/templates/general/template-general.xlsx"
      sampleFileName="template-pengaktifan-asn.xlsx"
      description="Pengelolaan dan verifikasi berkas usul pengaktifan kembali serta pemulihan status kepegawaian ASN wilayah kerja Kantor Regional III BKN Bandung."
      timKerjaTitle="Status & Pemberhentian"
      timKerjaPath="/tim-kerja/snp"
      borderless
    />
  )
}
