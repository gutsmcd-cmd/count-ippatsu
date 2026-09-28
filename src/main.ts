import './base.css';
import './style.css';
import { h, toast, loadJSON, saveJSON, uid, langToggle, confirmDialog } from './ui';
import { dicts, type Lang, type Dict } from './i18n';

interface Counter { id: string; name: string; count: number; step: number; color: string }
interface State { lang: Lang; counters: Counter[]; active: string; vibrate: boolean; seq: number }
const COLORS = ['#7c3aed', '#e11d48', '#0ea5e9', '#16a34a', '#f59e0b', '#db2777', '#0d9488', '#475569'];
const KEY = 'count-ippatsu:v1';
const st: State = loadJSON<State>(KEY, { lang: 'ja', counters: [], active: '', vibrate: true, seq: 0 });
let t: Dict = dicts[st.lang];
const save = () => saveJSON(KEY, st);
const app = document.getElementById('app')!;

function newCounter(): Counter {
  st.seq++;
  return { id: uid(), name: t.newName(st.seq), count: 0, step: 1, color: COLORS[(st.seq - 1) % COLORS.length] };
}
if (!st.counters.length) { const c = newCounter(); st.counters.push(c); st.active = c.id; save(); }
const active = () => st.counters.find((c) => c.id === st.active) ?? st.counters[0];

function setLang(l: Lang) { st.lang = l; t = dicts[l]; document.documentElement.lang = l; document.title = t.app; save(); render(); }
const fmt = (n: number) => n.toLocaleString(st.lang === 'ja' ? 'ja-JP' : 'en-US');
const buzz = (ms: number | number[]) => { if (st.vibrate && navigator.vibrate) navigator.vibrate(ms); };

let countEl: HTMLElement | null = null;
let totalEl: HTMLElement | null = null;
function bump(delta: number) {
  const c = active();
  c.count += delta;
  save();
  buzz(delta > 0 ? 18 : [10, 40, 10]);
  if (countEl) {
    countEl.textContent = fmt(c.count);
    countEl.classList.remove('pop'); void countEl.offsetWidth; countEl.classList.add('pop');
    fitCount();
  }
  if (totalEl) totalEl.textContent = fmt(st.counters.reduce((a, x) => a + x.count, 0));
  document.querySelectorAll<HTMLElement>(`[data-chip="${c.id}"] .chip-n`).forEach((e) => (e.textContent = fmt(c.count)));
}
function fitCount() {
  if (!countEl) return;
  const len = countEl.textContent!.length;
  countEl.style.fontSize = len <= 3 ? '' : `min(${Math.max(26, 34 - (len - 3) * 5)}vw, ${Math.max(90, 170 - (len - 3) * 22)}px)`;
}

function editDialog(c: Counter) {
  const name = h('input', { class: 'input', value: c.name, maxlength: 40 });
  const step = h('input', { class: 'input', type: 'number', inputmode: 'numeric', min: 1, max: 1000, value: String(c.step) });
  const colors = h('div', { class: 'swatches' }, ...COLORS.map((col) =>
    h('button', { class: 'swatch', style: `background:${col}`, 'aria-pressed': String(c.color === col), 'aria-label': col, onclick: (e: Event) => {
      c.color = col;
      colors.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-pressed', 'false'));
      (e.currentTarget as HTMLElement).setAttribute('aria-pressed', 'true');
    } })));
  const dlg = h('dialog', {},
    h('h2', {}, t.edit),
    h('div', { class: 'stack' },
      h('label', { class: 'field' }, t.name, name),
      h('label', { class: 'field' }, t.step, step),
      colors,
      st.counters.length > 1 ? h('button', { class: 'btn danger', onclick: () => {
        const idx = st.counters.indexOf(c);
        st.counters.splice(idx, 1);
        st.active = st.counters[Math.max(0, idx - 1)].id;
        save(); dlg.close(); render();
        toast(t.deleted, { label: t.undo, run: () => { st.counters.splice(idx, 0, c); st.active = c.id; save(); render(); } });
      } }, t.del) : null,
    ),
    h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => dlg.close() }, t.done)),
  );
  dlg.addEventListener('close', () => {
    if (st.counters.includes(c)) {
      c.name = name.value.trim() || c.name;
      c.step = Math.max(1, Math.min(1000, Math.round(Number(step.value)) || 1));
      save(); render();
    }
    dlg.remove();
  });
  document.body.append(dlg);
  dlg.showModal();
}

