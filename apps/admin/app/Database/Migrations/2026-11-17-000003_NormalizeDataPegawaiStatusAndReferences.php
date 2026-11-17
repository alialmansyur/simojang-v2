<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class NormalizeDataPegawaiStatusAndReferences extends Migration
{
    public function up()
    {
        $db = $this->db;

        if (!$db->tableExists('data_pegawai')) {
            return;
        }

        // =========================================================================
        // 1. DATA CLEANING / MAPPING: STATUS_PEGAWAI_ID
        // =========================================================================
        // Map string status_pegawai_id ke integer ID di data_pegawai_jenis_pegawai:
        // 1 = PNS, 2 = PPPK, 3 = PPPK PW, 4 = PPNPN, 5 = MAGANG
        $db->query("UPDATE data_pegawai SET status_pegawai_id = '1' WHERE UPPER(TRIM(status_pegawai_id)) = 'PNS' OR status_pegawai_id = '1'");
        $db->query("UPDATE data_pegawai SET status_pegawai_id = '2' WHERE UPPER(TRIM(status_pegawai_id)) = 'PPPK' OR status_pegawai_id = '2'");
        $db->query("UPDATE data_pegawai SET status_pegawai_id = '3' WHERE UPPER(TRIM(status_pegawai_id)) IN ('PPPK PW', 'PPPK-PW', 'PARUH WAKTU') OR status_pegawai_id = '3' OR status_pegawai_id LIKE '%PW%'");
        $db->query("UPDATE data_pegawai SET status_pegawai_id = '4' WHERE UPPER(TRIM(status_pegawai_id)) = 'PPNPN' OR status_pegawai_id = '4'");
        $db->query("UPDATE data_pegawai SET status_pegawai_id = '5' WHERE UPPER(TRIM(status_pegawai_id)) = 'MAGANG' OR status_pegawai_id = '5'");

        // Jika masih ada nilai selain angka, amankan jadi NULL
        $db->query("UPDATE data_pegawai SET status_pegawai_id = NULL WHERE status_pegawai_id NOT REGEXP '^[0-9]+$'");

        // =========================================================================
        // 2. ALTER TABLE: UBAH TIPE DATA status_pegawai_id MENJADI INT(11) NULL
        // =========================================================================
        $db->query("ALTER TABLE data_pegawai MODIFY COLUMN status_pegawai_id INT(11) NULL DEFAULT NULL");

        // =========================================================================
        // 3. NORMALISASI pangkat_id: UBAH NILAI 0 MENJADI NULL (UNTUK PPPK)
        // =========================================================================
        $db->query("UPDATE data_pegawai SET pangkat_id = NULL WHERE pangkat_id = 0");

        // =========================================================================
        // 4. NORMALISASI STATUS PERNIKAHAN (menikah)
        // =========================================================================
        $db->query("UPDATE data_pegawai SET menikah = 'Belum Menikah' WHERE TRIM(menikah) = 'Belum Kawin'");
        $db->query("UPDATE data_pegawai SET menikah = 'Duda / Janda' WHERE TRIM(menikah) IN ('Janda', 'Janda / Duda', 'Duda')");
        $db->query("UPDATE data_pegawai SET menikah = NULL WHERE TRIM(menikah) = ''");

        // =========================================================================
        // 5. NORMALISASI GENDER
        // =========================================================================
        $db->query("UPDATE data_pegawai SET gender = '1' WHERE LOWER(TRIM(gender)) IN ('l', 'lk', 'pria', 'laki-laki')");
        $db->query("UPDATE data_pegawai SET gender = '2' WHERE LOWER(TRIM(gender)) IN ('p', 'pr', 'wanita', 'perempuan')");
    }

    public function down()
    {
        $db = $this->db;
        if ($db->tableExists('data_pegawai')) {
            $db->query("ALTER TABLE data_pegawai MODIFY COLUMN status_pegawai_id VARCHAR(50) NULL DEFAULT NULL");
        }
    }
}
