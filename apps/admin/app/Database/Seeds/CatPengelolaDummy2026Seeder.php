<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class CatPengelolaDummy2026Seeder extends Seeder
{
    public function run()
    {
        $sqlFile = ROOTPATH . '../../dok/sql/seed_cat_pengelola_dummy_2026.sql';
        if (!file_exists($sqlFile)) {
            $sqlFile = dirname(ROOTPATH) . '/dok/sql/seed_cat_pengelola_dummy_2026.sql';
        }

        if (file_exists($sqlFile)) {
            $queries = file_get_contents($sqlFile);
            $statements = array_filter(array_map('trim', explode(';', $queries)));
            foreach ($statements as $stmt) {
                if ($stmt !== '' && !preg_match('/^(START TRANSACTION|COMMIT)/i', $stmt)) {
                    $this->db->query($stmt);
                }
            }
        }
    }
}
