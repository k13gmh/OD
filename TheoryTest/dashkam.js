/**
 * Orion Drive AI Assistant: dashkam.js
 * Version: 1.0.1
 * Character: Dash Kam
 * Function: Ask the Audience (Bar Chart with LED levels)
 */

function dashkam(id) {
    injectDashStyles();
    const overlay = createDashOverlay();
    document.body.appendChild(overlay);

    const masterData = JSON.parse(localStorage.getItem('orion_master.json') || "[]");
    const foundInMaster = masterData.find(item => item.id == id);
    
    if (!foundInMaster) return;

    let speechText = "";
    let percentages = { A: 0, B: 0, C: 0, D: 0 };
    const correctLetter = foundInMaster.correct;
    const letters = ['A', 'B', 'C', 'D'];

    // Randomize Mode Selection [cite: 2026-02-06]
    const modeRoll = Math.random(); 

    if (modeRoll < 0.10) { 
        // MODE: HEAVY FOG (Split/Similar answers) [cite: 2026-02-06]
        speechText = "Static interference detected... the convoy is split on this route. Proceed with caution.";
        let total = 100;
        letters.forEach((l, i) => {
            const val = i === 3 ? total : Math.floor(Math.random() * 10) + 20; 
            percentages[l] = val;
            total -= val;
        });
    } else if (modeRoll < 0.15) { 
        // MODE: THE WRONG TURN (Sabotage - 5% chance) [cite: 2026-02-06]
        speechText = "Observation: This lane has the most traffic flow. It looks like the main route.";
        const wrongLetters = letters.filter(l => l !== correctLetter);
        const trickLetter = wrongLetters[Math.floor(Math.random() * wrongLetters.length)];
        calculateWeighted(percentages, trickLetter, letters);
    } else {
        // MODE: HIGH VISIBILITY (Standard/Correct) [cite: 2026-02-06]
        speechText = "Analyzing 60fps footage... the telemetry suggests a clear path.";
        calculateWeighted(percentages, correctLetter, letters);
    }

    document.getElementById('dash-speech-txt').innerText = speechText;
    renderBars(percentages);
}

function calculateWeighted(obj, target, all) {
    let mainVal = Math.floor(Math.random() * 20) + 60; // 60-80% [cite: 2026-02-06]
    obj[target] = mainVal;
    let remaining = 100 - mainVal;
    
    const others = all.filter(l => l !== target);
    others.forEach((l, i) => {
        const val = i === 2 ? remaining : Math.floor(Math.random() * (remaining / 1.5));
        obj[l] = val;
        remaining -= val;
    });
}

function renderBars(data) {
    const container = document.getElementById('dash-chart');
    container.innerHTML = '';
    
    Object.entries(data).forEach(([letter, percent]) => {
        const barWrap = document.createElement('div');
        barWrap.className = 'dash-bar-wrap';
        barWrap.innerHTML = `
            <div class="dash-perc">${percent}%</div>
            <div class="dash-bar-bg">
                <div class="dash-bar-fill" style="height: ${percent}%"></div>
            </div>
            <div class="dash-letter">${letter}</div>
        `;
        container.appendChild(barWrap);
    });
}

function closeDash() {
    const el = document.getElementById('dashkam-overlay');
    if (el) el.remove();
}

function injectDashStyles() {
    if (document.getElementById('dash-styles')) return;
    const style = document.createElement('style');
    style.id = 'dash-styles';
    style.innerHTML = `
        #dashkam-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; justify-content: center; align-items: center; }
        .dash-card { background: #1a1a1a; color: #00ff00; width: 90%; max-width: 400px; padding: 25px; border-radius: 15px; text-align: center; font-family: 'Courier New', monospace; border: 2px solid #333; }
        .dash-header { font-size: 1.2rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .dash-speech { font-size: 0.9rem; margin-bottom: 20px; color: #00ff00; min-height: 3em; text-align: left; }
        
        #dash-chart { display: flex; justify-content: space-around; align-items: flex-end; height: 180px; margin-bottom: 20px; background: #000; padding: 10px; border-radius: 5px; position: relative; }
        #dash-chart::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 2px); pointer-events: none; }
        
        .dash-bar-wrap { display: flex; flex-direction: column; align-items: center; width: 20%; }
        .dash-bar-bg { width: 30px; height: 120px; background: #222; position: relative; border: 1px solid #444; }
        .dash-bar-fill { width: 100%; background: linear-gradient(to top, #004400, #00ff00, #b3ffb3); position: absolute; bottom: 0; transition: height 1.5s ease-out; }
        .dash-perc { font-size: 0.7rem; margin-bottom: 5px; }
        .dash-letter { margin-top: 10px; font-weight: bold; color: #fff; }
        
        .dash-close-btn { background: #333; color: #fff; border: 1px solid #555; padding: 10px; width: 100%; cursor: pointer; text-transform: uppercase; font-weight: bold; }
        .dash-ver { position: absolute; bottom: 10px; right: 15px; font-size: 0.6rem; color: #444; }
    `;
    document.head.appendChild(style);
}

function createDashOverlay() {
    const div = document.createElement('div');
    div.id = 'dashkam-overlay';
    div.innerHTML = `
        <div class="dash-card">
            <div class="dash-header">REC ● DASH KAM</div>
            <div id="dash-speech-txt" class="dash-speech">Initializing telemetry...</div>
            <div id="dash-chart"></div>
            <button class="dash-close-btn" onclick="closeDash()">Close Feed</button>
            <span class="dash-ver">v1.0.1</span>
        </div>
    `;
    return div;
}
