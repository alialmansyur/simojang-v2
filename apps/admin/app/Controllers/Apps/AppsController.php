<?php

namespace App\Controllers\Apps;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\Apps\AppsModel;
use App\Models\Apps\MenuModel;

class AppsController extends BaseController
{

    // Constructor removed to avoid duplicate initialization of $this->apps which is handled by BaseController::initController
    
    public function backupDatabase()
    {
        $db = \Config\Database::connect();

        $databaseName = $db->database;
        $fileName = 'backup_' . $databaseName . '_' . date('Ymd_His') . '.sql';

        $backupPath = WRITEPATH . 'backups/';

        if (! is_dir($backupPath)) {
            mkdir($backupPath, 0755, true);
        }

        $filePath = $backupPath . $fileName;

        $sql  = "-- Backup Database: {$databaseName}\n";
        $sql .= "-- Generated at: " . date('Y-m-d H:i:s') . "\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        $tables = $db->listTables();

        foreach ($tables as $table) {
            $sql .= "DROP TABLE IF EXISTS `{$table}`;\n\n";

            $createTable = $db->query("SHOW CREATE TABLE `{$table}`")->getRowArray();

            if (isset($createTable['Create Table'])) {
                $sql .= $createTable['Create Table'] . ";\n\n";
            }

            $rows = $db->table($table)->get()->getResultArray();

            foreach ($rows as $row) {
                $columns = array_map(function ($column) {
                    return '`' . $column . '`';
                }, array_keys($row));

                $values = array_map(function ($value) use ($db) {
                    if ($value === null) {
                        return 'NULL';
                    }

                    return $db->escape($value);
                }, array_values($row));

                $sql .= "INSERT INTO `{$table}` (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $values) . ");\n";
            }

            $sql .= "\n\n";
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

        file_put_contents($filePath, $sql);

        return $this->response
            ->download($filePath, null)
            ->setFileName($fileName);
    }

    /**
     * Endpoint API JSON untuk menyajikan navigasi dinamis berbasis DB dan RBAC
     */
    public function getUserMenus()
    {
        $userId = (int) (session()->get('userid') ?? ($this->request->user['user_id'] ?? 0));
        if ($userId <= 0) {
            return $this->response->setStatusCode(401)->setJSON([
                'status'  => 'error',
                'message' => 'Unauthorized. Sesi login tidak ditemukan.',
            ]);
        }

        $menuModel = new MenuModel();
        $navTree = $menuModel->getFullNavigationForUser($userId);
        $roleId = $menuModel->getRoleIdByUserId($userId);

        return $this->response->setJSON([
            'status' => 'success',
            'code'   => 200,
            'data'   => [
                'user_id'   => $userId,
                'role'      => session()->get('role') ?? 'USR',
                'role_id'   => $roleId,
                'menu_tree' => $navTree,
            ],
        ]);
    }
}
