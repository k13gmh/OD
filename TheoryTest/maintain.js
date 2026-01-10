const MAINTAIN_VERSION = "1.0.9 - Total Reset"; 

let allData = [];

async function loadQuestions() {
    // Set version immediately
    const vDisplay = document.getElementById('app-version');
    if (vDisplay) vDisplay.innerText = `Ver: ${MAINTAIN_VERSION}`;
    
    const status = document.getElementById('status-msg');
    
    try {
        // Force a fresh fetch of the data
        const response = await fetch('questions.json?v=' + Date.now());
        if (!response.ok) throw new Error("File questions.json not found on server.");
        
        allData = await response.json();
        
        // Find questions where 'correct' field is longer than 1 character (the errors)
        const errors = allData.filter(q => q.correct && q.correct.length > 1);
        
        if (errors.length > 0) {
            status.style.color = "#d32f2f";
            status.innerText = `Found ${errors.length} formatting errors:`;
            renderList(errors);
        } else {
            status.style.color = "green";
            status.innerText = "No format errors found. Showing all records for review:";
            renderList(allData);
        }
    } catch (err) {
        status.style.color = "red";
        status.innerHTML = `<b>Load Failed:</b> ${err.message}<br><small>Check for commas/brackets errors in GitHub.</small>`;
    }
}

function renderList(dataToDisplay) {
    const list = document.getElementById('maintenance-list');
    list.innerHTML = '';

    dataToDisplay.forEach((q) => {
        // Map back to the original full data array
        const idx = allData.findIndex(item => item.id === q.id);
        const isError = q.correct && q.correct.length > 1;
        
        const card = document.createElement('div');
        card.className = 'q-card' + (isError ? ' error-border' : '');

        card.innerHTML = `
            <div style="background:#f0f0f0; padding:5px 10px; border-radius:5px; margin-bottom:10px; font-weight:bold;">
                ID: ${q.id} ${isError ? ' <span style="color:red">(FORMAT ERROR)</span>' : ''}
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
                    <label style="color:red">Correct Letter Only</label>
                    <input type="text" maxlength="1" style="text-align:center; font-weight:bold; border:2px solid red;" 
                           value="${isError ? '' : q.correct}" placeholder="?" 
                           onchange="allData[${idx}].correct = this.value.toUpperCase()">
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
    try {
        await navigator.clipboard.writeText(JSON.stringify(allData, null, 2));
        alert("Success! Full JSON (all questions) is now in your clipboard.");
    } catch (err) {
        alert("Clipboard error. Try a different browser or check permissions.");
    }
}

// Kick off the load
loadQuestions();
