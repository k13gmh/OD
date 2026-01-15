let questionsData = [];
let originalData = []; // To support the Reset feature

async function loadQuestions() {
    const list = document.getElementById('maintenance-list');
    const status = document.getElementById('status-msg');
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        const data = await response.json();
        
        // Clone data so we can reset individual records
        questionsData = JSON.parse(JSON.stringify(data));
        originalData = JSON.parse(JSON.stringify(data));
        
        renderList();
    } catch (e) {
        status.innerHTML = "Error loading questions.json.";
    }
}

function renderList() {
    const list = document.getElementById('maintenance-list');
    const status = document.getElementById('status-msg');
    const validLetters = ["A", "B", "C", "D"];
    
    let errorCount = 0;
    list.innerHTML = '';

    questionsData.forEach((q, index) => {
        const isError = !q.correct || !validLetters.includes(q.correct.toString().toUpperCase());
        if (!isError) return;

        errorCount++;
        const card = document.createElement('div');
        card.className = 'q-card error-border';
        card.id = `q-card-${index}`;
        card.innerHTML = renderCardContent(q, index);
        list.appendChild(card);
    });

    status.innerHTML = `<span style="color: #f44336;">Found ${errorCount} records to repair:</span>`;
    document.getElementById('app-version').innerText = "Ver: 1.1.4 - Targeted Shift";
}

function renderCardContent(q, index) {
    const btnStyle = "background:#007bff; color:white; border:none; padding:2px 8px; border-radius:3px; cursor:pointer; font-size:10px; margin-left:10px;";
    
    return `
        <div style="background: #f1f1f1; padding: 5px 10px; margin: -15px -15px 15px -15px; border-radius: 9px 9px 0 0; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #333;">ID: ${q.id}</strong>
            <button onclick="resetRecord(${index})" style="background:#666; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">RESET RECORD</button>
        </div>
        
        <div style="margin-top:10px;">
            <label>Question <button style="${btnStyle}" onclick="shiftUp(${index}, 'Q')">FIX & SHIFT ↑</button></label>
            <textarea oninput="updateData(${index}, 'question', this.value)">${q.question}</textarea>
        </div>
        
        <div style="margin-top:5px;">
            <label>Choice A <button style="${btnStyle}" onclick="shiftUp(${index}, 'A')">FIX & SHIFT ↑</button></label>
            <input type="text" value="${q.choices.A || ''}" oninput="updateChoice(${index}, 'A', this.value)">
        </div>

        <div style="margin-top:5px;">
            <label>Choice B <button style="${btnStyle}" onclick="shiftUp(${index}, 'B')">FIX & SHIFT ↑</button></label>
            <input type="text" value="${q.choices.B || ''}" oninput="updateChoice(${index}, 'B', this.value)">
        </div>

        <div style="margin-top:5px;">
            <label>Choice C <button style="${btnStyle}" onclick="shiftUp(${index}, 'C')">FIX & SHIFT ↑</button></label>
            <input type="text" value="${q.choices.C || ''}" oninput="updateChoice(${index}, 'C', this.value)">
        </div>

        <div style="margin-top:5px;">
            <label>Choice D <button style="${btnStyle}" onclick="shiftUp(${index}, 'D')">FIX & SHIFT ↑</button></label>
            <input type="text" value="${q.choices.D || ''}" oninput="updateChoice(${index}, 'D', this.value)">
        </div>

        <div style="margin-top:10px; border-top: 1px solid #eee; padding-top:10px;">
            <label style="color: #f44336;">Correct Answer (Current Data)</label>
            <input type="text" style="font-weight:bold; border: 1px solid #f44336;" value="${q.correct || ''}" oninput="updateData(${index}, 'correct', this.value)">
            
            <label style="margin-top:5px;">Explanation</label>
            <textarea style="height:40px;" oninput="updateData(${index}, 'explanation', this.value)">${q.explanation || ''}</textarea>
        </div>
    `;
}

function shiftUp(index, startPoint) {
    const q = questionsData[index];
    
    if (startPoint === 'Q') {
        q.question = q.question + ", " + (q.choices.A || "");
        q.choices.A = q.choices.B;
        q.choices.B = q.choices.C;
        q.choices.C = q.choices.D;
        q.choices.D = q.correct;
        q.correct = q.explanation;
    } 
    else if (startPoint === 'A') {
        q.choices.A = (q.choices.A || "") + ", " + (q.choices.B || "");
        q.choices.B = q.choices.C;
        q.choices.C = q.choices.D;
        q.choices.D = q.correct;
        q.correct = q.explanation;
    }
    else if (startPoint === 'B') {
        q.choices.B = (q.choices.B || "") + ", " + (q.choices.C || "");
        q.choices.C = q.choices.D;
        q.choices.D = q.correct;
        q.correct = q.explanation;
    }
    else if (startPoint === 'C') {
        q.choices.C = (q.choices.C || "") + ", " + (q.choices.D || "");
        q.choices.D = q.correct;
        q.correct = q.explanation;
    }
    else if (startPoint === 'D') {
        q.choices.D = (q.choices.D || "") + ", " + (q.correct || "");
        q.correct = q.explanation;
    }

    q.explanation = "****";
    document.getElementById(`q-card-${index}`).innerHTML = renderCardContent(q, index);
}

function resetRecord(index) {
    questionsData[index] = JSON.parse(JSON.stringify(originalData[index]));
    document.getElementById(`q-card-${index}`).innerHTML = renderCardContent(questionsData[index], index);
}

function updateData(index, field, value) { questionsData[index][field] = value; }
function updateChoice(index, letter, value) { questionsData[index].choices[letter] = value; }

function copyJSON() {
    navigator.clipboard.writeText(JSON.stringify(questionsData, null, 2)).then(() => alert("Copied!"));
}

loadQuestions();
