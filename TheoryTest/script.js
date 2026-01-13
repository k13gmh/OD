const SCRIPT_VERSION = "v1.8.8";

if (!sessionStorage.getItem('orion_session_token')) {
    window.location.href = 'mainmenu.html';
}

let allQuestions = [];
let sessionQuestions = [];
let currentIndex = 0;
let originalSessionQuestions = []; 

let testData = {
    selections: {},
    flagged: [],
    seenIndices: []
};

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
    } catch (e) { console.error("Load fail", e); }
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
        const saved = JSON.parse(localStorage.getItem('orion_current_session'));
        sessionQuestions = saved.questions;
        originalSessionQuestions = [...sessionQuestions];
        testData = saved.data;
        currentIndex = saved.currentIndex || 0;
        renderQuestion();
    } else { startFreshSession(); }
}

function renderQuestion() {
    const q = sessionQuestions[currentIndex];
    document.getElementById('q-number').innerText = `Question ${currentIndex + 1} of ${sessionQuestions.length}`;
    document.getElementById('q-category').innerText = q.category;
    document.getElementById('q-text').innerText = q.question;
    const optionsArea = document.getElementById('options-area');
    optionsArea.innerHTML = '';
    ["A", "B", "C", "D"].forEach(letter => {
        if (!q.choices || !q.choices[letter]) return;
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (testData.selections[q.id] === letter) btn.classList.add('selected');
        btn.innerText = `${letter}: ${q.choices[letter]}`;
        btn.onclick = () => selectOption(q.id, letter);
        optionsArea.appendChild(btn);
    });
    const flagBtn = document.getElementById('flag-btn');
    flagBtn.style.background = testData.flagged.includes(q.id) ? "#f1c40f" : "#bdc3c7";
    flagBtn.style.color = testData.flagged.includes(q.id) ? "#fff" : "#444";
    saveProgress();
}

function selectOption(qId, letter) {
    testData.selections[qId] = letter;
    renderQuestion();
}

function toggleFlag() {
    const qId = sessionQuestions[currentIndex].id;
    if (testData.flagged.includes(qId)) {
        testData.flagged = testData.flagged.filter(id => id !== qId);
    } else { testData.flagged.push(qId); }
    renderQuestion();
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
    let score = 0;
    let answeredCount = 0;
    originalSessionQuestions.forEach(q => {
        if (testData.selections[q.id]) {
            answeredCount++;
            if (testData.selections[q.id] === q.correct) score++;
        }
    });
    const total = originalSessionQuestions.length;
    const skippedCount = total - answeredCount;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= 86;

    document.getElementById('res-icon').innerHTML = passed ? "✔️" : "❌";
    document.getElementById('res-icon').className = `status-icon ${passed ? 'pass' : 'fail'}`;
    document.getElementById('res-status').innerText = passed ? "PASSED" : "FAILED";
    document.getElementById('res-status').className = `status-text ${passed ? 'pass' : 'fail'}`;
    document.getElementById('res-score').innerText = `${score} / ${total}`;
    document.getElementById('res-percent').innerText = `${percent}% (Pass: 86%)`;

    const flagBtn = document.getElementById('review-flagged-btn');
    flagBtn.innerText = `FLAGGED (${testData.flagged.length})`;
    flagBtn.style.opacity = testData.flagged.length > 0 ? "1" : "0.5";
    flagBtn.onclick = testData.flagged.length > 0 ? reviewFlagged : null;

    const skipBtn = document.getElementById('review-skipped-btn');
    skipBtn.innerText = `SKIPPED (${skippedCount})`;
    skipBtn.style.opacity = skippedCount > 0 ? "1" : "0.5";
    skipBtn.onclick = skippedCount > 0 ? reviewSkipped : null;

    localStorage.setItem('orion_final_results', JSON.stringify({ score, total, questions: originalSessionQuestions, data: testData }));
}

function reviewFlagged() {
    sessionQuestions = originalSessionQuestions.filter(q => testData.flagged.includes(q.id));
    currentIndex = 0;
    document.getElementById('summary-ui').style.display = 'none';
    document.getElementById('test-ui').style.display = 'block';
    renderQuestion();
}

function reviewSkipped() {
    sessionQuestions = originalSessionQuestions.filter(q => !testData.selections[q.id]);
    currentIndex = 0;
    document.getElementById('summary-ui').style.display = 'none';
    document.getElementById('test-ui').style.display = 'block';
    renderQuestion();
}

function saveProgress() {
    localStorage.setItem('orion_current_session', JSON.stringify({ questions: originalSessionQuestions, data: testData, currentIndex: currentIndex }));
}

function restartTest() { localStorage.removeItem('orion_current_session'); window.location.href = 'mainmenu.html'; }
function continueLater() { saveProgress(); window.location.href = 'mainmenu.html'; }
function reviewAnswers() { window.location.href = 'review.html'; }

init();
