Kalau sudah punya domain aktif dan ingin production kecil dengan Docker + Nginx + SSL Certbot, arsitektur yang rapi seperti ini:

DOMAIN
|
| HTTPS :443
|
↓
NGINX (Reverse Proxy + SSL)
|
+----------------+
| |
↓ ↓
FRONTEND BACKEND
React Express
(port 80) (5000)
|
↓
PostgreSQL
(Volume)
Struktur folder
PROJECT/
│
├── compose.yaml
├── .env
│
├── backend/
│ ├── Dockerfile
│ └── src/
│
├── frontend/
│ ├── Dockerfile
│ └── src/
│
└── nginx/
├── Dockerfile
├── nginx.conf
└── certbot/
├── conf/
└── www/

1. compose.yaml
   services:

backend:
build:
context: ./backend

    container_name: backend_app

    restart: always

    env_file:
      - .env

    expose:
      - "5000"

    networks:
      - app_network


    depends_on:
      - postgres

frontend:
build:
context: ./frontend

    container_name: frontend_app

    restart: always

    expose:
      - "80"

    networks:
      - app_network

postgres:

    image: postgres:16

    container_name: postgres_db

    restart: always


    environment:

      POSTGRES_USER: ${POSTGRES_USER}

      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

      POSTGRES_DB: ${POSTGRES_DB}



    volumes:

      - postgres_data:/var/lib/postgresql/data



    networks:
      - app_network

nginx:

    image: nginx:latest

    container_name: nginx_proxy

    restart: always


    ports:

      # HTTP
      - "80:80"

      # HTTPS
      - "443:443"



    volumes:


      # konfigurasi nginx
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf


      # SSL certificate
      - ./nginx/certbot/conf:/etc/letsencrypt


      # challenge certbot
      - ./nginx/certbot/www:/var/www/certbot



    depends_on:

      - frontend
      - backend



    networks:
      - app_network

volumes:

postgres_data:

networks:

app_network:

2. Nginx config dengan SSL

Lokasi:

nginx/nginx.conf

Contoh:

server {

    listen 80;

    server_name domainkamu.com www.domainkamu.com;


    # untuk verifikasi certbot

    location /.well-known/acme-challenge/ {

        root /var/www/certbot;

    }


    # redirect HTTP ke HTTPS

    location / {

        return 301 https://$host$request_uri;

    }

}

server {

    listen 443 ssl;


    server_name domainkamu.com www.domainkamu.com;



    ssl_certificate
    /etc/letsencrypt/live/domainkamu.com/fullchain.pem;


    ssl_certificate_key
    /etc/letsencrypt/live/domainkamu.com/privkey.pem;




    # FRONTEND

    location / {


        proxy_pass http://frontend:80;


    }




    # BACKEND API

    location /api/ {


        proxy_pass http://backend:5000;



        proxy_set_header Host $host;


        proxy_set_header X-Real-IP $remote_addr;


    }

}

Ganti:

domainkamu.com

dengan domain asli.

3. Install Certbot

Di VPS:

sudo apt update

sudo apt install certbot 4. Pastikan DNS domain

Di DNS provider:

Tambahkan:

Type : A

Name : @

Value : IP_VPS

Contoh:

example.com → 123.123.123.123

Cek:

ping domainkamu.com

harus mengarah ke VPS.

5. Jalankan container dulu HTTP

Pertama:

docker compose up -d

Cek:

docker ps

Pastikan nginx hidup.

6. Generate SSL Certbot

Jalankan:

sudo certbot certonly \
--webroot \
-w ./nginx/certbot/www \
-d domainkamu.com \
-d www.domainkamu.com

Jika berhasil:

File muncul:

nginx/certbot/conf/live/domainkamu.com/

isi:

fullchain.pem
privkey.pem 7. Restart nginx
docker compose restart nginx

Coba:

https://domainkamu.com 8. Auto renew SSL

Certbot biasanya membuat timer.

Cek:

systemctl status certbot.timer

Test:

sudo certbot renew --dry-run
.env

Contoh:

POSTGRES_USER=admin

POSTGRES_PASSWORD=passwordku

POSTGRES_DB=production_db

PORT=5000

DATABASE_HOST=postgres

DATABASE_PORT=5432
Untuk production kecil, saya lebih menyarankan:
VPS
|
├── Docker
|
├── Nginx Container
| |
| └── SSL Certbot
|
├── React Container
|
├── Express Container
|
└── PostgreSQL Container
|
└── Docker Volume

Keuntungan:

Server bersih.
Semua konfigurasi ada di repo.
Mudah pindah VPS.
SSL otomatis.
Tidak perlu install Nginx/PostgreSQL langsung di Ubuntu.

Catatan penting: sertifikat SSL jangan di-push ke Git. Folder:

nginx/certbot/conf

sebaiknya masuk .gitignore.
