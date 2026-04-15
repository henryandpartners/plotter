# Generative Tessellation p5 App (Cricut-friendly SVG)

This repository contains a browser-based p5.js sketch that:

- Generates an irregular tessellated pattern.
- Adds hatch lines clipped to each tile.
- Exports all strokes into a single SVG file suitable for Cricut workflows.
- Exposes key variables as UI sliders for rapid design iteration.
- Lets you upload a reference image to drive shape complexity and form deformation.

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

- `Reference Image` — optional image map to drive local form changes.
- `Seed` — deterministic variation of geometry.
- `Tile Size` — macro density of tessellation.
- `Base Sides` — baseline polygon sides for each cell.
- `Distortion` — vertex deformation strength.
- `Image Influence` — blend amount between base shape and image-driven shape complexity.
- `Hatch Spacing` — line spacing for cut/draw density.
- `Hatch Angle` — angle of hatch orientation.

## Output details

The export writes one `<path>` per line segment (tile boundaries + hatch segments) into one SVG.
This is intentionally stroke-only so Cricut Design Space can interpret it cleanly as draw/cut linework.
