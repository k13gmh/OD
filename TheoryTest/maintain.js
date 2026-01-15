let questionsData = [];

async function loadQuestions() {
    const list = document.getElementById('maintenance-list');
    const status = document.getElementById('status-msg');
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        questionsData = await response.json();
        
        let errorCount = 0;
        list.innerHTML = '';

        questionsData.forEach((q, index) => {
            const validLetters = ["A", "B", "C", "D"];
            // Check if it's one of the 36 errors
            const hasFormatError = !q.correct || !validLetters.includes(q.correct.toUpperCase());
            
            if (!hasFormatError) return;

            errorCount++;

            const card = document.createElement('div');
            card.className = 'q-card error-border'; 
            card.innerHTML = `
                <div style="background: #f1f1f1; padding: 5px 10px; margin: -15px -15px 15px -15px; border-radius: 9px 9px 0 0; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between;">
                    <strong style="color: #333;">ID: ${q.id} <span style="color: #f44336;">(FORMAT ERROR)</span></strong>
                    <span style="font-size: 0.8em; color: #666;">Index: ${index}</span>
                </div>
                
                <div style="margin-top: 10px;">
                    <label>Category</label>
                    <input type="text" value="${q.category || ''}" oninput="updateData(${index}, 'category', this.value)">
                </div>

                <label>Question Text</label>
                <textarea oninput="updateData(${index}, 'question', this.value)">${q.question}</textarea>
                
                <div class="choice-grid">
                    <div><label>Choice A</label><input type="text" value="${q.choices.A || ''}" oninput="updateChoice(${index}, 'A', this.value)"></div>
                    <div><label>Choice B</label><input type="text" value="${q.choices.B || ''}" oninput="updateChoice(${index}, 'B', this.value)"></div>
                    <div><label>Choice C</label><input type="text" value="${q.choices.C || ''}" oninput="updateChoice(${index}, 'C', this.value)"></div>
                    <div><label>Choice D</label><input type="text" value="${q.choices.D || ''}" oninput="updateChoice(${index}, 'D', this.value)"></div>
                </div>

                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 15px; margin-top:10px;">
                    <div>
                        <label style="color: #f44336;">Correct Letter Only</label>
                        <input type="text" maxlength="1" 
                               style="text-align:center; font-weight:bold; border: 2px solid #f44336;" 
                               value="${validLetters.includes(q.correct) ? q.correct : ''}" 
                               placeholder="?"
                               oninput="updateData(${index}, 'correct', this.value.toUpperCase())">
                    </div>
                    <div>
                        <label>Explanation</label>
                        <textarea style="height:60px;" oninput="updateData(${index}, 'explanation', this.value)">${q.explanation || ''}</textarea>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });

        status.innerHTML = `<span style="color: #f44336;">Showing ${errorCount} questions requiring attention:</span>`;
        document.getElementById('app-version').innerText = "Ver: 1.1.1 - Full Editor";
    } catch (e) {
        status.innerHTML = "Error: Could not load questions.json.";
    }
}

function updateData(index, field, value) {
    questionsData[index][field] = value;
}

function updateChoice(index, letter, value) {
    if (!questionsData[index].choices) questionsData[index].choices = {};
    questionsData[index].choices[letter] = value;
}

function copyJSON() {
    const jsonStr = JSON.stringify(questionsData, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
        alert("JSON copied to clipboard! Paste this into your questions.json file.");
    });
}

loadQuestions();
