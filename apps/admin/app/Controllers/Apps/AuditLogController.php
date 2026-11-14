<?php

namespace App\Controllers\Apps;

use App\Controllers\BaseController;
use App\Models\Apps\AuditLogModel;
use Throwable;

class AuditLogController extends BaseController
{
    private AuditLogModel $auditModel;

    public function __construct()
    {
        $this->auditModel = new AuditLogModel();
    }

    public function summary()
    {
        try {
            $data = $this->auditModel->getSummary();
            return $this->response->setJSON([
                'status'  => true,
                'message' => 'OK',
                'data'    => $data,
                'errors'  => [],
            ]);
        } catch (Throwable $e) {
            log_message('error', 'AuditLogController::summary gagal: {message}', ['message' => $e->getMessage()]);
            return $this->response->setStatusCode(500)->setJSON([
                'status'  => false,
                'message' => 'Gagal memuat ringkasan log audit.',
                'data'    => [],
                'errors'  => [],
            ]);
        }
    }

    public function list()
    {
        $tab = trim((string) ($this->request->getGet('tab') ?? 'system'));
        $params = [
            'page'       => $this->request->getGet('page'),
            'per_page'   => $this->request->getGet('per_page'),
            'search'     => $this->request->getGet('search'),
            'date_from'  => $this->request->getGet('date_from'),
            'date_to'    => $this->request->getGet('date_to'),
            'event_name' => $this->request->getGet('event_name'),
            'layanan_id' => $this->request->getGet('layanan_id'),
        ];

        try {
            $result = $this->auditModel->getLogs($tab, $params);
            return $this->response->setJSON([
                'status'  => true,
                'message' => 'OK',
                'data'    => $result['rows'],
                'meta'    => $result['meta'],
                'errors'  => [],
            ]);
        } catch (Throwable $e) {
            log_message('error', 'AuditLogController::list gagal: {message}', ['message' => $e->getMessage()]);
            return $this->response->setStatusCode(500)->setJSON([
                'status'  => false,
                'message' => 'Gagal memuat data log aktivitas.',
                'data'    => [],
                'meta'    => [],
                'errors'  => [],
            ]);
        }
    }

    public function detail(int $id = 0)
    {
        if ($id <= 0) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => false,
                'message' => 'ID log wajib valid.',
                'data'    => [],
                'errors'  => ['id' => 'ID log wajib valid.'],
            ]);
        }

        try {
            $detail = $this->auditModel->getSystemLogDetail($id);
            if (!$detail) {
                return $this->response->setStatusCode(404)->setJSON([
                    'status'  => false,
                    'message' => 'Detail log tidak ditemukan.',
                    'data'    => [],
                    'errors'  => [],
                ]);
            }

            return $this->response->setJSON([
                'status'  => true,
                'message' => 'OK',
                'data'    => $detail,
                'errors'  => [],
            ]);
        } catch (Throwable $e) {
            log_message('error', 'AuditLogController::detail gagal: {message}', ['message' => $e->getMessage()]);
            return $this->response->setStatusCode(500)->setJSON([
                'status'  => false,
                'message' => 'Gagal memuat detail log audit.',
                'data'    => [],
                'errors'  => [],
            ]);
        }
    }
}
