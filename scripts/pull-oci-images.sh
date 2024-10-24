#!/usr/bin/env bash
docker pull docker.redpanda.com/redpandadata/redpanda:v24.2.7
docker pull smallstep/step-ca:0.27.5
docker pull docker.elastic.co/logstash/logstash:8.15.3
docker pull docker.redpanda.com/redpandadata/console:v2.7.2
docker pull rqlite/rqlite:8.32.3
docker pull traefik:v3.1.6
docker pull docker.elastic.co/beats/heartbeat:8.15.3
