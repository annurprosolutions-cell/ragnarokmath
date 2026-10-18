// Conversations with town NPCs.
import { GRADES, GRADE_NAMES } from '../math';
import { JOB_CHANGE_LEVEL, MAPS, MAP_ORDER, mapForGrade } from '../rpg/data';
import { currentQuest } from '../rpg/quests';
import type { Npc } from '../game/entities';
import type { GameSession } from '../game/session';
import { escapeHtml, h, toast, uiRoot } from './dom';
import { openHelp, openJobChange, openShop, openStyle } from './menus';

interface Option {
  label: string;
  action?: () => void;
}

export function dialog(npc: Npc, text: string, options: Option[]): void {
  document.querySelector('.dialog')?.remove();
  const close = () => {
    removeEventListener('keydown', onKey, true);
    el.remove();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || document.querySelector('.backdrop')) return;
    e.stopPropagation();
    close();
  };
  const el = h('div', { class: 'dialog' },
    h('div', { class: 'd-name', html: `${npc.def.icon} ${escapeHtml(npc.def.name)} <small>${escapeHtml(npc.def.title)}</small>` }),
    h('div', { class: 'd-text', html: text }),
    h('div', { class: 'd-opts' }, ...options.map((o) => h('button', {
      class: 'btn', html: o.label, onclick: () => {
        close();
        o.action?.();
      },
    }))));
  uiRoot().append(el);
  addEventListener('keydown', onKey, true);
}

const BYE = { label: 'Selamat tinggal' };

export function talkTo(s: GameSession, npc: Npc): void {
  const c = s.char;
  switch (npc.def.id) {
    case 'cikgu': {
      const q = currentQuest(c);
      const text = c.quest <= 1
        ? `Selamat datang ke Kembara Matematik, <b>${escapeHtml(c.name)}</b>! Di dunia ini, setiap raksasa dikalahkan dengan <b>menjawab soalan Matematik</b>. Jawapan betul = serangan. Jawapan salah = raksasa menyerang kau.<br><br>Mula dengan Patung Latihan di sebelah barat kota.`
        : q ? `Misi kau sekarang: <b>${escapeHtml(q.title)}</b>. ${escapeHtml(q.desc(c))}` : 'Hebat! Kau sudah selesaikan semua misi. Teruskan berlatih untuk jadi lebih pantas!';
      dialog(npc, text, [
        { label: '❓ Cara bermain', action: () => openHelp() },
        { label: '🎒 Tukar tahap sekolah', action: () => openGradePicker(s, npc) },
        BYE,
      ]);
      break;
    }
    case 'warp': {
      const targets = MAP_ORDER.filter((id) => id !== c.map && (c.visited.includes(id) || id === mapForGrade(c.grade) || id === 'kota'));
      dialog(npc, 'Nak ke mana hari ini? Aku boleh hantar kau ke tempat yang pernah kau lawati, atau terus ke kawasan yang sesuai dengan tahap sekolah kau. Percuma!', [
        ...targets.map((id) => ({
          label: `🌀 ${MAPS[id].name} <small>${MAPS[id].recommend}</small>${id === mapForGrade(c.grade) ? ' ⭐' : ''}`,
          action: () => s.travel(id, id === 'kota' ? MAPS.kota.spawn : MAPS[id].spawn),
        })),
        BYE,
      ]);
      break;
    }
    case 'job': {
      if (c.job !== 'novice') {
        dialog(npc, `Kau kini seorang <b>${c.job.charAt(0).toUpperCase() + c.job.slice(1)}</b>. Gunakan skill kau dengan bijak dan terus belajar!`, [BYE]);
      } else if (c.level < JOB_CHANGE_LEVEL) {
        dialog(npc, `Untuk menukar kerjaya, kau perlu capai <b>Level ${JOB_CHANGE_LEVEL}</b>. Sekarang kau Level ${c.level}. Lawan raksasa dan jawab soalan dengan betul untuk dapat EXP!`, [BYE]);
      } else {
        dialog(npc, 'Kau sudah bersedia! Pilih kerjaya yang sesuai dengan cara kau belajar. Pilihan ini kekal, jadi fikir baik-baik.', [
          { label: '🎓 Lihat pilihan job', action: () => openJobChange(s) },
          BYE,
        ]);
      }
      break;
    }
    case 'kedai':
      dialog(npc, 'Mari, mari! Potion untuk kembara, dan mak cik beli barang yang kau kutip daripada raksasa.', [
        { label: '🛒 Buka kedai', action: () => openShop(s) },
        BYE,
      ]);
      break;
    case 'gaya':
      dialog(npc, 'Nak tukar gaya? Rambut, tudung, warna kulit, semua boleh. Akak pun ada topi comel untuk dijual!', [
        { label: '🎀 Tukar gaya & topi', action: () => openStyle(s) },
        BYE,
      ]);
      break;
  }
}

function openGradePicker(s: GameSession, npc: Npc): void {
  const c = s.char;
  dialog(npc, `Tahap sekarang: <b>${GRADE_NAMES[c.grade]}</b>. Soalan latihan dan misi akan ikut tahap ini.`, [
    ...GRADES.map((g) => ({
      label: GRADE_NAMES[g] + (g === c.grade ? ' ✓' : ''),
      action: () => {
        c.grade = g;
        toast(`Tahap ditukar ke ${GRADE_NAMES[g]}.`, 'good');
        s.questEvent(null);
        s.hud.update();
        s.persist();
      },
    })),
    { label: 'Batal' },
  ]);
}
