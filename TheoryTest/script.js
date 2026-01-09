let userAnswers = {}; // To remember what was picked if we go Back/Forward

function displayQuestion() {
    const q = testQuestions[currentIndex];
    
    // 1. Show Category in Green
    document.getElementById('category-display').innerText = q.category;
    
    document.getElementById('counter').innerText = `Question ${currentIndex + 1} of ${testQuestions.length}`;
    document.getElementById('question-text').innerText = q.question;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    for (const [letter, text] of Object.entries(q.choices)) {
        const btn = document.createElement('button');
        btn.innerText = `${letter}: ${text}`;
        btn.className = "btn";
        
        // If user already picked this, highlight it
        if (userAnswers[currentIndex] === letter) {
            btn.style.borderColor = "#2196F3";
            btn.style.background = "#e3f2fd";
        }

        btn.onclick = () => {
            userAnswers[currentIndex] = letter; // Save choice
            displayQuestion(); // Refresh to show highlight
        };
        optionsDiv.appendChild(btn);
    }
}

function goNext() {
    if (currentIndex < testQuestions.length - 1) {
        currentIndex++;
        displayQuestion();
    } else {
        finishTest();
    }
}

function goBack() {
    if (currentIndex > 0) {
        currentIndex--;
        displayQuestion();
    }
}

function finishTest() {
    // Calculate final score based on saved userAnswers
    score = 0;
    incorrectIDs = [];

    testQuestions.forEach((q, index) => {
        if (userAnswers[index] === q.correct) {
            score++;
        } else if (userAnswers[index] !== undefined) { 
            // Only count as wrong if they actually answered it
            incorrectIDs.push(q.id);
        }
    });

    document.getElementById('quiz-ui').style.display = 'none';
    document.getElementById('result-ui').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Score: ${score} / ${testQuestions.length}`;
    document.getElementById('wrong-ids').innerText = incorrectIDs.join(', ') || "None";
}
