#!/bin/bash

#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigured' runs.
# To make changes, see: scripts/reconfigure.mjs
#

docker network create morio-net
docker stop sam
docker rm sam

if [ -z "$1" ];
then
  echo ""
  echo "No request to attach to container. Starting in daemonized mode."
  echo "To attach, pass attach to this script: run-container.sh attach "
  echo ""
  docker run -d   --name=sam \
  --network=morio-net \
  --init \
  -v /Users/joost/git/morio:/morio    -v /var/run/docker.sock:/var/run/docker.sock  \
  morio/sam-dev:0.1.0

else
  docker run --rm -it   --name=sam \
  --network=morio-net \
  --init \
  -v /Users/joost/git/morio:/morio    -v /var/run/docker.sock:/var/run/docker.sock  \
  morio/sam-dev:0.1.0

fi
