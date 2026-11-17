'use strict';

// All user-facing text. English is the default language, Norwegian (nb) is the extra one.
const I18N = {
    en: {
        meta: {
            title: 'Energy Never Disappears',
            description: 'An interactive lab for kids: follow the energy balls and see that energy never disappears, it only changes form.'
        },
        nav: { language: 'Language' },
        footer: { partOf: 'Part of' },
        hero: {
            title: 'Energy never disappears',
            lead: 'It only changes form. Follow the energy balls and see for yourself!',
            start: 'To the lab'
        },
        rules: [
            'One ball is a little bit of energy',
            'The colour shows the kind of energy',
            'The number of balls never changes'
        ],
        forms: {
            chemical: { name: 'Chemical', line: 'In food, fuel and batteries' },
            height: { name: 'Height', line: 'Things high up that can fall' },
            elastic: { name: 'Spring', line: 'Things stretched or squeezed' },
            nuclear: { name: 'Nuclear', line: 'Deep inside atoms. Makes the Sun shine' },
            motion: { name: 'Motion', line: 'Everything that moves' },
            heat: { name: 'Heat', line: 'Tiny atoms wiggling' },
            light: { name: 'Light', line: 'Sunshine, lamps and screens' },
            sound: { name: 'Sound', line: 'Air that shakes' },
            electric: { name: 'Electricity', line: 'Flowing in wires' }
        },
        ch1: {
            chip: 'Kinds',
            title: 'The energy balls',
            lead: 'Energy comes in different kinds. Some kinds wait, some are on the move.',
            stored: 'Waiting (stored)',
            moving: 'On the move'
        },
        ch2: {
            chip: 'Lab',
            title: 'Where does the energy go?',
            lead: 'Pick an experiment, choose how much energy, press play. Count the balls!'
        },
        lab: {
            canvas: 'Energy lab',
            play: 'Play',
            pause: 'Pause',
            again: 'Play again',
            time: 'Time',
            balls: 'balls',
            always: 'always',
            amount: 'How much energy?',
            tapHint: 'Tap a ball to follow it',
            follow: 'This ball:',
            space: 'Space',
            extend: 'Whole story: from the Big Bang',
            extendOff: 'Show only the experiment',
            pre: {
                bang: '13.8 billion years ago: the Big Bang! All the energy is born in a hot flash.',
                atoms: 'The universe cools down. The energy gets stored in tiny atoms.',
                star: 'Gravity pulls the atoms together. 4.6 billion years ago our Sun is born.',
                shine: 'Deep inside the Sun, atoms are squeezed together and give off light.',
                travel: 'The light races to Earth. It takes 8 minutes.',
                tree: 'Sunlight hits the leaves of an apple tree.',
                oldTree: '300 million years ago: sunlight hits ancient plants.',
                sugar: 'The leaves turn light into sugar. Now it is chemical energy.',
                eat: 'Joule eats the apple. Yum!',
                buried: 'The plants die and get buried. Over millions of years they become oil and gas.',
                factory: 'Today a factory makes explosives from the gas.'
            },
            post: {
                far: 'The light flies on through space for ever. Every single ball still exists!'
            },
            stories: {
                eat: {
                    name: 'Eat an apple',
                    body: 'Most of the food keeps Joule warm. Some runs the brain (electricity!) and the heart.',
                    jump: 'Jump! Up: motion becomes height. Down: height becomes motion. Landing: heat.',
                    sing: 'La la la! A tiny bit becomes sound.',
                    spread: 'The heat spreads out thin. Now it can’t do much.',
                    space: 'Much later it glows out into space. Every ball is still here!'
                },
                stone: {
                    name: 'Stone off a cliff',
                    start: 'The energy from food is inside Joule.',
                    lift: 'Crank! The stone goes up. Joule gets warm.',
                    wait: 'Stored! The energy waits in the height.',
                    fall: 'Let go! Height turns into motion.',
                    crash: 'Crash! Motion turns into heat and sound.',
                    spread: 'The heat spreads out thin. Now it can’t do much.',
                    space: 'Much later it glows out into space. Every ball is still here!'
                },
                throw: {
                    name: 'Throw a ball',
                    variants: { bouncy: 'Bouncy ball', clay: 'Clay ball' },
                    start: 'The energy from food is inside Joule.',
                    throw: 'Throw! The ball gets motion. Joule gets warm.',
                    bounce: 'Each bounce: squeeze, then up again. A bit of heat escapes every time.',
                    splat: 'Splat! All the motion turns into heat at once.',
                    rest: 'The ball lies still. Its energy is heat now.',
                    spread: 'The heat spreads out thin. Now it can’t do much.',
                    space: 'Much later it glows out into space. Every ball is still here!'
                },
                scream: {
                    name: 'Scream into a pillow',
                    variants: { pillow: 'Pillow', open: 'No pillow' },
                    start: 'The energy from food is inside Joule.',
                    scream: 'AAAAH! Most of it just makes Joule warm. Only a tiny bit becomes sound.',
                    pillow: 'The pillow swallows the sound. It turns into heat.',
                    echo: 'The sound bounces off the cliff (echo!) and fades into heat.',
                    spread: 'The heat spreads out thin. Now it can’t do much.',
                    space: 'Much later it glows out into space. Every ball is still here!'
                },
                blast: {
                    name: 'Blast in a mountain',
                    variants: { inside: 'Inside', open: 'Outside' },
                    start: 'The explosive holds chemical energy.',
                    boom: 'BOOM! Heat, light, sound and motion, all at once.',
                    rock: 'The rock stops it all. Everything becomes heat in the mountain.',
                    open: 'The light flies to space. Rocks fall. The sound fades.',
                    spread: 'The heat spreads out thin. Now it can’t do much.',
                    space: 'Over many years it glows out into space. Every ball is still here!'
                }
            },
            read: {
                food: 'Food used',
                height: 'Height',
                speed: 'Speed at the bottom',
                stoneWarm: 'Stone gets warmer',
                throwSpeed: 'Throw speed',
                bounces: 'Bounces',
                ballWarm: 'Ball gets warmer',
                soundPart: 'Turned into sound',
                pillowWarm: 'Pillow gets warmer',
                jouleWarm: 'Joule gets warmer',
                explosive: 'Explosive',
                sameAs: 'Same energy as',
                rockWarm: 'Rock 5 m around gets warmer',
                moon: 'The flash reaches the Moon after',
                sunNeeded: 'Sunlight the tree needed',
                warmFor: 'Keeps Joule warm for'
            },
            fmt: {
                apples: '{n} apples',
                apple: '1 apple',
                applePart: '1/{n} of an apple',
                partOf: '1 part in {n}',
                tiny: 'less than a millionth of a degree',
                seconds: '{n} seconds',
                times: '{n} times as much',
                minutes: '{n} minutes',
                hours: '{n} hours'
            }
        },
        ch3: {
            chip: 'Tricky',
            title: 'Tricky questions',
            lead: 'Tap a card to see the answer.'
        },
        cards: [
            { q: 'Where does the light go when I switch off the lamp?', a: 'It already hit the walls and turned into a tiny bit of heat. That takes less than a millionth of a second.', chain: ['electric', 'light', 'heat'] },
            { q: 'If energy never disappears, why should we save it?', a: 'It spreads out as heat that is too thin to use. Like juice poured into the sea: still there, but you can’t drink it.', chain: ['chemical', 'motion', 'heat'] },
            { q: 'What if I throw a ball in space?', a: 'Nothing stops it. It keeps its motion energy for millions of years.', chain: ['chemical', 'motion', 'motion'] },
            { q: 'Is the energy gone when my phone dies?', a: 'No. It became light from the screen, sound, and heat. Feel how warm the phone gets!', chain: ['chemical', 'electric', 'light', 'heat'] },
            { q: 'Where did the energy in my food come from?', a: 'From the Sun. Plants catch sunlight and store it as chemical energy.', chain: ['nuclear', 'light', 'chemical'] },
            { q: 'Can a black hole destroy energy?', a: 'No. The black hole just gets heavier. Mass is stored energy too.', chain: ['motion', '⚫'] },
            { q: 'Why do my hands get warm when I rub them?', a: 'Rubbing turns motion into heat. The atoms in your skin start wiggling faster.', chain: ['chemical', 'motion', 'heat'] },
            { q: 'Where does all energy end up in the end?', a: 'As heat that glows out into space as invisible light. It travels on forever.', chain: ['heat', 'light', '🌌'] }
        ],
        ch4: {
            chip: 'Quiz',
            title: 'Quiz',
            progress: 'Question {i} of {n}',
            pick: 'Pick an answer.',
            correct: 'Correct!',
            wrong: 'Not quite.',
            next: 'Next',
            finish: 'See score',
            retry: 'Try again',
            results: [
                'Keep exploring! Try the lab again and count the balls.',
                'Good start! You know energy changes form.',
                'Great! You really know where energy goes.',
                'Perfect! You are an energy expert!'
            ]
        },
        quiz: [
            { q: 'You scream into a pillow. Where does most of the energy end up?', a: ['As heat in you and the pillow', 'It disappears', 'It stays in the pillow as sound'], why: 'Most of it warms you up. The little bit of sound becomes heat in the pillow.' },
            { q: 'A stone falls off a cliff. What does its height energy turn into first?', a: ['Motion', 'Sound', 'Light'], why: 'The lower it gets, the faster it goes. Height becomes motion.' },
            { q: 'Why does a bouncy ball bounce lower every time?', a: ['Some energy becomes heat and sound at each bounce', 'The energy wears out', 'Gravity gets stronger'], why: 'Nothing wears out. A few balls escape as heat and sound at every bounce.' },
            { q: 'Which one is stored energy?', a: ['A charged battery', 'A loud bang', 'A flash of light'], why: 'A battery holds chemical energy that waits until you use it.' },
            { q: 'You bike up a hill. Where is the energy at the top?', a: ['Height energy, and heat in your body', 'It is gone', 'In the tyres'], why: 'Part of it is stored as height. The rest made you warm.' },
            { q: 'Where does almost all energy end up in the end?', a: ['As heat that glows out into space', 'It vanishes', 'In the ground forever'], why: 'Heat spreads out and finally glows away as invisible light.' }
        ]
    },
    nb: {
        meta: {
            title: 'Energi forsvinner aldri',
            description: 'Et interaktivt laboratorium for barn: følg energikulene og se at energi aldri forsvinner, den bare skifter form.'
        },
        nav: { language: 'Språk' },
        footer: { partOf: 'En del av' },
        hero: {
            title: 'Energi forsvinner aldri',
            lead: 'Den bare skifter form. Følg energikulene og se selv!',
            start: 'Til laben'
        },
        rules: [
            'Én kule er litt energi',
            'Fargen viser hva slags energi',
            'Antall kuler endrer seg aldri'
        ],
        forms: {
            chemical: { name: 'Kjemisk', line: 'I mat, drivstoff og batterier' },
            height: { name: 'Høyde', line: 'Ting høyt oppe som kan falle' },
            elastic: { name: 'Fjær', line: 'Ting som er strukket eller klemt' },
            nuclear: { name: 'Kjerne', line: 'Dypt inne i atomer. Får sola til å skinne' },
            motion: { name: 'Bevegelse', line: 'Alt som beveger seg' },
            heat: { name: 'Varme', line: 'Bittesmå atomer som vrikker seg' },
            light: { name: 'Lys', line: 'Sol, lamper og skjermer' },
            sound: { name: 'Lyd', line: 'Luft som rister' },
            electric: { name: 'Strøm', line: 'Renner i ledninger' }
        },
        ch1: {
            chip: 'Typer',
            title: 'Energikulene',
            lead: 'Det finnes ulike typer energi. Noen venter, andre er på farten.',
            stored: 'Venter (lagret)',
            moving: 'På farten'
        },
        ch2: {
            chip: 'Lab',
            title: 'Hvor blir energien av?',
            lead: 'Velg et forsøk, velg hvor mye energi, trykk på play. Tell kulene!'
        },
        lab: {
            canvas: 'Energilab',
            play: 'Spill av',
            pause: 'Pause',
            again: 'Spill av igjen',
            time: 'Tid',
            balls: 'kuler',
            always: 'alltid',
            amount: 'Hvor mye energi?',
            tapHint: 'Trykk på en kule for å følge den',
            follow: 'Denne kula:',
            space: 'Verdensrommet',
            extend: 'Hele historien: fra Big Bang',
            extendOff: 'Vis bare forsøket',
            pre: {
                bang: 'For 13,8 milliarder år siden: Big Bang! All energien blir født i et varmt glimt.',
                atoms: 'Universet kjøles ned. Energien blir lagret i bittesmå atomer.',
                star: 'Tyngdekraften trekker atomene sammen. For 4,6 milliarder år siden blir sola født.',
                shine: 'Dypt inne i sola blir atomer presset sammen og gir fra seg lys.',
                travel: 'Lyset suser til jorda. Det tar 8 minutter.',
                tree: 'Sollyset treffer bladene på et epletre.',
                oldTree: 'For 300 millioner år siden: sollys treffer gamle planter.',
                sugar: 'Bladene gjør lys om til sukker. Nå er det kjemisk energi.',
                eat: 'Joule spiser eplet. Nam!',
                buried: 'Plantene dør og blir begravd. Over millioner av år blir de olje og gass.',
                factory: 'I dag lager en fabrikk sprengstoff av gassen.'
            },
            post: {
                far: 'Lyset flyr videre gjennom verdensrommet for alltid. Hver eneste kule finnes fortsatt!'
            },
            stories: {
                eat: {
                    name: 'Spis et eple',
                    body: 'Det meste av maten holder Joule varm. Litt driver hjernen (strøm!) og hjertet.',
                    jump: 'Hopp! Opp: bevegelse blir høyde. Ned: høyde blir bevegelse. Landing: varme.',
                    sing: 'La la la! Litt blir til lyd.',
                    spread: 'Varmen sprer seg tynt utover. Nå kan den ikke gjøre stort.',
                    space: 'Mye senere stråler den ut i verdensrommet. Alle kulene finnes fortsatt!'
                },
                stone: {
                    name: 'Stein utfor et stup',
                    start: 'Energien fra maten er inni Joule.',
                    lift: 'Sveiv! Steinen går opp. Joule blir varm.',
                    wait: 'Lagret! Energien venter i høyden.',
                    fall: 'Slipp! Høyde blir til bevegelse.',
                    crash: 'Krasj! Bevegelse blir til varme og lyd.',
                    spread: 'Varmen sprer seg tynt utover. Nå kan den ikke gjøre stort.',
                    space: 'Mye senere stråler den ut i verdensrommet. Alle kulene finnes fortsatt!'
                },
                throw: {
                    name: 'Kast en ball',
                    variants: { bouncy: 'Sprettball', clay: 'Leireball' },
                    start: 'Energien fra maten er inni Joule.',
                    throw: 'Kast! Ballen får bevegelse. Joule blir varm.',
                    bounce: 'Hvert sprett: klem, så opp igjen. Litt varme slipper ut hver gang.',
                    splat: 'Plask! All bevegelsen blir varme med én gang.',
                    rest: 'Ballen ligger stille. Energien er varme nå.',
                    spread: 'Varmen sprer seg tynt utover. Nå kan den ikke gjøre stort.',
                    space: 'Mye senere stråler den ut i verdensrommet. Alle kulene finnes fortsatt!'
                },
                scream: {
                    name: 'Skrik i en pute',
                    variants: { pillow: 'Pute', open: 'Uten pute' },
                    start: 'Energien fra maten er inni Joule.',
                    scream: 'AAAAH! Det meste gjør bare Joule varm. Bare litt blir lyd.',
                    pillow: 'Puta sluker lyden. Den blir til varme.',
                    echo: 'Lyden spretter mot stupet (ekko!) og blir til varme.',
                    spread: 'Varmen sprer seg tynt utover. Nå kan den ikke gjøre stort.',
                    space: 'Mye senere stråler den ut i verdensrommet. Alle kulene finnes fortsatt!'
                },
                blast: {
                    name: 'Sprengning i et fjell',
                    variants: { inside: 'Inni', open: 'Ute' },
                    start: 'Sprengstoffet har kjemisk energi.',
                    boom: 'BOM! Varme, lys, lyd og bevegelse på én gang.',
                    rock: 'Fjellet stopper alt. Alt blir varme i fjellet.',
                    open: 'Lyset flyr ut i verdensrommet. Steiner faller. Lyden dør ut.',
                    spread: 'Varmen sprer seg tynt utover. Nå kan den ikke gjøre stort.',
                    space: 'Over mange år stråler den ut i verdensrommet. Alle kulene finnes fortsatt!'
                }
            },
            read: {
                food: 'Mat brukt',
                height: 'Høyde',
                speed: 'Fart nederst',
                stoneWarm: 'Steinen blir varmere',
                throwSpeed: 'Kastefart',
                bounces: 'Sprett',
                ballWarm: 'Ballen blir varmere',
                soundPart: 'Ble til lyd',
                pillowWarm: 'Puta blir varmere',
                jouleWarm: 'Joule blir varmere',
                explosive: 'Sprengstoff',
                sameAs: 'Like mye energi som',
                rockWarm: 'Fjellet 5 m rundt blir varmere',
                moon: 'Lysglimtet når månen etter',
                sunNeeded: 'Sollys treet trengte',
                warmFor: 'Holder Joule varm i'
            },
            fmt: {
                apples: '{n} epler',
                apple: '1 eple',
                applePart: '1/{n} eple',
                partOf: '1 del av {n}',
                tiny: 'under en milliondels grad',
                seconds: '{n} sekunder',
                times: '{n} ganger så mye',
                minutes: '{n} minutter',
                hours: '{n} timer'
            }
        },
        ch3: {
            chip: 'Vanskelig',
            title: 'Vanskelige spørsmål',
            lead: 'Trykk på et kort for å se svaret.'
        },
        cards: [
            { q: 'Hvor blir lyset av når jeg slår av lampa?', a: 'Det har allerede truffet veggene og blitt til litt varme. Det tar under en milliondels sekund.', chain: ['electric', 'light', 'heat'] },
            { q: 'Hvis energi aldri forsvinner, hvorfor må vi spare på den?', a: 'Den sprer seg som varme som er for tynn til å bruke. Som saft helt i havet: den er der, men du kan ikke drikke den.', chain: ['chemical', 'motion', 'heat'] },
            { q: 'Hva om jeg kaster en ball i verdensrommet?', a: 'Ingenting stopper den. Den beholder bevegelsesenergien i millioner av år.', chain: ['chemical', 'motion', 'motion'] },
            { q: 'Er energien borte når mobilen går tom?', a: 'Nei. Den ble til lys fra skjermen, lyd og varme. Kjenn hvor varm mobilen blir!', chain: ['chemical', 'electric', 'light', 'heat'] },
            { q: 'Hvor kom energien i maten min fra?', a: 'Fra sola. Planter fanger sollys og lagrer det som kjemisk energi.', chain: ['nuclear', 'light', 'chemical'] },
            { q: 'Kan et svart hull ødelegge energi?', a: 'Nei. Det svarte hullet blir bare tyngre. Masse er også lagret energi.', chain: ['motion', '⚫'] },
            { q: 'Hvorfor blir hendene varme når jeg gnir dem?', a: 'Gnidningen gjør bevegelse om til varme. Atomene i huden begynner å vrikke fortere.', chain: ['chemical', 'motion', 'heat'] },
            { q: 'Hvor havner all energi til slutt?', a: 'Som varme som stråler ut i verdensrommet som usynlig lys. Det reiser videre for alltid.', chain: ['heat', 'light', '🌌'] }
        ],
        ch4: {
            chip: 'Quiz',
            title: 'Quiz',
            progress: 'Spørsmål {i} av {n}',
            pick: 'Velg et svar.',
            correct: 'Riktig!',
            wrong: 'Ikke helt.',
            next: 'Neste',
            finish: 'Se poeng',
            retry: 'Prøv igjen',
            results: [
                'Fortsett å utforske! Prøv laben igjen og tell kulene.',
                'God start! Du vet at energi skifter form.',
                'Flott! Du vet virkelig hvor energien blir av.',
                'Perfekt! Du er en energiekspert!'
            ]
        },
        quiz: [
            { q: 'Du skriker i en pute. Hvor havner det meste av energien?', a: ['Som varme i deg og puta', 'Den forsvinner', 'Den blir i puta som lyd'], why: 'Det meste varmer deg opp. Den lille biten lyd blir varme i puta.' },
            { q: 'En stein faller utfor et stup. Hva blir høydeenergien til først?', a: ['Bevegelse', 'Lyd', 'Lys'], why: 'Jo lavere den kommer, jo fortere går den. Høyde blir bevegelse.' },
            { q: 'Hvorfor spretter en sprettball lavere hver gang?', a: ['Litt energi blir varme og lyd i hvert sprett', 'Energien blir slitt opp', 'Tyngdekraften blir sterkere'], why: 'Ingenting blir slitt opp. Noen kuler slipper ut som varme og lyd i hvert sprett.' },
            { q: 'Hvilken er lagret energi?', a: ['Et oppladet batteri', 'Et høyt smell', 'Et lysglimt'], why: 'Et batteri har kjemisk energi som venter til du bruker den.' },
            { q: 'Du sykler opp en bakke. Hvor er energien på toppen?', a: ['Høydeenergi, og varme i kroppen', 'Den er borte', 'I dekkene'], why: 'En del er lagret som høyde. Resten gjorde deg varm.' },
            { q: 'Hvor havner nesten all energi til slutt?', a: ['Som varme som stråler ut i verdensrommet', 'Den forsvinner', 'I bakken for alltid'], why: 'Varmen sprer seg og stråler til slutt bort som usynlig lys.' }
        ]
    }
};
