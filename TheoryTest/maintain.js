/**
 * File: maintain.js
 * Version: v2.2.8
 */

const JS_VERSION = "v2.2.8";
const HTML_VERSION = "v2.2.8";

let allQuestions = [];
let currentEditingIndex = -1;

async function init() {
    const vTag = document.getElementById('version-tag');
    if (vTag) vTag.innerText = `HTML: ${HTML_VERSION} | JS: ${JS_VERSION}`;

    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        console.log("Database loaded:", allQuestions.length);
    } catch (e) {
        alert("Could not load questions.json. Ensure it is in the same folder.");
    }
}

function loadQuestionById() {
    const searchId = document.getElementById('search-id').value.trim();
    const idx = allQuestions.findIndex(q => q.id == searchId);

    if (idx > -1) {
        currentEditingIndex = idx;
        const q = allQuestions[idx];
        
        // Populate fields
        document.getElementById('edit-q-text').value = q.question;
        document.getElementById('edit-a').value = q.choices.A;
        document.getElementById('edit-b').value = q.choices.B;
        document.getElementById('edit-c').value = q.choices.C;
        document.getElementById('edit-d').value = q.choices.D;
        document.getElementById('edit-correct').value = q.correct;
        document.getElementById('edit-explanation').value = q.explanation;
        document.getElementById('q-id-display').innerText = `ID: ${q.id}`;

        // Image display (matching untimed.js logic)
        const imgPre = document.getElementById('q-image-preview');
        imgPre.src = `images/${q.id}.jpeg`;

        document.getElementById('edit-form').style.display = 'block';
    } else {
        alert("ID not found in questions.json");
    }
}

function saveChanges() {
    if (currentEditingIndex === -1) return;

    allQuestions[currentEditingIndex].question = document.getElementById('edit-q-text').value;
    allQuestions[currentEditingIndex].choices.A = document.getElementById('edit-a').value;
    allQuestions[currentEditingIndex].choices.B = document.getElementById('edit-b').value;
    allQuestions[currentEditingIndex].choices.C = document.getElementById('edit-c').value;
    allQuestions[currentEditingIndex].choices.D = document.getElementById('edit-d').value;
    allQuestions[currentEditingIndex].correct = document.getElementById('edit-correct').value.toUpperCase();
    allQuestions[currentEditingIndex].explanation = document.getElementById('edit-explanation').value;

    alert("Changes saved to local session memory. Use 'COPY FULL JSON' to save to your file.");
}

function copySingleJSON() {
    if (currentEditingIndex === -1) return;
    const jsonStr = JSON.stringify(allQuestions[currentEditingIndex], null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => alert("Single question JSON copied!"));
}

function copyFullJSON() {
    const jsonStr = JSON.stringify(allQuestions, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => alert("Full questions.json copied to clipboard!"));
}

window.onload = init;
