<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class UpdateManajemenTalentaSteps extends Migration
{
    public function up()
    {
        $this->db->query("TRUNCATE TABLE `data_support_mt`");

        $steps = [
            [
                'id'          => 1,
                'step_name'   => 'Sudah Pengisian Jabatan',
                'description' => 'Instansi telah melakukan pengisian jabatan berbasis manajemen talenta',
                'percentage'  => 100,
                'sort_order'  => 1,
            ],
            [
                'id'          => 2,
                'step_name'   => 'Sudah Mendapat rekomendasi',
                'description' => 'Instansi telah mendapatkan rekomendasi penerapan manajemen talenta',
                'percentage'  => 75,
                'sort_order'  => 2,
            ],
            [
                'id'          => 3,
                'step_name'   => 'Sudah ekspose',
                'description' => 'Instansi telah melaksanakan ekspose kesiapan manajemen talenta',
                'percentage'  => 50,
                'sort_order'  => 3,
            ],
            [
                'id'          => 4,
                'step_name'   => 'Siap Ekspose',
                'description' => 'Instansi telah siap untuk melaksanakan ekspose manajemen talenta',
                'percentage'  => 25,
                'sort_order'  => 4,
            ],
        ];

        $this->db->table('data_support_mt')->insertBatch($steps);

        // Normalisasi data lama yang melebihi 4 tahap
        $this->db->query("UPDATE `txn_mt` SET `rw_mt_id` = 1 WHERE `rw_mt_id` > 4");
        $this->db->query("UPDATE `txn_mt_detail` SET `rw_mt_id` = 1 WHERE `rw_mt_id` > 4");
    }

    public function down()
    {
        // Revert to default 8 steps if needed
        $this->db->query("TRUNCATE TABLE `data_support_mt`");
    }
}
