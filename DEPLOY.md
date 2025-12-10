# Deploy - Nginx Reverse Proxy

Este proyecto usa **Nginx como reverse proxy** en el host para manejar SSL y enrutar tráfico a los contenedores Docker.

## Arquitectura

```
Internet
   ↓
   ↓ HTTPS (443)
   ↓
[Nginx Reverse Proxy] (host)
   ├→ api.brasil... → http://localhost:8000 → [Backend Docker]
   └→ app.brasil... → http://localhost:3000 → [Frontend Docker]
```

## Setup inicial (una sola vez)

### 1. Configurar Nginx + SSL automáticamente

Ejecuta el script de configuración:

```bash
sudo chmod +x setup-nginx-proxy.sh
sudo ./setup-nginx-proxy.sh
```

El script te pedirá:
- Dominio del backend (ej: `api.brasil.estudiotrivelloni.com.ar`)
- Dominio del frontend (ej: `app.brasil.estudiotrivelloni.com.ar`)
- Email para Let's Encrypt

**El script configura todo automáticamente:**
- ✅ Instala nginx y certbot
- ✅ Crea configuración de reverse proxy
- ✅ Obtiene certificados SSL
- ✅ Configura renovación automática

### 2. Levantar contenedores Docker

**Backend:**
```bash
cd Backend
cp .env.example .env
nano .env  # Configurar variables
docker-compose up -d
```

**Frontend:**
```bash
cd Frontend
mkdir -p build
echo '<h1>Frontend</h1>' > build/index.html  # Temporal
docker-compose up -d
```

### 3. Verificar

```bash
# Ver que los contenedores respondan localmente
curl http://localhost:8000
curl http://localhost:3000

# Probar en el navegador
https://api.brasil.estudiotrivelloni.com.ar
https://app.brasil.estudiotrivelloni.com.ar
```

## Deploy del Backend

```bash
cd Backend

# Pull de cambios
git pull

# Si cambió código Python
docker-compose restart backend

# Si cambió requirements.txt o Dockerfile
docker-compose build backend
docker-compose up -d backend

# Si cambió modelos (migraciones)
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
docker-compose restart backend

# Collectstatic
docker-compose exec backend python manage.py collectstatic --noinput
```

## Deploy del Frontend

```bash
# Local: hacer build
npm run build

# Copiar al servidor
rsync -avz --delete build/ usuario@servidor:/ruta/Frontend/build/

# Los cambios se aplican INMEDIATAMENTE (nginx sirve archivos directos)
```

## Comandos útiles

### Nginx (host)

```bash
# Ver logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Recargar configuración
sudo nginx -t
sudo systemctl reload nginx

# Ver certificados SSL
sudo certbot certificates

# Renovar certificados manualmente
sudo certbot renew
```

### Backend Docker

```bash
cd Backend

# Ver logs
docker-compose logs -f backend

# Entrar al contenedor
docker-compose exec backend bash

# Ver estado
docker-compose ps
```

### Frontend Docker

```bash
cd Frontend

# Ver logs
docker-compose logs -f nginx

# Verificar archivos
docker-compose exec nginx ls -la /usr/share/nginx/html/
```

## Configuración manual de nginx (si no usaste el script)

Si prefieres configurar manualmente:

**`/etc/nginx/sites-available/brasil`:**
```nginx
server {
    listen 80;
    server_name api.brasil.estudiotrivelloni.com.ar;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name app.brasil.estudiotrivelloni.com.ar;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/brasil /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d api.brasil.estudiotrivelloni.com.ar
sudo certbot --nginx -d app.brasil.estudiotrivelloni.com.ar
```

## Troubleshooting

### Backend: 502 Bad Gateway

```bash
# Verificar que el backend esté corriendo
docker-compose ps
curl http://localhost:8000

# Ver logs
docker-compose logs backend
```

### Frontend: Página en blanco

```bash
# Verificar archivos
ls -la Frontend/build/
docker-compose exec nginx ls -la /usr/share/nginx/html/
```

### SSL no funciona

```bash
# Ver certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --dry-run
```

### Puerto ya en uso

```bash
# Ver qué usa el puerto
sudo lsof -i :8000
sudo lsof -i :3000

# Cambiar puerto en docker-compose.yml si es necesario
```

## Seguridad

- ✅ Contenedores solo expuestos en `127.0.0.1` (no accesibles desde fuera)
- ✅ SSL manejado por nginx del host (certbot automático)
- ✅ Renovación automática de certificados
- ✅ Headers de seguridad configurados

## Ventajas de este enfoque

1. **Simple**: Un solo archivo de configuración nginx
2. **SSL automático**: `certbot --nginx` configura todo
3. **Independiente**: Cambias contenedores sin tocar nginx
4. **Estándar**: Como se hace en producción normalmente
5. **Flexible**: Fácil agregar más dominios/servicios
