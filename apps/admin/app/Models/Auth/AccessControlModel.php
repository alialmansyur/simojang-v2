<?php

namespace App\Models\Auth;

use CodeIgniter\Model;

class AccessControlModel extends Model
{
    protected $DBGroup = 'default';
    private ServicePermissionModel $permissionModel;


    public function __construct()
    {
        parent::__construct();
        $this->permissionModel = new ServicePermissionModel();
    }

    public function canNipAccessServiceByPath(string $nip, string $path, int $explicitLayananId = 0): ?bool
    {
        $normalizedUrl = trim((string) $path, '/');
        if ($normalizedUrl === '') {
            return null;
        }

        // 0. Jika route modular eksplisit menyertakan layanan_id (mis. /fetch/data, /store/import-excel)
        if ($explicitLayananId > 0) {
            return $this->permissionModel->canNipAccessService($nip, $explicitLayananId);
        }

        // 1. Cek apakah URL terdaftar langsung di data_timkerja_layanan
        $layanan = $this->db->table('data_timkerja_layanan')
            ->select('id, url')
            ->where('url', $normalizedUrl)
            ->limit(1)
            ->get()
            ->getRowArray();

        if (!empty($layanan)) {
            return $this->permissionModel->canNipAccessService($nip, (int) $layanan['id']);
        }

        // 2. Cek mapping API endpoint layanan (/fetch/*, /store/*, /kill/*, /apps-*, /api/apps-*) -> layanan_id
        $candidateIds = $this->resolveLayananIdsByApiPath($normalizedUrl);
        if (empty($candidateIds)) {
            // Bukan API spesifik layanan tim kerja (dashboard/settings/profile/lookup bersama)
            return null;
        }

        foreach ($candidateIds as $layananId) {
            if ($this->permissionModel->canNipAccessService($nip, $layananId)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Memetakan API endpoint aksi/fetch layanan ke daftar layanan_id yang berwenang.
     *
     * @return list<int>
     */
    private function resolveLayananIdsByApiPath(string $path): array
    {
        // Route gate check internal pengelola CAT tetap boleh dicek langsung oleh controller
        if ($path === 'api/apps-cat/pengelola/access') {
            return [];
        }

        $prefixMap = [
            'api/apps-tapnip'                          => [2],
            'apps-karier'                              => [40],
            'apps-kompetensi'                          => [39],
            'apps-pnbp'                                => [42],
            'apps-manage-assets-detail'                => [37],
            'api/apps-cat/pengelola/dokumen'           => [42, 28],
            'api/apps-cat/pengelola'                   => [28, 42],
            'api/apps-cat/events'                      => [28],
            'FasilitasiCAT'                            => [28, 42],
            'fetch/pnbp-'                              => [42],
            'fetch/data-pnbp'                          => [42],
            'fetch/summary-pnbp'                       => [42],
            'store/save-pnbp'                          => [42],
            'store/import-pnbp'                        => [42],
            'kill/data-pnbp'                           => [42],
            'fetch/seleksi-options-cat'                => [28, 42],
            'fetch/master-'                            => [35],
            'fetch/ikk-'                               => [43],
            'store/ikk-'                               => [43],
            'kill/ikk-'                                => [43],
            'export/sample-transaksi-ikk'              => [43],
            'export/excel-anggaran'                    => [29],
        ];

        foreach ($prefixMap as $prefix => $ids) {
            if ($path === $prefix || str_starts_with($path, $prefix . '/') || str_starts_with($path, $prefix)) {
                return $ids;
            }
        }

        $exactMap = [
            // Layanan 13: Manajemen Talenta
            'store/add-mt' => [13], 'fetch/data-mt' => [13], 'kill/data-mt' => [13], 'fetch/summary-mt' => [13], 'fetch/detail-mt' => [13], 'store/import-mt' => [13],
            // Layanan 14-16: Pembinaan ASN
            'fetch/options-pembinaan-kinerja' => [14], 'fetch/data-pembinaan-kinerja' => [14], 'fetch/summary-pembinaan-kinerja' => [14], 'store/save-data-pembinaan-kinerja' => [14], 'kill/data-pembinaan-kinerja' => [14], 'store/import-pembinaan-kinerja' => [14],
            'fetch/options-pembinaan-kompetensi-karier' => [15], 'fetch/data-pembinaan-kompetensi-karier' => [15], 'fetch/summary-pembinaan-kompetensi-karier' => [15], 'store/save-data-pembinaan-kompetensi-karier' => [15], 'kill/data-pembinaan-kompetensi-karier' => [15], 'store/import-pembinaan-kompetensi-karier' => [15],
            'fetch/options-pembinaan-disiplin-budaya-citra' => [16], 'fetch/data-pembinaan-disiplin-budaya-citra' => [16], 'fetch/detail-pembinaan-disiplin-budaya-citra' => [16], 'fetch/summary-pembinaan-disiplin-budaya-citra' => [16], 'store/save-data-pembinaan-disiplin-budaya-citra' => [16], 'kill/data-pembinaan-disiplin-budaya-citra' => [16], 'store/import-pembinaan-disiplin-budaya-citra' => [16], 'fetch/kategori-pembinaan-disiplin-budaya-citra' => [16], 'store/kategori-pembinaan-disiplin-budaya-citra' => [16], 'kill/kategori-pembinaan-disiplin-budaya-citra' => [16],
            // Layanan 18-20: Pengawasan
            'store/save-data-merit' => [18], 'store/import-batch-merit' => [18], 'fetch/data-merit' => [18], 'fetch/summary-merit' => [18], 'kill/data-merit' => [18],
            'store/save-data-nspk' => [19], 'store/import-batch-nspk' => [19], 'fetch/data-nspk' => [19], 'fetch/summary-nspk' => [19], 'kill/data-nspk' => [19],
            'store/save-data-wasdal' => [20], 'store/import-batch-wasdal' => [20], 'fetch/data-wasdal' => [20], 'fetch/summary-wasdal' => [20], 'kill/data-wasdal' => [20],
            // Layanan 21-26, 28: SIDIGI
            'store/import-excel-statistik' => [21], 'fetch/data-statistik' => [21], 'fetch/summary-statistik' => [21], 'fetch/detail-statistik' => [21], 'kill/data-statistik' => [21],
            'store/save-data-peremajaan' => [22], 'store/import-peremajaan' => [22], 'fetch/data-peremajaan' => [22], 'fetch/summary-peremajaan' => [22], 'fetch/resume-peremajaan' => [22], 'kill/data-peremajaan' => [22],
            'store/import-disparitas' => [23], 'store/save-data-disparitas' => [23], 'fetch/data-disparitas' => [23], 'fetch/summary-disparitas' => [23], 'fetch/detail-disparitas' => [23], 'kill/data-disparitas' => [23],
            'store/save-data-integrasi' => [24], 'store/import-integrasi' => [24], 'fetch/data-integrasi' => [24], 'fetch/summary-integrasi' => [24], 'kill/data-integrasi' => [24],
            'store/import-takah-data' => [25], 'store/save-data-takah' => [25], 'fetch/data-takah' => [25], 'fetch/summary-takah' => [25], 'fetch/detail-takah' => [25], 'kill/data-takah' => [25],
            'store/import-dms-data' => [26], 'store/save-data-dms' => [26], 'fetch/data-dms' => [26], 'fetch/summary-dms' => [26], 'fetch/detail-dms' => [26], 'kill/data-dms' => [26],
            'fetch/jenis-periode-cat' => [28], 'store/import-data-cat' => [28], 'store/save-data-seleksi-cat' => [28], 'fetch/data-seleksi-cat' => [28], 'kill/data-seleksi-cat' => [28], 'store/save-data-tilok-cat' => [28], 'store/save-data-tilok-instansi' => [28], 'store/save-data-tilok-rekap' => [28], 'store/update-data-hasil-cat' => [28], 'fetch/data-tilok-cat' => [28], 'fetch/summary-tilok-cat' => [28], 'fetch/data-tilok-detail' => [28], 'fetch/instansi-tilok-cat' => [28], 'fetch/meta-tilok-detail' => [28], 'fetch/summary-tilok-detail' => [28], 'store/update-event-cat' => [28], 'fetch/events-by-instansi-cat' => [28], 'store/save-kegiatan-seleksi-cat' => [28], 'kill/data-tilok-cat' => [28], 'kill/data-tilok-instansi' => [28], 'kill/data-tilok-rekap' => [28],
            // Layanan 29-38, 41: TU
            'fetch/data-anggaran' => [29], 'fetch/detail-anggaran' => [29], 'fetch/summary-anggaran' => [29], 'fetch/options-anggaran' => [29], 'fetch/settings-anggaran' => [29], 'fetch/select2-struktur-anggaran' => [29], 'store/save-data-anggaran' => [29], 'store/save-tahun-anggaran' => [29], 'store/save-struktur-anggaran' => [29], 'kill/data-anggaran' => [29], 'kill/tahun-anggaran' => [29], 'kill/struktur-anggaran' => [29],
            'store/save-data-ikm' => [30], 'fetch/data-ikm' => [30], 'fetch/summary-ikm' => [30], 'kill/data-ikm' => [30],
            'store/save-data-humas' => [31], 'fetch/data-humas' => [31], 'fetch/summary-humas' => [31], 'kill/data-humas' => [31],
            'store/save-data-surat' => [32], 'fetch/data-surat' => [32], 'fetch/summary-surat' => [32], 'kill/data-surat' => [32],
            'store/save-data-konsultasi' => [33], 'fetch/data-konsultasi' => [33], 'fetch/summary-konsultasi' => [33], 'kill/data-konsultasi' => [33],
            'store/import-ikpa-data' => [34], 'fetch/data-ikpa' => [34], 'fetch/summary-ikpa' => [34], 'fetch/detail-ikpa' => [34], 'kill/data-ikpa' => [34],
            'store/save-data-statistik-internal' => [35], 'store/import-statistik-pegawai' => [35], 'store/save-data-master-statistik' => [35], 'store/delete-data-master-statistik' => [35], 'fetch/data-statistik-accum' => [35], 'fetch/summary-statistik-internal' => [35], 'fetch/data-statistik-pegawai' => [35], 'kill/data-statistik-internal' => [35],
            'store/import-ekin-data' => [36], 'store/save-ekin-manual' => [36], 'fetch/data-ekin' => [36], 'fetch/child-ekin' => [36], 'fetch/summary-ekin' => [36], 'fetch/detail-ekin' => [36], 'kill/data-ekin' => [36],
            'store/save-asset-category' => [37], 'store/update-asset-category' => [37], 'fetch/asset-category' => [37], 'fetch/asset-categories' => [37], 'kill/asset-category' => [37], 'fetch/data-manage-assets' => [37], 'fetch/summary-manage-assets' => [37], 'store/import-asset-data' => [37],
            'fetch/data-manage-project' => [38], 'fetch/summary-manage-project' => [38], 'fetch/project-overview' => [38], 'store/save-project' => [38], 'store/update-project' => [38], 'store/import-excel-project' => [38], 'store/save-project-progress' => [38], 'store/save-project-budget' => [38], 'kill/data-project' => [38], 'kill/project-progress' => [38], 'kill/project-budget' => [38],
            'store/save-data-lost-and-found' => [41], 'fetch/data-lost-and-found' => [41], 'fetch/summary-lost-and-found' => [41], 'kill/data-lost-and-found' => [41],
            // Layanan 39 & 40 alias
            'fetch/data-karier' => [40], 'fetch/summary-karier' => [40], 'store/save-data-karier' => [40], 'kill/data-karier' => [40], 'store/import-karier' => [40],
            'fetch/data-kompetensi' => [39], 'fetch/summary-kompetensi' => [39], 'store/save-data-kompetensi' => [39], 'kill/data-kompetensi' => [39], 'store/import-kompetensi' => [39],
        ];

        return $exactMap[$path] ?? [];
    }
}
