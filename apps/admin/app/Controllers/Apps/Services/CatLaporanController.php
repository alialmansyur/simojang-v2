<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use App\Models\Apps\Services\CatLaporanModel;
use App\Models\Apps\Services\CatUserSignerModel;
use App\Models\Apps\Services\CATPengelolaModel;
use CodeIgniter\HTTP\ResponseInterface;

class CatLaporanController extends BaseController
{
    protected CatLaporanModel $laporanModel;
    protected CatUserSignerModel $signerModel;
    protected CATPengelolaModel $pengelolaModel;

    public function __construct()
    {
        $this->laporanModel    = new CatLaporanModel();
        $this->signerModel     = new CatUserSignerModel();
        $this->pengelolaModel  = new CATPengelolaModel();
    }

    /**
     * Helper to get current authenticated user NIP and name
     */
    protected function getAuthUser(): array
    {
        $nip = trim((string) (session()->get('username') ?? ''));
        if ($nip === '' && !empty(session()->get('userid'))) {
            $nip = (string) $this->pengelolaModel->resolveUsernameByUserId((int) session()->get('userid'));
        }
        $name = trim((string) (session()->get('name') ?? session()->get('nama') ?? 'Pegawai BKN'));
        return [
            'nip'  => $nip,
            'name' => $name,
        ];
    }

    /**
     * GET /api/apps-cat/laporan
     * List previously created reports with search and summary metrics
     */
    public function getLaporanList(): ResponseInterface
    {
        $params = [
            'jenis_laporan' => trim((string) $this->request->getGet('jenis_laporan')),
            'status'        => trim((string) $this->request->getGet('status')),
            'keyword'       => trim((string) $this->request->getGet('search')),
            'seleksi_id'    => $this->request->getGet('seleksi_id'),
            'tilok_id'      => $this->request->getGet('tilok_id'),
            'jenis_tes_id'  => $this->request->getGet('jenis_tes_id'),
            'instansi_id'   => trim((string) ($this->request->getGet('instansi_id') ?? '')),
            'page'          => (int) ($this->request->getGet('page') ?? 1),
            'limit'         => (int) ($this->request->getGet('limit') ?? 20),
        ];

        $result = $this->laporanModel->getApiDocumentList($params);
        $summary = $this->laporanModel->getSummaryMetrics($params);

        return $this->response->setJSON([
            'status'  => 'success',
            'data'    => $result['rows'],
            'total'   => $result['total'],
            'page'    => $result['page'],
            'limit'   => $result['limit'],
            'summary' => $summary,
        ]);
    }

