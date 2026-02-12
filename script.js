/* ═══════════════════════════════════════════════════════════════
   💝 Valentine's Day Interactive Experience
   Full JavaScript - Cross-platform compatible
═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   STATE MANAGEMENT
═══════════════════════════════════════════════════════════════ */
const S = {
    step: 1,
    stubClicks: 10,
    fails: { 1: 0, 2: 0, 3: 0 },
    teaIdx: 0,
    mapClicks: 0,
    pets: 0,
    heart: 0,
    score: 0,
    playing: false,
    music: false,
    musicStarted: false,
    bootComplete: false
};

const TEA = ['water', 'masala', 'tea', 'milk'];
const PETS = ['🐱', '🐰', '🐶', '🐶','🐱'];  // Cat, Rabbit (her current fav!), and 2 dogs
// Using widely-supported emojis only (no complex/newer symbols)
const EMOJIS = ['😀', '😂', '😎', '😴', '🤗', '😇', '😈', '👻', '💀', '🤖', '👽', '😺', '🐶', '🐱', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐔', '🐧', '🌸', '🌺', '🍀', '🌙', '⭐', '🔥', '💧', '🍎', '🍊', '🍋', '🍇', '🍓', '❤️', '💜', '💙', '💚', '🌟', '✨', '🎈', '🎁'];

/* ═══════════════════════════════════════════════════════════════
   DEVICE DETECTION
═══════════════════════════════════════════════════════════════ */
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/* ═══════════════════════════════════════════════════════════════
   MOBILE SHAKE ANIMATION HELPER (JS fallback for iOS/older browsers)
═══════════════════════════════════════════════════════════════ */
let shakeInterval = null;
let shakeFrame = 0;

// Simpler shake values for iOS compatibility (use margin instead of transform)
const shakeValues = [0, -5, 5, -5, 5, -3, 3, -2, 2, 0];

function startJSShake() {
    if (shakeInterval) return; // Already shaking
    
    // For iOS, shake the card directly using margin (avoids transform/backdrop-filter conflict)
    const card = document.querySelector('.card:not(.hidden)');
    if (!card) return;
    
    shakeFrame = 0;
    shakeInterval = setInterval(() => {
        const offset = shakeValues[shakeFrame % shakeValues.length];
        card.style.marginLeft = offset + 'px';
        card.style.marginRight = (-offset) + 'px';
        shakeFrame++;
    }, 40); // 25fps for smooth shake
}

function stopJSShake() {
    if (shakeInterval) {
        clearInterval(shakeInterval);
        shakeInterval = null;
    }
    // Reset all cards
    document.querySelectorAll('.card').forEach(card => {
        card.style.marginLeft = '';
        card.style.marginRight = '';
    });
}

// Helper to trigger shake - uses both CSS class and JS fallback
function triggerShake(enable) {
    if (enable) {
        document.body.classList.add('screen-shake');
        // Always use JS fallback on mobile for reliability
        if (isMobile || isIOS) {
            startJSShake();
        }
    } else {
        document.body.classList.remove('screen-shake');
        stopJSShake();
    }
}

// Helper to shake a specific card element (for wrong answers)
function shakeCard(cardElement) {
    if (!cardElement) return;
    
    // Add CSS class for animation
    cardElement.classList.add('shake');
    
    // JS fallback for mobile
    if (isMobile) {
        let frame = 0;
        const cardShakeFrames = [0, -8, 8, -8, 8, -6, 6, -4, 4, -2, 2, 0];
        const originalTransform = cardElement.style.transform;
        
        const shakeIt = setInterval(() => {
            if (frame >= cardShakeFrames.length) {
                clearInterval(shakeIt);
                cardElement.style.transform = originalTransform;
                return;
            }
            cardElement.style.transform = `translate3d(${cardShakeFrames[frame]}px, 0, 0)`;
            frame++;
        }, 50);
    }
    
    // Remove class after animation
    setTimeout(() => cardElement.classList.remove('shake'), 600);
}

/* ═══════════════════════════════════════════════════════════════
   INITIALIZATION
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // Fix iOS viewport height issue
    fixViewportHeight();
    window.addEventListener('resize', debounce(fixViewportHeight, 100));
    window.addEventListener('orientationchange', () => setTimeout(fixViewportHeight, 100));
    
    // Detect iOS and add class for simplified rendering
    if (isIOS) {
        document.body.classList.add('ios-device');
        document.documentElement.classList.add('ios-device');
    }
    
    initParticles();
    initEmojis();
    initSignature();
    initGameControls();
    
    // Add Enter key support for CAPTCHA and security question inputs
    const inputHandlers = [
        { id: 'captchaIn', fn: checkCaptcha },
        { id: 'q1In', fn: () => checkQ(1) },
        { id: 'q2In', fn: () => checkQ(2) },
        { id: 'q3In', fn: () => checkQ(3) },
        { id: 'q4In', fn: () => checkQ(4) },
        { id: 'q5In', fn: () => checkQ(5) }
    ];
    inputHandlers.forEach(({ id, fn }) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
    });
    
    // Music prompt is visible by default - user must click to start
    // This satisfies mobile browser autoplay policy
});

// Fix iOS 100vh issue - sets CSS variable --vh
function fixViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Debounce helper for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* ═══════════════════════════════════════════════════════════════
   MUSIC PROMPT (Required for mobile audio)
═══════════════════════════════════════════════════════════════ */
function showMusicPrompt() {
    const prompt = document.getElementById('musicPrompt');
    if (prompt) prompt.classList.remove('hidden');
}

function startExperience(withMusic) {
    const prompt = document.getElementById('musicPrompt');
    if (prompt) prompt.classList.add('hidden');
    
    S.musicStarted = withMusic;
    
    // Show audio button
    const audioBtn = document.getElementById('audioBtn');
    if (audioBtn) audioBtn.classList.remove('hidden');
    
    // Start intro music immediately if user chose with music
    if (withMusic) {
        const introMusic = document.getElementById('introMusic');
        if (introMusic) {
            introMusic.play().then(() => {
                S.music = true;
                if (audioBtn) audioBtn.textContent = '🔊';
            }).catch(err => {
                console.log('Audio autoplay blocked:', err);
            });
        }
    } else {
        if (audioBtn) audioBtn.textContent = '🔇';
    }
    
    // Show Step 1 first, then start boot sequence
    go(1);
    startBoot();
}

/* ═══════════════════════════════════════════════════════════════
   PARTICLES
═══════════════════════════════════════════════════════════════ */
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    const particleCount = window.innerWidth < 600 ? 15 : 30;
    
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (8 + Math.random() * 12) + 's';
        p.style.animationDelay = Math.random() * 10 + 's';
        container.appendChild(p);
    }
}

