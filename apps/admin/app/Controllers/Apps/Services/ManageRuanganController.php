<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Libraries\DataTablesLib;
use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\ManageRuanganModel;
use App\Services\Storage\FileStorageService;

class ManageRuanganController extends BaseController
{
    protected $apps;
    protected $manageRuangan;
    protected $dataTables;
    protected $storage;

    public function __construct()
    {
        $this->apps          = new AppsModel();
        $this->manageRuangan = new ManageRuanganModel();
        $this->dataTables    = new DataTablesLib();
        $this->storage       = new FileStorageService();
        helper(['form', 'url']);
    }

    // ----------------------------------------------------
    // DATATABLE LIST RUANGAN
    // ----------------------------------------------------
    public function getData(): ResponseInterface
    {
        $filters = [
            'kantor' => $this->request->getPost('kantor') ?: $this->request->getPost('area'),
            'status' => $this->request->getPost('status'),
            'lantai' => $this->request->getPost('lantai'),
        ];

        $builder = $this->manageRuangan->getBuilder('ruangan', $filters);
        $columns = $this->manageRuangan->getColumns('ruangan');
        $result  = $this->dataTables->render($builder, $columns);

        if (!empty($result['data']) && is_array($result['data'])) {
            foreach ($result['data'] as &$row) {
                $row['foto_url'] = !empty($row['foto']) ? $this->storage->toPublicUrl((string) $row['foto'], 'ruangan') : null;
                $row['total_assets'] = (int) ($row['total_assets'] ?? 0);
            }
            unset($row);
        }

        return $this->response->setJSON($result);
    }

    // ----------------------------------------------------
    // RINGKASAN METRIK BENTO KPI
    // ----------------------------------------------------
    public function getSummary(): ResponseInterface
    {
        $filters = [
            'kantor' => $this->request->getPost('kantor') ?: $this->request->getPost('area'),
            'status' => $this->request->getPost('status'),
        ];

        return $this->response->setJSON([
            'status'  => 'success',
            'summary' => $this->manageRuangan->getSummary($filters),
        ]);
    }

