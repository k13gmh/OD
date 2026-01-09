let allQuestions = [];
let testQuestions = [];
let currentIndex = 0;
let score = 0;
let incorrectIDs = [];
let userAnswers = {}; 

async function loadTestData() {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        prepareBalancedTest(50);
        displayQuestion();
    } catch (error) {
        document.getElementById('question-text').innerText = "Error: questions.json not found.";
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
        let shuffledCat = categories[name].sort(() => 0.5 - Math.random());
        testQuestions.push(...shuffledCat.slice(0, amountPerCat));
    });

    while (testQuestions.length < totalLimit) {
        let randomQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        if (!testQuestions.includes(randomQ)) testQuestions.push(randomQ);
    }
    testQuestions.sort(() => 0.5 - Math.random());
}

function displayQuestion() {
    const q = testQuestions[currentIndex];
    
    // Fill the slots we made in the HTML
    document.getElementById('category-display').innerText = q.category;
    document.getElementById('counter').innerText = `Question ${currentIndex + 1} of ${testQuestions.length}`;
    document.getElementById('question-text').innerText = q.question;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    for (const [letter, text] of Object.entries(q.choices)) {
        const btn = document.createElement('button');
        btn.innerText = `${letter}: ${text}`;
        btn.className = "btn";
        
        // This keeps the blue highlight if you go "Back"
        if (userAnswers[currentIndex] === letter) {
            btn.style.background = "#e3f2fd";
            btn.style.borderColor = "#2196F3";
        }

        btn.onclick = () => {
            userAnswers[currentIndex] = letter;
            displayQuestion(); 
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
    score = 0;
    incorrectIDs = [];
    testQuestions.forEach((q, index) => {
        if (userAnswers[index] === q.correct) {
            score++;
        } else if (userAnswers[index] !== undefined) {
            incorrectIDs.push(q.id);
        }
    });
    document.getElementById('quiz-ui').style.display = 'none';
    document.getElementById('result-ui').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Score: ${score} / ${testQuestions.length}`;
    document.getElementById('wrong-ids').innerText = incorrectIDs.join(', ') || "None";
}

// THIS LINE IS THE KEY - It turns the engine on!
loadTestData();
