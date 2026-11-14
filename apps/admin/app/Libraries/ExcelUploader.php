<?php

namespace App\Libraries;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class ExcelUploader
{
    protected $uploadPath;

    public function __construct()
    {
        $this->uploadPath = config(\Config\Upload::class)->rootPath . 'public' . DIRECTORY_SEPARATOR . 'excel' . DIRECTORY_SEPARATOR;
    }

    public function validateFile($file, int $maxSizeMb = 20)
    {
        if (!$file || !$file->isValid()) {
            throw new \RuntimeException('File tidak valid atau tidak terunggah.');
        }

        $maxBytes = $maxSizeMb * 1024 * 1024;
        if ((int) $file->getSize() > $maxBytes) {
            throw new \RuntimeException("Ukuran file melebihi batas maksimal {$maxSizeMb} MB.");
        }

        $allowedExtensions = ['xls', 'xlsx'];
        $ext = strtolower((string) $file->getClientExtension());
        if (!in_array($ext, $allowedExtensions, true)) {
            throw new \RuntimeException('Ekstensi file tidak diizinkan. Gunakan file .xlsx atau .xls.');
        }

        $allowedMimes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip',
            'application/x-ole-storage',
        ];

        $detectedMime = (string) $file->getMimeType();
        if (!in_array($detectedMime, $allowedMimes, true)) {
            throw new \RuntimeException('Tipe file tidak didukung (' . $detectedMime . ').');
        }
    }

    public function parseExcel($filePath)
    { 
        if (!class_exists(\ZipArchive::class)) {
            $fh = @fopen($filePath, 'rb');
            $magic = $fh ? fread($fh, 2) : '';
            if ($fh) {
                fclose($fh);
            }
            if ($magic === 'PK') {
                throw new \RuntimeException('Ekstensi PHP ZipArchive belum aktif di server untuk membaca file .xlsx. Aktifkan extension=zip pada php.ini atau unggah format .xls.');
            }
        }
        $spreadsheet = IOFactory::load($filePath);
        // $rows = $spreadsheet->getActiveSheet()->toArray();
        $rows  = $spreadsheet->getSheet(0)->toArray();
        // $highestRow = $sheet->getHighestRow();
        // $rows = $sheet->rangeToArray(
        //     'A:BG' . $highestRow,
        //     null,  // nilai default untuk sel kosong
        //     true,  // calculate formulas
        //     true,  // format data
        //     false  // jangan pakai array key as Excel (A,B,C), tetap pakai 0-based index
        // );

        // unlink($filePath);
        return $rows;
    }

    public static function cleanNumber($value)
    {
        return (int) str_replace([',', '.'], '', $value);
    }

    public static function excelDate($value, $format = 'Y-m-d')
    {
        if ($value === null || trim((string) $value) === '') {
            return null;
        }

        if (is_numeric($value)) {
            return Date::excelToDateTimeObject($value)->format($format);
        }

        $raw = trim((string) $value);
        foreach (['Y-m-d', 'd/m/Y', 'd-m-Y', 'Y/m/d', 'd/m/y'] as $inputFmt) {
            $dt = \DateTime::createFromFormat($inputFmt, $raw);
            if ($dt instanceof \DateTime && $dt->format($inputFmt) === $raw) {
                return $dt->format($format);
            }
        }

        $time = strtotime($raw);
        return $time ? date($format, $time) : null;
    }

    public static function boolFromExcel($value)
    {
        return strtoupper(trim($value)) === 'TRUE' ? 1 : 0;
    }    
}
