<?php

namespace App\Controllers\Apps\Services;
use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\MeritModel;

class MeritController extends BaseController
{
    protected $appsModel;
    protected $meritModel;
    protected $uploader;
    protected $dataTables;

    public function __construct(){
        $this->appsModel    = new AppsModel();
        $this->meritModel   = new MeritModel();
        $this->uploader     = new ExcelUploader();
        $this->dataTables   = new DataTablesLib();        
        $sess = session()->get();
    }



    public function storeData(){
        $sess              = session()->get();
        $key               = trim((string) $this->request->getPost('key'));
        $usulMasuk         = $this->request->getPost('usul_masuk');
        $ms                = $this->request->getPost('ms');
        $tms               = $this->request->getPost('tms');
        $totalRealisasi    = $this->request->getPost('total_realisasi');
        $slaSesuai         = $this->request->getPost('sla_sesuai');
        $slaTidakSesuai    = $this->request->getPost('sla_tidak_sesuai');
        $persentaseSla     = $this->request->getPost('persentase_sla');
        $period            = trim((string) $this->request->getPost('period'));
        $syncdate1         = trim((string) $this->request->getPost('syncdate1'));
        $syncdate2         = trim((string) $this->request->getPost('syncdate2'));

        $rules = [
            'usul_masuk'        => 'required|numeric',
            'ms'                => 'required|numeric',
            'tms'               => 'required|numeric',
            'total_realisasi'   => 'required|numeric',
            'sla_sesuai'        => 'required|numeric',
            'sla_tidak_sesuai'  => 'required|numeric',
            'persentase_sla'    => 'required',
            'period'            => 'required',
            'syncdate1'         => 'required',
            'syncdate2'         => 'required',
        ];

        if (!$this->validate($rules)) {
            $errorsArray = $this->validator->getErrors();
            $message = implode(', ', $errorsArray); 
            return $this->response->setStatusCode(422)->setJSON([
                'data'    => $this->request->getPost(),
                'status'  => 'error',
                'message' => $message
            ]);
        }
        
        if ($syncdate2 < $syncdate1) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'Tanggal selesai tidak boleh lebih kecil dari tanggal mulai.',
            ]);
        }

        $now = date('Y-m-d H:i:s');
        $username = $sess['username'] ?? 'admin';
        $persenClean = str_replace(['%', ','], ['', '.'], (string) $persentaseSla);

        $dataPayload = [
            'period'                => $period,
            'period_date'           => $syncdate1,
            'period_start_date'     => $syncdate1,
            'period_end_date'       => $syncdate2,
            'usul_masuk'            => (int) $usulMasuk,
            'ms'                    => (int) $ms,
            'tms'                   => (int) $tms,
            'total_realisasi'       => (int) $totalRealisasi,
            'sla_sesuai'            => (int) $slaSesuai,
            'sla_tidak_sesuai'      => (int) $slaTidakSesuai,
            'persentase_sla'        => floatval($persenClean),
            'updated_at'            => $now,
        ];

        if (!empty($key)) {
            $this->meritModel->saveData($dataPayload, $key);
        } else {
            $dataPayload['created_by'] = $username;
            $dataPayload['created_at'] = $now;
            $this->meritModel->saveData($dataPayload);
            $this->meritModel->logActivity([
                'layanan_id' => 18,
                'tanggal'    => date('Y-m-d'),
                'created_by' => $username
            ]);
        }

        return $this->response->setStatusCode(200)->setJSON([
            'status'  => 'success',
            'message' => 'Data berhasil disimpan.',
            'key'     => $key
        ]);
    }

    public function removeData(){
        $key = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }

        $this->meritModel->deleteData($key);
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function getData(){
        $bulan = $this->request->getPost('bulan');
        $kategori = trim((string) ($this->request->getPost('kategori') ?? $this->request->getPost('category') ?? ''));

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $builder = $this->meritModel->getBuilder('recap', [
            'bulan'     => $bulan,
            'kategori'  => $kategori,
        ]);

        $columns    = $this->meritModel->getColumns('recap');
        $result     = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getSummary()
    {
        $bulan = $this->request->getPost('bulan');
        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        return $this->response->setJSON([
            'status' => 'success',
            'summary' => $this->meritModel->getSummary($bulan),
        ]);
    }

    public function importBatch()
    {
        $sess = session()->get();
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'File tidak valid atau belum diunggah.'
            ]);
        }

        try {
            $this->uploader->validateFile($file);
            $filePath = $file->getTempName();
            $rows = $this->uploader->parseExcel($filePath);

            if (!is_array($rows) || count($rows) < 2) {
                return $this->response->setStatusCode(400)->setJSON([
                    'status'  => 'error',
                    'message' => 'File Excel kosong atau format tidak sesuai.'
                ]);
            }

            $dataBatch = [];
            $username = $sess['username'] ?? 'admin';
            $now = date('Y-m-d H:i:s');

            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[0])) {
                    continue;
                }

                $period = trim((string) $row[0]);
                $startDate = ExcelUploader::excelDate($row[1]);
                $endDate = ExcelUploader::excelDate($row[2]);
                $usulMasuk = (int) ExcelUploader::cleanNumber($row[3] ?? 0);
                $ms = (int) ExcelUploader::cleanNumber($row[4] ?? 0);
                $tms = (int) ExcelUploader::cleanNumber($row[5] ?? 0);
                $totalRealisasi = (int) ExcelUploader::cleanNumber($row[6] ?? 0);
                $slaSesuai = (int) ExcelUploader::cleanNumber($row[7] ?? 0);
                $slaTidakSesuai = (int) ExcelUploader::cleanNumber($row[8] ?? 0);
                
                $persenRaw = str_replace(['%', ','], ['', '.'], (string)($row[9] ?? 0));
                $persentaseSla = floatval($persenRaw);

                if (empty($totalRealisasi)) {
                    $totalRealisasi = $ms + $tms;
                }

                $dataBatch[] = [
                    'period'            => $period,
                    'period_date'       => $startDate ?: date('Y-m-d'),
                    'period_start_date' => $startDate ?: date('Y-m-d'),
                    'period_end_date'   => $endDate ?: ($startDate ?: date('Y-m-d')),
                    'usul_masuk'        => $usulMasuk,
                    'ms'                => $ms,
                    'tms'               => $tms,
                    'total_realisasi'   => $totalRealisasi,
                    'sla_sesuai'        => $slaSesuai,
                    'sla_tidak_sesuai'  => $slaTidakSesuai,
                    'persentase_sla'    => $persentaseSla,
                    'created_by'        => $username,
                    'created_at'        => $now,
                ];
            }

            if (empty($dataBatch)) {
                return $this->response->setStatusCode(400)->setJSON([
                    'status'  => 'error',
                    'message' => 'Tidak ada baris data valid yang dapat diimpor.'
                ]);
            }

            $db = \Config\Database::connect();
            $db->table('txn_merit')->insertBatch($dataBatch);

            $this->meritModel->logActivity([
                'layanan_id' => 18,
                'tanggal'    => date('Y-m-d'),
                'created_by' => $username
            ]);

            return $this->response->setJSON([
                'status'       => 'success',
                'message'      => 'Import batch data Sistem Merit berhasil diproses.',
                'total_import' => count($dataBatch)
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal memproses file Excel Sistem Merit.',
                $e instanceof \RuntimeException ? 422 : 500,
                'MeritController::importBatch'
            );
        }
    }
}
