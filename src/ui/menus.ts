// In-game windows: status, bag, learning record, settings, world map, shop, job change and style.
import * as THREE from 'three';
import { setSound, sfx } from '../audio/sfx';
import { GRADES, GRADE_NAMES, TOPICS } from '../math';
import {
  STAT_LABELS, Stats, addItem, attackPower, critChance, expToNext, guard, maxHp, maxSp, timeLimit,
} from '../rpg/character';
import { ADVANCED_JOBS, HATS, ITEMS, JOBS, JobId, MAPS, MAP_ORDER, mapForGrade } from '../rpg/data';
import type { GameSession } from '../game/session';
import { Quality } from '../save';
import { appearanceEditor } from './appearance';
import { btn, clear, confirmBox, escapeHtml, h, openWindow, toast } from './dom';

// ---------------------------------------------------------------- status

export function openStatus(s: GameSession): void {
  const w = openWindow('Status Watak', { wide: true });
  const render = () => {
    const c = s.char;
    const job = JOBS[c.job];
    clear(w.body);
    const statRows = (Object.keys(STAT_LABELS) as (keyof Stats)[]).map((k) =>
      h('div', { class: 'stat-row' },
        h('div', {}, h('b', { text: STAT_LABELS[k].name }), h('small', { text: STAT_LABELS[k].desc })),
        h('span', { class: 'stat-val', text: String(c.stats[k]) }),
        c.statPoints > 0 && c.stats[k] < 99
          ? btn('+', () => {
            c.stats[k]++;
            c.statPoints--;
            sfx.click();
            s.hud.update();
            render();
          }, 'btn small round')
          : h('span', {})));
    w.body.append(
      h('div', { class: 'status-top' },
        job.portrait ? h('img', { class: 'job-portrait', attrs: { src: job.portrait, alt: job.name } }) : h('div', { class: 'job-portrait novice', text: '🌱' }),
        h('div', {},
          h('h3', { text: c.name }),
          h('p', { html: `<b>${job.name}</b> · Level ${c.level} · ${GRADE_NAMES[c.grade]}` }),
          h('p', { class: 'muted', html: `<i>"${escapeHtml(job.motto)}"</i>` }),
          h('p', { html: `EXP: ${Math.floor(c.exp)} / ${expToNext(c.level)}` }),
          h('p', { html: `✨ Skill: <b>${job.skill.name}</b> (${job.skill.sp} SP) – ${escapeHtml(job.skill.desc)}<br>🛡️ Pasif: ${escapeHtml(job.passive)}` }))),
      h('h4', { html: `Mata status: <span class="pts">${c.statPoints}</span>` }),
      h('div', { class: 'stats' }, ...statRows),
      h('div', { class: 'derived' },
        h('div', { html: `⚔️ ATK <b>${attackPower(c)}</b>` }),
        h('div', { html: `❤️ HP <b>${maxHp(c)}</b>` }),
        h('div', { html: `💙 SP <b>${maxSp(c)}</b>` }),
        h('div', { html: `💥 Kritikal <b>${Math.round(critChance(c) * 100)}%</b>` }),
        h('div', { html: `🛡️ Kurang damage <b>${Math.round(guard(c) * 100)}%</b>` }),
        h('div', { html: `⏱️ Masa menjawab <b>${timeLimit(c, c.grade)} s</b>` })),
      h('p', { class: 'muted', html: `Raksasa dikalahkan: ${c.kills} · Bos: ${c.bosses.length} · Masa main: ${Math.floor(c.playTime / 60)} minit` }),
    );
  };
  render();
}

// ---------------------------------------------------------------- inventory

export function openInventory(s: GameSession): void {
  const w = openWindow('Beg');
  const render = () => {
    const c = s.char;
    clear(w.body);
    w.body.append(h('p', { class: 'coins-line', text: `🪙 ${c.coins.toLocaleString('ms-MY')} syiling` }));
    const ids = Object.keys(c.inventory).filter((id) => ITEMS[id] && c.inventory[id] > 0);
    if (!ids.length) w.body.append(h('p', { class: 'muted', text: 'Beg kosong. Beli potion di kedai Mak Cik.' }));
    const list = h('div', { class: 'items' });
    for (const id of ids) {
      const it = ITEMS[id];
      list.append(h('div', { class: 'item' },
        h('span', { class: 'item-icon', text: it.icon }),
        h('div', {}, h('b', { text: `${it.name} ×${c.inventory[id]}` }), h('small', { text: it.desc })),
        it.use ? btn('Guna', () => {
          if (s.useItem(id)) {
            if (it.use?.warpHome) w.close();
            else render();
          }
        }, 'btn small') : h('span')));
    }
    w.body.append(list);
  };
  render();
}

