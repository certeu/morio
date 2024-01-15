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
  rm -f ${DIR}/hostfs/config/morio.*.yaml
  rm -f ${DIR}/hostfs/config/.*.keys
  echo "" > ${DIR}/hostfs/config/shared/root_ca.crt
  rm -f ${DIR}/hostfs/config/ca/*.json
  rm -f ${DIR}/hostfs/data/ca/certs/*.crt
  rm -f ${DIR}/hostfs/data/ca/db/*
  touch ${DIR}/hostfs/data/ca/db/.gitkeep
  rm -f ${DIR}/hostfs/data/ca/secrets/*
  touch ${DIR}/hostfs/data/ca/secrets/.gitkeep
else
  echo
  echo
  echo "Phew, bailing out."
  echo
fi

