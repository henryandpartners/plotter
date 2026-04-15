const config = {
  seed: 808,
  tileSize: 72,
  shapeSides: 5,
  distortion: 0.42,
  imageInfluence: 0.65,
  motifDensity: 5,
  hatchSpacing: 10,
  hatchAngle: 45,
  shapeMode: 'auto',
  patternMode: 'hatch',
};

let svgSegments = [];
let sourceImage = null;

const CANVAS_SIZE = 900;
const MARGIN = 30;

const controls = {
  sourceImage: document.getElementById('sourceImage'),
  seed: document.getElementById('seed'),
  tileSize: document.getElementById('tileSize'),
  shapeSides: document.getElementById('shapeSides'),
  distortion: document.getElementById('distortion'),
  imageInfluence: document.getElementById('imageInfluence'),
  motifDensity: document.getElementById('motifDensity'),
  hatchSpacing: document.getElementById('hatchSpacing'),
  hatchAngle: document.getElementById('hatchAngle'),
  shapeMode: document.getElementById('shapeMode'),
  patternMode: document.getElementById('patternMode'),
  reroll: document.getElementById('reroll'),
  exportSvg: document.getElementById('exportSvg'),
  seedVal: document.getElementById('seedVal'),
  tileSizeVal: document.getElementById('tileSizeVal'),
  shapeSidesVal: document.getElementById('shapeSidesVal'),
  distortionVal: document.getElementById('distortionVal'),
  imageInfluenceVal: document.getElementById('imageInfluenceVal'),
  motifDensityVal: document.getElementById('motifDensityVal'),
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
      const tone = sampleImageTone(x + config.tileSize * 0.5, y + config.tileSize * 0.5);
      const poly = makeShape(x, y, config.tileSize, r, c, tone);
      drawPolygon(poly);
      drawTilePattern(poly, tone);
    }
  }
}

function makeShape(x, y, s, r, c, tone) {
  const mode = resolveShapeMode(tone);
  if (mode === 'star') return makeStarPolygon(x, y, s, r, c, tone);
  if (mode === 'petal') return makePetalPolygon(x, y, s, r, c, tone);
  return makePolygon(x, y, s, r, c, tone);
}

function resolveShapeMode(tone) {
  if (config.shapeMode !== 'auto') return config.shapeMode;
  if (tone < 0.35) return 'star';
  if (tone > 0.7) return 'petal';
  return 'polygon';
}

function makePolygon(x, y, s, r, c, tone) {
  const cx = x + s * 0.5;
  const cy = y + s * 0.5;
  const targetSides = map(tone, 0, 1, 3, 10);
  const sides = constrain(Math.round(lerp(config.shapeSides, targetSides, config.imageInfluence)), 3, 10);

  const baseRadius = s * 0.45;
  const jitterAmp = s * 0.28 * config.distortion;
  const rotation = noise(r * 0.2, c * 0.2, config.seed * 0.001) * TWO_PI;

  const points = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (TWO_PI * i) / sides;
    const toneWarp = Math.sin(angle * 2.0 + tone * TWO_PI) * config.imageInfluence;
    const radius = baseRadius + noise(c * 0.2 + i, r * 0.2 + i, config.seed * 0.01) * jitterAmp + toneWarp * jitterAmp;

    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }

  return points;
}

function makeStarPolygon(x, y, s, r, c, tone) {
  const cx = x + s * 0.5;
  const cy = y + s * 0.5;
  const spikes = constrain(Math.round(lerp(config.shapeSides, map(tone, 0, 1, 4, 9), config.imageInfluence)), 4, 10);
  const outer = s * 0.46;
  const inner = outer * lerp(0.28, 0.62, tone);
  const rotation = noise(r * 0.13, c * 0.13, config.seed * 0.002) * TWO_PI;

  const points = [];
  for (let i = 0; i < spikes * 2; i += 1) {
    const angle = rotation + (TWO_PI * i) / (spikes * 2);
    const radiusBase = i % 2 === 0 ? outer : inner;
    const radius = radiusBase + random(-1, 1) * config.distortion * s * 0.08;

    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }

  return points;
}

