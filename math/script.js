'use strict';

const MODES = ['add', 'sub', 'mul', 'div', 'prime', 'parity'];
// The four kinds of sums are the main modes; the rest are extra topics behind the "more" menu.
const MAIN_MODES = ['add', 'sub', 'mul', 'div'];
// Modes that only take one number.
const ONE_NUMBER = ['prime', 'parity'];
const LEVELS = ['easy', 'medium', 'hard'];
// How many steps to show: 1 only the main steps, 2 also one level of small steps, 3 every step.
const DEPTHS = [1, 2, 3];
const DEFAULT_DEPTH = 3;
const OP_SIGN = { add: '+', sub: '−', mul: '×', div: ':', prime: '', parity: '' };
const LIMITS = {
    add: { a: [0, 99999], b: [0, 99999] },
    sub: { a: [0, 99999], b: [0, 99999] },
    mul: { a: [0, 9999], b: [0, 99] },
    div: { a: [0, 99999], b: [1, 99] },
    prime: { a: [2, 200], b: [0, 0] },
    parity: { a: [0, 999999], b: [0, 0] }
};
const DEFAULTS = { add: [14, 8], sub: [53, 27], mul: [7, 14], div: [84, 4], prime: [91, 0], parity: [37, 0] };
const COLORS = { a: '#4d8bff', b: '#ff9f1c', c: '#43d17a', d: '#c77dff', e: '#3ee0f2', x: '#ff5a5f', p: '#ff7ac6', q: '#c6f432', n: '#5b6170', m: '#8b92a3', w: '#eceef2' };
const TEXT = '#eceef2';
const DIM = '#9aa0ab';
const CUBE = 16;
const BLOCKS_MAX = 300;
const CELLS_MAX = 400;
const AREA_PAD = 64;
const SVG_NS = 'http://www.w3.org/2000/svg';

// ---------- i18n ----------

const LANGS = ['nb', 'en'];
const LANG_STORAGE_KEY = 'math-lang';

function readStoredLang() {
    try {
        return localStorage.getItem(LANG_STORAGE_KEY);
    } catch (err) {
        if (err instanceof DOMException) return null;
        throw err;
    }
}

function storeLang(value) {
    try {
        localStorage.setItem(LANG_STORAGE_KEY, value);
    } catch (err) {
        if (!(err instanceof DOMException)) throw err;
        console.warn('Could not remember language choice:', err.message);
    }
}

let lang = (() => {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(fromUrl)) return fromUrl;
    const saved = readStoredLang();
    return LANGS.includes(saved) ? saved : 'nb';
})();

function lookup(root, path) {
    return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), root);
}

function t(path, vars = {}) {
    let value = lookup(I18N[lang], path);
    if (value === undefined) value = lookup(I18N.nb, path);
    if (value === undefined) {
        console.error(`Missing translation: ${path}`);
        return path;
    }
    return String(value).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

// Renders "[a:14] + [b:8]" into coloured spans without using innerHTML.
function rich(el, str) {
    el.replaceChildren();
    const re = /\[([a-z]):([^\]]*)\]/g;
    let last = 0;
    for (let m = re.exec(str); m; m = re.exec(str)) {
        if (m.index > last) el.append(str.slice(last, m.index));
        const span = document.createElement('span');
        span.className = `hl hl-${m[1]}`;
        span.textContent = m[2];
        el.append(span);
        last = re.lastIndex;
    }
    if (last < str.length) el.append(str.slice(last));
}

// ---------- Small helpers ----------

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const range = (n) => Array.from({ length: n }, (_, i) => i);
const ids = (prefix, n) => range(n).map((i) => `${prefix}${i}`);
const tens = (n) => n - (n % 10);

// ---------- Scene renderer ----------
// A scene is { w, h, items }. Items are keyed by id; the renderer animates
// position, size, colour and opacity of items that live on between steps.

class Scene {
    constructor(svg) {
        this.svg = svg;
        this.nodes = new Map();
        const defs = document.createElementNS(SVG_NS, 'defs');
        for (const [key, color] of Object.entries(COLORS)) {
            const marker = document.createElementNS(SVG_NS, 'marker');
            marker.setAttribute('id', `ah-${key}`);
            marker.setAttribute('viewBox', '0 0 10 10');
            marker.setAttribute('refX', '7');
            marker.setAttribute('refY', '5');
            marker.setAttribute('markerWidth', '6');
            marker.setAttribute('markerHeight', '6');
            marker.setAttribute('orient', 'auto-start-reverse');
            const tip = document.createElementNS(SVG_NS, 'path');
            tip.setAttribute('d', 'M0,0 L10,5 L0,10 z');
            tip.setAttribute('fill', color);
            marker.append(tip);
            defs.append(marker);
        }
        svg.append(defs);
        this.layers = {};
        for (const name of ['back', 'mid', 'front']) {
            const g = document.createElementNS(SVG_NS, 'g');
            svg.append(g);
            this.layers[name] = g;
        }
    }

    create(item) {
        const tag = { rect: 'rect', text: 'text', path: 'path' }[item.kind];
        if (!tag) throw new Error(`Unknown scene item kind: ${item.kind}`);
        const el = document.createElementNS(SVG_NS, tag);
        el.setAttribute('class', { rect: 'u', text: 't', path: 'p' }[item.kind]);
        if (item.kind === 'rect') {
            el.setAttribute('width', '1');
            el.setAttribute('height', '1');
        }
        if (item.kind === 'path' && !item.dash) el.setAttribute('pathLength', '1');
        const layer = item.layer || (item.kind === 'text' ? 'front' : item.kind === 'path' ? 'back' : 'mid');
        this.layers[layer].append(el);
        return { el, kind: item.kind, removeTimer: 0 };
    }

    apply(node, item, initial) {
        const { el } = node;
        const s = el.style;
        s.opacity = item.op ?? 1;
        if (item.kind === 'rect') {
            const w = Math.max(item.w, 0.001);
            const h = Math.max(item.h, 0.001);
            s.transform = `translate(${item.x}px,${item.y}px) scale(${w},${h})`;
            s.fill = item.fill || 'none';
            el.setAttribute('rx', String((item.r || 0) / w));
            el.setAttribute('ry', String((item.r || 0) / h));
            if (item.stroke) {
                s.stroke = item.stroke;
                el.setAttribute('stroke-width', String(item.sw || 2));
                el.setAttribute('vector-effect', 'non-scaling-stroke');
                if (item.dash) el.setAttribute('stroke-dasharray', item.dash);
                else el.removeAttribute('stroke-dasharray');
            } else {
                s.stroke = 'none';
            }
        } else if (item.kind === 'text') {
            s.transform = `translate(${item.x}px,${item.y}px)`;
            s.fill = item.fill || TEXT;
            el.classList.toggle('plain', Boolean(item.plain));
            el.textContent = item.text;
            el.setAttribute('font-size', String(item.size || 20));
            el.setAttribute('text-anchor', item.anchor || 'middle');
        } else {
            s.transform = `translate(${item.x || 0}px,${item.y || 0}px)`;
            el.setAttribute('d', item.d);
            s.stroke = item.stroke || TEXT;
            el.setAttribute('stroke-width', String(item.sw || 2));
            if (item.dash) {
                el.setAttribute('stroke-dasharray', item.dash);
            } else {
                s.strokeDasharray = '1 1';
                s.strokeDashoffset = initial ? '1' : '0';
            }
            if (item.arrow) el.setAttribute('marker-end', `url(#ah-${item.arrow})`);
            else el.removeAttribute('marker-end');
        }
    }

    render(spec, instant) {
        this.svg.setAttribute('viewBox', `0 0 ${Math.round(spec.w)} ${Math.round(spec.h)}`);
        this.svg.style.maxWidth = `${Math.round(spec.w * 1.25)}px`;
        this.svg.classList.toggle('instant', instant);
        const seen = new Set();
        const fresh = [];
        for (const item of spec.items) {
            if (seen.has(item.id)) throw new Error(`Duplicate scene item id: ${item.id}`);
            seen.add(item.id);
            let node = this.nodes.get(item.id);
            if (node && node.kind !== item.kind) {
                node.el.remove();
                this.nodes.delete(item.id);
                node = null;
            }
            if (!node) {
                node = this.create(item);
                this.nodes.set(item.id, node);
                fresh.push([node, item]);
            }
            if (node.removeTimer) {
                clearTimeout(node.removeTimer);
                node.removeTimer = 0;
            }
        }
        if (fresh.length && !instant) {
            for (const [node, item] of fresh) {
                const start = item.from ? { ...item, ...item.from } : { ...item, op: 0 };
                this.apply(node, start, true);
            }
            this.svg.getBoundingClientRect();
        }
        for (const item of spec.items) this.apply(this.nodes.get(item.id), item, false);
        for (const [id, node] of this.nodes) {
            if (seen.has(id)) continue;
            if (instant) {
                node.el.remove();
                this.nodes.delete(id);
            } else if (!node.removeTimer) {
                node.el.style.opacity = '0';
                node.removeTimer = setTimeout(() => {
                    node.el.remove();
                    this.nodes.delete(id);
                }, 700);
            }
        }
        if (instant) {
            this.svg.getBoundingClientRect();
            requestAnimationFrame(() => this.svg.classList.remove('instant'));
        }
    }
}

function text(id, x, y, str, size = 20, fill = TEXT, anchor = 'middle') {
    return { id, kind: 'text', x, y, text: String(str), size, fill, anchor };
}

// The memory area holds numbers that are put away while something else is worked out. Every
// number gets its own box with a caption saying what it is. A number that is shown in the drawing
// keeps its id, so it flies into its box and back out again.
// Rule for strategies: memory holds exactly the numbers that are needed in a later step and are
// not visible in the drawing or in the current sum.
const MEM_H = 104;
const MEM_SLOT = 104;
const MEM_CAPTION = 140;

function memoryItems(mem, W, memW) {
    const x = (W - memW) / 2;
    const y = 8;
    const items = [
        { id: 'membox', kind: 'rect', layer: 'back', x, y, w: memW, h: 82, r: 12, fill: 'rgba(242,193,78,0.06)', stroke: '#f2c14e', sw: 2, dash: '8 6' },
        text('memcap', x + 16, y + 46, t('stage.memory'), 17, '#f2c14e', 'start')
    ];
    mem.forEach((m, i) => {
        const cx = x + MEM_CAPTION + i * MEM_SLOT + MEM_SLOT / 2 - 8;
        const col = COLORS[m.color] || TEXT;
        items.push({ id: `${m.id}chip`, kind: 'rect', layer: 'back', x: cx - 40, y: y + 8, w: 80, h: 42, r: 8, fill: '#262a31', stroke: col, sw: 2 });
        items.push(text(m.id, cx, y + 39, m.text, 26, col));
        items.push(text(`${m.id}why`, cx, y + 70, t(`mem.${m.why}`), 14, DIM));
    });
    return items;
}

// Gives every step the same viewBox and adds the memory box on top when any step uses it.
// All steps share one offset, so things that stay put between steps never slide sideways.
function normalizeSteps(steps) {
    const usesMem = steps.some((s) => s.memory.length);
    const memW = MEM_CAPTION + Math.max(1, ...steps.map((s) => s.memory.length)) * MEM_SLOT;
    const sceneW = Math.max(...steps.map((s) => s.scene.w));
    const W = Math.max(usesMem ? memW + 20 : 0, sceneW);
    const dy = usesMem ? MEM_H : 0;
    const H = Math.max(...steps.map((s) => s.scene.h)) + dy;
    const dx = (W - sceneW) / 2;
    for (const step of steps) {
        const items = step.scene.items.map((it) => {
            const out = { ...it, x: (it.x || 0) + dx, y: (it.y || 0) + dy };
            if (it.from) out.from = { ...it.from, x: (it.from.x ?? it.x ?? 0) + dx, y: (it.from.y ?? it.y ?? 0) + dy };
            return out;
        });
        if (usesMem) items.push(...memoryItems(step.memory, W, memW));
        step.scene = { w: W, h: H, items };
    }
    return steps;
}

// ---------- Ten-frames ----------
// Every number is drawn in ten-frames (2 rows of 5, top row first). The ones always share one
// frame, so they stay together, and filling a frame is the same as making a ten.
// Frames stack downwards in columns of five (50). Every full frame is a ten and gets a small grey
// counter badge (1, 2, 3 ...) on its left, so tens can be counted.
// A whole group sits in one box in the group's colour, with its number as a name tag on the box,
// so the number clearly belongs to the whole group and not to one frame.

const SLOT = 18;
const FRAME_W = 5 * SLOT + 6;
const FRAME_H = 2 * SLOT + 6;
const FRAME_GAP = 12;
const FRAMES_PER_COL = 5;
const ROW_H = FRAME_H + 10;
const BADGE = 24;
const GROUP_PAD = 10;
const TAB_H = 34;
const FRAME_GRID = (() => {
    let d = '';
    for (let i = 1; i < 5; i++) d += `M${3 + i * SLOT},4 L${3 + i * SLOT},${FRAME_H - 4} `;
    return `${d}M4,${3 + SLOT} L${FRAME_W - 4},${3 + SLOT}`;
})();

// slots (optional) is the full unit list the layout is made for; units not in it are left out,
// so the remaining units keep their places when some are taken away.
function layoutGroup(units, x0, top, slots = units) {
    const pos = new Map();
    const nf = Math.max(1, Math.ceil(slots.length / 10));
    const colW = BADGE + FRAME_W + FRAME_GAP;
    const frames = range(nf).map((k) => ({
        x: x0 + BADGE + Math.floor(k / FRAMES_PER_COL) * colW,
        y: top + (k % FRAMES_PER_COL) * ROW_H,
        full: false,
        used: false
    }));
    const present = new Set(units);
    const count = frames.map(() => 0);
    slots.forEach((id, i) => {
        if (!present.has(id)) return;
        const k = Math.floor(i / 10);
        const f = frames[k];
        const s = i % 10;
        f.used = true;
        count[k]++;
        pos.set(id, { x: f.x + 3 + (s % 5) * SLOT, y: f.y + 3 + Math.floor(s / 5) * SLOT });
    });
    frames.forEach((f, k) => { f.full = count[k] === 10; });
    if (!units.length) frames[0].used = true;
    const cols = Math.ceil(nf / FRAMES_PER_COL);
    return { pos, frames, w: cols * colW - FRAME_GAP, h: (Math.min(nf, FRAMES_PER_COL) - 1) * ROW_H + FRAME_H };
}

function cube(id, p, color, marks = {}) {
    const lifted = marks.lift?.has(id);
    const item = { id, kind: 'rect', unit: true, x: p.x + 2, y: p.y + 2 - (lifted ? 12 : 0), w: SLOT - 4, h: SLOT - 4, r: 3, fill: color, op: marks.dim?.has(id) ? 0.3 : 1 };
    if (lifted) Object.assign(item, { stroke: COLORS.d, sw: 3 });
    return item;
}

const unitColor = (id) => COLORS[id[0]];

// (x, top) is the outer corner of the group box. part.bare draws only the frames (used inside
// the sharing boxes, which are boxes themselves). Returns the outer size including the name tag.
function groupItems(part, x, top, colorOf, marks) {
    const pad = part.bare ? 0 : GROUP_PAD;
    const ix = x + pad;
    const iy = top + pad;
    const { pos, frames, w, h } = layoutGroup(part.units, ix, iy, part.slots);
    const col = COLORS[part.color] || TEXT;
    const items = part.units.map((id) => cube(id, pos.get(id), colorOf(id), marks));
    frames.forEach((f, k) => {
        if (!f.used) return;
        const fid = `${part.id}fr${k}`;
        items.push({ id: fid, kind: 'rect', layer: 'back', x: f.x, y: f.y, w: FRAME_W, h: FRAME_H, r: 6, fill: 'rgba(255,255,255,0.04)', stroke: '#4a505c', sw: 1.5, dash: part.loose ? '5 4' : null });
        items.push({ id: `${fid}g`, kind: 'path', layer: 'back', x: f.x, y: f.y, d: FRAME_GRID, stroke: '#3a3f48', sw: 1 });
        if (f.full && !part.loose) {
            items.push({ id: `${fid}nb`, kind: 'rect', layer: 'back', x: f.x - BADGE + 1, y: f.y + FRAME_H / 2 - 10, w: 20, h: 20, r: 10, fill: '#30343c' });
            items.push(text(`${fid}n`, f.x - BADGE + 11, f.y + FRAME_H / 2 + 5, k + 1, 13, DIM));
        }
    });
    const outerW = w + 2 * pad;
    const boxH = h + 2 * pad;
    // With fixed slots the box shrinks around the frames still in use; the units do not move.
    const used = frames.filter((f) => f.used);
    const bx0 = part.slots ? Math.min(...used.map((f) => f.x)) - BADGE - pad : x;
    const by0 = part.slots ? Math.min(...used.map((f) => f.y)) - pad : top;
    const bw = part.slots ? Math.max(...used.map((f) => f.x)) + FRAME_W + pad - bx0 : outerW;
    const bh = part.slots ? Math.max(...used.map((f) => f.y)) + FRAME_H + pad - by0 : boxH;
    if (!part.bare) {
        items.push({ id: `${part.id}box`, kind: 'rect', layer: 'back', x: bx0, y: by0, w: bw, h: bh, r: 12, fill: 'rgba(255,255,255,0.02)', stroke: col, sw: 2.5, dash: part.loose ? '6 5' : null });
    }
    if (part.label != null) {
        const str = String(part.label);
        const tabW = 22 + 15 * str.length;
        const tabY = by0 + bh - 6;
        items.push({ id: `${part.id}tab`, kind: 'rect', layer: 'back', x: bx0 + bw / 2 - tabW / 2, y: tabY, w: tabW, h: TAB_H, r: 9, fill: col });
        items.push({ ...text(`${part.id}L`, bx0 + bw / 2, tabY + 26, str, 26, '#16181d'), plain: true });
    }
    return { items, w: outerW, h: boxH + (part.label != null ? TAB_H : 0) };
}

// Outer size of a group of n units, without and with its name tag.
const groupW = (n) => layoutGroup(range(n), 0, 0).w + 2 * GROUP_PAD;
const groupH = (n) => layoutGroup(range(n), 0, 0).h + 2 * GROUP_PAD + TAB_H;
const BLOCKS_X = 20;
const BLOCKS_TOP = 24;
const OP_W = 34;
const PART_GAP = 22;
// x of the group that follows a group of n units and an operator.
const nextX = (n) => BLOCKS_X + groupW(n) + PART_GAP + OP_W;

// parts: [{ id, units, label, color, loose } | { op, id } | { at } | { row }]
// { at: x } moves on to x, { row: top } starts a new row at that top. Strategies use these to
// keep groups in the same place across steps, so numbers never slide past each other.
function blocksScene(parts, marks = {}) {
    const colorOf = marks.colorOf || unitColor;
    const items = [];
    let top = BLOCKS_TOP;
    let x = BLOCKS_X;
    let maxH = 0;
    let maxW = 0;
    for (const part of parts) {
        if (part.row != null) {
            top = part.row;
            x = BLOCKS_X;
            continue;
        }
        if (part.at != null) {
            x = Math.max(x, part.at);
            continue;
        }
        if (part.op) {
            items.push(text(part.id, x + 16, top + GROUP_PAD + FRAME_H / 2 + 12, part.op, 34, DIM));
            x += OP_W;
            continue;
        }
        const g = groupItems(part, x, top, colorOf, marks);
        items.push(...g.items);
        maxH = Math.max(maxH, top + g.h);
        x += g.w + PART_GAP;
        maxW = Math.max(maxW, x);
    }
    return { w: maxW, h: maxH + 14, items };
}

const grp = (id, units, label, color, extra = {}) => ({ id, units, label, color, ...extra });

// ---------- Brackets ----------
// A bracket marks which part of a drawing a number belongs to. Path coordinates are local,
// so brackets glide with the parts they belong to.

function bracket(id, side, x, y, w, h, label, colorKey) {
    const c = COLORS[colorKey] || TEXT;
    if (side === 'top') {
        return [
            { id: `${id}b`, kind: 'path', layer: 'front', x, y, d: `M0,-5 L0,-13 L${w},-13 L${w},-5`, stroke: c, sw: 2.5 },
            text(`${id}t`, x + w / 2, y - 22, label, 22, c)
        ];
    }
    if (side === 'bottom') {
        return [
            { id: `${id}b`, kind: 'path', layer: 'front', x, y: y + h, d: `M0,5 L0,13 L${w},13 L${w},5`, stroke: c, sw: 2.5 },
            text(`${id}t`, x + w / 2, y + h + 38, label, 22, c)
        ];
    }
    const left = side === 'left';
    const sx = left ? -1 : 1;
    const bx = left ? x : x + w;
    return [
        { id: `${id}b`, kind: 'path', layer: 'front', x: bx, y, d: `M${5 * sx},0 L${13 * sx},0 L${13 * sx},${h} L${5 * sx},${h}`, stroke: c, sw: 2.5 },
        text(`${id}t`, bx + 20 * sx, y + h / 2 + 8, label, 22, c, left ? 'end' : 'start')
    ];
}

// ---------- Number line ----------

const NICE_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

function lineRange(values) {
    const lo0 = Math.min(...values);
    const hi0 = Math.max(...values);
    const span = Math.max(hi0 - lo0, 5);
    const step = NICE_STEPS.find((s) => span / s <= 10) || 1000;
    return { lo: Math.floor(lo0 / step) * step, hi: Math.ceil(hi0 / step) * step, step };
}

class NumberLine {
    constructor(values, width = 860) {
        Object.assign(this, lineRange(values));
        if (this.hi === this.lo) this.hi = this.lo + this.step;
        this.W = width;
        this.pad = 40;
        this.y = 170;
    }

    x(v) {
        return this.pad + ((v - this.lo) / (this.hi - this.lo)) * (this.W - 2 * this.pad);
    }

