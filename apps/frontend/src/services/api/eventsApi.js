/**
 * Events API Service for SIMOJANG Office Calendar
 * Single Source of Truth: https://kanreg3.id/simanja-api/public/dashboard/events
 */

import { parseFetchResponse } from '../api'

export const EVENTS_API_URL = 'https://kanreg3.id/simanja-api/public/dashboard/events'

/**
 * Compute dynamic event status based on current date & time:
 * - 'Sedang Berlangsung': jika event = hari ini dan mendekati / sedang dalam jam pelaksanaan
 * - 'Akan Datang': jika belum melewati jam dan tanggal pelaksanaan (masa depan)
 * - 'Selesai': jika sudah melewati jam dan tanggal pelaksanaan (masa lalu)
 */
export function getEventDynamicStatus(event, referenceDate = new Date()) {
  if (!event) {
    return {
      label: 'Akan Datang',
      key: 'upcoming',
      badgeClass: 'bg-[#FFFAEB] dark:bg-amber-950/40 border-[#FEDF89] dark:border-amber-800 text-[#B54708] dark:text-amber-400',
      dotClass: 'bg-[#B54708]',
    }
  }

  const nowTime = referenceDate.getTime()
  const todayStr = referenceDate.toLocaleDateString('en-CA') // Format 'YYYY-MM-DD'

  let startTime = 0
  let endTime = 0

  if (event.start) {
    startTime = new Date(event.start).getTime()
  } else if (event.start_date_raw) {
    const timePart = event.start_time_raw || '08:00:00'
    startTime = new Date(`${event.start_date_raw}T${timePart}`).getTime()
  }

  if (event.end) {
    endTime = new Date(event.end).getTime()
  } else if (event.end_date_raw) {
    const timePart = event.end_time_raw || '16:00:00'
    endTime = new Date(`${event.end_date_raw}T${timePart}`).getTime()
  } else if (startTime > 0) {
    endTime = startTime + 8 * 3600 * 1000 // default 8 jam jika tanpa end time
  }

  const startDateStr = event.start_date_raw || (event.start ? event.start.slice(0, 10) : '')
  const endDateStr = event.end_date_raw || (event.end ? event.end.slice(0, 10) : startDateStr)

  // 1. Jika sudah lewat waktu dan tanggalnya -> Selesai
  if (endTime > 0 && nowTime > endTime) {
    return {
      label: 'Selesai',
      key: 'finished',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400',
      dotClass: 'bg-slate-400',
    }
  }

  // 2. Jika hari ini & mendekati jam (window 1 jam sebelum mulai) atau sedang berlangsung di rentang tanggal/jam
  const approachWindow = 60 * 60 * 1000 // 1 jam sebelum mulai
  const isTimeApproachingOrActive = startTime > 0 && nowTime >= (startTime - approachWindow) && nowTime <= endTime
  const isDateRangeActive = startDateStr && endDateStr && todayStr >= startDateStr && todayStr <= endDateStr

  if (isTimeApproachingOrActive || (isDateRangeActive && nowTime <= endTime)) {
    return {
      label: 'Sedang Berlangsung',
      key: 'ongoing',
      badgeClass: 'bg-[#ECFDF3] dark:bg-emerald-950/40 border-[#A6F4C5] dark:border-emerald-800 text-[#067647] dark:text-emerald-400',
      dotClass: 'bg-[#067647]',
    }
  }

  // 3. Jika belum melewati tanggal dan jam -> Akan Datang
  return {
    label: 'Akan Datang',
    key: 'upcoming',
    badgeClass: 'bg-[#FFFAEB] dark:bg-amber-950/40 border-[#FEDF89] dark:border-amber-800 text-[#B54708] dark:text-amber-400',
    dotClass: 'bg-[#B54708]',
  }
}

/**
 * Normalizes raw event item from API
 */
