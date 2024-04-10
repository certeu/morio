#!/bin/bash
# Script to setup the Elastic APT repository

#
# Make sure we have the privileges we need
#
if [ "$EUID" -eq 0 ]; then
  true
else
  echo "Please use sudo, or run this command as root."
  exit 1
fi

#
# Keep this idempotent
#
if [ -f /etc/apt/sources.list.d/elastic-8.x.list ]; then
  echo "Elastic repository already configured"
  exit 0
else
  # Location of the repo & signing key
  REPO=https://artifacts.elastic.co/packages/8.x/apt
  KEY=https://artifacts.elastic.co/GPG-KEY-elasticsearch
  NAME=elastic-8.x
  #
  # Figure out what tool we can use to download
  #
  if which wget >/dev/null ; then
    wget -q -O /etc/apt/trusted.gpg.d/$NAME.asc $KEY
  elif which curl >/dev/null ; then
      curl -o /etc/apt/trusted.gpg.d/$NAME.asc $KEY
  else
      echo "Cannot download signing key, neither wget nor curl found."
      exit 1
  fi

  #
  # APT repos typically are hosted on HTTP (which is fine coz checksums)
  # Using an APT repo over HTTPS requires the apt-transport-https package
  #
  apt-get install -y apt-transport-https

  #
  # Now add the APT repo from Elastic
  #
  echo "deb $REPO stable main" > /etc/apt/sources.list.d/$NAME.list

  #
  # Finally run apt-update
  #
  apt update
fi
