// Unit conversion table — volume base: tsp, weight base: oz
type UnitGroup = 'volume' | 'weight';

interface UnitInfo {
  group: UnitGroup;
  baseValue: number;
  singular: string;
  plural: string;
}

const UNIT_MAP: Record<string, UnitInfo> = {
  // Volume
  tsp:           { group: 'volume', baseValue: 1,        singular: 'tsp',    plural: 'tsp' },
  teaspoon:      { group: 'volume', baseValue: 1,        singular: 'tsp',    plural: 'tsp' },
  teaspoons:     { group: 'volume', baseValue: 1,        singular: 'tsp',    plural: 'tsp' },
  tbsp:          { group: 'volume', baseValue: 3,        singular: 'tbsp',   plural: 'tbsp' },
  tablespoon:    { group: 'volume', baseValue: 3,        singular: 'tbsp',   plural: 'tbsp' },
  tablespoons:   { group: 'volume', baseValue: 3,        singular: 'tbsp',   plural: 'tbsp' },
  cup:           { group: 'volume', baseValue: 48,       singular: 'cup',    plural: 'cups' },
  cups:          { group: 'volume', baseValue: 48,       singular: 'cup',    plural: 'cups' },
  pint:          { group: 'volume', baseValue: 96,       singular: 'pint',   plural: 'pints' },
  pints:         { group: 'volume', baseValue: 96,       singular: 'pint',   plural: 'pints' },
  pt:            { group: 'volume', baseValue: 96,       singular: 'pint',   plural: 'pints' },
  quart:         { group: 'volume', baseValue: 192,      singular: 'quart',  plural: 'quarts' },
  quarts:        { group: 'volume', baseValue: 192,      singular: 'quart',  plural: 'quarts' },
  qt:            { group: 'volume', baseValue: 192,      singular: 'quart',  plural: 'quarts' },
  gallon:        { group: 'volume', baseValue: 768,      singular: 'gallon', plural: 'gallons' },
  gallons:       { group: 'volume', baseValue: 768,      singular: 'gallon', plural: 'gallons' },
  gal:           { group: 'volume', baseValue: 768,      singular: 'gallon', plural: 'gallons' },
  // Weight
  oz:            { group: 'weight', baseValue: 1,        singular: 'oz',     plural: 'oz' },
  ounce:         { group: 'weight', baseValue: 1,        singular: 'oz',     plural: 'oz' },
  ounces:        { group: 'weight', baseValue: 1,        singular: 'oz',     plural: 'oz' },
  lb:            { group: 'weight', baseValue: 16,       singular: 'lb',     plural: 'lbs' },
  lbs:           { group: 'weight', baseValue: 16,       singular: 'lb',     plural: 'lbs' },
  pound:         { group: 'weight', baseValue: 16,       singular: 'lb',     plural: 'lbs' },
  pounds:        { group: 'weight', baseValue: 16,       singular: 'lb',     plural: 'lbs' },
  g:             { group: 'weight', baseValue: 0.035274, singular: 'g',      plural: 'g' },
  gram:          { group: 'weight', baseValue: 0.035274, singular: 'g',      plural: 'g' },
  grams:         { group: 'weight', baseValue: 0.035274, singular: 'g',      plural: 'g' },
  kg:            { group: 'weight', baseValue: 35.274,   singular: 'kg',     plural: 'kg' },
  kilogram:      { group: 'weight', baseValue: 35.274,   singular: 'kg',     plural: 'kg' },
  kilograms:     { group: 'weight', baseValue: 35.274,   singular: 'kg',     plural: 'kg' },
};

// Preferred display order (largest first) for smart unit selection
const VOLUME_DISPLAY = [
  { name: 'gallon', value: 768 }, { name: 'quart', value: 192 },
  { name: 'cup', value: 48 },    { name: 'tbsp', value: 3 },
  { name: 'tsp', value: 1 },
];
const WEIGHT_DISPLAY = [
  { name: 'lb', value: 16 }, { name: 'oz', value: 1 },
];

const UNICODE_FRACS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};
const NICE_FRACS: [number, string][] = [
  [0.125, '⅛'], [0.25, '¼'], [1/3, '⅓'], [0.375, '⅜'],
  [0.5, '½'],   [0.625, '⅝'], [2/3, '⅔'], [0.75, '¾'], [0.875, '⅞'],
];

