# GOBBLE DASH — A Turkey's Great Thanksgiving Escape

[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/mohamad824/turkey-run-game-01-v3/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/mohamad824/turkey-run-game-01-v3/reward.svg)](https://make.fun/c/turkey-run-game-01)

Gus the turkey is on the menu tonight. Run for your life down a bright
three-lane farm track in true 3D — dodge hay bales, crates and fences,
slide under low branches, leap the falling carving knife, and stay ahead
of Farmer Bram and his dog Biscuit. The farmyard gives way to a golden
cornfield, blazing autumn woods, and finally the kitchen itself, where
the red oven glows and the escape ends — one way or another.

**Escape 2,000 m to win. Get caught three times and it is dinner time.**

## How to play

| Key | Action |
| --- | --- |
| ← → or A / D | Switch lane |
| ↑ / W / Space | Jump |
| ↓ / S | Slide (or slam down mid-air) |
| Swipe / click a side | Steer on touch and mouse |
| P | Pause · M | Mute |

Collect golden corn (+10) and rare golden feathers (+50). Grab the red
**magnet** to pull corn in, or the **speedy shoes** for a burst of speed
and a few seconds of invincibility. Every stumble brings Farmer Bram
closer — watch the danger meter. Run clean and he falls back.

## What is inside

- True 3D endless runner (three.js, vendored as one minified file) with
  the camera over Gus's shoulder, Subway-Surfers-style
- Gus the turkey, Farmer Bram and Biscuit the dog, all built from 3D
  primitives with run, jump and slide animation
- Four bright zones with their own palette and scenery: Farmyard,
  Cornfield, Wild Woods, Kitchen
- Hazards: hay bales, crates, fences, low branches, farm carts, the hot
  oven with steam, and carving knives that fall with a red telegraph
- Full HUD: score, distance, zone, speed, three feather lives, farmer
  danger meter, power-up timer
- Title screen, pause, CAUGHT and ESCAPED end screens with restart
- All sound synthesized live with WebAudio — coins, jumps, stumbles,
  a cheerful music loop — no audio files, no network requests

## Run it

Serve `game/` with any static server and open `index.html` in desktop
Chrome. It plays fully offline; every file it loads lives under `game/`.

## Originality

Every name, model, sound and line of game code in this entry was made
for this competition. The only third-party code is three.js r149,
vendored minified under `game/vendor/`.
