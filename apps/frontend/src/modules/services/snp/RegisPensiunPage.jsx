import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'

export default function RegisPensiunPage() {
  return (
    <ServiceLayoutShell
      layananId={12}
      serviceTitle="Pendaftaran Keluarga Pensiunan PNS Menikah Kembali"
      shortTitle="Registrasi Pensiun"
      docType="Pendaftaran Keluarga Bagi Pensiunan PNS yang Menikah Kembali"
      sampleFile="/templates/general/template-general.xlsx"
      sampleFileName="template-registrasi-keluarga-pensiun.xlsx"
      description="Pengelolaan dan verifikasi berkas pendaftaran keluarga bagi pensiunan PNS yang menikah kembali wilayah kerja Kantor Regional III BKN Bandung."
      timKerjaTitle="Status & Pemberhentian"
      timKerjaPath="/tim-kerja/snp"
      borderless
    />
  )
}
