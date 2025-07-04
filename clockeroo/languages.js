// Complete language definitions for the Clockeroo application
// Contains both UI text translations and time expression logic

// UI Language definitions - interface text and controls
const uiLanguages = {
  'no': {
    tabs: {
      time: '⏰ Tid & Forhåndsvalg',
      visibility: '👁️ Vis/Skjul',
      language: '🎨 Utseende'
    },
    timeControls: {
      hours: 'Timer',
      minutes: 'Minutter',
      seconds: 'Sekunder'
    },
    presets: {
      autoTime: '🕐 Nåværende tid',
      liveTime: '⏰ Nåtid',
      liveTimeStop: '⏰ Stopp',
      wakeUp: 'Stå opp',
      breakfast: 'Frokost',
      schoolWork: 'Skole/Jobb',
      lunch: 'Lunsj',
      dinner: 'Middag',
      bedtime: 'Leggetid',
      quarterPast: 'Kvart over tolv',
      halfPast: 'Halv ett',
      quarterTo: 'Kvart på ett',
      twentyFiveTo: 'Fem på halv fire',
      twentyFivePast: 'Fem over halv ti',
      twentyTo: 'Ti på halv tre',
      night: 'Natt',
      halfTen: 'Halv ti'
    },
    visibility: {
      hideHour: 'Skjul Timer',
      showHour: 'Vis Timer',
      hideMinute: 'Skjul Minutter',
      showMinute: 'Vis Minutter',
      hideSecond: 'Skjul Sekunder',
      showSecond: 'Vis Sekunder',
      hideNumbers: 'Skjul Tall',
      showNumbers: 'Vis Tall',
      hideHourTicks: 'Skjul Timestreker',
      showHourTicks: 'Vis Timestreker',
      hideMinuteTicks: 'Skjul Minuttstreker',
      showMinuteTicks: 'Vis Minuttstreker',
      hideDigitalTime: 'Skjul Digital Tid',
      showDigitalTime: 'Vis Digital Tid',
      hideTimeDescription: 'Skjul Tekstbeskrivelse',
      showTimeDescription: 'Vis Tekstbeskrivelse',
      hideHourNumbers: 'Skjul Timetall',
      showHourNumbers: 'Vis Timetall',
      hideMinuteNumbers: 'Skjul Minutttall',
      showMinuteNumbers: 'Vis Minutttall',
      hideTimePeriod: 'Skjul Tid-indikator',
      showTimePeriod: 'Vis Tid-indikator',
      coverSize: 'Skjul streker:'
    },
    languages: {
      theme: 'Tema',
      uiLanguage: 'Språk for kontroller',
      timeLanguage: 'Språk for tid',
      examples: 'Eksempler på tidsuttrykk:'
    },
    themes: {
      default: 'Standard',
      ocean: 'Hav',
      safari: 'Safari',
      forest: 'Skog',
      galaxy: 'Galakse',
      candy: 'Sukkertopp'
    },
    help: {
      title: 'Hurtigtaster',
      hours: 'Timer ↑ / ↓',
      minutes: 'Minutter ↑ / ↓',
      seconds: 'Sekunder ↑ / ↓'
    },
    game: {
      question: 'Hva viser klokka? 🕐',
      adventureTitle: '🕐 Din klokke-reise:',
      progressLabel: 'Fremgang i',
      livesLabel: 'Liv:',
      pointsLabel: 'Poeng:',
      questionsLabel: 'Spørsmål',
      hintButton: '💡 Hint',
      hintsLeft: 'igjen',
      quitButton: '❌ Avslutt Spill',
      encouragements: [
        'Hurra! Du klarte det! 🌟', 'Wow, så flink du er! 🎉', 'Supert! ⭐',
        'Ja! Det var riktig! 👏', 'Du er en stjerne! 💪', 'Fantastisk! 🎯',
        'Du lærer så fort! 🦋', 'Bra! Fortsett sånn! 🌸'
      ],
      gentleEncouragements: [
        'Ikke gi opp! Prøv igjen! 🤗', 'Det går bra, tenk litt til! 💪', 'Du er på riktig vei! 🌱',
        'Øving gjør mester! 🌟', 'Hmm, hva tror du? 🤔', 'Du lærer mer for hver gang! 📚',
        'Det er greit å feile! 🌸', 'Prøv en gang til! 🦋'
      ],
      levels: [
        '🌱 Nybegynner', '🌸 Starter', '🌻 Utforsker', '🌳 Voksende', '🦋 Smarting',
        '🐝 Dyktig', '🦅 Avansert', '🏆 Mester', '🌟 Ekspert', '👑 Konge'
      ],
      difficulties: {
        easy: 'Lett', medium: 'Middels', hard: 'Vanskelig'
      },
      difficultyDescriptions: {
        easy: 'Nivå 1-4: Perfekt for å starte',
        medium: 'Nivå 3-7: For de som kan litt',
        hard: 'Nivå 6-10: For ekspertene'
      },
      resultsFeedback: [
        '🌟 WOW! Du er en ekte klokke-mester!',
        '🎉 Fantastisk! Du kan nesten alt om klokka!',
        '👍 Bra jobbet! Du lærer så mye!',
        '💪 Du er på riktig vei! Fortsett å øve, du blir bedre og bedre!',
        '🤗 Du prøver så godt! Med litt mer øving blir du enda flinkere!',
        '🌱 Bra at du prøver! Hver gang du øver blir du litt flinkere!',
        '🤗 Det er helt normalt å ikke kunne alt ennå! Vi lærer sammen, litt om gangen!'
      ],
      difficultyRecommendations: {
        tryHarder: '🚀 Du mestrer dette! Trykk her for å prøve litt vanskeligere på {nextDifficulty}!',
        stayHere: '💪 Fortsett å øve på {currentDifficulty} - trykk her for å spille igjen!',
        tryEasier: '🌱 Trykk her for å prøve {easierDifficulty} først - det er lettere å lære der!'
      },
      recommendationButton: '✨ Prøv anbefalt nivå',
      gameTab: 'Spill',
      playButton: 'Spill',
      statsButton: 'Statistikk',
      gameTitle: 'Klokke-Quiz',
      gameDescription: 'Test hvor mye du kan om klokka!',
      selectDifficulty: 'Velg vanskelighetsgrad:',
      maxPoints: 'Maks: {points} poeng',
      changeDifficulty: 'Bytt',
      topScores: 'Topp 3 resultater:',
      gamesPlayed: 'Spilt:',
      correctAnswers: 'Riktige:',
      startGame: 'Start Spill',
      resetScores: 'Nullstill rekorder',
      gameStatistics: 'Spillstatistikk',
      yourBestResults: 'Dine beste resultater:',
      points: 'poeng',
      noGamesYet: 'Ingen spill spilt ennå!',
      startGameToSeeStats: 'Start et spill for å se statistikk.',
      generalStats: 'Generell statistikk',
      gamesPlayedLabel: 'Spill spilt',
      correctAnswersLabel: 'Riktige svar',
      successRate: 'Suksessrate',
      lastPlayed: 'Sist spilt',
      resetAllStats: 'Nullstill all statistikk',
      gameComplete: 'Spillet er ferdig!',
      difficultyLevel: 'vanskelighetsgrad',
      newRecord: 'Ny rekord!',
      learningTipsHeader: 'Tips for videre læring:',
      level: 'Nivå',
      playAgain: 'Spill igjen',
      viewStats: 'Se statistikk',
      backToMenu: 'Tilbake til meny',
      confirmReset: 'Er du sikker på at du vil slette alle rekorder?',
      dateFormats: {
        today: 'I dag',
        yesterday: 'I går',
        thisWeek: 'I denne uka',
        lastWeek: 'Forrige uke',
        daysAgo: 'for {days} dager siden',
        weekdays: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'],
        months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'],
        never: 'Aldri'
      },
      learningTips: {
        level1: 'Start med å lære klokka 12, 3, 6 og 9. Se på de store tallene og hvor viserne peker!',
        level2: 'Nå kan du lære alle hele timene! Timeviseren peker på tallet for timen.',
        level3: 'Prøv halve timer! Halv tolv er 11:30 - timeviseren er halvveis til 12.',
        level4: 'Kvart over og kvart på! Husk: Kvart over 3 er 3:15, kvart på 4 er 3:45.',
        level5_6: 'Fem-minutters intervaller! Tell i femmere: 5, 10, 15, 20, 25, 30...',
        level7_8: 'Du blir ekspert! Prøv å se på klokka uten tall for ekstra utfordring.',
        level9_10: 'Du er en klokke-ekspert! Kan du lese klokka uten tall og streker?'
      },
      levelDescriptions: [
        'Kun 12, 3, 6, 9', 'Alle hele timer', 'Halve timer', 'Kvart-tider', '5-minutters',
        '10-minutters', 'Alle minutter med tall', 'Uten tall på klokka', 'Kun med streker', 'Kun visere!'
      ]
    }
  },
  'en': {
    tabs: {
      time: '⏰ Time & Presets',
      visibility: '👁️ Show/Hide',
      language: '🎨 Appearance'
    },
    timeControls: {
      hours: 'Hours',
      minutes: 'Minutes',
      seconds: 'Seconds'
    },
    presets: {
      autoTime: '🕐 Current time',
      liveTime: '⏰ Live time',
      liveTimeStop: '⏰ Stop',
      wakeUp: 'Wake up',
      breakfast: 'Breakfast',
      schoolWork: 'School/Work',
      lunch: 'Lunch',
      dinner: 'Dinner',
      bedtime: 'Bedtime',
      quarterPast: 'Quarter past twelve',
      halfPast: 'Half past twelve',
      quarterTo: 'Quarter to one',
      twentyFiveTo: 'Twenty-five to four',
      twentyFivePast: 'Twenty-five past nine',
      twentyTo: 'Twenty to three',
      night: 'Night',
      halfTen: 'Half past nine'
    },
    visibility: {
      hideHour: 'Hide Hour',
      showHour: 'Show Hour',
      hideMinute: 'Hide Minute',
      showMinute: 'Show Minute',
      hideSecond: 'Hide Second',
      showSecond: 'Show Second',
      hideNumbers: 'Hide Numbers',
      showNumbers: 'Show Numbers',
      hideHourTicks: 'Hide Hour Ticks',
      showHourTicks: 'Show Hour Ticks',
      hideMinuteTicks: 'Hide Minute Ticks',
      showMinuteTicks: 'Show Minute Ticks',
      hideDigitalTime: 'Hide Digital Time',
      showDigitalTime: 'Show Digital Time',
      hideTimeDescription: 'Hide Text Description',
      showTimeDescription: 'Show Text Description',
      hideHourNumbers: 'Hide Hour Numbers',
      showHourNumbers: 'Show Hour Numbers',
      hideMinuteNumbers: 'Hide Minute Numbers',
      showMinuteNumbers: 'Show Minute Numbers',
      hideTimePeriod: 'Hide Time Indicator',
      showTimePeriod: 'Show Time Indicator',
      coverSize: 'Hide center:'
    },
    languages: {
      theme: 'Theme',
      uiLanguage: 'Interface Language',
      timeLanguage: 'Time Language',
      examples: 'Time expression examples:'
    },
    themes: {
      default: 'Default',
      ocean: 'Ocean',
      safari: 'Safari',
      forest: 'Forest',
      galaxy: 'Galaxy',
      candy: 'Candy'
    },
    help: {
      title: 'Keyboard Shortcuts',
      hours: 'Hours ↑ / ↓',
      minutes: 'Minutes ↑ / ↓',
      seconds: 'Seconds ↑ / ↓'
    },
    game: {
      question: 'What time is it? 🕐',
      adventureTitle: '🕐 Your clock adventure:',
      progressLabel: 'Progress in',
      livesLabel: 'Lives:',
      pointsLabel: 'Points:',
      questionsLabel: 'Question',
      hintButton: '💡 Hint',
      hintsLeft: 'left',
      quitButton: '❌ Quit Game',
      encouragements: [
        'Hooray! You did it! 🌟', 'Wow, you are so clever! 🎉', 'Super! ⭐',
        'Yes! That was right! 👏', 'You are a star! 💪', 'Fantastic! 🎯',
        'You learn so fast! 🦋', 'Great! Keep it up! 🌸'
      ],
      gentleEncouragements: [
        'Don\'t give up! Try again! 🤗', 'It\'s okay, think a bit more! 💪', 'You\'re on the right track! 🌱',
        'Practice makes perfect! 🌟', 'Hmm, what do you think? 🤔', 'You learn more every time! 📚',
        'It\'s okay to make mistakes! 🌸', 'Try one more time! 🦋'
      ],
      levels: [
        '🌱 Beginner', '🌸 Starter', '🌻 Explorer', '🌳 Growing', '🦋 Smart',
        '🐝 Skilled', '🦅 Advanced', '🏆 Master', '🌟 Expert', '👑 King'
      ],
      difficulties: {
        easy: 'Easy', medium: 'Medium', hard: 'Hard'
      },
      difficultyDescriptions: {
        easy: 'Levels 1-4: Perfect to start',
        medium: 'Levels 3-7: For those who know a bit',
        hard: 'Levels 6-10: For the experts'
      },
      resultsFeedback: [
        '🌟 WOW! You are a real clock master!',
        '🎉 Fantastic! You know almost everything about clocks!',
        '👍 Well done! You are learning so much!',
        '💪 You are on the right path! Keep practicing, you get better and better!',
        '🤗 You try so hard! With a little more practice you will be even better!',
        '🌱 Good that you try! Every time you practice you get a little better!',
        '🤗 It is perfectly normal not to know everything yet! We learn together, little by little!'
      ],
      difficultyRecommendations: {
        tryHarder: '🚀 You have mastered this! Click here to try something harder on {nextDifficulty}!',
        stayHere: '💪 Keep practicing {currentDifficulty} - click here to play again!',
        tryEasier: '🌱 Click here to try {easierDifficulty} first - it\'s easier to learn there!'
      },
      recommendationButton: '✨ Try recommended level',
      gameTab: 'Game',
      playButton: 'Play',
      statsButton: 'Statistics',
      gameTitle: 'Clock Quiz',
      gameDescription: 'Test how much you know about clocks!',
      selectDifficulty: 'Select difficulty level:',
      maxPoints: 'Max: {points} points',
      changeDifficulty: 'Change',
      topScores: 'Top 3 results:',
      gamesPlayed: 'Played:',
      correctAnswers: 'Correct:',
      startGame: 'Start Game',
      resetScores: 'Reset scores',
      gameStatistics: 'Game Statistics',
      yourBestResults: 'Your best results:',
      points: 'points',
      noGamesYet: 'No games played yet!',
      startGameToSeeStats: 'Start a game to see statistics.',
      generalStats: 'General Statistics',
      gamesPlayedLabel: 'Games played',
      correctAnswersLabel: 'Correct answers',
      successRate: 'Success rate',
      lastPlayed: 'Last played',
      resetAllStats: 'Reset all statistics',
      gameComplete: 'Game complete!',
      difficultyLevel: 'difficulty level',
      newRecord: 'New record!',
      learningTipsHeader: 'Tips for further learning:',
      level: 'Level',
      playAgain: 'Play again',
      viewStats: 'View statistics',
      backToMenu: 'Back to menu',
      confirmReset: 'Are you sure you want to delete all records?',
      dateFormats: {
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This week',
        lastWeek: 'Last week',
        daysAgo: '{days} days ago',
        weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        never: 'Never'
      },
      learningTips: {
        level1: 'Start by learning 12, 3, 6 and 9 o\'clock. Look at the big numbers and where the hands point!',
        level2: 'Now you can learn all the whole hours! The hour hand points to the number for the hour.',
        level3: 'Try half hours! Half past eleven is 11:30 - the hour hand is halfway to 12.',
        level4: 'Quarter past and quarter to! Remember: Quarter past 3 is 3:15, quarter to 4 is 3:45.',
        level5_6: 'Five-minute intervals! Count in fives: 5, 10, 15, 20, 25, 30...',
        level7_8: 'You\'re becoming an expert! Try reading the clock without numbers for extra challenge.',
        level9_10: 'You are a clock expert! Can you read the clock without numbers and ticks?'
      },
      levelDescriptions: [
        'Only 12, 3, 6, 9', 'All whole hours', 'Half hours', 'Quarter times', '5-minute',
        '10-minute', 'All minutes with numbers', 'Without numbers on clock', 'Only with ticks', 'Only hands!'
      ]
    }
  }
};