    // jumps: [{ id, from, to, label, color, labelColor, below, size, dash, op }]
    // marks: { value: colorKey }, span: { from, to, label, color } drawn under the line
    scene(jumps, marker, marks = {}, span = null) {
        const { lo, hi, step, y } = this;
        const minor = NICE_STEPS.slice().reverse().find((s) => s <= step / 5 && (hi - lo) / s <= 100) || step;
        let d = `M${this.x(lo) - 10},${y} L${this.x(hi) + 10},${y}`;
        for (let v = lo; v <= hi; v += minor) {
            const major = v % step === 0;
            const half = !major && v % (minor * 5) === 0;
            const len = major ? 10 : half ? 7 : 4;
            d += ` M${this.x(v)},${y - len} L${this.x(v)},${y + len}`;
        }
        const items = [{ id: 'axis', kind: 'path', d, stroke: DIM, sw: 2 }];
        let depth = 60;
        const labels = new Map();
        for (let v = lo; v <= hi; v += step) labels.set(v, null);
        for (const [v, color] of Object.entries(marks)) labels.set(Number(v), color);
        const marked = [...labels].filter(([, c]) => c).map(([v]) => v).sort((p, q) => p - q);
        let prevX = -Infinity;
        let low = false;
        const markY = new Map();
        for (const v of marked) {
            low = this.x(v) - prevX < 30 ? !low : false;
            markY.set(v, low ? y + 62 : y + 38);
            prevX = this.x(v);
        }
        for (const [v, color] of labels) {
            if (!color && marked.some((m) => Math.abs(this.x(m) - this.x(v)) < 24)) continue;
            items.push(text(`nl${v}`, this.x(v), color ? markY.get(v) : y + 38, v, color ? 22 : 16, color ? COLORS[color] : DIM));
        }
        if (markY.size && Math.max(...markY.values()) > y + 38) depth = Math.max(depth, 80);
        for (const j of jumps) {
            const x1 = this.x(j.from);
            const x2 = this.x(j.to);
            const hgt = clamp(Math.abs(x2 - x1) * 0.45, 26, 120) * (j.below ? -1 : 1);
            const yEnd = y - (j.below ? -6 : 6);
            if (j.below) depth = Math.max(depth, -hgt + 40);
            items.push({
                id: j.id,
                kind: 'path',
                d: `M${x1},${yEnd} Q${(x1 + x2) / 2},${y - 2 * hgt} ${x2},${yEnd}`,
                stroke: COLORS[j.color],
                sw: 3,
                arrow: j.dash ? null : j.color,
                dash: j.dash,
                op: j.op ?? 1
            });
            if (j.label != null) {
                const lc = COLORS[j.labelColor || j.color];
                items.push({ ...text(`${j.id}L`, (x1 + x2) / 2, y - hgt - (j.below ? -24 : 8), j.label, j.size || 20, lc), op: j.op ?? 1 });
            }
        }
        if (span) {
            const x1 = this.x(span.from);
            const x2 = this.x(span.to);
            items.push(...bracket('span', 'bottom', x1, y + 42, x2 - x1, 0, span.label, span.color));
            depth = Math.max(depth, 96);
        }
        if (marker != null) {
            items.push({ id: 'marker', kind: 'rect', x: this.x(marker) - 9, y: y - 9, w: 18, h: 18, r: 9, fill: TEXT });
        }
        return { w: this.W, h: y + depth, items };
    }
}

// ---------- Area model ----------
// parts: [{ id, r, c, rows, cols, or, oc, color, op, dx, dy, label, cross, from, ghost,
//           top: [label, colorKey], left: [...], right: [...] }]
// With cells, every square is its own item keyed by its original row/col (or, oc),
// so squares keep their identity when the rectangle is cut and moved.
// Cells get an extra gap after every fifth row and column. Ghost parts only draw brackets.

function areaScene(parts, s, cells) {
    const g = cells ? Math.max(2, Math.round(s * 0.35)) : 0;
    const px = (i) => i * s + Math.floor(i / 5) * g;
    const items = [];
    let maxX = 0;
    let maxY = 0;
    for (const p of parts) {
        const dx = p.dx || 0;
        const dy = p.dy || 0;
        const x = AREA_PAD + px(p.c) + dx;
        const y = AREA_PAD + px(p.r) + dy;
        const w = px(p.c + p.cols - 1) + s - px(p.c);
        const h = px(p.r + p.rows - 1) + s - px(p.r);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
        const fill = COLORS[p.color];
        if (p.ghost) {
            // only brackets and labels
        } else if (cells) {
            const gap = s >= 10 ? 2 : 1;
            for (let i = 0; i < p.rows; i++) {
                for (let j = 0; j < p.cols; j++) {
                    items.push({
                        id: `c${(p.or ?? p.r) + i}_${(p.oc ?? p.c) + j}`,
                        kind: 'rect',
                        x: AREA_PAD + px(p.c + j) + dx + gap / 2,
                        y: AREA_PAD + px(p.r + i) + dy + gap / 2,
                        w: s - gap,
                        h: s - gap,
                        r: Math.min(3, s / 5),
                        fill,
                        op: p.op ?? 1
                    });
                }
            }
        } else {
            const item = { id: p.id, kind: 'rect', x, y, w, h, r: 4, fill, op: p.op ?? 1, stroke: 'rgba(0,0,0,0.35)', sw: 1 };
            if (p.from) item.from = { x: AREA_PAD + px(p.from.c), y: AREA_PAD + px(p.from.r), op: 1 };
            items.push(item);
        }
        if (p.cross) {
            items.push({ id: `${p.id}X`, kind: 'path', layer: 'front', x, y, d: `M0,0 L${w},${h} M${w},0 L0,${h}`, stroke: COLORS.x, sw: 3 });
        }
        const size = clamp(Math.min(w, h) / 2.6, 16, 34);
        if (p.label != null) items.push(text(`${p.id}L`, x + w / 2, y + h / 2 + size / 3, p.label, size));
        for (const side of ['top', 'left', 'right']) {
            if (p[side]) items.push(...bracket(`${p.id}${side}`, side, x, y, w, h, p[side][0], p[side][1]));
        }
    }
    return { w: maxX + AREA_PAD, h: maxY + AREA_PAD, items };
}

function cellSize(rows, cols) {
    const spread = (n) => n + (n / 5) * 0.35;
    return clamp(Math.floor(Math.min(600 / spread(cols), 300 / spread(rows))), 3, 34);
}

// ---------- Strategies ----------
// Each strategy has applies(a, b) and build(a, b) -> steps.
// A step is { scene, eq, think: [key, vars], ask: [key, vars] | null, scratch: [lines] }.
// Text keys are relative to I18N.*.s.<strategy id>.
// Colour rule: a coloured number in the equation or text always has the same colour as the
// part of the drawing it stands for (cubes, frame, bracket, jump or label). Numbers that are
// not drawn stay white.

// extra.minor marks a step that can be left out when only the main steps are shown; its small sums
// then move on to the next step, so the chain stays complete.
function step(scene, eq, think, extra = {}) {
    return { scene, eq, think, ask: extra.ask || null, scratch: extra.scratch || [], memory: extra.memory || [], minor: Boolean(extra.minor), short: extra.short || null, refs: extra.refs || null, subScene: extra.subScene || 'before', lineSums: Boolean(extra.lineSums || extra.plainSums), plainSums: Boolean(extra.plainSums), subsAfter: Boolean(extra.subsAfter) };
}

const opItem = (id, sign = '+') => ({ op: sign, id });

// --- Addition ---

const makeTen = {
    id: 'makeTen',
    applies: (a, b) => a % 10 > 0 && b % 10 > 0 && (a % 10) + (b % 10) >= 10 && a + b <= BLOCKS_MAX,
    build(a, b) {
        const recvIsB = b % 10 >= a % 10;
        const [r, g] = recvIsB ? [b, a] : [a, b];
        const [rc, gc] = recvIsB ? ['b', 'a'] : ['a', 'b'];
        const need = 10 - (r % 10);
        const rr = r + need;
        const g2 = g - need;
        const res = a + b;
        const A = ids('a', a);
        const B = ids('b', b);
        const [R, G] = recvIsB ? [B, A] : [A, B];
        const moved = G.slice(G.length - need);
        const kept = G.slice(0, G.length - need);
        const rx = recvIsB ? nextX(g) : BLOCKS_X;
        const sideBy = (gPart, rPart) => (recvIsB ? [gPart, opItem('op1'), { at: rx }, rPart] : [rPart, opItem('op1'), { at: nextX(r) }, gPart]);
        const eqOf = (gs, rs) => (recvIsB ? `${gs} + ${rs}` : `${rs} + ${gs}`);
        const v = { r, g, rc, gc, need, rr, g2, res, now: eqOf(`[${gc}:${g2}]`, `[d:${rr}]`), nowPlain: eqOf(g2, rr) };
        const start = sideBy(grp('G', G, g, gc), grp('R', R, r, rc));
        return [
            step(blocksScene(start), `[a:${a}] + [b:${b}]`, ['s0', v], { ask: ['a0', v], scratch: [`${r} + ${need} = ${rr}`], refs: [[unitsRef(R), unitsRef(moved)]] }),
            step(blocksScene(start, { lift: new Set(moved) }), `[a:${a}] + [b:${b}]`, ['s1', v], {
                minor: true,
                scratch: [`${g} − ${need} = ${g2}`],
                refs: [[unitsRef(G), unitsRef(moved)]],
                subScene: 'self',
                subsAfter: true,
                memory: [{ id: 'memten', text: rr, color: 'w', why: 'made' }]
            }),
            step(
                blocksScene(sideBy(grp('G', kept, g2, gc), grp('R', [...R, ...moved], rr, 'd'))),
                eqOf(`[${gc}:${g2}]`, `[d:${rr}]`),
                ['s2', v],
                { ask: ['a2', v] }
            ),
            step(
                blocksScene([{ at: rx }, grp('R', [...R, ...moved, ...kept], res, 'c')]),
                `[a:${a}] + [b:${b}] = [c:${res}]`,
                ['s3', v],
                { scratch: [`${g2} + ${rr} = ${res}`], refs: [[unitsRef(kept), unitsRef([...R, ...moved])]] }
            )
        ];
    }
};

const split = {
    id: 'split',
    applies: (a, b) => a >= 10 && b >= 10 && a + b <= BLOCKS_MAX,
    build(a, b) {
        const A = ids('a', a);
        const B = ids('b', b);
        const aT = tens(a);
        const bT = tens(b);
        const aO = a % 10;
        const bO = b % 10;
        const T = aT + bT;
        const O = aO + bO;
        const res = a + b;
        const v = { a, b, aT, bT, aO, bO, T, O, res };
        const At = A.slice(0, aT);
        const Ao = A.slice(aT);
        const Bt = B.slice(0, bT);
        const Bo = B.slice(bT);
        const bx = nextX(a);
        const onesRow = BLOCKS_TOP + groupH(Math.max(a, b, T)) + 20;
        const ones = (aPart, bPart) => [{ row: onesRow }, aPart, ...(bPart ? [opItem('op3'), { at: bx }, bPart] : [])];
        return [
            step(blocksScene([grp('A', A, a, 'a'), opItem('op1'), { at: bx }, grp('B', B, b, 'b')]), `[a:${a}] + [b:${b}]`, ['s0', v], {
                ask: ['a0', v],
                scratch: [`${a} = ${aT} + ${aO}`, `${b} = ${bT} + ${bO}`]
            }),
            step(
                blocksScene([grp('A', At, aT, 'a'), opItem('op1'), { at: bx }, grp('B', Bt, bT, 'b'), ...ones(grp('Ao', Ao, aO, 'a'), grp('Bo', Bo, bO, 'b'))]),
                `[a:${aT}] + [b:${bT}] + [a:${aO}] + [b:${bO}]`,
                ['s1', v],
                { minor: true }
            ),
            step(
                blocksScene([grp('A', [...At, ...Bt], T, 'w'), ...ones(grp('Ao', Ao, aO, 'a'), grp('Bo', Bo, bO, 'b'))]),
                `[w:${T}] + [a:${aO}] + [b:${bO}]`,
                ['s2', v],
                { ask: ['a3', v], scratch: [`${aT} + ${bT} = ${T}`], refs: [[unitsRef(At), unitsRef(Bt)]] }
            ),
            step(
                blocksScene([grp('A', [...At, ...Bt], null, 'w'), ...ones(grp('Ao', [...Ao, ...Bo], O, 'w'))], { dim: new Set([...At, ...Bt]) }),
                `[w:${T}] + [w:${O}]`,
                [O >= 10 ? 's3carry' : 's3', v],
                { scratch: [`${aO} + ${bO} = ${O}`], refs: [[unitsRef(Ao), unitsRef(Bo)]], memory: [{ id: 'AL', text: T, color: 'w', why: 'tens' }] }
            ),
            step(
                blocksScene([grp('A', [...At, ...Bt, ...Ao, ...Bo], res, 'c')]),
                `[a:${a}] + [b:${b}] = [c:${res}]`,
                ['s4', v],
                { scratch: [`${T} + ${O} = ${res}`], refs: [[unitsRef([...At, ...Bt]), unitsRef([...Ao, ...Bo])]] }
            )
        ];
    }
};

// Breaks the smaller number into easy jumps: hundreds, tens, up to the next ten, rest.
// Breaks the smaller number into jumps that are easy on a number line: 100 at a time, then 10 at a
// time (only the hundreds or tens digit goes up), then up to the next ten, then the rest.
function addJumps(start, n) {
    const out = [];
    let pos = start;
    const push = (j, kind) => {
        out.push({ from: pos, to: pos + j, j, kind });
        pos += j;
    };
    for (let k = 0; k < Math.floor(n / 100); k++) push(100, 'hundred');
    for (let k = 0; k < Math.floor((n % 100) / 10); k++) push(10, 'ten');
    const ones = n % 10;
    const toTen = (10 - (pos % 10)) % 10;
    if (toTen > 0 && ones > toTen) {
        push(toTen, 'toTen');
        push(ones - toTen, 'jump');
    } else if (ones > 0) {
        push(ones, ones === toTen ? 'toTen' : 'jump');
    }
    return out;
}

const jumps = {
    id: 'jumps',
    applies: (a, b) => Math.min(a, b) >= 1,
    build(a, b) {
        const swapped = a < b;
        const big = Math.max(a, b);
        const small = Math.min(a, b);
        const [bigC, smallC] = swapped ? ['b', 'a'] : ['a', 'b'];
        const res = a + b;
        const hops = addJumps(big, small);
        const line = new NumberLine([big, res]);
        const marks = { [big]: bigC };
        const shown = [];
        const leftChip = (n) => (n > 0 ? [{ id: 'memleft', text: n, color: smallC, why: 'left' }] : []);
        const plan = t(`s.jumps.plan.${hops[0].kind}`);
        const steps = [step(line.scene([], big, marks), `[a:${a}] + [b:${b}]`, [swapped ? 's0swap' : 's0', { start: big, sc: bigC, small, smc: smallC, plan }], {
            memory: leftChip(small)
        })];
        let left = small;
        let landed = null;
        hops.forEach((h, k) => {
            // Earlier jumps fade, so the jump being done now stands out.
            shown.forEach((j) => { j.op = 0.4; });
            const wide = line.x(h.to) - line.x(h.from) >= 34;
            shown.push({ id: `j${shown.length}`, from: h.from, to: h.to, label: wide ? `+${h.j}` : null, color: smallC });
            if (landed != null) marks[landed] = 'm';
            marks[h.to] = 'd';
            landed = h.to;
            left -= h.j;
            steps[steps.length - 1].ask = ['aj', { j: h.j }];
            // In a run of equal jumps (10, 10, 10) all but the last can be left out when only the main
            // steps are shown; their sums move on to the last one.
            const repeat = (h.kind === 'ten' || h.kind === 'hundred') && hops[k + 1]?.kind === h.kind;
            let runStart = k;
            while (runStart > 0 && hops[runStart - 1].kind === h.kind && (h.kind === 'ten' || h.kind === 'hundred')) runStart--;
            const run = k - runStart + 1;
            const short = run > 1
                ? [left > 0 ? 'runL' : 'run', { j: h.j, n: run, from: hops[runStart].from, to: h.to, total: run * h.j, left, smc: smallC }]
                : null;
            steps.push(step(
                line.scene(shown.map((j) => ({ ...j })), h.to, { ...marks }),
                left > 0 ? `[d:${h.to}] + [${smallC}:${left}]` : `[d:${h.to}]`,
                [left > 0 ? `${h.kind}L` : h.kind, { j: h.j, from: h.from, to: h.to, left, smc: smallC }],
                {
                    minor: repeat,
                    short,
                    scratch: [`${h.from} + ${h.j} = ${h.to}`],
                    refs: [[itemsRef([`nl${h.from}`], h.from), itemsRef([`j${shown.length - 1}L`], h.j)]],
                    subScene: 'self',
                    lineSums: true,
                    memory: leftChip(left)
                }
            ));
        });
        shown.forEach((j) => { j.op = 1; });
        marks[landed] = 'm';
        marks[res] = 'c';
        steps.push(step(
            line.scene(shown.map((j) => ({ ...j })), res, { ...marks }, { from: big, to: res, label: small, color: smallC }),
            `[a:${a}] + [b:${b}] = [c:${res}]`,
            ['end', { res, small, smc: smallC }]
        ));
        return steps;
    }
};

const compensate = {
    id: 'compensate',
    pick(a, b) {
        for (const want of [9, 8]) {
            if (b % 10 === want && a >= 1) return { x: b, y: a, xc: 'b' };
            if (a % 10 === want && b >= 1) return { x: a, y: b, xc: 'a' };
        }
        return null;
    },
    applies(a, b) {
        return this.pick(a, b) !== null;
    },
    build(a, b) {
        const { x, y, xc } = this.pick(a, b);
        const up = 10 - (x % 10);
        const xu = x + up;
        const big = y + xu;
        const res = a + b;
        const yc = xc === 'a' ? 'b' : 'a';
        const line = new NumberLine([y, big]);
        const v = { x, y, xc, yc, up, xu, big, res };
        const hard = (op) => ({ id: 'jx', from: y, to: res, label: `+${x}`, color: xc, dash: '6 6', op, below: true });
        const j1 = { id: 'j0', from: y, to: big, label: `+${xu}`, color: 'd' };
        const j2 = { id: 'j1', from: big, to: res, label: `−${up}`, color: 'x' };
        const yFirst = (xs) => (xc === 'b' ? `[a:${y}] + ${xs}` : `${xs} + [b:${y}]`);
        return [
            step(line.scene([hard(1)], y, { [y]: yc }), `[a:${a}] + [b:${b}]`, ['s0', v], { scratch: [`${x} = ${xu} − ${up}`] }),
            step(line.scene([hard(0.25), j1], big, { [y]: yc, [big]: 'd' }), `${yFirst(`[d:${xu}]`)} = [d:${big}]`, ['s1', v], {
                ask: ['a1', v],
                scratch: [`${y} + ${xu} = ${big}`],
                refs: [[itemsRef([`nl${y}`], y), itemsRef(['j0L'], xu)]],
                subScene: 'self',
                lineSums: true,
                memory: [{ id: 'memup', text: up, color: 'x', why: 'over' }]
            }),
            step(line.scene([hard(0.25), j1, j2], res, { [y]: yc, [big]: 'd', [res]: 'c' }), `[d:${big}] − [x:${up}] = [c:${res}]`, ['s2', v], {
                scratch: [`${big} − ${up} = ${res}`],
                refs: [[itemsRef([`nl${big}`], big), itemsRef(['j1L'], up)]],
                subScene: 'self',
                lineSums: true
            }),
            step(line.scene([hard(1)], res, { [y]: yc, [res]: 'c' }), `[a:${a}] + [b:${b}] = [c:${res}]`, ['s3', v])
        ];
    }
};

const doubles = {
    id: 'doubles',
    applies: (a, b) => Math.abs(a - b) <= 2 && Math.min(a, b) >= 2 && a + b <= 100,
    build(a, b) {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const diff = hi - lo;
        const dbl = lo * 2;
        const res = a + b;
        const hiIsA = a > b;
        const [lc, hc] = hiIsA ? ['b', 'a'] : ['a', 'b'];
        const A = ids('a', a);
        const B = ids('b', b);
        const extra = (hiIsA ? A : B).slice(lo);
        const Am = hiIsA ? A.slice(0, lo) : A;
        const Bm = hiIsA ? B : B.slice(0, lo);
        const v = { lo, hi, diff, dbl, res, lc, hc };
        const bx = nextX(a);
        const below = [{ row: BLOCKS_TOP + groupH(Math.max(a, b, dbl)) + 20 }, { at: hiIsA ? BLOCKS_X : bx }];
        const steps = [
            step(blocksScene([grp('A', A, a, 'a'), opItem('op1'), { at: bx }, grp('B', B, b, 'b')]), `[a:${a}] + [b:${b}]`, [diff ? 's0' : 's0same', v], { ask: ['a0', v] })
        ];
        if (diff) {
            steps.push(step(
                blocksScene([grp('A', Am, lo, 'a'), opItem('op1'), { at: bx }, grp('B', Bm, lo, 'b'), ...below, grp('X', extra, diff, 'd')]),
                `[a:${lo}] + [b:${lo}] + [d:${diff}]`,
                ['s1', v],
                { minor: true, scratch: [`${hi} = ${lo} + ${diff}`] }
            ));
            steps.push(step(
                blocksScene([grp('A', [...Am, ...Bm], dbl, 'w'), ...below, grp('X', extra, null, 'd')], { dim: new Set(extra) }),
                `[w:${dbl}] + [d:${diff}]`,
                ['s2', v],
                { scratch: [`${lo} + ${lo} = ${dbl}`], refs: [[unitsRef(Am), unitsRef(Bm)]], memory: [{ id: 'XL', text: diff, color: 'd', why: 'extra' }] }
            ));
        }
        steps.push(step(
            blocksScene([grp('A', [...Am, ...Bm, ...extra], res, 'c')]),
            `[a:${a}] + [b:${b}] = [c:${res}]`,
            [diff ? 's3' : 'sSame', v],
            {
                scratch: [diff ? `${dbl} + ${diff} = ${res}` : `${lo} + ${lo} = ${dbl}`],
                refs: [diff ? [unitsRef([...Am, ...Bm]), unitsRef(extra)] : [unitsRef(A), unitsRef(B)]]
            }
        ));
        return steps;
    }
};

// --- Subtraction ---

// Takes b away from a in ten-frames: whole tens first, then the ones. When there are not enough ones,
// the ones there are go first and the rest is taken from a ten.
const takeAway = {
    id: 'takeAway',
    applies: (a, b) => b >= 1 && a > b && a >= 10 && a <= BLOCKS_MAX,
    build(a, b) {
        const A = ids('a', a);
        const aT = tens(a);
        const aO = a % 10;
        const bT = tens(b);
        const bO = b % 10;
        const res = a - b;
        const tensIds = A.slice(0, aT);
        const onesIds = A.slice(aT);
        let units = A.slice();
        const leftChip = (n) => (n > 0 ? [{ id: 'memtake', text: n, color: 'w', why: 'takeLeft' }] : []);
        const sceneOf = (removing, label, color = 'a') => blocksScene(
            [grp('A', units, label, color)],
            { colorOf: (id) => (removing.has(id) ? COLORS.x : COLORS.a), dim: removing }
        );
        const plan = t(`s.takeAway.plan.${bT ? 'tens' : 'ones'}`);
        const steps = [step(sceneOf(new Set(), a), `[a:${a}] − ${b}`, ['s0', { a, b, plan }], { ask: ['a0', { b }], memory: leftChip(b) })];
        let cur = a;
        let left = b;
        const take = (removeIds, key, vars) => {
            const n = removeIds.length;
            left -= n;
            const removing = new Set(removeIds);
            steps.push(step(sceneOf(removing, cur), `[a:${cur}] − [x:${n}]`, [key, { ...vars, n, from: cur, to: cur - n, left }], {
                scratch: [`${cur} − ${n} = ${cur - n}`],
                refs: [[unitsRef(units), unitsRef(removeIds)]],
                subScene: 'self',
                subsAfter: true,
                memory: leftChip(left)
            }));
            units = units.filter((id) => !removing.has(id));
            cur -= n;
        };
        if (bT) take(tensIds.slice(aT - bT), left - bT > 0 ? 'tensL' : 'tens', {});
        if (bO && bO <= aO) take(onesIds.slice(aO - bO), 'ones', {});
        if (bO > aO) {
            if (aO) take(onesIds, 'onesSome', {});
            take(units.slice(-(bO - aO)), 'fromTen', {});
        }
        steps.push(step(sceneOf(new Set(), res, 'c'), `[a:${a}] − ${b} = [c:${res}]`, ['end', { res }]));
        return steps;
    }
};

