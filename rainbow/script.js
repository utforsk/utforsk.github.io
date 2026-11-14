'use strict';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const FAR = 5000;
const SPEED_OF_LIGHT = 299792458;
const HAIR_NM = 70000;

// Visual widening of the rainbow bands in the sky views (real bands are only ~2° wide).
const BOW_SPREAD = 2.2;
// Visual exaggeration of the prism dispersion.
const PRISM_DISPERSION = 3;

const BANDS = [
    { id: 'red', from: 620, to: 750, color: '#ff3b3b', text: '#fff' },
    { id: 'orange', from: 590, to: 620, color: '#ff8c1a', text: '#fff' },
    { id: 'yellow', from: 570, to: 590, color: '#ffe03b', text: '#3a2a00' },
    { id: 'green', from: 495, to: 570, color: '#33d16a', text: '#06240f' },
    { id: 'blue', from: 450, to: 495, color: '#2f8cff', text: '#fff' },
    { id: 'indigo', from: 420, to: 450, color: '#4b3bd6', text: '#fff' },
    { id: 'violet', from: 380, to: 420, color: '#9b3bff', text: '#fff' }
];

// ---------- i18n ----------

const LANGS = ['en', 'nb'];
const LOCALES = { en: 'en-GB', nb: 'nb-NO' };
const LANG_STORAGE_KEY = 'rainbow-lang';
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
    return LANGS.includes(saved) ? saved : 'en';
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

function fmt(n, digits = 0) {
    return n.toLocaleString(LOCALES[lang], { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function bandName(nm) { return t(`bands.${bandFor(nm).id}.name`); }

// ---------- Math and physics ----------

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(a, b, x) { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); }
function wrap180(a) { return ((a + 540) % 360) - 180; }

const vec = {
    add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
    sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
    scale: (a, s) => ({ x: a.x * s, y: a.y * s }),
    dot: (a, b) => a.x * b.x + a.y * b.y,
    cross: (a, b) => a.x * b.y - a.y * b.x,
    norm: (a) => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; },
    neg: (a) => ({ x: -a.x, y: -a.y }),
    rot: (a, ang, o) => {
        const c = Math.cos(ang), s = Math.sin(ang), dx = a.x - o.x, dy = a.y - o.y;
        return { x: o.x + dx * c - dy * s, y: o.y + dx * s + dy * c };
    }
};

function wavelengthToRGB(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm >= 440 && nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm >= 490 && nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm >= 580 && nm < 645) { r = 1; g = (645 - nm) / 65; }
    else if (nm >= 645 && nm <= 780) { r = 1; }

    let f = 0;
    if (nm >= 380 && nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40;
    else if (nm >= 420 && nm <= 700) f = 1;
    else if (nm > 700 && nm <= 780) f = 0.3 + 0.7 * (780 - nm) / 80;

    const c = (v) => Math.round(255 * Math.pow(v * f, 0.8));
    return [c(r), c(g), c(b)];
}

function rgba(rgb, a = 1) { return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; }
function mixRGB(a, b, k) { return [0, 1, 2].map((i) => Math.round(lerp(a[i], b[i], k))); }
function desaturate(rgb, amount) {
    const l = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
    return mixRGB(rgb, [l, l, l], amount);
}

function bandFor(nm) {
    return BANDS.find((b) => nm >= b.from && nm <= b.to) || (nm < 380 ? BANDS[BANDS.length - 1] : BANDS[0]);
}

function nWater(nm) { return 1.324 + 3046 / (nm * nm); }

// Angle between the rainbow ray and the antisolar point, for k internal reflections.
function rainbowAngleDeg(n, k) {
    const cosI = Math.sqrt((n * n - 1) / (k * (k + 2)));
    const i = Math.acos(cosI);
    const r = Math.asin(Math.sin(i) / n);
    const deviation = 2 * (i - r) + k * (Math.PI - 2 * r);
    return Math.abs(deviation / DEG - 180);
}

const BOW_CENTER = { 1: rainbowAngleDeg(nWater(540), 1), 2: rainbowAngleDeg(nWater(540), 2) };
const PRIMARY_MAX = rainbowAngleDeg(nWater(700), 1);

function displayBowAngle(nm, k, spread = BOW_SPREAD) {
    const real = rainbowAngleDeg(nWater(nm), k);
    return BOW_CENTER[k] + (real - BOW_CENTER[k]) * spread;
}

function refract(d, normal, eta) {
    const cosi = -vec.dot(d, normal);
    const k = 1 - eta * eta * (1 - cosi * cosi);
    if (k < 0) return null;
    const a = eta * cosi - Math.sqrt(k);
    return vec.norm({ x: eta * d.x + a * normal.x, y: eta * d.y + a * normal.y });
}

function reflect(d, normal) {
    const dd = vec.dot(d, normal);
    return { x: d.x - 2 * dd * normal.x, y: d.y - 2 * dd * normal.y };
}

function mulberry32(seed) {
    let a = seed;
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let k = Math.imul(a ^ (a >>> 15), 1 | a);
        k = (k + Math.imul(k ^ (k >>> 7), 61 | k)) ^ k;
        return ((k ^ (k >>> 14)) >>> 0) / 4294967296;
    };
}

// Distance along a ray until it leaves the canvas.
function edgeDistance(p, d, w, h) {
    const ts = [];
    if (d.x > 0) ts.push((w - p.x) / d.x);
    if (d.x < 0) ts.push(-p.x / d.x);
    if (d.y > 0) ts.push((h - p.y) / d.y);
    if (d.y < 0) ts.push(-p.y / d.y);
    return Math.max(0, Math.min(...ts));
}

// ---------- Canvas stage ----------

class Stage {
    constructor(canvas, draw, { animate = false } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.draw = draw;
        this.animate = animate;
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
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
        ctx.clearRect(0, 0, this.w, this.h);
        this.draw(ctx, this.w, this.h, ts / 1000);
        if (this.animate) this.request();
    }

    point(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
}

function attachDrag(stage, { down, move }) {
    const c = stage.canvas;
    c.addEventListener('pointerdown', (e) => {
        if (down(stage.point(e)) === false) return;
        c.setPointerCapture(e.pointerId);
        e.preventDefault();
    });
    c.addEventListener('pointermove', (e) => {
        if (c.hasPointerCapture(e.pointerId)) move(stage.point(e));
    });
    const release = (e) => { if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId); };
    c.addEventListener('pointerup', release);
    c.addEventListener('pointercancel', release);
}

function fontSize(w, min = 11, max = 16) { return clamp(Math.round(w / 45), min, max); }

function label(ctx, text, x, y, { size = 14, color = '#fff', align = 'center', base = 'middle', weight = 800 } = {}) {
    ctx.save();
    ctx.font = `${weight} ${size}px Nunito, system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = base;
    // Keep the text inside the canvas.
    const tw = ctx.measureText(text).width;
    const cw = ctx.canvas.clientWidth;
    const left = align === 'left' ? x : align === 'right' ? x - tw : x - tw / 2;
    x += clamp(left, 4, Math.max(4, cw - tw - 4)) - left;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(5,8,22,0.75)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}

function emoji(ctx, char, x, y, size) {
    ctx.save();
    ctx.font = `${Math.round(size)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, x, y);
    ctx.restore();
}

function setSegment(container, activeEl) {
    container.querySelectorAll('.seg').forEach((b) => b.classList.toggle('on', b === activeEl));
}

// Stack panels: all variants share one grid cell so the height never jumps.
function showVariant(stack, key, attr = 'variant') {
    [...stack.children].forEach((el) => {
        const on = el.dataset[attr] === key;
        el.classList.toggle('off', !on);
        el.inert = !on;
        el.setAttribute('aria-hidden', String(!on));
    });
}

// Boxes with changing text keep their largest height, so the page below never jumps.
// Reset only when the viewport width changes.
const heldBoxes = new Set();
let heldWidth = window.innerWidth;

function holdHeight(el) {
    heldBoxes.add(el);
    const h = Math.ceil(el.getBoundingClientRect().height);
    if (h > (parseFloat(el.style.minHeight) || 0)) el.style.minHeight = `${h}px`;
}

window.addEventListener('resize', () => {
    if (window.innerWidth === heldWidth) return;
    heldWidth = window.innerWidth;
    heldBoxes.forEach((el) => { el.style.minHeight = ''; });
});

// ---------- Icons and facts ----------

const ICONS = {
    ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    cart: '<path d="M3 4h2l2.5 11h10l2-8H6.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/>',
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    angle: '<path d="M4 20h16"/><path d="M4 20 16 6"/><path d="M10 20a6 6 0 0 0-1.6-4.2"/>',
    split: '<path d="M3 12h7"/><path d="M10 12 21 6M10 12h11M10 12l11 6"/>',
    drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    flag: '<path d="M5 21V4h12l-2 4 2 4H5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    antenna: '<path d="M12 10v11M8 21h8"/><circle cx="12" cy="8" r="2"/><path d="M7 4a7 7 0 0 0 0 8M17 4a7 7 0 0 1 0 8"/>',
    wave: '<path d="M2 12c2.5-5 5-5 7.5 0s5 5 7.5 0 4-4 5 0"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 17h.01"/>'
};

const FACT_ICONS = {
    ch1: ['ruler', 'bolt', 'eye'],
    ch3: ['cart', 'gauge', 'book', 'angle', 'split', 'drop'],
    ch4: ['music', 'palette'],
    ch5: ['flag', 'spark', 'user', 'clock'],
    ch6: ['wave', 'antenna', 'bolt', 'shield', 'question']
};

