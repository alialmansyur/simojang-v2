<?php

namespace App\Controllers\Auth;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\API\ResponseTrait;
use Config\Services;
use App\Models\Auth\UserModel;
use App\Models\Apps\AppsModel;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

class Auth extends ResourceController
{
    use ResponseTrait;

    private function getJwtSecret(): string
    {
        $secret = trim((string) (
            env('JWT_TOKEN_SECRET')
            ?: (getenv('JWT_TOKEN_SECRET')
            ?: ($_ENV['JWT_TOKEN_SECRET'] ?? ''))
        ));

        if ($secret === '') {
            throw new \RuntimeException('JWT_TOKEN_SECRET belum dikonfigurasi pada environment server.');
        }

        return $secret;
    }

    private function isAccountActive(array $user): bool
    {
        $isActive = (int) ($user['is_active'] ?? 1) === 1;
        $status = strtolower(trim((string) ($user['status'] ?? 'active')));
        // Kolom deleted_at di skema auth_users memakai ON UPDATE current_timestamp() sementara $useSoftDeletes = false.
        return $isActive && !in_array($status, ['inactive', '0', 'disabled', 'suspended', 'banned'], true);
    }

    private function clearAuthSession(): void
    {
        $session = session();
        $session->remove([
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
        $session->destroy();
    }

    public function authprocess()
    {
        helper(['form']);
        $username = trim((string) $this->request->getPost('o_userlogin'));
        $password = (string) $this->request->getPost('o_password');
        $rememberLogin = (string) $this->request->getPost('remember_login') === '1';

        $rules = [
            'o_userlogin' => [
                'rules'  => 'required',
                'errors' => [
                    'required' => 'NIP atau nama pengguna wajib diisi.',
                ],
            ],
            'o_password' => [
                'rules'  => 'required|min_length[8]',
                'errors' => [
                    'required'   => 'Kata sandi wajib diisi.',
                    'min_length' => 'Kata sandi minimal harus terdiri dari 8 karakter.',
                ],
            ],
        ];

        if (!$this->validate($rules)) {
            $errors = $this->validator->getErrors();
            $firstMessage = trim((string) reset($errors));
            return $this->respond([
                'status'   => 'error',
                'message'  => $firstMessage !== '' ? $firstMessage : 'Periksa kembali data masuk yang Anda isi.',
                'errors'   => $errors,
                'messages' => $errors,
            ], 422);
        }

        // Batasi percobaan login per IP dan username agar terlindung dari brute-force
        $throttler = Services::throttler();
        $throttleKey = 'auth_attempt_' . md5($this->request->getIPAddress() . '|' . strtolower($username));
        if ($throttler->check($throttleKey, 8, MINUTE) === false) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Terlalu banyak percobaan masuk. Silakan tunggu sekitar satu menit sebelum mencoba lagi.',
            ], 429);
        }

        // $recaptchaResponse = $this->request->getPost('g-recaptcha-response');
        // if (!$this->validateRecaptcha($recaptchaResponse)) {
        //     return $this->failUnauthorized('reCAPTCHA verification failed');
        // }

        $model = new UserModel();
        $userdata = $model->getUserByUsername($username);

        if (!$userdata || empty($userdata['password']) || !password_verify($password, (string) $userdata['password'])) {
            (new \App\Models\Apps\AuditLogModel())->record(
                'auth.login.failed',
                'auth_users',
                $username,
                null,
                ['username' => $username, 'reason' => 'invalid_credentials'],
                $userdata ? (int) $userdata['id'] : null
            );
            return $this->respond([
                'status'  => 'error',
                'message' => 'NIP/nama pengguna atau kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali.',
            ], 401);
        }

