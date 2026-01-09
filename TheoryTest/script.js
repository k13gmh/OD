let allQuestions = [];
let testQuestions = [];
let currentIndex = 0;
let userAnswers = {}; 
let isReviewingSkipped = false;

// 1. DOWNLOAD THE DATA
async function loadTestData() {
    const questionText = document.getElementById('question-text');
    try {
        // We use a relative path './questions.json' to look in the current folder
        const response = await fetch('./questions.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allQuestions = await response.json();
        console.log("JSON loaded successfully:", allQuestions.length, "questions found.");
        
        // Setup the 50 balanced questions
        prepareBalancedTest(50);
        
        // Show the first question
        displayQuestion();
    } catch (err) {
        console.error("Fetch error:", err);
        questionText.innerHTML = `<span style="color:red;">Error: Cannot find questions.json.<br>
        Check that the file is named exactly <b>questions.json</b> and is in the <b>TheoryTest</b> folder.</span>`;
    }
}

// 2. CATEGORY BALANCING LOGIC
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
        let shuffled = [...categories[name]].sort(() => 0.5 - Math.random());
        testQuestions.push(...shuffled.slice(0, amountPerCat));
    });

    while (testQuestions.length < totalLimit) {
        let rand = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        if (!testQuestions.includes(rand)) testQuestions.push(rand);
    }
    testQuestions.sort(() => 0.5 - Math.random());
}

// 3. DISPLAY LOGIC
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

// 4. NAVIGATION
function goNext() {
    if (isReviewingSkipped) {
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

// 5. FINISH & SCROLLABLE REVIEW
function finishTest() {
    let score = 0;
    let incorrectIDs = [];
    let hallOfShame = JSON.parse(localStorage.getItem('hallOfShame')) || [];
    
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = ''; 

    testQuestions.forEach((q, index) => {
        const userChoice = userAnswers[index];
        const isCorrect = userChoice === q.correct;

        if (isCorrect) {
            score++;
        } else if (userChoice) { 
            incorrectIDs.push(q.id);
            if (!hallOfShame.includes(q.id)) hallOfShame.push(q.id);
        }

        const item = document.createElement('div');
        item.className = "review-item";
        let statusText = userChoice ? (isCorrect ? "✅ Correct" : "❌ Incorrect") : "⚪ Skipped";
        
        item.innerHTML = `
            <div style="font-weight:bold; margin-bottom:5px;">Q${index + 1}: ${q.question}</div>
            <div style="font-size:0.9em; margin-bottom:5px;">
                <strong>Correct Answer:</strong> ${q.correct} - ${q.choices[q.correct]} <br>
                <span style="color: ${isCorrect ? 'green' : 'red'}"><strong>Your Choice:</strong> ${userChoice ? userChoice : 'No answer'} (${statusText})</span>
            </div>
            <div class="explanation-box">
                <strong>Explanation:</strong> ${q.explanation}
            </div>
        `;
        reviewList.appendChild(item);
    });

    localStorage.setItem('hallOfShame', JSON.stringify(hallOfShame));

    let percent = Math.round((score / testQuestions.length) * 100);
    let passed = percent >= 86;

    document.getElementById('review-menu').classList.add('hidden');
    document.getElementById('result-ui').classList.remove('hidden');
    
    document.getElementById('pass-fail-text').innerText = passed ? "🎉 Test Passed!" : "❌ Test Failed";
    document.getElementById('pass-fail-text').style.color = passed ? "green" : "red";
    document.getElementById('final-score').innerText = `${score} / ${testQuestions.length}`;
    document.getElementById('percentage-text').innerText = `${percent}% (Pass mark: 86%)`;
    document.getElementById('wrong-ids').innerText = incorrectIDs.join(', ') || "None";
    
    // Smooth scroll to top of results
    window.scrollTo(0, 0);
}

// Start the app
loadTestData();
