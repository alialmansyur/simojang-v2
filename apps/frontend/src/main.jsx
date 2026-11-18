import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './router'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './styles/global.css'
import { installAuthFetchInterceptor } from './services/api'

installAuthFetchInterceptor()

// Basename dinamis: jika dibuka via subpath /simojang (kanreg3.id/simojang/), gunakan /simojang
// Jika dibuka di root lokal http://localhost:8401/, gunakan root /
const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
const dynamicBasename = currentPath.startsWith('/simojang') ? '/simojang' : '/'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={dynamicBasename}>
      <AppRouter />
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
    </BrowserRouter>
  </StrictMode>,
)
