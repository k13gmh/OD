/**
 * File: timed.js
 * Version: v2.5.0
 * Layout: Timer in card header
 * Update: Loads from orion_master.json (Local Storage)
 */

const JS_VERSION = "v2.5.0";
const HTML_VERSION = "v2.4.5";

if (!localStorage.getItem('orion_session_token')) {
    window.location.href = 'mainmenu.html';
}

let allQuestions = [], sessionQuestions = [], currentIndex = 0;
let testData = { selections: {}, flagged: [] };
let timeLeft = 3420; 
let timerInterval;

async function init() {
    const vTag = document.getElementById('version-tag');
    if (vTag) vTag.innerText = `HTML: ${HTML_VERSION} | JS: ${JS_VERSION}`;

    try {
        // CHANGED: Load from local storage master pool instead of server fetch
        const localData = localStorage.getItem('orion_master.json');
        
        if (!localData) {
            alert("Master question pool not found. Please return to Main Menu to sync.");
            window.location.href = 'mainmenu.html';
            return;
        }

        allQuestions = JSON.parse(localData);
        startTimed();
    } catch (e) { 
        console.error("Initialization Error:", e);
        alert("Error loading question data.");
    }
}

function startTimed() {
    // 50 random questions for timed mode
    sessionQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 50);
    currentIndex = 0;
    
    startTimer();
    renderQuestion();
}

function startTimer() {
    const timerDisplay = document.getElementById('timer');
    timerInterval = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        if (timerDisplay) {
            timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            
            // Visual warning at 5 minutes
            if (timeLeft < 300) {
                timerDisplay.style.color = (timeLeft % 2 === 0) ? "#ff3b30" : "#0f0";
            }
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishTest();
        }
    }, 1000);
}

function renderQuestion() {
    const q = sessionQuestions[currentIndex];
    const imgElement = document.getElementById('q-image');
    if (imgElement) {
        imgElement.style.display = 'none'; 
        imgElement.src = `images/${q.id}.jpeg`;
        imgElement.onload = () => { imgElement.style.display = 'block'; };
        imgElement.onerror = () => { imgElement.style.display = 'none'; };
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
    flagBtn.style.background = testData.flagged.includes(q.id) ? "#f1c40f" : "#bdc3c7";
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
    const idx = testData.flagged.indexOf(q.id);
    if (idx > -1) testData.flagged.splice(idx, 1);
    else testData.flagged.push(q.id);
    renderQuestion();
}

function finishTest() {
    clearInterval(timerInterval);
    let shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    let score = 0;

    sessionQuestions.forEach(q => {
        const userSelection = testData.selections[q.id];
        const isCorrect = (userSelection === q.correct);

        if (isCorrect) {
            score++;
            if (shameTally[q.id]) {
                shameTally[q.id] -= 1;
                if (shameTally[q.id] <= 0) delete shameTally[q.id];
            }
        } else if (userSelection) {
            shameTally[q.id] = (shameTally[q.id] || 0) + 1;
        }
    });

    localStorage.setItem('orion_shame_tally', JSON.stringify(shameTally));
    localStorage.setItem('orion_final_results', JSON.stringify({ score, total: sessionQuestions.length, questions: sessionQuestions, data: testData }));
    window.location.href = 'review.html';
}

window.onload = init;
