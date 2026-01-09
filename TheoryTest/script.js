let allQuestions = [];
let testQuestions = [];
let currentIndex = 0;
let score = 0;
let incorrectIDs = [];

// 1. Download the JSON file
async function loadTestData() {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        
        // Once downloaded, pick the 50 balanced questions
        prepareBalancedTest(50);
        
        // Show the first question
        displayQuestion();
    } catch (error) {
        document.getElementById('counter').innerText = "Error loading questions.json";
        console.error(error);
    }
}

// 2. The Logic: Equal questions per category
function prepareBalancedTest(totalLimit) {
    const categories = {};
    
    // Sort all questions into buckets by category
    allQuestions.forEach(q => {
        if (!categories[q.category]) categories[q.category] = [];
        categories[q.category].push(q);
    });

    const catNames = Object.keys(categories);
    const amountPerCat = Math.floor(totalLimit / catNames.length);
    
    testQuestions = [];

    // Pull equal amounts from each bucket
    catNames.forEach(name => {
        let shuffledCat = categories[name].sort(() => 0.5 - Math.random());
        testQuestions.push(...shuffledCat.slice(0, amountPerCat));
    });

    // If we are short a few due to rounding, grab random ones to hit totalLimit
    while (testQuestions.length < totalLimit) {
        let randomQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        if (!testQuestions.includes(randomQ)) testQuestions.push(randomQ);
    }

    // Final shuffle so categories are mixed up during the test
    testQuestions.sort(() => 0.5 - Math.random());
}

// 3. Put the question on the screen
function displayQuestion() {
    const q = testQuestions[currentIndex];
    
    // Update Counter
    document.getElementById('counter').innerText = `Question ${currentIndex + 1} of ${testQuestions.length}`;
    
    // Update Question Text
    document.getElementById('question-text').innerText = q.question;
    
    // Clear old buttons and create new ones for choices A, B, C, D
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    for (const [letter, text] of Object.entries(q.choices)) {
        const btn = document.createElement('button');
        btn.innerText = `${letter}: ${text}`;
        btn.className = "btn"; // Uses your style
        btn.onclick = () => handleSubmission(letter, q.correct, q.id);
        optionsDiv.appendChild(btn);
    }
}

// 4. Check answer and move forward
function handleSubmission(selectedLetter, correctLetter, questionID) {
    if (selectedLetter === correctLetter) {
        score++;
    } else {
        // Track the ID of the wrong answer as requested
        incorrectIDs.push(questionID);
    }
    
    currentIndex++;
    
    if (currentIndex < testQuestions.length) {
        displayQuestion();
    } else {
        finishTest();
    }
}

// 5. Final Screen
function finishTest() {
    document.getElementById('quiz-ui').style.display = 'none';
    document.getElementById('result-ui').style.display = 'block';
    
    document.getElementById('final-score').innerText = `You scored ${score} out of ${testQuestions.length}`;
    
    // Show the IDs of the ones that were wrong
    if (incorrectIDs.length > 0) {
        document.getElementById('wrong-ids').innerText = incorrectIDs.join(', ');
    } else {
        document.getElementById('wrong-ids').innerText = "None! Perfect score.";
    }
}

// Run the loader when the page opens
loadTestData();
