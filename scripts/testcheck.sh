#!/bin/bash

if [ -z $MORIO_FQDN ]; then
  echo "Please set the MORIO_FQDN environment variable "
  echo "to the FQDN of your local Morio node to run tests."
  echo ""
  echo "Example: export MORIO_FQDN=my.morio.it"
  echo ""
  exit 1
fi
