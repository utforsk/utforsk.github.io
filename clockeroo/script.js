const { createApp, ref, computed, reactive, onMounted, onBeforeUnmount, watch, nextTick } = Vue;

// Constants for positioning and timing
const CLOCK_CONSTANTS = {
  HOUR_RADIUS_FACTOR: 0.75,
  MINUTE_RADIUS_FACTOR: 1.05,
  HOUR_HAND_VALUE_RADIUS: 0.16,
  MINUTE_HAND_VALUE_RADIUS: 0.24,
  SECOND_HAND_VALUE_RADIUS: 0.32,
  TICK_HEIGHT_FACTOR: 0.95,
  HOURS_PER_DAY: 24,
  MINUTES_PER_HOUR: 60,
  SECONDS_PER_MINUTE: 60,
  DEGREES_PER_HOUR: 30,
  DEGREES_PER_MINUTE: 6,
  HOUR_ANGLE_PER_MINUTE: 0.5,
  HOUR_ANGLE_PER_SECOND: 0.0083,
  MINUTE_ANGLE_PER_SECOND: 0.1
};

// Game Level Configurations - 10 levels total, split across difficulties
const GAME_LEVELS = [
  // Level 1-2: Super beginner (easier than before)
  {
    level: 1,
    basePoints: 1,
    visibility: {
      hourNumbers: true,
      minuteNumbers: false,
      hourTicks: true,
      minuteTicks: false,
      second: false,
      handValues: true
    },
    timeTypes: ['basic']
  },
  {
    level: 2,
    basePoints: 1,
    visibility: {
      hourNumbers: true,
      minuteNumbers: false,
      hourTicks: true,
      minuteTicks: false,
      second: false,
      handValues: false
    },
    timeTypes: ['whole'] // 1:00, 2:00, etc.
  },
  // Level 3-4: Basic progression
  {
    level: 3,
    basePoints: 2,
    visibility: {
      hourNumbers: true,
      minuteNumbers: false,
      hourTicks: true,
      minuteTicks: false,
      second: false,
      handValues: false
    },
    timeTypes: ['whole', 'half'] // + 1:30, 2:30, etc.
  },
  {
    level: 4,
    basePoints: 2,
    visibility: {
      hourNumbers: true,
      minuteNumbers: true,
      hourTicks: true,
      minuteTicks: false,
      second: false,
      handValues: false
    },
    timeTypes: ['whole', 'half', 'quarter'] // + :15, :45
  },
  // Level 5-6: Intermediate
  {
    level: 5,
    basePoints: 3,
    visibility: {
      hourNumbers: true,
      minuteNumbers: true,
      hourTicks: true,
      minuteTicks: true,
      second: false,
      handValues: false
    },
    timeTypes: ['whole', 'half', 'quarter', 'fivemin'] // + :05, :10, :25, etc.
  },
  {
    level: 6,
    basePoints: 3,
    visibility: {
      hourNumbers: false,
      minuteNumbers: true,
      hourTicks: true,
      minuteTicks: true,
      second: true,
      handValues: false
    },
    timeTypes: ['whole', 'half', 'quarter', 'fivemin', 'tenmin'] // + :10, :20, :50, etc.
  },
  // Level 7-8: Advanced
  {
    level: 7,
    basePoints: 4,
    visibility: {
      hourNumbers: false,
      minuteNumbers: true,
      hourTicks: false,
      minuteTicks: true,
      second: true,
      handValues: false
    },
    timeTypes: ['whole', 'half', 'quarter', 'fivemin', 'tenmin', 'any'] // Any minute
  },
  {
    level: 8,
    basePoints: 4,
    visibility: {
      hourNumbers: false,
      minuteNumbers: false,
      hourTicks: true,
      minuteTicks: true,
      second: true,
      handValues: false
    },
    timeTypes: ['whole', 'half', 'quarter', 'fivemin', 'tenmin', 'any']
  },
  // Level 9-10: Expert
  {
    level: 9,
    basePoints: 5,
    visibility: {
      hourNumbers: false,
      minuteNumbers: false,
      hourTicks: true,
      minuteTicks: false,
      second: true,
      handValues: false
    },
    timeTypes: ['whole', 'half', 'quarter', 'fivemin', 'tenmin', 'any']
  },
  {
    level: 10,
    basePoints: 5,
    visibility: {
      hourNumbers: false,
      minuteNumbers: false,
      hourTicks: false,
      minuteTicks: false,
      second: true,
      handValues: false
    },
    timeTypes: ['whole', 'half', 'quarter', 'fivemin', 'tenmin', 'any']
  }
];

// Game Difficulty Configurations - now with 10 levels split into 3 difficulties
const GAME_DIFFICULTIES = {
  easy: {
    icon: '🟢',
    maxScore: 60,
    minLevel: 1,
    maxLevel: 4,
    pointMultiplier: 1,
    showTextTime: false,
    answerFormat: 'digital',
    hintsAllowed: 3
  },
  medium: {
    icon: '🟡', 
    maxScore: 80,
    minLevel: 3,
    maxLevel: 7,
    pointMultiplier: 2,
    showTextTime: false,
    answerFormat: 'mixed',
    hintsAllowed: 2
  },
  hard: {
    icon: '🔴',
    maxScore: 100,
    minLevel: 6,
    maxLevel: 10,
    pointMultiplier: 3,
    showTextTime: false,
    answerFormat: 'text',
    hintsAllowed: 1
  }
};

// Time period configurations - periods automatically go until next startHour
// Supports both emoji and SVG. Use 'emoji' property for simple emojis, 'svg' property for custom SVG.
// To add custom SVG icons for specific times:
// 1. Add a new time period object with startHour and either 'emoji' or 'svg' property
// 2. For SVG: Use viewBox="0 0 100 100" for consistent scaling
// 3. For unique gradients: Use unique IDs like "gradientName_${type}" to avoid conflicts
// 4. Add corresponding CSS class `.period-${type}` in styles.css if custom styling needed
// Example: { startHour: 12, type: 'noon', emoji: '🌞' }
// Example: { startHour: 18, type: 'sunset', svg: '<svg viewBox="0 0 100 100">...</svg>' }
const TIME_PERIODS = [
  { startHour: 7, emoji: '☀️' },   // morning - using emoji (simple)
  { startHour: 0, emoji: '🌙' }   // night - using emoji (simple)

  // SVG examples (commented out, can be uncommented to use):
  /*
  {
    startHour: 7,
    type: 'sun',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="70%" style="stop-color:#FFA500;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#FF8C00;stop-opacity:0.3" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#sunGradient)" />
      <g stroke="#FFD700" stroke-width="2" opacity="0.6">
        <line x1="50" y1="5" x2="50" y2="15" />
        <line x1="50" y1="85" x2="50" y2="95" />
        <line x1="5" y1="50" x2="15" y2="50" />
        <line x1="85" y1="50" x2="95" y2="50" />
        <line x1="21.5" y1="21.5" x2="28.5" y2="28.5" />
        <line x1="71.5" y1="71.5" x2="78.5" y2="78.5" />
        <line x1="78.5" y1="21.5" x2="71.5" y2="28.5" />
        <line x1="28.5" y1="71.5" x2="21.5" y2="78.5" />
      </g>
    </svg>`
  },
  {
    startHour: 0,
    type: 'moon',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moonGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:#F0F8FF;stop-opacity:1" />
          <stop offset="60%" style="stop-color:#E6E6FA;stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:#9370DB;stop-opacity:0.2" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#moonGradient)" />
      <circle cx="35" cy="35" r="3" fill="#D3D3D3" opacity="0.7" />
      <circle cx="60" cy="25" r="2" fill="#D3D3D3" opacity="0.6" />
      <circle cx="65" cy="45" r="2.5" fill="#D3D3D3" opacity="0.5" />
      <circle cx="40" cy="60" r="1.5" fill="#D3D3D3" opacity="0.6" />
    </svg>`
  }
  */
];

