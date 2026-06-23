#!/bin/sh
# Nightly: pull latest Garmin data, then update the secret gist.
cd /Users/matthewwalmsley/roc || exit 1
/Users/matthewwalmsley/.local/bin/uv run --with garminconnect python sync/sync.py
/usr/bin/python3 sync/deploy.py --sync
