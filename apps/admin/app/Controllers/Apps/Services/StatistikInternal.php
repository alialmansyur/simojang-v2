<?php

namespace App\Controllers\Apps\Services;
use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Libraries\ExcelUploader;
use App\Libraries\DataTablesLib;

use App\Models\Apps\AppsModel;
use App\Models\Apps\Services\STKInternalModel;

class StatistikInternal extends BaseController
{
    protected $apps;
    protected $simodel;
    protected $uploader;
    protected $dataTables;

    public function __construct()
    {
        $this->apps = new AppsModel();
        $this->simodel = new STKInternalModel();
        $this->uploader = new ExcelUploader();
        $this->dataTables = new DataTablesLib();
        $sess = session()->get();
    }



    public function storeData()
    {
        $sess = session()->get();
        $key = $this->request->getPost('key');
        $nip = trim((string) $this->request->getPost('nip'));

        $rules = [
            'nama' => 'required|min_length[3]',
            'gender' => 'required',
            'status_pegawai' => 'required',
            'tgl_lahir' => 'required|valid_date',
            'unit_kerja' => 'required',
            'jenis_jabatan' => 'required',
            'email' => 'permit_empty|valid_email'
        ];

        if (empty($key)) {
            $rules['nip'] = 'required|min_length[8]';
        }

        if (!$this->validate($rules)) {
            return $this->apiError(
                implode(', ', $this->validator->getErrors()),
                422,
                $this->validator->getErrors(),
                ['data' => $this->request->getPost()]
            );
        }

        $jabatanId = $this->request->getPost('jabatan');
        $jabatanNama = null;
        if (!empty($jabatanId)) {
            $jRow = $this->simodel->getMasterData('data_pegawai_jabatan');
            foreach ($jRow as $j) {
                if ((string)$j['id'] === (string)$jabatanId) {
                    $jabatanNama = $j['nama'];
                    break;
                }
            }
        }

        $statusPegawaiRaw = $this->request->getPost('status_pegawai');
        $statusPegawaiId = null;
        if (!empty($statusPegawaiRaw)) {
            if (is_numeric($statusPegawaiRaw)) {
                $statusPegawaiId = (int) $statusPegawaiRaw;
            } else {
                $m = $this->simodel->getMasterData('data_pegawai_jenis_pegawai');
                foreach ($m as $jp) {
                    if (strcasecmp(trim($jp['nama']), trim($statusPegawaiRaw)) === 0) {
                        $statusPegawaiId = (int) $jp['id'];
                        break;
                    }
                }
            }
        }

        $pangkatRaw = $this->request->getPost('pangkat');
        $pangkatId = (!empty($pangkatRaw) && (int) $pangkatRaw > 0) ? (int) $pangkatRaw : null;

        $dataSave = [
            'nama' => $this->request->getPost('nama'),
            'gender' => $this->request->getPost('gender'),
            'tgl_lahir' => $this->request->getPost('tgl_lahir'),
            'menikah' => $this->request->getPost('menikah'),
            'status_pegawai_id' => $statusPegawaiId,
            'agama_id' => !empty($this->request->getPost('agama')) ? (int) $this->request->getPost('agama') : null,
            'pendidikan_id' => !empty($this->request->getPost('pendidikan')) ? (int) $this->request->getPost('pendidikan') : null,
            'jabatan_id' => !empty($jabatanId) ? (int) $jabatanId : null,
            'jabatan' => $jabatanNama,
            'gol_id' => !empty($this->request->getPost('golongan')) ? (int) $this->request->getPost('golongan') : null,
            'pangkat_id' => $pangkatId,
            'tmt_gol' => $this->request->getPost('tmt_gol') ?: null,
            'unit_kerja_id' => is_array($this->request->getPost('unit_kerja')) ? implode(',', $this->request->getPost('unit_kerja')) : $this->request->getPost('unit_kerja'),
            'unit_sk_id' => !empty($this->request->getPost('unit_sk')) ? (int) $this->request->getPost('unit_sk') : null,
            'jenis_jabatan_id' => !empty($this->request->getPost('jenis_jabatan')) ? (int) $this->request->getPost('jenis_jabatan') : null,
            'phone' => $this->request->getPost('phone'),
            'email' => $this->request->getPost('email'),
            'updated_at' => date('Y-m-d H:i:s')
        ];

        if (!empty($key)) {
            $this->apps->updateData($dataSave, $key, 'data_pegawai');

            // Sinkronkan data profil ke auth_users jika user ada
            $existingPegawai = db_connect()->table('data_pegawai')->select('nip')->where('id', $key)->get()->getRowArray();
            $targetNip = $existingPegawai['nip'] ?? $nip;
            if (!empty($targetNip)) {
                $userUpdate = [
                    'fullname'   => $this->request->getPost('nama'),
                    'updated_at' => date('Y-m-d H:i:s'),
                    'deleted_at' => null,
                ];
                if (!empty($this->request->getPost('email'))) {
                    $userUpdate['email'] = $this->request->getPost('email');
                }
                db_connect()->table('auth_users')
                    ->where('username', $targetNip)
                    ->update($userUpdate);
            }
        } else {
            $dataSave['nip'] = $nip;
            $dataSave['is_status'] = 1;
            $dataSave['created_at'] = date('Y-m-d H:i:s');

            if ($this->simodel->isDuplicateIntegrasi($nip) > 0) {
                return $this->apiError('NIP/Data sudah ada (duplikat)', 422);
            }

            $this->apps->storeData($dataSave, 'data_pegawai');

            // Otomatis buat akun pengguna baru di tabel auth_users agar pegawai langsung bisa login
            $existingUser = db_connect()->table('auth_users')->where('username', $nip)->get()->getRowArray();
            if (!$existingUser) {
                $userAccount = [
                    'username'         => $nip,
                    'password'         => password_hash($nip, PASSWORD_BCRYPT),
                    'fullname'         => $this->request->getPost('nama'),
                    'email'            => !empty($this->request->getPost('email')) ? $this->request->getPost('email') : ($nip . '@bkn.go.id'),
                    'userimage'        => 'user.jpg',
                    'role'             => 'USR',
                    'status'           => 'active',
                    'is_active'        => 1,
                    'force_pass_reset' => 0,
                    'created_at'       => date('Y-m-d H:i:s'),
                    'updated_at'       => date('Y-m-d H:i:s'),
                    'deleted_at'       => null,
                ];
                $this->apps->storeData($userAccount, 'auth_users');
            } else {
                db_connect()->table('auth_users')
                    ->where('username', $nip)
                    ->update([
                        'fullname'   => $this->request->getPost('nama'),
                        'is_active'  => 1,
                        'status'     => 'active',
                        'updated_at' => date('Y-m-d H:i:s'),
                        'deleted_at' => null,
                    ]);
            }

            $this->apps->storeData(
                [
                    'layanan_id' => 35,
                    'tanggal' => date('Y-m-d'),
                    'created_by' => $sess['username'] ?? 'system'
                ],
                'activity_daily_logs'
            );
        }

        return $this->response->setStatusCode(200)->setJSON([
            'status' => 'success',
            'message' => 'Data berhasil disimpan.',
            'key' => $key
        ]);
    }

