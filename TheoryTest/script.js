let allQuestions = [];
let testQuestions = [];
let currentIndex = 0;
let userAnswers = {}; 
let reviewMode = "none"; // none, all, wrong, skipped

async function loadTestData() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error('Could not find questions.json');
        allQuestions = await response.json();
        
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
        displayQuestion();
    } catch (err) {
        document.getElementById('question-text').innerText = "Error: questions.json not found.";
    }
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
    
    if (reviewMode === "skipped") {
        for (let i = currentIndex + 1; i < testQuestions.length; i++) {
            if (!userAnswers[i]) { nextIndex = i; break; }
        }
    } else if (reviewMode === "wrong") {
        for (let i = currentIndex + 1; i < testQuestions.length; i++) {
            if (userAnswers[i] && userAnswers[i] !== testQuestions[i].correct) { nextIndex = i; break; }
        }
    } else {
        if (currentIndex < testQuestions.length - 1) { nextIndex = currentIndex + 1; }
    }

    if (nextIndex !== -1) {
        currentIndex = nextIndex;
        displayQuestion();
    } else {
        showReviewMenu();
    }
}

function goBack() { if (currentIndex > 0) { currentIndex--; displayQuestion(); } }
function goSkip() { goNext(); }
function showReviewMenu() { document.getElementById('quiz-ui').classList.add('hidden'); document.getElementById('review-menu').classList.remove('hidden'); }

function hideReviewMenu() { 
    reviewMode = "all";
    currentIndex = 0; 
    document.getElementById('review-menu').classList.add('hidden'); 
    document.getElementById('quiz-ui').classList.remove('hidden'); 
    displayQuestion(); 
}

function reviewSkipped() {
    reviewMode = "skipped";
    let firstSkipped = -1;
    for (let i = 0; i < testQuestions.length; i++) { if (!userAnswers[i]) { firstSkipped = i; break; } }
    if (firstSkipped !== -1) {
        currentIndex = firstSkipped;
        document.getElementById('review-menu').classList.add('hidden');
        document.getElementById('quiz-ui').classList.remove('hidden');
        displayQuestion();
    } else { alert("No skipped questions found!"); }
}

function reviewWrong() {
    reviewMode = "wrong";
    let firstWrong = -1;
    for (let i = 0; i < testQuestions.length; i++) {
        if (userAnswers[i] && userAnswers[i] !== testQuestions[i].correct) { firstWrong = i; break; }
    }
    if (firstWrong !== -1) {
        currentIndex = firstWrong;
        document.getElementById('review-menu').classList.add('hidden');
        document.getElementById('quiz-ui').classList.remove('hidden');
        displayQuestion();
    } else { alert("No incorrect answers to review!"); }
}

function goToMainMenu() {
    window.location.href = 'mainmenu.html';
}

function finishTest() {
    let score = 0;
    let incorrectIDs = [];
    let hallOfShame = JSON.parse(localStorage.getItem('hallOfShame')) || [];
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = ''; 

    testQuestions.forEach((q, index) => {
        const userChoice = userAnswers[index];
        const isCorrect = userChoice === q.correct;
        if (isCorrect) score++;
        else if (userChoice) {
            incorrectIDs.push(q.id);
            if (!hallOfShame.includes(q.id)) hallOfShame.push(q.id);
        }

        const item = document.createElement('div');
        item.className = "review-item";
        
        let choicesHtml = "";
        for (const [letter, text] of Object.entries(q.choices)) {
            let marker = "";
            let style = "";
            if (userChoice === letter && !isCorrect) {
                marker = '<span class="red-x">X</span>';
                style = 'style="color:red; font-weight:bold;"';
            }
            choicesHtml += `<div class="review-choice" ${style}>${marker}${letter}: ${text}</div>`;
        }

        item.innerHTML = `
            <div><strong>Q${index + 1}: ${q.question}</strong></div>
            <div style="margin: 10px 0;">${choicesHtml}</div>
            <div class="correct-answer-box">
                <strong>Correct ${q.correct}:</strong><br>
                ${q.explanation}
            </div>
        `;
        reviewList.appendChild(item);
    });

    localStorage.setItem('hallOfShame', JSON.stringify(hallOfShame));
    let percent = Math.round((score / 50) * 100);
    document.getElementById('review-menu').classList.add('hidden');
    document.getElementById('result-ui').classList.remove('hidden');
    document.getElementById('pass-fail-text').innerText = percent >= 86 ? "🎉 Passed" : "❌ Failed";
    document.getElementById('pass-fail-text').style.color = percent >= 86 ? "green" : "red";
    document.getElementById('final-score').innerText = `${score} / 50`;
    document.getElementById('percentage-text').innerText = `${percent}% (Pass: 86%)`;
    document.getElementById('wrong-ids').innerText = incorrectIDs.join(', ') || "None";
    window.scrollTo(0, 0);
}

loadTestData();
