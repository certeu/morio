#!/bin/bash

DIR=`pwd`

echo $DIR

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
  sudo rm -f ${DIR}/hostfs/config/morio.*.yaml
  sudo rm -f ${DIR}/hostfs/config/.*.keys
  echo "" > ${DIR}/hostfs/config/shared/root_ca.crt
  sudo rm -f ${DIR}/hostfs/config/ca/*.json
  sudo rm -f ${DIR}/hostfs/data/ca/certs/*.crt
  sudo rm -f ${DIR}/hostfs/data/ca/db/*
  touch ${DIR}/hostfs/data/ca/db/.gitkeep
  sudo rm -f ${DIR}/hostfs/data/ca/secrets/*
  touch ${DIR}/hostfs/data/ca/secrets/.gitkeep
else
  echo
  echo
  echo "Phew, bailing out."
  echo
fi