function makePetalPolygon(x, y, s, r, c, tone) {
  const cx = x + s * 0.5;
  const cy = y + s * 0.5;
  const steps = 24;
  const petals = constrain(Math.round(lerp(config.shapeSides, map(tone, 0, 1, 4, 12), config.imageInfluence)), 3, 12);
  const rotation = noise(r * 0.17, c * 0.17, config.seed * 0.003) * TWO_PI;
  const base = s * 0.34;

  const points = [];
  for (let i = 0; i < steps; i += 1) {
    const angle = rotation + (TWO_PI * i) / steps;
    const wave = 0.5 + 0.5 * Math.sin(angle * petals);
    const radius = base + wave * s * 0.15 + random(-1, 1) * config.distortion * s * 0.05;

    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }

  return points;
}

function sampleImageTone(x, y) {
  if (!sourceImage || !sourceImage.width || !sourceImage.height) return 0.5;

  const u = constrain(x / width, 0, 1);
  const v = constrain(y / height, 0, 1);
  const ix = Math.floor(u * (sourceImage.width - 1));
  const iy = Math.floor(v * (sourceImage.height - 1));
  const pixel = sourceImage.get(ix, iy);
  return (pixel[0] + pixel[1] + pixel[2]) / (3 * 255);
}

function drawTilePattern(poly, tone) {
  if (config.patternMode === 'cross') {
    drawPolygonHatch(poly, config.hatchSpacing, radians(config.hatchAngle));
    drawPolygonHatch(poly, config.hatchSpacing, radians(config.hatchAngle + 90));
    return;
  }

  if (config.patternMode === 'concentric') {
    drawConcentricPattern(poly, tone);
    return;
  }

  drawPolygonHatch(poly, config.hatchSpacing, radians(config.hatchAngle));
}

function drawConcentricPattern(poly, tone) {
  const center = polygonCenter(poly);
  const steps = Math.max(2, Math.round(config.motifDensity + tone * config.motifDensity));

  for (let i = 1; i <= steps; i += 1) {
    const t = i / (steps + 1);
    const ring = poly.map((p) => ({
      x: lerp(p.x, center.x, t),
      y: lerp(p.y, center.y, t),
    }));

    for (let k = 0; k < ring.length; k += 1) {
      const a = ring[k];
      const b = ring[(k + 1) % ring.length];
      line(a.x, a.y, b.x, b.y);
      addSegment(a.x, a.y, b.x, b.y);
    }
  }
}

function polygonCenter(poly) {
  const sum = poly.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / poly.length, y: sum.y / poly.length };
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
  const extent = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 1.65;

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
  const paths = svgSegments
    .map((s) => `<path d="M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}" fill="none" stroke="#000" stroke-width="1" />`)
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

function handleImageUpload(event) {
  const [file] = event.target.files || [];
  if (!file) {
    sourceImage = null;
    redraw();
    return;
  }

  const tempUrl = URL.createObjectURL(file);
  loadImage(
    tempUrl,
    (img) => {
      sourceImage = img;
      URL.revokeObjectURL(tempUrl);
      redraw();
    },
    () => {
      sourceImage = null;
      URL.revokeObjectURL(tempUrl);
      alert('Could not read image file. Please try a PNG or JPG.');
      redraw();
    }
  );
}

function wireControls() {
  controls.sourceImage.addEventListener('change', handleImageUpload);

  controls.shapeMode.addEventListener('change', (event) => {
    config.shapeMode = event.target.value;
    redraw();
  });

  controls.patternMode.addEventListener('change', (event) => {
    config.patternMode = event.target.value;
    redraw();
  });

  Object.entries({
    seed: 'seed',
    tileSize: 'tileSize',
    shapeSides: 'shapeSides',
    distortion: 'distortion',
    imageInfluence: 'imageInfluence',
    motifDensity: 'motifDensity',
    hatchSpacing: 'hatchSpacing',
    hatchAngle: 'hatchAngle',
  }).forEach(([id, key]) => {
    controls[id].addEventListener('input', (event) => {
      const isFloat = key === 'distortion' || key === 'imageInfluence';
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
  controls.shapeSidesVal.textContent = config.shapeSides;
  controls.distortionVal.textContent = config.distortion.toFixed(2);
  controls.imageInfluenceVal.textContent = config.imageInfluence.toFixed(2);
  controls.motifDensityVal.textContent = config.motifDensity;
  controls.hatchSpacingVal.textContent = config.hatchSpacing;
  controls.hatchAngleVal.textContent = config.hatchAngle;
}
