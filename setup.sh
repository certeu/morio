#!/bin/bash
curl --insecure \
  -H 'Content-Type: application/json' \
  -d '{
    "deployment": {
      "node_count": 1,
      "nodes": [ "poc-morio-node1.cert.europa.eu" ],
      "display_name": "POC"
    }
  }' \
  https://poc-morio-node1.cert.europa.eu/ops/api/deploy | jq