function icon(name) {
    if (!ICONS[name]) throw new Error(`Unknown icon: ${name}`);
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

function renderFacts() {
    document.querySelectorAll('[data-facts]').forEach((box) => {
        const key = box.dataset.facts;
        const icons = FACT_ICONS[key];
        box.innerHTML = tv(`${key}.facts`).map((f, i) => `
            <div class="fact">
                <div class="fact-icon">${icon(icons[i])}</div>
                <h3>${f.t}</h3>
                <p>${f.p}</p>
            </div>`).join('');
    });
}

function applyLang() {
    document.documentElement.lang = lang === 'nb' ? 'nb' : 'en';
    document.title = t('meta.title');
    document.querySelector('meta[name="description"]').content = t('meta.description');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.querySelectorAll('.mnemonic[data-word]').forEach((el) => {
        let i = 0;
        el.innerHTML = [...el.dataset.word].map((ch) => (ch === ' ' ? ' ' : `<span style="color:${BANDS[i++ % BANDS.length].color}">${ch}</span>`)).join('');
    });
    document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
    renderFacts();
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

// ---------- Navigation ----------

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

    const setActive = (id) => {
        links.forEach((a) => {
            const on = a.getAttribute('href') === `#${id}`;
            a.classList.toggle('active', on);
            if (on) chips.scrollTo({ left: a.offsetLeft - (chips.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
        });
    };

    const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));

    const bar = document.getElementById('progress-bar');
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

// ---------- 1. Waves ----------

function initWave() {
    const slider = document.getElementById('wave-slider');
    const nmEl = document.getElementById('wave-nm');
    const nameEl = document.getElementById('wave-name');
    const freqEl = document.getElementById('wave-freq');
    const hairEl = document.getElementById('wave-hair');
    const energyEl = document.getElementById('wave-energy');
    const box = document.getElementById('wave-challenge');
    const swatch = document.getElementById('challenge-swatch');
    const msg = document.getElementById('challenge-msg');
    const scoreEl = document.getElementById('challenge-score');
    const btn = document.getElementById('challenge-btn');

    const state = { nm: Number(slider.value), target: null, solved: false, score: 0, msg: { key: 'ch1.challengeIntro', vars: {} } };

    const stage = new Stage(document.getElementById('wave-canvas'), (ctx, w, h, time) => {
        const nm = state.nm;
        const rgb = wavelengthToRGB(nm);
        const fs = fontSize(w, 12, 16);
        const cy = h * 0.6;
        const amp = h * 0.22;
        const lambdaPx = (nm / 750) * w * 0.42;
        const shift = (time * w * 0.1) % lambdaPx;

        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.stroke();

        ctx.save();
        ctx.shadowColor = rgba(rgb);
        ctx.shadowBlur = 18;
        ctx.strokeStyle = rgba(rgb);
        ctx.lineWidth = Math.max(3, w / 160);
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
            const y = cy - amp * Math.sin(TAU * (x - shift) / lambdaPx);
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // One wavelength between two crests.
        let x1 = shift + lambdaPx / 4;
        while (x1 < w * 0.2) x1 += lambdaPx;
        const x2 = x1 + lambdaPx;
        const yTop = cy - amp - h * 0.08;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        [x1, x2].forEach((x) => {
            ctx.beginPath();
            ctx.moveTo(x, cy - amp);
            ctx.lineTo(x, yTop);
            ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x1, yTop);
        ctx.lineTo(x2, yTop);
        ctx.stroke();
        [[x1, 1], [x2, -1]].forEach(([x, dir]) => {
            ctx.beginPath();
            ctx.moveTo(x + dir * 8, yTop - 5);
            ctx.lineTo(x, yTop);
            ctx.lineTo(x + dir * 8, yTop + 5);
            ctx.stroke();
        });
        label(ctx, t('ch1.oneWl', { nm }), (x1 + x2) / 2, yTop - fs, { size: fs });

        label(ctx, bandName(nm), 14, fs * 1.4, { size: fs + 8, color: rgba(rgb), align: 'left' });
        label(ctx, `${t('ch1.speed')} →`, w - 12, h - fs, { size: fs - 1, color: '#aab3dd', align: 'right', weight: 600 });
    }, { animate: true });

    const renderMsg = () => {
        const vars = { ...state.msg.vars };
        if (vars.nm !== undefined) vars.name = bandName(vars.nm).toLowerCase();
        msg.textContent = t(state.msg.key, vars);
        btn.textContent = t(state.target === null ? 'ch1.challengeStart' : 'ch1.challengeNew');
        holdHeight(msg);
    };

    const newTarget = () => {
        let target;
        do { target = Math.round(400 + Math.random() * 280); } while (Math.abs(target - state.nm) < 60);
        state.target = target;
        state.solved = false;
        swatch.style.background = rgba(wavelengthToRGB(target));
        state.msg = { key: 'ch1.challengeAim', vars: {} };
        box.classList.remove('win');
        renderMsg();
    };

    const checkChallenge = () => {
        if (state.target === null || state.solved) return;
        const diff = state.target - state.nm;
        if (Math.abs(diff) <= 8) {
            state.solved = true;
            state.score += 1;
            scoreEl.textContent = state.score;
            state.msg = { key: 'ch1.challengeHit', vars: { nm: state.target } };
            box.classList.add('win');
        } else if (Math.abs(diff) <= 30) {
            state.msg = { key: diff > 0 ? 'ch1.nearLonger' : 'ch1.nearShorter', vars: {} };
        } else {
            state.msg = { key: diff > 0 ? 'ch1.longer' : 'ch1.shorter', vars: {} };
        }
        renderMsg();
    };

    const update = () => {
        state.nm = Number(slider.value);
        nmEl.textContent = `${state.nm} nm`;
        nameEl.textContent = bandName(state.nm).toLowerCase();
        nameEl.style.color = rgba(wavelengthToRGB(state.nm));
        freqEl.textContent = formatCount(SPEED_OF_LIGHT / (state.nm * 1e-9));
        hairEl.textContent = fmt(HAIR_NM / state.nm);
        energyEl.style.width = `${Math.round(20 + 80 * (750 - state.nm) / 370)}%`;
        checkChallenge();
        stage.request();
    };

    slider.addEventListener('input', update);
    btn.addEventListener('click', newTarget);
    onLang(() => { update(); renderMsg(); });
}

// ---------- 2. Light mixing and Newton disk ----------

function initMix() {
    const lights = [
        { rgb: [255, 0, 0], x: 0.36, y: 0.38, on: true },
        { rgb: [0, 255, 0], x: 0.64, y: 0.38, on: true },
        { rgb: [0, 0, 255], x: 0.5, y: 0.66, on: true }
    ];
    const MIX_NAMES = { 1: 'red', 2: 'green', 4: 'blue', 3: 'yellow', 6: 'cyan', 5: 'magenta', 7: 'white' };
    const home = lights.map((l) => ({ x: l.x, y: l.y }));
    let targets = null;
    let dragging = -1;

    const radius = (w, h) => Math.min(w, h) * 0.27;

    const stage = new Stage(document.getElementById('mix-canvas'), (ctx, w, h) => {
        if (targets) {
            let done = true;
            lights.forEach((l, i) => {
                l.x = lerp(l.x, targets[i].x, 0.12);
                l.y = lerp(l.y, targets[i].y, 0.12);
                if (Math.hypot(l.x - targets[i].x, l.y - targets[i].y) > 0.001) done = false;
            });
            if (done) targets = null;
        }
        const r = radius(w, h);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';
        lights.forEach((l) => {
            if (!l.on) return;
            ctx.fillStyle = rgba(l.rgb);
            ctx.beginPath();
            ctx.arc(l.x * w, l.y * h, r, 0, TAU);
            ctx.fill();
        });
        ctx.globalCompositeOperation = 'source-over';

        // Label each overlap region at the centre of its area.
        const step = 8;
        const sums = {};
        for (let y = step / 2; y < h; y += step) {
            for (let x = step / 2; x < w; x += step) {
                let mask = 0;
                lights.forEach((l, i) => {
                    if (l.on && Math.hypot(x - l.x * w, y - l.y * h) < r) mask |= 1 << i;
                });
                if (!mask) continue;
                const s = sums[mask] || (sums[mask] = { x: 0, y: 0, n: 0 });
                s.x += x; s.y += y; s.n += 1;
            }
        }
        const fs = fontSize(w, 12, 16);
        Object.entries(sums).forEach(([mask, s]) => {
            if (s.n < 12) return;
            const dark = mask === '3' || mask === '6' || mask === '7' || mask === '2';
            label(ctx, t(`ch2.${MIX_NAMES[mask]}`), s.x / s.n, s.y / s.n, { size: fs, color: dark ? '#111' : '#fff' });
        });
    }, { animate: true });

    attachDrag(stage, {
        down: (p) => {
            const r = radius(stage.w, stage.h);
            let best = -1, bestD = Infinity;
            lights.forEach((l, i) => {
                if (!l.on) return;
                const d = Math.hypot(p.x - l.x * stage.w, p.y - l.y * stage.h);
                if (d < r && d < bestD) { best = i; bestD = d; }
            });
            dragging = best;
            targets = null;
            return best >= 0;
        },
        move: (p) => {
            if (dragging < 0) return;
            lights[dragging].x = clamp(p.x / stage.w, 0, 1);
            lights[dragging].y = clamp(p.y / stage.h, 0, 1);
        }
    });

    document.querySelectorAll('#white [data-light]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const l = lights[Number(btn.dataset.light)];
            l.on = !l.on;
            btn.classList.toggle('on', l.on);
        });
    });
    document.getElementById('mix-gather').addEventListener('click', () => { targets = lights.map(() => ({ x: 0.5, y: 0.5 })); });
    document.getElementById('mix-spread').addEventListener('click', () => { targets = home.map((s) => ({ ...s })); });
}

function initNewton() {
    const disk = document.getElementById('newton');
    const slider = document.getElementById('newton-speed');
    const lbl = document.getElementById('newton-speed-label');
    const thresholds = [0, 1, 35, 65, 90];
    let angle = 0;
    let last = 0;
    let raf = 0;
    let visible = false;

    const tick = (ts) => {
        raf = 0;
        const v = Number(slider.value);
        const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
        last = ts;
        angle = (angle + Math.pow(v / 100, 2) * 25 * 360 * dt) % 360;
        const mix = smoothstep(25, 90, v);
        disk.style.transform = `rotate(${angle}deg)`;
        disk.style.filter = `blur(${mix * 6}px) saturate(${1 - mix * 0.92}) brightness(${1 + mix * 0.35})`;
        if (v > 0 && visible) raf = requestAnimationFrame(tick);
        else last = 0;
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const renderLabel = () => {
        const v = Number(slider.value);
        const idx = thresholds.filter((min) => v >= min).length - 1;
        lbl.textContent = tv('ch2.speeds')[idx];
    };

    slider.addEventListener('input', () => { renderLabel(); start(); });
    onLang(renderLabel);
    new IntersectionObserver((entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) start();
    }).observe(disk);
}

// ---------- 3. Bending lab: prism and raindrop ----------

const MATERIALS = {
    water: { n: 1.333, cauchy: 3046 },
    glass: { n: 1.52, cauchy: 4200 },
    diamond: { n: 2.42, cauchy: 10450 }
};

function refractiveIndex(material, nm, exaggerate) {
    const m = MATERIALS[material];
    return m.n + m.cauchy * (1 / (nm * nm) - 1 / (589 * 589)) * exaggerate;
}

function polygonHit(p, d, poly) {
    let best = null;
    const centroid = poly.reduce((acc, v) => vec.add(acc, vec.scale(v, 1 / poly.length)), { x: 0, y: 0 });
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const e = vec.sub(b, a);
        const denom = vec.cross(d, e);
        if (Math.abs(denom) < 1e-9) continue;
        const ap = vec.sub(a, p);
        const k = vec.cross(ap, e) / denom;
        const s = vec.cross(ap, d) / denom;
        if (k > 1e-3 && s >= 0 && s <= 1 && (!best || k < best.t)) {
            let normal = vec.norm({ x: e.y, y: -e.x });
            const mid = vec.scale(vec.add(a, b), 0.5);
            if (vec.dot(normal, vec.sub(mid, centroid)) < 0) normal = vec.neg(normal);
            best = { t: k, point: vec.add(p, vec.scale(d, k)), normal };
        }
    }
    return best;
}

function tracePolygon(origin, dir, poly, n, maxSteps = 8) {
    const segs = [];
    let p = origin, d = dir, inside = false;
    for (let step = 0; step < maxSteps; step++) {
        const hit = polygonHit(p, d, poly);
        if (!hit) break;
        segs.push({ a: p, b: hit.point, inside });
        if (!inside) {
            const nd = refract(d, hit.normal, 1 / n);
            if (nd) { d = nd; inside = true; } else d = reflect(d, hit.normal);
        } else {
            const inward = vec.neg(hit.normal);
            const nd = refract(d, inward, n);
            if (nd) { d = nd; inside = false; } else d = reflect(d, inward);
        }
        p = hit.point;
    }
    segs.push({ a: p, b: vec.add(p, vec.scale(d, FAR)), inside, dir: d });
    return segs;
}

function circleHit(p, d, c, r) {
    const f = vec.sub(p, c);
    const b = vec.dot(f, d);
    const cc = vec.dot(f, f) - r * r;
    const disc = b * b - cc;
    if (disc < 0) return null;
    const s = Math.sqrt(disc);
    let k = -b - s;
    if (k <= 1e-3) k = -b + s;
    if (k <= 1e-3) return null;
    return k;
}

function traceDrop(origin, dir, c, r, n, reflections) {
    const t0 = circleHit(origin, dir, c, r);
    if (t0 === null) return { segs: [{ a: origin, b: vec.add(origin, vec.scale(dir, FAR)) }], exit: null };
    const segs = [];
    let p = vec.add(origin, vec.scale(dir, t0));
    segs.push({ a: origin, b: p });
    let d = refract(dir, vec.norm(vec.sub(p, c)), 1 / n);
    for (let k = 0; k <= reflections; k++) {
        const q = vec.add(p, vec.scale(d, circleHit(p, d, c, r)));
        segs.push({ a: p, b: q, inside: true });
        const inward = vec.norm(vec.sub(c, q));
        d = k < reflections ? reflect(d, inward) : (refract(d, inward, n) || reflect(d, inward));
        p = q;
    }
    segs.push({ a: p, b: vec.add(p, vec.scale(d, FAR)) });
    return { segs, exit: { point: p, dir: d } };
}

// Angle between the outgoing ray and the direction straight back towards the sun (-x).
function exitAngleDeg(exitDir) { return Math.acos(clamp(-exitDir.x, -1, 1)) / DEG; }

