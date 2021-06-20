#!/bin/bash

clasp deploy \
    -V $(clasp versions | tail -1 | sed 's;\([0-9]\+\).*;\1;') \
    -i "AKfycbykchbkd73ELDwQUNoEjrXYWdRcXhEQ3wFE-wascm6r8z88X_cMmuLl9_txXPUO4iRM" \
    -d "release"
