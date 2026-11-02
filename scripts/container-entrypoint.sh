#!/bin/sh
set -eu
app_data="${DATA_DIR:-/app/data}"
mkdir -p "$app_data"
if [ "$(id -u)" = "0" ]; then
  chown node:node "$app_data"
  exec gosu node "$@"
fi
exec "$@"
