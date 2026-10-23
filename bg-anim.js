// ===== Floating pixel-art background =====
// Little pixel flowers, hearts, daisies, sparkles & clouds drift up the page.
// Turns itself off for people who prefer reduced motion, pauses when the tab
// is hidden, and can be switched off with the "motion" button.

(() => {
  const canvas = document.getElementById("pixelBg");
  const toggle = document.getElementById("vibesToggle");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // ----- colours -----
  const COLORS = {
    p: "#ff8cc6", // pink
    P: "#ff4fa3", // hot pink
    y: "#ffd84d", // yellow
    b: "#8fb8ff", // baby blue
    v: "#c4a3ff", // lilac
    g: "#7fd67a", // green
    r: "#ff6b8b", // heart red-pink
    w: "#ffffff", // white
    o: "#ffb36b", // orange
  };

  // ----- pixel art (each letter = one pixel, "." = empty) -----
  const ART = {
    flowerPink: [
      ".p.p.",
      "ppypp",
      ".ppp.",
      "..g..",
      ".gg..",
    ],
    flowerLilac: [
      ".v.v.",
      "vvyvv",
      ".vvv.",
      "..g..",
      "..gg.",
    ],
    flowerBlue: [
      ".b.b.",
      "bbybb",
      ".bbb.",
      "..g..",
      ".gg..",
    ],
    daisy: [
      "..w..",
      ".wyw.",
      "wyyyw",
      ".wyw.",
      "..w..",
    ],
    tulip: [
      "P.P.P",
      "PPPPP",
      ".PPP.",
      "..g..",
      ".gg..",
      "..g..",
    ],
    heart: [
      ".rr.rr.",
      "rrrrrrr",
      "rrrrrrr",
      ".rrrrr.",
      "..rrr..",
      "...r...",
    ],
    sparkle: [
      "..y..",
      "..y..",
      "yyyyy",
      "..y..",
      "..y..",
    ],
    tinyStar: [
      ".w.",
      "www",
      ".w.",
    ],
    cloud: [
      "..www...",
      ".wwwwww.",
      "wwwwwwww",
      ".wwwwww.",
    ],
    cherry: [
      "...g",
      "..g.",
      ".g.g",
      "r..r",
      "rr.rr",
    ],
  };

  // How often each sprite shows up
  const WEIGHTS = {
    flowerPink: 5, flowerLilac: 4, flowerBlue: 3, daisy: 2, tulip: 3,
    heart: 4, sparkle: 3, tinyStar: 1, cloud: 1, cherry: 2,
  };
  const BAG = Object.entries(WEIGHTS).flatMap(([k, n]) => Array(n).fill(k));

  // Pre-render each sprite at several pixel sizes so drawing stays cheap
  const cache = {};
  function sprite(name, px) {
    const key = name + px;
    if (cache[key]) return cache[key];
    const rows = ART[name];
    const cols = Math.max(...rows.map((r) => r.length));
    const c = document.createElement("canvas");
    c.width = cols * px;
    c.height = rows.length * px;
    const x = c.getContext("2d");
    rows.forEach((row, ry) => {
      [...row].forEach((ch, rx) => {
        if (ch === ".") return;
        x.fillStyle = COLORS[ch];
        x.fillRect(rx * px, ry * px, px, px);
      });
    });
    return (cache[key] = c);
  }

  // ----- particles -----
  let particles = [];
  let width = 0, height = 0, dpr = 1;
  const pointer = { x: -9999, y: -9999 };

  function makeParticle(startAnywhere) {
    const name = BAG[Math.floor(Math.random() * BAG.length)];
    const px = name === "cloud" ? 8 : 4 + Math.floor(Math.random() * 4); // pixel size 4–7
    const img = sprite(name, px);
    return {
      img,
      x: Math.random() * width,
      y: startAnywhere ? Math.random() * height : height + img.height + Math.random() * 100,
      speed: 0.15 + Math.random() * 0.45,          // upward drift
      sway: 10 + Math.random() * 25,               // side-to-side amount
      phase: Math.random() * Math.PI * 2,
      swaySpeed: 0.004 + Math.random() * 0.008,
      alpha: 0.6 + Math.random() * 0.4,
      pushX: 0,
      pushY: 0,
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false; // keep pixels crisp

    const target = Math.round(Math.min(60, Math.max(20, (width * height) / 20000)));
    while (particles.length < target) particles.push(makeParticle(true));
    particles.length = target;
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      const swayX = Math.sin(p.phase + t * p.swaySpeed) * p.sway;
      const cx = p.x + swayX + p.pushX;
      const cy = p.y + p.pushY;
      ctx.globalAlpha = p.alpha;
      // round to whole pixels so it stays crunchy
      ctx.drawImage(p.img, Math.round(cx - p.img.width / 2), Math.round(cy - p.img.height / 2));
    }
    ctx.globalAlpha = 1;
  }

  function step(t) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y -= p.speed;

      // gently scoot away from the cursor / finger
      const dx = p.x + p.pushX - pointer.x;
      const dy = p.y + p.pushY - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 110 && dist > 0) {
        const force = (110 - dist) / 110;
        p.pushX += (dx / dist) * force * 2.2;
        p.pushY += (dy / dist) * force * 2.2;
      }
      p.pushX *= 0.94;
      p.pushY *= 0.94;

      if (p.y < -p.img.height - 40) particles[i] = makeParticle(false);
    }
    draw(t);
  }

  // ----- on / off -----
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let enabled = true;
  try {
    const saved = localStorage.getItem("whimstories-vibes");
    if (saved !== null) enabled = saved === "on";
    else if (reduceMotion.matches) enabled = false;
  } catch (_) {
    if (reduceMotion.matches) enabled = false;
  }

  let raf = null;
  function loop(t) {
    step(t);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (raf || !enabled || document.hidden) return;
    canvas.style.opacity = "1";
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = null;
  }

  function updateToggle() {
    if (!toggle) return;
    toggle.textContent = enabled ? "✿ motion on" : "✿ motion off";
    toggle.setAttribute("aria-pressed", String(enabled));
  }

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem("whimstories-vibes", on ? "on" : "off"); } catch (_) {}
    updateToggle();
    if (on) start();
    else {
      stop();
      canvas.style.opacity = "0";
    }
  }

  // ----- events -----
  window.addEventListener("resize", () => {
    resize();
    if (!raf) draw(performance.now());
  });
  window.addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
  window.addEventListener("pointerleave", () => { pointer.x = pointer.y = -9999; });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  if (toggle) toggle.addEventListener("click", () => setEnabled(!enabled));

  // ----- go -----
  resize();
  updateToggle();
  if (enabled) start();
  else canvas.style.opacity = "0";
})();
