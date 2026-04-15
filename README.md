# Generative Tessellation p5 App (Cricut-friendly SVG)

This repository contains a browser-based p5.js sketch that:

- Generates irregular tile-based compositions.
- Supports multiple shape families (`polygon`, `star`, `petal/flower`, and `auto blend`).
- Supports multiple patterning functions (`single hatch`, `cross hatch`, `concentric rings`).
- Exports all strokes into a single SVG file suitable for Cricut workflows.
- Lets you upload a reference image to drive local shape complexity and pattern expression.

## Run locally

Because this project is static HTML/JS, open `index.html` directly or run a simple local server:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Deploy (GitHub Pages)

A GitHub Actions workflow is included at `.github/workflows/deploy-pages.yml`.

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually) to publish.

## Adjustable design variables

- `Reference Image` — optional image map to drive local form changes.
- `Shape Mode` — choose `auto`, `polygon`, `star`, or `petal` forms.
- `Pattern Mode` — choose `single hatch`, `cross hatch`, or `concentric rings`.
- `Seed` — deterministic variation of geometry.
- `Tile Size` — macro density of tessellation.
- `Base Sides` — baseline complexity for shape generation.
- `Distortion` — vertex deformation strength.
- `Image Influence` — blend amount between baseline and image-driven modulation.
- `Motif Density` — number of concentric layers / motif repetitions.
- `Hatch Spacing` and `Hatch Angle` — line-based pattern tuning.

## Output details

The export writes one `<path>` per line segment (shape boundaries + motif lines) into one SVG.
This is intentionally stroke-only so Cricut Design Space can interpret it as draw/cut linework.