function initBend() {
    const canvas = document.getElementById('bend-canvas');
    const explain = document.getElementById('bend-explain');
    const shapeRow = document.getElementById('bend-shape');
    const materialRow = document.getElementById('bend-material');
    const lightRow = document.getElementById('bend-light');
    const colourSlider = document.getElementById('bend-colour');
    const colourLabel = document.getElementById('bend-colour-label');
    const hitSlider = document.getElementById('bend-hit');
    const turnSlider = document.getElementById('bend-turn');
    const bounceRow = document.getElementById('bend-bounces');
    const manyBtn = document.getElementById('bend-many');
    const extra = document.getElementById('bend-extra');
    const hints = document.getElementById('bend-hint');

    const S = {
        shape: 'prism', material: 'glass', light: 'white', nm: Number(colourSlider.value),
        prismHit: 0.55, dropHit: 0.86, turn: 0, k: 1, many: false, lamp: { x: 0.07, y: 0.78 }, result: null
    };
    const histCache = {};

    const wavelengths = () => {
        if (S.light === 'one') return [S.nm];
        const out = [];
        for (let nm = 400; nm <= 700; nm += 8) out.push(nm);
        return out;
    };

    const prismGeometry = (w, h) => {
        const side = Math.min(w * 0.4, h * 0.78);
        const c = { x: w * 0.47, y: h * 0.56 };
        const rr = side / Math.sqrt(3);
        const rot = S.turn * DEG;
        const poly = [-90, 150, 30].map((a) => vec.rot({ x: c.x + rr * Math.cos(a * DEG), y: c.y + rr * Math.sin(a * DEG) }, rot, c));
        const f = lerp(0.18, 0.88, S.prismHit);
        const aim = { x: lerp(poly[0].x, poly[1].x, f), y: lerp(poly[0].y, poly[1].y, f) };
        return { poly, aim, c };
    };

    const dropGeometry = (w, h) => ({ c: { x: w * 0.6, y: h * 0.46 }, r: Math.min(w * 0.24, h * 0.36) });

    const strokeSeg = (ctx, s) => {
        ctx.beginPath();
        ctx.moveTo(s.a.x, s.a.y);
        ctx.lineTo(s.b.x, s.b.y);
        ctx.stroke();
    };

    const whiteBeam = (ctx, seg, rgb) => {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowColor = rgb ? rgba(rgb) : '#fff';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = rgb ? rgba(rgb) : '#fff';
        ctx.lineWidth = 5;
        strokeSeg(ctx, seg);
        ctx.restore();
    };

    function drawPrism(ctx, w, h, fs) {
        const { poly, aim, c } = prismGeometry(w, h);
        const lamp = { x: S.lamp.x * w, y: S.lamp.y * h };
        const dir = vec.norm(vec.sub(aim, lamp));
        const n = (nm) => refractiveIndex(S.material, nm, PRISM_DISPERSION);

        label(ctx, t('ch3.air'), 14, fs * 1.3, { size: fs, color: '#aab3dd', align: 'left' });

        ctx.beginPath();
        poly.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)));
        ctx.closePath();
        ctx.fillStyle = S.material === 'water' ? 'rgba(90,170,255,0.28)' : S.material === 'diamond' ? 'rgba(235,245,255,0.24)' : 'rgba(170,200,255,0.18)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(220,235,255,0.75)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const traces = wavelengths().map((nm) => ({ nm, segs: tracePolygon(lamp, dir, poly, n(nm)) }));
        whiteBeam(ctx, traces[0].segs[0], S.light === 'one' ? wavelengthToRGB(S.nm) : null);

        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = S.light === 'one' ? 4 : Math.max(2.5, w / 260);
        traces.forEach(({ nm, segs }) => {
            const rgb = wavelengthToRGB(nm);
            segs.slice(1).forEach((s) => {
                ctx.strokeStyle = rgba(rgb, S.light === 'one' ? 0.95 : (s.inside ? 0.3 : 0.6));
                strokeSeg(ctx, s);
            });
        });
        ctx.globalCompositeOperation = 'source-over';

        label(ctx, t(`ch3.${S.material}`).toLowerCase(), c.x, c.y + (poly[1].y - c.y) * 0.55, { size: fs, color: '#d6e2ff' });

        const ref = traces[traces.length - 1].segs;
        const entry = ref[0].b;
        label(ctx, t('ch3.step1'), entry.x - 10, entry.y - fs * 1.2, { size: fs - 1, align: 'right' });
        const last = ref[ref.length - 1];
        label(ctx, t('ch3.step2'), last.a.x + 12, last.a.y - fs * 1.3, { size: fs - 1, align: 'left' });

        if (S.light === 'white' && traces.length > 1) {
            const redSeg = traces[traces.length - 1].segs.at(-1);
            const vioSeg = traces[0].segs.at(-1);
            const place = (seg) => {
                const d = seg.dir;
                const dist = edgeDistance(seg.a, d, w, h);
                return vec.add(seg.a, vec.scale(d, Math.max(30, dist - fs * 6)));
            };
            const pr = place(redSeg), pv = place(vioSeg);
            const away = vec.norm(vec.sub(pr, pv));
            const at = (p, s) => ({ x: clamp(p.x + away.x * s * 16, 70, w - 70), y: clamp(p.y + away.y * s * 16, fs, h - fs) });
            const lr = at(pr, 1), lv = at(pv, -1);
            label(ctx, t('ch3.redLeast'), lr.x, lr.y, { size: fs - 1, color: '#ff8a8a' });
            label(ctx, t('ch3.violetMost'), lv.x, lv.y, { size: fs - 1, color: '#c9a2ff' });
        }

        // Flashlight
        const ang = Math.atan2(dir.y, dir.x);
        const s = clamp(w / 28, 14, 26);
        ctx.save();
        ctx.translate(lamp.x, lamp.y);
        ctx.rotate(ang);
        ctx.fillStyle = '#c9cfe8';
        ctx.fillRect(-s * 1.6, -s * 0.35, s * 1.3, s * 0.7);
        ctx.fillStyle = '#ffd34d';
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, -s * 0.6);
        ctx.lineTo(s * 0.2, -s * 0.6);
        ctx.lineTo(s * 0.2, s * 0.6);
        ctx.lineTo(-s * 0.35, s * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,211,77,0.6)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(lamp.x, lamp.y, s * 1.4, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, t('ch3.torch'), lamp.x, lamp.y + s * 1.4 + fs, { size: fs - 1, color: '#ffd34d' });

        S.result = { shape: 'prism' };
    }

    function histogram(k, material) {
        const key = `${k}-${material}`;
        if (histCache[key]) return histCache[key];
        const bins = new Array(61).fill(0);
        const n = refractiveIndex(material, 650, 1);
        const N = 600;
        const sign = k === 1 ? 1 : -1;
        for (let i = 0; i < N; i++) {
            const b = sign * (i + 0.5) / N * 0.999;
            const tr = traceDrop({ x: -10, y: -b * 100 }, { x: 1, y: 0 }, { x: 200, y: 0 }, 100, n, k);
            if (!tr.exit) continue;
            const a = Math.round(exitAngleDeg(tr.exit.dir));
            if (a >= 0 && a <= 60) bins[a] += 1;
        }
        histCache[key] = bins;
        return bins;
    }

    function drawHistogram(ctx, w, h, fs) {
        const bins = histogram(S.k, S.material);
        const iw = Math.min(250, w * 0.34), ih = Math.min(120, h * 0.27);
        const x0 = w - iw - 10, y0 = h - ih - 10;
        ctx.fillStyle = 'rgba(20,28,70,0.92)';
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(x0, y0, iw, ih, 10);
        ctx.fill();
        ctx.stroke();
        const pad = 10, top = fs * 1.6, bottom = fs * 1.3;
        const max = Math.max(...bins);
        const peak = bins.indexOf(max);
        const bw = (iw - pad * 2) / bins.length;
        bins.forEach((v, i) => {
            const bh = (v / max) * (ih - top - bottom);
            ctx.fillStyle = i === peak ? '#ffd34d' : '#ff6b6b';
            ctx.fillRect(x0 + pad + i * bw, y0 + ih - bottom - bh, Math.max(1, bw - 0.5), bh);
        });
        label(ctx, t('ch3.hist'), x0 + iw / 2, y0 + fs * 0.85, { size: Math.max(10, fs - 4), weight: 600 });
        label(ctx, '0°', x0 + pad, y0 + ih - bottom / 2, { size: fs - 4, align: 'left', weight: 600 });
        label(ctx, `${peak}°`, x0 + pad + peak * bw, y0 + ih - bottom / 2, { size: fs - 3, color: '#ffd34d' });
        label(ctx, '60°', x0 + iw - pad, y0 + ih - bottom / 2, { size: fs - 4, align: 'right', weight: 600 });
    }

    function drawDrop(ctx, w, h, fs) {
        const { c, r } = dropGeometry(w, h);
        const nOf = (nm) => refractiveIndex(S.material, nm, 1);

        const dg = ctx.createRadialGradient(c.x - r * 0.35, c.y - r * 0.4, r * 0.1, c.x, c.y, r);
        dg.addColorStop(0, S.material === 'diamond' ? 'rgba(240,245,255,0.35)' : 'rgba(190,225,255,0.35)');
        dg.addColorStop(1, 'rgba(60,120,220,0.2)');
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(180,215,255,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const dir = { x: 1, y: 0 };
        if (S.many) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = 'rgba(255,90,90,0.3)';
            const sign = S.k === 1 ? 1 : -1;
            for (let i = 0; i < 40; i++) {
                const b = sign * (0.02 + i * 0.0245);
                traceDrop({ x: -10, y: c.y - b * r }, dir, c, r, nOf(650), S.k).segs.slice(1).forEach((s) => strokeSeg(ctx, s));
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        const origin = { x: -10, y: c.y - S.dropHit * r };
        const traces = wavelengths().map((nm) => ({ nm, ...traceDrop(origin, dir, c, r, nOf(nm), S.k) }));
        whiteBeam(ctx, traces[0].segs[0], S.light === 'one' ? wavelengthToRGB(S.nm) : null);
        label(ctx, t('ch3.sunlight'), 12, origin.y - fs, { size: fs, align: 'left' });

        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = S.light === 'one' ? 3.5 : Math.max(2, w / 300);
        traces.forEach((tr) => {
            const rgb = wavelengthToRGB(tr.nm);
            tr.segs.slice(1).forEach((s) => {
                ctx.strokeStyle = rgba(rgb, S.light === 'one' ? 0.95 : (s.inside ? 0.4 : 0.7));
                strokeSeg(ctx, s);
            });
        });
        ctx.globalCompositeOperation = 'source-over';

        const ref = traces[traces.length - 1];
        const red = S.light === 'white' ? traces[traces.length - 1] : null;
        const violet = S.light === 'white' ? traces[0] : null;

        if (ref.exit) {
            const outside = (p, text) => {
                const d = vec.norm(vec.sub(p, c));
                const q = vec.add(c, vec.scale(d, r + fs * 0.9));
                label(ctx, text, q.x, q.y, { size: fs - 1, align: d.x < -0.3 ? 'right' : d.x > 0.3 ? 'left' : 'center' });
            };
            outside(ref.segs[1].a, t('ch3.dropIn'));
            for (let j = 0; j < S.k; j++) outside(ref.segs[1 + j].b, t('ch3.dropBounce', { n: j + 2 }));
            outside(ref.exit.point, t('ch3.dropOut', { n: S.k + 2 }));

            const p = ref.exit.point;
            const refLen = Math.min(w * 0.3, p.x - 10);
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - refLen, p.y);
            ctx.stroke();
            ctx.setLineDash([]);
            label(ctx, t('ch3.back'), p.x - refLen, p.y + (S.k === 1 ? -fs : fs), { size: fs - 2, align: 'left', color: '#ccd', weight: 600 });

            const a1 = Math.PI;
            let a0 = Math.atan2(ref.exit.dir.y, ref.exit.dir.x);
            while (a0 - a1 > Math.PI) a0 -= TAU;
            while (a1 - a0 > Math.PI) a0 += TAU;
            const rad = Math.min(56, r * 0.55);
            ctx.strokeStyle = '#ffd34d';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad, Math.min(a0, a1), Math.max(a0, a1));
            ctx.stroke();
            const mid = (a0 + a1) / 2;
            label(ctx, `${fmt(exitAngleDeg(ref.exit.dir), 1)}°`, p.x + Math.cos(mid) * (rad + fs * 1.7), p.y + Math.sin(mid) * (rad + fs * 1.7), { size: fs + 2, color: '#ffd34d' });

            const dist = edgeDistance(p, ref.exit.dir, w, h);
            const e = vec.add(p, vec.scale(ref.exit.dir, Math.max(40, dist - fs * 2)));
            label(ctx, `${t('ch3.eye')} 👁`, clamp(e.x, 80, w - 80), clamp(e.y - fs, fs, h - fs), { size: fs - 1, color: '#ffd34d' });
        }

        if (S.many) drawHistogram(ctx, w, h, fs);

        S.result = {
            shape: 'drop',
            ok: !!ref.exit,
            red: red && red.exit ? exitAngleDeg(red.exit.dir) : null,
            violet: violet && violet.exit ? exitAngleDeg(violet.exit.dir) : null,
            one: ref.exit ? exitAngleDeg(ref.exit.dir) : null,
            max: rainbowAngleDeg(nOf(700), S.k)
        };
    }

    const stage = new Stage(canvas, (ctx, w, h) => {
        const fs = fontSize(w, 11, 15);
        ctx.fillStyle = '#060a1c';
        ctx.fillRect(0, 0, w, h);
        if (S.shape === 'prism') drawPrism(ctx, w, h, fs);
        else drawDrop(ctx, w, h, fs);
        renderExplain();
    });

    function renderExplain() {
        const R = S.result;
        let text;
        if (!R) return;
        if (R.shape === 'prism') {
            text = S.light === 'white' ? t('ch3.prismWhite') : t('ch3.prismOne', { name: bandName(S.nm), lname: bandName(S.nm).toLowerCase() });
        } else if (!R.ok) {
            text = t('ch3.miss');
        } else if (S.many) {
            text = t('ch3.manyText', { max: fmt(R.max, 0) });
        } else {
            const near = Math.abs((S.light === 'white' ? R.red : R.one) - R.max) < 1;
            text = S.light === 'white'
                ? t('ch3.dropAngles', { red: fmt(R.red, 1), violet: fmt(R.violet, 1) })
                : t('ch3.dropOneAngle', { name: bandName(S.nm), lname: bandName(S.nm).toLowerCase(), a: fmt(R.one, 1) });
            text += ' ' + t(`ch3.${near ? 'near' : 'far'}${S.k}`, { max: fmt(R.max, 0) });
        }
        if (explain.textContent !== text) explain.textContent = text;
        holdHeight(explain);
    }

    const syncShape = () => {
        hitSlider.value = S.shape === 'prism' ? Math.round(S.prismHit * 100) : Math.round(50 + (S.dropHit / 0.98) * 50);
        showVariant(extra, S.shape);
        showVariant(hints, S.shape);
        stage.request();
    };

    shapeRow.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-shape]');
        if (!btn) return;
        S.shape = btn.dataset.shape;
        setSegment(shapeRow, btn);
        S.material = S.shape === 'drop' ? 'water' : 'glass';
        setSegment(materialRow, materialRow.querySelector(`[data-material="${S.material}"]`));
        syncShape();
    });
    materialRow.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-material]');
        if (!btn) return;
        S.material = btn.dataset.material;
        setSegment(materialRow, btn);
        stage.request();
    });
    lightRow.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-light]');
        if (!btn) return;
        S.light = btn.dataset.light;
        setSegment(lightRow, btn);
        colourSlider.disabled = S.light === 'white';
        stage.request();
    });
    const renderColour = () => {
        colourLabel.textContent = `${S.nm} nm · ${bandName(S.nm).toLowerCase()}`;
    };
    colourSlider.addEventListener('input', () => {
        S.nm = Number(colourSlider.value);
        renderColour();
        stage.request();
    });
    hitSlider.addEventListener('input', () => {
        const v = Number(hitSlider.value) / 100;
        if (S.shape === 'prism') S.prismHit = v;
        else S.dropHit = clamp((v - 0.5) * 2 * 0.98, -0.98, 0.98);
        stage.request();
    });
    turnSlider.addEventListener('input', () => {
        S.turn = Number(turnSlider.value);
        stage.request();
    });
    bounceRow.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-bounces]');
        if (!btn) return;
        S.k = Number(btn.dataset.bounces);
        setSegment(bounceRow, btn);
        S.dropHit = S.k === 1 ? 0.86 : -0.95;
        syncShape();
    });
    manyBtn.addEventListener('click', () => {
        S.many = !S.many;
        manyBtn.classList.toggle('on', S.many);
        stage.request();
    });

    attachDrag(stage, {
        down: (p) => {
            if (S.shape === 'drop') { setDrop(p); return true; }
            const { poly } = prismGeometry(stage.w, stage.h);
            if (p.x > Math.min(...poly.map((v) => v.x))) return false;
            moveLamp(p);
            return true;
        },
        move: (p) => (S.shape === 'drop' ? setDrop(p) : moveLamp(p))
    });

    function moveLamp(p) {
        const { poly } = prismGeometry(stage.w, stage.h);
        const maxX = Math.min(...poly.map((v) => v.x)) - 20;
        S.lamp = { x: clamp(p.x, 12, maxX) / stage.w, y: clamp(p.y / stage.h, 0.05, 0.95) };
        stage.request();
    }

    function setDrop(p) {
        const { c, r } = dropGeometry(stage.w, stage.h);
        S.dropHit = clamp((c.y - p.y) / r, -0.98, 0.98);
        hitSlider.value = Math.round(50 + (S.dropHit / 0.98) * 50);
        stage.request();
    }

    onLang(() => { renderColour(); stage.request(); });
    syncShape();
}

// ---------- 4. Seven colours ----------

function initBands() {
    const svg = document.getElementById('bands-svg');
    const card = document.getElementById('color-card');
    const ns = 'http://www.w3.org/2000/svg';
    const cx = 200, cy = 205, outer = 195, bw = 21;
    const paths = [];
    const texts = [];
    let active = BANDS[0];

    const cardHtml = (band) => {
        const mid = (band.from + band.to) / 2;
        const lambdaPx = mid / 9;
        let d = '';
        for (let x = 0; x <= 400; x += 2) d += `${x ? 'L' : 'M'}${x},${(30 - 18 * Math.sin(TAU * x / lambdaPx)).toFixed(1)}`;
        return `
            <h3 style="color:${band.color}">${t(`bands.${band.id}.name`)}</h3>
            <div class="swatch-line" style="background:linear-gradient(90deg, ${rgba(wavelengthToRGB(band.from))}, ${rgba(wavelengthToRGB(band.to))})"></div>
            <div class="nm">${t('common.wavelength')}: ${band.from}&ndash;${band.to} nm</div>
            <svg viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="${band.color}" stroke-width="4" vector-effect="non-scaling-stroke"/></svg>
            <p>${t(`bands.${band.id}.about`)}</p>
            <p><b>${t('common.didYouKnow')}</b> ${t(`bands.${band.id}.fact`)}</p>`;
    };

    const select = (band) => {
        active = band;
        svg.classList.add('has-active');
        paths.forEach((p, i) => p.classList.toggle('active', BANDS[i] === band));
        showVariant(card, band.id, 'band');
    };

    BANDS.forEach((band, i) => {
        const ro = outer - i * bw;
        const ri = ro - bw;
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', `M${cx - ro},${cy} A${ro},${ro} 0 0 1 ${cx + ro},${cy} L${cx + ri},${cy} A${ri},${ri} 0 0 0 ${cx - ri},${cy} Z`);
        path.setAttribute('fill', band.color);
        path.setAttribute('tabindex', '0');
        path.setAttribute('role', 'button');
        path.addEventListener('click', () => select(band));
        path.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(band); }
        });
        svg.appendChild(path);
        paths.push(path);

        const text = document.createElementNS(ns, 'text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy - (ro - bw / 2) + 5);
        text.setAttribute('text-anchor', 'middle');
        text.style.fill = band.text;
        svg.appendChild(text);
        texts.push(text);

        const panel = document.createElement('div');
        panel.dataset.band = band.id;
        card.appendChild(panel);
    });

    onLang(() => {
        BANDS.forEach((band, i) => {
            const name = t(`bands.${band.id}.name`);
            texts[i].textContent = name;
            paths[i].setAttribute('aria-label', name);
            card.children[i].innerHTML = cardHtml(band);
        });
        select(active);
    });
}

