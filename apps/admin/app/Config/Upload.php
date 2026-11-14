<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * Konfigurasi terpusat penyimpanan file upload backend (1 folder root tunggal).
 */
class Upload extends BaseConfig
{
    /**
     * Direktori root fisik penyimpanan upload (default: apps/admin/writable/uploads/).
     */
    public string $rootPath;

    /**
     * Prefix URL publik untuk seluruh file non-sensitif (dilayani Nginx / MediaController).
     */
    public string $publicUrlPrefix = 'media';

    /**
     * Registry modul upload yang diizinkan beserta aturan validasinya.
     *
     * @var array<string, array<string, mixed>>
     */
    public array $modules = [
        'excel' => [
            'visibility'        => 'public',
            'subDir'            => 'excel',
            'maxSizeKb'         => 20480,
            'allowedExtensions' => ['xls', 'xlsx'],
            'allowedMimes'      => [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/zip',
                'application/octet-stream',
            ],
            'convertToWebp'     => false,
            'fallbackOriginal'  => true,
        ],
        'avatars' => [
            'visibility'        => 'public',
            'subDir'            => 'avatars',
            'maxSizeKb'         => 2048,
            'allowedExtensions' => ['jpg', 'jpeg', 'png', 'webp'],
            'allowedMimes'      => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            'convertToWebp'     => false,
            'fallbackOriginal'  => true,
        ],
        'gallery' => [
            'visibility'        => 'public',
            'subDir'            => 'gallery',
            'maxSizeKb'         => 2048,
            'allowedExtensions' => ['jpg', 'jpeg', 'png', 'webp'],
            'allowedMimes'      => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            'convertToWebp'     => true,
            'webpQuality'       => 80,
            'fallbackOriginal'  => false,
        ],
        'lost_and_found' => [
            'visibility'        => 'public',
            'subDir'            => 'lost_and_found',
            'maxSizeKb'         => 2048,
            'allowedExtensions' => ['jpg', 'jpeg', 'png', 'webp'],
            'allowedMimes'      => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            'convertToWebp'     => true,
            'webpQuality'       => 80,
            'fallbackOriginal'  => true,
        ],
        'assets' => [
            'visibility'        => 'public',
            'subDir'            => 'assets',
            'maxSizeKb'         => 3072,
            'allowedExtensions' => ['jpg', 'jpeg', 'png', 'webp'],
            'allowedMimes'      => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            'convertToWebp'     => false,
            'fallbackOriginal'  => true,
        ],
        'projects_progress' => [
            'visibility'        => 'public',
            'subDir'            => 'projects/progress',
            'maxSizeKb'         => 2048,
            'allowedExtensions' => ['jpg', 'jpeg', 'png', 'webp'],
            'allowedMimes'      => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            'convertToWebp'     => true,
            'webpQuality'       => 80,
            'fallbackOriginal'  => false,
        ],
        'general' => [
            'visibility'        => 'public',
            'subDir'            => 'general',
            'maxSizeKb'         => 10240,
            'allowedExtensions' => ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'xls', 'xlsx'],
            'allowedMimes'      => [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp',
                'application/pdf',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/zip',
                'application/octet-stream',
            ],
            'convertToWebp'     => false,
            'fallbackOriginal'  => true,
        ],
        'pnbp' => [
            'visibility'        => 'private',
            'subDir'            => 'pnbp',
            'maxSizeKb'         => 20480,
            'allowedExtensions' => ['pdf'],
            'allowedMimes'      => ['application/pdf', 'application/x-pdf', 'application/octet-stream'],
            'convertToWebp'     => false,
            'fallbackOriginal'  => true,
        ],
        'signatures' => [
            'visibility'        => 'private',
            'subDir'            => 'signatures',
            'maxSizeKb'         => 2048,
            'allowedExtensions' => ['png'],
            'allowedMimes'      => ['image/png'],
            'convertToWebp'     => false,
            'fallbackOriginal'  => true,
        ],
    ];

    public function __construct()
    {
        parent::__construct();

        $configuredRoot = trim((string) env('UPLOAD_ROOT_PATH', ''));
        $base = $configuredRoot !== '' ? $configuredRoot : (rtrim(WRITEPATH, '/\\') . DIRECTORY_SEPARATOR . 'uploads');
        $this->rootPath = rtrim($base, '/\\') . DIRECTORY_SEPARATOR;
    }
}
