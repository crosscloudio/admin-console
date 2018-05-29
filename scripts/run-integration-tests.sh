#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# stop old containers if they are still running (e.g. if the previous invocation
# wasn't successful)
docker-compose -p cc-integration-tests -f docker-compose-integration-tests.yml stop
# remove old containers
docker-compose -p cc-integration-tests -f docker-compose-integration-tests.yml rm -f
# create a new instance of the database service
docker-compose -p cc-integration-tests -f docker-compose-integration-tests.yml create db
# start the database service
docker-compose -p cc-integration-tests -f docker-compose-integration-tests.yml start db
# wait some time for database creation
sleep 5
# run integration tests
docker-compose -p cc-integration-tests -f docker-compose-integration-tests.yml run tests
# stop db and api containers
docker-compose -p cc-integration-tests -f docker-compose-integration-tests.yml stop
docker-compose -p cc-integration-tests -f docker-compose-integration-tests.yml rm -f
