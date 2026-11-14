import { DocumentBuilderShell } from '../../../document-builder/DocumentBuilderShell'
import { CatLaporanTemplate } from '../../../document-builder/templates/CatLaporanTemplate'

/**
 * Adapter wrapper untuk Laporan Pelaksanaan Kegiatan CAT.
 * Menggunakan base construct global DocumentBuilderShell dengan template CatLaporanTemplate.
 */
export function CatLaporanDocumentView(props) {
  return (
    <DocumentBuilderShell
      documentDomain="cat"
      publicEsignBaseUrl="/layanan/fasilitasi-cat/laporan/esign"
      renderTemplate={(templateProps) => <CatLaporanTemplate {...templateProps} />}
      {...props}
    />
  )
}