// ---------- Sky drawing (rainbow lab) ----------

const RAIN = (() => {
    const rnd = mulberry32(7);
    return Array.from({ length: 110 }, () => ({ x: rnd(), y: rnd(), l: 0.03 + rnd() * 0.05, s: 0.5 + rnd() * 0.6 }));
})();

const STARS = (() => {
    const rnd = mulberry32(11);
    return Array.from({ length: 140 }, () => ({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 1.2, p: rnd() * TAU }));
})();

const FIELDS = (() => {
    const rnd = mulberry32(3);
    const colors = [[79, 125, 58], [107, 143, 60], [138, 154, 74], [63, 110, 58], [156, 138, 85], [93, 138, 70]];
    return Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), w: 0.08 + rnd() * 0.16, h: 0.06 + rnd() * 0.14, c: colors[Math.floor(rnd() * colors.length)] }));
})();

const SKY = {
    bright: [[96, 116, 156], [132, 150, 184], [182, 196, 218]],
    storm: [[26, 30, 46], [42, 48, 66], [68, 76, 96]],
    haze: [168, 172, 182],
    sunset: [[46, 35, 80], [154, 74, 116], [242, 160, 106]],
    night: [[2, 4, 26], [10, 16, 48], [24, 35, 77]]
};
const HILLS = {
    day: [[79, 138, 92], [61, 154, 74]],
    sunset: [[58, 35, 56], [42, 26, 42]],
    night: [[11, 24, 32], [13, 31, 24]]
};

