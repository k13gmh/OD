const MAINTAIN_VERSION = "1.0.7 - Error Focused"; 

let allData = [];

async function loadQuestions() {
    document.getElementById('app-version').innerText = `Ver: ${MAINTAIN_VERSION}`;
    const status = document.getElementById('status-msg');
    
    try {
        // Fetch fresh data
        const response = await fetch('questions.json?v=' + Date.now());
        allData = await response.json();
        
        // Identify the broken ones (like your ID 703)
        const brokenQuestions = allData.filter(q => q.correct && q.correct.length > 1);
        
        if (brokenQuestions.length > 0) {
            status.style.color = "#d32f2f";
            status.innerText = `Found ${brokenQuestions.length} formatting errors. Fix them below:`;
            renderList(brokenQuestions);
        } else {
            status.style.color = "green";
            status.innerText = "✓ No formatting errors detected. Showing all records for manual review:";
            renderList(allData);
        }
    } catch (err) {
        status.innerHTML = `<div style="color:red"><b>Load Error:</b> The JSON file might have a syntax error (missing comma/bracket).</div>`;
    }
}

function renderList(dataToDisplay) {
    const list = document.getElementById('maintenance-list');
    list.innerHTML = '';

    dataToDisplay.forEach((q) => {
        const idx = allData.findIndex(item => item.id === q.id);
        const isError = q.correct && q.correct.length > 1;
        
        const card = document.createElement('div');
        card.className = 'q-card';
        if (isError) card.style.border = "2px solid #f44336";

        card.innerHTML = `
            <div style="background:#eee; padding:5px 10px; border-radius:5px; margin-bottom:10px; display:flex; justify-content:space-between;">
                <strong>Question ID: ${q.id}</strong>
                ${isError ? '<b style="color:red">FORMAT ERROR</b>' : '<b style="color:green">OK</b>'}
            </div>

            <label>Question Text</label>
            <textarea rows="2" onchange="allData[${idx}].question = this.value">${q.question}</textarea>
            
            <div class="choice-grid">
                <div><label>A</label><input type="text" value="${q.choices.A}" onchange="allData[${idx}].choices.A = this.value"></div>
                <div><label>B</label><input type="text" value="${q.choices.B}" onchange="allData[${idx}].choices.B = this.value"></div>
                <div><label>C</label><input type="text" value="${q.choices.C}" onchange="allData[${idx}].choices.C = this.value"></div>
                <div><label>D</label><input type="text" value="${q.choices.D}" onchange="allData[${idx}].choices.D = this.value"></div>
            </div>

            <div style="display:flex; gap:10px;">
                <div style="width:140px;">
                    <label style="color:red">Correct Letter</label>
                    <input type="text" maxlength="1" style="text-align:center; font-weight:bold; border:2px solid red;" 
                           placeholder="A, B, C or D" onchange="allData[${idx}].correct = this.value.toUpperCase()">
                </div>
                <div style="flex-grow:1;">
                    <label>Explanation</label>
                    <textarea rows="2" onchange="allData[${idx}].explanation = this.value">${q.explanation}</textarea>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

async function copyJSON() {
    await navigator.clipboard.writeText(JSON.stringify(allData, null, 2));
    alert("Copied everything! Now paste into GitHub.");
}

loadQuestions();
