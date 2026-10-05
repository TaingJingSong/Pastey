export interface ParsedColor {
  hex: string;       // canonical #RRGGBB, ready for RN styles
  alpha: number;     // 0..1
  original: string;  // the exact text that matched
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toHex(n: number): string {
  return Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hPrime = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hPrime < 1)      [r1, g1, b1] = [c, x, 0];
  else if (hPrime < 2) [r1, g1, b1] = [x, c, 0];
  else if (hPrime < 3) [r1, g1, b1] = [0, c, x];
  else if (hPrime < 4) [r1, g1, b1] = [0, x, c];
  else if (hPrime < 5) [r1, g1, b1] = [x, 0, c];
  else                 [r1, g1, b1] = [c, 0, x];
  const m = lN - c / 2;
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

/**
 * Parses a color value if the *entire* input is a recognized form.
 * Returns null when the input contains anything else — this is deliberate,
 * so a copied CSS snippet like "color: #fff;" doesn't render as a swatch.
 */
export function parseColor(input: string): ParsedColor | null {
  const text = input.trim();
  if (!text || text.length > 64) return null;

  // Hex: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  const hexMatch = text.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    const h = hexMatch[1];
    if (h.length === 3) {
      const r = h[0], g = h[1], b = h[2];
      return { hex: `#${r}${r}${g}${g}${b}${b}`, alpha: 1, original: text };
    }
    if (h.length === 4) {
      const r = h[0], g = h[1], b = h[2], a = h[3];
      return {
        hex: `#${r}${r}${g}${g}${b}${b}`,
        alpha: parseInt(a + a, 16) / 255,
        original: text,
      };
    }
    if (h.length === 6) {
      return { hex: `#${h}`, alpha: 1, original: text };
    }
    // length === 8
    return {
      hex: `#${h.slice(0, 6)}`,
      alpha: parseInt(h.slice(6), 16) / 255,
      original: text,
    };
  }

  // rgb(r, g, b) / rgba(r, g, b, a)
  const rgbMatch = text.match(
    /^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+)\s*)?\)$/i
  );
  if (rgbMatch) {
    const r = clamp(parseInt(rgbMatch[1], 10), 0, 255);
    const g = clamp(parseInt(rgbMatch[2], 10), 0, 255);
    const b = clamp(parseInt(rgbMatch[3], 10), 0, 255);
    const a = rgbMatch[4] !== undefined
      ? clamp(parseFloat(rgbMatch[4]), 0, 1)
      : 1;
    return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, alpha: a, original: text };
  }

  // hsl(h, s%, l%) / hsla(h, s%, l%, a)
  const hslMatch = text.match(
    /^hsla?\s*\(\s*([\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i
  );
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]);
    const s = clamp(parseFloat(hslMatch[2]), 0, 100);
    const l = clamp(parseFloat(hslMatch[3]), 0, 100);
    const a = hslMatch[4] !== undefined
      ? clamp(parseFloat(hslMatch[4]), 0, 1)
      : 1;
    const [r, g, b] = hslToRgb(h, s, l);
    return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, alpha: a, original: text };
  }

  return null;
}