import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'

export default function PmkPage() {
  return (
    <ServiceLayoutShell
      layananId={5}
      serviceTitle="Peninjauan Masa Kerja"
      shortTitle="Peninjauan Masa Kerja"
      docType="Peninjauan Masa Kerja"
      sampleFile="/templates/general/template-general.xlsx"
      sampleFileName="template-peninjauan-masa-kerja.xlsx"
      description="Pengelolaan dan verifikasi berkas usul peninjauan masa kerja (PMK) ASN wilayah kerja Kantor Regional III BKN Bandung."
      timKerjaTitle="Pengangkatan & Mutasi"
      timKerjaPath="/tim-kerja/pnm"
      borderless
    />
  )
}
