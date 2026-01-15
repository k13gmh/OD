let questionsData = [];
let originalData = [];
let searchTerm = "";

async function loadQuestions() {
    const list = document.getElementById('maintenance-list');
    const status = document.getElementById('status-msg');
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        const data = await response.json();
        
        questionsData = JSON.parse(JSON.stringify(data));
        originalData = JSON.parse(JSON.stringify(data));
        
        addSearchUI();
        renderList();
    } catch (e) {
        status.innerHTML = "Error loading questions.json.";
    }
}

function addSearchUI() {
    const header = document.querySelector('.header');
    if (!document.getElementById('search-container')) {
        const searchDiv = document.createElement('div');
        searchDiv.id = 'search-container';
        searchDiv.style.cssText = "margin-bottom: 15px; display: flex; gap: 10px;";
        searchDiv.innerHTML = `
            <input type="text" id="idSearch" placeholder="Search by ID..." 
                style="padding: 10px; border-radius: 5px; border: 1px solid #ddd; flex-grow: 1;">
            <button onclick="clearSearch()" style="padding: 10px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">Clear</button>
        `;
        header.parentNode.insertBefore(searchDiv, header.nextSibling);

        document.getElementById('idSearch').addEventListener('input', (e) => {
            searchTerm = e.target.value.trim();
            renderList();
        });
    }
}

function clearSearch() {
    document.getElementById('idSearch').value = "";
    searchTerm = "";
    renderList();
}

function renderList() {
    const list = document.getElementById('maintenance-list');
    const status = document.getElementById('status-msg');
    const validLetters = ["A", "B", "C", "D"];
    
    let displayCount = 0;
    list.innerHTML = '';

    questionsData.forEach((q, index) => {
        let issues = [];
        
        // Audit Logic
        const correctVal = q.correct ? q.correct.toString().trim().toUpperCase() : "";
        if (!validLetters.includes(correctVal)) issues.push("LETTER ERROR");
        if (q.explanation === "****") issues.push("FIX EXPLANATION");
        if (!q.question || q.question.trim() === "") issues.push("BLANK Q");
        if (!q.choices.A || q.choices.A.trim() === "") issues.push("BLANK A");
        if (!q.choices.B || q.choices.B.trim() === "") issues.push("BLANK B");

        // Logic: Show if (Search Matches ID) OR (Search is empty AND it has issues)
        const matchesSearch = searchTerm !== "" && q.id.toString() === searchTerm;
        const shouldShow = matchesSearch || (searchTerm === "" && issues.length > 0);

        if (shouldShow) {
            displayCount++;
            const card = document.createElement('div');
            // If it matches search but has no errors, use a normal border instead of red
            card.className = issues.length > 0 ? 'q-card error-border' : 'q-card';
            card.id = `q-card-${index}`;
            card.innerHTML = renderCardContent(q, index, issues);
            list.appendChild(card);
        }
    });

    if (searchTerm !== "") {
        status.innerHTML = `Search result for ID: <strong>${searchTerm}</strong>`;
    } else {
        status.innerHTML = `<span style="color: #f44336;">Records needing attention: ${displayCount}</span>`;
    }
    document.getElementById('app-version').innerText = "Ver: 1.1.7 - Searchable";
}

function renderCardContent(q, index, issues) {
    const btnStyle = "background:#007bff; color:white; border:none; padding:2px 8px; border-radius:3px; cursor:pointer; font-size:10px; margin-left:10px;";
    const issueLabels = issues.length > 0 ? ` <span style="color:#f44336; font-size:0.7rem;">[${issues.join(" | ")}]</span>` : " <span style=\"color:#28a745; font-size:0.7rem;\">[VALID]</span>";
    
    return `
        <div style="background: #f1f1f1; padding: 5px 10px; margin: -15px -15px 15px -15px; border-radius: 9px 9px 0 0; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #333;">ID: ${q.id} ${issueLabels}</strong>
            <button onclick="resetRecord(${index})" style="background:#666; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">RESET</button>
        </div>
        
        <div style="margin-top:10px;">
            <label>Question <button style="${btnStyle}" onclick="shiftUp(${index}, 'Q')">FIX & SHIFT ↑</button></label>
            <textarea onchange="updateData(${index}, 'question', this.value)">${q.question}</textarea>
        </div>
        
        <div class="choice-grid">
            <div><label>Choice A <button style="${btnStyle}" onclick="shiftUp(${index}, 'A')">↑</button></label><input type="text" value="${q.choices.A || ''}" onchange="updateChoice(${index}, 'A', this.value)"></div>
            <div><label>Choice B <button style="${btnStyle}" onclick="shiftUp(${index}, 'B')">↑</button></label><input type="text" value="${q.choices.B || ''}" onchange="updateChoice(${index}, 'B', this.value)"></div>
            <div><label>Choice C <button style="${btnStyle}" onclick="shiftUp(${index}, 'C')">↑</button></label><input type="text" value="${q.choices.C || ''}" onchange="updateChoice(${index}, 'C', this.value)"></div>
            <div><label>Choice D <button style="${btnStyle}" onclick="shiftUp(${index}, 'D')">↑</button></label><input type="text" value="${q.choices.D || ''}" onchange="updateChoice(${index}, 'D', this.value)"></div>
        </div>

        <div style="margin-top:10px; border-top: 1px solid #eee; padding-top:10px;">
            <label>Correct Answer</label>
            <input type="text" style="font-weight:bold;" value="${q.correct || ''}" onchange="updateData(${index}, 'correct', this.value)">
            <label style="margin-top:5px;">Explanation</label>
            <textarea style="height:40px; ${q.explanation === '****' ? 'border:2px solid #f44336;' : ''}" onchange="updateData(${index}, 'explanation', this.value)">${q.explanation || ''}</textarea>
        </div>
    `;
}

function shiftUp(index, startPoint) {
    const q = questionsData[index];
    if (startPoint === 'Q') {
        q.question = (q.question + ", " + (q.choices.A || "")).trim();
        q.choices.A = q.choices.B; q.choices.B = q.choices.C; q.choices.C = q.choices.D; q.choices.D = q.correct; q.correct = q.explanation;
    } else if (startPoint === 'A') {
        q.choices.A = ((q.choices.A || "") + ", " + (q.choices.B || "")).trim();
        q.choices.B = q.choices.C; q.choices.C = q.choices.D; q.choices.D = q.correct; q.correct = q.explanation;
    } else if (startPoint === 'B') {
        q.choices.B = ((q.choices.B || "") + ", " + (q.choices.C || "")).trim();
        q.choices.C = q.choices.D; q.choices.D = q.correct; q.correct = q.explanation;
    } else if (startPoint === 'C') {
        q.choices.C = ((q.choices.C || "") + ", " + (q.choices.D || "")).trim();
        q.choices.D = q.correct; q.correct = q.explanation;
    } else if (startPoint === 'D') {
        q.choices.D = ((q.choices.D || "") + ", " + (q.correct || "")).trim();
        q.correct = q.explanation;
    }
    q.explanation = "****";
    renderList();
}

function resetRecord(index) {
    questionsData[index] = JSON.parse(JSON.stringify(originalData[index]));
    renderList();
}

function updateData(index, field, value) { questionsData[index][field] = value; }
function updateChoice(index, letter, value) { questionsData[index].choices[letter] = value; }

function copyJSON() {
    if (document.activeElement) document.activeElement.blur();
    setTimeout(() => {
        navigator.clipboard.writeText(JSON.stringify(questionsData, null, 2))
            .then(() => alert("FULL JSON COPIED!"));
    }, 50);
}

loadQuestions();
