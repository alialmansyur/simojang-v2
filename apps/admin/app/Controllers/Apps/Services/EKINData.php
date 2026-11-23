<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\Apps\Services\EKINModel;
use App\Models\Apps\AppsModel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

class EKINData extends BaseController
{

    public function __construct()
    { 
        $this->ekinmodel = new EKINModel();
        $this->apps = new AppsModel();
        $this->uploader = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
        $sess = session()->get();
    }

    public function importData(){
        $session = session()->get();
        $file    = $this->request->getFile('file');
        $period   = $this->request->getPost('period');
        $syncdate1 = $this->request->getPost('syncdate1');
        $syncdate2 = $this->request->getPost('syncdate2');

        try {
            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows      = $this->uploader->parseExcel($localPath);
        } catch (\Throwable $e) {
            return $this->apiException($e, $e instanceof \RuntimeException ? $e->getMessage() : 'Berkas Excel tidak valid atau gagal dibaca.', 422, 'EKINData::importData');
        }

        if (!is_array($rows) || count($rows) < 1) {
            return $this->apiError('Data kosong atau format salah.', 422);
        }

        $fileSize   = filesize($localPath);
        $mimeType   = $file->getMimeType();
        $checksum   = hash_file('sha256', $localPath);
        $ipAddress  = $this->request->getIPAddress();
        $userAgent  = $this->request->getUserAgent()
                        ? $this->request->getUserAgent()->getAgentString()
                        : null;      
        
        $this->apps->db->transBegin();
        
        $dataLog = [
            'action'     => 'create',
            'period'     => $period,
            'period_date'       => $syncdate1,
            'period_start_date' => $syncdate1,
            'period_end_date'   => $syncdate2,
            'file_name'  => $file->getClientName(),
            'file_size'  => $fileSize,
            'file_type'  => $mimeType,
            'file_hash'  => $checksum,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'created_by' => $session['username'] ?? null,
        ];

        $logID = $this->apps->storeData($dataLog, 'txn_ekin');        

        $header = [
            'ekin_log_id'   => $logID,
            'unit'          => $rows[0][0] ?? null,
            'sub_unit'      => $this->getValueAfterColon($rows[1][0] ?? null),
            'periode'       => $this->getValueAfterColon($rows[2][0] ?? null),
            'tanggal_kegiatan'    => $this->tanggalIndoToYmd($this->getValueAfterColon($rows[3][0] ?? null)),
            'created_by'    => $session['username'] ?? null,
        ];

        $HeaderID = $this->apps->storeData($header, 'txn_ekin_header');   

        $lastNip  = null;
        $dataDetail = [];
        $startRead = false;

        foreach ($rows as $row) {
            if (
                isset($row[1], $row[2], $row[3]) &&
                strtolower(trim($row[1])) === 'nama' &&
                strtolower(trim($row[2])) === 'nip'
            ) {
                $startRead = true;
                continue;
            }

            if (!$startRead) {
                continue;
            }

            $nip  = trim($row[2] ?? '');
            if ($nip !== '') {
                if (!$this->isValidNIP($nip)) {
                    $this->apps->db->transRollback();
                    return $this->response->setJSON([
                        'status' => 'error',
                        'message' => "NIP tidak valid: {$nip}"
                    ]);
                }
                $lastNip = $nip;
            }

            if (!$lastNip) {
                $this->apps->db->transRollback();
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'NIP tidak terbaca sebelum data kegiatan'
                ]);
            }

