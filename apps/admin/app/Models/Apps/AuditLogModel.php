<?php

namespace App\Models\Apps;

use CodeIgniter\Model;
use Throwable;

class AuditLogModel extends Model
{
    protected $DBGroup = 'default';
    protected $table = 'auth_audit_logs';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    /**
     * Catat event audit ke tabel auth_audit_logs tanpa menggagalkan proses utama.
     */
    public function record(
        string $eventName,
        ?string $targetType = null,
        ?string $targetId = null,
        $beforeData = null,
        $afterData = null,
        ?int $actorUserId = null
    ): void {
        try {
            $request = service('request');
            $actor = $actorUserId ?? (int) (session()->get('userid') ?? 0);
            $actor = $actor > 0 ? $actor : null;

            $method = method_exists($request, 'getMethod') ? strtoupper((string) $request->getMethod()) : null;
            $path = method_exists($request, 'getUri') ? '/' . ltrim((string) $request->getUri()->getPath(), '/') : null;
            $ip = method_exists($request, 'getIPAddress') ? (string) $request->getIPAddress() : null;
            $ua = method_exists($request, 'getUserAgent') ? substr((string) $request->getUserAgent()->getAgentString(), 0, 255) : null;

            $this->db->table('auth_audit_logs')->insert([
                'actor_user_id'  => $actor,
                'event_name'     => substr(trim($eventName), 0, 120),
                'target_type'    => $targetType !== null ? substr(trim($targetType), 0, 120) : null,
                'target_id'      => $targetId !== null ? substr(trim((string) $targetId), 0, 120) : null,
                'request_method' => $method ? substr($method, 0, 10) : null,
                'request_path'   => $path ? substr($path, 0, 255) : null,
                'ip_address'     => $ip ? substr($ip, 0, 50) : null,
                'user_agent'     => $ua,
                'before_data'    => $beforeData !== null ? json_encode($beforeData, JSON_UNESCAPED_UNICODE) : null,
                'after_data'     => $afterData !== null ? json_encode($afterData, JSON_UNESCAPED_UNICODE) : null,
                'created_at'     => date('Y-m-d H:i:s'),
            ]);
        } catch (Throwable $e) {
            log_message('warning', 'AuditLogModel::record gagal: {message}', ['message' => $e->getMessage()]);
        }
    }

    public function getSummary(): array
    {
        $today = date('Y-m-d');

        $systemCount = $this->db->tableExists('auth_audit_logs')
            ? (int) $this->db->table('auth_audit_logs')->countAllResults()
            : 0;
        $dailyCount = $this->db->tableExists('activity_daily_logs')
            ? (int) $this->db->table('activity_daily_logs')->countAllResults()
            : 0;
        $uploadCount = $this->db->tableExists('txn_activity_upload_logs')
            ? (int) $this->db->table('txn_activity_upload_logs')->countAllResults()
            : 0;
        $loginCount = $this->db->tableExists('auth_useragent')
            ? (int) $this->db->table('auth_useragent')->countAllResults()
            : 0;

        $todaySystem = $this->db->tableExists('auth_audit_logs')
            ? (int) $this->db->table('auth_audit_logs')->where('DATE(created_at)', $today)->countAllResults()
            : 0;
        $todayDaily = $this->db->tableExists('activity_daily_logs')
            ? (int) $this->db->table('activity_daily_logs')->where('tanggal', $today)->countAllResults()
            : 0;
        $todayUpload = $this->db->tableExists('txn_activity_upload_logs')
            ? (int) $this->db->table('txn_activity_upload_logs')->where('DATE(created_at)', $today)->countAllResults()
            : 0;
        $todayLogin = $this->db->tableExists('auth_useragent')
            ? (int) $this->db->table('auth_useragent')->where('DATE(created_at)', $today)->countAllResults()
            : 0;

        $layananOptions = $this->db->tableExists('data_timkerja_layanan')
            ? $this->db->table('data_timkerja_layanan')
                ->select('id, nama_layanan')
                ->where('is_show', 1)
                ->orderBy('nama_layanan', 'ASC')
                ->get()
                ->getResultArray()
            : [];

        $eventOptions = $this->db->tableExists('auth_audit_logs')
            ? array_values(array_filter(array_column(
                $this->db->table('auth_audit_logs')
                    ->select('event_name')
                    ->distinct()
                    ->orderBy('event_name', 'ASC')
                    ->get()
                    ->getResultArray(),
                'event_name'
            )))
            : [];

        return [
            'totals' => [
                'system' => $systemCount,
                'daily'  => $dailyCount,
                'upload' => $uploadCount,
                'login'  => $loginCount,
                'all'    => $systemCount + $dailyCount + $uploadCount + $loginCount,
            ],
            'today' => [
                'system' => $todaySystem,
                'daily'  => $todayDaily,
                'upload' => $todayUpload,
                'login'  => $todayLogin,
                'all'    => $todaySystem + $todayDaily + $todayUpload + $todayLogin,
            ],
            'filters' => [
                'layanan' => $layananOptions,
                'events'  => $eventOptions,
            ],
        ];
    }

