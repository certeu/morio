#!/bin/bash

SRC=/morio/src
DIST=/morio/dist

cd /morio
mkdir -p pkg/DEBIAN
ls -l $SRC/*
cp $SRC/control pkg/DEBIAN
cp -R $SRC/usr pkg/usr
cp -R $SRC/etc pkg/etc
dpkg-deb --build pkg $DIST
