#!/bin/bash
#
if [ -z "${MORIO_FQDN}" ]; then
  echo ""
  echo "Error: MORIO_FQDN is not set"
  echo "To be able to run the unit tests, we need to know the FQDN for the Morio collector."
  echo "Please set the MORIO_FQDN variable in your local environment. Eg:"
  echo "export MORIO_FQDN=10.0.0.1.nip.io"
  exit 1
fi

# Enter monorepo folder
cd /morio/api

# Start the api instance, as background job
# Also wrap it in c8 to generate a coverage report
../node_modules/.bin/c8 --reporter=html -- node ./src/index.mjs &> ../local/api_test_logs.ndjson &

# Wait for the api to come up by checking the up endpoint
TRIES1=0
while [ $TRIES1 -le 19 ] && [ -z "$UP" ]
do
  TRIES1=$((TRIES1+1))
  RESULT=$(curl -o /dev/null -f -s -w "%{http_code}\n" http://morio-api:3000/up)
  if [ "$RESULT" -eq 200 ]; then
    UP=1
  else
    echo "Waiting for api to come up [$TRIES1/20]"
    sleep 1
  fi
done

# Run unit tests
node --no-warnings --test-concurrency=1 --test

TEST_EXIT_CODE=$? 

# Stop api container
kill -1 %1

# If tests failed, propagate failure
if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo "Tests failed. Exiting with error."
  exit $TEST_EXIT_CODE
fi

curl -Os https://uploader.codecov.io/latest/linux/codecov
chmod +x codecov
mv codecov /usr/local/bin/

# Generate coverage report (text)
../node_modules/.bin/c8 report
# Generate coverage report (html)
../node_modules/.bin/c8 report --reporter=html

# Upload the coverage report to Codecov
LATEST_COVERAGE_FILE=$(ls -t ./coverage/tmp/*.json | head -n 1)

if [ -f "$LATEST_COVERAGE_FILE" ]; then
  echo "Uploading coverage report: $LATEST_COVERAGE_FILE"
  /usr/local/bin/codecov --file="$LATEST_COVERAGE_FILE" --token="$CODECOV_TOKEN" --slug="$CODECOV_SLUG" --sha="$GIT_COMMIT_SHA" --trace-warnings
else
  echo "Error: No coverage report found"
  exit 1
fi

# Clean up the coverage directory
rm -rf ./coverage/tmp/*
rm -rf ./coverage/*