            $dataDetail[] = [
                'ekin_log_id'       => $logID,
                'ekin_header_id'    => $HeaderID,
                'nip'           => $lastNip,
                'waktu'         => trim($row[3]),
                'kegiatan'      => trim($row[4]),
                'realisasi'     => $row[5] ?? 0,
                'created_by'    => $session['username'] ?? null,
            ];
        }

        if (empty($dataDetail)) {
            $this->apps->db->transRollback();
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Data detail tidak ditemukan'
            ]);
        }

        if (!empty($dataDetail)) {
            $this->apps->insertBatchData($dataDetail, 'txn_ekin_detail');
            $this->apps->storeData(
                [
                    'layanan_id' => 26,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => $session['username']
                ],
                'activity_daily_logs'
            );            
        }

        if ($this->apps->db->transStatus() === false) {
            $this->apps->db->transRollback();
            return $this->response->setJSON([
                'status' => 'error',
                'message'=> 'Gagal menyimpan data ke database.'
            ]);
        }

        $this->apps->db->transCommit();

        return $this->response->setJSON([
            'header'    => $header,
            'status' => 'success',
            'total'  => count($dataDetail),
            'message'=> 'Upload dan import data berhasil'
        ]);        
    } 

    private function getValueAfterColon(?string $text): ?string
    {
        if (!$text) {
            return null;
        }

        if (strpos($text, ':') === false) {
            return null;
        }

        return trim(explode(':', $text, 2)[1]);
    }

    function tanggalIndoToYmd(string $tanggal): ?string
    {
        $bulan = [
            'Januari'   => 'January',
            'Februari'  => 'February',
            'Maret'     => 'March',
            'April'     => 'April',
            'Mei'       => 'May',
            'Juni'      => 'June',
            'Juli'      => 'July',
            'Agustus'   => 'August',
            'September' => 'September',
            'Oktober'   => 'October',
            'November'  => 'November',
            'Desember'  => 'December',
        ];

        // Normalisasi spasi
        $tanggal = trim(preg_replace('/\s+/', ' ', $tanggal));

        // Ganti nama bulan ke EN
        $tanggal = str_replace(
            array_keys($bulan),
            array_values($bulan),
            $tanggal
        );

        // Validasi & konversi
        if (!strtotime($tanggal)) {
            return null;
        }

        return date('Y-m-d', strtotime($tanggal));
    }

    private function isValidNIP(string $nip): bool
    {
        return preg_match('/^\d{18}$/', $nip);
    }

    public function removeData(){
        $sess = session()->get();
        $key  = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }
        $this->apps->removeData($key,'txn_ekin'); 
        $this->apps->removeDataLogEKIN($key,'txn_ekin_header');        
        $this->apps->removeDataLogEKIN($key,'txn_ekin_detail');        
        return $this->response->setJSON([
            'key'     => $key,
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }       
    
    public function getData(){
        $bulan   = $this->request->getPost('bulan');
        $subUnit = trim((string) ($this->request->getPost('sub_unit') ?? $this->request->getPost('category') ?? ''));

        if (!is_array($bulan)) {
            $bulan = [];
        }

        if (count($bulan) > 2) {
            return $this->response->setJSON([
                'error' => 'Maksimal 2 bulan diperbolehkan'
            ])->setStatusCode(400);
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $builder = $this->ekinmodel->getBuilder('recap', [
            'bulan'    => $bulan,
            'sub_unit' => $subUnit,
        ]);

        $columns    = $this->ekinmodel->getColumns('recap');
        $result     = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getDataChild()
    {
        $periodDate = trim((string) $this->request->getPost('period_date'));
        if ($periodDate === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 'error',
                'message' => 'Tanggal parent tidak valid',
                'list' => [],
            ]);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $periodDate)) {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 'error',
                'message' => 'Format tanggal parent tidak valid',
                'list' => [],
            ]);
        }

        $list = $this->ekinmodel->getChildByPeriodDate($periodDate);
        return $this->response->setJSON([
            'status' => 'success',
            'list' => $list,
        ]);
    }  

    public function getSummary()
    {
        $bulan   = $this->request->getPost('bulan');
        $subUnit = trim((string) ($this->request->getPost('sub_unit') ?? $this->request->getPost('category') ?? ''));

        if (!is_array($bulan)) {
            $bulan = [];
        }

        if (count($bulan) > 2) {
            return $this->response->setJSON([
                'error' => 'Maksimal 2 bulan diperbolehkan'
            ])->setStatusCode(400);
        }

        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        return $this->response->setJSON([
            'status' => 'success',
            'summary' => $this->ekinmodel->getSummary($bulan, $subUnit),
        ]);
    }

    public function getDataDetail(){
        $draw       = (int) ($this->request->getPost('draw') ?? 0);
        $key        = (int) ($this->request->getPost('key') ?? 0);
        $periodDate = trim((string) ($this->request->getPost('period_date') ?? ''));
        $subUnit    = trim((string) ($this->request->getPost('sub_unit') ?? ''));

        $param = $key > 0 ? $key : $periodDate;

        if (empty($param)) {
            return $this->response->setJSON([
                'draw' => $draw,
                'recordsTotal' => 0,
                'recordsFiltered' => 0,
                'data' => [],
            ]);
        }

        $builder = $this->ekinmodel->getBuilder('detail', $param, $subUnit);
        $data = $builder->get()->getResultArray();
        return $this->response->setJSON([
            'status' => 'success',
            'draw' => $draw,
            'recordsTotal' => count($data),
            'recordsFiltered' => count($data),
            'data' => $data,
        ]);
    }

    public function storeManualData()
    {
        $session = session()->get();
        $id = (int) ($this->request->getPost('id') ?? 0);
        $subUnit = trim((string) ($this->request->getPost('sub_unit') ?? 'Subbagian Kepegawaian Kantor Regional III BKN'));
        $tanggal = trim((string) ($this->request->getPost('tanggal_kegiatan') ?? date('Y-m-d')));
        $nip = trim((string) ($this->request->getPost('nip') ?? ''));
        $waktu = trim((string) ($this->request->getPost('waktu') ?? '08:00 - 16:00'));
        $kegiatan = trim((string) ($this->request->getPost('kegiatan') ?? ''));
        $realisasi = trim((string) ($this->request->getPost('realisasi') ?? '1'));

        if ($nip === '' || !$this->isValidNIP($nip)) {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 'error',
                'message' => 'NIP pegawai tidak valid (wajib 18 digit angka).',
            ]);
        }

        if ($kegiatan === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 'error',
                'message' => 'Uraian kegiatan wajib diisi.',
            ]);
        }

        $this->apps->db->transBegin();

        if ($id > 0) {
            // Edit existing detail row
            $updateData = [
                'nip' => $nip,
                'waktu' => $waktu,
                'kegiatan' => $kegiatan,
                'realisasi' => $realisasi,
                'updated_at' => date('Y-m-d H:i:s'),
            ];
            $this->apps->db->table('txn_ekin_detail')->where('id', $id)->update($updateData);
        } else {
            // Find existing log & header for this date & sub_unit, or create them
            $existingHeader = $this->apps->db->table('txn_ekin_header h')
                ->select('h.id AS header_id, h.ekin_log_id')
                ->join('txn_ekin a', 'a.id = h.ekin_log_id')
                ->where('h.tanggal_kegiatan', $tanggal)
                ->where('h.sub_unit', $subUnit)
                ->get()
                ->getRowArray();

            if ($existingHeader && !empty($existingHeader['header_id'])) {
                $logId = $existingHeader['ekin_log_id'];
                $headerId = $existingHeader['header_id'];
            } else {
                $monthStr = date('Y-m', strtotime($tanggal));
                $dataLog = [
                    'action' => 'manual',
                    'period' => $monthStr,
                    'period_date' => $tanggal,
                    'period_start_date' => $tanggal,
                    'period_end_date' => $tanggal,
                    'file_name' => 'manual_entry.sys',
                    'file_size' => 0,
                    'file_type' => 'manual',
                    'file_hash' => 'manual',
                    'ip_address' => $this->request->getIPAddress(),
                    'created_by' => $session['username'] ?? 'Admin',
                ];
                $logId = $this->apps->storeData($dataLog, 'txn_ekin');

                $header = [
                    'ekin_log_id' => $logId,
                    'unit' => '4011 - Bagian Tata Usaha Kantor Regional III BKN',
                    'sub_unit' => $subUnit,
                    'periode' => date('F Y', strtotime($tanggal)),
                    'tanggal_kegiatan' => $tanggal,
                    'created_by' => $session['username'] ?? 'Admin',
                ];
                $headerId = $this->apps->storeData($header, 'txn_ekin_header');
            }

            $detail = [
                'ekin_log_id' => $logId,
                'ekin_header_id' => $headerId,
                'nip' => $nip,
                'waktu' => $waktu,
                'kegiatan' => $kegiatan,
                'realisasi' => $realisasi,
                'created_by' => $session['username'] ?? 'Admin',
            ];
            $this->apps->db->table('txn_ekin_detail')->insert($detail);
        }

        if ($this->apps->db->transStatus() === false) {
            $this->apps->db->transRollback();
            return $this->response->setStatusCode(500)->setJSON([
                'status' => 'error',
                'message' => 'Gagal menyimpan data kegiatan ke basis data.',
            ]);
        }

        $this->apps->db->transCommit();

        return $this->response->setJSON([
            'status' => 'success',
            'message' => $id > 0 ? 'Data kegiatan berhasil diperbarui.' : 'Data kegiatan berhasil disimpan.',
        ]);
    } 

    // public function getData(){
    //     $sess = session()->get();
    //     $builder = $this->dmsmodel->getDataRecap($sess['username']);
    //     $columns = ['uid','nip','nama', 'kode_instansi', 'nama_instansi','d2nip','ijazah','akta','drh','cpns','pns','perubahan','kp','jabatan','berhenti','pensiun','tanggal_proses','created_by','created_at'];
    //     $result = $this->dataTables->render($builder, $columns);
    //     return $this->response->setJSON($result);
    // }

    // public function getDataV2(){
    //     $sess = session()->get();
    //     $builder = $this->dmsmodel->getDataRecapV2($sess['username']);
    //     $columns = ['id', 'uid', 'upload_id','nama_instansi','logo', 'nip', 'kode_instansi', 'd2nip', 'ijazah', 'drh', 'cpns', 'pns', 'kp', 'jabatan', 'perubahan', 'berhenti', 'pensiun', 'total_doc', 'tanggal_proses', 'created_by', 'created_at', 'pic','update_at'];
    //     $result = $this->dataTables->render($builder, $columns);
    //     return $this->response->setJSON($result);
    // }

    // public function getDataUpload(){
    //     $sess = session()->get();
    //     $builder = $this->dmsmodel->getDataRecapUpload($sess['username']);
    //     $columns = ['uid','nip','nama', 'kode_instansi', 'nama_instansi','d2nip','ijazah','akta','drh','cpns','pns','perubahan','kp','jabatan','berhenti','pensiun','tanggal_proses','created_by','created_at'];
    //     $result = $this->dataTables->render($builder, $columns);
    //     return $this->response->setJSON($result);
    // }    

    // public function getResume() {
    //     $sess   = session()->get();
    //     $resume = $this->dmsmodel->getResumeData($sess['username']);
    //     $daily  = $this->dmsmodel->getDailyData($sess['username']);
    //     return $this->response->setJSON([
    //         'resume' => $resume,
    //         'daily'  => $daily,
    //     ]);        
    // }

}


