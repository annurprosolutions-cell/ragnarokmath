// Shared helpers for the question generators: seeded RNG, number formatting
// (Malaysian textbook style) and the multiple-choice builder.

export type GradeId =
  | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6'
  | 'F1' | 'F2' | 'F3' | 'F4' | 'F5';

export const GRADES: GradeId[] = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'F1', 'F2', 'F3', 'F4', 'F5'];

export const GRADE_NAMES: Record<GradeId, string> = {
  T1: 'Tahun 1', T2: 'Tahun 2', T3: 'Tahun 3', T4: 'Tahun 4', T5: 'Tahun 5', T6: 'Tahun 6',
  F1: 'Tingkatan 1', F2: 'Tingkatan 2', F3: 'Tingkatan 3', F4: 'Tingkatan 4', F5: 'Tingkatan 5',
};

export function gradeIndex(g: GradeId): number {
  return GRADES.indexOf(g);
}

/** A generated question before the choices are shuffled. All text is trusted HTML built by our generators. */
export interface Draft {
  prompt: string;
  correct: string;
  wrong: string[];
  explain: string;
}

export interface Question {
  topicId: string;
  topicName: string;
  grade: GradeId;
  prompt: string;
  choices: string[];
  answer: number;
  explain: string;
}

export interface Topic {
  id: string;
  grade: GradeId;
  name: string;
  gen: (r: Rng) => Draft;
}

// ---------------------------------------------------------------- RNG

