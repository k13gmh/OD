/**
 * File: mainmenu.js
 * Version: v2.6.5
 * Feature: Weekly SMTM, Dice Roll Lock, Corrected Sayings
 */

const JS_VERSION = "v2.6.5";
const ALPH = "ABCDEFGHJKMNPQRTUVWXYZ2346789#";
const curMonthYear = (new Date().getUTCMonth() + 1) + "-" + new Date().getUTCFullYear();
const IMAGE_CACHE_NAME = 'orion-image-cache';
let smtmPassed = false;

const categoryFiles = [
    'alertness', 'attitude', 'safety', 'hazard', 'margins', 
    'vulnerable', 'other', 'conditions', 'motorway', 
    'signs', 'documents', 'incidents', 'loading'
];

const jokes = [
    "The best things in life are free, but a mock test costs this question!",
    "There’s no such thing as a free lunch, but there is a free app. Pay the toll!",
    "Life is full of crossroads; this one only requires a 'Tell Me' answer.",
    "Think of this as a digital speed bump. Answer correctly to smooth it out.",
    "Education is expensive, but this app is free—consider this your tuition.",
    "A free app is a rare gift. A driver who knows their pressures is rarer!",
    "Your luck just ran out! A six was rolled. Time for some knowledge."
];

function init() {
    const vTag = document.getElementById('v-tag');
    if(vTag) vTag.innerText = `v${JS_VERSION}`;

    if (localStorage.getItem('gatekeeper_stamp') === curMonthYear) { 
        document.getElementById('lock-ui').style.display = 'none';
        checkSyncStatus(); 
    } else {
        document.getElementById('lock-ui').style.display = 'block';
    }
}

function verifyAccess() {
    const input = document.getElementById('passCode').value.toUpperCase();
    if (input === calcKey()) { 
        localStorage.setItem('gatekeeper_stamp', curMonthYear);
        localStorage.setItem('orion_session_token', getMMYY());
        document.getElementById('lock-ui').style.display = 'none';
        checkSyncStatus(); 
    } else { 
        alert("Incorrect Code."); 
    }
}

async function checkSyncStatus() {
    const masterData = localStorage.getItem('orion_master.json');
    const syncFull = localStorage.getItem('orion_full_sync_complete');
    document.getElementById('status-msg').style.display = 'block';

    if (!masterData) {
        showSyncModal(false); 
    } else if (syncFull !== "true" && syncFull !== "dynamic") {
        showSyncModal(true);  
    } else {
        showMenu();           
    }
}

function showSyncModal(isResume) {
    const modal = document.getElementById('sync-modal');
    if (isResume) {
        document.getElementById('modal-title').innerText = "Sync Incomplete";
        document.getElementById('modal-desc').innerText = "The image library is not fully cached. Resume download?";
    }
    modal.style.display = 'flex';
}

async function startSync(wantsFull) {
    document.getElementById('sync-modal').style.display = 'none';
    if (wantsFull) {
        await buildMasterDatabase(true);
    } else {
        await buildMasterDatabase(false);
        localStorage.setItem('orion_full_sync_complete', "dynamic"); 
        showMenu();
    }
}

async function buildMasterDatabase(fullImageSync) {
    const syncUI = document.getElementById('sync-ui');
    const bar = document.getElementById('sync-bar');
    const statusText = document.getElementById('sync-status-text');

    syncUI.style.display = 'block';
    let masterPool = [];
    
    try {
        for (let i = 0; i < categoryFiles.length; i++) {
            statusText.innerText = `Fetching ${categoryFiles[i]}...`;
            const res = await fetch(`${categoryFiles[i]}.json`);
            if (res.ok) masterPool = masterPool.concat(await res.json());
            bar.style.width = Math.round(((i + 1) / categoryFiles.length) * 20) + "%";
        }
        localStorage.setItem('orion_master.json', JSON.stringify(masterPool));
    } catch (e) {
        statusText.innerText = "Sync Error.";
        return;
    }

    if (fullImageSync) {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        for (let j = 0; j < masterPool.length; j++) {
            const imgUrl = `images/${masterPool[j].id}.jpeg`;
            try {
                const cached = await cache.match(imgUrl);
                if (!cached) {
                    const imgRes = await fetch(imgUrl);
                    if (imgRes.ok) await cache.put(imgUrl, imgRes);
                }
            } catch (e) {}
            bar.style.width = (20 + Math.round((j / masterPool.length) * 80)) + "%";
        }
        localStorage.setItem('orion_full_sync_complete', "true");
    }
    showMenu();
}

