# math: Matte i hodet

How the page fits together, so new topics (fractions, decimals, negative numbers …) use the same words, colours and figures.

Plain HTML/CSS/JS, no build step. Norwegian (`nb`) is the default language, English (`en`) the second.

| File | What |
|---|---|
| `index.html` | Page skeleton. All text comes from `i18n.js` via `data-i18n`. |
| `script.js` | Scene renderer, figures, strategies, small-sum engine, self-check, app. |
| `i18n.js` | All text, `I18N.nb` and `I18N.en` with identical keys. |
| `styles.css` | Layout and the colour tokens (`--c-a` … `--c-q`). |
| `test.html` | Runs every strategy over many problems and lists rule breaks. |

## Words

The page talks to a child and a parent together. Use the words Norwegian schools use, and the same word for the same thing everywhere.

| nb | en | Meaning on the page |
|---|---|---|
| addisjon, ledd, sum | addition, term, sum | `kinds.add` |
| subtraksjon, differanse | subtraction, difference | `kinds.sub` |
| multiplikasjon, faktor, produkt | multiplication, factor, product | `kinds.mul` |
| divisjon, kvotient, rest | division, quotient, remainder | `kinds.div` |
| enere, tiere, hundrere, tusener | ones, tens, hundreds, thousands | place names, `col.*` |
| E, T, H, Tu, TTu, HTu | O, T, H, Th, TTh, HTh | place letters above columns |
| oppstilling | column method | written method on squared paper |
| mente | carry | the small 1 moved to the next column |
| veksle | exchange | 1 ten becomes 10 ones (not "låne") |
| overslag | estimate | rough answer first, checked at the end |
| tallinje | number line | |
| hopp | jump | one arc on the number line |
| Husker på | Keeping in mind | the memory box (never "huskeboks") |
| Smårekning i hodet | Small sums in your head | the step list |
| Prøv selv | Try it | question to the child before the next step |
| partall, oddetall | even, odd | |
| primtall, sammensatt tall | prime, composite number | |

Multiplication is written `×` and division `:` everywhere, also in column methods.

## Building blocks

- **Mode**: a tab. `MODES` lists them. `MAIN_MODES` are the four operations; the rest sit behind the "Mer" menu. `ONE_NUMBER` modes take one number (`b` is 0).
- **Strategy** (a way of thinking): `{ id, applies(a, b), build(a, b) }`. `build` returns steps. Listed per mode in `STRATEGIES`.
- **Step**: `step(scene, eq, think, extra)`.
  - `scene`: the drawing, `{ w, h, items }`.
  - `eq`: the big line on top, with colour markup.
  - `think`: `[key, vars]`, the text is `s.<strategy>.<key>`, the step list headline `s.<strategy>.rows.<key>`.
  - `extra`: `ask` (Prøv selv, about the next step), `scratch` (the small sums done in this step), `memory`, `minor`, `short`, `refs`, `subScene`, `subsAfter`, `lineSums`, `plainSums`.
- **Depth** (Få / Noen / Alle): 1 drops `minor` steps and moves their sums to the next step, which then uses its `short` text. 2 and 3 add small sums (see below).
- **Small sums**: every `scratch` line `x op y = r` that is not a known fact is split further by `explainAdd/Sub/Mul/Div`, the way it is done in your head. `plainSums: true` turns this off for a step (column methods, primes). `lineSums: true` keeps number-line jumps whole.
- **Husker på**: `memory: [{ id, text, color, why }]`. Holds exactly the numbers needed later that are not visible in the drawing or the sum. A number that is drawn uses the same id as its memory chip, so it flies into the box and back out. Caption is `mem.<why>`.
- **Refs and frames**: `refs` point a small sum at the drawn parts it talks about. The engine then draws temporary pink (first number) and lime (second number) frames with a value tag, and regroups cubes when a number is not one visible part.

## Colours

Text markup `[k:text]` colours text with key `k`. **Rule: every coloured number in `eq`, the thought or a sum is drawn in the same colour in the scene at that step.** `checkSteps` enforces it. `w` (white, emphasis) is the only key that need not be drawn.

| Key | Colour | Means |
|---|---|---|
| `a` | blue | the first number (cubes, digits, its marks) |
| `b` | orange | the second number |
| `c` | green | the answer, and anything finished or true (prime, even) |
| `d` | purple | something new made along the way: a new ten, a landing spot, a carry, an exchanged digit, the product in division, pairs |
| `e` | teal | a second in-between thing: distance on the line, partial products in column multiplication, tens blocks |
| `x` | red | taken away, left over, remainder, crossed out, odd one out |
| `p` | pink | temporary frame: first number of a small sum |
| `q` | lime | temporary frame: second number of a small sum |
| `n` | grey | inactive, waiting |
| `m` | light grey | placeholders (the 0 in a column multiplication row), old landing spots |
| `w` | white | emphasis only |

## Figures

