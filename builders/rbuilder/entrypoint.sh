#!/bin/bash

SRC=/morio/src
DIST=/morio/dist

cd /morio
rpmdev-setuptree
rpmbuild -bb --quiet $SRC/SPECS/build.spec --define "_topdir $SRC"
echo ""
echo ""
echo ""
chmod -R 755 $SRC
ls -R $SRC/RPMS
mv $SRC/RPMS/*/*.rpm $DIST/

