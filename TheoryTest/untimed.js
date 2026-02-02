/**
 * File: untimed.js
 * Version: v2.3.1
 * Feature: Persistent Resume (even after Finish)
 */

const JS_VERSION = "v2.3.1";
const HTML_VERSION = "v2.2.8"; 

if (!localStorage.getItem('orion_session_token')) {
    window.location.href = 'mainmenu.html';
}

let allQuestions = [], sessionQuestions = [], currentIndex = 0;
let testData = { selections: {}, flagged: [] };

async function init() {
    const vTag = document.getElementById('version-tag');
    if (vTag) vTag.innerText = `HTML: ${HTML_VERSION} | JS: ${JS_VERSION}`;

    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        
        const savedSession = localStorage.getItem('orion_current_session');
        if (savedSession) {
            const confirmed = confirm("An existing session was found. Would you like to RESUME?\n\n(Cancel will RESTART)");
            if (confirmed) {
                const session = JSON.parse(savedSession);
                sessionQuestions = session.questions;
                testData = session.data;
                currentIndex = session.index || 0;
                renderQuestion();
            } else {
                startNewUntimed();
            }
        } else {
            startNewUntimed();
        }
    } catch (e) { console.error(e); }
}

function startNewUntimed() {
    const shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    let weightedPool = [];

    allQuestions.forEach(q => {
        const tally = shameTally[q.id] || 0;
        const weight = 1 + (tally * 2); 
        for (let i = 0; i < weight; i++) {
            weightedPool.push(q);
        }
    });

    let selected = [];
    while (selected.length < 50 && weightedPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        const picked = weightedPool[randomIndex];
        if (!selected.find(s => s.id === picked.id)) {
            selected.push(picked);
        }
        weightedPool = weightedPool.filter(p => p.id !== picked.id);
    }

    sessionQuestions = selected.sort(() => 0.5 - Math.random());
    currentIndex = 0;
    testData = { selections: {}, flagged: [] };
    saveProgress();
    renderQuestion();
}

function saveProgress() {
    const session = {
        questions: sessionQuestions,
        data: testData,
        index: currentIndex
    };
    localStorage.setItem('orion_current_session', JSON.stringify(session));
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
                saveProgress();
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
        saveProgress();
        renderQuestion();
    }
}

function toggleFlag() {
    const q = sessionQuestions[currentIndex];
    const idx = testData.flagged.indexOf(q.id);
    if (idx > -1) testData.flagged.splice(idx, 1);
    else testData.flagged.push(q.id);
    saveProgress();
    renderQuestion();
}

function finishTest() {
    let shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    let score = 0;

    sessionQuestions.forEach(q => {
        const userSelection = testData.selections[q.id];
        const isCorrect = (userSelection === q.correct);

        if (isCorrect) {
            score++;
            if (shameTally[q.id]) {
                shameTally[q.id] -= 0.5;
                if (shameTally[q.id] <= 0) delete shameTally[q.id];
            }
        } else if (userSelection) {
            shameTally[q.id] = (shameTally[q.id] || 0) + 1;
        }
    });

    // PROGRESS SAVED: We no longer remove orion_current_session here.
    
    localStorage.setItem('orion_shame_tally', JSON.stringify(shameTally));
    localStorage.setItem('orion_final_results', JSON.stringify({ score, total: sessionQuestions.length, questions: sessionQuestions, data: testData }));
    window.location.href = 'review.html';
}

window.onload = init;
