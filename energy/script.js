'use strict';

const TAU = Math.PI * 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const G = 9.81;
const APPLE_J = 4e5;
const MUSCLE_EFFICIENCY = 0.25;
const ROCK_C = 790;
const ROCK_DENSITY = 2700;
const AIR_DENSITY = 1.2;
const KID_KG = 35;
const BODY_C = 3500;
const PILLOW_KG = 0.5;
const PILLOW_C = 1300;
const BALL_KG = 0.1;
const RUBBER_C = 1500;
const EXPLOSIVE_J_PER_KG = 4.2e6;
const MOON_LIGHT_S = 1.28;

const FORMS = {
    chemical: { color: '#43d17a', emoji: '🍎', examples: ['🍎', '⛽', '🔋'], group: 'stored' },
    height: { color: '#4d8bff', emoji: '⛰️', examples: ['🪨', '🎢', '💧'], group: 'stored' },
    elastic: { color: '#ff6fcf', emoji: '🏹', examples: ['🏹', '🤸', '🎈'], group: 'stored' },
    nuclear: { color: '#b8f53a', emoji: '⚛️', examples: ['☀️', '⚛️', '🏭'], group: 'stored' },
    motion: { color: '#ff4757', emoji: '🏃', examples: ['🚲', '⚽', '💨'], group: 'moving' },
    heat: { color: '#ff9f1c', emoji: '🔥', examples: ['🔥', '☕', '🌋'], group: 'moving' },
    light: { color: '#ffe74c', emoji: '💡', examples: ['☀️', '💡', '📱'], group: 'moving' },
    sound: { color: '#a678ff', emoji: '🔊', examples: ['🥁', '📢', '🎵'], group: 'moving' },
    electric: { color: '#3ee0f2', emoji: '⚡', examples: ['🔌', '⛈️', '🚋'], group: 'moving' }
};
const FORM_IDS = Object.keys(FORMS);

// ---------- i18n ----------

const LANGS = ['en', 'nb'];
const LOCALES = { en: 'en-GB', nb: 'nb-NO' };
const LANG_STORAGE_KEY = 'energy-lang';
const langListeners = [];

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
    if (LANGS.includes(saved)) return saved;
    return /^(nb|nn|no)\b/i.test(navigator.language || '') ? 'nb' : 'en';
})();

function lookup(root, path) {
    return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), root);
}

function tv(path) {
    let value = lookup(I18N[lang], path);
    if (value === undefined) value = lookup(I18N.en, path);
    if (value === undefined) {
        console.error(`Missing translation: ${path}`);
        return path;
    }
    return value;
}

function t(path, vars = {}) {
    return String(tv(path)).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function onLang(fn) { langListeners.push(fn); }

// ---------- Math and colour ----------

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function lerp(a, b, k) { return a + (b - a) * k; }
function smooth(k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }
function frac(x) { return x - Math.floor(x); }

function hash01(a, b) {
    let h = Math.imul(a + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12; h = Math.imul(h, 0x297a2d39);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
}

function hexRGB(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function rgba(rgb, a = 1) { return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; }
function mixRGB(a, b, k) { return [0, 1, 2].map((i) => Math.round(lerp(a[i], b[i], k))); }
const FORM_RGB = Object.fromEntries(FORM_IDS.map((f) => [f, hexRGB(FORMS[f].color)]));

function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

// ---------- Number formatting ----------

function nf(x, sig = 2) {
    return x.toLocaleString(LOCALES[lang], { maximumSignificantDigits: sig });
}

function fmtApples(joules) {
    const a = joules / APPLE_J;
    if (a >= 1.5) return t('lab.fmt.apples', { n: nf(a) });
    if (a >= 0.75) return t('lab.fmt.apple');
    return t('lab.fmt.applePart', { n: nf(1 / a) });
}

function fmtDeg(d) {
    if (d < 1e-6) return t('lab.fmt.tiny');
    return `+${nf(d, d < 0.01 ? 1 : 2)} °C`;
}

function fmtMeters(m) { return `${nf(m, 3)} m`; }
function fmtKmh(v) { return `${nf(v * 3.6, 2)} km/h`; }
function fmtKg(kg) { return `${nf(kg, 3)} kg`; }

// ---------- Canvas stage ----------

class Stage {
    constructor(canvas, draw) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.draw = draw;
        this.w = 0;
        this.h = 0;
        this.dpr = 1;
        this.visible = false;
        this.raf = 0;
        new ResizeObserver(() => this.resize()).observe(canvas);
        new IntersectionObserver((entries) => {
            this.visible = entries[entries.length - 1].isIntersecting;
            if (this.visible) this.request();
        }, { rootMargin: '120px' }).observe(canvas);
        this.resize();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        if (w === this.w && h === this.h && dpr === this.dpr) return;
        this.w = w;
        this.h = h;
        this.dpr = dpr;
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        this.request();
    }

    request() {
        if (this.raf || !this.visible) return;
        this.raf = requestAnimationFrame((ts) => this.frame(ts));
    }

    frame(ts) {
        this.raf = 0;
        const ctx = this.ctx;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, this.w, this.h);
        this.draw(ctx, this.w, this.h, ts / 1000);
        this.request();
    }
}

// ---------- The energy-ball engine ----------
//
// Every ball is one fixed chunk of energy. A story is a script: each ball gets a list of
// stops (when it arrives, which form it has, which region it sits in). Nothing is simulated
// frame by frame, so any moment can be drawn directly and scrubbing is always exact.
// Balls are never created or removed after the start, which is the whole point.

const VH = 600;
const BALL_R = 7;
const SPACING = 15;
// A ball changes colour right as it sets off, so in flight it already shows its new form.
const FORM_SWITCH = 0.12;

// A region is a function of time returning either a cluster (packed around a centre)
// or an area (balls spread evenly inside a box, optionally limited by a shape test).
function regionPoint(spec, slot) {
    if (spec.area) {
        for (let k = 0; k < 80; k++) {
            const i = slot + k * 1031 + spec.seed * 7;
            const x = lerp(spec.x0, spec.x1, frac(0.5 + i * 0.6180339887));
            const y = lerp(spec.y0, spec.y1, hash01(spec.seed, i));
            if (!spec.inside || spec.inside(x, y)) return [x, y];
        }
        throw new Error(`No free point in area region (seed ${spec.seed})`);
    }
    const r = 0.525 * (spec.d ?? SPACING) * Math.sqrt(slot + 0.5);
    const a = slot * GOLDEN;
    return [spec.x + r * Math.cos(a) * (spec.sx ?? 1), spec.y + r * Math.sin(a) * (spec.sy ?? 1)];
}

function checkForm(form) {
    if (!FORMS[form]) throw new Error(`Unknown energy form: ${form}`);
}

class Plan {
    constructor() {
        this.balls = [];
        this.regions = new Map();
    }

    region(name, fn) {
        if (this.regions.has(name)) throw new Error(`Region ${name} defined twice`);
        this.regions.set(name, { fn, occ: new Map() });
        return name;
    }

    reg(name) {
        const r = this.regions.get(name);
        if (!r) throw new Error(`Unknown region ${name}`);
        return r;
    }

    claim(name, id) {
        const occ = this.reg(name).occ;
        let slot = 0;
        while (occ.has(slot)) slot++;
        occ.set(slot, id);
        return slot;
    }

    put(count, form, region) {
        checkForm(form);
        for (let i = 0; i < count; i++) {
            const id = this.balls.length;
            const slot = this.claim(region, id);
            this.balls.push({ id, stops: [{ t: -Infinity, dur: 0, form, region, slot, hop: 0 }] });
        }
    }

    last(id) {
        const stops = this.balls[id].stops;
        return stops[stops.length - 1];
    }

    // The k balls furthest out in a region, so clusters shrink from the edge.
    take(region, k) {
        const occ = this.reg(region).occ;
        if (occ.size < k) throw new Error(`Region ${region} holds ${occ.size} balls, ${k} requested`);
        return [...occ.keys()].sort((a, b) => b - a).slice(0, k).map((s) => occ.get(s));
    }

    all(region) {
        return this.take(region, this.reg(region).occ.size);
    }

    send(id, region, form, arrive, { dur = 0.6, hop = 0 } = {}) {
        checkForm(form);
        const prev = this.last(id);
        this.reg(prev.region).occ.delete(prev.slot);
        const slot = this.claim(region, id);
        const start = Math.max(arrive - dur, prev.t);
        this.balls[id].stops.push({ t: start + dur, dur, form, region, slot, hop });
    }

    flip(id, form, at, dur = 0.15) {
        checkForm(form);
        const prev = this.last(id);
        const start = Math.max(at - dur, prev.t);
        this.balls[id].stops.push({ ...prev, t: start + dur, dur, form, hop: 0 });
    }

    // Send ids to several destinations, interleaved, arriving evenly spread over [t0, t1].
    mix(ids, dests, t0, t1) {
        const total = dests.reduce((s, d) => s + d.count, 0);
        if (total !== ids.length) throw new Error(`mix: ${ids.length} balls for ${total} places`);
        const order = dests
            .flatMap((d, di) => Array.from({ length: d.count }, (_, j) => ({ d, key: (j + 0.5) / d.count + di * 1e-6 })))
            .sort((a, b) => a.key - b.key);
        order.forEach((o, i) => {
            const at = total === 1 ? t1 : lerp(t0, t1, i / (total - 1));
            this.send(ids[i], o.d.region, o.d.form, at, o.d);
        });
    }

    stream(ids, region, form, t0, t1, opts = {}) {
        this.mix(ids, [{ region, form, count: ids.length, ...opts }], t0, t1);
    }

    flipAll(ids, form, t0, t1, dur = 0.3) {
        ids.forEach((id, i) => this.flip(id, form, ids.length === 1 ? t1 : lerp(t0, t1, i / (ids.length - 1)), dur));
    }

    expectEnd(region, form) {
        this.balls.forEach((b) => {
            const s = this.last(b.id);
            if (s.region !== region || s.form !== form) {
                throw new Error(`Ball ${b.id} ends as ${s.form} in ${s.region}, expected ${form} in ${region}`);
            }
        });
    }

    // Index of the stop a ball is at (or heading to) at time t.
    stopIndex(ball, t) {
        const s = ball.stops;
        let k = 0;
        while (k + 1 < s.length && s[k + 1].t - s[k + 1].dur <= t) k++;
        return k;
    }

    formAt(ball, t) {
        const k = this.stopIndex(ball, t);
        const cur = ball.stops[k];
        if (k > 0 && t < cur.t - cur.dur * (1 - FORM_SWITCH)) return ball.stops[k - 1].form;
        return cur.form;
    }

    state(ball, t, time) {
        const s = ball.stops;
        const k = this.stopIndex(ball, t);
        const cur = s[k];
        const pos = (stop) => regionPoint(this.reg(stop.region).fn(t), stop.slot);
        if (k > 0 && t < cur.t) {
            const prev = s[k - 1];
            const p = clamp((t - (cur.t - cur.dur)) / cur.dur, 0, 1);
            const e = smooth(p);
            const a = pos(prev);
            const b = pos(cur);
            const c = smooth(p / (2 * FORM_SWITCH));
            return {
                x: lerp(a[0], b[0], e),
                y: lerp(a[1], b[1], e) - Math.sin(Math.PI * p) * cur.hop,
                rgb: mixRGB(FORM_RGB[prev.form], FORM_RGB[cur.form], c),
                form: p < FORM_SWITCH ? prev.form : cur.form,
                region: cur.region
            };
        }
        const [x, y] = pos(cur);
        const [jx, jy] = jiggle(cur.form, ball.id, time);
        return { x: x + jx, y: y + jy, rgb: FORM_RGB[cur.form], form: cur.form, region: cur.region };
    }

    countIn(region, t) {
        return this.balls.reduce((n, b) => {
            const k = this.stopIndex(b, t);
            const s = b.stops[k];
            return n + (s.region === region && t >= s.t ? 1 : 0);
        }, 0);
    }
}

// How each form moves on its own: heat shivers (wiggling atoms), food energy bobs gently,
// sound buzzes. Uses wall-clock time so it keeps going while paused.
function jiggle(form, id, time) {
    switch (form) {
        case 'heat': return [1.8 * Math.sin(time * 21 + id * 1.7), 1.8 * Math.cos(time * 17 + id * 2.9)];
        case 'chemical': return [0, 1.3 * Math.sin(time * 2.2 + id)];
        case 'sound': return [1.6 * Math.sin(time * 15 + id), 0];
        default: return [0, 0];
    }
}

function drawBall(ctx, x, y, rgb, form, time, id) {
    const r = BALL_R;
    const twinkle = form === 'light' ? 0.75 + 0.25 * Math.sin(time * 9 + id) : 1;
    const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.3);
    g.addColorStop(0, rgba(rgb, 0.5 * twinkle));
    g.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x - r * 0.33, y - r * 0.35, r * 0.3, 0, TAU);
    ctx.fill();
}

