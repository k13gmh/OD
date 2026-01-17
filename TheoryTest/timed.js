const SCRIPT_VERSION = "v1.0.0 (Timed)";
let sessionQuestions = [], currentIndex = 0, originalSessionQuestions = []; 
let testData = { selections: {}, flagged: [], seenIndices: [] };
let timeLeft = 3420; // Seconds
let timerInterval;

async function init() {
    const saved = localStorage.getItem('orion_timed_session');
    if (!saved) { window.location.href = 'mainmenu.html'; return; }
    
    const parsed = JSON.parse(saved);
    sessionQuestions = parsed.questions;
    originalSessionQuestions = [...sessionQuestions];
    testData = parsed.data;
    currentIndex = parsed.currentIndex || 0;
    timeLeft = parsed.timeLeft;

    startTimer();
    renderQuestion();
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("TIME EXPIRED!");
            showSummary();
        }
        if (timeLeft % 5 === 0) saveProgress(); // Save every 5 seconds
    }, 1000);
}

function updateTimerDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const display = document.getElementById('timer-display');
    display.innerText = `${min}:${sec < 10 ? '0' + sec : sec}`;
    
    // Red color for last 5 minutes (300 seconds)
    if (timeLeft <= 300) {
        display.classList.add('warning');
    }
}

function renderQuestion() {
    const q = sessionQuestions[currentIndex];
    const imgElement = document.getElementById('q-image');
    if (imgElement) {
        imgElement.style.display = 'none'; 
        imgElement.src = `images/${q.id}.jpeg`;
        imgElement.onload = () => imgElement.style.display = 'block';
        imgElement.onerror = () => imgElement.style.display = 'none';
        imgElement.onclick = () => {
            document.getElementById('img-modal-content').src = imgElement.src;
            document.getElementById('img-modal').style.display = 'flex';
        };
    }

    document.getElementById('q-number').innerText = `Q${q.originalIndex} / 50`;
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

function toggleFlag() {
    const q = sessionQuestions[currentIndex];
    const flagIndex = testData.flagged.indexOf(q.id);
    if (flagIndex > -1) testData.flagged.splice(flagIndex, 1);
    else testData.flagged.push(q.id);
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
    let score = 0;
    originalSessionQuestions.forEach(q => {
        if (testData.selections[q.id] === q.correct) score++;
    });
    localStorage.setItem('orion_final_results', JSON.stringify({ 
        score, total: 50, questions: originalSessionQuestions, data: testData 
    }));
    window.location.href = 'review.html';
}

init();
