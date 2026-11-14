<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCatPengelolaJadwalTimTables extends Migration
{
    public function up()
    {
        // --------------------------------------------------------
        // 1. Table: txn_cat_jadwal (Jadwal Pelaksanaan Kegiatan CAT)
        // --------------------------------------------------------
        if (!$this->db->tableExists('txn_cat_jadwal')) {
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
                'jenis_periode_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                    'null'       => true,
                ],
                'jenis_tes_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                    'null'       => false,
                ],
                'seleksi_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                    'null'       => false,
                ],
                'tilok_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                    'null'       => false,
                ],
                'instansi_id' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 50,
                    'null'       => true,
                ],
                'nama_jadwal' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'tanggal_mulai' => [
                    'type' => 'DATE',
                    'null' => false,
                ],
                'tanggal_selesai' => [
                    'type' => 'DATE',
                    'null' => false,
                ],
                'st_status' => [
                    'type'       => 'ENUM',
                    'constraint' => ['menunggu', 'terhubung'],
                    'default'    => 'menunggu',
                ],
                'st_document_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                    'null'       => true,
                ],
                'nomor_st' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 120,
                    'null'       => true,
                ],
                'tanggal_st' => [
                    'type' => 'DATE',
                    'null' => true,
                ],
                'status' => [
                    'type'       => 'ENUM',
                    'constraint' => ['draft', 'aktif', 'selesai'],
                    'default'    => 'aktif',
                ],
                'catatan' => [
                    'type' => 'TEXT',
                    'null' => true,
                ],
                'created_by' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 50,
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
            $this->forge->addUniqueKey('uid', 'uk_cat_jadwal_uid');
            $this->forge->addKey(['jenis_tes_id', 'seleksi_id', 'tilok_id'], false, false, 'idx_cat_jadwal_hierarchy');
            $this->forge->addKey(['tanggal_mulai', 'tanggal_selesai'], false, false, 'idx_cat_jadwal_dates');
            $this->forge->addKey('st_status', false, false, 'idx_cat_jadwal_st_status');
            $this->forge->createTable('txn_cat_jadwal', true);
        }

        // --------------------------------------------------------
        // 2. Table: txn_cat_jadwal_instansi (Multi-instansi opsional per jadwal)
        // --------------------------------------------------------
        if (!$this->db->tableExists('txn_cat_jadwal_instansi')) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'constraint'     => 20,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'jadwal_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                    'null'       => false,
                ],
                'instansi_id' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 50,
                    'null'       => false,
                ],
                'created_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
            ]);

            $this->forge->addKey('id', true);
            $this->forge->addKey(['jadwal_id', 'instansi_id'], false, false, 'idx_cat_jadwal_instansi');
            $this->forge->createTable('txn_cat_jadwal_instansi', true);
        }

        // --------------------------------------------------------
        // 3. Table: txn_cat_tim (Susunan Tim Pelaksana per Jadwal)
        // --------------------------------------------------------
        if (!$this->db->tableExists('txn_cat_tim')) {
            $this->forge->addField([
                'id' => [
                    'type'           => 'BIGINT',
                    'constraint'     => 20,
                    'unsigned'       => true,
                    'auto_increment' => true,
                ],
                'jadwal_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                    'null'       => false,
                ],
                'pegawai_id' => [
                    'type'       => 'INT',
                    'constraint' => 11,
                    'unsigned'   => true,
                    'null'       => true,
                ],
                'nip' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 30,
                    'null'       => false,
                ],
                'nama' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => false,
                ],
                'pangkat_gol' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 100,
                    'null'       => true,
                ],
                'jabatan' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'peran' => [
                    'type'       => 'ENUM',
                    'constraint' => ['Koordinator', 'IT', 'Pengawas'],
                    'default'    => 'Pengawas',
                ],
                'st_document_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                    'null'       => true,
                ],
                'nomor_st' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 120,
                    'null'       => true,
                ],
                'tanggal_mulai' => [
                    'type' => 'DATE',
                    'null' => true,
                ],
                'tanggal_selesai' => [
                    'type' => 'DATE',
                    'null' => true,
                ],
                'catatan' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 255,
                    'null'       => true,
                ],
                'created_by' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 50,
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
            $this->forge->addKey(['jadwal_id', 'peran'], false, false, 'idx_cat_tim_jadwal_peran');
            $this->forge->addKey('nip', false, false, 'idx_cat_tim_nip');
            $this->forge->createTable('txn_cat_tim', true);
        }

        // --------------------------------------------------------
        // 4. Tambah kolom jadwal_id di txn_pnbp_documents (relasi dokumen <-> jadwal)
        // --------------------------------------------------------
        if ($this->db->tableExists('txn_pnbp_documents') && !$this->db->fieldExists('jadwal_id', 'txn_pnbp_documents')) {
            $this->forge->addColumn('txn_pnbp_documents', [
                'jadwal_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                    'null'       => true,
                    'after'      => 'instansi_id',
                ],
            ]);
            $this->db->query('CREATE INDEX idx_pnbp_docs_jadwal_id ON txn_pnbp_documents (jadwal_id)');
        }
    }

    public function down()
    {
        if ($this->db->tableExists('txn_pnbp_documents') && $this->db->fieldExists('jadwal_id', 'txn_pnbp_documents')) {
            $this->forge->dropColumn('txn_pnbp_documents', 'jadwal_id');
        }
        $this->forge->dropTable('txn_cat_tim', true);
        $this->forge->dropTable('txn_cat_jadwal_instansi', true);
        $this->forge->dropTable('txn_cat_jadwal', true);
    }
}
