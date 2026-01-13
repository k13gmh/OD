let allQuestions = [];
let sessionQuestions = [];
let currentIndex = 0;
let originalSessionQuestions = []; // To store the full set when reviewing flagged

let testData = {
    selections: {},
    flagged: [],
    seenIndices: []
};

// Initialization
async function init() {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        
        const saved = localStorage.getItem('orion_current_session');
        if (saved) {
            document.getElementById('resume-modal').style.display = 'flex';
        } else {
            startFreshSession();
        }
    } catch (e) {
        console.error("Failed to load questions", e);
    }
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
    } else {
        startFreshSession();
    }
}

function renderQuestion() {
    const q = sessionQuestions[currentIndex];
    document.getElementById('q-number').innerText = `Question ${currentIndex + 1} of ${sessionQuestions.length}`;
    document.getElementById('q-category').innerText = q.category;
    document.getElementById('q-text').innerText = q.question;
    
    const optionsArea = document.getElementById('options-area');
    optionsArea.innerHTML = '';
    
    ["A", "B", "C", "D"].forEach(letter => {
        if (!q.choices[letter]) return;
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
    } else {
        testData.flagged.push(qId);
    }
    renderQuestion();
}

function changeQuestion(step) {
    const newIndex = currentIndex + step;
    if (newIndex >= 0 && newIndex < sessionQuestions.length) {
        currentIndex = newIndex;
        if (!testData.seenIndices.includes(currentIndex)) {
            testData.seenIndices.push(currentIndex);
        }
        renderQuestion();
    }
}

function showSummary() {
    document.getElementById('test-ui').style.display = 'none';
    document.getElementById('summary-ui').style.display = 'block';

    let score = 0;
    originalSessionQuestions.forEach(q => {
        if (testData.selections[q.id] === q.correct) score++;
    });

    const total = originalSessionQuestions.length;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= 86;

    document.getElementById('res-icon').innerHTML = passed ? "✔️" : "❌";
    document.getElementById('res-icon').className = `status-icon ${passed ? 'pass' : 'fail'}`;
    document.getElementById('res-status').innerText = passed ? "Passed" : "Failed";
    document.getElementById('res-status').className = `status-text ${passed ? 'pass' : 'fail'}`;
    document.getElementById('res-score').innerText = `${score} / ${total}`;
    document.getElementById('res-percent').innerText = `${percent}% (Pass: 86%)`;

    // Manage Review Flagged Button
    const flagBtn = document.getElementById('review-flagged-btn');
    if (testData.flagged.length > 0) {
        flagBtn.style.display = "block";
        flagBtn.innerText = `Review ${testData.flagged.length} Flagged Question(s)`;
    } else {
        flagBtn.style.display = "none";
    }

    localStorage.setItem('orion_final_results', JSON.stringify({
        score, total, questions: originalSessionQuestions, data: testData
    }));
}

function reviewFlagged() {
    const flaggedQuestions = originalSessionQuestions.filter(q => testData.flagged.includes(q.id));
    if (flaggedQuestions.length === 0) return;

    sessionQuestions = flaggedQuestions;
    currentIndex = 0;

    document.getElementById('summary-ui').style.display = 'none';
    document.getElementById('test-ui').style.display = 'block';
    renderQuestion();
}

function saveProgress() {
    localStorage.setItem('orion_current_session', JSON.stringify({
        questions: originalSessionQuestions,
        data: testData,
        currentIndex: currentIndex
    }));
}

function restartTest() {
    localStorage.removeItem('orion_current_session');
    window.location.href = 'mainmenu.html';
}

function continueLater() {
    saveProgress();
    window.location.href = 'mainmenu.html';
}

function reviewAnswers() {
    window.location.href = 'review.html';
}

init();