// ---------- The world (shared by every experiment) ----------

const JOULE_R = 50;
// Narrow (phone) canvases cut off the far side of the mountain instead of shrinking everything.
const MIN_CLIFF_X = 330;

function layout(W) {
    const gy = 480;
    const cx = Math.max(W - 430, MIN_CLIFF_X);
    return {
        W,
        gy,
        cx,
        jx: cx - 170,
        jy: gy - 30 - JOULE_R,
        mountain: [[cx, gy], [cx, 168], [cx + 10, 160], [cx + 60, 150], [cx + 140, 108], [cx + 205, 150], [cx + 300, 250], [W + 2, 330], [W + 2, gy]]
    };
}

function baseRegions(plan, L) {
    plan.region('space', () => ({ area: true, seed: 1, x0: 24, x1: L.W - 24, y0: 14, y1: 58 }));
    plan.region('air', () => ({
        area: true, seed: 2, x0: 24, x1: L.cx - 22, y0: 100, y1: 440,
        inside: (x, y) => Math.hypot(x - L.jx, y - L.jy) > JOULE_R + 22
    }));
    plan.region('ground', () => ({ area: true, seed: 3, x0: 24, x1: L.W - 24, y0: L.gy + 26, y1: VH - 14 }));
    plan.region('belly', (tt) => ({ x: L.jx, y: L.jy + 8 + (L.joff ? L.joff(tt) : 0), d: 13, sy: 0.85 }));
    plan.region('warm', () => ({ x: L.jx + (L.warmDx || 0), y: L.jy - JOULE_R - 72, d: 14 }));
}

const STARS = Array.from({ length: 46 }, (_, i) => [hash01(i, 1), hash01(i, 2) * 64, hash01(i, 3)]);

function drawWorld(ctx, L) {
    const { W, gy, cx } = L;
    const sky = ctx.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, '#04060c');
    sky.addColorStop(0.13, '#0a1228');
    sky.addColorStop(0.5, '#142446');
    sky.addColorStop(1, '#22406f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, gy);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    STARS.forEach(([x, y, s]) => ctx.fillRect(x * W, y, s > 0.7 ? 2 : 1, s > 0.7 ? 2 : 1));
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 72);
    ctx.lineTo(W, 72);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 15px Fredoka, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`↑ ${t('lab.space')}`, 14, 78);

    const sun = ctx.createRadialGradient(SKY_SUN.x, SKY_SUN.y, 0, SKY_SUN.x, SKY_SUN.y, SKY_SUN.r * 2.6);
    sun.addColorStop(0, 'rgba(255,230,150,0.35)');
    sun.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(SKY_SUN.x, SKY_SUN.y, SKY_SUN.r * 2.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffd77a';
    ctx.beginPath();
    ctx.arc(SKY_SUN.x, SKY_SUN.y, SKY_SUN.r, 0, TAU);
    ctx.fill();

    const m = L.mountain;
    const rock = ctx.createLinearGradient(0, 110, 0, gy);
    rock.addColorStop(0, '#56607a');
    rock.addColorStop(1, '#2b3244');
    ctx.fillStyle = rock;
    ctx.beginPath();
    m.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(cx, 166, 14, gy - 166);
    ctx.fillStyle = '#e9eef7';
    ctx.beginPath();
    ctx.moveTo(cx + 108, 128);
    ctx.lineTo(cx + 140, 108);
    ctx.lineTo(cx + 178, 133);
    ctx.lineTo(cx + 160, 128);
    ctx.lineTo(cx + 146, 138);
    ctx.lineTo(cx + 128, 127);
    ctx.closePath();
    ctx.fill();

    const soil = ctx.createLinearGradient(0, gy, 0, VH);
    soil.addColorStop(0, '#4a3524');
    soil.addColorStop(1, '#22170e');
    ctx.fillStyle = soil;
    ctx.fillRect(0, gy, W, VH - gy);
    ctx.fillStyle = '#3c8a4c';
    ctx.fillRect(0, gy - 2, cx, 10);
}

// Joule: a see-through energy kid, so you can see the balls inside.
function drawJouleBody(ctx, L, { warm = 0, hand = null, dy = 0 } = {}) {
    ctx.save();
    ctx.translate(0, dy);
    const { jx: x, jy: y, gy } = L;
    const R = JOULE_R;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x - 18, y + R - 8);
    ctx.lineTo(x - 22, gy);
    ctx.moveTo(x + 18, y + R - 8);
    ctx.lineTo(x + 22, gy);
    ctx.moveTo(x - R + 6, y + 8);
    ctx.lineTo(x - R - 14, y + 38);
    const [hx, hy] = hand || [x + R + 14, y + 38];
    ctx.moveTo(x + R - 6, y + 8);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    if (warm > 0) {
        const g = ctx.createRadialGradient(x, y, R * 0.6, x, y, R * 1.7);
        g.addColorStop(0, rgba(FORM_RGB.heat, 0.45 * warm));
        g.addColorStop(1, rgba(FORM_RGB.heat, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, R * 1.7, 0, TAU);
        ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,214,10,0.10)';
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 4, y - R);
    ctx.lineTo(x + 10, y - R - 16);
    ctx.stroke();
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath();
    ctx.moveTo(x + 10, y - R - 30);
    ctx.lineTo(x + 3, y - R - 15);
    ctx.lineTo(x + 10, y - R - 15);
    ctx.lineTo(x + 6, y - R - 3);
    ctx.lineTo(x + 17, y - R - 20);
    ctx.lineTo(x + 11, y - R - 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawJouleFace(ctx, L, { mouth = 0, warm = 0, look = 1, dy = 0 } = {}) {
    const { jx: x } = L;
    const y = L.jy + dy;
    [-17, 17].forEach((dx) => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + dx, y - 22, 9, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(x + dx + 3 * look, y - 21, 4.2, 0, TAU);
        ctx.fill();
    });
    if (warm > 0.05) {
        ctx.fillStyle = `rgba(255,90,60,${0.55 * warm})`;
        [-30, 30].forEach((dx) => { ctx.beginPath(); ctx.ellipse(x + dx, y - 4, 7, 4, 0, 0, TAU); ctx.fill(); });
    }
    if (mouth > 0.05) {
        ctx.fillStyle = '#3a0f14';
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 2, 9, 4 + 10 * mouth, 0, 0, TAU);
        ctx.fill();
    } else {
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + 2, y - 6, 12, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
    }
}

// Expanding sound arcs sent out between t0 and t1.
function soundArcs(ctx, x, y, t, t0, t1, { speed = 260, maxR = 260, from = -0.6, to = 0.6, every = 0.22 } = {}) {
    ctx.lineWidth = 3;
    for (let e = t0; e <= t1; e += every) {
        const age = t - e;
        if (age < 0) break;
        const r = 14 + age * speed;
        if (r > maxR) continue;
        ctx.strokeStyle = rgba(FORM_RGB.sound, 0.75 * (1 - r / maxR));
        ctx.beginPath();
        ctx.arc(x, y, r, from, to);
        ctx.stroke();
    }
}

function dust(ctx, x, y, t, t0, seed, { count = 10, spread = 60, color = '200,190,170' } = {}) {
    const age = t - t0;
    if (age < 0 || age > 1.4) return;
    for (let i = 0; i < count; i++) {
        const a = Math.PI + hash01(seed, i) * Math.PI;
        const d = spread * (0.3 + 0.7 * hash01(seed, i + 50)) * Math.min(1, age * 2.5);
        ctx.fillStyle = `rgba(${color},${0.6 * (1 - age / 1.4)})`;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.5, 6 + age * 10, 0, TAU);
        ctx.fill();
    }
}

// The last two acts are the same in every experiment: spread out thin, then glow away to space.
function finale(plan, groups, tSpread, tSpace) {
    groups.forEach(({ region, to, alreadyHeat = false }) => {
        const ids = plan.all(region);
        if (!ids.length) return;
        if (to === region) plan.flipAll(ids, 'heat', tSpread + 0.2, tSpread + 1.2, 0.4);
        else plan.stream(ids, to, 'heat', tSpread + (alreadyHeat ? 0.6 : 0.8), tSpread + 1.9, { dur: alreadyHeat ? 1.1 : 0.9 });
    });
    const left = plan.balls.map((b) => b.id).filter((id) => plan.last(id).region !== 'space');
    plan.stream(left, 'space', 'light', tSpace + 1.0, tSpace + 2.8, { dur: 1.2 });
    plan.expectEnd('space', 'light');
}

// ---------- Where the energy came from, and where it goes in the end ----------
//
// Every experiment can be stretched back to the Big Bang and forward into deep space.
// These parts run at negative time (before the experiment) and after its end.

const COSMOS_LEN = 9.8;
const PRE_WORLD_LEN = { eat: 6.2, fossil: 6.8, sun: 0.4 };
const SKY_SUN = { x: 70, y: 138, r: 24 };
const COSMOS_STARS = Array.from({ length: 140 }, (_, i) => [hash01(i, 21), hash01(i, 22), hash01(i, 23)]);

function treeSpot(L) { return { x: Math.max(74, L.jx - 115), y: 245 }; }

