<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JwtAuthFilter implements FilterInterface
{
    /**
     * Do whatever processing this filter needs to do.
     *
     * @param RequestInterface $request
     * @param array|null       $arguments
     *
     * @return RequestInterface|ResponseInterface|string|void
     */
    public function before(RequestInterface $request, $arguments = null)
    {
        // 1. Ekstraksi Token dari HTTP Authorization Header (Dual-Mode API Support)
        $authHeader = $request->getServer('HTTP_AUTHORIZATION') 
            ?? $request->getServer('REDIRECT_HTTP_AUTHORIZATION')
            ?? $request->getHeaderLine('Authorization');

        $jwtToken = null;
        if (!empty($authHeader) && preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
            $jwtToken = $matches[1];
        }

        // 2. Fallback ke Session Browser jika tersedia
        if (empty($jwtToken)) {
            $jwtToken = session()->get('jwt_auth_token');
        }

        if (empty($jwtToken)) {
            return $this->jsonUnauthorized($request, 'Autentikasi diperlukan. Silakan login terlebih dahulu.');
        }

        try {
            $key = trim((string) (env('JWT_TOKEN_SECRET') ?: (getenv('JWT_TOKEN_SECRET') ?: ($_ENV['JWT_TOKEN_SECRET'] ?? ''))));
            if ($key === '') {
                log_message('critical', 'JwtAuthFilter aborted: JWT_TOKEN_SECRET environment variable is not configured.');
                $response = service('response')
                    ->setStatusCode(ResponseInterface::HTTP_INTERNAL_SERVER_ERROR)
                    ->setJSON([
                        'code'    => 500,
                        'status'  => 'error',
                        'message' => 'Konfigurasi autentikasi server belum lengkap.',
                    ]);
                return Cors::applyAllowedHeadersToResponse($request, $response);
            }
            $decoded = JWT::decode($jwtToken, new Key($key, 'HS256'));

            $decodedUserId = (int) ($decoded->user_id ?? session()->get('userid') ?? 0);
            if ($decodedUserId <= 0) {
                $this->cleanSession();
                return $this->jsonUnauthorized($request, 'Sesi masuk Anda tidak valid. Silakan masuk kembali.');
            }

            // Pastikan akun pengguna masih aktif di database (deleted_at di skema memakai ON UPDATE current_timestamp())
            $userRow = db_connect()->table('auth_users')
                ->select('id, username, fullname, role, is_active, status')
                ->where('id', $decodedUserId)
                ->limit(1)
                ->get()
                ->getRowArray();

            $userStatus = strtolower(trim((string) ($userRow['status'] ?? 'active')));
            $isActive = !empty($userRow)
                && (int) ($userRow['is_active'] ?? 1) === 1
                && !in_array($userStatus, ['inactive', '0', 'disabled', 'suspended', 'banned'], true);

            if (!$isActive) {
                $this->cleanSession();
                return $this->jsonUnauthorized($request, 'Akun Anda tidak aktif atau tidak ditemukan. Silakan hubungi administrator.');
            }

            // Auto-hidrasi session internal PHP agar RbacFilter dan Controller tetap kompatibel
            session()->set('jwt_auth_token', $jwtToken);
            session()->set('userid', (int) $userRow['id']);
            session()->set('username', $userRow['username'] ?? ($decoded->user_name ?? session()->get('username')));
            session()->set('fullname', $userRow['fullname'] ?? ($decoded->user_fullname ?? session()->get('fullname')));
            session()->set('role', $userRow['role'] ?? ($decoded->role ?? 'USR'));
            if (isset($decoded->exp)) {
                session()->set('jwt_expired_at', $decoded->exp);
            }
        } catch (ExpiredException $e) {
            $this->cleanSession();
            return $this->jsonUnauthorized($request, 'Sesi masuk Anda telah berakhir. Silakan masuk kembali.');
        } catch (Exception $e) {
            log_message('warning', 'JwtAuthFilter decode failed: {message}', ['message' => $e->getMessage()]);
            $this->cleanSession();
            return $this->jsonUnauthorized($request, 'Sesi masuk Anda tidak valid. Silakan masuk kembali.');
        }
    }

    /**
     * Membangun respons JSON 401 lengkap dengan header CORS agar tidak diblokir browser.
     */
    private function jsonUnauthorized(RequestInterface $request, string $message): ResponseInterface
    {
        $response = service('response')
            ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
            ->setJSON([
                'code'    => 401,
                'status'  => 'error',
                'message' => $message,
            ]);

        return Cors::applyAllowedHeadersToResponse($request, $response);
    }

    /**
     * Clean up session data on invalid/expired token.
     */
    private function cleanSession(): void
    {
        session()->remove([
            'jwt_auth_token',
            'userid',
            'username',
            'fullname',
            'role',
            'login_remember',
            'jwt_expired_at',
            'active_menus',
            'active_submenu',
        ]);
        session()->destroy();
    }

    /**
     * Allows After filters to inspect and modify the response object.
     *
     * @param RequestInterface  $request
     * @param ResponseInterface $response
     * @param array|null        $arguments
     *
     * @return ResponseInterface|void
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        //
    }
}
