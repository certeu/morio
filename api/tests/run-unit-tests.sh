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

export NODE_V8_COVERAGE=./coverage
node \
  --experimental-test-coverage \
  --test-reporter=spec \
  --test-concurrency=1 \
  --test

TEST_EXIT_CODE=$?

# Stop api container
kill -1 %1

# If tests failed, propagate failure
if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo "Tests failed. Exiting with error. (run-unit-tests)"
  exit $TEST_EXIT_CODE
else
  echo "Congratulations, all tests passed."
fi

exit $TEST_EXIT_CODE

