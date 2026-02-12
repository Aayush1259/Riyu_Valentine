
/* ═══════════════════════════════════════════════════════════════
   BROWSER COMPATIBILITY POLYFILLS
═══════════════════════════════════════════════════════════════ */
// requestAnimationFrame polyfill for older browsers
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) { return setTimeout(callback, 16); };
}
if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.msCancelAnimationFrame ||
        function(id) { clearTimeout(id); };
}

// classList polyfill for very old browsers
if (!('classList' in document.documentElement)) {
    Object.defineProperty(HTMLElement.prototype, 'classList', {
        get: function() {
            var self = this;
            return {
                contains: function(c) { return self.className.indexOf(c) !== -1; },
                add: function(c) { if (!this.contains(c)) self.className += ' ' + c; },
                remove: function(c) { self.className = self.className.replace(new RegExp('(^|\\s)' + c + '(\\s|$)', 'g'), ' ').trim(); },
                toggle: function(c) { this.contains(c) ? this.remove(c) : this.add(c); }
            };
        }
    });
}

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
const PETS = ['🐱', '🐰', '🐶', '🐹', '🦜']; 
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
    
    // Konami Code Easter Egg
    let konami = [];
    const secret = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    document.addEventListener('keydown', (e) => {
        konami.push(e.key);
        if (konami.length > secret.length) konami.shift();
        if (JSON.stringify(konami) === JSON.stringify(secret)) {
            sayYes(); // Triggers confetti
            toast('Cheat Code Activated! 🎮');
        }
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
        case 18: startFearThoughts(); break;
        case 19: spawnClouds(); break;
        case 20: startChase(); break;
        case '21b': startGrounding(); break;
        case 22: if (S.musicStarted && !S.music) startMusic(); break;
        case 23: startBreath(); break;
        case 26: setTimeout(initHeritage, 100); break;
        case 39: setTimeout(initLetterSeal, 100); break;
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

// Step 18: Pop The Fear Thoughts - Full screen interactive
let fearCount = 0;
let fearSpawnInterval = null;

function startFearThoughts() {
    const fears = [
        '😱 DEPORTED', '📉 FAILING', '💔 ALONE', '🔥 BURNOUT', '😰 VISA',
        '💸 BROKE', '😵 NO SLEEP', '📞 MOM', '⏰ DEADLINE', '🚫 REJECTED'
    ];
    
    let shattered = 0;
    const totalGlass = 10;
    
    const countEl = document.getElementById('fearNum');
    if (countEl) countEl.textContent = shattered;
    
    document.querySelectorAll('.glass-fear').forEach(f => f.remove());
    
    fears.forEach((fear, i) => {
        setTimeout(() => {
            if (S.step !== 18) return;
            
            const glass = document.createElement('div');
            glass.className = 'glass-fear';
            glass.innerHTML = '<div class="glass-cracks"></div><span class="glass-text">' + fear + '</span><div class="glass-hp"><div class="glass-hp-fill"></div></div>';
            
            glass.style.left = (15 + Math.random() * 60) + '%';
            glass.style.top = (15 + Math.random() * 50) + '%';
            
            let health = 5;
            const hpFill = glass.querySelector('.glass-hp-fill');
            const cracks = glass.querySelector('.glass-cracks');
            
            glass.onclick = function(e) {
                e.stopPropagation();
                health--;
                if (hpFill) hpFill.style.width = (health / 5 * 100) + '%';
                if (cracks) cracks.style.opacity = (5 - health) * 0.25;
                this.style.animation = 'none';
                this.offsetHeight;
                this.style.animation = 'glassShake 0.15s';
                if (navigator.vibrate) navigator.vibrate(25);
                
                if (health <= 0) {
                    this.innerHTML = '💥✨';
                    this.style.transform = 'scale(1.5) rotate(15deg)';
                    this.style.background = 'transparent';
                    this.style.border = 'none';
                    this.style.boxShadow = 'none';
                    this.style.pointerEvents = 'none';
                    this.style.fontSize = '2.5rem';
                    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                    setTimeout(() => this.remove(), 400);
                    shattered++;
                    if (countEl) countEl.textContent = shattered;
                    if (shattered >= totalGlass) {
                        toast('🎉 Fears SHATTERED!');
                        setTimeout(() => go(19), 800);
                    }
                }
            };
            document.body.appendChild(glass);
        }, i * 400);
    });
    
    setTimeout(() => {
        if (S.step === 18) {
            document.querySelectorAll('.glass-fear').forEach(g => g.remove());
            go(19);
        }
    }, 25000);
}

function cleanupFearThoughts() {
    if (fearSpawnInterval) {
        clearInterval(fearSpawnInterval);
        fearSpawnInterval = null;
    }
    document.querySelectorAll('.fear-thought').forEach(f => f.remove());
    document.querySelectorAll('.glass-fear').forEach(g => g.remove());
    document.querySelectorAll('.worry-balloon').forEach(b => b.remove());
}

// Step 19: Pop Worry Balloons (TAP to pop!)
let balloons = 8;
function spawnClouds() {
    const worries = [
        { text: '😰 STRESS', color: '#ff6b6b' },
        { text: '😱 PANIC', color: '#ff4757' },
        { text: '😵 TIRED', color: '#ff7f50' },
        { text: '😢 SAD', color: '#5f9ea0' },
        { text: '🤯 OVERWHELM', color: '#ff6347' },
        { text: '😤 ANGRY', color: '#dc143c' },
        { text: '😨 SCARED', color: '#9370db' },
        { text: '🥺 ANXIOUS', color: '#ff69b4' }
    ];
    balloons = 8;
    
    const countEl = document.getElementById('cloudNum');
    if (countEl) countEl.textContent = balloons;
    
    // Clear existing
    document.querySelectorAll('.worry-balloon').forEach(b => b.remove());
    
    worries.forEach((worry, i) => {
        setTimeout(() => {
            if (S.step !== 19) return;
            
            const balloon = document.createElement('div');
            balloon.className = 'worry-balloon';
            balloon.innerHTML = '<span class="balloon-text">' + worry.text + '</span><div class="balloon-tap-hint">TAP!</div><div class="balloon-string"></div>';
            balloon.style.setProperty('--balloon-color', worry.color);
            
            // Grid layout - 4 columns, 2 rows (more spread out)
            const col = i % 4;
            const row = Math.floor(i / 4);
            balloon.style.left = (5 + col * 24) + '%';
            balloon.style.top = (12 + row * 40) + '%';
            
            let tapsNeeded = 4; // 4 taps to pop
            let size = 100;
            
            // Simple TAP to deflate
            const tapBalloon = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                tapsNeeded--;
                size -= 20;
                
                // Visual feedback
                balloon.style.transform = 'scale(' + (size/100) + ')';
                balloon.classList.add('tapped');
                if (navigator.vibrate) navigator.vibrate(30);
                
                // Brief shrink animation
                setTimeout(() => balloon.classList.remove('tapped'), 150);
                
                if (tapsNeeded <= 0) {
                    // POP!
                    balloon.innerHTML = '💨';
                    balloon.style.fontSize = '2.5rem';
                    balloon.style.background = 'none';
                    balloon.style.border = 'none';
                    balloon.style.boxShadow = 'none';
                    balloon.style.animation = 'none';
                    balloon.style.pointerEvents = 'none';
                    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
                    
                    setTimeout(() => balloon.remove(), 400);
                    
                    balloons--;
                    if (countEl) countEl.textContent = balloons;
                    
                    if (balloons <= 0) {
                        toast('😌 All worries popped!');
                        setTimeout(() => go(20), 800);
                    }
                }
            };
            
            // Both click and touch for maximum compatibility
            balloon.addEventListener('click', tapBalloon);
            balloon.addEventListener('touchend', (e) => {
                e.preventDefault();
                tapBalloon(e);
            }, { passive: false });
            
            document.body.appendChild(balloon);
        }, i * 250);
    });
    
    // Safety timeout
    setTimeout(() => {
        if (S.step === 19) {
            document.querySelectorAll('.worry-balloon').forEach(b => b.remove());
            go(20);
        }
    }, 35000);
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
function enterCalm() { go('21b'); } // Redirect to Grounding
function enterMusic() { go(22); }

// Step 21b: Grounding
function startGrounding() {
    const items = ['🌻', '🌻', '🌻', '🌻', '🌻', '🌵', '🌴', '🌲', '🌳', '🍄', '🌷', '🌸', '🌹', '🌺', '🍀'];
    const container = document.getElementById('groundingItems');
    if (!container) return;
    
    container.innerHTML = '';
    let found = 0;
    
    // Shuffle
    items.sort(() => Math.random() - 0.5);
    
    items.forEach(emoji => {
        const el = document.createElement('div');
        el.className = 'ground-item';
        el.textContent = emoji;
        el.onclick = () => {
            if (emoji === '🌻' && !el.classList.contains('found')) {
                el.classList.add('found');
                found++;
                const msg = document.getElementById('groundingMsg');
                if (msg) msg.textContent = `${found}/5 Found`;
                
                if (navigator.vibrate) navigator.vibrate(40);
                
                if (found >= 5) {
                    toast('You are grounded. You are safe. 🌿');
                    setTimeout(() => go(22), 1500);
                }
            } else if (emoji !== '🌻') {
                el.style.opacity = '0.3';
                el.style.transform = 'scale(0.8)';
            }
        };
        container.appendChild(el);
    });
}

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
let breathAttempt = 0;
let breathCompleted = false;
let breathInterval = null;
let breathPhaseTimeout = null;

function startBreath() {
    // 4-7-8 Technique
    const phases = ['Inhale (4s)', 'Hold (7s)', 'Exhale (8s)'];
    const times = [4000, 7000, 8000];
    let phase = 0;
    
    const label = document.getElementById('breathLabel');
    const timer = document.getElementById('breathTime');
    const circle = document.getElementById('breathCircle');
    
    // Reset state
    breathCompleted = false;
    if (timer) timer.textContent = 'Relax...';
    if (label) label.textContent = 'Prepare...';
    
    // Clear any existing intervals
    if (breathInterval) clearInterval(breathInterval);
    if (breathPhaseTimeout) clearTimeout(breathPhaseTimeout);
    
    let cycleCount = 0;
    
    function runCycle() {
        if (cycleCount >= 2) { // Do 2 full cycles ~ 38s
             breathCompleted = true;
             if (label) label.textContent = 'You did it 💜';
             if (timer) timer.textContent = 'Peaceful ✨';
             return;
        }
        
        // Inhale
        if (label) label.textContent = phases[0];
        if (circle) circle.style.transform = 'scale(1.5)';
        if (timer) timer.textContent = 'Breathe in...';
        
        breathPhaseTimeout = setTimeout(() => {
            // Hold
            if (label) label.textContent = phases[1];
            if (timer) timer.textContent = 'Hold it...';
            
            breathPhaseTimeout = setTimeout(() => {
                // Exhale
                if (label) label.textContent = phases[2];
                if (circle) circle.style.transform = 'scale(1)';
                if (timer) timer.textContent = 'Let it go...';
                
                breathPhaseTimeout = setTimeout(() => {
                    cycleCount++;
                    runCycle();
                }, times[2]);
            }, times[1]);
        }, times[0]);
    }
    
    // Slight delay to start
    setTimeout(runCycle, 1000);
}

function trySkipBreath() {
    if (breathCompleted) {
        // She actually did it! Go to next step
        go(24);
    } else {
        // She tried to skip! Go to scold step
        breathAttempt++;
        hide('s23');
        show('s23b');
        
        // Clear the breathing timer
        if (breathInterval) {
            clearInterval(breathInterval);
            breathInterval = null;
        }
        if (breathPhaseTimeout) {
            clearTimeout(breathPhaseTimeout);
            breathPhaseTimeout = null;
        }
    }
}

function goBackToBreath() {
    // Go back to breathing step and restart
    hide('s23b');
    show('s23');
    startBreath();
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

// Step 26: Heritage Drag & Drop
let heritageConnected = 0;
let draggedDot = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function initHeritage() {
    const dots = document.querySelectorAll('.heritage-dot.draggable');
    const target = document.getElementById('gujaratHeart');
    const map = document.querySelector('.heritage-map');
    
    if (!map || !target) return;
    
    dots.forEach(dot => {
        // Store original position
        dot.dataset.origLeft = dot.style.left;
        dot.dataset.origTop = dot.style.top;
        
        // Touch events
        dot.addEventListener('touchstart', handleDragStart, { passive: false });
        dot.addEventListener('touchmove', handleDragMove, { passive: false });
        dot.addEventListener('touchend', handleDragEnd);
        
        // Mouse events
        dot.addEventListener('mousedown', handleDragStart);
    });
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
}

function handleDragStart(e) {
    if (this.classList.contains('connected')) return;
    
    e.preventDefault();
    draggedDot = this;
    draggedDot.classList.add('dragging');
    
    const rect = draggedDot.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragOffsetX = clientX - rect.left - rect.width / 2;
    dragOffsetY = clientY - rect.top - rect.height / 2;
}

function handleDragMove(e) {
    if (!draggedDot) return;
    
    e.preventDefault();
    const map = document.querySelector('.heritage-map');
    if (!map) return;
    
    const mapRect = map.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    let x = ((clientX - mapRect.left - dragOffsetX) / mapRect.width) * 100;
    let y = ((clientY - mapRect.top - dragOffsetY) / mapRect.height) * 100;
    
    // Clamp to map bounds
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));
    
    draggedDot.style.left = x + '%';
    draggedDot.style.top = y + '%';
}

function handleDragEnd(e) {
    if (!draggedDot) return;
    
    const target = document.getElementById('gujaratHeart');
    const map = document.querySelector('.heritage-map');
    if (!target || !map) return;
    
    const dotRect = draggedDot.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    
    // Check if dropped on target (with generous hitbox)
    const dotCenterX = dotRect.left + dotRect.width / 2;
    const dotCenterY = dotRect.top + dotRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    
    const distance = Math.sqrt(
        Math.pow(dotCenterX - targetCenterX, 2) + 
        Math.pow(dotCenterY - targetCenterY, 2)
    );
    
    if (distance < 80) {
        // Success! Connect to heart
        connectToHeart(draggedDot);
    } else {
        // Return to original position
        draggedDot.style.left = draggedDot.dataset.origLeft;
        draggedDot.style.top = draggedDot.dataset.origTop;
    }
    
    draggedDot.classList.remove('dragging');
    draggedDot = null;
}

function connectToHeart(dot) {
    const culture = dot.dataset.culture;
    const messages = {
        'marathi': 'Marathi spirit connected! 🏠',
        'malayali': 'Mallu magic connected! 🌴', 
        'bengali': 'Bengali soul connected! 🎶',
        'odia': 'Odia heart connected! 🌺'
    };
    
    dot.classList.add('connected');
    heritageConnected++;
    
    // Draw line to heart
    drawConnectionLine(dot);
    
    // Update counter
    const counter = document.getElementById('rootCount');
    if (counter) counter.textContent = heritageConnected;
    
    toast(messages[culture] || 'Connected! 💕');
    
    // Pulse the heart
    const heart = document.getElementById('gujaratHeart');
    if (heart) {
        heart.classList.add('pulse-love');
        setTimeout(() => heart.classList.remove('pulse-love'), 500);
    }
    
    // Check completion
    if (heritageConnected >= 4) {
        setTimeout(() => {
            const complete = document.getElementById('heritageComplete');
            const msg = document.getElementById('mapMsg');
            if (complete) complete.classList.remove('hidden');
            if (msg) msg.style.display = 'none';
            
            // Big celebration
            toast('💖 All your beautiful roots chose ME! 💖');
            
            setTimeout(() => go(27), 2500);
        }, 800);
    }
}

function drawConnectionLine(dot) {
    const svg = document.getElementById('heritageLines');
    const target = document.getElementById('gujaratHeart');
    const map = document.querySelector('.heritage-map');
    if (!svg || !target || !map) return;
    
    const mapRect = map.getBoundingClientRect();
    const dotRect = dot.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    
    const x1 = ((dotRect.left + dotRect.width/2 - mapRect.left) / mapRect.width) * 100;
    const y1 = ((dotRect.top + dotRect.height/2 - mapRect.top) / mapRect.height) * 100;
    const x2 = ((targetRect.left + targetRect.width/2 - mapRect.left) / mapRect.width) * 100;
    const y2 = ((targetRect.top + targetRect.height/2 - mapRect.top) / mapRect.height) * 100;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1 + '%');
    line.setAttribute('y1', y1 + '%');
    line.setAttribute('x2', x2 + '%');
    line.setAttribute('y2', y2 + '%');
    line.setAttribute('stroke', 'url(#heartGradient)');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '5,5');
    line.classList.add('connection-line');
    
    // Add gradient if not exists
    if (!svg.querySelector('defs')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.id = 'heartGradient';
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#ff2d6a');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#ffd93d');
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);
    }
    
    svg.appendChild(line);
}

