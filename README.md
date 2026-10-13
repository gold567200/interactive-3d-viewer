# Interactive 3D Product Viewer

A self-contained, dependency-free **3D product viewer for the web**, built with [three.js](https://threejs.org). Drag to rotate, scroll to zoom, and swap nine finishes live — metals and faceted crystals rendered in real time in the browser.

This is the viewer that powers the **Interactive 3D** service at Golden Rock → <https://goldenrockadvancements.com/3d/>.

![finishes: gold · rose gold · platinum · obsidian · diamond · emerald · sapphire · ruby · amethyst](https://img.shields.io/badge/finishes-9-caa35a) ![no build step](https://img.shields.io/badge/build-none-brightgreen) ![no CDN](https://img.shields.io/badge/external%20calls-0-brightgreen)

## What it does

- **Real-time 3D** — orbit, zoom and inspect a product model, not a looping video.
- **Live material swap** — nine finishes: metals (`MeshStandardMaterial`) and crystals with physical transmission (`MeshPhysicalMaterial`).
- **Studio lighting** — image-based lighting via a PMREM-prefiltered `RoomEnvironment`, ACES filmic tone mapping.
- **Labelled hotspots** that track the model as it turns, with auto-spin and a reset view.
- **Device-gated for performance** — the 3D engine loads only on a capable desktop (fine pointer, ≥900px, WebGL2, not Save-Data). Phones, metered connections and reduced-data users get a clean static fallback and **never download the 1.3 MB engine**.
- **Self-hosted and CSP-clean** — external ES modules only, no inline scripts, **no CDN, no third-party calls**. Works under a strict `script-src 'self'` Content-Security-Policy, which is why it's safe to embed in a real site via a same-origin iframe.

## Run it

ES modules must be served over `http://` (opening `index.html` directly from `file://` will block the module imports). From the repo folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open the **live demo** (GitHub Pages) linked at the top of this repository.

> Best viewed on a desktop browser — on phones you'll see the lightweight static fallback by design.

## How it's built

| | |
|---|---|
| Rendering | three.js (r160, vendored — see [THIRD_PARTY.md](THIRD_PARTY.md)) |
| Materials | `MeshStandardMaterial` (metals) · `MeshPhysicalMaterial` with `transmission` (crystals) |
| Controls | `OrbitControls` (damped, no pan) |
| Lighting | `PMREMGenerator` + `RoomEnvironment`, two directional lights |
| Framework | none — plain ES modules, zero dependencies to install |
| Fonts | self-hosted Cormorant Garamond (OFL) |

```
index.html          the viewer page (inline CSS, device gate + static fallback)
app.js              the viewer module (scene, materials, controls, hotspots)
three.module.js     three.js r160 (minified, vendored)
OrbitControls.js    three.js addon (import rewritten to the local module)
RoomEnvironment.js  three.js addon (import rewritten to the local module)
fonts/              Cormorant Garamond woff2
```

Swapping in a real client product is a matter of replacing the generated geometry with a loaded `.glb`/`.gltf` and mapping the finish list to that product's materials.

## About

Built by **Tyler Milam / Golden Rock** — I build real interactive 3D into client websites (product viewers, live configurators, 3D hero scenes). This repo is a compact, honest example of the approach, extracted from a viewer running in production.

## License

[MIT](LICENSE) © 2026 Tyler Milam (Golden Rock). Third-party components retain their own licenses — see [THIRD_PARTY.md](THIRD_PARTY.md).
