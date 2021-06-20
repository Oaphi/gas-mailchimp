#!/bin/bash

version=$(cat package.json | grep -e "\"version\":\s\+\"[0-9]\+" | sed "s/.*\([0-9]\+\.[0-9]\+\.[0-9]\+\).*/\1/")

clasp version $version