## Run in Debian 12 (bookworm)
FROM debian:12

# Make this folder our working directory
WORKDIR /morio

# Add builder script as custom entrypoint
COPY ./entrypoint.sh /entrypoint.sh

## Run the builder script
CMD ["/entrypoint.sh"]
