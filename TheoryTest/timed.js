const JS_VERSION = "v2.3.8";

let questions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval;
let timeLeft = 3420; // 57 minutes

async function init() {
    // Update version display [cite: 2026-01-11]
    const jsVerText = document.getElementById('js-version-text');
    if (jsVerText) jsVerText.innerText = `JS: ${JS_VERSION}`;

    try {
        const response = await fetch('questions.json');
        const allQuestions = await response.json();
        
        // Randomly select 50 questions [cite: 2026-01-11]
        questions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 50);
        userAnswers = new Array(questions.length).fill(null);
        
        startTimer();
        showQuestion();
    } catch (error) {
        console.error("Failed to load questions:", error);
    }
}

function showQuestion() {
    const q = questions[currentQuestionIndex];
    const textElem = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const idElem = document.getElementById('question-id');

    textElem.innerText = q.question;
    idElem.innerText = `ID: ${q.id}`;
    optionsContainer.innerHTML = '';

    q.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = choice;
        btn.onclick = () => handleAnswer(index);
        optionsContainer.appendChild(btn);
    });
}

/**
 * Handles answer selection and Wall of Shame weighting [cite: 2026-01-11, 2026-01-17]
 */
function handleAnswer(selectedIndex) {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = (selectedIndex === currentQuestion.correct);
    userAnswers[currentQuestionIndex] = selectedIndex;

    // Wall of Shame logic [cite: 2026-01-11]
    let tally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    const qId = currentQuestion.id;

    if (!isCorrect) {
        // Increase error weight [cite: 2026-01-11]
        tally[qId] = (tally[qId] || 0) + 1;
    } else {
        // Redemption: decrease weight [cite: 2026-01-11]
        if (tally[qId]) {
            tally[qId] -= 1;
            if (tally[qId] <= 0) delete tally[qId];
        }
    }
    localStorage.setItem('orion_shame_tally', JSON.stringify(tally));

    // Progress to next question [cite: 2026-01-17]
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        finishTest();
    }
}

function startTimer() {
    const timerDisplay = document.getElementById('timer');
    timerInterval = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerDisplay.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishTest();
        }
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
