/**
 * File: mainmenu.js
 * Version: v2.5.6
 * Feature: Resilient Sync & Loop Fix
 */

const JS_VERSION = "v2.5.6";
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

    // If we have JSON but full sync hasn't been flagged, ask.
    if (!masterData) {
        showSyncModal(false); 
    } else if (syncFull !== "true") {
        showSyncModal(true);  
    } else {
        showMenu();           
    }
}

function showSyncModal(isResume) {
    const modal = document.getElementById('sync-modal');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    
    if (isResume) {
        title.innerText = "Sync Incomplete";
        desc.innerText = "The image library is not fully cached. Would you like to finish the download or continue to the menu?";
    } else {
        title.innerText = "Assets Required";
        desc.innerText = "Download all images now for 100% offline use, or download them automatically as you practice?";
    }
    modal.style.display = 'flex';
}

async function startSync(wantsFull) {
    document.getElementById('sync-modal').style.display = 'none';
    if (wantsFull) {
        await buildMasterDatabase(true);
    } else {
        // If they chose "As I Go", we still need the JSON text
        await buildMasterDatabase(false);
        // Flag it as 'true' so we don't keep nagging them every time they open the app
        localStorage.setItem('orion_full_sync_complete', "dynamic"); 
        showMenu();
    }
}

async function buildMasterDatabase(fullImageSync) {
    const syncUI = document.getElementById('sync-ui');
    const bar = document.getElementById('sync-bar');
    const statusText = document.getElementById('sync-status-text');
    const percentText = document.getElementById('sync-percent-text');

    syncUI.style.display = 'block';

    let masterPool = [];
    
    // 1. JSON Sync
    if (!localStorage.getItem('orion_master.json')) {
        try {
            for (let i = 0; i < categoryFiles.length; i++) {
                statusText.innerText = `Fetching ${categoryFiles[i]}...`;
                const res = await fetch(`${categoryFiles[i]}.json`);
                if (res.ok) {
                    masterPool = masterPool.concat(await res.json());
                }
                let p = Math.round(((i + 1) / categoryFiles.length) * 20);
                bar.style.width = p + "%";
                percentText.innerText = `${p}%`;
            }
            localStorage.setItem('orion_master.json', JSON.stringify(masterPool));
        } catch (e) {
            statusText.innerText = "Sync Interrupted.";
            setTimeout(showMenu, 1500);
            return;
        }
    } else {
        masterPool = JSON.parse(localStorage.getItem('orion_master.json'));
    }

    // 2. Image Sync
    if (fullImageSync) {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        for (let j = 0; j < masterPool.length; j++) {
            const qId = masterPool[j].id;
            const imgUrl = `images/${qId}.jpeg`;
            
            try {
                const cached = await cache.match(imgUrl);
                if (!cached) {
                    const imgRes = await fetch(imgUrl);
                    if (imgRes.ok) await cache.put(imgUrl, imgRes);
                }
            } catch (e) {
                // If internet cuts out, we stop but don't crash
                statusText.innerText = "Connection lost. Opening Menu...";
                setTimeout(showMenu, 1500);
                return;
            }
            
            if (j % 20 === 0) {
                statusText.innerText = `Caching: ${qId}.jpeg`;
                let p = 20 + Math.round((j / masterPool.length) * 80);
                bar.style.width = p + "%";
                percentText.innerText = `${p}%`;
            }
        }
        // Success! Set flag to stop the modal
        localStorage.setItem('orion_full_sync_complete', "true");
    }

    showMenu();
}

async function showMenu() {
    document.getElementById('sync-ui').style.display = 'none';
    const menuOptions = document.getElementById('menu-options');
    menuOptions.innerHTML = ''; 
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
            
            // Check if we are in "Dynamic" or "Incomplete" mode
            const syncStatus = localStorage.getItem('orion_full_sync_complete');
            if (opt.htmlName.includes('mock') && syncStatus !== "true") {
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

// ... rest of the calcKey and helper functions remain the same ...
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