// ---------------------------------------------------------------- learning record

export function openLearning(s: GameSession): void {
  const c = s.char;
  const w = openWindow('Rekod Pembelajaran', { wide: true });
  const all = Object.values(c.learn);
  const total = all.reduce((a, x) => a + x.t, 0);
  const correct = all.reduce((a, x) => a + x.c, 0);
  w.body.append(h('div', { class: 'learn-summary' },
    h('div', { html: `<b>${total}</b><small>soalan dijawab</small>` }),
    h('div', { html: `<b>${total ? Math.round((correct / total) * 100) : 0}%</b><small>ketepatan</small>` }),
    h('div', { html: `<b>${Object.keys(c.learn).length}</b><small>topik dicuba</small>` })));
  const tried = TOPICS.filter((t) => c.learn[t.id]?.t);
  const weak = tried.filter((t) => c.learn[t.id].t >= 3).sort((a, b) => c.learn[a.id].c / c.learn[a.id].t - c.learn[b.id].c / c.learn[b.id].t).slice(0, 3);
  if (weak.length) {
    w.body.append(h('p', { class: 'note', html: `💡 Perlu lebih latihan: ${weak.map((t) => `<b>${escapeHtml(t.name)}</b> (${GRADE_NAMES[t.grade]})`).join(', ')}. Raksasa akan lebih kerap tanya topik ini.` }));
  }
  if (!tried.length) w.body.append(h('p', { class: 'muted', text: 'Belum ada rekod. Lawan raksasa untuk mula!' }));
  for (const g of GRADES) {
    const topics = TOPICS.filter((t) => t.grade === g);
    const done = topics.filter((t) => c.learn[t.id]?.t);
    if (!done.length) continue;
    const sec = h('div', { class: 'learn-grade' }, h('h4', { text: `${GRADE_NAMES[g]} · ${done.length}/${topics.length} topik` }));
    for (const t of done) {
      const st = c.learn[t.id];
      const acc = st.c / st.t;
      sec.append(h('div', { class: 'learn-row' },
        h('span', { text: t.name }),
        h('div', { class: 'bar acc' + (acc < 0.6 ? ' low' : acc >= 0.85 ? ' high' : '') }, h('i', { style: `width:${acc * 100}%` })),
        h('small', { text: `${st.c}/${st.t}` })));
    }
    w.body.append(sec);
  }
}

// ---------------------------------------------------------------- world map

export function openWorldMap(s: GameSession): void {
  const c = s.char;
  const w = openWindow('Peta Dunia', { wide: true });
  const chain = h('div', { class: 'world-chain' });
  MAP_ORDER.forEach((id, i) => {
    const m = MAPS[id];
    const here = c.map === id;
    const mine = mapForGrade(c.grade) === id;
    chain.append(h('div', { class: 'wm' + (here ? ' here' : '') + (c.visited.includes(id) ? ' seen' : '') },
      h('b', { text: m.name }),
      h('small', { text: m.grades.length ? `Soalan ${m.recommend}` : 'Kota (selamat)' }),
      here ? h('em', { text: '📍 Kau di sini' }) : mine ? h('em', { text: '⭐ Sesuai untuk kau' }) : c.visited.includes(id) ? h('em', { text: '✓ Pernah dilawati' }) : null));
    if (i < MAP_ORDER.length - 1) chain.append(h('span', { class: 'wm-arrow', text: '➜' }));
  });
  w.body.append(chain, h('p', { class: 'muted', text: 'Berjalan melalui portal biru di hujung setiap peta, atau minta Pak Warp di kota hantar kau terus.' }));
}

// ---------------------------------------------------------------- settings

