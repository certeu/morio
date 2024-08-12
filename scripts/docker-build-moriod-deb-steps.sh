#!/bin/bash
apt update && apt upgrade -y
apt install -y curl
touch ~/.bash_profile && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm install lts/iron
cd /morio && npm run ci:build:moriod:deb
