const CONFIG = {
  githubRepo: "schaahirah/whimstories",
  feedbackEndpoint: "",
};

const W = 1080;
const H = 1920;

const PALETTES = {
  bubblegum: { label: "bubblegum", bg: "#ffd1e8", bg2: "#ff8cc6", accent: "#ff3d9a", accent2: "#ffe066", pop: "#4f7cff", ink: "#a3125a", paper: "#fff6fb" },
  butter:    { label: "butter",    bg: "#fff4b8", bg2: "#ffcf5c", accent: "#ff6b6b", accent2: "#46c2b0", pop: "#ff9f1c", ink: "#8a4b00", paper: "#fffdf0" },
  matcha:    { label: "matcha",    bg: "#dcf5cf", bg2: "#8fdc6d", accent: "#2f9e44", accent2: "#ff8fab", pop: "#ffd43b", ink: "#1f5f2c", paper: "#f7fff2" },
  lilac:     { label: "lilac",     bg: "#ece0ff", bg2: "#b892ff", accent: "#7b2ff7", accent2: "#ffd6e8", pop: "#3fd0d4", ink: "#4a1a99", paper: "#fbf8ff" },
  sky:       { label: "baby blue",       bg: "#d6f1ff", bg2: "#7cc9f5", accent: "#1e6fd9", accent2: "#ffd23f", pop: "#ff6fae", ink: "#0d3f80", paper: "#f5fbff" },
  cherry:    { label: "cherry",    bg: "#ffe0dc", bg2: "#ff6b6b", accent: "#e01e37", accent2: "#7bd389", pop: "#ffd166", ink: "#8c0f22", paper: "#fff7f5" },
};

const FILTERS = {
  none:    { label: "original" },
  bw:      { label: "b&w", sat: 0, con: 1.1 },
  noir:    { label: "noir", sat: 0, con: 1.5, bri: -10, grain: 22 },
  vintage: { label: "vintage", sepia: 0.55, fade: 28, con: 0.95, tint: [12, 4, -10], grain: 10 },
  film:    { label: "film", con: 1.12, sat: 0.85, tint: [6, 2, -6], shadowTint: [-8, 6, 12], grain: 18 },
  y2k:     { label: "y2k", sat: 1.35, bri: 14, con: 1.05, tint: [18, 0, 14] },
  dreamy:  { label: "dreamy", bri: 24, con: 0.85, sat: 1.1, tint: [14, 4, 12], fade: 12 },
  golden:  { label: "golden hour", sat: 1.15, bri: 8, tint: [22, 10, -14] },
  cool:    { label: "cool", sat: 0.9, con: 1.05, tint: [-10, 4, 18] },
};

const state = {
  template: "grid",
  palette: "bubblegum",
  filter: "none",
  bg: "default",   
  bgImage: null,  
  photos: [], 
};
const MAX_PHOTOS = 8;

const $ = (id) => document.getElementById(id);
const canvas = $("story");
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext("2d");

const FONT = {
  script: (s) => `italic 700 ${s}px "Playfair Display", Georgia, serif`,
  mono:   (s) => `700 ${s}px "Space Mono", ui-monospace, monospace`,
  hand:   (s) => `700 ${s}px "Caveat", "Comic Sans MS", cursive`,
  sans:   (s) => `800 ${s}px "Inter", system-ui, sans-serif`,
};

