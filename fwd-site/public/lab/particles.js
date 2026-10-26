/* ─────────────────────────────────────────────────────────────
   FWD hero — particle cloud.

   Three states, driven by one scroll value:

     torus   →   pour   →   murmuration
     (hero)      (exit)     (next section)

   The torus unwinds into a tapering helix that runs down and to
   the left, then the stream settles into a starling flock in the
   section below.

   Notes on the approach:

   · points live in POLAR form for the torus, because every effect
     on it (differential rotation, the helix unwind, the funnel
     taper) is an operation on angle or radius.
   · the murmuration is a separate CARTESIAN target per point. The
     two are projected independently and blended in screen space,
     which keeps each one's own geometry intact — in particular the
     camera tilts up as the flock takes over, because a flock
     should not be squashed onto the ground plane the ring sits on.
   · the morph is STAGGERED per point, ordered by position along
     the pour. A straight lerp reads as a dissolve; staggering makes
     the flock assemble in a wave, leading edge first.
   · all trig goes through a lookup table. At 85k points that is
     what pays for per-point rotation and several turbulence terms.
   · points are ACCUMULATED into half-resolution buffers rather than
     drawn, so overlapping points build into solid light. Two
     buffers: the far half behind the device, the near half in
     front. The back one is taller, because the flock lands below
     the hero and nothing down there needs occluding.
   ───────────────────────────────────────────────────────────── */
