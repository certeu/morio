#!/bin/bash
npm run redev
docker network create morionet --label "morio.network.description=Bridge docker network for morio services" || true
./api/tests/start-ldap-server.sh
./scripts/sleep 7
if [ -t 1 ]; then
  docker exec -it morio-api bash /morio/api/tests/run-unit-tests.sh
else
  docker exec -i morio-api bash /morio/api/tests/run-unit-tests.sh
fi
npm run redev
