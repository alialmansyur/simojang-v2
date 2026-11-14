<?php

namespace App\Controllers\Apps\Services;
use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

use App\Libraries\DataTablesLib;
use PhpOffice\PhpSpreadsheet\IOFactory;

use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\ManageProjectModel;

class ManageProjectController extends BaseController
{
    protected $apps;
    protected $manageProject;
    protected $dataTables;

    public function __construct(){
        $this->apps          = new AppsModel();
        $this->manageProject = new ManageProjectModel();
        $this->dataTables    = new DataTablesLib();
        helper(['form', 'url', 'filesystem']);
    }



    public function getProjectOverview(){
        $projectUid = $this->request->getPost('project_uid');
        $project = $this->manageProject->getProjectByUid($projectUid);
        
        if (!$project) {
            return $this->response->setJSON(['status' => 'error', 'message' => 'Project not found']);
        }
        
        return $this->response->setJSON([
            'status' => 'success',
            'data' => $project
        ]);
    }

    public function getSummary(){
        $db = \Config\Database::connect();
        $builder = $db->table('data_projects')->where('is_active', 1);

        $category = trim((string)($this->request->getPost('category') ?? $this->request->getPost('kategori')));
        if (!empty($category) && $category !== 'all') {
            $builder->like('category', $category);
        }

        $bulan = $this->request->getPost('bulan');
        if (!empty($bulan)) {
            $bulanArray = is_array($bulan) ? $bulan : explode(',', (string)$bulan);
            $bulanArray = array_filter(array_map('trim', $bulanArray));
            if (!empty($bulanArray)) {
                $builder->groupStart();
                foreach ($bulanArray as $b) {
                    $bNum = str_pad($b, 2, '0', STR_PAD_LEFT);
                    $builder->orWhere("DATE_FORMAT(start_date, '%m')", $bNum);
                    $builder->orWhere("DATE_FORMAT(target_end_date, '%m')", $bNum);
                }
                $builder->groupEnd();
            }
        }

        $projects = $builder->get()->getResultArray();
        $totalProyek = count($projects);
        $totalPagu = 0;
        $totalRealisasi = 0;
        $totalProgress = 0;
        $selesai = 0;

        foreach ($projects as $p) {
            $totalPagu += (float)($p['budget_amount'] ?? 0);
            $totalRealisasi += (float)($p['realized_budget_amount'] ?? 0);
            $prog = (float)($p['progress_percentage'] ?? 0);
            $totalProgress += $prog;
            if ($prog >= 100 || strtolower($p['status'] ?? '') === 'completed') {
                $selesai++;
            }
        }

        $avgProgress = $totalProyek > 0 ? round($totalProgress / $totalProyek, 1) : 0;

        return $this->response->setJSON([
            'status' => 'success',
            'summary' => [
                'total_proyek'    => $totalProyek,
                'total_pagu'      => $totalPagu,
                'total_realisasi' => $totalRealisasi,
                'avg_progres'     => $avgProgress,
                'selesai'         => $selesai,
            ]
        ]);
    }

