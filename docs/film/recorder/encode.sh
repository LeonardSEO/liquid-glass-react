#!/bin/sh
# Turns each shot's PNG frames into a 30 fps clip in the film's assets.
set -e
out=../assets
mkdir -p "$out"
for shot in "$@"; do
  ffmpeg -loglevel error -y -framerate 30 -pattern_type glob -i "frames/$shot/*.png" \
    -vf "scale=2048:1152:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 14 -movflags +faststart \
    "$out/$shot.mp4"
  echo "$shot: $(ls frames/$shot | wc -l | tr -d ' ') frames"
done
