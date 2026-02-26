/**
 * Orion Drive AI Assistant: askafriend.js
 * Version: 1.3.7
 * Character: Hub Capp (The Face Gauge)
 * UI: E/F as Eyes, Smile Arc, White/Green (70%+) Gauge.
 */

function askafriend(id, question, choices) {
    injectAIStyles();
    const overlay = createAIOverlay();
    document.body.appendChild(overlay);

    let aiMemory = JSON.parse(localStorage.getItem('orion_ai_memory') || "[]");
    const shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || "{}");
    const masterData = JSON.parse(localStorage.getItem('orion_master.json') || "[]");
    
    const foundInMaster = masterData.find(item => item.id == id);
    const isLearned = aiMemory.includes(id);
    const isShamed = shameTally.hasOwnProperty(id);

    let statusText = "";
    let responseText = "";
    let needleRotation = -90; 

    const quirkChance = Math.floor(Math.random() * 10) + 1;

    if (isLearned && foundInMaster) {
        if (quirkChance === 1) { 
            needleRotation = Math.floor(Math.random() * 20) - 10; 
            statusText = "I can never remember this one...";
            responseText = `I thought I knew it, but I keep getting it wrong! I think it's ${foundInMaster.correct}?`;
            
            aiMemory = aiMemory.filter(mid => mid !== id);
            localStorage.setItem('orion_ai_memory', JSON.stringify(aiMemory));
        } else {
            needleRotation = 65; 
            statusText = "I definitely know this one!";
            responseText = `I've got this! It's option ${foundInMaster.correct}. ${foundInMaster.explanation}`;
        }
    } else if (isShamed && foundInMaster) {
        needleRotation = 10; 
        statusText = "I see you've struggled with this one before...";
        responseText = `Let's get it right this time. I'm fairly sure it is ${foundInMaster.correct}.`;
        
        if (!isLearned) {
            aiMemory.push(id);
            localStorage.setItem('orion_ai_memory', JSON.stringify(aiMemory));
        }
    } else {
        const options = Object.keys(choices);
        const randomChoice = options[Math.floor(Math.random() * options.length)];
        
        if (quirkChance === 10) {
            needleRotation = 60; 
            statusText = "Easy as changing a tire!";
            responseText = `It's definitely ${randomChoice}. Trust me!`; 
        } else {
            needleRotation = Math.floor(Math.random() * 30) - 80; 
            statusText = "I haven't seen this one before...";
            responseText = `I'm just guessing here, but maybe ${randomChoice}?`;
        }

        if (!isLearned) {
            aiMemory.push(id);
            localStorage.setItem('orion_ai_memory', JSON.stringify(aiMemory));
        }
    }

    setTimeout(() => {
        const needle = document.getElementById('ai-needle');
        needle.style.transform = `rotate(${needleRotation}deg)`;
        
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
        .ai-card { background: white; width: 90%; max-width: 400px; padding: 25px; border-radius: 20px; text-align: center; font-family: sans-serif; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        
        .gauge-container { position: relative; width: 220px; margin: 10px auto; height: 140px; }
        .gauge-box { width: 200px; height: 100px; margin: 0 auto; position: relative; overflow: hidden; }
        
        /* White to Green (70% split) [cite: 2026-02-06] */
        .gauge-arc { 
            width: 200px; height: 200px; border-radius: 50%; border: 15px solid white; 
            border-bottom-color: transparent; 
            border-right-color: #2ecc71; 
            transform: rotate(-45deg); box-sizing: border-box; 
        }
        
        .gauge-box::before {
            content: ''; position: absolute; top: 0; left: 0; width: 200px; height: 200px; 
            border-radius: 50%; border: 15px solid #f4f4f4; border-bottom-color: transparent;
            z-index: -1; box-sizing: border-box;
        }

        /* E and F as Eyes [cite: 2026-02-06] */
        .gauge-label { position: absolute; top: 65px; font-weight: 900; color: #333; font-size: 1.6rem; letter-spacing: -1px; }
        .label-e { left: 45px; }
        .label-f { right: 45px; }

        /* The Smile Arc [cite: 2026-02-06] */
        .gauge-smile {
            position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
            width: 60px; height: 30px; border: 3px solid #ddd;
            border-top: 0; border-radius: 0 0 50px 50px;
        }

        .ai-needle { width: 4px; height: 80px; background: #333; position: absolute; bottom: 40px; left: 50%; transform-origin: bottom center; transform: rotate(-90deg); transition: transform 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55); z-index: 10; }
        .ai-needle::after { content: ''; position: absolute; bottom: -5px; left: -3px; width: 10px; height: 10px; background: #333; border-radius: 50%; }

        @keyframes dither {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(2deg); }
            75% { transform: rotate(-2deg); }
            100% { transform: rotate(0deg); }
        }
        .dither-shake { animation: dither 0.3s infinite; animation-delay: 1.2s; }

        .ai-status { color: #666; font-style: italic; margin: 5px 0; min-height: 1.2em; }
        .ai-response { font-size: 1.1rem; font-weight: bold; color: #2c3e50; margin-bottom: 20px; line-height: 1.4; }
        .ai-close-btn { background: #007bff; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; }
        
        .hub-name { font-size: 1.4rem; font-weight: 900; color: #333; margin-bottom: 5px; display: block; }
        .ver-stamp { position: absolute; bottom: 10px; right: 15px; font-size: 0.6rem; color: #ccc; }
    `;
    document.head.appendChild(style);
}

function createAIOverlay() {
    const div = document.createElement('div');
    div.id = 'orion-ai-overlay';
    div.innerHTML = `
        <div class="ai-card">
            <span class="hub-name">Hub Capp</span>
            <div class="gauge-container">
                <div class="gauge-box">
                    <div class="gauge-arc"></div>
                    <div class="ai-needle" id="ai-needle"></div>
                </div>
                <span class="gauge-label label-e">E</span>
                <span class="gauge-label label-f">F</span>
                <div class="gauge-smile"></div>
            </div>
            <div id="ai-status-txt" class="ai-status">Checking the tank...</div>
            <div id="ai-response-txt" class="ai-response"></div>
            <button class="ai-close-btn" onclick="closeFriend()">Back to Question</button>
            <span class="ver-stamp">v1.3.7</span>
        </div>
    `;
    return div;
}
