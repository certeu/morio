#!/bin/bash

# We need to juggle some folders and files for everything to work
# This is a lot simpler in bash than JS so here we go

# Ensure there is a local folder
mkdir -p ./local

# The API unit tests will write their coverage report and logs here
# But this runs inside the API container with UID 2112 so we need to
# make sure that this will work by pre-creating these files and chowning them
mkdir -p ./api/coverage/tmp
sudo chown -R 2112 ./api/coverage
sudo touch ./local/api_tests.json
sudo touch ./local/api_test_logs.ndjson
sudo chown 2112 ./local/api_test*

# The Core unit tests will write their coverage report and logs here
# But this runs inside the API container with UID 0 (root) so we need to
# make sure that this will work by pre-creating these files and chowning them
mkdir -p ./core/coverage/tmp
sudo chown -R root ./core/coverage
sudo touch ./local/core_tests.json
sudo touch ./local/core_test_logs.ndjson
sudo chown root ./local/core_test*

