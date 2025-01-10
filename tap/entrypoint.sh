#!/bin/bash
#
# This entrypoint script will build the tap source code
# as well as any stream processors that are (pre)seeded.
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
# We limit the memory here meaning pm2 will restart the service
# when we exceed this memory use. This is to guard against
# memory leaks, which is especially pertinent since tap will
# run code outside our control.
#
pm2-runtime --name tap --namespace morio --log-type json --max-memory-bytes 250000000 ./dist/index.mjs
