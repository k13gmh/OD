let allQuestions = [];
let testQuestions = [];
let currentIndex = 0;
let userAnswers = {}; // Stores what the user clicked

async function loadTestData() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error('File not found');
        allQuestions = await response.json();
        
        // Pick 50 questions (Equal distribution per category)
        prepareBalancedTest(50);
        
        // Start the display
        displayQuestion();
    } catch (err) {
        document.getElementById('question-text').innerText = "Failed to load questions.json. Make sure the file is in the theorytest folder.";
    }
}

function prepareBalancedTest(totalLimit) {
    const categories = {};
    allQuestions.forEach(q => {
        if (!categories[q.category]) categories[q.category] = [];
        categories[q.category].push(q);
    });

    const catNames = Object.keys(categories);
    const amountPerCat = Math.floor(totalLimit / catNames.length);
    testQuestions = [];

    catNames.forEach(name => {
        let shuffled = categories[name].sort(() => 0.5 - Math.random());
        testQuestions.push(...shuffled.slice(0, amountPerCat));
    });

    // Top up to 50 if needed
    while (testQuestions.length < totalLimit) {
        let rand = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        if (!testQuestions.includes(rand)) testQuestions.push(rand);
    }
    testQuestions.sort(() => 0.5 - Math.random());
}

function displayQuestion() {
    const q = testQuestions[currentIndex];
    
    // Fill the HTML elements
    document.getElementById('counter').innerText = `Question ${currentIndex + 1} of ${testQuestions.length}`;
    document.getElementById('category-display').innerText = q.category;
    document.getElementById('question-text').innerText = q.question;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    for (const [letter, text] of Object.entries(q.choices)) {
        const btn = document.createElement('button');
        btn.innerText = `${letter}: ${text}`;
        btn.className = "btn";
        
        // If user already answered this (going Back), highlight it blue
        if (userAnswers[currentIndex] === letter) {
            btn.style.background = "#e3f2fd";
            btn.style.borderColor = "#2196f3";
        }

        btn.onclick = () => {
            userAnswers[currentIndex] = letter; 
            displayQuestion(); // Refresh to show the selection
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
    let score = 0;
    let incorrectIDs = [];

    testQuestions.forEach((q, index) => {
        if (userAnswers[index] === q.correct) {
            score++;
        } else if (userAnswers[index] !== undefined) {
            incorrectIDs.push(q.id);
        }
    });

    document.getElementById('quiz-ui').classList.add('hidden');
    document.getElementById('result-ui').classList.remove('hidden');
    document.getElementById('final-score').innerText = `${score} / ${testQuestions.length}`;
    document.getElementById('wrong-ids').innerText = incorrectIDs.join(', ') || "None";
}

// Kickstart
loadTestData();