    /**
     * GET /api/apps-cat/laporan/detail/(:segment)
     * Get single report full detail and JSON snapshots
     */
    public function getLaporanDetail(string $uid): ResponseInterface
    {
        $row = $this->laporanModel->where('uid', $uid)->first();
        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Laporan tidak ditemukan.',
            ]);
        }

        $row['params']        = !empty($row['params_json']) ? json_decode($row['params_json'], true) : [];
        $row['data_snapshot'] = !empty($row['data_snapshot_json']) ? json_decode($row['data_snapshot_json'], true) : [];
        $row['signers']       = !empty($row['signers_json']) ? json_decode($row['signers_json'], true) : [];
        $row['evidence']      = !empty($row['evidence_json']) ? json_decode($row['evidence_json'], true) : [];

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $row,
        ]);
    }

    /**
     * POST /api/apps-cat/laporan
     * Save / Publish report with JSON snapshot
     */
    public function storeLaporan(): ResponseInterface
    {
        $user = $this->getAuthUser();
        $payload = $this->request->getJSON(true) ?: $this->request->getPost();

        $uid = trim((string) ($payload['uid'] ?? ''));
        $isNew = false;
        if ($uid === '') {
            $isNew = true;
            $uid = 'lap_' . bin2hex(random_bytes(12));
        }

        $paramsJson       = is_array($payload['params'] ?? null) ? json_encode($payload['params']) : ($payload['params_json'] ?? null);
        $dataSnapshotJson = is_array($payload['data_snapshot'] ?? null) ? json_encode($payload['data_snapshot']) : ($payload['data_snapshot_json'] ?? null);
        $signersJson      = is_array($payload['signers'] ?? null) ? json_encode($payload['signers']) : ($payload['signers_json'] ?? null);
        $evidenceJson     = is_array($payload['evidence'] ?? null) ? json_encode($payload['evidence']) : ($payload['evidence_json'] ?? null);

        $status = in_array($payload['status'] ?? '', ['draft', 'published'], true) ? $payload['status'] : 'draft';

        $data = [
            'uid'                 => $uid,
            'jenis_laporan'       => trim((string) ($payload['jenis_laporan'] ?? 'laporan-pelaksanaan-cat')),
            'nomor_dokumen'       => trim((string) ($payload['nomor_dokumen'] ?? '')),
            'judul_laporan'       => trim((string) ($payload['judul_laporan'] ?? 'Laporan Kegiatan Pelaksanaan CAT')),
            'tanggal_dokumen'     => !empty($payload['tanggal_dokumen']) ? $payload['tanggal_dokumen'] : null,
            'tanggal_pelaksanaan' => !empty($payload['tanggal_pelaksanaan']) ? $payload['tanggal_pelaksanaan'] : null,
            'jenis_tes_id'        => !empty($payload['jenis_tes_id']) ? (string) $payload['jenis_tes_id'] : null,
            'seleksi_id'          => !empty($payload['seleksi_id']) ? (int) $payload['seleksi_id'] : null,
            'tilok_id'            => !empty($payload['tilok_id']) ? (string) $payload['tilok_id'] : null,
            'instansi_id'         => !empty($payload['instansi_id']) ? (string) $payload['instansi_id'] : null,
            'periode'             => !empty($payload['periode']) ? (string) $payload['periode'] : null,
            'status'              => $status,
            'params_json'         => $paramsJson,
            'data_snapshot_json'  => $dataSnapshotJson,
            'signers_json'        => $signersJson,
            'evidence_json'       => $evidenceJson,
        ];

        if ($isNew) {
            $data['created_by_nip']  = $user['nip'] ?: 'SYSTEM';
            $data['created_by_name'] = $user['name'] ?: 'Pegawai';
            $this->laporanModel->insert($data);
        } else {
            $existing = $this->laporanModel->where('uid', $uid)->first();
            if ($existing) {
                $this->laporanModel->update($existing['id'], $data);
            } else {
                $data['created_by_nip']  = $user['nip'] ?: 'SYSTEM';
                $data['created_by_name'] = $user['name'] ?: 'Pegawai';
                $this->laporanModel->insert($data);
            }
        }

        // Auto-save user signature from the report to profile if requested or available
        $signers = is_array($payload['signers'] ?? null) ? $payload['signers'] : json_decode($signersJson ?: '[]', true);
        if (!empty($signers) && !empty($user['nip'])) {
            foreach (['kanan', 'kiri', 'tengah'] as $posKey) {
                $s = $signers[$posKey] ?? null;
                if (!empty($s) && !empty($s['signatureData']) && !empty($s['nama'])) {
                    $this->signerModel->upsertSignerProfile([
                        'user_nip'       => $user['nip'],
                        'user_name'      => $user['name'],
                        'jenis_tes_id'   => $data['jenis_tes_id'],
                        'seleksi_id'     => $data['seleksi_id'],
                        'tilok_id'       => $data['tilok_id'],
                        'instansi_id'    => $data['instansi_id'] ?: null, // null = seluruh tilok
                        'position_key'   => $posKey,
                        'jabatan'        => $s['jabatan'] ?? '',
                        'nama'           => $s['nama'] ?? '',
                        'nip'            => $s['nip'] ?? '',
                        'pangkat_gol'    => $s['pangkat_gol'] ?? '',
                        'instansi_nama'  => $s['instansi_nama'] ?? '',
                        'signature_data' => $s['signatureData'],
                    ]);
                }
            }
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Laporan berhasil disimpan.',
            'uid'     => $uid,
        ]);
    }

    /**
     * POST /api/apps-cat/laporan/delete
     */
    public function deleteLaporan(): ResponseInterface
    {
        $payload = $this->request->getJSON(true) ?: $this->request->getPost();
        $uid = trim((string) ($payload['uid'] ?? ''));

        if ($uid === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'UID laporan tidak valid.',
            ]);
        }

        $existing = $this->laporanModel->where('uid', $uid)->first();
        if (!$existing) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => 'error',
                'message' => 'Laporan tidak ditemukan.',
            ]);
        }

        $this->laporanModel->delete($existing['id']);

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Laporan berhasil dihapus.',
        ]);
    }

    /**
     * GET /api/apps-cat/laporan/user-signers
     * Fetch saved e-sign profiles for current logged-in employee matching scope
     */
    public function getUserSigners(): ResponseInterface
    {
        $user = $this->getAuthUser();
        $userNip = $user['nip'];

        $scope = [
            'jenis_tes_id' => $this->request->getGet('jenis_tes_id'),
            'seleksi_id'   => $this->request->getGet('seleksi_id'),
            'tilok_id'     => $this->request->getGet('tilok_id'),
            'instansi_id'  => $this->request->getGet('instansi_id'),
        ];

        if ($userNip === '') {
            return $this->response->setJSON([
                'status' => 'success',
                'data'   => ['kiri' => null, 'tengah' => null, 'kanan' => null],
            ]);
        }

        $signers = $this->signerModel->getEffectiveSignersForUser($userNip, $scope);

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $signers,
            'user'   => $user,
        ]);
    }

    /**
     * POST /api/apps-cat/laporan/user-signers
     * Save or update signer profile for current employee
     */
    public function saveUserSigner(): ResponseInterface
    {
        $user = $this->getAuthUser();
        $payload = $this->request->getJSON(true) ?: $this->request->getPost();

        if (empty($user['nip'])) {
            return $this->response->setStatusCode(401)->setJSON([
                'status'  => 'error',
                'message' => 'Sesi login tidak terdeteksi.',
            ]);
        }

        $positionKey = trim((string) ($payload['position_key'] ?? 'kanan'));
        $data = [
            'user_nip'       => $user['nip'],
            'user_name'      => $user['name'],
            'jenis_tes_id'   => !empty($payload['jenis_tes_id']) ? (string) $payload['jenis_tes_id'] : null,
            'seleksi_id'     => !empty($payload['seleksi_id']) ? (int) $payload['seleksi_id'] : null,
            'tilok_id'       => !empty($payload['tilok_id']) ? (string) $payload['tilok_id'] : null,
            'instansi_id'    => !empty($payload['instansi_id']) ? (string) $payload['instansi_id'] : null,
            'position_key'   => $positionKey,
            'jabatan'        => trim((string) ($payload['jabatan'] ?? '')),
            'nama'           => trim((string) ($payload['nama'] ?? '')),
            'nip'            => trim((string) ($payload['nip'] ?? '')),
            'pangkat_gol'    => trim((string) ($payload['pangkat_gol'] ?? '')),
            'instansi_nama'  => trim((string) ($payload['instansi_nama'] ?? '')),
            'signature_data' => $payload['signature_data'] ?? null,
        ];

        $success = $this->signerModel->upsertSignerProfile($data);

        return $this->response->setJSON([
            'status'  => $success ? 'success' : 'error',
            'message' => $success ? 'Profil tanda tangan berhasil disimpan.' : 'Gagal menyimpan profil tanda tangan.',
        ]);
    }

    /**
     * POST /api/apps-cat/laporan/user-signers/reset
     * Reset / clear signer profile for current employee and scope
     */
    public function resetUserSigner(): ResponseInterface
    {
        $user = $this->getAuthUser();
        $payload = $this->request->getJSON(true) ?: $this->request->getPost();

        if (empty($user['nip'])) {
            return $this->response->setStatusCode(401)->setJSON([
                'status'  => 'error',
                'message' => 'Sesi login tidak terdeteksi.',
            ]);
        }

        $positionKey = trim((string) ($payload['position_key'] ?? ''));
        $seleksiId   = !empty($payload['seleksi_id']) ? (int) $payload['seleksi_id'] : null;
        $tilokId     = !empty($payload['tilok_id']) ? (string) $payload['tilok_id'] : null;
        $instansiId  = !empty($payload['instansi_id']) ? (string) $payload['instansi_id'] : null;

        $builder = $this->signerModel->where('user_nip', $user['nip']);
        if ($positionKey !== '') {
            $builder->where('position_key', $positionKey);
        }
        if ($seleksiId !== null) {
            $builder->where('seleksi_id', $seleksiId);
        }
        if ($tilokId !== null) {
            $builder->where('tilok_id', $tilokId);
        }
        if ($instansiId !== null) {
            $builder->where('instansi_id', $instansiId);
        }

        $builder->delete();

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => 'Profil tanda tangan berhasil direset.',
        ]);
    }
}
