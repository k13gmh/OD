/**
 * File: mainmenu.js
 * Version: v2.5.4
 * Feature: Sync Logic, Partial Resume, and Dynamic Loading
 */

const JS_VERSION = "v2.5.4";
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
        checkSyncStatus(); 
    }
}

function verifyAccess() {
    const input = document.getElementById('passCode').value.toUpperCase();
    if (input === calcKey()) { 
        localStorage.setItem('gatekeeper_stamp', curMonthYear);
        localStorage.setItem('orion_session_token', getMMYY());
        checkSyncStatus(); 
    } else { alert("Incorrect Code."); }
}

async function checkSyncStatus() {
    const masterData = localStorage.getItem('orion_master.json');
    const syncFull = localStorage.getItem('orion_full_sync_complete');

    if (!masterData) {
        showSyncModal(false); // First time
    } else if (syncFull !== "true") {
        showSyncModal(true); // Partial images
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
        desc.innerText = "You have the questions, but your offline image library is not finished. Resume full download?";
    }
    modal.style.display = 'flex';
}

async function startSync(wantsFull) {
    document.getElementById('sync-modal').style.display = 'none';
    if (wantsFull) {
        await buildMasterDatabase(true);
    } else {
        await buildMasterDatabase(false);
        showMenu();
    }
}

async function buildMasterDatabase(fullImageSync) {
    const syncUI = document.getElementById('sync-ui');
    const bar = document.getElementById('sync-bar');
    const statusText = document.getElementById('sync-status-text');
    const percentText = document.getElementById('sync-percent-text');

    document.getElementById('lock-ui').style.display = 'none';
    syncUI.style.display = 'block';

    let masterPool = [];
    
    // 1. JSON Sync
    if (!localStorage.getItem('orion_master.json')) {
        try {
            for (let i = 0; i < categoryFiles.length; i++) {
                statusText.innerText = `Fetching ${categoryFiles[i]}...`;
                const res = await fetch(`${categoryFiles[i]}.json`);
                if (res.ok) masterPool = masterPool.concat(await res.json());
                let p = Math.round(((i + 1) / categoryFiles.length) * 20);
                bar.style.width = p + "%";
                percentText.innerText = `${p}%`;
            }
            localStorage.setItem('orion_master.json', JSON.stringify(masterPool));
        } catch (e) {
            statusText.innerText = "JSON Sync Failed.";
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
            
            const cached = await cache.match(imgUrl);
            if (!cached) {
                try {
                    const imgRes = await fetch(imgUrl);
                    if (imgRes.ok) {
                        await cache.put(imgUrl, imgRes);
                    } else { throw new Error(); }
                } catch (e) {
                    statusText.innerText = "Paused. Continue later.";
                    setTimeout(showMenu, 1500);
                    return; 
                }
            }
            
            if (j % 15 === 0) {
                statusText.innerText = `Saving: ${qId}.jpeg`;
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
    document.getElementById('lock-ui').style.display = 'none';
    const menuOptions = document.getElementById('menu-options');
    menuOptions.style.display = 'flex';
    document.getElementById('status-msg').style.display = 'block';

    try {
        const response = await fetch('options.json');
        const options = await response.json();
        menuOptions.innerHTML = ''; 
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
            
            if (opt.htmlName.includes('mock') && localStorage.getItem('orion_full_sync_complete') !== "true") {
                anchor.onclick = (e) => {
                    if (!confirm("Caution: Images not fully cached. Internet required for Timed Mock. Proceed?")) e.preventDefault();
                };
            }
            menuOptions.appendChild(anchor);
        });
    } catch (err) {
        menuOptions.innerHTML = `<p style="color:red;">Menu Error</p>`;
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