// ending: 'eat' (Joule eats an apple), 'fossil' (ancient plants become explosive), 'sun' (stops at sunlight).
function prequel(plan, L, n, ending, { tEat } = {}) {
    if (!(ending in PRE_WORLD_LEN)) throw new Error(`Unknown prequel ending: ${ending}`);
    const P = COSMOS_LEN + PRE_WORLD_LEN[ending];
    const t0 = -P;
    const cut = t0 + COSMOS_LEN;
    const center = { x: L.W / 2, y: 300 };
    const sun = { x: L.W * 0.24, y: 300 };
    const earth = { x: L.W * 0.8, y: 300 };
    const tree = treeSpot(L);
    const eatAt = ending === 'eat' ? cut + 4.4 : tEat ?? Infinity;
    const appleOnTree = [tree.x + 30, tree.y + 34];
    const mouth = [L.jx + 6, L.jy + 2];
    const applePos = (tt) => {
        const k = smooth((tt - eatAt) / 0.6);
        return [lerp(appleOnTree[0], mouth[0], k), lerp(appleOnTree[1], mouth[1], k)];
    };

    plan.region('bang', () => ({ x: center.x, y: center.y, d: 5 }));
    plan.region('universe', () => ({ area: true, seed: 9, x0: 40, x1: L.W - 40, y0: 50, y1: 550 }));
    plan.region('star', (tt) => ({ x: sun.x, y: sun.y, d: lerp(42, 11, smooth((tt - (t0 + 4.4)) / 2.4)) }));
    plan.region('earth', () => ({ x: earth.x, y: earth.y, d: 7 }));
    plan.region('skySun', () => ({ x: SKY_SUN.x, y: SKY_SUN.y, d: 9 }));
    plan.region('leaves', () => ({ x: tree.x, y: tree.y - 6, d: 14, sx: 1.15, sy: 0.75 }));
    plan.region('apple', (tt) => { const [x, y] = applePos(tt); return { x, y, d: 8 }; });

    plan.put(n, 'light', 'bang');
    const all = plan.balls.map((b) => b.id);
    plan.stream(all, 'universe', 'light', t0 + 0.4, t0 + 1.5, { dur: 1.1 });
    plan.flipAll(all, 'nuclear', t0 + 2.4, t0 + 3.2, 0.3);
    plan.stream(all, 'star', 'nuclear', t0 + 4.4, t0 + 5.6, { dur: 1.2 });
    plan.flipAll(all, 'light', t0 + 7.0, t0 + 7.6, 0.3);
    plan.stream(all, 'earth', 'light', t0 + 8.1, t0 + 9.2, { dur: 0.8 });
    all.forEach((id) => plan.send(id, 'skySun', 'light', cut, { dur: 0 }));

    const phases = [
        { at: t0, text: 'lab.pre.bang', icon: '💥' },
        { at: t0 + 2.2, text: 'lab.pre.atoms', icon: '⚛️' },
        { at: t0 + 4.2, text: 'lab.pre.star', icon: '🌟' },
        { at: t0 + 6.8, text: 'lab.pre.shine', icon: '☀️' },
        { at: t0 + 7.9, text: 'lab.pre.travel', icon: '🌍' }
    ];

    if (ending !== 'sun') {
        plan.stream(all, 'leaves', 'light', cut + 0.4, cut + 1.6, { dur: 0.9 });
        plan.flipAll(all, 'chemical', cut + 2.2, cut + 2.9, 0.3);
        phases.push({ at: cut, text: ending === 'eat' ? 'lab.pre.tree' : 'lab.pre.oldTree', icon: '🌳' });
        phases.push({ at: cut + 2.0, text: 'lab.pre.sugar', icon: '🍃' });
    }
    if (ending === 'eat') {
        plan.stream(all, 'apple', 'chemical', cut + 3.2, cut + 4.0, { dur: 0.6 });
        plan.stream(all, 'belly', 'chemical', cut + 5.0, cut + 5.8, { dur: 0.5 });
        phases.push({ at: eatAt, text: 'lab.pre.eat', icon: '😋' });
    }
    if (ending === 'fossil') {
        plan.region('fossil', () => ({ x: tree.x + 50, y: L.gy + 74, d: 10, sx: 1.7, sy: 0.6 }));
        plan.stream(all, 'fossil', 'chemical', cut + 3.4, cut + 4.6, { dur: 1.0 });
        plan.stream(all, 'charge', 'chemical', cut + 5.4, cut + 6.4, { dur: 1.0 });
        phases.push({ at: cut + 3.2, text: 'lab.pre.buried', icon: '🛢️' });
        phases.push({ at: cut + 5.2, text: 'lab.pre.factory', icon: '🏭' });
    }
    return { tMin: t0, cut, sun, earth, center, applePos, phases };
}

function addEpilogue(built, L) {
    const { plan, dur } = built;
    const cut = dur + 0.3;
    const earth = { x: L.W * 0.5, y: 330 };
    plan.region('earthOut', () => ({ x: earth.x, y: earth.y, d: 7 }));
    plan.region('deep', () => ({
        area: true, seed: 11, x0: 30, x1: L.W - 30, y0: 40, y1: 560,
        inside: (x, y) => Math.hypot(x - earth.x, y - earth.y) > 170
    }));
    const ids = plan.balls.map((b) => b.id);
    ids.forEach((id) => plan.send(id, 'earthOut', 'light', cut, { dur: 0 }));
    plan.stream(ids, 'deep', 'light', cut + 0.9, cut + 2.6, { dur: 1.6 });
    built.post = { cut, earth };
    built.tMin = built.pre.tMin;
    built.tMax = cut + 4.2;
    built.phases.push({ at: cut, text: 'lab.post.far', icon: '🔭' });
}

function sceneAt(built, tt) {
    if (tt < built.pre.cut) return 'pre';
    if (tt >= built.post.cut) return 'post';
    return 'world';
}

function drawCosmos(ctx, L, tt, built, scene) {
    const { W } = L;
    ctx.fillStyle = '#03040a';
    ctx.fillRect(0, 0, W, VH);
    const pre = built.pre;
    const age = tt - pre.tMin;
    const starA = scene === 'post' ? 0.7 : clamp((age - 1.2) / 1.5, 0, 0.7);
    ctx.fillStyle = `rgba(255,255,255,${starA})`;
    COSMOS_STARS.forEach(([x, y, s]) => ctx.fillRect(x * W, y * VH, s > 0.8 ? 2 : 1, s > 0.8 ? 2 : 1));

    const disc = (x, y, r, inner, outer, glowA) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
        g.addColorStop(0, `rgba(255,220,120,${glowA})`);
        g.addColorStop(1, 'rgba(255,160,40,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.4, 0, TAU);
        ctx.fill();
        const d = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        d.addColorStop(0, inner);
        d.addColorStop(1, outer);
        ctx.fillStyle = d;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
    };
    const planet = (x, y, r) => {
        ctx.fillStyle = '#2f6fd6';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3fa55b';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.25, y - r * 0.2, r * 0.45, r * 0.3, 0.5, 0, TAU);
        ctx.ellipse(x + r * 0.35, y + r * 0.35, r * 0.3, r * 0.2, -0.3, 0, TAU);
        ctx.fill();
    };

    if (scene === 'post') {
        disc(W * 0.08, 330, 22, '#fff6c8', '#ffb020', 0.35);
        planet(built.post.earth.x, built.post.earth.y, 16);
        return;
    }
    if (age < 1.8) {
        const r = 20 + age * 420;
        const g = ctx.createRadialGradient(pre.center.x, pre.center.y, 0, pre.center.x, pre.center.y, r);
        g.addColorStop(0, `rgba(255,255,240,${1 - age / 1.8})`);
        g.addColorStop(0.4, `rgba(255,190,90,${0.7 * (1 - age / 1.8)})`);
        g.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, VH);
    }
    const nebula = smooth((age - 3.4) / 0.8) * (1 - smooth((age - 6.2) / 1.0));
    if (nebula > 0) {
        const r = lerp(180, 70, smooth((age - 4.4) / 2.4));
        const g = ctx.createRadialGradient(pre.sun.x, pre.sun.y, 0, pre.sun.x, pre.sun.y, r);
        g.addColorStop(0, `rgba(150,120,220,${0.45 * nebula})`);
        g.addColorStop(1, 'rgba(90,70,160,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pre.sun.x, pre.sun.y, r, 0, TAU);
        ctx.fill();
    }
    if (age >= 5.4) {
        const r = lerp(8, 44, smooth((age - 5.4) / 1.4));
        const lit = smooth((age - 6.8) / 0.6);
        disc(pre.sun.x, pre.sun.y, r, lit > 0.5 ? '#fff6c8' : '#e0a060', lit > 0.5 ? '#ffb020' : '#a0502a', 0.15 + 0.35 * lit);
    }
    if (age >= 6.8) {
        ctx.globalAlpha = smooth((age - 6.8) / 0.6);
        planet(pre.earth.x, pre.earth.y, 15);
        ctx.globalAlpha = 1;
    }
}

function drawAppleTree(ctx, L, tt, built) {
    const { plan, pre } = built;
    const tr = treeSpot(L);
    ctx.fillStyle = '#5a3d27';
    ctx.fillRect(tr.x - 7, tr.y + 30, 14, L.gy - tr.y - 30);
    ctx.fillStyle = '#2d6a40';
    [[0, 0, 62], [-36, 18, 40], [38, 16, 42]].forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(tr.x + dx, tr.y + dy, r, 0, TAU);
        ctx.fill();
    });
    const n = plan.balls.length;
    const apples = plan.countIn('apple', tt);
    if (apples > 0) {
        const [x, y] = pre.applePos(tt);
        const r = 6 + 9 * Math.sqrt(apples / n);
        ctx.fillStyle = '#d93b30';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#5a3d27';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + 2, y - r - 6);
        ctx.stroke();
    }
    if (plan.countIn('fossil', tt) > 0) {
        ctx.fillStyle = '#120c08';
        ctx.beginPath();
        ctx.ellipse(tr.x + 50, L.gy + 74, 52, 20, 0, 0, TAU);
        ctx.fill();
    }
}

// ---------- Experiments ----------

const STONE_KG = 20;
const STONE_BALL_J = 19620;
const STONE_M_PER_BALL = 25;

function stonePhysics(n) {
    const h = n * STONE_M_PER_BALL;
    const radius = Math.cbrt((3 * STONE_KG) / (4 * Math.PI * ROCK_DENSITY));
    const k = 0.5 * AIR_DENSITY * 0.5 * Math.PI * radius * radius;
    const v2 = ((STONE_KG * G) / k) * (1 - Math.exp((-2 * k * h) / STONE_KG));
    return { h, v: Math.sqrt(v2), airShare: 1 - v2 / (2 * G * h), stoneWarm: (0.25 * v2) / ROCK_C };
}