// Time Language definitions - time expression logic and number words
const timeLanguages = {
  'no': {
    name: 'Norsk',
    flag: '🇳🇴',
    examples: {
      '07:00': 'syv (frokost)',
      '12:00': 'tolv (lunsj)',
      '14:00': 'to (snack)',
      '17:00': 'fem (middag)',
      '19:00': 'syv (kvelds)',
      '20:00': 'åtte (leggetid)',
      '12:15': 'kvart over tolv',
      '12:30': 'halv ett',
      '12:45': 'kvart på ett'
    },
    numbers: ['tolv', 'ett', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'åtte', 'ni', 'ti', 'elleve', 'tolv', 'ett', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'åtte', 'ni', 'ti', 'elleve'],
    minuteWords: {
      0: '',
      5: 'fem over',
      10: 'ti over',
      15: 'kvart over',
      20: 'ti på halv',
      25: 'fem på halv',
      30: 'halv',
      35: 'fem over halv',
      40: 'ti over halv',
      45: 'kvart på',
      50: 'ti på',
      55: 'fem på'
    },
    use24Hour: true
  },
  'en-gb': {
    name: 'English (UK)',
    flag: '🇬🇧',
    examples: {
      '07:00': 'seven o\'clock (breakfast)',
      '12:00': 'twelve o\'clock (lunch)',
      '14:00': 'two o\'clock (tea time)',
      '17:00': 'five o\'clock (dinner)',
      '19:00': 'seven o\'clock (evening)',
      '20:00': 'eight o\'clock (bedtime)',
      '12:15': 'quarter past twelve',
      '12:30': 'half past twelve',
      '12:45': 'quarter to one'
    },
    numbers: ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'],
    minuteWords: {
      0: 'o\'clock',
      5: 'five past',
      10: 'ten past',
      15: 'quarter past',
      20: 'twenty past',
      25: 'twenty-five past',
      30: 'half past',
      35: 'twenty-five to',
      40: 'twenty to',
      45: 'quarter to',
      50: 'ten to',
      55: 'five to'
    },
    use24Hour: true
  },
  'en-us': {
    name: 'English (US)',
    flag: '🇺🇸',
    examples: {
      '07:00': 'seven AM (breakfast)',
      '12:00': 'twelve PM (lunch)',
      '02:00': 'two PM (snack)',
      '05:00': 'five PM (dinner)',
      '07:00': 'seven PM (evening)',
      '08:00': 'eight PM (bedtime)',
      '12:15': 'quarter past twelve',
      '12:30': 'twelve thirty',
      '12:45': 'quarter to one'
    },
    numbers: ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'],
    minuteWords: {
      0: 'o\'clock',
      5: 'oh five',
      10: 'ten',
      15: 'fifteen',
      20: 'twenty',
      25: 'twenty-five',
      30: 'thirty',
      35: 'thirty-five',
      40: 'forty',
      45: 'forty-five',
      50: 'fifty',
      55: 'fifty-five'
    },
    use24Hour: false
  }
};