// Jumps back on the number line: 100 or 10 at a time, then down to the ten, then the rest.
function subJumps(start, n) {
    const out = [];
    let pos = start;
    const push = (j, kind) => {
        out.push({ from: pos, to: pos - j, j, kind });
        pos -= j;
    };
    for (let k = 0; k < Math.floor(n / 100); k++) push(100, 'hundred');
    for (let k = 0; k < Math.floor((n % 100) / 10); k++) push(10, 'ten');
    const ones = n % 10;
    const down = pos % 10;
    if (down > 0 && ones > down) {
        push(down, 'toTen');
        push(ones - down, 'jump');
    } else if (ones > 0) {
        push(ones, ones === down ? 'toTen' : 'jump');
    }
    return out;
}

// Shared by the jump strategies: one step per jump, earlier jumps fade, landing spots turn grey,
// and a run of equal jumps can be folded into one step.
function jumpSteps(steps, line, hops, marks, opts) {
    const shown = [];
    let landed = null;
    hops.forEach((h, k) => {
        shown.forEach((j) => { j.op = 0.4; });
        const wide = Math.abs(line.x(h.to) - line.x(h.from)) >= 34;
        shown.push({ id: `j${shown.length}`, from: h.from, to: h.to, label: wide ? `${opts.sign}${h.j}` : null, color: opts.color });
        if (landed != null) marks[landed] = 'm';
        marks[h.to] = opts.landKey(h.to);
        landed = h.to;
        const v = opts.vars(h, k);
        steps[steps.length - 1].ask = [opts.ask, { j: h.j }];
        const steady = h.kind === 'ten' || h.kind === 'hundred';
        let runStart = k;
        while (steady && runStart > 0 && hops[runStart - 1].kind === h.kind) runStart--;
        const run = k - runStart + 1;
        steps.push(step(
            line.scene(shown.map((j) => ({ ...j })), h.to, { ...marks }),
            opts.eq(h, v),
            [opts.key(h, v), v],
            {
                minor: steady && hops[k + 1]?.kind === h.kind,
                short: run > 1 ? [opts.runKey(v), { ...v, n: run, from: hops[runStart].from, total: run * h.j }] : null,
                scratch: [`${h.from} ${opts.op} ${h.j} = ${h.to}`],
                refs: [[itemsRef([`nl${h.from}`], h.from), itemsRef([`j${shown.length - 1}L`], h.j)]],
                subScene: 'self',
                lineSums: true,
                memory: opts.memory(v)
            }
        ));
    });
    shown.forEach((j) => { j.op = 1; });
    if (landed != null) marks[landed] = 'm';
    return shown;
}

const jumpsBack = {
    id: 'jumpsBack',
    applies: (a, b) => b >= 1 && a > b,
    build(a, b) {
        const res = a - b;
        const hops = subJumps(a, b);
        const line = new NumberLine([res, a]);
        const marks = { [a]: 'a' };
        const leftChip = (n) => (n > 0 ? [{ id: 'memleft', text: n, color: 'b', why: 'left' }] : []);
        const plan = t(`s.jumpsBack.plan.${hops[0].kind}`);
        const steps = [step(line.scene([], a, marks), `[a:${a}] − [b:${b}]`, ['s0', { a, b, plan }], { memory: leftChip(b) })];
        let left = b;
        const shown = jumpSteps(steps, line, hops, marks, {
            sign: '−',
            op: '−',
            color: 'b',
            ask: 'aj',
            landKey: () => 'd',
            vars: (h) => {
                left -= h.j;
                return { j: h.j, from: h.from, to: h.to, left };
            },
            key: (h, v) => (v.left > 0 ? `${h.kind}L` : h.kind),
            runKey: (v) => (v.left > 0 ? 'runL' : 'run'),
            eq: (h, v) => (v.left > 0 ? `[d:${h.to}] − [b:${v.left}]` : `[d:${h.to}]`),
            memory: (v) => leftChip(v.left)
        });
        marks[res] = 'c';
        steps.push(step(
            line.scene(shown, res, { ...marks }, { from: res, to: a, label: b, color: 'b' }),
            `[a:${a}] − [b:${b}] = [c:${res}]`,
            ['end', { res, b }]
        ));
        return steps;
    }
};

// Counts up from the smaller number to the bigger one. The jumps together are the answer.
const countUp = {
    id: 'countUp',
    applies: (a, b) => b >= 1 && a > b,
    build(a, b) {
        const res = a - b;
        const hops = [];
        let pos = b;
        const push = (j, kind) => {
            hops.push({ from: pos, to: pos + j, j, kind });
            pos += j;
        };
        const up = (10 - (b % 10)) % 10;
        if (up > 0 && b + up <= a && a - b > up) push(up, 'toTen');
        while (a - pos >= 100) push(100, 'hundred');
        while (a - pos >= 10) push(10, 'ten');
        if (a > pos) push(a - pos, 'jump');
        const line = new NumberLine([b, a]);
        const marks = { [b]: 'b', [a]: 'a' };
        const totalChip = (n) => (n > 0 ? [{ id: 'memtotal', text: n, color: 'c', why: 'jumped' }] : []);
        const steps = [step(line.scene([], b, marks), `[a:${a}] − [b:${b}]`, ['s0', { a, b }], { ask: ['a0', { a, b }] })];
        let total = 0;
        const shown = jumpSteps(steps, line, hops, marks, {
            sign: '+',
            op: '+',
            color: 'c',
            ask: 'aj',
            landKey: (v) => (v === a ? 'a' : 'd'),
            vars: (h) => {
                total += h.j;
                return { j: h.j, from: h.from, to: h.to, total, a };
            },
            key: (h) => (h.to === a ? 'last' : h.kind),
            runKey: (v) => (v.to === a ? 'runLast' : 'run'),
            eq: (h, v) => (h.to === a ? `[a:${h.to}]` : `[d:${h.to}]`),
            memory: (v) => totalChip(v.total)
        });
        marks[a] = 'a';
        steps.push(step(
            line.scene(shown, a, { ...marks }, { from: b, to: a, label: res, color: 'c' }),
            `[a:${a}] − [b:${b}] = [c:${res}]`,
            ['end', { a, b, res }],
            { scratch: hops.length > 1 ? [`${hops.map((h) => h.j).join(' + ')} = ${res}`] : [] }
        ));
        return steps;
    }
};

// Takes away a round number that is a bit too big, then adds back what was taken too much.
const compensateSub = {
    id: 'compensateSub',
    pick(a, b) {
        if (![8, 9].includes(b % 10)) return null;
        const up = 10 - (b % 10);
        return b + up <= a ? { up, bu: b + up } : null;
    },
    applies(a, b) {
        return this.pick(a, b) !== null;
    },
    build(a, b) {
        const { up, bu } = this.pick(a, b);
        const big = a - bu;
        const res = a - b;
        const line = new NumberLine([big, a]);
        const v = { a, b, up, bu, big, res };
        const hard = (op) => ({ id: 'jx', from: a, to: res, label: `−${b}`, color: 'b', dash: '6 6', op, below: true });
        const j1 = { id: 'j0', from: a, to: big, label: `−${bu}`, color: 'd' };
        const j2 = { id: 'j1', from: big, to: res, label: `+${up}`, color: 'x' };
        return [
            step(line.scene([hard(1)], a, { [a]: 'a' }), `[a:${a}] − [b:${b}]`, ['s0', v], { scratch: [`${b} = ${bu} − ${up}`] }),
            step(line.scene([hard(0.25), j1], big, { [a]: 'a', [big]: 'd' }), `[a:${a}] − [d:${bu}] = [d:${big}]`, ['s1', v], {
                ask: ['a1', v],
                scratch: [`${a} − ${bu} = ${big}`],
                refs: [[itemsRef([`nl${a}`], a), itemsRef(['j0L'], bu)]],
                subScene: 'self',
                lineSums: true,
                memory: [{ id: 'memup', text: up, color: 'x', why: 'tooMuch' }]
            }),
            step(line.scene([hard(0.25), j1, j2], res, { [a]: 'a', [big]: 'd', [res]: 'c' }), `[d:${big}] + [x:${up}] = [c:${res}]`, ['s2', v], {
                scratch: [`${big} + ${up} = ${res}`],
                refs: [[itemsRef([`nl${big}`], big), itemsRef(['j1L'], up)]],
                subScene: 'self',
                lineSums: true
            }),
            step(line.scene([hard(1)], res, { [a]: 'a', [res]: 'c' }), `[a:${a}] − [b:${b}] = [c:${res}]`, ['s3', v])
        ];
    }
};

// --- Prime numbers ---

const isPrime = (n) => n >= 2 && range(Math.floor(Math.sqrt(n)) - 1).every((i) => n % (i + 2) !== 0);
const primesUpTo = (n) => range(n + 1).filter(isPrime);

// n cubes in `rows` rows, filled column by column, so every full column holds one cube per row.
// Cubes that do not fill a whole column are left over (red). rows = 1 is one long row.
// A loose pile of n cubes (a sunflower spiral), before they are put in rows.
function pileScene(n) {
    const cell = 22;
    const R = Math.sqrt(n) * cell * 0.62 + cell;
    const cx = AREA_PAD + R;
    const cy = AREA_PAD + R;
    const items = range(n).map((i) => {
        const r = Math.sqrt(i + 0.5) * cell * 0.62;
        const a = i * 2.39996;
        return { id: `u${i}`, kind: 'rect', x: cx + r * Math.cos(a) - (cell - 4) / 2, y: cy + r * Math.sin(a) - (cell - 4) / 2, w: cell - 4, h: cell - 4, r: 4, fill: COLORS.a };
    });
    return { w: 2 * (AREA_PAD + R), h: 2 * (AREA_PAD + R), items };
}

function primeScene(n, rows, look = {}) {
    const cols = Math.ceil(n / rows);
    const full = Math.floor(n / rows);
    const left = n - full * rows;
    const cell = clamp(Math.floor(Math.min(760 / cols, 300 / rows)), 6, 34);
    const x0 = AREA_PAD;
    const y0 = AREA_PAD;
    const items = range(n).map((i) => {
        const c = Math.floor(i / rows);
        const over = c >= full;
        return {
            id: `u${i}`,
            kind: 'rect',
            x: x0 + c * cell + 1,
            y: y0 + (i % rows) * cell + 1,
            w: cell - 2,
            h: cell - 2,
            r: Math.min(4, cell / 5),
            fill: over ? COLORS.x : COLORS[look.color || 'a']
        };
    });
    if ((rows > 1 || look.row) && full > 0) {
        const fw = full * cell;
        const fh = rows * cell;
        const key = left ? 'd' : 'c';
        items.push({ id: 'pframe', kind: 'rect', layer: 'front', x: x0 - 4, y: y0 - 4, w: fw + 8, h: fh + 8, r: 8, stroke: COLORS[key], sw: 3 });
        items.push(...bracket('prow', 'left', x0 - 4, y0, fw, fh, rows, key));
        items.push(...bracket('pcol', 'top', x0, y0 - 4, fw, fh, full, key));
    }
    return { w: x0 + cols * cell + AREA_PAD, h: y0 + rows * cell + AREA_PAD, items };
}

const digitSum = (n) => String(n).split('').reduce((sum, d) => sum + Number(d), 0);

// Is n a prime? Try to lay the cubes out in 2, 3, 5, 7 ... rows (only primes are needed), and stop
// when the next prime times itself is bigger than n.
const tryDivide = {
    id: 'tryDivide',
    applies: (n) => n >= 2,
    build(n) {
        const v = { n };
        const steps = [step(pileScene(n), `[a:${n}]`, ['s0', v], { ask: ['a0', v] })];
        const tries = primesUpTo(Math.floor(Math.sqrt(n)));
        const next = primesUpTo(n + 1).find((p) => p * p > n) ?? 2;
        steps.push(step(pileScene(n), `[a:${n}]`, [tries.length ? 'plan' : 'planNone', { n, list: tries.join(', '), p: next, pp: next * next }], {
            scratch: [`${next} × ${next} = ${next * next}`],
            plainSums: true
        }));
        for (const p of tries) {
            const q = Math.floor(n / p);
            const r = n - p * q;
            const hint = p === 2 ? (r ? 'hint2' : 'hint2yes') : p === 3 ? (r ? 'hint3' : 'hint3yes') : p === 5 ? (r ? 'hint5' : 'hint5yes') : null;
            const pv = { n, p, q, r, pq: p * q, s: digitSum(n), last: n % 10, hint: hint ? ` ${t(`s.tryDivide.${hint}`, { n, s: digitSum(n), last: n % 10 })}` : '' };
            steps[steps.length - 1].ask = ['aTry', pv];
            if (r) {
                steps.push(step(primeScene(n, p), `${n} : ${p} = [d:${q}] ${t('stage.rest')} [x:${r}]`, ['tryNo', pv], {
                    scratch: [`${p} × ${q} = ${p * q}`, `${n} − ${p * q} = ${r}`],
                    plainSums: true
                }));
                continue;
            }
            steps.push(step(primeScene(n, p), `[a:${n}] = [c:${p} × ${q}]`, ['tryYes', pv], { scratch: [`${p} × ${q} = ${n}`], plainSums: true }));
            steps.push(step(primeScene(n, p, { color: 'c' }), `[c:${n}] = [c:${p} × ${q}]`, ['notPrime', pv]));
            return steps;
        }
        if (tries.length) {
            steps.push(step(pileScene(n), `[a:${n}]`, ['stop', { n, p: next, pp: next * next }], { scratch: [`${next} × ${next} = ${next * next}`], plainSums: true }));
        }
        steps.push(step(primeScene(n, 1, { color: 'c', row: true }), `[c:${n}] = [c:1 × ${n}]`, ['isPrime', v]));
        return steps;
    }
};

// The sieve of Eratosthenes: write the numbers in a grid, cross out 1, then for every prime cross
// out the rest of its times table. What is left are the primes.
const SIEVE_MAX = 100;
const sieve = {
    id: 'sieve',
    applies: (n) => n >= 2 && n <= SIEVE_MAX,
    build(n) {
        const N = Math.max(30, Math.ceil(n / 10) * 10);
        const CELL = 56;
        const state = new Map(range(N).map((i) => [i + 1, 'open']));
        const sceneOf = (now = new Set()) => {
            const items = [];
            for (let k = 1; k <= N; k++) {
                const x = AREA_PAD + ((k - 1) % 10) * CELL;
                const y = AREA_PAD + Math.floor((k - 1) / 10) * CELL;
                const st = now.has(k) ? 'now' : state.get(k);
                const fill = { open: '#262a31', prime: 'rgba(67,209,122,0.22)', out: '#1b1d22', now: 'rgba(255,90,95,0.35)' }[st];
                const stroke = k === n ? COLORS.a : st === 'prime' ? COLORS.c : st === 'now' ? COLORS.x : '#30343c';
                items.push({ id: `sv${k}`, kind: 'rect', x: x + 2, y: y + 2, w: CELL - 4, h: CELL - 4, r: 8, fill, stroke, sw: k === n ? 4 : 2 });
                const color = st === 'out' ? '#4a505c' : st === 'prime' ? COLORS.c : st === 'now' ? COLORS.x : TEXT;
                items.push({ ...text(`st${k}`, x + CELL / 2, y + CELL / 2 + 8, k, 22, color), plain: true });
            }
            return { w: AREA_PAD * 2 + 10 * CELL, h: AREA_PAD * 2 + (N / 10) * CELL, items };
        };
        const v = { n, N };
        const steps = [step(sceneOf(), `[a:${n}]`, ['s0', v], { ask: ['a0', v] })];
        state.set(1, 'out');
        steps.push(step(sceneOf(new Set([1])), `1`, ['one', v]));
        let struck = null;
        for (const p of primesUpTo(N)) {
            if (p * p > N) {
                for (const [k, st] of state) if (st === 'open') state.set(k, 'prime');
                steps.push(step(sceneOf(), `[c:${p}] × [c:${p}] = ${p * p}`, ['stop', { p, pp: p * p, N }], { scratch: [`${p} × ${p} = ${p * p}`], plainSums: true }));
                break;
            }
            state.set(p, 'prime');
            const multiples = range(Math.floor(N / p) - 1).map((i) => (i + 2) * p).filter((k) => state.get(k) !== 'out');
            const now = new Set(multiples);
            if (now.has(n)) struck = p;
            const pv = { p, list: multiples.slice(0, 4).join(', '), n };
            steps.push(step(sceneOf(now), `[c:${p}]`, [now.has(n) ? 'crossN' : 'cross', pv], {
                scratch: multiples.length ? [`${p}-${t('s.sieve.table')}: ${multiples.slice(0, 5).join(', ')}${multiples.length > 5 ? ' …' : ''}`] : []
            }));
            for (const k of multiples) state.set(k, 'out');
        }
        const prime = isPrime(n);
        steps.push(step(sceneOf(), prime ? `[c:${n}]` : `[a:${n}]`, [prime ? 'isPrime' : 'notPrime', { n, p: struck, q: struck ? n / struck : 0 }]));
        return steps;
    }
};

// --- Even and odd ---
// n cubes as dominoes: two cubes on top of each other make a pair. Five pairs make a ten, so the
// tens sit in blocks of 2 × 5, five blocks per band. An odd cube out sits alone on top (red).
// More cubes than this do not fit in the drawing; bigger numbers only get the rule.
const PAIRS_MAX = 200;
const PAIR_CELL = 22;
const PAIR_BLOCK_GAP = 18;
const PAIR_BAND_GAP = 34;
const PAIR_BLOCKS_PER_BAND = 5;

function pairScene(n, look = {}) {
    const C = PAIR_CELL;
    const blockW = 5 * C;
    const blockAt = (b) => ({
        x: AREA_PAD + (b % PAIR_BLOCKS_PER_BAND) * (blockW + PAIR_BLOCK_GAP),
        y: AREA_PAD + Math.floor(b / PAIR_BLOCKS_PER_BAND) * (2 * C + PAIR_BAND_GAP)
    });
    const ones = n % 10;
    const fullBlocks = Math.floor(n / 10);
    const odd = n % 2 === 1;
    const items = range(n).map((i) => {
        const k = Math.floor(i / 2);
        const at = blockAt(Math.floor(k / 5));
        const alone = odd && i === n - 1;
        const half = i % 2 ? 'b' : 'a';
        const fill = alone && look.alone !== false ? COLORS.x : COLORS[look.halves ? half : look.color || 'a'];
        return { id: `u${i}`, kind: 'rect', x: at.x + (k % 5) * C + 2, y: at.y + (i % 2) * C + 2, w: C - 4, h: C - 4, r: 4, fill };
    });
    const pairCount = Math.floor(n / 2);
    const pairFrom = look.pairs === 'ones' ? fullBlocks * 5 : 0;
    if (look.pairs) {
        for (let k = pairFrom; k < pairCount; k++) {
            const at = blockAt(Math.floor(k / 5));
            items.push({ id: `pr${k}`, kind: 'rect', layer: 'front', x: at.x + (k % 5) * C, y: at.y, w: C, h: 2 * C, r: 6, stroke: COLORS.d, sw: 2 });
        }
    }
    if (look.tens) {
        for (let b = 0; b < fullBlocks; b++) {
            const at = blockAt(b);
            items.push({ id: `tf${b}`, kind: 'rect', layer: 'front', x: at.x - 4, y: at.y - 4, w: blockW + 8, h: 2 * C + 8, r: 8, stroke: COLORS.e, sw: 3 });
        }
    }
    if (look.ones && ones) {
        const at = blockAt(fullBlocks);
        const w = Math.ceil(ones / 2) * C;
        items.push({ id: 'of', kind: 'rect', layer: 'front', x: at.x - 4, y: at.y - 4, w: w + 8, h: 2 * C + 8, r: 8, stroke: COLORS.b, sw: 3 });
    }
    const blocks = Math.ceil(n / 10);
    const bands = Math.ceil(blocks / PAIR_BLOCKS_PER_BAND);
    const cols = Math.min(blocks, PAIR_BLOCKS_PER_BAND);
    return {
        w: AREA_PAD * 2 + cols * blockW + (cols - 1) * PAIR_BLOCK_GAP,
        h: AREA_PAD * 2 + bands * 2 * C + (bands - 1) * PAIR_BAND_GAP,
        items
    };
}

// The rule to remember: even numbers end in 0, 2, 4, 6 or 8. The number is shown digit by digit,
// with the last digit framed, above the ten digits 0-9 sorted into even (green) and odd (red).
function digitsScene(n, look = {}) {
    const ROW_TILE = 52;
    const ROW_STEP = 58;
    const rowW = 9 * ROW_STEP + ROW_TILE;
    const TILE = 64;
    const STEP = 72;
    const digits = String(n).split('');
    const numW = (digits.length - 1) * STEP + TILE;
    const x0 = AREA_PAD + (rowW - numW) / 2;
    const y0 = AREA_PAD;
    const o = n % 10;
    const done = look.result;
    const resultColor = n % 2 ? COLORS.x : COLORS.c;
    const items = digits.flatMap((d, i) => {
        const lastOne = i === digits.length - 1;
        const x = x0 + i * STEP;
        const color = done ? resultColor : lastOne ? COLORS.b : COLORS.a;
        return [
            { id: `dg${i}`, kind: 'rect', x, y: y0, w: TILE, h: TILE, r: 12, fill: '#262a31', stroke: lastOne ? COLORS.b : '#30343c', sw: lastOne ? 4 : 2 },
            { ...text(`dt${i}`, x + TILE / 2, y0 + TILE / 2 + 14, d, 40, color), plain: true }
        ];
    });
    let h = y0 + TILE + AREA_PAD;
    if (look.row) {
        const ry = y0 + TILE + 56;
        for (let d = 0; d <= 9; d++) {
            const x = AREA_PAD + d * ROW_STEP;
            const c = d % 2 ? COLORS.x : COLORS.c;
            const hit = d === o;
            items.push({ id: `rd${d}`, kind: 'rect', x, y: ry, w: ROW_TILE, h: ROW_TILE, r: 10, fill: hit ? (d % 2 ? 'rgba(255,90,95,0.3)' : 'rgba(67,209,122,0.3)') : '#1b1d22', stroke: hit ? COLORS.b : c, sw: hit ? 4 : 2 });
            items.push({ ...text(`rt${d}`, x + ROW_TILE / 2, ry + ROW_TILE / 2 + 10, d, 28, c), plain: true });
        }
        h = ry + ROW_TILE + AREA_PAD;
    }
    return { w: AREA_PAD * 2 + rowW, h, items };
}

