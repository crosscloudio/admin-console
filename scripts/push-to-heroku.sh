#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

docker tag cc-console-api registry.heroku.com/crosscloud-admin/web
docker push registry.heroku.com/crosscloud-admin/web

sleep 5
HEROKU_ORGANIZATION=crosscloud heroku run ./node_modules/.bin/knex migrate:latest --app crosscloud-admin
