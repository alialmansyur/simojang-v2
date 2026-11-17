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
    }

    public function down()
    {
        $db = $this->db;

        // Hapus subservices dari data_timkerja_layanan
        if ($db->tableExists('data_timkerja_layanan')) {
            $db->table('data_timkerja_layanan')->where('is_subservice', 1)->delete();
        }
    }
}
