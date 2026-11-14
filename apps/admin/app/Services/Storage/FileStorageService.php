<?php

namespace App\Services\Storage;

use CodeIgniter\HTTP\Files\UploadedFile;
use Config\Upload;

/**
 * Service terpusat untuk menyimpan, menyelesaikan path, menghapus, dan membentuk URL file upload.
 */
class FileStorageService
{
    private Upload $config;

    public function __construct(?Upload $config = null)
    {
        $this->config = $config ?? config(Upload::class);
    }

    public function getRootPath(): string
    {
        return $this->config->rootPath;
    }

    public function getPublicRootPath(): string
    {
        return $this->config->rootPath . 'public' . DIRECTORY_SEPARATOR;
    }

    public function getPrivateRootPath(): string
    {
        return $this->config->rootPath . 'private' . DIRECTORY_SEPARATOR;
    }

    /**
     * @return array<string, mixed>
     */
    public function getModuleConfig(string $module): array
    {
        if (!isset($this->config->modules[$module])) {
            throw new \InvalidArgumentException("Modul upload '{$module}' tidak terdaftar.");
        }

        return $this->config->modules[$module];
    }

    /**
     * Simpan file unggahan multipart ke folder terpusat sesuai konfigurasi modul.
     *
     * @param array<string, mixed> $options
     * @return array<string, mixed>
     */
    public function storeUploadedFile(UploadedFile $file, string $module, array $options = []): array
    {
        if (!$file->isValid() || $file->hasMoved()) {
            throw new \RuntimeException('File tidak valid atau sudah dipindahkan.');
        }

        $mod = $this->getModuleConfig($module);
        $maxKb = (int) ($options['maxSizeKb'] ?? $mod['maxSizeKb'] ?? 2048);
        if ($file->getSizeByUnit('kb') > $maxKb) {
            $maxMb = $maxKb >= 1024 ? round($maxKb / 1024, 1) . ' MB' : $maxKb . ' KB';
            throw new \RuntimeException("Ukuran file melebihi batas maksimal {$maxMb}.");
        }

        $ext = strtolower((string) ($file->getClientExtension() ?: $file->guessExtension()));
        $allowedExt = $mod['allowedExtensions'] ?? [];
        if (!empty($allowedExt) && !in_array($ext, $allowedExt, true)) {
            throw new \RuntimeException('Ekstensi file tidak diizinkan (' . $ext . ').');
        }

        $mimeType = strtolower((string) $file->getMimeType());
        $allowedMimes = $mod['allowedMimes'] ?? [];
        if (!empty($allowedMimes) && !in_array($mimeType, $allowedMimes, true)) {
            throw new \RuntimeException('Format file tidak didukung (' . $mimeType . ').');
        }

        $visibility = $mod['visibility'] === 'private' ? 'private' : 'public';
        $baseSubDir = trim((string) ($mod['subDir'] ?? $module), '/\\');
        $nestedSubDir = trim(str_replace('\\', '/', (string) ($options['subDir'] ?? '')), '/');
        $fullSubDir = $nestedSubDir !== '' ? ($baseSubDir . '/' . $nestedSubDir) : $baseSubDir;

        $absDir = $this->ensureDirectory($visibility . '/' . $fullSubDir);
        $originalName = $file->getClientName();
        $customName = isset($options['customName']) ? basename((string) $options['customName']) : null;

        $convertWebp = (bool) ($options['convertToWebp'] ?? $mod['convertToWebp'] ?? false);
        $fallbackOriginal = (bool) ($options['fallbackOriginal'] ?? $mod['fallbackOriginal'] ?? true);
        $webpQuality = (int) ($options['webpQuality'] ?? $mod['webpQuality'] ?? 80);

        if ($convertWebp) {
            $baseName = $customName !== null
                ? pathinfo($customName, PATHINFO_FILENAME)
                : pathinfo($file->getRandomName(), PATHINFO_FILENAME);
            $webpName = $baseName . '.webp';
            $absTarget = $absDir . DIRECTORY_SEPARATOR . $webpName;

            try {
                \Config\Services::image()
                    ->withFile($file->getTempName())
                    ->convert(IMAGETYPE_WEBP)
                    ->save($absTarget, $webpQuality);

                $savedName = $webpName;
                $savedExt = 'webp';
                $mimeType = 'image/webp';
            } catch (\Throwable $e) {
                if (!$fallbackOriginal) {
                    throw new \RuntimeException('Gagal mengonversi gambar ke WebP: ' . $e->getMessage(), 0, $e);
                }
                $savedName = $customName ?? $file->getRandomName();
                $file->move($absDir, $savedName, true);
                $savedExt = strtolower((string) pathinfo($savedName, PATHINFO_EXTENSION));
            }
        } else {
            $savedName = $customName ?? $file->getRandomName();
            $file->move($absDir, $savedName, true);
            $savedExt = strtolower((string) pathinfo($savedName, PATHINFO_EXTENSION));
        }

        $absPath = $absDir . DIRECTORY_SEPARATOR . $savedName;
        if (!is_file($absPath)) {
            throw new \RuntimeException('Berkas gagal disimpan ke penyimpanan terpusat.');
        }

        return $this->buildMetadata(
            $module,
            $visibility,
            $fullSubDir,
            $savedName,
            $originalName,
            $savedExt,
            $mimeType,
            $absPath
        );
    }