const stoneStory = {
    id: 'stone',
    icon: '🪨',
    build(n, variant, L) {
        const plan = new Plan();
        baseRegions(plan, L);
        const H = n / 4;
        const heatN = n - H;
        const f = n / 40;
        const sx = L.cx - 42;
        const rs = 22;
        const y0 = L.gy - rs;
        const yTop = lerp(y0, 176, f);
        const ph = stonePhysics(n);

        const tLift = 1.2;
        const liftDur = 1.6 + 3.2 * f;
        const tWait = tLift + liftDur;
        const tFall = tWait + 1.4;
        const fallDur = 0.45 + 0.85 * Math.sqrt(f);
        const tCrash = tFall + fallDur;
        const tSpread = tCrash + 2.2;
        const tSpace = tSpread + 2.6;
        const dur = tSpace + 3.6;

        const stoneY = (tt) => {
            if (tt < tLift) return y0;
            if (tt < tWait) return lerp(y0, yTop, (tt - tLift) / liftDur);
            if (tt < tFall) return yTop;
            if (tt < tCrash) return yTop + (y0 - yTop) * ((tt - tFall) / fallDur) ** 2;
            return y0;
        };

        plan.region('stone', (tt) => ({ x: sx, y: stoneY(tt), d: 12 }));
        plan.region('spot', () => ({ x: sx, y: L.gy + 22, d: 13, sx: 1.9, sy: 0.5 }));
        plan.region('trail', () => ({ area: true, seed: 4, x0: sx - 34, x1: sx + 34, y0: yTop, y1: y0 - 30 }));

        const pre = prequel(plan, L, n, 'eat');
        plan.mix(plan.take('belly', n), [
            { region: 'stone', form: 'height', count: H, dur: 0.9, hop: 40 },
            { region: 'warm', form: 'heat', count: heatN, dur: 0.7, hop: 10 }
        ], tLift + 0.5, tWait);

        const onStone = plan.take('stone', H);
        const airN = Math.round(H * ph.airShare);
        const movers = [];
        onStone.forEach((id, j) => {
            const at = tFall + fallDur * Math.sqrt((j + 0.5) / H);
            const toAir = Math.floor(((j + 1) * airN) / H) > Math.floor((j * airN) / H);
            if (toAir) plan.send(id, 'trail', 'heat', at + 0.3, { dur: 0.3 });
            else {
                plan.flip(id, 'motion', at + 0.1, 0.1);
                movers.push(id);
            }
        });

        const soundN = movers.length >= 3 ? 1 : 0;
        const stoneHeat = Math.ceil((movers.length - soundN) / 2);
        movers.forEach((id, i) => {
            if (i < soundN) plan.send(id, 'air', 'sound', tCrash + 1.2, { dur: 1.1 });
            else if (i < soundN + stoneHeat) plan.flip(id, 'heat', tCrash + 0.15, 0.15);
            else plan.send(id, 'spot', 'heat', tCrash + 0.5, { dur: 0.4, hop: 8 });
        });

        finale(plan, [
            { region: 'air', to: 'air' },
            { region: 'warm', to: 'air', alreadyHeat: true },
            { region: 'trail', to: 'air', alreadyHeat: true },
            { region: 'stone', to: 'ground', alreadyHeat: true },
            { region: 'spot', to: 'ground', alreadyHeat: true }
        ], tSpread, tSpace);

        const winch = { x: L.jx + JOULE_R + 30, y: L.gy - 26, r: 15 };
        return {
            plan,
            dur,
            joule: true,
            pre,
            phases: [
                ...pre.phases,
                { at: 0, key: 'start', icon: '🍎' },
                { at: tLift, key: 'lift', icon: '⚙️' },
                { at: tWait, key: 'wait', icon: '⏸️' },
                { at: tFall, key: 'fall', icon: '⬇️' },
                { at: tCrash, key: 'crash', icon: '💥' },
                { at: tSpread, key: 'spread', icon: '〰️' },
                { at: tSpace, key: 'space', icon: '🌌' }
            ],
            readouts: () => [
                ['🍎', 'food', fmtApples(n * STONE_BALL_J)],
                ['⛰️', 'height', fmtMeters(ph.h)],
                ['💨', 'speed', fmtKmh(ph.v)],
                ['🌡️', 'stoneWarm', fmtDeg(ph.stoneWarm)]
            ],
            draw(ctx, tt) {
                const lifting = tt >= tLift && tt < tWait;
                const ang = (clamp((tt - tLift) / liftDur, 0, 1) * 5 + 0.25) * TAU;
                const handle = [winch.x + Math.cos(ang) * winch.r, winch.y + Math.sin(ang) * winch.r];
                const y = stoneY(tt);

                ctx.strokeStyle = '#8b6a45';
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(L.cx + 28, 158);
                ctx.lineTo(L.cx + 28, 98);
                ctx.lineTo(sx - 6, 98);
                ctx.stroke();
                ctx.fillStyle = '#c9ccd4';
                ctx.beginPath();
                ctx.arc(sx, 104, 7, 0, TAU);
                ctx.fill();

                ctx.strokeStyle = '#d8c7a0';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(winch.x, winch.y - winch.r);
                ctx.lineTo(sx - 7, 104);
                if (tt < tFall) ctx.lineTo(sx, y - rs);
                else ctx.lineTo(sx + 4 * Math.sin((tt - tFall) * 6) * Math.exp(tFall - tt), 160);
                ctx.stroke();

                ctx.fillStyle = '#6d5137';
                ctx.fillRect(winch.x - 4, winch.y, 8, 26);
                ctx.fillStyle = '#9c7a52';
                ctx.beginPath();
                ctx.arc(winch.x, winch.y, winch.r, 0, TAU);
                ctx.fill();
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(winch.x, winch.y);
                ctx.lineTo(handle[0], handle[1]);
                ctx.stroke();

                drawJouleBody(ctx, L, { warm: plan.countIn('warm', tt) / n, hand: lifting ? handle : null });

                if (tt >= tCrash) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    [[-26, 8], [-6, 12], [18, 9], [30, 4]].forEach(([dx, dy]) => { ctx.moveTo(sx, L.gy); ctx.lineTo(sx + dx, L.gy + dy); });
                    ctx.stroke();
                }
                ctx.fillStyle = '#8d93a3';
                ctx.strokeStyle = '#5b6070';
                ctx.lineWidth = 3;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * TAU;
                    const rr = rs * (0.86 + 0.14 * hash01(7, i));
                    ctx[i ? 'lineTo' : 'moveTo'](sx + Math.cos(a) * rr, y + Math.sin(a) * rr);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                dust(ctx, sx, L.gy - 4, tt, tCrash, 11);
                soundArcs(ctx, sx, L.gy - 10, tt, tCrash, tCrash + 0.5, { from: Math.PI + 0.2, to: TAU - 0.2, maxR: 220 });
            },
            top(ctx, tt) {
                drawJouleFace(ctx, L, { warm: plan.countIn('warm', tt) / n });
            }
        };
    }
};

const THROW_BALL_J = 2;
const BOUNCE_LOSS = 0.25;
const MAX_MOTION = 10;

const throwStory = {
    id: 'throw',
    icon: '⚽',
    variants: ['bouncy', 'clay'],
    build(n, variant, L) {
        const clay = variant === 'clay';
        const plan = new Plan();
        baseRegions(plan, L);
        const M = n / 4;
        const heatN = n - M;
        const br = 14;
        const bx = L.jx + 80;
        const groundY = L.gy - br;
        const rest = [L.jx + JOULE_R + 14, L.jy + 30];
        const high = [L.jx + JOULE_R + 4, L.jy - 62];
        const release = [bx, L.jy - 20];

        const tWind = 0.9;
        const tRelease = 1.9;
        const tImpact = tRelease + 0.22;

        const bounces = [];
        const contacts = [];

        plan.region('ball', (tt) => {
            const p = ballPos(tt);
            return { x: p[0], y: p[1], d: 10 };
        });
        plan.region('spot', () => ({ x: bx, y: L.gy + 22, d: 13, sx: 1.9, sy: 0.5 }));

        function handPos(tt) {
            if (tt < tWind) return rest;
            if (tt < tRelease - 0.15) {
                const k = smooth((tt - tWind) / (tRelease - 0.15 - tWind));
                return [lerp(rest[0], high[0], k), lerp(rest[1], high[1], k)];
            }
            if (tt < tRelease) {
                const k = (tt - (tRelease - 0.15)) / 0.15;
                return [lerp(high[0], release[0], k), lerp(high[1], release[1], k)];
            }
            const k = smooth((tt - tRelease) / 0.6);
            return [lerp(release[0], rest[0], k), lerp(release[1], rest[1], k)];
        }

        function ballPos(tt) {
            if (tt < tRelease) {
                const h = handPos(tt);
                return [h[0], h[1] - br];
            }
            if (tt < tImpact) return [bx, lerp(release[1] - br, groundY, (tt - tRelease) / (tImpact - tRelease))];
            for (const b of bounces) {
                const tau = tt - b.launch;
                if (tau >= 0 && tau <= 2 * b.T) return [bx, groundY - b.A * (1 - ((tau - b.T) / b.T) ** 2)];
            }
            return [bx, groundY];
        }

        const pre = prequel(plan, L, n, 'eat');
        plan.mix(plan.take('belly', n), [
            { region: 'ball', form: 'motion', count: M, dur: 0.6, hop: 20 },
            { region: 'warm', form: 'heat', count: heatN, dur: 0.7, hop: 10 }
        ], tWind + 0.2, tRelease);

        let onBall = plan.take('ball', M);
        let m = M;
        let tt = tImpact;
        while (m > 0) {
            contacts.push(tt);
            onBall.forEach((id) => plan.flip(id, 'elastic', tt, 0.05));
            const lost = clay ? m : Math.max(1, Math.round(m * BOUNCE_LOSS));
            const up = m - lost;
            const losers = onBall.slice(up);
            const keepers = onBall.slice(0, up);
            const soundN = lost >= 2 ? 1 : 0;
            const stayHeat = clay ? Math.ceil((lost - soundN) / 2) : 0;
            losers.forEach((id, i) => {
                if (i < soundN) plan.send(id, 'air', 'sound', tt + 1.2, { dur: 1.1 });
                else if (i < soundN + stayHeat) plan.flip(id, 'heat', tt + 0.2, 0.15);
                else plan.send(id, 'spot', 'heat', tt + 0.5, { dur: 0.4, hop: 6 });
            });
            keepers.forEach((id) => plan.flip(id, 'motion', tt + 0.1, 0.05));
            if (up === 0) break;
            const launch = tt + 0.1;
            const A = (300 * up) / MAX_MOTION;
            const T = 0.75 * Math.sqrt(up / MAX_MOTION);
            keepers.forEach((id, j) => {
                const q = (j + 0.5) / up;
                plan.flip(id, 'height', launch + T * (1 - Math.sqrt(1 - q)) + 0.05, 0.1);
                plan.flip(id, 'motion', launch + T + T * Math.sqrt(1 - q), 0.1);
            });
            bounces.push({ launch, T, A });
            tt = launch + 2 * T;
            m = up;
            onBall = keepers;
        }
        const tStill = tt + 0.2;
        const tRest = clay ? tImpact + 1.4 : tStill + 0.3;
        const tSpread = tRest + 1.6;
        const tSpace = tSpread + 2.6;
        const dur = tSpace + 3.6;

        finale(plan, [
            { region: 'air', to: 'air' },
            { region: 'warm', to: 'air', alreadyHeat: true },
            { region: 'ball', to: 'ground', alreadyHeat: true },
            { region: 'spot', to: 'ground', alreadyHeat: true }
        ], tSpread, tSpace);

        const ke = M * THROW_BALL_J;
        return {
            plan,
            dur,
            joule: true,
            pre,
            phases: [
                ...pre.phases,
                { at: 0, key: 'start', icon: '🍎' },
                { at: tWind, key: 'throw', icon: '💪' },
                { at: tImpact, key: clay ? 'splat' : 'bounce', icon: clay ? '💥' : '⤴️' },
                { at: tRest, key: 'rest', icon: '😴' },
                { at: tSpread, key: 'spread', icon: '〰️' },
                { at: tSpace, key: 'space', icon: '🌌' }
            ],
            readouts: () => [
                ['🍎', 'food', fmtApples(n * THROW_BALL_J)],
                ['💨', 'throwSpeed', fmtKmh(Math.sqrt((2 * ke) / BALL_KG))],
                clay ? ['🌡️', 'ballWarm', fmtDeg((0.5 * ke) / (BALL_KG * RUBBER_C))] : ['⤴️', 'bounces', String(bounces.length)],
                ['🥵', 'jouleWarm', fmtDeg((heatN * THROW_BALL_J) / (KID_KG * BODY_C))]
            ],
            draw(ctx, now) {
                drawJouleBody(ctx, L, { warm: plan.countIn('warm', now) / n, hand: handPos(now) });
                const [x, y] = ballPos(now);
                const squash = contacts.some((c) => now >= c - 0.02 && now < c + 0.1);
                const splat = clay && now >= tImpact;
                ctx.fillStyle = clay ? '#b5734a' : '#ff5ea8';
                ctx.beginPath();
                if (splat) ctx.ellipse(x, L.gy - 6, 22, 7, 0, 0, TAU);
                else if (squash) ctx.ellipse(x, y + 4, br * 1.3, br * 0.7, 0, 0, TAU);
                else ctx.arc(x, y, br, 0, TAU);
                ctx.fill();
                if (!splat) {
                    ctx.fillStyle = 'rgba(255,255,255,0.35)';
                    ctx.beginPath();
                    ctx.arc(x - 4, y - 5, 4, 0, TAU);
                    ctx.fill();
                }
                contacts.forEach((c, i) => {
                    if (i === 0 || hash01(i, 5) > 0.4) soundArcs(ctx, bx, L.gy - 6, now, c, c + 0.12, { from: Math.PI + 0.3, to: TAU - 0.3, maxR: 140 });
                });
                if (clay) dust(ctx, bx, L.gy - 4, now, tImpact, 23, { count: 7, spread: 34, color: '181,115,74' });
            },
            top(ctx, now) {
                drawJouleFace(ctx, L, { warm: plan.countIn('warm', now) / n, look: now > tRelease ? 0.6 : 1 });
            }
        };
    }
};