export class Rng {
  private s: number;
  constructor(seed = (Math.random() * 2 ** 32) >>> 0) {
    this.s = seed >>> 0;
  }
  /** mulberry32 */
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** Integer in [a, b] inclusive. */
  int(a: number, b: number): number {
    return a + Math.floor(this.next() * (b - a + 1));
  }
  range(a: number, b: number): number {
    return a + this.next() * (b - a);
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  /** k distinct items from arr. */
  sample<T>(arr: readonly T[], k: number): T[] {
    return this.shuffle(arr.slice()).slice(0, k);
  }
}

// ---------------------------------------------------------------- formatting

const NBSP = ' ';
const MINUS = '−';

function groupDigits(intPart: string): string {
  return intPart.length > 3 ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : intPart;
}

/** Round away float noise (0.1 + 0.2) to at most 6 decimal places. */
export function clean(x: number): number {
  return Number(x.toFixed(6));
}

/** Number in textbook style: 12 345, 0.75, −4. */
export function n(x: number): string {
  const v = clean(x);
  const neg = v < 0;
  const [i, f] = String(Math.abs(v)).split('.');
  return (neg ? MINUS : '') + groupDigits(i) + (f ? '.' + f : '');
}

/** Ringgit with two decimal places: RM1 250.50 */
export function rm(x: number): string {
  const v = clean(x);
  const neg = v < 0;
  const [i, f] = Math.abs(v).toFixed(2).split('.');
  // Whole ringgit shown without sen for younger levels' readability.
  return (neg ? MINUS : '') + 'RM' + groupDigits(i) + (f === '00' ? '' : '.' + f);
}

/** Ringgit always with sen: RM12.00 */
export function rm2(x: number): string {
  const v = clean(x);
  const [i, f] = Math.abs(v).toFixed(2).split('.');
  return (v < 0 ? MINUS : '') + 'RM' + groupDigits(i) + '.' + f;
}

/** Wrap negatives in brackets for use inside expressions: (−5) */
export function nb(x: number): string {
  return x < 0 ? `(${n(x)})` : n(x);
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

/** Stacked fraction HTML. Simplify first if you need lowest terms. */
export function fr(num: number, den: number): string {
  if (den === 1) return n(num);
  const neg = num * den < 0;
  return `${neg ? MINUS : ''}<span class="fr"><span>${Math.abs(num)}</span><span>${Math.abs(den)}</span></span>`;
}

/** Fraction in lowest terms. */
export function frs(num: number, den: number): string {
  const g = gcd(num, den) || 1;
  return fr(num / g, den / g);
}

/** Mixed number, e.g. 2¾ (proper fraction part must be < 1). */
export function mixed(num: number, den: number): string {
  const g = gcd(num, den) || 1;
  num /= g;
  den /= g;
  const w = Math.floor(num / den);
  const r = num % den;
  if (r === 0) return n(w);
  if (w === 0) return fr(r, den);
  return `${w}${fr(r, den)}`;
}

export function sup(base: string | number, exp: string | number): string {
  return `${base}<sup>${exp}</sup>`;
}

export function deg(x: number): string {
  return `${n(x)}°`;
}

/** 2×2 (or 2×1) matrix HTML. */
export function mat(rows: number[][]): string {
  const body = rows.map((r) => `<span class="mrow">${r.map((v) => `<span>${n(v)}</span>`).join('')}</span>`).join('');
  return `<span class="mat">${body}</span>`;
}

// ---------------------------------------------------------------- draft builders

/** Generic draft; the generator supplies distinct wrong answers. */
export function q(prompt: string, correct: string, wrong: string[], explain: string): Draft {
  return { prompt, correct, wrong, explain };
}

/**
 * Numeric draft: wrong candidates are filtered (no duplicates, no answer, no
 * negatives unless allowed) and topped up with near misses so there are always 3.
 */
export function numq(
  prompt: string,
  answer: number,
  candidates: number[],
  explain: string,
  fmt: (x: number) => string = n,
  opts: { allowNeg?: boolean; step?: number } = {},
): Draft {
  const step = opts.step ?? 1;
  const allowNeg = opts.allowNeg ?? answer < 0;
  const ans = clean(answer);
  const seen = new Set<string>([fmt(ans)]);
  const wrong: string[] = [];
  const tryAdd = (c: number) => {
    const v = clean(c);
    if (!Number.isFinite(v) || (!allowNeg && v < 0)) return;
    const s = fmt(v);
    if (seen.has(s)) return;
    seen.add(s);
    wrong.push(s);
  };
  for (const c of candidates) {
    if (wrong.length >= 3) break;
    tryAdd(c);
  }
  for (let k = 1; wrong.length < 3 && k < 50; k++) {
    tryAdd(ans + k * step);
    if (wrong.length < 3) tryAdd(ans - k * step);
  }
  return { prompt, correct: fmt(ans), wrong, explain };
}

/**
 * Numeric value of a choice that is a plain number, fraction or mixed number
 * (e.g. "4", "−2.5", 3/8, 2¾). Anything with units or words returns null.
 */
export function choiceValue(html: string): number | null {
  const s = html
    .replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, '[$1/$2]')
    .replace(/[\u00a0\s]/g, '')
    .replace(/\u2212/g, '-');
  const m = s.match(/^(-?)(\d+(?:\.\d+)?)?(?:\[(\d+)\/(\d+)\])?$/);
  if (!m || (!m[2] && !m[3])) return null;
  const whole = m[2] ? Number(m[2]) : 0;
  const frac = m[3] ? Number(m[3]) / Number(m[4]) : 0;
  return (m[1] ? -1 : 1) * (whole + frac);
}

/** Shuffle a draft into a playable question. Wrong choices equal in value to the answer (4/8 vs 1/2) are dropped. */
export function finalize(topic: Topic, d: Draft, r: Rng): Question {
  const target = choiceValue(d.correct);
  const sameValue = (w: string) => {
    const v = target === null ? null : choiceValue(w);
    return v !== null && Math.abs(v - target!) < 1e-9;
  };
  const uniqueWrong = Array.from(new Set(d.wrong.filter((w) => w !== d.correct && !sameValue(w)))).slice(0, 3);
  const choices = r.shuffle([d.correct, ...uniqueWrong]);
  return {
    topicId: topic.id,
    topicName: topic.name,
    grade: topic.grade,
    prompt: d.prompt,
    choices,
    answer: choices.indexOf(d.correct),
    explain: d.explain,
  };
}
