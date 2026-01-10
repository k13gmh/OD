let allData = [];
let currentView = 'all'; // 'all' or 'errors'

async function loadQuestions() {
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        allData = await response.json();
        filterData();
    } catch (err) {
        document.getElementById('status-bar').innerText = "Error loading JSON.";
    }
}

function setView(view) {
    currentView = view;
    filterData();
}

function filterData() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const searchID = document.getElementById('idInput').value;
    
    const filtered = allData.filter(q => {
        const matchesText = q.question.toLowerCase().includes(searchText);
        const matchesID = searchID === "" || q.id.toString() === searchID;
        const isError = q.correct.length > 1;
        
        if (currentView === 'errors') {
            return isError && matchesText && matchesID;
        }
        return matchesText && matchesID;
    });

    renderList(filtered);
    
    const errCount = allData.filter(q => q.correct.length > 1).length;
    document.getElementById('status-bar').innerText = 
        `Showing ${filtered.length} of ${allData.length} questions. (${errCount} formatting errors found)`;
}

function renderList(dataToDisplay) {
    const list = document.getElementById('maintenance-list');
    list.innerHTML = '';

    dataToDisplay.forEach((q) => {
        const actualIndex = allData.findIndex(item => item.id === q.id);
        const isError = q.correct.length > 1;
        const card = document.createElement('div');
        card.className = `q-card ${isError ? 'has-error' : ''}`;
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <strong>ID: ${q.id}</strong>
                ${isError ? '<b style="color:red">FORMAT ERROR</b>' : ''}
            </div>
            <div class="input-group">
                <label>Question</label>
                <textarea onchange="updateVal(${actualIndex}, 'question', this.value)">${q.question}</textarea>
            </div>
            <div class="choice-grid">
                ${['A', 'B', 'C', 'D'].map(L => `
                    <div class="input-group">
                        <label>Choice ${L}</label>
                        <input type="text" value="${q.choices[L]}" onchange="updateChoice(${actualIndex}, '${L}', this.value)">
                    </div>
                `).join('')}
            </div>
            <div style="display:flex; gap:10px;">
                <div style="width:80px">
                    <label>Correct</label>
                    <input type="text" maxlength="1" style="text-align:center" value="${isError ? '?' : q.correct}" onchange="updateVal(${actualIndex}, 'correct', this.value.toUpperCase())">
                </div>
                <div style="flex-grow:1">
                    <label>Explanation</label>
                    <textarea onchange="updateVal(${actualIndex}, 'explanation', this.value)">${q.explanation}</textarea>
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
    alert("Full JSON copied to clipboard! Ready for GitHub.");
}

loadQuestions();
