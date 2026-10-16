# Knockout Legends

A browser boxing game modeled on Fight Night Champion's systems. It's one HTML file using React (HUD) and Three.js (arena).
The fighters, arena and branding are original. No EA assets are used.

Open `index.html` in a browser; it loads React, htm and Three.js from public CDNs.

## What's in it
- **Rendering:** ACES tone mapping, a PBR skin shader with sweat that builds up over the fight, a soft-shadowed key light, volumetric light beams, bloom, chromatic aberration, film grain, and a jumbotron showing a live side-angle feed
- **Fighters:** procedural rigs with two-bone IK arms and legs. Punches aim at the opponent's real head and body positions
- **Systems:** head/body/stamina meters with permanent damage caps, blocking high and low, slips, counters for 1.55× damage, stun and wobble, slow-mo knockdowns with a 10 count and a mash-to-rise meter, three knockdowns = TKO, rounds scored 10-point-must by three judges
- **Input:** keyboard, gamepad (flick the right stick to punch) and on-screen touch controls

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