export function openSettings(s: GameSession): void {
  const st = s.save.settings;
  const w = openWindow('Tetapan');
  const toggle = (label: string, get: () => boolean, set: (v: boolean) => void) => {
    const b = h('button', { class: 'chip' });
    const r = () => {
      b.textContent = get() ? 'Hidup' : 'Mati';
      b.classList.toggle('on', get());
    };
    b.onclick = () => (set(!get()), r(), s.persist());
    r();
    return h('div', { class: 'field row' }, h('label', { text: label }), b);
  };
  const qualityRow = h('div', { class: 'chips' });
  (['low', 'med', 'high'] as Quality[]).forEach((q) => {
    const b = h('button', { class: 'chip' + (st.quality === q ? ' on' : ''), text: { low: 'Rendah', med: 'Sederhana', high: 'Tinggi' }[q] });
    b.onclick = () => {
      st.quality = q;
      s.engine.setQuality(q);
      [...qualityRow.children].forEach((x) => x.classList.toggle('on', x === b));
      s.persist();
      toast('Grafik dikemas kini. Kesan penuh selepas tukar peta.');
    };
    qualityRow.append(b);
  });
  const modeRow = h('div', { class: 'chips' });
  ([['map', 'Ikut peta'], ['grade', 'Tahap aku sahaja']] as const).forEach(([m, label]) => {
    const b = h('button', { class: 'chip' + (st.questionMode === m ? ' on' : ''), text: label });
    b.onclick = () => {
      st.questionMode = m;
      [...modeRow.children].forEach((x) => x.classList.toggle('on', x === b));
      s.persist();
    };
    modeRow.append(b);
  });
  w.body.append(
    toggle('🔊 Bunyi', () => st.sound, (v) => (st.sound = v, setSound(v))),
    toggle('⏱️ Had masa menjawab', () => st.timer, (v) => (st.timer = v)),
    h('div', { class: 'field' }, h('label', { text: '📝 Soalan raksasa' }), modeRow,
      h('small', { class: 'muted', text: '"Tahap aku sahaja" = semua raksasa tanya soalan tahap sekolah kau, di mana-mana peta.' })),
    h('div', { class: 'field' }, h('label', { text: '🖥️ Kualiti grafik' }), qualityRow),
    h('div', { class: 'row wrap' },
      btn('❓ Cara bermain', () => openHelp(), 'btn ghost'),
      btn('💾 Eksport simpanan', () => exportSave(s), 'btn ghost'),
      btn('⛶ Skrin penuh', () => toggleFullscreen(), 'btn ghost')),
    h('div', { class: 'row end' }, btn('🏠 Simpan & keluar', () => (w.close(), s.quit()), 'btn primary')),
  );
}

function exportSave(s: GameSession): void {
  s.persist();
  const blob = new Blob([JSON.stringify(s.char, null, 1)], { type: 'application/json' });
  const a = h('a', { attrs: { href: URL.createObjectURL(blob), download: `kembara-${s.char.name}.json` } });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => toast('Skrin penuh tidak disokong. Pasang sebagai app untuk skrin penuh.'));
}

export function openHelp(): void {
  const w = openWindow('Cara Bermain', { wide: true });
  w.body.innerHTML = `
    <div class="help">
      <h4>🎯 Matlamat</h4>
      <p>Kau bermula sebagai <b>Novice</b>. Kembara dari Kota Permulaan ke padang, hutan, pantai, gurun, gua dan puncak. Setiap kawasan ada soalan Matematik untuk tahap berbeza, dari Tahun 1 hingga Tingkatan 5.</p>
      <h4>🚶 Berjalan</h4>
      <p><b>Telefon:</b> guna joystick di kiri bawah, atau ketik tanah untuk berjalan ke situ. Leret skrin untuk pusing kamera, cubit untuk zum.<br>
      <b>Komputer:</b> WASD / anak panah atau klik tetikus. Q/E pusing kamera, roda tetikus untuk zum.</p>
      <h4>⚔️ Bertarung</h4>
      <p>Ketik raksasa (atau tekan butang ⚔️ / Spasi). Soalan akan keluar. <b>Jawapan betul</b> menyerang raksasa. Jawab cepat untuk damage lebih besar. <b>Jawapan salah</b> atau masa tamat, raksasa menyerang kau dan penerangan jawapan ditunjukkan.</p>
      <h4>✨ Skill & Potion</h4>
      <p>Setiap job ada skill sendiri yang guna SP. Potion memulihkan HP/SP tanpa membazir soalan. Butang ✏️ Conteng membuka kertas untuk mengira.</p>
      <h4>🎓 Tukar Job</h4>
      <p>Capai Level 10 dan jumpa Guru Job. Pilih Priest, Knight, Assassin, Mage, Hunter atau Blacksmith.</p>
      <h4>📘 Rekod Pembelajaran</h4>
      <p>Lihat topik yang kau kuasai dan yang perlu dilatih. Topik lemah akan lebih kerap muncul.</p>
      <h4>💾 Simpanan</h4>
      <p>Progress disimpan automatik dalam peranti ini. Game boleh dimain tanpa internet selepas dibuka sekali.</p>
    </div>`;
}

