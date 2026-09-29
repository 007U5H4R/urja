# TC-030 · 3D on a real GPU (manual checklist)

TKT-14 (TASK-18), acceptance criterion 2. Headless Chromium has no GPU. It renders WebGL with SwiftShader, so CI and the cloud VM only see the poster path (TC-029).

The live scene has to be checked by eye on real hardware. The local session does this on the Mac (Metal) against the Vercel preview and fills in the **Result** column: PASS, FAIL or BLOCKED, with a note. Stage 9 repeats rows 12–13 on an older laptop and a phone.

**Automated already (e2e/scene.spec.ts, debug build, guard bypassed under SwiftShader).** These don't need a manual re-check:
- ≤ 1 live context after 10 Today ↔ Trip navigations;
- drag limits, no wheel zoom, and keyboard rotate and reset;
- context loss brings the poster back;
- phone: no drag, pixel ratio 1.25, 44 px buttons;
- three.js loads only on Today, after first paint.

The rows below are about what SwiftShader can't show: how the scene looks and how smoothly it runs.

## Setup
- **Where:** the preview URL for the commit under test (the Today page, `/`), in Chrome and in Safari.
- **Reference:**
  - `.design/exploration/final/index.html` (the hero, same camera as the app).
  - `.design/exploration/final/scene.html` (full-bleed, the poster camera).
  - Open both from the repo in the same browser. They load three@0.169.0 from jsDelivr.
- **Reduced motion:**
  - macOS: System Settings → Accessibility → Display → Reduce motion.
  - Or, in Chrome DevTools: Rendering → Emulate CSS prefers-reduced-motion: reduce.
- **Frame pacing:** Chrome DevTools → Rendering → Frame Rendering Stats (the FPS meter), or the Performance panel.
- **Context count:** the production preview doesn't expose `window.__urjaGL`, because only `NEXT_PUBLIC_DEBUG_GL=1` builds do. Row 11 uses `chrome://gpu` and the console instead.

## Checklist

| # | Check | How | Expected | Result |
|---|---|---|---|---|
| 1 | Poster first, then the scene | Hard-reload `/` with DevTools → Network → "Fast 4G". | The poster shows at once, with no empty box and no layout shift. After a moment the live canvas fades in over it (0.6 s). The scene tag then appears above the truck: "Reconstruction from GPS + fuel sensor". | |
| 2 | Composition vs final/ | Compare the live hero, side by side, with `final/index.html` at 1440 px. | High three-quarter camera from the front-left. The truck is on the left shoulder of NH48, left of the glass card and clear of the rail. Traffic light-trails run behind it (warm headlights toward the camera, red tail lights away). The dhaba lamp pool is on the road. The fuel tank is lit red, with its red pool. Yellow plates read RJ14 GB 4521. | |
| 3 | Look and finish | Same view. | Bloom on the edge strips and amber marker lamps. ACES tone mapping (no clipped whites). Soft reflections on the dark cab. Fog fades the far road. Nothing looks flat, banded or aliased. | |
| 4 | Motion | Watch for about 30 s without touching anything. | The trails move. The tank and its pool pulse slowly (about 2.3 s). The camera sways gently (±0.1 rad over about 28 s). | |
| 5 | Drag to orbit, within limits | Drag with the mouse and then the trackpad: far left, far right, up, down. | It orbits smoothly, with damping. It stops at the azimuth limits (±0.75 rad) and the polar limits (0.72–1.18 rad), so you never go under the road or overhead. The sway resumes about 6 s after the drag. | |
| 6 | No zoom, no pan | Scroll the wheel and pinch on the trackpad over the scene. Try right-drag and shift-drag. | The camera never zooms or pans. The wheel scrolls the page. | |
| 7 | Keyboard rotate and reset | Tab to the buttons at the top-left of the scene: "Rotate the scene left", "Rotate the scene right", "Reset the scene view". Press Enter and Space. | Each press turns one step, and it stops at the limit. Reset returns to the framing in row 2. The focus ring is visible. The buttons are hidden in the Map and Fleet views. | |
| 8 | Screen reader | VoiceOver (⌘F5) on the hero. | It reads the container's description ("3D scene of truck RJ14 GB 4521 parked 1.6 km off NH48 near Behror …"). It says nothing for the canvas. The three buttons are announced by name. | |
| 9 | Reduced motion | Turn on Reduce motion, then reload `/`. | The camera is static, the trails are frozen and nothing pulses. Dragging and the buttons still move the view, one frame per change. | |
| 10 | View switch | Scene → Map → Fleet → Scene. | Leaving Scene pauses the scene (DevTools Performance shows no rAF work). Coming back resumes it without a reload or a flash. | |
| 11 | 10 navigations | Today → "Open the evidence" → the "Today" crumb, 10 times. Then check the console, and `chrome://gpu` → "Active WebGL contexts" if shown. | There are no WebGL warnings ("Too many active WebGL contexts") and no errors. Each return shows the scene again. The tab's memory (Task Manager) doesn't climb with each round. | |
| 12 | Frame pacing (Mac) | FPS meter on `/` at 1440 px for 30 s, then while dragging. | Record the FPS and a subjective note. It should feel smooth, with no dropped-frame hitches while dragging. | |
| 13 | Frame pacing (older laptop; Stage 9) | Same, on the older laptop. | Record the FPS and a note. If a software renderer is reported, the poster stays (this is expected). | |
| 14 | Phone (Stage 9) | Open `/` on a phone, then scroll through the hero with a vertical swipe. | The page scrolls, because the scene never takes the gesture. There is no drag orbit. The camera is pulled back (a wider shot). The 44 px buttons turn the view. The scene tag is hidden (≤ 760 px). | |
| 15 | Tab hidden | Switch to another tab for 10 s, then back. | While hidden, the loop stops (no GPU use). On return it resumes cleanly. | |

## Notes
- **Fallback path:** the GPU guard shows the poster when the renderer string matches `/swiftshader|llvmpipe|software|basic render/i`, when WebGL2 is missing, or when the context is lost. The poster then carries the scene tag at the top-left.
- **Run details:** record the browser and OS versions, the preview commit, and the date.
