<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class Cors implements FilterInterface
{
    /**
     * Resolve whether the request Origin is allowed for credentialed CORS.
     */
    public static function resolveAllowedOrigin(RequestInterface $request): ?string
    {
        $origin = trim((string) ($request->getServer('HTTP_ORIGIN') ?? ''));
        if ($origin === '') {
            return null;
        }

        $configured = (string) (env('CORS_ALLOWED_ORIGINS') ?: (getenv('CORS_ALLOWED_ORIGINS') ?: ''));
        if ($configured !== '') {
            $allowlist = array_filter(array_map(static fn ($v) => rtrim(trim($v), '/'), explode(',', $configured)));
            if (in_array(rtrim($origin, '/'), $allowlist, true)) {
                return $origin;
            }
        }

        $parsed = parse_url($origin);
        $scheme = strtolower((string) ($parsed['scheme'] ?? ''));
        $host = strtolower((string) ($parsed['host'] ?? ''));
        if (!in_array($scheme, ['http', 'https'], true) || $host === '') {
            return null;
        }

        // Izinkan origin pengembangan lokal serta host yang sama dengan aplikasi backend.
        $serverHost = strtolower((string) ($request->getUri()->getHost() ?: ($_SERVER['HTTP_HOST'] ?? '')));
        $serverHostName = explode(':', $serverHost)[0];
        if (in_array($host, ['localhost', '127.0.0.1', '::1'], true) || ($serverHostName !== '' && $host === $serverHostName)) {
            return $origin;
        }

        return null;
    }

    public static function applyAllowedHeadersToResponse(RequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $allowedOrigin = self::resolveAllowedOrigin($request);
        $response
            ->setHeader('Access-Control-Allow-Headers', 'X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Requested-Method, Authorization, X-Forwarded-For')
            ->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, PUT, DELETE')
            ->setHeader('Access-Control-Max-Age', '86400')
            ->setHeader('Vary', 'Origin');

        if ($allowedOrigin !== null) {
            $response
                ->setHeader('Access-Control-Allow-Origin', $allowedOrigin)
                ->setHeader('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }

    private function applyCorsHeaders(RequestInterface $request, ?ResponseInterface $response = null): void
    {
        if ($response !== null) {
            self::applyAllowedHeadersToResponse($request, $response);
            return;
        }

        $allowedOrigin = self::resolveAllowedOrigin($request);
        $headers = [
            'Access-Control-Allow-Headers' => 'X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Requested-Method, Authorization, X-Forwarded-For',
            'Access-Control-Allow-Methods' => 'GET, POST, OPTIONS, PATCH, PUT, DELETE',
            'Access-Control-Max-Age'       => '86400',
            'Vary'                         => 'Origin',
        ];

        if ($allowedOrigin !== null) {
            $headers['Access-Control-Allow-Origin'] = $allowedOrigin;
            $headers['Access-Control-Allow-Credentials'] = 'true';
        }

        foreach ($headers as $name => $value) {
            header("{$name}: {$value}");
        }
    }

    public function before(RequestInterface $request, $arguments = null)
    {
        $this->applyCorsHeaders($request);

        $method = $request->getServer('REQUEST_METHOD') ?? $request->getMethod();
        if (strtoupper((string) $method) === 'OPTIONS') {
            $response = service('response')->setStatusCode(200)->setBody('');
            $this->applyCorsHeaders($request, $response);
            return $response;
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        $this->applyCorsHeaders($request, $response);
        return $response;
    }
}
