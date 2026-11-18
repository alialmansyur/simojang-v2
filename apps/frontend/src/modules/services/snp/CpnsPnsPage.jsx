import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'

export default function CpnsPnsPage() {
  return (
    <ServiceLayoutShell
      layananId={9}
      serviceTitle="Pengangkatan CPNS Menjadi PNS (> 1 Tahun)"
      shortTitle="CPNS ke PNS"
      docType="Pengangkatan CPNS menjadi PNS yang melebihi ketentuan"
      sampleFile="/templates/snp/template-cpns-ke-pns.xlsx"
      sampleFileName="template-cpns-ke-pns.xlsx"
      description="Pengelolaan dan verifikasi berkas usul pengangkatan CPNS menjadi PNS yang melebihi masa percobaan ketentuan wilayah kerja Kantor Regional III BKN Bandung."
      timKerjaTitle="Status & Pemberhentian"
      timKerjaPath="/tim-kerja/snp"
      borderless
    />
  )
}