function drawRain(ctx, x0, y0, w, h, time, alpha, density = 1) {
    const count = Math.round(RAIN.length * clamp(density, 0, 1));
    if (!count) return;
    ctx.strokeStyle = `rgba(220,230,255,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
        const d = RAIN[i];
        const x = x0 + d.x * w;
        const y = y0 + ((d.y + time * d.s * 0.6) % 1) * h;
        ctx.moveTo(x, y);
        ctx.lineTo(x - h * 0.008, y + d.l * h);
    }
    ctx.stroke();
}

function fillRing(ctx, cx, cy, r0, r1, style, op = 'source-over') {
    ctx.save();
    ctx.globalCompositeOperation = op;
    ctx.fillStyle = style;
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, TAU);
    if (r0 > 0) ctx.arc(cx, cy, r0, 0, TAU, true);
    ctx.fill();
    ctx.restore();
}

function drawBow(ctx, cx, cy, ppd, { k = 1, alpha = 0.85, weight = () => 1, desat = 0, spread = BOW_SPREAD } = {}) {
    const samples = [];
    for (let nm = 390; nm <= 710; nm += 8) {
        let rgb = wavelengthToRGB(nm);
        if (desat) rgb = desaturate(rgb, desat);
        samples.push({ r: displayBowAngle(nm, k, spread) * ppd, rgb, a: alpha * weight(nm) });
    }
    samples.sort((a, b) => a.r - b.r);
    const pad = ppd * 0.5;
    const r0 = Math.max(0, samples[0].r - pad);
    const r1 = samples[samples.length - 1].r + pad;
    const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
    g.addColorStop(0, rgba(samples[0].rgb, 0));
    samples.forEach((s) => g.addColorStop(clamp((s.r - r0) / (r1 - r0), 0, 1), rgba(s.rgb, s.a)));
    g.addColorStop(1, rgba(samples[samples.length - 1].rgb, 0));
    fillRing(ctx, cx, cy, r0, r1, g, 'screen');
    return { inner: samples[0].r, outer: samples[samples.length - 1].r };
}

function interiorGlow(ctx, cx, cy, r, rgb, strength) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, rgba(rgb, 0.06 * strength));
    g.addColorStop(0.92, rgba(rgb, 0.16 * strength));
    g.addColorStop(1, rgba(rgb, 0));
    fillRing(ctx, cx, cy, 0, r, g, 'screen');
}

function drawHills(ctx, w, h, horizon, far, near) {
    ctx.fillStyle = far;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) ctx.lineTo(x, horizon - h * 0.035 + Math.sin(x / w * 7 + 1) * h * 0.022 + Math.sin(x / w * 17) * h * 0.008);
    ctx.lineTo(w, h);
    ctx.fill();
    ctx.fillStyle = near;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) ctx.lineTo(x, horizon + h * 0.04 + Math.sin(x / w * 4 + 2.5) * h * 0.035);
    ctx.lineTo(w, h);
    ctx.fill();
}

function dropSizeMm(v) { return Math.pow(10, lerp(-2, Math.log10(3), v / 100)); }
function dropSizeValue(mm) { return Math.round((Math.log10(mm) + 2) / (Math.log10(3) + 2) * 100); }

// Above this sun height even the outer edge of the second bow is below the horizon.
const SECOND_MAX = rainbowAngleDeg(nWater(400), 2);
// Below this rain amount there are no drops at all.
const RAIN_MIN = 3;

// How the bows look for the current lab settings. Every effect comes from a slider.
function bowLook(L) {
    const s = dropSizeMm(L.sizeV);
    const moon = L.source === 'moon';
    const fog = 1 - smoothstep(0.025, 0.12, s);
    const vivid = smoothstep(0.04, 1.2, s);
    const clearK = lerp(0.1, 1, L.clear / 100);
    const rainK = L.rain < RAIN_MIN ? 0 : smoothstep(0, 50, L.rain);
    const contrast = lerp(0.35, 1, moon ? 1 : L.dark / 100);
    const strength = (moon ? 0.3 : 1) * clearK * rainK * contrast;
    const glow = smoothstep(0, 0.45, strength);
    return {
        s,
        moon,
        fog,
        vivid,
        clearK,
        strength,
        glow,
        a1: 0.9 * glow * (1 - fog),
        a2: 0.55 * smoothstep(0.5, 0.9, strength) * (1 - fog),
        sup: Math.exp(-(((Math.log10(s) - Math.log10(0.3)) / 0.35) ** 2)) * (1 - fog),
        glory: (1 - smoothstep(0.04, 0.25, s)) * smoothstep(0, 0.6, strength),
        red: moon ? 0 : 1 - smoothstep(1, 7, L.elev),
        desat: Math.min(1, (1 - vivid) * 0.6 + (moon ? 0.7 : 0)),
        spread: BOW_SPREAD * (1 + (1 - vivid) * 0.8),
        supSpacing: clamp(0.9 * Math.pow(0.5 / s, 2 / 3), 0.6, 4)
    };
}

function drawBows(ctx, cx, cy, ppd, P) {
    const weight = (nm) => lerp(1, smoothstep(545, 625, nm), P.red);
    if (P.a2 > 0.01) {
        const r1 = displayBowAngle(710, 1, P.spread) * ppd;
        const r2 = displayBowAngle(710, 2, P.spread) * ppd;
        fillRing(ctx, cx, cy, r1, r2, `rgba(8,12,35,${0.5 * P.a2})`);
    }
    if (P.a1 > 0.01) {
        const b = drawBow(ctx, cx, cy, ppd, { alpha: P.a1, weight, desat: P.desat, spread: P.spread });
        interiorGlow(ctx, cx, cy, b.inner, mixRGB([255, 255, 255], [255, 180, 120], P.red), P.glow * (1 - P.fog));
        if (P.sup > 0.05) {
            const s = P.supSpacing * ppd;
            for (let j = 1; j <= 3; j++) {
                const rc = b.inner - j * s * 1.1;
                if (rc - s * 0.6 <= 0) break;
                const a = (0.45 / j) * P.sup * P.glow;
                const g = ctx.createRadialGradient(cx, cy, rc - s * 0.6, cx, cy, rc + s * 0.6);
                g.addColorStop(0, 'rgba(120,255,170,0)');
                g.addColorStop(0.3, `rgba(120,255,170,${a})`);
                g.addColorStop(0.7, `rgba(255,140,220,${a})`);
                g.addColorStop(1, 'rgba(255,140,220,0)');
                fillRing(ctx, cx, cy, rc - s * 0.6, rc + s * 0.6, g, 'screen');
            }
        }
    }
    if (P.a2 > 0.01) drawBow(ctx, cx, cy, ppd, { k: 2, alpha: P.a2, weight, desat: P.desat, spread: P.spread });
    if (P.fog > 0.01) {
        const a = P.fog * P.glow;
        const r0 = 33 * ppd, r1 = 45 * ppd;
        const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
        g.addColorStop(0, 'rgba(160,190,255,0)');
        g.addColorStop(0.25, `rgba(160,190,255,${0.18 * a})`);
        g.addColorStop(0.55, `rgba(255,255,255,${0.6 * a})`);
        g.addColorStop(0.78, `rgba(255,200,170,${0.32 * a})`);
        g.addColorStop(1, 'rgba(255,200,170,0)');
        fillRing(ctx, cx, cy, r0, r1, g, 'screen');
    }
}

function drawGlory(ctx, cx, cy, ppd, P) {
    if (P.glory < 0.01) return;
    const gs = ppd * 2.6;
    [1.6, 2.7, 3.8].forEach((r, i) => {
        const g = ctx.createRadialGradient(cx, cy, (r - 0.5) * gs, cx, cy, (r + 0.5) * gs);
        const a = (0.6 - i * 0.14) * P.glory;
        g.addColorStop(0, 'rgba(120,140,255,0)');
        g.addColorStop(0.35, `rgba(120,160,255,${a})`);
        g.addColorStop(0.6, `rgba(170,255,160,${a})`);
        g.addColorStop(0.85, `rgba(255,140,120,${a})`);
        g.addColorStop(1, 'rgba(255,140,120,0)');
        fillRing(ctx, cx, cy, (r - 0.5) * gs, (r + 0.5) * gs, g, 'screen');
    });
}

function skyColors(L) {
    if (L.source === 'moon') return { sky: SKY.night, hills: HILLS.night };
    const k = 1 - smoothstep(1, 9, L.elev);
    const haze = (1 - L.clear / 100) * 0.45;
    return {
        sky: SKY.bright.map((c, i) => mixRGB(mixRGB(mixRGB(c, SKY.storm[i], L.dark / 100), SKY.haze, haze), SKY.sunset[i], k)),
        hills: HILLS.day.map((c, i) => mixRGB(c, HILLS.sunset[i], k))
    };
}

function drawSunDisk(ctx, x, y, size, moon, dim = 1) {
    ctx.save();
    ctx.globalAlpha = dim;
    const g = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    g.addColorStop(0, moon ? 'rgba(235,240,255,0.9)' : 'rgba(255,252,225,1)');
    g.addColorStop(0.25, moon ? 'rgba(200,210,240,0.4)' : 'rgba(255,215,90,0.85)');
    g.addColorStop(1, 'rgba(255,215,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, size * 3, 0, TAU);
    ctx.fill();
    if (moon) {
        ctx.fillStyle = '#e8ecf8';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}

// Plane outline seen from above, nose up, as [x, y] for the right half (unit size).
const PLANE_TOP = [[0, -1], [0.12, -0.75], [0.12, -0.2], [1, 0.15], [1, 0.3], [0.12, 0.18], [0.1, 0.7], [0.4, 0.88], [0.4, 1], [0, 0.92]];

function planeTopPath(ctx, x, y, s) {
    const pts = [...PLANE_TOP, ...PLANE_TOP.slice(0, -1).reverse().map(([px, py]) => [-px, py])];
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x + px * s, y + py * s));
    ctx.closePath();
}

function drawPlaneSide(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#e9ecf5';
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.17, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, -s * 0.06);
    ctx.lineTo(-s * 0.98, -s * 0.55);
    ctx.lineTo(-s * 0.82, -s * 0.55);
    ctx.lineTo(-s * 0.45, -s * 0.1);
    ctx.fill();
    ctx.fillStyle = '#b9c0d8';
    ctx.beginPath();
    ctx.moveTo(s * 0.15, s * 0.04);
    ctx.lineTo(-s * 0.3, s * 0.5);
    ctx.lineTo(-s * 0.12, s * 0.5);
    ctx.lineTo(s * 0.35, s * 0.04);
    ctx.fill();
    ctx.fillStyle = '#1d2050';
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(s * (0.6 - i * 0.2), -s * 0.03, s * 0.045, 0, TAU);
        ctx.fill();
    }
    ctx.restore();
}

function drawEye(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#1d2050';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.quadraticCurveTo(x, y - size * 0.9, x + size, y);
    ctx.quadraticCurveTo(x, y + size * 0.9, x - size, y);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2f8cff';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.36, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#10122a';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.17, 0, TAU);
    ctx.fill();
    ctx.restore();
}

function drawPersonSide(ctx, eye, ground, personH, face, night) {
    const headR = personH * 0.12;
    const body = night ? '#aab4dc' : '#1d2050';
    ctx.save();
    ctx.strokeStyle = body;
    ctx.fillStyle = body;
    ctx.lineWidth = Math.max(3, personH * 0.07);
    ctx.lineCap = 'round';
    const bx = eye.x - face * headR * 0.3;
    ctx.beginPath();
    ctx.moveTo(bx, eye.y + headR);
    ctx.lineTo(bx, ground - personH * 0.4);
    ctx.lineTo(bx - face * headR * 0.6, ground);
    ctx.moveTo(bx, ground - personH * 0.4);
    ctx.lineTo(bx + face * headR * 0.7, ground);
    ctx.moveTo(bx, eye.y + headR * 2);
    ctx.lineTo(bx + face * headR * 1.6, eye.y + headR * 3.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx, eye.y, headR, 0, TAU);
    ctx.fill();
    ctx.fillStyle = night ? '#10122a' : '#fff';
    ctx.beginPath();
    ctx.arc(bx + face * headR * 0.55, eye.y - headR * 0.1, headR * 0.22, 0, TAU);
    ctx.fill();
    ctx.restore();
    return bx;
}

// The sky below the plane: looking down at the rain, with the plane's shadow in the middle of the bows.
function drawPlaneView(ctx, w, h, time, L, P) {
    const fs = fontSize(w, 11, 15);
    const ppd = h / 104;
    const horizon = ppd * 10;
    const night = P.moon ? 0.75 : 0;
    const colors = skyColors(L);
    const facing = Math.abs(L.dir) < 150;
    const cx = w / 2 - L.dir * ppd;
    const cy = horizon + L.elev * ppd;

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, rgba(colors.sky[1]));
    sky.addColorStop(1, rgba(colors.sky[2]));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, horizon, w, h - horizon);
    ctx.clip();
    ctx.fillStyle = rgba([70, 112, 60].map((v) => Math.round(v * (1 - night))));
    ctx.fillRect(0, horizon, w, h - horizon);
    FIELDS.forEach((f) => {
        ctx.fillStyle = rgba(f.c.map((v) => Math.round(v * (1 - night))));
        ctx.fillRect(f.x * w - f.w * w / 2, horizon + f.y * (h - horizon) - f.h * h / 2, f.w * w, f.h * h);
    });
    const veil = (0.2 + 0.45 * L.dark / 100) * (0.3 + 0.7 * L.rain / 100) + night * 0.3;
    ctx.fillStyle = `rgba(40,50,70,${veil})`;
    ctx.fillRect(0, horizon, w, h - horizon);
    drawRain(ctx, 0, horizon, w, h - horizon, time, 0.16, L.rain / 100);
    if (facing) {
        drawBows(ctx, cx, cy, ppd, P);
        drawGlory(ctx, cx, cy, ppd, P);
        ctx.fillStyle = 'rgba(15,20,35,0.7)';
        planeTopPath(ctx, cx, cy, ppd * 2.6);
        ctx.fill();
    }
    ctx.restore();

    const sunX = w / 2 + wrap180(180 - L.dir) * ppd;
    const sunY = horizon - L.elev * ppd;
    if (sunY > -ppd * 6 && Math.abs(sunX - w / 2) < w / 2 + ppd * 8) {
        drawSunDisk(ctx, sunX, sunY, ppd * 2.2, P.moon, lerp(0.3, 1, L.clear / 100));
    }

    if (L.helpers && facing) {
        if (cx > 0 && cx < w && cy < h) {
            const top = displayBowAngle(700, 1, P.spread) * ppd;
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, Math.max(horizon, cy - top));
            ctx.stroke();
            ctx.setLineDash([]);
            if (cy - top * 0.5 > horizon + fs) label(ctx, '42°', cx + 8, cy - top * 0.5, { size: fs + 1, color: '#ffd34d', align: 'left' });
            label(ctx, t('ch5.planeShadow'), cx, Math.min(cy + ppd * 4 + fs, h - fs * 0.8), { size: fs - 1 });
        } else if (cx <= 0 || cx >= w) {
            const left = cx <= 0;
            label(ctx, left ? `← ${t('ch5.planeShadow')}` : `${t('ch5.planeShadow')} →`, left ? 10 : w - 10, h * 0.5, { size: fs, align: left ? 'left' : 'right' });
        }
    }

    // Window frame
    const m = Math.min(w, h);
    ctx.strokeStyle = 'rgba(12,14,28,0.92)';
    ctx.lineWidth = m * 0.07;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, m * 0.14);
    ctx.stroke();
}

function drawSkyView(ctx, w, h, time, L) {
    const P = bowLook(L);
    if (L.where === 'plane') {
        drawPlaneView(ctx, w, h, time, L, P);
        return;
    }
    const fs = fontSize(w, 11, 15);
    const horizon = h * 0.78;
    const ppd = Math.min(w / 105, horizon / 58);
    const antiAz = -L.dir;
    const cx = w / 2 + antiAz * ppd;
    const cy = horizon + L.elev * ppd;
    const colors = skyColors(L);

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    colors.sky.forEach((c, i) => sky.addColorStop(i / 2, rgba(c)));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon + 2);

    if (P.moon) {
        ctx.fillStyle = '#fff';
        STARS.forEach((s) => {
            ctx.globalAlpha = (0.4 + 0.4 * Math.sin(time * 2 + s.p)) * L.clear / 100;
            ctx.beginPath();
            ctx.arc(s.x * w, s.y * horizon, s.r, 0, TAU);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    const sunAz = wrap180(antiAz + 180);
    const sunX = w / 2 + sunAz * ppd;
    const sunY = horizon - L.elev * ppd;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, horizon);
    ctx.clip();
    drawRain(ctx, 0, 0, w, horizon, time, P.moon ? 0.1 : 0.18 * (1 - P.fog), L.rain / 100);
    if (Math.abs(antiAz) < 150) drawBows(ctx, cx, cy, ppd, P);
    if (Math.abs(sunX - w / 2) < w / 2 + ppd * 8) {
        const dim = lerp(0.3, 1, L.clear / 100);
        drawSunDisk(ctx, sunX, sunY, ppd * 2.2, P.moon, dim);
        const glare = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.6);
        glare.addColorStop(0, `rgba(255,245,210,${(P.moon ? 0.15 : 0.45) * dim})`);
        glare.addColorStop(1, 'rgba(255,245,210,0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, w, horizon);
    }
    ctx.restore();

    drawHills(ctx, w, h, horizon, rgba(colors.hills[0]), rgba(colors.hills[1]));

    if (P.fog > 0.05 && L.rain >= RAIN_MIN) {
        const fg = ctx.createLinearGradient(0, horizon - h * 0.2, 0, h);
        fg.addColorStop(0, 'rgba(230,235,240,0)');
        fg.addColorStop(0.5, `rgba(230,235,240,${0.55 * P.fog * P.clearK})`);
        fg.addColorStop(1, `rgba(230,235,240,${0.25 * P.fog * P.clearK})`);
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, w, h);
    }

    if (L.helpers) {
        const top = displayBowAngle(700, 1, P.spread) * ppd;
        if (cx > 0 && cx < w) {
            if (cy - top < horizon) {
                ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cx, Math.min(cy, h));
                ctx.lineTo(cx, cy - top);
                ctx.stroke();
                ctx.setLineDash([]);
                label(ctx, '42°', cx + 8, Math.max(cy - top * 0.55, cy - top + fs * 1.5), { size: fs + 1, color: '#ffd34d', align: 'left' });
            }
            if (cy < h - 6) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(cx, cy, 4, 0, TAU);
                ctx.fill();
                label(ctx, t('ch5.shadow'), cx, Math.min(cy + fs * 1.2, h - fs * 0.7), { size: fs - 1 });
            } else {
                label(ctx, `${t('ch5.centre')} ↓`, cx, h - fs * 0.8, { size: fs - 1 });
            }
        } else if (Math.abs(antiAz) < 150) {
            const left = cx <= 0;
            label(ctx, left ? `← ${t('ch5.centre')}` : `${t('ch5.centre')} →`, left ? 10 : w - 10, horizon + fs * 1.6, { size: fs, align: left ? 'left' : 'right' });
        }
    }

    if (L.rain < RAIN_MIN) {
        label(ctx, t('ch5.noDrops'), w / 2, h * 0.32, { size: fs + 3 });
    } else if (L.elev > PRIMARY_MAX && Math.abs(antiAz) < 60 && P.a2 < 0.1) {
        label(ctx, t('ch5.tooHigh'), w / 2, h * 0.32, { size: fs + 3 });
    }
}

// One drop, with the light paths for the main bow (1 bounce) and the second bow (2 bounces).
const DROP_NM = [650, 610, 580, 540, 490, 440];
const DROP_DISPERSION = 3;

function dropRainbowTraces(c, r, d, k) {
    const n0 = nWater(590);
    const b = Math.sin(Math.acos(Math.sqrt((n0 * n0 - 1) / (k * (k + 2)))));
    const perp = { x: -d.y, y: d.x };
    const start = (sign) => vec.add(vec.sub(c, vec.scale(d, r * 6)), vec.scale(perp, sign * b * r));
    const n590 = refractiveIndex('water', 590, DROP_DISPERSION);
    const pick = [1, -1].map((sign) => ({ sign, tr: traceDrop(start(sign), d, c, r, n590, k) }))
        .sort((p, q) => q.tr.exit.dir.y - p.tr.exit.dir.y)[0];
    return DROP_NM.map((nm) => ({ nm, ...traceDrop(start(pick.sign), d, c, r, refractiveIndex('water', nm, DROP_DISPERSION), k) }));
}

function arrowHead(ctx, p, dir, size) {
    const back = vec.scale(dir, -size);
    const side = { x: -dir.y * size * 0.55, y: dir.x * size * 0.55 };
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + back.x + side.x, p.y + back.y + side.y);
    ctx.lineTo(p.x + back.x - side.x, p.y + back.y - side.y);
    ctx.closePath();
    ctx.fill();
}

function drawDropView(ctx, w, h, time, L) {
    const P = bowLook(L);
    const fs = fontSize(w, 10, 13);
    const noRain = L.rain < RAIN_MIN;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, P.moon ? '#050a24' : '#1d2a55');
    bg.addColorStop(1, P.moon ? '#121a40' : '#2c3d72');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const r = Math.min(w * 0.2, h * 0.25);
    const c = { x: w * 0.66, y: h * 0.36 };
    const floor = h - fs * 2.6;
    const e = L.elev * DEG;
    const d = { x: Math.cos(e), y: Math.sin(e) };
    const perp = { x: -d.y, y: d.x };
    const lightRGB = P.moon ? [215, 225, 255] : [255, 246, 205];
    const lightK = P.clearK * (P.moon ? 0.6 : 1);

    // The drop
    ctx.globalAlpha = noRain ? 0.25 : 1;
    const dg = ctx.createRadialGradient(c.x - r * 0.35, c.y - r * 0.4, r * 0.1, c.x, c.y, r);
    dg.addColorStop(0, 'rgba(190,225,255,0.35)');
    dg.addColorStop(1, 'rgba(60,120,220,0.2)');
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,215,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Parallel light coming in
    ctx.strokeStyle = rgba(lightRGB, 0.16 * lightK);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -time * 30;
    for (let k = -5; k <= 5; k++) {
        const o = vec.add(vec.sub(c, vec.scale(d, w * 2)), vec.scale(perp, (k / 5) * r * 0.95));
        const hit = circleHit(o, d, c, r);
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        const end = vec.add(o, vec.scale(d, hit === null ? w * 4 : hit));
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    const lightLabelAt = vec.add(vec.sub(c, vec.scale(d, r * 1.9)), vec.scale(perp, -r * 1.25));
    label(ctx, `${t(P.moon ? 'ch5.dropMoonlight' : 'ch5.dropSunlight')} →`, lightLabelAt.x, lightLabelAt.y, { size: fs, color: rgba(lightRGB) });

    if (noRain) {
        label(ctx, t('ch5.dropNone'), c.x, c.y, { size: fs + 1 });
        return;
    }

    const visible = Math.abs(L.dir) < 95;
    const bows = [
        { k: 1, vis: lerp(0.25, 1, P.a1 / 0.9), angle: BOW_CENTER[1], text: 'ch5.dropBounce1' },
        { k: 2, vis: lerp(0.35, 0.85, P.a2 / 0.55), angle: BOW_CENTER[2], text: 'ch5.dropBounce2' }
    ];
    const smear = P.fog;
    ctx.globalCompositeOperation = 'lighter';
    bows.forEach((bow) => {
        const traces = dropRainbowTraces(c, r, d, bow.k);
        const inSeg = traces[0].segs[0];
        const entry = inSeg.b;
        const from = vec.sub(entry, vec.scale(d, r * 3));
        ctx.strokeStyle = rgba(lightRGB, 0.8 * bow.vis * lightK);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(entry.x, entry.y);
        ctx.stroke();
        bow.exits = [];
        traces.forEach((tr) => {
            const rgb = mixRGB(wavelengthToRGB(tr.nm), [255, 255, 255], smear * 0.8);
            ctx.lineWidth = 1.8;
            tr.segs.slice(1, -1).forEach((s) => {
                ctx.strokeStyle = rgba(rgb, 0.5 * bow.vis * lightK);
                ctx.beginPath();
                ctx.moveTo(s.a.x, s.a.y);
                ctx.lineTo(s.b.x, s.b.y);
                ctx.stroke();
            });
            const p = tr.exit.point;
            const len = Math.max(r * 0.3, Math.min(r * 1.8, edgeDistance(p, tr.exit.dir, w, floor) - 6));
            const q = vec.add(p, vec.scale(tr.exit.dir, len));
            ctx.strokeStyle = rgba(rgb, 0.9 * bow.vis * lightK);
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
            ctx.fillStyle = rgba(rgb, 0.9 * bow.vis * lightK);
            arrowHead(ctx, q, tr.exit.dir, 7);
            bow.exits.push({ p, q, dir: tr.exit.dir });
        });
        if (smear > 0.05) {
            const p = bow.exits[2].p;
            const a = Math.atan2(bow.exits[2].dir.y, bow.exits[2].dir.x);
            const len = Math.hypot(bow.exits[2].q.x - p.x, bow.exits[2].q.y - p.y);
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, len);
            g.addColorStop(0, `rgba(255,255,255,${0.35 * smear * bow.vis})`);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x, p.y, len, a - 0.3, a + 0.3);
            ctx.closePath();
            ctx.fill();
        }
    });
    ctx.globalCompositeOperation = 'source-over';

    bows.forEach((bow) => {
        const mid = bow.exits[2];
        if (L.helpers) {
            const back = vec.neg(d);
            const ref = vec.add(mid.p, vec.scale(back, r * 0.9));
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(mid.p.x, mid.p.y);
            ctx.lineTo(ref.x, ref.y);
            ctx.stroke();
            ctx.setLineDash([]);
            const a0 = Math.atan2(back.y, back.x);
            const a1 = Math.atan2(mid.dir.y, mid.dir.x);
            const rad = r * (bow.k === 1 ? 0.32 : 0.46);
            ctx.strokeStyle = '#ffd34d';
            ctx.lineWidth = 2;
            const delta = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0));
            ctx.beginPath();
            ctx.arc(mid.p.x, mid.p.y, rad, a0, a0 + delta, delta < 0);
            ctx.stroke();
            const am = a0 + delta / 2;
            label(ctx, `${Math.round(bow.angle)}°`, mid.p.x + Math.cos(am) * (rad + fs), mid.p.y + Math.sin(am) * (rad + fs), { size: fs, color: '#ffd34d' });
        }
        const end = bow.exits[bow.k === 1 ? DROP_NM.length - 1 : 0].q;
        label(ctx, t(bow.text), end.x, end.y + (bow.k === 1 ? 1 : -1) * fs * 1.1, { size: fs - 1, color: bow.k === 1 ? '#fff' : 'rgba(255,255,255,0.75)', weight: 700, align: 'left' });
    });

    // Where are you?
    const eyeSize = fs * 0.9;
    if (visible) {
        const q = bows[0].exits[2].q;
        const at = { x: clamp(q.x, eyeSize * 1.5, w - eyeSize * 1.5), y: clamp(q.y - fs * 1.5, eyeSize, h - eyeSize) };
        drawEye(ctx, at.x, at.y, eyeSize);
        label(ctx, t('ch5.dropToYou'), at.x, at.y - eyeSize * 1.5, { size: fs, color: '#ffd34d' });
    } else {
        const at = { x: w - eyeSize * 1.6, y: c.y + r * 1.2 };
        drawEye(ctx, at.x, at.y, eyeSize);
        label(ctx, t('ch5.dropMiss'), w - 8, at.y + eyeSize * 1.8, { size: fs - 1, color: '#ffd34d', align: 'right' });
    }

    let note = 'ch5.dropNoteBig';
    if (P.fog > 0.5) note = 'ch5.dropNoteFog';
    else if (P.sup > 0.4) note = 'ch5.dropNoteSup';
    label(ctx, `${t('ch5.dropSizeIs', { size: formatMm(P.s) })} ${t(note)}`, w / 2, h - fs * 0.9, { size: fs - 1, weight: 700 });
}

// ---------- 5. Rainbow lab ----------

const LAB_DEFAULT = { elev: 15, dir: 0, size: 1, clear: 70, dark: 40, rain: 60, source: 'sun', where: 'ground' };
const LAB_PRESETS = {
    normal: {},
    double: { elev: 10, size: 1.5, clear: 100, dark: 90, rain: 90 },
    extra: { size: 0.3, clear: 80, dark: 60, rain: 80 },
    fog: { elev: 12, size: 0.02, clear: 90, dark: 30, rain: 80 },
    red: { elev: 2, clear: 90, dark: 70, rain: 80 },
    moon: { source: 'moon', clear: 100, rain: 80 },
    plane: { where: 'plane', elev: 45, clear: 100, dark: 60, rain: 80 },
    glory: { where: 'plane', elev: 45, size: 0.02, clear: 100, dark: 30, rain: 90 },
    noon: { elev: 50 },
    front: { dir: 180 }
};
const LAB_KEYS = ['elev', 'dir', 'sizeV', 'clear', 'dark', 'rain', 'source', 'where'];

function presetState(key) {
    const p = { ...LAB_DEFAULT, ...LAB_PRESETS[key] };
    return { elev: p.elev, dir: p.dir, sizeV: dropSizeValue(p.size), clear: p.clear, dark: p.dark, rain: p.rain, source: p.source, where: p.where };
}

function directionKey(dir) {
    const a = Math.abs(dir);
    const side = dir > 0 ? 'Right' : 'Left';
    if (a <= 20) return 'behind';
    if (a < 70) return `behind${side}`;
    if (a <= 110) return side.toLowerCase();
    if (a < 160) return `front${side}`;
    return 'front';
}

function dropKey(mm) {
    if (mm < 0.05) return 'fog';
    if (mm < 0.5) return 'drizzle';
    if (mm < 2) return 'rain';
    return 'heavy';
}

function levelIndex(key, v) {
    if (key === 'rain' && v < RAIN_MIN) return 0;
    if (key === 'rain') return v < 35 ? 1 : v < 75 ? 2 : 3;
    return v < 25 ? 0 : v < 50 ? 1 : v < 80 ? 2 : 3;
}

function formatMm(mm) { return `${fmt(mm, mm < 0.1 ? 2 : 1)} mm`; }

function initLab() {
    const $ = (id) => document.getElementById(id);
    const sliders = { elev: $('lab-elev'), dir: $('lab-dir'), sizeV: $('lab-size'), clear: $('lab-clear'), dark: $('lab-dark'), rain: $('lab-rain') };
    const valueLabels = { elev: $('lab-elev-label'), dir: $('lab-dir-label'), sizeV: $('lab-size-label'), clear: $('lab-clear-label'), dark: $('lab-dark-label'), rain: $('lab-rain-label') };
    const elevName = $('lab-elev-name');
    const dirName = $('lab-dir-name');
    const whereRow = $('lab-where');
    const sourceRow = $('lab-source');
    const helpersBtn = $('lab-helpers');
    const explain = $('lab-explain');
    const presetRow = $('lab-presets');

    const L = { ...presetState('normal'), helpers: true };

    const sky = new Stage($('sky-canvas'), (ctx, w, h, time) => drawSkyView(ctx, w, h, time, L), { animate: true });
    const drop = new Stage($('drop-canvas'), (ctx, w, h, time) => drawDropView(ctx, w, h, time, L), { animate: true });

    // Map seen from above: you in the middle looking up, rain ahead (or all around below the plane).
    const mapGeo = (w, h) => ({ c: { x: w / 2, y: h * 0.56 }, R: Math.min(w * 0.4, h * 0.34) });
    const map = new Stage($('map-canvas'), (ctx, w, h, time) => {
        const fs = fontSize(w, 11, 14);
        const { c, R } = mapGeo(w, h);
        const plane = L.where === 'plane';
        const moon = L.source === 'moon';
        const hasRain = L.rain >= RAIN_MIN;
        ctx.fillStyle = moon ? '#14281c' : '#2f6b3a';
        ctx.fillRect(0, 0, w, h);

        if (plane) {
            if (hasRain) {
                ctx.fillStyle = `rgba(70,80,110,${0.25 + 0.4 * L.rain / 100})`;
                ctx.fillRect(0, 0, w, h);
                drawRain(ctx, 0, 0, w, h, time, 0.3, L.rain / 100);
                label(ctx, t('ch5.rainBelow'), 10, fs, { size: fs, align: 'left' });
            }
        } else {
            const rainTop = Math.max(4, c.y - R * 1.5), rainBottom = c.y - R * 0.5;
            if (hasRain) {
                ctx.fillStyle = `rgba(70,80,110,${0.3 + 0.4 * L.rain / 100})`;
                ctx.fillRect(6, rainTop, w - 12, rainBottom - rainTop);
                drawRain(ctx, 6, rainTop, w - 12, rainBottom - rainTop, time, 0.35, L.rain / 100);
            }
            label(ctx, t(hasRain ? 'ch5.rain' : 'ch5.noRainShort'), 14, rainTop + fs, { size: fs, align: 'left' });
        }

        // Field of view
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.arc(c.x, c.y, R * 1.25, (-90 - 52) * DEG, (-90 + 52) * DEG);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x, c.y, R, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sun position: dir 0 = straight behind you (down on the map), positive = to your right.
        const sunScreen = (90 - L.dir) * DEG;
        const sun = { x: c.x + R * Math.cos(sunScreen), y: c.y + R * Math.sin(sunScreen) };
        const anti = { x: -Math.cos(sunScreen), y: -Math.sin(sunScreen) };

        ctx.strokeStyle = moon ? 'rgba(220,230,255,0.25)' : 'rgba(255,230,140,0.35)';
        ctx.setLineDash([8, 8]);
        ctx.lineDashOffset = -time * 25;
        for (let k = -2; k <= 2; k++) {
            const off = { x: -anti.y * k * R * 0.18, y: anti.x * k * R * 0.18 };
            ctx.beginPath();
            ctx.moveTo(sun.x + off.x, sun.y + off.y);
            ctx.lineTo(sun.x + off.x + anti.x * R * 2.2, sun.y + off.y + anti.y * R * 2.2);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;

        const P = bowLook(L);
        const inView = Math.abs(L.dir) < 52;
        const bands = ['#ff3b3b', '#ffe03b', '#33d16a', '#2f8cff', '#9b3bff'];
        if (plane) {
            const dist = R * clamp(0.5 / Math.max(Math.tan(L.elev * DEG), 0.05), 0.55, 0.95);
            const s = { x: c.x + anti.x * dist, y: c.y + anti.y * dist };
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.setLineDash([6, 5]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(s.x, s.y);
            ctx.stroke();
            ctx.setLineDash([]);
            if (P.a1 > 0.05) {
                bands.forEach((col, i) => {
                    ctx.strokeStyle = col;
                    ctx.globalAlpha = Math.min(1, P.a1 * 1.2);
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, R * 0.24 + (2 - i) * 3, 0, TAU);
                    ctx.stroke();
                });
                ctx.globalAlpha = 1;
            }
            ctx.fillStyle = 'rgba(10,15,25,0.6)';
            planeTopPath(ctx, s.x, s.y, 9);
            ctx.fill();
            const lp = vec.add(s, vec.scale(anti, R * 0.24 + fs * 1.3));
            label(ctx, t('ch5.planeShadow'), lp.x, clamp(lp.y, fs, h - fs), { size: fs - 1, color: '#ffd34d' });
        } else {
            const shadowLen = Math.min(R * 0.7, R * 0.12 / Math.max(Math.tan(L.elev * DEG), 0.05));
            ctx.strokeStyle = 'rgba(0,20,10,0.55)';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(c.x + anti.x * shadowLen, c.y + anti.y * shadowLen);
            ctx.stroke();

            const bowVisible = Math.abs(L.dir) < 95 && L.elev < PRIMARY_MAX && P.a1 > 0.05;
            ctx.strokeStyle = bowVisible ? '#ffd34d' : 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            const end = { x: c.x + anti.x * R * 1.05, y: c.y + anti.y * R * 1.05 };
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            ctx.setLineDash([]);

            if (bowVisible) {
                const p = { x: c.x + anti.x * R * 0.85, y: c.y + anti.y * R * 0.85 };
                const ang = Math.atan2(anti.y, anti.x);
                ctx.globalAlpha = Math.min(1, P.a1 * 1.2);
                bands.forEach((col, i) => {
                    ctx.strokeStyle = col;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, R * 0.85 + (2 - i) * 3, ang - 0.45, ang + 0.45);
                    ctx.stroke();
                });
                ctx.globalAlpha = 1;
                label(ctx, t('ch5.centre'), clamp(p.x, 70, w - 70), clamp(p.y + (inView ? fs * 1.3 : 0), fs, h - fs), { size: fs - 1, color: '#ffd34d' });
            } else if (Math.abs(L.dir) >= 95) {
                label(ctx, t('ch5.noRain'), clamp(end.x, 60, w - 60), clamp(end.y, fs, h - fs), { size: fs - 1, color: '#ddd' });
            }
        }

        // You
        if (plane) {
            ctx.fillStyle = '#e9ecf5';
            ctx.strokeStyle = '#1d2050';
            ctx.lineWidth = 1.5;
            planeTopPath(ctx, c.x, c.y, 18);
            ctx.fill();
            ctx.stroke();
            label(ctx, t('ch5.youPlane'), c.x + 22, c.y + fs, { size: fs, align: 'left' });
        } else {
            ctx.fillStyle = '#1d2050';
            ctx.beginPath();
            ctx.moveTo(c.x - 6, c.y - 6);
            ctx.lineTo(c.x, c.y - 17);
            ctx.lineTo(c.x + 6, c.y - 6);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(c.x, c.y, 9, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            label(ctx, t('ch5.you'), c.x + 14, c.y + fs, { size: fs, align: 'left' });
        }

        const sunR = Math.max(8, R * 0.08);
        drawSunDisk(ctx, sun.x, sun.y, sunR, moon, lerp(0.4, 1, L.clear / 100));
        const below = sun.y < h * 0.7;
        label(ctx, t(moon ? 'ch5.moonLabel' : 'ch5.sun'), sun.x, sun.y + (below ? 1 : -1) * (sunR * 2 + fs * 0.4), { size: fs });
    }, { animate: true });

    // Side view: a vertical cut through you and the sun.
    const sideGeo = (w, h) => {
        if (L.where === 'plane') return { ground: h * 0.92, personH: 0, eye: { x: w * 0.3, y: h * 0.2 } };
        const ground = h * 0.84;
        const personH = h * 0.2;
        return { ground, personH, eye: { x: w * 0.34, y: ground - personH * 0.88 } };
    };
    const side = new Stage($('side-canvas'), (ctx, w, h, time) => {
        const fs = fontSize(w, 11, 14);
        const P = bowLook(L);
        const plane = L.where === 'plane';
        const e = L.elev * DEG;
        const { ground, personH, eye } = sideGeo(w, h);
        const rainOnRight = plane || Math.abs(L.dir) <= 90;
        let rain;
        if (plane) rain = { x0: w * 0.02, x1: w * 0.99, y0: h * 0.45 };
        else rain = rainOnRight ? { x0: w * 0.6, x1: w * 0.99, y0: h * 0.16 } : { x0: w * 0.02, x1: eye.x - w * 0.08, y0: h * 0.16 };
        const night = P.moon;
        const hasRain = L.rain >= RAIN_MIN;

        const skyG = ctx.createLinearGradient(0, 0, 0, ground);
        skyG.addColorStop(0, night ? '#050a24' : '#3a4f86');
        skyG.addColorStop(1, night ? '#1a2550' : '#a6bde0');
        ctx.fillStyle = skyG;
        ctx.fillRect(0, 0, w, ground);
        ctx.fillStyle = night ? '#163020' : '#3d8a46';
        ctx.fillRect(0, ground, w, h - ground);

        if (hasRain) {
            const shade = Math.round(lerp(150, 50, L.dark / 100) * (night ? 0.5 : 1));
            ctx.fillStyle = `rgba(70,78,100,${0.15 + 0.3 * L.rain / 100})`;
            ctx.fillRect(rain.x0, rain.y0, rain.x1 - rain.x0, ground - rain.y0);
            drawRain(ctx, rain.x0, rain.y0, rain.x1 - rain.x0, ground - rain.y0, time, 0.35, L.rain / 100);
            ctx.fillStyle = `rgb(${shade},${shade + 6},${shade + 22})`;
            const puffs = plane ? 9 : 5;
            for (let i = 0; i < puffs; i++) {
                ctx.beginPath();
                ctx.arc(lerp(rain.x0, rain.x1, i / (puffs - 1)), rain.y0, (rain.x1 - rain.x0) * (plane ? 0.06 + (i % 2) * 0.02 : 0.12 + (i % 2) * 0.04), 0, TAU);
                ctx.fill();
            }
            label(ctx, t('ch5.rain'), (rain.x0 + rain.x1) / 2 + (plane ? w * 0.2 : 0), rain.y0, { size: fs + 1 });
        }

        const sunDir = { x: Math.cos(e), y: Math.sin(e) };
        const sunDist = Math.min(w * 0.26, (eye.y - 26) / Math.max(Math.sin(e), 1e-3));
        const sun = { x: eye.x - sunDir.x * sunDist, y: eye.y - sunDir.y * sunDist };
        const perp = { x: -sunDir.y, y: sunDir.x };
        ctx.strokeStyle = night ? 'rgba(220,230,255,0.25)' : `rgba(255,240,160,${0.12 + 0.25 * L.clear / 100})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = -time * 30;
        for (let k = -3; k <= 3; k++) {
            const s = vec.add(sun, vec.scale(perp, k * h * 0.06));
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x + sunDir.x * w * 2, s.y + sunDir.y * w * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;

        if (!plane) {
            const shadowLen = L.elev < 0.5 ? w : Math.min(w, personH / Math.tan(e));
            ctx.fillStyle = 'rgba(0,30,10,0.35)';
            ctx.fillRect(eye.x, ground - 2, shadowLen, 5);
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.5;
        const antiLen = L.elev < 0.5 ? w : Math.min(w * 2, (ground - eye.y) / Math.sin(e));
        const head = { x: eye.x + sunDir.x * antiLen, y: eye.y + sunDir.y * antiLen };
        ctx.beginPath();
        ctx.moveTo(eye.x, eye.y);
        ctx.lineTo(head.x, head.y);
        ctx.stroke();
        ctx.setLineDash([]);
        if (head.x < w - 10) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(head.x, head.y, 4, 0, TAU);
            ctx.fill();
            label(ctx, t(plane ? 'ch5.planeShadow' : 'ch5.shadow'), clamp(head.x, 60, w - 60), ground + (h - ground) / 2 + (plane ? 0 : fs * 0.4), { size: fs - 2 });
        }

        // Light leaving the drops towards you: 42° (main bow) and 51° (second bow) from the shadow line.
        // On the ground only the upper side has rain in the sky; from a plane both sides do.
        const sidesOf = plane ? [-1, 1] : [-1];
        const rays = [{ k: 1, line: lerp(0.08, 0.22, P.a1 / 0.9), dot: P.a1 / 0.9 }, { k: 2, line: 0.16 * P.a2 / 0.55, dot: P.a2 / 0.55 }];
        ctx.globalCompositeOperation = 'lighter';
        rays.forEach((ray) => {
            if (ray.line < 0.01 && ray.dot < 0.01) return;
            sidesOf.forEach((sgn) => {
                for (let nm = 400; nm <= 700; nm += 20) {
                    const rgb = wavelengthToRGB(nm);
                    const a = e + sgn * displayBowAngle(nm, ray.k) * DEG;
                    const d = { x: Math.cos(a), y: Math.sin(a) };
                    const len = d.y > 0 ? Math.min(w * 2, (ground - eye.y) / d.y) : w * 2;
                    ctx.strokeStyle = rgba(rgb, ray.line);
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(eye.x, eye.y);
                    ctx.lineTo(eye.x + d.x * len, eye.y + d.y * len);
                    ctx.stroke();
                    if (!hasRain || ray.dot < 0.02) continue;
                    ctx.fillStyle = rgba(rgb, 0.95 * Math.min(1, ray.dot));
                    for (let s = 0; s < len; s += 7) {
                        const x = eye.x + d.x * s, y = eye.y + d.y * s;
                        if (x > rain.x0 && x < rain.x1 && y > rain.y0 && y < ground) {
                            ctx.beginPath();
                            ctx.arc(x, y, 1.6, 0, TAU);
                            ctx.fill();
                        }
                    }
                }
            });
        });
        ctx.globalCompositeOperation = 'source-over';

        if (L.helpers) {
            const rad = Math.min(w, h) * 0.16;
            sidesOf.forEach((sgn) => {
                const aBow = e + sgn * rainbowAngleDeg(nWater(650), 1) * DEG;
                ctx.strokeStyle = '#ffd34d';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(eye.x, eye.y, rad, Math.min(aBow, e), Math.max(aBow, e));
                ctx.stroke();
                const mid = (aBow + e) / 2;
                label(ctx, '42°', eye.x + Math.cos(mid) * (rad + fs * 1.4), eye.y + Math.sin(mid) * (rad + fs * 1.4), { size: fs + 1, color: '#ffd34d' });
            });
        }

        drawSunDisk(ctx, sun.x, sun.y, h * 0.03, night, lerp(0.4, 1, L.clear / 100));
        label(ctx, t(night ? 'ch5.moonLabel' : 'ch5.sun'), sun.x, sun.y - h * 0.08, { size: fs });

        if (plane) {
            drawPlaneSide(ctx, eye.x, eye.y, Math.max(22, w * 0.09));
            label(ctx, t('ch5.youPlane'), eye.x, eye.y - Math.max(22, w * 0.09) * 0.75, { size: fs });
        } else {
            const bx = drawPersonSide(ctx, eye, ground, personH, rainOnRight ? 1 : -1, night);
            label(ctx, t('ch5.you'), bx, ground + fs * 1.3, { size: fs });
        }
    }, { animate: true });

    const render = () => {
        const moon = L.source === 'moon';
        const mm = dropSizeMm(L.sizeV);
        elevName.textContent = t(moon ? 'ch5.moonHeight' : 'ch5.sunHeight');
        dirName.textContent = t(moon ? 'ch5.moonDir' : 'ch5.sunDir');
        valueLabels.elev.textContent = `${L.elev}°`;
        valueLabels.dir.textContent = t(`ch5.dir.${directionKey(L.dir)}`);
        valueLabels.sizeV.textContent = `${formatMm(mm)} (${t(`ch5.drops.${dropKey(mm)}`)})`;
        ['clear', 'dark', 'rain'].forEach((key) => {
            valueLabels[key].textContent = tv(`ch5.levels.${key}`)[levelIndex(key, L[key])];
        });
        Object.entries(sliders).forEach(([key, el]) => { el.value = L[key]; });
        setSegment(whereRow, whereRow.querySelector(`[data-where="${L.where}"]`));
        setSegment(sourceRow, sourceRow.querySelector(`[data-source="${L.source}"]`));
        helpersBtn.classList.toggle('on', L.helpers);
        presetButtons.forEach(([key, b]) => {
            const p = presetState(key);
            b.classList.toggle('on', LAB_KEYS.every((k) => p[k] === L[k]));
        });
        explain.innerHTML = labExplanation().map((p) => `<p>${p}</p>`).join('');
        holdHeight(explain);
        sky.request();
        map.request();
        side.request();
        drop.request();
    };

    function labExplanation() {
        const P = bowLook(L);
        if (L.rain < RAIN_MIN) return [t('ch5.sit.noRain')];
        const parts = [];
        const ad = Math.abs(L.dir);
        const v = {
            dir: t(`ch5.dir.${directionKey(L.dir)}`),
            light: t(P.moon ? 'ch5.moonNoun' : 'ch5.sunNoun'),
            lightLow: t(P.moon ? 'ch5.moonNounLow' : 'ch5.sunNounLow'),
            e: L.elev,
            top: Math.round(PRIMARY_MAX - L.elev),
            size: formatMm(P.s)
        };
        const say = (key) => parts.push(t(`ch5.sit.${key}`, v));
        let bow = true;
        const second = P.a2 > 0.1;
        if (L.where === 'plane') {
            if (ad >= 95) {
                say('planeAway');
                bow = false;
            } else {
                say('plane');
                say(L.elev >= PRIMARY_MAX ? 'planeHigh' : 'planeLow');
            }
        } else {
            if (ad <= 20) say('behind');
            else if (ad < 95) parts.push(t('ch5.sit.side', { ...v, side: t(L.dir > 0 ? 'ch5.sit.sideLeft' : 'ch5.sit.sideRight') }));
            else { say('away'); bow = false; }
            if (bow) {
                if (L.elev > PRIMARY_MAX) {
                    say('tooHigh');
                    bow = false;
                    if (second && L.elev < SECOND_MAX) say('secondPeek');
                } else if (L.elev < 2) say('horizon');
                else say('height');
            }
        }
        if (bow) {
            if (P.red > 0.4) say('red');
            if (P.fog > 0.5) say('fog');
            else if (P.sup > 0.3 || P.s < 0.6) say('small');
            else say('big');
            if (L.clear < 35) say('hazy');
            if (!P.moon && L.dark < 35 && L.where === 'ground') say('brightBack');
            if (L.rain < 35) say('fewDrops');
            if (P.fog < 0.5) say(second ? 'second' : 'secondHidden');
            if (P.moon) say('moon');
        }
        if (L.where === 'plane' && ad < 95 && P.glory > 0.3) say('glory');
        return parts;
    }

    Object.entries(sliders).forEach(([key, el]) => {
        el.addEventListener('input', () => { L[key] = Number(el.value); render(); });
    });
    whereRow.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-where]');
        if (!btn) return;
        L.where = btn.dataset.where;
        render();
    });
    sourceRow.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-source]');
        if (!btn) return;
        L.source = btn.dataset.source;
        render();
    });
    helpersBtn.addEventListener('click', () => { L.helpers = !L.helpers; render(); });

    const presetButtons = Object.keys(LAB_PRESETS).map((key) => {
        const b = document.createElement('button');
        b.className = 'btn toggle small-btn';
        b.addEventListener('click', () => {
            Object.assign(L, presetState(key));
            render();
        });
        presetRow.appendChild(b);
        return [key, b];
    });

    attachDrag(map, {
        down: (p) => { setDirFrom(p); return true; },
        move: setDirFrom
    });
    function setDirFrom(p) {
        const { c } = mapGeo(map.w, map.h);
        const screenAngle = Math.atan2(p.y - c.y, p.x - c.x) / DEG;
        L.dir = Math.round(wrap180(90 - screenAngle));
        render();
    }

    attachDrag(side, {
        down: (p) => { setElevFrom(p); return true; },
        move: setElevFrom
    });
    function setElevFrom(p) {
        const { eye } = sideGeo(side.w, side.h);
        const dx = Math.max(4, eye.x - p.x);
        L.elev = Math.round(clamp(Math.atan2(eye.y - p.y, dx) / DEG, 0, 60));
        render();
    }

    onLang(() => {
        presetButtons.forEach(([key, b]) => { b.textContent = t(`ch5.preset.${key}`); });
        render();
    });
}

