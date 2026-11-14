<?php

namespace App\Traits;

use CodeIgniter\HTTP\ResponseInterface;

trait ApiResponseTrait
{
    /**
     * Mengembalikan respons JSON sukses standar.
     * Parameter $extra dapat dipakai sementara untuk field kompatibilitas (mis. summary/key legacy).
     */
    protected function apiSuccess(
        string $message = 'OK',
        $data = null,
        int $code = 200,
        array $meta = [],
        array $extra = []
    ): ResponseInterface {
        $payload = [
            'status'  => 'success',
            'code'    => $code,
            'message' => $message,
            'data'    => $data,
        ];

        if (!empty($meta)) {
            $payload['meta'] = $meta;
        }

        if (!empty($extra)) {
            $payload = array_merge($extra, $payload);
        }

        return $this->response->setStatusCode($code)->setJSON($payload);
    }

    /**
     * Mengembalikan respons JSON error standar dengan HTTP status >= 400.
     */
    protected function apiError(
        string $message,
        int $code = 400,
        array $errors = [],
        array $extra = []
    ): ResponseInterface {
        if ($code < 400 || $code > 599) {
            $code = 400;
        }

        $payload = [
            'status'  => 'error',
            'code'    => $code,
            'message' => $message,
            'data'    => null,
            'errors'  => $errors,
        ];

        if (!empty($extra)) {
            $payload = array_merge($extra, $payload);
        }

        return $this->response->setStatusCode($code)->setJSON($payload);
    }

    /**
     * Mencatat detail exception ke server log tanpa membocorkan detail teknis ke client.
     */
    protected function apiException(
        \Throwable $e,
        string $publicMessage = 'Terjadi kesalahan pada server. Silakan coba kembali.',
        int $code = 500,
        string $context = ''
    ): ResponseInterface {
        $prefix = $context !== '' ? "[{$context}] " : '';
        log_message('error', $prefix . '{message} at {file}:{line}', [
            'message' => $e->getMessage(),
            'file'    => $e->getFile(),
            'line'    => $e->getLine(),
        ]);

        return $this->apiError($publicMessage, $code);
    }

    /**
     * Membaca input request secara seragam (JSON body maupun form-data POST).
     */
    protected function getRequestPayload(): array
    {
        $json = $this->request->getJSON(true);
        if (is_array($json) && !empty($json)) {
            return $json;
        }

        $post = $this->request->getPost();
        return is_array($post) ? $post : [];
    }
}
