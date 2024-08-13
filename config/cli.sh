#!/bin/bash
#
# A little helper file that you can source in your scripts
# to get access to a bunch of configurartion values.
#
# This provides the following variables:
#
#   - MORIO_GIT_ROOT
#   - MORIO_ABOUT
#   - MORIO_ASCII_BANNER
#   - MORIO_AWS_ACCOUNT_ID
#   - MORIO_GITHUB_REPO
#   - MORIO_GITHUB_REPO_URL
#   - MORIO_VERSION
#   - MORIO_WEBSITE
#   - MORIO_WEBSITE_URL
#
# Note: These entries are alphabetic with the exception
#       of MORIO_GIT_ROOT as it is used by some other commands.
#

#
# Location of the git repo on disk
#
MORIO_GIT_ROOT=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && cd .. && pwd )

#
# About Morio
#
MORIO_ABOUT="Morio provides the plumbing for your observability needs"

#
# ASCII Banner
#
read -r -d '' MORIO_ASCII_BANNER << EOB

  ._ _ _  ___  _ _  _  ___
  | ' ' |/ . \\| '_/| |/ . \\
  |_|_|_|\\___/|_|  |_|\\___/

EOB

#
# AWS account ID (for AMI image ownership)
#
MORIO_AWS_ACCOUNT_ID="719603448334"


#
# GitHub repository
#
MORIO_GITHUB_REPO="certeu/morio"
MORIO_GITHUB_REPO_URL="https://github.com/certeu/morio"

#
# Current Morio version
#
MORIO_VERSION=`sed 's/\"version\"/\"VERSION\"/' $MORIO_GIT_ROOT/package.json | grep VERSION | tr -d 'VERSION [:blank:] ["] [:] [,]'`

#
# Website (for documentation)
#
MORIO_WEBSITE="morio.it"
MORIO_WEBSITE_URL="https://morio.it"


