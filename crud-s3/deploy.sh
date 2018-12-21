#!bin/bash

./bob/build.sh 3

bn deploy create_or_update
bn deploy read
bn deploy delete
