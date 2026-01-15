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
            const isValidLetter = validLetters.includes(q.correct);
            
            if (!isValidLetter) errorCount++;

            const card = document.createElement('div');
            card.className = `q-card ${!isValidLetter ? 'error-border' : ''}`;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <strong>ID: ${q.id}</strong>
                    <span style="font-size:0.8em; color:#999;">Index: ${index}</span>
                </div>
                
                <label>QUESTION</label>
                <textarea oninput="updateData(${index}, 'question', this.value)">${q.question}</textarea>
                
                <div class="choice-grid">
                    <div><label>A</label><input type="text" value="${q.choices.A || ''}" oninput="updateChoice(${index}, 'A', this.value)"></div>
                    <div><label>B</label><input type="text" value="${q.choices.B || ''}" oninput="updateChoice(${index}, 'B', this.value)"></div>
                    <div><label>C</label><input type="text" value="${q.choices.C || ''}" oninput="updateChoice(${index}, 'C', this.value)"></div>
                    <div><label>D</label><input type="text" value="${q.choices.D || ''}" oninput="updateChoice(${index}, 'D', this.value)"></div>
                </div>

                <div style="display: grid; grid-template-columns: 100px 1fr; gap: 10px; margin-top:10px;">
                    <div>
                        <label>CORRECT</label>
                        <input type="text" maxlength="1" style="text-align:center; font-weight:bold; ${!isValidLetter ? 'border:2px solid red;' : ''}" 
                               value="${q.correct || ''}" oninput="updateData(${index}, 'correct', this.value.toUpperCase())">
                    </div>
                    <div>
                        <label>EXPLANATION</label>
                        <textarea style="height:40px;" oninput="updateData(${index}, 'explanation', this.value)">${q.explanation || ''}</textarea>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });

        status.innerHTML = `Found ${questionsData.length} questions. Errors: ${errorCount}`;
        document.getElementById('app-version').innerText = "Ver: 1.1.0";
    } catch (e) {
        status.innerHTML = "Error: Could not load questions.json. Check file name.";
    }
}

function updateData(index, field, value) {
    questionsData[index][field] = value;
}

function updateChoice(index, letter, value) {
    questionsData[index].choices[letter] = value;
}

function copyJSON() {
    const jsonStr = JSON.stringify(questionsData, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
        alert("JSON copied to clipboard!");
    });
}

loadQuestions();