    /**
     * Simpan payload biner (mis. hasil decode Base64 atau PDF render) ke folder terpusat.
     *
     * @return array<string, mixed>
     */
    public function storeBinary(string $binary, string $module, string $fileName, string $subDir = ''): array
    {
        $mod = $this->getModuleConfig($module);
        $visibility = $mod['visibility'] === 'private' ? 'private' : 'public';
        $baseSubDir = trim((string) ($mod['subDir'] ?? $module), '/\\');
        $nestedSubDir = trim(str_replace('\\', '/', $subDir), '/');
        $fullSubDir = $nestedSubDir !== '' ? ($baseSubDir . '/' . $nestedSubDir) : $baseSubDir;

        $absDir = $this->ensureDirectory($visibility . '/' . $fullSubDir);
        $safeName = basename($fileName);
        $absPath = $absDir . DIRECTORY_SEPARATOR . $safeName;

        if (@file_put_contents($absPath, $binary) === false) {
            throw new \RuntimeException('Gagal menyimpan berkas biner ke penyimpanan terpusat.');
        }

        $ext = strtolower((string) pathinfo($safeName, PATHINFO_EXTENSION));
        $mimeType = $ext === 'pdf' ? 'application/pdf' : ($ext === 'png' ? 'image/png' : 'application/octet-stream');

        return $this->buildMetadata(
            $module,
            $visibility,
            $fullSubDir,
            $safeName,
            $safeName,
            $ext,
            $mimeType,
            $absPath
        );
    }

