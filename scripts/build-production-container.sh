#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

IMAGE_TAG=${CI_PIPELINE_ID:-latest}

docker build --pull -t="cc-console-frontend:$IMAGE_TAG" react
CONTAINERID=$(docker run -d cc-console-frontend:$IMAGE_TAG bash)
rm -rf $PWD/api/public-build
docker cp $CONTAINERID:/source/dist $PWD/api/public-build
docker stop $CONTAINERID
docker rm $CONTAINERID
docker build --pull -t="cc-console-api:$IMAGE_TAG" api
