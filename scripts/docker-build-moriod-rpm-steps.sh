#!/bin/bash
dnf install -y rpmdevtools && \
touch ~/.bash_profile && \
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash && \
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && \
nvm install lts/iron && nvm use lts/iron && \
cd /morio && npm run ci:build.moriod.rpm

