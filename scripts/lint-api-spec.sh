#!/usr/bin/env bash
# Sounce config variables
source config/cli.sh

npx -y rmoa lint --filename ./docs/static/oas-api.yaml --minimum-score 95 --api-key=$RMOA_API_KEY

