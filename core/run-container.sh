#!/bin/bash

#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigured' runs.
# To make changes, see: scripts/reconfigure.mjs
#

docker network create morionet 2> /dev/null
docker stop core 2> /dev/null
docker rm core 2> /dev/null

if [ -z "$1" ];
then
  echo ""
  echo "No request to attach to container. Starting in daemonized mode."
  echo "To attach, pass attach to this script: run-container.sh attach "
  echo ""
  docker run -d   --name=core \
  --hostname=core \
  --network=morionet \
  --network-alias core \
  --init \
  -v /var/run/docker.sock:/var/run/docker.sock    -v /home/jdecock/git/morio:/morio    -v /home/jdecock/git/morio/hostfs/config:/etc/morio    -v /home/jdecock/git/morio/hostfs/data:/morio/data    -v /home/jdecock/git/morio/hostfs/logs:/var/log/morio  \
  -e MORIO_DEV=1 \
  -e MORIO_HOSTOS_REPO_ROOT=/home/jdecock/git/morio \
  -e MORIO_CORE_LOG_LEVEL=debug \
  morio/core-dev:0.1.0

else
  docker run --rm -it   --name=core \
  --hostname=core \
  --network=morionet \
  --network-alias core \
  --init \
  -v /var/run/docker.sock:/var/run/docker.sock    -v /home/jdecock/git/morio:/morio    -v /home/jdecock/git/morio/hostfs/config:/etc/morio    -v /home/jdecock/git/morio/hostfs/data:/morio/data    -v /home/jdecock/git/morio/hostfs/logs:/var/log/morio  \
  -e MORIO_DEV=1 \
  -e MORIO_HOSTOS_REPO_ROOT=/home/jdecock/git/morio \
  -e MORIO_CORE_LOG_LEVEL=debug \
  morio/core-dev:0.1.0

fi
