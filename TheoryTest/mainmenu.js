/**
 * File: mainmenu.js
 * Version: 2.7.5
 * Feature: Dice Debug in Footer & Lock-Loop Fix
 */

const JS_VERSION = "2.7.5";
const ALPH = "ABCDEFGHJKMNPQRTUVWXYZ2346789#";
const curMonthYear = (new Date().getUTCMonth() + 1) + "-" + new Date().getUTCFullYear();
const IMAGE_CACHE_NAME = 'orion-image-cache';

const categoryFiles = [
    'alertness', 'attitude', 'safety', 'hazard', 'margins', 
    'vulnerable', 'other', 'conditions', 'motorway', 
    'signs', 'documents', 'incidents', 'loading'
];

const jokes = [
    "The best things in life are free, but a mock test costs this question!",
    "Life is full of crossroads; this one only requires a 'Tell Me' answer.",
    "A free app is a rare gift. A driver who knows their tyre pressures is rarer! Let’s see if you’re both.",
    "Think of this as a digital speed bump. Answer correctly to smooth it out.",
    "Mirror, signal, position….. but first, answer this question.",
    "Safe driving is no accident, but this pop-up was! Answer to proceed.",
    "Even the best drivers need a refresher. Here’s yours!"
];

function init() {
    document.getElementById('v-tag').innerText = `v${JS_VERSION}`;
    
    if (localStorage.getItem('gatekeeper_stamp') === curMonthYear) { 
        document.getElementById('lock-ui').style.display = 'none';
        checkSyncStatus(); 
    }
}

function verifyAccess() {
    const input = document.getElementById('passCode').value.toUpperCase();
    if (input === calcKey()) { 
        localStorage.setItem('gatekeeper_stamp', curMonthYear);
        document.getElementById('lock-ui').style.display = 'none';
        checkSyncStatus(); 
    } else { alert("Access Denied."); }
}

async function checkSyncStatus() {
    if (!localStorage.getItem('orion_master.json')) { 
        document.getElementById('sync-modal').style.display = 'flex'; 
    } else { 
        showMenu(); 
    }
}

async function startSync(wantsFull) {
    document.getElementById('sync-modal').style.display = 'none';
    await buildMasterDatabase();
    showMenu();
}

async function buildMasterDatabase() {
    const syncUI = document.getElementById('sync-ui');
    const bar = document.getElementById('sync-bar');
    const statusText = document.getElementById('sync-status-text');
    syncUI.style.display = 'block';
    let masterPool = [];
    
    for (let i = 0; i < categoryFiles.length; i++) {
        statusText.innerText = `Updating: ${categoryFiles[i]}`;
        const res = await fetch(`${categoryFiles[i]}.json`);
        if (res.ok) masterPool = masterPool.concat(await res.json());
        bar.style.width = Math.round(((i + 1) / categoryFiles.length) * 100) + "%";
    }
    localStorage.setItem('orion_master.json', JSON.stringify(masterPool));
    syncUI.style.display = 'none';
}

async function showMenu() {
    document.getElementById('status-msg').style.display = 'block';
    const menuOptions = document.getElementById('menu-options');
    menuOptions.innerHTML = ''; 
    menuOptions.style.display = 'flex';

    const master = JSON.parse(localStorage.getItem('orion_master.json') || "[]");
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const keys = await cache.keys();
    
    // --- Dice Logic Fix ---
    const today = new Date().toDateString();
    const hasPassedToday = localStorage.getItem('smtm_passed_today') === today;
    
    // Use session-based dice roll so it doesn't re-roll every time you click 'Back'
    let diceRoll = sessionStorage.getItem('current_dice_roll');
    if (!diceRoll) {
        diceRoll = Math.floor(Math.random() * 6) + 1;
        sessionStorage.setItem('current_dice_roll', diceRoll);
    }
    
    const shouldLock = !hasPassedToday && parseInt(diceRoll) === 6;

    // Update Footer with Debug Dice Info
    document.getElementById('db-counts').innerText = `Database: ${master.length} Qs • ${keys.length} Signs • Dice: ${diceRoll}`;

    try {
        const response = await fetch('options.json');
        const options = await response.json();
        
        options.forEach(opt => {
            const anchor = document.createElement('a');
            anchor.href = opt.htmlName;
            // Only lock if we actually need to
            if (shouldLock) {
                anchor.className = 'btn btn-blue main-btn btn-grey';
                anchor.onclick = (e) => { 
                    e.preventDefault(); 
                    document.getElementById('smtm-modal').style.display = 'flex';
                };
            } else {
                anchor.className = 'btn btn-blue main-btn';
            }
            anchor.innerText = opt.description.toUpperCase();
            menuOptions.appendChild(anchor);
        });

        if (shouldLock && document.getElementById('smtm-container').style.display !== 'none') {
            setupSMTM();
            document.getElementById('smtm-modal').style.display = 'flex';
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
            document.getElementById('joke-text').innerText = randomJoke;
        }
    } catch (e) { console.error(e); }
}

async function setupSMTM() {
    document.getElementById('smtm-container').style.display = 'block';
    const res = await fetch('showmetellme.json');
    const data = await res.json();
    const q = data[Math.floor(Math.random() * data.length)];
    
    document.getElementById('smtm-question').innerText = q.question;
    const ansDiv = document.getElementById('smtm-answers');
    ansDiv.innerHTML = '';
    
    Object.entries(q.choices).forEach(([key, val]) => {
        const b = document.createElement('button');
        b.className = 'smtm-choice';
        b.innerText = val;
        b.onclick = () => {
            if (key === q.correct) {
                document.getElementById('smtm-feedback').innerText = "Correct: " + q.explanation;
                document.getElementById('smtm-feedback').style.display = 'block';
                document.getElementById('smtm-continue').style.display = 'block';
                ansDiv.style.pointerEvents = 'none';
            } else { alert("Try again."); }
        };
        ansDiv.appendChild(b);
    });
}

function unlockButtons() {
    localStorage.setItem('smtm_passed_today', new Date().toDateString());
    sessionStorage.setItem('current_dice_roll', '1'); // Force dice to non-6 for session
    document.getElementById('smtm-modal').style.display = 'none';
    document.getElementById('smtm-container').style.display = 'none';
    
    // Refresh menu to show active buttons
    showMenu();
}

function calcKey() {
    const d = new Date(); 
    const s = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1, 0, 0, 0));
    const e = new Date(Date.UTC(1900, 0, 1, 0, 0, 0)); 
    const m = Math.floor((s.getTime() - e.getTime()) / 60000);
    let v = m % Math.pow(32, 4); 
    let r = ""; 
    for (let j = 0; j < 4; j++) { r = ALPH.charAt(v % 32) + r; v = Math.floor(v / 32); }
    let t = 0; 
    let ra = r.split('').reverse();
    for (let j = 0; j < ra.length; j++) { 
        let x = ALPH.indexOf(ra[j]); 
        if (j % 2 === 0) { x *= 2; if (x >= 32) x = (x % 32) + Math.floor(x / 32); } 
        t += x; 
    }
    let ci = (32 - (t % 32)) % 32; 
    return r + (ALPH[ci] || ALPH[0]);
}

function triggerManualSync() {
    if (confirm("Reset local storage?")) { localStorage.clear(); window.location.reload(); }
}

window.onload = init;
