# Generative Tessellation p5 App (Cricut-friendly SVG)

This repository contains a browser-based p5.js sketch that:

- Generates an irregular tessellated pattern.
- Adds hatch lines clipped to each tile.
- Exports all strokes into a single SVG file suitable for Cricut workflows.
- Exposes key variables as UI sliders for rapid design iteration.

## Run locally

Because this project is static HTML/JS, open `index.html` directly or run a simple local server:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Deploy (GitHub Pages)

A GitHub Actions workflow is included at `.github/workflows/deploy-pages.yml`.

### One-time setup

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Ensure your default deployment branch is `main` (or update the workflow trigger accordingly).

### Deploy flow

- Every push to `main` deploys automatically.
- You can also trigger deploy manually from **Actions → Deploy static site to GitHub Pages → Run workflow**.

## Adjustable design variables

- `Seed` — deterministic variation of geometry.
- `Tile Size` — macro density of tessellation.
- `Distortion` — vertex jitter intensity per tile.
- `Hatch Spacing` — line spacing for cut/draw density.
- `Hatch Angle` — angle of hatch orientation.

## Reference-oriented notes for next iteration

To align with your research goals, the current code was structured to make it easy to add these ideas:

1. **GeoGebra / Desmos style parameterization**
   - Add expression-based parameters (e.g., `tileSize = a + b * sin(t)`).
   - Add constraints and dependent variables so controls can drive formulas.
2. **vsketch-inspired plotting**
   - Add geometric simplification and path optimization (merge collinear segments, minimize travel).
   - Add optional vpype post-processing pipeline after SVG export.
3. **Turtle graphics influence**
   - Add a turtle DSL layer for motif drawing inside each tile.
   - Reuse motifs via transforms (rotation, reflection, translation).
4. **Escher-like tessellation exploration (Tess/Nanocosmos direction)**
   - Move from jittered quads to edge-matching prototiles.
   - Store opposite-edge constraints to keep seamless tiling while deforming tile boundaries.

## Output details

The export currently writes one `<path>` per line segment (tile boundaries + hatch segments) into one SVG.
This is intentionally stroke-only so Cricut Design Space can interpret it cleanly as draw/cut linework.
