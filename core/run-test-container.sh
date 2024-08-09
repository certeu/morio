#!/bin/bash
#
# This file is auto-generated
#
# Any changes you make here will be lost next time 'npm run reconfigure' runs.
# To make changes, see: scripts/reconfigure.mjs
#

docker run \
  -it --rm \
  --name=core \
  --hostname=core \
  --label morio.service=core \
  --log-driver=journald \
  --log-opt labels=morio.service \
 \
  --network-alias core \
  --init \
 \
  -v /home/jdecock/git/morio:/morio  \
  -v /var/run/docker.sock:/var/run/docker.sock  \
  -v /home/jdecock/git/morio/data/config:/etc/morio  \
  -v /home/jdecock/git/morio/data/data:/morio/data  \
  -v /home/jdecock/git/morio/data/logs:/var/log/morio  \
 \
  -e MORIO_DOCKER_SOCKET=/var/run/docker.sock \
  -e MORIO_CONFIG_ROOT=/home/jdecock/git/morio/data/config \
  -e MORIO_DATA_ROOT=/home/jdecock/git/morio/data/data \
  -e MORIO_LOGS_ROOT=/home/jdecock/git/morio/data/logs \
  -e MORIO_CORE_LOG_LEVEL=info \
  -e NODE_ENV=test \
  -e MORIO_REPO_ROOT=/home/jdecock/git/morio \
  morio/core-dev:0.3.0 bash /morio/core/tests/run-unit-tests.sh


