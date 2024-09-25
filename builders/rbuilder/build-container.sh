#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

# Set this once
CONTAINER=rbuilder

docker build \
  --tag itsmorio/$CONTAINER:latest \
  --tag itsmorio/$CONTAINER:$MORIO_VERSION \
  $MORIO_GIT_ROOT/builders/$CONTAINER

