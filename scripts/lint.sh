#!/bin/bash

# Exit on any error
set -e

# Run eslint in relevant folders
cd api && npm run lint
cd ../core npm run lint
cd ../shared && npm run lint
cd ../config && npm run lint
cd ../ui && npm run lint
