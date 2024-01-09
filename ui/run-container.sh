#!/bin/bash

#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigured' runs.
# To make changes, see: scripts/reconfigure.mjs
#

docker network create morio_net 2> /dev/null
docker stop ui 2> /dev/null
docker rm ui 2> /dev/null

if [ -z "$1" ];
then
  echo ""
  echo "No request to attach to container. Starting in daemonized mode."
  echo "To attach, pass attach to this script: run-container.sh attach "
  echo ""
  docker run -d   --name=morio_ui \
  --hostname=morio_ui \
  --network=morio_net \
  --network-alias ui \
  --init \
  -v /home/jdecock/git/morio:/morio  \
  -e MORIO_DEV=1 \
  morio/ui-dev:0.1.0

else
  docker run --rm -it   --name=morio_ui \
  --hostname=morio_ui \
  --network=morio_net \
  --network-alias ui \
  --init \
  -v /home/jdecock/git/morio:/morio  \
  -e MORIO_DEV=1 \
  morio/ui-dev:0.1.0

fi
