<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCatLaporanAndSignersTables extends Migration
{
    public function up()
    {
        // 1. Table: txn_cat_laporan (Riwayat & Data Snapshot Dokumen Laporan CAT)
        if (!$this->db->tableExists('txn_cat_laporan')) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'constraint'     => 20,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'uid' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 64,
                    'null'       => false,
                ],
                'jenis_laporan' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 64,
                    'null'       => false,
                    'default'    => 'laporan-pelaksanaan-cat',
                ],
                'nomor_dokumen' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 150,
                    'null'       => true,
                ],
                'judul_laporan' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => false,
                ],
                'tanggal_dokumen' => [
                    'type' => 'DATE',
                    'null' => true,
                ],
                'tanggal_pelaksanaan' => [
                    'type' => 'DATE',
                    'null' => true,
                ],
                'jenis_tes_id' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 64,
                    'null'       => true,
                ],
                'seleksi_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                    'null'       => true,
                ],
                'tilok_id' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 64,
                    'null'       => true,
                ],
                'instansi_id' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                    'comment'    => 'Comma separated instansi IDs atau null jika tilok',
                ],
                'periode' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 10,
                    'null'       => true,
                ],
                'status' => [
                    'type'       => 'ENUM',
                    'constraint' => ['draft', 'published'],
                    'default'    => 'draft',
                ],
                'params_json' => [
                    'type' => 'LONGTEXT',
                    'null' => true,
                    'comment' => 'Form parameters: dasar surat, waktu, kota, dll',
                ],
                'data_snapshot_json' => [
                    'type' => 'LONGTEXT',
                    'null' => true,
                    'comment' => 'Snapshot beku data sesi, peserta hadir/tidak',
                ],
                'signers_json' => [
                    'type' => 'LONGTEXT',
                    'null' => true,
                    'comment' => 'Snapshot 3 penandatangan (kiri, tengah, kanan) & e-sign data',
                ],
                'evidence_json' => [
                    'type' => 'LONGTEXT',
                    'null' => true,
                    'comment' => 'Snapshot foto eviden dokumentasi',
                ],
                'created_by_nip' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 50,
                    'null'       => true,
                ],
                'created_by_name' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 150,
                    'null'       => true,
                ],
                'created_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'updated_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
            ]);

            $this->forge->addKey('id', true);
            $this->forge->addUniqueKey('uid', 'uk_cat_laporan_uid');
            $this->forge->addKey(['jenis_laporan', 'status'], false, false, 'idx_cat_laporan_type_status');
            $this->forge->addKey(['seleksi_id', 'tilok_id'], false, false, 'idx_cat_laporan_scope');
            $this->forge->addKey('created_by_nip', false, false, 'idx_cat_laporan_creator');
            $this->forge->createTable('txn_cat_laporan', true);
        }

        // 2. Table: txn_cat_user_signers (Parameter Profil E-Sign Pegawai per Session Scope)
        if (!$this->db->tableExists('txn_cat_user_signers')) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'constraint'     => 20,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'user_nip' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 50,
                    'null'       => false,
                ],
                'user_name' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 150,
                    'null'       => true,
                ],
                'jenis_tes_id' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 64,
                    'null'       => true,
                ],
                'seleksi_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                    'null'       => true,
                ],
                'tilok_id' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 64,
                    'null'       => true,
                ],
                'instansi_id' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 100,
                    'null'       => true,
                    'comment'    => 'NULL berarti berlaku untuk seluruh tilok',
                ],
                'position_key' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 20,
                    'default'    => 'kanan',
                    'comment'    => 'kiri, tengah, kanan',
                ],
                'jabatan' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'nama' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'nip' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 50,
                    'null'       => true,
                ],
                'pangkat_gol' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 100,
                    'null'       => true,
                ],
                'instansi_nama' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'signature_data' => [
                    'type' => 'LONGTEXT',
                    'null' => true,
                    'comment' => 'Base64 image TTE',
                ],
                'created_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'updated_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
            ]);

            $this->forge->addKey('id', true);
            $this->forge->addKey(['user_nip', 'position_key'], false, false, 'idx_cat_user_signers_user_pos');
            $this->forge->addKey(['seleksi_id', 'tilok_id', 'instansi_id'], false, false, 'idx_cat_user_signers_scope');
            $this->forge->createTable('txn_cat_user_signers', true);
        }
    }

    public function down()
    {
        $this->forge->dropTable('txn_cat_user_signers', true);
        $this->forge->dropTable('txn_cat_laporan', true);
    }
}
