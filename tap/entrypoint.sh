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
#
pm2-runtime start /morio/tap/config/pm2.config.js