/* ═══════════════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════════════ */
function go(n) {
    // Hide all cards with fade out
    document.querySelectorAll('.card').forEach(c => c.classList.add('hidden'));
    
    // Show target card (handle both numeric and string IDs like "9b", "9c")
    const el = document.getElementById('s' + n);
    if (el) {
        el.classList.remove('hidden');
        S.step = n;
        
        // Update step counter (handle special steps)
        const counter = document.getElementById('stepCounter');
        if (counter) {
            const displayNum = typeof n === 'string' ? n.replace(/[a-z]/g, '') : n;
            counter.textContent = String(displayNum).padStart(2, '0') + ' / 45';
        }
        
        // Handle step-specific actions
        handleStep(n);
        
        // Smooth scroll - use requestAnimationFrame for better iOS performance
        requestAnimationFrame(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Reset any internal scroll on the card
            el.scrollTop = 0;
        });
    }
}

function handleStep(n) {
    // Background transitions with smooth animation
    if (n <= 15) document.body.style.background = 'var(--bg-void)';
    else if (n <= 20) document.body.style.background = 'var(--bg-panic)';
    else if (n <= 25) document.body.style.background = 'var(--bg-calm)';
    else document.body.style.background = 'var(--bg-dream)';
    
    // Music switching based on phase
    if (S.musicStarted) {
        const introMusic = document.getElementById('introMusic');
        const panicMusic = document.getElementById('panicMusic');
        const bgMusic = document.getElementById('bgMusic');
        
        // Steps 1-15: Intro/Gatekeeping phase - play intro.mp3
        if (n <= 15) {
            // Stop other music
            if (panicMusic && !panicMusic.paused) panicMusic.pause();
            if (bgMusic && !bgMusic.paused) bgMusic.pause();
            // Play intro music
            if (introMusic && introMusic.paused) {
                introMusic.play().catch(() => {
                    console.log('Intro music not available');
                });
            }
            triggerShake(false);
        }
        // Steps 16-20: Panic phase - play panic.mp3
        else if (n >= 16 && n <= 20) {
            // Stop other music
            if (introMusic && !introMusic.paused) introMusic.pause();
            if (bgMusic && !bgMusic.paused) bgMusic.pause();
            // Play panic music
            if (panicMusic && panicMusic.paused) {
                panicMusic.play().catch(() => {
                    console.log('Panic music not available');
                });
            }
            triggerShake(true);
        }
        // Steps 21+: Calm/Dream phase - play ours.mp3
        else if (n >= 21) {
            // Stop other music
            if (introMusic && !introMusic.paused) introMusic.pause();
            if (panicMusic && !panicMusic.paused) panicMusic.pause();
            // Play calm/romantic music
            if (bgMusic && bgMusic.paused) {
                bgMusic.play().catch(() => {
                    console.log('Background music not available');
                });
            }
            triggerShake(false);
        }
    } else {
        // Visual effects only (no music)
        if (n >= 16 && n <= 20) {
            triggerShake(true);
        } else {
            triggerShake(false);
        }
    }
    
    // Step-specific handlers
    switch (n) {
        case 17: startSpiral(); break;
        case 19: spawnClouds(); break;
        case 20: startChase(); break;
        case 22: if (S.musicStarted && !S.music) startMusic(); break;
        case 23: startBreath(); break;
        case 42: setTimeout(reinitSignature, 100); break;
    }
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 1: GATEKEEPING
═══════════════════════════════════════════════════════════════ */

// Boot sequence
function startBoot() {
    let bootPct = 0;
    const bar = document.getElementById('bootBar');
    const msg = document.getElementById('bootMsg');
    
    const bootLoop = setInterval(() => {
        if (bootPct < 99) {
            bootPct++;
            if (bar) bar.style.width = bootPct + '%';
            
            if (bootPct === 40 && msg) msg.textContent = 'Scanning drama levels...';
            if (bootPct === 70 && msg) msg.textContent = 'Stubbornness module detected...';
            if (bootPct === 98 && msg) msg.textContent = 'ERROR: Cannot proceed!';
        } else {
            clearInterval(bootLoop);
            S.bootComplete = true;
            setTimeout(() => go(2), 1200);
        }
    }, 40);
}

// Step 3: Stubborn clicks
function clickStub() {
    S.stubClicks--;
    const countEl = document.getElementById('stubCount');
    if (countEl) countEl.textContent = S.stubClicks;
    
    const btn = document.getElementById('stubBtn');
    if (btn) {
        btn.style.transform = `translate(${(Math.random() - 0.5) * 80}px, ${(Math.random() - 0.5) * 40}px)`;
        
        if (S.stubClicks <= 0) {
            btn.style.transform = 'none';
            btn.innerHTML = '<span>✅ DELETED!</span>';
            setTimeout(() => go(4), 800);
        }
    }
}

// Step 4: Queen admit
let queenDenials = 0;
function admitQueen(yes) {
    if (yes) {
        go(6);
    } else {
        queenDenials++;
        const msg = document.getElementById('queenMsg');
        if (msg) msg.textContent = `Denial #${queenDenials} logged...`;
        
        if (queenDenials >= 3) {
            const card = document.getElementById('s4');
            shakeCard(card);
            setTimeout(() => go(5), 600);
        }
    }
}

// Step 6: CAPTCHA
function checkCaptcha() {
    const input = document.getElementById('captchaIn');
    if (!input) return;
    
    const v = input.value;
    if (v === 'Humpy Dumpy') {
        toast('Identity confirmed! 👑');
        go(7);
    } else {
        toast('Wrong! Case matters! 😤');
        input.value = '';
    }
}

// Steps 7-9c: Twisted Questions (5 total)
function checkQ(q) {
    const inputIds = { 1: 'q1In', 2: 'q2In', 3: 'q3In', 4: 'q4In', 5: 'q5In' };
    const input = document.getElementById(inputIds[q]);
    if (!input) return;
    
    const value = input.value.toLowerCase().trim();
    
    const answers = {
        1: ['sept 2', 'september 2', 'sep 2', '2 sept', '2 september', 'sept2', 'september2', '2nd september', '2nd sept'],
        2: ['om'],
        3: ['gilmore girls', 'gilmore', 'gilmoregirls'],
        4: ['overthink', 'overthinking', 'over think', 'over thinking', 'overanalyze', 'over analyze'],
        5: ['bhagavad gita', 'gita', 'bhagavadgita', 'bhagvad gita', 'geeta', 'bhagwad gita', 'bhagwat gita']
    };
    
    const nextSteps = { 1: 8, 2: 9, 3: '9b', 4: '9c', 5: 10 };
    
    const correct = answers[q].some(a => value.includes(a) || value === a);
    
    if (correct) {
        toast('Correct! 💕');
        go(nextSteps[q]);
    } else {
        if (!S.fails[q]) S.fails[q] = 0;
        S.fails[q]++;
        toast('Nope! Think harder 🤔');
        
        if (S.fails[q] >= 2) {
            const hint = document.getElementById('h' + q);
            if (hint) hint.classList.remove('hidden');
        }
    }
}

// Step 10: Charlie
function fadeCharlie() {
    const img = document.getElementById('charlieImg');
    const text = document.getElementById('charlieText');
    if (img) {
        img.style.opacity = '0.2';
        img.style.transform = 'scale(0.9)';
    }
    if (text) {
        text.style.opacity = '1';
        text.style.pointerEvents = 'auto';
    }
}

// Step 11: Emoji grid
function initEmojis() {
    const grid = document.getElementById('emojiGrid');
    if (!grid) return;
    
    const cellCount = window.innerWidth < 480 ? 36 : 48;
    const target = Math.floor(Math.random() * cellCount);
    
    for (let i = 0; i < cellCount; i++) {
        const cell = document.createElement('div');
        cell.className = 'emoji-cell';
        
        if (i === target) {
            cell.textContent = '🐵';
            cell.onclick = () => {
                cell.classList.add('found');
                const msg = document.getElementById('findMsg');
                if (msg) msg.textContent = 'Found your Makkar! 🎉';
                setTimeout(() => go(12), 1200);
            };
        } else {
            cell.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
            cell.onclick = () => {
                cell.style.opacity = '0.2';
                const msg = document.getElementById('findMsg');
                if (msg) msg.textContent = 'Not there! Keep looking...';
            };
        }
        grid.appendChild(cell);
    }
}

// Step 12: Little Things
function checkLT() {
    const checkbox = document.getElementById('ltCheck');
    if (checkbox && checkbox.checked) {
        toast('Promise locked! 📺');
        go(13);
    } else {
        toast('Check the box! 😤');
    }
}

// Step 14: Denial
function denyAnnoying() {
    const btn = document.getElementById('annoyBtn');
    const reveal = document.getElementById('truthReveal');
    if (btn) btn.classList.add('hidden');
    if (reveal) reveal.classList.remove('hidden');
}

// Step 15: Enter panic
function enterPanic() { go(16); }

/* ═══════════════════════════════════════════════════════════════
   PHASE 2: PANIC
═══════════════════════════════════════════════════════════════ */

// Step 17: Spiral
function startSpiral() {
    const words = [
        'Grades?', 'GPA dropping?', 'White hair?!', 'Am I aging?', 
        'Internship?', 'VISA expiring?', 'Low scores!', 'Pimples?!',
        'Future?', 'Career?', 'Money?', 'Failing class?', 
        'Hair falling?', 'Dark circles!', 'No sleep?', 'Deadline?!',
        'Professor mad?', 'Assignment?', 'Presentation?', 'Anxiety!'
    ];
    const box = document.getElementById('spiralBox');
    if (!box) return;
    
    box.innerHTML = '';
    let i = 0;
    
    const loop = setInterval(() => {
        const sp = document.createElement('span');
        sp.textContent = words[i % words.length] + ' ';
        sp.style.animation = `glitchText ${0.1 + Math.random() * 0.2}s infinite`;
        box.appendChild(sp);
        i++;
        
        if (i >= 22) {
            clearInterval(loop);
            setTimeout(() => go(18), 1000);
        }
    }, 160);
}

// Step 19: Clouds
let clouds = 12;
function spawnClouds() {
    const thoughts = [
        'VISA?!', 'GRADES!', 'FAILING', 'DEPORT?', 'INTERNSHIP', 
        'WHITE HAIR', 'STRESS', 'PANIC', 'LOW GPA', 'PIMPLES',
        'NO SLEEP', 'DEADLINES'
    ];
    clouds = 12;
    
    const countEl = document.getElementById('cloudNum');
    if (countEl) countEl.textContent = clouds;
    
    // Clear existing clouds
    document.querySelectorAll('.cloud').forEach(c => c.remove());
    
    thoughts.forEach((t, i) => {
        setTimeout(() => {
            const c = document.createElement('div');
            c.className = 'cloud';
            c.textContent = t;
            c.style.left = (10 + Math.random() * 70) + '%';
            c.style.top = (10 + Math.random() * 60) + '%';
            
            c.onclick = () => {
                c.style.transform = 'scale(0)';
                c.style.opacity = '0';
                setTimeout(() => c.remove(), 300);
                clouds--;
                
                const countEl = document.getElementById('cloudNum');
                if (countEl) countEl.textContent = clouds;
                
                if (clouds <= 0) setTimeout(() => go(20), 500);
            };
            
            document.body.appendChild(c);
        }, i * 250);
    });
}

// Step 20: Chase call
function startChase() {
    const btn = document.getElementById('callBtn');
    const msg = document.getElementById('callMsg');
    if (!btn) return;
    
    let t = 0;
    const chase = setInterval(() => {
        if (t < 12) {
            btn.style.transform = `translate(${(Math.random() - 0.5) * 150}px, ${(Math.random() - 0.5) * 80}px)`;
            if (msg) msg.textContent = `Catch me! (${12 - t}s)`;
            t++;
        } else {
            clearInterval(chase);
            btn.style.transform = 'none';
            if (msg) msg.textContent = 'I stopped. Click me.';
        }
    }, 1000);
}

function catchCall() { go(21); }
function enterCalm() { go(22); }

/* ═══════════════════════════════════════════════════════════════
   PHASE 3: CALM
═══════════════════════════════════════════════════════════════ */

function startMusic() {
    const audio = document.getElementById('bgMusic');
    if (!audio) return;
    
    audio.play().then(() => {
        S.music = true;
        const btn = document.getElementById('audioBtn');
        if (btn) btn.classList.remove('hidden');
    }).catch(err => {
        console.log('Audio play failed:', err);
    });
}

function toggleAudio() {
    const introMusic = document.getElementById('introMusic');
    const panicMusic = document.getElementById('panicMusic');
    const bgMusic = document.getElementById('bgMusic');
    const btn = document.getElementById('audioBtn');
    if (!btn) return;
    
    // Find which audio is currently supposed to be playing based on current step
    const currentStep = S.step || 1;
    let activeAudio;
    
    if (currentStep <= 15) activeAudio = introMusic;
    else if (currentStep <= 20) activeAudio = panicMusic;
    else activeAudio = bgMusic;
    
    if (!activeAudio) return;
    
    // Toggle mute state for all audio
    if (S.musicStarted) {
        // Mute all
        S.musicStarted = false;
        if (introMusic) introMusic.pause();
        if (panicMusic) panicMusic.pause();
        if (bgMusic) bgMusic.pause();
        btn.textContent = '🔇';
    } else {
        // Unmute - play the appropriate track
        S.musicStarted = true;
        activeAudio.play().catch(() => {});
        btn.textContent = '🔊';
    }
}

// Step 23: Breathing
function startBreath() {
    const phases = ['Inhale...', 'Hold...', 'Exhale...'];
    const times = [4000, 5000, 10000];
    let phase = 0;
    let total = 19;
    
    const label = document.getElementById('breathLabel');
    const timer = document.getElementById('breathTime');
    const btn = document.getElementById('breathBtn');
    
    function nextPhase() {
        if (label) label.textContent = phases[phase % 3];
        setTimeout(() => {
            phase++;
            if (total > 0) nextPhase();
        }, times[phase % 3]);
    }
    nextPhase();
    
    const countdown = setInterval(() => {
        total--;
        if (timer) timer.textContent = total + 's remaining';
        
        if (total <= 0) {
            clearInterval(countdown);
            if (btn) btn.classList.remove('hidden');
            if (label) label.textContent = 'You did it 💜';
        }
    }, 1000);
}

// Step 25: Tea
function addTea(ing, el) {
    if (ing === TEA[S.teaIdx]) {
        el.classList.add('done');
        S.teaIdx++;
        
        const level = document.getElementById('teaLevel');
        const msg = document.getElementById('teaMsg');
        const steam = document.getElementById('steamWrap');
        const sipBtn = document.getElementById('sipBtn');
        
        if (level) level.style.height = (S.teaIdx * 25) + '%';
        if (msg) msg.textContent = `Added! ${S.teaIdx}/4`;
        if (S.teaIdx >= 3 && steam) steam.style.opacity = '1';
        
        if (S.teaIdx >= 4) {
            if (sipBtn) sipBtn.classList.remove('hidden');
            if (msg) msg.textContent = 'Perfect! Now sip ☕';
        }
    } else {
        toast('Wrong order! Water first 💧');
    }
}

function sipTea() {
    toast("Ahh... Mom's recipe 💜");
    setTimeout(() => go(26), 1200);
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 4: LIFE
═══════════════════════════════════════════════════════════════ */

// Step 26: Map
function clickMap(el, city) {
    if (!el.classList.contains('done')) {
        el.classList.add('done');
        S.mapClicks++;
        
        const msg = document.getElementById('mapMsg');
        if (msg) msg.textContent = S.mapClicks + '/5 connected';
        
        toast(city + ' linked! 💕');
        
        if (S.mapClicks >= 5) setTimeout(() => go(27), 1000);
    }
}

// Step 28: Book
function saveBook() {
    const input = document.getElementById('bookIn');
    if (!input) return;
    
    const t = input.value.trim();
    if (t) {
        toast(`"${t}" - Coming soon! 📚`);
        go(29);
    } else {
        toast('Give it a name! ✍️');
    }
}

// Step 30: Food Game
let catcherX = 50;

function initGameControls() {
    // Keyboard controls
    document.addEventListener('keydown', e => {
        if (!S.playing) return;
        
        if (e.key === 'ArrowLeft') catcherX = Math.max(10, catcherX - 8);
        if (e.key === 'ArrowRight') catcherX = Math.min(90, catcherX + 8);
        
        const catcher = document.getElementById('catcher');
        if (catcher) catcher.style.left = catcherX + '%';
    });
    
    // Touch controls - improved for mobile
    const gameZone = document.getElementById('gameZone');
    if (gameZone) {
        // Prevent default touch behaviors
        gameZone.addEventListener('touchstart', e => {
            if (!S.playing) return;
            e.preventDefault();
            handleTouch(e, gameZone);
        }, { passive: false });
        
        gameZone.addEventListener('touchmove', e => {
            if (!S.playing) return;
            e.preventDefault();
            handleTouch(e, gameZone);
        }, { passive: false });
    }
}

function handleTouch(e, gameZone) {
    const rect = gameZone.getBoundingClientRect();
    catcherX = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    catcherX = Math.max(10, Math.min(90, catcherX));
    
    const catcher = document.getElementById('catcher');
    if (catcher) {
        catcher.style.left = catcherX + '%';
    }
}

function startGame() {
    S.playing = true;
    S.score = 0;
    
    const btn = document.getElementById('gameBtn');
    if (btn) btn.classList.add('hidden');
    
    const good = ['🥬', '🥦', '🥗', '🍎', '🥕', '🍌', '🥒'];
    const bad = ['🍕', '🍔', '🍟', '🌭', '🍩', '🍪'];
    const gameZone = document.getElementById('gameZone');
    
    if (!gameZone) return;
    
    const gameHeight = gameZone.getBoundingClientRect().height;
    
    function spawn() {
        if (!S.playing || !gameZone) return;
        
        const f = document.createElement('div');
        f.className = 'food';
        const isGood = Math.random() > 0.35;
        f.textContent = isGood ? good[Math.floor(Math.random() * good.length)] : bad[Math.floor(Math.random() * bad.length)];
        f.dataset.good = isGood;
        f.style.left = (10 + Math.random() * 80) + '%';
        
        const duration = 2 + Math.random();
        f.style.webkitAnimationDuration = duration + 's';
        f.style.animationDuration = duration + 's';
        
        gameZone.appendChild(f);
        
        // Use both animationend and a timeout fallback for mobile
        let handled = false;
        
        const handleFoodEnd = () => {
            if (handled) return;
            handled = true;
            
            checkCatch(f);
            if (f.parentNode) f.remove();
        };
        
        // CSS animation end event
        f.addEventListener('animationend', handleFoodEnd);
        f.addEventListener('webkitAnimationEnd', handleFoodEnd);
        
        // Fallback timeout (slightly longer than animation)
        setTimeout(handleFoodEnd, (duration + 0.1) * 1000);
    }
    
    function checkCatch(f) {
        const fRect = f.getBoundingClientRect();
        const catcher = document.getElementById('catcher');
        if (!catcher) return;
        
        const cRect = catcher.getBoundingClientRect();
        
        // Check if food is in catch zone
        const overlap = fRect.left < cRect.right && 
                        fRect.right > cRect.left && 
                        fRect.bottom > cRect.top - 20;
        
        if (overlap) {
            if (f.dataset.good === 'true') {
                S.score++;
                toast('+1 Healthy! 🥬');
            } else {
                S.score = Math.max(0, S.score - 1);
                toast('-1 Oily! 😣');
            }
            
            const scoreEl = document.getElementById('score');
            if (scoreEl) scoreEl.textContent = S.score;
        }
        
        if (S.score >= 5) {
            S.playing = false;
            toast('Great diet! 🎉');
            setTimeout(() => go(31), 1000);
        }
    }
    
    const loop = setInterval(() => {
        if (!S.playing) { clearInterval(loop); return; }
        spawn();
    }, 900);
}

// Step 31: Pets
function addPet() {
    if (S.pets >= 4) return;
    
    const zone = document.getElementById('petZone');
    if (!zone) return;
    
    const p = document.createElement('span');
    p.className = 'pet';
    p.textContent = PETS[S.pets];
    zone.appendChild(p);
    
    S.pets++;
    
    const msg = document.getElementById('petMsg');
    if (msg) msg.textContent = `Pets: ${S.pets}/4`;
    
    if (S.pets >= 4) {
        const btn = document.getElementById('petBtn');
        if (btn) btn.innerHTML = '<span>House Full! 🏠</span>';
        setTimeout(() => go(32), 1200);
    }
}

// Step 33: Answer
let ansFails = 0;
function checkAns() {
    const input = document.getElementById('ansIn');
    const hint = document.getElementById('ansHint');
    if (!input) return;
    
    const v = input.value.toLowerCase().trim();
    // Accept "pillar of strength" or variations
    if (v.includes('pillar') && v.includes('strength')) {
        toast("That's right! Your anchor 💕");
        go(34);
    } else {
        ansFails++;
        if (ansFails >= 2 && hint) {
            hint.classList.remove('hidden');
        }
        toast('Think about what I promised you... 💕');
        input.value = '';
    }
}

// Step 36: Heart spam
function spamYes() {
    S.heart += 5;
    
    const fill = document.getElementById('heartFill');
    const pct = document.getElementById('heartPct');
    
    if (fill) fill.style.height = Math.min(S.heart, 100) + '%';
    if (pct) pct.textContent = Math.min(S.heart, 100) + '%';
    
    if (S.heart >= 100) {
        toast('Heart FULL! 💕');
        setTimeout(() => go(37), 1000);
    }
}

/* ═══════════════════════════════════════════════════════════════
   PHASE 5: FINALE
═══════════════════════════════════════════════════════════════ */

// Step 38: Letter
function openLetter() {
    const envelope = document.getElementById('envelope');
    const hint = document.getElementById('letterHint');
    const box = document.getElementById('letterBox');
    const btn = document.getElementById('letterBtn');
    
    if (envelope) envelope.classList.add('open');
    if (hint) hint.classList.add('hidden');
    
    setTimeout(() => {
        if (envelope) envelope.classList.add('hidden');
        if (box) box.classList.remove('hidden');
        if (btn) btn.classList.remove('hidden');
    }, 500);
}

// Step 40: No button dodge
function dodgeNo() {
    const btn = document.getElementById('noBtn');
    if (!btn) return;
    
    btn.style.position = 'absolute';
    btn.style.left = (Math.random() * 60 + 20) + '%';
    btn.style.top = (Math.random() * 40 + 30) + '%';
    toast('Nice try! 😏');
}

function sayYes() {
    // Confetti explosion
    if (typeof confetti === 'function') {
        const end = Date.now() + 4000;
        
        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ff2d6a', '#ffd93d', '#00f5ff', '#b14eff', '#6fffb0']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ff2d6a', '#ffd93d', '#00f5ff', '#b14eff', '#6fffb0']
            });
            if (Date.now() < end) requestAnimationFrame(frame);
        })();
        
        confetti({
            particleCount: 250,
            spread: 180,
            origin: { y: 0.6 }
        });
    }
    
    toast('SHE SAID YES! 💕');
    setTimeout(() => go(42), 2000);
}

