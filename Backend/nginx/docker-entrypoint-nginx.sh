#!/bin/sh
set -e

echo "Checking for SSL certificates..."

# Verificar si existe el certificado SSL
if [ ! -f "/etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem" ]; then
    echo "⚠️  No SSL certificate found for ${DOMAIN_NAME}"
    echo "📝 Using HTTP-only configuration"
    echo ""
    echo "To obtain SSL certificate, run:"
    echo "  docker-compose exec certbot certbot certonly --webroot \\"
    echo "    --webroot-path=/var/www/certbot \\"
    echo "    --email \${SSL_EMAIL} \\"
    echo "    --agree-tos --no-eff-email \\"
    echo "    -d ${DOMAIN_NAME}"
    echo ""
    echo "Then restart nginx: docker-compose restart nginx"
    echo ""

    # Usar configuración sin SSL
    envsubst '${DOMAIN_NAME}' < /etc/nginx/templates/nginx-initial.conf.template > /etc/nginx/conf.d/default.conf
else
    echo "✅ SSL certificate found for ${DOMAIN_NAME}"
    echo "🔒 Using HTTPS configuration"

    # Usar configuración con SSL
    envsubst '${DOMAIN_NAME}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf
fi

echo "Starting nginx..."

# Ejecutar nginx
exec "$@"
