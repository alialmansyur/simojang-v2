<?php

namespace App\Controllers\Apps\Services;

use App\Controllers\BaseController;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;
use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\STKModel;

class StatistikData extends BaseController
{
    private const JENIS_LIST = [
        'Jumlah ASN',
        'Golongan ASN',
        'Jenis Kelamin ASN',
        'Pendidikan ASN',
        'Usia ASN',
        'Generasi ASN',
        'Kelompok Jabatan ASN',
        'Masa Kerja ASN',
    ];

    public function __construct()
    {
        $this->stkmodel   = new STKModel();
        $this->apps       = new AppsModel();
        $this->uploader   = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
    }

    public function storeData()
    {
        $sess      = session()->get();
        $file      = $this->request->getFile('file');
        $period    = trim((string) ($this->request->getPost('period') ?: date('Y-m')));
        $syncdate1 = trim((string) ($this->request->getPost('syncdate1') ?: ($this->request->getPost('startdate') ?: date('Y-m-d'))));
        $syncdate2 = trim((string) ($this->request->getPost('syncdate2') ?: ($this->request->getPost('enddate') ?: $syncdate1)));
        $jenis     = trim((string) $this->request->getPost('doc_category'));

        $rules = [
            'doc_category' => 'required',
        ];

        if (!$this->validate($rules)) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => $this->validator->getErrors()
            ]);
        }

        try {
            $this->uploader->validateFile($file);
            $localPath = $file->getTempName();
            $rows      = $this->uploader->parseExcel($localPath);
        } catch (\Throwable $e) {
            return $this->apiException($e, $e instanceof \RuntimeException ? $e->getMessage() : 'Berkas Excel tidak valid atau gagal dibaca.', 422, 'StatistikData::storeData');
        }

        if (!is_array($rows) || count($rows) < 1) {
            return $this->apiError('Data kosong atau format salah.', 422);
        }

        $fileSize  = filesize($localPath);
        $mimeType  = substr((string) $file->getMimeType(), 0, 30);
        $checksum  = substr((string) hash_file('sha256', $localPath), 0, 50);
        $ipAddress = substr((string) $this->request->getIPAddress(), 0, 50);
        $userAgent = $this->request->getUserAgent()
                        ? substr((string) $this->request->getUserAgent()->getAgentString(), 0, 50)
                        : 'Web Browser';
        $username  = substr((string) ($sess['username'] ?? 'admin'), 0, 18);

        $dataLog = [
            'action'            => 'upload',
            'jenis'             => substr($jenis, 0, 50),
            'date'              => $syncdate1,
            'period'            => substr($period, 0, 30),
            'period_date'       => $syncdate1,
            'period_start_date' => $syncdate1,
            'period_end_date'   => $syncdate2,
            'file_name'         => substr((string) $file->getClientName(), 0, 50),
            'file_size'         => $fileSize,
            'file_type'         => $mimeType,
            'file_hash'         => $checksum,
            'ip_address'        => $ipAddress,
            'user_agent'        => $userAgent,
            'created_by'        => $username,
        ];

        $insertID = $this->apps->storeData($dataLog, 'txn_asn');

        $syncDate        = date('Y-m-d H:i:s');
        $mappingFunction = $this->getMapperForJenis($jenis, $insertID, $syncDate);
        $table           = $this->getTableForJenis($jenis);

        $dataBatch = [];
        foreach (array_slice($rows, 2) as $row) {
            if (empty($row[0])) {
                continue;
            }
            $dataBatch[] = $mappingFunction($row);
        }

        if ($dataBatch) {
            $this->apps->insertBatchData($dataBatch, $table);
            $this->apps->storeData(
                [
                    'layanan_id' => 21,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => $username,
                ],
                'activity_daily_logs'
            );
        }

        return $this->response->setJSON([
            'status'   => 'success',
            'message'  => 'Upload dan import data berhasil.',
            'datalist' => $dataBatch
        ]);
    }

    private function getMapperForJenis($jenis, $insertID, $syncdate)
    {
        switch ($jenis) {
            case 'Jumlah ASN':
                return function ($row) use ($insertID, $syncdate) {
                    return [
                        'asn_log_id'  => $insertID,
                        'instansi_id' => $row[0],
                        'pns'         => ExcelUploader::cleanNumber($row[2] ?? 0),
                        'pppk'        => ExcelUploader::cleanNumber($row[3] ?? 0),
                        'pppk_pw'     => ExcelUploader::cleanNumber($row[4] ?? 0),
                        'jumlah'      => ExcelUploader::cleanNumber($row[5] ?? 0),
                        'tanggal'     => $syncdate
                    ];
                };

            case 'Golongan ASN':
                return function ($row) use ($insertID, $syncdate) {
                    return [
                        'asn_log_id'      => $insertID,
                        'instansi_id'     => $row[0],
                        'pns_gol_i'       => ExcelUploader::cleanNumber($row[2] ?? 0),
                        'pns_gol_ii'      => ExcelUploader::cleanNumber($row[3] ?? 0),
                        'pns_gol_iii'     => ExcelUploader::cleanNumber($row[4] ?? 0),
                        'pns_gol_iv'      => ExcelUploader::cleanNumber($row[5] ?? 0),
                        'pppk_gol_i'      => ExcelUploader::cleanNumber($row[6] ?? 0),
                        'pppk_gol_ii'     => ExcelUploader::cleanNumber($row[7] ?? 0),
                        'pppk_gol_iii'    => ExcelUploader::cleanNumber($row[8] ?? 0),
                        'pppk_gol_iv'     => ExcelUploader::cleanNumber($row[9] ?? 0),
                        'pppk_gol_v'      => ExcelUploader::cleanNumber($row[10] ?? 0),
                        'pppk_gol_vi'     => ExcelUploader::cleanNumber($row[11] ?? 0),
                        'pppk_gol_vii'    => ExcelUploader::cleanNumber($row[12] ?? 0),
                        'pppk_gol_viii'   => ExcelUploader::cleanNumber($row[13] ?? 0),
                        'pppk_gol_ix'     => ExcelUploader::cleanNumber($row[14] ?? 0),
                        'pppk_gol_x'      => ExcelUploader::cleanNumber($row[15] ?? 0),
                        'pppk_gol_xi'     => ExcelUploader::cleanNumber($row[16] ?? 0),
                        'pppk_gol_xii'    => ExcelUploader::cleanNumber($row[17] ?? 0),
                        'pppk_gol_xiii'   => ExcelUploader::cleanNumber($row[18] ?? 0),
                        'pppk_gol_xiv'    => ExcelUploader::cleanNumber($row[19] ?? 0),
                        'pppk_gol_xv'     => ExcelUploader::cleanNumber($row[20] ?? 0),
                        'pppk_gol_xvi'    => ExcelUploader::cleanNumber($row[21] ?? 0),
                        'pppk_gol_xvii'   => ExcelUploader::cleanNumber($row[22] ?? 0),
                        'pppk_pw_gol_v_x' => ExcelUploader::cleanNumber($row[23] ?? 0),
                        'jumlah'          => ExcelUploader::cleanNumber($row[24] ?? 0),
                        'tanggal'         => $syncdate
                    ];
                };

            case 'Jenis Kelamin ASN':
                return function ($row) use ($insertID, $syncdate) {
                    return [
                        'asn_log_id'     => $insertID,
                        'instansi_id'    => $row[0],
                        'pns_pria'       => ExcelUploader::cleanNumber($row[2] ?? 0),
                        'pns_wanita'     => ExcelUploader::cleanNumber($row[3] ?? 0),
                        'pppk_pria'      => ExcelUploader::cleanNumber($row[4] ?? 0),
                        'pppk_wanita'    => ExcelUploader::cleanNumber($row[5] ?? 0),
                        'pppk_pw_pria'   => ExcelUploader::cleanNumber($row[6] ?? 0),
                        'pppk_pw_wanita' => ExcelUploader::cleanNumber($row[7] ?? 0),
                        'jumlah'         => ExcelUploader::cleanNumber($row[8] ?? 0),
                        'tanggal'        => $syncdate
                    ];
                };

            case 'Pendidikan ASN':
                return function ($row) use ($insertID, $syncdate) {
                    return [
                        'asn_log_id'  => $insertID,
                        'instansi_id' => $row[0],
                        'pns_sd'      => ExcelUploader::cleanNumber($row[2] ?? 0),
                        'pns_smp'     => ExcelUploader::cleanNumber($row[3] ?? 0),
                        'pns_sma'     => ExcelUploader::cleanNumber($row[4] ?? 0),
                        'pns_d1'      => ExcelUploader::cleanNumber($row[5] ?? 0),
                        'pns_d2'      => ExcelUploader::cleanNumber($row[6] ?? 0),
                        'pns_d3'      => ExcelUploader::cleanNumber($row[7] ?? 0),
                        'pns_s1'      => ExcelUploader::cleanNumber($row[8] ?? 0),
                        'pns_s2'      => ExcelUploader::cleanNumber($row[9] ?? 0),
                        'pns_s3'      => ExcelUploader::cleanNumber($row[10] ?? 0),
                        'pppk_sd'     => ExcelUploader::cleanNumber($row[11] ?? 0),
                        'pppk_smp'    => ExcelUploader::cleanNumber($row[12] ?? 0),
                        'pppk_sma'    => ExcelUploader::cleanNumber($row[13] ?? 0),
                        'pppk_d1'     => ExcelUploader::cleanNumber($row[14] ?? 0),
                        'pppk_d2'     => ExcelUploader::cleanNumber($row[15] ?? 0),
                        'pppk_d3'     => ExcelUploader::cleanNumber($row[16] ?? 0),
                        'pppk_s1'     => ExcelUploader::cleanNumber($row[17] ?? 0),
                        'pppk_s2'     => ExcelUploader::cleanNumber($row[18] ?? 0),
                        'pppk_s3'     => ExcelUploader::cleanNumber($row[19] ?? 0),
                        'pppk_pw_sd'  => ExcelUploader::cleanNumber($row[20] ?? 0),
                        'pppk_pw_smp' => ExcelUploader::cleanNumber($row[21] ?? 0),
                        'pppk_pw_sma' => ExcelUploader::cleanNumber($row[22] ?? 0),
                        'pppk_pw_d1'  => ExcelUploader::cleanNumber($row[23] ?? 0),
                        'pppk_pw_d2'  => ExcelUploader::cleanNumber($row[24] ?? 0),
                        'pppk_pw_d3'  => ExcelUploader::cleanNumber($row[25] ?? 0),
                        'pppk_pw_s1'  => ExcelUploader::cleanNumber($row[26] ?? 0),
                        'pppk_pw_s2'  => ExcelUploader::cleanNumber($row[28] ?? 0),
                        'pppk_pw_s3'  => ExcelUploader::cleanNumber($row[29] ?? 0),
                        'jumlah'      => ExcelUploader::cleanNumber($row[30] ?? 0),
                        'tanggal'     => $syncdate
                    ];
                };

            case 'Usia ASN':
                return function ($row) use ($insertID, $syncdate) {
                    return [
                        'asn_log_id'             => $insertID,
                        'instansi_id'            => $row[0],
                        'pns_kurang_sama_31'     => ExcelUploader::cleanNumber($row[2] ?? 0),
                        'pns_31_40'              => ExcelUploader::cleanNumber($row[3] ?? 0),
                        'pns_41_50'              => ExcelUploader::cleanNumber($row[4] ?? 0),
                        'pns_lebih_sama_51'      => ExcelUploader::cleanNumber($row[5] ?? 0),
                        'pppk_kurang_sama_31'    => ExcelUploader::cleanNumber($row[6] ?? 0),
                        'pppk_31_40'             => ExcelUploader::cleanNumber($row[7] ?? 0),
                        'pppk_41_50'             => ExcelUploader::cleanNumber($row[8] ?? 0),
                        'pppk_lebih_sama_51'     => ExcelUploader::cleanNumber($row[9] ?? 0),
                        'pppk_pw_kurang_sama_31' => ExcelUploader::cleanNumber($row[10] ?? 0),
                        'pppk_pw_31_40'          => ExcelUploader::cleanNumber($row[11] ?? 0),
                        'pppk_pw_41_50'          => ExcelUploader::cleanNumber($row[12] ?? 0),
                        'pppk_pw_lebih_sama_51'  => ExcelUploader::cleanNumber($row[13] ?? 0),
                        'jumlah'                 => ExcelUploader::cleanNumber($row[14] ?? 0),
                        'tanggal'                => $syncdate
                    ];
                };

            case 'Generasi ASN':
                return function ($row) use ($insertID, $syncdate) {
                    return [
                        'asn_log_id'           => $insertID,
                        'instansi_id'          => $row[0],
                        'pns_pppk_baby_boomer' => ExcelUploader::cleanNumber($row[2] ?? 0),
                        'pns_pppk_gen_x'       => ExcelUploader::cleanNumber($row[3] ?? 0),
                        'pns_pppk_gen_y'       => ExcelUploader::cleanNumber($row[4] ?? 0),
                        'pns_pppk_gen_z'       => ExcelUploader::cleanNumber($row[5] ?? 0),
                        'pppk_pw_baby_boomer'  => ExcelUploader::cleanNumber($row[6] ?? 0),
                        'pppk_pw_gen_x'        => ExcelUploader::cleanNumber($row[7] ?? 0),
                        'pppk_pw_gen_y'        => ExcelUploader::cleanNumber($row[8] ?? 0),
                        'pppk_pw_gen_z'        => ExcelUploader::cleanNumber($row[9] ?? 0),
                        'jumlah'               => ExcelUploader::cleanNumber($row[10] ?? 0),
                        'tanggal'              => $syncdate
                    ];
                };

            case 'Kelompok Jabatan ASN':
                return function ($row) use ($insertID, $syncdate) {
                    return [
                        'asn_log_id'             => $insertID,
                        'instansi_id'            => $row[0],
                        'pns_jpt_madya'          => ExcelUploader::cleanNumber($row[2] ?? 0),
                        'pns_jpt_pratama'        => ExcelUploader::cleanNumber($row[3] ?? 0),
                        'pns_administrator'      => ExcelUploader::cleanNumber($row[4] ?? 0),
                        'pns_pengawas'           => ExcelUploader::cleanNumber($row[5] ?? 0),
                        'pns_eselon_v'           => ExcelUploader::cleanNumber($row[6] ?? 0),
                        'pns_struktural_kosong'  => ExcelUploader::cleanNumber($row[7] ?? 0),
                        'pns_jf_guru'            => ExcelUploader::cleanNumber($row[8] ?? 0),
                        'pns_jf_nakes'           => ExcelUploader::cleanNumber($row[9] ?? 0),
                        'pns_jf_teknis'          => ExcelUploader::cleanNumber($row[10] ?? 0),
                        'pns_jf_kosong'          => ExcelUploader::cleanNumber($row[11] ?? 0),
                        'pns_pelaksana'          => ExcelUploader::cleanNumber($row[12] ?? 0),
                        'pppk_jpt_madya'         => ExcelUploader::cleanNumber($row[13] ?? 0),
                        'pppk_jpt_pratama'       => ExcelUploader::cleanNumber($row[14] ?? 0),
                        'pppk_administrator'     => ExcelUploader::cleanNumber($row[15] ?? 0),
                        'pppk_pengawas'          => ExcelUploader::cleanNumber($row[16] ?? 0),
                        'pppk_eselon_v'          => ExcelUploader::cleanNumber($row[17] ?? 0),
                        'pppk_struktural_kosong' => ExcelUploader::cleanNumber($row[18] ?? 0),
                        'pppk_jf_guru'           => ExcelUploader::cleanNumber($row[19] ?? 0),
                        'pppk_jf_nakes'          => ExcelUploader::cleanNumber($row[20] ?? 0),
                        'pppk_jf_teknis'         => ExcelUploader::cleanNumber($row[21] ?? 0),
                        'pppk_jf_kosong'         => ExcelUploader::cleanNumber($row[22] ?? 0),
                        'pppk_pelaksana'         => ExcelUploader::cleanNumber($row[23] ?? 0),
                        'pppk_pw_jf'             => ExcelUploader::cleanNumber($row[24] ?? 0),
                        'pppk_pw_pelaksana'      => ExcelUploader::cleanNumber($row[25] ?? 0),
                        'jumlah'                 => ExcelUploader::cleanNumber($row[26] ?? 0),
                        'tanggal'                => $syncdate
                    ];
                };

            case 'Masa Kerja ASN':
                return function ($row) use ($insertID, $syncdate) {
                    return [
                        'asn_log_id'          => $insertID,
                        'instansi_id'         => $row[0],
                        'masa_kerja_0_10'     => ExcelUploader::cleanNumber($row[2] ?? 0),
                        'masa_kerja_11_20'    => ExcelUploader::cleanNumber($row[3] ?? 0),
                        'masa_kerja_21_30'    => ExcelUploader::cleanNumber($row[4] ?? 0),
                        'masa_kerja_lebih_30' => ExcelUploader::cleanNumber($row[5] ?? 0),
                        'masa_kerja_pw'       => ExcelUploader::cleanNumber($row[6] ?? 0),
                        'jumlah'              => ExcelUploader::cleanNumber($row[7] ?? 0),
                        'tanggal'             => $syncdate
                    ];
                };

            default:
                throw new \Exception('Jenis tidak dikenali.');
        }
    }

    private function getTableForJenis($jenis)
    {
        switch ($jenis) {
            case 'Jumlah ASN':
                return 'txn_asn_jumlahs';
            case 'Golongan ASN':
                return 'txn_asn_golongans';
            case 'Jenis Kelamin ASN':
                return 'txn_asn_jenis_kelamins';
            case 'Pendidikan ASN':
                return 'txn_asn_pendidikans';
            case 'Usia ASN':
                return 'txn_asn_usias';
            case 'Generasi ASN':
                return 'txn_asn_generasis';
            case 'Kelompok Jabatan ASN':
                return 'txn_asn_kelompok_jabatans';
            case 'Masa Kerja ASN':
                return 'txn_asn_masa_kerjas';
            default:
                throw new \Exception('Jenis tidak dikenali.');
        }
    }

    public function removeData()
    {
        $key   = trim((string) $this->request->getPost('key'));
        $jenis = trim((string) $this->request->getPost('jenis'));
        if ($key === '' || $jenis === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => false,
                'message' => 'Parameter penghapusan tidak valid',
            ]);
        }

        $table = $this->getTableForJenis($jenis);
        $this->apps->removeData($key, 'txn_asn');
        $this->apps->removeDataLogStatistik($key, $table);
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function getData()
    {
        $jenis = trim((string) $this->request->getPost('jenis'));
        if ($jenis === '' || strtolower($jenis) === 'all') {
            $jenis = 'Jumlah ASN';
        }
        if (!in_array($jenis, self::JENIS_LIST, true)) {
            return $this->response->setJSON([
                'draw'            => (int) ($this->request->getPost('draw') ?? 1),
                'recordsTotal'    => 0,
                'recordsFiltered' => 0,
                'data'            => [],
            ]);
        }

        $bulan = $this->request->getPost('bulan');
        if (!is_array($bulan)) {
            $bulan = [];
        }
        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        $params = [
            'jenis' => $jenis,
            'bulan' => $bulan,
        ];

        $builder = $this->stkmodel->getBuilder('recap', $params);
        $columns = $this->stkmodel->getColumns('recap', $params);
        $result  = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getDataDetail()
    {
        $key = (int) $this->request->getPost('key');
        if ($key <= 0) {
            return $this->response->setStatusCode(400)->setJSON([
                'error' => 'Kunci detail tidak valid'
            ]);
        }

        $builder = $this->stkmodel->getBuilder('detail', $key);
        $columns = $this->stkmodel->getColumns('detail', $key);
        $result  = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getSummary()
    {
        $jenis = trim((string) $this->request->getPost('jenis'));
        if ($jenis === '' || strtolower($jenis) === 'all') {
            $jenis = 'Jumlah ASN';
        }
        if (!in_array($jenis, self::JENIS_LIST, true)) {
            return $this->response->setJSON([
                'status'  => true,
                'summary' => [
                    'total_upload'   => 0,
                    'total_data'     => 0,
                    'total_instansi' => 0,
                    'total_periode'  => 0,
                    'last_update'    => null,
                ],
            ]);
        }

        $bulan = $this->request->getPost('bulan');
        if (!is_array($bulan)) {
            $bulan = [];
        }
        $bulan = array_values(array_filter(array_map('intval', $bulan), static function ($item) {
            return $item >= 1 && $item <= 12;
        }));

        return $this->response->setJSON([
            'status'  => true,
            'summary' => $this->stkmodel->getSummary($jenis, $bulan),
        ]);
    }
}
