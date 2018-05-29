#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

docker-compose -p cc_adminconsoleapi_test -f docker-compose-tests.yml run --rm test npm test -- --coverage
