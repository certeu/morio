#!/bin/bash
sudo mkdir -p ../../data/data/eda/node-red-morio/src
sudo cp -R src/* ../../data/data/eda/node-red-morio/src/
sudo cp package.json ../../data/data/eda/node-red-morio/
docker rm -f morio-eda
sudo chown -R 1000:1000 ../../data/data/eda/node-red-morio
touch ../../core/src/index.mjs


