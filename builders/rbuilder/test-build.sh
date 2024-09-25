#!/bin/bash
SRC=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && cd ../../clients/linux && pwd )
DIST=$( cd $SRC && cd ../../hostfs/data/downloads && pwd )
docker run -it \
  --rm \
  -v $SRC:/morio/src \
  -v $DIST:/morio/dist \
  -- \
  morio/rbuilder