    public function getLogs(string $tab, array $params): array
    {
        $tab = strtolower(trim($tab));
        $page = max(1, (int) ($params['page'] ?? 1));
        $perPage = max(5, min(100, (int) ($params['per_page'] ?? 15)));
        $search = trim((string) ($params['search'] ?? ''));
        $dateFrom = trim((string) ($params['date_from'] ?? ''));
        $dateTo = trim((string) ($params['date_to'] ?? ''));
        $eventName = trim((string) ($params['event_name'] ?? ''));
        $layananId = (int) ($params['layanan_id'] ?? 0);

        return match ($tab) {
            'daily'  => $this->queryDailyLogs($page, $perPage, $search, $dateFrom, $dateTo, $layananId),
            'upload' => $this->queryUploadLogs($page, $perPage, $search, $dateFrom, $dateTo, $layananId),
            'login'  => $this->queryLoginLogs($page, $perPage, $search, $dateFrom, $dateTo),
            default  => $this->querySystemLogs($page, $perPage, $search, $dateFrom, $dateTo, $eventName),
        };
    }

    public function getSystemLogDetail(int $id): ?array
    {
        if ($id <= 0 || !$this->db->tableExists('auth_audit_logs')) {
            return null;
        }

        $row = $this->db->table('auth_audit_logs l')
            ->select("
                l.*,
                COALESCE(NULLIF(u.fullname, ''), u.username, CONCAT('User #', l.actor_user_id)) AS actor_name,
                u.username AS actor_username,
                u.role AS actor_role
            ")
            ->join('auth_users u', 'u.id = l.actor_user_id', 'left')
            ->where('l.id', $id)
            ->limit(1)
            ->get()
            ->getRowArray();

        if (!$row) {
            return null;
        }

        $row['id'] = (int) $row['id'];
        $row['before_parsed'] = $this->safeDecodeJson($row['before_data'] ?? null);
        $row['after_parsed'] = $this->safeDecodeJson($row['after_data'] ?? null);

        return $row;
    }

    private function querySystemLogs(
        int $page,
        int $perPage,
        string $search,
        string $dateFrom,
        string $dateTo,
        string $eventName
    ): array {
        if (!$this->db->tableExists('auth_audit_logs')) {
            return $this->emptyResult($page, $perPage);
        }

        $builder = $this->db->table('auth_audit_logs l')
            ->select("
                l.id,
                l.actor_user_id,
                l.event_name,
                l.target_type,
                l.target_id,
                l.request_method,
                l.request_path,
                l.ip_address,
                l.user_agent,
                l.created_at,
                (l.before_data IS NOT NULL OR l.after_data IS NOT NULL) AS has_payload,
                COALESCE(NULLIF(u.fullname, ''), u.username, 'Sistem / Guest') AS actor_name,
                u.username AS actor_username,
                u.role AS actor_role
            ")
            ->join('auth_users u', 'u.id = l.actor_user_id', 'left');

        if ($search !== '') {
            $builder->groupStart()
                ->like('l.event_name', $search)
                ->orLike('l.target_type', $search)
                ->orLike('l.target_id', $search)
                ->orLike('l.request_path', $search)
                ->orLike('l.ip_address', $search)
                ->orLike('u.username', $search)
                ->orLike('u.fullname', $search)
                ->groupEnd();
        }
        if ($eventName !== '') {
            $builder->where('l.event_name', $eventName);
        }
        if ($dateFrom !== '') {
            $builder->where('DATE(l.created_at) >=', $dateFrom);
        }
        if ($dateTo !== '') {
            $builder->where('DATE(l.created_at) <=', $dateTo);
        }

        return $this->paginateBuilder($builder, 'l.id', $page, $perPage);
    }

    private function queryDailyLogs(
        int $page,
        int $perPage,
        string $search,
        string $dateFrom,
        string $dateTo,
        int $layananId
    ): array {
        if (!$this->db->tableExists('activity_daily_logs')) {
            return $this->emptyResult($page, $perPage);
        }

        $builder = $this->db->table('activity_daily_logs a')
            ->select("
                a.id,
                a.layanan_id,
                a.tanggal,
                a.created_by,
                a.created_at,
                COALESCE(tkl.nama_layanan, dl.nama_layanan, CONCAT('Layanan #', a.layanan_id)) AS layanan_nama,
                COALESCE(dp.nama, a.created_by) AS pegawai_nama
            ")
            ->join('data_timkerja_layanan tkl', 'tkl.id = a.layanan_id', 'left')
            ->join('data_layanan dl', 'dl.id = a.layanan_id', 'left')
            ->join('data_pegawai dp', 'dp.nip = a.created_by', 'left');

        if ($search !== '') {
            $builder->groupStart()
                ->like('a.created_by', $search)
                ->orLike('dp.nama', $search)
                ->orLike('tkl.nama_layanan', $search)
                ->orLike('dl.nama_layanan', $search)
                ->groupEnd();
        }
        if ($layananId > 0) {
            $builder->where('a.layanan_id', $layananId);
        }
        if ($dateFrom !== '') {
            $builder->where('a.tanggal >=', $dateFrom);
        }
        if ($dateTo !== '') {
            $builder->where('a.tanggal <=', $dateTo);
        }

        return $this->paginateBuilder($builder, 'a.id', $page, $perPage);
    }

    private function queryUploadLogs(
        int $page,
        int $perPage,
        string $search,
        string $dateFrom,
        string $dateTo,
        int $layananId
    ): array {
        if (!$this->db->tableExists('txn_activity_upload_logs')) {
            return $this->emptyResult($page, $perPage);
        }

        $builder = $this->db->table('txn_activity_upload_logs u')
            ->select("
                u.id,
                u.uid,
                u.layanan_id,
                u.period,
                u.period_date,
                u.doc_type,
                u.doc_category,
                u.file_name,
                u.file_size,
                u.mime_type,
                u.remarks,
                u.ip_address,
                u.user_agent,
                u.created_by,
                u.created_at,
                COALESCE(tkl.nama_layanan, dl.nama_layanan, CONCAT('Layanan #', u.layanan_id)) AS layanan_nama,
                COALESCE(dp.nama, u.created_by) AS pegawai_nama
            ")
            ->join('data_timkerja_layanan tkl', 'tkl.id = u.layanan_id', 'left')
            ->join('data_layanan dl', 'dl.id = u.layanan_id', 'left')
            ->join('data_pegawai dp', 'dp.nip = u.created_by', 'left');

        if ($search !== '') {
            $builder->groupStart()
                ->like('u.file_name', $search)
                ->orLike('u.doc_type', $search)
                ->orLike('u.doc_category', $search)
                ->orLike('u.created_by', $search)
                ->orLike('dp.nama', $search)
                ->orLike('tkl.nama_layanan', $search)
                ->orLike('u.ip_address', $search)
                ->groupEnd();
        }
        if ($layananId > 0) {
            $builder->where('u.layanan_id', $layananId);
        }
        if ($dateFrom !== '') {
            $builder->where('DATE(u.created_at) >=', $dateFrom);
        }
        if ($dateTo !== '') {
            $builder->where('DATE(u.created_at) <=', $dateTo);
        }

        return $this->paginateBuilder($builder, 'u.id', $page, $perPage);
    }

    private function queryLoginLogs(
        int $page,
        int $perPage,
        string $search,
        string $dateFrom,
        string $dateTo
    ): array {
        if (!$this->db->tableExists('auth_useragent')) {
            return $this->emptyResult($page, $perPage);
        }

        $builder = $this->db->table('auth_useragent ua')
            ->select("
                ua.id,
                ua.username,
                ua.platform,
                ua.language,
                ua.timezone,
                ua.screen_width,
                ua.screen_height,
                ua.touch_support,
                ua.ip_address,
                ua.user_agent,
                ua.created_at,
                COALESCE(NULLIF(u.fullname, ''), dp.nama, ua.username) AS fullname,
                u.role AS role
            ")
            ->join('auth_users u', 'u.username = ua.username', 'left')
            ->join('data_pegawai dp', 'dp.nip = ua.username', 'left');

        if ($search !== '') {
            $builder->groupStart()
                ->like('ua.username', $search)
                ->orLike('u.fullname', $search)
                ->orLike('dp.nama', $search)
                ->orLike('ua.platform', $search)
                ->orLike('ua.ip_address', $search)
                ->orLike('ua.user_agent', $search)
                ->groupEnd();
        }
        if ($dateFrom !== '') {
            $builder->where('DATE(ua.created_at) >=', $dateFrom);
        }
        if ($dateTo !== '') {
            $builder->where('DATE(ua.created_at) <=', $dateTo);
        }

        return $this->paginateBuilder($builder, 'ua.id', $page, $perPage);
    }

    private function paginateBuilder($builder, string $orderColumn, int $page, int $perPage): array
    {
        $countBuilder = clone $builder;
        $total = (int) $countBuilder->countAllResults();
        $offset = ($page - 1) * $perPage;

        $rows = $builder
            ->orderBy($orderColumn, 'DESC')
            ->limit($perPage, $offset)
            ->get()
            ->getResultArray();

        return [
            'rows' => $rows,
            'meta' => [
                'page'       => $page,
                'per_page'   => $perPage,
                'total'      => $total,
                'total_page' => max(1, (int) ceil($total / $perPage)),
            ],
        ];
    }

    private function emptyResult(int $page, int $perPage): array
    {
        return [
            'rows' => [],
            'meta' => [
                'page'       => $page,
                'per_page'   => $perPage,
                'total'      => 0,
                'total_page' => 1,
            ],
        ];
    }

    private function safeDecodeJson(?string $raw)
    {
        if ($raw === null || trim($raw) === '') {
            return null;
        }
        $decoded = json_decode($raw, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : $raw;
    }
}
