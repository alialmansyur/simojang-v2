<?php

namespace App\Controllers\Apps;

use App\Controllers\BaseController;
use App\Models\Apps\DashboardModel;

class DashboardController extends BaseController
{
    private DashboardModel $dashboardModel;

    public function __construct()
    {
        $this->dashboardModel = new DashboardModel();
    }

    /**
     * Endpoint API JSON Ringkasan Workspace Dashboard (Sapaan, Shortcut, & Log Terbaru)
     * GET /api/dashboard/summary
     */
    public function summary()
    {
        $session = session()->get();
        $nip = trim((string) ($session['username'] ?? ($this->request->user['username'] ?? '')));

        $payload = $this->dashboardModel->getWorkspaceSummary($nip);

        return $this->response->setStatusCode(200)->setJSON([
            'code'    => 200,
            'status'  => 'success',
            'message' => 'Ringkasan workspace dashboard berhasil dimuat.',
            'data'    => $payload,
        ]);
    }
}
