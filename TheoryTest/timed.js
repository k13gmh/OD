const JS_VERSION = "v2.3.8";

// ... [Existing initialization code] ...

function handleAnswer(selectedIndex) {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQuestion.correct;

    if (isCorrect) {
        handleCorrectAnswer(currentQuestion.id);
    } else {
        handleIncorrectAnswer(currentQuestion.id);
    }
    
    // ... [Existing answer processing code] ...
}

/**
 * Updates the Wall of Shame for incorrect answers [cite: 2026-01-11]
 */
function handleIncorrectAnswer(questionId) {
    let tally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    
    // Increase weight by 1 for every error [cite: 2026-01-11]
    if (tally[questionId]) {
        tally[questionId] += 1;
    } else {
        tally[questionId] = 1;
    }
    
    localStorage.setItem('orion_shame_tally', JSON.stringify(tally));
}

/**
 * Reduces weight for correct answers (Redemption logic) [cite: 2026-01-11]
 */
function handleCorrectAnswer(questionId) {
    let tally = JSON.parse(localStorage.getItem('orion_shame_tally') || '{}');
    
    if (tally[questionId]) {
        tally[questionId] -= 1;
        
        // Remove from wall if weight hits 0 [cite: 2026-01-11]
        if (tally[questionId] <= 0) {
            delete tally[questionId];
        }
        
        localStorage.setItem('orion_shame_tally', JSON.stringify(tally));
    }
}

// ... [Remainder of existing file] ...