const SCREAM_BALL_J = 5;
const SCREAM_SOUND_SHARE = 0.001;

const screamStory = {
    id: 'scream',
    icon: '😱',
    variants: ['pillow', 'open'],
    build(n, variant, L) {
        const pillow = variant === 'pillow';
        const plan = new Plan();
        baseRegions(plan, L);
        const soundN = Math.max(1, Math.round(n / 20));
        const heatN = n - soundN;
        const px = L.jx + JOULE_R + 24;
        const py = L.jy - 6;
        const mouth = [L.jx + 30, L.jy + 2];

        const tScream = 1.0;
        const tEnd = tScream + 1.4 + 1.6 * (n / 40);
        const tAfter = tEnd + 0.2;
        const tSpread = tEnd + 3.0;
        const tSpace = tSpread + 2.6;
        const dur = tSpace + 3.6;

        plan.region('pillow', () => ({ x: px, y: py, d: 13 }));
        plan.region('cliff', () => ({ x: L.cx - 16, y: L.jy - 60, d: 18, sx: 0.4 }));

        const pre = prequel(plan, L, n, 'eat');
        plan.mix(plan.take('belly', n), [
            { region: 'warm', form: 'heat', count: heatN, dur: 0.7, hop: 10 },
            pillow
                ? { region: 'pillow', form: 'sound', count: soundN, dur: 0.35 }
                : { region: 'cliff', form: 'sound', count: soundN, dur: 0.9 }
        ], tScream + 0.3, tEnd);

        if (pillow) {
            plan.flipAll(plan.all('pillow'), 'heat', tAfter + 0.4, tAfter + 1.0, 0.4);
        } else {
            plan.stream(plan.all('cliff'), 'air', 'sound', tAfter + 0.8, tAfter + 1.2, { dur: 1.0 });
        }

        finale(plan, [
            { region: 'air', to: 'air' },
            { region: 'warm', to: 'air', alreadyHeat: true },
            { region: 'pillow', to: 'air', alreadyHeat: true }
        ], tSpread, tSpace);

        const food = n * SCREAM_BALL_J;
        const soundJ = food * SCREAM_SOUND_SHARE;
        const readouts = () => [
            ['🍎', 'food', fmtApples(food)],
            ['🔊', 'soundPart', t('lab.fmt.partOf', { n: nf(1 / SCREAM_SOUND_SHARE) })],
            ['🥵', 'jouleWarm', fmtDeg((food - soundJ) / (KID_KG * BODY_C))],
            ...(pillow ? [['🛏️', 'pillowWarm', fmtDeg(soundJ / (PILLOW_KG * PILLOW_C))]] : [])
        ];

        return {
            plan,
            dur,
            joule: true,
            pre,
            phases: [
                ...pre.phases,
                { at: 0, key: 'start', icon: '🍎' },
                { at: tScream, key: 'scream', icon: '😱' },
                { at: tAfter, key: pillow ? 'pillow' : 'echo', icon: pillow ? '🛏️' : '🏔️' },
                { at: tSpread, key: 'spread', icon: '〰️' },
                { at: tSpace, key: 'space', icon: '🌌' }
            ],
            readouts,
            draw(ctx, now) {
                const screaming = now >= tScream && now < tEnd;
                drawJouleBody(ctx, L, { warm: plan.countIn('warm', now) / n, hand: pillow ? [px - 18, py + 24] : null });
                if (pillow) {
                    soundArcs(ctx, mouth[0] + 6, mouth[1], now, tScream, tEnd, { speed: 90, maxR: 40, from: -0.9, to: 0.9 });
                    ctx.fillStyle = '#e8ecf6';
                    ctx.strokeStyle = '#b9c1d6';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.roundRect(px - 22, py - 36, 44, 72, 16);
                    ctx.fill();
                    ctx.stroke();
                } else {
                    soundArcs(ctx, mouth[0] + 6, mouth[1], now, tScream, tEnd, { speed: 240, maxR: L.cx - mouth[0], from: -0.55, to: 0.55 });
                    soundArcs(ctx, L.cx, mouth[1], now, tScream + 0.6, tEnd + 0.6, { speed: 200, maxR: 170, from: Math.PI - 0.5, to: Math.PI + 0.5, every: 0.3 });
                }
                if (screaming) {
                    const shake = Math.sin(now * 50) * 2;
                    ctx.fillStyle = rgba(FORM_RGB.sound, pillow ? 0.45 : 0.95);
                    ctx.font = `700 ${pillow ? 18 : 30}px Fredoka, system-ui, sans-serif`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('AAAAH!', (pillow ? px - 26 : mouth[0] + 40) + shake, L.jy - JOULE_R - 18);
                }
            },
            top(ctx, now) {
                const open = now >= tScream && now < tEnd ? 0.8 + 0.2 * Math.sin(now * 30) : 0;
                drawJouleFace(ctx, L, { mouth: open, warm: plan.countIn('warm', now) / n });
            }
        };
    }
};

const BLAST_KG_PER_BALL = 2.5;
const ROCK_5M_KG = (4 / 3) * Math.PI * 125 * ROCK_DENSITY;

