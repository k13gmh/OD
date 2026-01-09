function finishTest() {
    let score = 0;
    let incorrectIDs = [];
    let hallOfShame = JSON.parse(localStorage.getItem('hallOfShame')) || [];
    
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = ''; // Clear any old reviews

    testQuestions.forEach((q, index) => {
        const userChoice = userAnswers[index];
        const isCorrect = userChoice === q.correct;

        if (isCorrect) {
            score++;
        } else {
            // If they answered wrong (not skipped), add to Hall of Shame
            if (userChoice) {
                incorrectIDs.push(q.id);
                if (!hallOfShame.includes(q.id)) hallOfShame.push(q.id);
            }
        }

        // BUILD THE SCROLLABLE REVIEW ITEM
        const item = document.createElement('div');
        item.style.marginBottom = "25px";
        item.style.padding = "10px";
        item.style.borderBottom = "1px solid #eee";

        // Logic to show if they got it Right, Wrong, or Skipped
        let statusText = userChoice ? (isCorrect ? "✅ Correct" : "❌ Incorrect") : "⚪ Skipped";
        
        item.innerHTML = `
            <div style="font-weight:bold; margin-bottom:5px;">Q${index + 1}: ${q.question}</div>
            <div style="font-size:0.9em; margin-bottom:5px;">
                <strong>Correct Answer:</strong> ${q.correct} - ${q.choices[q.correct]} <br>
                <span style="color: ${isCorrect ? 'green' : 'red'}"><strong>Your Choice:</strong> ${userChoice ? userChoice : 'No answer'} (${statusText})</span>
            </div>
            <div style="background: #eef7ff; padding: 10px; border-radius: 5px; font-size: 0.85em; font-style: italic;">
                <strong>Explanation:</strong> ${q.explanation}
            </div>
        `;
        reviewList.appendChild(item);
    });

    // Save to Hall of Shame
    localStorage.setItem('hallOfShame', JSON.stringify(hallOfShame));

    // Calculate results
    let percent = Math.round((score / testQuestions.length) * 100);
    let passed = percent >= 86;

    document.getElementById('review-menu').classList.add('hidden');
    document.getElementById('result-ui').classList.remove('hidden');
    
    document.getElementById('pass-fail-text').innerText = passed ? "🎉 Test Passed!" : "❌ Test Failed";
    document.getElementById('pass-fail-text').style.color = passed ? "green" : "red";
    document.getElementById('final-score').innerText = `${score} / ${testQuestions.length}`;
    document.getElementById('percentage-text').innerText = `${percent}% (Pass mark: 86%)`;
    document.getElementById('wrong-ids').innerText = incorrectIDs.join(', ') || "None";
}
