<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RegisterHubSubServicesAndPermissions extends Migration
{
    public function up()
    {
        $db = $this->db;

        // =========================================================================
        // 1. ALTER TABLE data_timkerja_layanan: Tambah parent_id & is_subservice
        // =========================================================================
        if ($db->tableExists('data_timkerja_layanan')) {
            $fieldsToAdd = [];

            if (!$db->fieldExists('parent_id', 'data_timkerja_layanan')) {
                $fieldsToAdd['parent_id'] = [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'null'       => true,
                    'default'    => null,
                    'after'      => 'timkerja_id',
                ];
            }

            if (!$db->fieldExists('is_subservice', 'data_timkerja_layanan')) {
                $fieldsToAdd['is_subservice'] = [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                    'null'       => false,
                    'default'    => 0,
                    'after'      => 'parent_id',
                ];
            }

            if (!empty($fieldsToAdd)) {
                $this->forge->addColumn('data_timkerja_layanan', $fieldsToAdd);
            }
        }

        // =========================================================================
        // 2. INSERT / UPDATE SUB-SERVICES KE data_timkerja_layanan
        // =========================================================================
        $now = date('Y-m-d H:i:s');
        $subServices = [
            // Sub-Services Fasilitasi CAT (Parent ID 28, Tim Kerja 5 - SIDIGI)
            [
                'parent_id'     => 28,
                'timkerja_id'   => 5,
                'nama_layanan'  => 'Rekap Data Sesi CAT',
                'alias'         => 'CAT-REKAP',
                'url'           => 'apps-cat-rekap',
                'deskripsi'     => 'Input, monitoring, dan sinkronisasi sesi ujian CAT serta presensi peserta.',
                'is_subservice' => 1,
                'is_show'       => 1,
            ],
            [
                'parent_id'     => 28,
                'timkerja_id'   => 5,
                'nama_layanan'  => 'Rekapitulasi Capaian CAT',
                'alias'         => 'CAT-REKAPITULASI',
                'url'           => 'apps-cat-rekapitulasi',
                'deskripsi'     => 'Matriks ringkasan capaian kehadiran, kelulusan, dan evaluasi CAT per instansi.',
                'is_subservice' => 1,
                'is_show'       => 1,
            ],
            [
                'parent_id'     => 28,
                'timkerja_id'   => 5,
                'nama_layanan'  => 'Laporan & Berita Acara CAT',
                'alias'         => 'CAT-LAPORAN',
                'url'           => 'apps-cat-laporan',
                'deskripsi'     => 'Pembuatan laporan pelaksanaan CAT, berita acara profiling ASN, formulir sarpras, dan TTE.',
                'is_subservice' => 1,
                'is_show'       => 1,
            ],
            [
                'parent_id'     => 28,
                'timkerja_id'   => 5,
                'nama_layanan'  => 'Pengelola Layanan CAT',
                'alias'         => 'CAT-PENGELOLA',
                'url'           => 'apps-cat-pengelola',
                'deskripsi'     => 'Manajemen jadwal seleksi, penugasan tim kerja lapangan, dokumen PNBP, dan master data CAT.',
                'is_subservice' => 1,
                'is_show'       => 1,
            ],

            // Sub-Services Pagu & Realisasi Anggaran (Parent ID 29, Tim Kerja 6 - TU)
            [
                'parent_id'     => 29,
                'timkerja_id'   => 6,
                'nama_layanan'  => 'Master Data Anggaran',
                'alias'         => 'ANGGARAN-MASTER',
                'url'           => 'apps-anggaran-master',
                'deskripsi'     => 'Pengelolaan pagu anggaran DIPA, akun belanja, pohon anggaran, dan komponen program.',
                'is_subservice' => 1,
                'is_show'       => 1,
            ],
            [
                'parent_id'     => 29,
                'timkerja_id'   => 6,
                'nama_layanan'  => 'Realisasi Anggaran',
                'alias'         => 'ANGGARAN-REALISASI',
                'url'           => 'apps-anggaran-realisasi',
                'deskripsi'     => 'Pencatatan realisasi pencairan anggaran DIPA, persentase serapan, dan sisa pagu belanja.',
                'is_subservice' => 1,
                'is_show'       => 1,
            ],

            // Sub-Services Statistik Kepegawaian Internal (Parent ID 35, Tim Kerja 6 - TU)
            [
                'parent_id'     => 35,
                'timkerja_id'   => 6,
                'nama_layanan'  => 'Data Pegawai Internal',
                'alias'         => 'STATISTIK-PEGAWAI-INT',
                'url'           => 'apps-statistik-internal-pegawai',
                'deskripsi'     => 'Pengelolaan profil ASN Kanreg III, pemantauan BUP pensiun, status keaktifan, dan impor Excel.',
                'is_subservice' => 1,
                'is_show'       => 1,
            ],
            [
                'parent_id'     => 35,
                'timkerja_id'   => 6,
                'nama_layanan'  => 'Peta Jabatan & Bezzeting',
                'alias'         => 'STATISTIK-PETA-JABATAN',
                'url'           => 'apps-statistik-internal-peta',
                'deskripsi'     => 'Analisis kebutuhan formasi riil pegawai terisi (bezzeting), kelas jabatan, dan lowongan.',
                'is_subservice' => 1,
                'is_show'       => 1,
            ],
            [
                'parent_id'     => 35,
                'timkerja_id'   => 6,
                'nama_layanan'  => 'Master Data Kepegawaian',
                'alias'         => 'STATISTIK-MASTER-DATA',
                'url'           => 'apps-statistik-internal-master',
                'deskripsi'     => 'Konfigurasi 8 tabel referensi kepegawaian internal (Pendidikan, Unit SK, Jenis Jabatan, Agama, dll).',
                'is_subservice' => 1,
                'is_show'       => 1,
            ],
        ];

        foreach ($subServices as $sub) {
            $existing = $db->table('data_timkerja_layanan')
                ->where('url', $sub['url'])
                ->get()
                ->getRowArray();

            if ($existing) {
                $db->table('data_timkerja_layanan')
                    ->where('id', (int) $existing['id'])
                    ->update([
                        'parent_id'     => $sub['parent_id'],
                        'is_subservice' => 1,
                        'nama_layanan'  => $sub['nama_layanan'],
                        'alias'         => $sub['alias'],
                        'deskripsi'     => $sub['deskripsi'],
                    ]);
            } else {
                $db->table('data_timkerja_layanan')->insert([
                    'timkerja_id'   => $sub['timkerja_id'],
                    'parent_id'     => $sub['parent_id'],
                    'is_subservice' => 1,
                    'nama_layanan'  => $sub['nama_layanan'],
                    'alias'         => $sub['alias'],
                    'url'           => $sub['url'],
                    'deskripsi'     => $sub['deskripsi'],
                    'is_show'       => 1,
                    'is_count'      => 0,
                    'update_at'     => $now,
                ]);
            }
        }

        // =========================================================================
        // 3. INSERT / UPDATE HUB & SUB-MENU KE auth_permissions (UNTUK /settings/roles)
        // =========================================================================
        if ($db->tableExists('auth_permissions')) {
            // Helper function untuk upsert permission
            $upsertPermission = function ($name, $url, $icon, $parentId = null, $order = 99) use ($db) {
                $existing = $db->table('auth_permissions')
                    ->where('url', $url)
                    ->get()
                    ->getRowArray();

                if ($existing) {
                    $db->table('auth_permissions')
                        ->where('id', (int) $existing['id'])
                        ->update([
                            'name'      => $name,
                            'icon'      => $icon,
                            'parent_id' => $parentId,
                            'is_show'   => 1,
                            'is_order'  => $order,
                        ]);
                    return (int) $existing['id'];
                }

                $db->table('auth_permissions')->insert([
                    'name'        => $name,
                    'url'         => $url,
                    'icon'        => $icon,
                    'parent_id'   => $parentId,
                    'is_show'     => 1,
                    'is_order'    => $order,
                    'is_external' => 0,
                ]);
                return (int) $db->insertID();
            };

            // A. Hub Layanan 1: Fasilitasi CAT
            $catParentId = $upsertPermission('Fasilitasi Seleksi CAT BKN', 'layanan/fasilitasi-cat', 'Cpu', null, 50);
            $catSub1 = $upsertPermission('Rekap Data Sesi CAT', 'layanan/fasilitasi-cat/rekap-data', 'Database', $catParentId, 1);
            $catSub2 = $upsertPermission('Rekapitulasi Capaian CAT', 'layanan/fasilitasi-cat/rekapitulasi', 'BarChart3', $catParentId, 2);
            $catSub3 = $upsertPermission('Laporan & Berita Acara CAT', 'layanan/fasilitasi-cat/laporan', 'FileText', $catParentId, 3);
            $catSub4 = $upsertPermission('Pengelola Layanan CAT', 'layanan/fasilitasi-cat/pengelola', 'ShieldCheck', $catParentId, 4);

            // B. Hub Layanan 2: Pagu & Realisasi Anggaran
            $anggaranParentId = $upsertPermission('Pagu & Realisasi Anggaran DIPA', 'layanan/anggaran', 'Layers', null, 51);
            $anggaranSub1 = $upsertPermission('Master Data Anggaran', 'layanan/anggaran/master', 'Database', $anggaranParentId, 1);
            $anggaranSub2 = $upsertPermission('Realisasi Anggaran', 'layanan/anggaran/realisasi', 'Receipt', $anggaranParentId, 2);

            // C. Hub Layanan 3: Statistik Kepegawaian Internal
            $statParentId = $upsertPermission('Statistik Kepegawaian Internal', 'layanan/statistik-internal', 'Building2', null, 52);
            $statSub1 = $upsertPermission('Data Pegawai Internal', 'layanan/statistik-internal/data-pegawai', 'Users', $statParentId, 1);
            $statSub2 = $upsertPermission('Peta Jabatan & Bezzeting', 'layanan/statistik-internal/peta-jabatan', 'Briefcase', $statParentId, 2);
            $statSub3 = $upsertPermission('Master Data Kepegawaian', 'layanan/statistik-internal/master-data', 'Database', $statParentId, 3);

            // =========================================================================
            // 4. SINKRONISASI KE auth_role_permissions UNTUK ROLE ADM & USR
            // =========================================================================
            if ($db->tableExists('auth_role_permissions') && $db->tableExists('auth_roles')) {
                $allNewPermIds = [
                    $catParentId, $catSub1, $catSub2, $catSub3, $catSub4,
                    $anggaranParentId, $anggaranSub1, $anggaranSub2,
                    $statParentId, $statSub1, $statSub2, $statSub3,
                ];

                $roles = $db->table('auth_roles')->select('id, role_code')->get()->getResultArray();
                foreach ($roles as $r) {
                    $roleId = (int) $r['id'];
                    $isAdm = strtoupper(trim((string) $r['role_code'])) === 'ADM';

                    foreach ($allNewPermIds as $pId) {
                        $hasRolePerm = $db->table('auth_role_permissions')
                            ->where('role_id', $roleId)
                            ->where('permission_id', $pId)
                            ->countAllResults();

                        if ($hasRolePerm === 0) {
                            $db->table('auth_role_permissions')->insert([
                                'role_id'       => $roleId,
                                'permission_id' => $pId,
                                'is_create'     => $isAdm ? 1 : 0,
                                'is_read'       => 1, // Default diizinkan agar menu tidak hilang tiba-tiba
                                'is_update'     => $isAdm ? 1 : 0,
                                'is_delete'     => $isAdm ? 1 : 0,
                                'created_at'    => $now,
                                'updated_at'    => $now,
                            ]);
                        }
                    }
                }
            }
        }
    }

    public function down()
    {
        $db = $this->db;

        // Hapus subservices dari data_timkerja_layanan
        if ($db->tableExists('data_timkerja_layanan')) {
            $db->table('data_timkerja_layanan')->where('is_subservice', 1)->delete();
        }

        // Hapus permissions hub
        if ($db->tableExists('auth_permissions')) {
            $urls = [
                'layanan/fasilitasi-cat',
                'layanan/fasilitasi-cat/rekap-data',
                'layanan/fasilitasi-cat/rekapitulasi',
                'layanan/fasilitasi-cat/laporan',
                'layanan/fasilitasi-cat/pengelola',
                'layanan/anggaran',
                'layanan/anggaran/master',
                'layanan/anggaran/realisasi',
                'layanan/statistik-internal',
                'layanan/statistik-internal/data-pegawai',
                'layanan/statistik-internal/peta-jabatan',
                'layanan/statistik-internal/master-data',
            ];
            $perms = $db->table('auth_permissions')->whereIn('url', $urls)->get()->getResultArray();
            $permIds = array_column($perms, 'id');
            if (!empty($permIds)) {
                if ($db->tableExists('auth_role_permissions')) {
                    $db->table('auth_role_permissions')->whereIn('permission_id', $permIds)->delete();
                }
                $db->table('auth_permissions')->whereIn('id', $permIds)->delete();
            }
        }
    }
}
