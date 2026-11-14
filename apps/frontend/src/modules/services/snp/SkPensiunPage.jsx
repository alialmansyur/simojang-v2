import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'

export default function SkPensiunPage() {
  return (
    <ServiceLayoutShell
      layananId={11}
      serviceTitle="Penetapan SK Pensiun Janda/Duda Pensiunan PNS"
      shortTitle="SK Pensiun Janda/Duda"
      docType="Penetapan SK Pensiun Janda/Duda Pensiunan PNS"
      sampleFile="/templates/general/template-general.xlsx"
      sampleFileName="template-sk-pensiun-janda-duda.xlsx"
      description="Pengelolaan dan verifikasi berkas penetapan Surat Keputusan (SK) pensiun janda/duda pensiunan PNS wilayah kerja Kantor Regional III BKN Bandung."
      timKerjaTitle="Status & Pemberhentian"
      timKerjaPath="/tim-kerja/snp"
      borderless
    />
  )
}
