#!/bin/bash

DIR=`pwd`

npm run dev:clean
sudo rm -rf ${DIR}/data/*
# Also remove auto-generated files
rm -f ${DIR}/clients/linux/etc/morio/audit/config-template.yml
rm -f ${DIR}/clients/linux/etc/morio/logs/config-template.yml
rm -f ${DIR}/clients/linux/etc/morio/metrics/config-template.yml
