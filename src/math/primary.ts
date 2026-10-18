// KSSR Matematik — Tahun 1 hingga Tahun 6.
import { Topic, q, numq, n, rm, rm2, fr, frs, mixed, gcd } from './core';

const EMOJI = ['🍎', '⭐', '🐟', '🌸', '🍌', '⚽', '🐥', '🍬'];
const DAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];
const MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
const NAMES = ['Ali', 'Aina', 'Mei Ling', 'Kumar', 'Siti', 'Danial', 'Priya', 'Hakim', 'Nurul', 'Wei Jie'];

function pad2(x: number): string {
  return String(x).padStart(2, '0');
}

/** 12-hour clock label with Malay period of day. */
function clock12(totalMin: number): string {
  const h24 = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  const period = h24 < 12 ? 'pagi' : h24 < 14 ? 'tengah hari' : h24 < 19 ? 'petang' : 'malam';
  return `${h}:${pad2(m)} ${period}`;
}

function duration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} minit`;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} minit`;
}

export const PRIMARY: Topic[] = [
  // ------------------------------------------------------------ Tahun 1
  {
    id: 't1-kira', grade: 'T1', name: 'Mengira objek',
    gen: (r) => {
      const c = r.int(3, 15);
      const e = r.pick(EMOJI);
      return numq(`Berapakah bilangan ${e}?<div class="emoji-row">${e.repeat(c)}</div>`, c, [c + 1, c - 1, c + 2], `Kira satu per satu: ada ${c} ${e}.`);
    },
  },
  {
    id: 't1-nombor', grade: 'T1', name: 'Nombor hingga 100',
    gen: (r) => {
      const x = r.int(11, 98);
      const kind = r.int(0, 2);
      if (kind === 0) return numq(`Nombor <b>selepas</b> ${x} ialah`, x + 1, [x - 1, x + 2, x + 10], `Selepas ${x} ialah ${x + 1} (tambah 1).`);
      if (kind === 1) return numq(`Nombor <b>sebelum</b> ${x} ialah`, x - 1, [x + 1, x - 2, x - 10], `Sebelum ${x} ialah ${x - 1} (tolak 1).`);
      return numq(`Nombor di antara ${x - 1} dan ${x + 1} ialah`, x, [x + 2, x - 2, x + 10], `${x - 1}, <b>${x}</b>, ${x + 1}`);
    },
  },
  {
    id: 't1-tambah', grade: 'T1', name: 'Tambah dalam lingkungan 100',
    gen: (r) => {
      const a = r.int(2, 60);
      const b = r.int(1, Math.min(39, 100 - a));
      return numq(`${a} + ${b} = ?`, a + b, [a + b + 10, a + b - 1, a + b + 1, Math.abs(a - b)], `${a} + ${b} = ${a + b}`);
    },
  },
  {
    id: 't1-tolak', grade: 'T1', name: 'Tolak dalam lingkungan 100',
    gen: (r) => {
      const a = r.int(10, 99);
      const b = r.int(1, a - 1);
      return numq(`${a} − ${b} = ?`, a - b, [a + b, a - b + 10, a - b - 1, a - b + 1], `${a} − ${b} = ${a - b}`);
    },
  },
  {
    id: 't1-banding', grade: 'T1', name: 'Banding nombor',
    gen: (r) => {
      const nums = r.sample(Array.from({ length: 90 }, (_, i) => i + 10), 4);
      const big = r.chance(0.5);
      const ans = big ? Math.max(...nums) : Math.min(...nums);
      return q(`Nombor manakah paling <b>${big ? 'besar' : 'kecil'}</b>?`, n(ans), nums.filter((x) => x !== ans).map(n), `Bandingkan digit puluh dahulu. Jawapan: ${ans}.`);
    },
  },
  {
    id: 't1-wang', grade: 'T1', name: 'Wang hingga RM10',
    gen: (r) => {
      if (r.chance(0.5)) {
        const a = r.int(1, 5);
        const b = r.int(1, 10 - a);
        return numq(`${rm(a)} + ${rm(b)} = ?`, a + b, [a + b + 1, a + b - 1, a + b + 2], `${a} + ${b} = ${a + b}, jadi ${rm(a + b)}.`, rm);
      }
      const a = r.pick([10, 20, 30, 40, 50]);
      const b = r.pick([10, 20, 30, 40, 50]);
      return numq(`${a} sen + ${b} sen = ?`, a + b, [a + b + 10, a + b - 10, a + b + 5], `${a} + ${b} = ${a + b} sen.`, (x) => `${x} sen`);
    },
  },
  {
    id: 't1-pecahan', grade: 'T1', name: 'Separuh dan suku',
    gen: (r) => {
      if (r.chance(0.5)) {
        const x = r.int(1, 10) * 2;
        return numq(`<b>Separuh</b> daripada ${x} ialah`, x / 2, [x, x / 2 + 1, x * 2, x / 2 - 1], `Separuh bermaksud bahagi 2: ${x} ÷ 2 = ${x / 2}.`);
      }
      const x = r.int(1, 5) * 4;
      return numq(`<b>Suku</b> daripada ${x} ialah`, x / 4, [x / 2, x / 4 + 1, x, x / 4 + 2], `Suku bermaksud bahagi 4: ${x} ÷ 4 = ${x / 4}.`);
    },
  },
  {
    id: 't1-bentuk', grade: 'T1', name: 'Bentuk 2D dan 3D',
    gen: (r) => {
      const twoD = [
        ['mempunyai 3 sisi', 'Segi tiga'],
        ['mempunyai 4 sisi yang sama panjang', 'Segi empat sama'],
        ['bulat dan tiada bucu', 'Bulatan'],
        ['mempunyai 2 sisi panjang dan 2 sisi pendek', 'Segi empat tepat'],
      ];
      const threeD = [
        ['seperti bola', 'Sfera'],
        ['seperti tin minuman', 'Silinder'],
        ['seperti kotak kasut', 'Kuboid'],
        ['seperti dadu', 'Kubus'],
        ['seperti kon aiskrim', 'Kon'],
      ];
      const set = r.chance(0.5) ? twoD : threeD;
      const [desc, ans] = r.pick(set);
      const wrong = set.filter((s) => s[1] !== ans).map((s) => s[1]);
      return q(`Bentuk yang ${desc} ialah`, ans, r.sample(wrong, 3), `Bentuk yang ${desc} ialah <b>${ans}</b>.`);
    },
  },
  {
    id: 't1-hari', grade: 'T1', name: 'Hari dan bulan',
    gen: (r) => {
      if (r.chance(0.5)) {
        const i = r.int(0, 6);
        const ans = DAYS[(i + 1) % 7];
        return q(`Hari selepas <b>${DAYS[i]}</b> ialah`, ans, r.sample(DAYS.filter((d) => d !== ans && d !== DAYS[i]), 3), `${DAYS[i]} → ${ans}`);
      }
      const i = r.int(0, 11);
      const ans = MONTHS[(i + 1) % 12];
      return q(`Bulan selepas <b>${MONTHS[i]}</b> ialah`, ans, r.sample(MONTHS.filter((m) => m !== ans && m !== MONTHS[i]), 3), `${MONTHS[i]} → ${ans}`);
    },
  },

  // ------------------------------------------------------------ Tahun 2
  {
    id: 't2-nilaitempat', grade: 'T2', name: 'Nilai tempat hingga 1000',
    gen: (r) => {
      const h = r.int(1, 9), t = r.int(0, 9), o = r.int(0, 9);
      const x = h * 100 + t * 10 + o;
      return numq(`Nilai digit <b>${h}</b> dalam ${x} ialah`, h * 100, [h, h * 10, h * 1000], `${h} berada di tempat ratus, jadi nilainya ${h * 100}.`);
    },
  },
  {
    id: 't2-tambahtolak', grade: 'T2', name: 'Tambah dan tolak hingga 1000',
    gen: (r) => {
      if (r.chance(0.5)) {
        const a = r.int(100, 600), b = r.int(10, 999 - a);
        return numq(`${a} + ${b} = ?`, a + b, [a + b + 10, a + b - 10, a + b + 100, a + b - 1], `${a} + ${b} = ${a + b}`);
      }
      const a = r.int(200, 999), b = r.int(10, a - 50);
      return numq(`${a} − ${b} = ?`, a - b, [a - b + 10, a - b - 10, a - b + 100, a - b + 1], `${a} − ${b} = ${a - b}`);
    },
  },
  {
    id: 't2-darab', grade: 'T2', name: 'Darab (sifir 2, 3, 4, 5, 10)',
    gen: (r) => {
      const a = r.pick([2, 3, 4, 5, 10]), b = r.int(1, 10);
      return numq(`${a} × ${b} = ?`, a * b, [a * (b + 1), a * (b - 1), a + b, a * b + 1], `Sifir ${a}: ${a} × ${b} = ${a * b}`);
    },
  },
  {
    id: 't2-bahagi', grade: 'T2', name: 'Bahagi (sifir 2, 3, 4, 5, 10)',
    gen: (r) => {
      const a = r.pick([2, 3, 4, 5, 10]), b = r.int(1, 10);
      return numq(`${a * b} ÷ ${a} = ?`, b, [b + 1, b - 1, a * b - a, b + 2], `Kerana ${a} × ${b} = ${a * b}, maka ${a * b} ÷ ${a} = ${b}.`);
    },
  },
  {
    id: 't2-wang', grade: 'T2', name: 'Wang hingga RM100',
    gen: (r) => {
      const who = r.pick(NAMES);
      const have = r.pick([20, 50, 100]);
      const cost = r.int(3, have - 2);
      return numq(`${who} ada ${rm(have)}. Dia membeli sebuah buku berharga ${rm(cost)}. Berapakah baki wangnya?`, have - cost, [have + cost, have - cost + 10, have - cost - 1, cost], `${rm(have)} − ${rm(cost)} = ${rm(have - cost)}`, rm);
    },
  },
  {
    id: 't2-masa', grade: 'T2', name: 'Masa dan waktu',
    gen: (r) => {
      const k = r.int(0, 2);
      if (k === 0) {
        const h = r.int(1, 5);
        return numq(`${h} jam = ? minit`, h * 60, [h * 100, h * 30, h * 60 + 10, h * 24], `1 jam = 60 minit, jadi ${h} × 60 = ${h * 60} minit.`);
      }
      if (k === 1) {
        const d = r.int(1, 3);
        return numq(`${d} hari = ? jam`, d * 24, [d * 12, d * 60, d * 7, d * 24 + 1], `1 hari = 24 jam, jadi ${d} × 24 = ${d * 24} jam.`);
      }
      const start = r.int(1, 8), add = r.int(1, 3);
      return q(`Sekarang pukul ${start}:00. Apakah waktu ${add} jam kemudian?`, `${start + add}:00`, [`${start + add + 1}:00`, `${start + add - 1 || 12}:30`, `${start}:${pad2(add * 10)}`], `${start} + ${add} = ${start + add}, jadi ${start + add}:00.`);
    },
  },
  {
    id: 't2-ukuran', grade: 'T2', name: 'Panjang, jisim dan isi padu cecair',
    gen: (r) => {
      const x = r.int(1, 9);
      const k = r.int(0, 2);
      if (k === 0) return numq(`${x} m = ? cm`, x * 100, [x * 10, x * 1000, x], `1 m = 100 cm, jadi ${x} m = ${x * 100} cm.`);
      if (k === 1) return numq(`${x} kg = ? g`, x * 1000, [x * 100, x * 10, x * 10000], `1 kg = 1 000 g, jadi ${x} kg = ${n(x * 1000)} g.`);
      return numq(`${x} ℓ = ? mℓ`, x * 1000, [x * 100, x * 10, x * 10000], `1 ℓ = 1 000 mℓ, jadi ${x} ℓ = ${n(x * 1000)} mℓ.`);
    },
  },
  {
    id: 't2-pecahan', grade: 'T2', name: 'Pecahan',
    gen: (r) => {
      const d = r.int(3, 10), a = r.int(1, d - 1);
      const wrong = [fr(d, a), fr(d - a, d), fr(a, d + 1), fr(a + 1, d)].filter((w) => w !== fr(a, d));
      return q(`Sebiji kek dipotong kepada <b>${d}</b> bahagian sama besar. ${r.pick(NAMES)} makan <b>${a}</b> bahagian. Pecahan kek yang dimakan ialah`, fr(a, d), wrong, `${a} daripada ${d} bahagian = ${fr(a, d)}`);
    },
  },

  // ------------------------------------------------------------ Tahun 3
  {
    id: 't3-bundar', grade: 'T3', name: 'Bundar nombor hingga 10 000',
    gen: (r) => {
      const x = r.int(1001, 9999);
      const [place, p] = r.pick([['puluh', 10], ['ratus', 100], ['ribu', 1000]] as const);
      const ans = Math.round(x / p) * p;
      const floor = Math.floor(x / p) * p;
      const other = ans === floor ? floor + p : floor;
      return numq(`Bundarkan ${n(x)} kepada <b>${place}</b> terdekat.`, ans, [other, ans === floor ? floor - p : ans + p, x], `Lihat digit di sebelah kanan tempat ${place}: 5 ke atas bundar naik, bawah 5 kekal. Jawapan ${n(ans)}.`, n, { step: p });
    },
  },
  {
    id: 't3-darab', grade: 'T3', name: 'Darab (sifir 6, 7, 8, 9)',
    gen: (r) => {
      const a = r.int(6, 9), b = r.int(2, 10);
      return numq(`${a} × ${b} = ?`, a * b, [a * (b + 1), a * (b - 1), (a + 1) * b, a * b + 2], `Sifir ${a}: ${a} × ${b} = ${a * b}`);
    },
  },
  {
    id: 't3-bahagi', grade: 'T3', name: 'Bahagi (sifir 6, 7, 8, 9)',
    gen: (r) => {
      const a = r.int(6, 9), b = r.int(2, 10);
      return numq(`${a * b} ÷ ${a} = ?`, b, [b + 1, b - 1, b + 2, a], `${a} × ${b} = ${a * b}, maka ${a * b} ÷ ${a} = ${b}.`);
    },
  },
  {
    id: 't3-setara', grade: 'T3', name: 'Pecahan setara',
    gen: (r) => {
      const d = r.pick([2, 3, 4, 5]), a = r.int(1, d - 1), k = r.int(2, 4);
      return numq(`${fr(a, d)} = <span class="fr"><span>?</span><span>${d * k}</span></span>`, a * k, [a + k, a * k + 1, d * k - a, a], `Darab pengangka dan penyebut dengan ${k}: ${a} × ${k} = ${a * k}.`);
    },
  },
  {
    id: 't3-perpuluhan', grade: 'T3', name: 'Perpuluhan',
    gen: (r) => {
      if (r.chance(0.5)) {
        const a = r.int(1, 9);
        return numq(`${fr(a, 10)} dalam bentuk perpuluhan ialah`, a / 10, [a / 100, a, a + 0.1], `${fr(a, 10)} = ${a} persepuluh = ${n(a / 10)}`, n, { step: 0.1 });
      }
      const a = r.int(1, 6), b = r.int(1, 9 - a);
      return numq(`${n(a / 10)} + ${n(b / 10)} = ?`, (a + b) / 10, [(a + b) / 100, a + b, (a + b + 1) / 10], `${a} persepuluh + ${b} persepuluh = ${a + b} persepuluh = ${n((a + b) / 10)}`, n, { step: 0.1 });
    },
  },
  {
    id: 't3-peratus', grade: 'T3', name: 'Peratus',
    gen: (r) => {
      const a = r.int(1, 99);
      if (r.chance(0.5)) return numq(`${fr(a, 100)} = ?%`, a, [100 - a, a * 10, a + 10], `Perseratus bermaksud peratus: ${fr(a, 100)} = ${a}%.`, (x) => `${x}%`);
      return q(`${a}% dalam bentuk pecahan ialah`, fr(a, 100), [fr(a, 10), fr(100, a), fr(100 - a, 100), fr(a, 1000)], `${a}% = ${a} per seratus = ${fr(a, 100)}`);
    },
  },
  {
    id: 't3-wang', grade: 'T3', name: 'Wang hingga RM1000',
    gen: (r) => {
      const a = r.int(100, 600) + r.pick([0, 0.5, 0.2, 0.8]);
      const b = r.int(10, 300) + r.pick([0, 0.3, 0.5]);
      if (r.chance(0.5)) return numq(`${rm2(a)} + ${rm2(b)} = ?`, a + b, [a + b + 1, a + b - 1, a + b + 10, a + b + 0.1], `Tambah ringgit dengan ringgit, sen dengan sen: ${rm2(a + b)}`, rm2);
      return numq(`${rm2(a + b)} − ${rm2(b)} = ?`, a, [a + 1, a - 1, a + 10, a + 0.1], `${rm2(a + b)} − ${rm2(b)} = ${rm2(a)}`, rm2);
    },
  },
  {
    id: 't3-24jam', grade: 'T3', name: 'Sistem 24 jam',
    gen: (r) => {
      const h = r.int(1, 11), m = r.pick([0, 15, 30, 45]);
      const pm = r.chance(0.6);
      const h24 = pm ? h + 12 : h;
      const label = `${h}:${pad2(m)} ${pm ? (h24 < 19 ? 'petang' : 'malam') : 'pagi'}`;
      const ans = `${pad2(h24)}${pad2(m)}`;
      return q(`${label} dalam sistem 24 jam ialah`, `${ans} jam`, [`${pad2(pm ? h : h + 12)}${pad2(m)} jam`, `${pad2(h24)}${pad2((m + 30) % 60)} jam`, `${pad2((h24 + 1) % 24)}${pad2(m)} jam`], pm ? `Waktu petang/malam: tambah 12 pada jam. ${h} + 12 = ${h24}.` : `Waktu pagi: jam kekal. ${ans} jam.`);
    },
  },

  // ------------------------------------------------------------ Tahun 4
  {
    id: 't4-bundar', grade: 'T4', name: 'Nombor hingga 100 000',
    gen: (r) => {
      const x = r.int(10001, 99999);
      const [place, p] = r.pick([['ribu', 1000], ['puluh ribu', 10000]] as const);
      const ans = Math.round(x / p) * p;
      return numq(`Bundarkan ${n(x)} kepada <b>${place}</b> terdekat.`, ans, [ans + p, ans - p, Math.round(x / (p / 10)) * (p / 10)], `Lihat digit di kanan tempat ${place}. Jawapan ${n(ans)}.`, n, { step: p });
    },
  },
  {
    id: 't4-darab', grade: 'T4', name: 'Darab hingga 3 digit',
    gen: (r) => {
      const a = r.int(102, 499), b = r.chance(0.5) ? r.int(3, 9) : r.int(11, 25);
      return numq(`${a} × ${b} = ?`, a * b, [a * b + 10, a * b - 10, a * b + 100, a * (b + 1)], `${a} × ${b} = ${n(a * b)}`);
    },
  },
  {
    id: 't4-bahagi', grade: 'T4', name: 'Bahagi panjang',
    gen: (r) => {
      const d = r.int(3, 9), ans = r.int(102, 999);
      return numq(`${n(d * ans)} ÷ ${d} = ?`, ans, [ans + 10, ans - 10, ans + 1, ans + 100], `Semak: ${ans} × ${d} = ${n(d * ans)}`);
    },
  },
  {
    id: 't4-pecahan', grade: 'T4', name: 'Tambah dan tolak pecahan',
    gen: (r) => {
      const d = r.pick([4, 5, 6, 8, 9, 10, 12]);
      const a = r.int(1, d - 2), b = r.int(1, d - 1 - a);
      if (r.chance(0.5)) {
        return q(`${fr(a, d)} + ${fr(b, d)} = ?`, frs(a + b, d), [fr(a + b, d + d), frs(a + b + 1, d), fr(a * b, d), fr(a + b, d - 1)].filter((w) => w !== frs(a + b, d)), `Penyebut sama, tambah pengangka: ${fr(a + b, d)}${gcd(a + b, d) > 1 ? ' = ' + frs(a + b, d) : ''}`);
      }
      const big = a + b;
      return q(`${fr(big, d)} − ${fr(b, d)} = ?`, frs(a, d), [fr(a, d * 2), frs(a + 1, d), fr(big + b, d)].filter((w) => w !== frs(a, d)), `Penyebut sama, tolak pengangka: ${fr(a, d)}${gcd(a, d) > 1 ? ' = ' + frs(a, d) : ''}`);
    },
  },
  {
    id: 't4-perpuluhan', grade: 'T4', name: 'Darab dan bahagi perpuluhan dengan 10, 100',
    gen: (r) => {
      const x = r.int(101, 999) / 100;
      const [op, k] = r.pick([['×', 10], ['×', 100], ['÷', 10]] as const);
      const ans = op === '×' ? x * k : x / k;
      return numq(`${n(x)} ${op} ${k} = ?`, ans, [op === '×' ? x * k * 10 : x / k / 10, op === '×' ? x * k / 10 : x / k * 10, x], `${op === '×' ? 'Darab' : 'Bahagi'} ${k}: titik perpuluhan bergerak ${k === 10 ? 1 : 2} tempat ke ${op === '×' ? 'kanan' : 'kiri'}. Jawapan ${n(ans)}.`, n, { step: 0.1 });
    },
  },
  {
    id: 't4-perimeter', grade: 'T4', name: 'Perimeter',
    gen: (r) => {
      const l = r.int(4, 20), w = r.int(2, l - 1);
      return numq(`Sebuah segi empat tepat berukuran ${l} cm × ${w} cm. Berapakah perimeternya?`, 2 * (l + w), [l * w, l + w, 2 * l + w], `Perimeter = ${l} + ${w} + ${l} + ${w} = ${2 * (l + w)} cm`, (x) => `${x} cm`);
    },
  },
  {
    id: 't4-luas', grade: 'T4', name: 'Luas',
    gen: (r) => {
      const l = r.int(3, 15), w = r.int(2, 12);
      return numq(`Luas segi empat tepat ${l} cm × ${w} cm ialah`, l * w, [2 * (l + w), l + w, l * w + l], `Luas = panjang × lebar = ${l} × ${w} = ${l * w} cm²`, (x) => `${x} cm²`);
    },
  },
  {
    id: 't4-nisbah', grade: 'T4', name: 'Nisbah',
    gen: (r) => {
      const a = r.int(1, 9);
      const b = r.pick([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((v) => v !== a));
      const [x, y] = r.pick([['guli merah', 'guli biru'], ['kucing', 'arnab'], ['murid lelaki', 'murid perempuan']] as const);
      return q(`Ada <b>${a}</b> ${x} dan <b>${b}</b> ${y}. Nisbah ${x} kepada ${y} ialah`, `${a} : ${b}`, [`${b} : ${a}`, `${a} : ${a + b}`, `${b} : ${a + b}`, `${a + b} : ${a}`].filter((w) => w !== `${a} : ${b}`), `${x} dahulu, kemudian ${y}: ${a} : ${b}`);
    },
  },

  // ------------------------------------------------------------ Tahun 5
  {
    id: 't5-nilaidigit', grade: 'T5', name: 'Nombor hingga 1 000 000',
    gen: (r) => {
      const x = r.int(100000, 999999);
      const s = String(x);
      const pos = r.int(0, 3);
      const digit = Number(s[pos]);
      if (digit === 0) return numq(`Bundarkan ${n(x)} kepada ratus ribu terdekat.`, Math.round(x / 100000) * 100000, [Math.round(x / 10000) * 10000, x, Math.round(x / 100000) * 100000 + 100000], `Lihat digit puluh ribu. Jawapan ${n(Math.round(x / 100000) * 100000)}.`, n, { step: 100000 });
      const value = digit * 10 ** (5 - pos);
      return numq(`Nilai digit <b>${digit}</b> yang bergaris dalam ${s.slice(0, pos)}<u>${digit}</u>${s.slice(pos + 1)} ialah`, value, [value / 10, value * 10, digit], `Digit itu di tempat ${['ratus ribu', 'puluh ribu', 'ribu', 'ratus'][pos]}. Nilainya ${n(value)}.`);
    },
  },
  {
    id: 't5-pecahan-kuantiti', grade: 'T5', name: 'Pecahan daripada kuantiti',
    gen: (r) => {
      const d = r.pick([2, 3, 4, 5, 6, 8]), k = r.int(2, 9);
      const a = r.pick(Array.from({ length: d - 1 }, (_, i) => i + 1).filter((i) => gcd(i, d) === 1));
      const total = d * k;
      return numq(`${fr(a, d)} daripada ${total} ialah`, a * k, [k, total - a * k, a * k + d], `${total} ÷ ${d} = ${k}, kemudian ${k} × ${a} = ${a * k}`);
    },
  },
  {
    id: 't5-bercampur', grade: 'T5', name: 'Nombor bercampur',
    gen: (r) => {
      const d = r.pick([3, 4, 5, 6, 8]), w = r.int(1, 4);
      const a = r.pick(Array.from({ length: d - 1 }, (_, i) => i + 1).filter((i) => gcd(i, d) === 1));
      const top = w * d + a;
      if (r.chance(0.5)) return q(`${fr(top, d)} dalam bentuk nombor bercampur ialah`, mixed(top, d), [`${w + 1}${fr(a, d)}`, `${w}${fr(d - a, d)}`, `${a}${fr(w, d)}`, `${w}${fr(a, d + 1)}`].filter((x) => x !== mixed(top, d)), `${top} ÷ ${d} = ${w} baki ${a}, jadi ${mixed(top, d)}`);
      return q(`${w}${fr(a, d)} dalam bentuk pecahan tak wajar ialah`, fr(top, d), [fr(w * a + d, d), fr(w + a, d), fr(top + d, d), fr(top - 1, d), fr(top, d + 1)].filter((x) => x !== fr(top, d)), `${w} × ${d} + ${a} = ${top}, jadi ${fr(top, d)}`);
    },
  },
  {
    id: 't5-perpuluhan', grade: 'T5', name: 'Darab dan bahagi perpuluhan',
    gen: (r) => {
      if (r.chance(0.5)) {
        const a = r.int(11, 99) / 10, b = r.int(2, 9);
        return numq(`${n(a)} × ${b} = ?`, a * b, [a * b * 10, a * b / 10, a * b + 1], `${n(a)} × ${b} = ${n(a * b)}`, n, { step: 0.1 });
      }
      const b = r.int(2, 9), ans = r.int(11, 99) / 10;
      return numq(`${n(ans * b)} ÷ ${b} = ?`, ans, [ans * 10, ans / 10, ans + 1], `Semak: ${n(ans)} × ${b} = ${n(ans * b)}`, n, { step: 0.1 });
    },
  },
  {
    id: 't5-peratus', grade: 'T5', name: 'Peratus daripada kuantiti',
    gen: (r) => {
      const p = r.pick([10, 20, 25, 50, 75, 5, 30, 40]);
      const base = r.pick([40, 60, 80, 120, 200, 240, 400]);
      const ans = (p * base) / 100;
      return numq(`${p}% daripada ${base} ialah`, ans, [base - ans, p, ans * 2, ans + 10], `${fr(p, 100)} × ${base} = ${n(ans)}`);
    },
  },
  {
    id: 't5-isipadu', grade: 'T5', name: 'Isi padu kuboid',
    gen: (r) => {
      const l = r.int(2, 12), w = r.int(2, 8), h = r.int(2, 10);
      return numq(`Isi padu kuboid ${l} cm × ${w} cm × ${h} cm ialah`, l * w * h, [l + w + h, l * w, 2 * (l * w + w * h + l * h)], `Isi padu = ${l} × ${w} × ${h} = ${n(l * w * h)} cm³`, (x) => `${n(x)} cm³`);
    },
  },
  {
    id: 't5-purata', grade: 'T5', name: 'Purata',
    gen: (r) => {
      const k = r.int(3, 5), avg = r.int(17, 45);
      // Offsets that sum to zero keep the mean a whole number.
      const off = Array.from({ length: k - 1 }, () => r.int(-4, 4));
      off.push(-off.reduce((s, v) => s + v, 0));
      const vals = off.map((o) => avg + o);
      const total = avg * k;
      return numq(`Cari purata bagi: ${vals.join(', ')}`, avg, [total, avg + 1, avg - 1, Math.max(...vals)], `Jumlah = ${total}, bilangan = ${k}. Purata = ${total} ÷ ${k} = ${avg}`);
    },
  },
  {
    id: 't5-tempoh', grade: 'T5', name: 'Tempoh masa',
    gen: (r) => {
      const start = r.int(7, 15) * 60 + r.pick([0, 10, 15, 20, 30, 40, 45]);
      const dur = r.int(0, 2) * 60 + r.pick([15, 20, 25, 35, 40, 50]);
      const end = start + dur;
      return q(`Satu aktiviti bermula pukul ${clock12(start)} dan tamat pukul ${clock12(end)}. Berapa lamakah aktiviti itu?`, duration(dur), [duration(dur + 60), duration(Math.abs(dur - 10)), duration(dur + 15)].filter((x) => x !== duration(dur)), `Kira dari ${clock12(start)} hingga ${clock12(end)}: ${duration(dur)}.`);
    },
  },

  // ------------------------------------------------------------ Tahun 6
  {
    id: 't6-perdana', grade: 'T6', name: 'Nombor perdana',
    gen: (r) => {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
      const composite = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 77, 81, 85, 87, 91, 93, 95];
      const p = r.pick(primes);
      return q(`Yang manakah <b>nombor perdana</b>?`, n(p), r.sample(composite, 3).map(n), `${p} hanya boleh dibahagi dengan 1 dan dirinya sendiri.`);
    },
  },
  {
    id: 't6-bahagipecahan', grade: 'T6', name: 'Bahagi pecahan',
    gen: (r) => {
      if (r.chance(0.5)) {
        const d = r.pick([2, 3, 4, 5]), a = r.int(1, d - 1), k = r.int(2, 4);
        return q(`${fr(a, d)} ÷ ${k} = ?`, frs(a, d * k), [frs(a * k, d), frs(a, d + k), frs(k, a * d), frs(a + 1, d * k), frs(a + k, d * k)].filter((x) => x !== frs(a, d * k)), `${fr(a, d)} ÷ ${k} = ${fr(a, d)} × ${fr(1, k)} = ${frs(a, d * k)}`);
      }
      const w = r.int(2, 9), d = r.pick([2, 3, 4, 5]);
      return numq(`${w} ÷ ${fr(1, d)} = ?`, w * d, [w + d, w, w * d + d], `Bahagi dengan ${fr(1, d)} sama dengan darab ${d}: ${w} × ${d} = ${w * d}`);
    },
  },
  {
    id: 't6-untung', grade: 'T6', name: 'Untung dan rugi',
    gen: (r) => {
      const cost = r.int(4, 20) * 10;
      const p = r.pick([10, 20, 25, 30, 50]);
      if (r.chance(0.5)) {
        const sell = cost + (cost * p) / 100;
        return numq(`Harga kos sebuah beg ialah ${rm(cost)}. Beg itu dijual dengan harga ${rm(sell)}. Berapakah untungnya?`, sell - cost, [sell, sell + cost, (sell - cost) / 2], `Untung = harga jual − harga kos = ${rm(sell)} − ${rm(cost)} = ${rm(sell - cost)}`, rm);
      }
      const profit = (cost * p) / 100;
      return numq(`Harga kos ${rm(cost)}, untung ${rm(profit)}. Peratus untung ialah`, p, [profit, p + 10, 100 - p], `${fr(profit, cost)} × 100% = ${p}%`, (x) => `${n(x)}%`);
    },
  },
  {
    id: 't6-diskaun', grade: 'T6', name: 'Diskaun',
    gen: (r) => {
      const price = r.int(4, 30) * 10, p = r.pick([10, 20, 25, 50]);
      const disc = (price * p) / 100;
      return numq(`Harga asal kasut ${rm(price)}. Diskaun ${p}%. Berapakah harga selepas diskaun?`, price - disc, [disc, price + disc, price - p], `Diskaun = ${p}% × ${rm(price)} = ${rm(disc)}. Harga baru = ${rm(price - disc)}`, rm);
    },
  },
  {
    id: 't6-faedah', grade: 'T6', name: 'Faedah mudah',
    gen: (r) => {
      const P = r.pick([500, 1000, 2000, 5000]), rate = r.int(2, 6), t = r.int(1, 3);
      const I = (P * rate * t) / 100;
      return numq(`${r.pick(NAMES)} menyimpan ${rm(P)} di bank dengan kadar faedah mudah ${rate}% setahun. Berapakah faedah selepas ${t} tahun?`, I, [(P * rate) / 100, P + I, I * 10], `Faedah = ${rm(P)} × ${rate}% × ${t} = ${rm(I)}`, rm);
    },
  },
  {
    id: 't6-bodmas', grade: 'T6', name: 'Operasi bergabung',
    gen: (r) => {
      const a = r.int(2, 20), b = r.int(2, 9), c = r.int(2, 9);
      if (r.chance(0.5)) return numq(`${a} + ${b} × ${c} = ?`, a + b * c, [(a + b) * c, a * b + c, a + b + c], `Darab dahulu: ${b} × ${c} = ${b * c}, kemudian ${a} + ${b * c} = ${a + b * c}`);
      const big = a + b * c + r.int(1, 20);
      return numq(`${big} − ${b} × ${c} = ?`, big - b * c, [(big - b) * c, big - b - c, big - b * c + 2], `Darab dahulu: ${b} × ${c} = ${b * c}, kemudian ${big} − ${b * c} = ${big - b * c}`);
    },
  },
  {
    id: 't6-data', grade: 'T6', name: 'Mod, median dan julat',
    gen: (r) => {
      const vals = Array.from({ length: r.pick([5, 7]) }, () => r.int(1, 20));
      const sorted = vals.slice().sort((x, y) => x - y);
      const kind = r.int(0, 2);
      if (kind === 0) {
        const mode = r.pick(vals);
        vals.push(mode, mode);
        const counts = new Map<number, number>();
        vals.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
        const max = Math.max(...counts.values());
        const modes = [...counts].filter(([, c]) => c === max).map(([v]) => v);
        if (modes.length === 1) {
          return numq(`Cari <b>mod</b> bagi: ${r.shuffle(vals).join(', ')}`, modes[0], [Math.max(...vals), Math.min(...vals), vals.length], `Mod ialah nilai yang paling kerap muncul: ${modes[0]} (${max} kali).`);
        }
      }
      if (kind === 1) {
        const med = sorted[(sorted.length - 1) / 2];
        return numq(`Cari <b>median</b> bagi: ${vals.join(', ')}`, med, [vals[(vals.length - 1) / 2], sorted[0], sorted[sorted.length - 1]], `Susun: ${sorted.join(', ')}. Nilai tengah = ${med}.`);
      }
      const range = sorted[sorted.length - 1] - sorted[0];
      return numq(`Cari <b>julat</b> bagi: ${vals.join(', ')}`, range, [sorted[sorted.length - 1], sorted[0] + sorted[sorted.length - 1], range + 1], `Julat = terbesar − terkecil = ${sorted[sorted.length - 1]} − ${sorted[0]} = ${range}`);
    },
  },
  {
    id: 't6-kemungkinan', grade: 'T6', name: 'Kemungkinan',
    gen: (r) => {
      const opts = ['Pasti', 'Berkemungkinan besar', 'Sama kemungkinan', 'Berkemungkinan kecil', 'Mustahil'];
      const total = 10;
      const red = r.pick([0, 2, 5, 8, 10]);
      const color = r.pick(['merah', 'biru']);
      const want = color === 'merah' ? red : total - red;
      const ans = want === 10 ? 'Pasti' : want === 0 ? 'Mustahil' : want === 5 ? 'Sama kemungkinan' : want > 5 ? 'Berkemungkinan besar' : 'Berkemungkinan kecil';
      return q(`Dalam sebuah beg ada <b>${red}</b> guli merah dan <b>${total - red}</b> guli biru. Sebiji guli diambil secara rawak. Kemungkinan mendapat guli <b>${color}</b> ialah`, ans, r.sample(opts.filter((o) => o !== ans), 3), `Ada ${want} daripada ${total} guli ${color}, jadi <b>${ans.toLowerCase()}</b>.`);
    },
  },
];
