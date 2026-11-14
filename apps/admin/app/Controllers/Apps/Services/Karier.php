<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\Apps\Services\KarierModel;
use App\Models\Apps\AppsModel;
use PhpOffice\PhpSpreadsheet\IOFactory; 
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

class Karier extends BaseController
{
    protected $kariermodel;
    protected $apps;
    protected $uploader;
    protected $dataTables;

    public function __construct()
    { 
        $this->kariermodel = new KarierModel();
        $this->apps = new AppsModel();
        $this->uploader = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
        $sess = session()->get();
    } 



    public function getData(){
        $sess = session()->get();
        $bulan = $this->request->getPost('bulan');
        $category = trim((string) ($this->request->getPost('category') ?? ''));
        $periodYear = (int) ($this->request->getPost('period_year') ?? 0);

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $builder = $this->kariermodel->getBuilder('recap-karier', [
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
            ['data' => 'jenis_penilaian', 'search' => 'a.jenis_penilaian', 'order' => 'a.jenis_penilaian'],
            ['data' => 'total_peserta', 'search' => false, 'order' => 'a.total_peserta'],
            ['data' => 'memenuhi', 'search' => false, 'order' => 'a.memenuhi'],
            ['data' => 'tidak_memenuhi', 'search' => false, 'order' => 'a.tidak_memenuhi'],
            ['data' => 'lulus', 'search' => false, 'order' => 'a.lulus'],
            ['data' => 'tidak_lulus', 'search' => false, 'order' => 'a.tidak_lulus'],
            ['data' => 'tidak_hadir', 'search' => false, 'order' => 'a.tidak_hadir'],
            ['data' => 'created_by', 'search' => 'a.created_by', 'order' => 'a.created_by'],
            ['data' => 'created_at', 'search' => 'a.created_at', 'order' => 'a.created_at'],
            ['data' => 'updated_at', 'search' => false, 'order' => 'a.updated_at'],
            ['data' => 'scema_group', 'search' => false, 'order' => false],
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
            'summary' => $this->kariermodel->getSummary($bulan, [
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
        $jenis_penilaian = $this->request->getPost('jenis_penilaian');
        $total_peserta  = $this->request->getPost('total_peserta');
        $memenuhi      = $this->request->getPost('memenuhi');
        $tidak_memenuhi = $this->request->getPost('tidak_memenuhi');
        $lulus      = $this->request->getPost('lulus');
        $tidak_lulus = $this->request->getPost('tidak_lulus');
        $tidak_hadir= $this->request->getPost('tidak_hadir');
    
        if (!$tanggal || !$instansi || !$jenis_penilaian) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Data tidak lengkap. Semua kolom wajib diisi.'
            ]);
        } 

        // Update single record
        if (!empty($key)) {
            $updateData = [
                'instansi_id'     => is_array($instansi) ? $instansi[0] : $instansi,
                'tanggal'         => is_array($tanggal) ? $tanggal[0] : $tanggal,
                'jenis_penilaian' => is_array($jenis_penilaian) ? $jenis_penilaian[0] : $jenis_penilaian,
                'total_peserta'   => (int) (is_array($total_peserta) ? $total_peserta[0] : $total_peserta),
                'memenuhi'        => (int) (is_array($memenuhi) ? $memenuhi[0] : $memenuhi),
                'tidak_memenuhi'  => (int) (is_array($tidak_memenuhi) ? $tidak_memenuhi[0] : $tidak_memenuhi),
                'lulus'           => (int) (is_array($lulus) ? $lulus[0] : $lulus),
                'tidak_lulus'     => (int) (is_array($tidak_lulus) ? $tidak_lulus[0] : $tidak_lulus),
                'tidak_hadir'     => (int) (is_array($tidak_hadir) ? $tidak_hadir[0] : $tidak_hadir),
                'updated_at'      => date('Y-m-d H:i:s'),
            ];

            if (!empty($sess['username'])) {
                $updateData['created_by'] = $sess['username'];
            }

            if (is_numeric($key)) {
                $this->apps->updateData($updateData, $key, 'txn_karier');
            } else {
                $this->apps->updateDataByField('uid', $key, $updateData, 'txn_karier');
            }

            return $this->response->setJSON([
                'status' => 'success',
                'message' => 'Data penilaian karier berhasil diperbarui.'
            ]);
        }

        if (!is_array($instansi)) {
            $instansi = [$instansi];
            $tanggal = [$tanggal];
            $jenis_penilaian = [$jenis_penilaian];
            $total_peserta = [$total_peserta];
            $memenuhi = [$memenuhi];
            $tidak_memenuhi = [$tidak_memenuhi];
            $lulus = [$lulus];
            $tidak_lulus = [$tidak_lulus];
            $tidak_hadir = [$tidak_hadir];
        }

        $scema_group = bin2hex(random_bytes(8));
        $dataBatch = [];
        foreach ($instansi as $i => $n) {
            if (empty($n) || (empty($tanggal[$i])) || (empty($jenis_penilaian[$i]))) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => "Baris ke-" . ($i + 1) . " tidak lengkap"
                ]);
            }