Always reuse one of these before inventing a new one. Items keep their `id` between steps so they move instead of jumping. Animations must be calm: things never cross each other, and a number keeps its place while the steps go on (`normalizeSteps` gives all steps one size and one offset).

| Figure | Code | Used for |
|---|---|---|
| Cubes in ten-frames, one group per number with a name tag | `blocksScene`, `grp` | counting, make ten, take away, regrouping |
| Number line with jumps, landing marks and a distance bracket | `NumberLine` | jumps, count up, round and adjust, same difference, swap order |
| Area grid with brackets for the factors | `areaScene` | times as rows × columns |
| Share boxes | `shareScene` | sharing out in division |
| Column grid (squared paper) | `colGrid`, `colDigit`, `smallMark` | all four column methods |
| Loose pile, rows/rectangles of cubes | `pileScene`, `primeScene` | primes |
| Dominoes (pairs), blocks of ten | `pairScene` | even and odd |
| Digit tiles and the 0–9 row | `digitsScene` | the last-digit rule |
| Number grid 1–100 | `sieve` | the sieve |

Column methods: place letters on top, the active column has a soft yellow band, carries and exchanged numbers are small purple boxes above their column, crossed-out digits fade and get a red line, answer digits are green. Every column method starts with an overslag kept in "Husker på" and ends by comparing it with the answer.

## Ways of thinking

The mental strategies only take numbers they can draw (plus/minus up to 999, times up to 99 × 99, divide up to 999 : 12). Bigger numbers get the column methods.

| Mode | id | nb |
|---|---|---|
| add | `makeTen` | Lån og lag en tier |
| add | `split` | Tiere for seg, enere for seg |
| add | `jumps` | Hopp på tallinjen |
| add | `compensate` | Rund av og juster |
| add | `doubles` | Nesten dobbelt |
| add | `swapAdd` | Bytt rekkefølge |
| add | `colAdd` | Oppstilling med mente |
| sub | `takeAway` | Ta bort tiere og enere |
| sub | `jumpsBack` | Hopp bakover |
| sub | `countUp` | Tell opp |
| sub | `compensateSub` | Rund av og juster |
| sub | `sameDiff` | Lik differanse |
| sub | `colSub` | Oppstilling med veksling |
| mul | `mulSplit` | Del opp i enklere biter |
| mul | `roundAdjust` | Rund av og trekk fra |
| mul | `doubleHalve` | Doble og halvere |
| mul | `halfTen` | Gang med 10 og halver |
| mul | `doubling` | Doble og doble igjen |
| mul | `skip` | Hopp i like store hopp |
| mul | `swapMul` | Bytt rekkefølge |
| mul | `colMul` | Oppstilling |
| div | `share` | Del ut likt |
| div | `thinkMul` | Tenk gangetabellen |
| div | `splitDiv` | Del opp tallet |
| div | `halving` | Halver og halver igjen |
| div | `colDiv` | Oppstilling (Norwegian layout, subtractions under the number) |
| prime | `tryDivide` | Prøv å dele |
| prime | `sieve` | Silen |
| parity | `rule` | Huskeregelen |
| parity | `pairs` | To og to |
| parity | `lastDigit` | Se på siste siffer |

## Text rules

- Short sentences a 10-year-old can read aloud. One idea per step.
- Every logical link is a step: nothing is "just done" between two steps. An action (borrow, exchange, move) comes before the sum it sets up.
- Each step's headline (`rows.<key>`) says what happens, and two steps in a row never show the same headline and sums.
- Variables are `{name}`. A variable may hold markup (`{sum}` = `[a:7] + [b:8] = 15`).
- Strategy texts: `s.<id>.{name, desc, tip, rows, <step keys>}`. Shared small-sum texts: `sub.*`. Memory captions: `mem.*`. Place names: `col.*`.

## Adding a topic under "Mer"

1. Add the mode to `MODES` (and `ONE_NUMBER` if it takes one number), `OP_SIGN`, `LIMITS`, `DEFAULTS`, `EXAMPLES`, `answerValue`, `answerText`.
2. Text: `modes.<mode>`, `modesHint.<mode>`, `kinds.<mode>` (what the word means), answer words, and `s.<strategy>.*` in both languages.
3. Strategies in `STRATEGIES.<mode>`, built from the figures above. A fraction would be a part of one known figure (cubes, a bar of a ten-frame, or the area grid), coloured `a`/`b` for the two parts and `c` for the result.
4. Add cases to `CASES` and a range to `SWEEP` in `test.html`.
5. Run the checks below until they are clean.

## Checks

- `test.html`: all cases at all depths, filter with `?f=<text>`, `&d=<depth>`, `&all`. "Full sweep" runs every problem in the `SWEEP` ranges and counts rule breaks.
- `?debug` on the main page shows the current worked example as JSON (Copy JSON), including `checkSteps` issues.
- `checkSteps` rules: sums are correct, coloured text is drawn, no step repeats the one before, "Husker på" numbers are used when they leave, small-sum runs end in what they explain, the last step shows the answer.

Bump the version in the footer (`index.html`) for every released change.