        if (!$this->isAccountActive($userdata)) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Akun Anda saat ini tidak aktif. Silakan hubungi administrator atau Helpdesk Tata Usaha.',
            ], 403);
        }

        // Catat waktu last_login ke tabel auth_users
        try {
            $model->recordLastLogin((int) $userdata['id']);
        } catch (Throwable $e) {
            log_message('warning', 'Auth recordLastLogin failed: {message}', ['message' => $e->getMessage()]);
        }

        $fingerprintJson = $this->request->getPost('fingerprint');
        if ($fingerprintJson) {
            try {
                $fingerprintData = json_decode((string) $fingerprintJson, true);
                if (is_array($fingerprintData)) {
                    $ipAddress = $this->request->getIPAddress();
                    $agentModel = new AppsModel();
                    $userAgent = [
                        'username'        => $userdata['username'],
                        'user_agent'      => $fingerprintData['user_agent'] ?? null,
                        'user_agent_hash' => hash('sha256', (string) ($fingerprintData['user_agent'] ?? '')),
                        'language'        => $fingerprintData['language'] ?? null,
                        'platform'        => $fingerprintData['platform'] ?? null,
                        'cpu_cores'       => $fingerprintData['cpu_cores'] ?? null,
                        'device_memory'   => $fingerprintData['device_memory'] ?? null,
                        'screen_width'    => $fingerprintData['screen_width'] ?? null,
                        'screen_height'   => $fingerprintData['screen_height'] ?? null,
                        'timezone'        => $fingerprintData['timezone'] ?? null,
                        'touch_support'   => $fingerprintData['touch_support'] ?? 0,
                        'ip_address'      => $ipAddress,
                        'created_at'      => date('Y-m-d H:i:s'),
                    ];
                    $agentModel->storeData($userAgent, 'auth_useragent');
                }
            } catch (Throwable $e) {
                log_message('warning', 'Auth fingerprint logging failed: {message}', ['message' => $e->getMessage()]);
            }
        }

        try {
            $key = $this->getJwtSecret();
        } catch (Throwable $e) {
            log_message('critical', 'Auth login failed due to missing JWT secret: {message}', ['message' => $e->getMessage()]);
            return $this->respond([
                'status'  => 'error',
                'message' => 'Konfigurasi autentikasi server belum lengkap.',
            ], ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }
        $loc = getenv('LOCATIONIQ_SECRET_KEY');
        $issuedAt = time();
        // Maksimal masa berlaku sesi dan token JWT dibatasi tepat 1 jam (3600 detik) sesuai kebijakan keamanan
        $tokenTtl = 3600;
        $expirationTime = $issuedAt + $tokenTtl;

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'nbf' => $issuedAt,
            'user_id' => $userdata['id'],
            'user_name' => $userdata['username'],
            'user_fullname' => $userdata['fullname'],
            'role' => $userdata['role'] ?? 'USR',
            'remember' => $rememberLogin ? 1 : 0,
        ];

        $tokenjwt = JWT::encode($payload, $key, 'HS256');
        // Regenerasi ID session saat login berhasil untuk mencegah session fixation
        session()->regenerate(true);
        session()->set('jwt_auth_token', $tokenjwt);
        session()->set('userid', $userdata['id']);
        session()->set('username', $userdata['username']);
        session()->set('fullname', $userdata['fullname']);
        session()->set('role', $userdata['role'] ?? 'USR');
        session()->set('login_remember', $rememberLogin ? 1 : 0);
        session()->set('jwt_expired_at', $expirationTime);

        (new \App\Models\Apps\AuditLogModel())->record(
            'auth.login.success',
            'auth_users',
            (string) $userdata['id'],
            null,
            ['username' => $userdata['username'], 'role' => $userdata['role'] ?? 'USR'],
            (int) $userdata['id']
        );

        return $this->respond([
            'status' => 'success',
            'message' => 'Berhasil masuk ke sistem.',
            'token' => $tokenjwt,
            'role'  => $userdata['role'],
            'locationiq' => $loc,
            'expires_in' => $tokenTtl,
            'remember_login' => $rememberLogin ? 1 : 0,
        ]);
    }

    private function buildUserProfilePayload(array $user, array $detail = []): array
    {
        $rawAvatar = trim((string) ($detail['userimage'] ?? $user['userimage'] ?? ''));
        $avatarUrl = $rawAvatar !== ''
            ? (new \App\Services\Storage\FileStorageService())->toPublicUrl($rawAvatar, 'avatars')
            : null;
        $roleCode = $detail['role'] ?? $user['role'] ?? 'USR';
        $roleName = $detail['role_name'] ?? $roleCode;
        $username = (string) ($detail['username'] ?? $user['username'] ?? '');
        $nip = (string) ($detail['pegawai_nip'] ?? '');
        if ($nip === '' && $username !== '' && strtolower($username) !== 'adm') {
            $nip = $username;
        }
        $displayName = $detail['display_name']
            ?? (!empty($user['fullname']) ? $user['fullname'] : ($detail['pegawai_nama'] ?? $username));

        return [
            'id'         => (int) ($detail['id'] ?? $user['id']),
            'name'       => $displayName,
            'fullname'   => $user['fullname'] ?? $displayName,
            'username'   => $username,
            'nip'        => $nip,
            'email'      => $detail['email'] ?? $user['email'] ?? '',
            'phone'      => $detail['pegawai_phone'] ?? '',
            'jabatan'    => $detail['pegawai_jabatan'] ?? '',
            'role'       => $roleCode,
            'role_name'  => $roleName,
            'roles'      => [$roleCode],
            'avatar'     => $avatarUrl,
            'avatar_url' => $avatarUrl,
            'is_active'  => (bool) ($detail['active'] ?? $user['is_active'] ?? 1),
            'last_login' => $detail['last_login'] ?? $user['last_login'] ?? null,
            'created_at' => $detail['created_at'] ?? $user['created_at'] ?? null,
        ];
    }

    public function changePassword()
    {
        $userId = (int) (session()->get('userid') ?? 0);
        if ($userId <= 0) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Sesi login tidak ditemukan. Silakan login kembali.',
            ], 401);
        }

        $json = $this->request->getJSON(true);
        $input = is_array($json) ? $json : $this->request->getPost();

        $password1 = (string) ($input['current_password'] ?? $input['o_password1'] ?? '');
        $password2 = (string) ($input['new_password'] ?? $input['password'] ?? $input['o_password2'] ?? '');
        $password3 = (string) ($input['confirm_password'] ?? $input['password_confirmation'] ?? $input['o_password3'] ?? '');

        $errors = [];
        if ($password1 === '') {
            $errors['current_password'] = 'Kata sandi saat ini wajib diisi.';
        }
        if ($password2 === '') {
            $errors['new_password'] = 'Kata sandi baru wajib diisi.';
        } elseif (!preg_match('/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/', $password2)) {
            $errors['new_password'] = 'Kata sandi baru minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, serta simbol.';
        } elseif ($password2 === $password1) {
            $errors['new_password'] = 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.';
        }
        if ($password3 === '') {
            $errors['confirm_password'] = 'Konfirmasi kata sandi baru wajib diisi.';
        } elseif ($password2 !== $password3) {
            $errors['confirm_password'] = 'Konfirmasi kata sandi baru tidak cocok.';
        }

        if (!empty($errors)) {
            $firstMessage = reset($errors);
            return $this->respond([
                'status'  => 'error',
                'message' => $firstMessage,
                'errors'  => $errors,
            ], 422);
        }

        $model = new UserModel();
        $userdata = $model->find($userId) ?? $model->getUserByUsername((string) session()->get('username'));

        if (!$userdata || !$this->isAccountActive($userdata)) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Akun pengguna tidak ditemukan atau sedang tidak aktif.',
            ], 403);
        }

        if (!password_verify($password1, (string) $userdata['password'])) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Kata sandi saat ini tidak sesuai.',
                'errors'  => [
                    'current_password' => 'Kata sandi saat ini tidak sesuai.',
                ],
            ], 422);
        }

        $hashedPassword = password_hash($password2, PASSWORD_BCRYPT);
        $model->updatePassword((int) $userdata['id'], $hashedPassword);

        return $this->respond([
            'status'   => 'success',
            'message'  => 'Kata sandi berhasil diubah.',
            'messages' => 'Kata sandi berhasil diubah.',
        ]);
    }

    public function updateProfile()
    {
        $userId = (int) (session()->get('userid') ?? 0);
        if ($userId <= 0) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Sesi masuk Anda telah berakhir. Silakan masuk kembali.',
            ], 401);
        }

        $userModel = new UserModel();
        $existingUser = $userModel->find($userId);
        if (!$existingUser || !$this->isAccountActive($existingUser)) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Akun pengguna tidak ditemukan atau sedang tidak aktif.',
            ], 403);
        }

        $json = $this->request->getJSON(true);
        $input = is_array($json) ? $json : $this->request->getPost();

        $fullname = trim((string) ($input['fullname'] ?? $input['name'] ?? $existingUser['fullname'] ?? ''));
        $email = strtolower(trim((string) ($input['email'] ?? $existingUser['email'] ?? '')));
        $phone = trim((string) ($input['phone'] ?? ''));
        $removeAvatar = in_array((string) ($input['remove_avatar'] ?? ''), ['1', 'true'], true);

        $errors = [];
        if ($fullname === '') {
            $errors['fullname'] = 'Nama lengkap wajib diisi.';
        }
        if ($email === '') {
            $errors['email'] = 'Alamat email wajib diisi.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Format alamat email tidak valid.';
        }

        if (!empty($errors)) {
            return $this->respond([
                'status'  => 'error',
                'message' => reset($errors),
                'errors'  => $errors,
            ], 422);
        }

        $result = $userModel->updateUser($userId, [
            'fullname' => $fullname,
            'email'    => $email,
        ]);

        if (empty($result['status'])) {
            $field = $result['field'] ?? 'general';
            return $this->respond([
                'status'  => 'error',
                'message' => $result['message'] ?? 'Gagal memperbarui profil.',
                'errors'  => [$field => $result['message'] ?? 'Gagal memperbarui profil.'],
            ], 422);
        }

        $db = db_connect();
        $avatarFile = $this->request->getFile('avatar');
        if ($avatarFile && $avatarFile->getError() !== UPLOAD_ERR_NO_FILE) {
            if (!$avatarFile->isValid()) {
                return $this->respond([
                    'status'  => 'error',
                    'message' => 'File avatar tidak valid.',
                    'errors'  => ['avatar' => 'File avatar tidak valid.'],
                ], 422);
            }

            $allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
            $mime = (string) $avatarFile->getMimeType();
            if (!in_array($mime, $allowedMime, true)) {
                return $this->respond([
                    'status'  => 'error',
                    'message' => 'Format foto harus JPG, PNG, atau WEBP.',
                    'errors'  => ['avatar' => 'Format foto harus JPG, PNG, atau WEBP.'],
                ], 422);
            }

            if ($avatarFile->getSizeByUnit('kb') > 2048) {
                return $this->respond([
                    'status'  => 'error',
                    'message' => 'Ukuran foto maksimal 2 MB.',
                    'errors'  => ['avatar' => 'Ukuran foto maksimal 2 MB.'],
                ], 422);
            }

            $storage = new \App\Services\Storage\FileStorageService();
            $ext = $avatarFile->guessExtension() ?: $avatarFile->getClientExtension() ?: 'jpg';
            $newName = 'avatar_' . $userId . '_' . time() . '.' . $ext;
            try {
                $stored = $storage->storeUploadedFile($avatarFile, 'avatars', [
                    'customName' => $newName,
                ]);
            } catch (\Throwable $e) {
                log_message('error', 'Auth::updateAvatar failed: {message}', ['message' => $e->getMessage()]);
                $isValidation = $e instanceof \RuntimeException;
                $msg = $isValidation ? $e->getMessage() : 'Gagal mengunggah foto profil.';
                return $this->respond([
                    'status'  => 'error',
                    'message' => $msg,
                    'errors'  => ['avatar' => $msg],
                ], $isValidation ? 422 : 500);
            }

            if (!empty($existingUser['userimage'])) {
                $storage->delete((string) $existingUser['userimage'], 'avatars');
            }

            $db->table('auth_users')
                ->where('id', $userId)
                ->update([
                    'userimage'  => $stored['url'],
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
        } elseif ($removeAvatar) {
            if (!empty($existingUser['userimage'])) {
                (new \App\Services\Storage\FileStorageService())->delete((string) $existingUser['userimage'], 'avatars');
            }
            $db->table('auth_users')
                ->where('id', $userId)
                ->update([
                    'userimage'  => null,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
        }

        if (array_key_exists('phone', $input) && !empty($existingUser['username'])) {
            try {
                $pegawaiRow = $db->table('data_pegawai')
                    ->select('id')
                    ->where('nip', $existingUser['username'])
                    ->limit(1)
                    ->get()
                    ->getRowArray();

                if ($pegawaiRow) {
                    $db->table('data_pegawai')
                        ->where('id', (int) $pegawaiRow['id'])
                        ->update(['phone' => $phone]);
                }
            } catch (Throwable $e) {
                log_message('warning', 'Sync pegawai phone failed: {message}', ['message' => $e->getMessage()]);
            }
        }

        session()->set('fullname', $fullname);

        $updatedUser = $userModel->find($userId) ?? $existingUser;
        $detail = $userModel->getUserDetail($userId) ?? [];
        $profilePayload = $this->buildUserProfilePayload($updatedUser, $detail);

        return $this->respond([
            'status'  => 'success',
            'message' => 'Profil berhasil diperbarui.',
            'user'    => $profilePayload,
        ]);
    }

    private function validateRecaptcha($recaptchaResponse)
    {
        $secretKey = getenv('RECAPTCHA_SECRET_KEY');
        $url = 'https://www.google.com/recaptcha/api/siteverify';
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query([
            'secret' => $secretKey,
            'response' => $recaptchaResponse
        ]));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_TIMEOUT, 3);
        $response = curl_exec($curl);
        curl_close($curl);
        $responseData = json_decode($response);
        return isset($responseData->success) && $responseData->success;
    }

    public function me()
    {
        $userId = (int) (session()->get('userid') ?? 0);
        if ($userId <= 0) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'Sesi masuk Anda telah berakhir. Silakan masuk kembali.',
            ], 401);
        }

        $userModel = new UserModel();
        $user = $userModel->find($userId) ?? $userModel->getUserByUsername(session()->get('username') ?? '');
        if (!$user) {
            $this->clearAuthSession();
            return $this->respond([
                'status'  => 'error',
                'message' => 'Akun Anda tidak ditemukan. Silakan masuk kembali.',
            ], 404);
        }

        if (!$this->isAccountActive($user)) {
            $this->clearAuthSession();
            return $this->respond([
                'status'  => 'error',
                'message' => 'Akun Anda sedang dinonaktifkan. Silakan hubungi administrator atau Helpdesk Tata Usaha.',
            ], 403);
        }

        $menuModel = new \App\Models\Apps\MenuModel();
        $menuTree = $menuModel->getFullNavigationForUser($userId);
        $detail = $userModel->getUserDetail($userId) ?? [];
        $profile = $this->buildUserProfilePayload($user, $detail);
        $expiredAt = session()->get('jwt_expired_at');

        return $this->respond(array_merge($profile, [
            'status'           => 'success',
            'is_active'        => true,
            'menu_tree'        => $menuTree,
            'token_expires_at' => $expiredAt ? date('c', (int) $expiredAt) : null,
        ]));
    }

    public function logoutApi()
    {
        return $this->logout();
    }

    public function logout()
    {
        $this->clearAuthSession();

        return $this->respond([
            'status'  => 'success',
            'message' => 'Anda telah keluar dari sistem.',
        ]);
    }
}
