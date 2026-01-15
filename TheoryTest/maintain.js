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
            const hasFormatError = !q.correct || !validLetters.includes(q.correct.toString().toUpperCase());
            
            if (!hasFormatError) return;

            errorCount++;

            const card = document.createElement('div');
            card.className = 'q-card error-border'; 
            card.id = `q-card-${index}`; // Added ID to allow refreshing the card
            
            // Generate the card content
            card.innerHTML = renderCardContent(q, index);
            list.appendChild(card);
        });

        status.innerHTML = `<span style="color: #f44336;">Showing ${errorCount} records requiring fix:</span>`;
        document.getElementById('app-version').innerText = "Ver: 1.1.3 - Auto-Fix Enabled";
    } catch (e) {
        status.innerHTML = "Error loading questions.json.";
    }
}

// Function to generate the HTML for an individual card
function renderCardContent(q, index) {
    const validLetters = ["A", "B", "C", "D"];
    const isError = !q.correct || !validLetters.includes(q.correct.toString().toUpperCase());
    
    return `
        <div style="background: #f1f1f1; padding: 5px 10px; margin: -15px -15px 15px -15px; border-radius: 9px 9px 0 0; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #333;">ID: ${q.id} <span style="color: #f44336;">${isError ? '(FORMAT ERROR)' : '(FIXED)'}</span></strong>
            <button onclick="attemptFix(${index})" style="background:#007bff; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; font-weight:bold;">ATTEMPT FIX</button>
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
            <label style="color: #f44336;">Correct Answer</label>
            <input type="text" style="font-weight:bold; border: 2px solid #f44336; background: #fff8f8;" 
                   value="${q.correct || ''}" oninput="updateData(${index}, 'correct', this.value)">
        </div>

        <div style="margin-top:10px;">
            <label>Explanation</label>
            <textarea style="height:40px;" oninput="updateData(${index}, 'explanation', this.value)">${q.explanation || ''}</textarea>
        </div>
    `;
}

function attemptFix(index) {
    const q = questionsData[index];

    // 1. Concatenate Question + Choice A
    q.question = (q.question + " " + (q.choices.A || "")).trim();
    
    // 2. Shift choices left
    q.choices.A = q.choices.B || "";
    q.choices.B = q.choices.C || "";
    q.choices.C = q.choices.D || "";
    
    // 3. Move 'Correct' text to Choice D
    q.choices.D = q.correct || "";
    
    // 4. Move Explanation to Correct Answer (likely the correct letter)
    q.correct = q.explanation || "";
    
    // 5. Set Explanation to placeholder
    q.explanation = "****";

    // Refresh only this specific card UI
    const card = document.getElementById(`q-card-${index}`);
    if (card) {
        card.innerHTML = renderCardContent(q, index);
        // Change border to green to show it has been "fixed"
        card.style.borderColor = "#2ed573";
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