function applyFilter(src, f) {
  if (!f || f === FILTERS.none) return src;
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const x = out.getContext("2d");
  x.drawImage(src, 0, 0);
  const img = x.getImageData(0, 0, out.width, out.height);
  const a = img.data;

  const sat = f.sat ?? 1, con = f.con ?? 1, bri = f.bri ?? 0;
  const sep = f.sepia ?? 0, fade = f.fade ?? 0, grain = f.grain ?? 0;
  const t = f.tint || [0, 0, 0];
  const st = f.shadowTint || null;

  for (let i = 0; i < a.length; i += 4) {
    let r = a[i], g = a[i + 1], b = a[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // saturation
    r = gray + (r - gray) * sat;
    g = gray + (g - gray) * sat;
    b = gray + (b - gray) * sat;

    // sepia
    if (sep) {
      r += (gray * 1.07 + 20 - r) * sep;
      g += (gray * 0.95 + 8 - g) * sep;
      b += (gray * 0.78 - b) * sep;
    }

    // contrast + brightness + tint
    r = (r - 128) * con + 128 + bri + t[0];
    g = (g - 128) * con + 128 + bri + t[1];
    b = (b - 128) * con + 128 + bri + t[2];

    // film look
    if (st) {
      const s = Math.max(0, 1 - gray / 128);
      r += st[0] * s; g += st[1] * s; b += st[2] * s;
    }

    // faded blacks
    if (fade) {
      const k = 1 - fade / 255;
      r = r * k + fade; g = g * k + fade; b = b * k + fade;
    }

    // film grain
    if (grain) {
      const n = (Math.random() - 0.5) * grain;
      r += n; g += n; b += n;
    }

    a[i] = r; a[i + 1] = g; a[i + 2] = b; 
  }
  x.putImageData(img, 0, 0);
  return out;
}

function pic(i) {
  if (!state.photos.length) return null;
  const photo = state.photos[i % state.photos.length];
  if (!photo.cache[state.filter]) {
    photo.cache[state.filter] = applyFilter(photo.orig, FILTERS[state.filter]);
  }
  return photo.cache[state.filter];
}

const pal = () => PALETTES[state.palette];

function rrPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function shadow(c, blur = 30, y = 12, alpha = 0.22) {
  c.shadowColor = `rgba(0,0,0,${alpha})`;
  c.shadowBlur = blur;
  c.shadowOffsetX = 0;
  c.shadowOffsetY = y;
}

function rotated(c, cx, cy, angle, fn) {
  c.save();
  c.translate(cx, cy);
  c.rotate(angle);
  fn();
  c.restore();
}

function drawCover(c, img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function placeholder(c, x, y, w, h, i) {
  const p = pal();
  c.fillStyle = p.paper;
  c.fillRect(x, y, w, h);
  c.fillStyle = p.bg;
  for (let yy = y + 20; yy < y + h; yy += 40) {
    for (let xx = x + 20; xx < x + w; xx += 40) {
      c.beginPath(); c.arc(xx, yy, 5, 0, Math.PI * 2); c.fill();
    }
  }
  const r = Math.max(18, Math.min(w, h) * 0.12);
  c.fillStyle = p.accent;
  c.beginPath(); c.arc(x + w / 2, y + h / 2 - r * 0.4, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#fff";
  c.font = FONT.sans(r * 1.3);
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("+", x + w / 2, y + h / 2 - r * 0.35);
  c.fillStyle = p.ink;
  c.font = FONT.sans(Math.max(16, r * 0.55));
  c.fillText(`pic ${(i % 8) + 1}`, x + w / 2, y + h / 2 + r * 1.2);
}

function drawPhoto(c, i, x, y, w, h, { radius = 0, oval = false } = {}) {
  c.save();
  c.beginPath();
  if (oval) c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else rrPath(c, x, y, w, h, radius);
  c.clip();
  const img = pic(i);
  if (img) drawCover(c, img, x, y, w, h);
  else placeholder(c, x, y, w, h, i);
  c.restore();
}
function fitFont(c, text, maxW, size, fam) {
  let s = size;
  c.font = FONT[fam](s);
  while (c.measureText(text).width > maxW && s > 20) {
    s -= 2;
    c.font = FONT[fam](s);
  }
  return s;
}

function txt(c, text, x, y, { fam = "sans", size = 40, color = "#000", align = "center", maxW = 980, stroke = null, strokeW = 0, glow = 0 } = {}) {
  if (!text) return;
  c.save();
  fitFont(c, text, maxW, size, fam);
  c.textAlign = align;
  c.textBaseline = "middle";
  if (glow) shadow(c, 18, 4, glow);
  if (stroke) {
    c.lineWidth = strokeW;
    c.strokeStyle = stroke;
    c.lineJoin = "round";
    c.strokeText(text, x, y);
  }
  if (color) {
    c.fillStyle = color;
    c.fillText(text, x, y);
  }
  c.restore();
}

function wrapLines(c, text, maxW) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (c.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function gradientBg(c, c1, c2, y0 = 0, h = H) {
  const g = c.createLinearGradient(0, y0, W, y0 + h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  c.fillStyle = g;
  c.fillRect(0, y0, W, h);
}

function dots(c, color, r, gap, alpha = 1, x0 = 0, y0 = 0) {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = color;
  let row = 0;
  for (let y = y0; y < H + gap; y += gap, row++) {
    for (let x = x0 + (row % 2 ? gap / 2 : 0); x < W + gap; x += gap) {
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore();
}

function stripes(c, c1, c2, w) {
  c.fillStyle = c1;
  c.fillRect(0, 0, W, H);
  c.fillStyle = c2;
  for (let x = 0; x < W; x += w * 2) c.fillRect(x, 0, w, H);
}

function gingham(c, base, color, size, y0 = 0, h = H) {
  c.save();
  c.beginPath(); c.rect(0, y0, W, h); c.clip();
  c.fillStyle = base;
  c.fillRect(0, y0, W, h);
  c.fillStyle = color;
  c.globalAlpha = 0.35;
  for (let x = 0; x < W; x += size * 2) c.fillRect(x, y0, size, h);
  for (let y = y0; y < y0 + h; y += size * 2) c.fillRect(0, y, W, size);
  c.restore();
}

function gridLines(c, color, size, alpha) {
  c.save();
  c.globalAlpha = alpha;
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.beginPath();
  for (let x = 0; x <= W; x += size) { c.moveTo(x, 0); c.lineTo(x, H); }
  for (let y = 0; y <= H; y += size) { c.moveTo(0, y); c.lineTo(W, y); }
  c.stroke();
  c.restore();
}

let noiseTile = null;
function noise(c, alpha) {
  if (!noiseTile) {
    noiseTile = document.createElement("canvas");
    noiseTile.width = noiseTile.height = 256;
    const x = noiseTile.getContext("2d");
    const d = x.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
  }
  c.save();
  c.globalAlpha = alpha;
  c.globalCompositeOperation = "overlay";
  c.fillStyle = c.createPattern(noiseTile, "repeat");
  c.fillRect(0, 0, W, H);
  c.restore();
}

function star(c, cx, cy, r, color, { pts = 5, inner = 0.45, rot = 0 } = {}) {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  c.beginPath();
  for (let k = 0; k < pts * 2; k++) {
    const rad = k % 2 ? r * inner : r;
    const a = (k * Math.PI) / pts - Math.PI / 2;
    c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.restore();
}

const sparkle = (c, cx, cy, r, color) => star(c, cx, cy, r, color, { pts: 4, inner: 0.22 });

function heart(c, cx, cy, size, color, rot = 0) {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  c.scale(size / 100, size / 100);
  c.beginPath();
  c.moveTo(0, 38);
  c.bezierCurveTo(-75, -5, -45, -72, 0, -32);
  c.bezierCurveTo(45, -72, 75, -5, 0, 38);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.restore();
}

function flower(c, cx, cy, r, petal, center) {
  c.save();
  c.fillStyle = petal;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    c.beginPath();
    c.arc(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.5, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = center;
  c.beginPath(); c.arc(cx, cy, r * 0.38, 0, Math.PI * 2); c.fill();
  c.restore();
}

function pin(c, x, y, r, color) {
  c.save();
  shadow(c, 10, 5, 0.3);
  c.fillStyle = color;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.restore();
  c.save();
  c.fillStyle = "rgba(255,255,255,.55)";
  c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.32, 0, Math.PI * 2); c.fill();
  c.restore();
}

function polaroid(c, i, cx, cy, w, angle, pinColor, caption) {
  const ph = (w - 44) * 1.05;
  const h = 22 + ph + 90;
  rotated(c, cx, cy, angle, () => {
    c.save();
    shadow(c, 30, 14, 0.25);
    c.fillStyle = "#fff";
    c.fillRect(-w / 2, -h / 2, w, h);
    c.restore();
    drawPhoto(c, i, -w / 2 + 22, -h / 2 + 22, w - 44, ph);
    if (caption) txt(c, caption, 0, h / 2 - 45, { fam: "hand", size: 46, color: "#3a3a3a", maxW: w - 40 });
    if (pinColor) pin(c, 0, -h / 2 + 6, 30, pinColor);
  });
}

// =====================================================
// Templates
// =====================================================
const TEMPLATES = {
  // Inspired by: white card with a 3x2 photo grid
  grid: {
    label: "grid",
    photos: 6,
    headline: "core memories",
    sub: "sunday reset ♡",
    tags: "with my favourite people",
    bg(c, p) {
      gradientBg(c, p.bg, p.bg2);
      dots(c, "#ffffff", 46, 230, 0.35, 60, 80);
      noise(c, 0.08);
    },
    draw(c, p, t) {

      txt(c, t.headline, 540, 320, { fam: "script", size: 124, color: p.ink, maxW: 960 });
      txt(c, t.sub.toUpperCase(), 540, 450, { fam: "mono", size: 34, color: p.ink });

      c.save();
      shadow(c, 40, 16, 0.25);
      c.fillStyle = "#fff";
      rrPath(c, 90, 560, 900, 746, 14);
      c.fill();
      c.restore();
      for (let r = 0; r < 2; r++) {
        for (let k = 0; k < 3; k++) {
          drawPhoto(c, r * 3 + k, 114 + k * 290, 584 + r * 358, 272, 340, { radius: 6 });
        }
      }

      txt(c, t.tags.join(" · "), 540, 1560, { fam: "hand", size: 66, color: p.ink, maxW: 760 });
      star(c, 170, 1400, 64, p.accent2, { rot: 0.2 });
      heart(c, 910, 1410, 120, p.accent, 0.15);
      sparkle(c, 960, 500, 42, "#ffffff");
      sparkle(c, 120, 520, 32, p.pop);
      flower(c, 870, 1710, 44, p.pop, p.accent2);
      star(c, 200, 1730, 34, "#ffffff", { rot: -0.2 });
    },
  },

  strips: {
    label: "strips",
    photos: 6,
    headline: "take a photo when u feel pretty",
    sub: "photobooth club ♡",
    tags: "",
    bg(c, p) {
      stripes(c, p.bg, p.paper, 54);
      noise(c, 0.06);
    },
    draw(c, p, t) {

      txt(c, t.headline, 540, 200, { fam: "script", size: 92, color: p.ink, maxW: 960 });

      const strip = (cx, cy, ang, start) => rotated(c, cx, cy, ang, () => {
        const w = 340, h = 1180, x = -w / 2, y = -h / 2;
        c.save();
        shadow(c, 40, 18, 0.3);
        c.fillStyle = "#151515";
        rrPath(c, x, y, w, h, 8);
        c.fill();
        c.restore();
        txt(c, "photobooth", 0, y + 55, { fam: "hand", size: 46, color: "#fff" });
        for (let k = 0; k < 3; k++) drawPhoto(c, start + k, x + 22, y + 100 + k * 352, 296, 330, { radius: 3 });
      });
      strip(375, 1010, -0.05, 0);
      strip(715, 990, 0.06, 3);

      txt(c, t.sub.toUpperCase(), 540, 1780, { fam: "mono", size: 34, color: p.ink });
      heart(c, 150, 1500, 120, p.accent, -0.2);
      star(c, 940, 1580, 62, p.accent2, { rot: 0.3 });
      sparkle(c, 120, 520, 42, p.pop);
      sparkle(c, 960, 420, 34, p.accent);
      flower(c, 950, 1760, 40, p.accent2, p.pop);
    },
  },

  fridge: {
    label: "fridge",
    photos: 5,
    headline: "keep on going",
    sub: "with your silly dreams",
    tags: "love in the little things",
    bg(c, p) {
      gradientBg(c, p.paper, p.bg);
      gridLines(c, p.bg2, 48, 0.25);
      noise(c, 0.06);
    },
    draw(c, p, t) {

      txt(c, t.headline, 540, 230, { fam: "script", size: 140, color: "rgba(255,255,255,.65)", stroke: p.ink, strokeW: 3, maxW: 1000, glow: 0.15 });

      const pins = [p.accent2, p.pop, p.accent];
      const spots = [
        [310, 640, -0.08], [770, 700, 0.07], [540, 1020, -0.03], [300, 1370, 0.06], [780, 1340, -0.07],
      ];
      spots.forEach(([x, y, a], i) => polaroid(c, i, x, y, 380, a, pins[i % 3]));

      // sticky note
      rotated(c, 560, 1660, -0.05, () => {
        c.save();
        shadow(c, 20, 10, 0.2);
        c.fillStyle = p.accent2;
        c.fillRect(-170, -95, 340, 190);
        c.restore();
        c.font = FONT.hand(46);
        const lines = wrapLines(c, t.tags.join(", "), 300).slice(0, 3);
        lines.forEach((ln, k) =>
          txt(c, ln, 0, -((lines.length - 1) * 25) + k * 50, { fam: "hand", size: 46, color: p.ink, maxW: 310 }));
      });

      txt(c, t.sub, 540, 1830, { fam: "script", size: 80, color: "rgba(255,255,255,.65)", stroke: p.ink, strokeW: 2.5, maxW: 980 });
      heart(c, 130, 1690, 100, p.accent, -0.2);
      star(c, 960, 990, 46, p.pop);
      sparkle(c, 110, 990, 40, p.accent);
      flower(c, 960, 1680, 44, p.accent2, p.pop);
    },
  },

  // Inspired by: pink scrapbook with pins, squiggles and hashtags
  scrapbook: {
    label: "scrapbook",
    photos: 6,
    headline: "the best way to spend the day.",
    sub: "",
    tags: "#bestday, #wkwkwk, #coremem, #besties, #nofilter, #againplease",
    bg(c, p) {
      c.fillStyle = p.bg;
      c.fillRect(0, 0, W, H);
      noise(c, 0.12);
    },
    draw(c, p, t) {

      c.save();
      c.strokeStyle = p.accent;
      c.lineWidth = 7;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-20, 300);
      c.bezierCurveTo(300, 120, 500, 700, 260, 760);
      c.bezierCurveTo(60, 800, 200, 1000, 520, 900);
      c.bezierCurveTo(900, 780, 1100, 1100, 800, 1150);
      c.bezierCurveTo(500, 1200, 400, 1500, 700, 1600);
      c.bezierCurveTo(950, 1680, 1000, 1850, 1100, 1900);
      c.stroke();
      c.restore();

      const frames = [
        [80, 200, 440, 330], [570, 150, 430, 300], [590, 520, 420, 320],
        [60, 610, 460, 330], [70, 1110, 470, 420], [580, 1180, 430, 420],
      ];
      const pins = [p.accent2, p.pop, "#ffffff"];
      frames.forEach(([x, y, w, h], i) => {
        c.save();
        shadow(c, 20, 8, 0.18);
        c.fillStyle = p.accent;
        c.fillRect(x - 6, y - 6, w + 12, h + 12);
        c.restore();
        drawPhoto(c, i, x, y, w, h);
        pin(c, x + w / 2, y - 2, 28, pins[i % 3]);
        if (t.tags[i]) txt(c, t.tags[i], x, y + h + 36, { fam: "mono", size: 26, color: p.ink, align: "left", maxW: w });
      });

      txt(c, t.headline, 540, 1040, { fam: "script", size: 66, color: p.ink, maxW: 900 });
      if (t.sub) txt(c, t.sub, 540, 1780, { fam: "hand", size: 60, color: p.ink });

      star(c, 1000, 600, 34, p.pop);
      star(c, 60, 140, 30, p.accent2);
      star(c, 540, 1690, 38, p.accent2);
      star(c, 140, 1760, 34, p.pop);
      star(c, 990, 1720, 30, "#ffffff");
    },
  },

  spotlight: {
    label: "spotlight",
    photos: 4,
    headline: "take some pics",
    sub: "roll 01 · 36 exp",
    tags: "",
    bg(c, p) {
 
      c.fillStyle = p.bg2;
      c.fillRect(0, 0, W, 1000);
      c.fillStyle = "rgba(0,0,0,.08)";
      for (let y = 0; y < 1000; y += 14) c.fillRect(0, y, W, 6);
      gingham(c, p.paper, p.bg2, 36, 1000, 920);
    },
    draw(c, p, t) {

      c.save();
      shadow(c, 40, 16, 0.3);
      c.fillStyle = "#fff";
      c.beginPath(); c.ellipse(540, 520, 410, 330, 0, 0, Math.PI * 2); c.fill();
      c.restore();
      drawPhoto(c, 0, 140, 200, 800, 640, { oval: true });

      const words = t.headline.split(/\s+/).filter(Boolean);
      const slots = [[80, 120, "left"], [290, 940, "center"], [1000, 900, "right"]];
      const chunks = words.length > 3 ? [words[0], words[1], words.slice(2).join(" ")] : words;
      chunks.forEach((w, k) =>
        txt(c, w, slots[k][0], slots[k][1], { fam: k === 1 ? "script" : "sans", size: 64, color: "#fff", align: slots[k][2], maxW: 520 }));
      [[330, 70], [960, 120], [70, 520], [1015, 470], [800, 960]].forEach(([x, y]) => star(c, x, y, 30, "#ffffff"));

      for (let k = 0; k < 3; k++) {
        const x = 75 + k * 320, y = 1170, w = 290, h = 380;
        c.save();
        shadow(c, 24, 10, 0.25);
        c.fillStyle = "#fff";
        c.fillRect(x - 12, y - 12, w + 24, h + 24);
        c.restore();
        drawPhoto(c, k + 1, x, y, w, h);
        txt(c, String(k + 1).padStart(3, "0"), x + w / 2, 1625, { fam: "sans", size: 56, color: p.ink });
      }
      txt(c, t.sub.toUpperCase(), 540, 1780, { fam: "mono", size: 34, color: p.ink });
      heart(c, 960, 1080, 90, p.accent, 0.2);
      star(c, 110, 1080, 50, p.pop);
    },
  },
  
  letter: {
    label: "love letter",
    photos: 2,
    headline: "album 12/39 · blooms ♡ play-list 0:23 · sun_shine; pg.126",
    sub: "ep.06",
    tags: "",
    bg(c, p) {
      c.fillStyle = p.paper;
      c.fillRect(0, 0, W, H);
      dots(c, p.bg2, 10, 70, 0.5, 35, 35);
    },
    draw(c, p, t) {

      rotated(c, 540, 600, -0.07, () => {
        c.save();
        shadow(c, 30, 14, 0.2);
        c.fillStyle = p.bg2;
        rrPath(c, -380, -250, 760, 500, 16);
        c.fill();
        c.restore();
        c.fillStyle = "rgba(0,0,0,.08)";
        c.beginPath();
        c.moveTo(-380, -250); c.lineTo(0, 40); c.lineTo(380, -250);
        c.closePath(); c.fill();
      });
      
      rotated(c, 560, 690, 0.05, () => {
        c.save();
        shadow(c, 30, 14, 0.22);
        c.fillStyle = "#fff";
        c.fillRect(-370, -230, 740, 460);
        c.restore();
        c.save();
        c.strokeStyle = p.accent;
        c.lineWidth = 12;
        c.beginPath(); c.ellipse(-200, 0, 137, 182, 0, 0, Math.PI * 2); c.stroke();
        c.restore();
        drawPhoto(c, 0, -335, -180, 270, 360, { oval: true });

        c.font = FONT.mono(30);
        const lines = wrapLines(c, t.headline, 380).slice(0, 6);
        if (t.sub) lines.push(t.sub);
        const startY = -((lines.length - 1) * 48) / 2;
        lines.forEach((ln, k) =>
          txt(c, ln, -40, startY + k * 48, { fam: "mono", size: 30, color: "#333", align: "left", maxW: 390 }));
      });

      const fx = 170, fy = 1060, fw = 740, fh = 720;
      c.save();
      shadow(c, 30, 14, 0.22);
      c.fillStyle = p.bg2;
      c.fillRect(fx, fy, fw, fh);
      c.restore();
      c.save();
      c.beginPath(); c.rect(fx, fy, fw, fh); c.clip();
      c.fillStyle = p.paper;
      for (let x = fx; x < fx + fw; x += 28) c.fillRect(x, fy, 14, fh);
      c.restore();
      drawPhoto(c, 1, fx + 34, fy + 34, fw - 68, fh - 68);

      star(c, 150, 330, 70, p.accent2, { rot: 0.2 });
      star(c, 940, 990, 64, p.pop, { rot: -0.1 });
      heart(c, 120, 1010, 110, p.accent, -0.2);
      flower(c, 950, 1790, 56, p.accent2, p.pop);
      sparkle(c, 980, 250, 44, p.accent);
      sparkle(c, 120, 1820, 36, p.pop);
    },
  },
};

function seeded(seed) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

const BACKGROUNDS = {
  default: { label: "default", draw: (c, p) => TEMPLATES[state.template].bg(c, p) },
  polka:   { label: "polka dots", draw: (c, p) => { c.fillStyle = p.bg; c.fillRect(0, 0, W, H); dots(c, p.paper, 40, 200, 0.85, 60, 60); } },
  gingham: { label: "gingham", draw: (c, p) => gingham(c, p.paper, p.bg2, 60) },
  stripes: { label: "stripes", draw: (c, p) => stripes(c, p.bg, p.paper, 70) },
  grid:    { label: "grid", draw: (c, p) => { c.fillStyle = p.paper; c.fillRect(0, 0, W, H); gridLines(c, p.bg2, 60, 0.6); } },
  hearts:  { label: "hearts", draw: (c, p) => {
    gradientBg(c, p.bg, p.paper);
    let row = 0;
    for (let y = 60; y < H + 200; y += 200, row++) {
      for (let x = row % 2 ? 160 : 60; x < W + 200; x += 200) heart(c, x, y, 70, p.bg2, row % 2 ? 0.2 : -0.2);
    }
  } },
  checker: { label: "checkerboard", draw: (c, p) => {
    c.fillStyle = p.paper; c.fillRect(0, 0, W, H);
    c.fillStyle = p.bg;
    for (let y = 0; y < H; y += 120) for (let x = (y / 120) % 2 ? 120 : 0; x < W; x += 240) c.fillRect(x, y, 120, 120);
  } },
  sparkle: { label: "sparkle", draw: (c, p) => {
    gradientBg(c, p.bg2, p.accent2);
    const rnd = seeded(7);
    for (let k = 0; k < 40; k++) sparkle(c, rnd() * W, rnd() * H, 12 + rnd() * 30, "rgba(255,255,255,.85)");
  } },
  custom:  { label: "your photo", draw: (c, p) => {
    if (state.bgImage) drawCover(c, state.bgImage, 0, 0, W, H);
    else TEMPLATES[state.template].bg(c, p);
  } },
};

function drawBackground(c, p) {
  BACKGROUNDS[state.bg].draw(c, p);
  if (state.bg !== "default" && state.bg !== "custom") noise(c, 0.06);
}

function textFor(key) {
  const tpl = TEMPLATES[key];
  const headline = $("headline").value.trim() || tpl.headline;
  const sub = $("subtext").value.trim() || tpl.sub;
  const tagStr = $("tags").value.trim() || tpl.tags;
  const tags = tagStr.split(",").map((s) => s.trim()).filter(Boolean);
  return { headline, sub, tags };
}

function drawTemplate(c, key) {
  c.save();
  c.clearRect(0, 0, W, H);
  const prev = state.template;
  state.template = key; 
  drawBackground(c, pal());
  state.template = prev;
  TEMPLATES[key].draw(c, pal(), textFor(key));
  c.restore();
}

let renderQueued = false;
function render() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    drawTemplate(ctx, state.template);
  });
}

const offscreen = document.createElement("canvas");
offscreen.width = W;
offscreen.height = H;
const offCtx = offscreen.getContext("2d");
let thumbTimer = null;

function refreshTemplateThumbs() {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(() => {
    document.querySelectorAll(".tpl").forEach((btn) => {
      drawTemplate(offCtx, btn.dataset.tpl);
      const tc = btn.querySelector("canvas").getContext("2d");
      tc.clearRect(0, 0, 108, 192);
      tc.drawImage(offscreen, 0, 0, 108, 192);
    });
  }, 250);
}

function sampleCanvas() {
  const s = document.createElement("canvas");
  s.width = s.height = 120;
  const x = s.getContext("2d");
  if (state.photos.length) {
    drawCover(x, state.photos[0].orig, 0, 0, 120, 120);
  } else {
    const p = pal();
    const g = x.createLinearGradient(0, 0, 120, 120);
    g.addColorStop(0, p.bg2);
    g.addColorStop(1, p.accent2);
    x.fillStyle = g;
    x.fillRect(0, 0, 120, 120);
    heart(x, 60, 64, 70, p.accent);
  }
  return s;
}

function refreshFilterThumbs() {
  const sample = sampleCanvas();
  document.querySelectorAll(".filter").forEach((btn) => {
    const f = applyFilter(sample, FILTERS[btn.dataset.filter]);
    const fc = btn.querySelector("canvas").getContext("2d");
    fc.clearRect(0, 0, 120, 120);
    fc.drawImage(f, 0, 0);
  });
}

let bgTimer = null;
function refreshBgThumbs() {
  clearTimeout(bgTimer);
  bgTimer = setTimeout(() => {
    const saved = state.bg;
    document.querySelectorAll(".bgopt").forEach((btn) => {
      state.bg = btn.dataset.bg;
      offCtx.clearRect(0, 0, W, H);
      drawBackground(offCtx, pal());
      const bc = btn.querySelector("canvas").getContext("2d");
      bc.clearRect(0, 0, 72, 128);
      bc.drawImage(offscreen, 0, 0, 72, 128);
    });
    state.bg = saved;
  }, 300);
}

function refreshAll() {
  render();
  refreshTemplateThumbs();
  refreshBgThumbs();
}

function buildTemplatePicker() {
  $("tplGrid").innerHTML = Object.entries(TEMPLATES)
    .map(([key, t]) => `
      <button type="button" class="tpl ${key === state.template ? "active" : ""}" data-tpl="${key}">
        <canvas width="108" height="192"></canvas>${t.label}<br><small>${t.photos} photos</small>
      </button>`)
    .join("");
}

function buildFilterPicker() {
  $("filterGrid").innerHTML = Object.entries(FILTERS)
    .map(([key, f]) => `
      <button type="button" class="filter ${key === state.filter ? "active" : ""}" data-filter="${key}">
        <canvas width="120" height="120"></canvas>${f.label}
      </button>`)
    .join("");
}

function buildBgPicker() {
  $("bgGrid").innerHTML = Object.entries(BACKGROUNDS)
    .map(([key, b]) => `
      <button type="button" class="bgopt ${key === state.bg ? "active" : ""}" data-bg="${key}">
        <canvas width="72" height="128"></canvas>${b.label}
      </button>`)
    .join("");
}

function buildPaletteChips() {
  $("paletteChips").innerHTML = Object.entries(PALETTES)
    .map(([key, p]) => `
      <button type="button" class="chip ${key === state.palette ? "active" : ""}" data-palette="${key}">
        <span class="swatch"><i style="background:${p.bg}"></i><i style="background:${p.accent}"></i><i style="background:${p.accent2}"></i></span>${p.label}
      </button>`)
    .join("");
}

function setActive(containerId, attr, value) {
  document.querySelectorAll(`#${containerId} [data-${attr}]`).forEach((el) =>
    el.classList.toggle("active", el.dataset[attr] === value));
}

function updatePlaceholders() {
  const tpl = TEMPLATES[state.template];
  $("headline").placeholder = tpl.headline;
  $("subtext").placeholder = tpl.sub || "(not used here)";
  $("tags").placeholder = tpl.tags || "(not used here)";
}

function renderThumbs() {
  const box = $("thumbs");
  box.innerHTML = "";
  state.photos.forEach((photo, i) => {
    const div = document.createElement("div");
    div.className = "thumb";
    const tc = document.createElement("canvas");
    tc.width = tc.height = 120;
    drawCover(tc.getContext("2d"), photo.orig, 0, 0, 120, 120);
    div.appendChild(tc);
    div.insertAdjacentHTML("beforeend",
      `<span class="num">${i + 1}</span><button type="button" class="del" data-remove="${i}" aria-label="Remove photo ${i + 1}">✕</button>`);
    box.appendChild(div);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read " + file.name)); };
    img.src = url;
  });
}

async function fileToCanvas(file, maxSide = 1400) {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(img.width * scale);
  cv.height = Math.round(img.height * scale);
  cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
  return cv;
}

async function addFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith("image/"));
  for (const file of files) {
    if (state.photos.length >= MAX_PHOTOS) {
      alert(`up to ${MAX_PHOTOS} photos only (；´∀｀)`);
      break;
    }
    try {
      state.photos.push({ orig: await fileToCanvas(file), cache: {} });
    } catch (err) {
      alert("couldn't open that file, try a JPG or PNG (・・;)");
    }
  }
  renderThumbs();
  refreshFilterThumbs();
  refreshAll();
}

function fileName() {
  return `whimstories-${state.template}.png`;
}

function getBlob() {
  drawTemplate(ctx, state.template);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function download() {
  const blob = await getBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName();
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function share() {
  const blob = await getBlob();
  const file = new File([blob], fileName(), { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); } catch (_) { /* closed */ }
  } else {
    download();
  }
}

$("fileInput").addEventListener("change", (e) => {
  addFiles(e.target.files);
  e.target.value = "";
});

const drop = $("dropZone");
["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => {
  e.preventDefault();
  drop.classList.add("drag");
}));
["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => {
  e.preventDefault();
  drop.classList.remove("drag");
}));
drop.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

