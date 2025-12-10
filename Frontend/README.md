# Frontend - Nginx + SSL

Contenedor Docker con nginx para servir el frontend React con SSL automático vía Let's Encrypt.

## Estructura

```
Frontend/
├── build/                      # Archivos del build de React (copiar con SCP)
├── nginx/
│   └── nginx.conf.template    # Configuración de nginx
├── docker-compose.yml          # Definición de servicios
├── .env.example               # Variables de entorno
└── README.md                  # Este archivo
```

## Setup inicial

### 1. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Edita:
```env
DOMAIN_NAME=app.brasil.estudiotrivelloni.com.ar
SSL_EMAIL=tu@email.com
```

### 2. Apuntar DNS al servidor

```bash
nslookup app.brasil.estudiotrivelloni.com.ar
```

### 3. Crear build inicial

```bash
mkdir -p build
echo '<!DOCTYPE html><html><body><h1>Frontend</h1></body></html>' > build/index.html
```

### 4. Iniciar servicios

```bash
docker-compose up -d
```

### 5. Obtener certificado SSL

```bash
docker-compose exec certbot certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email \
  -d app.brasil.estudiotrivelloni.com.ar
```

### 6. Reiniciar nginx

```bash
docker-compose restart nginx
```

## Deploy del frontend

### Build local

```bash
npm run build
```

### Copiar al servidor

```bash
# SCP
scp -r build/* usuario@servidor:/ruta/Frontend/build/

# rsync (recomendado - más eficiente)
rsync -avz --delete build/ usuario@servidor:/ruta/Frontend/build/
```

**Los cambios se aplican inmediatamente sin reiniciar.**

## Comandos útiles

```bash
# Ver logs
docker-compose logs -f nginx

# Estado
docker-compose ps

# Ver certificados
docker-compose exec certbot certbot certificates

# Renovar certificado
docker-compose exec certbot certbot renew && docker-compose restart nginx

# Verificar archivos
docker-compose exec nginx ls -la /usr/share/nginx/html/
```

## Troubleshooting

### Página en blanco
```bash
ls -la build/
docker-compose exec nginx ls -la /usr/share/nginx/html/
```

### Caché del navegador
Ctrl + Shift + R para forzar recarga

### Certificado SSL
El certificado se renueva automáticamente cada 12 horas
