#!/bin/bash

DIR=`pwd`

docker rm -fv core api ui proxy ca broker console connector db
docker swarm leave --force
docker network rm morionet
docker network rm morionet_local
sudo rm -rf ${DIR}/data/* &> /dev/null
# Also remove auto-generated files
rm -f ${DIR}/clients/linux/etc/morio/audit/config-template.yml &> /dev/null
rm -f ${DIR}/clients/linux/etc/morio/logs/config-template.yml &> /dev/null
rm -f ${DIR}/clients/linux/etc/morio/metrics/config-template.yml &> /dev/null
