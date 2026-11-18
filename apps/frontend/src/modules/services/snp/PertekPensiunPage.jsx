import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'

export default function PertekPensiunPage() {
  return (
    <ServiceLayoutShell
      layananId={10}
      serviceTitle="Pertimbangan Teknis Pensiun PNS & Janda/Duda"
      shortTitle="Pertek Pensiun"
      docType="Penetapan Pertek Pensiun PNS dan Janda / Dudanya"
      sampleFile="/templates/snp/template-pertek-pensiun.xlsx"
      sampleFileName="template-pertek-pensiun.xlsx"
      description="Pengelolaan dan verifikasi berkas penetapan Pertimbangan Teknis (Pertek) pensiun PNS dan janda/dudanya wilayah kerja Kantor Regional III BKN Bandung."
      timKerjaTitle="Status & Pemberhentian"
      timKerjaPath="/tim-kerja/snp"
      borderless
    />
  )
}
