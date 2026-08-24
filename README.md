# Honda Civic Type R FL5 · 3D Cutaway Model

An interactive, fully procedural 3D cutaway model of the Honda Civic Type R (FL5) built with **Three.js** — no external 3D model files, every mesh generated in code.

![Exterior](shots/shot-exterior-release.png)
![Engine Bay](shots/shot-engine-release.png)
![Chassis](shots/shot-chassis-release.png)
![Cabin](shots/shot-cabin-release.png)

## Features

- **Full cutaway anatomy**: K20C1 2.0T engine (red valve cover, intake manifold, turbo, intercooler), 6MT transaxle, half shafts, MacPherson front + multilink rear suspension, Brembo calipers, exhaust with blue heat-shielded header → high-flow cat → triple center-exit tips, radiator, fuel tank, battery, interior (Recaro-style seats, flat-bottom wheel, dash)
- **Sculpted body**: extruded side profile with vertex-sculpted tumblehome, plan taper, wheel-arch muscle bulges; fastback hatch silhouette; Championship White clearcoat paint
- **X-Ray slider**: fade body shell opacity 1→0.05 to reveal internals; BiW framework fades in
- **Explode view**: engine lifts, wheels push out, exhaust drops — all systems separate by direction
- **Cinematic tour**: 8-station auto-flythrough (exterior orbit → dive into engine bay → turbo closeup → follow exhaust to tail → chassis → return) with HUD station names
- **Click any part**: raycaster picks labeled meshes, shows Chinese name tooltip that follows the part
- **Intro camera glide**: 3-second eased entrance on load; auto-rotate until user interacts

## Run Locally

```bash
node serve.js
# open http://localhost:8790
```

No build step, no npm install. Three.js loads via CDN importmap (unpkg).

## Online (GitHub Pages)

No build step needed — the repo root is the site. Once GitHub Pages is enabled on `main` (/), the model is live at:

**https://liooo0.github.io/lio-fl5-3d/**

Note: Three.js loads from the unpkg CDN, so an internet connection is required even for the Pages deployment.

## Tech Notes

- Three.js r160 (ES Modules + importmap)
- Pure procedural geometry: ExtrudeGeometry, CylinderGeometry, TorusGeometry, TubeGeometry, CatmullRomCurve3 — zero model files
- MeshPhysicalMaterial clearcoat for paint; RoomEnvironment PMREM for reflections
- ~38k triangles, PCFSoft shadows (2048 map), ACES tone mapping
- rAF loop wrapped in try/catch with `window.__fl5` test interface

## License

Distributed under the [MIT License](LICENSE).

## Disclaimer

This is an unofficial, non-commercial fan project. It is not affiliated with, sponsored, or endorsed by Honda Motor Co., Ltd. Honda, Civic, and Type R are trademarks of Honda Motor Co., Ltd. All geometry is original procedural approximation built for illustration purposes.

## Verification

See [VERIFICATION.md](VERIFICATION.md) for full automated Playwright verification results (console errors, WebGL check, screenshots, feature probes).