(function () {
  const back = document.getElementById('fx');
  const front = document.getElementById('fxf');
  if (!back) return;
  const bx = back.getContext('2d', { alpha: true });
  const fx = front ? front.getContext('2d', { alpha: true }) : null;
  const scene = document.querySelector('.scene');
  const hero = back.closest('section') || document.body;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');

  const DENSITY = { off: 0, subtle: 40000, rich: 95000, heavy: 190000 };
  let density = DENSITY.rich;

  /* Each buffer has a FIXED pixel budget; the world rect it covers follows
     the cloud rather than spanning the whole page. The old buffer was 2 scene
     widths by 4 scene heights at half scale, so the overwhelming majority of
     its pixels sat over empty page while the particles got very few — which
     is why it looked soft. Same cost, roughly twice the resolution at rest. */
  const BUF_PX = 1000;
  const BUF_WM = 2.0;        /* front canvas CSS width  vs scene */
  const BUF_HF = 2.3;        /* front canvas CSS height vs scene */
  const YB = 8, DB = 6, NB = YB * DB;
  const TAU = Math.PI * 2;
  const HELIX_TURNS = 2.6;
  const FLOCK_TILT = 22 * Math.PI / 180;   /* camera lifts as the flock forms  */
  const LAYER_TILT = 26 * Math.PI / 180;   /* and settles for the stack        */
  const LY = [-0.93, -0.31, 0.31, 0.93];   /* the four planes, in unit space   */
  const NET_TILT = 40 * Math.PI / 180;
  /* the feature map: what is needed, and how it hangs together */
  const NET = [
    { x: 0.02, y: 0.86, z: 0.16 }, { x:-1.06, y: 0.22, z:-0.30 },
    { x: 1.04, y: 0.30, z: 0.34 }, { x:-0.52, y:-0.78, z: 0.42 },
    { x: 0.70, y:-0.84, z:-0.34 }, { x: 0.08, y:-0.10, z:-0.92 },
  ];
  const NET_EDGES = [[0,1],[0,2],[0,5],[1,3],[2,3],[2,4],[4,3],[5,3],[1,5]];
  const GROW_TILT      = 54 * Math.PI / 180;   /* desktop: looking down onto it */
  const GROW_TILT_NARROW = 74 * Math.PI / 180; /* phone: much closer to face-on */
  const ARMS = 3, ARM_WIND = 3.5;
  /* one card per arm tip, plus one near the core */
  const GROW_ANCHORS = [
    { x: 0.92 * Math.cos(0 / ARMS * Math.PI * 2 + 0.95 * ARM_WIND),
      y: 0, z: 0.92 * Math.sin(0 / ARMS * Math.PI * 2 + 0.95 * ARM_WIND) },
    { x: 0.92 * Math.cos(1 / ARMS * Math.PI * 2 + 0.95 * ARM_WIND),
      y: 0, z: 0.92 * Math.sin(1 / ARMS * Math.PI * 2 + 0.95 * ARM_WIND) },
    { x: 0.92 * Math.cos(2 / ARMS * Math.PI * 2 + 0.95 * ARM_WIND),
      y: 0, z: 0.92 * Math.sin(2 / ARMS * Math.PI * 2 + 0.95 * ARM_WIND) },
    { x: 0.30, y: 0.06, z: -0.30 },
  ];
  /* phase boundaries are MEASURED from where each section sits, not hardcoded —
     the layout reflows and the page keeps growing */
  const PH = { flockA:0.5, flockB:1, netA:1.1, netB:1.6, layA:1.7, layB:2.2,
               growA:2.3, growB:2.8, max:4.0 };

  const LUT_N = 8192, LUT = new Float32Array(LUT_N), LUT_K = LUT_N / TAU;
  for (let i = 0; i < LUT_N; i++) LUT[i] = Math.sin(i / LUT_N * TAU);
  const QUARTER = LUT_N >> 2;
  const fsin = a => LUT[((a * LUT_K) | 0) & (LUT_N - 1)];
  const fcos = a => LUT[(((a * LUT_K) | 0) + QUARTER) & (LUT_N - 1)];

  let BW = 0, BH = 0, DPR = 1, bufW = 0, bufHb = 0, bufHf = 0;
  let raf = null, last = 0, t = 0, visible = true, sparkClock = 0;
  let scrollP = 0, heroH = 1, isWide = true;

  /* torus, polar */
  let pth = null, prd = null, pzz = null, pw = null, pw2 = null, pom = null, pst = null;
  /* murmuration, cartesian */
  let mxa = null, mya = null, mza = null;
  /* feature map, cartesian */
  let nxa = null, nya = null, nza = null;
  /* layer stack, cartesian */
  let lxa = null, lya = null, lza = null;
  /* growth spiral, cartesian */
  let gxa = null, gya = null, gza = null;
  let n = 0;

  let bufB = null, bufF = null, ctxB = null, ctxF = null;
  let imgB = null, imgF = null, datB = null, datF = null;
  let motes = [], sparks = [];
  let palR = null, palG = null, palB = null, palA = null;

  const FX_STATE = { cosT: 0, sinT: 1, lca: 1, lsa: 0, layerK: 0, nca: 1, nsa: 0, netK: 0, gca: 1, gsa: 0, growK: 0 };
  const O = { cx: 0, cy: 0, R: 0, tube: 0, ox: 0, oy: 0, cosT: 0, sinT: 1,
              sw: 0, sh: 0, offX: 0, mcx: 0, mcy: 0, mscale: 1,
              lcx: 0, lcy: 0, lscale: 1, ncx: 0, ncy: 0, nscale: 1,
              gcx: 0, gcy: 0, gscale: 1, growTilt: GROW_TILT };
  const COL = { hot: '#ffd9a8' };
  let accCur = { r: 255, g: 95, b: 31 }, accTgt = { r: 255, g: 95, b: 31 };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const smooth = (e0, e1, v) => { const x = clamp01((v - e0) / (e1 - e0)); return x * x * (3 - 2 * x); };
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.82;

  function toRgb(h) {
    h = (h || '').trim();
    const m = h.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3] };
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const v = parseInt(h, 16);
    return Number.isFinite(v) && h.length === 6
      ? { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 } : { r: 255, g: 95, b: 31 };
  }
  function rotateHue({ r, g, b }, deg) {
    const R = r / 255, G = g / 255, B = b / 255;
    const mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, s = 0;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
      h /= 6;
    }
    h = (h + deg / 360 + 1) % 1;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = tt => { tt = (tt + 1) % 1;
      return tt < 1 / 6 ? p + (q - p) * 6 * tt : tt < 0.5 ? q
           : tt < 2 / 3 ? p + (q - p) * (2 / 3 - tt) * 6 : p; };
    return { r: f(h + 1 / 3) * 255, g: f(h) * 255, b: f(h - 1 / 3) * 255 };
  }

  function buildPalette() {
    const sec = rotateHue(accCur, 48);
    palR = new Float32Array(NB); palG = new Float32Array(NB);
    palB = new Float32Array(NB); palA = new Float32Array(NB);
    for (let y = 0; y < YB; y++) {
      const ky = y / (YB - 1);
      const fade = y >= YB - 1 ? 0.5 : y === YB - 2 ? 0.8 : 1;
      for (let d = 0; d < DB; d++) {
        const kd = d / (DB - 1);
        const i = y * DB + d;
        const w = (0.10 + 0.42 * kd * kd) * fade;
        palR[i] = lerp(lerp(accCur.r, sec.r, ky), 255, kd * 0.12) * w;
        palG[i] = lerp(lerp(accCur.g, sec.g, ky), 255, kd * 0.12) * w;
        palB[i] = lerp(lerp(accCur.b, sec.b, ky), 255, kd * 0.12) * w;
        palA[i] = 255 * w * 0.8;
      }
    }
  }
  function readColours() {
    COL.hot = getComputedStyle(document.documentElement).getPropertyValue('--hot').trim() || COL.hot;
    buildPalette();
  }
  function stepAccent(dt) {
    const k = Math.min(1, dt * 2.4);
    const dr = accTgt.r - accCur.r, dg = accTgt.g - accCur.g, db = accTgt.b - accCur.b;
    if (Math.abs(dr) + Math.abs(dg) + Math.abs(db) < 1.2) return;
    accCur.r += dr * k; accCur.g += dg * k; accCur.b += db * k;
    buildPalette();
  }

  /* ── build both states ─────────────────────────────────── */
  function seed() {
    n = Math.max(0, Math.round(density));
    pth = new Float32Array(n); prd = new Float32Array(n); pzz = new Float32Array(n);
    pw = new Float32Array(n); pw2 = new Float32Array(n);
    pom = new Float32Array(n); pst = new Float32Array(n);
    mxa = new Float32Array(n); mya = new Float32Array(n); mza = new Float32Array(n);
    nxa = new Float32Array(n); nya = new Float32Array(n); nza = new Float32Array(n);
    lxa = new Float32Array(n); lya = new Float32Array(n); lza = new Float32Array(n);
    gxa = new Float32Array(n); gya = new Float32Array(n); gza = new Float32Array(n);

    const clumps = Array.from({ length: 7 }, () => Math.random() * TAU);
    const flockClumps = Array.from({ length: 6 }, () => Math.random());

    for (let i = 0; i < n; i++) {
      /* ── torus ── */
      const th = Math.random() < 0.56
        ? clumps[(Math.random() * clumps.length) | 0] + gauss() * 0.55
        : Math.random() * TAU;
      const ph = Math.random() * TAU;
      const tubeK = 0.6 + 0.55 * (0.5 + 0.5 * Math.sin(th * 2 + 1.1));
      const esc = Math.random() < 0.075 ? rnd(1.12, 1.46) : 1;
      const rNorm = rnd(0.74, 1.26);
      pth[i] = (th % TAU + TAU) % TAU;
      prd[i] = O.R * rNorm * esc + O.tube * tubeK * Math.cos(ph) * rnd(0.55, 1.3);
      pzz[i] = O.tube * tubeK * Math.sin(ph) * rnd(0.55, 1.35) * esc;
      pw[i] = Math.random() * TAU;
      pw2[i] = Math.random() * TAU;
      pom[i] = (1.42 - 0.46 * rNorm) * rnd(0.93, 1.07);
      /* arrival order: mostly by position along the pour, so the flock
         assembles leading-edge first rather than all at once */
      pst[i] = clamp01(pth[i] / TAU * 0.72 + Math.random() * 0.28);

      /* ── murmuration ──
         a BROAD, SHALLOW folded sheet. The camera is near face-on by the
         time this is visible, so vertical extent reads as vertical bars —
         a flock is wide and thin, and its bunching has to be soft. Hard
         quantised clumps resolve into stripes from this angle. */
      const cl = Math.random() < 0.64
        ? flockClumps[(Math.random() * flockClumps.length) | 0] + gauss() * 0.075
        : Math.random();
      const mth = cl * TAU * 0.86;
      const mr = 0.55 + 0.45 * Math.sin(cl * Math.PI * 1.6);
      const fold = Math.sin(cl * Math.PI * 2.2) * 0.4;
      mxa[i] = mr * Math.cos(mth) * 1.45 + gauss() * 0.14;
      mya[i] = fold * 0.82 + gauss() * 0.21;
      mza[i] = mr * Math.sin(mth) * 0.85 + gauss() * 0.14;

      /* ── feature map: nodes, and the links between them ── */
      if (Math.random() < 0.40) {
        const nd = NET[(Math.random() * NET.length) | 0];
        nxa[i] = nd.x + gauss() * 0.05; nya[i] = nd.y + gauss() * 0.05; nza[i] = nd.z + gauss() * 0.05;
      } else {
        const e = NET_EDGES[(Math.random() * NET_EDGES.length) | 0];
        const A = NET[e[0]], B = NET[e[1]], u = Math.random();
        nxa[i] = A.x + (B.x - A.x) * u + gauss() * 0.011;
        nya[i] = A.y + (B.y - A.y) * u + gauss() * 0.011;
        nza[i] = A.z + (B.z - A.z) * u + gauss() * 0.011;
      }

      /* ── layer stack ──
         four planes with a bright perimeter, so each reads as a surface
         rather than a cloud. Points are spread evenly across the four. */
      const ly = LY[i & 3];
      let lx, lz;
      if (Math.random() < 0.52) {                 /* perimeter */
        const e = (Math.random() * 4) | 0, u = rnd(-1, 1);
        if (e === 0) { lx = u; lz = -0.58; }
        else if (e === 1) { lx = u; lz = 0.58; }
        else if (e === 2) { lx = -1; lz = u * 0.58; }
        else { lx = 1; lz = u * 0.58; }
      } else { lx = rnd(-1, 1); lz = rnd(-0.58, 0.58); }
      lxa[i] = lx + gauss() * 0.012;
      lya[i] = ly + gauss() * 0.015;
      lza[i] = lz + gauss() * 0.012;

      /* ── growth: arms winding out of a dense core ──
         u^0.62 piles points up at the centre, so the core stays bright while
         the arms thin out as they reach — growth, rather than a bar chart */
      const arm = (Math.random() * ARMS) | 0;
      const u = Math.pow(Math.random(), 0.62);
      const gth = arm / ARMS * TAU + u * ARM_WIND + gauss() * 0.26;
      const gr = u * 1.02;
      gxa[i] = gr * Math.cos(gth);
      gya[i] = gauss() * 0.14 * (1 - u * 0.45);
      gza[i] = gr * Math.sin(gth);
    }

    motes = Array.from({ length: density ? 10 : 0 }, () => ({
      x: rnd(0, BW), y: rnd(0, BH), vx: rnd(-4, 4), vy: rnd(-4, 4),
      life: rnd(0, 1), rate: rnd(0.014, 0.032), ph: rnd(0, TAU), sway: rnd(3, 9),
    }));
    sparks = [];
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const hr = back.getBoundingClientRect();
    BW = Math.max(1, hr.width); BH = Math.max(1, hr.height);
    heroH = hero.offsetHeight || BH;
    back.width = Math.round(BW * DPR); back.height = Math.round(BH * DPR);
    bx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bx.imageSmoothingEnabled = true;

    if (!scene) return;
    const sr = scene.getBoundingClientRect(), S = sr.width;
    const tilt = (parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--tilt')) || 64) * Math.PI / 180;
    isWide = matchMedia('(min-width:950px)').matches;
    O.sw = sr.width; O.sh = sr.height;
    O.cx = S / 2;
    O.cy = sr.height / 2 + S * 0.115;
    O.R = S * 0.40;
    O.tube = S * 0.125;
    O.cosT = Math.cos(tilt); O.sinT = Math.sin(tilt);
    O.ox = sr.left - hr.left; O.oy = sr.top - hr.top;
    O.offX = O.sw * (BUF_WM - 1) * (isWide ? 1 : 0.5);

    /* where the flock lands: down, and left on desktop — the far end of
       the pour, inside the next section */
    /* Where the flock lands. This MUST be measured off the next section,
       not off the scene: the layout reflows at 950px and the scene moves
       down the page, which left the flock stranded inside the hero and
       above the viewport on anything narrower than a desktop. */
    /* NOTE: sx/sy in the hot loop are measured from the SCENE CENTRE, so both
       of these must be offsets from it, not absolute scene coordinates. */
    const nx = document.querySelector('.next');
    O.mcy = nx
      ? (nx.getBoundingClientRect().top - hr.top) + nx.offsetHeight * 0.64 - O.oy - O.cy
      : O.sh * 0.92;
    O.mcx = (BW / 2 - O.ox - O.cx) - (isWide ? BW * 0.16 : 0);
    O.mscale = BW * (isWide ? 0.26 : 0.34);   /* viewport-relative, so it fills the section at any width */

    /* the stack sits in section 3, measured off it for the same reason the
       flock is measured off section 2 — the layout reflows and the scene moves */
    /* each shape lands when its own section is centred in the viewport */
    const phaseEnd = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return (el.offsetTop + el.offsetHeight * 0.5 - innerHeight * 0.5) / Math.max(1, heroH * 1.3);
    };
    const pn = phaseEnd('.next'), pm = phaseEnd('.map'),
          pb = phaseEnd('.build'), pg = phaseEnd('.grow');
    if (pn !== null) { PH.flockB = pn; PH.flockA = pn - 0.55; }
    if (pm !== null) { PH.netB = pm; PH.netA = pm - 0.52; }
    if (pb !== null) { PH.layB = pb; PH.layA = pb - 0.52; }
    if (pg !== null) { PH.growB = pg; PH.growA = pg - 0.52; }
    PH.max = (pg !== null ? pg : pb !== null ? pb : 2.2) + 1;

    const mp = document.querySelector('.map');
    O.ncy = mp
      ? (mp.getBoundingClientRect().top - hr.top) + mp.offsetHeight * 0.60 - O.oy - O.cy
      : O.mcy + O.sh * 1.5;
    O.ncx = (BW / 2 - O.ox - O.cx) - (isWide ? BW * 0.12 : 0);
    O.nscale = BW * (isWide ? 0.20 : 0.28);

    const gw = document.querySelector('.grow');
    O.gcy = gw
      ? (gw.getBoundingClientRect().top - hr.top) + gw.offsetHeight * (isWide ? 0.60 : 0.62) - O.oy - O.cy
      : O.lcy + O.sh * 1.5;
    O.gcx = (BW / 2 - O.ox - O.cx);
    /* wider and flatter on a phone: the arms need both the room and the angle
       to read as a spiral rather than a vertical slab */
    O.gscale = BW * (isWide ? 0.23 : 0.44);
    O.growTilt = isWide ? GROW_TILT : GROW_TILT_NARROW;

    const bd = document.querySelector('.build');
    O.lcy = bd
      ? (bd.getBoundingClientRect().top - hr.top) + bd.offsetHeight * 0.60 - O.oy - O.cy
      : O.mcy + O.sh * 1.6;
    O.lcx = (BW / 2 - O.ox - O.cx) - (isWide ? BW * 0.10 : 0);
    O.lscale = BW * (isWide ? 0.21 : 0.30);

    if (front) {
      front.width = Math.round(O.sw * BUF_WM * DPR);
      front.height = Math.round(O.sh * BUF_HF * DPR);
      fx.setTransform(DPR, 0, 0, DPR, 0, 0);
      fx.imageSmoothingEnabled = true;
    }
    const mk = () => { const c = document.createElement('canvas'); c.width = BUF_PX; c.height = BUF_PX; return c; };
    bufB = mk(); ctxB = bufB.getContext('2d');
    imgB = ctxB.createImageData(BUF_PX, BUF_PX); datB = imgB.data;
    bufF = mk(); ctxF = bufF.getContext('2d');
    imgF = ctxF.createImageData(BUF_PX, BUF_PX); datF = imgF.data;

    seed();
    if (raf === null) draw();
  }

  function newSpark() {
    const th = rnd(0, TAU), c = Math.cos(th), s = Math.sin(th);
    const x = O.cx + O.R * c, y = O.cy + O.R * s * O.cosT;
    const sp = rnd(60, 160);
    return { x, y, px: x, py: y, vx: -s * sp, vy: c * sp * O.cosT - rnd(20, 60),
             r: rnd(0.6, 1.3), life: 1, rate: rnd(0.55, 1.0), front: s > 0 };
  }

  function step(dt) {
    t += dt;
    for (const p of motes) {
      p.life += p.rate * dt;
      if (p.life >= 1) { p.life = 0; p.x = rnd(0, BW); p.y = rnd(0, BH); }
      p.ph += dt * 0.5;
      p.x += (p.vx + Math.sin(p.ph) * p.sway) * dt;
      p.y += (p.vy + Math.cos(p.ph * 0.7) * p.sway * 0.5) * dt;
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.px = s.x; s.py = s.y; s.life -= s.rate * dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      s.vy += 190 * dt; s.vx *= 1 - 0.9 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
    }
    sparkClock -= dt;
    if (sparkClock <= 0 && density > 0 && scrollP < 0.25) {
      sparkClock = rnd(2.4, 5.0);
      for (let i = 0, k = Math.round(rnd(1, 3)); i < k; i++) sparks.push(newSpark());
    }
  }

  /* ── the hot loop ──────────────────────────────────────── */
  function accumulate() {
    datB.fill(0); datF.fill(0);
    const invTau = 1 / TAU;

    const p = scrollP;
    const pourK = smooth(0.26, 0.72, p);          /* torus → helix        */
    const morphG = smooth(PH.flockA, PH.flockB, p); /* helix → murmuration */
    const netK   = smooth(PH.netA, PH.netB, p);   /* murmuration → map    */
    const layerK = smooth(PH.layA, PH.layB, p);   /* map → stack          */
    const growK  = smooth(PH.growA, PH.growB, p); /* stack → spiral       */

    const angMult = 1 + pourK * (HELIX_TURNS - 1);
    const drop = pourK * O.sh * 1.55;
    const lateral = isWide ? -pourK * O.sw * 1.05 : 0;
    const taper = pourK * 0.62;
    const spin = t * 0.16;
    /* the flock is scaled to the viewport, so on a phone the same point count
       lands in far fewer pixels and saturates. damp it on narrow layouts. */
    const boost = (1 + pourK * 1.45 - morphG * 1.18) * (isWide ? 1 : 1 - morphG * 0.52);

    /* the view rect: tight on the torus at rest, tight on the flock at the
       end, widening through the pour where the content really does span a
       lot of ground. Resolution therefore peaks exactly where the cloud is
       still and you can study it. */
    const spread = pourK * (1 - morphG);
    const vHalf = lerp(lerp(lerp(lerp(O.sw * 0.70, O.mscale * 1.55, morphG), O.nscale * 1.5, netK),
                       O.lscale * 1.5, layerK), O.gscale * 1.45, growK) * (1 + spread * 1.9);
    const vCx = lerp(lerp(lerp(lerp(0, O.mcx, morphG), O.ncx, netK), O.lcx, layerK), O.gcx, growK)
              + lateral * 0.42 * (1 - netK);
    const vCy = lerp(lerp(lerp(lerp(0, O.mcy, morphG), O.ncy, netK), O.lcy, layerK), O.gcy, growK)
              + drop * 0.42 * (1 - netK);
    O.vHalf = vHalf; O.vCx = vCx; O.vCy = vCy;
    const vk = BUF_PX / (2 * vHalf), HALF = BUF_PX * 0.5;   /* `vk`: `k` is taken by the splat loop */
    /* Brightness must track the mapping. N points spread across a content area
       occupy (area x vk^2) buffer pixels, so density per pixel scales with
       vk^2 — raise the resolution and the same cloud goes faint. 0.52 is the
       old fixed scale this was balanced against. */
    const resK = (vk / 0.52) * (vk / 0.52);
    const invSh = 1 / O.sh;

    /* the camera lifts out of the ground plane as the flock takes over */
    const tiltNow = lerp(lerp(lerp(lerp(Math.acos(O.cosT), FLOCK_TILT, morphG), NET_TILT, netK),
                          LAYER_TILT, layerK), O.growTilt, growK);
    const cosT = Math.cos(tiltNow), sinT = Math.sin(tiltNow);
    const FLOW = 0.30;                       /* flow-field amplitude */
    const surgeX = 0.11 * fsin(t * 0.37);    /* the whole flock leaning */
    const surgeY = 0.07 * fsin(t * 0.29 + 1.3);
    const mSpin = t * 0.055;
    const nSpin = t * 0.075;
    const nca = fcos(nSpin), nsa = fsin(nSpin);
    const nscale = O.nscale, ncx = O.ncx, ncy = O.ncy;
    const invNDepth = 1 / (nscale * 1.15);
    const lSpin = t * 0.085;
    const lca = fcos(lSpin), lsa = fsin(lSpin);
    const lscale = O.lscale, lcx = O.lcx, lcy = O.lcy;
    const invLDepth = 1 / (lscale * 1.2);
    const gSpin = t * 0.050;
    const gca = fcos(gSpin), gsa = fsin(gSpin);
    const gscale = O.gscale, gcx = O.gcx, gcy = O.gcy;
    const invGDepth = 1 / (gscale * 1.1);
    FX_STATE.cosT = cosT; FX_STATE.sinT = sinT;
    FX_STATE.lca = lca; FX_STATE.lsa = lsa; FX_STATE.layerK = layerK;
    FX_STATE.nca = nca; FX_STATE.nsa = nsa; FX_STATE.netK = netK;
    FX_STATE.gca = gca; FX_STATE.gsa = gsa; FX_STATE.growK = growK;
    const mca = fcos(mSpin), msa = fsin(mSpin);
    const mscale = O.mscale, mcx = O.mcx, mcy = O.mcy;
    const invDepth = 1 / (O.R * 1.5 + O.tube);
    const invMDepth = 1 / (mscale * 1.1);

    for (let i = 0; i < n; i++) {
      /* per-point arrival: staggered, so the flock forms in a wave */
      const m = morphG <= 0 ? 0 : clamp01((morphG - pst[i] * 0.42) / 0.58);

      /* ── torus / pour ── */
      const base = pth[i];
      const u = base * invTau;
      const th = base * angMult + spin * pom[i];
      const turb = 1 + 0.07 * fsin(pw[i] + t * 0.55) + 0.045 * fsin(pw2[i] * 1.7 + t * 0.93);
      const rMean = O.R * (1 - taper * u);
      const r = (rMean + (prd[i] - O.R) * (1 - pourK * 0.84)) * turb;
      const z = pzz[i] * (1 - pourK * 0.72) + O.tube * 0.5 * fsin(pw2[i] + t * 0.7) * (1 - pourK * 0.6);
      const ry = r * fsin(th);
      let sx = r * fcos(th) + lateral * u;
      let sy = ry * cosT - z * sinT + drop * u;
      let sz = ry * sinT + z * cosT;
      let dep = sz * invDepth * 0.5 + 0.5;

      /* ── murmuration, projected in its own right then blended ── */
      let bright = 1;
      if (m > 0.001) {
        /* FLOW FIELD. Three sines sampled at the bird's OWN position (not just
           its private phase) and cross-combined into a swirl. Sampling by
           position is what makes neighbours move together — a per-point phase
           alone gives 85k independent wobbles, which reads as static, not as a
           flock. Cross-combining keeps it roughly divergence-free, so the cloud
           folds through itself instead of inflating. */
        const q1 = fsin(mxa[i] * 2.3 + t * 0.90 + pw[i] * 0.4);
        const q2 = fsin(mya[i] * 2.7 - t * 0.75 + pw2[i] * 0.4);
        const q3 = fsin(mza[i] * 2.1 + t * 1.05 + pw[i] * 0.2);
        const ax = (mxa[i] + FLOW * (q2 - q3) + surgeX) * mscale;
        const ay = (mya[i] + FLOW * 0.62 * (q3 - q1) + surgeY) * mscale;
        const az = (mza[i] + FLOW * (q1 - q2)) * mscale;
        const rx2 = ax * mca - az * msa;
        const rz2 = ax * msa + az * mca;
        const msy = ay * cosT - rz2 * sinT;
        const msz = ay * sinT + rz2 * cosT;
        const mX = mcx + rx2, mY = mcy + msy;
        sx = lerp(sx, mX, m);
        sy = lerp(sy, mY, m);
        dep = lerp(dep, msz * invMDepth * 0.5 + 0.5, m);
        sz = lerp(sz, msz, m);
        /* DENSITY WAVE travelling through the flock. The rippling light and
           dark banding is the thing that actually reads as a murmuration. */
        bright = lerp(1, 0.4 + 1.25 * (0.5 + 0.5 * fsin(mxa[i] * 2.6 + mza[i] * 1.4 + t * 1.45)), m);
      }

      /* ── through the feature map ── */
      if (netK > 0.001) {
        const q = clamp01((netK - pst[i] * 0.38) / 0.62);
        if (q > 0.001) {
          const ax = nxa[i] * nscale, ay = nya[i] * nscale, az = nza[i] * nscale;
          const rx4 = ax * nca - az * nsa, rz4 = ax * nsa + az * nca;
          const nsy = ay * cosT - rz4 * sinT, nsz = ay * sinT + rz4 * cosT;
          sx = lerp(sx, ncx + rx4, q);
          sy = lerp(sy, ncy + nsy, q);
          dep = lerp(dep, nsz * invNDepth * 0.5 + 0.5, q);
          sz = lerp(sz, nsz, q);
          bright = lerp(bright, 1, q);
        }
      }

      /* ── and on into the stack ── */
      if (layerK > 0.001) {
        const l = clamp01((layerK - pst[i] * 0.38) / 0.62);
        if (l > 0.001) {
          const ax = lxa[i] * lscale, ay = lya[i] * lscale, az = lza[i] * lscale;
          const rx3 = ax * lca - az * lsa;
          const rz3 = ax * lsa + az * lca;
          const lsy = ay * cosT - rz3 * sinT;
          const lsz = ay * sinT + rz3 * cosT;
          sx = lerp(sx, lcx + rx3, l);
          sy = lerp(sy, lcy + lsy, l);
          dep = lerp(dep, lsz * invLDepth * 0.5 + 0.5, l);
          sz = lerp(sz, lsz, l);
          bright = lerp(bright, 1, l);        /* drop the flock's density wave */
        }
      }

      /* ── and out into the spiral ── */
      if (growK > 0.001) {
        const w2 = clamp01((growK - pst[i] * 0.40) / 0.60);
        if (w2 > 0.001) {
          const ax = gxa[i] * gscale, ay = gya[i] * gscale, az = gza[i] * gscale;
          const rx5 = ax * gca - az * gsa, rz5 = ax * gsa + az * gca;
          const gsy = ay * cosT - rz5 * sinT, gsz = ay * sinT + rz5 * cosT;
          sx = lerp(sx, gcx + rx5, w2);
          sy = lerp(sy, gcy + gsy, w2);
          dep = lerp(dep, gsz * invGDepth * 0.5 + 0.5, w2);
          sz = lerp(sz, gsz, w2);
        }
      }

      const fxp = (sx - vCx) * vk + HALF, fyp = (sy - vCy) * vk + HALF;
      const x = fxp | 0, y = fyp | 0;
      if (x < 0 || y < 0 || x >= BUF_PX - 1 || y >= BUF_PX - 1) continue;

      /* once the cloud has dropped past the device there is nothing left to
         occlude, so the near/far split stops mattering and it all goes back */
      const useFront = sz > 0 && fx && m < 0.5;

      let db = (dep * DB) | 0; if (db < 0) db = 0; else if (db >= DB) db = DB - 1;
      /* colour band keyed to position in the SCENE, not in the buffer, so the
         gradient does not swim about as the view rect moves */
      let yb = (((sy + O.cy) * invSh) * YB) | 0; if (yb < 0) yb = 0; else if (yb >= YB) yb = YB - 1;
      const c = yb * DB + db;
      const bw = boost * bright * resK;
      const pr = palR[c] * bw, pg = palG[c] * bw, pb = palB[c] * bw, pa = palA[c] * bw;
      const dat = useFront ? datF : datB;

      const uu = fxp - x, ww = fyp - y;
      const iu = 1 - uu, iw = 1 - ww;
      const w00 = iu * iw, w10 = uu * iw, w01 = iu * ww, w11 = uu * ww;
      const row = (y * BUF_PX + x) << 2, row2 = ((y + 1) * BUF_PX + x) << 2;
      let o, k, v;
      for (let q = 0; q < 4; q++) {
        o = q === 0 ? row : q === 1 ? row + 4 : q === 2 ? row2 : row2 + 4;
        k = q === 0 ? w00 : q === 1 ? w10 : q === 2 ? w01 : w11;
        v = dat[o] + pr * k; dat[o] = v > 255 ? 255 : v;
        v = dat[o + 1] + pg * k; dat[o + 1] = v > 255 ? 255 : v;
        v = dat[o + 2] + pb * k; dat[o + 2] = v > 255 ? 255 : v;
        v = dat[o + 3] + pa * k; dat[o + 3] = v > 255 ? 255 : v;
      }
    }
    ctxB.putImageData(imgB, 0, 0);
    ctxF.putImageData(imgF, 0, 0);
  }

  let chipEls = [], chipN = -1;
  function syncChips(ang) {
    const orb = document.getElementById('orb');
    if (!orb) return;
    if (orb.children.length !== chipN) {
      chipEls = Array.from(orb.children); chipN = chipEls.length;
      orb.classList.add('js-orbit');
    }
    if (!chipN) return;
    const vis = clamp01(1 - scrollP * 2.2);
    const Rc = O.R * 1.04, Ry = Rc * O.cosT;
    for (let i = 0; i < chipN; i++) {
      const a = ang + (i / chipN) * TAU;
      const sn = Math.sin(a), cs = Math.cos(a);
      const el = chipEls[i];
      const k = 0.84 + 0.2 * (sn * 0.5 + 0.5);
      el.style.transform =
        `translate(${(cs * Rc).toFixed(1)}px,${(sn * Ry + scrollP * O.sh * 0.5).toFixed(1)}px) scale(${k.toFixed(3)})`;
      el.style.opacity = vis.toFixed(2);
      el.style.zIndex = sn > 0 ? 7 : 1;
    }
  }

  /* Cards ride the SAME projection as the particles they belong to, so each one
     sits on its own node or plane and re-stacks front to back as the structure
     turns. Generic over both structures: the stack is pinned to one side
     (a column reads better), the map fans its cards radially and relaxes any
     collisions, because two nodes can project to nearly the same point. */
  const cardSets = {};
  function placeCards(hostId, anchors, cx, cy, scale, ca, sa, cosT, sinT, vis, fixedSide) {
    let set = cardSets[hostId];
    if (!set) {
      const host = document.getElementById(hostId);
      set = cardSets[hostId] = { host, els: host ? Array.from(host.children) : [], box: null };
      set.box = set.els.map(() => ({ w: 0, h: 0 }));
    }
    if (!set.host || !set.els.length) return;
    if (vis <= 0.001) { for (const el of set.els) el.style.opacity = '0'; return; }

    const hostR = set.host.getBoundingClientRect(), heroR = hero.getBoundingClientRect();
    const ox = (O.ox + O.cx) - (hostR.left - heroR.left);
    const oy = (O.oy + O.cy) - (hostR.top - heroR.top);
    const HW = hostR.width, HH = hostR.height;

    const items = set.els.map((el, i) => {
      if (!set.box[i].w) { set.box[i].w = el.offsetWidth; set.box[i].h = el.offsetHeight; }
      const a = anchors[i];
      const ax = a.x * scale, ay = a.y * scale, az = a.z * scale;
      const rx = ax * ca - az * sa, rz = ax * sa + az * ca;
      const sy = ay * cosT - rz * sinT, sz = ay * sinT + rz * cosT;
      const depth = clamp01(sz / (scale * 1.2) * 0.5 + 0.5);
      const k = 0.88 + 0.16 * depth;
      const w = set.box[i].w * k, h = set.box[i].h * k;
      const px = ox + cx + rx, py = oy + cy + sy;
      const side = fixedSide || ((px - (ox + cx)) >= 0 ? 1 : -1);
      return { el, px, py, depth, k, w, h,
               x: px + side * 18 - (side < 0 ? w : 0), y: py - h / 2 };
    });

    /* separation and clamping have to converge TOGETHER. Clamping after the
       fact shoves cards back into each other against an edge, which is how a
       phone ended up with overlaps that the relaxation had already resolved. */
    for (let it = 0; it < 14; it++) {
      for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) {
        const A = items[a], B = items[b], PAD = 8;
        const ox2 = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x) + PAD;
        const oy2 = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y) + PAD;
        if (ox2 > 0 && oy2 > 0) {
          const push = oy2 * 0.5;
          if (A.y <= B.y) { A.y -= push; B.y += push; } else { A.y += push; B.y -= push; }
        }
      }
      for (const q of items) {
        q.x = Math.max(6, Math.min(HW - q.w - 6, q.x));
        q.y = Math.max(6, Math.min(HH - q.h - 6, q.y));
      }
    }
    for (const it of items) {
      it.el.style.transform = `translate(${it.x.toFixed(1)}px,${it.y.toFixed(1)}px) scale(${it.k.toFixed(3)})`;
      it.el.style.opacity = (vis * (0.5 + 0.5 * it.depth)).toFixed(2);
      it.el.style.zIndex = String(2 + Math.round(it.depth * 6));
    }
  }

  const LAYER_ANCHORS = [3, 2, 1, 0].map(j => ({ x: 1.2, y: LY[j], z: 0 }));

  function draw() {
    bx.clearRect(0, 0, BW, BH);
    if (fx) fx.clearRect(0, 0, O.sw * BUF_WM, O.sh * BUF_HF);
    if (density === 0 || !datB) return;

    syncChips(t * 0.16 * 0.96);
    accumulate();
    placeCards('ncards', NET, O.ncx, O.ncy, O.nscale, FX_STATE.nca, FX_STATE.nsa,
               FX_STATE.cosT, FX_STATE.sinT, clamp01((FX_STATE.netK - 0.3) / 0.45) * (1 - FX_STATE.layerK), 0);
    placeCards('lcards', LAYER_ANCHORS, O.lcx, O.lcy, O.lscale, FX_STATE.lca, FX_STATE.lsa,
               FX_STATE.cosT, FX_STATE.sinT,
               clamp01((FX_STATE.layerK - 0.3) / 0.45) * (1 - FX_STATE.growK), 1);
    placeCards('gcards', GROW_ANCHORS, O.gcx, O.gcy, O.gscale, FX_STATE.gca, FX_STATE.gsa,
               FX_STATE.cosT, FX_STATE.sinT, clamp01((FX_STATE.growK - 0.3) / 0.45), 0);
    const vs = 2 * O.vHalf;
    /* back canvas is in hero coords; front canvas starts one scene-width left */
    bx.drawImage(bufB, O.ox + O.cx + O.vCx - O.vHalf, O.oy + O.cy + O.vCy - O.vHalf, vs, vs);
    if (fx) fx.drawImage(bufF, O.sw + O.cx + O.vCx - O.vHalf, O.cy + O.vCy - O.vHalf, vs, vs);

    bx.globalCompositeOperation = 'lighter';
    for (const p of motes) {
      const a = Math.sin(p.life * Math.PI) * 0.26;
      if (a <= 0) continue;
      bx.globalAlpha = a;
      bx.fillStyle = `rgb(${accCur.r | 0},${accCur.g | 0},${accCur.b | 0})`;
      bx.fillRect(p.x, p.y, 2, 2);
    }
    for (const s of sparks) {
      const ctx = s.front && fx ? fx : bx;
      const ax = s.front && fx ? 0 : O.ox, ay = s.front && fx ? 0 : O.oy;
      if (ctx === fx) ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.max(0, s.life) * 0.9;
      ctx.strokeStyle = COL.hot; ctx.lineWidth = s.r; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s.px + ax, s.py + ay); ctx.lineTo(s.x + ax, s.y + ay); ctx.stroke();
    }
    bx.globalAlpha = 1; bx.globalCompositeOperation = 'source-over';
    if (fx) { fx.globalAlpha = 1; fx.globalCompositeOperation = 'source-over'; }
  }

  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    stepAccent(dt); step(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (raf !== null || reduce.matches || density === 0 || !visible) return;
    last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }

  function onScroll() {
    /* no longer clamped to 1 — the stack phase lives beyond the flock */
    const v = window.scrollY / Math.max(1, heroH * 1.3);
    scrollP = v < 0 ? 0 : v > PH.max ? PH.max : v;
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* The flock lives below the hero, so the loop must keep running while
     EITHER section is on screen. Two observers each writing `visible`
     directly meant the hero's "I have left the viewport" overwrote the
     next section's "I am visible", and the flock froze at exactly the
     point you were looking at it. Track them separately. */
  let heroVis = true, nextVis = false, buildVis = false, mapVis = false, growVis = false;
  const syncVis = () => { visible = heroVis || nextVis || buildVis || mapVis || growVis; visible ? start() : stop(); };
  new IntersectionObserver(es => { heroVis = es[0].isIntersecting; syncVis(); },
    { threshold: 0 }).observe(hero);
  const nxt = document.querySelector('.next');
  if (nxt) new IntersectionObserver(es => { nextVis = es[0].isIntersecting; syncVis(); },
    { threshold: 0 }).observe(nxt);
  const mpS = document.querySelector('.map');
  if (mpS) new IntersectionObserver(es => { mapVis = es[0].isIntersecting; syncVis(); },
    { threshold: 0 }).observe(mpS);
  const gwS = document.querySelector('.grow');
  if (gwS) new IntersectionObserver(es => { growVis = es[0].isIntersecting; syncVis(); },
    { threshold: 0 }).observe(gwS);
  const bld = document.querySelector('.build');
  if (bld) new IntersectionObserver(es => { buildVis = es[0].isIntersecting; syncVis(); },
    { threshold: 0 }).observe(bld);

  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  addEventListener('resize', () => { stop(); resize(); onScroll(); start(); }, { passive: true });
  reduce.addEventListener?.('change', () => { stop(); resize(); start(); });

  window.FX = {
    setDensity(name) {
      density = DENSITY[name] ?? DENSITY.rich;
      stop(); seed();
      if (density === 0) { bx.clearRect(0, 0, BW, BH); if (fx) fx.clearRect(0, 0, O.sw * BUF_WM, O.sh * BUF_HF); }
      else { draw(); start(); }
    },
    reskin() { readColours(); draw(); },
    setAccent(hex) {
      if (!hex) return;
      accTgt = toRgb(hex);
      if (reduce.matches || raf === null) { accCur = { ...accTgt }; buildPalette(); draw(); }
    },
    points: () => n,
    scroll: () => scrollP,
  };

  const startProj = getComputedStyle(document.documentElement).getPropertyValue('--proj');
  if (startProj && startProj.trim()) { accCur = toRgb(startProj); accTgt = { ...accCur }; }

  readColours();
  resize();
  onScroll();
  if (reduce.matches) { t = 0.4; draw(); } else start();
})();
