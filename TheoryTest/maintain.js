let allData = [];

async function loadQuestions() {
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        allData = await response.json();
        showAll(); // Default to showing everything
    } catch (err) {
        document.getElementById('status-text').innerText = "Error: questions.json not found or formatted wrong.";
    }
}

function showAll() {
    document.getElementById('status-text').innerText = `Showing all ${allData.length} questions.`;
    renderList(allData);
}

function showErrors() {
    const errors = allData.filter(q => q.correct.length > 1);
    document.getElementById('status-text').innerText = `Found ${errors.length} formatting errors.`;
    renderList(errors);
}

function renderList(dataToDisplay) {
    const list = document.getElementById('maintenance-list');
    list.innerHTML = '';

    dataToDisplay.forEach((q) => {
        // Find the index in the original array so we update the right one
        const originalIndex = allData.findIndex(item => item.id === q.id);
        const isError = q.correct.length > 1;
        
        const card = document.createElement('div');
        card.className = `q-card ${isError ? 'has-error' : ''}`;
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>ID: ${q.id}</strong>
                ${isError ? '<b style="color:red">CORRECT THIS QUESTION</b>' : ''}
            </div>
            <label>Question</label>
            <textarea onchange="updateVal(${originalIndex}, 'question', this.value)">${q.question}</textarea>
            
            <div class="choice-grid">
                <div><label>A</label><input type="text" value="${q.choices.A}" onchange="updateChoice(${originalIndex}, 'A', this.value)"></div>
                <div><label>B</label><input type="text" value="${q.choices.B}" onchange="updateChoice(${originalIndex}, 'B', this.value)"></div>
                <div><label>C</label><input type="text" value="${q.choices.C}" onchange="updateChoice(${originalIndex}, 'C', this.value)"></div>
                <div><label>D</label><input type="text" value="${q.choices.D}" onchange="updateChoice(${originalIndex}, 'D', this.value)"></div>
            </div>

            <div style="display:flex; gap:10px;">
                <div style="width:100px;">
                    <label>Correct Letter</label>
                    <input type="text" maxlength="1" style="text-align:center; font-weight:bold;" value="${isError ? '?' : q.correct}" onchange="updateVal(${originalIndex}, 'correct', this.value.toUpperCase())">
                </div>
                <div style="flex-grow:1;">
                    <label>Explanation</label>
                    <textarea onchange="updateVal(${originalIndex}, 'explanation', this.value)">${q.explanation}</textarea>
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
    alert("Copied! Now go to GitHub and paste this over the old text.");
}

loadQuestions();
