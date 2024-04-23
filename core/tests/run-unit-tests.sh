#!/bin/bash

# Enter monorepo folder
cd /morio/core

# Start the core instance, as background job
# Also wrap it in c8 to generate a coverage report
../node_modules/.bin/c8 -- node src/index.mjs &> /dev/null &

# Wait for core to come up by checking the status endpoint
TRIES=0
while [ $TRIES -le 10 ] && [ -z "$UP" ]
do
  TRIES=$((TRIES+1))
  RESULT=$(curl -o /dev/null -f -s -w "%{http_code}\n" http://localhost:3007/status)
  if [ "$RESULT" -eq 200 ]; then
    UP=1
  else
    echo "Waiting for core to come up [$TRIES/10]"
    sleep 1
  fi
done
node --experimental-test-coverage --test
kill -1 %1

