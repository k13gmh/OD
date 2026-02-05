/**
 * File: category.js
 * Version: v2.2.5
 * Feature: Removed sysmenu link, Final Grey UI Standardization
 */

const SCRIPT_VERSION = "v2.2.5";

if (!localStorage.getItem('orion_session_token')) {
    window.location.href = 'mainmenu.html';
}

let allQuestions = [], sessionQuestions = [], currentIndex = 0, originalSessionQuestions = []; 
let testData = { selections: {}, flagged: [], seenIndices: [] };
let selectedCategory = "";

async function init() {
    const tag = document.getElementById('v-tag-top');
    if (tag) {
        tag.innerText = `JS: ${SCRIPT_VERSION}`;
    }
    
    try {
        const localData = localStorage.getItem('orion_master.json');
        if (!localData) {
            alert("Master question pool not found. Please return to Main Menu to sync.");
            window.location.href = 'mainmenu.html';
            return;
        }
        allQuestions = JSON.parse(localData);
        buildCategoryMenu();
    } catch (e) { 
        console.error("Initialization Error:", e);
    }
}

function buildCategoryMenu() {
    const categories = [...new Set(allQuestions.map(q => q.category))].sort();
    const listArea = document.getElementById('category-list');
    listArea.innerHTML = '<h2 style="text-align: center; margin-bottom: 20px;">Select Category</h2>';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'btn'; 
        btn.style.background = '#ffffff';
        btn.style.color = '#000000';
        btn.style.border = '1px solid #000000';
        btn.style.marginBottom = '10px';
        btn.style.width = '100%';
        btn.style.padding = '11px'; 
        btn.style.borderRadius = '12px';
        btn.style.fontSize = '0.9rem';
        btn.innerText = cat;
        btn.onclick = () => showQuantitySelector(cat);
        listArea.appendChild(btn);
    });

    // Single Back Button - Only points to Main Menu
    const backBtn = document.createElement('a');
    backBtn.href = "mainmenu.html";
    backBtn.className = 'btn btn-grey';
    backBtn.style.marginTop = '15px';
    backBtn.style.display = 'block';
    backBtn.style.textDecoration = 'none';
    backBtn.style.textAlign = 'center';
    backBtn.style.borderRadius = '12px';
    backBtn.style.padding = '15px';
    backBtn.innerText = "BACK TO MAIN MENU";
    listArea.appendChild(backBtn);
}

function showQuantitySelector(categoryName) {
    selectedCategory = categoryName;
    const count = allQuestions.filter(q => q.category === categoryName).length;
    const listArea = document.getElementById('category-list');
    const defaultVal = count < 50 ? count : 50;

    listArea.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 10px;">${categoryName}</h2>
        <p style="text-align:center; color:#8e8e93; font-size: 0.9rem; margin-bottom: 25px;">There are ${count} questions available.</p>
        
        <button class="btn btn-blue" style="margin-bottom: 15px; padding: 20px; font-size: 1.1rem; width:100%; border-radius:12px;" onclick="startCategoryTest(${defaultVal})">
            START TEST (${defaultVal} QUESTIONS)
        </button>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <button class="btn btn-grey" style="padding: 12px; font-size: 0.85rem;" onclick="startCategoryTest(10)">Try 10</button>
            <button class="btn btn-grey" style="padding: 12px; font-size: 0.85rem;" onclick="startCategoryTest(20)">Try 20</button>
            <button class="btn btn-grey" style="padding: 12px; font-size: 0.85rem;" onclick="startCategoryTest(${count})">Try ALL (${count})</button>
            <button class="btn btn-grey" style="padding: 12px; font-size: 0.85rem;" onclick="promptCustomCount(${count})">Custom</button>
        </div>
        <button class="btn btn-grey" style="width:100%; padding: 15px; border-radius:12px;" onclick="buildCategoryMenu()">BACK</button>
    `;
}

function startCategoryTest(limit) {
    document.getElementById('menu-ui').style.display = 'none';
    document.getElementById('test-ui').style.display = 'block';

    let selected = allQuestions
        .filter(q => q.category === selectedCategory)
        .sort(() => 0.5 - Math.random())
        .slice(0, limit);

    sessionQuestions = selected.map((q, idx) => shuffleQuestionOptions(q, idx + 1));
    originalSessionQuestions = [...sessionQuestions];
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
        imgElement.onclick = () => openModal(imgElement.src);
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
    const isFlagged = (testData.flagged && testData.flagged.includes(q.id));
    flagBtn.style.background = isFlagged ? "#f1c40f" : "#bdc3c7";
    flagBtn.innerText = isFlagged ? "FLAGGED" : "FLAG";
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
        <h3 style="margin-bottom: 20px;">Category Summary</h3>
        <p style="margin-bottom: 20px; color: #8e8e93;">You have ${skipped} unanswered questions.</p>
        <div style="display:grid; grid-template-columns: 1fr; gap:12px;">
            <button class="btn btn-blue" style="padding: 15px; border-radius: 12px;" onclick="retrySubset('skipped')">REVIEW SKIPPED (${skipped})</button>
            <button class="btn btn-blue" style="padding: 15px; border-radius: 12px;" onclick="retrySubset('flagged')">REVIEW FLAGGED (${flagged})</button>
            <button class="btn btn-blue" style="padding: 15px; border-radius: 12px;" onclick="retrySubset('all')">REVIEW ALL</button>
            <button class="btn btn-grey" style="margin-top: 10px; padding: 15px; border-radius: 12px;" onclick="reviewAnswers()">FINISH TEST</button>
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
    return { ...q, choices: newChoices, correct: newCorrectLetter, originalIndex: displayIndex };
}

function openModal(src) {
    document.getElementById('img-modal-content').src = src;
    document.getElementById('img-modal').style.display = 'flex';
}

function reviewAnswers() { 
    let shameTally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    let score = 0;
    originalSessionQuestions.forEach(q => {
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
    localStorage.setItem('orion_final_results', JSON.stringify({ score, total: originalSessionQuestions.length, questions: originalSessionQuestions, data: testData }));
    window.location.href = 'review.html'; 
}

window.onload = init;
