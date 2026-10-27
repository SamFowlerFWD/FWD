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
  /* Six bands past the scene gradient, reserved for the helix: one per
     backbone and four for the base pairs. They are extra ROWS of the same
     palette, so the hot loop indexes them exactly like any other band and
     keeps its depth shading for free — no branch, no second code path.
     Hues are offsets from the live project accent, so the whole scheme
     rotates with whichever client is on screen instead of being pasted on. */
  const DNA_BANDS = 6, YB_ALL = YB + DNA_BANDS, NB_ALL = YB_ALL * DB;
  const DNA_HUE = [-8, 46, 100, -24, 34, 200];
  const DNA_STEPS = 12;
  const TAU = Math.PI * 2;
  const HELIX_TURNS = 2.6;
  const FLOCK_TILT = 22 * Math.PI / 180;   /* camera lifts as the flock forms  */
  const LAYER_TILT = 26 * Math.PI / 180;   /* and settles for the stack        */
  const LY = [-0.93, -0.31, 0.31, 0.93];   /* the four planes, in unit space   */
  /* A murmuration is made of BIRDS. 95k points give it mass, but mass alone
     reads as dust. A few hundred actual glyphs riding the same flock positions
     give it species — drawn over the cloud, not instead of it. */
  const BIRD_N = 240;
  /* The flock briefly pulls itself into one enormous bird, holds a beat, then
     releases. Real murmurations throw shapes like this for a second or two.
     Drawn almost face-on, because a silhouette squashed onto the ground plane
     is just a smear. */
  const SIL_TILT = 9 * Math.PI / 180;
  const DNA_TILT = 12 * Math.PI / 180;   /* side on, so the twist reads   */
  const MIC_TILT = 30 * Math.PI / 180;
  const DNA_TURNS = 2.1, DNA_RAD = 0.46, DNA_H = 1.78;
  const NET_TILT = 40 * Math.PI / 180;
  /* the feature map: what is needed, and how it hangs together */
  const NET = [
    { x: 0.02, y: 0.86, z: 0.16 }, { x:-1.06, y: 0.22, z:-0.30 },
    { x: 1.04, y: 0.30, z: 0.34 }, { x:-0.52, y:-0.78, z: 0.42 },
    { x: 0.70, y:-0.84, z:-0.34 }, { x: 0.08, y:-0.10, z:-0.92 },
  ];
  const NET_EDGES = [[0,1],[0,2],[0,5],[1,3],[2,3],[2,4],[4,3],[5,3],[1,5]];
  /* A rocket is a surface of revolution, so seen from above it is a circle.
     The spiral this replaced wanted a camera looking down onto it; this wants
     one almost level with the pad. */
  const GROW_TILT        = 15 * Math.PI / 180;
  const GROW_TILT_NARROW = 11 * Math.PI / 180;
  const FINS = 3;
  /* y runs DOWN the screen, so the airframe is built in negatives and the
     exhaust in positives. Every rocket figure below is in these units. */
  const R_NOSE = -0.98, R_SHOULDER = -0.80, R_ENGINE = -0.12, R_SKIRT = -0.02;
  const R_RAD = 0.115, R_FLARE = 0.172, R_FIN = 0.355;
  /* The view rect is square and 1.45 units half-height, so the column has to
     die inside that or it ends on a razor-straight horizontal cut. */
  const PLUME_LEN = 1.25;
  /* The view square is 1.45 units half-height but a 16:9 viewport only shows
     the middle ~1.27 of that, so the airframe has to live inside the smaller
     number or the nose leaves the screen a third of the way up the climb.
     GROW_DROP sits the whole thing lower at rest to buy the climb its room. */
  const GROW_DROP = 0.12;
  /* the cards flank it rather than pinning to it: these label clients, not
     parts of the airframe, so they are annotation and stay put */
  const GROW_ANCHORS = [
    { x: -0.62, y: -0.74, z: 0 },
    { x:  0.62, y: -0.40, z: 0 },
    { x: -0.62, y:  0.02, z: 0 },
    { x:  0.62, y:  0.38, z: 0 },
  ];
  /* Two columns do not fit on a phone, so the relaxation stacks them into one
     and that column lands straight on the airframe. Below the engine instead,
     over the plume, which is a soft column that reads fine behind text. */
  const GROW_ANCHORS_NARROW = [
    { x: -0.42, y: 0.24, z: 0 },
    { x: -0.42, y: 0.60, z: 0 },
    { x: -0.42, y: 0.96, z: 0 },
    { x: -0.42, y: 1.32, z: 0 },
  ];
  /* phase boundaries are MEASURED from where each section sits, not hardcoded —
     the layout reflows and the page keeps growing */
  const PH = { dnaA:0.3, dnaB:0.8, micA:0.9, micB:1.4, flockA:1.5, flockB:2, netA:1.1, netB:1.6, layA:1.7, layB:2.2,
               growA:2.3, growB:2.8, birdC:1.15, max:4.0, endP:3.4 };

  const LUT_N = 8192, LUT = new Float32Array(LUT_N), LUT_K = LUT_N / TAU;
  for (let i = 0; i < LUT_N; i++) LUT[i] = Math.sin(i / LUT_N * TAU);
  const QUARTER = LUT_N >> 2;
  const fsin = a => LUT[((a * LUT_K) | 0) & (LUT_N - 1)];
  const fcos = a => LUT[(((a * LUT_K) | 0) + QUARTER) & (LUT_N - 1)];

  let BW = 0, BH = 0, DPR = 1, bufW = 0, bufHb = 0, bufHf = 0;
  let raf = null, last = 0, t = 0, visible = true, sparkClock = 0;
  let scrollP = 0, heroH = 1, isWide = true;

  /* torus, polar */
  let pth = null, prd = null, pzz = null, pw = null, pw2 = null, pom = null, pst = null, loud = null;
  const birdIdx = new Int32Array(BIRD_N), birdPh = new Float32Array(BIRD_N);
  const birdX = new Float32Array(BIRD_N), birdY = new Float32Array(BIRD_N);
  const birdD = new Float32Array(BIRD_N);
  const birdPX = new Float32Array(BIRD_N), birdPY = new Float32Array(BIRD_N);
  let birdCount = 0, birdVis = 0;
  /* murmuration, cartesian */
  let mxa = null, mya = null, mza = null;
  /* double helix, and the microscopic field */
  let dxa = null, dya = null, dza = null, dcb = null;
  let dox = null, doy = null, doz = null;
  let uxa = null, uya = null, uza = null;
  /* giant bird silhouette, cartesian + span param */
  let bxa = null, bya = null, bza = null, bua = null;
  /* feature map, cartesian */
  let nxa = null, nya = null, nza = null;
  /* layer stack, cartesian */
  let lxa = null, lya = null, lza = null;
  /* the rocket: airframe points are cartesian, exhaust points bake an angle
     and a seed and are placed per frame so the plume actually flows */
  let gxa = null, gya = null, gza = null;
  let n = 0, plumeFrom = 0;

  let bufB = null, bufF = null, ctxB = null, ctxF = null;
  let imgB = null, imgF = null, datB = null, datF = null;
  let motes = [], sparks = [];
  let palR = null, palG = null, palB = null, palA = null;

  const FX_STATE = { cosT: 0, sinT: 1, lca: 1, lsa: 0, layerK: 0, nca: 1, nsa: 0, netK: 0, gca: 1, gsa: 0, growK: 0, gcy: 0, silK: 0, swY: 0 };
  const O = { cx: 0, cy: 0, R: 0, tube: 0, ox: 0, oy: 0, cosT: 0, sinT: 1,
              sw: 0, sh: 0, offX: 0, mcx: 0, mcy: 0, mscale: 1,
              lcx: 0, lcy: 0, lscale: 1, ncx: 0, ncy: 0, nscale: 1,
              gcx: 0, gcy: 0, gscale: 1, growTilt: GROW_TILT,
              bcx: 0, bcy: 0, bscale: 1,
              dcx: 0, dcy: 0, dscale: 1, ucx: 0, ucy: 0, uscale: 1 };
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
    /* a wider sweep than the 48 it had, so the helix has two ends to pick
       from, but not so wide that a warm accent swings right round into green
       and the two strands read as a traffic light */
    const sec = rotateHue(accCur, 64);
    palR = new Float32Array(NB_ALL); palG = new Float32Array(NB_ALL);
    palB = new Float32Array(NB_ALL); palA = new Float32Array(NB_ALL);
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
    /* the helix's own bands. No scene fade on these: they are a diagram, not
       a gradient, and dimming the bottom two would lose a base pair. */
    for (let k = 0; k < DNA_BANDS; k++) {
      const h = rotateHue(accCur, DNA_HUE[k]);
      for (let d = 0; d < DB; d++) {
        const kd = d / (DB - 1);
        const i = (YB + k) * DB + d;
        /* lighter per point than the scene bands, and barely any white mix.
           Accumulation clips the dominant channel first, so a point that
           carries too much of its colour turns the condensed ribbon white and
           throws the base pairs away — the thing the colour is here for. */
        /* The backbones are 70% of the points and so clip first; held back,
           they keep their own hue and stop drowning the base pairs, which is
           the hierarchy a DNA diagram actually has. */
        const w = (0.10 + 0.42 * kd * kd) * (k < 2 ? 0.56 : 0.86);
        palR[i] = lerp(h.r, 255, kd * 0.05) * w;
        palG[i] = lerp(h.g, 255, kd * 0.05) * w;
        palB[i] = lerp(h.b, 255, kd * 0.05) * w;
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
    loud = new Float32Array(n);
    mxa = new Float32Array(n); mya = new Float32Array(n); mza = new Float32Array(n);
    dxa = new Float32Array(n); dya = new Float32Array(n); dza = new Float32Array(n);
    dcb = new Float32Array(n);
    dox = new Float32Array(n); doy = new Float32Array(n); doz = new Float32Array(n);
    uxa = new Float32Array(n); uya = new Float32Array(n); uza = new Float32Array(n);
    bxa = new Float32Array(n); bya = new Float32Array(n);
    bza = new Float32Array(n); bua = new Float32Array(n);
    nxa = new Float32Array(n); nya = new Float32Array(n); nza = new Float32Array(n);
    lxa = new Float32Array(n); lya = new Float32Array(n); lza = new Float32Array(n);
    gxa = new Float32Array(n); gya = new Float32Array(n); gza = new Float32Array(n);
    /* split by index rather than by coin toss, so the airframe/exhaust ratio
       is exact instead of binomial */
    plumeFrom = (n * 0.46) | 0;

    const clumps = Array.from({ length: 7 }, () => Math.random() * TAU);
    let seedCells = null;
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
      loud[i] = Math.random();           /* who joins the murmur, and when */

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

      /* ── double helix: two strands plus the rungs between them ── */
      {
        /* The curve and the scatter around it are stored APART. That is the
           whole trick behind the condense: dial the scatter to nothing and
           every point lands on an exact curve, which accumulates into a solid
           ribbon; dial it back up and the ribbon breaks into particles again.
           Baking the two together, as this did, leaves no handle to turn. */
        const q = Math.random();
        if (q < 0.70) {                                /* the strands */
          const b3 = Math.random() < 0.5;
          const v = Math.random();
          const th = v * DNA_TURNS * TAU + (b3 ? 0 : Math.PI);
          dxa[i] = DNA_RAD * Math.cos(th);
          dya[i] = (v - 0.5) * DNA_H;
          dza[i] = DNA_RAD * Math.sin(th);
          const jr = 0.054 * Math.sqrt(Math.random());  /* strands have thickness */
          const ja = Math.random() * TAU;
          dox[i] = jr * Math.cos(ja);
          doy[i] = gauss() * 0.014;
          doz[i] = jr * Math.sin(ja);
          dcb[i] = YB + (b3 ? 0 : 1);
        } else {                                        /* rungs: the base pairs */
          const ki = Math.round(Math.random() * DNA_STEPS);
          const step = ki / DNA_STEPS;
          const th = step * DNA_TURNS * TAU;
          const w = Math.random() * 2 - 1;
          dxa[i] = DNA_RAD * Math.cos(th) * w;
          dya[i] = (step - 0.5) * DNA_H;
          dza[i] = DNA_RAD * Math.sin(th) * w;
          dox[i] = gauss() * 0.022;
          doy[i] = gauss() * 0.022;
          doz[i] = gauss() * 0.022;
          /* Each rung is one base pair, and a base pair is two complementary
             bases: the half on each backbone takes the partner of the other's
             colour. That two-tone bar is what a DNA diagram actually looks
             like, and it is the one place on this page where the colour is
             carrying information rather than mood. */
          const pair = ki & 3;
          dcb[i] = YB + 2 + (w >= 0 ? pair : (pair ^ 1));
        }
      }

      /* ── microscopic: a field of cells, seen close ── */
      {
        if (!seedCells) {
          /* Far fewer and far bigger than they were.
             There are 95k points and about 1.3M pixels of frame, so a field of
             structures can only be legible if there are few enough of them to
             give each one real point density. At 240 cells each got 400 points
             smeared over a sphere and the whole thing read as a starfield —
             "a lot of small things", which is not the same as "detail you can
             inspect", and inspecting them is the entire line of copy. */
          seedCells = Array.from({ length: 34 }, () => ({
            x: rnd(-1, 1), y: rnd(-0.82, 0.82), z: rnd(-0.5, 0.5), r: rnd(0.090, 0.215),
          }));
        }
        const c = seedCells[(Math.random() * seedCells.length) | 0];
        /* ring-weighted, so each reads as a membrane with a nucleus rather
           than a uniform blob */
        if (Math.random() < 0.74) {
          /* The membrane is a RING, not a sphere shell. Scattering the rim
             over a sphere spreads it across an area instead of a line, and a
             diffuse ball at this density is invisible — which is why only the
             nuclei were showing up, as specks. */
          const a = Math.random() * TAU;
          const rr = c.r * rnd(0.93, 1.0);
          uxa[i] = c.x + rr * Math.cos(a);
          uya[i] = c.y + rr * Math.sin(a);
          uza[i] = c.z + gauss() * c.r * 0.11;
        } else {                                       /* nucleus */
          const a = Math.random() * TAU, b2 = Math.random() * TAU;
          const rr = c.r * Math.pow(Math.random(), 1.5) * 0.40;
          uxa[i] = c.x + rr * Math.cos(a) * Math.cos(b2);
          uya[i] = c.y + rr * Math.sin(b2);
          uza[i] = c.z + rr * Math.sin(a) * Math.cos(b2);
        }
      }

      /* ── giant bird ──
         built from parametric parts rather than rejection-sampled against an
         outline: wings carry most of the area, and `bua` records how far out
         the span each point sits so the wings can flap later. */
      {
        /* NOTE the negated y throughout: screen y runs DOWN, so a bird built
           with the head at +y comes out upside down. Head is up, tail and
           swept wingtips trail down-and-back. */
        const q = Math.random();
        if (q < 0.56) {                                  /* wings: arm + hand */
          const side = Math.random() < 0.5 ? -1 : 1;
          const u = Math.pow(Math.random(), 0.80);       /* denser at the root */
          const v = (Math.random() + Math.random()) * 0.5;  /* soft chord edges */
          /* A real wing bends at the wrist: the arm reaches out and a little
             forward, then the hand sweeps hard back. One smooth taper from
             root to tip is a glider wing, and that is most of why this read
             as a drawn mark rather than an animal. */
          const WRIST = 0.48;
          let cc, ch;
          if (u < WRIST) {
            const w = u / WRIST;
            cc = 0.11 + 0.085 * w;
            ch = 0.225 - 0.075 * w;                      /* broad at the root */
          } else {
            const w = (u - WRIST) / (1 - WRIST);
            cc = 0.195 - 0.46 * w * (0.55 + 0.45 * w);
            ch = 0.150 * Math.pow(1 - w, 0.72) + 0.020;  /* the hand stays narrow */
          }
          bxa[i] = side * (0.055 + 0.90 * u);
          bya[i] = -(cc + (v * 2 - 1) * ch + gauss() * 0.010);
          bza[i] = gauss() * 0.035;
          bua[i] = u;
        } else if (q < 0.68) {                           /* primaries */
          /* Five splayed fingers off the hand. In silhouette this is the most
             recognisable thing about a big bird and the cheapest to add:
             without them, a wingtip is just where the shape stops. */
          const side = Math.random() < 0.5 ? -1 : 1;
          const f = (Math.random() * 5) | 0;
          const g = Math.pow(Math.random(), 0.85);       /* along the feather */
          const len = 0.34 - f * 0.047;                  /* the outermost is longest */
          const sw = 0.22 + f * 0.36;                    /* the inner ones fan back */
          bxa[i] = side * (0.80 + f * 0.030 + len * g * Math.cos(sw));
          bya[i] = 0.20 + len * g * Math.sin(sw) + gauss() * 0.011;
          bza[i] = gauss() * 0.030;
          bua[i] = 1;
        } else if (q < 0.81) {                           /* body */
          const tt = Math.random() * 2 - 1;
          const w = 0.062 * (1 - Math.pow(Math.abs(tt), 1.5));
          bxa[i] = ((Math.random() + Math.random()) - 1) * w;
          bya[i] = -(tt * 0.33);
          bza[i] = gauss() * 0.04;
          bua[i] = 0;
        } else if (q < 0.88) {                           /* tail, lightly forked */
          const ss = Math.random();
          const xx = ((Math.random() + Math.random()) - 1) * (0.036 + 0.072 * ss);
          bxa[i] = xx;
          bya[i] = 0.29 + ss * (0.17 + Math.abs(xx) * 1.7);
          bza[i] = gauss() * 0.03;
          bua[i] = 0;
        } else {                                         /* neck, head, beak */
          const s2 = Math.random();
          if (s2 < 0.46) {                               /* neck */
            const tt = Math.random();
            const w = 0.050 * (1 - tt * 0.34);
            bxa[i] = ((Math.random() + Math.random()) - 1) * w;
            bya[i] = -(0.31 + tt * 0.13);
          } else if (s2 < 0.88) {                        /* head */
            const a = Math.random() * TAU, rr = Math.sqrt(Math.random()) * 0.057;
            bxa[i] = rr * Math.cos(a) * 0.92;
            bya[i] = -(0.458 + rr * Math.sin(a) * 0.88);
          } else {                                       /* beak */
            const g2 = Math.random();
            bxa[i] = ((Math.random() + Math.random()) - 1) * 0.015 * (1 - g2 * 0.8);
            bya[i] = -(0.505 + g2 * 0.082);
          }
          bza[i] = gauss() * 0.03;
          bua[i] = 0;
        }
      }

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

      /* ── growth: a rocket, lit and leaving ──
         Ogive nose, fuselage, flared skirt, three fins, all turned about the
         y axis so the slow roll reads as three dimensions. Over half the point
         budget goes to the exhaust, which is the honest split: the plume is
         what you actually look at in a launch photograph, and it is the one
         thing on this page that particles are not a metaphor for. */
      if (i >= plumeFrom) {
        /* position is NOT baked. Only a bearing and a seed along the column,
           so the exhaust can stream downstream every frame. */
        const pa2 = Math.random() * TAU;
        const rr2 = Math.pow(Math.random(), 0.55);   /* bright spine, frayed edge */
        gxa[i] = Math.cos(pa2) * rr2;
        gza[i] = Math.sin(pa2) * rr2;
        gya[i] = Math.random();
      } else {
        const q2 = Math.random();
        if (q2 < 0.17) {                             /* nose */
          const u = Math.random();
          /* a sine gives the convex ogive of a real fairing; a linear taper
             leaves a cone, which reads as a party hat */
          const rr = R_RAD * Math.sin(u * Math.PI * 0.5) * (0.72 + 0.28 * Math.random());
          const a = Math.random() * TAU;
          gxa[i] = rr * Math.cos(a);
          gza[i] = rr * Math.sin(a);
          gya[i] = R_NOSE + u * (R_SHOULDER - R_NOSE);
        } else if (q2 < 0.70) {                      /* fuselage */
          const a = Math.random() * TAU;
          const rr = R_RAD * (0.80 + 0.20 * Math.random());
          gxa[i] = rr * Math.cos(a);
          gza[i] = rr * Math.sin(a);
          gya[i] = R_SHOULDER + Math.random() * (R_ENGINE - R_SHOULDER);
        } else if (q2 < 0.80) {                      /* flared engine skirt */
          const u = Math.random();
          const rr = R_RAD + (R_FLARE - R_RAD) * u * u;
          const a = Math.random() * TAU;
          gxa[i] = rr * Math.cos(a);
          gza[i] = rr * Math.sin(a);
          gya[i] = R_ENGINE + u * (R_SKIRT - R_ENGINE);
        } else {                                     /* fins */
          const fa = ((Math.random() * FINS) | 0) / FINS * TAU;
          const u = Math.random(), v = Math.random();
          const rr = R_RAD + (R_FIN - R_RAD) * u;
          /* swept: a long root chord down the engine bay, a short tip chord
             trailing well behind it */
          const y0 = R_ENGINE - 0.30 * (1 - u);
          const y1 = R_SKIRT + 0.055 * u;
          gxa[i] = rr * Math.cos(fa);
          gza[i] = rr * Math.sin(fa);
          gya[i] = y0 + v * (y1 - y0);
        }
        gxa[i] += gauss() * 0.006;
        gya[i] += gauss() * 0.006;
        gza[i] += gauss() * 0.006;
      }
    }

    motes = Array.from({ length: density ? 10 : 0 }, () => ({
      x: rnd(0, BW), y: rnd(0, BH), vx: rnd(-4, 4), vy: rnd(-4, 4),
      life: rnd(0, 1), rate: rnd(0.014, 0.032), ph: rnd(0, TAU), sway: rnd(3, 9),
    }));
    sparks = [];

    for (let k = 0; k < BIRD_N; k++) {
      birdIdx[k] = Math.min(n - 1, Math.round((k + 0.5) * n / BIRD_N));
      birdPh[k] = Math.random() * TAU;
      birdPX[k] = birdPY[k] = 0;
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    /* The canvas is an absolutely positioned child of the hero, so a
       percentage height resolves against the HERO rather than the content —
       and on a narrow layout those two diverge badly, leaving a blank stretch
       of document you can scroll into below the last section. Measure the
       bottom of that section and size the canvas to exactly that. Nothing is
       circular here: an absolutely positioned child does not move its
       siblings, so the offsets read above stay valid. */
    const tail = document.querySelector('.grow');
    if (tail) back.style.height = Math.round(tail.offsetTop + tail.offsetHeight) + 'px';
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
    const pd = phaseEnd('.dna'), pu = phaseEnd('.micro'),
          pn = phaseEnd('.next'), pm = phaseEnd('.map'),
          pb = phaseEnd('.build'), pg = phaseEnd('.grow');
    if (pd !== null) { PH.dnaB = pd; PH.dnaA = pd - 0.52; }
    if (pu !== null) { PH.micB = pu; PH.micA = pu - 0.50; }
    if (pn !== null) { PH.flockB = pn; PH.flockA = pn - 0.50; }
    if (pm !== null) { PH.netB = pm; PH.netA = pm - 0.52; }
    if (pb !== null) { PH.layB = pb; PH.layA = pb - 0.52; }
    if (pg !== null) { PH.growB = pg; PH.growA = pg - 0.52; }
    PH.max = (pg !== null ? pg : pb !== null ? pb : 2.2) + 1;
    /* the last scroll position that actually exists. The climb is paced to
       finish exactly there, so the rocket leaves rather than stalling. */
    PH.endP = Math.max(PH.growB + 0.06,
      (document.documentElement.scrollHeight - innerHeight) / Math.max(1, heroH * 1.3));

    /* the silhouette lives in the gap between the flock settling and the map
       beginning, centred in the frame and sized to fill it */
    PH.birdC = (PH.flockB + PH.netA) * 0.5;
    /* Solve for the position that puts the bird dead centre of the viewport at
       the exact scroll where the pulse peaks. Pinning it to the flock's centre
       left it off the top of the screen, because the pulse fires in the gap
       BETWEEN two sections, not inside either one. */
    O.bcx = (BW / 2 - O.ox - O.cx);
    O.bcy = PH.birdC * (heroH * 1.3) + innerHeight * 0.5 - O.oy - O.cy;
    /* the span is 2.26 units now that the wings have primaries, and the view
       square is wider than a phone screen, so this has to leave the outer
       feathers inside the narrower of the two */
    O.bscale = BW * (isWide ? 0.40 : 0.42);

    const dn = document.querySelector('.dna'), mc = document.querySelector('.micro');
    O.dcy = dn ? (dn.getBoundingClientRect().top - hr.top) + dn.offsetHeight * 0.56 - O.oy - O.cy : 0;
    O.dcx = (BW / 2 - O.ox - O.cx);
    /* The helix is 1.78 units tall against 0.92 wide and the view square is
       square, so on a phone the width is the wrong thing to scale from: at
       BW * 0.30 it filled a quarter of a tall screen and sat in a void. */
    O.dscale = isWide ? BW * 0.21 : Math.min(BW * 0.66, innerHeight * 0.33);
    O.ucy = mc ? (mc.getBoundingClientRect().top - hr.top) + mc.offsetHeight * 0.60 - O.oy - O.cy : 0;
    O.ucx = (BW / 2 - O.ox - O.cx);
    /* deliberately oversized: we are looking THROUGH it, so most of the field
       falls outside the frame. That is what makes it read as magnification.
       Scaled off the height on a phone for the same reason as the helix. */
    O.uscale = isWide ? BW * 0.42 : Math.min(BW * 0.95, innerHeight * 0.46);

    const mp = document.querySelector('.map');
    O.ncy = mp
      ? (mp.getBoundingClientRect().top - hr.top) + mp.offsetHeight * 0.60 - O.oy - O.cy
      : O.mcy + O.sh * 1.5;
    O.ncx = (BW / 2 - O.ox - O.cx) - (isWide ? BW * 0.12 : 0);
    O.nscale = BW * (isWide ? 0.20 : 0.28);

    const gw = document.querySelector('.grow');
    /* Exactly the section centre, which is also where the viewport centre is
       at PH.growB. That makes the handover from this anchor to the tracking
       camera a no-op at the boundary; any other fraction and the whole frame
       lurches by the difference the moment tracking takes over. */
    O.gcy = gw
      ? (gw.getBoundingClientRect().top - hr.top) + gw.offsetHeight * 0.5 - O.oy - O.cy
      : O.lcy + O.sh * 1.5;
    O.gcx = (BW / 2 - O.ox - O.cx);
    /* the airframe plus a full plume is about 2.9 units tall against 0.7
       wide, and the view rect is square, so height is what sets the scale.
       On a phone the frame is tall and narrow, and scaling off the width
       alone left the rocket filling barely half the screen. */
    /* match the view square to the viewport: vHalf is gscale * 1.45, and on a
       phone scaling off the width alone left the rocket filling two thirds of
       a tall screen with dead bands above and below it */
    O.gscale = isWide ? BW * 0.23 : Math.min(BW * 0.78, innerHeight * 0.34);
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
    const dnaK = smooth(PH.dnaA, PH.dnaB, p);     /* pour → double helix  */
    const micK = smooth(PH.micA, PH.micB, p);     /* helix → the detail   */
    const morphG = smooth(PH.flockA, PH.flockB, p); /* detail → murmuration */
    /* the murmur IS the murmuration with almost everyone silent. One ramp,
       and the pun lands as a visual rather than only as a line of copy. */
    const voices = clamp01((p - (PH.flockB - 0.34)) / 0.44);
    /* a bump, not a ramp: rise, hold, release */
    const bHold = 0.055, bSpan = 0.175, bC = PH.birdC;
    const silK = Math.max(0, Math.min(smooth(bC - bSpan, bC - bHold, p),
                                      1 - smooth(bC + bHold, bC + bSpan, p)));
    const netK   = smooth(PH.netA, PH.netB, p);   /* murmuration → map    */
    const layerK = smooth(PH.layA, PH.layB, p);   /* map → stack          */
    const growK  = smooth(PH.growA, PH.growB, p); /* stack → the rocket   */

    /* ── the launch ──
       Lift keeps climbing after the morph has finished, so the section reads
       as a launch rather than as a rocket that arrived already airborne:
       growK saturates the moment the section centres, and this does not. It
       is paced to finish at the last scroll position that exists. */
    const liftStart = PH.growA + 0.24;
    const liftT = clamp01((p - liftStart) / Math.max(0.25, PH.endP - liftStart));
    const rise = liftT * liftT * 0.30;             /* accelerating, as it would  */
    const splash = 1 - clamp01(liftT / 0.26);      /* blast still hitting the pad */
    const plumeK = 0.62 + 0.38 * clamp01(liftT / 0.20);
    const plumeT = t * 0.95;
    const shake = (1 - clamp01(liftT / 0.34)) * 0.009;
    /* and the camera goes with it. Once the section has centred, the frame
       hands over to the viewport centre, so the rocket climbs WITHIN a moving
       shot instead of sliding off the top of a fixed one and leaving an empty
       screen. Tracking the scroll DELTA instead leaves it wherever its anchor
       happened to sit, which was 270px low for the whole ride. */
    const trackK = clamp01((p - PH.growB) / 0.10);
    const gcyLive = lerp(O.gcy,
      p * heroH * 1.3 + innerHeight * 0.5 - O.oy - O.cy, trackK);

    const angMult = 1 + pourK * (HELIX_TURNS - 1);
    const drop = pourK * O.sh * 1.55;
    const lateral = isWide ? -pourK * O.sw * 1.05 : 0;
    const taper = pourK * 0.62;
    const spin = t * 0.16;
    /* the flock is scaled to the viewport, so on a phone the same point count
       lands in far fewer pixels and saturates. damp it on narrow layouts. */
    /* The pour needs the lift; the shapes it lands in do not, and leaving it
       at full strength clipped the helix to flat white, which is where its
       colour was going. */
    const settle = 1 - 0.66 * Math.max(dnaK * (1 - micK), micK * 0.30);
    const boost = (1 + pourK * 1.45 * settle - morphG * 1.18) * (isWide ? 1 : 1 - morphG * 0.52);
    const dnaBand = dnaK * (1 - micK);
    /* Condense and disperse. Peaks with the helix whole and falls to nothing
       at both ends of its beat, so you watch the particles gather into a
       solid ribbon and then come apart again. `scat` squeezes every point
       onto its exact curve; the brightness comes down to match, because the
       same points in a sixth of the area would otherwise just clip to white
       and take the base-pair colours with them. */
    const dnaMid = PH.dnaB + 0.04;
    const dnaSpan = 0.36;
    const sRaw = clamp01(1 - Math.abs(p - dnaMid) / dnaSpan);
    const solid = sRaw * sRaw * (3 - 2 * sRaw);
    const scat = 1.25 - 0.91 * solid;

    /* It flies through rather than appearing in place: a monotonic parameter
       across the WHOLE pulse window, so the bird materialises mid-flight,
       swoops, and dissolves still moving. silK is only the form/dissolve
       envelope — it says how solid, not where. */
    const flightT = clamp01((p - (bC - bSpan)) / (2 * bSpan));
    const SWY_MID = 0.1238;                        /* keeps the peak centred */
    const swX = (flightT - 0.5) * 1.25 * O.bscale;
    const swY = ((-0.50 + 2.40 * flightT - 1.90 * flightT * flightT) * 0.55 - SWY_MID) * O.bscale;
    /* bank follows the tangent of its own path, damped so it does not cartwheel */
    const roll = Math.atan2((2.40 - 3.80 * flightT) * 0.55, 1.25) * 0.55;
    const cRoll = Math.cos(roll), sRoll = Math.sin(roll);
    /* the view rect: tight on the torus at rest, tight on the flock at the
       end, widening through the pour where the content really does span a
       lot of ground. Resolution therefore peaks exactly where the cloud is
       still and you can study it. */
    /* The pour genuinely spans a lot of ground, so the frame widens to 2.9x
       to hold it. But pourK saturates a quarter of the way down the page and
       never comes back, so that 2.9x was still applied through the helix and
       the cells: a 4,000px view square crushed into a 1,470px window. It is
       why the helix read as a thin scribble in an empty frame and why the
       cells looked like they had not loaded. Let it go once the pour has
       landed in something. */
    const spread = pourK * (1 - morphG) * (1 - dnaK);
    const vHalf = lerp(lerp(lerp(lerp(lerp(lerp(lerp(O.sw * 0.70, O.dscale * 1.35, dnaK),
                       O.uscale * 1.12, micK), O.mscale * 2.1, morphG),
                       O.bscale * 1.32, silK), O.nscale * 1.5, netK),
                       O.lscale * 1.5, layerK), O.gscale * 1.45, growK) * (1 + spread * 1.9);
    /* `held` retires the pour's offsets as the helix forms. The POINTS stop
       pouring the moment they land in a shape, but the view was still aimed
       down-and-left by the pour's drop and lateral, so it framed empty space
       beside the helix. Same rot as `spread` above, same cause. */
    const held = (1 - netK) * (1 - silK) * (1 - dnaK);
    const vCx = lerp(lerp(lerp(lerp(lerp(lerp(lerp(0, O.dcx, dnaK), O.ucx, micK), O.mcx, morphG), (O.bcx + swX), silK), O.ncx, netK), O.lcx, layerK), O.gcx, growK)
              + lateral * 0.42 * held;
    const vCy = lerp(lerp(lerp(lerp(lerp(lerp(lerp(0, O.dcy, dnaK), O.ucy, micK), O.mcy, morphG), (O.bcy + swY), silK), O.ncy, netK), O.lcy, layerK), gcyLive, growK)
              + drop * 0.42 * held;
    O.vHalf = vHalf; O.vCx = vCx; O.vCy = vCy;
    const vk = BUF_PX / (2 * vHalf), HALF = BUF_PX * 0.5;   /* `vk`: `k` is taken by the splat loop */
    /* Brightness must track the mapping. N points spread across a content area
       occupy (area x vk^2) buffer pixels, so density per pixel scales with
       vk^2 — raise the resolution and the same cloud goes faint. 0.52 is the
       old fixed scale this was balanced against. */
    const resK = (vk / 0.52) * (vk / 0.52);
    /* The helix is a filament: it keeps its points on two thin curves however
       far in you zoom, so resK over-exposes it — and by DIFFERENT amounts on
       different viewports, because the zoom is set by the frame. A phone gets
       about half as much again as a desktop, which was enough to clip the
       whole ribbon to flat white and throw away every base pair. Normalise it
       to the exposure a desktop frame produces, then apply the condense on
       top: brighter as it goes solid, dimmer as it comes apart. */
    const dnaExp = (1 - (0.56 - 0.20 * solid)) * Math.min(1, 5.3 / resK);
    const invSh = 1 / O.sh;

    /* the camera lifts out of the ground plane as the flock takes over */
    /* gentle: past about 25 degrees you are looking down the helix and the
       strands cross into arcs that do not read as a ladder */
    const dnaTilt = DNA_TILT + 0.15 * fsin(t * 0.21);
    const tiltNow = lerp(lerp(lerp(lerp(lerp(lerp(lerp(Math.acos(O.cosT), dnaTilt, dnaK),
                          MIC_TILT, micK), FLOCK_TILT, morphG),
                          SIL_TILT, silK), NET_TILT, netK),
                          LAYER_TILT, layerK), O.growTilt, growK);
    const cosT = Math.cos(tiltNow), sinT = Math.sin(tiltNow);
    const FLOW = 0.30;                       /* flow-field amplitude */
    const surgeX = 0.11 * fsin(t * 0.37);    /* the whole flock leaning */
    const surgeY = 0.07 * fsin(t * 0.29 + 1.3);
    const mSpin = t * 0.055;
    /* the silhouette banks gently rather than spinning — a rotating bird
       reads as a logo turntable, not a bird */
    /* A helix is almost symmetric about its own axis, so turning it about
       that axis is a barber pole: the shape never changes, it just slides.
       The tumble below is what actually makes it look like an object. */
    const dSpin = t * 0.34, uSpin = t * 0.045;
    const dca = fcos(dSpin), dsa = fsin(dSpin);
    const uca = fcos(uSpin), usa = fsin(uSpin);
    const bYaw = fsin(t * 0.33) * 0.20;
    const bca = fcos(bYaw), bsa = fsin(bYaw);
    /* The two wings run slightly out of phase. A real bird's wings beat
       together, but a banking bird's do not LOOK like it, and exact mirror
       symmetry is the biggest tell that a shape was drawn rather than flown. */
    const bFlapL = fsin(t * 1.45);
    const bFlapR = fsin(t * 1.45 + 0.42);
    const bscale = O.bscale, bcx = O.bcx, bcy = O.bcy;
    const invBDepth = 1 / (bscale * 0.6);
    const nSpin = t * 0.075;
    const nca = fcos(nSpin), nsa = fsin(nSpin);
    const nscale = O.nscale, ncx = O.ncx, ncy = O.ncy;
    const invNDepth = 1 / (nscale * 1.15);
    const lSpin = t * 0.085;
    const lca = fcos(lSpin), lsa = fsin(lSpin);
    const lscale = O.lscale, lcx = O.lcx, lcy = O.lcy;
    const invLDepth = 1 / (lscale * 1.2);
    /* Lift keeps climbing after the morph has finished, so the section reads
       as a launch rather than as a rocket that arrived already airborne.
       growK saturates the moment the section centres; this does not. */
    const gSpin = t * 0.050;
    const gca = fcos(gSpin), gsa = fsin(gSpin);
    const gscale = O.gscale, gcx = O.gcx, gcy = gcyLive;
    const invGDepth = 1 / (gscale * 1.1);
    FX_STATE.cosT = cosT; FX_STATE.sinT = sinT;
    FX_STATE.lca = lca; FX_STATE.lsa = lsa; FX_STATE.layerK = layerK;
    FX_STATE.nca = nca; FX_STATE.nsa = nsa; FX_STATE.netK = netK;
    FX_STATE.gca = gca; FX_STATE.gsa = gsa; FX_STATE.growK = growK; FX_STATE.gcy = gcy;
    const mca = fcos(mSpin), msa = fsin(mSpin);
    const mscale = O.mscale, mcx = O.mcx, mcy = O.mcy;
    const invDepth = 1 / (O.R * 1.5 + O.tube);
    const invMDepth = 1 / (mscale * 1.1);

    /* birds belong to the flock: in as it forms, out as it becomes the map */
    birdVis = clamp01((morphG - 0.42) / 0.34) * (1 - clamp01(netK * 1.6));
    FX_STATE.silK = silK; FX_STATE.swY = swY;
    let bp = 0;

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
      /* ── the structure, then the detail ── */
      if (dnaK > 0.001) {
        const k2 = clamp01((dnaK - pst[i] * 0.34) / 0.66);
        if (k2 > 0.001) {
          const ax = (dxa[i] + dox[i] * scat) * O.dscale,
                ay = (dya[i] + doy[i] * scat) * O.dscale,
                az = (dza[i] + doz[i] * scat) * O.dscale;
          const rx = ax * dca - az * dsa, rz = ax * dsa + az * dca;
          const sy2 = ay * cosT - rz * sinT, sz2 = ay * sinT + rz * cosT;
          sx = lerp(sx, O.dcx + rx, k2); sy = lerp(sy, O.dcy + sy2, k2);
          dep = lerp(dep, sz2 / (O.dscale * 1.1) * 0.5 + 0.5, k2); sz = lerp(sz, sz2, k2);
        }
      }
      if (micK > 0.001) {
        const k3 = clamp01((micK - pst[i] * 0.30) / 0.70);
        if (k3 > 0.001) {
          const ax = uxa[i] * O.uscale, ay = uya[i] * O.uscale, az = uza[i] * O.uscale;
          const rx = ax * uca - az * usa, rz = ax * usa + az * uca;
          const sy2 = ay * cosT - rz * sinT, sz2 = ay * sinT + rz * cosT;
          sx = lerp(sx, O.ucx + rx, k3); sy = lerp(sy, O.ucy + sy2, k3);
          dep = lerp(dep, sz2 / (O.uscale * 0.7) * 0.5 + 0.5, k3); sz = lerp(sz, sz2, k3);
        }
      }

      /* in the murmur, only a handful are speaking */
      let bright = (morphG > 0.001 && voices < 1 && loud[i] > voices) ? 0 : 1;
      /* The resolution compensation assumes a cloud spreads to fill the frame.
         True of a flock, false of a filament: the helix keeps its points on
         two thin curves however far in you go, so it arrives 5x to 8x over
         and the strand cores clip to flat white, taking their colour with
         them. Dim the helix specifically rather than capping the
         compensation, which the feature map genuinely needs all of. */
      if (dnaBand > 0.004) bright *= 1 - (1 - dnaExp) * dnaBand;
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

      /* ── the whole flock resolves into one bird ── */
      if (silK > 0.001) {
        /* lighter stagger than the other shapes: this is a sudden coalescence,
           not an arrival */
        const sK = clamp01((silK - pst[i] * 0.22) / 0.78);
        if (sK > 0.001) {
          /* Not every bird commits. A third stay loose, which gives the
             silhouette a halo and internal texture instead of a stencilled
             edge — the shape emerges from the flock rather than replacing it. */
          const loose = pw2[i] * (1 / TAU);
          const sKi = sK * (0.54 + 0.46 * (1 - loose * loose * loose));
          const jit = loose * 0.055 * bscale;
          const sp = bua[i] * bua[i];                  /* wings flap, body does not */
          const bFlap = bxa[i] < 0 ? bFlapL : bFlapR;
          const ax = bxa[i] * bscale + fsin(pw[i] * 1.7 + t * 0.9) * jit;
          const ay = (bya[i] + sp * bFlap * 0.17) * bscale + fsin(pw2[i] * 1.3 - t * 0.75) * jit;
          const az = (bza[i] + sp * bFlap * 0.10) * bscale;
          const rx6 = ax * bca - az * bsa, rz6 = ax * bsa + az * bca;
          const bsy = ay * cosT - rz6 * sinT, bsz = ay * sinT + rz6 * cosT;
          /* bank, in screen space */
          const rrx = rx6 * cRoll - bsy * sRoll;
          const rry = rx6 * sRoll + bsy * cRoll;
          sx = lerp(sx, bcx + swX + rrx, sKi);
          sy = lerp(sy, bcy + swY + rry, sKi);
          dep = lerp(dep, bsz * invBDepth * 0.5 + 0.5, sKi);
          sz = lerp(sz, bsz, sKi);
          bright = lerp(bright, 1, sKi);
        }
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

      /* ── and out into the rocket ── */
      if (growK > 0.001) {
        const w2 = clamp01((growK - pst[i] * 0.40) / 0.60);
        if (w2 > 0.001) {
          let ax, ay, az, gb = 1;
          if (i >= plumeFrom) {
            /* The exhaust streams. Each point runs the length of the column
               and wraps, so the plume is moving even while the thing is still
               sitting on the pad — a static cone reads as a tail fin. */
            let sp2 = gya[i] + plumeT; sp2 -= sp2 | 0;
            /* widens and frays downstream, and splays sideways for as long as
               the blast is still hitting the ground */
            const rad = (0.055 + 0.30 * Math.pow(sp2, 0.78)) * (1 + splash * sp2 * 2.6);
            const wob = 0.045 * sp2 * fsin(pw[i] + sp2 * 7.4 + t * 3.1);
            ax = (gxa[i] * rad + wob) * gscale;
            az = (gza[i] * rad + wob * 0.8) * gscale;
            ay = (R_SKIRT + GROW_DROP + sp2 * PLUME_LEN * plumeK * (1 - splash * 0.46) - rise) * gscale;
            gb = Math.pow(1 - sp2, 0.75) * 1.5;   /* hot at the bell, gone downstream */
          } else {
            const yv = gya[i] + GROW_DROP - rise;
            /* The view rect is 1.45 units half-height. Climbing straight into
               that edge gives the airframe a razor-straight horizontal cut, so
               the last 0.16 of a unit fades instead: the nose dissolves on its
               way out of frame, which is what you want it to do anyway. */
            gb = clamp01((yv + 1.46) * 6.25);
            ax = (gxa[i] + fsin(t * 37 + pw[i]) * shake) * gscale;
            ay = yv * gscale;
            az = gza[i] * gscale;
          }
          const rx5 = ax * gca - az * gsa, rz5 = ax * gsa + az * gca;
          const gsy = ay * cosT - rz5 * sinT, gsz = ay * sinT + rz5 * cosT;
          sx = lerp(sx, gcx + rx5, w2);
          sy = lerp(sy, gcy + gsy, w2);
          dep = lerp(dep, gsz * invGDepth * 0.5 + 0.5, w2);
          sz = lerp(sz, gsz, w2);
          bright = lerp(bright, gb, w2);
        }
      }

      if (birdVis > 0.004 && bp < BIRD_N && i === birdIdx[bp]) {
        birdX[bp] = sx; birdY[bp] = sy; birdD[bp] = dep; bp++;
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
      let ybf = ((sy + O.cy) * invSh) * YB;
      if (ybf < 0) ybf = 0; else if (ybf > YB - 1) ybf = YB - 1;
      /* blends OUT of the scene gradient and INTO the helix's own rows, which
         live past YB — so the clamp below has to allow the whole table */
      if (dnaBand > 0.004) ybf += (dcb[i] - ybf) * dnaBand;
      let yb = ybf | 0; if (yb < 0) yb = 0; else if (yb >= YB_ALL) yb = YB_ALL - 1;
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
    birdCount = bp;
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

  /* The line belongs to the silhouette rather than to a section: it fades up
     with the shape and travels with it, so the copy and the visual are the
     same beat instead of two things that happen near each other. */
  let murmurEl, murmurHost;
  function syncMurmur(silK, swY) {
    if (murmurEl === undefined) {
      murmurEl = document.getElementById('murmur') || null;
      murmurHost = murmurEl ? murmurEl.offsetParent || document.body : null;
    }
    if (!murmurEl) return;
    const vis = clamp01((silK - 0.22) / 0.4);
    murmurEl.style.opacity = vis.toFixed(3);
    if (vis <= 0.001) return;
    /* top:0 anchors it to the document origin, so this is an absolute document
       position. Leaving it at its static flow position and transforming on top
       double-counted and put it off-frame. */
    /* clear of the tail, but clamped so it cannot drop below the fold on a
       short viewport */
    const y = O.oy + O.cy + O.bcy + swY + Math.min(O.bscale * 0.62, innerHeight * 0.33);
    murmurEl.style.transform = `translateY(${y.toFixed(1)}px)`;
  }

  function draw() {
    bx.clearRect(0, 0, BW, BH);
    if (fx) fx.clearRect(0, 0, O.sw * BUF_WM, O.sh * BUF_HF);
    if (density === 0 || !datB) return;

    syncChips(t * 0.16 * 0.96);
    syncMurmur(FX_STATE.silK, FX_STATE.swY);
    accumulate();
    placeCards('ncards', NET, O.ncx, O.ncy, O.nscale, FX_STATE.nca, FX_STATE.nsa,
               FX_STATE.cosT, FX_STATE.sinT, clamp01((FX_STATE.netK - 0.3) / 0.45) * (1 - FX_STATE.layerK), 0);
    placeCards('lcards', LAYER_ANCHORS, O.lcx, O.lcy, O.lscale, FX_STATE.lca, FX_STATE.lsa,
               FX_STATE.cosT, FX_STATE.sinT,
               clamp01((FX_STATE.layerK - 0.3) / 0.45) * (1 - FX_STATE.growK), 1);
    /* 1,0 rather than the spin: these cards label clients, not parts of the
       airframe, so they hold still either side instead of orbiting through it */
    placeCards('gcards', isWide ? GROW_ANCHORS : GROW_ANCHORS_NARROW,
               O.gcx, FX_STATE.gcy, O.gscale, 1, 0,
               FX_STATE.cosT, FX_STATE.sinT, clamp01((FX_STATE.growK - 0.3) / 0.45),
               isWide ? 0 : 1);
    const vs = 2 * O.vHalf;
    /* back canvas is in hero coords; front canvas starts one scene-width left */
    bx.drawImage(bufB, O.ox + O.cx + O.vCx - O.vHalf, O.oy + O.cy + O.vCy - O.vHalf, vs, vs);
    if (fx) fx.drawImage(bufF, O.sw + O.cx + O.vCx - O.vHalf, O.cy + O.vCy - O.vHalf, vs, vs);

    /* Wings span perpendicular to travel, so each bird is rotated to its own
       heading — taken from where it was last frame rather than from the flow
       field, which stays honest while the cloud is also morphing.

       The glyph points are rotated BY HAND and the birds batched into four
       depth buckets, one fill each. Using translate/rotate/setTransform per
       bird churns canvas state 240 times a frame and cost two thirds of the
       frame rate. */
    if (birdVis > 0.01 && birdCount) {
      const base = Math.max(2.3, BW * 0.0032);
      const BK = 4;
      /* these two do the hand rotation, reading the current bird's frame out
         of the four mutables above them */
      let bX = 0, bY = 0, bCa = 1, bSa = 0;
      const mv = (p, q) => bx.moveTo(bX + p * bCa - q * bSa, bY + p * bSa + q * bCa);
      const qc = (p1, q1, p2, q2) => bx.quadraticCurveTo(
        bX + p1 * bCa - q1 * bSa, bY + p1 * bSa + q1 * bCa,
        bX + p2 * bCa - q2 * bSa, bY + p2 * bSa + q2 * bCa);
      for (let g = 0; g < BK; g++) {
        const lo = g / BK, hi = (g + 1) / BK, dm = (lo + hi) * 0.5;
        let opened = false;
        for (let k = 0; k < birdCount; k++) {
          const d = birdD[k];
          if (d < lo || d >= hi) continue;
          const x = O.ox + O.cx + birdX[k], y = O.oy + O.cy + birdY[k];
          if (y < -40 || y > BH + 40) { birdPX[k] = x; birdPY[k] = y; continue; }
          const dx = x - birdPX[k], dy = y - birdPY[k];
          birdPX[k] = x; birdPY[k] = y;
          const ang = (dx || dy) ? Math.atan2(dy, dx) + Math.PI / 2 : 0;
          bX = x; bY = y; bCa = Math.cos(ang); bSa = Math.sin(ang);
          const sz = base * (0.55 + 1.15 * d);

          /* A wingbeat, not a sine wave. The phase is warped so the downstroke
             is quick and the recovery slow, and what you actually SEE from
             behind a flock is the span foreshortening as the wing swings out
             of plane — that, rather than a flapping outline, is the cue that
             reads at this size. */
          const ph0 = t * (6.3 + 2.9 * fsin(birdPh[k] * 2.7)) + birdPh[k];
          const ph = ph0 + 0.62 * fsin(ph0);
          const e = fsin(ph);                             /* elevation, -1..1 */
          const th = e * 1.34;
          /* the floor matters: let the span foreshorten past the length of
             the body and the glyph stops being a bird and becomes an arrowhead */
          const fore = 0.66 + 0.34 * Math.abs(fcos(th));
          /* and all of them are banking, so no two wings are ever mirrors */
          const rl = fsin(t * 0.62 + birdPh[k] * 1.9) * 0.22;
          const spL = sz * fore * (1 + rl), spR = sz * fore * (1 - rl);
          const tq = sz * (0.13 + 0.24 * Math.abs(e));    /* tips trail back */
          const sh = sz * 0.16, shq = -sz * 0.26;         /* shoulder */

          if (!opened) { bx.beginPath(); opened = true; }
          /* One closed dart per bird: left tip, leading edge in to the
             shoulder, head, out to the right tip, then the concave trailing
             edge home via the tail. Filled, because a stroked outline four
             pixels across is a hairline, which is precisely why the version
             before this read as a tick mark. */
          mv(-spL, tq);
          qc(-spL * 0.50, shq * 1.18, -sh, shq);
          qc(-sh * 0.45, -sz * 0.40, 0, -sz * 0.44);
          qc(sh * 0.45, -sz * 0.40, sh, shq);
          qc(spR * 0.50, shq * 1.18, spR, tq);
          qc(spR * 0.44, sz * 0.03, 0, sz * 0.38);
          qc(-spL * 0.44, sz * 0.03, -spL, tq);
        }
        if (opened) {
          bx.globalAlpha = birdVis * (0.26 + 0.56 * dm);
          bx.fillStyle = `rgb(${(accCur.r * 0.45 + 255 * 0.55) | 0},`
                       + `${(accCur.g * 0.45 + 255 * 0.55) | 0},`
                       + `${(accCur.b * 0.45 + 255 * 0.55) | 0})`;
          bx.fill();
        }
      }
      bx.globalAlpha = 1;
    }

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

  /* Watch the CANVAS, not a list of sections.
     This used to name every section the cloud passes through, and the list
     rotted the moment two more were added: the loop stopped the instant the
     hero left the viewport and did not restart until `.next` arrived, so the
     whole helix-and-cells stretch was a frozen frame. That is why the helix
     span rotated while it was still forming and then sat dead still, and why
     the cells only appeared once you had scrolled well past their heading.
     The canvas covers exactly the content the cloud can be drawn on, so
     "is the canvas on screen" is the question we actually meant to ask, and
     it cannot go stale when a section is added. */
  new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); },
    { threshold: 0 }).observe(back);

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
    sil: () => FX_STATE.silK,
    /* every phase boundary plus the live scroll parameter: enough to drive a
       test at any beat without it having to guess where the beats are */
    phases: () => ({ dnaA:PH.dnaA, dnaB:PH.dnaB, micA:PH.micA, micB:PH.micB,
                     flockA:PH.flockA, flockB:PH.flockB, birdC:PH.birdC,
                     netA:PH.netA, netB:PH.netB, layA:PH.layA, layB:PH.layB,
                     growA:PH.growA, growB:PH.growB, endP:PH.endP, p:scrollP }),
  };

  const startProj = getComputedStyle(document.documentElement).getPropertyValue('--proj');
  if (startProj && startProj.trim()) { accCur = toRgb(startProj); accTgt = { ...accCur }; }

  readColours();
  resize();
  onScroll();
  if (reduce.matches) { t = 0.4; draw(); } else start();
})();