const blastStory = {
    id: 'blast',
    icon: '💥',
    variants: ['inside', 'open'],
    build(n, variant, L) {
        const inside = variant === 'inside';
        const plan = new Plan();
        baseRegions(plan, L);
        const lightN = Math.max(1, Math.round(n * 0.1));
        const soundN = Math.max(1, Math.round(n * 0.08));
        const motionN = Math.max(1, Math.round(n * 0.22));
        const heatN = n - lightN - soundN - motionN;
        const kx = inside ? L.cx + 175 : L.cx - 120;
        const ky = inside ? 395 : L.gy - 12;
        const insideMountain = (x, y) => pointInPoly(x, y, L.mountain) && pointInPoly(x, y - 16, L.mountain)
            && pointInPoly(x - 14, y, L.mountain) && pointInPoly(x + 14, y, L.mountain) && y < L.gy - 10;

        const tBoom = 1.6;
        const tAfter = tBoom + 1.0;
        const tSpread = tBoom + 3.2;
        const tSpace = tSpread + 2.6;
        const dur = tSpace + 3.6;
        const rise = (tt) => clamp(tt - tBoom, 0, 3) * 28;

        plan.region('charge', () => ({ x: kx, y: ky, d: 11 }));
        plan.region('rock', () => ({ area: true, seed: 5, x0: L.cx + 20, x1: L.W - 8, y0: 120, y1: L.gy - 8, inside: insideMountain }));
        if (inside) {
            plan.region('hot', () => ({ x: kx, y: ky, d: 13 }));
            plan.region('wall', () => ({
                area: true, seed: 6, x0: kx - 80, x1: kx + 80, y0: ky - 70, y1: ky + 70,
                inside: (x, y) => { const d = Math.hypot((x - kx) / 1.2, y - ky); return d > 44 && d < 66 && insideMountain(x, y); }
            }));
        } else {
            plan.region('fireball', (tt) => ({ x: kx, y: ky - 40 - rise(tt), d: 13 }));
            plan.region('scatter', () => ({ area: true, seed: 7, x0: Math.max(24, kx - 170), x1: kx + 110, y0: L.gy + 8, y1: L.gy + 34 }));
        }

        const pre = prequel(plan, L, n, 'fossil');
        const ids = plan.take('charge', n);
        const order = { light: ids.slice(0, lightN), sound: ids.slice(lightN, lightN + soundN), motion: ids.slice(lightN + soundN, lightN + soundN + motionN), heat: ids.slice(lightN + soundN + motionN) };
        if (order.heat.length !== heatN) throw new Error('Blast split does not add up');

        if (inside) {
            order.heat.forEach((id) => plan.send(id, 'hot', 'heat', tBoom + 0.3, { dur: 0.3 }));
            order.light.forEach((id) => plan.send(id, 'wall', 'light', tBoom + 0.15, { dur: 0.15 }));
            plan.flipAll(order.light, 'heat', tBoom + 0.6, tBoom + 0.8, 0.2);
            order.motion.forEach((id) => plan.send(id, 'wall', 'motion', tBoom + 0.45, { dur: 0.45 }));
            plan.flipAll(order.motion, 'heat', tBoom + 1.1, tBoom + 1.4, 0.2);
            order.sound.forEach((id) => plan.send(id, 'rock', 'sound', tBoom + 1.3, { dur: 1.2 }));
            plan.flipAll(order.sound, 'heat', tBoom + 2.2, tBoom + 2.6, 0.3);
            finale(plan, [
                { region: 'hot', to: 'rock', alreadyHeat: true },
                { region: 'wall', to: 'rock', alreadyHeat: true }
            ], tSpread, tSpace);
        } else {
            order.heat.forEach((id) => plan.send(id, 'fireball', 'heat', tBoom + 0.3, { dur: 0.3 }));
            order.light.forEach((id) => plan.send(id, 'space', 'light', tBoom + 0.5, { dur: 0.5 }));
            order.motion.forEach((id) => plan.send(id, 'scatter', 'motion', tBoom + 1.2, { dur: 1.2, hop: 170 }));
            plan.flipAll(order.motion, 'heat', tBoom + 1.4, tBoom + 1.7, 0.2);
            order.sound.forEach((id) => plan.send(id, 'air', 'sound', tBoom + 1.3, { dur: 1.3 }));
            finale(plan, [
                { region: 'air', to: 'air' },
                { region: 'fireball', to: 'air', alreadyHeat: true },
                { region: 'scatter', to: 'ground', alreadyHeat: true }
            ], tSpread, tSpace);
        }

        const kg = n * BLAST_KG_PER_BALL;
        const energy = kg * EXPLOSIVE_J_PER_KG;
        return {
            plan,
            dur,
            joule: false,
            pre,
            phases: [
                ...pre.phases,
                { at: 0, key: 'start', icon: '🧨' },
                { at: tBoom, key: 'boom', icon: '💥' },
                { at: tAfter, key: inside ? 'rock' : 'open', icon: inside ? '🪨' : '🌠' },
                { at: tSpread, key: 'spread', icon: '〰️' },
                { at: tSpace, key: 'space', icon: '🌌' }
            ],
            readouts: () => [
                ['🧨', 'explosive', fmtKg(kg)],
                ['🍎', 'sameAs', fmtApples(energy)],
                inside
                    ? ['🌡️', 'rockWarm', fmtDeg(energy / (ROCK_5M_KG * ROCK_C))]
                    : ['🌕', 'moon', t('lab.fmt.seconds', { n: nf(MOON_LIGHT_S) })]
            ],
            shake(now) {
                const age = now - tBoom;
                if (age < 0 || age > 0.6) return [0, 0];
                const a = (inside ? 4 : 7) * (1 - age / 0.6);
                return [Math.sin(now * 90) * a, Math.cos(now * 77) * a];
            },
            draw(ctx, now) {
                const age = now - tBoom;
                if (inside) {
                    ctx.fillStyle = '#151924';
                    ctx.beginPath();
                    ctx.ellipse(kx, ky, 40, 26, 0, 0, TAU);
                    ctx.fill();
                    ctx.strokeStyle = '#151924';
                    ctx.lineWidth = 12;
                    ctx.beginPath();
                    ctx.moveTo(kx + 30, ky + 10);
                    ctx.lineTo(L.W, ky + 30);
                    ctx.stroke();
                    if (age >= 0) {
                        ctx.strokeStyle = 'rgba(10,12,18,0.85)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        for (let i = 0; i < 9; i++) {
                            const a = (i / 9) * TAU + 0.3;
                            const len = 60 + 40 * hash01(i, 9);
                            ctx.moveTo(kx + Math.cos(a) * 40, ky + Math.sin(a) * 26);
                            ctx.lineTo(kx + Math.cos(a + 0.15) * len * 0.7, ky + Math.sin(a - 0.1) * len * 0.6);
                            ctx.lineTo(kx + Math.cos(a) * len, ky + Math.sin(a) * len * 0.8);
                        }
                        ctx.stroke();
                    }
                    if (age >= 0 && age < 0.9) {
                        ctx.save();
                        ctx.beginPath();
                        L.mountain.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
                        ctx.closePath();
                        ctx.clip();
                        const g = ctx.createRadialGradient(kx, ky, 0, kx, ky, 160);
                        g.addColorStop(0, `rgba(255,240,180,${1 - age / 0.9})`);
                        g.addColorStop(1, 'rgba(255,140,40,0)');
                        ctx.fillStyle = g;
                        ctx.fillRect(kx - 170, ky - 170, 340, 340);
                        ctx.restore();
                    }
                } else {
                    if (age >= 0) {
                        ctx.fillStyle = '#20150c';
                        ctx.beginPath();
                        ctx.ellipse(kx, L.gy + 2, 46, 12, 0, 0, TAU);
                        ctx.fill();
                        for (let i = 0; i < 7; i++) {
                            const a = clamp(age - i * 0.15, 0, 3);
                            if (a <= 0 || a >= 3) continue;
                            ctx.fillStyle = `rgba(150,150,160,${0.35 * (1 - a / 3)})`;
                            ctx.beginPath();
                            ctx.arc(kx + (hash01(i, 13) - 0.5) * 70, L.gy - 30 - a * 40 - i * 6, 20 + a * 14, 0, TAU);
                            ctx.fill();
                        }
                    }
                }
                if (age < 0 && now >= pre.cut + 5.2) {
                    ctx.fillStyle = '#d63a2f';
                    for (let i = -1; i <= 1; i++) ctx.fillRect(kx + i * 8 - 3, ky - 12, 6, 24);
                    ctx.strokeStyle = '#ddd';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(kx, ky - 12);
                    ctx.quadraticCurveTo(kx + 10, ky - 26, kx + 4, ky - 32);
                    ctx.stroke();
                    if (now > 0.4) {
                        ctx.fillStyle = `rgba(255,220,90,${0.6 + 0.4 * Math.sin(now * 30)})`;
                        ctx.beginPath();
                        ctx.arc(kx + 4, ky - 32, 4, 0, TAU);
                        ctx.fill();
                    }
                }
                if (inside) soundArcs(ctx, kx, ky, now, tBoom, tBoom + 0.6, { speed: 160, maxR: 200, from: 0, to: TAU, every: 0.2 });
                else soundArcs(ctx, kx, ky, now, tBoom, tBoom + 0.6, { speed: 320, maxR: 420, from: Math.PI, to: TAU, every: 0.15 });
            },
            top(ctx, now) {
                const age = now - tBoom;
                if (!inside && age >= 0 && age < 0.5) {
                    ctx.fillStyle = `rgba(255,250,220,${0.85 * (1 - age / 0.5)})`;
                    ctx.fillRect(0, 0, L.W, VH);
                }
            }
        };
    }
};

const EAT_BALL_J = 20000;
const BASAL_W = 63;
const PHOTOSYNTHESIS_SHARE = 0.01;

const eatStory = {
    id: 'eat',
    icon: '🍎',
    build(n, variant, L) {
        const plan = new Plan();
        baseRegions(plan, L);
        const tEat = 4.4;
        const pre = prequel(plan, L, n, 'sun', { tEat });

        const soundN = Math.max(1, Math.round(n / 40));
        const jumpN = Math.max(1, Math.round(n * 0.2));
        const brainN = Math.max(1, Math.round(n * 0.1));
        const heartN = Math.round(n * 0.08);
        const warmN = n - soundN - jumpN - brainN - heartN;
        const liftN = Math.max(1, Math.round(jumpN * MUSCLE_EFFICIENCY));
        const jumpHeat = jumpN - liftN;

        const tBody = 6.2;
        const tJump = 9.6;
        const tLaunch = 10.4;
        const A = 45 + 35 * Math.min(1, liftN / 2);
        const T = 0.32 + 0.12 * Math.min(1, liftN / 2);
        const tLand = tLaunch + 2 * T;
        const tSing = tLand + 0.8;
        const tSpread = tSing + 2.8;
        const tSpace = tSpread + 2.6;
        const dur = tSpace + 3.6;

        // Joule jumps here, so the body heat drifts off to the side instead of above the head.
        L.warmDx = JOULE_R + 58;
        L.joff = (tt) => {
            const tau = tt - tLaunch;
            return tau >= 0 && tau <= 2 * T ? -A * (1 - ((tau - T) / T) ** 2) : 0;
        };
        plan.region('head', (tt) => ({ x: L.jx, y: L.jy - 42 + L.joff(tt), d: 10, sx: 1.4, sy: 0.5 }));
        plan.region('heart', (tt) => ({ x: L.jx + 18, y: L.jy + 16 + L.joff(tt), d: 10 }));
        plan.region('legs', (tt) => ({ x: L.jx, y: L.jy + JOULE_R + 6 + L.joff(tt), d: 10, sx: 1.6, sy: 0.5 }));
        plan.region('feet', () => ({ x: L.jx, y: L.gy + 22, d: 13, sx: 1.9, sy: 0.5 }));

        const all = plan.balls.map((b) => b.id);
        plan.stream(all, 'leaves', 'light', 0.4, 1.6, { dur: 0.9 });
        plan.flipAll(all, 'chemical', 2.2, 2.9, 0.3);
        plan.stream(all, 'apple', 'chemical', 3.2, 4.0, { dur: 0.6 });
        plan.stream(all, 'belly', 'chemical', 5.0, 5.8, { dur: 0.5 });

        plan.mix(plan.take('belly', warmN + brainN + heartN), [
            { region: 'warm', form: 'heat', count: warmN, dur: 0.7, hop: 10 },
            { region: 'head', form: 'electric', count: brainN, dur: 0.5 },
            { region: 'heart', form: 'motion', count: heartN, dur: 0.4 }
        ], tBody + 0.4, tBody + 2.0);
        plan.flipAll(plan.all('head'), 'heat', tBody + 2.6, tBody + 3.2, 0.3);
        if (heartN) plan.flipAll(plan.all('heart'), 'heat', tBody + 2.6, tBody + 3.2, 0.3);

        plan.mix(plan.take('belly', jumpN), [
            { region: 'legs', form: 'motion', count: liftN, dur: 0.4 },
            { region: 'warm', form: 'heat', count: jumpHeat, dur: 0.6, hop: 10 }
        ], tJump + 0.2, tLaunch - 0.05);
        plan.all('legs').forEach((id, j) => {
            const q = (j + 0.5) / liftN;
            plan.flip(id, 'height', tLaunch + T * (1 - Math.sqrt(1 - q)) + 0.04, 0.08);
            plan.flip(id, 'motion', tLaunch + T + T * Math.sqrt(1 - q), 0.08);
            plan.send(id, 'feet', 'heat', tLand + 0.4, { dur: 0.35, hop: 4 });
        });

        plan.stream(plan.take('belly', soundN), 'air', 'sound', tSing + 0.6, tSing + 1.4, { dur: 1.2 });

        finale(plan, [
            { region: 'air', to: 'air' },
            { region: 'warm', to: 'air', alreadyHeat: true },
            { region: 'head', to: 'air', alreadyHeat: true },
            { region: 'heart', to: 'air', alreadyHeat: true },
            { region: 'feet', to: 'ground', alreadyHeat: true }
        ], tSpread, tSpace);

        const food = n * EAT_BALL_J;
        const warmS = (food * (warmN / n)) / BASAL_W;
        return {
            plan,
            dur,
            pre,
            phases: [
                ...pre.phases,
                { at: 0, text: 'lab.pre.tree', icon: '🌳' },
                { at: 2.0, text: 'lab.pre.sugar', icon: '🍃' },
                { at: tEat, text: 'lab.pre.eat', icon: '😋' },
                { at: tBody, key: 'body', icon: '🧠' },
                { at: tJump, key: 'jump', icon: '🤸' },
                { at: tSing, key: 'sing', icon: '🎵' },
                { at: tSpread, key: 'spread', icon: '〰️' },
                { at: tSpace, key: 'space', icon: '🌌' }
            ],
            readouts: () => [
                ['🍎', 'food', fmtApples(food)],
                ['☀️', 'sunNeeded', t('lab.fmt.times', { n: nf(1 / PHOTOSYNTHESIS_SHARE) })],
                ['🔥', 'warmFor', warmS >= 5400 ? t('lab.fmt.hours', { n: nf(warmS / 3600) }) : t('lab.fmt.minutes', { n: nf(warmS / 60) })]
            ],
            draw(ctx, now) {
                drawJouleBody(ctx, L, { warm: plan.countIn('warm', now) / n, dy: L.joff(now) });
                if (now >= tSing && now < tSing + 1.6) {
                    ctx.fillStyle = rgba(FORM_RGB.sound, 0.9);
                    ctx.font = '600 26px Fredoka, system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    for (let i = 0; i < 3; i++) {
                        const a = now - tSing - i * 0.35;
                        if (a < 0 || a > 0.9) continue;
                        ctx.fillText(i % 2 ? '♫' : '♪', L.jx + 50 + a * 70, L.jy - 30 - a * 60);
                    }
                }
            },
            top(ctx, now) {
                const singing = now >= tSing && now < tSing + 1.4;
                const chewing = now >= tEat + 0.6 && now < 5.9;
                const mouth = singing ? 0.5 + 0.2 * Math.sin(now * 14) : chewing ? 0.25 + 0.25 * Math.sin(now * 18) : 0;
                drawJouleFace(ctx, L, { warm: plan.countIn('warm', now) / n, dy: L.joff(now), mouth });
            }
        };
    }
};

