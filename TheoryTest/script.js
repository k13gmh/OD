// 1. Your Questions Array
const questions = [
    {
        question: "What should you do before moving off from a parked position?",
        options: ["Check all mirrors", "Check your blind spot", "Signal if necessary", "All of the above"],
        answer: 3 // This is the index of the correct answer (starts at 0)
    },
    {
        question: "What does a circular road sign with a red border mean?",
        options: ["A warning", "A command", "A prohibition", "An information sign"],
        answer: 2
    },
    {
        question: "When should you use your hazard warning lights?",
        options: ["When parked on a double yellow line", "When being towed", "When slowing down on a motorway due to a hazard ahead", "To thank another driver"],
        answer: 2
    }
    // PASTE YOUR REMAINING 47 QUESTIONS HERE FOLLOWING THE SAME FORMAT
];

let currentQuestionIndex = 0;
let score = 0;

// 2. Elements from start.html
const questionCounter = document.getElementById('question-counter');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const quizContent = document.getElementById('quiz-content');
const resultContainer = document.getElementById('result-container');
const finalScore = document.getElementById('final-score');

// 3. Function to load a question
function loadQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Update the Counter
    questionCounter.innerText = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    
    // Update Question Text
    questionText.innerText = currentQuestion.question;
    
    // Clear old buttons
    optionsContainer.innerHTML = '';
    
    // Create new buttons for each option
    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('option-btn');
        button.onclick = () => selectAnswer(index);
        optionsContainer.appendChild(button);
    });
}

// 4. Function to handle answer selection
function selectAnswer(selectedIndex) {
    const correctIndex = questions[currentQuestionIndex].answer;
    
    if (selectedIndex === correctIndex) {
        score++;
    }

    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

// 5. Function to show the final score
function showResults() {
    quizContent.style.display = 'none';
    resultContainer.style.display = 'block';
    finalScore.innerText = `You scored ${score} out of ${questions.length}`;
}

// Start the quiz for the first time
loadQuestion();
