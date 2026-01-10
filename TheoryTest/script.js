let allQuestions = [];
let testQuestions = [];
let currentIndex = 0;
let userAnswers = {}; 
let midTestReviewMode = "none";

async function loadTestData() {
    const statusBox = document.getElementById('question-text');
    try {
        const response = await fetch('questions.json?v=' + Date.now());
        if (!response.ok) throw new Error('File not found.');
        const text = await response.text();
        try {
            allQuestions = JSON.parse(text);
        } catch (jsonErr) {
            throw new Error('Formatting Error: ' + jsonErr.message);
        }
        prepareTest();
        displayQuestion();
    } catch (err) {
        statusBox.innerHTML = `<span style="color:red; font-weight:bold;">${err.message}</span><br><small>Check the very end of your questions.json file for a missing bracket.</small>`;
    }
}

function prepareTest() {
    const categories = {};
    allQuestions.forEach(q => {
        if (!categories[q.category]) categories[q.category] = [];
        categories[q.category].push(q);
    });
    const catNames = Object.keys(categories);
    const amountPerCat = Math.floor(50 / catNames.length);
    testQuestions = [];
    catNames.forEach(name => {
        let shuffled = [...categories[name]].sort(() => 0.5 - Math.random());
        testQuestions.push(...shuffled.slice(0, amountPerCat));
    });
    while (testQuestions.length < 50) {
        let rand = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        if (!testQuestions.includes(rand)) testQuestions.push(rand);
    }
    testQuestions.sort(() => 0.5 - Math.random());
}

function displayQuestion() {
    const q = testQuestions[currentIndex];
    document.getElementById('counter').innerText = `Question ${currentIndex + 1} of ${testQuestions.length}`;
    document.getElementById('category-display').innerText = q.category;
    document.getElementById('question-text').innerText = q.question;
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    for (const [letter, text] of Object.entries(q.choices)) {
        const btn = document.createElement('button');
        btn.innerText = `${letter}: ${text}`;
        btn.className = "btn";
        if (userAnswers[currentIndex] === letter) {
            btn.style.background = "#e3f2fd";
            btn.style.borderColor = "#2196f3";
        }
        btn.onclick = () => { userAnswers[currentIndex] = letter; displayQuestion(); };
        optionsDiv.appendChild(btn);
    }
}

function goNext() {
    let nextIndex = -1;
    if (midTestReviewMode === "skipped") {
        for (let i = currentIndex + 1; i < testQuestions.length; i++) { if (!userAnswers[i]) { nextIndex = i; break; } }
    } else {
        if (currentIndex < testQuestions.length - 1) nextIndex = currentIndex + 1;
    }
    if (nextIndex !== -1) { currentIndex = nextIndex; displayQuestion(); } 
    else { showReviewMenu(); }
}

function goBack() { if (currentIndex > 0) { currentIndex--; displayQuestion(); } }
function goSkip() { goNext(); }
function showReviewMenu() { document.getElementById('quiz-ui').classList.add('hidden'); document.getElementById('review-menu').classList.remove('hidden'); }
function hideReviewMenu() { midTestReviewMode = "all"; currentIndex = 0; document.getElementById('review-menu').classList.add('hidden'); document.getElementById('quiz-ui').classList.remove('hidden'); displayQuestion(); }

function reviewSkipped() {
    midTestReviewMode = "skipped";
    let first = testQuestions.findIndex((_, i) => !userAnswers[i]);
    if (first !== -1) { currentIndex = first; document.getElementById('review-menu').classList.add('hidden'); document.getElementById('quiz-ui').classList.remove('hidden'); displayQuestion(); }
    else { alert("No skipped questions!"); }
}

function finishTest() {
    let score = 0;
    testQuestions.forEach((q, i) => { if (userAnswers[i] === q.correct) score++; });
    let percent = Math.round((score / 50) * 100);
    document.getElementById('review-menu').classList.add('hidden');
    document.getElementById('result-ui').classList.remove('hidden');
    document.getElementById('pass-fail-text').innerText = percent >= 86 ? "🎉 Passed" : "❌ Failed";
    document.getElementById('pass-fail-text').style.color = percent >= 86 ? "green" : "red";
    document.getElementById('final-score').innerText = `${score} / 50`;
    document.getElementById('percentage-text').innerText = `${percent}% (Pass: 86%)`;
    generateReviewList('all');
    window.scrollTo(0,0);
}

function generateReviewList(filter) {
    // UI Update for buttons
    ['all', 'wrong', 'skipped'].forEach(f => {
        document.getElementById('btn-' + f).classList.remove('active-filter');
    });
    document.getElementById('btn-' + filter).classList.add('active-filter');

    const list = document.getElementById('review-list');
    list.innerHTML = '';
    testQuestions.forEach((q, i) => {
        const userChoice = userAnswers[i];
        const isCorrect = userChoice === q.correct;
        if (filter === 'wrong' && (isCorrect || !userChoice)) return;
        if (filter === 'skipped' && userChoice) return;

        let choicesHtml = "";
        for (const [letter, text] of Object.entries(q.choices)) {
            let style = (userChoice === letter && !isCorrect) ? 'style="color:red; font-weight:bold;"' : '';
            let marker = (userChoice === letter && !isCorrect) ? '<span class="red-x">X</span>' : '';
            choicesHtml += `<div ${style}>${marker}${letter}: ${text}</div>`;
        }
        list.innerHTML += `<div class="review-item"><strong>Q${i+1}: ${q.question}</strong><br><div style="margin:10px 0;">${choicesHtml}</div><div class="correct-answer-box"><strong>Correct ${q.correct}:</strong><br>${q.explanation}</div></div>`;
    });
}

loadTestData();