const STORIES = [eatStory, stoneStory, throwStory, screamStory, blastStory];

// ---------- Lab UI ----------

function initLab() {
    const canvas = document.getElementById('lab-canvas');
    const els = {
        picker: document.getElementById('lab-picker'),
        caption: document.getElementById('lab-caption'),
        big: document.getElementById('lab-bigplay'),
        hint: document.getElementById('lab-hint'),
        play: document.getElementById('lab-play'),
        extend: document.getElementById('lab-extend'),
        scrub: document.getElementById('lab-scrub'),
        marks: document.getElementById('lab-marks'),
        total: document.getElementById('lab-total'),
        bar: document.getElementById('lab-bar'),
        counts: document.getElementById('lab-counts'),
        follow: document.getElementById('lab-follow'),
        amount: document.getElementById('lab-amount'),
        variant: document.getElementById('lab-variant'),
        readouts: document.getElementById('lab-readouts')
    };
    const S = {
        story: STORIES[0],
        variants: Object.fromEntries(STORIES.filter((s) => s.variants).map((s) => [s.id, s.variants[0]])),
        n: Number(els.amount.value),
        W: 1000,
        L: null,
        built: null,
        t: 0,
        playing: false,
        ext: false,
        sel: null,
        lastTs: null,
        ui: {}
    };

    // The full story runs from the Big Bang to deep space; by default only the experiment itself is shown.
    const tMin = () => (S.ext ? S.built.tMin : 0);
    const tMax = () => (S.ext ? S.built.tMax : S.built.dur);
    const atStart = () => S.t <= tMin() + 1e-6;
    const atEnd = () => S.t >= tMax() - 1e-6;

    function rebuild() {
        S.L = layout(S.W);
        const built = S.story.build(S.n, S.variants[S.story.id], S.L);
        addEpilogue(built, S.L);
        built.phases = built.phases.map((p) => ({ ...p, text: p.text || `lab.stories.${S.story.id}.${p.key}` }));
        S.built = built;
        S.t = clamp(S.t, tMin(), tMax());
        if (S.sel !== null && S.sel >= S.n) S.sel = null;
        S.ui = {};
        renderMarks();
        renderReadouts();
        renderBar();
        renderVariant();
    }

    function restart(play) {
        S.t = tMin();
        S.playing = play;
    }

    function renderPicker() {
        els.picker.innerHTML = '';
        STORIES.forEach((st) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'pick';
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-selected', String(st === S.story));
            b.innerHTML = `<span class="pick-icon" aria-hidden="true">${st.icon}</span><span>${t(`lab.stories.${st.id}.name`)}</span>`;
            b.addEventListener('click', () => {
                if (st === S.story) return;
                S.story = st;
                S.sel = null;
                rebuild();
                restart(true);
                renderPicker();
            });
            els.picker.appendChild(b);
        });
    }

    function renderVariant() {
        const vs = S.story.variants;
        els.variant.hidden = !vs;
        if (!vs) return;
        els.variant.innerHTML = '';
        vs.forEach((v) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'seg';
            b.setAttribute('aria-pressed', String(S.variants[S.story.id] === v));
            b.textContent = t(`lab.stories.${S.story.id}.variants.${v}`);
            b.addEventListener('click', () => {
                if (S.variants[S.story.id] === v) return;
                S.variants[S.story.id] = v;
                rebuild();
                restart(true);
            });
            els.variant.appendChild(b);
        });
    }

    function renderMarks() {
        const lo = tMin();
        const hi = tMax();
        els.marks.innerHTML = '';
        S.built.phases.filter((p) => p.at >= lo - 1e-6 && p.at < hi).forEach((p) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'mark';
            b.style.left = `${((p.at - lo) / (hi - lo)) * 100}%`;
            b.textContent = p.icon;
            b.title = t(p.text);
            b.setAttribute('aria-label', t(p.text));
            b.phase = p;
            b.addEventListener('click', () => {
                S.t = Math.max(lo, p.at + 0.001);
                S.playing = false;
            });
            els.marks.appendChild(b);
        });
        els.extend.setAttribute('aria-pressed', String(S.ext));
        els.extend.textContent = S.ext ? t('lab.extendOff') : `⏪ ${t('lab.extend')}`;
        const zero = ((0 - lo) / (hi - lo)) * 100;
        const end = ((S.built.dur - lo) / (hi - lo)) * 100;
        els.scrub.style.setProperty('--z', `${zero}%`);
        els.scrub.style.setProperty('--e', `${end}%`);
    }

    function renderReadouts() {
        els.readouts.innerHTML = S.built.readouts().map(([icon, key, value]) => `
            <div class="readout"><span class="readout-icon" aria-hidden="true">${icon}</span>
            <span class="readout-label">${t(`lab.read.${key}`)}</span><b>${value}</b></div>`).join('');
    }

    function renderBar() {
        els.bar.innerHTML = '';
        for (let i = 0; i < S.n; i++) els.bar.appendChild(document.createElement('i'));
        els.total.textContent = String(S.n);
    }

    function updateUI() {
        const { plan, phases } = S.built;
        const tt = S.t;
        const lo = tMin();
        const hi = tMax();

        const scrubVal = String(Math.round(((tt - lo) / (hi - lo)) * 1000));
        if (els.scrub.value !== scrubVal) els.scrub.value = scrubVal;
        els.scrub.style.setProperty('--p', `${((tt - lo) / (hi - lo)) * 100}%`);

        let phase = phases[0];
        phases.forEach((p) => { if (tt >= p.at) phase = p; });
        const capKey = `${phase.text}.${lang}.${els.marks.children.length}`;
        if (S.ui.cap !== capKey) {
            S.ui.cap = capKey;
            els.caption.textContent = t(phase.text);
            [...els.marks.children].forEach((m) => m.classList.toggle('on', m.phase === phase));
        }

        const playState = `${S.playing}.${atEnd()}.${atStart()}.${lang}`;
        if (S.ui.play !== playState) {
            S.ui.play = playState;
            const label = S.playing ? 'lab.pause' : atEnd() ? 'lab.again' : 'lab.play';
            els.play.textContent = S.playing ? '❚❚' : atEnd() ? '↻' : '▶';
            els.play.setAttribute('aria-label', t(label));
            els.big.hidden = S.playing || !(atStart() || atEnd());
            els.big.textContent = atEnd() ? '↻' : '▶';
            els.big.setAttribute('aria-label', t(label));
        }

        const forms = plan.balls.map((b) => plan.formAt(b, tt));
        const counts = {};
        forms.forEach((f) => { counts[f] = (counts[f] || 0) + 1; });
        const sig = `${FORM_IDS.map((f) => counts[f] || 0).join(',')}.${lang}`;
        if (S.ui.counts !== sig) {
            S.ui.counts = sig;
            const sorted = FORM_IDS.flatMap((f) => Array(counts[f] || 0).fill(f));
            [...els.bar.children].forEach((cell, i) => { cell.style.background = FORMS[sorted[i]].color; });
            els.counts.innerHTML = FORM_IDS.filter((f) => counts[f]).map((f) => `
                <span class="count"><i style="background:${FORMS[f].color}"></i><b>${counts[f]}</b> ${t(`forms.${f}.name`)}</span>`).join('');
        }

        if (S.sel === null) {
            if (S.ui.follow !== 'none') {
                S.ui.follow = 'none';
                els.follow.hidden = true;
            }
            return;
        }
        const ball = plan.balls[S.sel];
        const journey = [];
        const step = ball.stops.map((st) => {
            if (journey[journey.length - 1] !== st.form) journey.push(st.form);
            return journey.length - 1;
        });
        const k = plan.stopIndex(ball, tt);
        const idx = forms[S.sel] === ball.stops[k].form ? step[k] : step[k - 1];
        const fsig = `${S.sel}.${idx}.${journey.join()}.${lang}`;
        if (S.ui.follow !== fsig) {
            S.ui.follow = fsig;
            els.follow.hidden = false;
            els.follow.innerHTML = `<span class="follow-title">${t('lab.follow')}</span>${journey.map((f, i) => `
                <span class="step ${i === idx ? 'now' : i < idx ? 'past' : ''}"><i style="background:${FORMS[f].color}"></i>${t(`forms.${f}.name`)}</span>`).join('<span class="arrow" aria-hidden="true">→</span>')}`;
        }
    }

    function ballStates(time) {
        const { plan } = S.built;
        return plan.balls.map((b) => plan.state(b, S.t, time));
    }

    function draw(ctx, w, h, time) {
        const scale = h / VH;
        const W = w / scale;
        if (Math.abs(W - S.W) > 0.5) {
            S.W = W;
            rebuild();
        }
        const dt = S.lastTs === null ? 0 : Math.min(0.05, time - S.lastTs);
        S.lastTs = time;
        const { built } = S;
        if (S.playing) {
            S.t = Math.min(tMax(), S.t + dt);
            if (atEnd()) S.playing = false;
        }

        const scene = sceneAt(built, S.t);
        ctx.save();
        ctx.scale(scale, scale);
        if (scene === 'world') {
            const [shx, shy] = built.shake ? built.shake(S.t) : [0, 0];
            ctx.translate(shx, shy);
            drawWorld(ctx, S.L);
            drawAppleTree(ctx, S.L, S.t, built);
            built.draw(ctx, S.t, time);
        } else {
            drawCosmos(ctx, S.L, S.t, built, scene);
        }
        const states = ballStates(time);
        states.forEach((s, i) => drawBall(ctx, s.x, s.y, s.rgb, s.form, time, i));
        if (scene === 'world') built.top(ctx, S.t, time);
        if (S.sel !== null) {
            const s = states[S.sel];
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(s.x, s.y, BALL_R * 2 * (1 + 0.15 * Math.sin(time * 6)), 0, TAU);
            ctx.stroke();
        }
        [built.pre.cut, built.post.cut].forEach((c) => {
            const a = 1 - Math.abs(S.t - c) / 0.35;
            if (a > 0) {
                ctx.fillStyle = `rgba(0,0,0,${a})`;
                ctx.fillRect(-10, -10, S.W + 20, VH + 20);
            }
        });
        ctx.restore();
        updateUI();
    }

    const stage = new Stage(canvas, draw);

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scale = rect.height / VH;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        let best = null;
        let bestD = 26 / scale;
        ballStates(performance.now() / 1000).forEach((s, i) => {
            const d = Math.hypot(s.x - x, s.y - y);
            if (d < bestD) { bestD = d; best = i; }
        });
        S.sel = best;
        if (best !== null) els.hint.hidden = true;
        stage.request();
    });

    const togglePlay = () => {
        if (atEnd()) S.t = tMin();
        S.playing = !S.playing;
        stage.request();
    };
    els.play.addEventListener('click', togglePlay);
    els.big.addEventListener('click', togglePlay);
    els.extend.addEventListener('click', () => {
        S.ext = !S.ext;
        if (S.ext) restart(true);
        else {
            S.t = clamp(S.t, 0, S.built.dur);
            S.playing = false;
        }
        S.ui = {};
        renderMarks();
    });
    els.scrub.addEventListener('input', () => {
        S.t = tMin() + (Number(els.scrub.value) / 1000) * (tMax() - tMin());
        S.playing = false;
    });
    els.amount.addEventListener('input', () => {
        S.n = Number(els.amount.value);
        rebuild();
    });

    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) S.W = (rect.width / rect.height) * VH;
    rebuild();
    renderPicker();
    onLang(() => {
        renderPicker();
        renderVariant();
        renderMarks();
        renderReadouts();
        S.ui = {};
        updateUI();
    });
}

