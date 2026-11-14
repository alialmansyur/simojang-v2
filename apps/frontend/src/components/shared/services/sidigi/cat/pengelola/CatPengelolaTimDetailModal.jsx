import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Users,
  CalendarClock,
  MapPin,
  Building2,
  FileCheck2,
  Clock,
  Edit3,
  Trash2,
  UserPlus,
} from 'lucide-react'
import {
  getRoleMeta,
  ST_STATUS_META,
  formatDateRangeId,
} from './pengelolaConstants'

export function CatPengelolaTimDetailModal({
  isOpen,
  group,
  onClose,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onLinkSt,
}) {
  useEffect(() => {
    if (!isOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !group) return null

  const members = Array.isArray(group.members) ? group.members : []
  const roleSummary = {
    Koordinator: members.filter((m) => String(m.peran).toLowerCase() === 'koordinator').length,
    IT: members.filter((m) => String(m.peran).toLowerCase() === 'it').length,
    Pengawas: members.filter((m) => String(m.peran).toLowerCase() === 'pengawas').length,
  }

  const effectiveGroupStStatus =
    group.jadwalStStatus === 'terhubung' ||
    members.some((m) => m.resolved_st_status === 'terhubung' || m.jadwal_st_status === 'terhubung')
      ? 'terhubung'
      : 'menunggu'
  const groupStMeta = ST_STATUS_META[effectiveGroupStStatus]
  const groupNomorSt =
    group.jadwalNomorSt ||
    members.find((m) => m.resolved_nomor_st || m.nomor_st || m.jadwal_nomor_st)?.resolved_nomor_st ||
    ''

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs modal-backdrop-animated"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col modal-dialog-animated">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#175CD3] dark:bg-blue-950/40 dark:text-blue-300">
                <Users className="w-3 h-3" />
                <span>{members.length} Personel Tim</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${groupStMeta.badgeClass}`}
              >
                {effectiveGroupStStatus === 'terhubung' ? (
                  <FileCheck2 className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                <span>{groupNomorSt || groupStMeta.label}</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {group.namaJadwal}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detail informasi jadwal kegiatan beserta daftar personel tim yang ditugaskan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup detail tim"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto clean-scrollbar space-y-5">
          {/* Info Kegiatan / Jadwal */}
          <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Jenis Tes & Seleksi
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-100">
                  {[group.jenisTesNama, group.periode, group.namaSeleksi].filter(Boolean).join(' • ') || '-'}
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Titik Lokasi
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{group.namaTilok || '-'}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tanggal Kegiatan
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formatDateRangeId(group.tanggalMulai, group.tanggalSelesai)}</span>
                </div>
              </div>

              <div className="space-y-0.5 sm:col-span-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Instansi Peserta
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{group.instansiNama || 'Lintas / Umum'}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Komposisi Tim
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                    Koordinator: {roleSummary.Koordinator}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                    Tim IT: {roleSummary.IT}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                    Pengawas: {roleSummary.Pengawas}
                  </span>
                </div>
              </div>
            </div>

            {/* Action bar inside detail */}
            <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  onLinkSt?.({
                    id: group.jadwalId,
                    uid: group.jadwalUid,
                    nama_jadwal: group.namaJadwal,
                    st_document_id: group.jadwalStDocumentId,
                    nomor_st: groupNomorSt,
                    tanggal_st: group.jadwalTanggalSt,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{groupNomorSt ? 'Ubah / Tautkan ST Jadwal' : 'Tautkan Nomor ST Jadwal'}</span>
              </button>

              <button
                type="button"
                onClick={() => onAddMember?.(group.jadwalId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#175CD3] hover:bg-[#1550B8] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Personel ke Jadwal Ini</span>
              </button>
            </div>
          </div>

          {/* Daftar Detail Anggota Tim */}
          <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Daftar Anggota Tim ({members.length})
              </span>
            </div>
            <div className="overflow-x-auto clean-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-3.5 text-center whitespace-nowrap w-10">No</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Pegawai</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Jabatan / Tim Kerja</th>
                    <th className="py-3 px-3.5 text-center whitespace-nowrap">Peran Tim</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Tanggal Tugas</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Surat Tugas (ST)</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs font-medium">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                        Belum ada personel tim pada jadwal ini.
                      </td>
                    </tr>
                  ) : (
                    members.map((member, idx) => {
                      const roleMeta = getRoleMeta(member.peran)
                      const effectiveStStatus =
                        member.resolved_st_status === 'terhubung' || member.jadwal_st_status === 'terhubung'
                          ? 'terhubung'
                          : 'menunggu'
                      const stMeta = ST_STATUS_META[effectiveStStatus]
                      const nomorSt =
                        member.resolved_nomor_st ||
                        member.nomor_st ||
                        member.jadwal_nomor_st ||
                        member.member_doc_number ||
                        ''
                      const jabatanLabel = [
                        member.pegawai_jabatan || member.jabatan,
                        member.unit_kerja_nama,
                      ]
                        .filter(Boolean)
                        .join(' • ')

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-50/75 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3.5 text-center text-slate-400 tabular-nums whitespace-nowrap">
                            {idx + 1}
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div
                              className="flex items-center gap-2 max-w-[260px]"
                              title={`${member.nama} (NIP ${member.nip})${member.catatan ? ` — ${member.catatan}` : ''}`}
                            >
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {member.nama}
                              </span>
                              <span className="text-[11px] font-mono font-normal text-slate-400 dark:text-slate-500 shrink-0">
                                ({member.nip})
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <div
                              className="max-w-[210px] truncate text-slate-600 dark:text-slate-300 font-normal"
                              title={jabatanLabel || '-'}
                            >
                              {jabatanLabel || '-'}
                            </div>
                          </td>

                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleMeta.badgeClass}`}
                            >
                              {roleMeta.label}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 dark:text-slate-200">
                            {formatDateRangeId(
                              member.tanggal_mulai || member.jadwal_tanggal_mulai,
                              member.tanggal_selesai || member.jadwal_tanggal_selesai
                            )}
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border max-w-[175px] ${stMeta.badgeClass}`}
                              title={nomorSt || stMeta.label}
                            >
                              {effectiveStStatus === 'terhubung' ? (
                                <FileCheck2 className="w-3 h-3 shrink-0" />
                              ) : (
                                <Clock className="w-3 h-3 shrink-0" />
                              )}
                              <span className="truncate">{nomorSt || stMeta.label}</span>
                            </span>
                          </td>

                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => onEditMember?.(member)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#175CD3] hover:bg-blue-50 dark:hover:text-sky-400 dark:hover:bg-sky-950/40 transition-colors cursor-pointer active:scale-95"
                                title="Ubah Penugasan Personel"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteMember?.(member)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer active:scale-95"
                                title="Hapus dari Tim"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
