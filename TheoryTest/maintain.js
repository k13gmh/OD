// CHANGE THIS NUMBER EVERY TIME YOU UPDATE THE SCRIPT
const MAINTAIN_VERSION = "1.0.3"; 

let allData = [];

async function loadQuestions() {
    // Display the script version immediately
    document.getElementById('app-version').innerText = `Ver: ${MAINTAIN_VERSION}`;
    
    try {
        // Fetch with a cache-buster
        const response = await fetch('questions.json?v=' + Date.now());
        allData = await response.json();
        
        // Filter: Only show questions where 'correct' is not a single letter
        const errors = allData.filter(q => q.correct && q.correct.length > 1);
        renderErrors(errors);
    } catch (err) {
        document.getElementById('status-msg').innerText = "Error: JSON file not found.";
    }
}

function renderErrors(errorList) {
    const list = document.getElementById('maintenance-list');
    const status = document.getElementById('status-msg');
    list.innerHTML = '';

    if (errorList.length === 0) {
        status.innerHTML = "<span style='color:green'>✓ No formatting errors found in the current file.</span>";
        return;
    }

    status.innerText = `Found ${errorList.length} questions requiring attention:`;

    errorList.forEach((q) => {
        // Find where this question lives in the main array
        const idx = allData.findIndex(item => item.id === q.id);
        
        const card = document.createElement('div');
        card.className = 'q-card';
        card.innerHTML = `
            <strong>ID: ${q.id}</strong>
            <label>Question</label>
            <textarea onchange="updateVal(${idx}, 'question', this.value)">${q.question}</textarea>
            
            <div class="choice-grid">
                ${['A', 'B', 'C', 'D'].map(L => `
                    <div>
                        <label>Choice ${L}</label>
                        <input type="text" value="${q.choices[L] || ''}" onchange="updateChoice(${idx}, '${L}', this.value)">
                    </div>
                `).join('')}
            </div>

            <div style="display:flex; gap:10px;">
                <div style="width:100px;">
                    <label>Correct (Letter Only)</label>
                    <input type="text" maxlength="1" style="text-align:center; font-weight:bold; border:2px solid #2196f3;" 
                           placeholder="?" onchange="updateVal(${idx}, 'correct', this.value.toUpperCase())">
                </div>
                <div style="flex-grow:1;">
                    <label>Explanation</label>
                    <textarea onchange="updateVal(${idx}, 'explanation', this.value)">${q.explanation || ''}</textarea>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function updateVal(idx, key, val) { allData[idx][key] = val; }
function updateChoice(idx, L, val) { allData[idx].choices[L] = val; }

async function copyJSON() {
    await navigator.clipboard.writeText(JSON.stringify(allData, null, 2));
    alert("Full JSON (all records) copied to clipboard!");
}

loadQuestions();
