const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

const NICE_FRACTIONS: [number, string][] = [
  [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.375, '⅜'],
  [0.5, '½'], [0.625, '⅝'], [2 / 3, '⅔'], [0.75, '¾'], [0.875, '⅞'],
];

function normalizeUnicode(s: string): string {
  let result = s;
  for (const [char, val] of Object.entries(UNICODE_FRACTIONS)) {
    result = result.replace(new RegExp(char, 'g'), ` ${val}`);
  }
  return result;
}

function parseAmount(s: string): number | null {
  const trimmed = s.trim();
  // mixed number: "1 1/2"
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  // fraction: "1/2"
  const frac = trimmed.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  // decimal or integer
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

function formatAmount(n: number): string {
  if (n <= 0) return '0';
  const whole = Math.floor(n);
  const remainder = n - whole;
  const tolerance = 0.04;

  if (remainder < tolerance) return String(whole || '');
  if (1 - remainder < tolerance) return String(whole + 1);

  for (const [val, str] of NICE_FRACTIONS) {
    if (Math.abs(remainder - val) < tolerance) {
      return whole > 0 ? `${whole} ${str}` : str;
    }
  }

  return String(Math.ceil(n));
}

// Matches: mixed "1 1/2", fraction "1/2", or decimal/integer "2" / "1.5"
const AMOUNT_RE = /(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)/g;

export function scaleIngredient(ingredient: string, multiplier: number): string {
  if (multiplier === 1) return ingredient;
  const normalized = normalizeUnicode(ingredient);

  let matched = false;
  const result = normalized.replace(AMOUNT_RE, (match) => {
    const val = parseAmount(match);
    if (val === null) return match;
    matched = true;
    return formatAmount(val * multiplier);
  });

  return matched ? result.trim() : ingredient;
}
