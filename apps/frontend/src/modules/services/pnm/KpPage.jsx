import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'

export default function KpPage() {
  return (
    <ServiceLayoutShell
      layananId={6}
      serviceTitle="Kenaikan Pangkat"
      shortTitle="Kenaikan Pangkat"
      docType="Kenaikan Pangkat"
      sampleFile="/templates/pnm/template-kp.xlsx"
      sampleFileName="template-kenaikan-pangkat.xlsx"
      description="Pengelolaan dan verifikasi berkas usul kenaikan pangkat ASN wilayah kerja Kantor Regional III BKN Bandung."
      timKerjaTitle="Pengangkatan & Mutasi"
      timKerjaPath="/tim-kerja/pnm"
      borderless
    />
  )
}
