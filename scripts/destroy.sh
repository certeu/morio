#!/bin/bash

DIR=`pwd`

npm run dev:clean &> /dev/null
sudo rm -rf ${DIR}/data/* &> /dev/null
# Also remove auto-generated files
rm -f ${DIR}/clients/linux/etc/morio/audit/config-template.yml &> /dev/null
rm -f ${DIR}/clients/linux/etc/morio/logs/config-template.yml &> /dev/null
rm -f ${DIR}/clients/linux/etc/morio/metrics/config-template.yml &> /dev/null