// ---------------------------------------------------------------- shop

export function openShop(s: GameSession): void {
  const w = openWindow('Kedai Runcit Mak Cik', { wide: true });
  let tab: 'buy' | 'sell' = 'buy';
  const render = () => {
    const c = s.char;
    clear(w.body);
    w.body.append(
      h('div', { class: 'row between' },
        h('div', { class: 'chips' },
          h('button', { class: 'chip' + (tab === 'buy' ? ' on' : ''), text: 'Beli', onclick: () => ((tab = 'buy'), render()) }),
          h('button', { class: 'chip' + (tab === 'sell' ? ' on' : ''), text: 'Jual', onclick: () => ((tab = 'sell'), render()) })),
        h('b', { text: `🪙 ${c.coins.toLocaleString('ms-MY')}` })));
    const list = h('div', { class: 'items' });
    if (tab === 'buy') {
      for (const it of Object.values(ITEMS).filter((x) => x.buyable)) {
        const buy = (n: number) => {
          if (c.coins < it.price * n) return toast('Syiling tak cukup.', 'bad');
          c.coins -= it.price * n;
          addItem(c, it.id, n);
          sfx.coin();
          s.hud.update();
          s.persist();
          render();
        };
        list.append(h('div', { class: 'item' },
          h('span', { class: 'item-icon', text: it.icon }),
          h('div', {}, h('b', { text: it.name }), h('small', { text: `${it.desc} · Ada: ${c.inventory[it.id] ?? 0}` })),
          h('div', { class: 'row' }, btn(`🪙${it.price}`, () => buy(1), 'btn small'), btn('×5', () => buy(5), 'btn small ghost'))));
      }
    } else {
      const ids = Object.keys(c.inventory).filter((id) => ITEMS[id] && c.inventory[id] > 0);
      if (!ids.length) list.append(h('p', { class: 'muted', text: 'Tiada barang untuk dijual.' }));
      for (const id of ids) {
        const it = ITEMS[id];
        const price = it.buyable ? Math.floor(it.price / 2) : it.price;
        const sell = (n: number) => {
          const k = Math.min(n, c.inventory[id] ?? 0);
          c.coins += price * k;
          addItem(c, id, -k);
          sfx.coin();
          s.hud.update();
          s.persist();
          render();
        };
        list.append(h('div', { class: 'item' },
          h('span', { class: 'item-icon', text: it.icon }),
          h('div', {}, h('b', { text: `${it.name} ×${c.inventory[id]}` }), h('small', { text: `Harga jual 🪙${price}` })),
          h('div', { class: 'row' }, btn('Jual 1', () => sell(1), 'btn small'), btn('Semua', () => sell(999), 'btn small ghost'))));
      }
    }
    w.body.append(list);
  };
  render();
}

// ---------------------------------------------------------------- job change

