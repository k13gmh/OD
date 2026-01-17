/**
 * File: timed.js
 * Version: v2.1.0
 * Features: Dynamic Option Shuffling & Refresh-to-Reset Logic
 */

const SCRIPT_VERSION = "v2.1.0";

// Global error catcher for iPad debugging
window.onerror = function(msg, url, line) {
    const display = document.getElementById('q-text');
    if (display) display.innerText = "JS Error: " + msg + "\nLine: " + line;
    return false;
};

let allQuestions = [], sessionQuestions = [], currentIndex = 0, originalSessionQuestions = []; 
let testData = { selections: {}, flagged: [], seenIndices: [] };
let timerInterval = null;
let totalSeconds = 57 * 60;

async function init() {
    const tag = document.getElementById('v-tag-top');
    if (tag) tag.innerText = SCRIPT_VERSION;

    if (!sessionStorage.getItem('orion_session_token')) {
        document.getElementById('q-text').innerText = "No session token. Redirecting...";
        setTimeout(() => { window.location.href = 'mainmenu.html'; }, 2000);
        return;
    }
    
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error("questions.json not found");
        
        allQuestions = await response.json();
        
        // REFRESH PROTECTION: 
        // If the page is refreshed, we clear any existing session to prevent 
        // timer-cheating and force a brand new set of questions.
        localStorage.removeItem('orion_current_session');
        startFreshSession(); 
        
    } catch (e) { 
        document.getElementById('q-text').innerText = "Load Error: " + e.message;
    }
}

/**
 * Pairs answers with their correct status, shuffles them, 
 * and re-assigns A, B, C, D and the 'correct' letter.
 */
function shuffleQuestionOptions(q, displayIndex) {
    let optionsArray = [
        { text: q.choices.A, correct: q.correct === "A" },
        { text: q.choices.B, correct: q.correct === "B" },
        { text: q.choices.C, correct: q.correct === "C" },
        { text: q.choices.D, correct: q.correct === "D" }
    ].filter(opt => opt.text);

    for (let i = optionsArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsArray[i], optionsArray[j]] = [optionsArray[j], optionsArray[i]];
    }

    const newChoices = {};
    let newCorrectLetter = "";
    const letters = ["A", "B", "C", "D"];

    optionsArray.forEach((opt, i) => {
        const letter = letters[i];
        newChoices[letter] = opt.text;
        if (opt.correct) newCorrectLetter = letter;
    });

    return {
        ...q,
        choices: newChoices,
        correct: newCorrectLetter,
        originalIndex: displayIndex
    };
}

function startFreshSession() {
    if (allQuestions.length === 0) return;
    
    // Pick and Shuffle
    let selected = [...allQuestions]
        .sort(() => 0.5 - Math.random())
        .slice(0, 50);

    sessionQuestions = selected.map((q, idx) => {
        return shuffleQuestionOptions(q, idx + 1);
    });
    
    originalSessionQuestions = [...sessionQuestions];
    currentIndex = 0;
    testData = { selections: {}, flagged: [], seenIndices: [0] };
    
    startTimer();
    renderQuestion();
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    const display = document.getElementById('timer-display');

    timerInterval = setInterval(() => {
        totalSeconds--;
        
        if (totalSeconds < 0) {
            stopTimerInternal();
            forceFinish();
            return;
        }

        let mins = Math.floor(totalSeconds / 60);
        let secs = totalSeconds % 60;
        
        if (display) {
            display.textContent = (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
            if (totalSeconds <= 120) display.style.color = "#ff0000";
        }
    }, 1000);
}

function stopTimerInternal() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function renderQuestion() {
    const q = sessionQuestions[currentIndex];
    if (!q) return;

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
    flagBtn.style.background = isFlagged ? "#f1c40f" : "#bdc3c7";
    flagBtn.innerText = isFlagged ? "FLAGGED" : "FLAG";

    saveProgress();
}

function changeQuestion(step) {
    const newIndex = currentIndex + step;
    if (newIndex >= 0 && newIndex < sessionQuestions.length) {
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
        <h3>Session Summary</h3>
        <p>You have ${skipped} unanswered questions.</p>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <button class="btn btn-blue" onclick="retrySubset('skipped')">SKIPPED (${skipped})</button>
            <button class="btn btn-blue" onclick="retrySubset('flagged')">FLAGGED (${flagged})</button>
            <button class="btn btn-blue" onclick="retrySubset('all')">REVIEW ALL</button>
            <button class="btn" style="background:#2ecc71; color:white;" onclick="finalSubmission()">FINISHED</button>
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

function forceFinish() {
    stopTimerInternal();
    alert("TIME EXPIRED!");
    finalSubmission();
}

function finalSubmission() {
    stopTimerInternal();
    
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

    localStorage.removeItem('orion_current_session');
    window.location.href = 'review.html';
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

window.addEventListener('load', init);
