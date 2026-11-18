import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'

export default function CltnPage() {
  const categories = [
    { value: 'Pengajuan CLTN', label: 'Pengajuan' },
    { value: 'Perpanjangan CLTN', label: 'Perpanjangan' },
    { value: 'Pengaktifan dari CLTN', label: 'Pengaktifan Kembali' },
  ]

  return (
    <ServiceLayoutShell
      layananId={7}
      serviceTitle="Cuti di Luar Tanggungan Negara (CLTN)"
      shortTitle="CLTN"
      docType="Cuti Diluar Tanggungan Negara"
      categories={categories}
      defaultCategory="Pengajuan CLTN"
      sampleFile="/templates/snp/template-cltn.xlsx"
      sampleFileName="template-cltn.xlsx"
      description="Pengelolaan dan verifikasi berkas pengajuan, perpanjangan, serta pengaktifan kembali dari Cuti di Luar Tanggungan Negara (CLTN)."
      timKerjaTitle="Status & Pemberhentian"
      timKerjaPath="/tim-kerja/snp"
      borderless
    />
  )
}
