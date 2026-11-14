<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

use App\Libraries\DataTablesLib;
use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\LostAndFoundModel;

class LostAndFoundController extends BaseController
{
    protected $apps;
    protected $lostFoundModel;
    protected $dataTables;

    public function __construct()
    {
        $this->apps = new AppsModel();
        $this->lostFoundModel = new LostAndFoundModel();
        $this->dataTables = new DataTablesLib();        
    }



    public function storeData()
    {
        $sess = session()->get();
        $key = $this->request->getPost('key');
        
        $rules = [
            'nama_barang'       => 'required',
            'tanggal_ditemukan' => 'required',
            'lokasi_ditemukan'  => 'required',
            'status_penyerahan' => 'required'
        ];

        if ($this->request->getPost('status_penyerahan') === 'Diserahkan') {
            $rules['tanggal_diserahkan'] = 'required';
            $rules['penerima'] = 'required';
        }

        if (!$this->validate($rules)) {
            $errorsArray = $this->validator->getErrors();
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => implode(', ', $errorsArray),
                'data'    => $this->request->getPost()
            ]);
        }

        $dataInsert = [
            'nama_barang'        => $this->request->getPost('nama_barang'),
            'tanggal_ditemukan'  => $this->request->getPost('tanggal_ditemukan'),
            'lokasi_ditemukan'   => $this->request->getPost('lokasi_ditemukan'),
            'status_penyerahan'  => $this->request->getPost('status_penyerahan'),
            'keterangan'         => $this->request->getPost('keterangan'),
            'created_by'         => $sess['username']
        ];

        if ($this->request->getPost('status_penyerahan') === 'Diserahkan') {
            $dataInsert['tanggal_diserahkan'] = $this->request->getPost('tanggal_diserahkan');
            $dataInsert['penerima'] = $this->request->getPost('penerima');
        } else {
            $dataInsert['tanggal_diserahkan'] = null;
            $dataInsert['penerima'] = null;
        }

        // Handle Image Upload
        $gambar = $this->request->getFile('gambar');
        if ($gambar && $gambar->isValid() && !$gambar->hasMoved()) {
            $storage = new \App\Services\Storage\FileStorageService();
            try {
                $stored = $storage->storeUploadedFile($gambar, 'lost_and_found');
                $dataInsert['gambar'] = $stored['url'];
            } catch (\Throwable $e) {
                return $this->apiException(
                    $e,
                    $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal mengunggah foto barang.',
                    $e instanceof \RuntimeException ? 422 : 500,
                    'LostAndFoundController::store'
                );
            }

            if (!empty($key)) {
                $builder = db_connect()->table('txn_barang_hilang')->where('uid', (string) $key);
                if (ctype_digit((string) $key)) {
                    $builder->orWhere('id', (int) $key);
                }
                $existingRow = $builder->get()->getRowArray();
                if ($existingRow && !empty($existingRow['gambar'])) {
                    $storage->delete((string) $existingRow['gambar'], 'lost_and_found');
                }
            }
        }

        if (!empty($key)) {
            $this->apps->updateData($dataInsert, $key, 'txn_barang_hilang');
        } else {
            $this->apps->storeData($dataInsert, 'txn_barang_hilang');
        }

        return $this->response->setStatusCode(200)->setJSON([
            'status'  => 'success',
            'message' => 'Data berhasil disimpan.',
            'key'     => $key
        ]);
    }

    public function removeData()
    {
        $key  = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }
        $builder = db_connect()->table('txn_barang_hilang')->where('uid', $key);
        if (ctype_digit($key)) {
            $builder->orWhere('id', (int) $key);
        }
        $existingRow = $builder->get()->getRowArray();
        if ($existingRow && !empty($existingRow['gambar'])) {
            (new \App\Services\Storage\FileStorageService())->delete((string) $existingRow['gambar'], 'lost_and_found');
        }

        $this->apps->removeData($key, 'txn_barang_hilang');
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function getData()
    {
        $status = $this->request->getPost('status');
        $bulan = $this->request->getPost('bulan');

        $builder = $this->lostFoundModel->getBuilder('list', [
            'status' => $status,
            'bulan'  => $bulan
        ]);

        $columns = $this->lostFoundModel->getColumns('list');
        $result = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getSummary()
    {
        $bulan = $this->request->getPost('bulan');
        $summary = $this->lostFoundModel->getSummaryData(['bulan' => $bulan]);

        return $this->response->setJSON([
            'status' => true,
            'summary' => $summary
        ]);
    }
}