const rule = {
    id: 'rule',
    applies: (n) => n >= 0,
    build(n) {
        const o = n % 10;
        const v = { n, o };
        const odd = n % 2 === 1;
        const first = n < 10 ? [] : [step(digitsScene(n), `[a:${String(n).slice(0, -1)}][b:${o}]`, ['s0', v], { ask: ['a0', v] })];
        return [
            ...first,
            step(digitsScene(n, { row: true }), `[b:${o}]`, [odd ? 'look_odd' : 'look_even', v], { ask: ['aList', v] }),
            step(digitsScene(n, { row: true, result: true }), odd ? `[x:${n}]` : `[c:${n}]`, [`${odd ? 'odd' : 'even'}${n < 10 ? 'One' : ''}`, v])
        ];
    }
};

const parityKey = (n) => (n % 2 ? 'odd' : 'even');

// Put the cubes two and two. If every cube has a partner, the number is even.
const pairs = {
    id: 'pairs',
    applies: (n) => n >= 1 && n <= PAIRS_MAX,
    build(n) {
        const q = Math.floor(n / 2);
        const r = n % 2;
        const v = { n, q, r, qq: 2 * q };
        const k = parityKey(n);
        const rest = r ? ` + [x:1]` : '';
        if (!q) return [step(pileScene(n), `[a:${n}]`, ['s0', v], { ask: ['a0', v] }), step(pairScene(n), `[x:${n}]`, ['one', v])];
        return [
            step(pileScene(n), `[a:${n}]`, ['s0', v], { ask: ['a0', v] }),
            step(pairScene(n, { pairs: true }), r ? `[a:${n}] : 2 = [d:${q}] ${t('stage.rest')} [x:1]` : `[a:${n}] : 2 = [d:${q}]`, [`pair_${k}`, v], {
                ask: ['aHalf', v],
                scratch: r ? [`2 × ${q} = ${2 * q}`, `${n} − ${2 * q} = 1`] : [`2 × ${q} = ${n}`],
                plainSums: true
            }),
            step(pairScene(n, { halves: true }), `[a:${q}] + [b:${q}]${rest} = ${n}`, [`half_${k}`, v], {
                scratch: [`${q} + ${q}${r ? ' + 1' : ''} = ${n}`],
                plainSums: true
            }),
            r
                ? step(pairScene(n), `[a:${n}] = 2 × ${q} + [x:1]`, ['odd', v])
                : step(pairScene(n, { color: 'c' }), `[c:${n}] = [c:2 × ${q}]`, ['even', v])
        ];
    }
};

// A ten is always five pairs, so only the ones decide: look at the last digit.
const lastDigit = {
    id: 'lastDigit',
    applies: (n) => n >= 10 && n <= PAIRS_MAX,
    build(n) {
        const o = n % 10;
        const T = n - o;
        const q = Math.floor(o / 2);
        const r = o % 2;
        const v = { n, T, tens: T / 10, o, q, r };
        const k = parityKey(n);
        const steps = [
            step(pairScene(n, { tens: true, ones: true, alone: false }), o ? `[a:${n}] = [e:${T}] + [b:${o}]` : `[a:${n}] = [e:${T}]`, [o ? 's0' : 's0round', v], { ask: ['a0', v] }),
            step(pairScene(n, { tens: true, ones: true, pairs: true, alone: false }), `[d:5] × 2 = 10`, ['tens', v], { scratch: ['5 × 2 = 10'], plainSums: true })
        ];
        if (o) {
            steps.push(step(pairScene(n, { tens: true, ones: true, pairs: 'ones' }), o === 1 ? `[x:1]` : r ? `[b:${o}] : 2 = [d:${q}] ${t('stage.rest')} [x:1]` : `[b:${o}] : 2 = [d:${q}]`, [o === 1 ? 'onesOne' : `ones_${k}`, v], {
                scratch: o === 1 ? [] : r ? [`2 × ${q} = ${2 * q}`, `${o} − ${2 * q} = 1`] : [`2 × ${q} = ${o}`],
                plainSums: true
            }));
        }
        steps.push(r
            ? step(pairScene(n), `[a:${n}]`, ['odd', v])
            : step(pairScene(n, { color: 'c' }), `[c:${n}]`, ['even', v]));
        return steps;
    }
};

// --- Multiplication ---
// Rows are one factor (left bracket), columns the other (top bracket). Cells stay grey until
// they stand for a number in the equation.

const factorColors = (a, b, rowsIsA) => (rowsIsA ? ['a', 'b'] : ['b', 'a']);
const inOrder = (rowsIsA, rowTok, colTok) => (rowsIsA ? `${rowTok} × ${colTok}` : `${colTok} × ${rowTok}`);

const mulSplit = {
    id: 'mulSplit',
    applies(a, b) {
        const s = Math.min(a, b);
        const L = Math.max(a, b);
        return s >= 2 && ((L >= 11 && L % 10 !== 0) || (L >= 6 && L <= 9));
    },
    build(a, b) {
        const rowsIsA = a <= b;
        const s = Math.min(a, b);
        const L = Math.max(a, b);
        const [sc, lc] = factorColors(a, b, rowsIsA);
        const L1 = L >= 11 ? tens(L) : 5;
        const L2 = L - L1;
        const P1 = s * L1;
        const P2 = s * L2;
        const res = a * b;
        const cells = s * L <= CELLS_MAX;
        const sz = cellSize(s, L + 2);
        const gap = Math.max(22, sz * 1.5);
        const v = { s, L, sc, lc, L1, L2, P1, P2, res, L1t: L1 / 10, q: s * (L1 / 10), s10: s * 10 };
        const part1 = (extra) => ({ id: 'P', r: 0, c: 0, rows: s, cols: L1, color: 'd', left: [s, sc], top: [L1, 'd'], ...extra });
        const part2 = (extra) => ({ id: 'Q', r: 0, c: L1, rows: s, cols: L2, color: 'e', top: [L2, 'e'], from: { r: 0, c: L1 }, dx: gap, ...extra });
        const S = `[${sc}:${s}]`;
        const think2 = L1 === 10 ? 's2ten' : L1 === 5 ? 's2five' : 's2tens';
        const cellIds = (c0, c1) => (cells ? range(s).flatMap((r) => range(c1 - c0).map((k) => `c${r}_${c0 + k}`)) : []);
        return [
            step(
                areaScene([{ id: 'P', r: 0, c: 0, rows: s, cols: L, color: 'n', left: [s, sc], top: [L, lc] }], sz, cells),
                `[a:${a}] × [b:${b}]`,
                ['s0', v],
                { ask: ['a0', v] }
            ),
            step(areaScene([part1(), part2()], sz, cells), `${S} × [d:${L1}] + ${S} × [e:${L2}]`, ['s1', v], { minor: true, scratch: [`${L} = ${L1} + ${L2}`] }),
            step(areaScene([part1({ label: P1 }), part2()], sz, cells), `[d:${P1}] + ${S} × [e:${L2}]`, [think2, v], {
                ask: ['a3', v],
                scratch: [L1 === 5 ? `${s} × 10 : 2 = ${P1}` : `${s} × ${L1} = ${P1}`]
            }),
            step(areaScene([part1({ op: 0.35 }), part2({ label: P2 })], sz, cells), `[d:${P1}] + [e:${P2}]`, ['s3', v], {
                scratch: [`${s} × ${L2} = ${P2}`],
                memory: [{ id: 'PL', text: P1, color: 'd', why: 'part' }]
            }),
            step(
                areaScene([{ id: 'P', r: 0, c: 0, rows: s, cols: L, color: 'c', label: res, left: [s, sc], top: [L, lc] }], sz, cells),
                `[a:${a}] × [b:${b}] = [c:${res}]`,
                ['s4', v],
                { scratch: [`${P1} + ${P2} = ${res}`], refs: cells ? [[unitsRef(cellIds(0, L1)), unitsRef(cellIds(L1, L))]] : null }
            )
        ];
    }
};

const roundAdjust = {
    id: 'roundAdjust',
    pick(a, b) {
        for (const want of [9, 8]) {
            if (b % 10 === want && a >= 2) return { x: b, o: a, xIsB: true };
            if (a % 10 === want && b >= 2) return { x: a, o: b, xIsB: false };
        }
        return null;
    },
    applies(a, b) {
        return this.pick(a, b) !== null;
    },
    build(a, b) {
        const { x, o, xIsB } = this.pick(a, b);
        const [oc, xc] = xIsB ? ['a', 'b'] : ['b', 'a'];
        const up = 10 - (x % 10);
        const xu = x + up;
        const big = o * xu;
        const extra = o * up;
        const res = a * b;
        const cells = o * xu <= CELLS_MAX;
        const sz = cellSize(o, xu);
        const v = { x, xc, xu, o, oc, up, big, extra, res };
        const O = `[${oc}:${o}]`;
        const P = (props) => ({ id: 'P', r: 0, c: 0, rows: o, cols: x, left: [o, oc], ...props });
        const E = (props) => ({ id: 'E', r: 0, c: x, rows: o, cols: up, ...props });
        const all = (props) => ({ id: 'ALL', ghost: true, r: 0, c: 0, rows: o, cols: xu, ...props });
        const cellIds = (c0, c1) => (cells ? range(o).flatMap((r) => range(c1 - c0).map((k) => `c${r}_${c0 + k}`)) : []);
        return [
            step(areaScene([P({ color: 'n', top: [x, xc] })], sz, cells), `[a:${a}] × [b:${b}]`, ['s0', v], { scratch: [`${x} = ${xu} − ${up}`] }),
            step(areaScene([P({ color: 'd' }), E({ color: 'd' }), all({ top: [xu, 'd'], label: big })], sz, cells), `${xIsB ? `${O} × [d:${xu}]` : `[d:${xu}] × ${O}`} = [d:${big}]`, ['s1', v], {
                ask: ['a1', v],
                scratch: [`${o} × ${xu} = ${big}`]
            }),
            step(areaScene([P({ color: 'n' }), E({ color: 'x', op: 0.55, cross: true, label: extra })], sz, cells), `[d:${big}] − [x:${extra}]`, ['s2', v], {
                scratch: [`${o} × ${up} = ${extra}`],
                memory: [{ id: 'ALLL', text: big, color: 'd', why: 'round' }]
            }),
            step(areaScene([P({ color: 'c', label: res, top: [x, xc] })], sz, cells), `[a:${a}] × [b:${b}] = [c:${res}]`, ['s3', v], {
                scratch: [`${big} − ${extra} = ${res}`],
                refs: cells ? [[unitsRef(cellIds(0, xu)), unitsRef(cellIds(x, xu))]] : null
            })
        ];
    }
};

const doubleHalve = {
    id: 'doubleHalve',
    pick(a, b) {
        if (b % 10 === 5 && a % 2 === 0 && a >= 2) return { e: a, f: b, eIsA: true };
        if (a % 10 === 5 && b % 2 === 0 && b >= 2) return { e: b, f: a, eIsA: false };
        return null;
    },
    applies(a, b) {
        return this.pick(a, b) !== null;
    },
    build(a, b) {
        const { e, f, eIsA } = this.pick(a, b);
        const [ec, fc] = eIsA ? ['a', 'b'] : ['b', 'a'];
        const res = a * b;
        const pairs = [[e, f]];
        let [E, F] = [e, f];
        while (E % 2 === 0 && (F % 10 === 5 || F % 100 === 50)) {
            E /= 2;
            F *= 2;
            pairs.push([E, F]);
        }
        const [eK, fK] = pairs[pairs.length - 1];
        const cells = e * f <= CELLS_MAX;
        const sz = cellSize(e, fK);
        let pieces = cells
            ? range(e * f).map((i) => {
                const r = Math.floor(i / f);
                const c = i % f;
                return { key: `c${r}_${c}`, or: r, oc: c, r, c, rows: 1, cols: 1, color: 'n' };
            })
            : [{ key: 'P', or: 0, oc: 0, r: 0, c: 0, rows: e, cols: f, color: 'n' }];
        const sceneOf = (curE, curF, eKey, fKey, label) => areaScene(
            [
                ...pieces.map((p) => ({ id: p.key, r: p.r, c: p.c, rows: p.rows, cols: p.cols, or: p.or, oc: p.oc, color: p.color, from: p.from })),
                { id: 'ALL', ghost: true, r: 0, c: 0, rows: curE, cols: curF, left: [curE, eKey], top: [curF, fKey], label }
            ],
            sz,
            cells
        );
        const ordered = (eTok, fTok) => (eIsA ? `${eTok} × ${fTok}` : `${fTok} × ${eTok}`);
        const steps = [step(sceneOf(e, f, ec, fc), `[a:${a}] × [b:${b}]`, ['s0', { f, fc }])];
        for (let i = 1; i < pairs.length; i++) {
            const [pe, pf] = pairs[i - 1];
            const [ne, nf] = pairs[i];
            const h = pe / 2;
            const next = [];
            for (const p of pieces) {
                if (!cells && p.r < h && p.r + p.rows > h) {
                    next.push({ ...p, key: `${p.key}a`, rows: h - p.r });
                    next.push({ ...p, key: `${p.key}b`, r: h, rows: p.r + p.rows - h, or: p.or + h - p.r });
                } else {
                    next.push({ ...p });
                }
            }
            pieces = next.map((p) => {
                if (p.r < h) return { ...p, color: 'n', from: undefined };
                return { ...p, r: p.r - h, c: p.c + pf, color: 'm', from: { r: p.r, c: p.c } };
            });
            const v = { e: pe, f: pf, e2: ne, f2: nf };
            steps[steps.length - 1].ask = ['aH', v];
            steps.push(step(sceneOf(ne, nf, 'd', 'e'), ordered(`[d:${ne}]`, `[e:${nf}]`), ['sH', v], {
                scratch: [`${pe} : 2 = ${ne}`, `${pf} × 2 = ${nf}`]
            }));
        }
        pieces = pieces.map((p) => ({ ...p, color: 'c', from: undefined }));
        steps.push(step(sceneOf(eK, fK, 'd', 'e', res), `${a} × ${b} = ${ordered(`[d:${eK}]`, `[e:${fK}]`)} = [c:${res}]`, ['sF', { e: eK, f: fK, res }], {
            scratch: [`${eK} × ${fK} = ${res}`]
        }));
        return steps;
    }
};

const doubling = {
    id: 'doubling',
    pick(a, b) {
        const ks = [a, b].filter((k) => k === 2 || k === 4 || k === 8);
        if (!ks.length) return null;
        const k = Math.min(...ks);
        const kIsA = k === a;
        const n = kIsA ? b : a;
        return n >= 3 ? { k, n, kIsA } : null;
    },
    applies(a, b) {
        return this.pick(a, b) !== null;
    },
    build(a, b) {
        const { k, n, kIsA } = this.pick(a, b);
        const [kc, nc] = kIsA ? ['a', 'b'] : ['b', 'a'];
        const res = a * b;
        const cells = k * n <= CELLS_MAX;
        const sz = cellSize(k, n);
        const sceneOf = (rows, color, label) => areaScene(
            [
                { id: 'D', r: 0, c: 0, rows, cols: n, color, label, top: [n, nc], right: rows > 1 && rows < k ? [rows, 'w'] : null },
                ...(rows < k ? [{ id: 'R', r: rows, c: 0, rows: k - rows, cols: n, color: 'n', op: 0.45 }] : []),
                { id: 'ALL', ghost: true, r: 0, c: 0, rows: k, cols: n, left: [k, kc] }
            ],
            sz,
            cells
        );
        const N = `[${nc}:${n}]`;
        // Squares column by column, so the tens of a double are whole columns.
        const colCells = (r0, r1) => range(n).flatMap((c) => range(r1 - r0).map((i) => `c${r0 + i}_${c}`));
        const steps = [step(sceneOf(1, nc, n), `[a:${a}] × [b:${b}]`, [`s0k${k}`, {}])];
        for (let rows = 2, val = n; rows <= k; rows *= 2) {
            const v = { v: val, v2: val * 2, r: rows };
            steps[steps.length - 1].ask = ['aD', v];
            const last = rows === k;
            steps.push(step(sceneOf(rows, last ? 'c' : 'd', val * 2), last ? `[a:${a}] × [b:${b}] = [c:${res}]` : `${kIsA ? `[w:${rows}] × ${N}` : `${N} × [w:${rows}]`} = [d:${val * 2}]`, [last ? 'sDlast' : 'sD', v], {
                scratch: [`${val} + ${val} = ${val * 2}`],
                refs: cells ? [[unitsRef(colCells(0, rows / 2)), unitsRef(colCells(rows / 2, rows))]] : null
            }));
            val *= 2;
        }
        return steps;
    }
};

const halfTen = {
    id: 'halfTen',
    applies: (a, b) => (a === 5 && b >= 2) || (b === 5 && a >= 2),
    build(a, b) {
        const fiveIsA = a === 5;
        const n = fiveIsA ? b : a;
        const [fc, nc] = fiveIsA ? ['a', 'b'] : ['b', 'a'];
        const t10 = n * 10;
        const res = a * b;
        const cells = 10 * n <= CELLS_MAX;
        const sz = cellSize(10, n);
        const v = { n, nc, t: t10, res };
        const N = `[${nc}:${n}]`;
        const P = (props) => ({ id: 'P', r: 0, c: 0, rows: 5, cols: n, top: [n, nc], ...props });
        const E = (props) => ({ id: 'E', r: 5, c: 0, rows: 5, cols: n, ...props });
        const all = (props) => ({ id: 'ALL', ghost: true, r: 0, c: 0, rows: 10, cols: n, ...props });
        return [
            step(areaScene([P({ color: 'n', left: [5, fc] })], sz, cells), `[a:${a}] × [b:${b}]`, ['s0', v], { scratch: ['5 = 10 : 2'] }),
            step(areaScene([P({ color: 'd' }), E({ color: 'd' }), all({ left: [10, 'd'] })], sz, cells), `${fiveIsA ? `[d:10] × ${N}` : `${N} × [d:10]`} = [d:${t10}]`, ['s1', v], {
                ask: ['a2', v],
                scratch: [`${n} × 10 = ${t10}`]
            }),
            step(areaScene([P({ color: 'c', label: res }), E({ color: 'x', op: 0.5, cross: true }), all({ right: [t10, 'd'] })], sz, cells), `[d:${t10}] : 2 = [c:${res}]`, ['s2', v], {
                scratch: [`${t10} : 2 = ${res}`]
            }),
            step(areaScene([P({ color: 'c', label: res, left: [5, fc] })], sz, cells), `[a:${a}] × [b:${b}] = [c:${res}]`, ['s3', v])
        ];
    }
};

const skip = {
    id: 'skip',
    applies(a, b) {
        const s = Math.min(a, b);
        return s >= 2 && s <= 6 && a * b <= 120;
    },
    build(a, b) {
        const sIsA = a <= b;
        const s = Math.min(a, b);
        const L = Math.max(a, b);
        const [sc, lc] = sIsA ? ['a', 'b'] : ['b', 'a'];
        const res = a * b;
        const line = new NumberLine([0, res]);
        const marks = { 0: 'n' };
        const shown = [];
        const ordered = (sTok, lTok) => (sIsA ? `${sTok} × ${lTok}` : `${lTok} × ${sTok}`);
        const steps = [step(line.scene([], 0, marks), `${a} × ${b}`, ['s0', { s, L }])];
        for (let i = 1; i <= s; i++) {
            const v = i * L;
            shown.push({ id: `j${i}`, from: v - L, to: v, label: i, labelColor: sc, color: lc });
            const last = i === s;
            marks[v] = last ? 'c' : 'd';
            steps[steps.length - 1].ask = ['aJ', {}];
            steps.push(step(
                line.scene(shown.slice(), v, { ...marks }, last ? { from: 0, to: L, label: L, color: lc } : null),
                last ? `[a:${a}] × [b:${b}] = [c:${res}]` : `${ordered(`[${sc}:${i}]`, `[${lc}:${L}]`)} = [d:${v}]`,
                [last ? 'sF' : 'sJ', { i, v, s, res, L, sc, lc }],
                { scratch: [`${v - L} + ${L} = ${v}`], refs: [[itemsRef([`nl${v - L}`], v - L), itemsRef([`j${i}`], L)]], subScene: 'self', lineSums: true }
            ));
        }
        return steps;
    }
};

// --- Division ---

const restTail = (r) => (r ? `  [x:${t('stage.rest')} ${r}]` : '');

// Source frames on top, one orange box per group below. colorOf gives each unit's colour.
// srcH and inner are fixed per strategy so the boxes never jump between steps.
// srcH.slots is the whole pile, so units left in the pile keep their places.
function shareScene(src, loose, boxes, inner, srcH, colorOf, srcLabel, srcKey, boxLabel, boxKey) {
    const items = [];
    const boxGap = 14;
    const boxW = inner.w + 24;
    const boxH = inner.h + 24;
    const boxesW = boxes.length * boxW + (boxes.length - 1) * boxGap;
    const srcW = groupW(srcH.slots.length);
    const W = Math.max(boxesW, srcW) + 40;
    if (src.length) items.push(...groupItems(grp('src', src, srcLabel, srcKey, { loose, slots: srcH.slots }), (W - srcW) / 2, 24, colorOf, {}).items);
    const boxTop = 24 + srcH.h + 2 * GROUP_PAD + TAB_H + 24;
    const bx0 = (W - boxesW) / 2;
    boxes.forEach((units, i) => {
        const bx = bx0 + i * (boxW + boxGap);
        items.push({ id: `box${i}`, kind: 'rect', layer: 'back', x: bx, y: boxTop, w: boxW, h: boxH, r: 10, fill: 'rgba(255,255,255,0.02)', stroke: COLORS.b, sw: 2, dash: '7 5' });
        items.push(...groupItems(grp(`bx${i}`, units, null, boxKey || 'w', { bare: true }), bx + 12, boxTop + 12, colorOf, {}).items);
        if (boxLabel != null) items.push(text(`bl${i}`, bx + boxW / 2, boxTop + boxH + 30, boxLabel, 24, COLORS[boxKey]));
    });
    return { w: W, h: boxTop + boxH + 46, items };
}

