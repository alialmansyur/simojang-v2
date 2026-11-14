<?php

namespace App\Filters;

use App\Models\Auth\AccessControlModel;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class ServiceAccessFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $nip = (string) session()->get('username');

        if ($nip === '') {
            return service('response')
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
                ->setJSON([
                    'code'    => 401,
                    'status'  => 'error',
                    'message' => 'Sesi login tidak valid.',
                ]);
        }

        // Administrator sistem (ADM) tidak dibatasi oleh izin per layanan tim kerja
        $role = strtoupper(trim((string) (session()->get('role') ?? '')));
        if ($role === 'ADM') {
            return;
        }

        $path = trim($request->getUri()->getPath(), '/');
        if ($path === '') {
            return;
        }

        $explicitLayananId = 0;
        if (in_array($path, ['fetch/data', 'fetch/summary-uploaders', 'store/import-excel'], true)) {
            $explicitLayananId = (int) (
                $request->getPost('layanan')
                ?? $request->getPost('layanan_id')
                ?? $request->getGet('layanan')
                ?? $request->getGet('layanan_id')
                ?? 0
            );
        }

        $acl = new AccessControlModel();
        $result = $acl->canNipAccessServiceByPath($nip, $path, $explicitLayananId);

        // Endpoint bersama/umum (dashboard, master profil, options umum) mengembalikan null
        if ($result === null || $result === true) {
            return;
        }

        return service('response')
            ->setStatusCode(403)
            ->setJSON([
                'code'    => 403,
                'status'  => 'error',
                'message' => 'Akses layanan ditolak. Hubungi administrator.',
            ]);
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
