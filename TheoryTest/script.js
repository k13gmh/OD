/* script.js - Ver 1.6.3 */
let questions = [];
let currentIndex = 0;
let userSelections = {}; 

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error("questions.json not found");
        questions = await response.json();
        currentIndex = 0;
        renderQuestion();
    } catch (e) {
        document.getElementById('q-text').innerText = "Error: questions.json not found.";
        console.error(e);
    }
}

function renderQuestion() {
    if (!questions || questions.length === 0) return;
    const q = questions[currentIndex];
    
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
            btn.innerHTML = `<strong>${letter}:</strong> ${q.choices[letter]}`;
            
            if (userSelections[q.id] === letter) {
                btn.classList.add('selected');
            }

            btn.onclick = () => selectAnswer(btn, letter, q.correct, q.id);
            area.appendChild(btn);
        }
    });

    document.getElementById('prev-btn').disabled = (currentIndex === 0);
    document.getElementById('next-btn').disabled = (currentIndex === questions.length - 1);
}

function selectAnswer(btn, chosenLetter, correctLetter, qId) {
    userSelections[qId] = chosenLetter;

    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => {
        b.disabled = true;
        b.classList.remove('selected');
    });

    if (chosenLetter === correctLetter) {
        btn.classList.add('correct');
    } else {
        btn.classList.add('incorrect');
        const allButtons = document.querySelectorAll('.option-btn');
        const letters = ["A", "B", "C", "D"];
        allButtons.forEach((b, i) => {
            if (letters[i] === correctLetter) b.classList.add('correct');
        });
    }
}

function changeQuestion(step) {
    currentIndex += step;
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= questions.length) currentIndex = questions.length - 1;
    renderQuestion();
    window.scrollTo(0, 0);
}

function finishTest() {
    console.log("Saving Selections:", userSelections);
    localStorage.setItem('last_test_results', JSON.stringify(userSelections));
    window.location.href = 'mainmenu.html';
}

window.onload = loadQuestions;