    /**
     * Pastikan direktori sub-modul ada dan mengembalikan path absolut tanpa trailing slash.
     */
    public function ensureDirectory(string $relativeDir): string
    {
        $clean = trim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relativeDir), DIRECTORY_SEPARATOR);
        $abs = rtrim($this->config->rootPath, DIRECTORY_SEPARATOR) . ($clean !== '' ? DIRECTORY_SEPARATOR . $clean : '');
        if (!is_dir($abs) && !@mkdir($abs, 0775, true) && !is_dir($abs)) {
            throw new \RuntimeException("Direktori upload tidak dapat dibuat: {$abs}");
        }

        return $abs;
    }

    /**
     * Selesaikan path fisik secara aman (mendukung path terpusat baru maupun legacy fallback).
     */
    public function resolveAbsolutePath(?string $storedPath, ?string $module = null): ?string
    {
        $raw = trim((string) $storedPath);
        if ($raw === '' || str_contains($raw, "\0")) {
            return null;
        }

        $norm = ltrim(str_replace('\\', '/', $raw), '/');
        $candidates = [];

        $publicUrlPrefix = trim($this->config->publicUrlPrefix, '/');
        if ($publicUrlPrefix !== '' && str_starts_with($norm, $publicUrlPrefix . '/')) {
            $sub = substr($norm, strlen($publicUrlPrefix . '/'));
            $candidates[] = $this->getPublicRootPath() . str_replace('/', DIRECTORY_SEPARATOR, $sub);
        }

        if (str_starts_with($norm, 'public/') || str_starts_with($norm, 'private/')) {
            $candidates[] = $this->config->rootPath . str_replace('/', DIRECTORY_SEPARATOR, $norm);
        }

        if (str_starts_with($norm, 'apps/assets/uploads/')) {
            $sub = substr($norm, strlen('apps/assets/uploads/'));
            $candidates[] = $this->getPublicRootPath() . str_replace('/', DIRECTORY_SEPARATOR, $sub);
            $candidates[] = FCPATH . str_replace('/', DIRECTORY_SEPARATOR, $norm);
        }

        if (str_starts_with($norm, 'uploads/avatars/')) {
            $sub = substr($norm, strlen('uploads/'));
            $candidates[] = $this->getPublicRootPath() . str_replace('/', DIRECTORY_SEPARATOR, $sub);
            $candidates[] = FCPATH . str_replace('/', DIRECTORY_SEPARATOR, $norm);
        }

        if (str_starts_with($norm, 'uploads/pnbp/') || str_starts_with($norm, 'uploads/signatures/')) {
            $sub = substr($norm, strlen('uploads/'));
            $candidates[] = $this->getPrivateRootPath() . str_replace('/', DIRECTORY_SEPARATOR, $sub);
            $candidates[] = $this->config->rootPath . str_replace('/', DIRECTORY_SEPARATOR, $sub);
        }

        // Nama file polos + hint modul (mis. data_assets.foto atau excel)
        if ($module !== null && isset($this->config->modules[$module]) && !str_contains($norm, '/')) {
            $mod = $this->config->modules[$module];
            $vis = $mod['visibility'] === 'private' ? 'private' : 'public';
            $subDir = trim((string) $mod['subDir'], '/');
            $candidates[] = $this->config->rootPath . $vis . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $subDir . '/' . $norm);

            if ($module === 'assets') {
                $candidates[] = FCPATH . 'apps' . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . $norm;
            } elseif ($module === 'excel') {
                $candidates[] = ROOTPATH . 'public' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'excel' . DIRECTORY_SEPARATOR . $norm;
            }
        }

        // Path relatif langsung di bawah root terpusat
        $candidates[] = $this->config->rootPath . str_replace('/', DIRECTORY_SEPARATOR, $norm);

        $allowedRoots = array_filter([
            realpath($this->config->rootPath),
            realpath(rtrim(WRITEPATH, '/\\') . DIRECTORY_SEPARATOR . 'uploads'),
            realpath(FCPATH . 'uploads'),
            realpath(FCPATH . 'apps' . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'uploads'),
        ]);

        foreach ($candidates as $cand) {
            $real = realpath($cand);
            if ($real === false || !is_file($real)) {
                continue;
            }
            foreach ($allowedRoots as $allowed) {
                if (str_starts_with($real, $allowed . DIRECTORY_SEPARATOR) || $real === $allowed) {
                    return $real;
                }
            }
        }

        return null;
    }

    /**
     * Hapus file fisik secara aman bila ditemukan.
     */
    public function delete(?string $storedPath, ?string $module = null): bool
    {
        $abs = $this->resolveAbsolutePath($storedPath, $module);
        if ($abs !== null && is_file($abs)) {
            return @unlink($abs);
        }

        return false;
    }

    /**
     * Ubah nilai path DB (format baru maupun legacy) menjadi URL publik `/media/...`.
     */
    public function toPublicUrl(?string $storedPath, ?string $module = null): ?string
    {
        $raw = trim((string) $storedPath);
        if ($raw === '' || strtolower($raw) === 'user.jpg') {
            return null;
        }
        if (str_starts_with($raw, 'http://') || str_starts_with($raw, 'https://')) {
            return $raw;
        }

        $norm = ltrim(str_replace('\\', '/', $raw), '/');
        $prefix = trim($this->config->publicUrlPrefix, '/');

        if (str_starts_with($norm, 'private/') || str_starts_with($norm, 'uploads/pnbp/') || str_starts_with($norm, 'uploads/signatures/')) {
            return null;
        }
        if (str_starts_with($norm, $prefix . '/')) {
            return '/' . $norm;
        }
        if (str_starts_with($norm, 'public/')) {
            return '/' . $prefix . '/' . substr($norm, strlen('public/'));
        }
        if (str_starts_with($norm, 'apps/assets/uploads/')) {
            return '/' . $prefix . '/' . substr($norm, strlen('apps/assets/uploads/'));
        }
        if (str_starts_with($norm, 'uploads/avatars/')) {
            return '/' . $prefix . '/' . substr($norm, strlen('uploads/'));
        }
        if (!str_contains($norm, '/') && $module !== null && isset($this->config->modules[$module])) {
            $mod = $this->config->modules[$module];
            if (($mod['visibility'] ?? 'public') === 'public') {
                return '/' . $prefix . '/' . trim((string) $mod['subDir'], '/') . '/' . $norm;
            }
        }

        return '/' . $norm;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMetadata(
        string $module,
        string $visibility,
        string $fullSubDir,
        string $savedName,
        string $originalName,
        string $ext,
        string $mimeType,
        string $absPath
    ): array {
        $relativePath = $visibility . '/' . $fullSubDir . '/' . $savedName;
        $prefix = trim($this->config->publicUrlPrefix, '/');
        $publicDirPath = $visibility === 'public' ? ($prefix . '/' . $fullSubDir) : null;
        $publicPath = $visibility === 'public' ? ($prefix . '/' . $fullSubDir . '/' . $savedName) : null;

        return [
            'module'        => $module,
            'visibility'    => $visibility,
            'file_name'     => $savedName,
            'original_name' => $originalName,
            'ext'           => $ext,
            'size'          => @filesize($absPath) ?: 0,
            'mime_type'     => $mimeType,
            'checksum'      => @hash_file('sha256', $absPath) ?: null,
            'dir_path'      => $publicDirPath ?? ($visibility . '/' . $fullSubDir),
            'relative_path' => $relativePath,
            'public_path'   => $publicPath,
            'url'           => $publicPath !== null ? ('/' . $publicPath) : null,
            'abs_path'      => $absPath,
        ];
    }
}