    public function getData(){
        $projectUid = $this->request->getPost('project_uid');
        $type       = $this->request->getPost('type'); // 'progress', 'budget', or 'projects'/null

        if ($type === 'progress' || $type === 'budget') {
            $builder = $this->manageProject->getBuilder($type, $projectUid);
            $columns = $this->manageProject->getColumns($type, $projectUid);
            $result  = $this->dataTables->render($builder, $columns);
            if ($type === 'progress' && !empty($result['data']) && is_array($result['data'])) {
                $storage = new \App\Services\Storage\FileStorageService();
                foreach ($result['data'] as &$row) {
                    if (!empty($row['file_name'])) {
                        $rawDir = trim((string) ($row['file_path'] ?? 'media/projects/progress'), '/');
                        $fileName = ltrim((string) $row['file_name'], '/');
                        $target = str_ends_with($rawDir, '/' . $fileName) || $rawDir === $fileName
                            ? $rawDir
                            : $rawDir . '/' . $fileName;
                        $row['foto_url'] = $storage->toPublicUrl($target, 'projects_progress');
                    } else {
                        $row['foto_url'] = null;
                    }
                }
                unset($row);
            }
            return $this->response->setJSON($result);
        }

        $db = \Config\Database::connect();
        $builder = $db->table('data_projects')->where('is_active', 1);

        $category = trim((string)($this->request->getPost('category') ?? $this->request->getPost('kategori')));
        if (!empty($category) && $category !== 'all') {
            $builder->like('category', $category);
        }

        $bulan = $this->request->getPost('bulan');
        if (!empty($bulan)) {
            $bulanArray = is_array($bulan) ? $bulan : explode(',', (string)$bulan);
            $bulanArray = array_filter(array_map('trim', $bulanArray));
            if (!empty($bulanArray)) {
                $builder->groupStart();
                foreach ($bulanArray as $b) {
                    $bNum = str_pad($b, 2, '0', STR_PAD_LEFT);
                    $builder->orWhere("DATE_FORMAT(start_date, '%m')", $bNum);
                    $builder->orWhere("DATE_FORMAT(target_end_date, '%m')", $bNum);
                }
                $builder->groupEnd();
            }
        }

        $searchValue = '';
        $search = $this->request->getPost('search');
        if (is_array($search) && isset($search['value'])) {
            $searchValue = trim((string)$search['value']);
        } elseif (is_string($search)) {
            $searchValue = trim($search);
        }

        if (!empty($searchValue)) {
            $builder->groupStart()
                ->like('name', $searchValue)
                ->orLike('category', $searchValue)
                ->orLike('description', $searchValue)
                ->orLike('status', $searchValue)
            ->groupEnd();
        }

        $totalRecords = $db->table('data_projects')->where('is_active', 1)->countAllResults();
        $filteredRecords = $builder->countAllResults(false);

        $start = (int)($this->request->getPost('start') ?? 0);
        $length = (int)($this->request->getPost('length') ?? 10);
        if ($length > 0) {
            $builder->limit($length, $start);
        }

        $data = $builder->orderBy('created_at', 'DESC')->get()->getResultArray();

        return $this->response->setJSON([
            'draw'            => (int)($this->request->getPost('draw') ?? 1),
            'recordsTotal'    => $totalRecords,
            'recordsFiltered' => $filteredRecords,
            'data'            => $data
        ]);
    }

