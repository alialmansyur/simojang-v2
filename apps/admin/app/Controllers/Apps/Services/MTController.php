<?php

namespace App\Controllers\Apps\Services;
use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\MTModel;

class MTController extends BaseController
{
    protected $appsModel;
    protected $mtModel;
    protected $uploader;
    protected $dataTables;

    public function __construct(){
        $this->appsModel    = new AppsModel();
        $this->mtModel      = new MTModel();
        $this->uploader     = new ExcelUploader();
        $this->dataTables   = new DataTablesLib();
    }

    public function storeMTData(){
        $sess = session()->get();

        $instansi      = trim((string) $this->request->getPost('instansi'));
        $period        = trim((string) $this->request->getPost('period'));
        $startdate     = trim((string) $this->request->getPost('startdate'));
        $step_progress = (int) $this->request->getPost('stepProgress');

        $key           = trim((string) ($this->request->getPost('key') ?? ''));

        $rules = [
            'instansi'      => 'required',
            'period'        => 'required',
            'startdate'     => 'required',
            'stepProgress'  => 'required|integer|greater_than_equal_to[1]|less_than_equal_to[8]',
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

        $now = date('Y-m-d H:i:s');
        $username = $sess['username'] ?? null;

        $dataPayload = [
            'instansi_id'   => $instansi,
            'period'        => $period,
            'period_date'   => $startdate,
            'rw_mt_id'      => $step_progress,
        ];

        $db = \Config\Database::connect();

        $customDesc = trim((string) ($this->request->getPost('description') ?? $this->request->getPost('catatan') ?? ''));
        $customActivityType = trim((string) ($this->request->getPost('activity_type') ?? ''));

        if ($key !== '') {
            $existingQuery = $db->table('txn_mt')->select('id, created_at');
            if (is_numeric($key)) {
                $existingQuery->where('id', (int) $key);
            } else {
                $existingQuery->where('uid', $key);
            }
            $existing = $existingQuery->get()->getRowArray();

            if (empty($existing)) {
                return $this->response->setStatusCode(404)->setJSON([
                    'status'  => 'error',
                    'message' => 'Data MT yang akan diubah tidak ditemukan.',
                ]);
            }

            $insertID = (int) $existing['id'];
            $dataPayload['action'] = 'update';
            if (!empty($existing['created_at'])) {
                $dataPayload['created_at'] = $existing['created_at'];
            }
            $dataPayload['updated_at'] = $now;
            $this->appsModel->updateData($dataPayload, $insertID, 'txn_mt');
            $defaultDesc = 'Mengupdate data MT pada instansi ID ' . $instansi;
        } else {
            $dataPayload['action'] = 'create';
            $dataPayload['created_by'] = $username ?? 'system';
            $dataPayload['created_at'] = $now;
            $dataPayload['updated_at'] = $now;
            $insertID  = $this->appsModel->storeData($dataPayload, 'txn_mt');
            $defaultDesc = 'Menambahkan data MT pada instansi ID ' . $instansi;
        }

        $activityDesc = $customDesc !== '' ? mb_substr($customDesc, 0, 255) : mb_substr($defaultDesc, 0, 50);
        $resolvedActivityType = $customActivityType !== ''
            ? $customActivityType
            : ($key !== '' ? 'update' : 'create');

        $datalog = [
            'activity_type' => $resolvedActivityType,
            'mt_id'         => $insertID,
            'rw_mt_id'      => $step_progress,
            'description'   => $activityDesc,
            'created_by'    => $username ?? 'system',
            'created_at'    => $now
        ];

        $this->appsModel->storeData($datalog, 'txn_mt_detail');
        $this->appsModel->storeData(
            [
                'layanan_id' => 13,
                'tanggal'    => date('Y-m-d'),
                'created_by' => $username ?? 'system'
            ],
            'activity_daily_logs'
        );

        return $this->response->setStatusCode(200)->setJSON([
            'status'    => 'success',
            'message'   => 'Data MT berhasil disimpan.',
            'id'        => $insertID,
        ]);
    }

    public function getSummary()
    {
        $bulan = $this->request->getPost('bulan');
        if (!is_array($bulan)) {
            $bulan = [];
        }
        $bulan = array_values(array_filter(array_map('intval', $bulan), static fn($m) => $m >= 1 && $m <= 12));
        $periodYear = (int) ($this->request->getPost('period_year') ?? date('Y'));
        $category = strtolower(trim((string) ($this->request->getPost('category') ?? '')));

        $db = \Config\Database::connect();
        $builder = $db->table('txn_mt a')
            ->select("
                COUNT(a.id) AS total_data,
                COUNT(DISTINCT a.instansi_id) AS total_instansi,
                SUM(CASE WHEN a.rw_mt_id >= 7 THEN 1 ELSE 0 END) AS tahap_mandiri,
                SUM(CASE WHEN a.rw_mt_id < 7 THEN 1 ELSE 0 END) AS tahap_pendampingan,
                ROUND(AVG(
                    (SELECT SUM(d.percentage) FROM data_support_mt d WHERE d.id <= a.rw_mt_id)
                ), 1) AS avg_progress
            ");

        if ($periodYear > 2000) {
            $builder->where('YEAR(COALESCE(a.period_date, a.created_at))', $periodYear, false);
        }

        if (!empty($bulan)) {
            $builder->whereIn('MONTH(COALESCE(a.period_date, a.created_at))', $bulan, false);
        }

        if ($category === 'mandiri') {
            $builder->where('a.rw_mt_id >=', 7);
        } elseif ($category === 'pendampingan') {
            $builder->where('a.rw_mt_id <', 7);
        } elseif (is_numeric($category) && (int) $category >= 1 && (int) $category <= 8) {
            $builder->where('a.rw_mt_id', (int) $category);
        }

        $summary = $builder->get()->getRowArray() ?: [];
        return $this->response->setJSON([
            'status' => 'success',
            'summary' => [
                'total_data' => (int) ($summary['total_data'] ?? 0),
                'total_instansi' => (int) ($summary['total_instansi'] ?? 0),
                'tahap_mandiri' => (int) ($summary['tahap_mandiri'] ?? 0),
                'tahap_pendampingan' => (int) ($summary['tahap_pendampingan'] ?? 0),
                'avg_progress' => (float) ($summary['avg_progress'] ?? 0),
            ]
        ]);
    }

    public function importBatch()
    {
        $session = session()->get();
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Berkas Excel wajib diunggah.',
            ]);
        }

