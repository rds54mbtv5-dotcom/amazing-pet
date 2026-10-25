#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo 'Please install Node.js 24 LTS from https://nodejs.org and try again.'
  read -r -p 'Press Enter to close...'
  exit 1
fi
if [ ! -f node_modules/electron/package.json ]; then
  npm ci || { read -r -p 'Installation failed. Press Enter to close...'; exit 1; }
fi
npm run start:desktop || { read -r -p 'Startup failed. Press Enter to close...'; exit 1; }
