#!/bin/bash

# Enter monorepo folder
cd /morio/api

# Start the api instance, as background job
# Also wrap it in c8 to generate a coverage report
../node_modules/.bin/c8 --reporter=html -- node src/index.mjs &> /dev/null &

# Wait for the api to come up by checking the status endpoint
TRIES1=0
while [ $TRIES1 -le 9 ] && [ -z "$UP" ]
do
  TRIES1=$((TRIES1+1))
  RESULT=$(curl -o /dev/null -f -s -w "%{http_code}\n" http://localhost:3000/-/api/status)
  if [ "$RESULT" -eq 200 ]; then
    UP=1
  else
    echo "Waiting for api to come up [$TRIES1/10]"
    sleep 1
  fi
done

# Run unit tests
node --test-concurrency=1 --test

# Stop api container
kill -1 %1

# Generate report
../node_modules/.bin/c8 report --format=html

