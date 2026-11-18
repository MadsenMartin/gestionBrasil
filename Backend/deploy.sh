#!/bin/bash
# Despliega el backend en el servidor. Lo llama deploy.ps1 por ssh.
#
#   ./deploy.sh          # rápido: reconstruye sólo lo que cambió (normalmente el código)
#   ./deploy.sh --full   # reconstruye la imagen desde cero (actualiza paquetes del sistema y pip)
#
# Las migraciones y el collectstatic los corre docker-entrypoint.sh al levantar el contenedor.
# No toca datos: la base vive en el volumen postgres_data y static/ y media/ se montan del host.
set -e
cd "$(dirname "$0")"

if [ "$1" != "--actualizado" ]; then
    echo "====================================="
    echo "Desplegando Backend de gestión Brasil..."
    echo "====================================="

    if [ ! -f .env ]; then
        echo "ERROR: No se encontró el archivo .env"
        echo "Copia .env.example a .env y configura tus variables de entorno"
        exit 1
    fi

    echo "Actualizando código desde Git..."
    # Los cambios de permisos (chmod) no cuentan como modificaciones
    git config core.fileMode false
    # Sólo archivos versionados: los no versionados (.env, media, backups) quedan donde están.
    # Si no hay cambios no crea ningún stash.
    git stash
    # --ff-only: si el servidor tiene commits propios, frena en vez de mergear
    git pull --ff-only origin main

    # Re-ejecuta la versión recién bajada de este mismo script
    exec bash "$0" --actualizado "$@"
fi
shift

FULL=0
for arg in "$@"; do
    case "$arg" in
        --full) FULL=1 ;;
        *) echo "Opción desconocida: $arg (uso: ./deploy.sh [--full])"; exit 1 ;;
    esac
done

chmod -R 755 static 2>/dev/null || true
chmod -R 755 media 2>/dev/null || true

# Se construye con el contenedor viejo todavía andando: el corte es sólo el reinicio
if [ "$FULL" = 1 ]; then
    echo "Construyendo imagen desde cero (--full)..."
    docker compose build --no-cache --pull backend
else
    echo "Construyendo imagen..."
    docker compose build backend
fi

# Recrea sólo los servicios cuya imagen o configuración cambió (normalmente sólo backend)
echo "Levantando servicios..."
docker compose up -d

echo "Esperando a que el backend responda..."
for i in $(seq 1 60); do
    if curl -s -o /dev/null --max-time 2 http://127.0.0.1:8000/; then
        break
    fi
    if [ "$i" = 60 ]; then
        echo "ERROR: el backend no respondió en 2 minutos. Últimos logs:"
        docker compose logs --tail 40 backend
        exit 1
    fi
    sleep 2
done

docker compose ps

# Borra sólo las imágenes viejas sin nombre que deja cada build (no toca volúmenes)
docker image prune -f > /dev/null

echo "====================================="
echo "Despliegue completado!"
echo "====================================="
