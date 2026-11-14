import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'

export default function PindahInstansiPage() {
  return (
    <ServiceLayoutShell
      layananId={3}
      serviceTitle="Pindah Instansi"
      shortTitle="Pindah Instansi"
      docType="Pindah Instansi"
      sampleFile="/templates/general/template-general.xlsx"
      sampleFileName="template-pindah-instansi.xlsx"
      description="Pengelolaan dan verifikasi berkas usul mutasi kepegawaian antar-instansi pemerintah wilayah kerja Kantor Regional III BKN Bandung."
      timKerjaTitle="Pengangkatan & Mutasi"
      timKerjaPath="/tim-kerja/pnm"
      borderless
    />
  )
}
