import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './router'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './styles/global.css'
import { installAuthFetchInterceptor } from './services/api'

// Auto-heal path: jika URL dibuka tanpa base prefix (misal http://localhost:8401/layanan/konsultasi)
const rawBase = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
if (rawBase && rawBase !== '' && !window.location.pathname.startsWith(rawBase + '/') && window.location.pathname !== rawBase) {
  const normalizedPath = window.location.pathname.startsWith('/')
    ? window.location.pathname
    : '/' + window.location.pathname
  window.location.replace(rawBase + normalizedPath + window.location.search + window.location.hash)
}

installAuthFetchInterceptor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRouter />
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
    </BrowserRouter>
  </StrictMode>,
)
