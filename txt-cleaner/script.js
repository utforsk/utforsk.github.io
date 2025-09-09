const { createApp } = Vue;
import { modules } from './modules/index.js';

const specialCharMap = {
    '—': { name: 'em-dash (U+2014)' },
    '\t': { name: 'tab (U+0009)', symbol: '→' },
    '\u00A0': { name: 'non-breaking space (U+00A0)', symbol: '·' }
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
            
            let result = escapedText;
            for (const char in specialCharMap) {
                const info = specialCharMap[char];
                const displayChar = info.symbol || char;
                const replacement = `<span class="special-char" title="${info.name}">${displayChar}</span>`;
                result = result.replace(new RegExp(char, 'g'), replacement);
            }
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
    }
}).mount('#app');