$("thumbs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove]");
  if (!btn) return;
  state.photos.splice(Number(btn.dataset.remove), 1);
  renderThumbs();
  refreshFilterThumbs();
  refreshAll();
});

$("shuffleBtn").addEventListener("click", () => {
  for (let i = state.photos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.photos[i], state.photos[j]] = [state.photos[j], state.photos[i]];
  }
  renderThumbs();
  refreshAll();
});

$("clearBtn").addEventListener("click", () => {
  if (!state.photos.length || !confirm("remove all photos?")) return;
  state.photos = [];
  renderThumbs();
  refreshFilterThumbs();
  refreshAll();
});

$("tplGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-tpl]");
  if (!btn) return;
  state.template = btn.dataset.tpl;
  setActive("tplGrid", "tpl", state.template);
  updatePlaceholders();
  render();
});

$("filterGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  state.filter = btn.dataset.filter;
  setActive("filterGrid", "filter", state.filter);
  refreshAll();
});

$("paletteChips").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-palette]");
  if (!btn) return;
  state.palette = btn.dataset.palette;
  setActive("paletteChips", "palette", state.palette);
  refreshFilterThumbs();
  refreshAll();
});

$("bgGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-bg]");
  if (!btn) return;
  if (btn.dataset.bg === "custom" && !state.bgImage) {
    $("bgInput").click(); 
    return;
  }
  state.bg = btn.dataset.bg;
  setActive("bgGrid", "bg", state.bg);
  refreshAll();
});

