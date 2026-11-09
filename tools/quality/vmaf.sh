#!/usr/bin/env bash
set -euo pipefail

# WhatMedia VMAF Shell Runner
# Executes the Node.js VMAF measurement suite with system FFmpeg

echo "Running WhatMedia Quality Benchmarking Suite..."
node "$(dirname "$0")/measure.mjs"

