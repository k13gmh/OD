/**
 * File: untimed.js
 * Version: v2.4.2
 * * Change Log:
 * v2.4.2 - Disabled localStorage.removeItem('orion_current_session') in finishTest to allow resumption after review.
 * v2.4.1 - Feature: Weighted Selection & Strict Redemption (2:1 Ratio).
 * v2.4.0 - Initial Weighted logic implementation.
 */

const JS_VERSION = "v2.4.2";
const HTML_VERSION = "v2.2.8"; 

if (!localStorage.getItem('orion_session_token')) {
    window.location.href = 'mainmenu.html';
}

let allQuestions = [], sessionQuestions = [], currentIndex = 0;
let testData = { selections: {}, flagged: [] };

async function init() {
    const vTag = document.getElementById('version-tag');
    if (vTag) vTag.innerText = `HTML: ${HTML_VERSION} | JS: ${JS_VERSION}`;

    // Inject Custom Modal CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #resume-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); align-items:center; justify-content:center; z-index:9999; }
        .modal-box { background:#fff; padding:25px; border-radius:15px; width:85%; max-width:400px; text-align:center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .modal-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 12px; color: #333; }
        .modal-text { font-size: 0.95rem; color: #555; margin-bottom: 25px; line-height: 1.4; }
        .modal-btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .m-btn { border:none; padding:14px; border-radius:8px; font-weight:bold; cursor:pointer; text-transform:uppercase; font-size:0.8rem; transition: opacity 0.2s; }
        .m-btn-blue { background:#007bff; color:#fff; }
        .m-btn-grey { background:#6c757d; color:#fff; }
        .m-btn:active { opacity: 0.8; }
    `;
    document.head.appendChild(style);

    // Inject the Modal HTML
    const modalDiv = document.createElement('div');
    modalDiv.id = "resume-modal";
    modalDiv.innerHTML = `
        <div class="modal-box">
            <div class="modal-title">Resume Test?</div>
            <div class="modal-text">An existing session was found. Would you like to resume where you left off?</div>
            <div class="modal-btn-grid">
                <button class="m-btn m-btn-grey" onclick="handleResumeChoice(false)">Restart</button>
                <button class="m-btn m-btn-blue" onclick="handleResumeChoice(true)">Resume</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalDiv);

    try {
        const localData = localStorage.getItem('orion_master.json');
        if (!localData) {
            alert("Master question pool not found. Please return to Main Menu to sync.");
            window.location.href = 'mainmenu.html';
            return;
        }

        allQuestions = JSON.parse(localData);
        
        const savedSession = localStorage.getItem('orion_current_session');
        if (savedSession) {
            document.getElementById('resume-modal').style.display = 'flex';
        } else {
            startNewUntimed();
        }
    } catch (e) { 
        console.error("Initialization Error:", e);
        alert("Error loading question data.");
    }
}

function handleResumeChoice(shouldResume) {
    document.getElementById('resume-modal').style.display = 'none';
    if (shouldResume) {
        const session = JSON.parse(localStorage.getItem('orion_current_session'));
        sessionQuestions = session.questions;
        testData = session.data;
        currentIndex = session.index || 0;
        renderQuestion();
    } else {
        startNewUntimed();
    }
}

function startNewUntimed() {
    const shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    let weightedPool = [];

    // Build the Weighted Lottery
    allQuestions.forEach(q => {
        let weight = Math.max(1, Math.floor(shameTally[q.id] || 0) + 1);
        for (let i = 0; i < weight; i++) {
            weightedPool.push(q);
        }
    });

    let selected = [];
    let tempPool = [...allQuestions];

    while (selected.length < 50 && tempPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        const picked = weightedPool[randomIndex];
        
        if (!selected.find(s => s.id === picked.id)) {
            selected.push(picked);
            weightedPool = weightedPool.filter(p => p.id !== picked.id);
            tempPool = tempPool.filter(p => p.id !== picked.id);
        }
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
    // MODIFIED (v2.4.2): Session is now preserved.
    // localStorage.removeItem('orion_current_session');
    
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

    localStorage.setItem('orion_shame_tally', JSON.stringify(shameTally));
    localStorage.setItem('orion_final_results', JSON.stringify({ score, total: sessionQuestions.length, questions: sessionQuestions, data: testData }));
    window.location.href = 'review.html';
}

window.onload = init;