const share = {
    id: 'share',
    applies: (a, d) => d >= 2 && d <= 9 && a >= d && a <= 200,
    build(a, d) {
        const T = Math.floor(a / 10);
        const qt = Math.floor(T / d);
        const rt = T - qt * d;
        const rem = rt * 10 + (a % 10);
        const qo = Math.floor(rem / d);
        const r = rem - qo * d;
        const q = qt * 10 + qo;
        const A = ids('a', a);
        const rods = range(T).map((j) => A.slice(j * 10, j * 10 + 10));
        const ones = A.slice(T * 10);
        const inner = layoutGroup(ids('z', q), 0, 0);
        const srcH = { h: layoutGroup(A, 0, 0).h, slots: A };
        const boxes = range(d).map(() => []);
        const colors = new Map();
        const colorOf = (id) => colors.get(id) || COLORS.a;
        const snap = () => boxes.map((bx) => bx.slice());
        const D = `[b:${d}]`;
        const steps = [step(shareScene(A, false, snap(), inner, srcH, colorOf, a, 'a'), `[a:${a}] : ${D}`, ['s0', { a, d }], { ask: ['a0', {}] })];
        if (qt > 0) {
            rods.slice(0, qt * d).forEach((rod, j) => {
                boxes[Math.floor(j / qt)].push(...rod);
                rod.forEach((id) => colors.set(id, COLORS.d));
            });
        }
        let src = [...rods.slice(qt * d).flat(), ...ones];
        const firstTok = qt ? `[d:${qt * 10}] + ` : '';
        if (qt > 0) {
            steps.push(step(
                shareScene(src, false, snap(), inner, srcH, colorOf, src.length, 'a', qt * 10, 'd'),
                rem ? `${firstTok}[a:${rem}] : ${D}` : `[d:${qt * 10}]`,
                ['sT', { v: qt * 10 }],
                { scratch: [`${qt * 10 * d} : ${d} = ${qt * 10}`] }
            ));
        }
        if (rt > 0) {
            steps.push(step(
                shareScene(src, true, snap(), inner, srcH, colorOf, src.length, 'a', qt ? qt * 10 : null, 'd'),
                `${firstTok}[a:${rem}] : ${D}`,
                ['sB', { v: rem }],
                { minor: true, scratch: [`${rt} × 10 + ${a % 10} = ${rem}`] }
            ));
        }
        if (qo > 0) {
            src.slice(0, qo * d).forEach((id, j) => {
                boxes[Math.floor(j / qo)].push(id);
                colors.set(id, COLORS.e);
            });
            src = src.slice(qo * d);
            steps.push(step(
                shareScene(src, true, snap(), inner, srcH, colorOf, src.length, 'a', q, 'w'),
                `${firstTok}[e:${qo}] = [w:${q}]`,
                ['sO', { v: qo }],
                { scratch: [`${rem} : ${d} = ${qo}` + (r ? ` (${t('stage.rest')} ${r})` : '')] }
            ));
        }
        boxes.flat().forEach((id) => colors.set(id, COLORS.c));
        src.forEach((id) => colors.set(id, COLORS.x));
        steps.push(step(
            shareScene(src, true, snap(), inner, srcH, colorOf, `${r}`, 'x', q, 'c'),
            () => `${a} : ${D} = [c:${q}]${restTail(r)}`,
            [r ? 'sFr' : 'sF', { q, r }]
        ));
        return steps;
    }
};

const thinkMul = {
    id: 'thinkMul',
    applies: (a, d) => d >= 2 && a >= d && Math.floor(a / d) <= 12,
    build(a, d) {
        const q = Math.floor(a / d);
        const r = a - q * d;
        const line = new NumberLine([0, a]);
        const marks = { 0: 'n', [a]: 'a' };
        const D = `[b:${d}]`;
        const steps = [step(line.scene([], 0, marks), `[a:${a}] : ${d}`, ['s0', { a, d }], { ask: ['a0', { a, d }] })];
        const shown = [];
        const small = (from, to) => {
            for (let i = from + 1; i <= to; i++) {
                shown.push({ id: `j${i}`, from: (i - 1) * d, to: i * d, label: i, labelColor: 'w', color: 'b', size: 16 });
            }
        };
        const landKey = (v) => (v === a ? 'a' : 'w');
        let k = 0;
        if (q >= 6) {
            k = q >= 10 ? 10 : 5;
            shown.push({ id: 'big', from: 0, to: k * d, label: `${k} × ${d}`, color: 'd' });
            marks[k * d] = k * d === a ? 'a' : 'd';
            steps.push(step(line.scene(shown.slice(), k * d, { ...marks }), `[d:${k} × ${d}] = [d:${k * d}]`, ['sBig', { k, d, kd: k * d }], {
                scratch: [`${k} × ${d} = ${k * d}`]
            }));
            if (q > k) {
                small(k, q);
                marks[q * d] = landKey(q * d);
                steps.push(step(line.scene(shown.slice(), q * d, { ...marks }), `[d:${k * d}] + ${q - k} × ${D} = [${landKey(q * d)}:${q * d}]`, ['sRest', { k, m: q - k, v: q * d }], {
                    scratch: [`${k * d} + ${q - k} × ${d} = ${q * d}`],
                    memory: [{ id: 'memk', text: k, color: 'd', why: 'jumps' }]
                }));
            }
        } else {
            small(0, q);
            marks[q * d] = landKey(q * d);
            const list = range(q).map((i) => (i + 1) * d).join(', ');
            steps.push(step(line.scene(shown.slice(), q * d, { ...marks }), `${q} × ${D} = [${landKey(q * d)}:${q * d}]`, ['sAll', { d, v: list }], {
                scratch: [`${q} × ${d} = ${q * d}`]
            }));
        }
        const final = shown.map((j) => {
            if (j.id === `j${q}`) return { ...j, labelColor: 'c', size: 24 };
            if (j.id === 'big' && q === k) return { ...j, label: q, color: 'c' };
            return j;
        });
        if (r) final.push({ id: 'rest', from: q * d, to: a, label: r, color: 'x', below: true, size: 18 });
        const dTok = final.some((j) => j.color === 'b') ? D : d;
        steps.push(step(line.scene(final, r ? a : q * d, { ...marks }), () => `[a:${a}] : ${dTok} = [c:${q}]${restTail(r)}`, [(k && q > k ? 'sFk' : 'sF') + (r ? 'r' : ''), { a, d, q, r, k, m: q - k }], {
            scratch: k && q > k ? [`${k} + ${q - k} = ${q}`] : []
        }));
        return steps;
    }
};

const splitDiv = {
    id: 'splitDiv',
    pick(a, d) {
        let p1 = Math.floor(a / (10 * d)) * 10 * d;
        if (p1 === 0) p1 = Math.floor(a / (5 * d)) * 5 * d;
        return p1;
    },
    applies(a, d) {
        if (d < 2 || a % d !== 0) return false;
        const p1 = this.pick(a, d);
        return p1 > 0 && p1 < a;
    },
    build(a, d) {
        const p1 = this.pick(a, d);
        const p2 = a - p1;
        const q1 = p1 / d;
        const q2 = p2 / d;
        const q = a / d;
        const v = { a, d, p1, p2, q1, q2, q };
        const k = 760 / a;
        const x0 = 30;
        const y0 = 64;
        const H = 46;
        const bars = (colored, partGap, gap1, gap2) => {
            const items = [];
            for (let i = 0; i < d; i++) {
                items.push({ id: `s1_${i}`, kind: 'rect', x: x0 + i * (q1 * k + gap1), y: y0, w: q1 * k, h: H, fill: colored ? COLORS.d : COLORS.a, r: gap1 ? 4 : 0 });
            }
            const x2 = x0 + d * q1 * k + (d - 1) * gap1 + partGap;
            for (let i = 0; i < d; i++) {
                items.push({ id: `s2_${i}`, kind: 'rect', x: x2 + i * (q2 * k + gap2), y: y0, w: q2 * k, h: H, fill: colored ? COLORS.e : COLORS.a, r: gap2 ? 4 : 0 });
            }
            return { items, x2 };
        };
        const W = 760 + 60 + 18 + (d - 1) * 12;
        const sceneH = Math.max(y0 + H + 60, y0 + d * 40 + 20);
        const withLabels = (bs, l1, l2) => {
            const items = bs.items.slice();
            if (l1) items.push(text('l1', x0 + (bs.x2 - x0) / 2, y0 - 16, l1, 20, COLORS.d));
            if (l2) items.push(text('l2', bs.x2 + (p2 * k + (d - 1) * 6) / 2, y0 + H + 32, l2, 20, COLORS.e));
            return { w: W, h: sceneH, items };
        };
        const rows = [];
        for (let i = 0; i < d; i++) {
            const y = y0 + i * 40;
            rows.push({ id: `s1_${i}`, kind: 'rect', x: x0, y, w: q1 * k, h: 30, fill: COLORS.d, r: 4 });
            rows.push({ id: `s2_${i}`, kind: 'rect', x: x0 + q1 * k + 3, y, w: q2 * k, h: 30, fill: COLORS.e, r: 4 });
            rows.push(text(`rq${i}`, x0 + q * k + 16, y + 22, q, 20, COLORS.c, 'start'));
        }
        return [
            step({ w: W, h: sceneH, items: [...bars(false, 0, 0, 0).items, text('l1', x0 + 380, y0 - 16, a, 22, COLORS.a)] }, `[a:${a}] : ${d}`, ['s0', v]),
            step(withLabels(bars(true, 18, 0, 0), p1, p2), `[d:${p1}] : ${d} + [e:${p2}] : ${d}`, ['s1', v], { minor: true, scratch: [`${a} = ${p1} + ${p2}`] }),
            step(withLabels(bars(true, 18, 6, 0), `${p1} : ${d} = ${q1}`, p2), `[d:${q1}] + [e:${p2}] : ${d}`, ['s2', v], {
                ask: ['a3', v],
                scratch: [`${p1} : ${d} = ${q1}`]
            }),
            step(withLabels(bars(true, 18, 6, 6), null, `${p2} : ${d} = ${q2}`), `[d:${q1}] + [e:${q2}]`, ['s3', v], {
                scratch: [`${p2} : ${d} = ${q2}`],
                memory: [{ id: 'l1', text: q1, color: 'd', why: 'part' }]
            }),
            step({ w: W, h: sceneH, items: rows }, `${a} : ${d} = [d:${q1}] + [e:${q2}] = [c:${q}]`, ['s4', v], {
                scratch: [`${q1} + ${q2} = ${q}`]
            })
        ];
    }
};

const halving = {
    id: 'halving',
    applies: (a, d) => (d === 2 || d === 4 || d === 8) && a % d === 0 && a >= d,
    build(a, d) {
        const levels = Math.log2(d);
        const k = 760 / a;
        const x0 = 30;
        const rowY = (i) => 30 + i * 74;
        const H = 46;
        const items = new Map();
        const sceneOf = () => ({ w: 820, h: rowY(levels) + H + 30, items: [...items.values()] });
        const addLevel = (i, color) => {
            const val = a / 2 ** i;
            const w = val * k;
            const y = rowY(i);
            const from = i ? { y: rowY(i - 1) } : undefined;
            items.set(`h${i}`, { id: `h${i}`, kind: 'rect', x: x0, y, w, h: H, r: 6, fill: COLORS[color], from });
            if (i) items.set(`h${i}x`, { id: `h${i}x`, kind: 'rect', x: x0 + w + 4, y, w: w - 4, h: H, r: 6, fill: COLORS.n, op: 0.35, from });
            items.set(`h${i}L`, text(`h${i}L`, x0 + w / 2, y + H / 2 + 8, val, clamp(w / 3, 14, 24)));
        };
        addLevel(0, 'a');
        const steps = [step(sceneOf(), `[a:${a}] : ${d}`, [`s0k${d}`, {}])];
        for (let i = 1; i <= levels; i++) {
            const val = a / 2 ** (i - 1);
            const v = { v: val, v2: val / 2 };
            steps[steps.length - 1].ask = ['aH', v];
            addLevel(i, 'd');
            steps.push(step(sceneOf(), `${val} : 2 = [d:${val / 2}]`, ['sH', v], { scratch: [`${val} : 2 = ${val / 2}`] }));
        }
        addLevel(levels, 'c');
        steps.push(step(sceneOf(), `${a} : ${d} = [c:${a / d}]`, ['sF', { a, d, res: a / d }]));
        return steps;
    }
};

// ---------- Column methods (oppstilling) ----------
// Written the way it is done on squared paper: one digit per square, ones under ones, tens under
// tens, with the place letters (E, T, H …) above the columns. The column being worked on has a
// soft yellow band. A carry (mente) or an exchanged number (veksling) is a small purple box above
// its column, the way it is written by hand. Answer digits are green.
// Every column method starts with an estimate (overslag) that is kept in "Husker på" and checked
// against the answer at the end.

const COL_W = 52;
const COL_ROW = 60;
const COL_SIGN = 52;
const COL_FONT = 40;
const COL_SMALL = 22;
const EST_W = 190;

// Digits by place: index 0 is the ones.
const digitsOf = (n) => String(n).split('').reverse().map(Number);
const lenOf = (n) => String(n).length;
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const placeName = (kind, p) => t(`col.${kind}.${p}`);

function colGrid(cols, extraRight = 0) {
    const x0 = AREA_PAD + COL_SIGN;
    return {
        cols,
        x: (p) => x0 + (cols - 1 - p) * COL_W + COL_W / 2,
        left: x0,
        right: x0 + cols * COL_W,
        w: AREA_PAD * 2 + COL_SIGN + cols * COL_W + extraRight,
        signX: AREA_PAD + COL_SIGN / 2
    };
}

const colDigit = (id, x, y, d, color) => ({ ...text(id, x, y, d, COL_FONT, color), plain: true });

function smallMark(id, x, y, value, key) {
    const w = 14 + 12 * String(value).length;
    return [
        { id: `${id}box`, kind: 'rect', x: x - w / 2, y: y - 20, w, h: 27, r: 6, fill: '#262a31', stroke: COLORS[key], sw: 2 },
        { ...text(id, x, y, value, COL_SMALL, COLORS[key]), plain: true }
    ];
}

const colBand = (id, x, y1, y2) => ({ id, kind: 'rect', layer: 'back', x: x - COL_W / 2 + 3, y: y1, w: COL_W - 6, h: y2 - y1, r: 10, fill: 'rgba(242,193,78,0.13)' });
const hLine = (id, x1, x2, y) => ({ id, kind: 'path', d: `M${x1},${y} L${x2},${y}`, stroke: TEXT, sw: 2 });
const strike = (id, x, y) => ({ id, kind: 'path', layer: 'front', d: `M${x - 15},${y + 3} L${x + 15},${y - 31}`, stroke: COLORS.x, sw: 3 });
const placeHeads = (g, y) => range(g.cols).map((p) => text(`ph${p}`, g.x(p), y, t(`col.place.${p}`), 16, DIM));

// "≈ 6000" next to a row. The value keeps its id, so it can fly into "Husker på" and back.
function estText(id, x, y, value) {
    return [
        { ...text(`${id}q`, x, y, '≈', 30, DIM, 'start'), plain: true },
        { ...text(id, x + 30, y, value, 30, TEXT, 'start'), plain: true }
    ];
}

const estMemory = (v) => [{ id: 'est', text: v, color: 'w', why: 'estimate' }];

// Rounding for an estimate: two- and three-digit numbers to the leading place, bigger numbers to
// the two leading places, so the estimate is easy but still close.
function estUnit(n) {
    const len = lenOf(n);
    return Math.max(10, 10 ** (len <= 3 ? len - 1 : len - 2));
}
const roundTo = (n, u) => Math.round(n / u) * u;
// One significant digit: 47 → 50, 4572 → 5000. Numbers below 10 stay as they are.
const roundLead = (n) => (n < 10 ? n : roundTo(n, 10 ** (lenOf(n) - 1)));

function estimateAddSub(a, b, op) {
    const u = estUnit(Math.max(a, b));
    const ra = roundTo(a, u);
    const rb = roundTo(b, u);
    return { ra, rb, re: op === '+' ? ra + rb : ra - rb };
}

// Column addition with carrying (mente).
const colAdd = {
    id: 'colAdd',
    applies: (a, b) => Math.max(a, b) >= 10 && Math.min(a, b) >= 1,
    build(a, b) {
        const res = a + b;
        const g = colGrid(lenOf(res), EST_W);
        const Y = { head: AREA_PAD + 4, carry: AREA_PAD + 46, a: AREA_PAD + 104, b: AREA_PAD + 164, line: AREA_PAD + 180, r: AREA_PAD + 238 };
        const A = digitsOf(a);
        const B = digitsOf(b);
        const est = estimateAddSub(a, b, '+');
        const carries = new Map();
        const written = new Map();
        const sceneOf = (look = {}) => {
            const items = placeHeads(g, Y.head);
            A.forEach((d, p) => items.push(colDigit(`a${p}`, g.x(p), Y.a, d, COLORS.a)));
            B.forEach((d, p) => items.push(colDigit(`b${p}`, g.x(p), Y.b, d, COLORS.b)));
            items.push(colDigit('sign', g.signX, Y.b, '+', TEXT));
            items.push(hLine('line', g.left - COL_SIGN + 8, g.right, Y.line));
            for (const [p, v] of carries) items.push(...smallMark(`cy${p}`, g.x(p), Y.carry, v, 'd'));
            for (const [p, d] of written) items.push(colDigit(`r${p}`, g.x(p), Y.r, d, COLORS.c));
            if (look.band != null) items.push(colBand('colband', g.x(look.band), Y.carry - 28, Y.r + 14));
            const ex = g.right + 24;
            if (look.est) items.push(...estText('ea', ex, Y.a, est.ra), ...estText('eb', ex, Y.b, est.rb));
            if (look.est || look.end) items.push(...estText('est', ex, Y.r, est.re));
            return { w: g.w, h: Y.r + AREA_PAD - 20, items };
        };
        const v0 = { a, b, ...est };
        const steps = [
            step(sceneOf(), `[a:${a}] + [b:${b}]`, ['s0', v0], { ask: ['a0', v0] }),
            step(sceneOf({ est: true }), `${est.ra} + ${est.rb} = ${est.re}`, ['est', v0], { scratch: [`${est.ra} + ${est.rb} = ${est.re}`], plainSums: true })
        ];
        const memory = estMemory(est.re);
        const top = Math.max(A.length, B.length);
        let carry = 0;
        for (let p = 0; p < top; p++) {
            const place = { place: placeName('the', p), Place: capFirst(placeName('the', p)), next: placeName('the', p + 1) };
            const terms = [];
            if (A[p] !== undefined) terms.push([`[a:${A[p]}]`, A[p]]);
            if (B[p] !== undefined) terms.push([`[b:${B[p]}]`, B[p]]);
            if (carry) terms.push([`[d:${carry}]`, carry]);
            const last = p === top - 1;
            // Only one number left and nothing to carry: the rest is written down as it is.
            if (terms.length === 1 && !carry) {
                const src = A[p] !== undefined ? A : B;
                const key = src === A ? 'a' : 'b';
                const rest = src.slice(p).reverse().join('');
                for (let q = p; q < top; q++) written.set(q, src[q]);
                steps.push(step(sceneOf({ band: top - 1 }), `[${key}:${rest}] = [c:${rest}]`, ['copyRest', { rest, key, ...place }], { memory }));
                break;
            }
            const sums = [];
            let acc = terms[0][1];
            for (const [, v] of terms.slice(1)) {
                sums.push(`${acc} + ${v} = ${acc + v}`);
                acc += v;
            }
            const s = acc;
            const sumTok = `${terms.map(([tok]) => tok).join(' + ')} = ${s}`;
            written.set(p, s % 10);
            if (s >= 10 && last) written.set(p + 1, Math.floor(s / 10));
            if (s >= 10 && !last) carries.set(p + 1, 1);
            const key = s < 10 ? 'col' : last ? 'colEnd' : 'colCarry';
            carry = s >= 10 ? 1 : 0;
            steps.push(step(sceneOf({ band: p }), sumTok, [key, { sum: sumTok, d: s % 10, s, ...place }], {
                scratch: sums,
                plainSums: true,
                minor: !last,
                short: last ? ['colsShort', { sum: sumTok, d: s % 10, s, ...place }] : null,
                memory
            }));
        }
        steps.push(step(sceneOf({ end: true }), `[a:${a}] + [b:${b}] = [c:${res}]`, ['end', { res, est: est.re }]));
        return steps;
    }
};

// Column subtraction with exchanging (veksling): when a digit is too small, one from the column to
// the left is exchanged into ten. The old digit is crossed out and the new one written above.
const colSub = {
    id: 'colSub',
    applies: (a, b) => a >= 10 && b >= 1 && a > b,
    build(a, b) {
        const res = a - b;
        const resLen = lenOf(res);
        const g = colGrid(lenOf(a), EST_W);
        const Y = { head: AREA_PAD + 4, carry: AREA_PAD + 46, a: AREA_PAD + 104, b: AREA_PAD + 164, line: AREA_PAD + 180, r: AREA_PAD + 238 };
        const A = digitsOf(a);
        const B = digitsOf(b);
        const cur = A.slice();
        const crossed = new Set();
        const above = new Map();
        const written = new Map();
        const est = estimateAddSub(a, b, '−');
        const sceneOf = (look = {}) => {
            const items = placeHeads(g, Y.head);
            A.forEach((d, p) => {
                items.push({ ...colDigit(`a${p}`, g.x(p), Y.a, d, COLORS.a), op: crossed.has(p) ? 0.45 : 1 });
                if (crossed.has(p)) items.push(strike(`xs${p}`, g.x(p), Y.a));
            });
            B.forEach((d, p) => items.push(colDigit(`b${p}`, g.x(p), Y.b, d, COLORS.b)));
            items.push(colDigit('sign', g.signX, Y.b, '−', TEXT));
            items.push(hLine('line', g.left - COL_SIGN + 8, g.right, Y.line));
            for (const [p, v] of above) items.push(...smallMark(`nv${p}`, g.x(p), Y.carry, v, 'd'));
            for (const [p, d] of written) items.push(colDigit(`r${p}`, g.x(p), Y.r, d, COLORS.c));
            if (look.band != null) items.push(colBand('colband', g.x(look.band), Y.carry - 28, Y.r + 14));
            if (look.band2 != null) items.push(colBand('colband2', g.x(look.band2), Y.carry - 28, Y.a + 14));
            const ex = g.right + 24;
            if (look.est) items.push(...estText('ea', ex, Y.a, est.ra), ...estText('eb', ex, Y.b, est.rb));
            if (look.est || look.end) items.push(...estText('est', ex, Y.r, est.re));
            return { w: g.w, h: Y.r + AREA_PAD - 20, items };
        };
        const v0 = { a, b, ...est };
        const steps = [
            step(sceneOf(), `[a:${a}] − [b:${b}]`, ['s0', v0], { ask: ['a0', v0] }),
            step(sceneOf({ est: true }), `${est.ra} − ${est.rb} = ${est.re}`, ['est', v0], { scratch: [`${est.ra} − ${est.rb} = ${est.re}`], plainSums: true })
        ];
        const memory = estMemory(est.re);
        const tokOf = (p) => (crossed.has(p) ? `[d:${cur[p]}]` : `[a:${cur[p]}]`);
        for (let p = 0; p < A.length; p++) {
            const place = { place: placeName('the', p), Place: capFirst(placeName('the', p)) };
            const db = B[p];
            if (db === undefined) {
                // Nothing left to take away: the rest is written down, without zeros in front.
                const restDigits = cur.slice(p);
                const rest = Number(restDigits.slice().reverse().join(''));
                restDigits.forEach((d, i) => { if (p + i < resLen) written.set(p + i, d); });
                const restTok = restDigits.map((d, i) => (crossed.has(p + i) ? `[d:${d}]` : `[a:${d}]`)).reverse().join('');
                steps.push(step(sceneOf({ band: A.length - 1 }), rest ? `${restTok} = [c:${rest}]` : restTok, [rest ? 'copyRest' : 'copyNone', { rest, ...place }], { memory }));
                break;
            }
            if (cur[p] < db) {
                let q = p + 1;
                while (cur[q] === 0) q++;
                const before = cur[p];
                const lines = [`${cur[q]} − 1 = ${cur[q] - 1}`];
                cur[q] -= 1;
                crossed.add(q);
                above.set(q, cur[q]);
                const pieces = [t('col.swapPiece', { one: placeName('one', q), many: placeName('many', q - 1) })];
                for (let k = q - 1; k > p; k--) {
                    lines.push('10 − 1 = 9');
                    cur[k] = 9;
                    crossed.add(k);
                    above.set(k, 9);
                    pieces.push(t('col.swapPiece', { one: placeName('one', k), many: placeName('many', k - 1) }));
                }
                lines.push(`${before} + 10 = ${before + 10}`);
                cur[p] = before + 10;
                crossed.add(p);
                above.set(p, cur[p]);
                const v = {
                    db, d: before, now: cur[p], left: cur[p + 1], list: pieces.join(', '),
                    one: placeName('one', p + 1), many: placeName('many', p), manyNext: placeName('many', p + 1), theNext: placeName('the', p + 1), ...place
                };
                steps[steps.length - 1].ask = ['aSwap', { d: before, db }];
                steps.push(step(sceneOf({ band: p, band2: q }), `[d:${cur[p]}] − [b:${db}]`, [q === p + 1 ? 'swap' : 'swapChain', v], {
                    scratch: lines,
                    plainSums: true,
                    memory
                }));
            }
            const r = cur[p] - db;
            const lead = p >= resLen;
            if (!lead) written.set(p, r);
            const last = p === A.length - 1;
            const sumTok = `${tokOf(p)} − [b:${db}] = ${r}`;
            steps.push(step(sceneOf({ band: p }), sumTok, [lead ? 'colLead' : 'col', { sum: sumTok, d: r, ...place }], {
                scratch: [`${cur[p]} − ${db} = ${r}`],
                plainSums: true,
                minor: !last,
                short: last ? ['colsShort', { sum: sumTok, d: r, ...place }] : null,
                memory
            }));
        }
        steps.push(step(sceneOf({ end: true }), `[a:${a}] − [b:${b}] = [c:${res}]`, ['end', { res, est: est.re }]));
        return steps;
    }
};