// Error handling utility
const withErrorHandling = (fn, defaultValue = null, errorMessage = 'Operation failed') => {
  try {
    return fn();
  } catch (error) {
    console.warn(`${errorMessage}:`, error);
    return defaultValue;
  }
};

// Vue Composables for better code organization

// Time state management composable
const useTimeState = () => {
  const currentHour = ref(12);
  const currentMinute = ref(0);
  const currentSecond = ref(0);

  const displayHourAngle = ref(0);
  const displayMinuteAngle = ref(0);
  const displaySecondAngle = ref(0);

  return {
    currentHour,
    currentMinute,
    currentSecond,
    displayHourAngle,
    displayMinuteAngle,
    displaySecondAngle
  };
};

// Live time management composable
const useLiveTime = () => {
  const liveTimeEnabled = ref(false);
  let liveTimeInterval = null;

  const enableLiveTime = (updateFunction) => {
    liveTimeEnabled.value = true;
    updateLiveTime(updateFunction);
    liveTimeInterval = setInterval(() => updateLiveTime(updateFunction), 1000);
  };

  const disableLiveTime = () => {
    liveTimeEnabled.value = false;
    if (liveTimeInterval) {
      clearInterval(liveTimeInterval);
      liveTimeInterval = null;
    }
  };

  const updateLiveTime = (updateFunction) => {
    const now = new Date();
    updateFunction(now.getHours(), now.getMinutes(), now.getSeconds());
  };

  const toggleLiveTime = (updateFunction) => {
    if (liveTimeEnabled.value) {
      disableLiveTime();
    } else {
      enableLiveTime(updateFunction);
    }
  };

  // Cleanup on unmount
  onBeforeUnmount(() => {
    disableLiveTime();
  });

  return {
    liveTimeEnabled,
    enableLiveTime,
    disableLiveTime,
    toggleLiveTime
  };
};

