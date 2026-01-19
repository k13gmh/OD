/**
 * File: category.js
 * Version: v2.1.0
 * Feature: Filtered Category Mock with Option Shuffling
 */

const SCRIPT_VERSION = "v2.1.0";

if (!sessionStorage.getItem('orion_session_token')) {
    window.location.href = 'mainmenu.html';
}

let allQuestions = [], sessionQuestions = [], currentIndex = 0, originalSessionQuestions = []; 
let testData = { selections: {}, flagged: [], seenIndices: [] };

async function init() {
    const tag = document.getElementById('v-tag-top');
    if (tag) tag.innerText = SCRIPT_VERSION;
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        buildCategoryMenu();
    } catch (e) { console.error(e); }
}

function buildCategoryMenu() {
    const categories = [...new Set(allQuestions.map(q => q.category))].sort();
    const listArea = document.getElementById('category-list');
    listArea.innerHTML = '';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn';
        btn.innerText = cat;
        btn.onclick = () => startCategoryTest(cat);
        listArea.appendChild(btn);
    });
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

    return {
        ...q,
        choices: newChoices,
        correct: newCorrectLetter,
        originalIndex: displayIndex
    };
}

function startCategoryTest(categoryName) {
    document.getElementById('menu-ui').style.display = 'none';
    document.getElementById('test-ui').style.display = 'block';

    // Filter by category, then shuffle question order
    let selected = allQuestions
        .filter(q => q.category === categoryName)
        .sort(() => 0.5 - Math.random());

    // Scramble the options for each question
    sessionQuestions = selected.map((q, idx) => {
        return shuffleQuestionOptions(q, idx + 1);
    });
    
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

    document.getElementById('q-number').innerText = `Question ${q.originalIndex} of ${originalSessionQuestions.length}`;
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
        <h3>Category Summary</h3>
        <p>You have ${skipped} unanswered questions.</p>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <button class="btn btn-blue" onclick="retrySubset('skipped')">SKIPPED (${skipped})</button>
            <button class="btn btn-blue" onclick="retrySubset('flagged')">FLAGGED (${flagged})</button>
            <button class="btn btn-blue" onclick="retrySubset('all')">REVIEW ALL</button>
            <button class="btn" onclick="reviewAnswers()">FINISHED</button>
        </div>
    `;

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

function openModal(src) {
    document.getElementById('img-modal-content').src = src;
    document.getElementById('img-modal').style.display = 'flex';
}

function reviewAnswers() { 
    window.location.href = 'review.html'; 
}

init();
