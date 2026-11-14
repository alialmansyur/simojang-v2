<?php

namespace App\Controllers\Apps;

use App\Controllers\BaseController;
use App\Models\Apps\AppsModel;
use App\Models\Apps\SettingManagerModel;
use CodeIgniter\API\ResponseTrait;

class AjxController extends BaseController
{
    use ResponseTrait;

    private SettingManagerModel $manager;

    public function __construct()
    {
        $this->apps = new AppsModel();
        $this->manager = new SettingManagerModel();
    }

    /**
     * Ensure current user has administrative privilege or permission on one of the target master-data menus.
     */
    private function canMutateMasterData(): bool
    {
        $userId = (int) (session()->get('userid') ?? 0);
        if ($userId <= 0) {
            return false;
        }

        $role = strtoupper(trim((string) (session()->get('role') ?? '')));
        if ($role === 'ADM') {
            return true;
        }

        foreach (['manage-pegawai', 'manage-instansi', 'manage-iku', 'manage-user', 'ref'] as $menuUrl) {
            if ($this->manager->canUserReadMenuUrl($userId, $menuUrl)) {
                return true;
            }
        }

        return false;
    }

    private function denyMasterMutation()
    {
        return $this->response->setStatusCode(403)->setJSON([
            'status'  => false,
            'message' => 'Anda tidak memiliki hak akses untuk mengubah atau menghapus data ini.',
        ]);
    }

    public function killData()
    {
        if (!$this->canMutateMasterData()) {
            return $this->denyMasterMutation();
        }

        $key = trim((string) $this->request->getPost('key'));
        $tableinfo = strtolower(trim((string) $this->request->getPost('tableinfo')));
        if ($key === '' || !preg_match('/^[a-z][a-z0-9_]{1,50}$/', $tableinfo)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => false,
                'message' => 'Data permintaan tidak valid.',
            ]);
        }

        $tableDest = 'data_' . $tableinfo;
        if (!db_connect()->tableExists($tableDest)) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => false,
                'message' => 'Data tujuan tidak ditemukan.',
            ]);
        }

        $this->apps->removeData($key, $tableDest);
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data berhasil dihapus.',
        ]);
    }

    public function killDataUploader()
    {
        $userId = (int) (session()->get('userid') ?? 0);
        if ($userId <= 0) {
            return $this->response->setStatusCode(401)->setJSON([
                'status'  => false,
                'message' => 'Sesi masuk Anda telah berakhir. Silakan masuk kembali.',
            ]);
        }

        $key = (int) $this->request->getPost('key');
        if ($key <= 0) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => false,
                'message' => 'Data unggahan yang dipilih tidak valid.',
            ]);
        }

        $this->apps->removeDataByField('upload_id', $key, 'txn_activity_upload_detail');
        $this->apps->removeData($key, 'txn_activity_upload_logs');
        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Data unggahan berhasil dihapus.',
        ]);
    }

    public function statusData()
    {
        if (!$this->canMutateMasterData()) {
            return $this->denyMasterMutation();
        }

        $key = trim((string) $this->request->getPost('key'));
        $status = trim((string) $this->request->getPost('status'));
        $tableinfo = strtolower(trim((string) $this->request->getPost('tableinfo')));
        if ($key === '' || $status === '' || !preg_match('/^[a-z][a-z0-9_]{1,50}$/', $tableinfo)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'  => false,
                'message' => 'Data perubahan status tidak valid.',
            ]);
        }

        $tableDest = 'data_' . $tableinfo;
        if (!db_connect()->tableExists($tableDest)) {
            return $this->response->setStatusCode(404)->setJSON([
                'status'  => false,
                'message' => 'Data tujuan tidak ditemukan.',
            ]);
        }

        $this->apps->updateData(['is_status' => $status], $key, $tableDest);

        // Jika mengubah status pegawai, sinkronkan juga akun login di auth_users
        if ($tableinfo === 'pegawai') {
            $pegawaiRow = db_connect()->table('data_pegawai')->select('nip')->where('id', $key)->get()->getRowArray();
            if ($pegawaiRow && !empty($pegawaiRow['nip'])) {
                $nip = trim($pegawaiRow['nip']);
                $isActiveVal = ((int)$status === 1) ? 1 : 0;
                $userStatusStr = ($isActiveVal === 1) ? 'active' : 'inactive';
                db_connect()->table('auth_users')
                    ->where('username', $nip)
                    ->update([
                        'is_active'  => $isActiveVal,
                        'status'     => $userStatusStr,
                        'updated_at' => date('Y-m-d H:i:s'),
                        'deleted_at' => null,
                    ]);
            }
        }

        return $this->response->setJSON([
            'status'  => true,
            'message' => 'Status data berhasil diperbarui.',
        ]);
    }

    public function updateActiveMenu($menuId = null)
    {
        session()->set('active_menus', $menuId);
        return $this->response->setStatusCode(200)->setJSON([
            'status'       => 'success',
            'message'      => 'Menu aktif diperbarui.',
            'active_menus' => $menuId,
        ]);
    }

    public function getOS()
    {
        $userAgent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
        $osArray = [
            'Windows'   => 'Windows',
            'Macintosh' => 'Mac OS',
            'Linux'     => 'Linux',
            'Ubuntu'    => 'Ubuntu',
            'iPhone'    => 'iOS',
            'Android'   => 'Android',
        ];

        foreach ($osArray as $os => $name) {
            if (stripos($userAgent, $os) !== false) {
                return $name;
            }
        }

        return 'Unknown OS';
    }

    public function getBrowser()
    {
        $userAgent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
        $browserArray = [
            'Edge'    => 'Edge',
            'Chrome'  => 'Chrome',
            'Safari'  => 'Safari',
            'Firefox' => 'Firefox',
            'Opera'   => 'Opera',
            'MSIE'    => 'Internet Explorer',
            'Trident' => 'Internet Explorer',
        ];

        foreach ($browserArray as $browser => $name) {
            if (stripos($userAgent, $browser) !== false) {
                return $name;
            }
        }

        return 'Unknown Browser';
    }
}
