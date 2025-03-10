#!/usr/bin/env bash
#
#    _ _ _  ___  _ _  _  ___
#   | ' ' |/ . \| '_/| |/ . \
#   |_|_|_|\___/|_|  |_|\___/
#
#   https://morio.it
#
#   This install script will setup a Morio client.
#   It will:
#     - Make sure systemd is available
#     - Detect whether it is a APT or RPM based system
#     - Setup the morio repository:
#       - For API: apt.repo.morio.it
#       - for ROM: rpm.repo.morio.it
#     - Update dependencies
#     - Install the morio-client package
#
#   To learn more about Morio, visit https://morio.it
#

#
# Which distribution channel to use?
# Alternatives are canary or testing
CHANNEL="stable"

#
# Store the package format
#
PACKAGE_FORMAT=""
PACKAGE_EXT=""

#
# Detect if the system is APT-based (Debian/Ubuntu) or RPM-based (RHEL/RockyLinux/Fedora)
#
detect_package_manager() {
  echo ""
  echo -n "🔎 Looking for apt or yum..."
  if command -v apt-get &> /dev/null; then
    echo -ne "\r✅ Found apt, will use the APT repository."
    PACKAGE_FORMAT="apt"
    PACKAGE_EXT="deb"
  elif command -v yum &> /dev/null || command -v dnf &> /dev/null; then
    echo -ne "\r✅ Found yum, will use the RPM repository."
    PACKAGE_FORMAT="rpm"
    PACKAGE_EXT="rpm"
  else
    echo -ne "\r❌ Failed to find either apt or yum. Not sure what that means, so bailing out here."
    exit 1
  fi
}

#
# Detect systemd
#
detect_systemd() {
  echo ""
  echo -n "🔎 Looking for systemd..."
  if pidof systemd &> /dev/null; then
    echo -ne "\r✅ Found systemd               "
  else
    echo -ne "\r❌ Failed to find systemd"
    echo "This Morio client package requires systemd."
    echo "We do not currently support non-systemd distributions."
    echo "If you have such a need, please let us know."
    exit 1
  fi
}

#
# This function will download the morio-repo installer package
#
download_repo_pkg() {
  local url="$1"
  local output="$2"
  echo ""

  # Use curl if it's available
  if command -v curl &> /dev/null; then
    echo -n "⬇️  Downloading moriod-repo package with curl"
    curl -fsSL "$url" -o "$output"
  # Use wget if curl is not available
  elif command -v wget &> /dev/null; then
    echo -n "⬇️  Downloading moriod-repo package with wget"
    wget -q "$url" -O "$output"
  # Without curl or wget, bail
  else
    echo "⚠️  No curl found, and no wget found. We need a way to download the moriod-repo package."
    echo ""
    echo "💡 Consider installing curl with:"
    if [ $PACKAGE_FORMAT == "apt" ]; then
      echo "  sudo apt install -y curl"
    else
      echo "  sudo yum install -y curl"
    fi
    echo "💡 Then run this script again."
    return 1
  fi

  # Make sure the download is ok
  if [ -f "$output" ]; then
    echo -ne "\r✅ Download completed: $url"
  else
    echo -ne "\r❌ Failed to download $url"
    return 1
  fi
}

#
# This function will install the repo package
#
install_repo_pkg() {
  echo ""
  echo "📦 Installing morio-repo, which will add the ${PACKAGE_FORMAT} repository..."
  if [ $PACKAGE_FORMAT == "apt" ]; then
    sudo DEBIAN_FRONTEND=noninteractive apt install -y /tmp/setup-morio-repo.${PACKAGE_EXT}
  else
    sudo yum install -y /tmp/setup-morio-repo.${PACKAGE_EXT}
    echo ""
    echo "🛢️ Updating list of available packages..."
    sudo yum clean expire-cache && sudo yum check-update
  fi
}

#
# This function will install the morio-client package
#
install_client_pkg() {
  echo ""
  echo "📦 Installing morio-client, which will install the Morio client..."
  if [ $PACKAGE_FORMAT == "apt" ]; then
    sudo DEBIAN_FRONTEND=noninteractive apt install -y morio-client
  else
    sudo yum install -y morio-client
  fi
}

#
# Main install function that does what needs doing
install() {
  echo "    _ _ _  ___  _ _  _  ___ "
  echo "   | ' ' |/ . \| '_/| |/ . \ "
  echo "   |_|_|_|\___/|_|  |_|\___/ "
  detect_systemd
  detect_package_manager
  download_repo_pkg \
    https://${PACKAGE_FORMAT}.repo.morio.it/setup-morio-repo_${CHANNEL}.${PACKAGE_EXT} \
    /tmp/setup-morio-repo.${PACKAGE_EXT}
  install_repo_pkg
  install_client_pkg
}

#
# Run the install function
#
install