        try {
            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows = $this->uploader->parseExcel($localPath);

            if (!is_array($rows) || count($rows) < 2) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Berkas Excel kosong atau format tidak sesuai.',
                ]);
            }

            $imported = 0;
            $now = date('Y-m-d H:i:s');
            $user = $session['username'] ?? 'system';

            foreach (array_slice($rows, 1) as $row) {
                if (empty($row[0])) continue;

                $instansiId = $this->appsModel->getInstansiID($row[0]);
                if (!$instansiId) {
                    $instansiId = is_numeric($row[0]) ? (int) $row[0] : 6100;
                }

                $period = !empty($row[1]) ? trim((string)$row[1]) : date('Y-m');
                $periodDate = !empty($row[2]) ? ExcelUploader::excelDate($row[2]) : date('Y-m-d');
                $stepId = !empty($row[3]) ? (int)$row[3] : 1;
                if ($stepId < 1 || $stepId > 8) $stepId = 1;

                $insertId = $this->appsModel->storeData([
                    'instansi_id' => $instansiId,
                    'period' => $period,
                    'period_date' => $periodDate,
                    'rw_mt_id' => $stepId,
                    'created_by' => $user,
                    'created_at' => $now,
                    'updated_at' => $now,
                ], 'txn_mt');

                $this->appsModel->storeData([
                    'activity_type' => 'import',
                    'mt_id' => $insertId,
                    'rw_mt_id' => $stepId,
                    'description' => mb_substr('Import batch data MT untuk instansi ID ' . $instansiId, 0, 50),
                    'created_by' => $user,
                    'created_at' => $now,
                ], 'txn_mt_detail');

                $imported++;
            }

            return $this->response->setJSON([
                'status' => 'success',
                'message' => "Berhasil mengimpor {$imported} data Manajemen Talenta.",
                'total_imported' => $imported,
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal membaca berkas Excel Manajemen Talenta.',
                $e instanceof \RuntimeException ? 422 : 500,
                'MTController::importBatch'
            );
        }
    }

    public function getData(){
        $bulan = $this->request->getPost('bulan');
        $category = $this->request->getPost('category');
        $periodYear = (int) ($this->request->getPost('period_year') ?? date('Y'));

        if (!is_array($bulan)) {
            $bulan = [];
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static fn($m) => $m >= 1 && $m <= 12));

        $builder = $this->mtModel->getBuilder('recap', [
            'bulan'       => $bulan,
            'category'    => $category,
            'period_year' => $periodYear,
        ]);

        $columns    = $this->mtModel->getColumns('recap', [
            'bulan'       => $bulan,
            'category'    => $category,
            'period_year' => $periodYear,
        ]);
        $result     = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function removeData(){
        $key = trim((string) ($this->request->getPost('key') ?? ''));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'ID data MT tidak valid.',
            ]);
        }

        $db = \Config\Database::connect();
        $rowQuery = $db->table('txn_mt')->select('id');
        if (is_numeric($key)) {
            $rowQuery->where('id', (int) $key);
        } else {
            $rowQuery->where('uid', $key);
        }
        $row = $rowQuery->get()->getRowArray();

        if (empty($row)) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => false,
                'message' => 'Data MT tidak ditemukan.',
            ]);
        }

        $mtId = (int) $row['id'];
        $this->appsModel->removeData($mtId, 'txn_mt');
        $this->appsModel->removeDataLogMT($mtId, 'txn_mt_detail');

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    /**
     * Rincian detail MT untuk Modal Detail (Progressive Disclosure).
     * Mengembalikan matriks 8 tahapan MT + log aktivitas aktual.
     */
    public function getDetail()
    {
        $rawKey = trim((string) ($this->request->getPost('key') ?? ''));
        if ($rawKey === '' || (is_numeric($rawKey) && (int) $rawKey <= 0)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'ID data MT tidak valid.',
            ])->setStatusCode(400);
        }

        $db = \Config\Database::connect();

        $mtQuery = $db->table('txn_mt a')
            ->select("
                a.*,
                b.nama AS instansi_name,
                b.wilayah,
                b.kanreg,
                c.step_name,
                (
                    SELECT d.activity_type
                    FROM txn_mt_detail d
                    WHERE d.mt_id = a.id
                    ORDER BY d.id DESC
                    LIMIT 1
                ) AS activity_type,
                (
                    SELECT d.description
                    FROM txn_mt_detail d
                    WHERE d.mt_id = a.id
                    ORDER BY d.id DESC
                    LIMIT 1
                ) AS description,
                (
                    SELECT d.description
                    FROM txn_mt_detail d
                    WHERE d.mt_id = a.id
                    ORDER BY d.id DESC
                    LIMIT 1
                ) AS catatan,
                (
                    SELECT SUM(d.percentage)
                    FROM data_support_mt d
                    WHERE d.id <= a.rw_mt_id
                ) AS total_percentase,
                DATE_FORMAT(a.period_date, '%d %M %Y') AS mulai_implemen,
                DATE_FORMAT(a.created_at, '%d %M %Y %H:%i') AS dibuat_label,
                DATE_FORMAT(a.updated_at, '%d %M %Y %H:%i') AS diperbarui_label
            ")
            ->join('data_instansi b', 'b.kodeins = a.instansi_id', 'left')
            ->join('data_support_mt c', 'c.id = a.rw_mt_id', 'left');

        if (is_numeric($rawKey)) {
            $mtQuery->where('a.id', (int) $rawKey);
        } else {
            $mtQuery->where('a.uid', $rawKey);
        }

        $mt = $mtQuery->get()->getRowArray();

        if (empty($mt)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Data MT tidak ditemukan.',
            ])->setStatusCode(404);
        }

        $mtId = (int) $mt['id'];

        // Matriks 8 tahapan MT beserta status pencapaian per tahapan
        $steps = $db->table('data_support_mt')
            ->select('id, step_name, description, percentage, sort_order')
            ->orderBy('sort_order', 'ASC')
            ->get()
            ->getResultArray();

        $currentStep = (int) ($mt['rw_mt_id'] ?? 1);
        $stages = [];
        foreach ($steps as $step) {
            $stepId = (int) $step['id'];
            $stages[] = [
                'id'          => $stepId,
                'step_name'   => $step['step_name'],
                'description' => $step['description'],
                'percentage'  => (int) $step['percentage'],
                'status'      => $stepId < $currentStep
                    ? 'selesai'
                    : ($stepId === $currentStep ? 'berjalan' : 'belum'),
            ];
        }

        // Log aktivitas (txn_mt_detail)
        $activities = $db->table('txn_mt_detail d')
            ->select("
                d.id,
                d.activity_type,
                d.rw_mt_id,
                s.step_name,
                d.description,
                d.created_by,
                d.created_at,
                DATE_FORMAT(d.created_at, '%d %M %Y, %H:%i WIB') AS created_label
            ")
            ->join('data_support_mt s', 's.id = d.rw_mt_id', 'left')
            ->where('d.mt_id', $mtId)
            ->orderBy('d.created_at', 'DESC')
            ->orderBy('d.id', 'DESC')
            ->get()
            ->getResultArray();

        return $this->response->setJSON([
            'status'     => 'success',
            'mt'         => $mt,
            'stages'     => $stages,
            'activities' => $activities,
        ]);
    }

}