// ---------- 6. Spectrum ----------

const LOG_MAX = 8;
const LOG_MIN = -15;
const LOG_VIS_MIN = Math.log10(3.8e-7);
const LOG_VIS_MAX = Math.log10(7.5e-7);

const REGIONS = [
    { id: 'radio', from: 0, to: LOG_MAX, color: '#e0559a', send: '🗼', catch: '📻' },
    { id: 'micro', from: -3, to: 0, color: '#f0803c', send: '📶', catch: '📱' },
    { id: 'ir', from: LOG_VIS_MAX, to: -3, color: '#c0392b', send: '🎛️', catch: '📺' },
    { id: 'visible', from: LOG_VIS_MIN, to: LOG_VIS_MAX, color: null, send: '☀️', catch: '👁️' },
    { id: 'uv', from: -8, to: LOG_VIS_MIN, color: '#8e44ff', send: '☀️', catch: '🧴' },
    { id: 'xray', from: -11, to: -8, color: '#3fa9e0', send: '⚡', catch: '🩻' },
    { id: 'gamma', from: LOG_MIN, to: -11, color: '#2ecf8f', send: '☢️', catch: '📟' }
];

const DEVICES = [
    { id: 'schumann', log: 7.58, icon: '🌩️' },
    { id: 'submarine', log: 6.6, icon: '🚢' },
    { id: 'clock', log: 3.59, icon: '⏰' },
    { id: 'am', log: 2.5, icon: '📻' },
    { id: 'fm', log: 0.4, icon: '🎶' },
    { id: 'tv', log: -0.25, icon: '📺' },
    { id: 'phone', log: -0.6, icon: '📱' },
    { id: 'oven', log: -0.91, icon: '🍿' },
    { id: 'wifi', log: -1.2, icon: '📶' },
    { id: 'satellite', log: -1.6, icon: '🛰️' },
    { id: 'radar', log: -2.4, icon: '🚗' },
    { id: 'body', log: -5, icon: '🧍' },
    { id: 'remote', log: -6.03, icon: '🎛️' },
    { id: 'eye', log: -6.26, icon: '👁️' },
    { id: 'bee', log: -6.45, icon: '🐝' },
    { id: 'sunburn', log: -6.52, icon: '🧴' },
    { id: 'germ', log: -6.6, icon: '💡' },
    { id: 'dentist', log: -10.5, icon: '🦷' },
    { id: 'atom', log: -11.9, icon: '☢️' },
    { id: 'hospital', log: -12.7, icon: '🏥' },
    { id: 'star', log: -14.5, icon: '💥' }
];

