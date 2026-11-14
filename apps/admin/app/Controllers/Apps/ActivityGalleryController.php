<?php

namespace App\Controllers\Apps;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\Apps\ActivityGalleryModel;

class ActivityGalleryController extends BaseController
{
    protected $galleryModel;

    public function __construct()
    {
        $this->galleryModel = new ActivityGalleryModel();
        helper(['form', 'url', 'filesystem']);
    }

    private function isApiOrAjaxRequest(): bool
    {
        return $this->request->isAJAX()
            || $this->request->hasHeader('Authorization')
            || str_contains($this->request->getHeaderLine('Accept'), 'application/json');
    }

    private function forbiddenResponse(): ResponseInterface
    {
        return $this->response->setStatusCode(403)->setJSON([
            'status'  => 'error',
            'message' => 'Forbidden',
        ]);
    }

    public function getTimKerja()
    {
        if (!$this->isApiOrAjaxRequest()) {
            return $this->forbiddenResponse();
        }

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $this->galleryModel->getTimKerja(),
        ]);
    }

    public function getLayanan()
    {
        if (!$this->isApiOrAjaxRequest()) {
            return $this->forbiddenResponse();
        }

        $timkerjaId = $this->request->getPost('timkerja_id');
        if (empty($timkerjaId)) {
            return $this->response->setJSON(['status' => 'success', 'data' => []]);
        }

        $layanan = $this->galleryModel->getLayananByTimKerja($timkerjaId);

        return $this->response->setJSON(['status' => 'success', 'data' => $layanan]);
    }

    private function formatGalleryRows(array $rows): array
    {
        $monthLabels = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $storage = new \App\Services\Storage\FileStorageService();
        $formatted = [];

        foreach ($rows as $row) {
            $date = new \DateTime($row['tanggal_kegiatan']);
            $monthName = $monthLabels[(int) $date->format('n') - 1];
            $formattedDate = $date->format('d') . ' ' . $monthName . ' ' . $date->format('Y');

            $fileName = ltrim(str_replace('\\', '/', trim((string) ($row['file_name'] ?? ''))), '/');
            $rawDir = str_replace('\\', '/', trim((string) ($row['file_path'] ?? ''), "/\\ \t\n\r"));
            $rawDir = preg_replace('#^(?:\./)+#', '', $rawDir);
            $rawDir = preg_replace('#^public/#', '', $rawDir);

            if ($fileName === '') {
                $imgPath = '';
            } else {
                $dir = $rawDir !== '' ? $rawDir : 'media/gallery';
                $rawFull = str_ends_with($dir, '/' . $fileName) || $dir === $fileName
                    ? ltrim($dir, '/')
                    : ltrim($dir . '/' . $fileName, '/');
                $publicUrl = $storage->toPublicUrl($rawFull, 'gallery');
                $imgPath = ltrim((string) $publicUrl, '/');
            }

            $formatted[] = [
                'id'             => $row['id'],
                'uid'            => $row['uid'],
                'team_id'        => $row['timkerja_id'],
                'team_name'      => $row['team_name'] ?? 'Tidak Diketahui',
                'layanan_id'     => $row['layanan_id'],
                'layanan_name'   => $row['nama_layanan'] ?? '',
                'title'          => $row['judul'],
                'date'           => $row['tanggal_kegiatan'],
                'date_formatted' => $formattedDate,
                'desc'           => $row['deskripsi'],
                'img'            => $imgPath !== '' ? base_url($imgPath) : '',
                'img_path'       => $imgPath,
                'file_path'      => $rawDir !== '' ? $rawDir : 'media/gallery',
                'file_name'      => $fileName,
            ];
        }

        return $formatted;
    }

    public function getData()
    {
        if (!$this->isApiOrAjaxRequest()) {
            return $this->forbiddenResponse();
        }

        $search = $this->request->getPost('search');
        $timkerja = $this->request->getPost('timkerja');
        $bulan = $this->request->getPost('bulan');
        $months = $this->request->getPost('months');
        $perPageRaw = $this->request->getPost('per_page');

        if ($perPageRaw !== null && $perPageRaw !== '') {
            $perPage = min(100, max(1, (int) $perPageRaw));
            $page = max(1, (int) ($this->request->getPost('page') ?? 1));

            $paged = $this->galleryModel->getPaginatedData($search, $timkerja, $bulan, $months, $page, $perPage);
            $summary = $this->galleryModel->getCategorySummary($search, $bulan, $months);

            return $this->response->setJSON([
                'status'     => 'success',
                'data'       => $this->formatGalleryRows($paged['rows']),
                'pagination' => [
                    'total'       => $paged['total'],
                    'page'        => $paged['page'],
                    'per_page'    => $paged['per_page'],
                    'total_pages' => $paged['total_pages'],
                ],
                'summary'    => $summary,
            ]);
        }

        $data = $this->galleryModel->getAllData($search, $timkerja, $bulan, $months);

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $this->formatGalleryRows($data),
        ]);
    }

    public function store()
    {
        if (!$this->isApiOrAjaxRequest()) {
            return $this->forbiddenResponse();
        }

        $id = $this->request->getPost('id');
        
        $rules = [
            'timkerja' => 'required',
            'layanan'  => 'permit_empty',
            'tanggal'  => 'required|valid_date',
            'judul'    => 'required',
            'deskripsi'=> 'required'
        ];

        // Only require foto if it's a new insert
        if (empty($id)) {
            $rules['foto'] = 'uploaded[foto]|max_size[foto,2048]|is_image[foto]|mime_in[foto,image/jpg,image/jpeg,image/png,image/webp]';
        } else {
            // Allow empty if updating without changing photo, but validate if exists
            $file = $this->request->getFile('foto');
            if ($file && $file->isValid()) {
                $rules['foto'] = 'max_size[foto,2048]|is_image[foto]|mime_in[foto,image/jpg,image/jpeg,image/png,image/webp]';
            }
        }

        if (!$this->validate($rules)) {
            $errors = $this->validator->getErrors();
            $firstError = reset($errors);
            return $this->response->setJSON(['status' => 'error', 'message' => $firstError]);
        }

        $layananId = $this->request->getPost('layanan');
        $dbData = [
            'timkerja_id'      => $this->request->getPost('timkerja'),
            'layanan_id'       => !empty($layananId) ? $layananId : null,
            'tanggal_kegiatan' => $this->request->getPost('tanggal'),
            'judul'            => $this->request->getPost('judul'),
            'deskripsi'        => $this->request->getPost('deskripsi'),
        ];

        $file = $this->request->getFile('foto');
        if ($file && $file->isValid() && !$file->hasMoved()) {
            $storage = new \App\Services\Storage\FileStorageService();
            try {
                $stored = $storage->storeUploadedFile($file, 'gallery');

                $dbData['file_name']          = $stored['file_name'];
                $dbData['file_original_name'] = $stored['original_name'];
                $dbData['file_size']          = $stored['size'];
                $dbData['file_ext']           = '.' . $stored['ext'];
                $dbData['file_path']          = $stored['dir_path'];

                if (!empty($id)) {
                    $oldData = $this->galleryModel->find($id);
                    if ($oldData && !empty($oldData['file_name'])) {
                        $oldTarget = !empty($oldData['file_path'])
                            ? rtrim((string) $oldData['file_path'], '/') . '/' . ltrim((string) $oldData['file_name'], '/')
                            : (string) $oldData['file_name'];
                        $storage->delete($oldTarget, 'gallery');
                    }
                }
            } catch (\Throwable $e) {
                return $this->apiException(
                    $e,
                    $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal mengunggah dokumentasi kegiatan.',
                    $e instanceof \RuntimeException ? 422 : 500,
                    'ActivityGalleryController::save'
                );
            }
        }

        if (empty($id)) {
            $dbData['uid'] = md5(uniqid(rand(), true));
            $this->galleryModel->insert($dbData);
            $message = 'Data dokumentasi kegiatan berhasil ditambahkan.';
        } else {
            $this->galleryModel->update($id, $dbData);
            $message = 'Data dokumentasi kegiatan berhasil diperbarui.';
        }

        return $this->response->setJSON(['status' => 'success', 'message' => $message]);
    }

    public function delete()
    {
        if (!$this->isApiOrAjaxRequest()) {
            return $this->forbiddenResponse();
        }

        $id = $this->request->getPost('id');
        $oldData = $this->galleryModel->find($id);
        
        if ($oldData) {
            if (!empty($oldData['file_name'])) {
                $oldTarget = !empty($oldData['file_path'])
                    ? rtrim((string) $oldData['file_path'], '/') . '/' . ltrim((string) $oldData['file_name'], '/')
                    : (string) $oldData['file_name'];
                (new \App\Services\Storage\FileStorageService())->delete($oldTarget, 'gallery');
            }
            $this->galleryModel->delete($id);
            return $this->response->setJSON(['status' => 'success', 'message' => 'Dokumentasi berhasil dihapus.']);
        }

        return $this->response->setJSON(['status' => 'error', 'message' => 'Data tidak ditemukan.']);
    }
}

