import type p5 from 'p5';

const BLACKLETTER_FONT_URL = '/fonts/Canterbury-Regular.ttf';

// Same 4-arm curl path (plus a faster secondary harmonic for filigree) as the
// original sketch, adapted to p5 instance mode so one canvas can be reused
// across hovers instead of tearing down/rebuilding a global-mode sketch per row.
export interface SonnetSketchInstance extends p5 {
  setText: (lines: string[]) => void;
}

interface TracedPath {
  pts: { x: number; y: number }[];
  arc: number[];
  angles: number[];
  total: number;
}

export function sonnetSketch(size: number, initialLines: string[], fontScale = 0.06) {
  // p5's instance-mode typings don't cleanly model assigning `preload`/`setup`/`draw`
  // as plain properties or loadFont's dual sync-in-preload behavior, so the sketch
  // body works against the real runtime API via `any` rather than fighting the types.
  return (p: any) => {
    let font: unknown;

    // Primary path: the sonnet's own text flows along this one, exactly as before.
    let pathPts: { x: number; y: number }[] = [];
    let arcLen: number[] = [];
    let angles: number[] = [];
    let pathTotal = 0;
    let flowText = '';
    let widthsCum: number[] = [];
    let scrollOffset = 0;

    let noiseTime = 0;
    let pendingLines: string[] | null = null;
    const speed = 0.6;
    const fontSize = size * fontScale;

    // Traces one closed hypotrochoid-style curl (4-lobed main term + a faster
    // harmonic for filigree) and returns it as points + cumulative arc length +
    // per-segment tangent angles — shared by both the primary and secondary
    // paths so they're the same math with different constants, not duplicated.
    function tracePath(params: {
      d1: number;
      k2: number;
      d2: number;
      n: number;
      reverse?: boolean;
    }): TracedPath {
      const R = 4;
      const r = 1;
      const k1 = (R - r) / r;
      const { d1, k2, d2, n, reverse } = params;
      const dir = reverse ? -1 : 1;
      const scale = (Math.min(p.width, p.height) * 0.4) / (R - r + d1 + d2);

      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= n; i++) {
        const t = dir * (i / n) * p.TWO_PI;
        const x = (R - r) * p.cos(t) + d1 * p.cos(k1 * t) + d2 * p.cos(k2 * t);
        const y = (R - r) * p.sin(t) - d1 * p.sin(k1 * t) - d2 * p.sin(k2 * t);
        pts.push({ x: x * scale, y: y * scale });
      }

      const arc = [0];
      const pathAngles: number[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const dx = pts[i + 1].x - pts[i].x;
        const dy = pts[i + 1].y - pts[i].y;
        arc.push(arc[i] + Math.sqrt(dx * dx + dy * dy));
        pathAngles.push(Math.atan2(dy, dx));
      }
      pathAngles.push(pathAngles[pathAngles.length - 1] ?? 0);
      return { pts, arc, angles: pathAngles, total: arc[arc.length - 1] };
    }

    function pointAtDistance(path: TracedPath, d: number) {
      const { pts, arc, angles: pathAngles, total } = path;
      const dist = ((d % total) + total) % total;
      let lo = 0;
      let hi = arc.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (arc[mid] <= dist) lo = mid;
        else hi = mid;
      }
      const segStart = arc[lo];
      const segEnd = arc[lo + 1] !== undefined ? arc[lo + 1] : total;
      const frac = segEnd > segStart ? (dist - segStart) / (segEnd - segStart) : 0;
      const p0 = pts[lo];
      const p1 = pts[lo + 1] || pts[0];
      return {
        x: p0.x + (p1.x - p0.x) * frac,
        y: p0.y + (p1.y - p0.y) * frac,
        angle: pathAngles[lo],
      };
    }

    function getPointAtDistance(d: number) {
      return pointAtDistance({ pts: pathPts, arc: arcLen, angles, total: pathTotal }, d);
    }

    // Measures one character's placement footprint along the path — used both
    // while deciding what fits AND while laying characters out, so the two can
    // never disagree (that mismatch was exactly what let the tail end run past
    // one full lap and overlap the start).
    function charStep(ch: string): number {
      const extra = ch === ' ' ? fontSize * 0.6 : 0;
      return p.textWidth(ch) + 0.8 + extra;
    }

    function buildPath() {
      const primary = tracePath({ d1: 2.2, k2: 7, d2: 0.3, n: 4000 });
      pathPts = primary.pts;
      arcLen = primary.arc;
      angles = primary.angles;
      pathTotal = primary.total;
    }

    // Builds the flow text word-by-word (cycling back to the start with a small
    // ornament if the sonnet runs out first), committing a word only if it fits
    // entirely within what's left of the path — so words are never cut mid-way
    // and the text never wraps back onto its own starting point.
    function buildFlowText(lines: string[]) {
      p.textFont(font || 'Georgia');
      p.textSize(fontSize);

      const cleanLines = lines.map((l) => l.trim()).filter((l) => l.length > 0);
      flowText = '';
      widthsCum = [0];
      if (cleanLines.length === 0 || pathTotal === 0) return;

      const words = cleanLines.join(' ').split(' ').filter((w) => w.length > 0);
      const limit = Math.max(pathTotal - 10, 0); // margin so the seam never touches the start

      let t = '';
      const cum: number[] = [0];
      let acc = 0;
      let wi = 0;
      let cycles = 0;

      const tryCommit = (chars: string): boolean => {
        let width = 0;
        for (const ch of chars) width += charStep(ch);
        if (acc + width > limit) return false;
        for (const ch of chars) {
          acc += charStep(ch);
          t += ch;
          cum.push(acc);
        }
        return true;
      };

      while (acc < limit) {
        if (wi >= words.length) {
          wi = 0;
          cycles++;
          if (cycles > 20 || !tryCommit('✦ ')) break; // safety valve + fit check for the ornament
          continue;
        }
        if (!tryCommit(words[wi] + ' ')) break; // this word (plus its trailing gap) won't fit — stop, don't clip it
        wi++;
      }

      flowText = t;
      widthsCum = cum;
    }

    p.setup = async () => {
      const canvas = p.createCanvas(size, size);
      canvas.style('pointer-events', 'none');
      // p5 2.x dropped preload() in favor of loading assets in setup(); fall
      // back to a plain serif silently if the webfont fetch fails.
      try {
        font = await p.loadFont(BLACKLETTER_FONT_URL);
      } catch {
        font = undefined;
      }
      buildPath();
      // setText() may have already been called (e.g. hovering a row) while this
      // async setup was still awaiting the font — apply whatever came in during
      // that window instead of the stale initial lines.
      buildFlowText(pendingLines ?? initialLines);
      pendingLines = null;
    };

    p.draw = () => {
      p.clear();
      if (!flowText || pathTotal === 0) return;

      noiseTime += 0.006;

      p.push();
      p.translate(p.width / 2, p.height / 2);
      p.noStroke();

      // Subtle noise-driven brightness drift — still unmistakably the same
      // lime green, just breathing rather than a flat constant fill.
      const colorNoise = p.noise(noiseTime, 900);
      const g = 205 + colorNoise * 35;
      const r = 100 + colorNoise * 35;
      p.fill(r, g, 50, 225);
      p.textFont(font || 'Georgia');
      p.textSize(fontSize);

      for (let j = 0; j < flowText.length; j++) {
        const ch = flowText[j];
        if (ch === ' ') continue;
        const pt = getPointAtDistance(widthsCum[j] + scrollOffset);

        // A few px of positional drift and a touch of rotational jitter, both
        // driven by smooth noise seeded per-character so neighbours wobble
        // coherently instead of flickering independently — the single biggest
        // lever for making the flow read as hand-drawn rather than mechanical.
        const nx = p.noise(j * 0.15, noiseTime) - 0.5;
        const ny = p.noise(j * 0.15 + 40, noiseTime) - 0.5;
        const nr = p.noise(j * 0.15 + 80, noiseTime) - 0.5;

        p.push();
        p.translate(pt.x + nx * 3, pt.y + ny * 3);
        p.rotate(pt.angle + nr * 0.15);
        p.text(ch, 0, 0);
        p.pop();
      }
      p.pop();

      scrollOffset = (scrollOffset + speed) % pathTotal;
    };

    (p as SonnetSketchInstance).setText = (lines: string[]) => {
      if (pathTotal === 0) {
        // Setup hasn't finished building the path yet (still awaiting the font) —
        // queue it and setup() will pick it up when it completes.
        pendingLines = lines;
        return;
      }
      buildFlowText(lines);
    };
  };
}
