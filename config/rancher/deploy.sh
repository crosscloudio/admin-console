#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

if [ $# -ne 1 ]; then
    echo "Usage: deploy.sh STACK_NAME"
    exit 1
fi

STACK_NAME=$1
ENV_FILE_NAME=".env-${STACK_NAME}"
APP_CONTAINER_NAME="${STACK_NAME}-app-1"

rancher up --pull -u -d --stack $STACK_NAME --env-file $ENV_FILE_NAME

# TODO: filter images and run migrations in the correct one
# sleep 10
# rancher exec -ti $APP_CONTAINER_NAME ./node_modules/.bin/knex migrate:latest