$("bgInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file || !file.type.startsWith("image/")) return;
  try {
    state.bgImage = await fileToCanvas(file, 2000);
    state.bg = "custom";
    setActive("bgGrid", "bg", state.bg);
    refreshAll();
  } catch (_) {
    alert("couldn't open that file, try a JPG or PNG (・・;)");
  }
});

["headline", "subtext", "tags"].forEach((id) =>
  $(id).addEventListener("input", refreshAll));

$("downloadBtn").addEventListener("click", download);
$("shareBtn").addEventListener("click", share);


const feedback = { rating: "", type: "idea" };

function pickOne(containerId, attr, value) {
  document.querySelectorAll(`#${containerId} [data-${attr}]`).forEach((el) => {
    const on = el.dataset[attr] === value;
    el.classList.toggle("active", on);
    el.setAttribute("aria-pressed", on);
  });
}

$("fbRating").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-rate]");
  if (!btn) return;
  feedback.rating = btn.dataset.rate;
  pickOne("fbRating", "rate", feedback.rating);
});

$("fbType").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-type]");
  if (!btn) return;
  feedback.type = btn.dataset.type;
  pickOne("fbType", "type", feedback.type);
});

function setStatus(msg) {
  $("fbStatus").textContent = msg;
}

$("fbSend").addEventListener("click", async () => {
  const message = $("fbText").value.trim();
  const name = $("fbName").value.trim() || "anon bestie";
  if (message.length < 3) {
    setStatus("write a message first (・ω・)");
    $("fbText").focus();
    return;
  }

  const details = {
    vibe: feedback.rating || "(skipped)",
    type: feedback.type,
    message,
    name,
    layout: state.template,
    filter: state.filter,
    colour: state.palette,
  };

  const sendBtn = $("fbSend");
  sendBtn.disabled = true;
  setTimeout(() => (sendBtn.disabled = false), 8000); 

  if (CONFIG.feedbackEndpoint) {
    setStatus("sending…");
    try {
      const res = await fetch(CONFIG.feedbackEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(details),
      });
      if (!res.ok) throw new Error();
      setStatus("sent, thank you! (˶ᵔ ᵕ ᵔ˶)");
      $("fbText").value = "";
    } catch (_) {
      setStatus("couldn't send, try again later (╥﹏╥)");
    }
    return;
  }

  if (!CONFIG.githubRepo || CONFIG.githubRepo.includes("YOUR" + "-USERNAME")) { 
    setStatus("feedback isn't set up yet (see README)");
    return;
  }
  const typeLabel = feedback.type;
  const title = `[${typeLabel}] ${message.slice(0, 60)}`;
  const body =
    `**vibe:** ${details.vibe}\n**type:** ${typeLabel}\n**from:** ${name}\n\n${message}\n\n---\n` +
    `_layout: ${details.layout} · filter: ${details.filter} · colour: ${details.colour}_`;
  const url = `https://github.com/${CONFIG.githubRepo}/issues/new?labels=feedback` +
    `&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  window.open(url, "_blank", "noopener");
  setStatus("opening GitHub to post it (needs a GitHub account)");
});

buildTemplatePicker();
buildBgPicker();
buildFilterPicker();
buildPaletteChips();
updatePlaceholders();
refreshFilterThumbs();
refreshAll();

Promise.all([
  document.fonts.load(FONT.script(80)),
  document.fonts.load(FONT.mono(40)),
  document.fonts.load(FONT.hand(40)),
  document.fonts.load(FONT.sans(40)),
]).catch(() => {}).finally(refreshAll);
