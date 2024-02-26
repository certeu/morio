#!/bin/bash
docker run -it --rm \
  --name logstash-bundler \
  -v /tmp:/tmp \
  docker.elastic.co/logstash/logstash:8.12.1 \
  sh -c "logstash-plugin install logstash-input-rss ; logstash-plugin prepare-offline-pack --output /tmp/bundle.zip --overwrite logstash-input-rss"
