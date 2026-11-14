<?php

namespace App\Models\Apps;

use CodeIgniter\Model;

class DashboardModel extends Model
{
    protected $DBGroup = 'default';

    /**
     * Ringkasan Workspace Dashboard (Profil Sapaan & Log Unggahan Terbaru).
     */
    public function getWorkspaceSummary(string $nip): array
    {
        return [
            'my_tasks_summary'  => $this->getUserProfileSummary($nip),
            'recent_activities' => $this->getRecentActivities(8),
        ];
    }

    /**
     * Backward-compatible alias untuk controller.
     */
    public function getExecutiveSummary(string $nip, int $year = 0): array
    {
        return $this->getWorkspaceSummary($nip);
    }

    private function getRecentActivities(int $limit = 8): array
    {
        $rows = $this->db->query("
            SELECT
                ul.id,
                ul.uid,
                ul.layanan_id,
                l.nama_layanan,
                l.url AS layanan_url,
                tk.code AS timkerja_code,
                tk.nama AS timkerja_nama,
                ul.doc_type,
                ul.doc_category,
                ul.file_name,
                COALESCE(p.nama, u.fullname, ul.created_by) AS uploader_nama,
                ul.created_at
            FROM txn_activity_upload_logs ul
            LEFT JOIN data_timkerja_layanan l ON l.id = ul.layanan_id
            LEFT JOIN data_timkerja tk ON tk.id = l.timkerja_id
            LEFT JOIN data_pegawai p ON p.nip = ul.created_by
            LEFT JOIN auth_users u ON u.username = ul.created_by
            ORDER BY ul.created_at DESC, ul.id DESC
            LIMIT ?
        ", [$limit])->getResultArray();

        return array_map(static function ($row) {
            return [
                'id'            => (int) $row['id'],
                'uid'           => (string) ($row['uid'] ?? ''),
                'layanan_id'    => (int) ($row['layanan_id'] ?? 0),
                'nama_layanan'  => (string) ($row['nama_layanan'] ?? $row['doc_type'] ?? 'Layanan Kepegawaian'),
                'layanan_url'   => (string) ($row['layanan_url'] ?? ''),
                'timkerja_code' => (string) ($row['timkerja_code'] ?? ''),
                'timkerja_nama' => (string) ($row['timkerja_nama'] ?? 'Tim Kerja BKN'),
                'doc_category'  => (string) ($row['doc_category'] ?? ''),
                'file_name'     => (string) ($row['file_name'] ?? ''),
                'uploader_nama' => (string) ($row['uploader_nama'] ?? '-'),
                'created_at'    => $row['created_at'] ?? null,
            ];
        }, $rows);
    }

    private function getUserProfileSummary(string $nip): array
    {
        $nip = trim($nip);
        if ($nip === '') {
            return [
                'unit_kerja' => null,
                'jabatan'    => null,
            ];
        }

        $pegawaiRow = $this->db->table('data_pegawai dp')
            ->select('dp.jabatan, uk.nama AS unit_kerja_nama')
            ->join('data_pegawai_unit_kerja uk', 'uk.id = dp.unit_kerja_id', 'left')
            ->where('dp.nip', $nip)
            ->limit(1)
            ->get()
            ->getRowArray();

        return [
            'unit_kerja' => $pegawaiRow['unit_kerja_nama'] ?? null,
            'jabatan'    => $pegawaiRow['jabatan'] ?? null,
        ];
    }
}
