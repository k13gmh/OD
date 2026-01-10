/* script.js - Ver 1.6.6 - Orion Drive Engine */
let allQuestions = [];
let sessionQuestions = [];
let currentIndex = 0;

let testData = {
    selections: {}, // { questionId: "A" }
    flagged: [],    // Array of questionIds
    seenIndices: [] // Array of indices
};

async function init() {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        
        const savedSession = localStorage.getItem('orion_current_session');
        if (savedSession) {
            document.getElementById('resume-modal').style.display = 'flex';
        } else {
            startNewTest();
        }
    } catch (e) {
        document.getElementById('q-text').innerText = "Error loading database.";
    }
}

function startNewTest() {
    // Balanced Randomizer (dvsa style)
    const categories = [...new Set(allQuestions.map(q => q.category))];
    sessionQuestions = [];
    categories.forEach(cat => {
        let pool = allQuestions.filter(q => q.category === cat).sort(() => 0.5 - Math.random());
        sessionQuestions.push(...pool.slice(0, 5)); // 5 per category
    });
    sessionQuestions.sort(() => 0.5 - Math.random());
    
    testData = { selections: {}, flagged: [], seenIndices: [] };
    renderQuestion();
}

function resumeTest(shouldResume) {
    document.getElementById('resume-modal').style.display = 'none';
    if (shouldResume) {
        const saved = JSON.parse(localStorage.getItem('orion_current_session'));
        sessionQuestions = saved.questions;
        testData = saved.data;
        currentIndex = saved.index;
    } else {
        startNewTest();
    }
    renderQuestion();
}

function renderQuestion() {
    const q = sessionQuestions[currentIndex];
    if (!testData.seenIndices.includes(currentIndex)) testData.seenIndices.push(currentIndex);

    document.getElementById('q-number').innerText = `Question ${currentIndex + 1} of ${sessionQuestions.length}`;
    document.getElementById('q-category').innerText = q.category;
    document.getElementById('q-text').innerText = q.question;
    
    const area = document.getElementById('options-area');
    area.innerHTML = "";

    ["A", "B", "C", "D"].forEach(letter => {
        if (q.choices[letter]) {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            if (testData.selections[q.id] === letter) btn.classList.add('selected');
            btn.innerHTML = `<strong>${letter}:</strong> ${q.choices[letter]}`;
            btn.onclick = () => { testData.selections[q.id] = letter; saveProgress(); renderQuestion(); };
            area.appendChild(btn);
        }
    });

    const flagBtn = document.getElementById('flag-btn');
    flagBtn.style.background = testData.flagged.includes(q.id) ? "#f1c40f" : "#bdc3c7";
}

function toggleFlag() {
    const id = sessionQuestions[currentIndex].id;
    const idx = testData.flagged.indexOf(id);
    (idx > -1) ? testData.flagged.splice(idx, 1) : testData.flagged.push(id);
    saveProgress();
    renderQuestion();
}

function changeQuestion(step) {
    let nextIdx = currentIndex + step;
    if (nextIdx >= 0 && nextIdx < sessionQuestions.length) {
        currentIndex = nextIdx;
        saveProgress();
        renderQuestion();
        window.scrollTo(0, 0);
    }
}

function saveProgress() {
    const session = {
        questions: sessionQuestions,
        data: testData,
        index: currentIndex
    };
    localStorage.setItem('orion_current_session', JSON.stringify(session));
}

function finishTest() {
    // Final save of data for the results app to read
    localStorage.setItem('orion_final_results', JSON.stringify({
        timestamp: new Date().getTime(),
        questions: sessionQuestions,
        data: testData
    }));
    // Remove temporary session after finish
    localStorage.removeItem('orion_current_session');
    window.location.href = 'mainmenu.html';
}

window.onload = init;
