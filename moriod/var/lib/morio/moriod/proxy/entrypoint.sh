#!/bin/sh
# A custom entrypoint for the Traefik container used by Morio

# Bail on all errors
set -e

# Update certificates so you can volume-mount Morio's root CA
# and things will 'just work' without having to build a custom image
update-ca-certificates

# first arg is `-f` or `--some-option`
if [ "${1#-}" != "$1" ]; then
    set -- traefik "$@"
fi

# if our command is a valid Traefik subcommand, let's invoke it through Traefik instead
# (this allows for "docker run traefik version", etc)
if traefik "$1" --help >/dev/null 2>&1
then
    set -- traefik "$@"
else
    echo "= '$1' is not a Traefik command: assuming shell execution." 1>&2
fi

exec "$@"
