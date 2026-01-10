let questions = [];
let currentIndex = 0;

/**
 * Loads the questions from the external JSON file.
 * This function is called automatically when the window loads.
 */
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error("questions.json not found");
        
        questions = await response.json();
        renderQuestion();
    } catch (e) {
        const textElement = document.getElementById('q-text');
        if (textElement) {
            textElement.innerText = "Error loading questions.json. Check file path.";
        }
        console.error("Test Engine Error:", e);
    }
}

/**
 * Displays the current question and generates the answer buttons.
 */
function renderQuestion() {
    if (questions.length === 0) return;

    const q = questions[currentIndex];
    
    // Update Question Number and Text
    document.getElementById('q-number').innerText = `Question ${currentIndex + 1} of ${questions.length}`;
    document.getElementById('q-text').innerText = q.question;
    
    const area = document.getElementById('options-area');
    area.innerHTML = ""; // Clear previous options
    
    // Dynamically create a button for each answer choice
    q.answers.forEach((ans, index) => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = ans.text;
        
        // When clicked, check if it is the correct answer
        btn.onclick = () => selectAnswer(btn, ans.correct);
        area.appendChild(btn);
    });

    // Update Navigation Buttons (Disable if at start or end)
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) prevBtn.disabled = (currentIndex === 0);
    if (nextBtn) nextBtn.disabled = (currentIndex === questions.length - 1);
}

/**
 * Handles the logic when a user selects an answer.
 * Turns the button green for correct or red for incorrect.
 */
function selectAnswer(btn, isCorrect) {
    // Disable all buttons in this question once a choice is made
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    if (isCorrect) {
        btn.classList.add('correct'); // Turns button green
    } else {
        btn.classList.add('incorrect'); // Turns button red
        
        // Auto-show the correct answer so the student learns
        const options = questions[currentIndex].answers;
        const allButtons = document.querySelectorAll('.option-btn');
        options.forEach((opt, i) => {
            if (opt.correct) allButtons[i].classList.add('correct');
        });
    }
}

/**
 * Moves to the next or previous question.
 */
function changeQuestion(step) {
    currentIndex += step;
    renderQuestion();
    window.scrollTo(0, 0); // Reset scroll to top of the new question
}

// Initialize the script
window.onload = loadQuestions;