export function openJobChange(s: GameSession): void {
  const w = openWindow('Pilih Kerjaya', { wide: true });
  const grid = h('div', { class: 'jobs' });
  for (const id of ADVANCED_JOBS) {
    const j = JOBS[id];
    grid.append(h('div', { class: 'job-card' },
      h('img', { attrs: { src: j.portrait!, alt: j.name } }),
      h('h4', { text: j.name }),
      h('p', { class: 'motto', text: `"${j.motto}"` }),
      h('p', { text: j.desc }),
      h('p', { class: 'muted', html: `✨ <b>${j.skill.name}</b>: ${escapeHtml(j.skill.desc)}<br>🛡️ ${escapeHtml(j.passive)}` }),
      btn(`Jadi ${j.name}`, () => confirmBox(`Tukar kerjaya kepada <b>${j.name}</b>? Pilihan ini kekal.`, 'Ya, pilih!', () => {
        w.close();
        changeJob(s, id);
      }), 'btn primary')));
  }
  w.body.append(grid);
}

function changeJob(s: GameSession, id: JobId): void {
  const c = s.char;
  c.job = id;
  c.hp = maxHp(c);
  c.sp = maxSp(c);
  s.player.rebuild(c.appearance, c.job);
  s.player.model.play('cheer');
  sfx.levelUp();
  const at = new THREE.Vector3(s.player.x, s.player.y + 0.2, s.player.z);
  s.effects.ring(at, 0xb48cff, 3);
  s.effects.burst(at.clone().setY(s.player.y + 1.5), 0xffd34d, 24, 2, 4);
  toast(`🎓 Tahniah! Kau kini seorang <b>${JOBS[id].name}</b>!`, 'gold');
  s.questEvent({ type: 'job' });
  s.hud.update();
  s.persist();
}

// ---------------------------------------------------------------- style shop

export function openStyle(s: GameSession): void {
  const c = s.char;
  const before = JSON.stringify(c.appearance);
  const draft = { ...c.appearance };
  const preview = () => s.player.rebuild(draft, c.job);
  let saved = false;
  const w = openWindow('Kedai Gaya Kak Gaya', {
    side: true,
    onClose: () => {
      if (!saved) {
        c.appearance = JSON.parse(before);
        s.player.rebuild(c.appearance, c.job);
      }
    },
  });
  const hats = h('div', { class: 'items' });
  const renderHats = () => {
    clear(hats);
    hats.append(h('div', { class: 'item' },
      h('span', { class: 'item-icon', text: '🚫' }), h('div', {}, h('b', { text: 'Tiada topi' })),
      btn(draft.hat ? 'Pakai' : 'Dipakai', () => ((draft.hat = null), preview(), renderHats()), 'btn small' + (draft.hat ? '' : ' ghost'))));
    for (const hat of HATS) {
      const owned = c.ownedHats.includes(hat.id);
      const wearing = draft.hat === hat.id;
      hats.append(h('div', { class: 'item' },
        h('span', { class: 'item-icon', text: '🎩' }),
        h('div', {}, h('b', { text: hat.name }), h('small', { text: owned ? 'Milik kau' : `🪙 ${hat.price}` })),
        owned
          ? btn(wearing ? 'Dipakai' : 'Pakai', () => ((draft.hat = hat.id), preview(), renderHats()), 'btn small' + (wearing ? ' ghost' : ''))
          : btn('Cuba', () => ((draft.hat = hat.id), preview(), renderHats()), 'btn small ghost'),
        !owned ? btn('Beli', () => {
          if (c.coins < hat.price) return toast(`Perlu ${hat.price} syiling. Kalahkan lebih banyak raksasa!`, 'bad');
          c.coins -= hat.price;
          c.ownedHats.push(hat.id);
          draft.hat = hat.id;
          sfx.coin();
          preview();
          s.hud.update();
          s.persist();
          renderHats();
        }, 'btn small') : null));
    }
  };
  renderHats();
  w.body.append(
    appearanceEditor(draft, preview, { outfit: c.job === 'novice' }),
    h('h4', { text: '🎩 Topi' }),
    hats,
    h('div', { class: 'row end' }, btn('Simpan gaya', () => {
      if (draft.hat && !c.ownedHats.includes(draft.hat)) draft.hat = c.appearance.hat && c.ownedHats.includes(c.appearance.hat) ? c.appearance.hat : null;
      c.appearance = { ...draft };
      saved = true;
      s.player.rebuild(c.appearance, c.job);
      s.persist();
      toast('Gaya baru disimpan!', 'good');
      w.close();
    }, 'btn primary')),
  );
}