const clockerooApp = {
  setup() {
    // Use composables for better organization
    const timeState = useTimeState();
    const { currentHour, currentMinute, currentSecond, displayHourAngle, displayMinuteAngle, displaySecondAngle } = timeState;
    const liveTime = useLiveTime();
    const { liveTimeEnabled, enableLiveTime, disableLiveTime, toggleLiveTime } = liveTime;

    // Other reactive state

    const hourVisible = ref(true);
    const minuteVisible = ref(true);
    const secondVisible = ref(true);
    const handValuesVisible = ref(false);
    const hourTicksVisible = ref(true);
    const minuteTicksVisible = ref(true);
    const digitalTimeVisible = ref(false);
    const timeDescriptionVisible = ref(false);
    const hourNumbersVisible = ref(true);
    const minuteNumbersVisible = ref(false);
    const timePeriodVisible = ref(true);

    const currentLanguage = ref('no');
    const currentUILanguage = ref('no');
    const currentTheme = ref('default');
    const activeTab = ref('time');
    const coverSize = ref(93);
    const showHelp = ref(false);
    const showLanguageMenu = ref(false);
    
    // Game state management
    const gameMode = ref(false);
    const gameDifficulty = ref(null); // 'easy', 'medium', 'hard'
    const gameLevel = ref(1);
    const gameScore = ref(0);
    const gameLives = ref(3);
    const gameQuestion = ref(null);
    const gameAnswers = ref([]);
    const gameHintsUsed = ref(0);
    const gameShowingHint = ref(false);
    const gameQuestionsLeft = ref(10); // Fixed number of questions per game
    const gameAnswerProcessing = ref(false); // Prevent multiple clicks
    const gameCorrectThisGame = ref(0); // Track correct answers this game
    const gameFeedbackMessage = ref('');
    const gameFeedbackType = ref('');
    const gameShowResults = ref(false);
    const gameResults = ref(null); // Store game results
    const showGameStats = ref(false); // Show statistics within game tab
    const showDeleteButtons = ref(false); // Show delete buttons on scores (for parents)
    const gameStats = ref({
      topScores: [], // Array of {score, date, difficulty}
      gamesPlayed: 0,
      totalCorrect: 0,
      lastPlayed: null
    });
    // Modern Vue reactive touch device detection
    const isTouchDevice = computed(() => {
      return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    });

    // Editing state for time inputs
    const editingField = ref(null); // 'hour', 'minute', 'second', or null
    const editingValue = ref('');

    // Reactive trigger for clock positioning updates
    const clockKey = ref(0);

    // Template refs
    const clock = ref(null);
    const innerCover = ref(null);
    const hourHand = ref(null);
    const minuteHand = ref(null);
    const secondHand = ref(null);

    let pressTimeout = null;
    let pressInterval = null;

    // Import language definitions from separate files
    const languages = reactive(timeLanguages);
    const uiLanguagesReactive = reactive(uiLanguages);

    // Time control configuration - eliminates template duplication
    const timeControls = [
      {
        field: 'hour',
        ref: currentHour,
        max: 23,
        adjust: null, // Will be set after adjustHour is defined
        label: () => ui.value.timeControls.hours
      },
      {
        field: 'minute',
        ref: currentMinute,
        max: 59,
        adjust: null, // Will be set after adjustMinute is defined
        label: () => ui.value.timeControls.minutes
      },
      {
        field: 'second',
        ref: currentSecond,
        max: 59,
        adjust: null, // Will be set after adjustSecond is defined
        label: () => ui.value.timeControls.seconds
      }
    ];

    // Computed properties
    const ui = computed(() => uiLanguagesReactive[currentUILanguage.value]);

    const digitalTimeFormatted = computed(() => {
      const lang = languages[currentLanguage.value];
      if (lang.use24Hour) {
        return `${String(currentHour.value).padStart(2, '0')}:${String(currentMinute.value).padStart(2, '0')}:${String(currentSecond.value).padStart(2, '0')}`;
      } else {
        const hour12 = currentHour.value === 0 ? 12 : currentHour.value > 12 ? currentHour.value - 12 : currentHour.value;
        const ampm = currentHour.value < 12 ? 'AM' : 'PM';
        return `${String(hour12).padStart(2, '0')}:${String(currentMinute.value).padStart(2, '0')}:${String(currentSecond.value).padStart(2, '0')} <span class="ampm">${ampm}</span>`;
      }
    });

    const timeDescriptionText = computed(() => {
      return generateTimeDescription(currentHour.value, currentMinute.value);
    });

    // Time period indicator - simple emoji based on hour
    const timePeriodIndicator = computed(() => {
      const hour = currentHour.value;

      // Find the active period based on current hour
      let activePeriod = TIME_PERIODS[TIME_PERIODS.length - 1]; // Default to last (night)

      for (let i = 0; i < TIME_PERIODS.length; i++) {
        const period = TIME_PERIODS[i];
        const nextPeriod = TIME_PERIODS[(i + 1) % TIME_PERIODS.length];

        // Calculate end hour (next period's start hour)
        let endHour = nextPeriod.startHour;

        // Check if current hour falls within this period
        if (period.startHour <= endHour) {
          // Normal range (e.g., 6-10, 10-18, 18-22)
          if (hour >= period.startHour && hour < endHour) {
            activePeriod = period;
            break;
          }
        } else {
          // Wrap-around range (e.g., 22-6 for night)
          if (hour >= period.startHour || hour < endHour) {
            activePeriod = period;
            break;
          }
        }
      }

      return {
        emoji: activePeriod.emoji,
        svg: activePeriod.svg,
        type: activePeriod.type || 'emoji'
      };
    });

    // Computed properties for clock elements (modern Vue approach)
    const hourNumbers = computed(() => {
      try {
        // Reactivity trigger - updates when clockKey changes
        clockKey.value;

        const numbers = [];

        // We need to calculate positions based on actual clock dimensions
        const clockElement = clock.value;
        if (!clockElement) return numbers;

        const clockRect = clockElement.getBoundingClientRect();
        const centerX = clockRect.width / 2;
        const centerY = clockRect.height / 2;
        const radius = Math.min(centerX, centerY) * CLOCK_CONSTANTS.HOUR_RADIUS_FACTOR;

        for (let i = 1; i <= 12; i++) {
          const angle = ((i * CLOCK_CONSTANTS.DEGREES_PER_HOUR) - 90) * (Math.PI / 180);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);

          numbers.push({
            value: i,
            id: `hour-${i}`,
            style: {
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)',
              display: hourNumbersVisible.value ? 'flex' : 'none'
            }
          });
        }
        return numbers;
      } catch (error) {
        console.warn('Error calculating hour numbers positions:', error);
        return [];
      }
    });

    const minuteNumbers = computed(() => {
      // Reactivity trigger - updates when clockKey changes
      clockKey.value;

      const numbers = [];

      // We need to calculate positions based on actual clock dimensions
      const clockElement = clock.value;
      if (!clockElement) return numbers;

      const clockRect = clockElement.getBoundingClientRect();
      const centerX = clockRect.width / 2;
      const centerY = clockRect.height / 2;
      const minuteRadius = Math.min(centerX, centerY) * CLOCK_CONSTANTS.MINUTE_RADIUS_FACTOR;

      // Add minute 0 at the top
      const angle0 = -90 * (Math.PI / 180);
      const x0 = centerX + minuteRadius * Math.cos(angle0);
      const y0 = centerY + minuteRadius * Math.sin(angle0);

      numbers.push({
        value: 0,
        id: 'minute-0',
        style: {
          left: `${x0}px`,
          top: `${y0}px`,
          transform: 'translate(-50%, -50%)',
          display: minuteNumbersVisible.value ? 'block' : 'none'
        }
      });

      // Add minute numbers 5, 10, 15, etc.
      for (let i = 5; i < 60; i += 5) {
        const angle = ((i * CLOCK_CONSTANTS.DEGREES_PER_MINUTE) - 90) * (Math.PI / 180);
        const x = centerX + minuteRadius * Math.cos(angle);
        const y = centerY + minuteRadius * Math.sin(angle);

        numbers.push({
          value: i,
          id: `minute-${i}`,
          style: {
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-50%, -50%)',
            display: minuteNumbersVisible.value ? 'block' : 'none'
          }
        });
      }
      return numbers;
    });

    // Computed properties for clock ticks (modern Vue approach)
    const hourTicks = computed(() => {
      // Reactivity trigger - updates when clockKey changes
      clockKey.value;

      const ticks = [];

      const clockElement = clock.value;
      if (!clockElement) return ticks;

      const clockRect = clockElement.getBoundingClientRect();
      const radius = Math.min(clockRect.width, clockRect.height) / 2;
      const tickHeight = radius * CLOCK_CONSTANTS.TICK_HEIGHT_FACTOR;

      // Create 12 hour ticks (i = 0 to 11)
      for (let i = 0; i < 12; i++) {
        ticks.push({
          id: `hour-tick-${i}`,
          style: {
            height: `${tickHeight}px`,
            marginLeft: '-2px', // Center the 4px width
            transform: `rotate(${i * CLOCK_CONSTANTS.DEGREES_PER_HOUR}deg)`,
            display: hourTicksVisible.value ? 'block' : 'none'
          }
        });
      }
      return ticks;
    });

    const minuteTicks = computed(() => {
      // Reactivity trigger - updates when clockKey changes
      clockKey.value;

      const ticks = [];

      const clockElement = clock.value;
      if (!clockElement) return ticks;

      const clockRect = clockElement.getBoundingClientRect();
      const radius = Math.min(clockRect.width, clockRect.height) / 2;
      const tickHeight = radius * CLOCK_CONSTANTS.TICK_HEIGHT_FACTOR;

      // Create 60 minute ticks (i = 0 to 59)
      for (let i = 0; i < 60; i++) {
        let display = 'none';

        // Hide minute ticks that overlap with hour ticks when hour ticks are visible
        if (i % 5 === 0 && hourTicksVisible.value) {
          display = 'none';
        } else {
          display = minuteTicksVisible.value ? 'block' : 'none';
        }

        ticks.push({
          id: `minute-tick-${i}`,
          style: {
            height: `${tickHeight}px`,
            marginLeft: '-1px', // Center the 2px width
            transform: `rotate(${i * CLOCK_CONSTANTS.DEGREES_PER_MINUTE}deg)`,
            display: display
          }
        });
      }
      return ticks;
    });

    // Computed property for hand values positioning (modern Vue approach)
    const handValuesPositioned = computed(() => {
      // Reactivity trigger - updates when clockKey or angles change
      clockKey.value;
      const hourAngle = displayHourAngle.value;
      const minuteAngle = displayMinuteAngle.value;
      const secondAngle = displaySecondAngle.value;

      const clockElement = clock.value;
      if (!clockElement) {
        return {
          hour: { left: '0px', top: '0px' },
          minute: { left: '0px', top: '0px' },
          second: { left: '0px', top: '0px' }
        };
      }

      const clockRect = clockElement.getBoundingClientRect();
      const centerX = clockRect.width / 2;
      const centerY = clockRect.height / 2;

      // Calculate positions on hands with different distances to avoid overlap
      // Hour hand closest to center, second hand furthest out (exact same as original)
      const hourRadius = Math.min(centerX, centerY) * CLOCK_CONSTANTS.HOUR_HAND_VALUE_RADIUS;
      const minuteRadius = Math.min(centerX, centerY) * CLOCK_CONSTANTS.MINUTE_HAND_VALUE_RADIUS;
      const secondRadius = Math.min(centerX, centerY) * CLOCK_CONSTANTS.SECOND_HAND_VALUE_RADIUS;

      const hourAngleRad = (hourAngle - 90) * (Math.PI / 180);
      const minuteAngleRad = (minuteAngle - 90) * (Math.PI / 180);
      const secondAngleRad = (secondAngle - 90) * (Math.PI / 180);

      const hourX = centerX + hourRadius * Math.cos(hourAngleRad);
      const hourY = centerY + hourRadius * Math.sin(hourAngleRad);
      const minuteX = centerX + minuteRadius * Math.cos(minuteAngleRad);
      const minuteY = centerY + minuteRadius * Math.sin(minuteAngleRad);
      const secondX = centerX + secondRadius * Math.cos(secondAngleRad);
      const secondY = centerY + secondRadius * Math.sin(secondAngleRad);

      return {
        hour: { left: `${hourX}px`, top: `${hourY}px` },
        minute: { left: `${minuteX}px`, top: `${minuteY}px` },
        second: { left: `${secondX}px`, top: `${secondY}px` }
      };
    });

    // Computed properties for formatted dates
    const formattedLastPlayed = computed(() => {
      if (!gameStats.value.lastPlayed) {
        return ui.value.game.dateFormats.never;
      }
      return formatFriendlyDate(gameStats.value.lastPlayed);
    });

    const formattedTopScores = computed(() => {
      return gameStats.value.topScores.map(score => ({
        ...score,
        friendlyDate: formatFriendlyDate(score.date),
        detailedDate: getDetailedDate(score.date)
      }));
    });


    // Methods
    function getShortestRotation(current, target) {
      let diff = target - current;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      return current + diff;
    }

    function updateClock() {
      // Calculate angles
      const targetHourAngle = ((currentHour.value % 12) * CLOCK_CONSTANTS.DEGREES_PER_HOUR) + (currentMinute.value * CLOCK_CONSTANTS.HOUR_ANGLE_PER_MINUTE) + (currentSecond.value * CLOCK_CONSTANTS.HOUR_ANGLE_PER_SECOND);
      const targetMinuteAngle = (currentMinute.value * CLOCK_CONSTANTS.DEGREES_PER_MINUTE) + (currentSecond.value * CLOCK_CONSTANTS.MINUTE_ANGLE_PER_SECOND);
      const targetSecondAngle = currentSecond.value * CLOCK_CONSTANTS.DEGREES_PER_MINUTE;

      // Use shortest rotation path
      displayHourAngle.value = getShortestRotation(displayHourAngle.value, targetHourAngle);
      displayMinuteAngle.value = getShortestRotation(displayMinuteAngle.value, targetMinuteAngle);
      displaySecondAngle.value = getShortestRotation(displaySecondAngle.value, targetSecondAngle);

    }

    // Generic time description generator
    function generateTimeDescription(hour, minute) {
      const lang = languages[currentLanguage.value];
      if (!lang) return 'Time description';

      // Use the appropriate generator based on language
      const generators = {
        'no': (hour, minute) => generateTimeString(hour, minute, 'no'),
        'en-gb': (hour, minute) => generateTimeString(hour, minute, 'en-gb'),
        'en-us': (hour, minute) => generateTimeString(hour, minute, 'en-us'),
        'ja': (hour, minute) => generateTimeString(hour, minute, 'ja')
      };

      const generator = generators[currentLanguage.value];
      return generator ? generator(hour, minute) : 'Time description';
    }

    function generateTimeString(hour, minute, languageCode) {
      const lang = timeLanguages[languageCode];
      const roundedMinute = Math.round(minute / 5) * 5;

      if (roundedMinute === 0 || roundedMinute === 60) {
        const displayHour = roundedMinute === 60 ? (hour + 1) % 24 : hour % 24;
        return formatHourExpression(displayHour, lang.minuteWords[roundedMinute === 60 ? 0 : roundedMinute], lang);
      }

      const minuteWord = lang.minuteWords[roundedMinute];
      if (!minuteWord) {
        return formatHourExpression(hour % 24, lang.minuteWords[0], lang);
      }

      let targetHour = hour % 24;

      if (lang.useNextHourForMinutes && lang.useNextHourForMinutes.includes(roundedMinute)) {
        targetHour = (hour + 1) % 24;
      }

      if (roundedMinute === 0) {
        return formatHourExpression(targetHour, minuteWord, lang);
      }

      return formatTimeExpression(minuteWord, targetHour, lang);
    }

    function formatHourExpression(hour, minuteWord, lang) {
      if (lang.use24Hour) {
        return minuteWord ? `${lang.numbers[hour]} ${minuteWord}` : lang.numbers[hour];
      } else {
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        return minuteWord ? `${lang.numbers[hour12]} ${minuteWord} ${ampm}` : `${lang.numbers[hour12]} ${ampm}`;
      }
    }

    function formatTimeExpression(minuteWord, targetHour, lang) {
      // Special handling for Japanese - hour comes first
      if (lang.use24Hour && lang.name && lang.name === '日本語') {
        return `${lang.numbers[targetHour]} ${minuteWord}`;
      }
      
      if (lang.use24Hour) {
        return `${minuteWord} ${lang.numbers[targetHour]}`;
      } else {
        const hour12 = targetHour === 0 ? 12 : targetHour > 12 ? targetHour - 12 : targetHour;
        const ampm = targetHour < 12 ? 'AM' : 'PM';
        return `${minuteWord} ${lang.numbers[hour12]} ${ampm}`;
      }
    }

    // Generic time adjustment factory
    function createTimeAdjuster(timeRef, maxValue, onOverflow = null, onUnderflow = null) {
      return (delta) => {
        liveTime.disableLiveTime();
        let newValue = timeRef.value + delta;

        if (newValue >= maxValue) {
          timeRef.value = newValue % maxValue;
          if (onOverflow) onOverflow(Math.floor(newValue / maxValue));
        } else if (newValue < 0) {
          const underflowAmount = Math.ceil(Math.abs(newValue) / maxValue);
          timeRef.value = (newValue + underflowAmount * maxValue) % maxValue;
          if (onUnderflow) onUnderflow(underflowAmount);
        } else {
          timeRef.value = newValue;
        }

        updateClock();
      };
    }

    // Modern time adjustment methods using the factory
    const adjustHour = createTimeAdjuster(currentHour, CLOCK_CONSTANTS.HOURS_PER_DAY);

    const adjustMinute = createTimeAdjuster(
      currentMinute,
      CLOCK_CONSTANTS.MINUTES_PER_HOUR,
      (overflow) => adjustHour(overflow),
      (underflow) => adjustHour(-underflow)
    );

    const adjustSecond = createTimeAdjuster(
      currentSecond,
      CLOCK_CONSTANTS.SECONDS_PER_MINUTE,
      (overflow) => adjustMinute(overflow),
      (underflow) => adjustMinute(-underflow)
    );

    // Update timeControls with adjustment functions after they're defined
    timeControls[0].adjust = adjustHour;
    timeControls[1].adjust = adjustMinute;
    timeControls[2].adjust = adjustSecond;

    // Preset buttons configuration - eliminates more template duplication
    const presetButtons = [
      // Daily routine presets
      { hour: 6, minute: 45, second: 0, icon: '🌅', key: 'wakeUp' },
      { hour: 7, minute: 0, second: 0, icon: '🥐', key: 'breakfast' },
      { hour: 8, minute: 30, second: 0, icon: '🎒', key: 'schoolWork' },
      { hour: 12, minute: 0, second: 0, icon: '🍽️', key: 'lunch' },
      { hour: 17, minute: 0, second: 0, icon: '🍽️', key: 'dinner' },
      { hour: 21, minute: 0, second: 0, icon: '🛌', key: 'bedtime' },
      // Time learning presets
      { hour: 12, minute: 15, second: 0, icon: '🕐', key: 'quarterPast', divider: true },
      { hour: 12, minute: 30, second: 0, icon: '🕕', key: 'halfPast' },
      { hour: 12, minute: 45, second: 0, icon: '🕘', key: 'quarterTo' },
      { hour: 15, minute: 25, second: 0, icon: '🕞', key: 'twentyFiveTo' },
      { hour: 9, minute: 35, second: 0, icon: '🕘', key: 'twentyFivePast' },
      { hour: 14, minute: 20, second: 0, icon: '🕑', key: 'twentyTo' },
      { hour: 3, minute: 0, second: 0, icon: '🌙', key: 'night' },
      { hour: 9, minute: 30, second: 0, icon: '☀️', key: 'halfTen' }
    ];

    // Visibility controls configuration - eliminates final template duplication
    const visibilityControls = [
      { ref: hourVisible, hideKey: 'hideHour', showKey: 'showHour' },
      { ref: minuteVisible, hideKey: 'hideMinute', showKey: 'showMinute' },
      { ref: secondVisible, hideKey: 'hideSecond', showKey: 'showSecond' },
      { ref: handValuesVisible, hideKey: 'hideNumbers', showKey: 'showNumbers' },
      { ref: hourTicksVisible, hideKey: 'hideHourTicks', showKey: 'showHourTicks' },
      { ref: minuteTicksVisible, hideKey: 'hideMinuteTicks', showKey: 'showMinuteTicks' },
      { ref: digitalTimeVisible, hideKey: 'hideDigitalTime', showKey: 'showDigitalTime' },
      { ref: timeDescriptionVisible, hideKey: 'hideTimeDescription', showKey: 'showTimeDescription' },
      { ref: hourNumbersVisible, hideKey: 'hideHourNumbers', showKey: 'showHourNumbers' },
      { ref: minuteNumbersVisible, hideKey: 'hideMinuteNumbers', showKey: 'showMinuteNumbers' },
      { ref: timePeriodVisible, hideKey: 'hideTimePeriod', showKey: 'showTimePeriod' }
    ];

    function setTime(hour, minute, second) {
      liveTime.disableLiveTime();
      currentHour.value = hour;
      currentMinute.value = minute;
      currentSecond.value = second;
      updateClock();
    }

    function setCurrentTime() {
      liveTime.disableLiveTime();
      const now = new Date();
      currentHour.value = now.getHours();
      currentMinute.value = now.getMinutes();
      currentSecond.value = now.getSeconds();
      updateClock();
    }

    // Live time functions using composable
    const updateTimeFromLive = (hour, minute, second) => {
      currentHour.value = hour;
      currentMinute.value = minute;
      currentSecond.value = second;
      updateClock();
    };

    // Button press handling
    function startPress(action) {
      action();
      pressTimeout = setTimeout(() => {
        pressInterval = setInterval(action, 100);
      }, 500);
    }

    function stopPress() {
      clearTimeout(pressTimeout);
      clearInterval(pressInterval);
    }

    // Vue-based editing functions
    function startEditing(field) {
      disableLiveTime();
      editingField.value = field;

      // Set current value as editing value
      if (field === 'hour') {
        editingValue.value = String(currentHour.value).padStart(2, '0');
      } else if (field === 'minute') {
        editingValue.value = String(currentMinute.value).padStart(2, '0');
      } else if (field === 'second') {
        editingValue.value = String(currentSecond.value).padStart(2, '0');
      }

      // Focus the input in next tick using modern Vue approach
      nextTick(() => {
        // Use CSS selector with DOM API since this is a dynamically rendered input
        // This is acceptable as the input is conditionally rendered by Vue
        setTimeout(() => {
          const activeInput = document.activeElement?.tagName === 'INPUT' ?
            document.activeElement :
            document.querySelector('.time-edit-input[type="number"]');

          if (activeInput && activeInput.classList.contains('time-edit-input')) {
            activeInput.focus();
            activeInput.select();
          }
        }, 10);
      });
    }

    function finishEditing() {
      if (!editingField.value) return;

      liveTime.disableLiveTime(); // Stop live time when manually editing

      const value = parseInt(editingValue.value) || 0;
      const field = editingField.value;

      // Apply constraints
      let clampedValue;
      if (field === 'hour') {
        clampedValue = Math.max(0, Math.min(23, value));
        currentHour.value = clampedValue;
      } else if (field === 'minute') {
        clampedValue = Math.max(0, Math.min(59, value));
        currentMinute.value = clampedValue;
      } else if (field === 'second') {
        clampedValue = Math.max(0, Math.min(59, value));
        currentSecond.value = clampedValue;
      }

      updateClock();
      editingField.value = null;
      editingValue.value = '';
    }

    function cancelEditing() {
      editingField.value = null;
      editingValue.value = '';
    }

    function adjustCurrentField(delta) {
      if (!editingField.value) return;

      const field = editingField.value;
      if (field === 'hour') {
        adjustHour(delta);
        editingValue.value = String(currentHour.value).padStart(2, '0');
      } else if (field === 'minute') {
        adjustMinute(delta);
        editingValue.value = String(currentMinute.value).padStart(2, '0');
      } else if (field === 'second') {
        adjustSecond(delta);
        editingValue.value = String(currentSecond.value).padStart(2, '0');
      }
    }

    // Date formatting functions for child-friendly display
    function formatFriendlyDate(dateString) {
      const today = new Date();
      const gameDate = new Date(dateString.split('.').reverse().join('-')); // Convert dd.mm.yyyy to yyyy-mm-dd
      
      // Calculate difference in days
      const diffTime = today - gameDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const formats = ui.value.game.dateFormats;
      
      if (diffDays === 0) {
        return formats.today;
      } else if (diffDays === 1) {
        return formats.yesterday;
      } else if (diffDays <= 7) {
        const dayOfWeek = formats.weekdays[gameDate.getDay()];
        return diffDays <= 3 ? dayOfWeek : formats.daysAgo.replace('{days}', diffDays);
      } else if (diffDays <= 14) {
        const dayOfWeek = formats.weekdays[gameDate.getDay()];
        return `${formats.lastWeek} ${dayOfWeek}`;
      } else {
        const day = gameDate.getDate();
        const month = formats.months[gameDate.getMonth()];
        return `${day}. ${month}`;
      }
    }
    
    function getDetailedDate(dateString) {
      const gameDate = new Date(dateString.split('.').reverse().join('-'));
      const day = gameDate.getDate();
      const month = ui.value.game.dateFormats.months[gameDate.getMonth()];
      const year = gameDate.getFullYear();
      const dayOfWeek = ui.value.game.dateFormats.weekdays[gameDate.getDay()];
      
      return `${dayOfWeek} ${day}. ${month} ${year}`;
    }

    function handleTabNavigation(event, currentField) {
      event.preventDefault();
      finishEditing();

      const fields = ['hour', 'minute', 'second'];
      const currentIndex = fields.indexOf(currentField);
      let nextIndex;

      if (event.shiftKey) {
        nextIndex = currentIndex - 1;
      } else {
        nextIndex = currentIndex + 1;
      }

      if (nextIndex >= 0 && nextIndex < fields.length) {
        setTimeout(() => {
          startEditing(fields[nextIndex]);
        }, 50);
      }
    }

    // Modern Vue theme management with watcher
    function setTheme(theme) {
      currentTheme.value = theme;
    }
    
    // UI language management function
    function setUILanguage(language) {
      const oldUILanguage = currentUILanguage.value;
      currentUILanguage.value = language;
      
      // When UI language changes, also change time language to match
      // but only if user hasn't explicitly set a different time language
      const timeLanguageMapping = {
        'no': 'no',
        'en': 'en-gb'
      };
      
      // Only auto-change time language if it matches the previous UI language
      if ((oldUILanguage === 'no' && currentLanguage.value === 'no') ||
          (oldUILanguage === 'en' && currentLanguage.value === 'en-gb')) {
        currentLanguage.value = timeLanguageMapping[language];
      }
      
      showLanguageMenu.value = false;
      localStorage.setItem('clockeroo-ui-language', language);
    }
    
    // Game Functions
    function generateRandomTime(level) {
      const config = GAME_LEVELS[level - 1];
      const timeTypes = config.timeTypes;
      
      let hour = Math.floor(Math.random() * 12) + 1; // 1-12
      let minute = 0;
      
      // Choose random time type from allowed types for this level
      const timeType = timeTypes[Math.floor(Math.random() * timeTypes.length)];
      
      switch (timeType) {
        case 'basic':
          // Only 12, 3, 6, 9 o'clock - super easy
          hour = [12, 3, 6, 9][Math.floor(Math.random() * 4)];
          minute = 0;
          break;
        case 'whole':
          minute = 0;
          break;
        case 'half':
          minute = 30;
          break;
        case 'quarter':
          minute = Math.random() < 0.5 ? 15 : 45;
          break;
        case 'fivemin':
          minute = Math.floor(Math.random() * 12) * 5; // 0, 5, 10, ..., 55
          break;
        case 'tenmin':
          minute = Math.floor(Math.random() * 6) * 10; // 0, 10, 20, 30, 40, 50
          break;
        case 'any':
          minute = Math.floor(Math.random() * 60);
          break;
      }
      
      return { hour, minute };
    }
    
    function generateGameQuestion() {
      const level = gameLevel.value;
      const difficulty = GAME_DIFFICULTIES[gameDifficulty.value];
      const correctTime = generateRandomTime(level);
      
      // Set clock to show the time
      currentHour.value = correctTime.hour;
      currentMinute.value = correctTime.minute;
      currentSecond.value = 0;
      updateClock();
      
      // Apply level visibility settings
      applyLevelVisibility(level);
      
      // Determine answer format based on difficulty
      const answerFormat = difficulty.answerFormat;
      const useTextFormat = answerFormat === 'text' || (answerFormat === 'mixed' && Math.random() > 0.5);
      
      // Generate multiple choice answers
      const answers = [];
      const correctAnswer = formatTimeForGame(correctTime.hour, correctTime.minute, useTextFormat);
      answers.push({ text: correctAnswer, correct: true });
      
      // Generate 3 wrong answers
      for (let i = 0; i < 3; i++) {
        let wrongTime;
        let wrongAnswer;
        let attempts = 0;
        do {
          wrongTime = generateRandomTime(level);
          wrongAnswer = formatTimeForGame(wrongTime.hour, wrongTime.minute, useTextFormat);
          attempts++;
          // Prevent infinite loops
          if (attempts > 50) {
            // Fallback: create a simple different time
            wrongTime = {
              hour: (correctTime.hour % 12) + 1,
              minute: (correctTime.minute + 15) % 60
            };
            wrongAnswer = formatTimeForGame(wrongTime.hour, wrongTime.minute, useTextFormat);
            break;
          }
        } while (
          (wrongTime.hour === correctTime.hour && wrongTime.minute === correctTime.minute) ||
          wrongAnswer === correctAnswer ||
          answers.some(a => a.text === wrongAnswer)
        );
        
        answers.push({ 
          text: wrongAnswer, 
          correct: false 
        });
      }
      
      // Shuffle answers
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }
      
      gameQuestion.value = uiLanguages[currentUILanguage.value].game.question;
      gameAnswers.value = answers;
      
      // Debug logging to verify answer generation
      console.log('Generated answers:', answers);
      console.log('Correct answer:', correctAnswer);
    }
    
    function formatTimeForGame(hour, minute, useTextFormat = false) {
      if (useTextFormat) {
        // Use text format like "ti på tolv"
        return generateTimeDescription(hour, minute);
      } else {
        // Use digital format like "11:50"
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      }
    }
    
    function applyLevelVisibility(level) {
      const config = GAME_LEVELS[level - 1];
      const vis = config.visibility;
      
      hourNumbersVisible.value = vis.hourNumbers;
      minuteNumbersVisible.value = vis.minuteNumbers;
      hourTicksVisible.value = vis.hourTicks;
      minuteTicksVisible.value = vis.minuteTicks;
      secondVisible.value = vis.second;
      handValuesVisible.value = vis.handValues;
    }
    
    function selectDifficulty(difficulty) {
      gameDifficulty.value = difficulty;
    }
    
    function changeDifficulty() {
      gameDifficulty.value = null;
    }
    
    function startGame() {
      if (!gameDifficulty.value) {
        console.warn('No difficulty selected');
        return;
      }
      
      gameMode.value = true;
      
      // Start at difficulty's minimum level
      const difficulty = GAME_DIFFICULTIES[gameDifficulty.value];
      gameLevel.value = difficulty.minLevel;
      
      gameScore.value = 0;
      gameLives.value = 3;
      gameHintsUsed.value = 0;
      gameShowingHint.value = false;
      gameQuestionsLeft.value = 10; // Fixed 10 questions per game
      gameAnswerProcessing.value = false; // Reset processing flag
      gameCorrectThisGame.value = 0; // Reset correct answers counter
      gameFeedbackMessage.value = ''; // Clear feedback
      gameFeedbackType.value = '';
      activeTab.value = 'game';
      
      // Reset all visibility settings to prevent cheating
      resetVisibilityForGame();
      
      // Disable live time during game
      liveTime.disableLiveTime();
      
      generateGameQuestion();
    }
    
    function resetToDefaultValues() {
      // Reset all visibility controls and cover size to their default values
      // These values match the initial ref() declarations (lines 341-357)
      hourVisible.value = true;
      minuteVisible.value = true;
      secondVisible.value = true;
      handValuesVisible.value = false;
      hourTicksVisible.value = true;
      minuteTicksVisible.value = true;
      digitalTimeVisible.value = false;
      timeDescriptionVisible.value = false;
      hourNumbersVisible.value = true;
      minuteNumbersVisible.value = false;
      timePeriodVisible.value = true;
      coverSize.value = 93;
    }
    
    function resetVisibilityForGame() {
      // Reset to default values to prevent cheating
      resetToDefaultValues();
    }
    
    function showHint() {
      const difficulty = GAME_DIFFICULTIES[gameDifficulty.value];
      if (gameHintsUsed.value < difficulty.hintsAllowed) {
        gameHintsUsed.value++;
        gameShowingHint.value = true;
      }
    }
    
    function answerQuestion(selectedAnswer) {
      // Prevent multiple clicks/double processing
      if (!gameMode.value || gameAnswerProcessing.value) {
        console.log('Game not active or processing, ignoring answer');
        return;
      }
      
      // Set processing flag
      gameAnswerProcessing.value = true;
      
      // Reset hint display for next question
      gameShowingHint.value = false;
      
      // Debug logging to track the issue
      console.log('Answer clicked:', selectedAnswer);
      console.log('Is correct?', selectedAnswer.correct);
      console.log('Questions left before:', gameQuestionsLeft.value);
      console.log('Lives before:', gameLives.value);
      console.log('Score before:', gameScore.value);
      
      // Always decrease questions left - every answer counts as one question
      gameQuestionsLeft.value--;
      
      if (selectedAnswer.correct === true) {
        console.log('Processing CORRECT answer');
        
        // Correct answer - calculate points
        const levelConfig = GAME_LEVELS[gameLevel.value - 1];
        const difficulty = GAME_DIFFICULTIES[gameDifficulty.value];
        
        // Variable points: basePoints * pointMultiplier
        const points = levelConfig.basePoints * difficulty.pointMultiplier;
        gameScore.value += points;
        
        gameStats.value.totalCorrect++;
        gameCorrectThisGame.value++;
        
        // Show positive feedback
        const encouragements = uiLanguages[currentUILanguage.value].game.encouragements;
        gameFeedbackMessage.value = encouragements[Math.floor(Math.random() * encouragements.length)];
        gameFeedbackType.value = 'correct';
        
        // Level up on correct answer (if possible) - but only occasionally to avoid rapid swings
        if (Math.random() < 0.3 && gameLevel.value < difficulty.maxLevel) {
          gameLevel.value++;
        }
        
      } else {
        console.log('Processing WRONG answer - moving to next question');
        
        // Show gentle, encouraging feedback for wrong answers
        const gentleEncouragements = uiLanguages[currentUILanguage.value].game.gentleEncouragements;
        gameFeedbackMessage.value = gentleEncouragements[Math.floor(Math.random() * gentleEncouragements.length)];
        gameFeedbackType.value = 'wrong';
        
        // Wrong answer - level down occasionally (but not below minLevel)
        const difficulty = GAME_DIFFICULTIES[gameDifficulty.value];
        if (Math.random() < 0.5 && gameLevel.value > difficulty.minLevel) {
          gameLevel.value--;
        }
        
        gameLives.value--;
        
        // Check if game over due to no lives
        if (gameLives.value <= 0) {
          endGame();
          return;
        }
      }
      
      // Hide feedback after 2 seconds
      setTimeout(() => {
        gameFeedbackMessage.value = '';
      }, 2000);
      
      // Check if game over due to no questions left
      if (gameQuestionsLeft.value <= 0) {
        console.log('Game ending: no questions left');
        endGame();
        return;
      }
      
      console.log('Generating next question, questions left:', gameQuestionsLeft.value);
      
      // Clear processing flag before generating next question
      setTimeout(() => {
        gameAnswerProcessing.value = false;
        generateGameQuestion();
      }, 100);
    }
    
    function endGame() {
      const finalScore = gameScore.value;
      const difficulty = GAME_DIFFICULTIES[gameDifficulty.value];
      
      gameMode.value = false;
      gameAnswerProcessing.value = false; // Reset processing flag
      
      // Add score to top scores
      const currentDate = new Date();
      const currentDateString = currentDate.toLocaleDateString('nb-NO');
      const newScore = {
        score: finalScore,
        date: currentDateString,
        difficulty: gameDifficulty.value,
        language: currentLanguage.value
      };
      
      // Add to top scores and sort
      gameStats.value.topScores.push(newScore);
      gameStats.value.topScores.sort((a, b) => b.score - a.score);
      
      // Keep only top 5
      if (gameStats.value.topScores.length > 5) {
        gameStats.value.topScores = gameStats.value.topScores.slice(0, 5);
      }
      
      // Calculate performance analytics based on THIS game only
      const correctAnswers = gameCorrectThisGame.value;
      const accuracy = Math.round((correctAnswers / 10) * 100);
      const maxLevel = gameLevel.value;
      const isNewRecord = gameStats.value.topScores[0]?.score === finalScore;
      
      // Generate pedagogically appropriate feedback index
      let feedbackIndex = 0;
      
      if (correctAnswers === 10) {
        feedbackIndex = 0;
      } else if (correctAnswers >= 8) {
        feedbackIndex = 1;
      } else if (correctAnswers >= 6) {
        feedbackIndex = 2;
      } else if (correctAnswers >= 4) {
        feedbackIndex = 3;
      } else if (correctAnswers >= 2) {
        feedbackIndex = 4;
      } else if (correctAnswers >= 1) {
        feedbackIndex = 5;
      } else {
        feedbackIndex = 6;
      }
      
      // Determine tip category based on level reached
      let tipCategory;
      if (maxLevel <= 1) {
        tipCategory = 'level1';
      } else if (maxLevel <= 2) {
        tipCategory = 'level2';
      } else if (maxLevel <= 3) {
        tipCategory = 'level3';
      } else if (maxLevel <= 4) {
        tipCategory = 'level4';
      } else if (maxLevel <= 6) {
        tipCategory = 'level5_6';
      } else if (maxLevel <= 8) {
        tipCategory = 'level7_8';
      } else {
        tipCategory = 'level9_10';
      }
      
      // Generate difficulty recommendation data (not actual text)
      let recommendationData = null;
      
      // Check if player did very well and can try harder difficulty
      if (correctAnswers >= 8 && accuracy >= 80) {
        if (gameDifficulty.value === 'easy') {
          recommendationData = { type: 'tryHarder', nextDifficulty: 'medium' };
        } else if (gameDifficulty.value === 'medium') {
          recommendationData = { type: 'tryHarder', nextDifficulty: 'hard' };
        }
      }
      // Check if player struggled and should try easier difficulty
      else if (correctAnswers <= 3 && accuracy <= 30) {
        if (gameDifficulty.value === 'hard') {
          recommendationData = { type: 'tryEasier', easierDifficulty: 'medium' };
        } else if (gameDifficulty.value === 'medium') {
          recommendationData = { type: 'tryEasier', easierDifficulty: 'easy' };
        }
      }
      // Encourage to stay and improve on current difficulty
      else if (correctAnswers >= 4 && correctAnswers <= 7) {
        recommendationData = { type: 'stayHere', currentDifficulty: gameDifficulty.value };
      }
      
      // Store results for display
      gameResults.value = {
        score: finalScore,
        accuracy: accuracy,
        correctAnswers: correctAnswers,
        maxLevel: maxLevel,
        difficultyKey: gameDifficulty.value,
        isNewRecord: isNewRecord,
        feedbackIndex: feedbackIndex,
        tipCategory: tipCategory,
        recommendationData: recommendationData
      };
      
      // Show results screen
      gameShowResults.value = true;
      
      // Update stats
      gameStats.value.gamesPlayed++;
      gameStats.value.lastPlayed = currentDateString;
      
      // Save to localStorage
      saveGameStats();
      
      // Return to normal mode
      activeTab.value = 'game'; // Stay on game tab to show stats
      restoreNormalVisibility();
      liveTime.enableLiveTime(updateTimeFromLive);
    }
    
    function closeResults() {
      gameShowResults.value = false;
      gameResults.value = null;
    }
    
    function applyRecommendedDifficulty() {
      const currentDifficulty = gameDifficulty.value;
      const correctAnswers = gameResults.value.correctAnswers;
      const accuracy = gameResults.value.accuracy;
      
      // Apply the same logic as in the recommendation generation
      if (correctAnswers >= 8 && accuracy >= 80) {
        if (currentDifficulty === 'easy') {
          gameDifficulty.value = 'medium';
        } else if (currentDifficulty === 'medium') {
          gameDifficulty.value = 'hard';
        }
      } else if (correctAnswers <= 3 && accuracy <= 30) {
        if (currentDifficulty === 'hard') {
          gameDifficulty.value = 'medium';
        } else if (currentDifficulty === 'medium') {
          gameDifficulty.value = 'easy';
        }
      }
      
      // Close results and start new game with new difficulty
      closeResults();
      startGame();
    }
    
    function restoreNormalVisibility() {
      // Restore to default values after game ends
      resetToDefaultValues();
    }
    
    function saveGameStats() {
      localStorage.setItem('timelearner-game-stats', JSON.stringify(gameStats.value));
    }
    
    function loadGameStats() {
      const saved = localStorage.getItem('timelearner-game-stats');
      if (saved) {
        const savedStats = JSON.parse(saved);
        // Ensure topScores array exists for backward compatibility
        gameStats.value = { 
          ...gameStats.value, 
          ...savedStats,
          topScores: savedStats.topScores || []
        };
      }
    }
    
    function resetHighScores() {
      if (confirm(uiLanguages[currentUILanguage.value].game.confirmReset)) {
        gameStats.value.topScores = [];
        gameStats.value.gamesPlayed = 0;
        gameStats.value.totalCorrect = 0;
        saveGameStats();
      }
    }
    
    // Helper functions for statistics
    function getDifficultyKey(difficultyName) {
      // Find difficulty key by name in current language
      const currentDifficulties = uiLanguages[currentUILanguage.value].game.difficulties;
      for (const [key, name] of Object.entries(currentDifficulties)) {
        if (name === difficultyName) {
          return key;
        }
      }
      return 'easy'; // fallback
    }
    
    function getDifficultyIcon(difficultyKey) {
      const iconMapping = { 'easy': '🟢', 'medium': '🟡', 'hard': '🔴' };
      return iconMapping[difficultyKey] || '🟢';
    }
    
    function getAvailableLevels() {
      if (!gameDifficulty.value) return [];
      const difficulty = GAME_DIFFICULTIES[gameDifficulty.value];
      const levels = [];
      for (let i = difficulty.minLevel; i <= difficulty.maxLevel; i++) {
        levels.push(i);
      }
      return levels;
    }
    
    function formatRecommendationText(recommendationData) {
      if (!recommendationData) return '';
      
      const recommendations = uiLanguages[currentUILanguage.value].game.difficultyRecommendations;
      
      if (recommendationData.type === 'tryHarder') {
        const nextDifficultyName = uiLanguages[currentUILanguage.value].game.difficulties[recommendationData.nextDifficulty];
        return recommendations.tryHarder.replace('{nextDifficulty}', nextDifficultyName);
      } else if (recommendationData.type === 'tryEasier') {
        const easierDifficultyName = uiLanguages[currentUILanguage.value].game.difficulties[recommendationData.easierDifficulty];
        return recommendations.tryEasier.replace('{easierDifficulty}', easierDifficultyName);
      } else if (recommendationData.type === 'stayHere') {
        const currentDifficultyName = uiLanguages[currentUILanguage.value].game.difficulties[recommendationData.currentDifficulty];
        return recommendations.stayHere.replace('{currentDifficulty}', currentDifficultyName);
      }
      
      return '';
    }
    
    // Language flag helper function
    function getLanguageFlag(languageCode) {
      if (!languageCode) return '🏳️'; // fallback flag
      const language = timeLanguages[languageCode];
      return language ? language.flag : '🏳️';
    }
    
    // Toggle delete buttons visibility (for parents)
    function toggleDeleteButtons() {
      showDeleteButtons.value = !showDeleteButtons.value;
    }
    
    // Delete individual score
    function deleteScore(index) {
      gameStats.value.topScores.splice(index, 1);
      saveGameStats();
    }
    
    // Auto-hide delete buttons when leaving stats
    function hideDeleteButtonsOnTabChange() {
      if (!showGameStats.value) {
        showDeleteButtons.value = false;
      }
    }

    // Clock centering calculation
    function calculateClockPosition() {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Detect if controls are at bottom (portrait) or side (landscape)
      const isPortrait = viewport.width / viewport.height <= 1;
      
      let availableArea;
      if (isPortrait) {
        // Controls at bottom - use actual CSS values: height: 35vh; min-height: 200px;
        const controlsHeight = Math.max(200, viewport.height * 0.35);
        availableArea = {
          width: viewport.width,
          height: viewport.height - controlsHeight,
          centerX: viewport.width / 2,
          centerY: (viewport.height - controlsHeight) / 2
        };
      } else {
        // Controls at side - use actual CSS value: width: 330px;
        const controlsWidth = 330;
        availableArea = {
          width: viewport.width - controlsWidth,
          height: viewport.height,
          centerX: (viewport.width - controlsWidth) / 2,
          centerY: viewport.height / 2
        };
      }
      
      // Set CSS custom properties for positioning
      document.documentElement.style.setProperty('--calculated-center-x', `${availableArea.centerX}px`);
      document.documentElement.style.setProperty('--calculated-center-y', `${availableArea.centerY}px`);
      document.documentElement.style.setProperty('--is-portrait', isPortrait ? '1' : '0');
    }

    // Debounced resize handler for better performance
    let resizeTimeout = null;
    function handleResize() {
      // Clear previous timeout to debounce rapid resize events
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      // Debounce resize events by 100ms to prevent excessive recomputations
      resizeTimeout = setTimeout(() => {
        clockKey.value++;
        calculateClockPosition(); // Recalculate position on resize
      }, 100);
    }


    // Global hotkey handler
    function handleGlobalKeydown(e) {
      // Don't handle hotkeys if we're editing a field
      if (editingField.value) {
        return;
      }

      // Don't handle if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      let handled = false;

      switch (key) {
        case 'q':
          adjustHour(1);
          handled = true;
          break;
        case 'a':
          adjustHour(-1);
          handled = true;
          break;
        case 'w':
          adjustMinute(1);
          handled = true;
          break;
        case 's':
          adjustMinute(-1);
          handled = true;
          break;
        case 'e':
          adjustSecond(1);
          handled = true;
          break;
        case 'd':
          adjustSecond(-1);
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        // Visual feedback could be added here
      }
    }

    // Modern Vue event listener composable
    function useEventListener(target, event, handler) {
      onMounted(() => {
        target.addEventListener(event, handler);
      });

      onBeforeUnmount(() => {
        target.removeEventListener(event, handler);
      });
    }

    // Initialize clock
    onMounted(() => {
      // Load game stats from localStorage
      loadGameStats();
      
      // Load saved UI language
      const savedUILanguage = localStorage.getItem('clockeroo-ui-language') || 'no';
      currentUILanguage.value = savedUILanguage;
      
      // Wait for DOM to be ready
      setTimeout(() => {
        updateClock();
        // Trigger initial positioning
        clockKey.value++;
        calculateClockPosition(); // Calculate initial position
        
        // Start live time by default
        liveTime.enableLiveTime(updateTimeFromLive);
      }, 100);

      // Cleanup live time interval on unmount
      onBeforeUnmount(() => {
        if (liveTimeInterval) {
          clearInterval(liveTimeInterval);
        }
      });
    });

    // Modern Vue approach for event listeners
    useEventListener(window, 'resize', handleResize);
    useEventListener(document, 'keydown', handleGlobalKeydown);
    
    // Hide delete buttons when leaving stats view
    watch(showGameStats, (newValue) => {
      if (!newValue) {
        showDeleteButtons.value = false;
      }
    });

    // Watch for changes
    watch([currentHour, currentMinute, currentSecond], () => {
      updateClock();
    });

    // Modern Vue theme watcher
    watch(currentTheme, (newTheme) => {
      document.body.removeAttribute('data-theme');
      if (newTheme !== 'default') {
        document.body.setAttribute('data-theme', newTheme);
      }
    }, { immediate: true }); // Apply theme immediately on mount

    // Watch for visibility changes - Vue computed properties handle this automatically

    return {
      // State
      currentHour,
      currentMinute,
      currentSecond,
      hourVisible,
      minuteVisible,
      secondVisible,
      handValuesVisible,
      hourTicksVisible,
      minuteTicksVisible,
      digitalTimeVisible,
      timeDescriptionVisible,
      hourNumbersVisible,
      minuteNumbersVisible,
      timePeriodVisible,
      displayHourAngle,
      displayMinuteAngle,
      displaySecondAngle,
      currentLanguage,
      currentUILanguage,
      currentTheme,
      liveTimeEnabled,
      activeTab,
      coverSize,
      showHelp,
      showLanguageMenu,
      isTouchDevice,
      editingField,
      editingValue,
      clockKey,
      
      // Game state
      gameMode,
      gameDifficulty,
      gameLevel,
      gameScore,
      gameLives,
      gameQuestion,
      gameAnswers,
      gameHintsUsed,
      gameShowingHint,
      gameQuestionsLeft,
      gameAnswerProcessing,
      gameCorrectThisGame,
      gameFeedbackMessage,
      gameFeedbackType,
      gameShowResults,
      gameResults,
      showGameStats,
      showDeleteButtons,
      gameStats,

      // Template refs
      clock,
      innerCover,
      hourHand,
      minuteHand,
      secondHand,

      // Data arrays for template loops
      timeControls,
      presetButtons,
      visibilityControls,

      // Computed
      ui,
      digitalTimeFormatted,
      timeDescriptionText,
      timePeriodIndicator,
      hourNumbers,
      minuteNumbers,
      hourTicks,
      minuteTicks,
      handValuesPositioned,
      formattedLastPlayed,
      formattedTopScores,

      // Methods
      adjustHour,
      adjustMinute,
      adjustSecond,
      setTime,
      setCurrentTime,
      toggleLiveTime: () => liveTime.toggleLiveTime(updateTimeFromLive),
      startPress,
      stopPress,
      startEditing,
      finishEditing,
      cancelEditing,
      adjustCurrentField,
      handleTabNavigation,
      setTheme,
      setUILanguage,
      setUILanguage,
      
      // Game functions
      selectDifficulty,
      changeDifficulty,
      startGame,
      showHint,
      answerQuestion,
      endGame,
      closeResults,
      applyRecommendedDifficulty,
      resetHighScores,
      toggleDeleteButtons,
      deleteScore,
      
      // Helper functions
      getDifficultyKey,
      getDifficultyIcon,
      getAvailableLevels,
      getDetailedDate,
      formatFriendlyDate,
      formatRecommendationText,
      getLanguageFlag,

      // Expose constants for template
      GAME_DIFFICULTIES,
      GAME_LEVELS,
      
      // Expose languages for template
      languages
    };
  }
};

createApp(clockerooApp).mount('#app');
