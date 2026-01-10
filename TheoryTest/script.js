// script.js - Ver 1.6.1
let questions = [];
let currentIndex = 0;

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error("questions.json not found");
        questions = await response.json();
        
        // Ensure we start at index 0 and render immediately
        currentIndex = 0;
        renderQuestion();
    } catch (e) {
        document.getElementById('q-text').innerText = "Error: questions.json not found.";
        console.error(e);
    }
}

function renderQuestion() {
    if (!questions || questions.length === 0) return;
    const q = questions[currentIndex];
    
    // Update question count and text
    document.getElementById('q-number').innerText = `Question ${currentIndex + 1} of ${questions.length}`;
    document.getElementById('q-text').innerText = q.question;
    
    const area = document.getElementById('options-area');
    area.innerHTML = ""; // Clear for new options
    
    // Create the multiple choice buttons (A, B, C, D)
    if (q.answers && Array.isArray(q.answers)) {
        q.answers.forEach((ans, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = ans.text;
            btn.onclick = () => selectAnswer(btn, ans.correct);
            area.appendChild(btn);
        });
    }

    // Set navigation button states
    document.getElementById('prev-btn').disabled = (currentIndex === 0);
    document.getElementById('next-btn').disabled = (currentIndex === questions.length - 1);
    document.getElementById('skip-btn').disabled = (currentIndex === questions.length - 1);
}

function selectAnswer(btn, isCorrect) {
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true); // Lock choices after selection

    if (isCorrect) {
        btn.classList.add('correct');
    } else {
        btn.classList.add('incorrect');
        // Show the correct answer automatically
        const options = questions[currentIndex].answers;
        const allButtons = document.querySelectorAll('.option-btn');
        options.forEach((opt, i) => {
            if (opt.correct) allButtons[i].classList.add('correct');
        });
    }
}

function changeQuestion(step) {
    currentIndex += step;
    // Bounds check to prevent errors
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= questions.length) currentIndex = questions.length - 1;
    
    renderQuestion();
    window.scrollTo(0, 0);
}

// Call load on startup
window.onload = loadQuestions;
