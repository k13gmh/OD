let allData = [];

async function loadQuestions() {
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        allData = await response.json();
        renderList(allData);
    } catch (err) {
        document.getElementById('maintenance-list').innerHTML = "Error: Check if questions.json exists or has a typo.";
    }
}

function renderList(data) {
    const list = document.getElementById('maintenance-list');
    list.innerHTML = '';

    data.forEach((q, index) => {
        const isError = q.correct.length > 1; // Flagging errors like ID 703
        const card = document.createElement('div');
        card.className = `q-card ${isError ? 'has-error' : ''}`;
        
        card.innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>ID: ${q.id}</strong> ${isError ? '<span class="error-tag">FORMAT ERROR</span>' : ''}
            </div>
            
            <div class="input-group">
                <label>Question Text</label>
                <textarea onchange="updateData(${index}, 'question', this.value)">${q.question}</textarea>
            </div>

            <div class="choice-grid">
                <div class="input-group"><label>A</label><input type="text" value="${q.choices.A}" onchange="updateChoice(${index}, 'A', this.value)"></div>
                <div class="input-group"><label>B</label><input type="text" value="${q.choices.B}" onchange="updateChoice(${index}, 'B', this.value)"></div>
                <div class="input-group"><label>C</label><input type="text" value="${q.choices.C}" onchange="updateChoice(${index}, 'C', this.value)"></div>
                <div class="input-group"><label>D</label><input type="text" value="${q.choices.D}" onchange="updateChoice(${index}, 'D', this.value)"></div>
            </div>

            <div style="display: flex; gap: 15px;">
                <div class="input-group" style="width: 100px;">
                    <label>Correct Letter</label>
                    <input type="text" maxlength="1" style="text-align: center; font-weight: bold; border: 2px solid #2196f3;" 
                           value="${q.correct}" onchange="updateData(${index}, 'correct', this.value.toUpperCase())">
                </div>
                <div class="input-group" style="flex-grow: 1;">
                    <label>Explanation</label>
                    <textarea onchange="updateData(${index}, 'explanation', this.value)">${q.explanation}</textarea>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

// Update functions to keep our data object current
function updateData(index, field, value) { allData[index][field] = value; }
function updateChoice(index, letter, value) { allData[index].choices[letter] = value; }

function filterQuestions() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.getElementsByClassName('q-card');
    allData.forEach((q, i) => {
        const matches = q.id.toString().includes(term) || q.question.toLowerCase().includes(term);
        cards[i].style.display = matches ? 'block' : 'none';
    });
}

// Generates a clean JSON file for Gary to save
function downloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "questions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert("New questions.json downloaded! Replace your old file with this one.");
}

loadQuestions();
