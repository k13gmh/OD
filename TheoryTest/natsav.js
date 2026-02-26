/**
 * Orion Drive AI Assistant: natsav.js
 * Version: 1.0.1
 * Character: Natalie Saav (NatSav)
 * Function: Removes two wrong answers (50/50).
 */

function natsav(id) {
    injectNatStyles();
    const overlay = createNatOverlay();
    document.body.appendChild(overlay);

    // Access Data [cite: 2026-02-06]
    const shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || "{}");
    const masterData = JSON.parse(localStorage.getItem('orion_master.json') || "[]");
    
    const foundInMaster = masterData.find(item => item.id == id);
    const isShamed = shameTally.hasOwnProperty(id);

    let speechText = "";
    
    // Personality Logic [cite: 2026-02-06]
    if (isShamed) {
        speechText = "Recalculating... I see you've struggled with this route before. Let's take it slow and clear the road.";
    } else {
        const lines = [
            "Let's remove two wrong answers so you don't go down the wrong route.",
            "Let's do a map update and clear some traffic.",
            "In 200 yards, ignore the distractions. Narrowing your options now.",
            "Destination ahead, but let's avoid the potholes."
        ];
        speechText = lines[Math.floor(Math.random() * lines.length)];
    }

    document.getElementById('nat-speech-txt').innerText = speechText;

    // Logic to remove 2 wrong answers [cite: 2026-02-06]
    if (foundInMaster) {
        const correctLetter = foundInMaster.correct; // e.g., "C"
        const allLetters = Object.keys(foundInMaster.choices); // ["A", "B", "C", "D"]
        const wrongLetters = allLetters.filter(letter => letter !== correctLetter);
        
        // Randomly pick 2 to remove [cite: 2026-02-06]
        const toRemove = wrongLetters.sort(() => 0.5 - Math.random()).slice(0, 2);
        
        // Display the question with greyed out options [cite: 2026-02-06]
        const qContainer = document.getElementById('nat-q-display');
        qContainer.innerHTML = `<p><strong>${foundInMaster.question}</strong></p>`;
        
        allLetters.forEach(letter => {
            const isGone = toRemove.includes(letter);
            const optStyle = isGone ? "color: #ccc; text-decoration: line-through; opacity: 0.5;" : "font-weight: bold; color: #2ecc71;";
            qContainer.innerHTML += `<div style="margin: 5px 0; ${optStyle}">${letter}: ${foundInMaster.choices[letter]}</div>`;
        });
    }
}

function closeNat() {
    const el = document.getElementById('natsav-overlay');
    if (el) el.remove();
}

function injectNatStyles() {
    if (document.getElementById('nat-styles')) return;
    const style = document.createElement('style');
    style.id = 'nat-styles';
    style.innerHTML = `
        #natsav-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; justify-content: center; align-items: center; }
        .nat-card { background: white; width: 90%; max-width: 450px; padding: 25px; border-radius: 20px; text-align: center; font-family: sans-serif; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .nat-header { font-size: 1.4rem; font-weight: 900; color: #007bff; margin-bottom: 15px; display: block; }
        .nat-speech { color: #444; font-weight: bold; margin-bottom: 20px; line-height: 1.4; padding: 10px; background: #f0f7ff; border-radius: 10px; }
        #nat-q-display { text-align: left; margin-bottom: 20px; font-size: 0.95rem; border: 1px solid #eee; padding: 15px; border-radius: 10px; }
        .nat-close-btn { background: #007bff; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; }
        .nat-ver { position: absolute; bottom: 10px; right: 15px; font-size: 0.6rem; color: #ccc; }
    `;
    document.head.appendChild(style);
}

function createNatOverlay() {
    const div = document.createElement('div');
    div.id = 'natsav-overlay';
    div.innerHTML = `
        <div class="nat-card">
            <span class="nat-header">Natalie Saav (GPS)</span>
            <div id="nat-speech-txt" class="nat-speech">Calculating best route...</div>
            <div id="nat-q-display"></div>
            <button class="nat-close-btn" onclick="closeNat()">Back to Question</button>
            <span class="nat-ver">v1.0.1</span>
        </div>
    `;
    return div;
}
