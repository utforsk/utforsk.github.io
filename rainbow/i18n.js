'use strict';

// All user-facing text. English is the default language, Norwegian (nb) is the extra one.
const I18N = {
    en: {
        meta: {
            title: 'The Rainbow’s Secret',
            description: 'Follow Lumi, a tiny ray of sunlight, and find out how the rainbow gets its colours.'
        },
        nav: { language: 'Language' },
        hero: {
            title: 'The Rainbow’s Secret',
            lead: 'How can plain white sunlight and a few boring raindrops paint the most beautiful stripe in the sky?',
            bubble: 'Hi! I’m <b>Lumi</b>, a tiny ray of light from the Sun. I just travelled 150 million kilometres in 8 minutes to get here. Come with me into a raindrop, and I’ll show you the secret!',
            start: 'Start the journey'
        },
        common: {
            didYouKnow: 'Did you know?',
            wavelength: 'Wavelength',
            shortWaves: 'Short waves',
            longWaves: 'Long waves'
        },
        ch1: {
            chip: 'Waves',
            title: 'Light is waves',
            bubble: 'Did you know I don’t just travel in a straight line? I <b>wiggle</b> along like a snake. How long my waves are decides which colour you see!',
            canvasLabel: 'A light wave moving along. Its colour depends on the wavelength.',
            vib: 'Wiggles',
            vibSub: 'times every second',
            hair: 'Waves across one hair',
            hairSub: 'a hair is about 70,000 nm thick',
            energy: 'Energy',
            energySub: 'shorter waves carry more energy',
            oneWl: '1 wavelength = {nm} nm',
            speed: 'every colour travels 300,000 km per second',
            challengeTitle: 'Colour hunt!',
            challengeIntro: 'Can you find the wavelength of a colour? Press start, then move the slider until the wave matches the square.',
            challengeStart: 'Start colour hunt',
            challengeNew: 'New colour',
            challengeAim: 'Move the slider until the wave has the same colour as the square!',
            challengeHit: 'Hit! The colour was {nm} nm ({name}). Press “New colour” for another one.',
            nearLonger: 'Very close! A little longer waves…',
            nearShorter: 'Very close! A little shorter waves…',
            longer: 'Try longer waves (towards red).',
            shorter: 'Try shorter waves (towards violet).',
            score: 'Points',
            facts: [
                { t: 'What’s a nanometre?', p: '<b>nm</b> means nanometre: one millimetre split into a million pieces. Light waves are far too small to see. You only see the colour they make.' },
                { t: 'Same speed, different waves', p: 'All light travels equally fast. Short waves have to wiggle <b>more often</b> to keep up with long ones. That’s why blue light carries more energy than red.' },
                { t: 'Colours live in your head', p: 'The waves themselves have no colour. Your eyes have three kinds of colour sensors (cones): for <span class="c-red">red</span>, <span class="c-green">green</span> and <span class="c-blue">blue</span>. Your brain mixes their signals into the colour you see.' }
            ]
        },
        ch2: {
            chip: 'White light',
            title: 'White light is every colour at once',
            bubble: 'Here’s a secret: I look white, but I’m really a whole gang of colours travelling together! When all the colours mix, you see <b>white</b>.',
            mixTitle: 'Mix light',
            mixLabel: 'Three spotlights in red, green and blue that you can drag around and mix.',
            mixHint: 'Drag the lights. What happens where they overlap?',
            mixNote: 'The screen you’re looking at is made of millions of tiny red, green and blue lights. Look at it through a magnifying glass!',
            red: 'Red', green: 'Green', blue: 'Blue',
            yellow: 'Yellow', cyan: 'Cyan', magenta: 'Magenta', white: 'White',
            together: 'Together',
            apart: 'Apart',
            newtonTitle: 'Newton’s colour wheel',
            speed: 'Speed',
            speeds: ['still', 'slow', 'fast', 'super fast', 'lightning fast!'],
            newtonNote: 'Isaac Newton painted the rainbow colours on a disc and spun it fast. Your eyes can’t keep up, so the colours blend into almost white (light grey, because paint doesn’t glow).'
        },
        ch3: {
            chip: 'Bending',
            title: 'Light bends',
            bubble: 'When I go from air into glass or water I <b>slow down</b>, and that makes me turn. But my friends don’t turn equally much! <span class="c-violet">Violet</span> turns the most and <span class="c-red">red</span> the least. So we get split up. A raindrop does the same, and it even works like a little mirror!',
            canvasLabel: 'Light going into a prism or a raindrop and splitting into colours.',
            shape: 'Shape', prism: 'Prism', drop: 'Raindrop',
            material: 'Made of', water: 'Water', glass: 'Glass', diamond: 'Diamond',
            light: 'Light', white: 'White', one: 'One colour',
            colour: 'Colour',
            hit: 'Where the light hits',
            turn: 'Turn the prism',
            bounces: 'Bounces inside',
            b1: '1 bounce', b2: '2 bounces', many: 'Many rays',
            hintPrism: 'Tip: drag the flashlight to change the angle.',
            hintDrop: 'Tip: drag up and down in the picture to move the sunbeam.',
            note: 'The colour spread is drawn a bit bigger than in real life, so it’s easier to see.',
            air: 'air',
            step1: '1. slows down and bends',
            step2: '2. bends again on the way out',
            redLeast: 'red bends least',
            violetMost: 'violet bends most',
            sunlight: 'Sunlight',
            torch: 'Flashlight',
            dropIn: '1. bends in',
            dropBounce: '{n}. bounces',
            dropOut: '{n}. bends out',
            back: 'straight back towards the sun',
            eye: 'towards your eyes',
            hist: 'Red rays per angle',
            prismWhite: 'White light goes in. Each colour bends a different amount, so they come out fanned out like a rainbow. Diamond bends light much more than glass, and water a little less.',
            prismOne: '{name} light goes in. It bends, but it can’t split, because it is already just one colour. That’s how Newton proved that the colours come from the white light, not from the glass.',
            dropAngles: 'Red leaves at {red}°, violet at {violet}°.',
            dropOneAngle: '{name} light leaves at {a}°.',
            near1: 'Perfect! This is the biggest angle the light can get, and lots of light piles up here. This is the rainbow angle!',
            far1: 'Try to find the spot where the angle is biggest (about {max}°).',
            near2: 'With two bounces lots of light piles up around {max}°, and now violet is on the outside and red on the inside!',
            far2: 'With two bounces the special angle is about {max}°. Can you find it?',
            manyText: 'The chart shows where all the red rays go. They pile up just below {max}°. That pile of light is what you see as the rainbow!',
            miss: 'The light misses the drop. Move it.',
            facts: [
                { t: 'Like a shopping trolley', p: 'Push a trolley at an angle from asphalt onto sand. The wheel that reaches the sand first slows down first, and the trolley turns. Light does the same when it hits water or glass.' },
                { t: 'Light is slower in water', p: 'In air light travels almost 300,000 km per second. In water only about 225,000, and in diamond about 124,000. The more it slows down, the more it bends. That’s why diamonds sparkle in every colour.' },
                { t: 'Newton in 1666', p: 'Isaac Newton let sunlight through a hole in his curtain and into a prism. White light split into colours, and the colours could <b>not</b> be split any further. So white light had to be a mix.' },
                { t: 'The magic number: 42°', p: 'Wherever the light hits the drop, it never leaves with more than about <b>42 degrees</b>. And exactly there, lots of light piles up. Try <b>Many rays</b>!' },
                { t: 'Red outside, violet inside', p: 'Red leaves at about 42°, violet at about 40°. That’s why red is always on the outside and violet on the inside of the rainbow.' },
                { t: 'One drop, one colour', p: 'Every drop sends out all the colours, but in slightly different directions. From where you stand, red comes from some drops and blue from others a bit lower. A rainbow is made by millions of drops!' }
            ]
        },
        ch4: {
            chip: 'Colours',
            title: 'The seven colours',
            bubble: 'Remember them with the name <b class="mnemonic" data-word="ROY G BIV"></b>! Tap a colour to get to know it.',
            svgLabel: 'The seven colours of the rainbow. Tap a colour.',
            facts: [
                { t: 'Why exactly seven?', p: 'Newton decided the rainbow has seven colours because music has seven notes (do-re-mi-fa-so-la-ti). Really, the colours slide into each other with no sharp edges, and there are millions of shades.' },
                { t: 'Not allowed in the rainbow', p: 'Brown, pink and white are not in the rainbow. They are mixes that can’t be made from one single wavelength.' }
            ]
        },
        bands: {
            red: { name: 'Red', about: 'The longest waves you can see. Red bends least in the raindrop, so it ends up on the outside of the rainbow.', fact: 'Sunsets are red because blue light is scattered away in the air on the long way through, while red gets through.' },
            orange: { name: 'Orange', about: 'Between red and yellow. Old orange street lamps shine almost only with a single orange-yellow wavelength.', fact: 'The colour is named after the fruit. Before that, English speakers just called it “yellow-red”!' },
            yellow: { name: 'Yellow', about: 'A narrow stripe in the rainbow. Yellow looks very bright to our eyes, which is why safety vests and school buses are often yellow.', fact: 'The Sun looks yellow from Earth, but from space it looks almost white.' },
            green: { name: 'Green', about: 'In the middle of the rainbow. Your eyes are most sensitive to yellow-green light, around 555 nm.', fact: 'Plants are green because they use red and blue light to make food, and send the green back to you.' },
            blue: { name: 'Blue', about: 'Short waves that bend a lot. Blue sits inside the green in the rainbow.', fact: 'The sky is blue because air scatters blue light much more than red. Blue comes at you from every part of the sky.' },
            indigo: { name: 'Indigo', about: 'A dark blue-violet. Newton added it to get exactly seven colours, like the seven notes in music.', fact: 'Many scientists today think indigo is just dark blue, and that the rainbow could just as well have six colours.' },
            violet: { name: 'Violet', about: 'The shortest waves you can see. Violet bends most and ends up on the inside of the rainbow.', fact: 'Just inside violet is ultraviolet (UV) light. You can’t see it, but it gives you sunburn. Bees can see it!' }
        },
        ch5: {
            chip: 'Rainbow lab',
            title: 'The rainbow lab',
            bubble: 'Remember how the drop sends me almost straight back where I came from? So the <b>sun has to be behind you</b> and the <b>rain in front of you</b>. Move the sun, change the weather and the drops, and see when a rainbow shows up and when it doesn’t!',
            viewTitle: 'What you see',
            viewLabel: 'The view towards the rain, with the rainbow.',
            mapTitle: 'Seen from above',
            mapLabel: 'Map seen from above: you, the sun and the rain. Drag the sun around you.',
            mapHint: 'Drag the sun around you',
            sideTitle: 'Seen from the side',
            sideLabel: 'Side view: the sun, you and the rainbow angle. Drag the sun up and down.',
            sideHint: 'Drag the sun up and down',
            presets: 'Quick settings',
            presetHint: 'These only move the controls below. Watch which ones change!',
            dropTitle: 'Inside one raindrop',
            dropHint: 'Follow the light',
            dropLabel: 'One raindrop up close: the light bends in, bounces inside and comes out at 42° (one bounce) or 51° (two bounces).',
            whereLabel: 'Where are you?', whereGround: 'On the ground', wherePlane: 'In a plane',
            sourceLabel: 'Where does the light come from?', sourceSun: 'The sun', sourceMoon: 'The moon (night)',
            showLabel: 'Show',
            sunHeight: 'How high is the sun?',
            sunDir: 'Where is the sun?',
            moonHeight: 'How high is the moon?',
            moonDir: 'Where is the moon?',
            clear: 'How clear is the light?', clearLow: 'Behind clouds', clearHigh: 'Clear',
            dark: 'Sky behind the rain', darkLow: 'Bright clouds', darkHigh: 'Dark storm clouds',
            rainAmount: 'How much rain?', rainLow: 'None', rainHigh: 'Heavy shower',
            levels: {
                clear: ['behind thick clouds', 'hazy', 'a little hazy', 'clear'],
                dark: ['bright white', 'light grey', 'dark grey', 'dark as a storm'],
                rain: ['none', 'a few drops', 'a shower', 'a heavy shower']
            },
            dropSize: 'Drop size',
            low: 'Morning / evening',
            high: 'Middle of the day',
            dirLeft: 'Left', dirBehind: 'Behind you', dirRight: 'Right',
            dropFog: 'Fog', dropRain: 'Big drops',
            helpers: 'Helper lines',
            dir: {
                behind: 'behind you', behindRight: 'behind you, to the right', behindLeft: 'behind you, to the left',
                right: 'to your right', left: 'to your left',
                frontRight: 'in front of you, to the right', frontLeft: 'in front of you, to the left', front: 'in front of you'
            },
            drops: { fog: 'fog', drizzle: 'drizzle', rain: 'rain', heavy: 'heavy rain' },
            preset: { normal: 'Normal', double: 'Double', extra: 'Extra bows', fog: 'Fogbow', red: 'Red rainbow', moon: 'Moonbow', plane: 'From a plane', glory: 'Glory', noon: 'Midday sun', front: 'Sun in front' },
            sit: {
                behind: '{light} is behind you, so the rainbow is straight ahead, centred on the shadow of your head.',
                side: '{light} is {dir}. The centre of the rainbow always moves the opposite way, so you only see part of the bow towards the {side}.',
                sideLeft: 'left', sideRight: 'right',
                away: '{light} is {dir}. Now the centre of the rainbow is behind you, where there is no rain. The drops in front of you send their colours back towards {lightLow}, not to you. No rainbow!',
                height: '{light} is {e}° up, so the top of the rainbow is about {top}° above the horizon. The lower {lightLow}, the taller the bow.',
                horizon: '{light} is right at the horizon, so the rainbow is almost a whole half circle.',
                tooHigh: '{light} is {e}° up. That’s higher than 42°, so the main rainbow sinks below the ground.',
                secondPeek: 'But the second bow sits higher, at 51°, so its top still peeks over the horizon!',
                hazy: 'Clouds are in front of {lightLow}, so the light is weak and the rainbow is faint. A rainbow needs bright light and rain at the same time.',
                brightBack: 'The sky behind the rain is bright, so the rainbow doesn’t stand out. Rainbows look best against dark clouds.',
                fewDrops: 'Only a few drops are falling, so the rainbow is thin and faint. More drops send more coloured light to you.',
                secondHidden: 'There is always a second bow outside the first one, at about 51°. But some light is lost at every bounce, so it’s much fainter. To see it you need clear light, dark clouds behind the rain and lots of rain.',
                noRain: 'There is no rain, so there are no drops to bend the light. No drops, no rainbow! Turn up the rain.',
                planeHigh: 'The sun is {e}° up, so the whole circle is below the horizon, down in the rain. On the ground this sun would be too high, but from up here it’s perfect!',
                planeLow: 'The sun is only {e}° up, so the top of the circle would be above the horizon, where there is no rain below you. Raise the sun above 42° to see the whole circle.',
                planeAway: 'The sun is {dir}, so the plane’s shadow and the rainbow are on the other side. Look out of a window on the other side of the plane!',
                glory: 'The tiny cloud droplets also make small coloured rings right around the plane’s shadow. That’s called a glory. Big raindrops don’t make one.',
                red: 'The light goes through lots of air when the sun is this low. Blue and green get scattered away on the way, so the rainbow turns red and orange.',
                fog: 'The drops are tiny ({size}), like in fog. The colours smear out and the bow turns broad and white: a fogbow.',
                small: 'Smallish drops ({size}) give paler colours, and faint pink and green extra bows just inside the violet.',
                big: 'Big raindrops ({size}) give bright, clear colours.',
                second: 'Now you can see the second bow! Light that bounces twice makes the outer bow at about 51°. Its colours are the other way round, and the sky between the bows is darker. That dark stripe is called Alexander’s band.',
                moon: 'Moonlight is sunlight bouncing off the Moon. A moonbow is so faint that it looks almost white to us, because our eyes are bad at seeing colours in the dark. A camera can show the colours.',
                plane: 'You are in a plane, high above the rain. The ground isn’t in the way, so the rainbow can be a whole circle around the plane’s shadow.'
            },
            you: 'You', sun: 'Sun', moonLabel: 'Moon', rain: 'Rain',
            sunNoun: 'The sun', sunNounLow: 'the sun', moonNoun: 'The moon', moonNounLow: 'the moon',
            youPlane: 'You (in the plane)', planeShadow: 'the plane’s shadow', rainBelow: 'Rain below you', noRainShort: 'No rain',
            noDrops: 'No rain, no rainbow!',
            dropSunlight: 'sunlight', dropMoonlight: 'moonlight',
            dropBounce1: '1 bounce: main bow', dropBounce2: '2 bounces: second bow',
            dropToYou: 'to you', dropMiss: 'You are this way. The colours miss you!',
            dropNone: 'No rain, no drops!',
            dropSizeIs: 'Drop: {size}.',
            dropNoteBig: 'Big drop: sharp colours.', dropNoteFog: 'Tiny drop: the colours smear into white.', dropNoteSup: 'Small drop: extra stripes.',
            shadow: 'shadow of your head',
            centre: 'centre of the rainbow',
            noRain: 'no rain here',
            tooHigh: 'The sun is too high! The rainbow is below the ground.',
            view: 'what you see',
            facts: [
                { t: 'You never reach the end', p: 'A rainbow isn’t a thing standing somewhere. It’s an angle! When you walk, it moves with you. That’s why nobody finds the pot of gold.' },
                { t: 'Brighter inside', p: 'The sky inside the rainbow is brighter than outside. That’s all the light that leaves the drops at less than 42 degrees.' },
                { t: 'Your very own rainbow', p: 'The light from each drop reaches only one eye. The person next to you sees light from completely different drops. Everyone sees their own rainbow!' },
                { t: 'Best time', p: 'Morning and late afternoon. In the middle of a summer day the sun is higher than 42° in many places, and the whole rainbow ends up below the ground.' }
            ]
        },
        ch6: {
            chip: 'Invisible light',
            title: 'The light you can’t see',
            bubble: 'I have lots of brothers and sisters you can’t see! Radio waves, microwaves, X-rays… They are all the same kind of wave as me, just longer or shorter. The colours you see are only a <b>tiny stripe</b> of our family.',
            sliderLabel: 'Choose a wavelength in the spectrum',
            canvasLabel: 'The wave travelling from the thing that sends it to the thing that catches it.',
            longEnd: 'Long waves, low frequency',
            shortEnd: 'Short waves, high frequency',
            barHint: 'Tap an icon or a part of the bar to jump there.',
            cellWl: 'Wavelength',
            cellFreq: 'Wiggles per second',
            cellSize: 'About as long as',
            cellEnergy: 'Energy',
            cellDanger: 'Dangerous?',
            sendTitle: 'How do we send and catch it?',
            usesTitle: 'Things that use it',
            sentBy: 'Sent by',
            caughtBy: 'Caught by',
            antenna: 'A good antenna for this wave is about <b>{len}</b> long (half a wavelength).',
            freqWords: ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion'],
            extremesTitle: 'The longest and the shortest',
            facts: [
                { t: 'The longest waves', p: 'Waves can be longer than the whole Earth! Lightning makes the whole planet “ring” with waves about 38,000 km long, 8 times every second. Navies have used waves thousands of kilometres long to talk to submarines, because they go deep into sea water.' },
                { t: 'Why don’t we use them more?', p: 'An antenna should be about half a wavelength long, so the submarine antennas were many kilometres long. And a slow wave carries very little information: sending a few letters could take minutes.' },
                { t: 'The shortest waves', p: 'The shortest gamma rays come from exploding stars and the areas around black holes. Their waves are smaller than the centre of an atom, with hundreds of trillions of times more energy than the light you see.' },
                { t: 'Why don’t we use them?', p: 'They are very hard to make and control, they go straight through almost everything, and they damage living cells. Luckily the air high above us stops them before they reach the ground.' },
                { t: 'Is there an end?', p: 'Nobody knows of a longest or shortest possible wave. Scientists think there might be a smallest length in the universe, but it is so tiny that an atom is to it like the whole universe is to an atom.' }
            ]
        },
        regions: {
            radio: {
                name: 'Radio waves', short: 'Radio',
                uses: 'Radio, TV, walkie-talkies, radio-controlled clocks and signals from space probes.',
                fact: 'Radio telescopes listen for radio waves from stars and galaxies far out in space.',
                danger: 'Harmless',
                how: 'Electricity rushes back and forth in a metal rod, the <b>antenna</b>, and shakes off radio waves. When the waves hit another antenna, they make the electricity in it rush back and forth too. A radio turns that into sound.',
                sentBy: 'radio mast', caughtBy: 'radio'
            },
            micro: {
                name: 'Microwaves', short: 'Micro',
                uses: 'Mobile phones, Wi-Fi, Bluetooth, radar, satellite TV and the microwave oven.',
                fact: 'A microwave oven makes the water in the food shake, and then the food gets warm.',
                danger: 'Harmless in normal amounts',
                how: 'Microwaves are sent and caught by small antennas, often hidden inside the phone or router. Bowl-shaped <b>dishes</b> collect weak microwaves from satellites, like a big ear.',
                sentBy: 'Wi-Fi router', caughtBy: 'phone'
            },
            ir: {
                name: 'Infrared', short: 'Infrared',
                uses: 'Heat! Remote controls, heat cameras and night vision.',
                fact: 'You feel infrared as heat from the sun and a fireplace. Rattlesnakes can “see” the heat of a mouse in total darkness.',
                danger: 'Harmless (but can be hot!)',
                how: 'Everything warm glows in infrared, even you! A remote control has a small <b>infrared lamp</b> (LED) that blinks a code. A tiny light sensor in the TV catches the blinks.',
                sentBy: 'remote control', caughtBy: 'TV'
            },
            visible: {
                name: 'Visible light', short: 'Visible',
                uses: 'Everything you see with your eyes: rainbows, flowers, screens and lamps.',
                fact: 'Visible light is only a tiny piece of the whole spectrum, but it is exactly what the Sun shines most of.',
                danger: 'Harmless (but never look straight at the sun)',
                how: 'The Sun, lamps and screens send it out. Your <b>eyes</b> catch it with millions of light sensors, and a camera does the same with a sensor chip.',
                sentBy: 'the Sun', caughtBy: 'your eyes'
            },
            uv: {
                name: 'Ultraviolet', short: 'UV',
                uses: 'Causes sunburn, kills germs, and bees can see it!',
                fact: 'Many flowers have UV patterns that show bees the way to the nectar. The patterns are invisible to us.',
                danger: 'Can hurt skin and eyes: use sunscreen and sunglasses',
                how: 'The Sun sends lots of UV, and special UV lamps make it too. Special sensors catch it, and some materials <b>glow</b> in visible light when UV hits them. That’s how “black light” works.',
                sentBy: 'the Sun', caughtBy: 'sunscreen and skin'
            },
            xray: {
                name: 'X-rays', short: 'X-ray',
                uses: 'X-ray pictures at the doctor and dentist, and bag scanners at the airport.',
                fact: 'X-rays go easily through skin and muscle, but bones stop more of them. That’s why you see the skeleton in the picture.',
                danger: 'Dangerous in large amounts. Doctors only use a little.',
                how: 'An <b>X-ray tube</b> shoots super-fast electrons at a metal plate, and the crash makes X-rays. A detector plate on the other side catches the ones that get through your body.',
                sentBy: 'X-ray tube', caughtBy: 'detector plate'
            },
            gamma: {
                name: 'Gamma rays', short: 'Gamma',
                uses: 'Come from radioactive materials and huge explosions in space.',
                fact: 'Hospitals use gamma rays to destroy cancer cells and to make medical equipment completely clean.',
                danger: 'Very dangerous: can damage the cells in your body',
                how: 'Gamma rays come from the <b>centre of atoms</b> when they change, and from exploding stars. Special crystals flash with tiny sparks of light when gamma rays hit them, and a detector counts the flashes.',
                sentBy: 'radioactive atoms', caughtBy: 'gamma detector'
            }
        },
        devices: {
            schumann: 'Lightning makes Earth ring',
            submarine: 'Submarine radio',
            clock: 'Radio-controlled clock',
            am: 'AM radio',
            fm: 'FM / DAB radio',
            tv: 'TV antenna',
            phone: 'Mobile phone',
            oven: 'Microwave oven',
            wifi: 'Wi-Fi',
            satellite: 'Satellite TV',
            radar: 'Car radar',
            body: 'Heat from your body',
            remote: 'TV remote',
            eye: 'Your eyes',
            bee: 'Bees see it',
            sunburn: 'Sunburn',
            germ: 'Germ-killing lamp',
            dentist: 'Dentist X-ray',
            atom: 'Radioactive atoms',
            hospital: 'Cancer treatment',
            star: 'Exploding stars'
        },
        sizes: {
            8: 'eight Earths side by side', 7: 'the whole Earth', 6: 'Paris to Rome', 5: 'a 1-hour car trip',
            4: 'a bit more than Mount Everest', 3: 'ten football pitches in a row', 2: 'a football pitch', 1: 'a bus',
            0: 'a child', '-1': 'a mobile phone', '-2': 'a blueberry', '-3': 'a grain of sand', '-4': 'the thickness of a hair',
            '-5': 'a red blood cell', '-6': 'a bacterium', '-7': 'a virus', '-8': 'a big molecule', '-9': 'a small molecule',
            '-10': 'an atom', '-11': 'a tenth of an atom', '-12': 'a hundredth of an atom', '-13': 'a thousandth of an atom',
            '-14': 'the centre of an atom', '-15': 'a proton'
        },
        ch7: {
            chip: 'Animal eyes',
            title: 'The rainbow through animal eyes',
            bubble: 'Raindrops also send out <b>ultraviolet</b> light inside the violet and <b>infrared</b> outside the red. You can’t see them, but some animals can! What do you think a rainbow looks like to a bee?',
            canvasLabel: 'Close-up of the rainbow as the chosen animal sees it.',
            compare: 'Compare with your eyes',
            you: 'You',
            note: 'A screen can only make colours you can see, so ultraviolet is shown as a glittering stripe and infrared as a glowing one.'
        },
        animals: {
            human: { name: 'Human', title: 'How you see the rainbow', text: 'You have three kinds of colour sensors in your eyes (cones): for red, green and blue. You see everything from violet to red. Ultraviolet and infrared are invisible to you, even though they are there.' },
            bee: { name: 'Bee', title: 'How a bee sees the rainbow', text: 'Bees also have three colour sensors, but for ultraviolet, blue and green. They see an extra stripe inside the violet. But red looks almost black to a bee! Many flowers have UV patterns that only bees can see, like landing lights for nectar.' },
            bird: { name: 'Bird', title: 'How a bird sees the rainbow', text: 'Many birds have four colour sensors, one of them for ultraviolet. They see all your colours plus UV, and stronger colours than you. Blue tits have UV patterns in their feathers that other blue tits can see, but we can’t.' },
            dog: { name: 'Dog', title: 'How a dog sees the rainbow', text: 'Dogs only have two colour sensors. They see the rainbow as blue and yellow, with a greyish stripe in between. Red and green look quite alike. So buy your dog a blue or yellow ball, not a red one!' },
            colourblind: { name: 'Colour-blind', title: 'Red-green colour-blind', text: 'About 1 in 12 boys and 1 in 200 girls are red-green colour-blind. Red, orange, yellow and green look more alike to them. Many hardly notice it in everyday life, but telling red and green lights apart can be hard.' },
            snake: { name: 'Rattlesnake', title: 'How a rattlesnake might see the rainbow', text: 'Rattlesnakes have small pits on their face that feel infrared heat. That’s how they find a warm mouse in total darkness. But the rainbow’s infrared has much shorter waves than the heat from a mouse, so the snake would barely feel it. Its colour vision is probably like a dog’s.' },
            shrimp: { name: 'Mantis shrimp', title: 'How a mantis shrimp sees the rainbow', text: 'The mantis shrimp has 12 to 16 kinds of colour sensors. You only have 3! It sees ultraviolet too. But scientists found something strange: it is actually worse than you at telling similar colours apart. It recognises colours super fast in “steps” instead of mixing them.' }
        },
        ch8: {
            chip: 'Try it',
            title: 'Try it yourself',
            bubble: 'Now you know the secret, so you can make rainbows and find invisible light yourself! But remember: <b>never look straight at the sun</b>. It can hurt your eyes.',
            need: 'You need',
            how: 'How to do it',
            why: 'What happens?'
        },
        experiments: [
            {
                icon: 'drop', title: 'Garden hose rainbow',
                need: ['A sunny day', 'A garden hose with a spray nozzle'],
                steps: ['Stand with the sun at your back.', 'Spray a fine mist in front of you, a bit up in the air.', 'Find the shadow of your head and look about 42° out from it.'],
                why: 'The tiny water drops work just like raindrops. Move the spray around: the rainbow always stays at the same angle from your shadow.'
            },
            {
                icon: 'angle', title: 'Measure 42° with your hand',
                need: ['Your hand', 'A rainbow (or the hose rainbow)'],
                steps: ['Stretch your arm all the way out and spread your fingers wide.', 'From thumb tip to little finger tip is about 20°.', 'Put your thumb on the shadow of your head and count two hand spans.'],
                why: 'Two hand spans is about 40°, so you land right on the rainbow. Try it with a real rainbow and check!'
            },
            {
                icon: 'eye', title: 'See the invisible light of a remote',
                need: ['A TV remote control', 'A phone with a camera'],
                steps: ['Open the camera. Try the front (selfie) camera first: many back cameras block infrared.', 'Point the remote straight at the camera.', 'Press and hold a button while you look at the screen.'],
                why: 'You will see the tip of the remote blink! The remote sends infrared light your eyes can’t see, but the camera sensor can. Try a TV remote on the regular camera too and compare.'
            },
            {
                icon: 'split', title: 'Rainbow from a glass of water',
                need: ['A clear glass full of water', 'A sunny window', 'A white sheet of paper'],
                steps: ['Put the glass on the edge of a sunny windowsill.', 'Put the paper on the floor where the light lands.', 'Move the paper and the glass until a small rainbow appears.'],
                why: 'The water bends the sunlight like a prism, and each colour bends a different amount.'
            },
            {
                icon: 'sun', title: 'Mirror in a bowl of water',
                need: ['A small mirror', 'A bowl of water', 'Sunshine or a strong flashlight'],
                steps: ['Lean the mirror at an angle into the water.', 'Let the light hit the mirror under the water.', 'Look for a rainbow on the wall or ceiling. Move the mirror slowly.'],
                why: 'The light bends into the water, bounces off the mirror and bends again on the way out. That is almost exactly what happens in a raindrop!'
            },
            {
                icon: 'palette', title: 'Make Newton’s colour wheel',
                need: ['White cardboard', 'Coloured pens', 'A pencil', 'Scissors'],
                steps: ['Cut out a circle and split it into seven slices.', 'Colour the slices red, orange, yellow, green, blue, indigo and violet.', 'Push a pencil through the middle and spin it like a top.'],
                why: 'When it spins fast, your eyes can’t keep up, and the colours blend into a pale grey-white.'
            },
            {
                icon: 'wave', title: 'Blue sky and red sunset in a glass',
                need: ['A tall glass of water', 'A few drops of milk', 'A flashlight', 'A dark room'],
                steps: ['Stir a few drops of milk into the water.', 'Shine the flashlight through the glass from the side.', 'Look at the glass from the side, then from the end opposite the flashlight.'],
                why: 'From the side the water looks a little blue, and from the end the light looks orange. The tiny milk bits scatter blue light more than red, just like the air does with sunlight.'
            },
            {
                icon: 'spark', title: 'Glowing tonic water',
                need: ['Tonic water (with quinine)', 'A clear glass', 'Sunlight or a UV torch', 'A dark background'],
                steps: ['Pour tonic water into the glass.', 'Hold it in bright sunlight in front of something dark, or shine a UV torch on it in the dark.', 'Look for a blue glow, especially near the surface where the light enters.'],
                why: 'The quinine in tonic water catches invisible ultraviolet light and sends it out again as blue light you can see.'
            },
            {
                icon: 'question', title: 'The CD trick',
                need: ['An old CD or DVD', 'A lamp or sunlight'],
                steps: ['Hold the shiny side towards the light.', 'Tilt it slowly and watch the colours move.'],
                why: 'This rainbow is made a different way! Tiny grooves on the disc make light waves strengthen and cancel each other, and that sorts the colours.'
            }
        ],
        ch9: {
            chip: 'Quiz',
            title: 'Rainbow quiz',
            bubble: 'Have you been paying attention? Take the quiz and become a <b>rainbow expert</b>!',
            progress: 'Question {i} of {n} · Points: {s}',
            pick: 'Choose an answer.',
            correct: 'Correct!',
            wrong: 'Not quite.',
            next: 'Next question',
            finish: 'See the result',
            retry: 'Try again',
            results: ['Great start! Go through the chapters and try again.', 'Well done! Read a bit more and try again.', 'Brilliant! You know a lot about light and rainbows.', 'Amazing! You are a real rainbow expert!']
        },
        quiz: [
            { q: 'Where must the sun be when you see a rainbow?', a: ['Behind you', 'In front of you', 'Straight above you'], why: 'Raindrops send the light almost straight back where it came from. With the sun behind you, the colours land right in your eyes.' },
            { q: 'Which colour is on the outside of a normal rainbow?', a: ['Red', 'Violet', 'Green'], why: 'Red bends least and leaves the drop at about 42°, the biggest angle. So red is on the outside.' },
            { q: 'Which colour has the shortest wavelength?', a: ['Violet', 'Red', 'Yellow'], why: 'Violet has the shortest waves we can see, about 400 nm. Red has the longest, about 700 nm.' },
            { q: 'What is white sunlight really?', a: ['All colours mixed together', 'Only yellow light', 'Light with no colours'], why: 'Newton showed it with a prism: white light is a mix of all the rainbow colours.' },
            { q: 'How many degrees from the shadow of your head is the rainbow?', a: ['About 42°', 'About 90°', 'About 10°'], why: 'Light leaves the drop at most at about 42°, and that’s where most light piles up.' },
            { q: 'Why are the colours reversed in the outer bow of a double rainbow?', a: ['The light bounces twice inside the drop', 'It is reflected in the clouds', 'There is a second sun'], why: 'The extra bounce flips the order, so red ends up on the inside of the outer bow.' },
            { q: 'Which animal can see ultraviolet light?', a: ['Bee', 'Human', 'No animal can'], why: 'Bees (and many birds) have their own colour sensor for UV. They see an extra stripe in the rainbow.' },
            { q: 'Which of these is the same kind of wave as light?', a: ['Radio waves', 'Sound waves', 'Ocean waves'], why: 'Radio waves, microwaves, X-rays and visible light are all electromagnetic waves. Sound and ocean waves are something completely different.' },
            { q: 'Can you walk to the end of the rainbow?', a: ['No, it moves with you', 'Yes, there’s a pot of gold', 'Yes, if you run fast enough'], why: 'The rainbow is an angle seen from your eyes, not a thing. When you move, it moves too.' },
            { q: 'Why do you rarely see a rainbow in the middle of a summer day?', a: ['The sun is too high', 'It is too warm', 'The raindrops are too big'], why: 'When the sun is higher than about 42°, the whole rainbow ends up below the ground.' }
        ],
        footer: { partOf: 'Part of' }
    },

    nb: {
        meta: {
            title: 'Regnbuens hemmelighet',
            description: 'Bli med lysstrålen Lumi og finn ut hvordan regnbuen får fargene sine.'
        },
        nav: { language: 'Språk' },
        hero: {
            title: 'Regnbuens hemmelighet',
            lead: 'Hvordan kan vanlig, hvitt sollys og noen kjedelige regndråper lage den fineste fargestripa på himmelen?',
            bubble: 'Hei! Jeg heter <b>Lumi</b>, og jeg er en bitte liten lysstråle fra sola. Jeg har reist 150 millioner kilometer på 8 minutter for å komme hit. Bli med meg inn i en regndråpe, så skal jeg vise deg hemmeligheten!',
            start: 'Start reisen'
        },
        common: {
            didYouKnow: 'Visste du?',
            wavelength: 'Bølgelengde',
            shortWaves: 'Korte bølger',
            longWaves: 'Lange bølger'
        },
        ch1: {
            chip: 'Bølger',
            title: 'Lys er bølger',
            bubble: 'Visste du at jeg ikke bare reiser rett frem? Jeg <b>bølger</b> meg av gårde, litt som en slange. Hvor lange bølgene mine er bestemmer hvilken farge du ser!',
            canvasLabel: 'En lysbølge som beveger seg. Fargen avhenger av bølgelengden.',
            vib: 'Svinger',
            vibSub: 'ganger hvert sekund',
            hair: 'Bølger på tvers av ett hårstrå',
            hairSub: 'et hårstrå er ca. 70 000 nm tykt',
            energy: 'Energi',
            energySub: 'kortere bølger har mer energi',
            oneWl: '1 bølgelengde = {nm} nm',
            speed: 'alle farger reiser 300 000 km i sekundet',
            challengeTitle: 'Fargejakt!',
            challengeIntro: 'Klarer du å finne bølgelengden til en farge? Trykk start, og flytt glideren til bølgen har samme farge som ruta.',
            challengeStart: 'Start fargejakt',
            challengeNew: 'Ny farge',
            challengeAim: 'Flytt glideren til bølgen har samme farge som ruta!',
            challengeHit: 'Treff! Fargen var {nm} nm ({name}). Trykk «Ny farge» for en ny.',
            nearLonger: 'Nesten! Litt lengre bølger …',
            nearShorter: 'Nesten! Litt kortere bølger …',
            longer: 'Prøv lengre bølger (mot rødt).',
            shorter: 'Prøv kortere bølger (mot fiolett).',
            score: 'Poeng',
            facts: [
                { t: 'Hva er en nanometer?', p: '<b>nm</b> betyr nanometer: en millimeter delt i en million biter. Lysbølger er altfor små til å se. Du ser bare fargen de lager.' },
                { t: 'Like fort, ulike bølger', p: 'Alt lys reiser like fort. Korte bølger må svinge <b>oftere</b> for å holde følge med de lange. Derfor har blått lys mer energi enn rødt.' },
                { t: 'Farger finnes i hodet', p: 'Bølgene har egentlig ingen farge. Øynene dine har tre slags fargesensorer (tapper): for <span class="c-red">rødt</span>, <span class="c-green">grønt</span> og <span class="c-blue">blått</span>. Hjernen blander signalene til fargen du ser.' }
            ]
        },
        ch2: {
            chip: 'Hvitt lys',
            title: 'Hvitt lys er alle farger på en gang',
            bubble: 'Her er en hemmelighet: Jeg ser hvit ut, men jeg er egentlig en hel gjeng med farger som reiser sammen! Når alle fargene blandes, ser du <b>hvitt</b>.',
            mixTitle: 'Bland lys',
            mixLabel: 'Tre lyskastere i rødt, grønt og blått som kan dras rundt og blandes.',
            mixHint: 'Dra i lysene. Hva skjer der de overlapper?',
            mixNote: 'Skjermen du ser på nå er laget av millioner av bitte små røde, grønne og blå lys. Se på den med et forstørrelsesglass!',
            red: 'Rød', green: 'Grønn', blue: 'Blå',
            yellow: 'Gul', cyan: 'Turkis', magenta: 'Lilla', white: 'Hvit',
            together: 'Samle',
            apart: 'Spre',
            newtonTitle: 'Newtons fargehjul',
            speed: 'Fart',
            speeds: ['stille', 'sakte', 'fort', 'superfort', 'lynfort!'],
            newtonNote: 'Isaac Newton malte regnbuefargene på en skive og snurret den fort. Øynene klarer ikke å følge med, så fargene blandes til nesten hvitt (lysegrått, fordi maling ikke lyser).'
        },
        ch3: {
            chip: 'Lys bøyes',
            title: 'Lyset bøyer seg',
            bubble: 'Når jeg går fra luft inn i glass eller vann, <b>bremser</b> jeg ned, og da svinger jeg. Men vennene mine svinger ikke like mye! <span class="c-violet">Fiolett</span> svinger mest, <span class="c-red">rødt</span> minst. Da blir vi skilt fra hverandre. En regndråpe gjør det samme, og den virker til og med som et lite speil!',
            canvasLabel: 'Lys som går inn i et prisme eller en regndråpe og deles i farger.',
            shape: 'Form', prism: 'Prisme', drop: 'Regndråpe',
            material: 'Laget av', water: 'Vann', glass: 'Glass', diamond: 'Diamant',
            light: 'Lys', white: 'Hvitt', one: 'Én farge',
            colour: 'Farge',
            hit: 'Hvor lyset treffer',
            turn: 'Vri prismet',
            bounces: 'Sprett inni',
            b1: '1 sprett', b2: '2 sprett', many: 'Mange stråler',
            hintPrism: 'Tips: dra i lommelykta for å endre vinkelen.',
            hintDrop: 'Tips: dra opp og ned i bildet for å flytte solstrålen.',
            note: 'Fargespredningen er tegnet litt større enn i virkeligheten, så den er lettere å se.',
            air: 'luft',
            step1: '1. bremser og bøyer seg',
            step2: '2. bøyer seg igjen på vei ut',
            redLeast: 'rødt bøyes minst',
            violetMost: 'fiolett bøyes mest',
            sunlight: 'Sollys',
            torch: 'Lommelykt',
            dropIn: '1. bøyes inn',
            dropBounce: '{n}. spretter',
            dropOut: '{n}. bøyes ut',
            back: 'rett tilbake mot sola',
            eye: 'mot øynene dine',
            hist: 'Røde stråler per vinkel',
            prismWhite: 'Hvitt lys går inn. Hver farge bøyes ulikt, så de kommer ut som en vifte av regnbuefarger. Diamant bøyer lyset mye mer enn glass, og vann litt mindre.',
            prismOne: 'Lys med fargen {lname} går inn. Det bøyer seg, men kan ikke deles, fordi det allerede er bare én farge. Slik beviste Newton at fargene kommer fra det hvite lyset, ikke fra glasset.',
            dropAngles: 'Rødt kommer ut med {red}°, fiolett med {violet}°.',
            dropOneAngle: 'Lys med fargen {lname} kommer ut med {a}°.',
            near1: 'Perfekt! Dette er den største vinkelen lyset kan få, og her hoper det seg opp masse lys. Dette er regnbuevinkelen!',
            far1: 'Prøv å finne stedet der vinkelen blir størst (ca. {max}°).',
            near2: 'Med to sprett hoper lyset seg opp rundt {max}°, og nå er fiolett ytterst og rødt innerst!',
            far2: 'Med to sprett er den spesielle vinkelen ca. {max}°. Finner du den?',
            manyText: 'Diagrammet viser hvor alle de røde strålene går. De hoper seg opp rett under {max}°. Den lysklumpen er det du ser som regnbuen!',
            miss: 'Lyset bommer på dråpen. Flytt det.',
            facts: [
                { t: 'Som en handlevogn', p: 'Trill en handlevogn skrått fra asfalt inn i sand. Hjulet som treffer sanden først, bremser først, og vogna svinger. Lyset gjør det samme når det treffer vann eller glass.' },
                { t: 'Lyset er tregere i vann', p: 'I luft går lyset nesten 300 000 km i sekundet. I vann bare ca. 225 000, og i diamant ca. 124 000. Jo mer det bremser, jo mer bøyer det seg. Derfor glitrer diamanter i alle farger.' },
                { t: 'Newton i 1666', p: 'Isaac Newton slapp sollys gjennom et hull i gardinen og inn i et prisme. Hvitt lys ble delt i farger, og fargene kunne <b>ikke</b> deles mer. Da måtte hvitt lys være en blanding.' },
                { t: 'Det magiske tallet: 42°', p: 'Uansett hvor lyset treffer dråpen, kommer det aldri ut med mer enn ca. <b>42 grader</b>. Og akkurat der hoper det seg opp masse lys. Prøv <b>Mange stråler</b>!' },
                { t: 'Rødt ute, fiolett inni', p: 'Rødt kommer ut med ca. 42°, fiolett med ca. 40°. Derfor er rødt alltid ytterst og fiolett innerst i regnbuen.' },
                { t: 'Én dråpe, én farge', p: 'Hver dråpe sender ut alle fargene, men i litt ulike retninger. Fra der du står, kommer rødt fra noen dråper og blått fra andre litt lenger ned. Regnbuen er laget av millioner av dråper!' }
            ]
        },
        ch4: {
            chip: 'Fargene',
            title: 'Regnbuens sju farger',
            bubble: 'Husk dem med det rare ordet <b class="mnemonic" data-word="ROGGBIF"></b>! Trykk på en farge for å bli kjent med den.',
            svgLabel: 'Regnbuens sju farger. Trykk på en farge.',
            facts: [
                { t: 'Hvorfor akkurat sju?', p: 'Newton bestemte at regnbuen har sju farger fordi musikk har sju toner (do-re-mi-fa-so-la-ti). Egentlig glir fargene over i hverandre uten skarpe grenser, og det finnes millioner av nyanser.' },
                { t: 'Ikke med i regnbuen', p: 'Brunt, rosa og hvitt finnes ikke i regnbuen. De er blandinger som ikke kan lages av én enkelt bølgelengde.' }
            ]
        },
        bands: {
            red: { name: 'Rød', about: 'De lengste bølgene du kan se. Rødt bøyes minst i regndråpen, og havner derfor ytterst i regnbuen.', fact: 'Solnedganger er røde fordi blått lys blir spredt bort i lufta på den lange veien, mens rødt kommer gjennom.' },
            orange: { name: 'Oransje', about: 'Mellom rødt og gult. Gamle oransje gatelys lyser nesten bare med én oransje-gul bølgelengde.', fact: 'Fargen har fått navnet fra appelsin, som heter «orange» på fransk og engelsk.' },
            yellow: { name: 'Gul', about: 'En smal stripe i regnbuen. Gult virker veldig lyst for øynene våre, derfor er refleksvester og skolebusser ofte gule.', fact: 'Sola ser gul ut fra jorda, men fra verdensrommet ser den nesten hvit ut.' },
            green: { name: 'Grønn', about: 'Midt i regnbuen. Øynene dine er mest følsomme for gulgrønt lys, rundt 555 nm.', fact: 'Planter er grønne fordi de bruker rødt og blått lys til å lage mat, og sender det grønne tilbake til deg.' },
            blue: { name: 'Blå', about: 'Korte bølger som bøyes mye. Blått ligger innenfor grønt i regnbuen.', fact: 'Himmelen er blå fordi lufta sprer blått lys mye mer enn rødt. Blått kommer mot deg fra hele himmelen.' },
            indigo: { name: 'Indigo', about: 'En mørk blåfiolett farge. Newton la den til for å få akkurat sju farger, som sju toner i musikken.', fact: 'Mange forskere mener i dag at indigo bare er mørkeblått, og at regnbuen like gjerne kunne hatt seks farger.' },
            violet: { name: 'Fiolett', about: 'De korteste bølgene du kan se. Fiolett bøyes mest og havner innerst i regnbuen.', fact: 'Rett innenfor fiolett er ultrafiolett (UV) lys. Du ser det ikke, men det gir solbrenthet. Bier kan se det!' }
        },
        ch5: {
            chip: 'Regnbuelab',
            title: 'Regnbuelaben',
            bubble: 'Husker du at dråpen sender meg nesten rett tilbake dit jeg kom fra? Derfor må <b>sola være bak deg</b> og <b>regnet foran deg</b>. Flytt sola, endre været og dråpene, og se når regnbuen dukker opp og når den ikke gjør det!',
            viewTitle: 'Det du ser',
            viewLabel: 'Utsikten mot regnet, med regnbuen.',
            mapTitle: 'Sett ovenfra',
            mapLabel: 'Kart sett ovenfra: deg, sola og regnet. Dra sola rundt deg.',
            mapHint: 'Dra sola rundt deg',
            sideTitle: 'Sett fra siden',
            sideLabel: 'Sett fra siden: sola, deg og regnbuevinkelen. Dra sola opp og ned.',
            sideHint: 'Dra sola opp og ned',
            presets: 'Hurtigvalg',
            presetHint: 'Disse flytter bare på kontrollene under. Se hvilke som endrer seg!',
            dropTitle: 'Inni én regndråpe',
            dropHint: 'Følg lyset',
            dropLabel: 'Én regndråpe på nært hold: lyset bøyes inn, spretter inni og kommer ut med 42° (ett sprett) eller 51° (to sprett).',
            whereLabel: 'Hvor er du?', whereGround: 'På bakken', wherePlane: 'I et fly',
            sourceLabel: 'Hvor kommer lyset fra?', sourceSun: 'Sola', sourceMoon: 'Månen (natt)',
            showLabel: 'Vis',
            sunHeight: 'Hvor høyt står sola?',
            sunDir: 'Hvor er sola?',
            moonHeight: 'Hvor høyt står månen?',
            moonDir: 'Hvor er månen?',
            clear: 'Hvor klart er lyset?', clearLow: 'Bak skyer', clearHigh: 'Klart',
            dark: 'Himmelen bak regnet', darkLow: 'Lyse skyer', darkHigh: 'Mørke uværsskyer',
            rainAmount: 'Hvor mye regn?', rainLow: 'Ingenting', rainHigh: 'Kraftig byge',
            levels: {
                clear: ['bak tykke skyer', 'disig', 'litt disig', 'klart'],
                dark: ['lyse hvite', 'lysegrå', 'mørkegrå', 'mørke som uvær'],
                rain: ['ingenting', 'noen få dråper', 'en byge', 'en kraftig byge']
            },
            dropSize: 'Dråpestørrelse',
            low: 'Morgen / kveld',
            high: 'Midt på dagen',
            dirLeft: 'Venstre', dirBehind: 'Bak deg', dirRight: 'Høyre',
            dropFog: 'Tåke', dropRain: 'Store dråper',
            helpers: 'Hjelpelinjer',
            dir: {
                behind: 'bak deg', behindRight: 'bak deg, til høyre', behindLeft: 'bak deg, til venstre',
                right: 'til høyre for deg', left: 'til venstre for deg',
                frontRight: 'foran deg, til høyre', frontLeft: 'foran deg, til venstre', front: 'foran deg'
            },
            drops: { fog: 'tåke', drizzle: 'yr', rain: 'regn', heavy: 'styrtregn' },
            preset: { normal: 'Vanlig', double: 'Dobbel', extra: 'Ekstrabuer', fog: 'Tåkebue', red: 'Rød regnbue', moon: 'Månebue', plane: 'Fra fly', glory: 'Glorie', noon: 'Sola midt på dagen', front: 'Sola foran' },
            sit: {
                behind: '{light} er bak deg, så regnbuen er rett fremfor deg, med midten i skyggen av hodet ditt.',
                side: '{light} er {dir}. Midten av regnbuen flytter seg alltid motsatt vei, så du ser bare en del av buen mot {side}.',
                sideLeft: 'venstre', sideRight: 'høyre',
                away: '{light} er {dir}. Nå er midten av regnbuen bak deg, der det ikke regner. Dråpene foran deg sender fargene tilbake mot {lightLow}, ikke til deg. Ingen regnbue!',
                height: '{light} står {e}° over horisonten, så toppen av regnbuen er ca. {top}° over horisonten. Jo lavere {lightLow} står, jo høyere blir buen.',
                horizon: '{light} står helt nede ved horisonten, så regnbuen er nesten en hel halvsirkel.',
                tooHigh: '{light} står {e}° over horisonten. Det er høyere enn 42°, så hovedbuen havner under bakken.',
                secondPeek: 'Men den andre buen ligger høyere, ved 51°, så toppen av den titter fortsatt over horisonten!',
                hazy: 'Det er skyer foran {lightLow}, så lyset er svakt og regnbuen blir blek. En regnbue trenger sterkt lys og regn samtidig.',
                brightBack: 'Himmelen bak regnet er lys, så regnbuen synes dårlig. Regnbuer er finest mot mørke skyer.',
                fewDrops: 'Det faller bare noen få dråper, så regnbuen blir tynn og svak. Flere dråper sender mer farget lys til deg.',
                secondHidden: 'Det finnes alltid en andre bue utenfor den første, ved ca. 51°. Men litt lys forsvinner ved hvert sprett, så den er mye svakere. For å se den trenger du klart lys, mørke skyer bak regnet og mye regn.',
                noRain: 'Det regner ikke, så det finnes ingen dråper som kan bøye lyset. Ingen dråper, ingen regnbue! Skru opp regnet.',
                planeHigh: 'Sola står {e}° over horisonten, så hele sirkelen ligger under horisonten, nede i regnet. På bakken ville sola stått for høyt, men herfra er det perfekt!',
                planeLow: 'Sola står bare {e}° over horisonten, så toppen av sirkelen ville vært over horisonten, der det ikke regner under deg. Løft sola over 42° for å se hele sirkelen.',
                planeAway: 'Sola er {dir}, så skyggen av flyet og regnbuen er på den andre siden. Se ut av et vindu på den andre siden av flyet!',
                glory: 'De bitte små skydråpene lager også små fargeringer rett rundt skyggen av flyet. Det kalles en glorie. Store regndråper lager ikke det.',
                red: 'Lyset går gjennom masse luft når sola står så lavt. Blått og grønt blir spredt bort på veien, så regnbuen blir rød og oransje.',
                fog: 'Dråpene er bitte små ({size}), som i tåke. Fargene blir utvisket, og buen blir bred og hvit: en tåkebue.',
                small: 'Ganske små dråper ({size}) gir blekere farger, og svake rosa og grønne ekstrabuer rett innenfor fiolett.',
                big: 'Store regndråper ({size}) gir sterke, klare farger.',
                second: 'Nå ser du den andre buen! Lys som spretter to ganger lager den ytre buen ved ca. 51°. Der er fargene snudd, og himmelen mellom buene er mørkere. Den mørke stripa heter Alexanders bånd.',
                moon: 'Månelys er sollys som spretter på månen. En månebue er så svak at den ser nesten hvit ut, fordi øynene våre ser dårlig farger i mørket. Et kamera kan vise fargene.',
                plane: 'Du er i et fly, høyt over regnet. Bakken er ikke i veien, så regnbuen kan bli en hel sirkel rundt skyggen av flyet.'
            },
            you: 'Du', sun: 'Sola', moonLabel: 'Månen', rain: 'Regn',
            sunNoun: 'Sola', sunNounLow: 'sola', moonNoun: 'Månen', moonNounLow: 'månen',
            youPlane: 'Du (i flyet)', planeShadow: 'skyggen av flyet', rainBelow: 'Regn under deg', noRainShort: 'Ikke regn',
            noDrops: 'Ikke regn, ingen regnbue!',
            dropSunlight: 'sollys', dropMoonlight: 'månelys',
            dropBounce1: '1 sprett: hovedbuen', dropBounce2: '2 sprett: andre bue',
            dropToYou: 'til deg', dropMiss: 'Du er her. Fargene bommer på deg!',
            dropNone: 'Ikke regn, ingen dråper!',
            dropSizeIs: 'Dråpe: {size}.',
            dropNoteBig: 'Stor dråpe: skarpe farger.', dropNoteFog: 'Bitteliten dråpe: fargene blandes til hvitt.', dropNoteSup: 'Liten dråpe: ekstra striper.',
            shadow: 'skyggen av hodet',
            centre: 'midten av regnbuen',
            noRain: 'ikke regn her',
            tooHigh: 'Sola står for høyt! Regnbuen er under bakken.',
            view: 'det du ser',
            facts: [
                { t: 'Du kommer aldri til enden', p: 'Regnbuen er ikke en ting som står et sted. Den er en vinkel! Når du går, flytter den seg med deg. Derfor finner ingen gullkrukka.' },
                { t: 'Lysere inni', p: 'Himmelen inni regnbuen er lysere enn utenfor. Det er alt lyset som kommer ut av dråpene med mindre enn 42 grader.' },
                { t: 'Din helt egen regnbue', p: 'Lyset fra hver dråpe treffer bare ett øye. Personen ved siden av deg ser lys fra helt andre dråper. Alle ser sin egen regnbue!' },
                { t: 'Beste tid', p: 'Morgen og ettermiddag. Midt på dagen om sommeren står sola høyere enn 42° i store deler av Norge, og da havner hele regnbuen under bakken.' }
            ]
        },
        ch6: {
            chip: 'Usynlig lys',
            title: 'Lyset du ikke kan se',
            bubble: 'Jeg har mange søsken du ikke kan se! Radiobølger, mikrobølger, røntgen … Alle er samme slags bølger som meg, bare lengre eller kortere. Fargene du ser er bare en <b>bitte liten stripe</b> av familien vår.',
            sliderLabel: 'Velg bølgelengde i spekteret',
            canvasLabel: 'Bølgen som reiser fra det som sender den til det som fanger den.',
            longEnd: 'Lange bølger, lav frekvens',
            shortEnd: 'Korte bølger, høy frekvens',
            barHint: 'Trykk på et ikon eller en del av stripa for å hoppe dit.',
            cellWl: 'Bølgelengde',
            cellFreq: 'Svinger per sekund',
            cellSize: 'Omtrent like lang som',
            cellEnergy: 'Energi',
            cellDanger: 'Farlig?',
            sendTitle: 'Hvordan sender og fanger vi det?',
            usesTitle: 'Ting som bruker det',
            sentBy: 'Sendes av',
            caughtBy: 'Fanges av',
            antenna: 'En god antenne for denne bølgen er ca. <b>{len}</b> lang (en halv bølgelengde).',
            freqWords: ['', 'tusen', 'millioner', 'milliarder', 'billioner', 'billiarder', 'trillioner', 'trilliarder', 'kvadrillioner', 'kvadrilliarder'],
            extremesTitle: 'De lengste og de korteste',
            facts: [
                { t: 'De lengste bølgene', p: 'Bølger kan være lengre enn hele jorda! Lyn får hele planeten til å «ringe» med bølger som er ca. 38 000 km lange, 8 ganger i sekundet. Mariner har brukt bølger som er tusenvis av kilometer lange for å snakke med ubåter, fordi de går dypt ned i sjøvann.' },
                { t: 'Hvorfor bruker vi dem ikke mer?', p: 'En antenne bør være ca. en halv bølgelengde lang, så ubåtantennene var mange kilometer lange. Og en treg bølge kan bære veldig lite informasjon: å sende noen få bokstaver kunne ta flere minutter.' },
                { t: 'De korteste bølgene', p: 'De korteste gammastrålene kommer fra eksploderende stjerner og områdene rundt sorte hull. Bølgene er mindre enn kjernen i et atom, med hundrevis av billioner ganger mer energi enn lyset du ser.' },
                { t: 'Hvorfor bruker vi dem ikke?', p: 'De er veldig vanskelige å lage og styre, de går rett gjennom nesten alt, og de skader levende celler. Heldigvis stopper lufta høyt over oss dem før de når bakken.' },
                { t: 'Finnes det en ende?', p: 'Ingen vet om en lengste eller korteste mulige bølge. Forskere tror det kanskje finnes en minste lengde i universet, men den er så liten at et atom er like stort i forhold til den som hele universet er i forhold til et atom.' }
            ]
        },
        regions: {
            radio: {
                name: 'Radiobølger', short: 'Radio',
                uses: 'Radio, TV, walkie-talkie, radiostyrte klokker og signaler fra romsonder.',
                fact: 'Radioteleskoper lytter etter radiobølger fra stjerner og galakser langt ute i verdensrommet.',
                danger: 'Ufarlig',
                how: 'Strøm suser fram og tilbake i en metallstang, <b>antennen</b>, og rister løs radiobølger. Når bølgene treffer en annen antenne, får de strømmen i den til å suse fram og tilbake også. Radioen gjør det om til lyd.',
                sentBy: 'radiomast', caughtBy: 'radio'
            },
            micro: {
                name: 'Mikrobølger', short: 'Mikro',
                uses: 'Mobiltelefon, WiFi, Bluetooth, radar, satellitt-TV og mikrobølgeovnen.',
                fact: 'Mikrobølgeovnen får vannet i maten til å riste, og da blir maten varm.',
                danger: 'Ufarlig i vanlige mengder',
                how: 'Mikrobølger sendes og fanges av små antenner, ofte gjemt inni mobilen eller ruteren. Bolleformede <b>parabolantenner</b> samler svake mikrobølger fra satellitter, som et stort øre.',
                sentBy: 'WiFi-ruter', caughtBy: 'mobil'
            },
            ir: {
                name: 'Infrarødt', short: 'Infrarødt',
                uses: 'Varme! Fjernkontroller, varmekameraer og nattkikkerter.',
                fact: 'Du kjenner infrarødt som varme fra sola og peisen. Klapperslanger kan «se» varmen fra en mus i stummende mørke.',
                danger: 'Ufarlig (men kan være varmt!)',
                how: 'Alt som er varmt lyser i infrarødt, også du! En fjernkontroll har en liten <b>infrarød lampe</b> (LED) som blinker en kode. En bitte liten lyssensor i TV-en fanger blinkene.',
                sentBy: 'fjernkontroll', caughtBy: 'TV'
            },
            visible: {
                name: 'Synlig lys', short: 'Synlig',
                uses: 'Alt du ser med øynene: regnbuen, blomster, skjermer og lamper.',
                fact: 'Synlig lys er bare en bitte liten bit av hele spekteret, men det er akkurat det sola lyser aller mest av.',
                danger: 'Ufarlig (men se aldri rett på sola)',
                how: 'Sola, lamper og skjermer sender det ut. <b>Øynene</b> dine fanger det med millioner av lyssensorer, og et kamera gjør det samme med en sensorbrikke.',
                sentBy: 'sola', caughtBy: 'øynene dine'
            },
            uv: {
                name: 'Ultrafiolett', short: 'UV',
                uses: 'Gir solbrenthet, dreper bakterier, og bier kan se det!',
                fact: 'Mange blomster har UV-mønstre som viser biene veien til nektaren. Mønstrene er usynlige for oss.',
                danger: 'Kan skade hud og øyne: bruk solkrem og solbriller',
                how: 'Sola sender mye UV, og spesielle UV-lamper lager det også. Spesielle sensorer fanger det, og noen stoffer <b>lyser</b> i synlig lys når UV treffer dem. Slik virker «black light».',
                sentBy: 'sola', caughtBy: 'solkrem og hud'
            },
            xray: {
                name: 'Røntgen', short: 'Røntgen',
                uses: 'Røntgenbilder hos legen og tannlegen, og bagasjeskannere på flyplassen.',
                fact: 'Røntgenstråler går lett gjennom hud og muskler, men bein stopper mer av dem. Derfor ser du skjelettet på bildet.',
                danger: 'Farlig i store mengder. Legen bruker bare litt.',
                how: 'Et <b>røntgenrør</b> skyter superraske elektroner mot en metallplate, og smellet lager røntgenstråler. En detektorplate på andre siden fanger dem som kommer gjennom kroppen.',
                sentBy: 'røntgenrør', caughtBy: 'detektorplate'
            },
            gamma: {
                name: 'Gammastråler', short: 'Gamma',
                uses: 'Kommer fra radioaktive stoffer og enorme eksplosjoner i verdensrommet.',
                fact: 'Sykehus bruker gammastråler til å ødelegge kreftceller og gjøre medisinsk utstyr helt rent.',
                danger: 'Veldig farlig: kan skade cellene i kroppen',
                how: 'Gammastråler kommer fra <b>kjernen i atomer</b> når de endrer seg, og fra eksploderende stjerner. Spesielle krystaller blinker med bitte små lysglimt når gammastråler treffer dem, og en detektor teller glimtene.',
                sentBy: 'radioaktive atomer', caughtBy: 'gammadetektor'
            }
        },
        devices: {
            schumann: 'Lyn får jorda til å ringe',
            submarine: 'Ubåtradio',
            clock: 'Radiostyrt klokke',
            am: 'AM-radio',
            fm: 'FM-/DAB-radio',
            tv: 'TV-antenne',
            phone: 'Mobiltelefon',
            oven: 'Mikrobølgeovn',
            wifi: 'WiFi',
            satellite: 'Satellitt-TV',
            radar: 'Bilradar',
            body: 'Varme fra kroppen din',
            remote: 'Fjernkontroll',
            eye: 'Øynene dine',
            bee: 'Bier ser det',
            sunburn: 'Solbrenthet',
            germ: 'Bakteriedrepende lampe',
            dentist: 'Røntgen hos tannlegen',
            atom: 'Radioaktive atomer',
            hospital: 'Kreftbehandling',
            star: 'Eksploderende stjerner'
        },
        sizes: {
            8: 'åtte jordkloder på rad', 7: 'hele jorda', 6: 'Oslo til Tromsø', 5: 'en times biltur',
            4: 'litt mer enn Mount Everest', 3: 'ti fotballbaner på rad', 2: 'en fotballbane', 1: 'en buss',
            0: 'et barn', '-1': 'en mobiltelefon', '-2': 'en blåbær', '-3': 'et sandkorn', '-4': 'tykkelsen av et hårstrå',
            '-5': 'en rød blodcelle', '-6': 'en bakterie', '-7': 'et virus', '-8': 'et stort molekyl', '-9': 'et lite molekyl',
            '-10': 'et atom', '-11': 'en tidel av et atom', '-12': 'en hundredel av et atom', '-13': 'en tusendel av et atom',
            '-14': 'kjernen i et atom', '-15': 'et proton'
        },
        ch7: {
            chip: 'Dyreøyne',
            title: 'Regnbuen gjennom dyreøyne',
            bubble: 'Regndråpene sender også ut <b>ultrafiolett</b> lys innenfor fiolett og <b>infrarødt</b> utenfor rødt. Du ser dem ikke, men noen dyr gjør det! Hvordan tror du regnbuen ser ut for en bie?',
            canvasLabel: 'Nærbilde av regnbuen slik valgt dyr ser den.',
            compare: 'Sammenlign med dine øyne',
            you: 'Du',
            note: 'En skjerm kan bare lage farger du kan se, så ultrafiolett vises som en glitrende stripe og infrarødt som en glødende.'
        },
        animals: {
            human: { name: 'Menneske', title: 'Slik ser du regnbuen', text: 'Du har tre typer fargesensorer i øynene (tapper): for rødt, grønt og blått. Du ser alt fra fiolett til rødt. Ultrafiolett og infrarødt er usynlig for deg, selv om det er der.' },
            bee: { name: 'Bie', title: 'Slik ser en bie regnbuen', text: 'Bier har også tre fargesensorer, men for ultrafiolett, blått og grønt. De ser en ekstra stripe innenfor fiolett. Men rødt ser nesten svart ut for en bie! Mange blomster har UV-mønstre som bare biene ser, som landingslys for nektar.' },
            bird: { name: 'Fugl', title: 'Slik ser en fugl regnbuen', text: 'Mange fugler har fire fargesensorer, én av dem for ultrafiolett. De ser alle fargene dine pluss UV, og sterkere farger enn deg. Blåmeisen har UV-mønstre i fjærene som andre blåmeiser ser, men ikke vi.' },
            dog: { name: 'Hund', title: 'Slik ser en hund regnbuen', text: 'Hunder har bare to fargesensorer. De ser regnbuen som blå og gul, med en grålig stripe imellom. Rødt og grønt ser ganske likt ut. Kjøp heller en blå eller gul ball til hunden enn en rød!' },
            colourblind: { name: 'Fargeblind', title: 'Rød-grønn fargeblind', text: 'Omtrent 1 av 12 gutter og 1 av 200 jenter er rød-grønn fargeblinde. Rødt, oransje, gult og grønt ser likere ut for dem. Mange merker det nesten ikke i hverdagen, men det kan være vanskelig å skille rødt og grønt lys.' },
            snake: { name: 'Klapperslange', title: 'Slik kunne en klapperslange sett regnbuen', text: 'Klapperslanger har små groper i ansiktet som kjenner infrarød varme. Slik finner de en varm mus i stummende mørke. Men regnbuens infrarøde stripe har mye kortere bølger enn varmen fra en mus, så slangen ville knapt kjent den. Fargesynet er trolig likt hundens.' },
            shrimp: { name: 'Knelerreke', title: 'Slik ser en knelerreke regnbuen', text: 'Knelerreka har 12 til 16 typer fargesensorer. Du har bare 3! Den ser ultrafiolett også. Men forskere fant noe rart: den er faktisk dårligere enn deg til å skille farger som ligner. Den kjenner igjen farger lynraskt i «trinn» i stedet for å blande dem.' }
        },
        ch8: {
            chip: 'Prøv selv',
            title: 'Prøv selv',
            bubble: 'Nå vet du hemmeligheten, så nå kan du lage regnbuer og finne usynlig lys selv! Men husk: <b>se aldri rett på sola</b>. Den kan skade øynene dine.',
            need: 'Du trenger',
            how: 'Slik gjør du',
            why: 'Hva skjer?'
        },
        experiments: [
            {
                icon: 'drop', title: 'Regnbue med hageslangen',
                need: ['En solrik dag', 'En hageslange med spraydyse'],
                steps: ['Stå med sola i ryggen.', 'Spray en fin dusj foran deg, litt opp i lufta.', 'Finn skyggen av hodet ditt og se ca. 42° ut fra den.'],
                why: 'De bitte små vanndråpene virker akkurat som regndråper. Flytt dusjen rundt: regnbuen holder seg alltid i samme vinkel fra skyggen din.'
            },
            {
                icon: 'angle', title: 'Mål 42° med hånda',
                need: ['Hånda di', 'En regnbue (eller hageslangeregnbuen)'],
                steps: ['Strekk armen helt ut og spre fingrene godt.', 'Fra tommeltupp til lillefingertupp er ca. 20°.', 'Sett tommelen på skyggen av hodet ditt og tell to håndspenner.'],
                why: 'To håndspenner er ca. 40°, så du lander rett på regnbuen. Prøv med en ekte regnbue og sjekk!'
            },
            {
                icon: 'eye', title: 'Se det usynlige lyset fra en fjernkontroll',
                need: ['En TV-fjernkontroll', 'En mobil med kamera'],
                steps: ['Åpne kameraet. Prøv frontkameraet (selfie) først: mange bakkameraer blokkerer infrarødt.', 'Pek fjernkontrollen rett mot kameraet.', 'Hold inne en knapp mens du ser på skjermen.'],
                why: 'Du ser tuppen av fjernkontrollen blinke! Fjernkontrollen sender infrarødt lys som øynene dine ikke ser, men kamerasensoren gjør det. Prøv bakkameraet også og sammenlign.'
            },
            {
                icon: 'split', title: 'Regnbue fra et glass vann',
                need: ['Et klart glass fullt med vann', 'Et solrikt vindu', 'Et hvitt ark'],
                steps: ['Sett glasset helt ytterst i en solrik vinduskarm.', 'Legg arket på gulvet der lyset lander.', 'Flytt arket og glasset til en liten regnbue dukker opp.'],
                why: 'Vannet bøyer sollyset som et prisme, og hver farge bøyes litt ulikt.'
            },
            {
                icon: 'sun', title: 'Speil i en vannbolle',
                need: ['Et lite speil', 'En bolle med vann', 'Sol eller en sterk lommelykt'],
                steps: ['Legg speilet skrått ned i vannet.', 'La lyset treffe speilet under vannet.', 'Se etter en regnbue på veggen eller i taket. Flytt speilet sakte.'],
                why: 'Lyset bøyes inn i vannet, spretter på speilet og bøyes igjen på vei ut. Det er nesten akkurat det som skjer i en regndråpe!'
            },
            {
                icon: 'palette', title: 'Lag Newtons fargehjul',
                need: ['Hvit papp', 'Fargetusjer', 'En blyant', 'Saks'],
                steps: ['Klipp ut en sirkel og del den i sju kakestykker.', 'Fargelegg dem rødt, oransje, gult, grønt, blått, indigo og fiolett.', 'Stikk blyanten gjennom midten og snurr den som en snurrebass.'],
                why: 'Når den snurrer fort, klarer ikke øynene å følge med, og fargene blandes til et blekt gråhvitt.'
            },
            {
                icon: 'wave', title: 'Blå himmel og rød solnedgang i et glass',
                need: ['Et høyt glass vann', 'Noen dråper melk', 'En lommelykt', 'Et mørkt rom'],
                steps: ['Rør noen dråper melk inn i vannet.', 'Lys med lommelykta gjennom glasset fra siden.', 'Se på glasset fra siden, og så fra enden rett imot lommelykta.'],
                why: 'Fra siden ser vannet litt blått ut, og fra enden ser lyset oransje ut. De bitte små melkebitene sprer blått lys mer enn rødt, akkurat som lufta gjør med sollyset.'
            },
            {
                icon: 'spark', title: 'Selvlysende tonic',
                need: ['Tonic (med kinin)', 'Et klart glass', 'Sollys eller en UV-lommelykt', 'En mørk bakgrunn'],
                steps: ['Hell tonic i glasset.', 'Hold det i sterkt sollys foran noe mørkt, eller lys på det med en UV-lommelykt i mørket.', 'Se etter en blå glød, særlig nær overflaten der lyset kommer inn.'],
                why: 'Kininet i tonic fanger usynlig ultrafiolett lys og sender det ut igjen som blått lys du kan se.'
            },
            {
                icon: 'question', title: 'CD-trikset',
                need: ['En gammel CD eller DVD', 'En lampe eller sollys'],
                steps: ['Hold den blanke siden mot lyset.', 'Vipp den sakte og se fargene flytte seg.'],
                why: 'Denne regnbuen lages på en helt annen måte! Bitte små riller i plata får lysbølger til å forsterke og slukke hverandre, og det sorterer fargene.'
            }
        ],
        ch9: {
            chip: 'Quiz',
            title: 'Regnbuequiz',
            bubble: 'Har du fulgt med? Ta quizen og bli <b>regnbueekspert</b>!',
            progress: 'Spørsmål {i} av {n} · Poeng: {s}',
            pick: 'Velg et svar.',
            correct: 'Riktig!',
            wrong: 'Ikke helt.',
            next: 'Neste spørsmål',
            finish: 'Se resultatet',
            retry: 'Prøv igjen',
            results: ['Du er på vei! Gå gjennom kapitlene og prøv en gang til.', 'Godt jobbet! Les litt mer og prøv igjen.', 'Kjempebra! Du kan masse om lys og regnbuer.', 'Fantastisk! Du er en ekte regnbueekspert!']
        },
        quiz: [
            { q: 'Hvor må sola være når du ser en regnbue?', a: ['Bak deg', 'Foran deg', 'Rett over hodet ditt'], why: 'Regndråpene sender lyset nesten rett tilbake dit det kom fra. Med sola i ryggen havner fargene rett i øynene dine.' },
            { q: 'Hvilken farge er ytterst i en vanlig regnbue?', a: ['Rød', 'Fiolett', 'Grønn'], why: 'Rødt bøyes minst og kommer ut av dråpen med ca. 42°, den største vinkelen. Derfor er rødt ytterst.' },
            { q: 'Hvilken farge har kortest bølgelengde?', a: ['Fiolett', 'Rød', 'Gul'], why: 'Fiolett har de korteste bølgene vi kan se, rundt 400 nm. Rødt har de lengste, rundt 700 nm.' },
            { q: 'Hva er hvitt sollys egentlig?', a: ['Alle farger blandet sammen', 'Bare gult lys', 'Lys uten farger'], why: 'Newton viste det med et prisme: hvitt lys er en blanding av alle regnbuefargene.' },
            { q: 'Hvor mange grader fra skyggen av hodet ditt er regnbuen?', a: ['Ca. 42 grader', 'Ca. 90 grader', 'Ca. 10 grader'], why: 'Lyset kommer ut av dråpen med høyst ca. 42°, og der hoper mest lys seg opp.' },
            { q: 'Hvorfor er fargene snudd i den ytre buen i en dobbel regnbue?', a: ['Lyset spretter to ganger inni dråpen', 'Den er speilet i skyene', 'Det er en ekstra sol'], why: 'Det ekstra spretten snur rekkefølgen, så rødt havner innerst i den ytre buen.' },
            { q: 'Hvilket dyr kan se ultrafiolett lys?', a: ['Bie', 'Menneske', 'Ingen dyr kan det'], why: 'Bier (og mange fugler) har en egen fargesensor for UV. De ser en ekstra stripe i regnbuen.' },
            { q: 'Hvilken av disse er samme slags bølge som lys?', a: ['Radiobølger', 'Lydbølger', 'Havbølger'], why: 'Radiobølger, mikrobølger, røntgen og synlig lys er alle elektromagnetiske bølger. Lyd og havbølger er noe helt annet.' },
            { q: 'Kan du gå til enden av regnbuen?', a: ['Nei, den flytter seg med deg', 'Ja, der står en gullkrukke', 'Ja, hvis du løper fort nok'], why: 'Regnbuen er en vinkel sett fra øynene dine, ikke en ting. Når du flytter deg, flytter den seg også.' },
            { q: 'Hvorfor ser du sjelden regnbue midt på dagen om sommeren?', a: ['Sola står for høyt', 'Det er for varmt', 'Regndråpene er for store'], why: 'Når sola står høyere enn ca. 42°, havner hele regnbuen under bakken.' }
        ],
        footer: { partOf: 'Del av' }
    }
};
