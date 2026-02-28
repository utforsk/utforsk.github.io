import {
  CONFUSABLES,
  REVERSE_CONFUSABLES,
  getConfusableAsciiChars,
  getConfusablesForChar,
  toConfusable,
  toAscii,
  analyzeText,
} from './confusables.js';

const { createApp, ref, computed } = Vue;

createApp({
  setup() {
    const inputText = ref('');
    const similarity = ref(3);
    const intensity = ref(100);
    const copySuccess = ref(false);
    const showInfo = ref(false);
    const refFilter = ref('all');

    // Internal seed to force regeneration
    const seed = ref(0);

    // Analysis mode: 'confused' or 'inspect'
    const analyzeMode = ref('confused');

    // Examples
    const examples = {
      security: 'PayPal Login\nhttps://paypal.com/signin\nVerify your account now!',
      url: 'https://www.apple.com/icloud\nadmin@google.com\nMicrosoft Office 365',
      code: 'function hello() {\n  const password = "secret123";\n  return password;\n}',
    };

    // Live confused output
    const confusedText = computed(() => {
      void seed.value;
      if (!inputText.value) return '';
      return toConfusable(inputText.value, {
        intensity: intensity.value / 100,
        minSimilarity: similarity.value,
      });
    });

    // The text shown in the analysis section depends on mode
    const textToAnalyze = computed(() => {
      if (analyzeMode.value === 'inspect') {
        return inputText.value;
      }
      return confusedText.value;
    });

    // Mode switching - explicit, never auto-switches
    function setModeConfused() {
      analyzeMode.value = 'confused';
    }

    function setModeInspect() {
      analyzeMode.value = 'inspect';
    }

    // Regenerate with new random confusables
    function regenerate() {
      seed.value++;
    }

    // Paste example
    function pasteExample(type) {
      inputText.value = examples[type] || '';
    }

    // Clear input
    function clearInput() {
      inputText.value = '';
    }

    // Copy confused text to clipboard
    async function copyConfused() {
      if (!confusedText.value) return;
      try {
        await navigator.clipboard.writeText(confusedText.value);
        copySuccess.value = true;
        setTimeout(() => { copySuccess.value = false; }, 1500);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = confusedText.value;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copySuccess.value = true;
        setTimeout(() => { copySuccess.value = false; }, 1500);
      }
    }

    // Analyze characters of the target text
    const analyzedChars = computed(() => {
      const text = textToAnalyze.value;
      if (!text) return [];
      return analyzeText(text);
    });

    // Analysis statistics
    const analysisStats = computed(() => {
      const chars = analyzedChars.value;
      return {
        total: chars.length,
        ascii: chars.filter(c => c.isAscii).length,
        nonAscii: chars.filter(c => !c.isAscii && !c.isConfusable).length,
        confusable: chars.filter(c => c.isConfusable).length,
      };
    });

    // Decoded text (confusable back to ASCII)
    const decodedText = computed(() => {
      if (!textToAnalyze.value) return '';
      return toAscii(textToAnalyze.value);
    });

    // Similarity label
    const similarityLabel = computed(() => {
      const labels = {
        1: 'All variants',
        2: 'Somewhat similar+',
        3: 'Similar+',
        4: 'Very similar+',
        5: 'Nearly identical',
      };
      return labels[similarity.value] || '';
    });

    // Reference data
    const referenceData = computed(() => {
      return getConfusableAsciiChars();
    });

    // Unique ASCII chars present in the current input text (for "In text" tab)
    const charsInText = computed(() => {
      if (!inputText.value) return new Set();
      const chars = new Set();
      for (const ch of inputText.value) {
        const cp = ch.codePointAt(0);
        // ASCII char that has confusables
        if (CONFUSABLES[cp]) {
          chars.add(cp);
        }
        // Confusable char - add the ASCII it maps to
        if (REVERSE_CONFUSABLES[cp] !== undefined) {
          chars.add(REVERSE_CONFUSABLES[cp]);
        }
      }
      return chars;
    });

    // Filtered reference
    const filteredReference = computed(() => {
      return referenceData.value.filter(entry => {
        const cp = entry.codePoint;
        switch (refFilter.value) {
          case 'upper': return cp >= 0x41 && cp <= 0x5A;
          case 'lower': return cp >= 0x61 && cp <= 0x7A;
          case 'digits': return cp >= 0x30 && cp <= 0x39;
          case 'symbols': return !((cp >= 0x41 && cp <= 0x5A) || (cp >= 0x61 && cp <= 0x7A) || (cp >= 0x30 && cp <= 0x39));
          case 'intext': return charsInText.value.has(cp);
          default: return true;
        }
      });
    });

    // Get confusable characters for reference table
    function getConfusableChars(asciiCodePoint) {
      const entries = CONFUSABLES[asciiCodePoint];
      if (!entries) return [];
      return entries.map(([cp, score]) => ({
        char: String.fromCodePoint(cp),
        hex: cp.toString(16).toUpperCase().padStart(4, '0'),
        score,
      }));
    }

    return {
      inputText,
      similarity,
      intensity,
      copySuccess,
      showInfo,
      refFilter,
      analyzeMode,
      confusedText,
      textToAnalyze,
      similarityLabel,
      charsInText,
      regenerate,
      setModeConfused,
      setModeInspect,
      pasteExample,
      clearInput,
      copyConfused,
      analyzedChars,
      analysisStats,
      decodedText,
      filteredReference,
      getConfusableChars,
    };
  },
}).mount('#app');
