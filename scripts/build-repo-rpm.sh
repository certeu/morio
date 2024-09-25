#!/usr/bin/env bash
#
# This script will build the .rpm package to add the morio APT
# repository to a system.

# Sounce config variables
source config/cli.sh

#!/usr/bin/env bash
#dnf install -y rpmdevtools && \
#touch ~/.bash_profile && \
#curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash && \
#export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && \
#nvm install lts/iron && nvm use lts/iron && \
#cd /morio && npm run ci:build.moriod.rpm


# Create package structure
cd $MORIO_GIT_ROOT
rm -rf build-context/*
rm -rf build-context/.*
mkdir -p build-context/{BUILD,RPMS,SOURCES,SPECS,SRPMS}
cp morio.gpg build-context/SOURCES/
cat > build-context/SOURCES/moriod.repo <<EOF
[moriod]
name=Moriod RPM Repository
baseurl=https://rpm.repo.morio.it/
enabled=1
gpgcheck=1
gpgkey=file:///etc/pki/morio.gpg
EOF

cat > build-context/SPECS/build.spec <<EOF
Name:           moriod-repo
Version:        $MORIO_VERSION
Release:        1%{?dist}
Summary:        Moriod RPM repository configuration

License:        EUPL
URL:            https://rpm.repo.morio.it/
Source0:        moriod.repo

BuildArch:      noarch

%description
This package adds the Moriod RPM repository to your system.

%prep

%build

%install
install -Dm644 %{SOURCE0} %{buildroot}/etc/yum.repos.d/moriod.repo

%files
/etc/yum.repos.d/moriod.repo

%changelog
* Wed Sep 25 2024 Joost De Cock <joost@joost.at> 1.0-1
- Added Morio repository configuration.
EOF

# Build package
docker run -it \
  -v ${MORIO_GIT_ROOT}/build-context:/morio/src \
  -v ${MORIO_GIT_ROOT}/data/data:/morio/dist \
  itsmorio/rbuilder