    // ----------------------------------------------------
    // DETAIL SINGLE RUANGAN & ASET DI DALAMNYA
    // ----------------------------------------------------
    public function getDetail(): ResponseInterface
    {
        $id = $this->request->getPost('id');
        $uid = $this->request->getPost('uid');

        $data = null;
        if (!empty($id)) {
            $data = $this->manageRuangan->getRuanganById((int) $id);
        } elseif (!empty($uid)) {
            $data = $this->manageRuangan->getRuanganByUid((string) $uid);
        }

        if (!$data) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Data ruangan tidak ditemukan.',
            ]);
        }

        $data['foto_url'] = !empty($data['foto']) ? $this->storage->toPublicUrl((string) $data['foto'], 'ruangan') : null;
        $assets = $this->manageRuangan->getAssetsByRuanganId((int) $data['id']);

        foreach ($assets as &$asset) {
            $asset['foto_url'] = !empty($asset['foto']) ? $this->storage->toPublicUrl((string) $asset['foto'], 'assets') : null;
        }
        unset($asset);

        $data['assets'] = $assets;

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $data,
        ]);
    }

    // ----------------------------------------------------
    // SIMPAN DATA RUANGAN BARU
    // ----------------------------------------------------
    public function storeDetail(): ResponseInterface
    {
        $rules = [
            'nama_ruangan' => [
                'rules'  => 'required|min_length[2]|max_length[150]',
                'errors' => [
                    'required'   => 'Nama ruangan wajib diisi.',
                    'min_length' => 'Nama ruangan minimal 2 karakter.',
                    'max_length' => 'Nama ruangan maksimal 150 karakter.',
                ],
            ],
            'kantor' => [
                'rules'  => 'required|in_list[Kantor Regional III BKN,UPT BKN Serang,UPT BKN Bandung]',
                'errors' => [
                    'required' => 'Kantor penempatan wajib dipilih.',
                    'in_list'  => 'Kantor harus berupa Kantor Regional III BKN, UPT BKN Serang, atau UPT BKN Bandung.',
                ],
            ],
            'kapasitas' => [
                'rules'  => 'required|numeric',
                'errors' => [
                    'required' => 'Kapasitas ruangan wajib diisi.',
                    'numeric'  => 'Kapasitas harus berupa angka bulat positif.',
                ],
            ],
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => implode(' ', $this->validator->getErrors()),
            ]);
        }

        $fotoName = null;
        try {
            $fotoName = $this->handlePhotoUpload();
        } catch (\Throwable $e) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Gagal mengunggah foto ruangan: ' . $e->getMessage(),
            ]);
        }

        $kantor = trim((string) $this->request->getPost('kantor'));
        $kodeRuangan = trim((string) ($this->request->getPost('kode_ruangan') ?? ''));
        if ($kodeRuangan === '') {
            $prefix = match ($kantor) {
                'UPT BKN Serang'  => 'SRG-R',
                'UPT BKN Bandung' => 'BDG-R',
                default           => 'K3-R',
            };
            $kodeRuangan = $prefix . '-' . date('ym') . str_pad((string) mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
        }

        $status = trim((string) ($this->request->getPost('status') ?? 'Tersedia'));
        if (!in_array($status, ['Tersedia', 'Digunakan', 'Pemeliharaan', 'Nonaktif'], true)) {
            $status = 'Tersedia';
        }

        $insertData = [
            'kantor'       => $kantor,
            'kode_ruangan' => $kodeRuangan,
            'nama_ruangan' => trim((string) $this->request->getPost('nama_ruangan')),
            'lantai'       => trim((string) ($this->request->getPost('lantai') ?? '')) ?: null,
            'kapasitas'    => max(0, (int) $this->request->getPost('kapasitas')),
            'spesifikasi'  => trim((string) ($this->request->getPost('spesifikasi') ?? '')) ?: null,
            'foto'         => $fotoName,
            'deskripsi'    => trim((string) ($this->request->getPost('deskripsi') ?? '')) ?: null,
            'status'       => $status,
            'created_by'   => session()->get('username') ?? 'system',
        ];

        $insertedId = $this->manageRuangan->insertRuangan($insertData);
        if ($insertedId) {
            // Sinkronisasi aset yang dialokasikan jika ada
            $rawAssetIds = $this->request->getPost('asset_ids');
            if (!empty($rawAssetIds)) {
                $assetIds = is_array($rawAssetIds) ? $rawAssetIds : explode(',', (string) $rawAssetIds);
                $this->manageRuangan->syncAssetsToRuangan($insertedId, $assetIds);
            }

            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Data ruangan berhasil ditambahkan.',
                'id'      => $insertedId,
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'error',
            'message' => 'Gagal menyimpan data ruangan.',
        ]);
    }

    // ----------------------------------------------------
    // PERBARUI DATA RUANGAN
    // ----------------------------------------------------
    public function updateDetail(): ResponseInterface
    {
        $id = (int) $this->request->getPost('id');
        $existing = $id > 0 ? $this->manageRuangan->getRuanganById($id) : null;

        if (!$existing) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Data ruangan tidak ditemukan untuk diperbarui.',
            ]);
        }

        $rules = [
            'nama_ruangan' => [
                'rules'  => 'required|min_length[2]|max_length[150]',
                'errors' => [
                    'required'   => 'Nama ruangan wajib diisi.',
                    'min_length' => 'Nama ruangan minimal 2 karakter.',
                    'max_length' => 'Nama ruangan maksimal 150 karakter.',
                ],
            ],
            'kantor' => [
                'rules'  => 'required|in_list[Kantor Regional III BKN,UPT BKN Serang,UPT BKN Bandung]',
                'errors' => [
                    'required' => 'Kantor penempatan wajib dipilih.',
                    'in_list'  => 'Kantor harus berupa Kantor Regional III BKN, UPT BKN Serang, atau UPT BKN Bandung.',
                ],
            ],
            'kapasitas' => [
                'rules'  => 'required|numeric',
                'errors' => [
                    'required' => 'Kapasitas ruangan wajib diisi.',
                    'numeric'  => 'Kapasitas harus berupa angka bulat positif.',
                ],
            ],
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => implode(' ', $this->validator->getErrors()),
            ]);
        }

        // Handle penghapusan foto jika diminta user
        if ($this->request->getPost('remove_foto') === '1' && !empty($existing['foto'])) {
            $this->storage->delete((string) $existing['foto'], 'ruangan');
            $existing['foto'] = null;
        }

        // Upload foto baru jika ada
        $fotoName = $existing['foto'];
        try {
            $newFoto = $this->handlePhotoUpload($existing['foto']);
            if ($newFoto !== null) {
                $fotoName = $newFoto;
            }
        } catch (\Throwable $e) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Gagal mengunggah foto ruangan: ' . $e->getMessage(),
            ]);
        }

        $status = trim((string) ($this->request->getPost('status') ?? $existing['status']));
        if (!in_array($status, ['Tersedia', 'Digunakan', 'Pemeliharaan', 'Nonaktif'], true)) {
            $status = $existing['status'];
        }

        $updateData = [
            'kantor'       => trim((string) $this->request->getPost('kantor')),
            'kode_ruangan' => trim((string) ($this->request->getPost('kode_ruangan') ?? $existing['kode_ruangan'])),
            'nama_ruangan' => trim((string) $this->request->getPost('nama_ruangan')),
            'lantai'       => trim((string) ($this->request->getPost('lantai') ?? '')) ?: null,
            'kapasitas'    => max(0, (int) $this->request->getPost('kapasitas')),
            'spesifikasi'  => trim((string) ($this->request->getPost('spesifikasi') ?? '')) ?: null,
            'foto'         => $fotoName,
            'deskripsi'    => trim((string) ($this->request->getPost('deskripsi') ?? '')) ?: null,
            'status'       => $status,
        ];

        if ($this->manageRuangan->updateRuangan($id, $updateData)) {
            // Sinkronisasi aset yang dialokasikan jika dikirim
            $rawAssetIds = $this->request->getPost('asset_ids');
            if ($rawAssetIds !== null) {
                $assetIds = is_array($rawAssetIds) ? $rawAssetIds : ($rawAssetIds === '' ? [] : explode(',', (string) $rawAssetIds));
                $this->manageRuangan->syncAssetsToRuangan($id, $assetIds);
            }

            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Data ruangan berhasil diperbarui.',
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'error',
            'message' => 'Gagal memperbarui data ruangan.',
        ]);
    }

    // ----------------------------------------------------
    // HAPUS DATA RUANGAN
    // ----------------------------------------------------
    public function deleteDetail(): ResponseInterface
    {
        $id = (int) $this->request->getPost('id');
        $existing = $this->manageRuangan->getRuanganById($id);

        if (!$existing) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Data ruangan tidak ditemukan.',
            ]);
        }

        // Lepaskan relasi aset yang ada di ruangan ini
        $this->apps->db->table('data_assets')
            ->where('ruangan_id', $id)
            ->update(['ruangan_id' => null]);

        // Hapus file fisik foto jika ada
        if (!empty($existing['foto'])) {
            $this->storage->delete((string) $existing['foto'], 'ruangan');
        }

        if ($this->manageRuangan->deleteRuangan($id)) {
            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Data ruangan berhasil dihapus.',
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'error',
            'message' => 'Gagal menghapus data ruangan.',
        ]);
    }

    // ----------------------------------------------------
    // FETCH ASET DI DALAM RUANGAN
    // ----------------------------------------------------
    public function getRoomAssets(): ResponseInterface
    {
        $ruanganId = (int) $this->request->getPost('ruangan_id');
        if ($ruanganId <= 0) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'ID Ruangan tidak valid.',
            ]);
        }

        $assets = $this->manageRuangan->getAssetsByRuanganId($ruanganId);
        foreach ($assets as &$asset) {
            $asset['foto_url'] = !empty($asset['foto']) ? $this->storage->toPublicUrl((string) $asset['foto'], 'assets') : null;
        }
        unset($asset);

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $assets,
        ]);
    }

    // ----------------------------------------------------
    // OPTIONS RUANGAN UNTUK FORM SELEKSI ASET
    // ----------------------------------------------------
    public function getOptionsRuangan(): ResponseInterface
    {
        $kantor = $this->request->getPost('kantor') ?: $this->request->getGet('kantor');
        $options = $this->manageRuangan->getOptionsRuangan($kantor);

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $options,
        ]);
    }

    // ----------------------------------------------------
    // FETCH ASET TERDAFTAR UNTUK DIALOKASIKAN KE RUANGAN
    // ----------------------------------------------------
    public function getAvailableAssets(): ResponseInterface
    {
        $kantor = $this->request->getPost('kantor') ?: $this->request->getGet('kantor');
        $assets = $this->manageRuangan->getAvailableAssets($kantor);

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $assets,
        ]);
    }

    // ----------------------------------------------------
    // ALOKASIKAN ASET KE RUANGAN (ASSIGN)
    // ----------------------------------------------------
    public function assignAsset(): ResponseInterface
    {
        $assetId   = (int) $this->request->getPost('asset_id');
        $ruanganId = (int) $this->request->getPost('ruangan_id');

        if ($assetId <= 0 || $ruanganId <= 0) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Parameter asset_id dan ruangan_id wajib diisi.',
            ]);
        }

        $ruangan = $this->manageRuangan->getRuanganById($ruanganId);
        if (!$ruangan) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Data ruangan tidak ditemukan.',
            ]);
        }

        if ($this->manageRuangan->assignAssetToRuangan($assetId, $ruanganId)) {
            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Aset BMN berhasil dialokasikan ke ruangan ' . $ruangan['nama_ruangan'] . '.',
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'error',
            'message' => 'Gagal mengalokasikan aset ke ruangan.',
        ]);
    }

    // ----------------------------------------------------
    // LEPAS ASET DARI RUANGAN (UNASSIGN)
    // ----------------------------------------------------
    public function unassignAsset(): ResponseInterface
    {
        $assetId = (int) $this->request->getPost('asset_id');

        if ($assetId <= 0) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Parameter asset_id wajib diisi.',
            ]);
        }

        if ($this->manageRuangan->unassignAssetFromRuangan($assetId)) {
            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Aset BMN berhasil dilepas dari ruangan.',
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'error',
            'message' => 'Gagal melepas aset dari ruangan.',
        ]);
    }

    // ----------------------------------------------------
    // HELPER: UPLOAD FOTO RUANGAN
    // ----------------------------------------------------
    private function handlePhotoUpload(?string $oldPhoto = null): ?string
    {
        $file = $this->request->getFile('foto');
        if ($file && $file->isValid() && !$file->hasMoved()) {
            $ext = $file->getClientExtension();
            $fileName = 'ruangan_' . date('YmdHis') . '_' . bin2hex(random_bytes(6)) . '.' . ($ext ?: 'jpg');
            $stored = $this->storage->storeUploadedFile($file, 'ruangan', [
                'customName' => $fileName,
            ]);

            if ($oldPhoto) {
                $this->storage->delete($oldPhoto, 'ruangan');
            }

            return $stored['file_name'];
        }

        return null;
    }
}
