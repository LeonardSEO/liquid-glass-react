# Review: README film

## Creative calls

- Storyline "physics, then controls", chosen by the person: the lab proves the glass
  bends light, then the same lens appears in a switch, a slider and a menu. Not built:
  a fast tour of the controls, and one continuous macro shot.
- Every shot is the real demo in Chromium, recorded frame by frame by a Playwright
  script with a fake clock (springs) and paused CSS animations (transitions), at 2x for
  the lab and 4x for the controls. Nothing on screen is redrawn. The recorder lives
  outside the repo; its shots are described in SPEC.md.
- One window holds all four recordings and swaps them with a 0.15 s blur, so the frame
  never cuts. The end card is the only second scene.
- No sound: the deliverable is a GIF for the README and npm.

## Measured

- `hyperframes check`: no errors. Text sizes, contrast, layout and motion pass.
- QA frames at 2.6, 5.4, 8.6, 11.8 and 15.9 s match SPEC.md: bent letters under the
  pill, the Wi-Fi capsule as a clear lens, the slider track stretched past its end, the
  open menu with readable items, the finished end card.
- Only looked at, not measured: the feel of the springs at 15 fps in the GIF.

## Fixed in review

- t=5.4 · switch shot · a grey band filled the left fifth of the window and the panel sat
  off centre → re-recorded with the crop on the four rows.
- t=8.6 · slider shot · the lower 40 % was empty ground → re-recorded around the
  last three rows and the slider.
- end card · the last two lines were on screen under the read time → card 2.5 → 3 s,
  the sub line cut to six words.
- menu shot · the menu never opened: a press held across frames counted as a second
  click in Base UI → a plain click.

## Warnings kept on purpose

- `film_silent`: a GIF has no sound.
- `nested_media_start_basis_ambiguous` (three clips): their starts are local to the demo
  scene, which itself starts at 0, so local and film time are the same.
- `timeline_track_too_dense`: the four recordings share one window by design; splitting
  them into scenes would cut the frame at every swap.

## Weakest shot

The lab shot: the pill passes the squircle and the orb, which crowd the headline, and the
crop clips the tiny "Material study" label at the top. With more time: hide the other two
lenses for this shot and frame the headline alone.
