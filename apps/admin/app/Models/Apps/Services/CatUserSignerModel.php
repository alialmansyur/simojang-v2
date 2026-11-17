<?php

namespace App\Models\Apps\Services;

use CodeIgniter\Model;

class CatUserSignerModel extends Model
{
    protected $table            = 'txn_cat_user_signers';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'user_nip',
        'user_name',
        'jenis_tes_id',
        'seleksi_id',
        'tilok_id',
        'instansi_id',
        'position_key',
        'jabatan',
        'nama',
        'nip',
        'pangkat_gol',
        'instansi_nama',
        'signature_data',
        'created_at',
        'updated_at',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /**
     * Resolve effective signer profiles for a user under given filter scope.
     * Hierarchy priority:
     * 1. Exact match on (user_nip, seleksi_id, tilok_id, instansi_id)
     * 2. Tilok-wide match on (user_nip, seleksi_id, tilok_id, instansi_id IS NULL)
     * 3. Seleksi-wide match on (user_nip, seleksi_id, tilok_id IS NULL)
     * 4. User default profile on (user_nip)
     */
    public function getEffectiveSignersForUser(string $userNip, array $scope = []): array
    {
        $seleksiId  = !empty($scope['seleksi_id']) ? (int) $scope['seleksi_id'] : null;
        $tilokId    = !empty($scope['tilok_id']) ? (string) $scope['tilok_id'] : null;
        $instansiId = !empty($scope['instansi_id']) ? (string) $scope['instansi_id'] : null;

        $builder = $this->where('user_nip', $userNip);
        $allUserSigners = $builder->findAll();

        $positions = ['kiri', 'tengah', 'kanan'];
        $result = [];

        foreach ($positions as $pos) {
            $candidates = array_filter($allUserSigners, fn($s) => ($s['position_key'] ?? '') === $pos);
            if (empty($candidates)) {
                $result[$pos] = null;
                continue;
            }

            // Score candidates based on specificity:
            // 4 points: matches instansi_id, tilok_id, seleksi_id
            // 3 points: matches tilok_id, seleksi_id (instansi_id is empty/null -> applies to entire tilok)
            // 2 points: matches seleksi_id
            // 1 point: general fallback
            $bestCandidate = null;
            $bestScore = -1;

            foreach ($candidates as $cand) {
                $score = 0;
                $candInstansi = trim((string) ($cand['instansi_id'] ?? ''));
                $candTilok    = trim((string) ($cand['tilok_id'] ?? ''));
                $candSeleksi  = !empty($cand['seleksi_id']) ? (int) $cand['seleksi_id'] : null;

                if ($instansiId !== null && $candInstansi !== '' && $candInstansi === $instansiId && $candTilok === $tilokId) {
                    $score = 4;
                } elseif (($candInstansi === '' || $candInstansi === null) && $tilokId !== null && $candTilok === $tilokId) {
                    $score = 3;
                } elseif ($seleksiId !== null && $candSeleksi === $seleksiId) {
                    $score = 2;
                } else {
                    $score = 1;
                }

                if ($score > $bestScore) {
                    $bestScore = $score;
                    $bestCandidate = $cand;
                }
            }

            $result[$pos] = $bestCandidate;
        }

        return $result;
    }

    /**
     * Upsert signer profile for given scope
     */
    public function upsertSignerProfile(array $data): bool
    {
        $userNip     = trim((string) ($data['user_nip'] ?? ''));
        $positionKey = trim((string) ($data['position_key'] ?? 'kanan'));
        $seleksiId   = !empty($data['seleksi_id']) ? (int) $data['seleksi_id'] : null;
        $tilokId     = !empty($data['tilok_id']) ? (string) $data['tilok_id'] : null;
        $instansiId  = !empty($data['instansi_id']) ? (string) $data['instansi_id'] : null;

        if ($userNip === '') return false;

        $builder = $this->where('user_nip', $userNip)
                        ->where('position_key', $positionKey);

        if ($seleksiId !== null) {
            $builder->where('seleksi_id', $seleksiId);
        } else {
            $builder->where('seleksi_id IS NULL');
        }

        if ($tilokId !== null) {
            $builder->where('tilok_id', $tilokId);
        } else {
            $builder->where('tilok_id IS NULL');
        }

        if ($instansiId !== null) {
            $builder->where('instansi_id', $instansiId);
        } else {
            $builder->where('instansi_id IS NULL');
        }

        $existing = $builder->first();

        if ($existing) {
            return (bool) $this->update($existing['id'], $data);
        }

        return (bool) $this->insert($data);
    }
}