async function showMenu() {
    document.getElementById('sync-ui').style.display = 'none';
    const menuOptions = document.getElementById('menu-options');
    menuOptions.innerHTML = ''; 
    menuOptions.style.display = 'flex';

    // Update Counts in Footer
    const master = JSON.parse(localStorage.getItem('orion_master.json') || "[]");
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const keys = await cache.keys();
    document.getElementById('db-counts').innerText = `Database: ${master.length} Questions - ${keys.length} Road Signs`;

    // 1. Build Buttons (initially locked if roll hits 6)
    try {
        const response = await fetch('options.json');
        const options = await response.json();
        
        // Determine if we show SMTM today
        const today = new Date().toDateString();
        const hasPassedToday = localStorage.getItem('smtm_passed_today') === today;
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        
        // Lock logic: If not passed today AND rolled a 6
        const shouldLock = !hasPassedToday && diceRoll === 6;

        options.forEach(opt => {
            const anchor = document.createElement('a');
            anchor.href = opt.htmlName;
            anchor.className = 'btn btn-blue main-btn' + (shouldLock ? ' btn-grey' : '');
            anchor.innerText = opt.description;
            anchor.style.textDecoration = 'none';
            anchor.style.marginBottom = '12px';
            anchor.style.padding = '15px';
            anchor.style.borderRadius = '12px';
            anchor.style.textAlign = 'center';
            anchor.style.width = '100%';
            anchor.style.boxSizing = 'border-box';
            
            if (shouldLock) {
                anchor.onclick = (e) => { e.preventDefault(); alert("Please answer the 'Show Me, Tell Me' question below first!"); };
            }
            menuOptions.appendChild(anchor);
        });

        if (shouldLock) {
            setupSMTM();
            document.getElementById('joke-text').innerText = jokes[Math.floor(Math.random() * jokes.length)];
            document.getElementById('smtm-modal').style.display = 'flex';
        }

    } catch (err) { console.error(err); }
}

async function setupSMTM() {
    const container = document.getElementById('smtm-container');
    container.style.display = 'block';
    
    const res = await fetch('showmetellme.json');
    const data = await res.json();
    
    // Calculate Week Question (1-11)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const day = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(day / 7);
    const qIndex = weekNum % 11; // 0 to 10
    
    const q = data[qIndex];
    document.getElementById('smtm-question').innerText = q.question;
    
    // Shuffle choices
    const choices = Object.entries(q.choices);
    choices.sort(() => Math.random() - 0.5);
    
    const ansDiv = document.getElementById('smtm-answers');
    ansDiv.innerHTML = '';
    
    choices.forEach(([key, val]) => {
        const b = document.createElement('button');
        b.className = 'smtm-choice';
        b.innerText = val;
        b.onclick = () => {
            if (key === q.correct) {
                document.getElementById('smtm-feedback').innerText = "Correct! " + q.explanation;
                document.getElementById('smtm-feedback').style.display = 'block';
                document.getElementById('smtm-continue').style.display = 'block';
                ansDiv.style.pointerEvents = 'none';
            } else {
                alert("Incorrect. Read carefully and try again.");
            }
        };
        ansDiv.appendChild(b);
    });
}

function unlockButtons() {
    localStorage.setItem('smtm_passed_today', new Date().toDateString());
    const btns = document.querySelectorAll('.main-btn');
    btns.forEach(b => {
        b.classList.remove('btn-grey');
        b.onclick = null; // Restore original link behavior
    });
    document.getElementById('smtm-container').style.opacity = '0.5';
    document.getElementById('smtm-container').style.pointerEvents = 'none';
    document.getElementById('smtm-continue').innerText = "System Unlocked";
}

// ... Keep getMMYY, calcKey, triggerManualSync same as v2.6.4 ...

function getMMYY() {
    const d = new Date();
    return String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCFullYear()).slice(-2);
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
    if (confirm("Reset local data?")) {
        localStorage.removeItem('orion_master.json');
        localStorage.removeItem('orion_full_sync_complete');
        window.location.reload();
    }
}

window.onload = init;
