/**
 * Orion Drive AI Assistant: askafriend.js
 * Version: 1.3.3
 * Updates: Human-like quirks (Overconfidence & Dithering).
 */

function askafriend(id, question, choices) {
    injectAIStyles();
    const overlay = createAIOverlay();
    document.body.appendChild(overlay);

    const aiMemory = JSON.parse(localStorage.getItem('orion_ai_memory') || "[]");
    const shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || "{}");
    const masterData = JSON.parse(localStorage.getItem('orion_master.json') || "[]");
    
    const foundInMaster = masterData.find(item => item.id == id);
    const isLearned = aiMemory.includes(id);
    const isShamed = shameTally.hasOwnProperty(id);

    let statusText = "";
    let responseText = "";
    let needleRotation = -90; 

    // Generate a quirk factor (1-10) [cite: 2026-02-06]
    const quirkChance = Math.floor(Math.random() * 10) + 1;

    if (isLearned && foundInMaster) {
        // Priority 1: Known [cite: 2026-02-06]
        if (quirkChance === 1) { 
            // THE DITHERER: Knows it, but is suddenly unsure [cite: 2026-02-06]
            needleRotation = Math.floor(Math.random() * 20) - 10; // Amber Zone
            statusText = "Wait... I thought I knew this, but now I'm second-guessing...";
            responseText = `I think it's ${foundInMaster.correct}, but don't hold me to it!`;
        } else {
            needleRotation = 65; // Green Zone
            statusText = "I definitely know this one!";
            responseText = `It's option ${foundInMaster.correct}. ${foundInMaster.explanation}`;
        }
    } else if (isShamed && foundInMaster) {
        // Priority 2: Shamed [cite: 2026-02-06]
        needleRotation = 10; // High Amber
        statusText = "I see you've struggled with this one before...";
        responseText = `Let's get it right this time. I'm fairly sure it is ${foundInMaster.correct}.`;
        
        if (!isLearned) {
            aiMemory.push(id);
            localStorage.setItem('orion_ai_memory', JSON.stringify(aiMemory));
        }
    } else {
        // Priority 3: Random Guess [cite: 2026-02-06]
        const options = Object.keys(choices);
        const randomChoice = options[Math.floor(Math.random() * options.length)];
        
        if (quirkChance === 10) {
            // THE FALSE PROPHET: No idea, but acting very certain [cite: 2026-02-06]
            needleRotation = 60; // Green Zone
            statusText = "Oh, I've seen this before! Easy!";
            responseText = `It's definitely ${randomChoice}. Trust me.`; 
        } else {
            needleRotation = Math.floor(Math.random() * 30) - 80; // Red Zone
            statusText = "I haven't seen this one before...";
            responseText = `I'm just guessing here, but maybe ${randomChoice}?`;
        }

        if (!isLearned) {
            aiMemory.push(id);
            localStorage.setItem('orion_ai_memory', JSON.stringify(aiMemory));
        }
    }

    // Trigger Bouncy Animation [cite: 2026-02-06]
    setTimeout(() => {
        const needle = document.getElementById('ai-needle');
        needle.style.transform = `rotate(${needleRotation}deg)`;
        
        // Add a "dither" jitter if needle is in Amber [cite: 2026-02-06]
        if (needleRotation > -20 && needleRotation < 20) {
            needle.classList.add('dither-shake');
        }

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
        .ai-card { background: white; width: 90%; max-width: 400px; padding: 25px; border-radius: 20px; text-align: center; font-family: sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .gauge-box { width: 200px; height: 100px; margin: 10px auto; position: relative; overflow: hidden; }
        .gauge-arc { width: 200px; height: 200px; border-radius: 50%; border: 15px solid #eee; border-bottom-color: transparent; border-top-color: #ffaa00; border-left-color: #ff4d4d; border-right-color: #2ecc71; transform: rotate(-45deg); box-sizing: border-box; }
        .ai-needle { width: 4px; height: 80px; background: #333; position: absolute; bottom: 0; left: 50%; transform-origin: bottom center; transform: rotate(-90deg); transition: transform 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55); }
        
        /* Dither Jitter Animation [cite: 2026-02-06] */
        @keyframes dither {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(2deg); }
            75% { transform: rotate(-2deg); }
            100% { transform: rotate(0deg); }
        }
        .dither-shake { animation: dither 0.3s infinite; animation-delay: 1.2s; }

        .ai-status { color: #666; font-style: italic; margin: 15px 0 5px; min-height: 1.2em; }
        .ai-response { font-size: 1.1rem; font-weight: bold; color: #2c3e50; margin-bottom: 20px; line-height: 1.4; }
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
            <div id="ai-status-txt" class="ai-status">Thinking...</div>
            <div id="ai-response-txt" class="ai-response"></div>
            <button class="ai-close-btn" onclick="closeFriend()">Back to Question</button>
        </div>
    `;
    return div;
}
