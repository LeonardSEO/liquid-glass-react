# README film

The GIF at the top of the project readme (`docs/demo.gif`), made with
[HyperFrames](https://hyperframes.heygen.com) from recordings of the live demo.

1. Start the demo: `cd demo && npm run dev -- --port 5179`.
2. Record the shots frame by frame and encode them into `assets/`:
   ```bash
   cd docs/film/recorder
   npm install
   npm run record   # or: node shots.mjs switch
   npm run encode
   ```
   The recorder drives Chrome with a fake clock, so the springs and CSS
   transitions land on exact frames at 30 fps.
3. Preview and edit the film: `cd docs/film && npx hyperframes preview`.
4. Render and shrink it for the readme:
   ```bash
   npx hyperframes render --format gif --fps 15 --gif-loop 0 -o renders/readme.gif
   ffmpeg -i renders/readme.gif -vf "scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" -loop 0 ../demo.gif
   ```

`SPEC.md` describes the film shot by shot; `REVIEW.md` records what was checked.
