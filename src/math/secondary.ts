// KSSM Matematik — Tingkatan 1 hingga Tingkatan 5.
import { Topic, q, numq, n, nb, rm, rm2, fr, frs, sup, deg, mat, gcd, lcm, clean } from './core';

const NAMES = ['Ahmad', 'Farah', 'Jason', 'Lakshmi', 'Zul', 'Hui Min', 'Amirul', 'Kavitha', 'Iskandar', 'Sofia'];

/** "ax + b" with nice signs: 3x − 4, x + 2, −x */
function lin(a: number, b: number, v = 'x'): string {
  const ax = a === 0 ? '' : a === 1 ? v : a === -1 ? `−${v}` : `${n(a)}${v}`;
  if (b === 0) return ax || '0';
  if (!ax) return n(b);
  return `${ax} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`;
}

/** x² + bx + c */
function quad(b: number, c: number): string {
  let s = sup('x', 2);
  if (b) s += ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
  if (c) s += ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
  return s;
}

/** (x + a) */
function bin(a: number): string {
  if (a === 0) return 'x';
  return a < 0 ? `(x − ${-a})` : `(x + ${a})`;
}

const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29]];

export const SECONDARY: Topic[] = [
  // ------------------------------------------------------------ Tingkatan 1
  {
    id: 'f1-integer', grade: 'F1', name: 'Integer',
    gen: (r) => {
      const a = r.int(-12, 12) || -5, b = r.int(-9, 9) || 3;
      const op = r.pick(['+', '−', '×'] as const);
      const ans = op === '+' ? a + b : op === '−' ? a - b : a * b;
      const alt = op === '+' ? a - b : op === '−' ? a + b : -a * b;
      return numq(`${nb(a)} ${op} ${nb(b)} = ?`, ans, [alt, -ans, ans + 1], op === '×' ? `Tanda sama → positif, tanda berbeza → negatif. Jawapan ${n(ans)}.` : `Gunakan garis nombor. ${nb(a)} ${op} ${nb(b)} = ${n(ans)}`, n, { allowNeg: true });
    },
  },
  {
    id: 'f1-fstb', grade: 'F1', name: 'Faktor dan gandaan (FSTB, GSTK)',
    gen: (r) => {
      if (r.chance(0.5)) {
        const g = r.pick([2, 3, 4, 5, 6, 8]), x = r.int(2, 7), y = r.int(2, 7);
        if (gcd(x, y) !== 1) return numq(`FSTB bagi ${g * 5} dan ${g * 7} ialah`, g, [g * 35, 1, g * 5], `${g * 5} = ${g} × 5, ${g * 7} = ${g} × 7. FSTB = ${g}`);
        const A = g * x, B = g * y;
        return numq(`Faktor sepunya terbesar (FSTB) bagi ${A} dan ${B} ialah`, g, [lcm(A, B), Math.min(A, B), g * 2, 1], `Faktor terbesar yang membahagi kedua-duanya ialah ${g}.`);
      }
      const A = r.pick([4, 6, 8, 9, 10, 12]), B = r.pick([3, 5, 6, 8, 15]);
      if (A === B) return numq(`GSTK bagi 4 dan 6 ialah`, 12, [24, 2, 10], `Gandaan 4: 4, 8, <b>12</b>… Gandaan 6: 6, <b>12</b>… GSTK = 12`);
      return numq(`Gandaan sepunya terkecil (GSTK) bagi ${A} dan ${B} ialah`, lcm(A, B), [A * B === lcm(A, B) ? A * B * 2 : A * B, gcd(A, B), A + B], `Gandaan sepunya yang terkecil bagi ${A} dan ${B} ialah ${lcm(A, B)}.`);
    },
  },
  {
    id: 'f1-kuasa', grade: 'F1', name: 'Kuasa dua, punca kuasa dua, kuasa tiga',
    gen: (r) => {
      const k = r.int(0, 3);
      if (k === 0) { const x = r.int(2, 15); return numq(`${sup(x, 2)} = ?`, x * x, [2 * x, x * x + x, (x + 1) * (x + 1)], `${x} × ${x} = ${x * x}`); }
      if (k === 1) { const x = r.int(2, 15); return numq(`√${x * x} = ?`, x, [x * x / 2, x + 1, x - 1], `${x} × ${x} = ${x * x}, jadi √${x * x} = ${x}`); }
      if (k === 2) { const x = r.int(2, 6); return numq(`${sup(x, 3)} = ?`, x ** 3, [3 * x, x * x, x ** 3 + x], `${x} × ${x} × ${x} = ${x ** 3}`); }
      const x = r.int(2, 6);
      return numq(`∛${x ** 3} = ?`, x, [x + 1, x * 3, x - 1], `${x} × ${x} × ${x} = ${x ** 3}, jadi ∛${x ** 3} = ${x}`);
    },
  },
  {
    id: 'f1-nisbah', grade: 'F1', name: 'Nisbah, kadar dan kadaran',
    gen: (r) => {
      if (r.chance(0.5)) {
        const a = r.int(1, 5), k = r.int(3, 20);
        const b = a + r.int(1, 3);
        const total = (a + b) * k;
        return numq(`${rm(total)} dibahagikan antara ${r.pick(NAMES)} dan ${r.pick(NAMES)} dalam nisbah ${a} : ${b}. Berapakah bahagian yang <b>pertama</b>?`, a * k, [b * k, total / 2, k], `Jumlah bahagian = ${a + b}. Satu bahagian = ${rm(total)} ÷ ${a + b} = ${rm(k)}. Pertama = ${a} × ${rm(k)} = ${rm(a * k)}`, rm);
      }
      const speed = r.pick([40, 50, 60, 80, 90]), h = r.int(2, 5);
      return numq(`Sebuah bas bergerak sejauh ${speed * h} km dalam ${h} jam. Berapakah kadar purata bas itu?`, speed, [speed * h, speed + 10, speed - 10], `Kadar = ${speed * h} km ÷ ${h} jam = ${speed} km/j`, (x) => `${x} km/j`);
    },
  },
  {
    id: 'f1-ungkapan', grade: 'F1', name: 'Ungkapan algebra',
    gen: (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const a = r.int(2, 9), b = r.int(1, 9), c = r.int(1, a + b - 1);
        const ans = a + b - c;
        return q(`Ringkaskan: ${a}x + ${b}x − ${c}x`, lin(ans, 0), [lin(a + b + c, 0), lin(ans, 0) + '²', lin(ans + 1, 0)], `(${a} + ${b} − ${c})x = ${lin(ans, 0)}`);
      }
      if (k === 1) {
        const a = r.int(2, 6), b = r.int(1, 9);
        return q(`Kembangkan: ${a}(x + ${b})`, lin(a, a * b), [lin(a, b), lin(1, a * b), lin(a, a + b), lin(a + b, a * b), lin(a, a * b + 1)], `${a} × x + ${a} × ${b} = ${lin(a, a * b)}`);
      }
      const a = r.int(2, 6), b = r.int(-9, 9) || 4, x = r.int(1, 6);
      return numq(`Cari nilai ${lin(a, b)} apabila x = ${x}.`, a * x + b, [a + x + b, a * x - b, a * (x + b)], `${a}(${x}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${a * x + b}`, n, { allowNeg: true });
    },
  },
  {
    id: 'f1-persamaan', grade: 'F1', name: 'Persamaan linear',
    gen: (r) => {
      const a = r.int(2, 9), x = r.int(-5, 12) || 3, b = r.int(-15, 20) || 5;
      const c = a * x + b;
      return numq(`Selesaikan: ${lin(a, b)} = ${n(c)}`, x, [c - b, -x, x + 1, x - 1], `${a}x = ${n(c)} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${n(c - b)}, jadi x = ${n(c - b)} ÷ ${a} = ${n(x)}`, (v) => `x = ${n(v)}`, { allowNeg: true });
    },
  },
  {
    id: 'f1-ketaksamaan', grade: 'F1', name: 'Ketaksamaan linear',
    gen: (r) => {
      const [sym, flip] = r.pick([['>', '<'], ['<', '>'], ['≥', '≤'], ['≤', '≥']] as const);
      if (r.chance(0.5)) {
        const b = r.int(2, 12), c = r.int(b + 1, 25);
        const ans = c - b;
        return q(`Selesaikan: x + ${b} ${sym} ${c}`, `x ${sym} ${ans}`, [`x ${flip} ${ans}`, `x ${sym} ${c + b}`, `x ${sym} ${ans + 1}`], `Tolak ${b} pada kedua-dua belah: x ${sym} ${c} − ${b} = ${ans}`);
      }
      const a = r.int(2, 6), ans = r.int(2, 9);
      return q(`Selesaikan: ${a}x ${sym} ${a * ans}`, `x ${sym} ${ans}`, [`x ${flip} ${ans}`, `x ${sym} ${a * ans - a}`, `x ${sym} ${a * a * ans}`, `x ${sym} ${a * ans}`], `Bahagi kedua-dua belah dengan ${a} (positif, tanda kekal): x ${sym} ${ans}`);
    },
  },
  {
    id: 'f1-sudut', grade: 'F1', name: 'Garis dan sudut',
    gen: (r) => {
      const k = r.int(0, 2);
      if (k === 0) { const a = r.int(10, 80); return numq(`Sudut <b>pelengkap</b> bagi ${deg(a)} ialah`, 90 - a, [180 - a, 360 - a, a], `Sudut pelengkap berjumlah 90°: 90° − ${deg(a)} = ${deg(90 - a)}`, deg); }
      if (k === 1) { const a = r.int(20, 160); return numq(`Sudut <b>penggenap</b> bagi ${deg(a)} ialah`, 180 - a, [90 - a, 360 - a, a], `Sudut penggenap berjumlah 180°: 180° − ${deg(a)} = ${deg(180 - a)}`, deg); }
      const a = r.int(60, 150), b = r.int(40, 300 - a - 20);
      return numq(`Tiga sudut bertemu pada satu titik: ${deg(a)}, ${deg(b)} dan x. Cari x.`, 360 - a - b, [180 - a - b, 360 - a, a + b], `Sudut pada satu titik = 360°. x = 360° − ${deg(a)} − ${deg(b)} = ${deg(360 - a - b)}`, deg, { allowNeg: false });
    },
  },
  {
    id: 'f1-pythagoras', grade: 'F1', name: 'Teorem Pythagoras',
    gen: (r) => {
      const [a, b, c] = r.pick(TRIPLES);
      if (r.chance(0.5)) return numq(`Sebuah segi tiga bersudut tegak mempunyai sisi ${a} cm dan ${b} cm. Panjang hipotenus ialah`, c, [a + b, c + 1, b + 1], `√(${sup(a, 2)} + ${sup(b, 2)}) = √${a * a + b * b} = ${c} cm`, (x) => `${x} cm`);
      return numq(`Hipotenus ${c} cm dan satu sisi ${a} cm. Panjang sisi yang satu lagi ialah`, b, [c - a, c + a, b + 1], `√(${sup(c, 2)} − ${sup(a, 2)}) = √${c * c - a * a} = ${b} cm`, (x) => `${x} cm`);
    },
  },
  {
    id: 'f1-set', grade: 'F1', name: 'Pengenalan set',
    gen: (r) => {
      const x = r.pick([12, 18, 20, 24, 28, 30, 36]);
      const factors = Array.from({ length: x }, (_, i) => i + 1).filter((i) => x % i === 0);
      return numq(`A = {faktor bagi ${x}}. Cari n(A).`, factors.length, [factors.length - 1, x / 2, factors.length + 2], `A = {${factors.join(', ')}}, jadi n(A) = ${factors.length}`);
    },
  },
  {
    id: 'f1-luas', grade: 'F1', name: 'Perimeter dan luas',
    gen: (r) => {
      if (r.chance(0.5)) {
        const b = r.int(2, 12) * 2, h = r.int(3, 15);
        return numq(`Luas segi tiga dengan tapak ${b} cm dan tinggi ${h} cm ialah`, (b * h) / 2, [b * h, b + h, (b * h) / 2 + b], `Luas = ½ × ${b} × ${h} = ${(b * h) / 2} cm²`, (x) => `${n(x)} cm²`);
      }
      const a = r.int(3, 10), b = r.int(a + 2, 16), h = r.int(2, 10) * 2;
      return numq(`Luas trapezium dengan sisi selari ${a} cm dan ${b} cm serta tinggi ${h} cm ialah`, ((a + b) * h) / 2, [(a + b) * h, a * b, a + b + h], `Luas = ½ × (${a} + ${b}) × ${h} = ${((a + b) * h) / 2} cm²`, (x) => `${n(x)} cm²`);
    },
  },

  // ------------------------------------------------------------ Tingkatan 2
  {
    id: 'f2-pola', grade: 'F2', name: 'Pola dan jujukan',
    gen: (r) => {
      if (r.chance(0.6)) {
        const a = r.int(-5, 20), d = r.pick([-4, -3, 2, 3, 4, 5, 7, 9]);
        const seq = Array.from({ length: 4 }, (_, i) => a + i * d);
        const ans = a + 4 * d;
        return numq(`Cari sebutan seterusnya: ${seq.map(n).join(', ')}, …`, ans, [ans + d, ans - 1, seq[3] * 2], `Beza sepunya = ${n(d)}. ${n(seq[3])} ${d < 0 ? '−' : '+'} ${Math.abs(d)} = ${n(ans)}`, n, { allowNeg: true });
      }
      const a = r.int(1, 4), k = r.pick([2, 3]);
      const seq = Array.from({ length: 4 }, (_, i) => a * k ** i);
      return numq(`Cari sebutan seterusnya: ${seq.join(', ')}, …`, a * k ** 4, [seq[3] + (seq[3] - seq[2]), seq[3] * 2 + 1, a * k ** 4 + k], `Setiap sebutan didarab ${k}: ${seq[3]} × ${k} = ${a * k ** 4}`);
    },
  },
  {
    id: 'f2-kembang', grade: 'F2', name: 'Kembangan dan pemfaktoran',
    gen: (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const a = r.int(-6, 7) || 2, b = r.int(-6, 7) || 3;
        return q(`Kembangkan: ${bin(a)}${bin(b)}`, quad(a + b, a * b), [quad(a * b, a + b), quad(a + b, a + b), sup('x', 2) + ` ${a * b < 0 ? '−' : '+'} ${Math.abs(a * b)}`].filter((x) => x !== quad(a + b, a * b)).concat(quad(a + b, -a * b), quad(a + b + 1, a * b), quad(2 * (a + b), a * b)), `x² + (${n(a)} + ${n(b)})x + (${n(a)})(${n(b)}) = ${quad(a + b, a * b)}`);
      }
      if (k === 1) {
        const a = r.int(2, 9);
        return q(`Faktorkan: ${sup('x', 2)} − ${a * a}`, `(x + ${a})(x − ${a})`, [`(x − ${a})²`, `(x + ${a})²`, `x(x − ${a * a})`], `Beza dua kuasa dua: x² − ${a}² = (x + ${a})(x − ${a})`);
      }
      const g = r.int(2, 6), a = r.int(2, 5), b = r.int(1, 9);
      if (gcd(a, b) !== 1) return q(`Faktorkan: 6x + 9`, `3(2x + 3)`, [`6(x + 9)`, `3(2x + 9)`, `2(3x + 3)`], `FSTB 6 dan 9 = 3: 3(2x + 3)`);
      return q(`Faktorkan: ${lin(g * a, g * b)}`, `${g}(${lin(a, b)})`, [`${g}(${lin(a, g * b)})`, `${a}(${lin(g, b)})`, `${g * a}(x + ${b})`, `${g}(${lin(a, b + 1)})`, `${g}(${lin(a + 1, b)})`].filter((x) => x !== `${g}(${lin(a, b)})`), `FSTB bagi ${g * a} dan ${g * b} ialah ${g}: ${g}(${lin(a, b)})`);
    },
  },
  {
    id: 'f2-rumus', grade: 'F2', name: 'Rumus algebra',
    gen: (r) => {
      if (r.chance(0.5)) {
        const u = r.int(0, 20), a = r.int(1, 5), t = r.int(2, 10);
        return numq(`Diberi v = u + at. Cari v apabila u = ${u}, a = ${a} dan t = ${t}.`, u + a * t, [(u + a) * t, u * a * t, u + a + t], `v = ${u} + ${a}(${t}) = ${u + a * t}`);
      }
      const p = r.int(3, 20), l = r.int(2, 15);
      return numq(`Diberi P = 2(p + l). Cari P apabila p = ${p} dan l = ${l}.`, 2 * (p + l), [p + l, 2 * p + l, p * l], `P = 2(${p} + ${l}) = ${2 * (p + l)}`);
    },
  },
  {
    id: 'f2-poligon', grade: 'F2', name: 'Poligon',
    gen: (r) => {
      const polys: [string, number][] = [['pentagon', 5], ['heksagon', 6], ['oktagon', 8], ['nonagon', 9], ['dekagon', 10]];
      const [name, s] = r.pick(polys);
      const k = r.int(0, 2);
      if (k === 0) return numq(`Hasil tambah sudut pedalaman sebuah ${name} ialah`, (s - 2) * 180, [s * 180, (s - 1) * 180, 360], `(n − 2) × 180° = (${s} − 2) × 180° = ${deg((s - 2) * 180)}`, deg);
      if (k === 1) return numq(`Saiz setiap sudut peluaran sebuah ${name} sekata ialah`, 360 / s, [180 / s, 180 - 360 / s, 360], `360° ÷ ${s} = ${deg(360 / s)}`, deg);
      return numq(`Saiz setiap sudut pedalaman sebuah ${name} sekata ialah`, 180 - 360 / s, [360 / s, (s - 2) * 180, 180], `180° − (360° ÷ ${s}) = ${deg(180 - 360 / s)}`, deg);
    },
  },
  {
    id: 'f2-bulatan', grade: 'F2', name: 'Bulatan',
    gen: (r) => {
      const rad = r.pick([7, 14, 21, 3.5, 10.5]);
      const pi = `π = ${fr(22, 7)}`;
      if (r.chance(0.5)) return numq(`Cari lilitan bulatan berjejari ${n(rad)} cm. (Guna ${pi})`, (2 * 22 * rad) / 7, [(22 * rad) / 7, (22 * rad * rad) / 7, (2 * 22 * rad) / 7 + 7], `Lilitan = 2πj = 2 × ${fr(22, 7)} × ${n(rad)} = ${n((44 * rad) / 7)} cm`, (x) => `${n(x)} cm`);
      return numq(`Cari luas bulatan berjejari ${n(rad)} cm. (Guna ${pi})`, (22 * rad * rad) / 7, [(44 * rad) / 7, (22 * rad) / 7, (22 * rad * rad) / 14], `Luas = πj² = ${fr(22, 7)} × ${n(rad)}² = ${n((22 * rad * rad) / 7)} cm²`, (x) => `${n(x)} cm²`);
    },
  },
  {
    id: 'f2-3d', grade: 'F2', name: 'Bentuk geometri tiga dimensi',
    gen: (r) => {
      if (r.chance(0.5)) {
        const rad = r.pick([7, 14]), h = r.int(2, 10);
        const v = (22 * rad * rad * h) / 7;
        return numq(`Isi padu silinder berjejari ${rad} cm dan tinggi ${h} cm ialah (π = ${fr(22, 7)})`, v, [(44 * rad * h) / 7, v / 2, v * 2], `V = πj²t = ${fr(22, 7)} × ${rad}² × ${h} = ${n(v)} cm³`, (x) => `${n(x)} cm³`);
      }
      const b = r.int(2, 8) * 2, h = r.int(3, 9), L = r.int(5, 15);
      const v = (b * h * L) / 2;
      return numq(`Sebuah prisma tegak mempunyai keratan rentas segi tiga (tapak ${b} cm, tinggi ${h} cm) dan panjang ${L} cm. Isi padunya ialah`, v, [b * h * L, v + L, (b * h) / 2], `V = luas keratan rentas × panjang = ${(b * h) / 2} × ${L} = ${n(v)} cm³`, (x) => `${n(x)} cm³`);
    },
  },
  {
    id: 'f2-koordinat', grade: 'F2', name: 'Koordinat',
    gen: (r) => {
      if (r.chance(0.5)) {
        const [a, b, c] = r.pick(TRIPLES.slice(0, 5));
        const x1 = r.int(-3, 5), y1 = r.int(-3, 5);
        return numq(`Cari jarak antara titik (${n(x1)}, ${n(y1)}) dan (${n(x1 + a)}, ${n(y1 + b)}).`, c, [a + b, c + 1, b], `√(${a}² + ${b}²) = √${a * a + b * b} = ${c} unit`, (x) => `${x} unit`);
      }
      const x1 = r.int(-4, 6), y1 = r.int(-4, 6), x2 = x1 + 2 * r.int(1, 5), y2 = y1 + 2 * r.int(-3, 5);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const P = (a: number, b: number) => `(${n(a)}, ${n(b)})`;
      return q(`Cari titik tengah bagi (${n(x1)}, ${n(y1)}) dan (${n(x2)}, ${n(y2)}).`, P(mx, my), [P(x2 - x1, y2 - y1), P(my, mx), P(mx + 1, my)].filter((x) => x !== P(mx, my)).concat(P(x1 + x2, y1 + y2), P(mx, my + 1)), `((${n(x1)} + ${n(x2)}) ÷ 2, (${n(y1)} + ${n(y2)}) ÷ 2) = ${P(mx, my)}`);
    },
  },
  {
    id: 'f2-fungsi', grade: 'F2', name: 'Graf fungsi',
    gen: (r) => {
      const a = r.int(1, 3), c = r.int(-6, 6), x = r.int(-3, 4);
      const ans = a * x * x + c;
      const fx = `${a === 1 ? '' : a}${sup('x', 2)}${c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : ''}`;
      return numq(`Diberi f(x) = ${fx}. Cari f(${n(x)}).`, ans, [a * 2 * x + c, -(a * x * x) + c, (a * x) ** 2 + c], `f(${n(x)}) = ${a === 1 ? '' : a + '('}${nb(x)}²${a === 1 ? '' : ')'} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${n(ans)}`, n, { allowNeg: true });
    },
  },
  {
    id: 'f2-laju', grade: 'F2', name: 'Laju dan pecutan',
    gen: (r) => {
      if (r.chance(0.5)) {
        const v = r.pick([45, 60, 75, 80, 90, 100]), t = r.int(2, 5);
        return numq(`Sebuah kereta bergerak sejauh ${v * t} km dalam ${t} jam. Laju puratanya ialah`, v, [v * t, v + t, v - 15], `Laju = jarak ÷ masa = ${v * t} ÷ ${t} = ${v} km/j`, (x) => `${x} km/j`);
      }
      const u = r.int(0, 10), a = r.int(1, 6), t = r.int(2, 8);
      return numq(`Laju sebuah basikal bertambah daripada ${u} m/s kepada ${u + a * t} m/s dalam masa ${t} s. Pecutannya ialah`, a, [a + 2, a * t, a + 1], `Pecutan = (${u + a * t} − ${u}) ÷ ${t} = ${a} m/s²`, (x) => `${n(x)} m/s²`);
    },
  },
  {
    id: 'f2-kecerunan', grade: 'F2', name: 'Kecerunan garis lurus',
    gen: (r) => {
      const m = r.pick([-3, -2, -1, 1, 2, 3, 4]), x1 = r.int(-3, 4), y1 = r.int(-4, 5), dx = r.int(1, 4);
      const x2 = x1 + dx, y2 = y1 + m * dx;
      return numq(`Kecerunan garis lurus yang melalui (${n(x1)}, ${n(y1)}) dan (${n(x2)}, ${n(y2)}) ialah`, m, [-m, m + 1, m * dx], `m = (${n(y2)} − ${nb(y1)}) ÷ (${n(x2)} − ${nb(x1)}) = ${n(m * dx)} ÷ ${dx} = ${n(m)}`, n, { allowNeg: true });
    },
  },
  {
    id: 'f2-kebarangkalian', grade: 'F2', name: 'Kebarangkalian mudah',
    gen: (r) => {
      if (r.chance(0.5)) {
        const red = r.int(1, 9), blue = r.int(1, 9);
        return q(`Sebuah kotak mengandungi ${red} bola merah dan ${blue} bola biru. Sebiji bola dipilih secara rawak. Kebarangkalian bola itu <b>merah</b> ialah`, frs(red, red + blue), [frs(blue, red + blue), fr(red, blue), frs(1, red + blue)].filter((x) => x !== frs(red, red + blue)).concat(frs(red + 1, red + blue + 1), frs(red, red + blue + 2)), `P(merah) = ${fr(red, red + blue)}${gcd(red, red + blue) > 1 ? ' = ' + frs(red, red + blue) : ''}`);
      }
      const [desc, count] = r.pick([['nombor genap', 3], ['nombor lebih besar daripada 4', 2], ['nombor perdana', 3], ['nombor 6', 1], ['faktor bagi 6', 4]] as const);
      return q(`Sebiji dadu dilambung. Kebarangkalian mendapat ${desc} ialah`, frs(count, 6), [frs(6 - count, 6), fr(count, 5), frs(count + 1, 6)].filter((x) => x !== frs(count, 6)).concat(frs(count, 12), fr(1, 3 + count)), `Ada ${count} kesudahan daripada 6: ${fr(count, 6)}${gcd(count, 6) > 1 ? ' = ' + frs(count, 6) : ''}`);
    },
  },
  {
    id: 'f2-statistik', grade: 'F2', name: 'Sukatan kecenderungan memusat',
    gen: (r) => {
      const k = r.pick([4, 6]);
      const vals = Array.from({ length: k }, () => r.int(1, 30)).sort((a, b) => a - b);
      if (r.chance(0.5)) {
        const med = (vals[k / 2 - 1] + vals[k / 2]) / 2;
        return numq(`Cari median bagi: ${vals.join(', ')}`, med, [vals[k / 2], vals[k / 2 - 1], vals[k / 2] + vals[k / 2 - 1]], `Bilangan genap: purata dua nilai tengah = (${vals[k / 2 - 1]} + ${vals[k / 2]}) ÷ 2 = ${n(med)}`, n, { step: 0.5 });
      }
      const total = vals.reduce((s, v) => s + v, 0);
      const fix = (k - (total % k)) % k;
      vals[k - 1] += fix;
      const t2 = total + fix;
      return numq(`Cari min bagi: ${vals.join(', ')}`, t2 / k, [t2, t2 / k + 1, vals[k - 1] - vals[0]], `Min = ${t2} ÷ ${k} = ${n(t2 / k)}`);
    },
  },

  // ------------------------------------------------------------ Tingkatan 3
  {
    id: 'f3-indeks', grade: 'F3', name: 'Indeks',
    gen: (r) => {
      const k = r.int(0, 3);
      const m = r.int(2, 7), p = r.int(2, 6);
      if (k === 0) return q(`Ringkaskan: ${sup('a', m)} × ${sup('a', p)}`, sup('a', m + p), [sup('a', m * p), sup('a', Math.abs(m - p) || 1), sup('2a', m + p)].filter((x) => x !== sup('a', m + p)).concat(sup('a', m + p + 1)), `Darab: tambah indeks. ${m} + ${p} = ${m + p}`);
      if (k === 1) return q(`Ringkaskan: (${sup('a', m)})${'<sup>' + p + '</sup>'}`, sup('a', m * p), [sup('a', m + p), sup('a', m * p + 1), sup('a', m ** p)].filter((x) => x !== sup('a', m * p)).concat(sup('a', m * p - 1), sup('a', m * p + 2)), `Kuasa bagi kuasa: darab indeks. ${m} × ${p} = ${m * p}`);
      if (k === 2) { const big = m + p; return q(`Ringkaskan: ${sup('a', big)} ÷ ${sup('a', p)}`, sup('a', m), [sup('a', big + p), sup('a', big * p), sup('a', m + 1)], `Bahagi: tolak indeks. ${big} − ${p} = ${m}`); }
      const [base, root, val] = r.pick([[16, 2, 4], [25, 2, 5], [27, 3, 3], [8, 3, 2], [64, 3, 4], [81, 2, 9], [125, 3, 5]] as const);
      return numq(`${base}<sup>${fr(1, root)}</sup> = ?`, val, [val + 1, val * root, base - val], `${base}<sup>${fr(1, root)}</sup> = punca kuasa ${root === 2 ? 'dua' : 'tiga'} bagi ${base} = ${val}`);
    },
  },
  {
    id: 'f3-piawai', grade: 'F3', name: 'Bentuk piawai',
    gen: (r) => {
      const mant = r.int(11, 99) / 10;
      const e = r.chance(0.5) ? r.int(3, 6) : -r.int(2, 5);
      const value = clean(mant * 10 ** e);
      const sp = (m: number, ex: number) => `${n(m)} × ${sup(10, n(ex))}`;
      return q(`Tulis ${n(value)} dalam bentuk piawai.`, sp(mant, e), [sp(mant, -e), sp(mant, e + 1), sp(mant * 10, e - 1)].filter((x) => x !== sp(mant, e)), `Gerakkan titik perpuluhan supaya 1 ≤ A &lt; 10: ${sp(mant, e)}`);
    },
  },
  {
    id: 'f3-simpanan', grade: 'F3', name: 'Simpanan dan pelaburan',
    gen: (r) => {
      const P = r.pick([1000, 2000, 5000, 10000]), rate = r.pick([2, 3, 4, 5]);
      if (r.chance(0.5)) {
        const t = r.int(2, 5);
        return numq(`Faedah mudah bagi simpanan ${rm(P)} pada kadar ${rate}% setahun selama ${t} tahun ialah`, (P * rate * t) / 100, [(P * rate) / 100, P + (P * rate * t) / 100, (P * rate * t) / 10], `I = Prt = ${rm(P)} × ${rate}% × ${t} = ${rm((P * rate * t) / 100)}`, rm2);
      }
      const A = P * (1 + rate / 100) ** 2;
      return numq(`${rm(P)} dilaburkan dengan faedah kompaun ${rate}% setahun, dikompaun setiap tahun. Nilai matang selepas 2 tahun ialah`, A, [P + (2 * P * rate) / 100, P * (1 + rate / 100), A + P / 100], `MV = P(1 + r/n)<sup>nt</sup> = ${rm(P)} × (1.0${rate})² = ${rm2(A)}`, rm2);
    },
  },
  {
    id: 'f3-kredit', grade: 'F3', name: 'Kredit dan hutang',
    gen: (r) => {
      const P = r.pick([3000, 5000, 6000, 10000, 12000]), rate = r.pick([3, 4, 5, 6]), t = r.int(2, 5);
      const A = P + (P * rate * t) / 100;
      return numq(`${r.pick(NAMES)} meminjam ${rm(P)} dengan kadar faedah sama rata ${rate}% setahun selama ${t} tahun. Jumlah bayaran balik ialah`, A, [(P * rate * t) / 100, P + (P * rate) / 100, A + P / 10], `A = P + Prt = ${rm(P)} + ${rm((P * rate * t) / 100)} = ${rm(A)}`, rm);
    },
  },
  {
    id: 'f3-skala', grade: 'F3', name: 'Lukisan berskala',
    gen: (r) => {
      const s = r.pick([50, 100, 200, 250, 500]), len = r.int(2, 12);
      const real = (len * s) / 100;
      return numq(`Skala sebuah pelan ialah 1 : ${s}. Panjang dinding dalam pelan ialah ${len} cm. Panjang sebenar dinding itu ialah`, real, [len * s, real * 10, real / 10], `${len} cm × ${s} = ${n(len * s)} cm = ${n(real)} m`, (x) => `${n(x)} m`, { step: 0.5 });
    },
  },
  {
    id: 'f3-trigo', grade: 'F3', name: 'Nisbah trigonometri',
    gen: (r) => {
      const [a, b, c] = r.pick(TRIPLES.slice(0, 5));
      const fn = r.pick(['sin', 'kos', 'tan'] as const);
      const ans = fn === 'sin' ? frs(a, c) : fn === 'kos' ? frs(b, c) : frs(a, b);
      const all = [frs(a, c), frs(b, c), frs(a, b), frs(b, a), frs(c, a)].filter((x) => x !== ans);
      return q(`Dalam segi tiga bersudut tegak, sisi bertentangan θ = ${a} cm, sisi bersebelahan θ = ${b} cm, hipotenus = ${c} cm. Cari ${fn} θ.`, ans, Array.from(new Set(all)).slice(0, 3), fn === 'sin' ? `sin θ = bertentangan ÷ hipotenus = ${frs(a, c)}` : fn === 'kos' ? `kos θ = bersebelahan ÷ hipotenus = ${frs(b, c)}` : `tan θ = bertentangan ÷ bersebelahan = ${frs(a, b)}`);
    },
  },
  {
    id: 'f3-bulatan', grade: 'F3', name: 'Sudut dan tangen bagi bulatan',
    gen: (r) => {
      const k = r.int(0, 2);
      if (k === 0) { const x = r.int(20, 80); return numq(`Sudut di lilitan yang dicangkum oleh lengkok AB ialah ${deg(x)}. Sudut di pusat yang dicangkum oleh lengkok yang sama ialah`, 2 * x, [x, x / 2, 180 - x], `Sudut di pusat = 2 × sudut di lilitan = ${deg(2 * x)}`, deg); }
      if (k === 1) { const x = r.int(50, 130); return numq(`Dalam sebuah sisi empat kitaran, satu sudut ialah ${deg(x)}. Sudut yang bertentangan dengannya ialah`, 180 - x, [x, 360 - x, 90 - (x % 90)], `Sudut bertentangan dalam sisi empat kitaran berjumlah 180°: ${deg(180 - x)}`, deg); }
      const x = r.int(20, 70);
      return numq(`Tangen kepada bulatan menyentuh bulatan di P. OP ialah jejari. Sudut antara tangen dan OP ialah`, 90, [180, x, 45], `Tangen sentiasa berserenjang dengan jejari di titik sentuhan: 90°`, deg);
    },
  },
  {
    id: 'f3-garislurus', grade: 'F3', name: 'Garis lurus',
    gen: (r) => {
      const m = r.pick([-3, -2, 2, 3, 4, 5]), c = r.int(-8, 8) || 6;
      const k = r.int(0, 2);
      if (k === 0) return numq(`Kecerunan garis y = ${lin(m, c)} ialah`, m, [c, -m, m * 2], `y = mx + c, jadi m = ${n(m)}`, n, { allowNeg: true });
      if (k === 1) return numq(`Pintasan-y bagi garis y = ${lin(m, c)} ialah`, c, [m, -c, c + m], `y = mx + c, jadi c = ${n(c)}`, n, { allowNeg: true });
      const xi = r.int(-4, 5) || 2, cc = -m * xi;
      return numq(`Pintasan-x bagi garis y = ${lin(m, cc)} ialah`, xi, [cc, -xi, m], `Apabila y = 0: ${lin(m, cc)} = 0, x = ${n(xi)}`, n, { allowNeg: true });
    },
  },
  {
    id: 'f3-lokus', grade: 'F3', name: 'Lokus dalam dua dimensi',
    gen: (r) => {
      const opts: [string, string][] = [
        ['sentiasa berjarak 3 cm dari titik tetap O', 'Bulatan berpusat O berjejari 3 cm'],
        ['sentiasa sama jarak dari dua titik tetap A dan B', 'Pembahagi dua sama serenjang bagi AB'],
        ['sentiasa sama jarak dari dua garis lurus yang bersilang', 'Pembahagi dua sama sudut antara dua garis itu'],
        ['sentiasa berjarak 2 cm dari sebatang garis lurus', 'Sepasang garis selari dengan garis itu'],
      ];
      const [desc, ans] = r.pick(opts);
      return q(`Lokus bagi titik yang ${desc} ialah`, ans, opts.filter((o) => o[1] !== ans).map((o) => o[1]), `Lokus itu ialah <b>${ans.toLowerCase()}</b>.`);
    },
  },

  // ------------------------------------------------------------ Tingkatan 4
  {
    id: 'f4-kuadratik', grade: 'F4', name: 'Persamaan kuadratik',
    gen: (r) => {
      let p = r.int(-6, 7), s = r.int(-6, 7);
      if (p === s) s = p + 1;
      if (p > s) [p, s] = [s, p];
      const B = -(p + s), C = p * s;
      const roots = (a: number, b: number) => `x = ${n(a)}, x = ${n(b)}`;
      return q(`Selesaikan: ${quad(B, C)} = 0`, roots(p, s), [roots(-s, -p), roots(p, -s), roots(p + 1, s + 1)].filter((x) => x !== roots(p, s)).concat(roots(p - 1, s), roots(p, s + 2)), `${quad(B, C)} = ${bin(-p)}${bin(-s)} = 0, jadi ${roots(p, s)}`);
    },
  },
  {
    id: 'f4-asas', grade: 'F4', name: 'Asas nombor',
    gen: (r) => {
      const sub = (s: string, b: number) => `${s}<sub>${b}</sub>`;
      if (r.chance(0.5)) {
        const base = r.pick([2, 2, 5, 8]);
        const v = r.int(5, base === 2 ? 31 : 120);
        const s = v.toString(base);
        return numq(`Tukar ${sub(s, base)} kepada nombor dalam asas sepuluh.`, v, [Number(s), v + base, v - 1], `Darab setiap digit dengan nilai tempatnya (kuasa ${base}). Jawapan ${v}.`, (x) => sub(String(x), 10));
      }
      const v = r.int(5, 31);
      const s = v.toString(2);
      return q(`Tukar ${sub(String(v), 10)} kepada nombor dalam asas dua.`, sub(s, 2), [sub((v + 1).toString(2), 2), sub(s.split('').reverse().join('') === s ? (v - 1).toString(2) : s.split('').reverse().join(''), 2), sub((v * 2).toString(2), 2)].filter((x) => x !== sub(s, 2)).concat(sub((v + 2).toString(2), 2)), `Bahagi dengan 2 berulang kali dan baca baki dari bawah: ${sub(s, 2)}`);
    },
  },
  {
    id: 'f4-logik', grade: 'F4', name: 'Penaakulan logik',
    gen: (r) => {
      const imps: [string, string, string, string][] = [
        ['x = 3', 'x² = 9', 'x ≠ 3', 'x² ≠ 9'],
        ['P ialah segi empat sama', 'P mempunyai empat sisi', 'P bukan segi empat sama', 'P tidak mempunyai empat sisi'],
        ['n ialah gandaan 4', 'n ialah nombor genap', 'n bukan gandaan 4', 'n bukan nombor genap'],
        ['hari ini hari Sabtu', 'esok hari Ahad', 'hari ini bukan hari Sabtu', 'esok bukan hari Ahad'],
      ];
      const [p, qq, np, nq] = r.pick(imps);
      const forms: [string, string][] = [
        ['akas', `Jika ${qq}, maka ${p}`],
        ['songsangan', `Jika ${np}, maka ${nq}`],
        ['kontrapositif', `Jika ${nq}, maka ${np}`],
      ];
      const [label, ans] = r.pick(forms);
      return q(`Implikasi: "Jika ${p}, maka ${qq}". Apakah <b>${label}</b> implikasi ini?`, ans, [...forms.filter((f) => f[1] !== ans).map((f) => f[1]), `Jika ${p}, maka ${qq}`], label === 'akas' ? 'Akas: tukar tempat antejadian dan akibat.' : label === 'songsangan' ? 'Songsangan: nafikan kedua-dua bahagian.' : 'Kontrapositif: tukar tempat dan nafikan kedua-duanya.');
    },
  },
  {
    id: 'f4-set', grade: 'F4', name: 'Operasi set',
    gen: (r) => {
      const both = r.int(1, 8), a = both + r.int(2, 12), b = both + r.int(2, 12);
      if (r.chance(0.5)) return numq(`Diberi n(A) = ${a}, n(B) = ${b} dan n(A ∩ B) = ${both}. Cari n(A ∪ B).`, a + b - both, [a + b, a + b - 2 * both, Math.max(a, b)], `n(A ∪ B) = ${a} + ${b} − ${both} = ${a + b - both}`);
      const U = a + b - both + r.int(2, 10);
      return numq(`Diberi n(ξ) = ${U}, n(A) = ${a}, n(B) = ${b} dan n(A ∩ B) = ${both}. Cari n((A ∪ B)').`, U - (a + b - both), [U - a - b, U - a, a + b - both], `n(A ∪ B) = ${a + b - both}, jadi n((A ∪ B)') = ${U} − ${a + b - both} = ${U - (a + b - both)}`);
    },
  },
  {
    id: 'f4-graf', grade: 'F4', name: 'Rangkaian dalam teori graf',
    gen: (r) => {
      if (r.chance(0.5)) {
        const e = r.int(4, 15);
        return numq(`Sebuah graf mudah mempunyai ${e} tepi. Hasil tambah darjah semua bucunya ialah`, 2 * e, [e, e + 2, e * e], `Hasil tambah darjah = 2 × bilangan tepi = 2 × ${e} = ${2 * e}`);
      }
      const v = r.int(4, 15);
      return numq(`Sebuah pokok mempunyai ${v} bucu. Bilangan tepinya ialah`, v - 1, [v, v + 1, 2 * v], `Pokok dengan v bucu mempunyai v − 1 tepi: ${v - 1}`);
    },
  },
  {
    id: 'f4-ketaksamaan2', grade: 'F4', name: 'Ketaksamaan linear dua pemboleh ubah',
    gen: (r) => {
      const m = r.int(1, 3), c = r.int(-2, 4);
      const above = r.chance(0.5);
      const pts: string[] = [];
      let good = '';
      const tried = new Set<string>();
      for (let guard = 0; (pts.length < 3 || !good) && guard < 200; guard++) {
        const x = r.int(-3, 4), y = r.int(-4, 9);
        const key = `${x},${y}`;
        if (tried.has(key)) continue;
        tried.add(key);
        const line = m * x + c;
        if (y === line) continue;
        const ok = above ? y > line : y < line;
        const label = `(${n(x)}, ${n(y)})`;
        if (ok && !good) good = label;
        else if (!ok && pts.length < 3) pts.push(label);
      }
      return q(`Titik manakah yang memuaskan ketaksamaan y ${above ? '>' : '<'} ${lin(m, c)}?`, good, pts, `Gantikan x ke dalam ${lin(m, c)} dan bandingkan dengan y. ${good} memuaskan ketaksamaan.`);
    },
  },
  {
    id: 'f4-gerakan', grade: 'F4', name: 'Graf gerakan',
    gen: (r) => {
      const k = r.int(0, 2);
      if (k === 0) { const v = r.int(2, 20), t = r.int(3, 10); return numq(`Dalam graf jarak-masa, objek bergerak ${v * t} m dalam ${t} s secara seragam. Lajunya ialah`, v, [v * t, t, v + t], `Laju = kecerunan = ${v * t} ÷ ${t} = ${v} m/s`, (x) => `${x} m/s`); }
      if (k === 1) { const v = r.int(5, 25), t = r.int(2, 10); return numq(`Dalam graf laju-masa, objek bergerak dengan laju malar ${v} m/s selama ${t} s. Jarak yang dilalui ialah`, v * t, [v + t, (v * t) / 2, v], `Jarak = luas di bawah graf = ${v} × ${t} = ${v * t} m`, (x) => `${x} m`); }
      const v = r.int(2, 12) * 2, t = r.int(2, 10);
      return numq(`Laju objek meningkat secara seragam daripada 0 kepada ${v} m/s dalam ${t} s. Jarak yang dilalui ialah`, (v * t) / 2, [v * t, (v * t) / 2 + t, v + t], `Jarak = luas segi tiga = ½ × ${t} × ${v} = ${(v * t) / 2} m`, (x) => `${n(x)} m`);
    },
  },
  {
    id: 'f4-serakan', grade: 'F4', name: 'Sukatan serakan data tak terkumpul',
    gen: (r) => {
      if (r.chance(0.5)) {
        const m = r.int(6, 20), d = r.int(1, 4);
        const vals = [m - 2 * d, m - d, m, m + d, m + 2 * d];
        return numq(`Cari varians bagi: ${vals.join(', ')}`, 2 * d * d, [4 * d, d * d, 2 * d * d + m], `Min = ${m}. Varians = Σ(x − min)² ÷ 5 = ${10 * d * d} ÷ 5 = ${2 * d * d}`, n, { step: 1 });
      }
      const vals = Array.from({ length: 6 }, () => r.int(5, 60));
      const range = Math.max(...vals) - Math.min(...vals);
      return numq(`Cari julat bagi: ${vals.join(', ')}`, range, [Math.max(...vals), range + 2, vals[vals.length - 1] - vals[0] === range ? range - 1 : Math.abs(vals[vals.length - 1] - vals[0])], `Julat = ${Math.max(...vals)} − ${Math.min(...vals)} = ${range}`);
    },
  },
  {
    id: 'f4-kebarangkalian', grade: 'F4', name: 'Kebarangkalian peristiwa bergabung',
    gen: (r) => {
      const [desc, a, b] = r.pick([
        ['Sekeping syiling dilambung dua kali. Kebarangkalian mendapat <b>dua kepala</b>', [1, 2], [1, 2]],
        ['Sebiji dadu dan sekeping syiling dilambung. Kebarangkalian mendapat <b>6 dan kepala</b>', [1, 6], [1, 2]],
        ['Sebiji dadu dilambung dua kali. Kebarangkalian mendapat <b>dua nombor genap</b>', [1, 2], [1, 2]],
        ['Sebiji dadu dilambung dua kali. Kebarangkalian mendapat <b>6 kedua-dua kali</b>', [1, 6], [1, 6]],
        ['Kebarangkalian hujan pada hari Isnin ialah ⅓ dan pada hari Selasa ialah ½ (tak bersandar). Kebarangkalian hujan <b>kedua-dua hari</b>', [1, 3], [1, 2]],
      ] as const);
      const num = a[0] * b[0], den = a[1] * b[1];
      return q(`${desc} ialah`, frs(num, den), [frs(a[0] * b[1] + b[0] * a[1], den), fr(1, a[1] + b[1]), frs(2, den)].filter((x) => x !== frs(num, den)).concat(frs(num, den * 2)), `Peristiwa tak bersandar: P(A ∩ B) = P(A) × P(B) = ${fr(a[0], a[1])} × ${fr(b[0], b[1])} = ${frs(num, den)}`);
    },
  },
  {
    id: 'f4-kewangan', grade: 'F4', name: 'Pengurusan kewangan',
    gen: (r) => {
      const inc = r.int(25, 60) * 100;
      if (r.chance(0.5)) {
        const fixed = r.int(8, 15) * 100, varr = r.int(5, 10) * 100;
        return numq(`Pendapatan bulanan ${r.pick(NAMES)} ialah ${rm(inc)}. Perbelanjaan tetap ${rm(fixed)} dan perbelanjaan tidak tetap ${rm(varr)}. Berapakah lebihan pendapatannya?`, inc - fixed - varr, [inc - fixed, fixed + varr, inc - varr], `Lebihan = ${rm(inc)} − ${rm(fixed)} − ${rm(varr)} = ${rm(inc - fixed - varr)}`, rm, { allowNeg: true });
      }
      const p = r.pick([10, 15, 20]);
      return numq(`${r.pick(NAMES)} menyimpan ${p}% daripada pendapatan ${rm(inc)} setiap bulan. Berapakah simpanannya dalam setahun?`, (inc * p * 12) / 100, [(inc * p) / 100, inc * 12, (inc * p * 10) / 100], `${p}% × ${rm(inc)} = ${rm((inc * p) / 100)} sebulan × 12 = ${rm((inc * p * 12) / 100)}`, rm);
    },
  },

  // ------------------------------------------------------------ Tingkatan 5
  {
    id: 'f5-ubahan', grade: 'F5', name: 'Ubahan',
    gen: (r) => {
      if (r.chance(0.5)) {
        const k = r.int(2, 9), x1 = r.int(2, 6), x2 = r.int(2, 10);
        return numq(`y berubah secara langsung dengan x. Diberi y = ${k * x1} apabila x = ${x1}. Cari y apabila x = ${x2}.`, k * x2, [k * x1 + x2, k + x2, k * x2 + k], `y = kx, k = ${k * x1} ÷ ${x1} = ${k}. y = ${k} × ${x2} = ${k * x2}`);
      }
      const x1 = r.int(2, 6), y1 = r.int(2, 6) * 2, kk = x1 * y1;
      const divs = [2, 3, 4, 6, 8, 12].filter((d) => kk % d === 0 && d !== x1);
      const x2 = r.pick(divs.length ? divs : [x1 * 2]);
      return numq(`y berubah secara songsang dengan x. Diberi y = ${y1} apabila x = ${x1}. Cari y apabila x = ${x2}.`, kk / x2, [y1 * x2, kk, kk / x2 + 1], `y = k/x, k = ${y1} × ${x1} = ${kk}. y = ${kk} ÷ ${x2} = ${n(kk / x2)}`);
    },
  },
  {
    id: 'f5-matriks', grade: 'F5', name: 'Matriks',
    gen: (r) => {
      const a = r.int(-3, 6), b = r.int(-3, 6), c = r.int(-3, 6), d = r.int(-3, 6);
      const k = r.int(0, 2);
      if (k === 0) return numq(`Cari penentu bagi matriks ${mat([[a, b], [c, d]])}`, a * d - b * c, [a * d + b * c, a * b - c * d, b * c - a * d], `ad − bc = (${n(a)})(${n(d)}) − (${n(b)})(${n(c)}) = ${n(a * d - b * c)}`, n, { allowNeg: true });
      const e = r.int(-2, 5), f = r.int(-2, 5), g = r.int(-2, 5), h = r.int(-2, 5);
      if (k === 1) return q(`${mat([[a, b], [c, d]])} + ${mat([[e, f], [g, h]])} = ?`, mat([[a + e, b + f], [c + g, d + h]]), [mat([[a - e, b - f], [c - g, d - h]]), mat([[a * e, b * f], [c * g, d * h]]), mat([[a + e, b + f], [c + g, d + h + 1]]), mat([[a + e + 1, b + f], [c + g, d + h]])].filter((x) => x !== mat([[a + e, b + f], [c + g, d + h]])), `Tambah unsur yang sepadan.`);
      const x = r.pick([-2, -1, 1, 2, 3, 4]), y = r.pick([-2, -1, 1, 2, 3, 4]);
      const ans = mat([[a * x + b * y], [c * x + d * y]]);
      return q(`${mat([[a, b], [c, d]])} ${mat([[x], [y]])} = ?`, ans, [mat([[a * x + c * y], [b * x + d * y]]), mat([[a * x, b * y], [c * x, d * y]]), mat([[a * x + b * y + 1], [c * x + d * y]]), mat([[a * x - b * y], [c * x - d * y]]), mat([[a * x + b * y], [c * x + d * y + 1]])].filter((v) => v !== ans), `Baris × lajur: (${n(a)})(${n(x)}) + (${n(b)})(${n(y)}) = ${n(a * x + b * y)}, (${n(c)})(${n(x)}) + (${n(d)})(${n(y)}) = ${n(c * x + d * y)}`);
    },
  },
  {
    id: 'f5-insurans', grade: 'F5', name: 'Insurans',
    gen: (r) => {
      if (r.chance(0.5)) {
        const ded = r.pick([200, 300, 500, 1000]), loss = r.int(2, 20) * 500;
        return numq(`Polisi insurans kereta ${r.pick(NAMES)} mempunyai deduktibel ${rm(ded)}. Kerugian yang dituntut ialah ${rm(loss)}. Bayaran pampasan syarikat insurans ialah`, loss - ded, [loss, loss + ded, ded], `Pampasan = kerugian − deduktibel = ${rm(loss)} − ${rm(ded)} = ${rm(loss - ded)}`, rm);
      }
      const loss = r.int(4, 20) * 1000, ded = r.pick([500, 1000]), p = r.pick([70, 80, 90]);
      const pay = ((loss - ded) * p) / 100;
      return numq(`Polisi insurans kesihatan dengan deduktibel ${rm(ded)} dan fasal ko-insurans ${p}/${100 - p}. Kos rawatan ${rm(loss)}. Berapakah bayaran syarikat insurans?`, pay, [(loss * p) / 100, loss - ded, ((loss - ded) * (100 - p)) / 100], `(${rm(loss)} − ${rm(ded)}) × ${p}% = ${rm(pay)}`, rm);
    },
  },
  {
    id: 'f5-cukai', grade: 'F5', name: 'Percukaian',
    gen: (r) => {
      const price = r.int(4, 40) * 25;
      const [kind, p] = r.pick([['cukai jualan', 10], ['cukai jualan', 5], ['cukai perkhidmatan', 6], ['cukai perkhidmatan', 8]] as const);
      if (r.chance(0.5)) return numq(`Harga sebelum cukai ialah ${rm(price)}. Kadar ${kind} ialah ${p}%. Berapakah ${kind} yang dikenakan?`, (price * p) / 100, [price + (price * p) / 100, (price * p) / 10, p], `${p}% × ${rm(price)} = ${rm2((price * p) / 100)}`, rm2);
      return numq(`Harga sebelum cukai ialah ${rm(price)}. Kadar ${kind} ialah ${p}%. Berapakah jumlah yang perlu dibayar?`, price + (price * p) / 100, [(price * p) / 100, price - (price * p) / 100, price + p], `${rm(price)} + ${p}% × ${rm(price)} = ${rm2(price + (price * p) / 100)}`, rm2);
    },
  },
  {
    id: 'f5-pembesaran', grade: 'F5', name: 'Kekongruenan, pembesaran dan transformasi',
    gen: (r) => {
      const k = r.int(2, 4);
      if (r.chance(0.5)) { const A = r.int(2, 12); return numq(`Sebuah objek berluas ${A} cm² dibesarkan dengan faktor skala ${k}. Luas imejnya ialah`, k * k * A, [k * A, A + k, k * k * A + A], `Luas imej = k² × luas objek = ${k}² × ${A} = ${k * k * A} cm²`, (x) => `${x} cm²`); }
      const L = r.int(1, 9) * k;
      return numq(`Sisi imej ialah ${L} cm selepas pembesaran dengan faktor skala ${k}. Panjang sisi objek ialah`, L / k, [L * k, L - k, L / k + 1], `Sisi objek = ${L} ÷ ${k} = ${L / k} cm`, (x) => `${n(x)} cm`);
    },
  },
  {
    id: 'f5-trigo', grade: 'F5', name: 'Graf fungsi trigonometri',
    gen: (r) => {
      const half = fr(1, 2);
      const facts: [string, string, string[]][] = [
        ['sin 30°', half, ['1', '0', fr(1, 3)]],
        ['kos 60°', half, ['1', '0', `${fr(1, 3)}`]],
        ['tan 45°', '1', [half, '0', '2']],
        ['sin 90°', '1', ['0', half, '−1']],
        ['kos 180°', '−1', ['1', '0', half]],
        ['sin 270°', '−1', ['1', '0', half]],
        ['kos 90°', '0', ['1', '−1', half]],
      ];
      if (r.chance(0.6)) {
        const [expr, ans, wrong] = r.pick(facts);
        return q(`Nilai ${expr} ialah`, ans, wrong, `${expr} = ${ans}`);
      }
      const a = r.int(2, 5), b = r.pick([1, 2, 3]);
      if (r.chance(0.5)) return numq(`Amplitud bagi graf y = ${a} sin ${b === 1 ? '' : b}x ialah`, a, [b, a * b, 360 / b], `y = a sin bx: amplitud = |a| = ${a}`);
      return numq(`Kala bagi graf y = ${a} kos ${b === 1 ? '' : b}x ialah`, 360 / b, [180 / b, 360 * b, a], `Kala = 360° ÷ b = 360° ÷ ${b} = ${deg(360 / b)}`, deg);
    },
  },
  {
    id: 'f5-dataterkumpul', grade: 'F5', name: 'Sukatan serakan data terkumpul',
    gen: (r) => {
      const w = r.pick([5, 10]), lo = r.int(1, 8) * w;
      const hi = lo + w - 1;
      if (r.chance(0.5)) return numq(`Titik tengah bagi selang kelas ${lo} – ${hi} ialah`, (lo + hi) / 2, [(lo + hi + 1) / 2, lo + w, hi], `(${lo} + ${hi}) ÷ 2 = ${n((lo + hi) / 2)}`, n, { step: 0.5 });
      return numq(`Saiz selang kelas bagi ${lo} – ${hi} ialah`, w, [w - 1, hi - lo, w + 1], `Sempadan atas − sempadan bawah = ${n(hi + 0.5)} − ${n(lo - 0.5)} = ${w}`);
    },
  },
];
