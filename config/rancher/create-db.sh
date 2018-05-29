#!/bin/bash
set -euox pipefail
IFS=$'\n\t'

if [ $# -ne 3 ]; then
    echo "Usage: create-db.sh DB_NAME DB_USER DB_PASSWORD"
    exit 1
fi

DB_NAME=$1
DB_USER=$2
DB_PASSWORD=$3

PGPASSWORD=$(rancher exec postgres-keeper-1-1 bash -c "echo \$STKEEPER_PG_SU_PASSWORD")

rancher exec -i postgres-proxy-1 bash -c "PGHOST=127.0.0.1 PGPASSWORD=$PGPASSWORD createdb -U postgres $DB_NAME"
rancher exec -i postgres-proxy-1 bash -c "PGHOST=127.0.0.1 PGPASSWORD=$PGPASSWORD psql -U postgres $DB_NAME -c \"CREATE ROLE $DB_USER PASSWORD '$DB_PASSWORD';\""
rancher exec -i postgres-proxy-1 bash -c "PGHOST=127.0.0.1 PGPASSWORD=$PGPASSWORD psql -U postgres $DB_NAME -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""
rancher exec -i postgres-proxy-1 bash -c "PGHOST=127.0.0.1 PGPASSWORD=$PGPASSWORD psql -U postgres $DB_NAME -c \"CREATE EXTENSION IF NOT EXISTS citext;\""
rancher exec -i postgres-proxy-1 bash -c "PGHOST=127.0.0.1 PGPASSWORD=$PGPASSWORD psql -U postgres $DB_NAME -c \"CREATE EXTENSION IF NOT EXISTS \"'\"'uuid-ossp'\"'\";\""
