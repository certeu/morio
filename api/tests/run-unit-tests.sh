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

# Stop api container
kill -1 %1

# Stop the test LDAP server
./tests/stop-ldap-server.sh

# Generate coverage report (text)
../node_modules/.bin/c8 report
# Generate coverage report (html)
../node_modules/.bin/c8 report --reporter=html

