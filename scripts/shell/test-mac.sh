#!/bin/bash

. scripts/shell/env-mac.sh

npm run build:debug

npm run test
