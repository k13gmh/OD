let allQuestions = [];
let testQuestions = [];
let currentIndex = 0;
let userAnswers = {}; 
let isReviewingSkipped = false;

async function loadTestData() {
    const questionText = document.getElementById('question-text');
    try {
        const response = await fetch('./questions.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        allQuestions = await response.json();
        prepareBalancedTest(50);
        displayQuestion();
    } catch (err) {
        questionText.innerHTML = `<span style="color:red;">Error: Cannot find questions.json in the TheoryTest folder.</span>`;
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
        let shuffled = [...categories[name]].sort(() => 0.5 - Math.random());
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

function finishTest() {
    let score = 0;
    let incorrectIDs = [];
    let hallOfShame = JSON.parse(localStorage.getItem('hallOfShame')) || [];
    const reviewList = document.getElementById('review-list');
    reviewList.innerHTML = ''; 

    testQuestions.forEach((q, index) => {
        const userChoice = userAnswers[index];
        const isCorrect = userChoice === q.correct;
        if (isCorrect) score++;
        else if (userChoice) {
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
            <div class="explanation-box"><strong>Explanation:</strong> ${q.explanation}</div>
        `;
        reviewList.appendChild(item);
    });

    localStorage.setItem('hallOfShame', JSON.stringify(hallOfShame));
    let percent = Math.round((score / testQuestions.length) * 100);
    document.getElementById('review-menu').classList.add('hidden');
    document.getElementById('result-ui').classList.remove('hidden');
    document.getElementById('pass-fail-text').innerText = percent >= 86 ? "🎉 Test Passed!" : "❌ Test Failed";
    document.getElementById('pass-fail-text').style.color = percent >= 86 ? "green" : "red";
    document.getElementById('final-score').innerText = `${score} / ${testQuestions.length}`;
    document.getElementById('percentage-text').innerText = `${percent}% (Pass mark: 86%)`;
    document.getElementById('wrong-ids').innerText = incorrectIDs.join(', ') || "None";
    window.scrollTo(0, 0);
}

loadTestData();