function formatLength(m) {
    const units = [[1e3, 'km'], [1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm'], [1e-15, 'fm']];
    const [factor, unit] = units.find(([f]) => m >= f * 0.999) || units[units.length - 1];
    const v = m / factor;
    return `${v.toLocaleString(LOCALES[lang], { maximumSignificantDigits: v < 10 ? 2 : 3 })} ${unit}`;
}

// Big counts in words: "545 trillion".
function formatCount(n) {
    const words = tv('ch6.freqWords');
    if (n < 1000) return n.toLocaleString(LOCALES[lang], { maximumSignificantDigits: 2 });
    const idx = Math.min(words.length - 1, Math.floor(Math.log10(n) / 3));
    const v = n / Math.pow(1000, idx);
    return `${v.toLocaleString(LOCALES[lang], { maximumSignificantDigits: 3 })} ${words[idx]}`;
}

function initSpectrum() {
    const bar = document.getElementById('spectrum-bar');
    const iconsBox = document.getElementById('spectrum-icons');
    const slider = document.getElementById('spectrum-slider');
    const textStack = document.getElementById('spectrum-text');
    const wlEl = document.getElementById('spec-wl');
    const freqEl = document.getElementById('spec-freq');
    const sizeEl = document.getElementById('spec-size');
    const energyEl = document.getElementById('spec-energy');
    const antennaEl = document.getElementById('spec-antenna');
    const span = LOG_MAX - LOG_MIN;
    const state = { log: Math.log10(5.5e-7) };

    const toSlider = (log) => Math.round((LOG_MAX - log) / span * 1000);
    const toPercent = (log) => (LOG_MAX - log) / span * 100;
    const regionFor = (log) => REGIONS.find((r) => log >= r.from && log <= r.to) || REGIONS[REGIONS.length - 1];

    const marker = document.createElement('div');
    marker.className = 'spectrum-marker';

    const segs = REGIONS.map((r) => {
        const seg = document.createElement('button');
        seg.className = 'spectrum-seg' + (r.id === 'visible' ? ' visible-seg' : '');
        seg.style.flex = `${r.to - r.from} 0 0`;
        if (r.color) seg.style.background = r.color;
        seg.addEventListener('click', () => jump((r.from + r.to) / 2));
        bar.appendChild(seg);

        const panel = document.createElement('div');
        panel.className = 'region';
        panel.dataset.region = r.id;
        textStack.appendChild(panel);
        return seg;
    });
    bar.appendChild(marker);

    const iconEls = DEVICES.map((d) => {
        const b = document.createElement('button');
        b.className = 'spectrum-icon';
        b.textContent = d.icon;
        b.style.left = `${toPercent(d.log)}%`;
        b.addEventListener('click', () => jump(d.log));
        iconsBox.appendChild(b);
        return b;
    });

    // Hide icons that would overlap their left neighbour.
    new ResizeObserver(() => {
        const width = iconsBox.clientWidth;
        let lastX = -Infinity;
        iconEls.forEach((el, i) => {
            const x = toPercent(DEVICES[i].log) / 100 * width;
            const show = x - lastX >= 26;
            el.style.visibility = show ? 'visible' : 'hidden';
            if (show) lastX = x;
        });
    }).observe(iconsBox);

    function jump(log) {
        slider.value = toSlider(log);
        update();
    }

    const stage = new Stage(document.getElementById('spectrum-canvas'), (ctx, w, h, time) => {
        const region = regionFor(state.log);
        const meters = Math.pow(10, state.log);
        const color = region.id === 'visible' ? rgba(wavelengthToRGB(meters * 1e9)) : region.color;
        const fs = fontSize(w, 11, 15);
        const icon = Math.min(h * 0.38, w * 0.09);
        const x0 = icon * 1.4, x1 = w - icon * 1.4;
        const cycles = 0.8 * Math.pow(70, (LOG_MAX - state.log) / span);
        const lambdaPx = (x1 - x0) / cycles;
        const cy = h * 0.45;
        const amp = h * 0.24;
        const shift = (time * w * 0.08) % lambdaPx;

        ctx.fillStyle = '#060a1c';
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, 0, x1 - x0, h);
        ctx.clip();
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = color;
        ctx.lineWidth = lambdaPx < 8 ? 1.2 : 3;
        ctx.beginPath();
        const step = Math.max(0.5, Math.min(2, lambdaPx / 12));
        for (let x = x0; x <= x1; x += step) {
            const y = cy - amp * Math.sin(TAU * (x - x0 - shift) / lambdaPx);
            if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        emoji(ctx, region.send, icon * 0.7, cy, icon);
        emoji(ctx, region.catch, w - icon * 0.7, cy, icon);
        label(ctx, `${t('ch6.sentBy')}: ${t(`regions.${region.id}.sentBy`)}`, 8, h - fs, { size: fs - 1, align: 'left', weight: 600 });
        label(ctx, `${t('ch6.caughtBy')}: ${t(`regions.${region.id}.caughtBy`)}`, w - 8, h - fs, { size: fs - 1, align: 'right', weight: 600 });
    }, { animate: true });

    function renderPanels() {
        REGIONS.forEach((r, i) => {
            segs[i].innerHTML = `<span>${t(`regions.${r.id}.short`)}</span>`;
            segs[i].setAttribute('aria-label', t(`regions.${r.id}.name`));
            const devices = DEVICES.filter((d) => d.log >= r.from && d.log <= r.to)
                .map((d) => `<span class="device">${d.icon} ${t(`devices.${d.id}`)}</span>`).join('');
            textStack.children[i].innerHTML = `<div>
                <h3>${t(`regions.${r.id}.name`)}</h3>
                <p>${t(`regions.${r.id}.uses`)}</p>
                <h4>${t('ch6.usesTitle')}</h4>
                <div class="device-list">${devices}</div>
                <h4>${t('ch6.sendTitle')}</h4>
                <p>${t(`regions.${r.id}.how`)}</p>
                <p><b>${t('ch6.cellDanger')}</b> ${t(`regions.${r.id}.danger`)}</p>
                <p><b>${t('common.didYouKnow')}</b> ${t(`regions.${r.id}.fact`)}</p>
            </div>`;
        });
        iconEls.forEach((el, i) => {
            el.title = t(`devices.${DEVICES[i].id}`);
            el.setAttribute('aria-label', el.title);
        });
    }

    function update() {
        state.log = LOG_MAX - (Number(slider.value) / 1000) * span;
        const region = regionFor(state.log);
        const meters = Math.pow(10, state.log);
        showVariant(textStack, region.id, 'region');
        wlEl.textContent = formatLength(meters);
        freqEl.textContent = formatCount(SPEED_OF_LIGHT / meters);
        sizeEl.textContent = t(`sizes.${clamp(Math.round(state.log), LOG_MIN, LOG_MAX)}`);
        energyEl.style.width = `${Math.round(4 + 96 * (LOG_MAX - state.log) / span)}%`;
        antennaEl.innerHTML = state.log > -3.5 ? t('ch6.antenna', { len: formatLength(meters / 2) }) : '';
        marker.style.left = `${Number(slider.value) / 10}%`;
        holdHeight(antennaEl);
        stage.request();
    }

    slider.value = toSlider(state.log);
    slider.addEventListener('input', update);
    onLang(() => { renderPanels(); update(); });
}

// ---------- 7. Animal vision ----------

function dichromat(nm, neutral, redEnd) {
    const blue = [60, 110, 255], gray = [205, 205, 205], yellow = [245, 215, 70];
    const k = clamp((nm - (neutral - 18)) / 36, 0, 1);
    const rgb = k < 0.5 ? mixRGB(blue, gray, k * 2) : mixRGB(gray, yellow, (k - 0.5) * 2);
    let bright = 1;
    if (nm < 430) bright = 0.35 + 0.65 * (nm - 380) / 50;
    if (nm > 590) bright = Math.max(0.12, 1 - (nm - 590) / (redEnd - 590));
    return rgb.map((v) => Math.round(v * bright));
}

function boostSaturation(rgb, amount) {
    const l = (rgb[0] + rgb[1] + rgb[2]) / 3;
    return rgb.map((v) => Math.round(clamp(l + (v - l) * amount, 0, 255)));
}

const ANIMALS = [
    { id: 'human', icon: '🧒', see: (nm) => (nm < 385 || nm > 720 ? null : { rgb: wavelengthToRGB(nm) }) },
    {
        id: 'bee', icon: '🐝',
        see(nm) {
            if (nm < 300) return null;
            if (nm < 380) return { uv: true };
            if (nm < 560) return { rgb: wavelengthToRGB(nm) };
            const fade = clamp(1 - (nm - 560) / 90, 0.08, 1);
            return { rgb: wavelengthToRGB(nm).map((v) => Math.round(v * fade + 12 * (1 - fade))) };
        }
    },
    {
        id: 'bird', icon: '🐦',
        see(nm) {
            if (nm < 320 || nm > 720) return null;
            if (nm < 385) return { uv: true };
            return { rgb: boostSaturation(wavelengthToRGB(nm), 1.3) };
        }
    },
    { id: 'dog', icon: '🐕', see: (nm) => (nm < 400 || nm > 700 ? null : { rgb: dichromat(nm, 480, 690) }) },
    { id: 'colourblind', icon: '👦', see: (nm) => (nm < 385 || nm > 715 ? null : { rgb: dichromat(nm, 495, 740) }) },
    {
        id: 'snake', icon: '🐍',
        see(nm) {
            if (nm < 400) return null;
            if (nm > 720) return { ir: true };
            return { rgb: dichromat(nm, 485, 700) };
        }
    },
    {
        id: 'shrimp', icon: '🦐',
        see(nm) {
            if (nm < 300 || nm > 720) return null;
            if (nm < 380) return { uv: true };
            const steps = 12;
            const i = Math.min(steps - 1, Math.floor((nm - 380) / (340 / steps)));
            return { rgb: boostSaturation(wavelengthToRGB(380 + (i + 0.5) * 340 / steps), 1.2) };
        }
    }
];

function initAnimals() {
    const row = document.getElementById('animal-buttons');
    const info = document.getElementById('animal-info');
    const compareBtn = document.getElementById('animal-compare');
    const state = { animal: ANIMALS[1], compare: true };

    // Wavelength -> position across the band: UV inside violet, IR outside red.
    const radial = (nm) => {
        if (nm < 380) return 0.2 * (nm - 300) / 80;
        if (nm <= 720) return 0.2 + 0.6 * (nm - 380) / 340;
        return 0.8 + 0.2 * (nm - 720) / 280;
    };

    const stage = new Stage(document.getElementById('animal-canvas'), (ctx, w, h, time) => {
        const fs = fontSize(w, 12, 16);
        const cx = w / 2;
        const cy = h * 0.86;
        const R1 = Math.min(w * 0.46, cy - fs * 1.5);
        const R0 = R1 * 0.5;
        const rOf = (nm) => R0 + (R1 - R0) * radial(nm);
        const split = state.compare && state.animal.id !== 'human';

        const skyG = ctx.createLinearGradient(0, 0, 0, h);
        skyG.addColorStop(0, '#39425c');
        skyG.addColorStop(1, '#7d8ea8');
        ctx.fillStyle = skyG;
        ctx.fillRect(0, 0, w, h);

        const drawHalf = (animal, a0, a1) => {
            const step = 4;
            for (let nm = 300; nm < 1000; nm += step) {
                const seen = animal.see(nm + step / 2);
                if (!seen) continue;
                const r0 = rOf(nm), r1 = rOf(nm + step);
                let style;
                if (seen.uv) {
                    const hue = 280 + 30 * Math.sin(time * 2.5 + nm * 0.15);
                    style = `hsl(${hue},100%,${68 + 18 * Math.sin(time * 4 + nm * 0.4)}%)`;
                } else if (seen.ir) {
                    style = `hsla(12,95%,${30 + 12 * Math.sin(time * 3 + nm * 0.05)}%,0.55)`;
                } else {
                    style = rgba(seen.rgb);
                }
                ctx.strokeStyle = style;
                ctx.lineWidth = r1 - r0 + 0.8;
                ctx.beginPath();
                ctx.arc(cx, cy, (r0 + r1) / 2, a0, a1);
                ctx.stroke();
            }
            if (animal.see(340)?.uv) {
                const rnd = mulberry32(Math.floor(time * 6) + (a0 > 4 ? 99 : 0));
                ctx.fillStyle = '#fff';
                for (let i = 0; i < 10; i++) {
                    const a = a0 + rnd() * (a1 - a0);
                    const r = lerp(rOf(animal.see(310) ? 300 : 320), rOf(380), rnd());
                    ctx.beginPath();
                    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.5 + rnd() * 1.5, 0, TAU);
                    ctx.fill();
                }
            }
        };

        if (split) {
            drawHalf(ANIMALS[0], Math.PI, Math.PI * 1.5);
            drawHalf(state.animal, Math.PI * 1.5, TAU);
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy - R1 - 6);
            ctx.lineTo(cx, cy - R0 + 6);
            ctx.stroke();
            label(ctx, `${ANIMALS[0].icon} ${t('ch7.you')}`, cx - R1 * 0.75, fs * 1.5, { size: fs + 2 });
            label(ctx, `${state.animal.icon} ${t(`animals.${state.animal.id}.name`)}`, cx + R1 * 0.75, fs * 1.5, { size: fs + 2 });
        } else {
            drawHalf(state.animal, Math.PI, TAU);
        }

        ctx.fillStyle = '#2f6b3a';
        ctx.fillRect(0, cy, w, h - cy);
        emoji(ctx, state.animal.icon, cx, cy - R0 * 0.42, R0 * 0.55);
    }, { animate: true });

    const buttons = ANIMALS.map((animal) => {
        const btn = document.createElement('button');
        btn.className = 'btn toggle small-btn';
        btn.addEventListener('click', () => select(animal));
        row.appendChild(btn);

        const panel = document.createElement('div');
        panel.dataset.animal = animal.id;
        info.appendChild(panel);
        return btn;
    });

    function select(animal) {
        state.animal = animal;
        buttons.forEach((b, i) => b.classList.toggle('on', ANIMALS[i] === animal));
        showVariant(info, animal.id, 'animal');
        stage.request();
    }

    compareBtn.addEventListener('click', () => {
        state.compare = !state.compare;
        compareBtn.classList.toggle('on', state.compare);
    });

    onLang(() => {
        ANIMALS.forEach((animal, i) => {
            buttons[i].textContent = `${animal.icon} ${t(`animals.${animal.id}.name`)}`;
            info.children[i].innerHTML = `<h3>${t(`animals.${animal.id}.title`)}</h3><p>${t(`animals.${animal.id}.text`)}</p>`;
        });
        select(state.animal);
    });
}

