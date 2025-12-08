# --- Stage 1: Build React ---
FROM node:18-alpine as build
WORKDIR /app

# Copy package json dulu (biar cache optimal)
COPY package*.json ./
RUN npm install
COPY . .

# --- BAGIAN INI YANG DIUPDATE ---
# 1. Terima variable dari luar (Portainer -> Docker Compose)
ARG VITE_APP_NAME
ARG VITE_API_URL
ARG VITE_DEBUG

# 2. Set sebagai Environment Variable agar dibaca Vite saat build
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEBUG=$VITE_DEBUG
# -------------------------------

RUN npm run build

# --- Stage 2: Serve dengan Nginx ---
FROM nginx:alpine

# Copy hasil build dari Stage 1 ke folder Nginx
# (Pastikan folder output vite Anda 'dist'. Jika CRA, ganti jadi 'build')
COPY --from=build /app/dist /usr/share/nginx/html

# Copy konfigurasi Nginx custom tadi
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]