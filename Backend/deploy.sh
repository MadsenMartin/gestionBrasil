#!/bin/bash
set -e

echo "====================================="
echo "Desplegando Backend de gestión Brasil..."
echo "====================================="

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "ERROR: No se encontró el archivo .env"
    echo "Copia .env.example a .env y configura tus variables de entorno"
    exit 1
fi

# Pull del código más reciente
echo "Actualizando código desde Git..."

# Asegurar permisos en directorios críticos
chmod -R 755 static 2>/dev/null || true
chmod -R 755 media 2>/dev/null || true

# Hacer stash de TODOS los cambios locales (incluyendo el deploy.sh si fue modificado)
git stash --include-untracked

# Actualizar código
git pull origin master

# Recuperar solo los archivos que queremos mantener locales
# (.env, *.csv, db.sqlite3)
if [ -f .env.bak ]; then
    cp .env.bak .env 2>/dev/null || true
fi

# Detener contenedores existentes
echo "Deteniendo contenedores existentes..."
docker compose down

# Reconstruir imágenes
echo "Construyendo imágenes Docker..."
docker compose build --no-cache

# Iniciar servicios
echo "Iniciando servicios..."
docker compose up -d

# Esperar a que los servicios estén listos
echo "Esperando a que los servicios estén listos..."
sleep 10

# Verificar el estado
echo "Verificando estado de los servicios..."
docker compose ps

echo "====================================="
echo "Despliegue completado!"
echo "====================================="
echo ""
echo "Para ver los logs: docker compose logs -f"
echo "Para detener: docker compose down"
echo "Para reiniciar: docker compose restart"
