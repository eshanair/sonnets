import type p5 from 'p5';

const BLACKLETTER_FONT_URL =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/unifrakturmaguntia/UnifrakturMaguntia-Book.ttf';

// Same 4-arm curl path (plus a faster secondary harmonic for filigree) as the
// original sketch, adapted to p5 instance mode so one canvas can be reused
// across hovers instead of tearing down/rebuilding a global-mode sketch per row.
export interface SonnetSketchInstance extends p5 {
  setText: (lines: string[]) => void;
}

export function sonnetSketch(size: number, initialLines: string[], fontScale = 0.06) {
  // p5's instance-mode typings don't cleanly model assigning `preload`/`setup`/`draw`
  // as plain properties or loadFont's dual sync-in-preload behavior, so the sketch
  // body works against the real runtime API via `any` rather than fighting the types.
  return (p: any) => {
    let font: unknown;
    let pathPts: { x: number; y: number }[] = [];
    let arcLen: number[] = [];
    let angles: number[] = [];
    let pathTotal = 0;
    let flowText = '';
    let widthsCum: number[] = [];
    let scrollOffset = 0;
    let pendingLines: string[] | null = null;
    const speed = 0.6;
    const fontSize = size * fontScale;

    function buildPath() {
      const R = 4;
      const r = 1;
      const k1 = (R - r) / r;
      const d1 = 2.2;
      const k2 = 7;
      const d2 = 0.3;
      const n = 4000;
      const scale = (Math.min(p.width, p.height) * 0.4) / (R - r + d1 + d2);

      pathPts = [];
      for (let i = 0; i <= n; i++) {
        const t = (i / n) * p.TWO_PI;
        const x = (R - r) * p.cos(t) + d1 * p.cos(k1 * t) + d2 * p.cos(k2 * t);
        const y = (R - r) * p.sin(t) - d1 * p.sin(k1 * t) - d2 * p.sin(k2 * t);
        pathPts.push({ x: x * scale, y: y * scale });
      }

      arcLen = [0];
      angles = [];
      for (let i = 0; i < pathPts.length - 1; i++) {
        const dx = pathPts[i + 1].x - pathPts[i].x;
        const dy = pathPts[i + 1].y - pathPts[i].y;
        arcLen.push(arcLen[i] + Math.sqrt(dx * dx + dy * dy));
        angles.push(Math.atan2(dy, dx));
      }
      angles.push(angles[angles.length - 1] ?? 0);
      pathTotal = arcLen[arcLen.length - 1];
    }

    function getPointAtDistance(d: number) {
      const dist = ((d % pathTotal) + pathTotal) % pathTotal;
      let lo = 0;
      let hi = arcLen.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (arcLen[mid] <= dist) lo = mid;
        else hi = mid;
      }
      const segStart = arcLen[lo];
      const segEnd = arcLen[lo + 1] !== undefined ? arcLen[lo + 1] : pathTotal;
      const frac = segEnd > segStart ? (dist - segStart) / (segEnd - segStart) : 0;
      const p0 = pathPts[lo];
      const p1 = pathPts[lo + 1] || pathPts[0];
      return {
        x: p0.x + (p1.x - p0.x) * frac,
        y: p0.y + (p1.y - p0.y) * frac,
        angle: angles[lo],
      };
    }

    // Measures one character's placement footprint along the path — used both
    // while deciding what fits AND while laying characters out, so the two can
    // never disagree (that mismatch was exactly what let the tail end run past
    // one full lap and overlap the start).
    function charStep(ch: string): number {
      const extra = ch === ' ' ? fontSize * 0.6 : 0;
      return p.textWidth(ch) + 0.8 + extra;
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

      p.push();
      p.translate(p.width / 2, p.height / 2);
      p.textFont(font || 'Georgia');
      p.textSize(fontSize);
      p.fill(120, 220, 50, 225);
      p.noStroke();

      for (let j = 0; j < flowText.length; j++) {
        const ch = flowText[j];
        if (ch === ' ') continue;
        const pt = getPointAtDistance(widthsCum[j] + scrollOffset);
        p.push();
        p.translate(pt.x, pt.y);
        p.rotate(pt.angle);
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
