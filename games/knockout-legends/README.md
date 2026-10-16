# Knockout Legends: Street

A street boxing game in the spirit of NBA Street, built on Fight Night Champion-style boxing systems. It's one HTML file using React (HUD) and Three.js (3D).
The fighters, venue and branding are original. No EA assets are used.

Serve this folder over HTTP (for example `npx serve .`) and open `index.html`. The head scan loads from `assets/`, and React, htm and Three.js load from public CDNs.

## The look
- **Venue:** a ring set up on a basketball court under an elevated train line at night. It has graffiti walls, a chain-link fence, wet asphalt, sodium floodlights, neon pink and cyan rim lights, string lights, fire barrels, parked cars, speaker stacks that pump to the beat, a city skyline, and a billboard showing a live side-angle feed.
- **Fighters:** each body is one seamless mesh, generated at load time from a muscle-by-muscle signed-distance description, meshed with surface nets and skinned to 13 bones. The head is a photogrammetry scan.
- **Streetwear:** baggy bottoms are their own sculpted shell. Everything else is painted into a front/back texture atlas, so numbers, prints and tattoos stay sharp.
  - **Marcus "Iron" Vance:** baller shorts with gold drips, "23" and "IRON"; a compression sleeve; socks; a headband; a gold chain with a crown; "Philly" script on his back; and drip-painted gloves.
  - **Dmitri "The Glacier" Volkov:** a ribbed "07" tank top, three-stripe track pants, a paisley do-rag, a silver dog tag, star tattoos, and frost-cracked "ICE" gloves.
  - **Both:** high-top sneakers.
- **Rendering:** a subsurface-style skin shader with sweat, GTAO, depth of field on cinematic shots, bloom, and ACES tone mapping.

## How it plays
- Head, body and stamina ("gas") meters, high and low blocks, slips, counters, and knockdowns with a 10 count.
- **Breaker meter:** fills from combos, counters, slips and showboating. When it's full, press **B** for the Gamebreaker, a wound-up overhand that breaks guards and drains the opponent's meter. The AI uses breakers too.
- **Showboat (T):** fills the meter fast, but you take 1.35× damage if you get caught.
- Announcer callouts, combo counters and a synthesized 92 BPM boom-bap beat (toggle with **X**).
- The simulation runs on a fixed 60 Hz clock, so low frame rates don't turn into slow motion. Graphics drop a level automatically if the frame rate stays low. The game pauses when it loses keyboard focus.

## Controls
| Input | Action |
| --- | --- |
| W A S D | Footwork |
| J / K or left / right click | Jab / cross |
| U / I | Lead hook / rear hook |
| N / M | Lead uppercut / rear uppercut |
| Shift (hold) | Body shots, or block low |
| Space | Block |
| Q / E | Slip left / right |
| T | Showboat |
| B | Gamebreaker |
| C · P · X | Camera · pause · beat |
| Gamepad | Flick the right stick to punch, L1 + R1 for the breaker, click a stick to showboat |

## Credits
- Head scan: "Infinite, 3D Head Scan" by Lee Perry-Smith (Infinite-Realities), licensed CC BY 3.0. It's based on a work at triplegangers.com, and the license text is in `assets/LeePerrySmith_License.txt`.
