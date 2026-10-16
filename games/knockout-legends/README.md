# Knockout Legends

A browser boxing game modeled on Fight Night Champion's systems. It's one HTML file using React (HUD) and Three.js (arena).
The fighters, arena and branding are original. No EA assets are used.

Serve this folder over HTTP (for example `npx serve .`) and open `index.html`. The head scan loads from `assets/`, and React, htm and Three.js load from public CDNs.

## What's in it
- **Fighters' bodies:** each one is a single seamless mesh. It's generated at load time from a muscle-by-muscle signed-distance description (pecs, delts, lats, abs, quads, calves and so on), meshed with surface nets and skinned to 13 bones
- **Heads:** a photogrammetry head scan with its colour and normal maps, retinted per fighter and trimmed at the neck
- **Skin:** a wrapped-diffuse subsurface approximation (light bleeds red past the shadow line), with sheen and a sweat clearcoat that builds up over the fight
- **Rendering:** ground-truth ambient occlusion (GTAO), depth of field on cinematic shots, ACES tone mapping, a PBR skin shader with sweat that builds up over the fight, a soft-shadowed key light, volumetric light beams, bloom, chromatic aberration, film grain, and a jumbotron showing a live side-angle feed
- **Fighters:** procedural rigs with two-bone IK arms and legs. Punches aim at the opponent's real head and body positions
- **Systems:** head/body/stamina meters with permanent damage caps, blocking high and low, slips, counters for 1.55× damage, stun and wobble, slow-mo knockdowns with a 10 count and a mash-to-rise meter, three knockdowns = TKO, rounds scored 10-point-must by three judges
- **Input:** keyboard, gamepad (flick the right stick to punch) and on-screen touch controls

## Live Editor (F1 or `)
An in-game overlay modelled on the community live editors for EA titles, editing only this game's own data:
- **Tables:** `fighters`, `look` (sweat, damage, pores, exposure), `lights`, `post`, `match`. They use a record cursor like `LE.db:GetTable("players")`: `GetFirstRecord`, `GetNextValidRecord`, `GetRecordFieldValue`, `SetRecordFieldValue`.
- **Events:** `AddEventHandler(name, fn)` for `fight_start`, `round_start`, `round_end`, `punch_thrown`, `punch_landed`, `punch_blocked`, `knockdown`, `get_up`, `fight_over` and `tick`. Use `'*'` to get all of them.
- **Scripts:** JavaScript, with examples (log every event, iron chin, sweat per round, broadcast lighting test). Also reachable from the browser console as `window.LE`.
- **Presets:** saved in this browser, or copied out and pasted in as JSON. Each preset carries a schema number, and the editor refuses presets whose schema doesn't match.

## Controls
| Key | Action |
| --- | --- |
| W A S D | Footwork |
| J / K | Jab / cross |
| U / I | Lead hook / rear hook |
| N / M | Lead uppercut / rear uppercut |
| Shift + punch | Body shot |
| Space (+ Shift) | Block high (low) |
| Q / E | Slip left / right |
| C / P | Camera / pause |
| F1 or ` | Live Editor |

## Credits
- Head scan: "Infinite, 3D Head Scan" by Lee Perry-Smith (Infinite-Realities), licensed CC BY 3.0. It's based on a work at triplegangers.com, and the license text is in `assets/LeePerrySmith_License.txt`.