function render() {
  const c = active();
  st.active = c.id;
  document.documentElement.style.setProperty('--cc', c.color);
  const chips = h('nav', { class: 'chips' },
    ...st.counters.map((x) => h('button', {
      class: 'chip', 'data-chip': x.id, 'aria-pressed': String(x.id === c.id), style: `--chip:${x.color}`,
      onclick: () => { st.active = x.id; save(); render(); },
    }, h('span', { class: 'chip-name' }, x.name), h('span', { class: 'chip-n' }, fmt(x.count)))),
    h('button', { class: 'chip add', 'aria-label': t.add, title: t.add, onclick: () => { const n = newCounter(); st.counters.push(n); st.active = n.id; save(); render(); editDialog(n); } }, '+'),
  );
  countEl = h('div', { class: 'count', 'aria-live': 'polite' }, fmt(c.count));
  const tap = h('button', { class: 'tap', 'aria-label': `${c.name} +${c.step}` },
    h('div', { class: 'tap-name' }, c.name),
    countEl,
    h('div', { class: 'tap-hint' }, c.step === 1 ? t.tapHint : t.tapHint.replace('1', String(c.step))),
  );
  // pointerdown feels instant on Android; ignore the synthetic click that follows.
  tap.addEventListener('pointerdown', (e) => { if (e.button === 0) { bump(c.step); tap.classList.add('down'); } });
  const up = () => tap.classList.remove('down');
  tap.addEventListener('pointerup', up); tap.addEventListener('pointerleave', up); tap.addEventListener('pointercancel', up);
  tap.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bump(c.step); } });

  totalEl = h('span', {}, fmt(st.counters.reduce((a, x) => a + x.count, 0)));
  app.replaceChildren(
    h('header', { class: 'topbar' }, h('h1', {}, t.app),
      h('label', { class: 'vib', title: t.vibrate }, h('input', { type: 'checkbox', checked: st.vibrate, onchange: (e: Event) => { st.vibrate = (e.target as HTMLInputElement).checked; save(); buzz(30); } }), h('span', {}, t.vibrate)),
      langToggle(st.lang, setLang)),
    chips,
    h('main', {},
      tap,
      h('div', { class: 'controls' },
        h('button', { class: 'ctl minus', 'aria-label': t.minus, onclick: () => bump(-c.step) }, '−'),
        h('button', { class: 'ctl plus', 'aria-label': t.plus, onclick: () => bump(c.step) }, '+'),
      ),
      h('div', { class: 'row sub' },
        h('button', { class: 'btn grow', onclick: () => editDialog(c) }, '✎ ', t.edit),
        h('button', { class: 'btn grow danger', onclick: async () => {
          if (c.count === 0) return;
          const prev = c.count;
          if (await confirmDialog(t.resetQ(c.name), t.resetBody(fmt(prev)), t.reset, t.cancel, true)) {
            c.count = 0; save(); render(); buzz([30, 60, 30]);
            toast(t.resetDone, { label: t.undo, run: () => { c.count = prev; save(); render(); } });
          }
        } }, '↺ ', t.reset),
      ),
      st.counters.length > 1 ? h('p', { class: 'total muted' }, `${t.total}（${t.all}）: `, totalEl) : '',
      h('p', { class: 'foot' }, t.privacy),
    ),
  );
  fitCount();
  const act = chips.querySelector<HTMLElement>('[aria-pressed="true"]');
  act?.scrollIntoView({ inline: 'center', block: 'nearest' });
}
document.documentElement.lang = st.lang;
document.title = t.app;
render();