export function normalizeEvent(item) {
  if (!item) return null

  const id = item.id ?? item.uuid ?? Math.random().toString(36).slice(2)
  const isOnline = Boolean(item.isOnline)
  const category = (item.category && item.category.trim()) ? item.category.trim() : 'Fasilitasi CAT'
  const status = (item.status && item.status.trim()) ? item.status.trim() : 'Publish'
  const location = (item.location && item.location.trim() && item.location !== '-') ? item.location.trim() : 'Kanreg III BKN Bandung'

  return {
    id: Number(id) || id,
    uuid: item.uuid ?? id,
    title: item.title || 'Agenda Tanpa Judul',
    description: item.description || '',
    category,
    status,
    location,
    date: item.date || '',
    time: item.time || '',
    start_date_raw: item.start_date_raw || '',
    start_time_raw: item.start_time_raw || '',
    end_date_raw: item.end_date_raw || '',
    end_time_raw: item.end_time_raw || '',
    start: item.start || (item.start_date_raw ? `${item.start_date_raw}T${item.start_time_raw || '08:00:00'}` : ''),
    end: item.end || (item.end_date_raw ? `${item.end_date_raw}T${item.end_time_raw || '16:00:00'}` : ''),
    type: item.type || '',
    isOnline,
    onlineUrl: item.onlineUrl || null,
    onlineMeetingId: item.onlineMeetingId || null,
    stNumber: item.stNumber && item.stNumber !== '-' ? item.stNumber : null,
    ref_instansi_id: item.ref_instansi_id || null,
    instansi: item.instansi && item.instansi !== '-' ? item.instansi : null,
    isAllEmployees: Boolean(item.isAllEmployees),
    team: item.team && item.team !== '-' ? item.team : null,
    participants: Array.isArray(item.participants) ? item.participants : [],
    gCalStart: item.gCalStart || '',
    gCalEnd: item.gCalEnd || '',
  }
}

/**
 * Sort events descending (latest start date / time first)
 */
export function sortEventsDesc(events) {
  if (!Array.isArray(events)) return []
  return [...events].sort((a, b) => {
    const timeA = a.start ? new Date(a.start).getTime() : 0
    const timeB = b.start ? new Date(b.start).getTime() : 0
    if (timeB !== timeA) return timeB - timeA
    return (b.id || 0) - (a.id || 0)
  })
}

/**
 * Fetch events directly from single source of truth (sorted DESC)
 */
export async function fetchDashboardEvents() {
  try {
    const res = await fetch(EVENTS_API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    const payload = await parseFetchResponse(res, {
      fallbackMessage: 'Gagal memuat jadwal acara.',
    })
    const rawList = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])

    const normalized = rawList.map(normalizeEvent).filter(Boolean)
    return sortEventsDesc(normalized)
  } catch (error) {
    console.error('Error fetching dashboard events:', error)
    throw error
  }
}

/**
 * Check if an event occurs on a specific date (YYYY-MM-DD)
 */
export function isEventOnDate(event, dateStr) {
  if (!event || !dateStr) return false

  const startDateStr = event.start_date_raw || (event.start ? event.start.slice(0, 10) : '')
  const endDateStr = event.end_date_raw || (event.end ? event.end.slice(0, 10) : startDateStr)

  if (!startDateStr) return false

  // If single day
  if (!endDateStr || endDateStr === startDateStr) {
    return startDateStr === dateStr
  }

  // If date range
  return dateStr >= startDateStr && dateStr <= endDateStr
}

/**
 * Filter events whose start date is on or before maxDateStr (YYYY-MM-DD).
 */
export function filterEventsUpToDate(events, maxDateStr) {
  if (!Array.isArray(events) || !maxDateStr) return []
  return sortEventsDesc(
    events.filter((e) => {
      const startDateStr = e.start_date_raw || (e.start ? e.start.slice(0, 10) : '')
      if (!startDateStr) return false
      return startDateStr <= maxDateStr
    }),
  )
}

/**
 * Filter events by selected date (sorted DESC)
 */
export function filterEventsByDate(events, dateStr) {
  if (!dateStr || dateStr === 'all') return sortEventsDesc(events)
  return sortEventsDesc(events.filter((e) => isEventOnDate(e, dateStr)))
}

/**
 * Find the most relevant featured event:
 * 1) Provided priority ID if valid
 * 2) Ongoing today event
 * 3) Earliest upcoming event from reference date
 * 4) First available event
 */
