# Configuración de SSL con Let's Encrypt

Este proyecto está configurado para usar SSL automáticamente con Let's Encrypt y nginx.

## Cómo funciona

El sistema detecta automáticamente si existe un certificado SSL:

- **Sin certificado**: Nginx arranca en modo HTTP (puerto 80)
- **Con certificado**: Nginx arranca en modo HTTPS (puertos 80 y 443), redirigiendo HTTP → HTTPS

## Pasos para el primer deploy

### 1. Configurar variables de entorno

Copia `.env.example` a `.env` y modifica:

```bash
cp .env.example .env
nano .env
```

Variables importantes:
```env
DOMAIN_NAME=tu-dominio.com.ar
SSL_EMAIL=admin@tu-dominio.com.ar
```

### 2. Apuntar DNS

Asegúrate de que tu dominio apunta a la IP del servidor:

```bash
# Verificar DNS
nslookup tu-dominio.com.ar
```

### 3. Iniciar servicios

```bash
docker-compose up -d
```

Nginx arrancará en modo HTTP mostrando instrucciones en los logs.

### 4. Obtener certificado SSL

Ejecuta este comando **una sola vez**:

```bash
docker-compose exec certbot certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email ${SSL_EMAIL} \
  --agree-tos \
  --no-eff-email \
  -d ${DOMAIN_NAME}
```

O manualmente con tus valores:

```bash
docker-compose exec certbot certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@tu-dominio.com.ar \
  --agree-tos \
  --no-eff-email \
  -d tu-dominio.com.ar
```

### 5. Reiniciar nginx

```bash
docker-compose restart nginx
```

Nginx detectará el certificado y cambiará automáticamente a HTTPS.

## Renovación automática

El certificado se renueva automáticamente cada 12 horas mediante el contenedor `certbot`.

## Verificar estado

```bash
# Ver logs de nginx
docker-compose logs nginx

# Ver estado del certificado
docker-compose exec certbot certbot certificates

# Verificar configuración de nginx
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf
```

## Troubleshooting

### Error: Timeout o conexión rechazada

- Verifica que el puerto 80 esté abierto en el firewall
- Asegúrate de que el DNS apunta correctamente

### Error: Too many failed authorizations

- Let's Encrypt tiene límite de intentos (5 fallos por hora)
- Espera una hora antes de reintentar

### Nginx no detecta el certificado

```bash
# Verificar que existe el certificado
docker-compose exec nginx ls -la /etc/letsencrypt/live/${DOMAIN_NAME}/

# Reiniciar nginx
docker-compose restart nginx
```

## Modo desarrollo (sin SSL)

Si estás en desarrollo local, simplemente no ejecutes el paso 4. Nginx funcionará en HTTP puro.
