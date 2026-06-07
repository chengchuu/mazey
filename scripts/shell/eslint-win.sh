#!/bin/bash

. scripts/shell/env-win.sh

npx eslint "./src/**/*.ts" --ext "js,ts,tsx" --fix
npx eslint "./test/**/*.js" --ext "js,ts,tsx" --fix
npx eslint "./scripts/**/*.js" --ext "js,ts,tsx" --fix
npx eslint "./*.js" --ext "js,ts,tsx" --fix
npx eslint "./*.ts" --ext "js,ts,tsx" --fix
