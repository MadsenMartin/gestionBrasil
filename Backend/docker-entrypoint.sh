#!/bin/bash
set -e

echo "Esperando a que PostgreSQL esté disponible..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  sleep 1
done

echo "PostgreSQL está disponible. Creando migraciones..."
python manage.py makemigrations --noinput

echo "Aplicando migraciones..."
python manage.py migrate --noinput

echo "Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "Iniciando aplicación..."
exec "$@"
