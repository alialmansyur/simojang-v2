# Stage 1: Build React Frontend (Vite)
FROM node:22-alpine AS frontend-builder

WORKDIR /build

COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci

COPY apps/frontend/ ./

# Injeksi base path & target API untuk build produksi
ARG VITE_BASE_PATH="/"
ARG VITE_API_BASE_URL=""
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# Stage 2: Nginx Reverse Proxy + Static Frontend
FROM nginx:1.27-alpine

RUN apk add --no-cache tzdata wget

ENV TZ=Asia/Jakarta

# Salin hasil build SPA frontend
COPY --from=frontend-builder /build/dist /usr/share/nginx/frontend

# Salin aset statis backend (logo instansi/pnbp script) & siapkan mount point penyimpanan upload terpusat
COPY apps/admin/public/apps/assets /var/www/html/public/apps/assets
RUN mkdir -p /var/www/html/writable/uploads/public

# Salin konfigurasi Nginx production
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
