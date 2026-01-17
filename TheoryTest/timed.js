/* timed_script.js - v1.0.1 */
let sessionQuestions = [], currentIndex = 0, originalSessionQuestions = []; 
let testData = { selections: {}, flagged: [], seenIndices: [0] };
let timeLeft = 3420; 
let timerInterval;

async function init() {
    const saved = localStorage.getItem('orion_timed_session');
    
    if (saved) {
        const parsed = JSON.parse(saved);
        sessionQuestions = parsed.questions;
        originalSessionQuestions = [...sessionQuestions];
        testData = parsed.data || { selections: {}, flagged: [], seenIndices: [0] };
        currentIndex = parsed.currentIndex || 0;
        timeLeft = parsed.timeLeft || 3420;
    } else {
        // Fallback: If no session found, try to create one or boot to menu
        try {
            const response = await fetch('questions.json');
            const all = await response.json();
            sessionQuestions = all.sort(() => 0.5 - Math.random()).slice(0, 50)
                                .map((q, idx) => ({ ...q, originalIndex: idx + 1 }));
            originalSessionQuestions = [...sessionQuestions];
            saveProgress();
        } catch (e) {
            alert("Session Error. Returning to Menu.");
            window.location.href = 'mainmenu.html';
            return;
        }
    }

    startTimer();
    renderQuestion();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("TIME EXPIRED!");
            showSummary();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const display = document.getElementById('timer-display');
    if (!display) return;
    display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
    if (timeLeft <= 300) display.classList.add('warning');
}

function renderQuestion() {
    const q = sessionQuestions[currentIndex];
    if (!q) return;

    const imgElement = document.getElementById('q-image');
    imgElement.style.display = 'none'; 
    imgElement.src = `images/${q.id}.jpeg`;
    imgElement.onload = () => imgElement.style.display = 'block';
    imgElement.onerror = () => imgElement.style.display = 'none';

    document.getElementById('q-number').innerText = `Q${currentIndex + 1} / 50`;
    document.getElementById('q-category').innerText = q.category || "General";
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
                saveProgress();
            };
            optionsArea.appendChild(btn);
        }
    });

    const flagBtn = document.getElementById('flag-btn');
    const isFlagged = testData.flagged.includes(q.id);
    flagBtn.style.background = isFlagged ? "#f1c40f" : "#bdc3c7";
    flagBtn.innerText = isFlagged ? "FLAGGED" : "FLAG";
}

function toggleFlag() {
    const q = sessionQuestions[currentIndex];
    const flagIdx = testData.flagged.indexOf(q.id);
    if (flagIdx > -1) testData.flagged.splice(flagIdx, 1);
    else testData.flagged.push(q.id);
    renderQuestion();
    saveProgress();
}

function changeQuestion(step) {
    const newIdx = currentIndex + step;
    if (newIdx >= 0 && newIdx < sessionQuestions.length) {
        currentIndex = newIdx;
        renderQuestion();
        saveProgress();
    }
}

function saveProgress() { 
    localStorage.setItem('orion_timed_session', JSON.stringify({ 
        questions: originalSessionQuestions, 
        data: testData, 
        currentIndex,
        timeLeft
    })); 
}

function showSummary() {
    clearInterval(timerInterval);
    localStorage.setItem('orion_final_results', JSON.stringify({ 
        questions: originalSessionQuestions, 
        data: testData 
    }));
    window.location.href = 'review.html';
}

window.onload = init;
