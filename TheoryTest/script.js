let allQuestions = [];
let sessionQuestions = [];
let currentIndex = 0;
let originalSessionQuestions = []; 
let isSubsetReview = false; // Tracks if we are looking at a filtered list

let testData = {
    selections: {},
    flagged: [],
    seenIndices: []
};

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
    isSubsetReview = false;
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
        isSubsetReview = false;
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
    
    // Change Finish button text if in subset review
    const finishBtn = document.getElementById('finish-btn');
    finishBtn.innerText = isSubsetReview ? "EXIT REVIEW" : "FINISH";

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
    // When returning from a subset, restore the full list for accurate scoring
    sessionQuestions = [...originalSessionQuestions];
    isSubsetReview = false;

    document.getElementById('test-ui').style.display = 'none';
    document.getElementById('summary-ui').style.display = 'block';

    let score = 0;
    sessionQuestions.forEach(q => {
        if (testData.selections[q.id] === q.correct) score++;
    });

    const total = sessionQuestions.length;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= 86;

    document.getElementById('res-icon').innerHTML = passed ? "✔️" : "❌";
    document.getElementById('res-icon').className = `status-icon ${passed ? 'pass' : 'fail'}`;
    document.getElementById('res-status').innerText = passed ? "Passed" : "Failed";
    document.getElementById('res-status').className = `status-text ${passed ? 'pass' : 'fail'}`;
    document.getElementById('res-score').innerText = `${score} / ${total}`;
    document.getElementById('res-percent').innerText = `${percent}% (Pass: 86%)`;

    // Manage Review Buttons
    const flaggedCount = testData.flagged.length;
    const skippedCount = total - Object.keys(testData.selections).length;

    const fBtn = document.getElementById('review-flagged-btn');
    fBtn.style.display = flaggedCount > 0 ? "block" : "none";
    fBtn.innerText = `Flagged (${flaggedCount})`;

    const sBtn = document.getElementById('review-skipped-btn');
    sBtn.style.display = skippedCount > 0 ? "block" : "none";
    sBtn.innerText = `Skipped (${skippedCount})`;

    localStorage.setItem('orion_final_results', JSON.stringify({
        score, total, questions: originalSessionQuestions, data: testData
    }));
}

function reviewSubset(type) {
    let subset = [];
    if (type === 'flagged') {
        subset = originalSessionQuestions.filter(q => testData.flagged.includes(q.id));
    } else {
        subset = originalSessionQuestions.filter(q => !testData.selections[q.id]);
    }

    if (subset.length === 0) return;

    sessionQuestions = subset;
    currentIndex = 0;
    isSubsetReview = true;

    document.getElementById('summary-ui').style.display = 'none';
    document.getElementById('test-ui').style.display = 'block';
    renderQuestion();
}

function saveProgress() {
    localStorage.setItem('orion_current_session', JSON.stringify({
        questions: originalSessionQuestions,
        data: testData,
        currentIndex: isSubsetReview ? 0 : currentIndex 
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
