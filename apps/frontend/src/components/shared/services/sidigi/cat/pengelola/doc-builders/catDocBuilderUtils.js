export function normalizeSignersFromDoc(doc, defaultPresets = {}) {
  const sigRows = Array.isArray(doc?.signatures) ? doc.signatures : []
  const metaCfg = Array.isArray(doc?.meta_data?.signatures_config)
    ? doc.meta_data.signatures_config
    : []

  const buildSlot = (posKey, dbPos, preset = {}) => {
    const dbRow = sigRows.find((r) => r.sign_position === dbPos)
    const metaRow = metaCfg.find((r) => r.sign_position === dbPos)
    const src = dbRow || metaRow || null

    if (!src) {
      return {
        sign_position: dbPos,
        sign_role: preset.sign_role || dbPos,
        sign_title: preset.sign_title || '',
        jabatan: preset.jabatan || '',
        nama: preset.nama || '',
        nip: preset.nip || '',
        pangkat_gol: preset.pangkat_gol || '',
        signatureData: null,
        signatureHash: '',
        signedAt: '',
        isSigned: false,
        token: `cat_${doc?.uid || 'doc'}_${posKey}`,
      }
    }

    const sigImg = src.signature_image_path || src.signatureData || null
    const signed = src.sign_status === 'signed' || Boolean(src.isSigned) || Boolean(sigImg)
    return {
      sign_position: dbPos,
      sign_role: src.sign_role || preset.sign_role || dbPos,
      sign_title: src.sign_title ?? preset.sign_title ?? '',
      jabatan: src.jabatan || '',
      nama: src.nama && src.nama !== '-' ? src.nama : '',
      nip: src.nip || '',
      pangkat_gol: src.pangkat_gol || '',
      signatureData: sigImg,
      signatureHash: src.sign_token || src.signatureHash || '',
      signedAt: src.signed_at || src.signedAt || '',
      isSigned: signed,
      token: src.sign_token || src.token || `cat_${doc?.uid || 'doc'}_${posKey}`,
    }
  }

  return {
    kiri: buildSlot('kiri', 'left', defaultPresets.kiri),
    tengah: buildSlot('tengah', 'center', defaultPresets.tengah),
    kanan: buildSlot('kanan', 'right', defaultPresets.kanan),
  }
}

export function serializeSignersPayload(signers) {
  const mapPos = [
    ['kiri', 'left'],
    ['tengah', 'center'],
    ['kanan', 'right'],
  ]
  return mapPos.map(([k, dbPos]) => {
    const s = signers?.[k] || {}
    const filled = Boolean(
      (s.nama && s.nama.trim() !== '') ||
        (s.jabatan && s.jabatan.trim() !== '') ||
        s.isSigned
    )
    return {
      sign_position: dbPos,
      sign_role: s.sign_role || dbPos,
      sign_title: s.sign_title || '',
      nip: s.nip || '',
      nama: s.nama || '',
      pangkat_gol: s.pangkat_gol || '',
      jabatan: s.jabatan || '',
      sign_token: s.token || '',
      sign_status: s.isSigned ? 'signed' : 'pending',
      signature_image_path: s.signatureData || '',
      signed_at: s.signedAt || null,
      enabled: filled,
    }
  })
}

export function extractInitialDocForm(doc, metaDefaults = {}) {
  const meta = doc?.meta_data && typeof doc.meta_data === 'object' ? doc.meta_data : {}
  const list = Array.isArray(doc?.instansi_list) ? doc.instansi_list : []
  const metaIds = Array.isArray(meta.instansi_ids) ? meta.instansi_ids.map(String) : []
  const metaNames = Array.isArray(meta.instansi_names) ? meta.instansi_names.map(String) : []

  const instansiIds =
    metaIds.length > 0 ? metaIds : list.map((x) => String(x.id || x.nama || '')).filter(Boolean)
  const instansiNames =
    metaNames.length > 0 ? metaNames : list.map((x) => String(x.nama || x.id || '')).filter(Boolean)

  return {
    title: doc?.title || '',
    doc_number: doc?.doc_number || '',
    doc_date: doc?.doc_date || new Date().toISOString().split('T')[0],
    status: doc?.status || 'draft',
    kota_ttd: meta.kota_ttd || 'Bandung',
    instansi_ids: instansiIds,
    instansi_names: instansiNames,
    notes: meta.notes || '',
    mak: meta.mak || '',
    vendor_name: meta.vendor_name || '',
    vendor_npwp: meta.vendor_npwp || '',
    ...metaDefaults,
    ...meta,
  }
}
