<?php

namespace App\Controllers\Apps;

use App\Controllers\BaseController;
use App\Models\Apps\AuditLogModel;
use App\Models\Apps\RefModel;
use Throwable;

class RefApiController extends BaseController
{
    private RefModel $refModel;
    private AuditLogModel $audit;

    public function __construct()
    {
        $this->refModel = new RefModel();
        $this->audit = new AuditLogModel();
    }

    public function tables()
    {
        try {
            $userId = (int) (session()->get('userid') ?? 0);
            $data = $this->refModel->getAllowedTables($userId);
            return $this->jsonSuccess('OK', $data);
        } catch (Throwable $e) {
            log_message('error', 'RefApiController::tables gagal: {message}', ['message' => $e->getMessage()]);
            return $this->jsonError('Gagal memuat daftar tabel referensi.', 500);
        }
    }

    public function schema(string $slug = '')
    {
        $access = $this->resolveAccess($slug, 'read');
        if ($access['error'] !== null) {
            return $access['error'];
        }

        $schema = $this->refModel->getSchema($access['table']);
        return $this->jsonSuccess('OK', [
            'slug'    => $access['slug'],
            'table'   => $access['table'],
            'pk'      => $schema['pk'],
            'columns' => $schema['columns'],
        ]);
    }

    public function list(string $slug = '')
    {
        $access = $this->resolveAccess($slug, 'read');
        if ($access['error'] !== null) {
            return $access['error'];
        }

        $params = [
            'page'     => $this->request->getGet('page'),
            'per_page' => $this->request->getGet('per_page'),
            'search'   => $this->request->getGet('search'),
            'sort_by'  => $this->request->getGet('sort_by'),
            'sort_dir' => $this->request->getGet('sort_dir'),
        ];

        try {
            $result = $this->refModel->getList($access['table'], $params);
            return $this->jsonSuccess('OK', $result['rows'], $result['meta']);
        } catch (Throwable $e) {
            log_message('error', 'RefApiController::list gagal: {message}', ['message' => $e->getMessage()]);
            return $this->jsonError('Gagal memuat data referensi.', 500);
        }
    }

    public function create(string $slug = '')
    {
        $access = $this->resolveAccess($slug, 'create');
        if ($access['error'] !== null) {
            return $access['error'];
        }

        $payload = (array) $this->request->getJSON(true);
        if (empty($payload)) {
            $payload = $this->request->getPost();
        }

        try {
            $newId = $this->refModel->insertRow($access['table'], $payload);
            if ($newId <= 0) {
                return $this->jsonError('Data tidak valid atau tidak ada kolom yang bisa disimpan.', 400);
            }

            $afterRow = $this->refModel->getRowById($access['table'], (string) $access['pk'], (string) $newId);
            $this->audit->record('ref.create', $access['table'], (string) $newId, null, $afterRow ?? $payload);

            return $this->jsonSuccess('Data berhasil ditambahkan.', ['id' => $newId, 'row' => $afterRow], [], 201);
        } catch (Throwable $e) {
            log_message('error', 'RefApiController::create gagal: {message}', ['message' => $e->getMessage()]);
            return $this->jsonError('Gagal menyimpan data referensi. Silakan coba kembali.', 500);
        }
    }

    public function update(string $slug = '', string $id = '')
    {
        $access = $this->resolveAccess($slug, 'update');
        if ($access['error'] !== null) {
            return $access['error'];
        }

        $id = trim($id);
        if ($id === '') {
            return $this->jsonError('ID wajib diisi.', 400);
        }

        $payload = (array) $this->request->getJSON(true);
        if (empty($payload)) {
            $payload = $this->request->getRawInput();
        }

        try {
            $beforeRow = $this->refModel->getRowById($access['table'], (string) $access['pk'], $id);
            $ok = $this->refModel->updateRow($access['table'], (string) $access['pk'], $id, $payload);
            if (!$ok) {
                return $this->jsonError('Gagal memperbarui data referensi.', 400);
            }

            $afterRow = $this->refModel->getRowById($access['table'], (string) $access['pk'], $id);
            $this->audit->record('ref.update', $access['table'], $id, $beforeRow, $afterRow ?? $payload);

            return $this->jsonSuccess('Data berhasil diperbarui.', ['id' => $id, 'row' => $afterRow]);
        } catch (Throwable $e) {
            log_message('error', 'RefApiController::update gagal: {message}', ['message' => $e->getMessage()]);
            return $this->jsonError('Gagal memperbarui data referensi. Silakan coba kembali.', 500);
        }
    }

    public function delete(string $slug = '', string $id = '')
    {
        $access = $this->resolveAccess($slug, 'delete');
        if ($access['error'] !== null) {
            return $access['error'];
        }

        $id = trim($id);
        if ($id === '') {
            return $this->jsonError('ID wajib diisi.', 400);
        }

        try {
            $beforeRow = $this->refModel->getRowById($access['table'], (string) $access['pk'], $id);
            $ok = $this->refModel->deleteRow($access['table'], (string) $access['pk'], $id);
            if (!$ok) {
                return $this->jsonError('Gagal menghapus data referensi.', 400);
            }

            $this->audit->record('ref.delete', $access['table'], $id, $beforeRow, null);

            return $this->jsonSuccess('Data berhasil dihapus.', ['id' => $id]);
        } catch (Throwable $e) {
            log_message('error', 'RefApiController::delete gagal: {message}', ['message' => $e->getMessage()]);
            return $this->jsonError('Gagal menghapus data referensi. Silakan coba kembali.', 500);
        }
    }

    private function resolveAccess(string $slug, string $action = 'read'): array
    {
        $userId = (int) (session()->get('userid') ?? 0);
        $normalized = strtolower(trim($slug));
        if ($normalized === '') {
            return ['error' => $this->jsonError('Table slug wajib diisi.', 400)];
        }

        $table = $this->refModel->resolveTableBySlug($normalized);
        if ($table === null) {
            return ['error' => $this->jsonError('Tabel referensi tidak ditemukan.', 404)];
        }

        if (!$this->refModel->canUserAccessSlug($userId, $normalized, $action)) {
            return ['error' => $this->jsonError('Anda tidak memiliki izin akses tabel ini.', 403)];
        }

        $schema = $this->refModel->getSchema($table);
        return [
            'error' => null,
            'slug'  => $normalized,
            'table' => $table,
            'pk'    => $schema['pk'] ?? 'id',
        ];
    }

    private function jsonSuccess(string $message, $data = [], array $meta = [], int $code = 200)
    {
        return $this->response->setStatusCode($code)->setJSON([
            'status'  => true,
            'message' => $message,
            'data'    => $data,
            'meta'    => $meta,
            'errors'  => [],
        ]);
    }

    private function jsonError(string $message, int $code = 400, array $errors = [])
    {
        return $this->response->setStatusCode($code)->setJSON([
            'status'  => false,
            'message' => $message,
            'data'    => [],
            'meta'    => [],
            'errors'  => $errors,
        ]);
    }
}
