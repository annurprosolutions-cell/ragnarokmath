// Reusable appearance editor (character creation and Kak Gaya's style shop).
import { Appearance } from '../rpg/character';
import { CLOTH_COLORS, EYE_COLORS, HAIR_COLORS, HAIR_STYLES, SKIN_TONES, TUDUNG_COLORS } from '../rpg/data';
import { h, hex } from './dom';

function swatches(colors: number[], get: () => number, set: (i: number) => void, onChange: () => void): HTMLElement {
  const row = h('div', { class: 'swatches' });
  const render = () => {
    [...row.children].forEach((el, i) => el.classList.toggle('on', i === get()));
  };
  colors.forEach((c, i) => {
    row.append(h('button', {
      class: 'sw', style: `background:${hex(c)}`, attrs: { 'aria-label': `Warna ${i + 1}` },
      onclick: () => {
        set(i);
        render();
        onChange();
      },
    }));
  });
  render();
  return row;
}

function choices(labels: string[], get: () => number, set: (i: number) => void, onChange: () => void): HTMLElement {
  const row = h('div', { class: 'chips' });
  const render = () => [...row.children].forEach((el, i) => el.classList.toggle('on', i === get()));
  labels.forEach((l, i) => row.append(h('button', { class: 'chip', text: l, onclick: () => (set(i), render(), onChange()) })));
  render();
  return row;
}

function field(label: string, control: HTMLElement): HTMLElement {
  return h('div', { class: 'field' }, h('label', { text: label }), control);
}

export function appearanceEditor(app: Appearance, onChange: () => void, opts: { outfit?: boolean } = {}): HTMLElement {
  const hairRows: HTMLElement[] = [];
  const tudungRows: HTMLElement[] = [];
  const sync = () => {
    hairRows.forEach((r) => (r.style.display = app.tudung ? 'none' : ''));
    tudungRows.forEach((r) => (r.style.display = app.tudung ? '' : 'none'));
  };
  const changed = () => {
    sync();
    onChange();
  };
  const hairStyle = field('Gaya rambut', choices(HAIR_STYLES, () => app.hairStyle, (i) => (app.hairStyle = i), changed));
  const hairColor = field('Warna rambut', swatches(HAIR_COLORS, () => app.hairColor, (i) => (app.hairColor = i), changed));
  const tudungColor = field('Warna tudung', swatches(TUDUNG_COLORS, () => app.tudungColor, (i) => (app.tudungColor = i), changed));
  hairRows.push(hairStyle, hairColor);
  tudungRows.push(tudungColor);
  const box = h('div', { class: 'app-editor' },
    field('Jantina', choices(['Lelaki', 'Perempuan'], () => (app.gender === 'L' ? 0 : 1), (i) => (app.gender = i === 0 ? 'L' : 'P'), changed)),
    field('Warna kulit', swatches(SKIN_TONES, () => app.skin, (i) => (app.skin = i), changed)),
    field('Tudung', choices(['Tidak', 'Pakai tudung'], () => (app.tudung ? 1 : 0), (i) => (app.tudung = i === 1), changed)),
    tudungColor,
    hairStyle,
    hairColor,
    field('Warna mata', swatches(EYE_COLORS, () => app.eyeColor, (i) => (app.eyeColor = i), changed)),
    opts.outfit !== false ? field('Warna baju Novice', swatches(CLOTH_COLORS, () => app.outfitColor, (i) => (app.outfitColor = i), changed)) : null,
  );
  sync();
  return box;
}

export function randomAppearance(): Appearance {
  const r = (n: number) => Math.floor(Math.random() * n);
  const gender = Math.random() < 0.5 ? 'L' : 'P';
  return {
    gender,
    skin: r(SKIN_TONES.length),
    hairStyle: gender === 'L' ? r(2) + (Math.random() < 0.2 ? 5 : 0) : r(HAIR_STYLES.length),
    hairColor: r(HAIR_COLORS.length),
    tudung: gender === 'P' && Math.random() < 0.6,
    tudungColor: r(TUDUNG_COLORS.length),
    eyeColor: r(EYE_COLORS.length),
    outfitColor: r(CLOTH_COLORS.length),
    hat: null,
  };
}
