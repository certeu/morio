#!/bin/bash
#
# This entrypoint script will build the Tap source code
# as well as any customer transformers that are loaded
# by Morio Core (or otherwise volume-mounted).
#
# After building, it will start the service using the
# PM2 process manager.

#
# Change to the tap folder
#
#
cd /morio/tap

#
# Load transformers
#
node ./entrypoint-loader.mjs

#
# Build the bundle
#
node ./build.mjs

#
# Silence warnings about changed partitioner scheme
#
export KAFKAJS_NO_PARTITIONER_WARNING=1

#
# Start the Tap instance
#
pm2-runtime --name tap --namespace morio --log-type json --max-memory-bytes 250000000 ./dist/index.mjs
