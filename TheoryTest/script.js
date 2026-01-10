/* script.js - Ver 1.6.4 */
let questions = [];
let currentIndex = 0;

// Tracking Object
let testData = {
    selections: {}, // { qId: "A" }
    flagged: new Set(), // Set of qIds
    seenIndices: new Set() // Track which questions were viewed
};

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error("questions.json not found");
        questions = await response.json();
        renderQuestion();
    } catch (e) {
        document.getElementById('q-text').innerText = "Error: questions.json not found.";
    }
}

function renderQuestion() {
    if (!questions.length) return;
    const q = questions[currentIndex];
    testData.seenIndices.add(currentIndex); // Mark as seen
    
    document.getElementById('q-number').innerText = `Question ${currentIndex + 1} of ${questions.length}`;
    document.getElementById('q-category').innerText = q.category || "";
    document.getElementById('q-text').innerText = q.question;
    
    const area = document.getElementById('options-area');
    area.innerHTML = ""; 
    
    const letters = ["A", "B", "C", "D"];
    letters.forEach(letter => {
        if (q.choices[letter]) {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            if (testData.selections[q.id] === letter) btn.classList.add('selected');
            
            btn.innerHTML = `<strong>${letter}:</strong> ${q.choices[letter]}`;
            btn.onclick = () => selectAnswer(letter, q.id);
            area.appendChild(btn);
        }
    });

    // Update Flag button visual state
    const flagBtn = document.getElementById('flag-btn');
    if (testData.flagged.has(q.id)) {
        flagBtn.classList.add('is-flagged');
        flagBtn.innerText = "Flagged";
    } else {
        flagBtn.classList.remove('is-flagged');
        flagBtn.innerText = "Flag";
    }

    document.getElementById('prev-btn').disabled = (currentIndex === 0);
    document.getElementById('next-btn').disabled = (currentIndex === questions.length - 1);
}

function selectAnswer(letter, qId) {
    testData.selections[qId] = letter; // Save selection silently
    renderQuestion(); // Refresh UI to show "selected" state
}

function toggleFlag() {
    const qId = questions[currentIndex].id;
    if (testData.flagged.has(qId)) {
        testData.flagged.delete(qId);
    } else {
        testData.flagged.add(qId);
    }
    renderQuestion();
}

function changeQuestion(step) {
    currentIndex += step;
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= questions.length) currentIndex = questions.length - 1;
    renderQuestion();
    window.scrollTo(0, 0);
}

function finishTest() {
    // Calculate stats based only on seen questions
    let totalSeen = testData.seenIndices.size;
    let correctCount = 0;
    let skippedCount = 0;
    let flaggedCount = testData.flagged.size;

    testData.seenIndices.forEach(idx => {
        const q = questions[idx];
        const userChoice = testData.selections[q.id];
        if (!userChoice) {
            skippedCount++;
        } else if (userChoice === q.correct) {
            correctCount++;
        }
    });

    const percentage = totalSeen > 0 ? Math.round((correctCount / totalSeen) * 100) : 0;
    const pass = percentage >= 86; // Standard DVSA is roughly 86%

    const summary = {
        totalSeen,
        correctCount,
        skippedCount,
        flaggedCount,
        percentage,
        pass,
        timestamp: new Date().toLocaleString()
    };

    // Store results for the summary page
    localStorage.setItem('theory_test_summary', JSON.stringify(summary));
    alert(`Test Finished!\nScore: ${percentage}%\nSeen: ${totalSeen}\nCorrect: ${correctCount}`);
    window.location.href = 'mainmenu.html';
}

window.onload = loadQuestions;
