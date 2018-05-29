#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

API_PACKAGE_VERSION=$(cat $PWD/api/package.json | grep version  | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g')
REACT_PACKAGE_VERSION=$(cat $PWD/react/package.json | grep version  | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g')

[ $API_PACKAGE_VERSION == $REACT_PACKAGE_VERSION ] || ( echo "API and React UI version numbers are not in sync" && exit 1 )
