<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddBatalStatusToTxnCatJadwal extends Migration
{
    public function up()
    {
        if ($this->db->tableExists('txn_cat_jadwal')) {
            $this->db->query(
                "ALTER TABLE `txn_cat_jadwal` MODIFY COLUMN `status` ENUM('draft', 'aktif', 'selesai', 'batal') NOT NULL DEFAULT 'aktif'"
            );
        }
    }

    public function down()
    {
        if ($this->db->tableExists('txn_cat_jadwal')) {
            $this->db->query(
                "UPDATE `txn_cat_jadwal` SET `status` = 'draft' WHERE `status` = 'batal'"
            );
            $this->db->query(
                "ALTER TABLE `txn_cat_jadwal` MODIFY COLUMN `status` ENUM('draft', 'aktif', 'selesai') NOT NULL DEFAULT 'aktif'"
            );
        }
    }
}
