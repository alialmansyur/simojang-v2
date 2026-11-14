<?php

namespace App\Controllers\Apps;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\Apps\AppsModel;
use App\Libraries\DataTablesLib;

class DataMasterController extends BaseController
{

    public function __construct()
    {
        $sess = session()->get();
        $this->apps = new AppsModel();
        $this->dataTables = new DataTablesLib();               
    }
    public function getPegawai(){
        $sess       = session()->get();
        $builder    = $this->apps->getDataPegawai();
        $columns    = ['id','nip', 'nama', 'gender', 'menikah','agama','pendidikan','gol','pangkat','tgl_lahir','phone','email','is_status','nama_formatted','updated_at'];
        $result     = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }

    public function getInstansi(){
        $sess       = session()->get();
        $builder    = $this->apps->getDataInstansi();
        $columns    = ['id','kodeins', 'nama', 'kanreg', 'is_status', 'updated_at'];
        $result     = $this->dataTables->render($builder, $columns);
        return $this->response->setJSON($result);
    }    

}
