const SCRIPT_VERSION = "v1.9.6";

if (!sessionStorage.getItem('orion_session_token')) {
    window.location.href = 'mainmenu.html';
}

let allQuestions = [], sessionQuestions = [], currentIndex = 0, originalSessionQuestions = []; 
let testData = { selections: {}, flagged: [], seenIndices: [] };

async function init() {
    const tag = document.getElementById('v-tag-top');
    if (tag) tag.innerText = SCRIPT_VERSION;
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        const saved = localStorage.getItem('orion_current_session');
        if (saved) { document.getElementById('resume-modal').style.display = 'flex'; } 
        else { startFreshSession(); }
    } catch (e) { console.error(e); }
}

function startFreshSession() {
    sessionQuestions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 50);
    originalSessionQuestions = [...sessionQuestions];
    currentIndex = 0;
    testData = { selections: {}, flagged: [], seenIndices: [0] };
    renderQuestion();
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

    document.getElementById('q-number').innerText = `Question ${currentIndex + 1} of ${sessionQuestions.length}`;
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
    const isSkipped = !testData.selections[q.id];

    // Reset styles first
    flagBtn.style.boxShadow = "none";
    flagBtn.style.color = "#444";

    if (isFlagged) {
        flagBtn.style.background = "#f1c40f"; // Yellow
        flagBtn.style.color = "#000";
        flagBtn.style.boxShadow = "inset 0 4px 6px rgba(0,0,0,0.2)";
        flagBtn.innerText = "FLAGGED";
    } else if (isSkipped) {
        flagBtn.style.background = "#e67e22"; // Orange
        flagBtn.style.color = "#fff";
        flagBtn.innerText = "FLAG";
    } else {
        flagBtn.style.background = "#bdc3c7"; // Default Grey (consistent with Back/Next)
        flagBtn.innerText = "FLAG";
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

function openModal(src) {
    const modal = document.getElementById('img-modal');
    document.getElementById('img-modal-content').src = src;
    modal.style.display = 'flex';
}

function changeQuestion(step) {
    const newIndex = currentIndex + step;
    if (newIndex >= 0 && newIndex < sessionQuestions.length) {
        currentIndex = newIndex;
        if (!testData.seenIndices.includes(currentIndex)) testData.seenIndices.push(currentIndex);
        renderQuestion();
    }
}

function showSummary() {
    document.getElementById('test-ui').style.display = 'none';
    document.getElementById('summary-ui').style.display = 'block';
    let answered = 0, score = 0;
    originalSessionQuestions.forEach(q => {
        if (testData.selections[q.id]) {
            answered++;
            if (testData.selections[q.id] === q.correct) score++;
        }
    });
    const skipped = originalSessionQuestions.length - answered;
    document.getElementById('review-skipped-btn').innerText = `SKIPPED (${skipped})`;
    document.getElementById('review-flagged-btn').innerText = `FLAGGED (${testData.flagged.length})`;
    localStorage.setItem('orion_final_results', JSON.stringify({ score, total: originalSessionQuestions.length, questions: originalSessionQuestions, data: testData }));
}

function saveProgress() { 
    localStorage.setItem('orion_current_session', JSON.stringify({ 
        questions: originalSessionQuestions, 
        data: testData, 
        currentIndex 
    })); 
}

function restartTest() { 
    localStorage.removeItem('orion_current_session'); 
    window.location.href = 'mainmenu.html'; 
}

function reviewAnswers() { 
    window.location.href = 'review.html'; 
}

init();