// Column multiplication, written the Norwegian way: the factors side by side on one line, one row
// for each digit of the second factor, then the rows added together.
const colMul = {
    id: 'colMul',
    applies: (a, b) => a >= 10 && b >= 2 && b <= 99,
    build(a, b) {
        const res = a * b;
        const A = digitsOf(a);
        const B = digitsOf(b);
        // A zero digit in the second number gives a row of zeros, which is not written: 47 × 20
        // only has the tens row.
        const active = B.map((_, k) => k).filter((k) => B[k] !== 0);
        const slot = (k) => active.indexOf(k);
        const two = active.length > 1;
        const rowKey = two ? 'e' : 'c';
        const g = colGrid(lenOf(res), (B.length + 1) * COL_W + EST_W);
        const bx = (j) => g.x(-1 - (B.length - j));
        const Y = { head: AREA_PAD + 4, carry: AREA_PAD + 46, a: AREA_PAD + 104, line: AREA_PAD + 120 };
        const rowY = (k) => Y.line + 58 + slot(k) * COL_ROW;
        const lastRow = active[active.length - 1];
        const Y2 = { line: rowY(lastRow) + 16, r: rowY(lastRow) + 74 };
        const ra = roundLead(a);
        const rb = roundLead(b);
        const est = { ra, rb, re: ra * rb };
        const rows = B.map(() => new Map());
        const zeros = B.map(() => new Set());
        const carries = new Map();
        let sum = null;
        const sceneOf = (look = {}) => {
            const items = placeHeads(g, Y.head);
            A.forEach((d, p) => items.push(colDigit(`a${p}`, g.x(p), Y.a, d, COLORS.a)));
            items.push(colDigit('times', g.x(-1), Y.a, '×', TEXT));
            B.forEach((d, j) => items.push(colDigit(`b${j}`, bx(j), Y.a, d, COLORS.b)));
            items.push(hLine('line', g.left - COL_SIGN + 8, bx(0) + COL_W / 2, Y.line));
            for (const [p, v] of carries) items.push(...smallMark(`cy${p}`, g.x(p), Y.carry, v, 'd'));
            rows.forEach((row, k) => {
                for (const [p, d] of row) items.push(colDigit(`m${k}_${p}`, g.x(p), rowY(k), d, COLORS[rowKey]));
                for (const p of zeros[k]) items.push(colDigit(`m${k}_${p}`, g.x(p), rowY(k), 0, COLORS.m));
            });
            if (sum != null) {
                items.push(colDigit('plus', g.signX, rowY(lastRow), '+', TEXT));
                items.push(hLine('line2', g.left - COL_SIGN + 8, g.right, Y2.line));
                digitsOf(sum).forEach((d, p) => items.push(colDigit(`r${p}`, g.x(p), Y2.r, d, COLORS.c)));
            }
            if (look.band != null) items.push(colBand('colband', g.x(look.band), Y.carry - 28, Y.a + 14));
            if (look.bandB != null) items.push(colBand('colband2', bx(look.bandB), Y.a - 46, Y.a + 14));
            const ex = bx(0) + COL_W / 2 + 24;
            if (look.est || look.end) items.push(...estText('est', ex, Y.a, est.re));
            if (look.est) items.push({ ...text('estS', ex, Y.a + 46, `${ra} × ${rb}`, 22, DIM, 'start'), plain: true });
            return { w: g.w, h: (two ? Y2.r : rowY(active[0])) + AREA_PAD - 20, items };
        };
        const v0 = { a, b, ...est };
        const steps = [
            step(sceneOf(), `[a:${a}] × [b:${b}]`, [two ? 's0two' : 's0', v0], { ask: ['a0', v0] }),
            step(sceneOf({ est: true }), `${ra} × ${rb} = ${est.re}`, ['est', v0], { scratch: [`${ra} × ${rb} = ${est.re}`], plainSums: true })
        ];
        const memory = estMemory(est.re);
        const parts = [];
        B.forEach((bk, k) => {
            if (!bk) return;
            carries.clear();
            if (k > 0) {
                for (let z = 0; z < k; z++) zeros[k].add(z);
                steps.push(step(sceneOf({ bandB: k }), `[a:${a}] × [b:${bk * 10 ** k}]`, ['shift', { bk, bv: bk * 10 ** k }], { memory }));
            }
            let carry = 0;
            A.forEach((ap, p) => {
                const prod = ap * bk;
                const s = prod + carry;
                const last = p === A.length - 1;
                const sumTok = `[a:${ap}] × [b:${bk}]${carry ? ` + [d:${carry}]` : ''} = ${s}`;
                const lines = [`${ap} × ${bk} = ${prod}`];
                if (carry) lines.push(`${prod} + ${carry} = ${s}`);
                rows[k].set(p + k, s % 10);
                if (last && s >= 10) rows[k].set(p + k + 1, Math.floor(s / 10));
                carry = last ? 0 : Math.floor(s / 10);
                if (!last && carry) carries.set(p + 1, carry);
                if (!last && !carry) carries.delete(p + 1);
                const key = last && s >= 10 ? 'digEnd' : carry ? 'digCarry' : 'dig';
                const v = { sum: sumTok, d: s % 10, s, c: carry, rc: rowKey, b: bk, a, part: a * bk * 10 ** k, Place: capFirst(placeName('the', p)) };
                const endOfAll = last && !two;
                steps.push(step(sceneOf({ band: p, bandB: k }), sumTok, [key, v], {
                    scratch: lines,
                    plainSums: true,
                    minor: !endOfAll,
                    short: endOfAll ? ['digsShort', v] : null,
                    memory
                }));
            });
            const part = a * bk * 10 ** k;
            parts.push(part);
            if (two) {
                carries.clear();
                steps.push(step(sceneOf(), `[a:${a}] × [b:${bk * 10 ** k}] = [e:${part}]`, [k ? 'rowDone2' : 'rowDone', { a, bv: bk * 10 ** k, part }], {
                    short: [k ? 'rowShort2' : 'rowShort', { a, bv: bk * 10 ** k, part }],
                    memory
                }));
            }
        });
        if (two) {
            sum = res;
            steps.push(step(sceneOf(), `[e:${parts[0]}] + [e:${parts[1]}] = [c:${res}]`, ['addRows', { p0: parts[0], p1: parts[1], res }], {
                scratch: [`${parts[0]} + ${parts[1]} = ${res}`],
                plainSums: true,
                memory
            }));
        }
        carries.clear();
        steps.push(step(sceneOf({ end: true }), `[a:${a}] × [b:${b}] = [c:${res}]`, ['end', { res, est: est.re }]));
        return steps;
    }
};

// Division with the Norwegian layout: "864 : 4 = 216" on top, and under the number one small
// subtraction for every digit of the answer, bringing the next digit down each time.
const colDiv = {
    id: 'colDiv',
    applies: (a, b) => a >= 10 && b >= 2 && b <= 99 && a >= b,
    build(a, b) {
        const D = String(a).split('').map(Number);
        const n = D.length;
        const lb = lenOf(b);
        const q = Math.floor(a / b);
        const rest = a % b;
        const x = (i) => AREA_PAD + COL_SIGN + i * COL_W + COL_W / 2;
        const top = AREA_PAD + 40;
        const rowY = (r) => top + r * 54;
        // The estimate: round the number to something the divisor goes into easily.
        const k10 = 10 ** Math.max(0, Math.floor(Math.log10(a / b)));
        const m = Math.max(1, Math.round(a / (b * k10)));
        const est = { ra: m * b * k10, re: m * k10 };
        const qx = (k) => x(n + 2 + lb + k);
        const items0 = () => {
            const items = D.map((d, i) => colDigit(`dv${i}`, x(i), top, d, COLORS.a));
            items.push(colDigit('colon', x(n), top, ':', TEXT));
            String(b).split('').forEach((d, j) => items.push(colDigit(`dd${j}`, x(n + 1 + j), top, d, COLORS.b)));
            items.push(colDigit('eqs', x(n + 1 + lb), top, '=', TEXT));
            return items;
        };
        const quotient = [];
        const work = [];
        let band = null;
        let rows = 1;
        const sceneOf = (look = {}) => {
            const items = items0();
            quotient.forEach((d, k) => items.push(colDigit(`q${k}`, qx(k), top, d, COLORS.c)));
            items.push(...work.map((it) => ({ ...it })));
            if (band != null && look.band !== false) items.push(colBand('colband', x(band), top - 46, rowY(rows - 1) + 16));
            const ex = qx(lenOf(q)) + 30;
            if (look.est || look.end) items.push(...estText('est', ex, top, est.re));
            if (look.est) items.push({ ...text('estS', ex, top + 46, `${est.ra} : ${b}`, 22, DIM, 'start'), plain: true });
            return { w: qx(lenOf(q)) + 30 + EST_W + AREA_PAD, h: rowY(rows) + AREA_PAD - 20, items };
        };
        const v0 = { a, b, ...est };
        const steps = [
            step(sceneOf(), `[a:${a}] : [b:${b}]`, ['s0', v0], { ask: ['a0', v0] }),
            step(sceneOf({ est: true }), `${est.ra} : ${b} = ${est.re}`, ['est', v0], { scratch: [`${est.ra} : ${b} = ${est.re}`], plainSums: true })
        ];
        const memory = estMemory(est.re);
        // The first part of the number that the divisor goes into.
        let i = 0;
        let cur = D[0];
        while (cur < b && i < n - 1) {
            i++;
            cur = cur * 10 + D[i];
        }
        const firstTook = i + 1;
        let curRow = 0;
        let k = 0;
        // The digits that make up the number being divided now (on the top row at first).
        let curItems = [];
        const putNumber = (prefix, value, endCol, row, color) => {
            const ds = String(value).split('');
            const made = ds.map((d, j) => colDigit(`${prefix}${j}`, x(endCol - ds.length + 1 + j), rowY(row), d, color));
            work.push(...made);
            return made;
        };
        const bringDown = (col, row) => {
            const it = { ...colDigit(`dn${col}`, x(col), rowY(row), D[col], COLORS.a), from: { x: x(col), y: top } };
            work.push(it);
            curItems.push(it);
        };
        for (;;) {
            const qd = Math.floor(cur / b);
            const prod = qd * b;
            const rem = cur - prod;
            const lastDigit = i === n - 1;
            quotient.push(qd);
            band = i;
            if (qd === 0) {
                // Nothing to take away: write 0 in the answer and bring the next digit down.
                if (lastDigit) {
                    const v = { b, cur, rest: cur, n: quotient.length };
                    if (cur > 0) curItems.forEach((it) => { it.fill = COLORS.x; });
                    steps.push(step(sceneOf(), `[w:${cur}] : [b:${b}] = [c:0]`, [cur > 0 ? 'zeroLast' : 'zeroDone', v], { memory }));
                    break;
                }
                i++;
                rows = Math.max(rows, curRow + 1);
                bringDown(i, curRow);
                const v = { b, cur, next: D[i], cur2: cur * 10 + D[i], n: quotient.length };
                steps.push(step(sceneOf(), `[w:${cur}] : [b:${b}] = [c:0]`, ['zero', v], { ask: ['aHow', { b, cur: v.cur2 }], memory }));
                cur = v.cur2;
                continue;
            }
            const pr = curRow + 1;
            const start = i - lenOf(prod) + 1;
            putNumber(`pr${k}_`, prod, i, pr, COLORS.d);
            work.push(colDigit(`ps${k}`, x(start) - COL_W * 0.6, rowY(pr), '−', TEXT));
            work.push(hLine(`pl${k}`, x(start) - COL_W * 0.85, x(i) + COL_W / 2, rowY(pr) + 14));
            rows = Math.max(rows, pr + 1);
            const first = k === 0 && firstTook > 1;
            const vHow = { b, cur, qd, prod, d0: D[0], took: firstTook, n: quotient.length };
            steps.push(step(sceneOf(), `[w:${cur}] : [b:${b}] = [c:${qd}]`, [first ? 'howFirst' : 'how', vHow], {
                scratch: [`${qd} × ${b} = ${prod}`],
                plainSums: true,
                memory
            }));
            const rr = pr + 1;
            const final = lastDigit;
            curItems = putNumber(`rm${k}_`, rem, i, rr, final && rem > 0 ? COLORS.x : TEXT);
            rows = Math.max(rows, rr + 1);
            curRow = rr;
            if (final) {
                const v = { cur, prod, rem };
                steps.push(step(sceneOf(), `${cur} − [d:${prod}] = ${final && rem > 0 ? `[x:${rem}]` : rem}`, [rem > 0 ? 'subRest' : 'subDone', v], {
                    scratch: [`${cur} − ${prod} = ${rem}`],
                    plainSums: true,
                    memory
                }));
                break;
            }
            i++;
            bringDown(i, rr);
            const v = { cur, prod, rem, next: D[i], cur2: rem * 10 + D[i] };
            steps.push(step(sceneOf(), `${cur} − [d:${prod}] = ${rem}`, ['sub', v], {
                ask: ['aHow', { b, cur: v.cur2 }],
                scratch: [`${cur} − ${prod} = ${rem}`],
                plainSums: true,
                minor: true,
                memory
            }));
            cur = v.cur2;
            k++;
        }
        band = null;
        steps.push(step(sceneOf({ end: true }), `[a:${a}] : [b:${b}] = [c:${q}]${restTail(rest)}`, [rest ? 'endRest' : 'end', { q, rest, est: est.re }]));
        return steps;
    }
};

// --- Same difference (lik differanse) ---
// Minus is the distance between two numbers on the number line. Moving both numbers the same way
// keeps the distance, so the second number can be made round: 53 − 27 = 56 − 30.
const sameDiff = {
    id: 'sameDiff',
    pick(a, b) {
        const o = b % 10;
        if (!o) return null;
        const k = 10 - o <= o || b < 10 ? 10 - o : -o;
        return a + k <= 999 ? k : null;
    },
    applies(a, b) {
        return b >= 1 && a > b && a <= 999 && this.pick(a, b) !== null;
    },
    build(a, b) {
        const k = this.pick(a, b);
        const a2 = a + k;
        const b2 = b + k;
        const res = a - b;
        const line = new NumberLine([a, b, a2, b2]);
        const sign = k > 0 ? '+' : '−';
        const kk = Math.abs(k);
        const v = { a, b, a2, b2, k: kk, res };
        const wide = (from, to) => Math.abs(line.x(to) - line.x(from)) >= 34;
        const moves = (op) => [
            { id: 'jb', from: b, to: b2, label: wide(b, b2) ? `${sign}${kk}` : null, color: 'd', op },
            { id: 'ja', from: a, to: a2, label: wide(a, a2) ? `${sign}${kk}` : null, color: 'd', op }
        ];
        return [
            step(line.scene([], null, { [b]: 'b', [a]: 'a' }, { from: b, to: a, label: '?', color: 'e' }), `[a:${a}] − [b:${b}]`, ['s0', v], { ask: ['a0', v] }),
            step(line.scene(moves(1), null, { [b]: 'm', [a]: 'm', [b2]: 'b', [a2]: 'a' }, { from: b2, to: a2, label: '?', color: 'e' }), `[a:${a2}] − [b:${b2}]`, [k > 0 ? 's1up' : 's1down', v], {
                scratch: [`${b} ${sign} ${kk} = ${b2}`, `${a} ${sign} ${kk} = ${a2}`],
                plainSums: true
            }),
            step(line.scene(moves(0.3), null, { [b2]: 'b', [a2]: 'a' }, { from: b2, to: a2, label: res, color: 'c' }), `[a:${a2}] − [b:${b2}] = [c:${res}]`, ['s2', v], {
                scratch: [`${a2} − ${b2} = ${res}`],
                lineSums: true
            }),
            step(line.scene([], null, { [b]: 'b', [a]: 'a' }, { from: b, to: a, label: res, color: 'c' }), `[a:${a}] − [b:${b}] = [c:${res}]`, ['s3', v])
        ];
    }
};

// --- Swap the order (bytt rekkefølge) ---
// 3 + 48 is the same as 48 + 3, so start on the big number and count on the small one.
const swapAdd = {
    id: 'swapAdd',
    applies: (a, b) => a >= 1 && a <= 9 && b >= 20 && a + b <= 999,
    build(a, b) {
        const res = a + b;
        const line = new NumberLine([a, res]);
        const long = (op) => ({ id: 'jx', from: a, to: res, label: `+${b}`, color: 'b', dash: '6 6', op });
        const hops = range(a).map((i) => ({ id: `h${i}`, from: b + i, to: b + i + 1, label: line.x(b + 1) - line.x(b) >= 34 ? '+1' : null, color: 'a' }));
        const v = { a, b, res, list: range(a).map((i) => b + i + 1).join(', ') };
        return [
            step(line.scene([long(1)], a, { [a]: 'a' }), `[a:${a}] + [b:${b}]`, ['s0', v], { ask: ['a0', v] }),
            step(line.scene([long(0.25)], b, { [a]: 'a', [b]: 'b' }), `[b:${b}] + [a:${a}]`, ['s1', v]),
            step(line.scene([long(0.25), ...hops], res, { [b]: 'b', [res]: 'c' }), `[b:${b}] + [a:${a}] = [c:${res}]`, ['s2', v], {
                scratch: [`${b} + ${a} = ${res}`],
                lineSums: true
            }),
            step(line.scene([long(1)], res, { [a]: 'a', [res]: 'c' }), `[a:${a}] + [b:${b}] = [c:${res}]`, ['end', v])
        ];
    }
};

// 47 × 3 is 47 jumps of 3. Swapped, 3 × 47 is only 3 jumps of 47.
const swapMul = {
    id: 'swapMul',
    applies: (a, b) => a >= 10 && b >= 2 && b <= 9 && a * b <= 999,
    build(a, b) {
        const res = a * b;
        const line = new NumberLine([0, res]);
        const many = (op) => range(a).map((i) => ({ id: `sh${i}`, from: i * b, to: (i + 1) * b, color: 'b', dash: '3 4', op }));
        const v = { a, b, res };
        const steps = [
            step(line.scene(many(0.8), 0, { 0: 'n' }), `${a} × [b:${b}]`, ['s0', v], { ask: ['a0', v] }),
            step(line.scene(many(0.25), 0, { 0: 'n' }), `${b} × ${a}`, ['s1', v])
        ];
        const big = [];
        const marks = { 0: 'n' };
        for (let i = 1; i <= b; i++) {
            const to = i * a;
            big.forEach((j) => { j.op = 0.45; });
            big.push({ id: `bj${i}`, from: to - a, to, label: `+${a}`, color: 'a' });
            const last = i === b;
            marks[to] = last ? 'c' : 'd';
            steps.push(step(line.scene([...many(0.25), ...big.map((j) => ({ ...j }))], to, { ...marks }),
                last ? `[a:${a}] × [b:${b}] = [c:${res}]` : `${i} × [a:${a}] = [d:${to}]`,
                [last ? 'end' : 'hop', { ...v, i, to }],
                {
                    scratch: [`${to - a} + ${a} = ${to}`],
                    refs: [[itemsRef([`nl${to - a}`], to - a), itemsRef([`bj${i}L`], a)]],
                    subScene: 'self',
                    lineSums: true
                }));
        }
        return steps;
    }
};

// The head strategies draw every unit, so they keep the sizes they were made for. Bigger numbers
// are left to the column methods.
const upTo = (maxA, maxB, s) => ({ ...s, applies(a, b) { return a <= maxA && b <= maxB && s.applies.call(this, a, b); } });

const STRATEGIES = {
    add: [...[makeTen, split, jumps, compensate, doubles].map((s) => upTo(999, 999, s)), swapAdd, colAdd],
    sub: [...[takeAway, jumpsBack, countUp, compensateSub].map((s) => upTo(999, 999, s)), sameDiff, colSub],
    mul: [...[mulSplit, roundAdjust, doubleHalve, halfTen, doubling, skip].map((s) => upTo(99, 99, s)), swapMul, colMul],
    div: [...[share, thinkMul, splitDiv, halving].map((s) => upTo(999, 12, s)), colDiv],
    prime: [tryDivide, sieve],
    parity: [rule, pairs, lastDigit]
};

// ---------- Examples ----------

const crossesTen = (a, b) => a % 10 > 0 && (a % 10) + (b % 10) > 10;

