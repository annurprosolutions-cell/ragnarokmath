# Kembara Matematik

RPG 3D ala Ragnarok untuk belajar Matematik, dari **Tahun 1 hingga Tingkatan 5** (KSSR & KSSM). Pemain mula sebagai **Novice**, kembara melalui 7 kawasan, dan kalahkan raksasa dengan menjawab soalan. Pada Level 10 pemain boleh pilih job: Priest, Knight, Assassin, Mage, Hunter atau Blacksmith.

Game ni ialah **PWA**: boleh dipasang di telefon dan komputer, dan boleh dimain tanpa internet selepas dibuka sekali.

## Ciri utama

- **Dunia 3D** dengan 7 peta: Kota Permulaan, Padang Nombor (T1–2), Hutan Sifir (T3–4), Pantai Pecahan (T5–6), Gurun Algebra (F1–2), Gua Geometri (F3), Puncak Ilmu (F4–5). Setiap peta ada bos.
- **Pertarungan kuiz**: jawapan betul = serangan (jawab cepat = damage lebih besar). Jawapan salah = raksasa menyerang dan penerangan jawapan ditunjukkan.
- **~95 penjana soalan** ikut topik DSKP, dengan soalan dijana secara rawak (tak pernah habis). Topik yang lemah akan lebih kerap keluar.
- **Cipta watak**: jantina, warna kulit, gaya & warna rambut, tudung (dengan pilihan warna), warna mata dan baju. Kedai Gaya di kota untuk tukar gaya dan beli topi kosmetik.
- **6 job** berdasarkan reka bentuk watak asal (`docs/character-sheet.webp`), setiap satu dengan skill sendiri:
  Heal (Priest), Bash (Knight), Sonic Blow (Assassin), Petunjuk Ilmu (Mage, buang 2 pilihan salah), Double Strafe (Hunter), Hammerfall (Blacksmith).
- **Rekod Pembelajaran**: ketepatan setiap topik, untuk murid, ibu bapa atau cikgu.
- Misi panduan, kedai potion, Pak Warp, stat point (KUAT/TAHAN/BIJAK/TANGKAS), kertas conteng semasa bertarung, mod "soalan ikut tahap aku", had masa boleh dimatikan.
- Kawalan: joystick + ketik (telefon), WASD/klik (komputer). Sokong potret dan landskap.

## Stack

| Bahagian | Pilihan | Sebab |
|---|---|---|
| Enjin 3D | [Three.js](https://threejs.org) + TypeScript | Ringan untuk telefon murah, tiada WASM besar |
| Build | Vite | Pantas, output statik |
| PWA | vite-plugin-pwa (Workbox) | Offline cache + auto-update |
| Simpanan | `localStorage` dalam peranti | Fasa 1: offline dulu, tiada server |
| Hosting | Netlify (statik) | Percuma, auto-deploy dari GitHub |

Semua model 3D dibina dalam kod (tiada fail model), dan bunyi disintesis dengan WebAudio, jadi saiz muat turun kecil (~200 KB gzip untuk JS).

## Jalankan secara lokal

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # uji semua penjana soalan
npm run build     # output ke dist/
npm run preview   # uji build + service worker
```

## Deploy ke Netlify

1. Log masuk ke [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → pilih GitHub → repo `ragnarokmath`.
2. Netlify akan baca `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Pilih branch yang nak di-deploy (contohnya `main` selepas merge).
4. Tekan **Deploy**. Setiap push ke branch tu akan deploy automatik.

Header cache untuk `sw.js` dan aset sudah disediakan dalam `netlify.toml` supaya pemain sentiasa dapat versi terbaru.

## Struktur kod

```
src/
  math/        penjana soalan (core, primary = KSSR, secondary = KSSM)
  rpg/         data job/raksasa/peta/item, formula RPG, misi
  game/        enjin Three.js: world, model watak & raksasa, input, pertarungan, sesi
  ui/          HUD, menu, dialog NPC, skrin tajuk & cipta watak
  audio/       kesan bunyi WebAudio
tests/         ujian penjana soalan (Vitest)
public/        ikon PWA, potret job (dipotong dari character sheet)
```

## Roadmap

- **Fasa 2 – Multiplayer**: Supabase (Postgres + Realtime Presence/Broadcast, region Singapore). Nampak pemain lain berjalan dalam peta yang sama, chat ringkas, simpanan awan dan leaderboard. Semakan jawapan dipindah ke Edge Function untuk kurangkan main tipu.
- Dashboard cikgu dengan kod kelas (rekod pembelajaran ikut murid).
- Versi Bahasa Inggeris (sekolah DLP).
- Lebih banyak topik dan jenis soalan isi tempat kosong.

## Nota

- Pemetaan topik kepada tahun/tingkatan dibuat berdasarkan DSKP KSSR & KSSM. Elok disemak oleh guru Matematik sebelum digunakan secara rasmi.
- Nama "Ragnarok" dan logonya adalah tanda dagangan Gravity Co. Sebab tu game ni guna nama sendiri ("Kembara Matematik") dan watak asal. Nama boleh ditukar dalam `index.html`, `vite.config.ts` dan `src/ui/screens.ts`.
- Data murid disimpan dalam peranti sahaja (nickname + progress). Tiada maklumat peribadi dihantar ke mana-mana.
