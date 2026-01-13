/* Orion Drive - Theory Engine
   Version: 1.9.0
*/

const APP_VERSION = "1.9.0"; 

/* --- 1. ENFORCED GATEKEEPER --- */
// This ensures the file only runs if called from Main Menu
const launchToken = localStorage.getItem('orion_launch_token');
if (!launchToken) {
    // No token? Boot back to menu
    window.location.href = 'mainmenu.html';
} else {
    // Token found! Delete it immediately so it can't be reused or bookmarked
    localStorage.removeItem('orion_launch_token');
}

/* --- 2. GLOBAL VARIABLES --- */
let allQuestions = [];
let sessionQuestions = [];
let currentIndex = 0;
let originalSessionQuestions = []; 
let isSubsetReview = false; 

let testData = {
    selections: {},
    flagged: [],
    seenIndices: []
};

/* --- 3. INITIALIZATION --- */
async function init() {
    try {
        const response = await fetch('questions.json');
        const rawData = await response.json();
        
        // Support both simple arrays and metadata-wrapped JSON
        allQuestions = rawData.questions || rawData;
        const jsonVersion = rawData.metadata ? rawData.metadata.version : "Unknown";

        checkVersion(jsonVersion);

        const saved = localStorage.getItem('orion_current_session');
        if (saved) {
            document.getElementById('resume-modal').style.display = 'flex';
        } else {
            startFreshSession();
        }
    } catch (e) {
        console.error("Failed to load questions", e);
        alert("Error loading question database.");
    }
}

function checkVersion(jsonVersion) {
    const tag = document.querySelector('.v-tag');
    if (tag) {
        if (jsonVersion !== APP_VERSION) {
            tag.style.color = "#d9534f"; // Red for mismatch
            tag.innerText = `v${APP_VERSION} (JSON: v${jsonVersion})`;
        } else {
            tag.innerText = `v${APP_VERSION}`;
        }
    }
}

/* --- 4. SESSION MANAGEMENT --- */
function startFreshSession() {
    // Shuffle and pick 50 random questions
    sessionQuestions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 50);
    originalSessionQuestions = [...sessionQuestions];
    currentIndex = 0;
    isSubsetReview = false;
    testData = { selections: {}, flagged: [], seenIndices: [0] };
    renderQuestion();
}

function resumeTest(shouldResume) {
    document.getElementById('resume-modal').style.display = 'none';
    if (shouldResume) {
        const saved = JSON.parse(localStorage.getItem('orion_current_session'));
        sessionQuestions = saved.questions;
        originalSessionQuestions = [...sessionQuestions];
        testData = saved.data;
        currentIndex = saved.currentIndex || 0;
        isSubsetReview = false;
        renderQuestion();
    } else {
        startFreshSession();
    }
}

/* --- 5. CORE RENDERING --- */
function renderQuestion() {
    const q = sessionQuestions[currentIndex];
    
    // IMAGE SYSTEM
    // Automatically looks for images/ID.jpg
    const imgContainer = document.getElementById('image-container');
    const qImg = document.getElementById('q-image');
    if (imgContainer && qImg) {
        qImg.src = `images/${q.id}.jpg`;
        qImg.onload = () => imgContainer.style.display = 'block';
        qImg.onerror = () => imgContainer.style.display = 'none';
    }

    // Update Header
    document.getElementById('q-number').innerText = `Question ${currentIndex + 1} of ${sessionQuestions.length}`;
    document.getElementById('q-category').innerText = q.category;
    document.getElementById('q-text').innerText = q.question;
    
    // Render Options
    const optionsArea = document.getElementById('options-area');
    optionsArea.innerHTML = '';
    
    ["A", "B", "C", "D"].forEach(letter => {
        if (!q.choices[letter]) return;
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (testData.selections[q.id] === letter) btn.classList.add('selected');
        btn.innerText = `${letter}: ${q.choices[letter]}`;
        btn.onclick = () => selectOption(q.id, letter);
        optionsArea.appendChild(btn);
    });

    // Update Flag Button Color
    const flagBtn = document.getElementById('flag-btn');
    flagBtn.style.background = testData.flagged.includes(q.id) ? "#f1c40f" : "#bdc3c7";
    flagBtn.style.color = testData.flagged.includes(q.id) ? "#fff" : "#444";
    
    // Toggle Finish Button Text
    const finishBtn = document.getElementById('finish-btn');
    finishBtn.innerText = isSubsetReview ? "EXIT REVIEW" : "FINISH";

    saveProgress();
}

