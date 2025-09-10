const { createApp } = Vue;
import { modules } from './modules/index.js';

const specialCharMap = {
    // Common special characters
    '—': { name: 'Em Dash (U+2014)' },
    '–': { name: 'En Dash (U+2013)' },
    '…': { name: 'Horizontal Ellipsis (U+2026)' },

    // Whitespace characters
    '\t': { name: 'Tab (U+0009)', symbol: '→' },
    '\u00A0': { name: 'Non-Breaking Space (U+00A0)', symbol: '·' },
    '\u2000': { name: 'En Quad (U+2000)', symbol: ' ' },
    '\u2001': { name: 'Em Quad (U+2001)', symbol: ' ' },
    '\u2002': { name: 'En Space (U+2002)', symbol: ' ' },
    '\u2003': { name: 'Em Space (U+2003)', symbol: ' ' },
    '\u2009': { name: 'Thin Space (U+2009)', symbol: ' ' },

    // Zero-width characters
    '\u200B': { name: 'Zero Width Space (U+200B)', symbol: '&#8203;' },
    '\u200C': { name: 'Zero Width Non-Joiner (U+200C)', symbol: '&#8204;' },
    '\u200D': { name: 'Zero Width Joiner (U+200D)', symbol: '&#8205;' },
    '\uFEFF': { name: 'Zero Width No-Break Space / BOM (U+FEFF)', symbol: '&#65279;' },
};

