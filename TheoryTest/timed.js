const SCRIPT_VERSION = "v2.0.1";

// Ensure session exists
if (!sessionStorage.getItem('orion_session_token')) {
    console.warn("No session token found, redirecting...");
    window.location.href = 'mainmenu.html';
}

let allQuestions = [], sessionQuestions = [], currentIndex = 0, originalSessionQuestions = []; 
let testData = { selections: {}, flagged: [], seenIndices: [] };
let timerInterval = null;
let totalSeconds = 57 * 60;

async function init() {
    const tag = document.getElementById('v-tag-top');
    if (tag) tag.innerText = SCRIPT_VERSION;
    
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error("Could not load questions.json");
        
        allQuestions = await response.json();
        const saved = localStorage.getItem('orion_current_session');
        
        if (saved) { 
            document.getElementById('resume-modal').style.display = 'flex'; 
        } else { 
            startFreshSession(); 
        }
    } catch (e) { 
        console.error("Initialization error:", e);
        document.getElementById('q-text').innerText = "Error: questions.json not found or corrupted.";
        alert("Check if questions.json exists in the same folder.");
    }
}

function startFreshSession() {
    if (allQuestions.length === 0) return;
    
    sessionQuestions = [...allQuestions]
        .sort(() => 0.5 - Math.random())
        .slice(0, 50)
        .map((q, idx) => ({ ...q, originalIndex: idx + 1 }));
    
    originalSessionQuestions = [...sessionQuestions];
    currentIndex = 0;
    testData = { selections: {}, flagged: [], seenIndices: [0] };
    
    startTimer();
    renderQuestion();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    const display = document.getElementById('timer-display');

    timerInterval = setInterval(() => {
        totalSeconds--;
        if (totalSeconds < 0) {
            clearInterval(timerInterval);
            reviewAnswers();
            return;
        }

        let mins = Math.floor(totalSeconds / 60);
        let secs = totalSeconds % 60;
        display.textContent = (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);

        if (totalSeconds <= 120) {
            display.style.color = "#ff0000";
        }
    }, 1000);
}

function resumeTest(shouldResume) {
    document.getElementById('resume-modal').style.display = 'none';
    if (shouldResume) {
        const savedValue = localStorage.getItem('orion_current_session');
        if (savedValue) {
            const saved = JSON.parse(savedValue);
            sessionQuestions = saved.questions;
            originalSessionQuestions = [...sessionQuestions];
            testData = saved.data;
            currentIndex = saved.currentIndex || 0;
            startTimer(); 
            renderQuestion();
        }
    } else { startFreshSession(); }
}

function renderQuestion() {
    if (!sessionQuestions[currentIndex]) return;
    const q = sessionQuestions[currentIndex];

    const imgElement = document.getElementById('q-image');
    if (imgElement) {
        imgElement.style.display = 'none'; 
        imgElement.src = `images/${q.id}.jpeg`;
        imgElement.onload = () => { imgElement.style.display = 'block'; };
        imgElement.onerror = () => { imgElement.style.display = 'none'; };
        imgElement.onclick = () => openModal(imgElement.src);
    }

    document.getElementById('q-number').innerText = `Q ${q.originalIndex}/50`;
    document.getElementById('q-category').innerText = q.category;
    document.getElementById('q-text').innerText = q.question;
    document.getElementById('q-id-display').innerText = `ID: ${q.id}`;

    const optionsArea = document.getElementById('options-area');
    optionsArea.innerHTML = '';
    ["A", "B", "C", "D"].forEach(letter => {
        if (q.choices && q.choices[letter]) {
            const btn = document.createElement('button');
            btn.className = 'option-btn' + (testData.selections[q.id] === letter ? ' selected' : '');
            btn.innerHTML = `<strong>${letter}:</strong> ${q.choices[letter]}`;
            btn.onclick = () => { 
                testData.selections[q.id] = letter; 
                renderQuestion(); 
            };
            optionsArea.appendChild(btn);
        }
    });

    // Flag logic
    const flagBtn = document.getElementById('flag-btn');
    const isFlagged = testData.flagged.includes(q.id);
    flagBtn.style.background = isFlagged ? "#f1c40f" : "#bdc3c7";
    flagBtn.innerText = isFlagged ? "FLAGGED" : "FLAG";

    saveProgress();
}

function changeQuestion(step) {
    const newIndex = currentIndex + step;
    if (newIndex >= 0 && newIndex < sessionQuestions.length) {
        if (!testData.seenIndices.includes(currentIndex)) testData.seenIndices.push(currentIndex);
        currentIndex = newIndex;
        renderQuestion();
    }
}

function toggleFlag() {
    const q = sessionQuestions[currentIndex];
    if (!testData.flagged) testData.flagged = [];
    const idx = testData.flagged.indexOf(q.id);
    if (idx > -1) testData.flagged.splice(idx, 1);
    else testData.flagged.push(q.id);
    renderQuestion();
}

function showSummary() {
    document.getElementById('test-ui').style.display = 'none';
    const summaryUI = document.getElementById('summary-ui');
    summaryUI.style.display = 'block';
    
    const skipped = originalSessionQuestions.filter(q => !testData.selections[q.id]).length;
    const flagged = originalSessionQuestions.filter(q => testData.flagged.includes(q.id)).length;

    summaryUI.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <button class="btn btn-blue" onclick="retrySubset('skipped')">SKIPPED (${skipped})</button>
            <button class="btn btn-blue" onclick="retrySubset('flagged')">FLAGGED (${flagged})</button>
            <button class="btn btn-blue" onclick="retrySubset('all')">REVIEW</button>
            <button class="btn" onclick="reviewAnswers()">FINISHED</button>
        </div>
    `;
}

function retrySubset(type) {
    if (type === 'skipped') sessionQuestions = originalSessionQuestions.filter(q => !testData.selections[q.id]);
    else if (type === 'flagged') sessionQuestions = originalSessionQuestions.filter(q => testData.flagged.includes(q.id));
    else sessionQuestions = [...originalSessionQuestions];

    if (sessionQuestions.length === 0) { alert("No questions found."); return; }
    currentIndex = 0;
    document.getElementById('summary-ui').style.display = 'none';
    document.getElementById('test-ui').style.display = 'block';
    renderQuestion();
}

function openModal(src) {
    document.getElementById('img-modal-content').src = src;
    document.getElementById('img-modal').style.display = 'flex';
}

function saveProgress() { 
    localStorage.setItem('orion_current_session', JSON.stringify({ 
        questions: originalSessionQuestions, 
        data: testData, 
        currentIndex 
    })); 
}

function reviewAnswers() { 
    if (timerInterval) clearInterval(timerInterval);
    window.location.href = 'review.html'; 
}

// Start the engine
init();
