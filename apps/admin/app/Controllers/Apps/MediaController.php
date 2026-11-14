<?php

namespace App\Controllers\Apps;

use App\Controllers\BaseController;
use App\Services\Storage\FileStorageService;
use Config\Upload;

/**
 * Controller terpusat untuk endpoint general upload (/api/uploads) dan serving media publik (/media/*).
 */
class MediaController extends BaseController
{
    private FileStorageService $storage;
    private Upload $uploadConfig;

    public function __construct()
    {
        $this->uploadConfig = config(Upload::class);
        $this->storage = new FileStorageService($this->uploadConfig);
    }

    /**
     * POST /api/uploads atau POST /api/uploads/(:segment)
     * Endpoint general terproteksi JWT/RBAC untuk mengunggah berkas ke 1 folder terpusat.
     */
    public function upload(?string $moduleParam = null)
    {
        $userId = (int) (session()->get('userid') ?? 0);
        if ($userId <= 0) {
            return $this->response->setStatusCode(401)->setJSON([
                'status'  => 'error',
                'message' => 'Sesi tidak valid. Silakan masuk kembali.',
            ]);
        }

        $module = trim((string) ($moduleParam ?: $this->request->getPost('module') ?: 'general'));
        if (!isset($this->uploadConfig->modules[$module]) || $module === 'signatures') {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Modul upload tujuan tidak valid.',
            ]);
        }

        $file = $this->request->getFile('file') ?: $this->request->getFile('foto') ?: $this->request->getFile('gambar');
        if (!$file || $file->getError() === UPLOAD_ERR_NO_FILE) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Berkas unggahan wajib disertakan.',
            ]);
        }

        $subDir = preg_replace('/[^a-zA-Z0-9_\/-]/', '', (string) ($this->request->getPost('sub_dir') ?? ''));
        $subDir = trim((string) $subDir, '/');

        try {
            $stored = $this->storage->storeUploadedFile($file, $module, [
                'subDir' => $subDir,
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal mengunggah berkas ke penyimpanan.',
                $e instanceof \RuntimeException ? 422 : 500,
                'MediaController::upload'
            );
        }

        return $this->response->setStatusCode(200)->setJSON([
            'status'  => 'success',
            'message' => 'Berkas berhasil diunggah ke penyimpanan terpusat.',
            'data'    => [
                'module'        => $stored['module'],
                'visibility'    => $stored['visibility'],
                'file_name'     => $stored['file_name'],
                'original_name' => $stored['original_name'],
                'size'          => $stored['size'],
                'mime_type'     => $stored['mime_type'],
                'dir_path'      => $stored['dir_path'],
                'relative_path' => $stored['relative_path'],
                'public_path'   => $stored['public_path'],
                'url'           => $stored['url'],
            ],
        ]);
    }

    /**
     * GET /media/(:any)
     * Melayani berkas dari writable/uploads/public/* (digunakan oleh dev server; production disajikan langsung oleh Nginx).
     */
    public function servePublic(string ...$segments)
    {
        $cleanRel = trim(str_replace('\\', '/', implode('/', $segments)), '/');
        if ($cleanRel === '' || str_contains($cleanRel, '..') || str_contains($cleanRel, "\0")) {
            return $this->response->setStatusCode(404)->setBody('Not found');
        }

        $publicRoot = realpath($this->storage->getPublicRootPath());
        $targetPath = $this->storage->resolveAbsolutePath('public/' . $cleanRel);

        if ($targetPath === null || ($publicRoot !== false && !str_starts_with($targetPath, $publicRoot . DIRECTORY_SEPARATOR))) {
            // Coba fallback aman untuk file lama yang mungkin masih ada di path legacy publik
            $legacyPath = $this->storage->resolveAbsolutePath('apps/assets/uploads/' . $cleanRel);
            if ($legacyPath === null && str_starts_with($cleanRel, 'excel/')) {
                $legacyPath = $this->storage->resolveAbsolutePath('excel/' . substr($cleanRel, strlen('excel/')), 'excel');
            } elseif ($legacyPath === null && str_starts_with($cleanRel, 'avatars/')) {
                $legacyPath = $this->storage->resolveAbsolutePath('uploads/' . $cleanRel);
            }
            $targetPath = $legacyPath;
        }

        if ($targetPath === null || !is_file($targetPath)) {
            return $this->response->setStatusCode(404)->setBody('Not found');
        }

        $mime = mime_content_type($targetPath) ?: 'application/octet-stream';
        $ext  = strtolower((string) pathinfo($targetPath, PATHINFO_EXTENSION));
        if ($ext === 'webp') {
            $mime = 'image/webp';
        } elseif ($ext === 'xlsx') {
            $mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } elseif ($ext === 'xls') {
            $mime = 'application/vnd.ms-excel';
        }

        return $this->response
            ->setStatusCode(200)
            ->setHeader('Content-Type', $mime)
            ->setHeader('Content-Length', (string) filesize($targetPath))
            ->setHeader('Cache-Control', 'public, max-age=2592000')
            ->setBody((string) file_get_contents($targetPath));
    }
}