// Step 27: Dream Destinations
function toggleDestination(el) {
    el.classList.toggle('on');
    checkAllDestinations();
}

function checkAllDestinations() {
    const toggles = document.querySelectorAll('#travelToggles .toggle-switch');
    const onCount = document.querySelectorAll('#travelToggles .toggle-switch.on').length;
    const status = document.getElementById('travelStatus');
    const hint = document.getElementById('travelHint');
    const btn = document.getElementById('travelBtn');
    
    if (status) status.textContent = onCount + '/4 destinations selected';
    
    if (onCount >= 4) {
        // All selected!
        if (btn) btn.classList.remove('hidden');
        if (hint) hint.classList.add('hidden');
        if (status) {
            status.textContent = 'All destinations locked in! 🎉';
            status.style.color = 'var(--neon-mint)';
        }
        toast('Pack your bags! ✈️💕');
    } else {
        if (btn) btn.classList.add('hidden');
        if (onCount > 0 && onCount < 4 && hint) {
            hint.classList.remove('hidden');
        }
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
    let combo = 0;
    
    const btn = document.getElementById('gameBtn');
    if (btn) btn.classList.add('hidden');
    
    const good = ['🥬', '🥦', '🥗', '🍎', '🥕', '🍌', '🥒'];
    const bad = ['🍕', '🍔', '🍟', '🌭', '🍩', '🍪'];
    const gameZone = document.getElementById('gameZone');
    const scoreEl = document.getElementById('score');
    
    // Add combo element
    let comboEl = document.getElementById('comboDisplay');
    if (!comboEl && scoreEl) {
        comboEl = document.createElement('div');
        comboEl.id = 'comboDisplay';
        comboEl.className = 'combo-text';
        scoreEl.parentElement.appendChild(comboEl);
    }
    
    if (!gameZone) return;
    
    // Magnet Power-up vars
    let magnetActive = false;
    let magnetTimer = null;
    
    // Spawn Protein Shake occasionally
    let shakeInterval = setInterval(() => {
        if (!S.playing) { clearInterval(shakeInterval); return; }
        if (Math.random() > 0.7) spawnShake();
    }, 8000);
    
    function spawnShake() {
        const s = document.createElement('div');
        s.className = 'food protein-shake';
        s.textContent = '🥤';
        s.style.left = (10 + Math.random() * 80) + '%';
        s.style.animationDuration = '2.5s'; // Falls faster
        gameZone.appendChild(s);
        
        handleFall(s, () => {
             // Activate Magnet
             activateMagnet();
             if (s.parentNode) s.remove();
        });
    }
    
    function activateMagnet() {
        magnetActive = true;
        const catcher = document.getElementById('catcher');
        if (catcher) catcher.classList.add('magnet-active');
        toast('Magnet ACTIVE! 🧲');
        
        if (magnetTimer) clearTimeout(magnetTimer);
        magnetTimer = setTimeout(() => {
            magnetActive = false;
            if (catcher) catcher.classList.remove('magnet-active');
        }, 5000);
    }

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
        handleFall(f, () => {
            checkCatch(f);
            if (f.parentNode) f.remove();
        });
    }
    
    function handleFall(el, callback) {
         let handled = false;
         const onEnd = () => {
             if (handled) return;
             handled = true;
             callback();
         };
         el.addEventListener('animationend', onEnd);
         // Magnet effect logic (runs every frame)
         if (magnetActive && el.dataset.good === 'true') {
             // Simple magnetic pull logic would require requestAnimationFrame loop for each element
             // For simplicity in this structure, we'll just check collision more generously
         }
    }
    
    function checkCatch(f) {
        const fRect = f.getBoundingClientRect();
        const catcher = document.getElementById('catcher');
        if (!catcher) return;
        
        const cRect = catcher.getBoundingClientRect();
        
        // Magnet increases catch range
        const range = magnetActive ? 60 : 20; 
        
        // Check if food is in catch zone (horizontal overlap + vertical proximity)
        const overlap = fRect.left < cRect.right + range && 
                        fRect.right > cRect.left - range && 
                        fRect.bottom > cRect.top - range;
        
        if (overlap) {
            // Visual feedback - floaty text
            const floaty = document.createElement('div');
            floaty.className = 'floating-score';
            floaty.style.left = f.style.left;
            floaty.style.bottom = '40px';
            
            if (f.classList.contains('protein-shake')) {
                 // Handled by spawnShake logic callback actually, but redundant check ok
            } else if (f.dataset.good === 'true') {
                combo++;
                let pts = 1;
                if (combo >= 3) pts = 2; // Combo bonus
                
                S.score += pts;
                floaty.textContent = `+${pts}`;
                floaty.style.color = '#4ade80';
                
                // Combo feedback
                if (combo >= 2) {
                    if (comboEl) {
                        comboEl.textContent = `${combo}x Combo! 🔥`;
                        comboEl.classList.add('active');
                        setTimeout(() => comboEl.classList.remove('active'), 500);
                    }
                }
            } else {
                combo = 0; // Reset combo
                if (comboEl) comboEl.textContent = '';
                
                S.score = Math.max(0, S.score - 1);
                floaty.textContent = '-1';
                floaty.style.color = '#ff4757';
                toast('Oily! 😣');
                
                // Screen shake
                gameZone.style.animation = 'shake 0.3s';
                setTimeout(() => gameZone.style.animation = '', 300);
            }
            
            gameZone.appendChild(floaty);
            setTimeout(() => floaty.remove(), 800);
            
            if (scoreEl) scoreEl.textContent = S.score;
            if (navigator.vibrate) navigator.vibrate(20);
        }
        
        if (S.score >= 15) { // Increased target for more gameplay
            S.playing = false;
            clearInterval(shakeInterval);
            toast('Healthy Queen! 🎉');
            setTimeout(() => go(31), 1000);
        }
    }
    
    const loop = setInterval(() => {
        if (!S.playing) { clearInterval(loop); clearInterval(shakeInterval); return; }
        spawn();
    }, 800); // Slightly faster spawn
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

// Step 39: Premium Letter with Wax Seal
let sealBroken = false;

function breakSeal() {
    if (sealBroken) return;
    sealBroken = true;
    
    const seal = document.getElementById('waxSeal');
    const envelope = document.getElementById('envelope3d');
    const hint = document.getElementById('sealHint');
    const scene = document.getElementById('letterScene');
    const box = document.getElementById('letterBox');
    const btn = document.getElementById('letterBtn');
    const particlesContainer = document.getElementById('sealParticles');
    
    // Create particles for the seal breaking effect
    if (particlesContainer && seal) {
        const sealRect = seal.getBoundingClientRect();
        const containerRect = particlesContainer.parentElement.getBoundingClientRect();
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'seal-particle';
            
            // Random direction for each particle
            const angle = (i / 12) * Math.PI * 2;
            const distance = 60 + Math.random() * 40;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.left = '0px';
            particle.style.top = '0px';
            particle.style.width = (4 + Math.random() * 6) + 'px';
            particle.style.height = particle.style.width;
            
            particlesContainer.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    // Animate the seal breaking
    if (seal) {
        seal.classList.add('breaking');
    }
    
    // Hide hint
    if (hint) {
        hint.style.opacity = '0';
        hint.style.transition = 'opacity 0.3s';
    }
    
    // Start envelope opening sequence
    setTimeout(() => {
        if (envelope) {
            envelope.classList.add('opening');
        }
    }, 300);
    
    // Letter rises and envelope fully opens
    setTimeout(() => {
        if (envelope) {
            envelope.classList.add('opened');
        }
    }, 800);
    
    // Reveal the letter content
    setTimeout(() => {
        if (scene) {
            scene.style.transition = 'opacity 0.5s, transform 0.5s';
            scene.style.opacity = '0';
            scene.style.transform = 'translateY(-20px) scale(0.95)';
        }
    }, 1400);
    
    setTimeout(() => {
        if (scene) scene.classList.add('hidden');
        if (box) {
            box.classList.remove('hidden');
            box.style.animation = 'letterReveal 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        }
        if (btn) {
            btn.classList.remove('hidden');
            btn.style.animation = 'letterReveal 0.8s 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            btn.style.opacity = '0';
        }
    }, 1800);
}

// Reset seal state when navigating to step 39
function initLetterSeal() {
    sealBroken = false;
    const scene = document.getElementById('letterScene');
    const envelope = document.getElementById('envelope3d');
    const seal = document.getElementById('waxSeal');
    const hint = document.getElementById('sealHint');
    const box = document.getElementById('letterBox');
    const btn = document.getElementById('letterBtn');
    
    // Reset all states
    if (scene) {
        scene.classList.remove('hidden');
        scene.style.opacity = '';
        scene.style.transform = '';
    }
    if (envelope) {
        envelope.classList.remove('opening', 'opened');
    }
    if (seal) {
        seal.classList.remove('breaking');
    }
    if (hint) {
        hint.style.opacity = '';
    }
    if (box) {
        box.classList.add('hidden');
        box.style.animation = '';
    }
    if (btn) {
        btn.classList.add('hidden');
        btn.style.animation = '';
        btn.style.opacity = '';
    }
}

// Legacy function for backward compatibility
function openLetter() {
    initLetterSeal();
}

function initLetterPull() {
    initLetterSeal();
}

// Step 40: No button dodge - jumps around the ENTIRE screen!
let dodgeCount = 0;
const dodgeMessages = [
    'Nice try! 😏',
    'Nope! 🙅‍♀️',
    'Can\'t catch me! 🏃‍♂️',
    'Wrong button! 💕',
    'Are you sure about that? 🤨',
    'The YES button is right there! 👆',
    'I\'m faster than you! ⚡',
    'Keep trying! 😈',
    'Riyu... really? 😂',
    'Just say YES already! 💖',
    'You know you want to! 🥺',
    'This button is broken! 🔧',
    '*dodges* 🕺',
    'Mission Impossible! 🎬',
    'You\'ll never catch me! 🦸‍♂️'
];

function dodgeNo() {
    const btn = document.getElementById('noBtn');
    if (!btn) return;
    
    dodgeCount++;
    
    // Move to body for full screen movement
    if (btn.parentElement.classList.contains('btn-group')) {
        document.body.appendChild(btn);
    }
    
    // Make it fixed position so it can go anywhere on screen
    btn.style.position = 'fixed';
    btn.style.zIndex = '9999';
    
    // Random position anywhere on the visible screen (with padding from edges)
    const padding = 80;
    const maxX = window.innerWidth - btn.offsetWidth - padding;
    const maxY = window.innerHeight - btn.offsetHeight - padding;
    
    const newX = Math.max(padding, Math.random() * maxX);
    const newY = Math.max(padding, Math.random() * maxY);
    
    btn.style.left = newX + 'px';
    btn.style.top = newY + 'px';
    btn.style.transform = 'rotate(' + (Math.random() * 30 - 15) + 'deg)';
    
    // Shrink slightly each time
    const scale = Math.max(0.5, 1 - (dodgeCount * 0.05));
    btn.style.transform += ' scale(' + scale + ')';
    
    // Show fun message
    const msg = dodgeMessages[Math.floor(Math.random() * dodgeMessages.length)];
    toast(msg);
    
    // Vibrate on mobile
    if (navigator.vibrate) navigator.vibrate(30);
    
    // After many attempts, make button nearly invisible
    if (dodgeCount > 10) {
        btn.style.opacity = Math.max(0.2, 0.5 - (dodgeCount - 10) * 0.05);
    }
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