// ---------- Hero, kinds, cards ----------

function ballHTML(form, { big = false, emoji = false } = {}) {
    const cls = `ball${big ? ' big' : ''}${emoji ? ' has-emoji' : ''}`;
    return `<span class="${cls}" style="--c:${FORMS[form].color}">${emoji ? FORMS[form].emoji : ''}</span>`;
}

function mascotSVG() {
    return `<svg viewBox="0 0 120 150" aria-hidden="true">
        <g stroke="#ffd60a" stroke-linecap="round" stroke-width="7" fill="none">
            <path d="M44 112 L40 142 M76 112 L80 142 M16 78 L4 104 M104 78 L116 52"/>
        </g>
        <circle cx="60" cy="75" r="46" fill="rgba(255,214,10,0.12)" stroke="#ffd60a" stroke-width="5"/>
        <circle cx="46" cy="92" r="7" fill="${FORMS.chemical.color}"/><circle cx="62" cy="100" r="7" fill="${FORMS.heat.color}"/>
        <circle cx="76" cy="90" r="7" fill="${FORMS.motion.color}"/><circle cx="58" cy="86" r="7" fill="${FORMS.light.color}"/>
        <circle cx="44" cy="62" r="9" fill="#fff"/><circle cx="76" cy="62" r="9" fill="#fff"/>
        <circle cx="47" cy="63" r="4.5" fill="#111"/><circle cx="79" cy="63" r="4.5" fill="#111"/>
        <path d="M50 76 Q61 86 72 76" stroke="#111" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M63 29 L69 12" stroke="#ffd60a" stroke-width="4" stroke-linecap="round"/>
        <path d="M70 0 L61 16 L68 16 L63 28 L77 11 L70 11 Z" fill="#ffd60a"/>
    </svg>`;
}

function initHero() {
    document.querySelectorAll('.mascot').forEach((el) => { el.innerHTML = mascotSVG(); });
    const rules = document.getElementById('rules');
    const visuals = [
        ballHTML('light', { big: true }),
        ['chemical', 'height', 'motion', 'heat', 'sound'].map((f) => ballHTML(f)).join(''),
        `<span class="ball-row">${['chemical', 'chemical', 'chemical'].map((f) => ballHTML(f)).join('')}</span><span class="arrow">→</span><span class="ball-row">${['height', 'heat', 'sound'].map((f) => ballHTML(f)).join('')}</span>`
    ];
    onLang(() => {
        rules.innerHTML = tv('rules').map((text, i) => `<li><div class="rule-visual">${visuals[i]}</div><p>${text}</p></li>`).join('');
    });
}

function initKinds() {
    const grids = [...document.querySelectorAll('[data-group]')];
    onLang(() => {
        grids.forEach((grid) => {
            grid.innerHTML = FORM_IDS.filter((f) => FORMS[f].group === grid.dataset.group).map((f) => `
                <div class="kind" style="--c:${FORMS[f].color}">
                    ${ballHTML(f, { big: true, emoji: true })}
                    <div><h4>${t(`forms.${f}.name`)}</h4><p>${t(`forms.${f}.line`)}</p>
                    <div class="examples" aria-hidden="true">${FORMS[f].examples.join(' ')}</div></div>
                </div>`).join('');
        });
    });
}

function initCards() {
    const box = document.getElementById('cards');
    const flipped = new Set();
    onLang(() => {
        box.innerHTML = tv('cards').map((c, i) => `
            <button type="button" class="card ${flipped.has(i) ? 'flipped' : ''}" data-i="${i}" aria-pressed="${flipped.has(i)}">
                <span class="card-face card-front"><span class="card-q">?</span>${c.q}</span>
                <span class="card-face card-back"><span>${c.a}</span>
                    <span class="chain">${c.chain.map((x) => (FORMS[x] ? ballHTML(x, { emoji: true }) : `<span class="chain-emoji">${x}</span>`)).join('<span class="arrow">→</span>')}</span>
                </span>
            </button>`).join('');
    });
    box.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (!card) return;
        const i = Number(card.dataset.i);
        if (flipped.has(i)) flipped.delete(i);
        else flipped.add(i);
        card.classList.toggle('flipped', flipped.has(i));
        card.setAttribute('aria-pressed', String(flipped.has(i)));
    });
}

// ---------- Quiz ----------

function shuffledOrder(n) {
    const a = [...Array(n).keys()];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function confetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 80; i++) {
        const el = document.createElement('div');
        el.className = 'confetti';
        el.style.left = `${Math.random() * 100}vw`;
        el.style.background = FORMS[FORM_IDS[i % FORM_IDS.length]].color;
        el.style.animationDuration = `${2 + Math.random() * 2.5}s`;
        el.style.animationDelay = `${Math.random() * 0.6}s`;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }
}

function initQuiz() {
    const box = document.getElementById('quiz-box');
    const count = I18N.en.quiz.length;
    const Q = { index: 0, score: 0, picked: null, done: false, orders: [] };
    const newOrders = () => Array.from({ length: count }, () => shuffledOrder(3));

    const reset = () => {
        Object.assign(Q, { index: 0, score: 0, picked: null, done: false, orders: newOrders() });
        render();
    };

    function render() {
        if (Q.done) {
            const results = tv('ch4.results');
            const ratio = Q.score / count;
            const idx = ratio === 1 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;
            box.innerHTML = `<div class="result"><div class="score">${Q.score} / ${count}</div><p>${results[idx]}</p><button type="button" class="btn btn-big" id="quiz-restart">${t('ch4.retry')}</button></div>`;
            box.querySelector('#quiz-restart').addEventListener('click', reset);
            return;
        }
        const item = tv('quiz')[Q.index];
        const answered = Q.picked !== null;
        box.innerHTML = `
            <div class="q-progress">${t('ch4.progress', { i: Q.index + 1, n: count })}</div>
            <h3>${item.q}</h3>
            <div class="answers"></div>
            <p class="q-explain">${answered ? `<b>${t(Q.picked === 0 ? 'ch4.correct' : 'ch4.wrong')}</b> ${item.why}` : t('ch4.pick')}</p>
            <button type="button" class="btn btn-big quiz-next" ${answered ? '' : 'disabled'}>${t(Q.index + 1 < count ? 'ch4.next' : 'ch4.finish')}</button>`;
        const answers = box.querySelector('.answers');
        Q.orders[Q.index].forEach((ai) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'answer';
            btn.textContent = item.a[ai];
            if (answered) {
                btn.disabled = true;
                if (ai === 0) btn.classList.add('correct');
                else if (ai === Q.picked) btn.classList.add('wrong');
            }
            btn.addEventListener('click', () => {
                Q.picked = ai;
                if (ai === 0) Q.score += 1;
                render();
                box.querySelector('.quiz-next').focus({ preventScroll: true });
            });
            answers.appendChild(btn);
        });
        box.querySelector('.quiz-next').addEventListener('click', () => {
            Q.index += 1;
            Q.picked = null;
            if (Q.index >= count) {
                Q.done = true;
                if (Q.score / count >= 0.7) confetti();
            }
            render();
        });
    }

    Q.orders = newOrders();
    onLang(render);
}

// ---------- Navigation and language ----------

function initNav() {
    const chips = document.getElementById('chapter-chips');
    const sections = [...document.querySelectorAll('.chapter')];
    const links = sections.map((s) => {
        const a = document.createElement('a');
        a.href = `#${s.id}`;
        a.className = 'chip';
        chips.appendChild(a);
        return a;
    });
    onLang(() => links.forEach((a, i) => { a.textContent = t(sections[i].dataset.chip); }));

    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));

    const bar = document.getElementById('charge-bar');
    const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const nav = document.querySelector('.topnav');
    new ResizeObserver(() => {
        document.documentElement.style.setProperty('--nav-h', `${nav.offsetHeight}px`);
    }).observe(nav);
}

function applyLang() {
    document.documentElement.lang = lang === 'nb' ? 'nb' : 'en';
    document.title = t('meta.title');
    document.querySelector('meta[name="description"]').content = t('meta.description');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
    langListeners.forEach((fn) => fn());
}

function initLang() {
    document.querySelectorAll('[data-lang]').forEach((b) => {
        b.addEventListener('click', () => {
            if (b.dataset.lang === lang) return;
            lang = b.dataset.lang;
            storeLang(lang);
            applyLang();
        });
    });
}

// ---------- Boot ----------

initLang();
initNav();
initHero();
initKinds();
initLab();
initCards();
initQuiz();
applyLang();
