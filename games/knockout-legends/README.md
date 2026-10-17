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

## Bodies, trunks, gloves and boots
- **Bodies and body types:** the MakeHuman base mesh (CC0), blended at load from MakeHuman's own targets: the 3×3 muscle-by-weight grid, ancestry (african, caucasian, asian) and ideal proportions. Six presets (Shredded, Athletic, Muscular, Heavyweight, Big man, Lean) can be picked per fighter in the menu. The Live Editor `fighters` table also has `bodytype`, `muscle` and `weight`, and changing them rebuilds the fighter. The mesh is smoothed with one Catmull-Clark pass and skinned with MakeHuman's artist weights, folded onto the game's 15 bones. `tools/mh_convert.py` regenerates `assets/mhbody.js` from a MakeHuman checkout.
- **Trunks:** the uploaded Marvelous Designer garment, converted with `tools/trunks_convert.py`. The converter keeps the main panels only (no stitch meshes, no inner duplicate layer) and grows the textures past each panel's edge. At load the trunks are fitted to each body: the waist is matched, the cloth is widened wherever the hips are fuller, the legs are centred on the thighs, and any cloth inside the skin is pushed out. They're skinned with weights borrowed from the body and sway on a spring. There are red and navy colourways.
- **Gloves:** sculpted as a signed-distance shape and meshed with surface nets. The shape has a padded fist, a knuckle roll, fingers curled over the palm, a thumb fused along the inside, and a strapped cuff. They're skinned with generated leather maps: grain, piped side seams with twin stitching, a contrast strap with a patch, and scuffs on the punching face.
- **Boots:** lofted from cross-sections measured off each fighter's foot and calf. The upper texture adds perforated vent panels, stitched panel seams, a toe cap and a heel counter. There's a laced tongue panel and a padded collar.
- **Footwork:** feet stay planted on the canvas and step when the body drifts off them, and the weight shifts onto the planted foot. The rear heel lifts and pivots on rear-hand punches and the lead foot pivots on the lead hook. The hips turn before the shoulders.

## Motion capture
- **Live guard:** the between-punches motion (pelvis bob and sway, hip, chest and head movement, glove drift) comes from real shadowboxing takes in the CMU Graphics Lab Motion Capture Database (13_17 orthodox; 15_13 southpaw, mirrored). `tools/bake_guard.py` (with `tools/bvh.py`) bakes the guard-only stretches into `assets/mocap_guard.js`: a 10.9 s loop of deviations from the mean pose. It's layered over the procedural stance at `MOCAP_GAIN` and fades out while punching, blocking, hurt or down. Punches, footwork stepping and hit reactions stay procedural.
- To rebake: get the BVH conversion from github.com/una-dinosauria/cmu-mocap, then run `python3 tools/bake_guard.py tools assets/mocap_guard.js '[["…/13_17.bvh",6.0,2.4,0], …]'`. Each entry is file, start s, duration s, mirror.

## Credits
- Motion: CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), free to use; BVH conversion by B. Hahne.
- Bodies: MakeHuman base mesh, rig weights and shape targets, CC0 1.0 ([makehumancommunity/makehuman](https://github.com/makehumancommunity/makehuman)). See `assets/MakeHuman_LICENSE_CC0.md`.
- Head scan: "Infinite, 3D Head Scan" by Lee Perry-Smith (Infinite-Realities), licensed CC BY 3.0. It's based on a work at triplegangers.com, and the license text is in `assets/LeePerrySmith_License.txt`.