function normalizeUnicode(s: string): string {
  let r = s;
  for (const [ch, val] of Object.entries(UNICODE_FRACS)) r = r.replace(new RegExp(ch, 'g'), ` ${val} `);
  return r.replace(/\s+/g, ' ').trim();
}

function parseQty(s: string): [number, string] | null {
  const n = normalizeUnicode(s.trim());
  let m;
  // mixed "1 1/2 ..."
  m = n.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)/s);
  if (m) return [+m[1] + +m[2] / +m[3], m[4].trim()];
  // fraction "1/2 ..."
  m = n.match(/^(\d+)\/(\d+)\s*(.*)/s);
  if (m) return [+m[1] / +m[2], m[3].trim()];
  // decimal/int
  m = n.match(/^(\d+\.?\d*)\s*(.*)/s);
  if (m) return [parseFloat(m[1]), m[2].trim()];
  return null;
}

function parseUnit(s: string): [UnitInfo, string] | null {
  const lower = s.toLowerCase().trim();
  // multi-word first
  for (const key of ['fluid ounces', 'fluid ounce', 'fl oz']) {
    if (lower.startsWith(key)) return [UNIT_MAP[key === 'fl oz' ? 'oz' : 'oz'], s.slice(key.length).trim()];
  }
  const m = lower.match(/^([a-z]+)/);
  if (m && UNIT_MAP[m[1]]) return [UNIT_MAP[m[1]], s.slice(m[1].length).trim()];
  return null;
}

function formatQty(n: number): string {
  if (n <= 0) return '0';
  const whole = Math.floor(n);
  const rem = n - whole;
  const tol = 0.04;
  if (rem < tol) return String(whole || 0);
  if (1 - rem < tol) return String(whole + 1);
  for (const [val, str] of NICE_FRACS) {
    if (Math.abs(rem - val) < tol) return whole > 0 ? `${whole} ${str}` : str;
  }
  return n.toFixed(2).replace(/\.?0+$/, '');
}

function formatInUnit(baseTsp: number, group: UnitGroup, origUnit: UnitInfo): string {
  const table = group === 'volume' ? VOLUME_DISPLAY : WEIGHT_DISPLAY;
  for (const row of table) {
    const qty = baseTsp / (UNIT_MAP[row.name]?.baseValue ?? 1);
    if (qty >= 0.9) {
      const info = UNIT_MAP[row.name] ?? origUnit;
      const label = qty === 1 ? info.singular : info.plural;
      return `${formatQty(qty)} ${label}`;
    }
  }
  const smallest = table[table.length - 1];
  const info = UNIT_MAP[smallest.name] ?? origUnit;
  const qty = baseTsp / (info.baseValue);
  return `${formatQty(qty)} ${info.singular}`;
}

export interface ParsedIngredient {
  qty: number;
  unit: UnitInfo;
  name: string;
}

export function parseIngredient(text: string): ParsedIngredient | null {
  const qtyResult = parseQty(text);
  if (!qtyResult) return null;
  const [qty, afterQty] = qtyResult;
  const unitResult = parseUnit(afterQty);
  if (!unitResult) return null;
  const [unit, name] = unitResult;
  if (!name.trim()) return null;
  return { qty, unit, name: name.replace(/^,\s*/, '').trim() };
}

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// Merge a new ingredient text into an existing list of ShoppingItem texts.
// Returns the updated text if merged, or null if no match found.
export function tryMergeIngredient(
  newText: string,
  existingTexts: string[]
): { mergedText: string; matchedText: string } | null {
  const newParsed = parseIngredient(newText);
  if (!newParsed) return null;

  for (const existing of existingTexts) {
    const exParsed = parseIngredient(existing);
    if (!exParsed) continue;
    if (normalizeName(exParsed.name) !== normalizeName(newParsed.name)) continue;
    if (exParsed.unit.group !== newParsed.unit.group) continue;

    const totalBase = exParsed.qty * exParsed.unit.baseValue + newParsed.qty * newParsed.unit.baseValue;
    const mergedAmount = formatInUnit(totalBase, newParsed.unit.group, exParsed.unit);
    return { mergedText: `${mergedAmount} ${exParsed.name}`, matchedText: existing };
  }
  return null;
}
