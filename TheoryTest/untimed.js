/**
 * File: untimed.js
 * Version: v2.2.7
 * Feature: Wall of Shame Weighted Selection & Redemption
 */

const SCRIPT_VERSION = "v2.2.7";

// Security Check [cite: 2026-01-11, 2026-01-17]
if (!localStorage.getItem('orion_session_token')) {
    window.location.href = 'mainmenu.html';
}

let allQuestions = [], sessionQuestions = [], currentIndex = 0;
let testData = { selections: {}, flagged: [], seenIndices: [] };

async function init() {
    const tag = document.getElementById('v-tag-top');
    if (tag) tag.innerText = SCRIPT_VERSION;
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        startUntimed();
    } catch (e) { console.error(e); }
}

function startUntimed() {
    // 1. Get Shame Tally from LocalStorage [cite: 2026-01-17]
    const shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');

    // 2. Weighted Selection Logic [cite: 2026-01-11]
    let weightedPool = [];
    allQuestions.forEach(q => {
        const tally = shameTally[q.id] || 0;
        // Base weight is 1. Each tally adds +2 to the weight.
        const weight = 1 + (tally * 2); 
        for (let i = 0; i < weight; i++) {
            weightedPool.push(q);
        }
    });

    // 3. Draw 50 unique questions from the weighted pool
    let selected = [];
    while (selected.length < 50 && weightedPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        const picked = weightedPool[randomIndex];
        // Ensure no duplicates in the 50-set
        if (!selected.find(s => s.id === picked.id)) {
            selected.push(picked);
        }
        // Remove all instances of this picked question from pool to avoid re-picking
        weightedPool = weightedPool.filter(p => p.id !== picked.id);
    }

    // Shuffle and Prepare
    sessionQuestions = selected.sort(() => 0.5 - Math.random());
    currentIndex = 0;
    testData = { selections: {}, flagged: [], seenIndices: [0] };
    renderQuestion();
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
    const isFlagged = testData.flagged.includes(q.id);
    flagBtn.style.background = isFlagged ? "#f1c40f" : "#bdc3c7";
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
    // 1. Load Shame Tally [cite: 2026-01-17]
    let shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    let score = 0;

    sessionQuestions.forEach(q => {
        const userSelection = testData.selections[q.id];
        const isCorrect = (userSelection === q.correct);

        if (isCorrect) {
            score++;
            // Redemption Logic: If it was on the Wall of Shame, decrease tally by 0.5
            // (Getting it right twice removes it) [cite: 2026-01-11]
            if (shameTally[q.id]) {
                shameTally[q.id] -= 0.5;
                if (shameTally[q.id] <= 0) delete shameTally[q.id];
            }
        } else if (userSelection) {
            // Error Logic: If wrong, increase tally by 1
            shameTally[q.id] = (shameTally[q.id] || 0) + 1;
        }
    });

    // 2. Save Tally back to LocalStorage [cite: 2026-01-17]
    localStorage.setItem('orion_shame_tally', JSON.stringify(shameTally));

    // Save final results for review [cite: 2026-01-11]
    localStorage.setItem('orion_final_results', JSON.stringify({ 
        score, 
        total: sessionQuestions.length, 
        questions: sessionQuestions, 
        data: testData 
    }));
    
    window.location.href = 'review.html';
}

init();
