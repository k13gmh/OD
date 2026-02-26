/**
 * Orion Drive AI Assistant: askafriend.js
 * Version: 1.3.1
 * Logic: Memory > Shame Tally > Random Guess
 */

function askafriend(id, question, choices) {
    // 1. Setup the UI Overlay [cite: 2026-02-06]
    injectAIStyles();
    const overlay = createAIOverlay();
    document.body.appendChild(overlay);

    // 2. Access Local Storage [cite: 2026-02-06]
    const aiMemory = JSON.parse(localStorage.getItem('orion_ai_memory') || "[]");
    const shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || "{}");
    const masterData = JSON.parse(localStorage.getItem('orion_master.json') || "[]");
    
    const foundInMaster = masterData.find(item => item.id == id);
    const isLearned = aiMemory.includes(id);
    const isShamed = shameTally.hasOwnProperty(id);

    // 3. Determine Personality and Certainty [cite: 2026-02-06]
    let statusText = "";
    let responseText = "";
    let needleRotation = -90; // Default Red/Empty

    if (isLearned && foundInMaster) {
        // Priority 1: Known [cite: 2026-02-06]
        needleRotation = 70; // Green Zone
        statusText = "I know this one!";
        responseText = `It's option ${foundInMaster.correct}. ${foundInMaster.explanation}`;
    } else if (isShamed && foundInMaster) {
        // Priority 2: Shamed (Skips learning) [cite: 2026-02-06]
        needleRotation = 0; // Amber Zone
        statusText = "I see you've struggled with this one before...";
        responseText = `Let me look closer... I'm fairly sure it is ${foundInMaster.correct}.`;
        
        // Silently add to memory for next time [cite: 2026-02-06]
        aiMemory.push(id);
        localStorage.setItem('orion_ai_memory', JSON.stringify(aiMemory));
    } else {
        // Priority 3: Random Guess [cite: 2026-02-06]
        const options = Object.keys(choices);
        const randomChoice = options[Math.floor(Math.random() * options.length)];
        needleRotation = Math.floor(Math.random() * 40) - 80; // Red Zone
        statusText = "I haven't seen this one before...";
        responseText = `I'm not sure, but I think it might be ${randomChoice}?`;

        // Save to memory for next time [cite: 2026-02-06]
        aiMemory.push(id);
        localStorage.setItem('orion_ai_memory', JSON.stringify(aiMemory));
    }

    // 4. Trigger Animations [cite: 2026-02-06]
    setTimeout(() => {
        document.getElementById('ai-needle').style.transform = `rotate(${needleRotation}deg)`;
        document.getElementById('ai-status-txt').innerText = statusText;
        document.getElementById('ai-response-txt').innerText = responseText;
    }, 100);
}

function closeFriend() {
    const el = document.getElementById('orion-ai-overlay');
    if (el) el.remove();
}

function injectAIStyles() {
    if (document.getElementById('ai-styles')) return;
    const style = document.createElement('style');
    style.id = 'ai-styles';
    style.innerHTML = `
        #orion-ai-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; justify-content: center; align-items: center; }
        .ai-card { background: white; width: 90%; max-width: 400px; padding: 25px; border-radius: 20px; text-align: center; font-family: sans-serif; }
        .gauge-box { width: 200px; height: 100px; margin: 10px auto; position: relative; overflow: hidden; }
        .gauge-arc { width: 200px; height: 200px; border-radius: 50%; border: 12px solid #eee; border-bottom-color: transparent; border-left-color: #ff4d4d; border-right-color: #2ecc71; transform: rotate(-45deg); box-sizing: border-box; }
        .ai-needle { width: 3px; height: 85px; background: #333; position: absolute; bottom: 0; left: 50%; transform-origin: bottom center; transform: rotate(-90deg); transition: transform 1.5s cubic-bezier(0.17, 0.67, 0.83, 0.67); }
        .ai-status { color: #666; font-style: italic; margin: 15px 0 5px; min-height: 1.2em; }
        .ai-response { font-size: 1.1rem; font-weight: bold; color: #2c3e50; margin-bottom: 20px; }
        .ai-close-btn { background: #007bff; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; }
    `;
    document.head.appendChild(style);
}

function createAIOverlay() {
    const div = document.createElement('div');
    div.id = 'orion-ai-overlay';
    div.innerHTML = `
        <div class="ai-card">
            <div class="gauge-box">
                <div class="gauge-arc"></div>
                <div class="ai-needle" id="ai-needle"></div>
            </div>
            <div id="ai-status-txt" class="ai-status">Checking records...</div>
            <div id="ai-response-txt" class="ai-response"></div>
            <button class="ai-close-btn" onclick="closeFriend()">Back to Question</button>
        </div>
    `;
    return div;
}