    public function removeData()
    {
        $sess = session()->get();
        $key = trim((string) $this->request->getPost('key'));
        if ($key === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => false,
                'message' => 'Kunci data tidak valid',
            ]);
        }
        $this->apps->removeData($key, 'data_pegawai');
        return $this->response->setJSON([
            'status' => true,
            'message' => 'Data Berhasil di hapus',
        ]);
    }

    public function importBatch()
    {
        $sess = session()->get();
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->response->setStatusCode(400)->setJSON([
                'status'  => 'error',
                'message' => 'Berkas Excel tidak valid atau belum dipilih.',
            ]);
        }

        try {
            $this->uploader->validateFile($file);
            $rows = $this->uploader->parseExcel($file->getTempName());
        } catch (\Throwable $e) {
            log_message('warning', 'StatistikInternal importBatch file validation/parse failed: {message}', ['message' => $e->getMessage()]);
            $isFormatIssue = $e instanceof \RuntimeException
                || stripos($e->getMessage(), 'Ekstensi') !== false
                || stripos($e->getMessage(), 'Tipe file') !== false
                || stripos($e->getMessage(), 'ZipArchive') !== false;

            return $this->response->setStatusCode($isFormatIssue ? 422 : 400)->setJSON([
                'status'  => 'error',
                'message' => $isFormatIssue ? $e->getMessage() : 'Berkas Excel gagal dibaca atau format tidak sesuai.',
            ]);
        }

        if (!is_array($rows) || count($rows) < 2) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Data kosong. Minimal harus terdapat 1 baris data setelah header.',
            ]);
        }

        // Cache master lookup maps (nama lowercase -> id)
        $buildMap = function (string $table): array {
            $map = [];
            foreach ($this->simodel->getMasterData($table) as $item) {
                $name = strtolower(trim((string) ($item['nama'] ?? '')));
                if ($name !== '' && isset($item['id'])) {
                    $map[$name] = (int) $item['id'];
                }
            }
            return $map;
        };

        $unitKerjaMap    = $buildMap('data_pegawai_unit_kerja');
        $unitSkMap       = $buildMap('data_pegawai_unit_sk');
        $jenisJabatanMap = $buildMap('data_pegawai_jenis_jabatan');
        $jenisPegawaiMap = $buildMap('data_pegawai_jenis_pegawai');
        $jabatanMap      = $buildMap('data_pegawai_jabatan');
        $golonganMap     = $buildMap('data_pegawai_golongan');
        $pangkatMap      = $buildMap('data_pegawai_pangkat');

        $resolveId = static function (array $map, $raw): ?int {
            $val = trim((string) ($raw ?? ''));
            if ($val === '') {
                return null;
            }
            if (ctype_digit($val)) {
                return (int) $val;
            }
            $lower = strtolower($val);
            if (isset($map[$lower])) {
                return $map[$lower];
            }
            foreach ($map as $label => $id) {
                if (str_contains($label, $lower) || str_contains($lower, $label)) {
                    return $id;
                }
            }
            return null;
        };

        $db = $this->apps->db;
        $now = date('Y-m-d H:i:s');
        $inserted = 0;
        $updated = 0;
        $skipped = 0;

        $db->transStart();
        try {
            foreach (array_slice($rows, 1) as $row) {
                $nip = preg_replace('/\s+/', '', trim((string) ($row[0] ?? '')));
                $nama = trim((string) ($row[1] ?? ''));
                if ($nip === '' || $nama === '') {
                    $skipped++;
                    continue;
                }

                $rawGender = strtolower(trim((string) ($row[2] ?? '')));
                $gender = null;
                if (in_array($rawGender, ['1', 'l', 'lk', 'pria', 'laki-laki'], true)) {
                    $gender = 1;
                } elseif (in_array($rawGender, ['2', 'p', 'pr', 'wanita', 'perempuan'], true)) {
                    $gender = 2;
                }

                // Multi unit_kerja dipisah koma -> ID terpisah koma
                $unitKerjaIds = [];
                foreach (explode(',', (string) ($row[6] ?? '')) as $part) {
                    $resolvedUk = $resolveId($unitKerjaMap, $part);
                    if ($resolvedUk !== null) {
                        $unitKerjaIds[] = (string) $resolvedUk;
                    }
                }

                $jabatanNama = trim((string) ($row[9] ?? ''));
                $jabatanId = $resolveId($jabatanMap, $jabatanNama);

                $payload = [
                    'nama'              => $nama,
                    'gender'            => $gender,
                    'tgl_lahir'         => ExcelUploader::excelDate($row[3] ?? null),
                    'menikah'           => trim((string) ($row[4] ?? '')) ?: null,
                    'status_pegawai_id' => $resolveId($jenisPegawaiMap, $row[5] ?? null),
                    'unit_kerja_id'     => !empty($unitKerjaIds) ? implode(',', $unitKerjaIds) : null,
                    'unit_sk_id'        => $resolveId($unitSkMap, $row[7] ?? null),
                    'jenis_jabatan_id'  => $resolveId($jenisJabatanMap, $row[8] ?? null),
                    'jabatan_id'        => $jabatanId,
                    'jabatan'           => $jabatanNama !== '' ? $jabatanNama : null,
                    'gol_id'            => $resolveId($golonganMap, $row[10] ?? null),
                    'pangkat_id'        => $resolveId($pangkatMap, $row[11] ?? null),
                    'tmt_gol'           => ExcelUploader::excelDate($row[12] ?? null),
                    'phone'             => trim((string) ($row[13] ?? '')) ?: null,
                    'email'             => trim((string) ($row[14] ?? '')) ?: null,
                    'updated_at'        => $now,
                ];

                $existing = $db->table('data_pegawai')->select('id')->where('nip', $nip)->limit(1)->get()->getRowArray();
                if ($existing) {
                    $db->table('data_pegawai')->where('id', (int) $existing['id'])->update($payload);
                    $updated++;
                } else {
                    $payload['nip'] = $nip;
                    $payload['is_status'] = 1;
                    $payload['created_at'] = $now;
                    $db->table('data_pegawai')->insert($payload);
                    $inserted++;
                }
            }

            if ($inserted + $updated > 0) {
                $this->apps->storeData([
                    'layanan_id' => 35,
                    'tanggal'    => date('Y-m-d'),
                    'created_by' => $sess['username'] ?? 'system',
                ], 'activity_daily_logs');
            }

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \RuntimeException('Transaksi database batch pegawai gagal disimpan.');
            }
        } catch (\Throwable $e) {
            $db->transRollback();
            log_message('error', 'StatistikInternal importBatch failed: {message}', ['message' => $e->getMessage()]);
            return $this->response->setStatusCode(500)->setJSON([
                'status'  => 'error',
                'message' => 'Gagal menyimpan data batch pegawai. Silakan periksa kembali format berkas Excel.',
            ]);
        }

        if ($inserted === 0 && $updated === 0) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => 'error',
                'message' => 'Tidak ada baris pegawai valid (NIP & Nama wajib terisi) yang dapat diimpor.',
            ]);
        }

        return $this->response->setJSON([
            'status'  => 'success',
            'message' => sprintf('Import selesai: %d data baru, %d diperbarui, %d dilewati.', $inserted, $updated, $skipped),
            'data'    => [
                'inserted' => $inserted,
                'updated'  => $updated,
                'skipped'  => $skipped,
            ],
        ]);
    }

    public function getDataPegawai()
    {
        $sess = session()->get();
        $unit = $this->request->getPost('unit');
        $mode = $this->request->getPost('mode') ?? 'pegawai';

        if (!is_array($unit)) {
            $unit = [];
        }

        $builder = $this->simodel->getBuilder('pegawai', [
            'unit' => $unit,
            'mode' => $mode
        ]);

        $columns = $this->simodel->getColumns('pegawai');
        $result = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getDataPetaJabatan()
    {
        $unit = $this->request->getPost('unit');
        if (!is_array($unit)) {
            $unit = [];
        }

        $builder = $this->simodel->getBuilder('peta_jabatan', [
            'unit' => $unit
        ]);

        $columns = $this->simodel->getColumns('peta_jabatan');
        $result = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getDataAccum()
    {
        $request = $this->request->getJSON();
        $unit = $request->unit ?? []; // pastikan array

        return $this->response->setStatusCode(200)->setJSON([
            'status' => 'success',
            'list' => $this->simodel->getAccumulation($unit),
            'unit' => $unit
        ]);
    }

    public function getSummary()
    {
        $unit = $this->request->getPost('unit');
        $mode = $this->request->getPost('mode') ?? 'pegawai';

        if (!is_array($unit)) {
            $unit = [];
        }

        return $this->response->setJSON([
            'status' => 'success',
            'summary' => $this->simodel->getSummary($unit, $mode),
        ]);
    }

    public function getMasterPendidikan()
    {
        $data = $this->simodel->getMasterData('data_pegawai_pendidikan');
        return $this->response->setJSON($data);
    }

    public function getMasterUnitKerja()
    {
        $data = $this->simodel->getMasterData('data_pegawai_unit_kerja');
        return $this->response->setJSON($data);
    }

    public function getMasterUnitSK()
    {
        $data = $this->simodel->getMasterData('data_pegawai_unit_sk');
        return $this->response->setJSON($data);
    }

    public function getMasterJenisJabatan()
    {
        $data = $this->simodel->getMasterData('data_pegawai_jenis_jabatan');
        return $this->response->setJSON($data);
    }

    public function getMasterJenisPegawai()
    {
        $data = $this->simodel->getMasterData('data_pegawai_jenis_pegawai');
        return $this->response->setJSON($data);
    }

    public function getMasterAgama()
    {
        $data = $this->simodel->getMasterData('data_pegawai_agama');
        return $this->response->setJSON($data);
    }

    public function getMasterGolongan()
    {
        $data = $this->simodel->getMasterData('data_pegawai_golongan');
        return $this->response->setJSON($data);
    }

    public function getMasterPangkat()
    {
        $data = $this->simodel->getMasterData('data_pegawai_pangkat');
        return $this->response->setJSON($data);
    }

    public function getMasterJabatan()
    {
        $isStatus = $this->request->getGet('is_status') ?? $this->request->getPost('is_status');
        $unitSk = $this->request->getGet('unit_sk') ?? $this->request->getPost('unit_sk');

        $filters = [];
        if (!empty($isStatus)) {
            $filters['is_status'] = $isStatus;
        } elseif (!empty($unitSk)) {
            $filters['is_status'] = ((string)$unitSk === '10') ? 'UPT' : 'KRG';
        }

        $data = $this->simodel->getMasterData('data_pegawai_jabatan', $filters);
        return $this->response->setJSON($data);
    }

    public function storeDataMaster()
    {
        $type = $this->request->getPost('type');
        $id = $this->request->getPost('id');
        $nama = $this->request->getPost('nama');

        $map = [
            'data_pegawai_pendidikan'    => 'data_pegawai_pendidikan',
            'data_pegawai_unit_kerja'    => 'data_pegawai_unit_kerja',
            'data_pegawai_unit_sk'       => 'data_pegawai_unit_sk',
            'data_pegawai_jenis_jabatan' => 'data_pegawai_jenis_jabatan',
            'data_pegawai_jenis_pegawai' => 'data_pegawai_jenis_pegawai',
            'data_pegawai_agama'         => 'data_pegawai_agama',
            'data_pegawai_golongan'      => 'data_pegawai_golongan',
            'data_pegawai_pangkat'       => 'data_pegawai_pangkat',
            'data_pegawai_jabatan'       => 'data_pegawai_jabatan',
        ];

        if (!isset($map[$type])) {
            return $this->response->setStatusCode(400)->setJSON(['status' => 'error']);
        }

        $table = $map[$type];

        // Build data array — always include nama
        $data = ['nama' => $nama];

        // Handle extra columns for data_pegawai_jabatan
        if ($type === 'data_pegawai_jabatan') {
            $data['kelas_jabatan'] = $this->request->getPost('kelas_jabatan');
            $data['kebutuhan'] = $this->request->getPost('kebutuhan');
            $data['is_status'] = $this->request->getPost('is_status') ?: 'KRG';
        }

        if ($id) {
            $this->apps->updateData($data, $id, $table);
        } else {
            $this->apps->storeData($data, $table);
        }

        return $this->response->setJSON(['status' => 'success']);
    }

    public function deleteDataMaster()
    {
        $type = $this->request->getPost('type');
        $id = $this->request->getPost('id');

        $map = [
            'data_pegawai_pendidikan'    => 'data_pegawai_pendidikan',
            'data_pegawai_unit_kerja'    => 'data_pegawai_unit_kerja',
            'data_pegawai_unit_sk'       => 'data_pegawai_unit_sk',
            'data_pegawai_jenis_jabatan' => 'data_pegawai_jenis_jabatan',
            'data_pegawai_jenis_pegawai' => 'data_pegawai_jenis_pegawai',
            'data_pegawai_agama'         => 'data_pegawai_agama',
            'data_pegawai_golongan'      => 'data_pegawai_golongan',
            'data_pegawai_pangkat'       => 'data_pegawai_pangkat',
            'data_pegawai_jabatan'       => 'data_pegawai_jabatan',
        ];

        if (!isset($map[$type]) || !$id) {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 'error',
                'message' => 'Data tidak valid'
            ]);
        }

        $this->apps->removeData($id, $map[$type]);

        return $this->response->setJSON([
            'status' => 'success'
        ]);
    }



}