const EXAMPLES = {
    add: {
        easy: () => [rnd(6, 19), rnd(3, 9)],
        medium: () => [rnd(12, 69), rnd(12, 49)],
        hard: () => [rnd(102, 489), rnd(18, 299)]
    },
    sub: {
        easy: () => [rnd(11, 19), rnd(2, 9)],
        medium: () => [rnd(31, 99), rnd(11, 29)],
        hard: () => [rnd(102, 499), rnd(21, 99)]
    },
    mul: {
        easy: () => [rnd(2, 10), rnd(2, 10)],
        medium: () => (Math.random() < 0.5 ? [rnd(3, 9), rnd(11, 25)] : [rnd(11, 25), rnd(3, 9)]),
        hard: () => [rnd(11, 25), rnd(11, 30)]
    },
    parity: {
        easy: () => [rnd(0, 20), 0],
        medium: () => [rnd(20, 200), 0],
        hard: () => [rnd(1000, 999999), 0]
    },
    prime: {
        easy: () => [rnd(2, 30), 0],
        medium: () => [rnd(30, 100), 0],
        hard: () => [rnd(100, 200), 0]
    },
    div: {
        easy: () => { const d = rnd(2, 5); return [d * rnd(2, 10), d]; },
        medium: () => { const d = rnd(3, 9); return [d * rnd(3, 12), d]; },
        hard: () => { const d = rnd(2, 9); return [d * rnd(11, 30), d]; }
    }
};

function acceptExample(mode, level, a, b) {
    if (mode === 'add' && level !== 'hard' && !crossesTen(a, b)) return false;
    if (mode === 'sub' && (b >= a || (level !== 'hard' && a % 10 >= b % 10))) return false;
    return STRATEGIES[mode].some((s) => s.applies(a, b));
}

function makeExample(mode, level, current) {
    for (let i = 0; i < 200; i++) {
        const [a, b] = EXAMPLES[mode][level]();
        if (acceptExample(mode, level, a, b) && !(a === current[0] && b === current[1])) return [a, b];
    }
    throw new Error(`No example found for ${mode}/${level}`);
}

// ---------- Small steps ----------
// Every small sum that is not a known fact is broken into smaller sums, the way you would do it in
// your head: 52 + 30 is 50 + 30 (keep the 2 in mind), and 50 + 30 is 5 + 3 with the zero put back.
// Each small sum says which numbers are kept in mind while it is done.
// Depth 1 shows only the main steps, depth 2 one level of small sums, depth 3 all of them.

const OPS = { '+': (x, y) => x + y, '−': (x, y) => x - y, '×': (x, y) => x * y, ':': (x, y) => x / y };
const SUM_RE = /^(\d+) ([+−×:]) (\d+) = (\d+)$/;
const isRound = (n) => n >= 10 && n % 10 === 0;

// A ref points at the part of the drawing a number stands for: { ids, units }. With units, ids are
// single things (cubes or squares) in reading order, one per 1, so parts of a number can be found:
// the tens are the first full tens, the ones the rest. Without units, the ref only fits its own
// number. Small sums keep refs for their two numbers, so the drawing can show what is talked about.
const unitsRef = (ids) => ({ ids, units: true });
const itemsRef = (ids, value) => ({ ids, units: false, value });
const R = {
    fits: (ref, v) => (ref && (ref.units ? ref.ids.length === v : ref.value === v) ? ref : null),
    tens: (r) => (r?.units ? unitsRef(r.ids.slice(0, r.ids.length - (r.ids.length % 10))) : null),
    ones: (r) => (r?.units ? unitsRef(r.ids.slice(r.ids.length - (r.ids.length % 10))) : null),
    first: (r, n) => (r?.units ? unitsRef(r.ids.slice(0, n)) : null),
    rest: (r, n) => (r?.units ? unitsRef(r.ids.slice(n)) : null),
    last: (r, n) => (r?.units ? unitsRef(n > 0 ? r.ids.slice(-n) : []) : null),
    join: (p, q) => (p?.units && q?.units ? unitsRef([...p.ids, ...q.ids]) : null),
    minus: (p, q) => (p?.units && q?.units ? unitsRef(p.ids.filter((id) => !q.ids.includes(id))) : null),
    // n units of p that include all of q (q is taken out of p), filled up from the end of p.
    around: (p, q, n) => R.join(q, R.last(R.minus(p, q), n - (q?.ids.length ?? 0)))
};

const small = (x, op, y, why, hold = [], rx = null, ry = null, note = null) => ({ x, op, y, r: OPS[op](x, y), why, hold, rx: R.fits(rx, x), ry: R.fits(ry, y), note });
// The part of a number that is not touched (the tens when only the ones change) is kept in mind
// and joined again in the same step: "3 − 1 = 2, we don't touch the 50, so it is 52".
const untouched = (t, r) => ['@untouched', { t, r }];

function explainAdd(x, y, X = null, Y = null) {
    if (x === 0 || y === 0) return [];
    if (x < 10 && y < 10) {
        if (x + y <= 10 || x === y) return [];
        const [big, sm, B, S] = x >= y ? [x, y, X, Y] : [y, x, Y, X];
        const n = 10 - big;
        return [
            small(big, '+', n, 'fillTen', [{ v: sm - n, why: 'rest' }], B, R.first(S, n)),
            small(10, '+', sm - n, 'addRest', [], R.join(B, R.first(S, n)), R.rest(S, n))
        ];
    }
    if (x < 10) return explainAdd(y, x, Y, X);
    const xO = x % 10;
    const xT = x - xO;
    if (y < 10) {
        if (xO === 0 || xO + y === 10 || (x < 20 && xO + y < 10)) return [];
        if (xO + y < 10) return [small(xO, '+', y, 'onesAdd', [], R.ones(X), Y, untouched(xT, x + y))];
        const n = 10 - xO;
        return [
            small(x, '+', n, 'toTen', [{ v: y - n, why: 'rest' }], X, R.first(Y, n)),
            small(xT + 10, '+', y - n, 'addRest', [], R.join(X, R.first(Y, n)), R.rest(Y, n))
        ];
    }
    if (y === 10 || y === 100) return [];
    if (isRound(x) && isRound(y)) return x === 10 ? [] : [small(x / 10, '+', y / 10, 'digits')];
    if (y % 10 === 0) {
        return [
            small(xT, '+', y, 'addTens', [{ v: xO, why: 'ones' }], R.tens(X), Y),
            small(xT + y, '+', xO, 'addOnes', [], R.join(R.tens(X), Y), R.ones(X))
        ];
    }
    const yO = y % 10;
    return [
        small(x, '+', y - yO, 'plusTens', [{ v: yO, why: 'ones' }], X, R.tens(Y)),
        small(x + y - yO, '+', yO, 'plusOnes', [], R.join(X, R.tens(Y)), R.ones(Y))
    ];
}

// In the drawing, the number taken away (Y) is a part of the number it is taken from (X).
function explainSub(x, y, X = null, Y = null) {
    if (y === 0 || x <= 10 || x === y) return [];
    const xO = x % 10;
    const xT = x - xO;
    if (y < 10) {
        if (xO >= y) {
            if (x < 20 || xO === y) return [];
            return [small(xO, '−', y, 'onesSub', [], R.around(X, Y, xO), Y, untouched(xT, x - y))];
        }
        if (xO > 0) {
            const first = R.last(Y, xO);
            return [
                small(x, '−', xO, 'downToTen', [{ v: y - xO, why: 'rest' }], X, first),
                small(xT, '−', y - xO, 'subRest', [], R.minus(X, first), R.minus(Y, first))
            ];
        }
        return [small(10, '−', y, 'fromTen', [], R.around(X, Y, 10), Y, untouched(x - 10, x - y))];
    }
    if (isRound(x) && isRound(y)) return [small(x / 10, '−', y / 10, 'digits')];
    // Taking whole tens away only changes the tens digit: 53 − 20 is 5 − 2 = 3, so 33.
    if (y % 10 === 0) return xT === y || y === 10 ? [] : [small(Math.floor(x / 10), '−', y / 10, 'digits')];
    const yO = y % 10;
    const yT = R.first(Y, y - yO);
    return [
        small(x, '−', y - yO, 'subTens', [{ v: yO, why: 'ones' }], X, yT),
        small(x - y + yO, '−', yO, 'subOnes', [], R.minus(X, yT), R.rest(Y, y - yO))
    ];
}

function explainMul(x, y) {
    if (Math.min(x, y) <= 1 || (x <= 10 && y <= 10)) return [];
    if ([10, 100].includes(x) || [10, 100].includes(y)) return [];
    if (isRound(y)) return [small(x, '×', y / 10, 'digits')];
    if (isRound(x)) return [small(x / 10, '×', y, 'digits')];
    const splitX = x > 10;
    const n = splitX ? x : y;
    const o = splitX ? y : x;
    const nT = n - (n % 10);
    const p1 = nT * o;
    const p2 = (n % 10) * o;
    const part = (v) => (splitX ? [v, '×', o] : [o, '×', v]);
    return [
        small(...part(nT), 'part1'),
        small(...part(n % 10), 'part2', [{ v: p1, why: 'part' }]),
        small(p1, '+', p2, 'partsAdd')
    ];
}

function explainDiv(x, y) {
    if (y <= 1 || x <= 10 * y) return [];
    if (x % 10 === 0 && (x / 10) % y === 0) return [small(x / 10, ':', y, 'digits')];
    const p1 = Math.floor(x / (10 * y)) * 10 * y;
    if (p1 === 0 || p1 === x || (x - p1) % y !== 0) return [];
    const q1 = p1 / y;
    return [small(p1, ':', y, 'part1'), small(x - p1, ':', y, 'part2', [{ v: q1, why: 'part' }]), small(q1, '+', (x - p1) / y, 'partsAdd')];
}

const EXPLAIN = { '+': explainAdd, '−': explainSub, '×': explainMul, ':': explainDiv };
const sumText = (it) => `${it.x} ${it.op} ${it.y} = ${it.r}`;

const sumGoal = (it) => `${it.x} ${it.op} ${it.y}`;
const onlyDigits = (kids) => kids.length === 1 && kids[0].why === 'digits';

