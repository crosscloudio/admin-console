#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

DB_NAME=crosscloud
DB_USER=crosscloud

docker-compose up -d db
echo "Waiting for db setup"
sleep 20
docker-compose exec --user postgres db createdb $DB_NAME || true
docker-compose exec --user postgres db psql $DB_NAME -c "create user $DB_USER;" || true
docker-compose exec --user postgres db psql $DB_NAME -c "grant all privileges on database $DB_NAME to $DB_USER;" || true
docker-compose exec --user postgres db psql $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS citext;"
docker-compose exec --user postgres db psql $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
docker-compose stop db
