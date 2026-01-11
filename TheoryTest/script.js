/* script.js - Ver 1.7.1 - Corrected Finish Link */
let allQuestions = [];
let sessionQuestions = [];
let currentIndex = 0;
let testData = { selections: {}, flagged: [], seenIndices: [] };

async function initEngine() {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        const saved = localStorage.getItem('orion_current_session');
        if (saved) document.getElementById('resume-modal').style.display = 'flex';
        else startNewTest();
    } catch (e) { console.error("Database load error"); }
}

function startNewTest() {
    localStorage.removeItem('orion_current_session');
    const categories = [...new Set(allQuestions.map(q => q.category))];
    sessionQuestions = [];
    categories.forEach(cat => {
        let pool = allQuestions.filter(q => q.category === cat).sort(() => 0.5 - Math.random());
        sessionQuestions.push(...pool.slice(0, 5));
    });
    sessionQuestions.sort(() => 0.5 - Math.random());
    testData = { selections: {}, flagged: [], seenIndices: [] };
    currentIndex = 0;
    renderQuestion();
}

function resumeTest(shouldResume) {
    document.getElementById('resume-modal').style.display = 'none';
    if (shouldResume) {
        const saved = JSON.parse(localStorage.getItem('orion_current_session'));
        sessionQuestions = saved.questions;
        testData = saved.data;
        currentIndex = saved.index;
    } else { startNewTest(); }
    renderQuestion();
}

function renderQuestion() {
    if (!sessionQuestions[currentIndex]) return;
    const q = sessionQuestions[currentIndex];
    if (!testData.seenIndices.includes(currentIndex)) testData.seenIndices.push(currentIndex);
    
    document.getElementById('q-number').innerText = `Question ${currentIndex + 1} of ${sessionQuestions.length}`;
    document.getElementById('q-category').innerText = q.category;
    document.getElementById('q-text').innerText = q.question;
    
    const area = document.getElementById('options-area');
    area.innerHTML = "";
    ["A", "B", "C", "D"].forEach(letter => {
        if (q.choices[letter]) {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            if (testData.selections[q.id] === letter) btn.classList.add('selected');
            btn.innerHTML = `<strong>${letter}:</strong> ${q.choices[letter]}`;
            btn.onclick = () => { testData.selections[q.id] = letter; saveProgress(); renderQuestion(); };
            area.appendChild(btn);
        }
    });
    document.getElementById('flag-btn').style.background = testData.flagged.includes(q.id) ? "#f1c40f" : "#bdc3c7";
}

function changeQuestion(step) {
    let nextIdx = currentIndex + step;
    if (nextIdx >= 0 && nextIdx < sessionQuestions.length) {
        currentIndex = nextIdx;
        saveProgress();
        renderQuestion();
        window.scrollTo(0, 0);
    }
}

function toggleFlag() {
    const id = sessionQuestions[currentIndex].id;
    const idx = testData.flagged.indexOf(id);
    (idx > -1) ? testData.flagged.splice(idx, 1) : testData.flagged.push(id);
    saveProgress();
    renderQuestion();
}

function saveProgress() {
    localStorage.setItem('orion_current_session', JSON.stringify({
        questions: sessionQuestions,
        data: testData,
        index: currentIndex
    }));
}

function showSummary() {
    document.getElementById('test-ui').style.display = 'none';
    document.getElementById('summary-ui').style.display = 'block';

    let correct = 0;
    let totalSeen = testData.seenIndices.length;

    testData.seenIndices.forEach(idx => {
        const q = sessionQuestions[idx];
        if (testData.selections[q.id] === q.correct) correct++;
    });

    const percent = totalSeen > 0 ? Math.round((correct / totalSeen) * 100) : 0;
    const passed = percent >= 86;

    const iconBox = document.getElementById('res-icon');
    iconBox.innerHTML = passed ? "✔️" : "❌";
    iconBox.className = `status-icon ${passed ? 'pass' : 'fail'}`;

    const statusBox = document.getElementById('res-status');
    statusBox.innerText = passed ? "Passed" : "Failed";
    statusBox.className = `status-text ${passed ? 'pass' : 'fail'}`;

    document.getElementById('res-score').innerText = `${correct} / ${totalSeen}`;
    document.getElementById('res-percent').innerText = `${percent}% (Pass: 86%)`;

    localStorage.setItem('orion_final_results', JSON.stringify({
        questions: sessionQuestions,
        data: testData,
        score: correct,
        total: totalSeen
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

document.addEventListener('DOMContentLoaded', initEngine);
