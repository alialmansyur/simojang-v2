<?php

namespace Config;
 
use CodeIgniter\Routing\RouteCollection;

/**
 * @var RouteCollection $routes
 */

$routes = Services::routes(); 

if (file_exists(SYSTEMPATH . 'Config/Routes.php')) {
    require SYSTEMPATH . 'Config/Routes.php';
} 

$routes->setDefaultNamespace('App\Controllers');
$routes->setDefaultController('Auth');
$routes->setDefaultMethod('index');
$routes->setTranslateURIDashes(false);
$routes->set404Override(static function () {
    service('response')
        ->setStatusCode(404)
        ->setContentType('application/json', 'UTF-8');

    return json_encode([
        'code'    => 404,
        'status'  => 'error',
        'message' => 'Endpoint tidak ditemukan.',
    ]);
});
$routes->setAutoRoute(false);

$routes->get('/', static function () {
    return service('response')->setJSON([
        'status' => 'ok',
        'app'    => 'SIMOJANG CI4 API',
        'mode'   => 'api-only',
        'time'   => date('Y-m-d H:i:s'),
    ]);
});
$routes->post('/authprocess', 'Auth\Auth::authprocess');
$routes->get('/logout', 'Auth\Auth::logout');
$routes->get('/auth/logout', 'Auth\Auth::logout');
$routes->post('/auth/logout', 'Auth\Auth::logout');
$routes->get('/api/health', static function () {
    return service('response')->setJSON([
        'status' => 'ok',
        'app'    => 'SIMOJANG CI4 API',
        'time'   => date('Y-m-d H:i:s'),
    ]);
});

// Public Digital Signature & Verification Routes (Scan QR Code)
$routes->get('/pnbp-sign/(:segment)', 'Apps\Services\PNBPSignController::signView/$1');
$routes->post('/pnbp-sign/submit', 'Apps\Services\PNBPSignController::submitSignature');
$routes->get('/pnbp-verify/(:segment)', 'Apps\Services\PNBPSignController::verifyDocument/$1');

// Centralized Public Media Route (dev server fallback; production dilayani Nginx langsung)
$routes->get('/media/(:any)', 'Apps\MediaController::servePublic/$1');

// Public Service Maintenance Status (No auth barrier)
$routes->get('/api/public/maintenance-status', 'Apps\SettingManagerController::getMaintenanceServicesApi');

// $routes->get('backup-database', 'Apps\AppsController::backupDatabase');

