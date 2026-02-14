/**
 * File: mainmenu.js
 * Version: 2.8.3
 * Feature: Debug Indicators (M: Master, O: Options, S: SMTM Status)
 */

const JS_VERSION = "2.8.3";
const HTML_VERSION = "2.8.3";
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
    const debugRight = document.getElementById('debug-right');
    if (debugRight) debugRight.innerText = `vh${HTML_VERSION} j${JS_VERSION}`;
    
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
        document.getElementById('lock-ui').style.display = 'none';
        checkSyncStatus(); 
    } else { 
        alert("Access Denied."); 
    }
}

async function checkSyncStatus() {
    try {
        if (!localStorage.getItem('orion_master.json')) { 
            document.getElementById('sync-modal').style.display = 'flex'; 
        } else { 
            showMenu(); 
        }
    } catch (e) {
        showMenu(); 
    }
}

async function startSync() {
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
        try {
            statusText.innerText = `Updating: ${categoryFiles[i]}`;
            const res = await fetch(`${categoryFiles[i]}.json`);
            if (res.ok) {
                const data = await res.json();
                masterPool = masterPool.concat(data);
            }
        } catch (err) {
            console.warn("Failed sync:", categoryFiles[i]);
        }
        bar.style.width = Math.round(((i + 1) / categoryFiles.length) * 100) + "%";
    }
    localStorage.setItem('orion_master.json', JSON.stringify(masterPool));
    syncUI.style.display = 'none';
}

function getWeekNumber() {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

async function showMenu() {
    const menuOptions = document.getElementById('menu-options');
    if (!menuOptions) return;
    
    document.getElementById('status-msg').style.display = 'block';
    menuOptions.innerHTML = ''; 
    menuOptions.style.display = 'flex';

    // Diagnostic Variables
    let masterStatus = "Empty";
    let optionsStatus = "Missing";
    let smtmStatus = "Lock";

    const masterRaw = localStorage.getItem('orion_master.json');
    const master = JSON.parse(masterRaw || "[]");
    if (masterRaw && master.length > 0) masterStatus = "OK";
    
    let signCount = 0;
    try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const keys = await cache.keys();
        signCount = keys.length;
    } catch (e) { signCount = 0; }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const today = new Date().toDateString();
    const hasPassedToday = localStorage.getItem('smtm_passed_today') === today;
    const shouldLock = (diceRoll === 6 && !hasPassedToday);
    
    if (!shouldLock) smtmStatus = "Pass";

    try {
        const response = await fetch('options.json');
        if (response.ok) {
            optionsStatus = "OK";
            const options = await response.json();
            
            options.forEach(opt => {
                const anchor = document.createElement('a');
                anchor.href = opt.htmlName;
                
                if (opt.htmlName.includes("wallofshame")) {
                    anchor.className = 'btn btn-blue main-btn';
                } else if (shouldLock) {
                    anchor.className = 'btn btn-grey main-btn';
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

            if (shouldLock) {
                document.getElementById('smtm-modal').style.display = 'flex';
                const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                document.getElementById('joke-text').innerText = randomJoke;
                setupSMTM();
            }
        }
    } catch (e) { 
        optionsStatus = "Err";
        menuOptions.innerHTML = `<p style="color:red; padding:20px;">Error loading menu.</p>`;
    }

    // Update the Debug Line with M, O, and S
    const debugLeft = document.getElementById('debug-left');
    if(debugLeft) {
        debugLeft.innerText = `Orion Drive • Questions: ${master.length} • Signs: ${signCount} • Roll: ${diceRoll} • M:${masterStatus} O:${optionsStatus} S:${smtmStatus}`;
    }
}

async function setupSMTM() {
    try {
        const qContainer = document.getElementById('smtm-question');
        document.getElementById('smtm-container').style.display = 'block';
        
        const res = await fetch('showmetellme.json');
        const data = await res.json();
        
        const weekNum = getWeekNumber();
        const q = data[weekNum] || data[0]; 
        
        qContainer.innerText = q.question;
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
    } catch (e) {
        unlockButtons();
    }
}

function unlockButtons() {
    localStorage.setItem('smtm_passed_today', new Date().toDateString());
    document.getElementById('smtm-modal').style.display = 'none';
    document.getElementById('smtm-container').style.display = 'none';
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
    if (confirm("Reset local storage?")) { 
        localStorage.clear(); 
        window.location.reload(); 
    }
}

window.onload = init;