    public function storeProject(){
        $sess = session()->get();
        
        $name        = $this->request->getPost('name');
        $description = $this->request->getPost('description');
        $category    = $this->request->getPost('category');
        $startDate   = $this->request->getPost('start_date');
        $endDate     = $this->request->getPost('target_end_date');
        $budget      = str_replace(',', '', $this->request->getPost('budget_amount') ?? '0');
        
        $rules = [
            'name'            => 'required',
            'start_date'      => 'required|valid_date',
            'target_end_date' => 'required|valid_date',
        ];

        if (!$this->validate($rules)) {
            $errorsArray = $this->validator->getErrors();
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => implode(', ', $errorsArray),
                'data'    => $this->request->getPost()
            ]);
        }

        $uid = sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $dataInsert = [
            'uid'                 => $uid,
            'name'                => $name,
            'description'         => $description,
            'category'            => $category,
            'status'              => 'Ongoing',
            'start_date'          => $startDate,
            'target_end_date'     => $endDate,
            'budget_amount'       => (float) $budget,
            'created_at'          => date('Y-m-d H:i:s'),
            'created_by'          => $sess['username']
        ];

        $this->apps->storeData($dataInsert, 'data_projects');

        return $this->response->setStatusCode(200)->setJSON([
            'status'  => 'success',
            'message' => 'Proyek berhasil ditambahkan.',
        ]);
    }

    public function updateProject(){
        $sess = session()->get();
        $uid = $this->request->getPost('project_uid') ?? $this->request->getPost('uid');
        if (empty($uid) && $this->request->getPost('id')) {
            $db = \Config\Database::connect();
            $existing = $db->table('data_projects')->where('id', (int)$this->request->getPost('id'))->get()->getRowArray();
            if ($existing) $uid = $existing['uid'];
        }
        
        $name        = $this->request->getPost('name');
        $description = $this->request->getPost('description');
        $category    = $this->request->getPost('category');
        $startDate   = $this->request->getPost('start_date');
        $endDate     = $this->request->getPost('target_end_date');
        $budget      = str_replace(',', '', $this->request->getPost('budget_amount') ?? '0');
        
        $rules = [
            'name'            => 'required',
            'start_date'      => 'required|valid_date',
            'target_end_date' => 'required|valid_date',
        ];

        if (!$this->validate($rules)) {
            $errorsArray = $this->validator->getErrors();
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => implode(', ', $errorsArray),
                'data'    => $this->request->getPost()
            ]);
        }

        if (empty($uid)) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Identitas (UID) proyek tidak valid untuk pembaruan.'
            ]);
        }

        $dataUpdate = [
            'name'                => $name,
            'description'         => $description,
            'category'            => $category,
            'start_date'          => $startDate,
            'target_end_date'     => $endDate,
            'budget_amount'       => (float) $budget,
            'updated_at'          => date('Y-m-d H:i:s'),
        ];

        // Using updateDataByField($field, $value, $data, $table)
        $this->apps->updateDataByField('uid', $uid, $dataUpdate, 'data_projects');

        return $this->response->setStatusCode(200)->setJSON([
            'status'  => 'success',
            'message' => 'Proyek berhasil diperbarui.',
        ]);
    }

    public function storeProgress()
    {
        $sess       = session()->get();
        $projectUid = $this->request->getPost('project_uid');
        $title      = $this->request->getPost('title');
        $logDate    = $this->request->getPost('log_date');
        $startDate  = $this->request->getPost('start_date');
        $endDate    = $this->request->getPost('end_date');
        $target     = $this->request->getPost('target_percentage');
        $actual     = $this->request->getPost('actual_percentage');
        $notes      = $this->request->getPost('notes');
        $id         = $this->request->getPost('id');

        $rules = [
            'project_uid'       => 'required',
            'title'             => 'permit_empty|max_length[255]',
            'log_date'          => 'required|valid_date',
            'start_date'        => 'permit_empty|valid_date',
            'end_date'          => 'permit_empty|valid_date',
            'actual_percentage' => 'required|numeric'
        ];

        $file = $this->request->getFile('foto');
        if ($file && $file->isValid()) {
            $rules['foto'] = 'max_size[foto,2048]|is_image[foto]|mime_in[foto,image/jpg,image/jpeg,image/png,image/webp]';
        }

        if (!$this->validate($rules)) {
            $errorsArray = $this->validator->getErrors();
            $firstError = reset($errorsArray);
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => $firstError ?: implode(', ', $errorsArray)
            ]);
        }

        $project = $this->manageProject->getProjectByUid($projectUid);
        if (!$project) {
            return $this->response->setJSON(['status' => 'error', 'message' => 'Project not found']);
        }

        $dataLog = [
            'project_id'        => $project['id'],
            'title'             => !empty($title) ? trim($title) : null,
            'log_date'          => $logDate,
            'start_date'        => !empty($startDate) ? $startDate : null,
            'end_date'          => !empty($endDate) ? $endDate : null,
            'target_percentage' => (float) $target,
            'actual_percentage' => (float) $actual,
            'notes'             => $notes,
            'created_by'        => $sess['username']
        ];

        // Handle Photo Upload
        if ($file && $file->isValid() && !$file->hasMoved()) {
            $storage = new \App\Services\Storage\FileStorageService();
            try {
                $stored = $storage->storeUploadedFile($file, 'projects_progress');

                $dataLog['file_name']          = $stored['file_name'];
                $dataLog['file_original_name'] = $stored['original_name'];
                $dataLog['file_size']          = $stored['size'];
                $dataLog['file_ext']           = '.' . $stored['ext'];
                $dataLog['file_path']          = $stored['dir_path'];

                // Delete old file if updating
                if (!empty($id)) {
                    $oldData = $this->manageProject->getProgressLogById($id);
                    if ($oldData && !empty($oldData['file_name'])) {
                        $oldTarget = !empty($oldData['file_path'])
                            ? rtrim((string) $oldData['file_path'], '/') . '/' . ltrim((string) $oldData['file_name'], '/')
                            : (string) $oldData['file_name'];
                        $storage->delete($oldTarget, 'projects_progress');
                    }
                }
            } catch (\Throwable $e) {
                return $this->apiException(
                    $e,
                    $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal mengunggah lampiran progres proyek.',
                    $e instanceof \RuntimeException ? 422 : 500,
                    'ManageProjectController::storeProgress'
                );
            }
        }

        if (!empty($id)) {
            $this->manageProject->saveProgressLog($dataLog, $id);
            $msg = 'Progres berhasil diperbarui';
        } else {
            $dataLog['created_at'] = date('Y-m-d H:i:s');
            $this->manageProject->saveProgressLog($dataLog);
            $msg = 'Progres berhasil disimpan';
        }

        // Update main project progress
        $this->manageProject->updateProjectProgress($project['id']);

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $msg
        ]);
    }

    public function storeBudget()
    {
        $sess       = session()->get();
        $projectUid = $this->request->getPost('project_uid');
        $date       = $this->request->getPost('realization_date');
        $amount     = str_replace(',', '', $this->request->getPost('amount') ?? '0');
        $desc       = $this->request->getPost('description');

        $rules = [
            'project_uid'      => 'required',
            'realization_date' => 'required|valid_date',
            'amount'           => 'required'
        ];

        if (!$this->validate($rules)) {
            $errorsArray = $this->validator->getErrors();
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => implode(', ', $errorsArray)
            ]);
        }

        $project = $this->manageProject->getProjectByUid($projectUid);
        if (!$project) {
            return $this->response->setJSON(['status' => 'error', 'message' => 'Project not found']);
        }

        $id         = $this->request->getPost('id');

        $dataRealization = [
            'project_id'       => $project['id'],
            'realization_date' => $date,
            'amount'           => (float) $amount,
            'description'      => $desc,
            'created_by'       => $sess['username']
        ];

        if (!empty($id)) {
            $this->apps->updateData($dataRealization, $id, 'data_project_budget_realizations');
            $msg = 'Realisasi anggaran berhasil diperbarui';
        } else {
            $dataRealization['created_at'] = date('Y-m-d H:i:s');
            $this->apps->storeData($dataRealization, 'data_project_budget_realizations');
            $msg = 'Realisasi anggaran berhasil disimpan';
        }

        // Update main project budget
        $this->manageProject->updateProjectBudget($project['id']);

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => $msg
        ]);
    }

    public function removeProject(){
        $sess = session()->get();
        $uid  = trim((string) ($this->request->getPost('uid') ?? $this->request->getPost('project_id') ?? ''));
        if ($uid === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Identitas (UID/ID) proyek tidak valid',
            ]);
        }
        
        $project = $this->manageProject->getProjectByUid($uid);
        if (!$project && is_numeric($uid)) {
            $db = \Config\Database::connect();
            $project = $db->table('data_projects')->where('id', (int)$uid)->get()->getRowArray();
        }

        if (!$project) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => false,
                'message' => 'Proyek tidak ditemukan',
            ]);
        }

        $this->apps->removeData($project['id'], 'data_projects');
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Proyek berhasil dihapus',
        ]);
    }

    public function importExcel(){
        $sess = session()->get();
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'File tidak valid atau belum diunggah.'
            ]);
        }

        $ext = strtolower($file->getClientExtension());
        if (!in_array($ext, ['xlsx', 'xls'])) {
            return $this->response->setJSON([
                'status'  => 'error',
                'message' => 'Format file harus berupa .xlsx atau .xls'
            ]);
        }

        try {
            $spreadsheet = IOFactory::load($file->getTempName());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            if (count($rows) <= 1) {
                return $this->response->setJSON([
                    'status'  => 'error',
                    'message' => 'File spreadsheet kosong atau hanya berisi baris judul.'
                ]);
            }

            $db = \Config\Database::connect();
            $inserted = 0;

            for ($i = 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                $name = trim((string)($row[0] ?? ''));
                if (empty($name)) continue;

                $category = trim((string)($row[1] ?? 'Infrastruktur Gedung'));
                $budgetStr = trim((string)($row[2] ?? '0'));
                $budget = (float)str_replace([',', '.', 'Rp', ' '], '', $budgetStr);

                $startDate = trim((string)($row[3] ?? ''));
                $endDate = trim((string)($row[4] ?? ''));
                $description = trim((string)($row[5] ?? ''));

                if (empty($startDate) || !strtotime($startDate)) {
                    $startDate = date('Y-m-d');
                } else {
                    $startDate = date('Y-m-d', strtotime($startDate));
                }

                if (empty($endDate) || !strtotime($endDate)) {
                    $endDate = date('Y-m-d', strtotime('+3 months'));
                } else {
                    $endDate = date('Y-m-d', strtotime($endDate));
                }

                $uid = sprintf(
                    '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                    mt_rand(0, 0xffff),
                    mt_rand(0, 0x0fff) | 0x4000,
                    mt_rand(0, 0x3fff) | 0x8000,
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
                );

                $db->table('data_projects')->insert([
                    'uid'                    => $uid,
                    'name'                   => $name,
                    'description'            => $description,
                    'category'               => $category,
                    'status'                 => 'Ongoing',
                    'start_date'             => $startDate,
                    'target_end_date'        => $endDate,
                    'budget_amount'          => $budget,
                    'realized_budget_amount' => 0,
                    'progress_percentage'    => 0,
                    'is_active'              => 1,
                    'created_at'             => date('Y-m-d H:i:s'),
                    'created_by'             => $sess['username'] ?? 'Import Batch'
                ]);
                $inserted++;
            }

            return $this->response->setJSON([
                'status'  => 'success',
                'message' => "Berhasil mengimpor {$inserted} paket proyek."
            ]);
        } catch (\Throwable $e) {
            return $this->apiException(
                $e,
                $e instanceof \RuntimeException ? $e->getMessage() : 'Gagal membaca file spreadsheet paket proyek.',
                $e instanceof \RuntimeException ? 422 : 500,
                'ManageProjectController::importBatch'
            );
        }
    }

    public function removeProgress()
    {
        $id         = $this->request->getPost('id');
        $projectUid = $this->request->getPost('project_uid');

        if (empty($id)) {
            return $this->response->setJSON(['status' => false, 'message' => 'ID tidak valid']);
        }

        $project = $this->manageProject->getProjectByUid($projectUid);
        if (!$project) {
            return $this->response->setJSON(['status' => false, 'message' => 'Project not found']);
        }

        // Delete photo file if exists
        $oldData = $this->manageProject->getProgressLogById($id);
        if ($oldData && !empty($oldData['file_name'])) {
            $oldTarget = !empty($oldData['file_path'])
                ? rtrim((string) $oldData['file_path'], '/') . '/' . ltrim((string) $oldData['file_name'], '/')
                : (string) $oldData['file_name'];
            (new \App\Services\Storage\FileStorageService())->delete($oldTarget, 'projects_progress');
        }

        $this->manageProject->deleteProgressLog($id);
        $this->manageProject->updateProjectProgress($project['id']);

        return $this->response->setJSON(['status' => true, 'message' => 'Progres berhasil dihapus']);
    }

    public function removeBudget()
    {
        $id = $this->request->getPost('id');
        $projectUid = $this->request->getPost('project_uid');

        if (empty($id)) {
            return $this->response->setJSON(['status' => false, 'message' => 'ID tidak valid']);
        }

        $project = $this->manageProject->getProjectByUid($projectUid);
        if (!$project) {
            return $this->response->setJSON(['status' => false, 'message' => 'Project not found']);
        }

        $this->apps->removeData($id, 'data_project_budget_realizations');
        $this->manageProject->updateProjectBudget($project['id']);

        return $this->response->setJSON(['status' => true, 'message' => 'Realisasi anggaran berhasil dihapus']);
    }

}
