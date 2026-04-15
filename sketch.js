const config = {
  seed: 808,
  tileSize: 72,
  distortion: 0.42,
  hatchSpacing: 10,
  hatchAngle: 45,
};

let svgSegments = [];
const CANVAS_SIZE = 900;
const MARGIN = 30;

const controls = {
  seed: document.getElementById('seed'),
  tileSize: document.getElementById('tileSize'),
  distortion: document.getElementById('distortion'),
  hatchSpacing: document.getElementById('hatchSpacing'),
  hatchAngle: document.getElementById('hatchAngle'),
  reroll: document.getElementById('reroll'),
  exportSvg: document.getElementById('exportSvg'),
  seedVal: document.getElementById('seedVal'),
  tileSizeVal: document.getElementById('tileSizeVal'),
  distortionVal: document.getElementById('distortionVal'),
  hatchSpacingVal: document.getElementById('hatchSpacingVal'),
  hatchAngleVal: document.getElementById('hatchAngleVal'),
};

function setup() {
  const cnv = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  cnv.parent('canvas-host');
  noLoop();
  strokeCap(SQUARE);
  wireControls();
  syncLabels();
  redraw();
}

function draw() {
  background('#fffef9');
  stroke('#171717');
  strokeWeight(1);
  noFill();

  randomSeed(config.seed);
  noiseSeed(config.seed);

  svgSegments = [];

  const rows = Math.ceil((height - MARGIN * 2) / config.tileSize);
  const cols = Math.ceil((width - MARGIN * 2) / config.tileSize);

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = MARGIN + c * config.tileSize;
      const y = MARGIN + r * config.tileSize;
      const tile = makeDistortedTile(x, y, config.tileSize, r, c);
      drawPolygon(tile);
      drawPolygonHatch(tile, config.hatchSpacing, radians(config.hatchAngle));
    }
  }
}

function makeDistortedTile(x, y, s, r, c) {
  const jitter = s * config.distortion * 0.35;
  const n = noise(r * 0.17, c * 0.17, config.seed * 0.001);
  const phase = n * TWO_PI;

  return [
    jitteredPoint(x, y, jitter, phase + 0.3),
    jitteredPoint(x + s, y, jitter, phase + 1.1),
    jitteredPoint(x + s, y + s, jitter, phase + 2.2),
    jitteredPoint(x, y + s, jitter, phase + 3.4),
  ];
}

function jitteredPoint(px, py, jitter, phase) {
  return {
    x: px + Math.cos(phase) * jitter,
    y: py + Math.sin(phase) * jitter,
  };
}

function drawPolygon(points) {
  beginShape();
  for (const p of points) {
    vertex(p.x, p.y);
  }
  endShape(CLOSE);

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    addSegment(a.x, a.y, b.x, b.y);
  }
}

function drawPolygonHatch(poly, spacing, angle) {
  const bounds = polygonBounds(poly);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const extent = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 1.6;

  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const normalX = -dirY;
  const normalY = dirX;

  for (let offset = -extent; offset <= extent; offset += spacing) {
    const x1 = centerX + normalX * offset - dirX * extent;
    const y1 = centerY + normalY * offset - dirY * extent;
    const x2 = centerX + normalX * offset + dirX * extent;
    const y2 = centerY + normalY * offset + dirY * extent;

    const clipped = clipSegmentToPolygon({ x: x1, y: y1 }, { x: x2, y: y2 }, poly);
    if (!clipped) continue;

    line(clipped.a.x, clipped.a.y, clipped.b.x, clipped.b.y);
    addSegment(clipped.a.x, clipped.a.y, clipped.b.x, clipped.b.y);
  }
}

function polygonBounds(poly) {
  return poly.reduce(
    (acc, p) => ({
      minX: Math.min(acc.minX, p.x),
      minY: Math.min(acc.minY, p.y),
      maxX: Math.max(acc.maxX, p.x),
      maxY: Math.max(acc.maxY, p.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
}

function clipSegmentToPolygon(a, b, poly) {
  const intersections = [];
  for (let i = 0; i < poly.length; i += 1) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const hit = segmentIntersection(a, b, p1, p2);
    if (hit) intersections.push(hit);
  }

  if (intersections.length < 2) return null;

  intersections.sort((p, q) => dist(a.x, a.y, p.x, p.y) - dist(a.x, a.y, q.x, q.y));
  return { a: intersections[0], b: intersections[intersections.length - 1] };
}

function segmentIntersection(a, b, c, d) {
  const denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
  if (Math.abs(denominator) < 1e-8) return null;

  const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denominator;
  const u = -((a.x - b.x) * (a.y - c.y) - (a.y - b.y) * (a.x - c.x)) / denominator;

  if (t < 0 || t > 1 || u < 0 || u > 1) return null;

  return {
    x: a.x + t * (b.x - a.x),
    y: a.y + t * (b.y - a.y),
  };
}

function addSegment(x1, y1, x2, y2) {
  svgSegments.push({
    x1: Number(x1.toFixed(3)),
    y1: Number(y1.toFixed(3)),
    x2: Number(x2.toFixed(3)),
    y2: Number(y2.toFixed(3)),
  });
}

function exportSvg() {
  const strokeWidth = 1;
  const paths = svgSegments
    .map(
      (s) =>
        `<path d="M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}" fill="none" stroke="#000" stroke-width="${strokeWidth}" />`
    )
    .join('\n');

  const payload = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${paths}
</svg>`;

  const blob = new Blob([payload], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tessellation_seed_${config.seed}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

function wireControls() {
  Object.entries({
    seed: 'seed',
    tileSize: 'tileSize',
    distortion: 'distortion',
    hatchSpacing: 'hatchSpacing',
    hatchAngle: 'hatchAngle',
  }).forEach(([id, key]) => {
    controls[id].addEventListener('input', (event) => {
      const isFloat = key === 'distortion';
      config[key] = isFloat ? parseFloat(event.target.value) : parseInt(event.target.value, 10);
      syncLabels();
      redraw();
    });
  });

  controls.reroll.addEventListener('click', () => {
    const nextSeed = Math.floor(Math.random() * 9999) + 1;
    config.seed = nextSeed;
    controls.seed.value = nextSeed;
    syncLabels();
    redraw();
  });

  controls.exportSvg.addEventListener('click', exportSvg);
}

function syncLabels() {
  controls.seedVal.textContent = config.seed;
  controls.tileSizeVal.textContent = config.tileSize;
  controls.distortionVal.textContent = config.distortion.toFixed(2);
  controls.hatchSpacingVal.textContent = config.hatchSpacing;
  controls.hatchAngleVal.textContent = config.hatchAngle;
}