// Step 43: Signature
let sigCanvas, sigCtx, drawing = false;

function initSignature() {
    sigCanvas = document.getElementById('sigCanvas');
    if (!sigCanvas) return;
    
    sigCtx = sigCanvas.getContext('2d');
    setupSignatureEvents();
}

function reinitSignature() {
    sigCanvas = document.getElementById('sigCanvas');
    if (!sigCanvas) return;
    
    sigCtx = sigCanvas.getContext('2d');
    
    // Ensure canvas has proper size
    sigCanvas.width = 300;
    sigCanvas.height = 150;
    
    sigCtx.strokeStyle = '#ff2d6a';
    sigCtx.lineWidth = 3;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
    
    setupSignatureEvents();
}

function setupSignatureEvents() {
    if (!sigCanvas) return;
    
    // Remove existing listeners by cloning
    const newCanvas = sigCanvas.cloneNode(true);
    sigCanvas.parentNode.replaceChild(newCanvas, sigCanvas);
    sigCanvas = newCanvas;
    sigCtx = sigCanvas.getContext('2d');
    sigCtx.strokeStyle = '#ff2d6a';
    sigCtx.lineWidth = 3;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
    
    // Mouse events
    sigCanvas.addEventListener('mousedown', e => {
        drawing = true;
        const rect = sigCanvas.getBoundingClientRect();
        sigCtx.beginPath();
        sigCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
    sigCanvas.addEventListener('mouseup', () => { drawing = false; });
    sigCanvas.addEventListener('mouseleave', () => { drawing = false; });
    sigCanvas.addEventListener('mousemove', drawSig);
    
    // Touch events
    sigCanvas.addEventListener('touchstart', e => {
        e.preventDefault();
        drawing = true;
        const rect = sigCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        sigCtx.beginPath();
        sigCtx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    }, { passive: false });
    sigCanvas.addEventListener('touchend', () => { drawing = false; });
    sigCanvas.addEventListener('touchmove', drawSig, { passive: false });
}

function drawSig(e) {
    if (!drawing || !sigCanvas || !sigCtx) return;
    e.preventDefault();
    
    const rect = sigCanvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    sigCtx.lineTo(x, y);
    sigCtx.stroke();
    sigCtx.beginPath();
    sigCtx.moveTo(x, y);
}

function clearSig() {
    if (sigCtx && sigCanvas) {
        sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    }
}

function submitSig() {
    toast('Signed! 💕');
    go(44);
}

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */
function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    
    t.textContent = msg;
    t.classList.add('show');
    
    setTimeout(() => t.classList.remove('show'), 2500);
}