createApp({
    data() {
        return {
            modules: modules,
            inputText: '',
            enabledModules: [],
            moduleFilter: '',
            showSpecialChars: false,
            activeMobileOverlay: null, // 'modules', 'examples', or null
            copySuccess: false,
            tooltipModeActive: false,
            examples: [
                {
                    name: 'Trailing Spaces & Tabs',
                    text: 'Hello World  \nThis is a test.\t\t\nAnother line. \n'
                },
                {
                    name: 'Em-dashes',
                    text: 'This is a sentence—with an em-dash—that needs to be replaced.'
                },
                {
                    name: 'Mixed Example',
                    text: 'Here is a line with some trailing spaces.    \nAnd here is a line with an em—dash and a\tnon-breaking\u00A0space.'
                }
            ]
        };
    },
    computed: {
        outputText() {
            if (!this.inputText) return '';
            let cleanedText = this.inputText;
            this.enabledModules.forEach(moduleKey => {
                const module = this.modules[moduleKey];
                if (module && typeof module.function === 'function') {
                    cleanedText = module.function(cleanedText);
                }
            });
            return cleanedText;
        },
        filteredModules() {
            if (!this.moduleFilter) return this.modules;
            const filter = this.moduleFilter.toLowerCase();
            return Object.keys(this.modules)
                .filter(key => this.modules[key].name.toLowerCase().includes(filter))
                .reduce((obj, key) => { obj[key] = this.modules[key]; return obj; }, {});
        },
        visualInput() {
            return this.createVisualHtml(this.inputText);
        },
        visualOutput() {
            return this.createVisualHtml(this.outputText);
        }
    },
    methods: {
        createVisualHtml(text) {
            let escapedText = this.escapeHtml(text);
            if (!this.showSpecialChars) {
                return escapedText;
            }

            const dynamicCharMap = { ...specialCharMap };

            // Fallback for other non-printable/non-ASCII characters
            const regex = /[^ -~\n\r]/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const char = match[0];
                if (!dynamicCharMap[char]) {
                    const charCode = char.charCodeAt(0);
                    dynamicCharMap[char] = {
                        name: `Character (U+${charCode.toString(16).toUpperCase().padStart(4, '0')})`
                    };
                }
            }

            let result = escapedText;

            // Create a single regex for all replacements for efficiency
            const allChars = Object.keys(dynamicCharMap)
                .map(c => c.replace(/[.*+?^${}()|[\\]/g, '\\$&'))
                .join('|');
            
            if (!allChars) {
                return result;
            }
            
            const replaceRegex = new RegExp(allChars, 'g');

            result = result.replace(replaceRegex, (char) => {
                const info = dynamicCharMap[char];
                const displayChar = info.symbol || char;
                return `<span class="special-char" title="${info.name}">${displayChar}</span>`;
            });

            return result;
        },
        copyOutput() {
            if (this.outputText) {
                navigator.clipboard.writeText(this.outputText).then(() => {
                    this.copySuccess = true;
                    setTimeout(() => { this.copySuccess = false; }, 1500);
                });
            }
        },
        pasteExample(text) {
            this.inputText = text;
        },
        toggleSpecialChars() {
            this.showSpecialChars = !this.showSpecialChars;
        },
        toggleMobileOverlay(overlay) {
            if (this.activeMobileOverlay === overlay) {
                this.activeMobileOverlay = null;
            } else {
                this.activeMobileOverlay = overlay;
            }
        },
        syncScroll(event) {
            const textarea = event.target;
            const backdrop = textarea.nextElementSibling;
            backdrop.scrollTop = textarea.scrollTop;
            backdrop.scrollLeft = textarea.scrollLeft;
        },
        escapeHtml(text) {
            if (!text) return '';
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },
        handleMouseOver(e) {
            if (e.target.classList.contains('special-char')) {
                const tooltip = document.getElementById('tooltip');
                tooltip.textContent = e.target.getAttribute('title');
                tooltip.style.display = 'block';
                this.updateTooltipPosition(e);
            }
        },
        handleMouseOut(e) {
            if (e.target.classList.contains('special-char')) {
                const tooltip = document.getElementById('tooltip');
                tooltip.style.display = 'none';
            }
        },
        handleMouseMove(e) {
            const tooltip = document.getElementById('tooltip');
            if (tooltip.style.display === 'block') {
                this.updateTooltipPosition(e);
            }
        },
        updateTooltipPosition(e) {
            const tooltip = document.getElementById('tooltip');
            this.$nextTick(() => {
                const tooltipRect = tooltip.getBoundingClientRect();
                let x = e.clientX + 15;
                let y = e.clientY + 15;

                if (x + tooltipRect.width > window.innerWidth) {
                    x = e.clientX - tooltipRect.width - 15;
                }
                if (y + tooltipRect.height > window.innerHeight) {
                    y = e.clientY - tooltipRect.height - 15;
                }

                tooltip.style.left = `${x}px`;
                tooltip.style.top = `${y}px`;
            });
        },
        handleKeyDown(e) {
            if (e.key === 'Control') {
                e.preventDefault();
                this.tooltipModeActive = true;
            }
        },
        handleKeyUp(e) {
            if (e.key === 'Control') {
                this.tooltipModeActive = false;
            }
        }
    },
    mounted() {
        this.enabledModules = Object.keys(this.modules);
        const splitter = document.getElementById('splitter');
        if (!splitter) return;

        const firstPanel = splitter.previousElementSibling;
        const secondPanel = splitter.nextElementSibling;
        const container = splitter.parentElement;

        firstPanel.style.width = '50%';
        secondPanel.style.width = '50%';

        let isDragging = false;

        const onDrag = (e) => {
            if (!isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const bounds = container.getBoundingClientRect();
            if (window.innerWidth <= 768) {
                const percentage = ((clientY - bounds.top) / bounds.height) * 100;
                if (percentage > 10 && percentage < 90) {
                    firstPanel.style.height = percentage + '%';
                    secondPanel.style.height = (100 - percentage) + '%';
                }
            } else {
                const percentage = ((clientX - bounds.left) / bounds.width) * 100;
                if (percentage > 10 && percentage < 90) {
                    firstPanel.style.width = percentage + '%';
                    secondPanel.style.width = (100 - percentage) + '%';
                }
            }
        };

        const stopDrag = () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = 'default';
                document.removeEventListener('mousemove', onDrag);
                document.removeEventListener('mouseup', stopDrag);
                document.removeEventListener('touchmove', onDrag);
                document.removeEventListener('touchend', stopDrag);
            }
        };

        const startDrag = (e) => {
            e.preventDefault();
            isDragging = true;
            document.body.style.cursor = window.innerWidth <= 768 ? 'row-resize' : 'col-resize';
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('touchend', stopDrag);
        };

        splitter.addEventListener('mousedown', startDrag);
        splitter.addEventListener('touchstart', startDrag, { passive: false });

        // Tooltip event listeners
        const mainContainer = document.querySelector('.container');
        mainContainer.addEventListener('mouseover', this.handleMouseOver);
        mainContainer.addEventListener('mouseout', this.handleMouseOut);
        mainContainer.addEventListener('mousemove', this.handleMouseMove);

        // Tooltip mode listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}).mount('#app');