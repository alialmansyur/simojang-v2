<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Libraries\DataTablesLib;
use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\ManageAssetsModel;

class ManageAssetsController extends BaseController
{
    protected $apps;
    protected $manageAssets;
    protected $dataTables;

    public function __construct()
    {
        $this->apps         = new AppsModel();
        $this->manageAssets = new ManageAssetsModel();
        $this->dataTables   = new DataTablesLib();
        helper(['form', 'url']);
    }



    public function getCategoriesApi()
    {
        $categories = $this->manageAssets->getCategories();
        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $categories,
        ]);
    }



    // ----------------------------------------------------
    // CATEGORY CRUD
    // ----------------------------------------------------
    public function storeCategory()
    {
        $rules = [
            'name' => [
                'rules'  => 'required|min_length[2]|max_length[255]',
                'errors' => [
                    'required'   => 'Nama kategori wajib diisi.',
                    'min_length' => 'Nama kategori minimal 2 karakter.',
                    'max_length' => 'Nama kategori maksimal 255 karakter.',
                ],
            ],
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => implode(' ', $this->validator->getErrors()),
            ]);
        }

        $name = trim((string) $this->request->getPost('name'));

        $data = [
            'name' => $name,
        ];

        if ($this->manageAssets->insertCategory($data)) {
            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Kategori asset berhasil ditambahkan.',
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'error',
            'message' => 'Gagal menambahkan kategori asset.',
        ]);
    }

    public function updateCategory()
    {
        $rules = [
            'uid' => [
                'rules'  => 'required',
                'errors' => ['required' => 'UID kategori tidak valid.'],
            ],
            'name' => [
                'rules'  => 'required|min_length[2]|max_length[255]',
                'errors' => [
                    'required'   => 'Nama kategori wajib diisi.',
                    'min_length' => 'Nama kategori minimal 2 karakter.',
                    'max_length' => 'Nama kategori maksimal 255 karakter.',
                ],
            ],
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => implode(' ', $this->validator->getErrors()),
            ]);
        }

        $uid  = (string) $this->request->getPost('uid');
        $name = trim((string) $this->request->getPost('name'));

        $existing = $this->manageAssets->getCategoryByUid($uid);
        if (!$existing) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Kategori tidak ditemukan.',
            ]);
        }

        $data = ['name' => $name];

        if ($this->manageAssets->updateCategoryByUid($uid, $data)) {
            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Kategori asset berhasil diperbarui.',
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'error',
            'message' => 'Gagal memperbarui kategori asset.',
        ]);
    }

    public function getCategory()
    {
        $uid = (string) $this->request->getPost('uid');
        if (!$uid) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'UID tidak valid.',
            ]);
        }

        $category = $this->manageAssets->getCategoryByUid($uid);
        if ($category) {
            return $this->response->setJSON([
                'status' => 'success',
                'data'   => $category,
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'error',
            'message' => 'Kategori tidak ditemukan.',
        ]);
    }

    public function removeCategory()
    {
        $uid = (string) $this->request->getPost('uid');
        if (!$uid) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'UID kategori tidak valid.',
            ]);
        }

        $category = $this->manageAssets->getCategoryByUid($uid);
        if (!$category) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Kategori tidak ditemukan.',
            ]);
        }

        // Cek relasi item aset
        $totalAssets = $this->manageAssets->countAssetsByCategoryUid($uid);
        if ($totalAssets > 0) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => "Kategori \"{$category['name']}\" tidak dapat dihapus karena masih memuat {$totalAssets} item aset. Hapus semua item terlebih dahulu.",
            ]);
        }

        if ($this->manageAssets->deleteCategoryByUid($uid)) {
            return $this->response->setJSON([
                'status'  => 'success',
                'message' => 'Kategori berhasil dihapus.',
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'error',
            'message' => 'Gagal menghapus kategori.',
        ]);
    }

    // ----------------------------------------------------
    // ASSET DETAIL CRUD & DATATABLE
    // ----------------------------------------------------
    public function getData()
    {
        $categoryUid = $this->request->getPost('category_uid')
            ?: $this->request->getPost('category_id')
            ?: $this->request->getPost('category')
            ?: $this->request->getPost('kategori');

        $builder = $this->manageAssets->getBuilder('detail', $categoryUid);
        $columns = $this->manageAssets->getColumns('detail');
        $result  = $this->dataTables->render($builder, $columns);
        if (!empty($result['data']) && is_array($result['data'])) {
            $storage = new \App\Services\Storage\FileStorageService();
            foreach ($result['data'] as &$row) {
                $row['foto_url'] = !empty($row['foto']) ? $storage->toPublicUrl((string) $row['foto'], 'assets') : null;
            }
            unset($row);
        }

        return $this->response->setJSON($result);
    }

    public function getSummary()
    {
        $categoryUid = $this->request->getPost('category_uid')
            ?: $this->request->getPost('category_id')
            ?: $this->request->getPost('category')
            ?: $this->request->getPost('kategori');

        return $this->response->setJSON([
            'status'  => 'success',
            'summary' => $this->manageAssets->getSummary($categoryUid),
        ]);
    }

    public function storeDetail()
    {
        $rules = [
            'kode' => [
                'rules'  => 'required|min_length[2]|max_length[100]',
                'errors' => [
                    'required'   => 'Kode asset wajib diisi.',
                    'min_length' => 'Kode asset minimal 2 karakter.',
                    'max_length' => 'Kode asset maksimal 100 karakter.',
                ],
            ],
            'uraian' => [
                'rules'  => 'required|min_length[2]|max_length[500]',
                'errors' => [
                    'required'   => 'Uraian asset wajib diisi.',
                    'min_length' => 'Uraian asset minimal 2 karakter.',
                    'max_length' => 'Uraian asset maksimal 500 karakter.',
                ],
            ],
            'satuan' => [
                'rules'  => 'required|max_length[50]',
                'errors' => [
                    'required'   => 'Satuan wajib diisi.',
                    'max_length' => 'Satuan maksimal 50 karakter.',
                ],
            ],
            'qty' => [
                'rules'  => 'required|numeric',
                'errors' => [
                    'required' => 'Qty wajib diisi.',
                    'numeric'  => 'Qty harus berupa angka yang valid.',
                ],
            ],
        ];

        // Format qty jika user input koma (e.g., "10,5")
        $rawQty = $this->request->getPost('qty');
        $normalizedQty = str_replace(',', '.', (string) $rawQty);
        $_POST['qty'] = $normalizedQty;

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => implode(' ', $this->validator->getErrors()),
            ]);
        }

        $categoryUid = (string) (
            $this->request->getPost('category_uid')
            ?: $this->request->getPost('category_id')
            ?: $this->request->getPost('category')
            ?: ''
        );

        $category = null;
        if (!empty($categoryUid)) {
            $category = $this->manageAssets->getCategoryByUid($categoryUid);
            if (!$category && is_numeric($categoryUid)) {
                $category = $this->manageAssets->getCategoryById((int) $categoryUid);
            }
        }

        // Fallback default category jika tidak ada
        if (!$category) {
            $allCats = $this->manageAssets->getCategories();
            if (!empty($allCats)) {
                $category = $allCats[0];
            }
        }

        if (!$category) {
            return $this->response->setJSON(['status' => 'error', 'message' => 'Kategori asset tidak ditemukan.']);
        }

        // Sanitasi nilai perolehan (convert ke bentuk angka murni integer/float)
        $rawNilai = (string) $this->request->getPost('nilai_perolehan');
        $cleanNilai = preg_replace('/[^\d]/', '', $rawNilai);
        $nilaiPerolehan = !empty($cleanNilai) ? (float) $cleanNilai : 0.00;

        // Kondisi
        $kondisiInput = (string) $this->request->getPost('kondisi');
        $kondisi = in_array($kondisiInput, ['Baik', 'Rusak Ringan', 'Rusak Berat'], true) ? $kondisiInput : 'Baik';

        // Area
        $areaInput = (string) $this->request->getPost('area');
        $area = in_array($areaInput, ['Kantor Regional III BKN', 'UPT Bandung', 'UPT Serang'], true) ? $areaInput : 'Kantor Regional III BKN';

        // Tahun perolehan
        $rawTahun = $this->request->getPost('tahun_perolehan');
        $tahun = (!empty($rawTahun) && is_numeric($rawTahun)) ? (int) $rawTahun : null;

        // Upload foto
        $fotoName = null;
        try {
            $fotoName = $this->handlePhotoUpload();
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal mengunggah foto asset.',
                $e instanceof \RuntimeException ? 422 : 500,
                'ManageAssetsController::saveDetail'
            );
        }

        $rawRuangan = $this->request->getPost('ruangan_id');
        $ruanganId = (!empty($rawRuangan) && is_numeric($rawRuangan)) ? (int) $rawRuangan : null;

        $data = [
            'category_id'     => $category['id'],
            'ruangan_id'      => $ruanganId,
            'kode'            => trim((string) $this->request->getPost('kode')),
            'subcode'         => trim((string) ($this->request->getPost('subcode') ?? '')) ?: null,
            'uraian'          => trim((string) $this->request->getPost('uraian')),
            'satuan'          => trim((string) $this->request->getPost('satuan')),
            'qty'             => (float) $normalizedQty,
            'foto'            => $fotoName,
            'kondisi'         => $kondisi,
            'area'            => $area,
            'lokasi'          => trim((string) ($this->request->getPost('lokasi') ?? '')) ?: null,
            'tahun_perolehan' => $tahun,
            'nilai_perolehan' => $nilaiPerolehan,
            'keterangan'      => trim((string) ($this->request->getPost('keterangan') ?? '')) ?: null,
        ];

        if ($this->manageAssets->insertDetail($data)) {
            return $this->response->setJSON(['status' => 'success', 'message' => 'Data asset berhasil disimpan.']);
        }

        return $this->response->setJSON(['status' => 'error', 'message' => 'Gagal menyimpan data asset.']);
    }

    public function updateDetail()
    {
        $rawQty = $this->request->getPost('qty');
        $normalizedQty = str_replace(',', '.', (string) $rawQty);
        $_POST['qty'] = $normalizedQty;

        $rules = [
            'id' => [
                'rules'  => 'required|is_natural_no_zero',
                'errors' => ['required' => 'ID data tidak valid.', 'is_natural_no_zero' => 'ID data tidak valid.'],
            ],
            'kode' => [
                'rules'  => 'required|min_length[2]|max_length[100]',
                'errors' => [
                    'required'   => 'Kode asset wajib diisi.',
                    'min_length' => 'Kode asset minimal 2 karakter.',
                    'max_length' => 'Kode asset maksimal 100 karakter.',
                ],
            ],
            'uraian' => [
                'rules'  => 'required|min_length[2]|max_length[500]',
                'errors' => [
                    'required'   => 'Uraian asset wajib diisi.',
                    'min_length' => 'Uraian asset minimal 2 karakter.',
                    'max_length' => 'Uraian asset maksimal 500 karakter.',
                ],
            ],
            'satuan' => [
                'rules'  => 'required|max_length[50]',
                'errors' => [
                    'required'   => 'Satuan wajib diisi.',
                    'max_length' => 'Satuan maksimal 50 karakter.',
                ],
            ],
            'qty' => [
                'rules'  => 'required|numeric',
                'errors' => [
                    'required' => 'Qty wajib diisi.',
                    'numeric'  => 'Qty harus berupa angka yang valid.',
                ],
            ],
        ];

        if (!$this->validate($rules)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => implode(' ', $this->validator->getErrors()),
            ]);
        }

        $id = (int) $this->request->getPost('id');
        $existing = $this->manageAssets->getDetailById($id);
        if (!$existing) {
            return $this->response->setJSON(['status' => 'error', 'message' => 'Data asset tidak ditemukan.']);
        }

        // Sanitasi nilai perolehan (convert ke bentuk angka murni integer/float)
        $rawNilai = (string) $this->request->getPost('nilai_perolehan');
        $cleanNilai = preg_replace('/[^\d]/', '', $rawNilai);
        $nilaiPerolehan = !empty($cleanNilai) ? (float) $cleanNilai : 0.00;

        // Kondisi
        $kondisiInput = (string) $this->request->getPost('kondisi');
        $kondisi = in_array($kondisiInput, ['Baik', 'Rusak Ringan', 'Rusak Berat'], true) ? $kondisiInput : ($existing['kondisi'] ?? 'Baik');

        // Area
        $areaInput = (string) $this->request->getPost('area');
        $area = in_array($areaInput, ['Kantor Regional III BKN', 'UPT Bandung', 'UPT Serang'], true) ? $areaInput : ($existing['area'] ?? 'Kantor Regional III BKN');

        // Tahun perolehan
        $rawTahun = $this->request->getPost('tahun_perolehan');
        $tahun = (!empty($rawTahun) && is_numeric($rawTahun)) ? (int) $rawTahun : null;

        $rawRuangan = $this->request->getPost('ruangan_id');
        $ruanganId = (!empty($rawRuangan) && is_numeric($rawRuangan)) ? (int) $rawRuangan : null;

        $data = [
            'ruangan_id'      => $ruanganId,
            'kode'            => trim((string) $this->request->getPost('kode')),
            'subcode'         => trim((string) ($this->request->getPost('subcode') ?? '')) ?: null,
            'uraian'          => trim((string) $this->request->getPost('uraian')),
            'satuan'          => trim((string) $this->request->getPost('satuan')),
            'qty'             => (float) $normalizedQty,
            'kondisi'         => $kondisi,
            'area'            => $area,
            'lokasi'          => trim((string) ($this->request->getPost('lokasi') ?? '')) ?: null,
            'tahun_perolehan' => $tahun,
            'nilai_perolehan' => $nilaiPerolehan,
            'keterangan'      => trim((string) ($this->request->getPost('keterangan') ?? '')) ?: null,
        ];

        // Update category if provided
        $categoryUid = (string) (
            $this->request->getPost('category_uid')
            ?: $this->request->getPost('category_id')
            ?: $this->request->getPost('category')
            ?: ''
        );
        if (!empty($categoryUid)) {
            $cat = $this->manageAssets->getCategoryByUid($categoryUid);
            if (!$cat && is_numeric($categoryUid)) {
                $cat = $this->manageAssets->getCategoryById((int) $categoryUid);
            }
            if ($cat) {
                $data['category_id'] = $cat['id'];
            }
        }

        // Handle penghapusan foto jika diminta user
        if ($this->request->getPost('remove_foto') === '1' && !empty($existing['foto'])) {
            (new \App\Services\Storage\FileStorageService())->delete((string) $existing['foto'], 'assets');
            $data['foto'] = null;
        }

        // Handle upload foto baru
        try {
            $newFoto = $this->handlePhotoUpload($existing['foto'] ?? null);
            if ($newFoto !== null) {
                $data['foto'] = $newFoto;
            }
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal mengunggah foto asset.',
                $e instanceof \RuntimeException ? 422 : 500,
                'ManageAssetsController::updateDetail'
            );
        }

        if ($this->manageAssets->updateDetail($id, $data)) {
            return $this->response->setJSON(['status' => 'success', 'message' => 'Data asset berhasil diperbarui.']);
        }

        return $this->response->setJSON(['status' => 'error', 'message' => 'Gagal memperbarui data asset.']);
    }

    public function deleteDetail()
    {
        $id = (int) $this->request->getPost('id');
        if (!$id) {
            return $this->response->setJSON(['status' => 'error', 'message' => 'ID tidak valid.']);
        }

        $existing = $this->manageAssets->getDetailById($id);
        if (!$existing) {
            return $this->response->setJSON(['status' => 'error', 'message' => 'Data asset tidak ditemukan.']);
        }

        // Hapus file foto dari disk jika ada
        if (!empty($existing['foto'])) {
            (new \App\Services\Storage\FileStorageService())->delete((string) $existing['foto'], 'assets');
        }

        if ($this->manageAssets->deleteDetail($id)) {
            return $this->response->setJSON(['status' => 'success', 'message' => 'Data asset berhasil dihapus.']);
        }

        return $this->response->setJSON(['status' => 'error', 'message' => 'Gagal menghapus data asset.']);
    }

    public function getDetail()
    {
        $id = (int) $this->request->getPost('id');
        if (!$id) {
            return $this->response->setJSON(['status' => 'error', 'message' => 'ID tidak valid.']);
        }

        $data = $this->manageAssets->getDetailById($id);
        if ($data) {
            $data['foto_url'] = !empty($data['foto'])
                ? (new \App\Services\Storage\FileStorageService())->toPublicUrl((string) $data['foto'], 'assets')
                : null;
            return $this->response->setJSON(['status' => 'success', 'data' => $data]);
        }

        return $this->response->setJSON(['status' => 'error', 'message' => 'Data asset tidak ditemukan.']);
    }

    private function handlePhotoUpload(?string $oldPhoto = null): ?string
    {
        $file = $this->request->getFile('foto');
        if ($file && $file->isValid() && !$file->hasMoved()) {
            $ext = $file->getClientExtension();
            $fileName = 'asset_' . date('YmdHis') . '_' . bin2hex(random_bytes(6)) . '.' . ($ext ?: 'jpg');
            $storage = new \App\Services\Storage\FileStorageService();
            $stored  = $storage->storeUploadedFile($file, 'assets', [
                'customName' => $fileName,
            ]);

            if ($oldPhoto) {
                $storage->delete($oldPhoto, 'assets');
            }

            return $stored['file_name'];
        }

        return null;
    }

    public function importBatch()
    {
        $file = $this->request->getFile('file');
        if (!$file || !$file->isValid()) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Berkas Excel (.xlsx / .xls) wajib diunggah.',
            ]);
        }

        try {
            $uploader = new \App\Libraries\ExcelUploader();
            $uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows = $uploader->parseExcel($localPath);

            if (!is_array($rows) || count($rows) < 2) {
                return $this->response->setJSON([
                    'status'  => 'error',
                    'message' => 'Berkas Excel kosong atau baris data tidak ditemukan.',
                ]);
            }

            $imported = 0;
            $skipped = 0;

            foreach (array_slice($rows, 1) as $idx => $row) {
                // Kolom: [0] No, [1] Kode BMN, [2] NUP / Subcode, [3] Uraian Barang, [4] Kategori,
                // [5] Qty, [6] Satuan, [7] Kondisi, [8] Area, [9] Lokasi, [10] Tahun, [11] Nilai, [12] Keterangan
                $kode = !empty($row[1]) ? trim((string)$row[1]) : '';
                $uraian = !empty($row[3]) ? trim((string)$row[3]) : '';
                if (empty($kode) && empty($uraian)) {
                    continue;
                }

                $subcode = !empty($row[2]) ? trim((string)$row[2]) : null;
                $catName = !empty($row[4]) ? trim((string)$row[4]) : 'Peralatan dan Mesin';

                // Cari kategori atau buat otomatis bila belum ada
                $category = $this->manageAssets->getCategoryByName($catName);
                if (!$category) {
                    $category = $this->manageAssets->getCategoryByUid($catName);
                }
                if (!$category && is_numeric($catName)) {
                    $category = $this->manageAssets->getCategoryById((int)$catName);
                }
                if (!$category) {
                    $newUid = $this->manageAssets->insertCategory(['name' => $catName]);
                    $category = $this->manageAssets->getCategoryByUid($newUid);
                }

                $categoryId = $category ? $category['id'] : 1;

                $rawQty = !empty($row[5]) ? str_replace(',', '.', (string)$row[5]) : '1';
                $qty = is_numeric($rawQty) ? (float)$rawQty : 1.0;
                $satuan = !empty($row[6]) ? trim((string)$row[6]) : 'Unit';

                $kondisiRaw = !empty($row[7]) ? trim((string)$row[7]) : 'Baik';
                $kondisi = in_array($kondisiRaw, ['Baik', 'Rusak Ringan', 'Rusak Berat'], true) ? $kondisiRaw : 'Baik';

                $areaRaw = !empty($row[8]) ? trim((string)$row[8]) : 'Kantor Regional III BKN';
                $area = in_array($areaRaw, ['Kantor Regional III BKN', 'UPT Bandung', 'UPT Serang'], true) ? $areaRaw : 'Kantor Regional III BKN';

                $lokasi = !empty($row[9]) ? trim((string)$row[9]) : null;

                $rawTahun = !empty($row[10]) ? (int)$row[10] : null;
                $tahun = ($rawTahun && $rawTahun > 1900 && $rawTahun <= 2100) ? $rawTahun : null;

                $rawNilai = !empty($row[11]) ? (string)$row[11] : '0';
                $cleanNilai = preg_replace('/[^\d]/', '', $rawNilai);
                $nilaiPerolehan = !empty($cleanNilai) ? (float)$cleanNilai : 0.00;

                $keterangan = !empty($row[12]) ? trim((string)$row[12]) : null;

                $data = [
                    'category_id'     => $categoryId,
                    'kode'            => $kode ?: 'BMN-' . time() . '-' . ($idx + 1),
                    'subcode'         => $subcode,
                    'uraian'          => $uraian ?: 'Barang BMN Tanpa Uraian',
                    'satuan'          => $satuan,
                    'qty'             => $qty,
                    'kondisi'         => $kondisi,
                    'area'            => $area,
                    'lokasi'          => $lokasi,
                    'tahun_perolehan' => $tahun,
                    'nilai_perolehan' => $nilaiPerolehan,
                    'keterangan'      => $keterangan,
                ];

                if ($this->manageAssets->insertDetail($data)) {
                    $imported++;
                } else {
                    $skipped++;
                }
            }

            return $this->response->setJSON([
                'status'         => 'success',
                'message'        => "Berhasil mengimpor {$imported} item aset BMN." . ($skipped > 0 ? " ({$skipped} dilewati)" : ''),
                'total_imported' => $imported,
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal membaca berkas Excel aset BMN.',
                $e instanceof \RuntimeException ? 422 : 500,
                'ManageAssetsController::importBatch'
            );
        }
    }
}
