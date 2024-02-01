#!/bin/bash

SRC=/morio/src
DIST=/morio/dist

cd /morio
mkdir -p pkg/DEBIAN
ls -l $SRC/*
cp $SRC/control pkg/DEBIAN
dpkg-deb --build pkg $DIST
