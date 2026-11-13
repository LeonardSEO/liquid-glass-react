# README film: Liquid Glass for React

GOAL:    a developer scrolling the README sees in one loop that this glass really bends
         light, and that the same lens drives real controls they can install.
OUTPUT:  HyperFrames, 1280 x 720, 30 fps; delivered as a looping GIF at 15 fps (README and npm).
TIME:    about 14 s x 30 = ~420 frames. No sound (a GIF has none).

LOOK:    the project's own site: ground paper #f6f7f2, ink #202322, muted #626762.
         One accent, lime #bcf279, only on the install command in the end card.
         Display: Inter 700, 40 px, tracking -0.025em, left aligned at x 128.
         Mono: JetBrains Mono 400, 22 px, for the install command only.
         Medium: real product UI in Chromium, recorded frame by frame at 2x-4x
         (frames/), shown in one window of 1024 x 576 at x 128, y 120,
         radius 22 px, shadow 0 18px 50px rgba(32,35,34,0.14).
         No grain, no vignette, no gradients of our own: the wallpaper inside
         the recordings is the only colour.

OBJECTS: the glass lab with the clear pill lens over the headline "Liquid in motion";
         the settings panel with real switches and the brightness slider;
         the Safari-like scene with its toolbar and the tabs menu. All recorded
         from the live demo, never redrawn.

MOTION:  enter: per-word blur 6 px -> 0 and opacity 0 -> 1 over 0.13 s, 0.07 s apart, no translate;
         exit: blur 0 -> 6 px and opacity -> 0 in 0.15 s;
         window swap: blur swap on one stage, out 0.15 s, in 0.15 s, the frame never cuts;
         end card: the window scales 1 -> 0.94 and fades in 0.35 s power3.in while the
         title lands; lines land dead still.

SHOTS:
  1. 0.0-4.4   lab: the clear pill lens lifts and slides across "in motion"; the letters
               bend under its rim. Reads: "Real glass bends light." (4 words, 1.7 s)
  2. 4.4-7.3   switch: Wi-Fi is held, its capsule lifts into a lens, then slides off;
               Airplane Mode toggles on with a tap. Reads: "Switches lift into glass."
  3. 7.3-10.6  slider: the thumb becomes a lens, is dragged past the end so the track
               stretches, and back. Reads: "Sliders stretch with it."
  4. 10.6-13.4 menu: the tabs button grows into a menu, the pointer moves over it, and
               it shrinks back into the button. Reads: "Menus grow out of the button."
  5. 13.4-16.0 end card: "Liquid Glass for React" and the install command, held 2 s,
               then the loop restarts on shot 1.

BANNED:  the spec.md defaults; a title over a dimmed screenshot; captions on top of the
         recordings; pill chips or "01 / 02" labels; a logo in a corner; anything fading
         and sliding up; text that moves while it is read; invented UI.

QA:      t=2.6 the pill sits on "in motion" with visibly bent letters;
         t=5.4 the Wi-Fi capsule is a clear lens; t=8.6 the slider track is stretched
         past its end; t=11.8 the menu is open with readable items;
         t=14.6 the end card is complete and still; every line >= 19 px (2.6% of 720).
