#!/bin/bash

# Enter monorepo folder
cd /morio/core

# Start the core instance, as background job
# Also wrap it in c8 to generate a coverage report
#../node_modules/.bin/c8 --reporter=html -- node ./src/index.mjs &> ../local/core_test_logs.ndjson &
node ./src/index.mjs &> ../local/core_test_logs.ndjson &

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
export NODE_V8_COVERAGE=./coverage
node \
  --experimental-test-coverage \
  --test-reporter=spec \
  --test-concurrency=1 \
  --test

# Stop core container
kill -1 %1

echo "commit: $GIT_COMMIT_SHA"
echo "pr: $GITHUB_PR_NUMBER"
# Copy the coverage report if an artificate location is set
if [ -n "$MORIO_ARTIFACT_FOLDER" ]; then
  chmod +r ./coverage/*.json
  cp ./coverage/*.json $MORIO_ARTIFACT_FOLDER
  # Remove these files to avoid permission trouble
  rm -rf ./coverage/*
fi