/* --- 6. USER ACTIONS --- */
function selectOption(qId, letter) {
    testData.selections[qId] = letter;
    renderQuestion();
}

function toggleFlag() {
    const qId = sessionQuestions[currentIndex].id;
    if (testData.flagged.includes(qId)) {
        testData.flagged = testData.flagged.filter(id => id !== qId);
    } else {
        testData.flagged.push(qId);
    }
    renderQuestion();
}

function changeQuestion(step) {
    const newIndex = currentIndex + step;
    if (newIndex >= 0 && newIndex < sessionQuestions.length) {
        currentIndex = newIndex;
        if (!testData.seenIndices.includes(currentIndex)) {
            testData.seenIndices.push(currentIndex);
        }
        renderQuestion();
    }
}

/* --- 7. SUMMARY & RESULTS --- */
function showSummary() {
    // If we were reviewing a subset, revert to the full list for the final score
    sessionQuestions = [...originalSessionQuestions];
    isSubsetReview = false;

    document.getElementById('test-ui').style.display = 'none';
    document.getElementById('summary-ui').style.display = 'block';

    let score = 0;
    sessionQuestions.forEach(q => {
        if (testData.selections[q.id] === q.correct) score++;
    });

    const total = sessionQuestions.length;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= 86;

    // Update Score UI
    document.getElementById('res-icon').innerHTML = passed ? "✔️" : "❌";
    document.getElementById('res-icon').className = `status-icon ${passed ? 'pass' : 'fail'}`;
    document.getElementById('res-status').innerText = passed ? "Passed" : "Failed";
    document.getElementById('res-status').className = `status-text ${passed ? 'pass' : 'fail'}`;
    document.getElementById('res-score').innerText = `${score} / ${total}`;
    document.getElementById('res-percent').innerText = `${percent}% (Pass: 86%)`;

    // Manage Review Buttons (Flagged/Skipped)
    const flaggedCount = testData.flagged.length;
    const skippedCount = total - Object.keys(testData.selections).length;

    const fBtn = document.getElementById('review-flagged-btn');
    fBtn.style.display = flaggedCount > 0 ? "block" : "none";
    fBtn.innerText = `Flagged (${flaggedCount})`;

    const sBtn = document.getElementById('review-skipped-btn');
    sBtn.style.display = skippedCount > 0 ? "block" : "none";
    sBtn.innerText = `Skipped (${skippedCount})`;

    // Save final state for detailed review page
    localStorage.setItem('orion_final_results', JSON.stringify({
        score, total, questions: originalSessionQuestions, data: testData
    }));
}

function reviewSubset(type) {
    let subset = [];
    if (type === 'flagged') {
        subset = originalSessionQuestions.filter(q => testData.flagged.includes(q.id));
    } else {
        subset = originalSessionQuestions.filter(q => !testData.selections[q.id]);
    }

    if (subset.length === 0) return;

    sessionQuestions = subset;
    currentIndex = 0;
    isSubsetReview = true;

    document.getElementById('summary-ui').style.display = 'none';
    document.getElementById('test-ui').style.display = 'block';
    renderQuestion();
}

/* --- 8. STORAGE --- */
function saveProgress() {
    localStorage.setItem('orion_current_session', JSON.stringify({
        questions: originalSessionQuestions,
        data: testData,
        currentIndex: isSubsetReview ? 0 : currentIndex 
    }));
}

function restartTest() {
    localStorage.removeItem('orion_current_session');
    window.location.href = 'mainmenu.html';
}

function continueLater() {
    saveProgress();
    window.location.href = 'mainmenu.html';
}

function reviewAnswers() {
    window.location.href = 'review.html';
}

// Start Engine
init();
