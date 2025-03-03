#!/bin/bash

# Figure out the location of the repository root
REPO_ROOT=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/../.. &> /dev/null && pwd )

# Run an ephemeral LDAP instance
docker run -d --rm \
  --name=ldap \
  --hostname=ldap \
  --network morionet \
  --network-alias ldap \
  -v $REPO_ROOT/api/tests:/mnt \
  kwart/ldap-server /mnt/data.ldif
