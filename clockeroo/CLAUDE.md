# Clockeroo Project - Claude Development Guide

## Project Overview

Clockeroo is an interactive Vue.js clock learning application designed specifically for children around age 9. It combines educational clock reading with gamification elements to make learning time fun and engaging.

**Live Demo**: [https://utforsk.github.io/clockeroo/](https://utforsk.github.io/clockeroo/)
**GitHub Repository**: [https://github.com/utforsk/utforsk.github.io/tree/main/clockeroo](https://github.com/utforsk/utforsk.github.io/tree/main/clockeroo)

### Key Features
- **Interactive analog clock** with customizable visibility options
- **Multilingual support** (Norwegian/English) for both UI and time expressions
- **Gamified learning system** with 10 levels across 3 difficulty tiers
- **Child-friendly interface** with encouraging feedback and age-appropriate language
- **Performance-based recommendations** suggesting easier/harder levels
- **Statistics tracking** with child-friendly date formats
- **6 visual themes** (Default, Ocean, Safari, Forest, Galaxy, Candy)

## Architecture & Technology Stack

### Core Technologies
- **Vue.js 3** with Composition API
- **Vanilla CSS** with CSS custom properties for theming
- **Local Storage** for persistent game statistics
- **Responsive design** supporting both desktop and touch devices

### File Structure
```
clockeroo/
├── index.html          # Main template with game interface
├── script.js           # Vue.js application logic (~1900 lines)
├── styles.css          # Complete styling (~2600 lines) 
├── languages.js        # Multilingual definitions (~350 lines)
├── README.md           # User-facing project documentation
└── CLAUDE.md          # This development guide
```

## Development Guidelines

### Code Style & Standards
- **NO COMMENTS** - Code should be self-documenting
- **Child-friendly UX** - All text and interactions designed for age ~9
- **Consistent naming** - Use descriptive variable/function names
- **Vue Composition API** - Prefer reactive refs and computed properties
- **CSS Custom Properties** - Use for consistent theming
- **Multilingual first** - Always implement both NO/EN translations

### Game Design Principles
- **Encouragement over criticism** - Wrong answers get gentle feedback
- **Progressive difficulty** - 10 levels split across Easy/Medium/Hard
- **Performance-based guidance** - Smart recommendations for next difficulty
- **Clear visual feedback** - Animations and colors guide learning
- **Accessibility** - Works on touch devices, keyboard shortcuts available

## Key Components

### 1. Clock System
**Key functions**: `updateClock()`, `adjustHour()`, `adjustMinute()`, `adjustSecond()`
- **Reactive time state** - currentHour, currentMinute, currentSecond
- **Hand positioning** - Computed properties for smooth rotation  
- **Live time mode** - Optional real-time clock updates via `toggleLiveTime()`
- **Visual elements** - Hour/minute numbers, ticks, hand values

### 2. Game Engine  
**Key functions**: `startGame()`, `generateQuestion()`, `answerQuestion()`, `endGame()`
- **Level progression** - 10 levels with increasing complexity
- **Question generation** - Time-appropriate questions per level
- **Lives system** - 3 hearts, lose one per wrong answer
- **Scoring algorithm** - Points based on level difficulty and performance
- **Hint system** - Limited hints showing time description via `showHint()`

### 3. Internationalization
**Key objects**: `uiLanguages`, `timeLanguages` in languages.js
- **UI Languages** - Interface controls and game text
- **Time Languages** - Time expression logic (Norwegian/UK English/US English)
- **Date Formatting** - Child-friendly relative dates via `formatFriendlyDate()`

### 4. Statistics System
**Key functions**: `saveGameStats()`, `loadGameStats()`, `resetHighScores()`
- **Top 3 scores** per difficulty with friendly date display
- **Performance tracking** - Games played, correct answers, success rate
- **Recommendation engine** - Suggests appropriate difficulty based on performance

## Common Development Tasks

### Adding New Game Level
1. Update `GAME_LEVELS` array in script.js (~line 22)
2. Define visibility settings and time types
3. Update difficulty mappings if needed
4. Test progression flow

### Adding New Language
1. Add UI language to `uiLanguages` in languages.js
2. Add time language to `timeLanguages` with expression logic
3. Update language selection buttons in index.html
4. Test all game flows in new language

### Modifying Themes
1. Add new theme variables in styles.css `:root` section
2. Create `[data-theme="name"]` selector with overrides
3. Add theme button in language section of index.html
4. Update `themes` object in languages.js

### Updating Game Feedback
1. Modify encouragement arrays in languages.js
2. Update `gameResults.feedback` logic in endGame function
3. Test feedback appears correctly in results screen
4. Ensure child-appropriate tone

## Critical Code Sections

### Game Logic Bug Prevention
**Function**: `answerQuestion()`
**Critical**: Always decrement `gameQuestionsLeft` regardless of answer correctness
```javascript
// ALWAYS decrease questions left - every answer counts
gameQuestionsLeft.value--;

if (selectedAnswer.correct === true) {
  // Process correct answer
} else {
  // Process wrong answer - but still move to next question
}
```

### Date Formatting
**Function**: `formatFriendlyDate()`
**Purpose**: Convert technical dates to child-friendly relative dates
**Usage**: Used in statistics display with hover tooltips for full details via `getDetailedDate()`

### Difficulty Recommendations
**Function**: `endGame()` 
**Logic**: 
- 8+ correct → suggest harder
- ≤3 correct → suggest easier  
- 4-7 correct → encourage same level

## Testing & Quality Assurance

### Manual Testing Checklist
- [ ] All 10 game levels progress correctly
- [ ] Both Norwegian and English languages work fully
- [ ] Touch devices work (buttons, interactions)
- [ ] Statistics save and display correctly
- [ ] Date formatting shows child-friendly text
- [ ] Recommendation system suggests appropriate levels
- [ ] All 6 themes apply correctly
- [ ] Game can be completed without bugs

### Common Issues to Watch
1. **Question count bugs** - Ensure `gameQuestionsLeft` decrements properly
2. **Language consistency** - All text should translate when language changes
3. **Mobile responsiveness** - Test on touch devices
4. **Local storage** - Statistics should persist between sessions
5. **Date edge cases** - Test date formatting around midnight/day boundaries

## Performance Considerations

### Vue.js Optimizations
- Use `computed` properties for derived state
- Minimize watchers, prefer reactive dependencies
- Batch DOM updates in `nextTick` when needed
- Keep template expressions simple

### CSS Performance
- Use CSS custom properties for theme switching
- Minimize repaints with `transform` over position changes
- Use `will-change` sparingly for animations only
- Optimize selector specificity

## Future Enhancement Areas

### Educational Improvements
- More granular difficulty progression
- Different question types (analog → digital, digital → analog)
- Time zone learning for advanced levels
- Achievement badges for motivation

### Technical Improvements
- Vue 3 `<script setup>` syntax migration
- TypeScript for better type safety
- Progressive Web App (PWA) capabilities
- Enhanced accessibility (screen readers, high contrast)

### UX Improvements
- Sound effects for correct/incorrect answers
- More detailed progress tracking
- Parent dashboard for tracking child progress
- Customizable avatars or characters

## Development Environment

### Setup
1. No build process required - pure HTML/CSS/JS
2. Serve via local HTTP server for testing
3. Test in multiple browsers (Chrome, Firefox, Safari)
4. Test on mobile devices or browser dev tools

### Debugging
- Use Vue DevTools browser extension
- Console.log game state changes when needed
- Test localStorage in browser DevTools
- Check responsive design in mobile view

## Claude-Specific Instructions

### Communication Style
- **Be concise** - Respond briefly unless detail requested
- **Show, don't tell** - Make changes directly rather than explaining
- **Child-first mindset** - Always consider the 9-year-old user experience
- **Progressive enhancement** - Build features that degrade gracefully

### Code Changes
- **Read before writing** - Always understand existing code first
- **Test mental model** - Consider edge cases before implementing
- **Preserve patterns** - Follow existing code style and structure
- **Document in commit** - Explain why changes were made

### Problem Solving
- **Start with user impact** - How does this affect the child's experience?
- **Consider multilingual** - Will this work in both languages?
- **Think mobile-first** - Will this work on touch devices?
- **Test thoroughly** - Verify the complete user flow

### Common Commands for Testing
```bash
# Serve locally for testing
python -m http.server 8000
# or
npx serve .

# Check for console errors in browser DevTools
# Test responsive design with device simulation
# Verify localStorage persistence between sessions
```

Remember: This is an educational tool for children. Every decision should prioritize their learning experience, engagement, and sense of accomplishment. Keep the tone encouraging, the interface intuitive, and the progression rewarding.