##################################################
# STAGE 1
# Build React (Vite)
##################################################

FROM node:20-alpine AS build

WORKDIR /app

# Copy package terlebih dahulu agar cache efektif
COPY frontend/package*.json ./

RUN npm install

# Copy seluruh source frontend
COPY frontend/ .

# Build React
RUN npm run build

##################################################
# STAGE 2
# Nginx
##################################################

FROM nginx:alpine

# Hapus konfigurasi bawaan
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy konfigurasi nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Hapus halaman bawaan nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy hasil build React
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]