const JS_VERSION = "v2.4.1";

let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval;
let timeLeft = 3420;

/**
 * Simplified initialization [cite: 2026-01-17]
 */
async function init() {
    const jsVerText = document.getElementById('js-version-text');
    if (jsVerText) jsVerText.innerText = `JS: ${JS_VERSION}`;

    try {
        // Simple fetch without aggressive error trapping [cite: 2026-01-17]
        const response = await fetch('questions.json');
        const data = await response.json();
        
        // Pick 50 random questions
        questions = data.sort(() => 0.5 - Math.random()).slice(0, 50);
        userAnswers = new Array(questions.length).fill(null);
        
        startTimer();
        showQuestion();
    } catch (e) {
        console.error("Load failed", e);
        document.getElementById('question-text').innerText = "Database connection error.";
    }
}

function showQuestion() {
    const q = questions[currentQuestionIndex];
    if (!q) return;

    document.getElementById('question-text').innerText = q.question;
    document.getElementById('question-id').innerText = `ID: ${q.id}`;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    q.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = choice;
        btn.onclick = () => handleAnswer(index);
        container.appendChild(btn);
    });
}

function handleAnswer(selectedIndex) {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = (selectedIndex === currentQuestion.correct);
    userAnswers[currentQuestionIndex] = selectedIndex;

    // Wall of Shame logic [cite: 2026-01-11]
    let tally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    if (!isCorrect) {
        tally[currentQuestion.id] = (tally[currentQuestion.id] || 0) + 1;
    } else if (tally[currentQuestion.id]) {
        tally[currentQuestion.id] -= 1;
        if (tally[currentQuestion.id] <= 0) delete tally[currentQuestion.id];
    }
    localStorage.setItem('orion_shame_tally', JSON.stringify(tally));

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        finishTest();
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        document.getElementById('timer').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (timeLeft <= 0) finishTest();
    }, 1000);
}

function finishTest() {
    clearInterval(timerInterval);
    localStorage.setItem('orion_last_results', JSON.stringify({
        questions: questions,
        userAnswers: userAnswers
    }));
    window.location.href = 'results.html';
}

window.onload = init;
