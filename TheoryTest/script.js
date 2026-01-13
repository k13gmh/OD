// VERSION CONTROL
const SCRIPT_VERSION = "v1.8.2";

/**
 * Orion Drive - Core Logic
 * Handles database loading, session validation, and test flow.
 */

// 1. Session Handshake Check
if (!sessionStorage.getItem('orion_session_token')) {
    console.log("Security Handshake Failed. Redirecting to Menu...");
    window.location.href = 'mainmenu.html';
}

// 2. Version Display
function applyVersion() {
    const display = document.getElementById('version-display');
    if (display) {
        display.innerText = SCRIPT_VERSION;
    }
}

// 3. Database Initialization
async function loadQuestions(fileName = 'questions.json') {
    try {
        const response = await fetch(fileName);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log("Database Loaded Successfully");
        return data;
    } catch (error) {
        console.error("Database Load Failed:", error);
        // This triggers the modal in your HTML
        const modal = document.getElementById('errorModal');
        if (modal) modal.style.display = 'block';
        return [];
    }
}

// Ensure version is shown when script loads
window.addEventListener('DOMContentLoaded', applyVersion);
