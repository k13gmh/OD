let allQuestions = [];
let testQuestions = [];
let currentIndex = 0;
let userAnswers = {}; 
let isReviewingSkipped = false;

async function loadTestData() {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        prepareBalancedTest(50);
        displayQuestion();
    } catch (err) {
        document.getElementById('question-text').innerText = "Error loading JSON.";
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
    while (testQuestions.length < totalLimit) {
        let rand = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        if (!testQuestions.includes(rand)) testQuestions.push(rand);
    }
    testQuestions.sort(() => 0.5 - Math.random());
}

function displayQuestion() {
    const q = testQuestions[currentIndex];
    document.getElementById('counter').innerText = `Question ${currentIndex + 1} of ${testQuestions.length}`;
    document.getElementById('category-display').innerText = q.category;
    document.getElementById('question-text').innerText = q.question;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    for (const [letter, text] of Object.entries(q.choices)) {
        const btn = document.createElement('button');
        btn.innerText = `${letter}: ${text}`;
        btn.className = "btn";
        if (userAnswers[currentIndex] === letter) {
            btn.style.background = "#e3f2fd";
            btn.style.borderColor = "#2196f3";
        }
        btn.onclick = () => {
            userAnswers[currentIndex] = letter; 
            displayQuestion(); 
        };
        optionsDiv.appendChild(btn);
    }
}

function goNext() {
    if (isReviewingSkipped) {
        // Find next skipped question
        let nextIndex = -1;
        for (let i = currentIndex + 1; i < testQuestions.length; i++) {
            if (!userAnswers[i]) { nextIndex = i; break; }
        }
        if (nextIndex !== -1) {
            currentIndex = nextIndex;
            displayQuestion();
        } else {
            showReviewMenu();
        }
    } else {
        if (currentIndex < testQuestions.length - 1) {
            currentIndex++;
            displayQuestion();
        } else {
            showReviewMenu();
        }
    }
}

function goBack() {
    if (currentIndex > 0) {
        currentIndex--;
        displayQuestion();
    }
}

function goSkip() {
    // Explicitly mark as skipped by doing nothing to userAnswers
    goNext();
}

function showReviewMenu() {
    document.getElementById('quiz-ui').classList.add('hidden');
    document.getElementById('review-menu').classList.remove('hidden');
}

function hideReviewMenu() {
    isReviewingSkipped = false;
    currentIndex = 0;
    document.getElementById('review-menu').classList.add('hidden');
    document.getElementById('quiz-ui').classList.remove('hidden');
    displayQuestion();
}

function reviewSkipped() {
    isReviewingSkipped = true;
    let firstSkipped = -1;
    for (let i = 0; i < testQuestions.length; i++) {
        if (!userAnswers[i]) { firstSkipped = i; break; }
    }
    if (firstSkipped !== -1) {
        currentIndex = firstSkipped;
        document.getElementById('review-menu').classList.add('hidden');
        document.getElementById('quiz-ui').classList.remove('hidden');
        displayQuestion();
    } else {
        alert("No skipped questions found!");
    }
}

function finishTest() {
    let score = 0;
    let incorrectIDs = [];
    let hallOfShame = JSON.parse(localStorage.getItem('hallOfShame')) || [];

    testQuestions.forEach((q, index) => {
        if (userAnswers[index] === q.correct) {
            score++;
        } else if (userAnswers[index]) { // Answered but wrong
            incorrectIDs.push(q.id);
            if (!hallOfShame.includes(q.id)) hallOfShame.push(q.id);
        }
    });

    // Save to Hall of Shame on device
    localStorage.setItem('hallOfShame', JSON.stringify(hallOfShame));

    let percent = Math.round((score / testQuestions.length) * 100);
    let passed = percent >= 86; // DVSA pass mark is roughly 86% (43/50)

    document.getElementById('review-menu').classList.add('hidden');
    document.getElementById('result-ui').classList.remove('hidden');
    
    document.getElementById('pass-fail-text').innerText = passed ? "🎉 Test Passed!" : "❌ Test Failed";
    document.getElementById('pass-fail-text').style.color = passed ? "green" : "red";
    document.getElementById('final-score').innerText = `${score} / ${testQuestions.length}`;
    document.getElementById('percentage-text').innerText = `${percent}% (Pass mark: 86%)`;
    document.getElementById('wrong-ids').innerText = incorrectIDs.join(', ') || "None";
}

loadTestData();
