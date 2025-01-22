#!/bin/bash

# Enter monorepo folder
cd /morio/core

# Start the core instance, as background job
# Also wrap it in c8 to generate a coverage report
../node_modules/.bin/c8 --reporter=html -- node ./src/index.mjs & #> ../local/core_test_logs.ndjson &

# Wait for core to come up by checking the status endpoint
TRIES=0
while [ $TRIES -le 29 ] && [ -z "$UP" ]
do
  TRIES=$((TRIES+1))
  RESULT=$(curl -o /dev/null -f -s -w "%{http_code}\n" http://localhost:3007/status)
  if [ "$RESULT" -eq 200 ]; then
    UP=1
  else
    echo "Waiting for core to come up [$TRIES/30]"
    sleep 1
  fi
done

# Run unit tests
node -v
node --test-concurrency=1 --test

# Stop core container
kill -1 %1

# Generate coverage report (text)
../node_modules/.bin/c8 report
# Generate coverage report (html)
../node_modules/.bin/c8 report --reporter=html

