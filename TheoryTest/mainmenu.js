/**
 * File: mainmenu.js
 * Version: v2.5.5
 * Feature: Fixed Unlock Flow & Sync Logic
 */

const JS_VERSION = "v2.5.5";
const ALPH = "ABCDEFGHJKMNPQRTUVWXYZ2346789#";
const curMonthYear = (new Date().getUTCMonth() + 1) + "-" + new Date().getUTCFullYear();
const IMAGE_CACHE_NAME = 'orion-image-cache';

const categoryFiles = [
    'alertness', 'attitude', 'safety', 'hazard', 'margins', 
    'vulnerable', 'other', 'conditions', 'motorway', 
    'signs', 'documents', 'incidents', 'loading'
];

function init() {
    const vTag = document.getElementById('v-tag');
    if(vTag) vTag.innerText = `JS: ${JS_VERSION}`;

    // Priority 1: Check if already unlocked for this month
    if (localStorage.getItem('gatekeeper_stamp') === curMonthYear) { 
        document.getElementById('lock-ui').style.display = 'none';
        checkSyncStatus(); 
    } else {
        // Show Lock UI if not authenticated
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

    // Display status message once unlocked
    document.getElementById('status-msg').style.display = 'block';

    if (!masterData) {
        showSyncModal(false); // New user or forced refresh
    } else if (syncFull !== "true") {
        showSyncModal(true);  // Partial sync
    } else {
        showMenu();           // Fully synced
    }
}

function showSyncModal(isResume) {
    const modal = document.getElementById('sync-modal');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    
    if (isResume) {
        title.innerText = "Sync Incomplete";
        desc.innerText = "You have the questions, but your offline image library is not finished. Resume full download?";
    } else {
        title.innerText = "Assets Required";
        desc.innerText = "Would you like to download all images now for 100% offline reliability? (Approx. 30MB)";
    }
    modal.style.display = 'flex';
}

async function startSync(wantsFull) {
    document.getElementById('sync-modal').style.display = 'none';
    if (wantsFull) {
        await buildMasterDatabase(true);
    } else {
        // Just load JSON if missing, then go straight to menu
        await buildMasterDatabase(false);
    }
}

async function buildMasterDatabase(fullImageSync) {
    const syncUI = document.getElementById('sync-ui');
    const bar = document.getElementById('sync-bar');
    const statusText = document.getElementById('sync-status-text');
    const percentText = document.getElementById('sync-percent-text');

    syncUI.style.display = 'block';

    let masterPool = [];
    
    // 1. JSON Sync Logic
    if (!localStorage.getItem('orion_master.json')) {
        try {
            for (let i = 0; i < categoryFiles.length; i++) {
                statusText.innerText = `Fetching ${categoryFiles[i]}...`;
                const res = await fetch(`${categoryFiles[i]}.json`);
                if (res.ok) {
                    const data = await res.json();
                    masterPool = masterPool.concat(data);
                }
                let p = Math.round(((i + 1) / categoryFiles.length) * 20);
                bar.style.width = p + "%";
                percentText.innerText = `${p}%`;
            }
            localStorage.setItem('orion_master.json', JSON.stringify(masterPool));
        } catch (e) {
            statusText.innerText = "Network Error during JSON sync.";
            return;
        }
    } else {
        masterPool = JSON.parse(localStorage.getItem('orion_master.json'));
    }

    // 2. Image Sync Logic
    if (fullImageSync) {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        for (let j = 0; j < masterPool.length; j++) {
            const qId = masterPool[j].id;
            const imgUrl = `images/${qId}.jpeg`;
            
            const cached = await cache.match(imgUrl);
            if (!cached) {
                try {
                    const imgRes = await fetch(imgUrl);
                    if (imgRes.ok) {
                        await cache.put(imgUrl, imgRes);
                    } else { throw new Error(); }
                } catch (e) {
                    statusText.innerText = "Paused. Dynamic mode enabled.";
                    setTimeout(showMenu, 1500);
                    return; 
                }
            }
            
            if (j % 15 === 0) {
                statusText.innerText = `Caching: ${qId}.jpeg`;
                let p = 20 + Math.round((j / masterPool.length) * 80);
                bar.style.width = p + "%";
                percentText.innerText = `${p}%`;
            }
        }
        localStorage.setItem('orion_full_sync_complete', "true");
    }

    showMenu();
}

async function showMenu() {
    document.getElementById('sync-ui').style.display = 'none';
    const menuOptions = document.getElementById('menu-options');
    menuOptions.innerHTML = ''; // Clear previous
    menuOptions.style.display = 'flex';

    try {
        const response = await fetch('options.json');
        const options = await response.json();
        options.forEach(opt => {
            const anchor = document.createElement('a');
            anchor.href = opt.htmlName;
            anchor.className = 'btn btn-blue';
            anchor.style.textDecoration = 'none';
            anchor.style.marginBottom = '12px';
            anchor.style.padding = '15px';
            anchor.style.borderRadius = '12px';
            anchor.style.textAlign = 'center';
            anchor.innerText = opt.description;
            
            // Safety check for Timed Mock
            if (opt.htmlName.includes('mock') && localStorage.getItem('orion_full_sync_complete') !== "true") {
                anchor.onclick = (e) => {
                    if (!confirm("Caution: Full image cache not found. Timed Mock requires internet. Proceed?")) e.preventDefault();
                };
            }
            menuOptions.appendChild(anchor);
        });
    } catch (err) {
        menuOptions.innerHTML = `<p style="color:red;">Failed to load Menu Options.</p>`;
    }
}

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
    if (confirm("Reset local database and images?")) {
        localStorage.removeItem('orion_master.json');
        localStorage.removeItem('orion_full_sync_complete');
        window.location.reload();
    }
}

window.onload = init;
