import { useState, useEffect, useCallback } from 'react'
import { ServiceLayoutShell } from '../../../components/shared/services/ServiceLayoutShell'
import { TapnipEventModal } from '../../../components/shared/services/pnm/TapnipEventModal'
import { fetchTapnipEvents } from '../../../services/api/modularServicesApi'

const DEFAULT_CATEGORIES = [
  { value: '2025 - Penetapan NIP CPNS', label: 'NIP CPNS' },
  { value: '2025 - Penetapan NI PPPK Tahap I', label: 'PPPK Tahap I' },
  { value: '2025 - Penetapan NI PPPK Tahap II', label: 'PPPK Tahap II' },
  { value: '2025 - Penetapan NI PPPK Paruh Waktu', label: 'PPPK Paruh Waktu' },
  { value: '2025 - Sekolah Kedinasan IPDN', label: 'IPDN (2025)' },
  { value: '2026 - Penetapan NI Sekolah Kedinasan IPDN', label: 'IPDN (2026)' },
]

const extractBaseShortLabel = (fullName) => {
  if (!fullName) return ''
  let s = String(fullName).trim()
  s = s.replace(/^[0-9]{4}\s*[-–]\s*/, '')
  s = s.replace(/Penetapan NIP\s+/i, 'NIP ')
  s = s.replace(/Penetapan NI\s+/i, '')
  s = s.replace(/Sekolah Kedinasan\s+/i, '')
  return s.trim() || fullName
}

const buildUniqueCategories = (events = []) => {
  const rawItems = events.map((ev) => {
    const nama = String(ev?.nama || '').trim()
    const yearMatch = nama.match(/^([0-9]{4})\s*[-–]/)
    const year = yearMatch ? yearMatch[1] : ''
    const baseLabel = extractBaseShortLabel(nama)
    return { value: nama, baseLabel, year }
  })

  const labelCounts = {}
  rawItems.forEach((item) => {
    const key = item.baseLabel.toLowerCase()
    labelCounts[key] = (labelCounts[key] || 0) + 1
  })

  return rawItems.map((item) => {
    const isDuplicate = labelCounts[item.baseLabel.toLowerCase()] > 1
    const label =
      isDuplicate && item.year && !item.baseLabel.includes(item.year)
        ? `${item.baseLabel} (${item.year})`
        : item.baseLabel
    return {
      value: item.value,
      label,
    }
  })
}

export default function TapnipPage() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)

  const loadCategories = useCallback(async () => {
    try {
      const serverEvents = await fetchTapnipEvents()
      if (Array.isArray(serverEvents) && serverEvents.length > 0) {
        setCategories(buildUniqueCategories(serverEvents))
      }
    } catch (err) {
      console.warn('Using default tapnip categories:', err)
    }
  }, [])

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) loadCategories()
    })
    return () => {
      active = false
    }
  }, [loadCategories])

  return (
    <>
      <ServiceLayoutShell
        layananId={2}
        serviceTitle="Penetapan NIP CPNS / NI PPPK"
        shortTitle="Penetapan NIP"
        docType="Penetapan NIP"
        categories={categories}
        defaultCategory={categories[0]?.value || '2025 - Penetapan NIP CPNS'}
        sampleFile="/templates/pnm/template-tapnip.xlsx"
        sampleFileName="template-penetapan-nip.xlsx"
        description="Pengelolaan dan monitoring penetapan Nomor Induk Pegawai (NIP CPNS / NI PPPK) wilayah kerja Kantor Regional III BKN Bandung."
        timKerjaTitle="Pengangkatan & Mutasi"
        timKerjaPath="/tim-kerja/pnm"
        onManageEventsClick={() => setIsEventModalOpen(true)}
        borderless
      />

      <TapnipEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onEventsUpdated={loadCategories}
      />
    </>
  )
}
