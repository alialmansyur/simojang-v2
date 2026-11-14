<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\Apps\Services\KompetensiModel;
use App\Models\Apps\AppsModel;
use PhpOffice\PhpSpreadsheet\IOFactory; 
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

class Kompetensi extends BaseController
{
    protected $kompetensimodel;
    protected $apps;
    protected $uploader;
    protected $dataTables;

    public function __construct()
    { 
        $this->kompetensimodel = new KompetensiModel();
        $this->apps = new AppsModel();
        $this->uploader = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
    } 



    public function getData(){
        $bulan = $this->request->getPost('bulan');
        $category = trim((string) ($this->request->getPost('category') ?? ''));
        $periodYear = (int) ($this->request->getPost('period_year') ?? 0);

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $builder = $this->kompetensimodel->getBuilder('recap-kompetensi', [
            'bulan'       => $bulan,
            'category'    => $category,
            'period_year' => $periodYear,
        ]);

        $columns = [
            ['data' => 'id', 'search' => false, 'order' => 'a.id'],
            ['data' => 'uid', 'search' => false, 'order' => false],
            ['data' => 'instansi_nama', 'search' => 'd.nama', 'order' => 'd.nama'],
            ['data' => 'instansi_id', 'search' => false, 'order' => false],
            ['data' => 'wilayah', 'search' => false, 'order' => false],
            ['data' => 'kanreg', 'search' => false, 'order' => false],
            ['data' => 'logo', 'search' => false, 'order' => false],
            ['data' => 'tanggal', 'search' => 'a.tanggal', 'order' => 'a.tanggal'],
            ['data' => 'metode', 'search' => 'a.metode', 'order' => 'a.metode'],
            ['data' => 'total_peserta', 'search' => false, 'order' => 'a.total_peserta'],
            ['data' => 'created_by', 'search' => 'a.created_by', 'order' => 'a.created_by'],
            ['data' => 'updated_by', 'search' => false, 'order' => false],
            ['data' => 'created_at', 'search' => 'a.created_at', 'order' => 'a.created_at'],
            ['data' => 'updated_at', 'search' => false, 'order' => 'a.updated_at'],
        ];

        $result = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getSummary()
    {
        $bulan = $this->request->getPost('bulan');
        $category = trim((string) ($this->request->getPost('category') ?? ''));
        $periodYear = (int) ($this->request->getPost('period_year') ?? 0);

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        return $this->response->setJSON([
            'status' => true,
            'summary' => $this->kompetensimodel->getSummary($bulan, [
                'category'    => $category,
                'period_year' => $periodYear,
            ]),
        ]);
    } 

    public function storeData(){
        $sess = session()->get();
        $key  = $this->request->getPost('key');
        $instansi   = $this->request->getPost('instansi');
        $tanggal    = $this->request->getPost('tanggal');
        $metode     = $this->request->getPost('metode');
        $total_peserta  = $this->request->getPost('total_peserta');
    
        if (!$tanggal || !$instansi || !$metode) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Data tidak lengkap. Semua kolom wajib diisi.'
            ]);
        } 

        // Update single record
        if (!empty($key)) {
            $updateData = [
                'instansi_id'   => is_array($instansi) ? $instansi[0] : $instansi,
                'tanggal'       => is_array($tanggal) ? $tanggal[0] : $tanggal,
                'metode'        => is_array($metode) ? $metode[0] : $metode,
                'total_peserta' => (int) (is_array($total_peserta) ? $total_peserta[0] : $total_peserta),
                'updated_by'    => $sess['username'] ?? 'system',
                'updated_at'    => date('Y-m-d H:i:s'),
            ];

            if (is_numeric($key)) {
                $this->apps->updateData($updateData, $key, 'txn_kompetensi');
            } else {
                $this->apps->updateDataByField('uid', $key, $updateData, 'txn_kompetensi');
            }

            return $this->response->setJSON([
                'status' => 'success',
                'message' => 'Data penilaian kompetensi berhasil diperbarui.'
            ]);
        }

        if (!is_array($instansi)) {
            $instansi = [$instansi];
            $tanggal = [$tanggal];
            $metode = [$metode];
            $total_peserta = [$total_peserta];
        }

        $dataBatch = [];
        foreach ($instansi as $i => $n) {
            if (empty($n) || empty($tanggal[$i]) || empty($metode[$i])) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => "Baris ke-" . ($i + 1) . " tidak lengkap"
                ]);
            }

            $dataBatch[] = [
                'uid'           => bin2hex(random_bytes(16)),
                'instansi_id'   => $n,
                'tanggal'       => $tanggal[$i],
                'metode'        => $metode[$i],
                'total_peserta' => (int) ($total_peserta[$i] ?? 0),
                'created_by'    => $sess['username'] ?? 'system',
            ];
        }
 
        if ($dataBatch) {
            $this->apps->insertBatchData($dataBatch, 'txn_kompetensi');
            $this->apps->storeData(
                [
                    'layanan_id' => 39,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => $sess['username'] ?? 'system'
                ],
                'activity_daily_logs'
            );            
        }

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Data penilaian kompetensi berhasil disimpan.'
        ]);
    }

    public function removeData(){
        $key  = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }

        if (is_numeric($key)) {
            $this->apps->removeData((int) $key, 'txn_kompetensi');
        } else {
            $this->apps->removeDataByField('uid', $key, 'txn_kompetensi');
        }
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function importData(){
        $session = session()->get();
        $file    = $this->request->getFile('file');

        try {
            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows      = $this->uploader->parseExcel($localPath);
        } catch (\Throwable $e) {
            return $this->apiException($e, $e instanceof \RuntimeException ? $e->getMessage() : 'Berkas Excel tidak valid atau gagal dibaca.', 422, 'Kompetensi::importData');
        }

        if (!is_array($rows) || count($rows) < 2) {
            return $this->apiError('Data kosong atau format salah.', 422);
        }

        $dataBatch = [];
        
        foreach (array_slice($rows, 1) as $index => $row) {
            if (empty($row[0])) {
                continue; 
            }
            
            // Kolom Excel:
            // 0: Instansi Kode
            // 1: Tanggal (YYYY-MM-DD)
            // 2: Metode
            // 3: Total Peserta

            $instansiID = $this->apps->getInstansiID($row[0]);
            
            $dataBatch[] = [
                'uid'           => bin2hex(random_bytes(16)),
                'instansi_id'   => $instansiID,
                'tanggal'       => ExcelUploader::excelDate($row[1]),
                'metode'        => $row[2],
                'total_peserta' => (int)$row[3],
                'created_by'    => $session['username'] ?? 'system',
            ];
        }

        if (!empty($dataBatch)) {
            $this->apps->insertBatchData($dataBatch, 'txn_kompetensi');
            $this->apps->storeData(
                [
                    'layanan_id' => 39, 
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => $session['username'] ?? 'system'
                ],
                'activity_daily_logs'
            );            
        }

        return $this->response->setJSON([
            'status'   => 'success',
            'message'  => 'Upload dan import data berhasil.',
        ]);
    } 
}
