# SIMOJANG Frontend

Frontend SPA untuk **SIMOJANG** (Sistem Informasi Monitoring Kinerja Layanan Kepegawaian) Kantor Regional III BKN Bandung.

## Stack

- React 19 + React Router v7
- Vite 8 + Tailwind CSS v4
- Lucide React, Framer Motion, React ApexCharts, React Hook Form + Zod, XLSX, jsPDF

## Konfigurasi Environment

Salin `.env.example` menjadi `.env` untuk development lokal:

```env
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1:8105
```

- `VITE_API_BASE_URL`: Kosongkan jika frontend disajikan di origin yang sama dengan reverse proxy API, atau isi dengan URL origin backend production (tanpa trailing slash).
- `VITE_API_PROXY_TARGET`: Target proxy dev server Vite (`vite.config.js`), hanya digunakan saat `npm run dev`.

## Scripts

```bash
npm run dev      # Menjalankan development server Vite
npm run build    # Build bundle production ke folder dist/
npm run preview  # Pratinjau hasil build dist/ secara lokal
npm run lint     # Menjalankan pemeriksaan ESLint
```