            $dataBatch[] = [
                'uid'           => bin2hex(random_bytes(16)),
                'scema_group'   => $scema_group,
                'instansi_id'   => $n,
                'tanggal'       => $tanggal[$i],
                'jenis_penilaian' => $jenis_penilaian[$i],
                'total_peserta' => (int) ($total_peserta[$i] ?: 0),
                'memenuhi'      => (int) ($memenuhi[$i] ?: 0),
                'tidak_memenuhi'=> (int) ($tidak_memenuhi[$i] ?: 0),
                'lulus'         => (int) ($lulus[$i] ?: 0),
                'tidak_lulus'   => (int) ($tidak_lulus[$i] ?: 0),
                'tidak_hadir'   => (int) ($tidak_hadir[$i] ?: 0),
                'created_by'    => $sess['username'] ?? 'system',
            ];
        }
 
        if ($dataBatch) {
            $this->apps->insertBatchData($dataBatch, 'txn_karier');
            $this->apps->storeData(
                [
                    'layanan_id' => 40,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => $sess['username'] ?? 'system'
                ],
                'activity_daily_logs'
            );            
        }

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Data penilaian karier berhasil disimpan.'
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
            $this->apps->removeData((int) $key, 'txn_karier');
        } else {
            $this->apps->removeDataByField('uid', $key, 'txn_karier');
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
            return $this->apiException($e, $e instanceof \RuntimeException ? $e->getMessage() : 'Berkas Excel tidak valid atau gagal dibaca.', 422, 'Karier::importData');
        }

        if (!is_array($rows) || count($rows) < 2) {
            return $this->apiError('Data kosong atau format salah.', 422);
        }

        $scema_group = bin2hex(random_bytes(8));
        $dataBatch = [];
        // Header starts at row 1, data starts at row 2
        foreach (array_slice($rows, 1) as $index => $row) {
            if (empty($row[0])) {
                continue; 
            }
            
            // Kolom Excel:
            // 0: Instansi Kode
            // 1: Tanggal (YYYY-MM-DD)
            // 2: Jenis Penilaian
            // 3: Total Peserta
            // 4: Memenuhi
            // 5: Tidak Memenuhi
            // 6: Lulus
            // 7: Tidak Lulus
            // 8: Tidak Hadir

            $instansiID = $this->apps->getInstansiID($row[0]);
            
            $dataBatch[] = [
                'uid'           => bin2hex(random_bytes(16)),
                'scema_group'   => $scema_group,
                'instansi_id'   => $instansiID,
                'tanggal'       => ExcelUploader::excelDate($row[1]),
                'jenis_penilaian' => $row[2],
                'total_peserta' => (int)$row[3],
                'memenuhi'      => (int)$row[4],
                'tidak_memenuhi'=> (int)$row[5],
                'lulus'         => (int)$row[6],
                'tidak_lulus'   => (int)$row[7],
                'tidak_hadir'   => (int)$row[8],
                'created_by'    => $session['username'] ?? 'system',
            ];
        }

        if (!empty($dataBatch)) {
            $this->apps->insertBatchData($dataBatch, 'txn_karier');
            $this->apps->storeData(
                [
                    'layanan_id' => 40, 
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