function uniqHolds(hold) {
    const seen = new Set();
    return hold.filter((h) => {
        const k = `${h.why}:${h.v}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

// The small sums that lead up to x op y, deepest first. Each has everything kept in mind (hold).
// The first small sum of a group names the sum it works towards (goals), so you know why it is
// done. A sum that is only "forget the zero" (50 + 30 is 5 + 3) is not a step of its own: it is
// shown next to the sum it belongs to (digits).
// A small sum that is broken down further is not repeated after its own small sums: they end in its
// answer, and the first of them names it ("Legg på enerne: 24 + 4").
function smallSums(x, op, y, levels, held, goal, X = null, Y = null) {
    if (levels <= 0) return [];
    const group = [];
    for (const it of EXPLAIN[op](x, y, X, Y)) {
        const hold = uniqHolds([...held, ...it.hold]);
        const kids = EXPLAIN[it.op](it.x, it.y);
        if (levels > 1 && onlyDigits(kids)) {
            group.push({ ...it, hold, digits: kids[0], goals: [] });
            continue;
        }
        const inner = smallSums(it.x, it.op, it.y, levels - 1, hold, { sum: sumGoal(it), why: it.why }, it.rx, it.ry);
        if (inner.length) group.push(...inner);
        else group.push({ ...it, hold, digits: null, goals: [] });
    }
    if (group.length) group[0].goals.unshift(goal);
    return group;
}

// Temporary frames around the parts of the drawing a small sum talks about: pink for the first
// number, lime for the second. Things close together share one frame.
const FRAME_PAD = 5;
const CLUSTER_GAP = 21;

function itemBox(item) {
    if (item.kind === 'rect') return [item.x, item.y, item.x + item.w, item.y + item.h];
    if (item.kind === 'text') {
        const w = String(item.text).length * (item.size || 20) * 0.32;
        return [item.x - w, item.y - (item.size || 20) * 0.8, item.x + w, item.y + 4];
    }
    const q = /^M(-?[\d.]+),(-?[\d.]+) Q(-?[\d.]+),(-?[\d.]+) (-?[\d.]+),(-?[\d.]+)$/.exec(item.d);
    if (q) {
        // A jump arc: its highest point is halfway between the ends and the control point.
        const [x1, y1, cx, cy, x2, y2] = q.slice(1).map(Number);
        const peak = (y1 + 2 * cy + y2) / 4;
        return [Math.min(x1, x2), Math.min(y1, y2, peak), Math.max(x1, x2), Math.max(y1, y2, peak)];
    }
    const nums = (item.d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    const xs = nums.filter((_, i) => i % 2 === 0).map((v) => v + (item.x || 0));
    const ys = nums.filter((_, i) => i % 2 === 1).map((v) => v + (item.y || 0));
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

// Frames around the parts a number stands for, plus a small tag with the number itself.
// count is the number of separate frames; clean is false when a frame would also hold other things.
function frameSet(scene, ref, key, value) {
    if (!ref) return { items: [], count: 0, clean: true };
    const want = new Set(ref.ids);
    const near = (p, q) => p[0] - q[2] <= CLUSTER_GAP && q[0] - p[2] <= CLUSTER_GAP && p[1] - q[3] <= CLUSTER_GAP && q[1] - p[3] <= CLUSTER_GAP;
    let clusters = scene.items.filter((it) => want.has(it.id)).map(itemBox);
    if (!clusters.length) return { items: [], count: 0, clean: false };
    let merged = true;
    while (merged) {
        merged = false;
        const next = [];
        for (const b of clusters) {
            const hit = next.find((c) => near(c, b));
            if (!hit) {
                next.push([...b]);
                continue;
            }
            hit[0] = Math.min(hit[0], b[0]);
            hit[1] = Math.min(hit[1], b[1]);
            hit[2] = Math.max(hit[2], b[2]);
            hit[3] = Math.max(hit[3], b[3]);
            merged = true;
        }
        clusters = next;
    }
    // A frame must only hold what it stands for. If other small things sit inside it, the part
    // is not one clean shape and is not framed.
    const inside = (it, c) => {
        const b = itemBox(it);
        return b[0] >= c[0] - 1 && b[2] <= c[2] + 1 && b[1] >= c[1] - 1 && b[3] <= c[3] + 1;
    };
    const others = scene.items.filter((it) => it.kind === 'rect' && !want.has(it.id) && it.w <= 40 && it.h <= 40 && (it.op ?? 1) > 0);
    if (clusters.some((c) => others.some((it) => inside(it, c)))) return { items: [], count: clusters.length, clean: false };
    const items = clusters.map((c, i) => ({
        id: `hl${key}${i}`,
        kind: 'rect',
        layer: 'front',
        x: c[0] - FRAME_PAD,
        y: c[1] - FRAME_PAD,
        w: c[2] - c[0] + 2 * FRAME_PAD,
        h: c[3] - c[1] + 2 * FRAME_PAD,
        r: 8,
        stroke: COLORS[key],
        sw: 3
    }));
    // The tag sits on the top corner of the frame: left for the first number, right for the second.
    const box = [Math.min(...clusters.map((c) => c[0])), Math.min(...clusters.map((c) => c[1])), Math.max(...clusters.map((c) => c[2]))];
    const tagW = 14 + 10 * String(value).length;
    const tagX = key === 'p' ? box[0] - FRAME_PAD - 6 : box[2] + FRAME_PAD + 6 - tagW;
    const tagY = box[1] - FRAME_PAD - 18;
    items.push({ id: `hl${key}tag`, kind: 'rect', layer: 'front', x: tagX, y: tagY, w: tagW, h: 22, r: 6, fill: COLORS[key] });
    items.push({ ...text(`hl${key}T`, tagX + tagW / 2, tagY + 17, value, 16, '#16181d'), plain: true });
    return { items, count: clusters.length, clean: true };
}

// When a number in a small sum is not one visible part of the cube drawing (80 = the 50 and the 30
// together), the cubes are grouped the way the sum says: the first number in a pink group, the
// second in a lime group (or lifted out of the first, for a minus). Cubes that are not in the sum
// wait greyed out on a row below, still in the groups they came from.
function regroupScene(base, it) {
    const cubes = base.items.filter((item) => item.unit);
    const fill = new Map(cubes.map((c) => [c.id, c.fill]));
    const inPlay = new Set([...it.rx.ids, ...(it.ry?.ids || [])]);
    const boxes = base.items.filter((item) => item.kind === 'rect' && /box$/.test(item.id) && item.id !== 'membox');
    const rest = new Map();
    for (const c of cubes) {
        if (inPlay.has(c.id)) continue;
        const [cx, cy] = [c.x + c.w / 2, c.y + c.h / 2];
        const home = boxes.find((b) => cx > b.x && cx < b.x + b.w && cy > b.y && cy < b.y + b.h);
        const key = home ? home.id : 'loose';
        if (!rest.has(key)) rest.set(key, []);
        rest.get(key).push(c.id);
    }
    const minus = it.op === '−';
    const parts = minus
        ? [grp('SP', it.rx.ids, it.x, 'p')]
        : [grp('SP', it.rx.ids, it.x, 'p'), opItem('sop'), grp('SQ', it.ry.ids, it.y, 'q')];
    const restIds = [...rest.values()].flat();
    if (restIds.length) {
        parts.push({ row: BLOCKS_TOP + groupH(Math.max(it.rx.ids.length, it.ry?.ids.length || 0)) + 24 });
        [...rest.values()].forEach((ids, k) => parts.push(grp(`SR${k}`, ids, null, 'n')));
    }
    const scene = blocksScene(parts, { colorOf: (id) => fill.get(id), dim: new Set(restIds), lift: minus ? new Set(it.ry.ids) : null });
    if (minus) scene.items.push(...frameSet(scene, it.ry, 'q', it.y).items);
    return scene;
}

function holdMemory(hold) {
    return hold.map((h, i) => ({ id: `mh${i}_${h.why}`, text: h.v, color: 'w', why: h.why }));
}

// "Forget the zero" for round numbers; for a number with ones (53 − 20) only the tens digit changes.
const digitsNote = (d, x = 0, op = '+') => (x % 10 ? [op === '−' ? '@tensDown' : '@tensUp', { d: sumText(d) }] : ['@digitsNote', { d: sumText(d) }]);

function expandSteps(raw, depth, stratId) {
    if (!DEPTHS.includes(depth)) throw new Error(`Unknown depth: ${depth}`);
    if (depth === 1) {
        const steps = [];
        let carry = [];
        raw.forEach((st, i) => {
            if (st.minor && i > 0 && i < raw.length - 1) {
                carry.push(...st.scratch);
                return;
            }
            // st.short is the thought to use when the steps before it were folded into it.
            steps.push(carry.length ? { ...st, scratch: [...carry, ...st.scratch], think: st.short || st.think } : st);
            carry = [];
        });
        return steps;
    }
    // Small sums usually come before the step they explain, and start by naming the sum they work
    // towards. A step with subsAfter shows an action first (like lifting the borrowed cube), so its
    // small sums follow it and work out the sum it has just set up.
    const out = [];
    raw.forEach((st, i) => {
        const after = st.subsAfter;
        const before = i > 0 && st.subScene === 'before' && !after ? raw[i - 1].scene : st.scene;
        const head = stepText(stratId, st.think[0], st.think[1], 'row');
        let parent = st;
        const subs = [];
        const open = new Set();
        st.scratch.forEach((line, li) => {
            const m = SUM_RE.exec(line);
            if (!m) return;
            const [x, op, y] = [Number(m[1]), m[2], Number(m[3])];
            if (st.plainSums) return;
            if (st.lineSums) {
                // On a number line a jump is one move: it is not split into tens and ones. A round
                // jump only changes the tens digit, which is said next to the jump.
                if ((op === '+' || op === '−') && isRound(y) && y > 10 && x >= 10 && y < 100) {
                    const d = small(Math.floor(x / 10), op, y / 10, 'digits');
                    parent = { ...parent, scratch: [sumText(d), ...parent.scratch], notes: [...(parent.notes || []), [op === '+' ? '@tensUp' : '@tensDown', { d: sumText(d) }]] };
                }
                return;
            }
            const kids = EXPLAIN[op](x, y);
            if (onlyDigits(kids)) {
                const note = digitsNote(kids[0], x, op);
                parent = { ...parent, scratch: [sumText(kids[0]), ...parent.scratch], notes: [...(parent.notes || []), note] };
                return;
            }
            const [X, Y] = st.refs?.[li] || [];
            const goal = { sum: `${x} ${op} ${y}`, why: null };
            const found = smallSums(x, op, y, depth === 2 ? 1 : Infinity, [], goal, R.fits(X, x), R.fits(Y, y));
            if (found.length) open.add(li);
            for (const it of found) {
                const memory = [...st.memory, ...holdMemory(it.hold)];
                const held = new Set(memory.map((mm) => mm.id));
                const base = before.items.filter((item) => !held.has(item.id) && !held.has(item.id.replace(/tab$/, 'L')));
                const fp = frameSet({ items: base }, it.rx, 'p', it.x);
                const fq = frameSet({ items: base }, it.ry, 'q', it.y);
                const split = (ref, f) => ref?.units && (f.count > 1 || !f.clean);
                const regroup = (it.op === '+' || it.op === '−') && it.rx?.units && (it.op === '−' || it.ry?.units)
                    && base.some((item) => item.unit) && (split(it.rx, fp) || split(it.ry, fq));
                const shown = regroup ? regroupScene({ items: base }, it) : { ...before, items: [...base, ...fp.items, ...fq.items] };
                const marked = { p: regroup || fp.items.length > 0, q: regroup ? Boolean(it.ry) : fq.items.length > 0 };
                const tok = (v, key) => (marked[key] ? `[${key}:${v}]` : String(v));
                const txt = `${tok(it.x, 'p')} ${it.op} ${tok(it.y, 'q')} = ${it.r}`;
                const pre = it.goals
                    .filter((g) => !(after && g === goal))
                    .map((g) => ['@goalHead', { head: g.why ? stepText(stratId, `@${g.why}`, {}, 'row') : head, sum: g.sum }]);
                const last = it.goals[it.goals.length - 1];
                subs.push({
                    small: true,
                    target: Number(m[4]),
                    ends: it.note ? it.note[1].r : it.r,
                    scene: shown,
                    eq: txt,
                    think: [`@${it.why}`, { line: txt }],
                    pre,
                    notes: [it.digits && digitsNote(it.digits, it.x, it.op), it.note].filter(Boolean),
                    goal: !last || (after && last === goal) ? null : last.sum,
                    ask: null,
                    scratch: it.digits ? [sumText(it.digits), txt] : [txt],
                    memory,
                    minor: false
                });
            }
        });
        if (after) {
            // The step only sets the sum up; its small sums work out the answer.
            // Unless that would only repeat the step before.
            const setUp = parent.scratch.map((line, li) => (open.has(li) ? line.replace(/ = \d+$/, '') : line));
            const prev = out[out.length - 1];
            const prevLines = prev ? (prev.scratch.length ? prev.scratch : [typeof prev.eq === 'function' ? prev.eq() : prev.eq]).map(plain).join('|') : '';
            out.push(setUp.map(plain).join('|') === prevLines ? parent : { ...parent, scratch: setUp }, ...subs);
            return;
        }
        if (subs.length) {
            // What goes into memory or comes out of it in this step is said at its first small sum.
            const prev = out.length ? out[out.length - 1].memory : [];
                        const sameId = (list, mm) => list.some((n) => n.id === mm.id);
            const fetch = prev.filter((mm) => !sameId(st.memory, mm)).map((mm) => ['@fetch', { v: mm.text }]);
            const keep = st.memory.filter((mm) => !sameId(prev, mm)).map((mm) => ['@remember', { v: mm.text }]);
            subs[0] = { ...subs[0], pre: [...fetch, ...keep, ...subs[0].pre] };
        }
        out.push(...subs, parent);
    });
    return out;
}

// The full thought of a step: the sums it works towards, the thought itself and a short note.
function thoughtText(stratId, st) {
    const parts = (st.pre || []).map(([k, v]) => stepText(stratId, k, v, 'think'));
    parts.push(stepText(stratId, st.think[0], st.think[1], 'think'));
    for (const [k, v] of st.notes || []) parts.push(stepText(stratId, k, v, 'think'));
    return parts.join(' ');
}

// Text of a step: strategy steps use s.<strategy>.<key>, small sums use sub.<key>.
function stepText(stratId, key, vars, kind) {
    const sub = key.startsWith('@');
    const k = sub ? key.slice(1) : key;
    if (kind === 'row') return t(sub ? `sub.rows.${k}` : `s.${stratId}.rows.${k}`, vars);
    return t(sub ? `sub.${k}` : `s.${stratId}.${k}`, vars);
}


// ---------- Self-check and debug ----------
// describeSteps gives a plain view of a worked example (used by ?debug and test.html).
// checkSteps lists everything that breaks the rules the explanations must follow.

const plain = (str) => String(str).replace(/\[[a-z]:([^\]]*)\]/g, '$1');
const numbersIn = (str) => (plain(str).match(/\d+/g) || []).map(Number);

function describeSteps(stratId, steps) {
    return steps.map((st, i) => {
        const head = stepText(stratId, st.think[0], st.think[1], 'row');
        const frames = st.scene.items.filter((it) => /^hl[pq]\d+$/.test(it.id) || /^S[PQ]box$/.test(it.id)).map((it) => (it.id.startsWith('S') ? it.id[1].toLowerCase() : it.id[2]));
        return {
            i: i + 1,
            kind: st.small ? 'small' : st.minor ? 'main (minor)' : 'main',
            row: st.goal ? `${st.goal}: ${head}` : head,
            eq: plain(typeof st.eq === 'function' ? st.eq() : st.eq),
            think: plain(thoughtText(stratId, st)),
            sums: st.scratch.map(plain),
            memory: st.memory.map((m) => `${m.text} (${m.why})`),
            frames: { p: frames.filter((k) => k === 'p').length, q: frames.filter((k) => k === 'q').length }
        };
    });
}

function checkSteps(stratId, steps, answer) {
    const issues = [];
    const add = (i, msg) => issues.push(`step ${i + 1}: ${msg}`);
    let prevBig = null;
    steps.forEach((st, i) => {
        const eq = typeof st.eq === 'function' ? st.eq() : st.eq;
        for (const line of st.scratch) {
            const m = SUM_RE.exec(plain(line));
            if (m && OPS[m[2]](Number(m[1]), Number(m[3])) !== Number(m[4])) add(i, `wrong sum ${plain(line)}`);
        }
        const drawn = new Set(st.scene.items.filter((it) => (it.op ?? 1) > 0.2).flatMap((it) => [it.fill, it.stroke]));
        const said = `${eq} ${thoughtText(stratId, st)} ${st.scratch.join(' ')}`;
        for (const m of said.matchAll(/\[([a-z]):/g)) {
            if (m[1] !== 'w' && !drawn.has(COLORS[m[1]])) add(i, `colour ${m[1]} is used in the text but not in the drawing`);
        }
        // Two steps only look the same in the step list when both the headline and the sums match.
        const head = stepText(stratId, st.think[0], st.think[1], 'row');
        const big = `${head} | ${(st.scratch.length ? st.scratch : [eq]).map(plain).join(' ; ')}`;
        if (big === prevBig && i < steps.length - 1) add(i, `same small sum as the step before: ${big}`);
        prevBig = big;
        // A number leaves memory in the step that uses it.
        const next = steps[i + 1];
        for (const m of st.memory) {
            const stays = next && next.memory.some((n) => n.id === m.id && n.text === m.text);
            if (stays) continue;
            if (!next) {
                add(i, `memory ${m.text} (${m.why}) is never used`);
                continue;
            }
            const nextEq = typeof next.eq === 'function' ? next.eq() : next.eq;
            const nextSaid = `${next.scratch.join(' ')} ${nextEq} ${thoughtText(stratId, next)}`;
            const used = numbersIn(nextSaid).includes(Number(m.text)) || next.memory.some((n) => n.id === m.id);
            if (!used) add(i + 1, `memory ${m.text} (${m.why}) is dropped without being used`);
        }
        // A run of small sums ends with the answer of the step it explains.
        if (st.small && (!next || !next.small || next.target !== st.target) && st.ends !== st.target) {
            add(i, `small sums end in ${st.ends}, but they should work out ${st.target}`);
        }
    });
    const last = steps[steps.length - 1];
    const lastEq = plain(typeof last.eq === 'function' ? last.eq() : last.eq);
    if (answer != null && !lastEq.includes(`= ${answer}`)) issues.push(`last step does not show the answer ${answer}: ${lastEq}`);
    return issues;
}

// ---------- App ----------

const $ = (id) => document.getElementById(id);
const els = {
    modes: $('modes'),
    inA: $('in-a'),
    inB: $('in-b'),
    opSign: $('op-sign'),
    answer: $('answer'),
    levels: $('levels'),
    kind: $('kind'),
    eqSign: $('eq-sign'),
    depths: $('depths'),
    example: $('btn-example'),
    error: $('error'),
    strategies: $('strategies'),
    none: $('none'),
    stage: $('stage'),
    eq: $('eq'),
    think: $('think'),
    ask: $('ask'),
    askText: $('ask-text'),
    dots: $('dots'),
    prev: $('btn-prev'),
    next: $('btn-next'),
    restart: $('btn-restart'),
    steps: $('steps'),
    tip: $('tip')
};

const scene = $('scene') ? new Scene($('scene')) : null;

const state = {
    mode: 'add',
    level: 'easy',
    nums: { ...DEFAULTS },
    strat: Object.fromEntries(MODES.map((m) => [m, null])),
    list: [],
    steps: [],
    step: 0,
    revealed: false,
    depth: DEFAULT_DEPTH
};

function parseNum(str) {
    const s = String(str).trim();
    return /^\d+$/.test(s) ? Number(s) : NaN;
}

function validate(mode, a, b) {
    const lim = LIMITS[mode];
    if (mode === 'div' && b === 0) return t('problem.divZero');
    if (mode === 'sub' && b > a) return t('problem.subBig');
    const checks = ONE_NUMBER.includes(mode) ? [[a, lim.a]] : [[a, lim.a], [b, lim.b]];
    for (const [v, [min, max]] of checks) {
        if (!Number.isInteger(v) || v < min || v > max) return t('problem.range', { min, max });
    }
    return null;
}

function answerValue(mode, a, b) {
    return { add: a + b, sub: a - b, mul: a * b, div: Math.floor(a / b), prime: null, parity: null }[mode];
}

function answerText(mode, a, b) {
    if (mode === 'add') return String(a + b);
    if (mode === 'sub') return String(a - b);
    if (mode === 'prime') return t(isPrime(a) ? 'prime.yes' : 'prime.no');
    if (mode === 'parity') return t(a % 2 ? 'parity.odd' : 'parity.even');
    if (mode === 'mul') return String(a * b);
    const q = Math.floor(a / b);
    const r = a % b;
    return r ? `${q} (${t('stage.rest')} ${r})` : String(q);
}

function currentStrategy() {
    return state.list.find((s) => s.id === state.strat[state.mode]) || null;
}

function updateUrl() {
    const [a, b] = state.nums[state.mode];
    const params = new URLSearchParams();
    params.set('m', state.mode);
    params.set('a', a);
    if (!ONE_NUMBER.includes(state.mode)) params.set('b', b);
    if (state.strat[state.mode]) params.set('s', state.strat[state.mode]);
    if (state.depth !== DEFAULT_DEPTH) params.set('d', state.depth);
    if (DEBUG) params.set('debug', '');
    if (lang !== 'nb') params.set('lang', lang);
    history.replaceState(null, '', `?${params}`);
}

const EXTRA_MODES = MODES.filter((m) => !MAIN_MODES.includes(m));

function modeLabel(m, subKey) {
    const name = document.createElement('span');
    name.className = 'mode-name';
    name.append(t(`modes.${m}`));
    const sub = document.createElement('small');
    sub.textContent = t(`${subKey}.${m}`);
    name.append(sub);
    return name;
}

function setMenu(open) {
    const btn = els.modes.querySelector('.more-btn');
    const menu = els.modes.querySelector('.more-menu');
    if (!btn || !menu) return;
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
}

function renderModes() {
    const tabs = MAIN_MODES.map((m) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', String(m === state.mode));
        b.classList.toggle('on', m === state.mode);
        const sign = document.createElement('span');
        sign.className = 'sign';
        sign.textContent = OP_SIGN[m];
        b.append(sign, modeLabel(m, 'modesFormal'));
        b.addEventListener('click', () => setMode(m));
        return b;
    });
    const extraOn = EXTRA_MODES.includes(state.mode);
    const more = document.createElement('div');
    more.className = 'more';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'more-btn';
    btn.classList.toggle('on', extraOn);
    btn.setAttribute('aria-haspopup', 'menu');
    btn.setAttribute('aria-expanded', 'false');
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = '\u25BE';
    if (extraOn) {
        const name = document.createElement('span');
        name.className = 'mode-name';
        name.append(t(`modes.${state.mode}`));
        const sub = document.createElement('small');
        sub.append(t('nav.more'), ' ', caret);
        name.append(sub);
        btn.append(name);
    } else {
        btn.append(t('nav.more'), caret);
    }
    const menu = document.createElement('div');
    menu.className = 'more-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    menu.append(...EXTRA_MODES.map((m) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.setAttribute('role', 'menuitem');
        item.classList.toggle('on', m === state.mode);
        item.append(modeLabel(m, 'modesHint'));
        item.addEventListener('click', () => {
            setMenu(false);
            setMode(m);
        });
        return item;
    }));
    btn.addEventListener('click', () => setMenu(menu.hidden));
    more.append(btn, menu);
    els.modes.replaceChildren(...tabs, more);
    els.levels.replaceChildren(...LEVELS.map((lv) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = t(`levels.${lv}`);
        b.classList.toggle('on', lv === state.level);
        b.setAttribute('aria-pressed', String(lv === state.level));
        b.addEventListener('click', () => {
            state.level = lv;
            renderModes();
            newExample();
        });
        return b;
    }));
    els.depths.replaceChildren(...DEPTHS.map((d) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = t(`ways.depths.${d}`);
        b.classList.toggle('on', d === state.depth);
        b.setAttribute('aria-pressed', String(d === state.depth));
        b.addEventListener('click', () => {
            if (state.depth === d) return;
            state.depth = d;
            renderModes();
            if (state.steps.length) buildSteps(false);
        });
        return b;
    }));
}

function renderStrategies() {
    els.strategies.replaceChildren(...state.list.map((s) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'strategy';
        b.setAttribute('role', 'tab');
        const on = s.id === state.strat[state.mode];
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', String(on));
        const name = document.createElement('b');
        name.textContent = t(`s.${s.id}.name`);
        const desc = document.createElement('span');
        desc.textContent = t(`s.${s.id}.desc`);
        b.append(name, desc);
        b.addEventListener('click', () => {
            if (state.strat[state.mode] === s.id) return;
            state.strat[state.mode] = s.id;
            renderStrategies();
            buildSteps(true);
        });
        return b;
    }));
    els.none.hidden = state.list.length > 0;
}

function renderTexts() {
    const strat = currentStrategy();
    const [a, b] = state.nums[state.mode];
    const last = state.steps.length - 1;
    const atEnd = state.step === last;
    if (atEnd) state.revealed = true;
    els.answer.textContent = state.revealed ? answerText(state.mode, a, b) : '?';
    els.answer.classList.toggle('shown', state.revealed);
    if (!strat) return;
    const st = state.steps[state.step];
    const key = (k) => `s.${strat.id}.${k}`;
    rich(els.eq, typeof st.eq === 'function' ? st.eq() : st.eq);
    els.eq.style.fontSize = '';
    if (els.eq.scrollWidth > els.eq.clientWidth) {
        const size = parseFloat(getComputedStyle(els.eq).fontSize);
        els.eq.style.fontSize = `${Math.floor((size * els.eq.clientWidth) / els.eq.scrollWidth)}px`;
    }
    rich(els.think, thoughtText(strat.id, st));
    els.ask.classList.toggle('off', !st.ask);
    rich(els.askText, st.ask ? t(key(st.ask[0]), st.ask[1]) : '');
    els.tip.textContent = t(key('tip'));
    renderStepList();
    els.dots.replaceChildren(...state.steps.map((_, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.classList.toggle('on', i === state.step);
        d.classList.toggle('done', i < state.step);
        d.setAttribute('aria-label', `${i + 1} / ${state.steps.length}`);
        d.addEventListener('click', () => goTo(i));
        return d;
    }));
    els.prev.disabled = state.step === 0;
    els.restart.disabled = state.step === 0;
    els.next.querySelector('span').textContent = t(atEnd ? 'stage.again' : 'stage.next');
}

// The step list is the whole chain of thoughts at a glance: one row per step with a small copy of
// its drawing, a short headline and the small sum worked out in that step (or the sum as it
// stands, when nothing is worked out).
function buildStepList() {
    let prevKey = '';
    els.steps.replaceChildren(...state.steps.map((st, i) => {
        const li = document.createElement('li');
        li.className = 'stp';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'stp-btn';
        btn.setAttribute('aria-label', t('stage.stepN', { n: i + 1 }));
        btn.addEventListener('click', () => {
            btn.blur();
                        goTo(i);
        });
        const thumb = document.createElementNS(SVG_NS, 'svg');
        thumb.setAttribute('class', 'thumb');
        thumb.setAttribute('aria-hidden', 'true');
        new Scene(thumb).render(st.scene, true);
        const num = document.createElement('span');
        num.className = 'stp-n';
        num.textContent = String(i + 1);
        const body = document.createElement('div');
        body.className = 'stp-body';
        const head = document.createElement('div');
        head.className = 'stp-head';
        const headText = stepText(currentStrategy().id, st.think[0], st.think[1], 'row');
        rich(head, st.goal ? `${st.goal}: ${headText.charAt(0).toLowerCase()}${headText.slice(1)}` : headText);
        body.append(head);
        let lines = st.scratch.length ? st.scratch : [typeof st.eq === 'function' ? st.eq() : st.eq];
        const key = `${headText}|${lines.join('|')}`.replace(/\[[a-z]:([^\]]*)\]/g, '$1');
        if (key === prevKey) lines = [`[c:${answerText(state.mode, ...state.nums[state.mode])}]`];
        prevKey = key;
        for (const line of lines) {
            const calc = document.createElement('div');
            calc.className = 'stp-calc';
            rich(calc, line);
            body.append(calc);
        }
        const here = document.createElement('span');
        here.className = 'stp-here';
        here.textContent = t('stage.here');
        btn.append(num, thumb, body, here);
        li.append(btn);
        return li;
    }));
}

function renderStepList() {
    const rows = [...els.steps.children];
    rows.forEach((li, i) => {
        li.classList.toggle('on', i === state.step);
        li.classList.toggle('done', i < state.step);
        li.classList.toggle('todo', i > state.step);
        li.firstChild.setAttribute('aria-current', i === state.step ? 'step' : 'false');
    });
    const cur = rows[state.step];
    if (!cur) return;
    const box = els.steps;
    if (box.scrollHeight > box.clientHeight) {
        const top = cur.offsetTop - box.offsetTop;
        if (top < box.scrollTop || top + cur.offsetHeight > box.scrollTop + box.clientHeight) {
            box.scrollTo({ top: top - box.clientHeight / 2 + cur.offsetHeight / 2, behavior: 'smooth' });
        }
    }
}

// ?debug shows the whole worked example as JSON, to copy and paste.
const DEBUG = new URLSearchParams(location.search).has('debug');

function renderDebug() {
    if (!DEBUG) return;
    let box = document.getElementById('debug');
    if (!box) {
        box = document.createElement('section');
        box.id = 'debug';
        box.className = 'debug';
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'btn';
        copy.textContent = 'Copy JSON';
        const pre = document.createElement('pre');
        copy.addEventListener('click', () => {
            navigator.clipboard.writeText(pre.textContent).then(
                () => { copy.textContent = 'Copied'; },
                (err) => { copy.textContent = `Copy failed: ${err.message}`; }
            );
        });
        box.append(copy, pre);
        els.stage.after(box);
    }
    const strat = currentStrategy();
    const [a, b] = state.nums[state.mode];
    const data = strat ? {
        url: location.href,
        mode: state.mode,
        a,
        b,
        strategy: strat.id,
        depth: state.depth,
        lang,
        at: state.step + 1,
        issues: checkSteps(strat.id, state.steps, answerValue(state.mode, a, b)),
        steps: describeSteps(strat.id, state.steps)
    } : { mode: state.mode, a, b, strategy: null };
    box.querySelector('pre').textContent = JSON.stringify(data, null, 2);
    box.querySelector('button').textContent = 'Copy JSON';
}

function renderStep(instant) {
    const st = state.steps[state.step];
    if (st) scene.render(st.scene, instant);
    renderTexts();
    renderDebug();
}

function goTo(i) {
    state.step = clamp(i, 0, state.steps.length - 1);
    renderStep(false);
}

function nextStep() {
    goTo(state.step >= state.steps.length - 1 ? 0 : state.step + 1);
}

function buildSteps(instant) {
        const strat = currentStrategy();
    const [a, b] = state.nums[state.mode];
    state.steps = strat ? normalizeSteps(expandSteps(strat.build(a, b), state.depth, strat.id)) : [];
    state.step = 0;
    buildStepList();
    state.revealed = false;
    els.stage.hidden = !strat;
    renderStep(instant);
    updateUrl();
}

function recompute() {
    const [a, b] = state.nums[state.mode];
    const err = validate(state.mode, a, b);
    els.error.hidden = !err;
    els.error.textContent = err || '';
    if (err) {
                state.list = [];
        els.strategies.replaceChildren();
        els.none.hidden = true;
        els.stage.hidden = true;
        els.answer.textContent = '?';
        els.answer.classList.remove('shown');
        return;
    }
    state.list = STRATEGIES[state.mode].filter((s) => s.applies(a, b));
    if (!state.list.some((s) => s.id === state.strat[state.mode])) {
        state.strat[state.mode] = state.list[0]?.id || null;
    }
    renderStrategies();
    buildSteps(true);
    if (!state.list.length) {
        els.answer.textContent = answerText(state.mode, a, b);
        els.answer.classList.add('shown');
    }
}

function setProblem(a, b) {
    state.nums[state.mode] = [a, b];
    els.inA.value = Number.isNaN(a) ? els.inA.value : a;
    els.inB.value = Number.isNaN(b) ? els.inB.value : b;
    recompute();
}

function setMode(mode) {
    if (!MODES.includes(mode)) throw new Error(`Unknown mode: ${mode}`);
    state.mode = mode;
    els.opSign.textContent = OP_SIGN[mode];
    const one = ONE_NUMBER.includes(mode);
    for (const el of [els.opSign, els.inB, els.eqSign]) el.hidden = one;
    rich(els.kind, t(`kinds.${mode}`));
    const [a, b] = state.nums[mode];
    els.inA.max = LIMITS[mode].a[1];
    els.inA.classList.toggle('wide', String(LIMITS[mode].a[1]).length > 3);
    els.inB.classList.toggle('wide', String(LIMITS[mode].b[1]).length > 3);
    els.inB.max = LIMITS[mode].b[1];
    renderModes();
    setProblem(a, b);
}

function newExample() {
    const [a, b] = makeExample(state.mode, state.level, state.nums[state.mode]);
    setProblem(a, b);
}

function applyLang() {
    document.documentElement.lang = lang === 'nb' ? 'nb' : 'en';
    document.title = t('meta.title');
    document.querySelector('meta[name="description"]').setAttribute('content', t('meta.description'));
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
    renderModes();
    rich(els.kind, t(`kinds.${state.mode}`));
    renderStrategies();
    if (!els.error.hidden || !state.steps.length) {
        recompute();
    } else {
        const keep = state.step;
        const revealed = state.revealed;
        buildSteps(true);
        state.revealed = revealed;
        goTo(keep);
    }
}

function init() {
    const params = new URLSearchParams(location.search);
    const mode = MODES.includes(params.get('m')) ? params.get('m') : 'add';
    const a = parseNum(params.get('a') ?? '');
    const b = ONE_NUMBER.includes(mode) ? 0 : parseNum(params.get('b') ?? '');
    if (!Number.isNaN(a) && !Number.isNaN(b)) state.nums[mode] = [a, b];
    if (params.get('s')) state.strat[mode] = params.get('s');
    const depth = Number(params.get('d'));
    if (DEPTHS.includes(depth)) state.depth = depth;

    let debounce = 0;
    const onInput = () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => setProblem(parseNum(els.inA.value), parseNum(els.inB.value)), 350);
    };
    els.inA.addEventListener('input', onInput);
    els.inB.addEventListener('input', onInput);
    els.example.addEventListener('click', newExample);
    els.answer.addEventListener('click', () => {
        if (els.error.hidden) {
            state.revealed = !state.revealed || state.step === state.steps.length - 1;
            renderTexts();
        }
    });
    els.prev.addEventListener('click', () => { goTo(state.step - 1); });
    els.next.addEventListener('click', () => { nextStep(); });
    els.restart.addEventListener('click', () => { goTo(0); });
    document.addEventListener('click', (e) => {
        if (!(e.target instanceof Element) || !e.target.closest('.more')) setMenu(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setMenu(false);
        if (e.target instanceof HTMLInputElement || e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === 'ArrowRight') { if (state.step < state.steps.length - 1) goTo(state.step + 1); }
        if (e.key === 'ArrowLeft') { goTo(state.step - 1); }
    });
    document.querySelectorAll('[data-lang]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (btn.dataset.lang === lang) return;
            lang = btn.dataset.lang;
            storeLang(lang);
            applyLang();
            updateUrl();
        });
    });

    applyLang();
    setMode(mode);
}

if (scene) init();
