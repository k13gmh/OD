const JS_VERSION = "v2.3.8";

/**
 * Handle user answer selection in Timed Mode
 * Integrates with Wall of Shame weighting system
 */
function handleAnswer(selectedIndex) {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = (selectedIndex === currentQuestion.correct);

    // Save user choice for final results
    userAnswers[currentQuestionIndex] = selectedIndex;

    if (isCorrect) {
        // Redemption: Decrease weight if question was previously on the wall
        updateShameWeight(currentQuestion.id, -1);
    } else {
        // Add to Wall: Increase weight for incorrect answers
        updateShameWeight(currentQuestion.id, 1);
    }

    // Move to next question automatically after short delay
    setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            finishTest();
        }
    }, 300);
}

/**
 * Core Wall of Shame Logic
 * Adjusts the 'error weight' of a question based on performance
 */
function updateShameWeight(questionId, adjustment) {
    // Retrieve existing tally or create new object
    let tally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    
    if (adjustment > 0) {
        // Increase weight for incorrect answers
        tally[questionId] = (tally[questionId] || 0) + adjustment;
    } else if (tally[questionId]) {
        // Decrease weight for correct answers (Redemption)
        tally[questionId] += adjustment;
        
        // Remove from wall if weight hits zero or below
        if (tally[questionId] <= 0) {
            delete tally[questionId];
        }
    }
    
    // Save updated wall data back to storage
    localStorage.setItem('orion_shame_tally', JSON.stringify(tally));
}

// Ensure results calculation still works as expected
function finishTest() {
    stopTimer();
    // Logic to calculate final score and redirect to results page
    const score = userAnswers.reduce((total, ans, idx) => {
        return (ans === questions[idx].correct) ? total + 1 : total;
    }, 0);
    
    localStorage.setItem('orion_last_score', score);
    window.location.href = 'results.html';
}