export function selectFeaturedEvent(events, priorityId = null, referenceDate = new Date()) {
  if (!Array.isArray(events) || events.length === 0) return null

  if (priorityId) {
    const matched = events.find((e) => e.id === priorityId)
    if (matched) return matched
  }

  const refTime = referenceDate.getTime()
  const refDateStr = referenceDate.toLocaleDateString('en-CA')

  // 1. Look for event ongoing today
  const todayEvent = events.find((e) => isEventOnDate(e, refDateStr))
  if (todayEvent) return todayEvent

  // 2. Look for next upcoming events (start time >= now)
  const upcomingEvents = events
    .filter((e) => {
      const startTime = e.start ? new Date(e.start).getTime() : 0
      return startTime >= refTime
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  if (upcomingEvents.length > 0) {
    return upcomingEvents[0]
  }

  // 3. Fallback to latest event in the past or first event
  const sortedDesc = [...events].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
  return sortedDesc[0] || events[0]
}

/**
 * Generate and trigger download of .ics (iCalendar) file
 */
export function downloadIcsFile(event) {
  if (!event) return

  const formatIcsDate = (dateVal) => {
    if (!dateVal) return ''
    if (typeof dateVal === 'string' && dateVal.length === 15 && dateVal.includes('T')) {
      return dateVal.replace(/[^0-9T]/g, '')
    }
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const startStr = event.gCalStart || formatIcsDate(event.start)
  const endStr = event.gCalEnd || formatIcsDate(event.end) || startStr

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SIMOJANG BKN//Kalender Kantor//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id || Date.now()}@simojang.kanreg3.id`,
    `SUMMARY:${event.title || 'Agenda SIMOJANG'}`,
    `DESCRIPTION:${(event.description || '').replace(/\r?\n/g, '\\n')}`,
    `LOCATION:${event.location || 'Kanreg III BKN Bandung'}`,
    startStr ? `DTSTART:${startStr}` : '',
    endStr ? `DTEND:${endStr}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const cleanTitle = (event.title || 'agenda')
    .slice(0, 30)
    .replace(/[^a-zA-Z0-9]/g, '_')
  a.setAttribute('download', `${cleanTitle}.ics`)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
export function getGoogleCalendarUrl(event) {
  if (!event) return '#'

  const title = encodeURIComponent(event.title || 'Agenda SIMOJANG')
  const details = encodeURIComponent(
    `${event.description || ''}\n\nLokasi: ${event.location || ''}\nInstansi: ${event.instansi || '-'}\nTim: ${event.team || '-'}\nNo. ST: ${event.stNumber || '-'}`.trim()
  )
  const location = encodeURIComponent(event.location || 'Kanreg III BKN Bandung')

  let datesParam = ''
  if (event.gCalStart && event.gCalEnd) {
    datesParam = `${event.gCalStart}/${event.gCalEnd}`
  } else if (event.start) {
    const startIso = new Date(event.start).toISOString().replace(/-|:|\.\d\d\d/g, '')
    const endIso = event.end
      ? new Date(event.end).toISOString().replace(/-|:|\.\d\d\d/g, '')
      : startIso
    datesParam = `${startIso}/${endIso}`
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`
}

/**
 * Format Indonesian date string helper
 */
export function formatIndonesianDate(isoOrDateStr, options = { withDay: true, withYear: true }) {
  if (!isoOrDateStr) return '-'
  try {
    const d = new Date(isoOrDateStr)
    if (isNaN(d.getTime())) return isoOrDateStr

    const dayName = options.withDay
      ? d.toLocaleDateString('id-ID', { weekday: 'long' }) + ', '
      : ''
    const dayNum = d.toLocaleDateString('id-ID', { day: 'numeric' })
    const monthName = d.toLocaleDateString('id-ID', { month: 'short' })
    const yearStr = options.withYear
      ? ' ' + d.toLocaleDateString('id-ID', { year: 'numeric' })
      : ''

    return `${dayName}${dayNum} ${monthName}${yearStr}`
  } catch {
    return isoOrDateStr
  }
}
