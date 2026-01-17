const SCRIPT_VERSION = "v2.0.0";

if (!sessionStorage.getItem('orion_session_token')) {
    window.location.href = 'mainmenu.html';
}

let allQuestions = [], sessionQuestions = [], currentIndex = 0, originalSessionQuestions = []; 
let testData = { selections: {}, flagged: [], seenIndices: [] };

// Timer Variables
let timerInterval = null;
let totalSeconds = 57 * 60; // 57 Minutes for DVSA standard

async function init() {
    const tag = document.getElementById('v-tag-top');
    if (tag) tag.innerText = SCRIPT_VERSION;
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        const saved = localStorage.getItem('orion_current_session');
        if (saved) { 
            document.getElementById('resume-modal').style.display = 'flex'; 
        } else { 
            startFreshSession(); 
        }
    } catch (e) { console.error(e); }
}

function startFreshSession() {
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

        let mins = Math.floor(totalSeconds / 60);
        let secs = totalSeconds % 60;
        
        display.textContent = 
            (mins < 10 ? "0" + mins : mins) + ":" + 
            (secs < 10 ? "0" + secs : secs);

        // Turn font RED when 2 minutes (120 seconds) remain
        if (totalSeconds <= 120) {
            display.style.color = "#ff0000";
        }

        if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            reviewAnswers(); // Force finish
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
            // Note: In this version, resuming restarts a full timer. 
            // If you need to save the remaining time specifically, let me know.
            startTimer(); 
            renderQuestion();
        }
    } else { startFreshSession(); }
}

function renderQuestion() {
    const q = sessionQuestions[currentIndex];
    const tag = document.getElementById('v-tag-top');
    if (tag) tag.innerText = SCRIPT_VERSION;

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

    const flagBtn = document.getElementById('flag-btn');
    const isFlagged = testData.flagged.includes(q.id);
    const hasSelection = !!testData.selections[q.id];
    const isLastViewed = testData.seenIndices.includes(currentIndex);

    flagBtn.style.boxShadow = "none";
    flagBtn.style.color = "#444";
    flagBtn.style.background = "#bdc3c7"; 
    flagBtn.innerText = "FLAG";

    if (isFlagged) {
        flagBtn.style.background = "#f1c40f"; 
        flagBtn.style.color = "#000";
        flagBtn.style.boxShadow = "inset 0 4px 6px rgba(0,0,0,0.2)";
        flagBtn.innerText = "FLAGGED";
    } else if (!hasSelection && isLastViewed && currentIndex !== testData.seenIndices[testData.seenIndices.length-1]) {
        flagBtn.style.background = "#e67e22"; 
        flagBtn.style.color = "#fff";
    }

    saveProgress();
}

function toggleFlag() {
    const q = sessionQuestions[currentIndex];
    if (!testData.flagged) testData.flagged = [];
    const flagIndex = testData.flagged.indexOf(q.id);
    if (flagIndex > -1) {
        testData.flagged.splice(flagIndex, 1);
    } else {
        testData.flagged.push(q.id);
    }
    renderQuestion();
}

function changeQuestion(step) {
    const newIndex = currentIndex + step;
    if (newIndex >= 0 && newIndex < sessionQuestions.length) {
        if (!testData.seenIndices.includes(currentIndex)) testData.seenIndices.push(currentIndex);
        currentIndex = newIndex;
        renderQuestion();
    }
}

function showSummary() {
    document.getElementById('test-ui').style.display = 'none';
    const summaryUI = document.getElementById('summary-ui');
    summaryUI.style.display = 'block';

    const skippedQuestions = originalSessionQuestions.filter(q => !testData.selections[q.id]);
    const flaggedQuestions = originalSessionQuestions.filter(q => testData.flagged.includes(q.id));

    summaryUI.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <button class="btn btn-blue" onclick="retrySubset('skipped')">SKIPPED (${skippedQuestions.length})</button>
            <button class="btn btn-blue" onclick="retrySubset('flagged')">FLAGGED (${flaggedQuestions.length})</button>
            <button class="btn btn-blue" onclick="retrySubset('all')">REVIEW</button>
            <button class="btn" onclick="reviewAnswers()">FINISHED</button>
        </div>
    `;

    let score = 0;
    originalSessionQuestions.forEach(q => {
        if (testData.selections[q.id] === q.correct) score++;
    });
    
    localStorage.setItem('orion_final_results', JSON.stringify({ 
        score, 
        total: originalSessionQuestions.length, 
        questions: originalSessionQuestions, 
        data: testData 
    }));
}

function retrySubset(type) {
    if (type === 'skipped') {
        sessionQuestions = originalSessionQuestions.filter(q => !testData.selections[q.id]);
    } else if (type === 'flagged') {
        sessionQuestions = originalSessionQuestions.filter(q => testData.flagged.includes(q.id));
    } else {
        sessionQuestions = [...originalSessionQuestions];
    }

    if (sessionQuestions.length === 0) {
        alert("No questions found for this category.");
        return;
    }

    currentIndex = 0;
    testData.seenIndices = [0];
    document.getElementById('summary-ui').style.display = 'none';
    document.getElementById('test-ui').style.display = 'block';
    renderQuestion();
}

function openModal(src) {
    const modal = document.getElementById('img-modal');
    document.getElementById('img-modal-content').src = src;
    modal.style.display = 'flex';
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

init();
