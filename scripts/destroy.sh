#!/bin/bash

DIR=`pwd`

echo
echo
echo "This will destroy you Morio deployment/configuration."
echo
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "!!! Careful, there is no way back from this !!!"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo
echo "Enter y to continue. Anything else and we'll bail out."
read -p " =>  " -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo
  echo "Hope you know what you're doing"
  npm run dev:clean
  sudo rm -rf ${DIR}/data/*
  # Also remove auto-generated files
  rm ${DIR}/clients/linux/etc/morio/audit/config-template.yml
  rm ${DIR}/clients/linux/etc/morio/logs/config-template.yml
  rm ${DIR}/clients/linux/etc/morio/metrics/config-template.yml
else
  echo
  echo
  echo "Phew, bailing out."
  echo
fi

