#!/bin/bash

SRC=/morio/src
DIST=/morio/dist

cd /morio
mkdir -p pkg/DEBIAN
for FILE in control postinst; do
  if [ -f $SRC/$FILE ]
    then
    cp $SRC/$FILE pkg/DEBIAN/
  fi
done
for DIR in etc usr var; do
  cp -R $SRC/$DIR pkg/
done
dpkg-deb --build pkg $DIST
