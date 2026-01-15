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
            // If the field isn't exactly A, B, C, or D, it's an error we need to fix
            const hasFormatError = !q.correct || !validLetters.includes(q.correct.toString().toUpperCase());
            
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

                <div style="margin-top:10px;">
                    <label style="color: #f44336;">Correct Answer (Letter Only needed for fix)</label>
                    <input type="text" 
                           style="font-weight:bold; border: 2px solid #f44336; background: #fff8f8;" 
                           value="${q.correct || ''}" 
                           oninput="updateData(${index}, 'correct', this.value)">
                    <small style="color: #666; display:block; margin-top:2px;">Copy text out of here if it belongs in a Choice, then replace with A, B, C, or D.</small>
                </div>

                <div style="margin-top:10px;">
                    <label>Explanation</label>
                    <textarea style="height:60px;" oninput="updateData(${index}, 'explanation', this.value)">${q.explanation || ''}</textarea>
                </div>
            `;
            list.appendChild(card);
        });

        status.innerHTML = `<span style="color: #f44336;">Showing ${errorCount} records with broken data:</span>`;
        document.getElementById('app-version').innerText = "Ver: 1.1.2 - Repair Mode";
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
        alert("JSON copied to clipboard!");
    });
}

loadQuestions();