// ---------- 8. Experiments ----------

function initExperiments() {
    const box = document.getElementById('experiments');
    onLang(() => {
        box.innerHTML = tv('experiments').map((ex) => `
            <article class="experiment">
                <div class="experiment-head"><div class="fact-icon">${icon(ex.icon)}</div><h3>${ex.title}</h3></div>
                <h4>${t('ch8.need')}</h4>
                <ul>${ex.need.map((n) => `<li>${n}</li>`).join('')}</ul>
                <h4>${t('ch8.how')}</h4>
                <ol>${ex.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
                <h4>${t('ch8.why')}</h4>
                <p class="why">${ex.why}</p>
            </article>`).join('');
    });
}

// ---------- 9. Quiz ----------

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
    for (let i = 0; i < 90; i++) {
        const el = document.createElement('div');
        el.className = 'confetti';
        el.style.left = `${Math.random() * 100}vw`;
        el.style.background = BANDS[i % BANDS.length].color;
        el.style.animationDuration = `${2 + Math.random() * 2.5}s`;
        el.style.animationDelay = `${Math.random() * 0.6}s`;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }
}

function initQuiz() {
    const box = document.getElementById('quiz-box');
    const count = I18N.en.quiz.length;
    const Q = { index: 0, score: 0, picked: null, orders: [], done: false };

    const reset = () => {
        Object.assign(Q, { index: 0, score: 0, picked: null, done: false, orders: Array.from({ length: count }, () => shuffledOrder(3)) });
        render();
    };

    function render() {
        if (Q.done) {
            const results = tv('ch9.results');
            const ratio = Q.score / count;
            const idx = ratio === 1 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;
            box.innerHTML = `<div class="result"><div class="score">${Q.score} / ${count}</div><p>${results[idx]}</p><button class="btn btn-big" id="quiz-restart">${t('ch9.retry')}</button></div>`;
            box.querySelector('#quiz-restart').addEventListener('click', reset);
            holdHeight(box);
            return;
        }
        const item = tv('quiz')[Q.index];
        const answered = Q.picked !== null;
        box.innerHTML = `
            <div class="q-progress">${t('ch9.progress', { i: Q.index + 1, n: count, s: Q.score })}</div>
            <h3>${item.q}</h3>
            <div class="answers"></div>
            <div class="explain ${answered ? '' : 'pending'}">${answered ? `<b>${t(Q.picked === 0 ? 'ch9.correct' : 'ch9.wrong')}</b> ${item.why}` : t('ch9.pick')}</div>
            <button class="btn btn-big quiz-next" ${answered ? '' : 'disabled'}>${t(Q.index + 1 < count ? 'ch9.next' : 'ch9.finish')}</button>`;
        const answers = box.querySelector('.answers');
        Q.orders[Q.index].forEach((ai) => {
            const btn = document.createElement('button');
            btn.className = 'btn answer';
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
        holdHeight(box);
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

    Q.orders = Array.from({ length: count }, () => shuffledOrder(3));
    onLang(render);
}

// ---------- Boot ----------

initLang();
initNav();
initWave();
initMix();
initNewton();
initBend();
initBands();
initLab();
initSpectrum();
initAnimals();
initExperiments();
initQuiz();
applyLang();