$routes->group('', ['filter' => ['jwtauth', 'rbac', 'serviceaccess']], function ($routes) {
    // Centralized General File Upload Endpoint
    $routes->post('/api/uploads', 'Apps\MediaController::upload');
    $routes->post('/api/uploads/(:segment)', 'Apps\MediaController::upload/$1');

    // ----------------------------------------------------------------
    // User Profile & Dynamic Navigation APIs
    $routes->get('/auth/me', 'Auth\Auth::me');
    $routes->post('/api/auth/profile', 'Auth\Auth::updateProfile');
    $routes->put('/api/auth/profile', 'Auth\Auth::updateProfile');
    $routes->post('/api/auth/change-password', 'Auth\Auth::changePassword');
    $routes->post('/api/auth/logout', 'Auth\Auth::logoutApi');
    $routes->get('/api/user/menus', 'Apps\AppsController::getUserMenus');
    $routes->get('/api/navigation', 'Apps\AppsController::getUserMenus');

    // Route untuk Main Services / Dashboard
    $routes->get('/api/dashboard/summary', 'Apps\DashboardController::summary');
    $routes->post('/fetch-layanan', 'Apps\FetchData::fetchLayanan');
    $routes->post('/fetch-timkerja', 'Apps\FetchData::fetchTimKerja'); 
    $routes->post('/fetch-layanan-timkerja', 'Apps\FetchData::fetchLayananTimKerja');
    $routes->post('/fetch-layanan-enrolled', 'Apps\FetchData::fetchLayananByNIP');
    $routes->post('/store-enroll', 'Apps\FetchData::enrolltask');        
    
    // Galeri Kegiatan
    $routes->get('/activity-gallery/get-timkerja', 'Apps\ActivityGalleryController::getTimKerja');
    $routes->post('/activity-gallery/get-data', 'Apps\ActivityGalleryController::getData');
    $routes->post('/activity-gallery/get-layanan', 'Apps\ActivityGalleryController::getLayanan');
    $routes->post('/activity-gallery/store', 'Apps\ActivityGalleryController::store');
    $routes->post('/activity-gallery/delete', 'Apps\ActivityGalleryController::delete');

    // Kalender Kegiatan
    $routes->get('/api/calendar-event/events', 'Apps\CalendarEventController::getEvents');
    $routes->get('/api/calendar-event/kpi', 'Apps\CalendarEventController::getKpi');

    // ----------------------------------------------------------------
    // Kelola Data & Database Maintenance
    $routes->get('/download/database-backup', 'Apps\DatabaseBackupController::download');
    $routes->get('/download/schema-rebuild-090326', 'Apps\DatabaseBackupController::downloadRebuildScript090326');
    $routes->post('/execute/schema-rebuild-090326', 'Apps\DatabaseBackupController::executeRebuildScript090326');
    $routes->get('/audit/database-schema-090326', 'Apps\DatabaseBackupController::auditSchema090326');
    $routes->post('/migrate/database-schema-090326', 'Apps\DatabaseBackupController::migrateSchema090326');
    $routes->get('/api/ref/tables', 'Apps\RefApiController::tables');
    $routes->get('/api/ref/(:segment)/schema', 'Apps\RefApiController::schema/$1');
    $routes->get('/api/ref/(:segment)', 'Apps\RefApiController::list/$1');
    $routes->post('/api/ref/(:segment)', 'Apps\RefApiController::create/$1');
    $routes->put('/api/ref/(:segment)/(:segment)', 'Apps\RefApiController::update/$1/$2');
    $routes->delete('/api/ref/(:segment)/(:segment)', 'Apps\RefApiController::delete/$1/$2');
    
    // Manage Role APIs
    $routes->get('/api/manage-role/roles', 'Apps\SettingManagerController::getRoles');
    $routes->post('/api/manage-role/create-role', 'Apps\SettingManagerController::createRole');
    $routes->post('/api/manage-role/update-role', 'Apps\SettingManagerController::updateRole');
    $routes->post('/api/manage-role/delete-role', 'Apps\SettingManagerController::deleteRole');
    $routes->get('/api/manage-role/users', 'Apps\SettingManagerController::getRoleUsers');
    $routes->post('/api/manage-role/assign-user', 'Apps\SettingManagerController::assignUserRole');
    $routes->get('/api/manage-role/tree', 'Apps\SettingManagerController::getRoleTree');
    $routes->post('/api/manage-role/toggle', 'Apps\SettingManagerController::toggleRolePermission');

    // Manage Service APIs (Tree Hierarchy & Pegawai Permission)
    $routes->get('/api/manage-service/pegawai', 'Apps\SettingManagerController::getServicePegawaiListApi');
    $routes->get('/api/manage-service/pegawai-list', 'Apps\SettingManagerController::getServicePegawaiListApi');
    $routes->get('/api/manage-service/tree', 'Apps\SettingManagerController::getServiceTreeApi');
    $routes->post('/api/manage-service/toggle', 'Apps\SettingManagerController::toggleServicePermissionApi');
    $routes->post('/api/manage-service/reset', 'Apps\SettingManagerController::resetServicePermissionApi');
    $routes->post('/api/manage-service/reset-default', 'Apps\SettingManagerController::resetServicePermissionApi');
    $routes->post('/api/manage-service/copy', 'Apps\SettingManagerController::copyServicePermissionApi');
    $routes->post('/api/manage-service/copy-permission', 'Apps\SettingManagerController::copyServicePermissionApi');


    // Manage User APIs
    $routes->match(['GET', 'POST'], '/api/manage-user/datatable', 'Apps\SettingManagerController::getUserDatatableApi');
    $routes->get('/api/manage-user/list', 'Apps\SettingManagerController::getUserListApi');
    $routes->get('/api/manage-user/detail', 'Apps\SettingManagerController::getUserDetailApi');
    $routes->post('/api/manage-user/create', 'Apps\SettingManagerController::createUserApi');
    $routes->post('/api/manage-user/update', 'Apps\SettingManagerController::updateUserApi');
    $routes->post('/api/manage-user/reset-password', 'Apps\SettingManagerController::resetUserPasswordApi');
    $routes->post('/api/manage-user/toggle-status', 'Apps\SettingManagerController::toggleUserStatusApi');
    $routes->post('/api/manage-user/delete', 'Apps\SettingManagerController::deleteUserApi');
    $routes->get('/api/manage-user/pegawai-lookup', 'Apps\SettingManagerController::pegawaiLookupApi');

    $routes->get('/api/menus', 'Apps\AccessManagerApiController::menus');
    $routes->post('/api/menus', 'Apps\AccessManagerApiController::createMenu');
    $routes->put('/api/menus/(:num)', 'Apps\AccessManagerApiController::updateMenu/$1');
    $routes->delete('/api/menus/(:num)', 'Apps\AccessManagerApiController::deleteMenu/$1');
    $routes->get('/api/users/search', 'Apps\AccessManagerApiController::usersSearch');
    $routes->post('/api/users', 'Apps\AccessManagerApiController::createUser');
    $routes->get('/api/users/(:num)/permissions', 'Apps\AccessManagerApiController::userPermissions/$1');
    $routes->put('/api/users/(:num)/permissions', 'Apps\AccessManagerApiController::syncUserPermissions/$1');
    $routes->get('/api/services', 'Apps\AccessManagerApiController::services');
    $routes->get('/api/services/(:num)', 'Apps\AccessManagerApiController::serviceDetail/$1');
    $routes->put('/api/services/(:num)/access', 'Apps\AccessManagerApiController::updateServiceAccess/$1');
    $routes->get('/api/services/(:num)/assignees', 'Apps\AccessManagerApiController::serviceAssignees/$1');
    $routes->put('/api/services/(:num)/assignees', 'Apps\AccessManagerApiController::syncServiceAssignees/$1');
    $routes->get('/api/manage-layanan/list', 'Apps\SettingManagerController::getServiceList');
    $routes->get('/api/manage-layanan/detail', 'Apps\SettingManagerController::getServiceDetail');
    $routes->get('/api/manage-layanan/pegawai', 'Apps\SettingManagerController::getServicePegawai');
    $routes->post('/api/manage-layanan/mode', 'Apps\SettingManagerController::saveServiceModeApi');
    $routes->post('/api/manage-layanan/assign/add', 'Apps\SettingManagerController::addServiceAssigneeApi');
    $routes->post('/api/manage-layanan/assign/delete', 'Apps\SettingManagerController::removeServiceAssigneeApi');
    $routes->post('/api/manage-layanan/maintenance', 'Apps\SettingManagerController::toggleServiceMaintenanceApi');
    $routes->get('/api/services/maintenance-status', 'Apps\SettingManagerController::getMaintenanceServicesApi');
    $routes->get('/api/manage-setting/data', 'Apps\SettingManagerController::getSystemSettingData');
    $routes->post('/api/manage-setting/save', 'Apps\SettingManagerController::saveSystemSettingApi');
    $routes->get('/api/manage-smtp/data', 'Apps\SettingManagerController::getSmtpSettingData');
    $routes->post('/api/manage-smtp/save', 'Apps\SettingManagerController::saveSmtpSettingApi');
    $routes->post('/api/manage-smtp/test', 'Apps\SettingManagerController::testSmtpConnectionApi');

    // Audit Log APIs
    $routes->get('/api/manage-log/summary', 'Apps\AuditLogController::summary');
    $routes->get('/api/manage-log/list', 'Apps\AuditLogController::list');
    $routes->get('/api/manage-log/detail/(:num)', 'Apps\AuditLogController::detail/$1');
    $routes->post('/store/pull-datalist-pegawai', 'Apps\DataMasterController::getPegawai');
    $routes->post('/store/pull-datalist-instansi', 'Apps\DataMasterController::getInstansi');    
    // ---------------------------------------------------------------- 
    // Fetch Data LOV Options
    $routes->post('/instansi-list', 'Apps\FetchData::getInstansi');
    $routes->post('/naskah-list', 'Apps\FetchData::getNaskah');
    $routes->post('/timkerja-list', 'Apps\FetchData::getTK');
    $routes->post('/event-list', 'Apps\FetchData::getEvent');
    $routes->post('/step-mt-list', 'Apps\FetchData::getStepMT');
    $routes->post('/select2/list', 'Apps\FetchData::getSelect2List');
    $routes->post('/step-integrasi-list', 'Apps\FetchData::getStepIntegrasi');
    // ----------------------------------------------------------------
    // Function General
    $routes->post('/change-password', 'Auth\Auth::changePassword');
    $routes->post('/remove-data', 'Apps\AjxController::killData');
    $routes->post('/status-data', 'Apps\AjxController::statusData');
    // ----------------------------------------------------------------
    // Route untuk Modules Services (Tapnip Events API)
    $routes->get('/api/apps-tapnip/events', 'Apps\Modules\TapnipEventController::index');
    $routes->post('/api/apps-tapnip/events', 'Apps\Modules\TapnipEventController::create');
    $routes->post('/api/apps-tapnip/events/update', 'Apps\Modules\TapnipEventController::update');
    $routes->post('/api/apps-tapnip/events/delete', 'Apps\Modules\TapnipEventController::delete');
    // ----------------------------------------------------------------
    $routes->post('/kill/data-uploaders', 'Apps\AjxController::killDataUploader');
    $routes->post('/store/import-excel', 'Apps\Modules\ImpExlsController::importData');
    $routes->post('/store/manual-entry', 'Apps\Modules\DTController::saveManualEntry');
    $routes->post('/store/update-log', 'Apps\Modules\DTController::updateLog');
    $routes->post('/fetch/data', 'Apps\Modules\DTController::getData');
    $routes->post('/fetch/summary-uploaders', 'Apps\Modules\DTController::getSummary');
    $routes->post('/fetch/data-detail', 'Apps\Modules\DTController::getDataDetail');
    // ----------------------------------------------------------------
    // Layanan Disparitas Data
    $routes->post('/store/import-disparitas', 'Apps\Services\DisparitasData::storeData');
    $routes->post('/store/save-data-disparitas', 'Apps\Services\DisparitasData::saveData');
    $routes->post('/fetch/data-disparitas', 'Apps\Services\DisparitasData::getData');
    $routes->post('/fetch/summary-disparitas', 'Apps\Services\DisparitasData::getSummary');
    $routes->post('/fetch/detail-disparitas', 'Apps\Services\DisparitasData::getDataDetail');
    $routes->post('/kill/data-disparitas', 'Apps\Services\DisparitasData::removeData');
    // ----------------------------------------------------------------
    // Layanan Manajemen Talenta
    $routes->post('/store/add-mt', 'Apps\Services\MTController::storeMTData');
    $routes->post('/fetch/data-mt', 'Apps\Services\MTController::getData');
    $routes->post('/kill/data-mt', 'Apps\Services\MTController::removeData');
    $routes->post('/fetch/summary-mt', 'Apps\Services\MTController::getSummary');
    $routes->post('/fetch/detail-mt', 'Apps\Services\MTController::getDetail');
    $routes->post('/store/import-mt', 'Apps\Services\MTController::importBatch');
    // Layanan Pembinaan Manajemen ASN
    $routes->post('/fetch/options-pembinaan-kinerja', 'Apps\Services\PembinaanASNController::getKinerjaOptions');
    $routes->post('/fetch/data-pembinaan-kinerja', 'Apps\Services\PembinaanASNController::getKinerjaData');
    $routes->post('/fetch/summary-pembinaan-kinerja', 'Apps\Services\PembinaanASNController::getKinerjaSummary');
    $routes->post('/store/save-data-pembinaan-kinerja', 'Apps\Services\PembinaanASNController::storeKinerjaData');
    $routes->post('/kill/data-pembinaan-kinerja', 'Apps\Services\PembinaanASNController::removeKinerjaData');
    $routes->post('/store/import-pembinaan-kinerja', 'Apps\Services\PembinaanASNController::importKinerjaBatch');
    $routes->post('/fetch/options-pembinaan-kompetensi-karier', 'Apps\Services\PembinaanASNController::getKompetensiOptions');
    $routes->post('/fetch/data-pembinaan-kompetensi-karier', 'Apps\Services\PembinaanASNController::getKompetensiData');
    $routes->post('/fetch/summary-pembinaan-kompetensi-karier', 'Apps\Services\PembinaanASNController::getKompetensiSummary');
    $routes->post('/store/save-data-pembinaan-kompetensi-karier', 'Apps\Services\PembinaanASNController::storeKompetensiData');
    $routes->post('/kill/data-pembinaan-kompetensi-karier', 'Apps\Services\PembinaanASNController::removeKompetensiData');
    $routes->post('/store/import-pembinaan-kompetensi-karier', 'Apps\Services\PembinaanASNController::importKompetensiBatch');
    $routes->post('/fetch/options-pembinaan-disiplin-budaya-citra', 'Apps\Services\PembinaanASNController::getDisiplinOptions');
    $routes->post('/fetch/data-pembinaan-disiplin-budaya-citra', 'Apps\Services\PembinaanASNController::getDisiplinData');
    $routes->post('/fetch/detail-pembinaan-disiplin-budaya-citra', 'Apps\Services\PembinaanASNController::getDisiplinDetail');
    $routes->post('/fetch/summary-pembinaan-disiplin-budaya-citra', 'Apps\Services\PembinaanASNController::getDisiplinSummary');
    $routes->post('/store/save-data-pembinaan-disiplin-budaya-citra', 'Apps\Services\PembinaanASNController::storeDisiplinData');
    $routes->post('/kill/data-pembinaan-disiplin-budaya-citra', 'Apps\Services\PembinaanASNController::removeDisiplinData');
    $routes->post('/store/import-pembinaan-disiplin-budaya-citra', 'Apps\Services\PembinaanASNController::importDisiplinBatch');
    $routes->post('/fetch/kategori-pembinaan-disiplin-budaya-citra', 'Apps\Services\PembinaanASNController::getDisiplinKategoriData');
    $routes->post('/store/kategori-pembinaan-disiplin-budaya-citra', 'Apps\Services\PembinaanASNController::storeDisiplinKategori');
    $routes->post('/kill/kategori-pembinaan-disiplin-budaya-citra', 'Apps\Services\PembinaanASNController::removeDisiplinKategori');
    // ----------------------------------------------------------------
    // Layanan Peremajaan Data
    $routes->post('/store/save-data-peremajaan', 'Apps\Services\PeremajaanData::storeData');
    $routes->post('/store/import-peremajaan', 'Apps\Services\PeremajaanData::importBatch');
    $routes->post('/fetch/data-peremajaan', 'Apps\Services\PeremajaanData::getDataV2');
    $routes->post('/fetch/summary-peremajaan', 'Apps\Services\PeremajaanData::getSummary');
    $routes->post('/fetch/detail-peremajaan', 'Apps\Services\PeremajaanData::getDataDetail');
    $routes->post('/fetch/resume-peremajaan', 'Apps\Services\PeremajaanData::getResume');
    $routes->post('/kill/data-peremajaan', 'Apps\Services\PeremajaanData::removeData');
    // ----------------------------------------------------------------
    // Layanan NSPK
    $routes->post('/store/save-data-nspk', 'Apps\Services\NSPKController::storeData');
    $routes->post('/store/import-batch-nspk', 'Apps\Services\NSPKController::importBatch');
    $routes->post('/fetch/data-nspk', 'Apps\Services\NSPKController::getData');
    $routes->post('/fetch/summary-nspk', 'Apps\Services\NSPKController::getSummary');
    $routes->post('/kill/data-nspk', 'Apps\Services\NSPKController::removeData');
    // ----------------------------------------------------------------
    // Layanan Sistem Merit
    $routes->post('/store/save-data-merit', 'Apps\Services\MeritController::storeData');
    $routes->post('/store/import-batch-merit', 'Apps\Services\MeritController::importBatch');
    $routes->post('/fetch/data-merit', 'Apps\Services\MeritController::getData');
    $routes->post('/fetch/summary-merit', 'Apps\Services\MeritController::getSummary');
    $routes->post('/kill/data-merit', 'Apps\Services\MeritController::removeData');
    // ----------------------------------------------------------------
    // Layanan Pengawasan (WASDAL)
    $routes->post('/store/save-data-wasdal', 'Apps\Services\WasdalController::storeData');
    $routes->post('/store/import-batch-wasdal', 'Apps\Services\WasdalController::importBatch');
    $routes->post('/fetch/data-wasdal', 'Apps\Services\WasdalController::getData');
    $routes->post('/fetch/summary-wasdal', 'Apps\Services\WasdalController::getSummary');
    $routes->post('/kill/data-wasdal', 'Apps\Services\WasdalController::removeData');
    // ----------------------------------------------------------------
    // Layanan Integrasi
    $routes->post('/store/save-data-integrasi', 'Apps\Services\IntegrasiData::storeData');
    $routes->post('/store/import-integrasi', 'Apps\Services\IntegrasiData::importBatch');
    $routes->post('/fetch/data-integrasi', 'Apps\Services\IntegrasiData::getData');
    $routes->post('/fetch/summary-integrasi', 'Apps\Services\IntegrasiData::getSummary');
    $routes->post('/fetch/detail-integrasi', 'Apps\Services\IntegrasiData::getDataDetail');
    $routes->post('/kill/data-integrasi', 'Apps\Services\IntegrasiData::removeData');
    // ----------------------------------------------------------------
    // Layanan Dokumen PNBP CAT
    $routes->post('/fetch/data-pnbp-documents', 'Apps\Services\PNBPDocumentController::getData');
    $routes->post('/fetch/summary-pnbp', 'Apps\Services\PNBPDocumentController::getSummary');
    $routes->post('/fetch/pnbp-options-tilok', 'Apps\Services\PNBPDocumentController::getTilokOptions');
    $routes->post('/fetch/pnbp-options-instansi', 'Apps\Services\PNBPDocumentController::getInstansiOptions');
    $routes->post('/fetch/pnbp-options-pegawai', 'Apps\Services\PNBPDocumentController::getPegawaiOptions');
    $routes->post('/store/save-pnbp-document', 'Apps\Services\PNBPDocumentController::storeDocument');
    $routes->post('/store/import-pnbp-document', 'Apps\Services\PNBPDocumentController::importBatch');
    $routes->post('/store/save-pnbp-header', 'Apps\Services\PNBPDocumentController::storeHeader');
    $routes->post('/store/save-pnbp-personel', 'Apps\Services\PNBPDocumentController::storePersonel');
    $routes->post('/store/save-pnbp-items', 'Apps\Services\PNBPDocumentController::storeItems');
    $routes->post('/store/save-pnbp-signature-param', 'Apps\Services\PNBPDocumentController::storeSignatureParam');
    $routes->post('/store/save-pnbp-signers-all', 'Apps\Services\PNBPDocumentController::storeSignersAll');
    $routes->post('/fetch/pnbp-nominatif-table', 'Apps\Services\PNBPDocumentController::getNominatifTableData');
    $routes->post('/kill/data-pnbp-document', 'Apps\Services\PNBPDocumentController::removeDocument');
    $routes->post('/kill/data-pnbp-personel', 'Apps\Services\PNBPDocumentController::removePersonel');
    $routes->post('/kill/data-pnbp-item', 'Apps\Services\PNBPDocumentController::removeItem');
    $routes->post('/apps-pnbp/generate-pdf', 'Apps\Services\PNBPDocumentController::generatePdf');
    $routes->get('/apps-pnbp/diagnose', 'Apps\Services\PNBPDocumentController::diagnose');
    $routes->get('/apps-pnbp/preview-pdf/(:segment)', 'Apps\Services\PNBPDocumentController::previewPdf/$1');
    $routes->get('/apps-pnbp/download-pdf/(:segment)', 'Apps\Services\PNBPDocumentController::downloadPdf/$1');
    // ----------------------------------------------------------------
    // Layanan DMS
    $routes->post('/store/import-dms-data', 'Apps\Services\DMSData::importData');
    $routes->post('/store/save-data-dms', 'Apps\Services\DMSData::storeData');
    $routes->post('/fetch/data-dms', 'Apps\Services\DMSData::getData');
    $routes->post('/fetch/summary-dms', 'Apps\Services\DMSData::getSummary');
    $routes->post('/fetch/detail-dms', 'Apps\Services\DMSData::getDataDetail');
    $routes->post('/kill/data-dms', 'Apps\Services\DMSData::removeData');
    // ----------------------------------------------------------------
    // Layanan Takah
    $routes->post('/store/import-takah-data', 'Apps\Services\TakahData::importData');
    $routes->post('/store/save-data-takah', 'Apps\Services\TakahData::saveData');
    $routes->post('/fetch/data-takah', 'Apps\Services\TakahData::getData');
    $routes->post('/fetch/summary-takah', 'Apps\Services\TakahData::getSummary');
    $routes->post('/fetch/detail-takah', 'Apps\Services\TakahData::getDataDetail');
    $routes->post('/kill/data-takah', 'Apps\Services\TakahData::removeData');
    // ----------------------------------------------------------------
    // Layanan Statistik
    $routes->post('/store/import-excel-statistik', 'Apps\Services\StatistikData::storeData');
    $routes->post('/fetch/data-statistik', 'Apps\Services\StatistikData::getData');
    $routes->post('/fetch/summary-statistik', 'Apps\Services\StatistikData::getSummary');
    $routes->post('/fetch/detail-statistik', 'Apps\Services\StatistikData::getDataDetail');
    $routes->post('/kill/data-statistik', 'Apps\Services\StatistikData::removeData');
    // ----------------------------------------------------------------
    // Layanan Fasilitas CAT
    $routes->post('/apps-karier/get-data', 'Apps\Services\Karier::getData');
    $routes->post('/apps-karier/get-summary', 'Apps\Services\Karier::getSummary');
    $routes->post('/apps-karier/store-data', 'Apps\Services\Karier::storeData');
    $routes->post('/apps-karier/remove-data', 'Apps\Services\Karier::removeData');
    $routes->post('/apps-karier/import-data', 'Apps\Services\Karier::importData');
    // Standardized PMA Routes for Karier
    $routes->post('/fetch/data-karier', 'Apps\Services\Karier::getData');
    $routes->post('/fetch/summary-karier', 'Apps\Services\Karier::getSummary');
    $routes->post('/store/save-data-karier', 'Apps\Services\Karier::storeData');
    $routes->post('/kill/data-karier', 'Apps\Services\Karier::removeData');
    $routes->post('/store/import-karier', 'Apps\Services\Karier::importData');
    $routes->post('/apps-kompetensi/get-data', 'Apps\Services\Kompetensi::getData');
    $routes->post('/apps-kompetensi/get-summary', 'Apps\Services\Kompetensi::getSummary');
    $routes->post('/apps-kompetensi/store-data', 'Apps\Services\Kompetensi::storeData');
    $routes->post('/apps-kompetensi/remove-data', 'Apps\Services\Kompetensi::removeData');
    $routes->post('/apps-kompetensi/import-data', 'Apps\Services\Kompetensi::importData');
    // Standardized PMA Routes for Kompetensi
    $routes->post('/fetch/data-kompetensi', 'Apps\Services\Kompetensi::getData');
    $routes->post('/fetch/summary-kompetensi', 'Apps\Services\Kompetensi::getSummary');
    $routes->post('/store/save-data-kompetensi', 'Apps\Services\Kompetensi::storeData');
    $routes->post('/kill/data-kompetensi', 'Apps\Services\Kompetensi::removeData');
    $routes->post('/store/import-kompetensi', 'Apps\Services\Kompetensi::importData');
    $routes->get('/fetch/jenis-periode-cat', 'Apps\Services\FasilitasiCAT::getJenisPeriodeList');
    $routes->post('/fetch/jenis-periode-cat', 'Apps\Services\FasilitasiCAT::getJenisPeriodeList');
    $routes->post('/store/import-data-cat', 'Apps\Services\FasilitasiCAT::importData');
    $routes->get('/api/apps-cat/pengelola/access', 'Apps\Services\FasilitasiCAT::getPengelolaAccess');
    $routes->post('/api/apps-cat/pengelola', 'Apps\Services\FasilitasiCAT::storePengelolaAccess');
    $routes->post('/api/apps-cat/pengelola/delete', 'Apps\Services\FasilitasiCAT::deletePengelolaAccess');
    $routes->get('/api/apps-cat/events', 'Apps\Services\FasilitasiCAT::getJenisTesList');
    $routes->post('/api/apps-cat/events', 'Apps\Services\FasilitasiCAT::createJenisTes');
    $routes->post('/api/apps-cat/events/update', 'Apps\Services\FasilitasiCAT::updateJenisTes');
    $routes->post('/api/apps-cat/events/delete', 'Apps\Services\FasilitasiCAT::deleteJenisTes');
    $routes->get('/api/apps-cat/pengelola/summary', 'Apps\Services\FasilitasiCAT::getPengelolaSummary');
    $routes->get('/api/apps-cat/pengelola/jadwal', 'Apps\Services\FasilitasiCAT::getPengelolaJadwal');
    $routes->get('/api/apps-cat/pengelola/jadwal/detail/(:segment)', 'Apps\Services\FasilitasiCAT::getPengelolaJadwalDetail/$1');
    $routes->post('/api/apps-cat/pengelola/jadwal', 'Apps\Services\FasilitasiCAT::storePengelolaJadwal');
    $routes->post('/api/apps-cat/pengelola/jadwal/link-st', 'Apps\Services\FasilitasiCAT::linkStToJadwal');
    $routes->post('/api/apps-cat/pengelola/jadwal/delete', 'Apps\Services\FasilitasiCAT::deletePengelolaJadwal');
    $routes->get('/api/apps-cat/pengelola/tim', 'Apps\Services\FasilitasiCAT::getPengelolaTim');
    $routes->post('/api/apps-cat/pengelola/tim', 'Apps\Services\FasilitasiCAT::storePengelolaTim');
    $routes->post('/api/apps-cat/pengelola/tim/delete', 'Apps\Services\FasilitasiCAT::deletePengelolaTim');
    $routes->get('/api/apps-cat/pengelola/dokumen/types', 'Apps\Services\PNBPDocumentController::getDocTypesApi');
    $routes->get('/api/apps-cat/pengelola/dokumen', 'Apps\Services\PNBPDocumentController::getDocumentsApi');
    $routes->get('/api/apps-cat/pengelola/dokumen/detail/(:segment)', 'Apps\Services\PNBPDocumentController::getDocumentDetailApi/$1');
    $routes->get('/api/apps-cat/pengelola/dokumen/file/(:segment)', 'Apps\Services\PNBPDocumentController::streamUploadedFileApi/$1');
    $routes->post('/api/apps-cat/pengelola/dokumen', 'Apps\Services\PNBPDocumentController::storeDocumentApi');
    $routes->post('/api/apps-cat/pengelola/dokumen/upload', 'Apps\Services\PNBPDocumentController::uploadDocumentApi');
    $routes->post('/api/apps-cat/pengelola/dokumen/delete', 'Apps\Services\PNBPDocumentController::deleteDocumentApi');
    $routes->post('/api/apps-cat/pengelola/dokumen/sync-tim', 'Apps\Services\PNBPDocumentController::syncTimToDocumentApi');
    $routes->post('/api/apps-cat/pengelola/dokumen/personel', 'Apps\Services\PNBPDocumentController::savePersonelApi');
    $routes->post('/api/apps-cat/pengelola/dokumen/personel/reorder', 'Apps\Services\PNBPDocumentController::reorderPersonelApi');
    $routes->post('/api/apps-cat/pengelola/dokumen/personel/delete', 'Apps\Services\PNBPDocumentController::deletePersonelApi');
    $routes->post('/api/apps-cat/pengelola/dokumen/items', 'Apps\Services\PNBPDocumentController::saveItemApi');
    $routes->post('/api/apps-cat/pengelola/dokumen/items/delete', 'Apps\Services\PNBPDocumentController::deleteItemApi');
    $routes->post('/api/apps-cat/pengelola/dokumen/signatures', 'Apps\Services\PNBPDocumentController::saveSignaturesApi');
    $routes->get('/api/apps-cat/pengelola/rekap-pegawai', 'Apps\Services\FasilitasiCAT::getPengelolaRekapPegawai');
    $routes->get('/api/apps-cat/pengelola/pegawai-options', 'Apps\Services\FasilitasiCAT::getPengelolaPegawaiOptions');
    $routes->get('/api/apps-cat/pengelola/unit-kerja-options', 'Apps\Services\FasilitasiCAT::getPengelolaUnitKerjaOptions');
    $routes->get('/api/apps-cat/pengelola/signers', 'Apps\Services\FasilitasiCAT::getPengelolaSigners');
    $routes->post('/api/apps-cat/pengelola/signers', 'Apps\Services\FasilitasiCAT::storePengelolaSigner');
    $routes->post('/api/apps-cat/pengelola/signers/delete', 'Apps\Services\FasilitasiCAT::deletePengelolaSigner');
    $routes->get('/api/apps-cat/pengelola/master/jenis-periode', 'Apps\Services\FasilitasiCAT::getPengelolaMasterJenisPeriode');
    $routes->post('/api/apps-cat/pengelola/master/jenis-periode', 'Apps\Services\FasilitasiCAT::storePengelolaMasterJenisPeriode');
    $routes->post('/api/apps-cat/pengelola/master/jenis-periode/delete', 'Apps\Services\FasilitasiCAT::deletePengelolaMasterJenisPeriode');
    $routes->get('/api/apps-cat/pengelola/master/kegiatan', 'Apps\Services\FasilitasiCAT::getPengelolaMasterKegiatan');
    $routes->post('/api/apps-cat/pengelola/master/kegiatan', 'Apps\Services\FasilitasiCAT::storePengelolaMasterKegiatan');
    $routes->post('/api/apps-cat/pengelola/master/kegiatan/delete', 'Apps\Services\FasilitasiCAT::deletePengelolaMasterKegiatan');
    $routes->get('/api/apps-cat/pengelola/master/tilok', 'Apps\Services\FasilitasiCAT::getPengelolaMasterTilok');
    $routes->post('/store/save-data-seleksi-cat', 'Apps\Services\FasilitasiCAT::storeDataSeleksi');
    $routes->post('/fetch/data-seleksi-cat', 'Apps\Services\FasilitasiCAT::getDataSeleksi');
    $routes->post('/kill/data-seleksi-cat', 'Apps\Services\FasilitasiCAT::removeDataSeleksi');
    $routes->post('/store/save-data-tilok-cat', 'Apps\Services\FasilitasiCAT::storeDataTilok');    
    $routes->post('/store/save-data-tilok-instansi', 'Apps\Services\FasilitasiCAT::storeDataInstansi');
    $routes->post('/FasilitasiCAT/storeDataInstansi', 'Apps\Services\FasilitasiCAT::storeDataInstansi');
    $routes->post('/store/save-data-tilok-rekap', 'Apps\Services\FasilitasiCAT::storeDataRekap');    
    $routes->post('/store/update-data-hasil-cat', 'Apps\Services\FasilitasiCAT::updateDataHasil');    
    $routes->post('/fetch/data-tilok-cat', 'Apps\Services\FasilitasiCAT::getDataTilok');  
    $routes->post('/fetch/summary-tilok-cat', 'Apps\Services\FasilitasiCAT::getSummaryTilok');
    $routes->post('/fetch/data-tilok-detail', 'Apps\Services\FasilitasiCAT::getDataDetailTilok');           
    $routes->post('/fetch/instansi-tilok-cat', 'Apps\Services\FasilitasiCAT::getInstansiTilok');           
    $routes->post('/fetch/meta-tilok-detail', 'Apps\Services\FasilitasiCAT::getMetaDetailTilok');
    $routes->post('/fetch/summary-tilok-detail', 'Apps\Services\FasilitasiCAT::getSummaryDetailTilok');
    $routes->post('/store/update-event-cat', 'Apps\Services\FasilitasiCAT::updateEventSeleksi');
    $routes->post('/FasilitasiCAT/updateEventSeleksi', 'Apps\Services\FasilitasiCAT::updateEventSeleksi');
    $routes->post('/fetch/events-by-instansi-cat', 'Apps\Services\FasilitasiCAT::getEventsByInstansi');
    $routes->post('/FasilitasiCAT/getEventsByInstansi', 'Apps\Services\FasilitasiCAT::getEventsByInstansi');
    $routes->post('/store/save-kegiatan-seleksi-cat', 'Apps\Services\FasilitasiCAT::storeKegiatanSeleksi');
    $routes->get('/fetch/seleksi-options-cat', 'Apps\Services\FasilitasiCAT::getSeleksiOptions');
    $routes->post('/fetch/seleksi-options-cat', 'Apps\Services\FasilitasiCAT::getSeleksiOptions');
    $routes->get('/FasilitasiCAT/getSeleksiOptions', 'Apps\Services\FasilitasiCAT::getSeleksiOptions');
    $routes->post('/FasilitasiCAT/getSeleksiOptions', 'Apps\Services\FasilitasiCAT::getSeleksiOptions');
    $routes->post('/kill/data-tilok-cat', 'Apps\Services\FasilitasiCAT::removeDataTilok');    
    $routes->post('/kill/data-tilok-instansi', 'Apps\Services\FasilitasiCAT::removeDataTilokInstansi');
    $routes->post('/FasilitasiCAT/removeDataTilokInstansi', 'Apps\Services\FasilitasiCAT::removeDataTilokInstansi');
    $routes->post('/kill/data-tilok-rekap', 'Apps\Services\FasilitasiCAT::removeDataRekap');    
    // ----------------------------------------------------------------
    // Layanan Barang Hilang & Ditemukan
    $routes->post('/store/save-data-lost-and-found', 'Apps\Services\LostAndFoundController::storeData');
    $routes->post('/fetch/data-lost-and-found', 'Apps\Services\LostAndFoundController::getData');
    $routes->post('/fetch/summary-lost-and-found', 'Apps\Services\LostAndFoundController::getSummary');
    $routes->post('/kill/data-lost-and-found', 'Apps\Services\LostAndFoundController::removeData');
    // ----------------------------------------------------------------
    // Layanan Manajemen Asset
    $routes->post('/apps-manage-assets-detail/store', 'Apps\Services\ManageAssetsController::storeDetail');
    $routes->post('/apps-manage-assets-detail/update', 'Apps\Services\ManageAssetsController::updateDetail');
    $routes->post('/apps-manage-assets-detail/delete', 'Apps\Services\ManageAssetsController::deleteDetail');
    $routes->post('/apps-manage-assets-detail/get-data', 'Apps\Services\ManageAssetsController::getDetail');

    // Category Management
    $routes->post('/store/save-asset-category', 'Apps\Services\ManageAssetsController::storeCategory');
    $routes->post('/store/update-asset-category', 'Apps\Services\ManageAssetsController::updateCategory');
    $routes->post('/fetch/asset-category', 'Apps\Services\ManageAssetsController::getCategory');
    $routes->post('/fetch/asset-categories', 'Apps\Services\ManageAssetsController::getCategoriesApi');
    $routes->get('/fetch/asset-categories', 'Apps\Services\ManageAssetsController::getCategoriesApi');
    $routes->post('/kill/asset-category', 'Apps\Services\ManageAssetsController::removeCategory');
    
    $routes->post('/fetch/data-manage-assets', 'Apps\Services\ManageAssetsController::getData');
    $routes->post('/fetch/summary-manage-assets', 'Apps\Services\ManageAssetsController::getSummary');
    $routes->post('/store/import-asset-data', 'Apps\Services\ManageAssetsController::importBatch');
    // ----------------------------------------------------------------
    // Layanan Manajemen Proyek
    $routes->post('/fetch/data-manage-project', 'Apps\Services\ManageProjectController::getData');
    $routes->post('/fetch/summary-manage-project', 'Apps\Services\ManageProjectController::getSummary');
    $routes->post('/fetch/project-overview', 'Apps\Services\ManageProjectController::getProjectOverview');
    $routes->post('/store/save-project', 'Apps\Services\ManageProjectController::storeProject');
    $routes->post('/store/update-project', 'Apps\Services\ManageProjectController::updateProject');
    $routes->post('/store/import-excel-project', 'Apps\Services\ManageProjectController::importExcel');
    $routes->post('/store/save-project-progress', 'Apps\Services\ManageProjectController::storeProgress');
    $routes->post('/store/save-project-budget', 'Apps\Services\ManageProjectController::storeBudget');
    $routes->post('/kill/data-project', 'Apps\Services\ManageProjectController::removeProject');
    $routes->post('/kill/project-progress', 'Apps\Services\ManageProjectController::removeProgress');
    $routes->post('/kill/project-budget', 'Apps\Services\ManageProjectController::removeBudget');
    // ----------------------------------------------------------------
    // Layanan Sistem Kehumasan
    $routes->post('/store/save-data-humas', 'Apps\Services\HumasController::storeData');
    $routes->post('/fetch/data-humas', 'Apps\Services\HumasController::getData');
    $routes->post('/fetch/summary-humas', 'Apps\Services\HumasController::getSummary');
    $routes->post('/kill/data-humas', 'Apps\Services\HumasController::removeData');
    // ----------------------------------------------------------------
    // Layanan Sistem Konsultasi
    $routes->post('/store/save-data-konsultasi', 'Apps\Services\KonsulController::storeData');
    $routes->post('/fetch/data-konsultasi', 'Apps\Services\KonsulController::getData');
    $routes->post('/fetch/summary-konsultasi', 'Apps\Services\KonsulController::getSummary');
    $routes->post('/kill/data-konsultasi', 'Apps\Services\KonsulController::removeData');
    // ----------------------------------------------------------------
    // Layanan IKM
    $routes->post('/store/save-data-ikm', 'Apps\Services\IKMController::storeData');
    $routes->post('/fetch/data-ikm', 'Apps\Services\IKMController::getData');
    $routes->post('/fetch/summary-ikm', 'Apps\Services\IKMController::getSummary');
    $routes->post('/kill/data-ikm', 'Apps\Services\IKMController::removeData');
    // ----------------------------------------------------------------
    // Manajemen IKK (Data Master)
    $routes->post('/fetch/ikk-sasaran', 'Apps\Services\IkkController::getDataSasaran');
    $routes->post('/store/ikk-sasaran', 'Apps\Services\IkkController::storeSasaran');
    $routes->post('/kill/ikk-sasaran', 'Apps\Services\IkkController::deleteSasaran');

    $routes->post('/fetch/ikk-indikator', 'Apps\Services\IkkController::getDataIndikator');
    $routes->post('/store/ikk-indikator', 'Apps\Services\IkkController::storeIndikator');
    $routes->post('/kill/ikk-indikator', 'Apps\Services\IkkController::deleteIndikator');
    $routes->post('/fetch/ikk-indikator-realisasi', 'Apps\Services\IkkController::getRealisasiIndikator');
    $routes->post('/store/ikk-indikator-realisasi', 'Apps\Services\IkkController::storeRealisasiIndikator');
    $routes->post('/kill/ikk-indikator-realisasi', 'Apps\Services\IkkController::deleteRealisasiIndikator');
    $routes->post('/fetch/ikk-calc-kegiatan-realisasi', 'Apps\Services\IkkController::calcFromKegiatan');

    $routes->post('/fetch/ikk-kegiatan', 'Apps\Services\IkkController::getDataKegiatan');
    $routes->post('/store/ikk-kegiatan', 'Apps\Services\IkkController::storeKegiatan');
    $routes->post('/kill/ikk-kegiatan', 'Apps\Services\IkkController::deleteKegiatan');
    
    // Pengampu
    $routes->post('/fetch/ikk-pengampu', 'Apps\Services\IkkController::getDataPengampu');
    $routes->post('/store/ikk-pengampu', 'Apps\Services\IkkController::storePengampu');
    $routes->post('/kill/ikk-pengampu', 'Apps\Services\IkkController::deletePengampu');
    
    // Transaksi Harian
    $routes->post('/fetch/ikk-transaksi', 'Apps\Services\IkkController::getDataTransaksi');
    $routes->post('/store/ikk-transaksi', 'Apps\Services\IkkController::storeTransaksi');
    $routes->post('/store/ikk-transaksi-import', 'Apps\Services\IkkController::importTransaksi');
    $routes->get('/export/sample-transaksi-ikk', 'Apps\Services\IkkController::downloadSample');
    $routes->post('/kill/ikk-transaksi', 'Apps\Services\IkkController::deleteTransaksi');

    // Options & Helpers
    $routes->post('/fetch/ikk-options-sasaran', 'Apps\Services\IkkController::getOptionsSasaran');
    $routes->post('/fetch/ikk-options-indikator', 'Apps\Services\IkkController::getOptionsIndikator');
    $routes->post('/fetch/ikk-options-kegiatan', 'Apps\Services\IkkController::getOptionsKegiatan');
    $routes->post('/fetch/ikk-options-timkerja', 'Apps\Services\IkkController::getOptionsTimKerja');
    $routes->post('/fetch/ikk-summary', 'Apps\Services\IkkController::getSummary');
    $routes->post('/fetch/ikk-assigned-pengampu', 'Apps\Services\IkkController::getAssignedPengampu');
    $routes->post('/fetch/ikk-hierarchy', 'Apps\Services\IkkController::getHierarchyTree');
    $routes->post('/fetch/ikk-options-tahun', 'Apps\Services\IkkController::getOptionsTahun');

    // ----------------------------------------------------------------
    // Layanan Persuratan
    $routes->post('/store/save-data-surat', 'Apps\Services\SuratController::storeData');
    $routes->post('/fetch/data-surat', 'Apps\Services\SuratController::getData');
    $routes->post('/fetch/summary-surat', 'Apps\Services\SuratController::getSummary');
    $routes->post('/kill/data-surat', 'Apps\Services\SuratController::removeData');
    // ----------------------------------------------------------------
    // Layanan Statistik Internal
    $routes->get('fetch/master-pendidikan', 'Apps\Services\StatistikInternal::getMasterPendidikan');
    $routes->get('fetch/master-unit-kerja', 'Apps\Services\StatistikInternal::getMasterUnitKerja');
    $routes->get('fetch/master-unit-sk', 'Apps\Services\StatistikInternal::getMasterUnitSK');
    $routes->get('fetch/master-jenis-jabatan', 'Apps\Services\StatistikInternal::getMasterJenisJabatan');
    $routes->get('fetch/master-jenis-pegawai', 'Apps\Services\StatistikInternal::getMasterJenisPegawai');
    $routes->get('fetch/master-agama', 'Apps\Services\StatistikInternal::getMasterAgama');
    $routes->get('fetch/master-golongan', 'Apps\Services\StatistikInternal::getMasterGolongan');
    $routes->get('fetch/master-pangkat', 'Apps\Services\StatistikInternal::getMasterPangkat');
    $routes->get('fetch/master-jabatan', 'Apps\Services\StatistikInternal::getMasterJabatan');
    $routes->post('/store/save-data-statistik-internal', 'Apps\Services\StatistikInternal::storeData');
    $routes->post('/store/import-statistik-pegawai', 'Apps\Services\StatistikInternal::importBatch');
    $routes->post('/store/save-data-master-statistik', 'Apps\Services\StatistikInternal::storeDataMaster');
    $routes->post('store/delete-data-master-statistik', 'Apps\Services\StatistikInternal::deleteDataMaster');
    $routes->post('/fetch/data-statistik-accum', 'Apps\Services\StatistikInternal::getDataAccum');
    $routes->post('/fetch/summary-statistik-internal', 'Apps\Services\StatistikInternal::getSummary');
    $routes->post('/fetch/data-statistik-pegawai', 'Apps\Services\StatistikInternal::getDataPegawai');
    $routes->post('/kill/data-statistik-internal', 'Apps\Services\StatistikInternal::removeData');
    // ----------------------------------------------------------------
    // Layanan EKIN
    $routes->post('/store/import-ekin-data', 'Apps\Services\EKINData::importData');
    $routes->post('/store/save-ekin-manual', 'Apps\Services\EKINData::storeManualData');
    $routes->post('/fetch/data-ekin', 'Apps\Services\EKINData::getData');
    $routes->post('/fetch/child-ekin', 'Apps\Services\EKINData::getDataChild');
    $routes->post('/fetch/summary-ekin', 'Apps\Services\EKINData::getSummary');
    $routes->post('/fetch/detail-ekin', 'Apps\Services\EKINData::getDataDetail');
    $routes->post('/kill/data-ekin', 'Apps\Services\EKINData::removeData');
    // ----------------------------------------------------------------
    // Layanan IKPA
    $routes->post('/store/import-ikpa-data', 'Apps\Services\IKPAData::importData');
    $routes->post('/fetch/data-ikpa', 'Apps\Services\IKPAData::getData');
    $routes->post('/fetch/summary-ikpa', 'Apps\Services\IKPAData::getSummary');
    $routes->post('/fetch/detail-ikpa', 'Apps\Services\IKPAData::getDataDetail');
    $routes->post('/kill/data-ikpa', 'Apps\Services\IKPAData::removeData');
    // ----------------------------------------------------------------
    // Layanan Pagu & Realisasi Anggaran
    $routes->post('/fetch/data-anggaran', 'Apps\Services\AnggaranData::getData');
    $routes->post('/fetch/detail-anggaran', 'Apps\Services\AnggaranData::getDataDetail');
    $routes->post('/fetch/summary-anggaran', 'Apps\Services\AnggaranData::getSummary');
    $routes->post('/fetch/options-anggaran', 'Apps\Services\AnggaranData::getOptions');
    $routes->post('/fetch/settings-anggaran', 'Apps\Services\AnggaranData::getSettings');
    $routes->post('/fetch/select2-struktur-anggaran', 'Apps\Services\AnggaranData::searchStrukturSelect2');
    $routes->get('/export/excel-anggaran', 'Apps\Services\AnggaranData::exportExcel');
    $routes->post('/store/save-data-anggaran', 'Apps\Services\AnggaranData::storeData');
    $routes->post('/store/save-tahun-anggaran', 'Apps\Services\AnggaranData::storeYear');
    $routes->post('/store/save-struktur-anggaran', 'Apps\Services\AnggaranData::storeStruktur');
    $routes->post('/kill/data-anggaran', 'Apps\Services\AnggaranData::removeData');
    $routes->post('/kill/tahun-anggaran', 'Apps\Services\AnggaranData::removeYear');
    $routes->post('/kill/struktur-anggaran', 'Apps\Services\AnggaranData::removeStruktur');
});
