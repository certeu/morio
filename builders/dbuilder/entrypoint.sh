#!/bin/bash

SRC=/morio/src
DIST=/morio/dist

cd /morio
mkdir -p pkg/DEBIAN
cp $SRC/control pkg/DEBIAN
cp -R $SRC/etc pkg/etc
cp -R $SRC/usr pkg/usr
cp -R $SRC/var pkg/var
dpkg-deb --build pkg $DIST
