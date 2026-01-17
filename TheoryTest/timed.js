/**
 * File: timed.js
 * Version: v2.0.4
 * Fix: Total termination of timer upon submission to prevent ghost clocks in review.
 */

const SCRIPT_VERSION = "v2.0.4";

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
        const saved = localStorage.getItem('orion_current_session');
        
        if (saved) { 
            document.getElementById('resume-modal').style.display = 'flex'; 
        } else { 
            startFreshSession(); 
        }
    } catch (e) { 
        document.getElementById('q-text').innerText = "Load Error: " + e.message;
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
    // Clear any existing interval before starting a new one
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
    } else { 
        localStorage.removeItem('orion_current_session');
        startFreshSession(); 
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
    stopTimerInternal(); // Ensure the clock is killed before storage/redirect
    
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
