export type MeasurementSystem = 'imperial' | 'metric';

// ── Conversion factors ────────────────────────────────────────────────────────

// Imperial volume → ml
const IMP_VOL_TO_ML: Record<string, number> = {
  tsp: 4.929, teaspoon: 4.929, teaspoons: 4.929,
  tbsp: 14.787, tablespoon: 14.787, tablespoons: 14.787,
  cup: 236.588, cups: 236.588,
  'fl oz': 29.574, 'fluid ounce': 29.574, 'fluid ounces': 29.574,
  pint: 473.176, pints: 473.176, pt: 473.176,
  quart: 946.353, quarts: 946.353, qt: 946.353,
  gallon: 3785.41, gallons: 3785.41, gal: 3785.41,
};

// Imperial weight → g
const IMP_WEIGHT_TO_G: Record<string, number> = {
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
};

// Metric volume units (already in ml or L)
const METRIC_VOL: Record<string, number> = {
  ml: 1, milliliter: 1, milliliters: 1, millilitre: 1, millilitres: 1,
  l: 1000, liter: 1000, liters: 1000, litre: 1000, litres: 1000,
};

// Metric weight units (already in g or kg)
const METRIC_WEIGHT: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000,
};

// ── Display helpers ───────────────────────────────────────────────────────────

// Best imperial volume unit for a given ml value
function mlToImperial(ml: number): { qty: number; unit: string } {
  if (ml >= 946) return { qty: ml / 946.353, unit: 'quart' };
  if (ml >= 473) return { qty: ml / 473.176, unit: 'pint' };
  if (ml >= 59)  return { qty: ml / 236.588, unit: 'cup' };
  if (ml >= 14)  return { qty: ml / 14.787,  unit: 'tbsp' };
  return           { qty: ml / 4.929,   unit: 'tsp' };
}

// Best imperial weight unit for a given g value
function gToImperial(g: number): { qty: number; unit: string } {
  if (g >= 227) return { qty: g / 453.592, unit: 'lb' };
  return          { qty: g / 28.3495,  unit: 'oz' };
}

// Best metric volume unit
function mlToMetric(ml: number): { qty: number; unit: string } {
  if (ml >= 1000) return { qty: ml / 1000, unit: 'L' };
  return            { qty: ml,       unit: 'ml' };
}

// Best metric weight unit
function gToMetric(g: number): { qty: number; unit: string } {
  if (g >= 1000) return { qty: g / 1000, unit: 'kg' };
  return           { qty: g,       unit: 'g' };
}

// ── Number formatting ─────────────────────────────────────────────────────────

const NICE_FRACS: [number, string][] = [
  [0.125, '⅛'], [0.25, '¼'], [1/3, '⅓'], [0.375, '⅜'],
  [0.5, '½'],   [0.625, '⅝'], [2/3, '⅔'], [0.75, '¾'], [0.875, '⅞'],
];

function formatQty(n: number, isMetric: boolean): string {
  const whole = Math.floor(n);
  const rem = n - whole;
  const tol = 0.06;
  if (rem < tol) return String(whole || 0);
  if (1 - rem < tol) return String(whole + 1);
  if (!isMetric) {
    for (const [val, str] of NICE_FRACS) {
      if (Math.abs(rem - val) < tol) return whole > 0 ? `${whole} ${str}` : str;
    }
  }
  // Non-fraction decimals: round up to nearest whole
  return String(Math.ceil(n));
}

// ── Unicode / fraction normalisation ─────────────────────────────────────────

const UNICODE_FRACS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1/3, '⅔': 2/3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

function normalizeUnicode(s: string): string {
  let r = s;
  for (const [ch, val] of Object.entries(UNICODE_FRACS))
    r = r.replace(new RegExp(ch, 'g'), ` ${val} `);
  return r.replace(/\s+/g, ' ').trim();
}

function parseQty(s: string): [number, string] | null {
  const n = normalizeUnicode(s.trim());
  let m: RegExpMatchArray | null;
  m = n.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)/s);
  if (m) return [+m[1] + +m[2] / +m[3], m[4].trim()];
  m = n.match(/^(\d+)\/(\d+)\s*(.*)/s);
  if (m) return [+m[1] / +m[2], m[3].trim()];
  m = n.match(/^(\d+\.?\d*)\s*(.*)/s);
  if (m) return [parseFloat(m[1]), m[2].trim()];
  return null;
}

function parseUnit(s: string): [string, string] | null {
  const lower = s.toLowerCase().trim();
  for (const key of ['fluid ounces', 'fluid ounce', 'fl oz']) {
    if (lower.startsWith(key)) return [key, s.slice(key.length).trim()];
  }
  const m = lower.match(/^([a-z]+)/);
  if (m) return [m[1], s.slice(m[1].length).trim()];
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Converts an ingredient string to the target measurement system.
 * Returns the original string unchanged if the unit is already in the
 * target system, unrecognised, or a count unit (e.g. "3 cloves garlic").
 */
export function convertIngredientText(text: string, target: MeasurementSystem): string {
  const qtyResult = parseQty(text);
  if (!qtyResult) return text;
  const [qty, afterQty] = qtyResult;

  const unitResult = parseUnit(afterQty);
  if (!unitResult) return text;
  const [unitKey, rest] = unitResult;
  const lk = unitKey.toLowerCase();

  // Determine source system and unit group
  const isImpVol    = lk in IMP_VOL_TO_ML;
  const isImpWeight = lk in IMP_WEIGHT_TO_G;
  const isMetVol    = lk in METRIC_VOL;
  const isMetWeight = lk in METRIC_WEIGHT;

  if (!isImpVol && !isImpWeight && !isMetVol && !isMetWeight) return text; // count unit

  const sourceIsImperial = isImpVol || isImpWeight;
  const sourceIsMetric   = isMetVol || isMetWeight;

  if (target === 'imperial' && sourceIsImperial) return text;
  if (target === 'metric'   && sourceIsMetric)   return text;

  let result: { qty: number; unit: string };

  if (target === 'metric') {
    if (isImpVol) {
      const ml = qty * IMP_VOL_TO_ML[lk];
      result = mlToMetric(ml);
    } else {
      const g = qty * IMP_WEIGHT_TO_G[lk];
      result = gToMetric(g);
    }
  } else {
    if (isMetVol) {
      const ml = qty * METRIC_VOL[lk];
      result = mlToImperial(ml);
    } else {
      const g = qty * METRIC_WEIGHT[lk];
      result = gToImperial(g);
    }
  }

  const isMetricResult = target === 'metric';
  const formatted = `${formatQty(result.qty, isMetricResult)} ${result.unit}${rest ? ' ' + rest : ''}`;
  return formatted;
}

/** Conversion reference table entries for display in Settings. */
export const CONVERSION_TABLE = [
  { label: '1 tsp',    imperial: '1 tsp',    metric: '4.9 ml' },
  { label: '1 tbsp',   imperial: '1 tbsp',   metric: '14.8 ml' },
  { label: '¼ cup',    imperial: '¼ cup',    metric: '59 ml' },
  { label: '½ cup',    imperial: '½ cup',    metric: '118 ml' },
  { label: '1 cup',    imperial: '1 cup',    metric: '237 ml' },
  { label: '1 pint',   imperial: '1 pint',   metric: '473 ml' },
  { label: '1 quart',  imperial: '1 quart',  metric: '946 ml' },
  { label: '1 oz',     imperial: '1 oz',     metric: '28.3 g' },
  { label: '1 lb',     imperial: '1 lb',     metric: '454 g' },
];
