#!/bin/bash
set -e

echo "=================================="
echo "Nginx Reverse Proxy Setup"
echo "=================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Este script debe ejecutarse como root${NC}"
    echo "Usa: sudo ./setup-nginx-proxy.sh"
    exit 1
fi

# Solicitar datos
echo -e "${YELLOW}Ingresa el dominio del BACKEND (ej: api.brasil.estudiotrivelloni.com.ar):${NC}"
read -r BACKEND_DOMAIN

echo -e "${YELLOW}Ingresa el dominio del FRONTEND (ej: app.brasil.estudiotrivelloni.com.ar):${NC}"
read -r FRONTEND_DOMAIN

echo -e "${YELLOW}Ingresa tu email para Let's Encrypt:${NC}"
read -r SSL_EMAIL

echo ""
echo "Configuración:"
echo "  Backend:  $BACKEND_DOMAIN -> http://localhost:8000"
echo "  Frontend: $FRONTEND_DOMAIN -> http://localhost:3000"
echo "  Email:    $SSL_EMAIL"
echo ""
echo -e "${YELLOW}¿Continuar? (y/n)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo -e "${GREEN}[1/5] Instalando nginx y certbot...${NC}"
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

echo ""
echo -e "${GREEN}[2/5] Creando configuración de nginx...${NC}"

cat > /etc/nginx/sites-available/brasil << EOF
# API Backend
server {
    listen 80;
    server_name ${BACKEND_DOMAIN};

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Archivos estáticos de Django
    location /static/ {
        alias /var/www/gestionBrAPI/Backend/static/;
    }

    location /media/ {
        alias /var/www/gestionBrAPI/Backend/media/;
    }
}

# Frontend
server {
    listen 80;
    server_name ${FRONTEND_DOMAIN};

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo ""
echo -e "${GREEN}[3/5] Activando configuración...${NC}"

# Desactivar default si existe
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Activar nuestra configuración
ln -sf /etc/nginx/sites-available/brasil /etc/nginx/sites-enabled/

# Verificar configuración
nginx -t

echo ""
echo -e "${GREEN}[4/5] Reiniciando nginx...${NC}"
systemctl reload nginx

echo ""
echo -e "${GREEN}[5/5] Configurando SSL con Let's Encrypt...${NC}"
echo ""
echo "Obteniendo certificado para $BACKEND_DOMAIN..."
certbot --nginx -d "$BACKEND_DOMAIN" --non-interactive --agree-tos --email "$SSL_EMAIL" --redirect

echo ""
echo "Obteniendo certificado para $FRONTEND_DOMAIN..."
certbot --nginx -d "$FRONTEND_DOMAIN" --non-interactive --agree-tos --email "$SSL_EMAIL" --redirect

echo ""
echo -e "${GREEN}=================================="
echo "✅ Configuración completada!"
echo "==================================${NC}"
echo ""
echo "URLs configuradas:"
echo "  🔒 https://$BACKEND_DOMAIN  -> Backend API"
echo "  🔒 https://$FRONTEND_DOMAIN -> Frontend"
echo ""
echo "Próximos pasos:"
echo "  1. Asegúrate de que los contenedores Docker estén corriendo:"
echo "     cd Backend && docker-compose up -d"
echo "     cd Frontend && docker-compose up -d"
echo ""
echo "  2. Verifica que funcionen:"
echo "     curl http://localhost:8000"
echo "     curl http://localhost:3000"
echo ""
echo "  3. Prueba en el navegador:"
echo "     https://$BACKEND_DOMAIN"
echo "     https://$FRONTEND_DOMAIN"
echo ""
echo "Renovación automática de SSL:"
echo "  Certbot renovará automáticamente los certificados."
echo "  Puedes probar con: sudo certbot renew --dry-run"
echo ""
