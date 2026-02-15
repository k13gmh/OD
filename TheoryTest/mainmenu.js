/**
 * Driving Theory App - Main Menu Logic
 * Version: 2.8.8
 */

const JS_VERSION = "2.8.8";
const API_URL = "https://raw.githubusercontent.com/Gary-The-Driver/TheoryData/main/questions.json";
const SIGNS_URL = "https://raw.githubusercontent.com/Gary-The-Driver/TheoryData/main/signs.json";

document.addEventListener('DOMContentLoaded', () => {
    updateDebug();
    checkSyncStatus();
});

function updateDebug() {
    const qCount = JSON.parse(localStorage.getItem('questions') || '[]').length;
    const sCount = JSON.parse(localStorage.getItem('road_signs') || '[]').length;
    document.getElementById('debug-info').innerText = `Questions: ${qCount} | Signs: ${sCount}`;
    
    if (qCount > 0) {
        const bar = document.getElementById('status-bar');
        bar.innerText = "System Online";
        bar.className = "status-online";
    }
}

function checkSyncStatus() {
    const questions = localStorage.getItem('questions');
    if (!questions) {
        showSyncModal();
    }
}

function showSyncModal() {
    const modal = document.getElementById('sync-modal');
    const btnLater = document.getElementById('btn-later');
    const btnDownload = document.getElementById('btn-download');
    
    modal.style.display = 'flex';

    btnLater.onclick = () => startSync(false); // Quick sync (Text only)
    btnDownload.onclick = () => startSync(true); // Full sync (Images)
}

async function startSync(doSigns) {
    const btnContainer = document.getElementById('modal-buttons');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('sync-status');
    const titleText = document.getElementById('sync-title');

    btnContainer.style.display = 'none';
    progressContainer.style.display = 'block';
    titleText.innerText = doSigns ? "Downloading All Data..." : "Quick Sync...";

    try {
        // 1. Fetch Questions
        statusText.innerText = "Fetching Questions...";
        const qResponse = await fetch(API_URL);
        const qData = await qResponse.json();
        localStorage.setItem('questions', JSON.stringify(qData));
        progressBar.style.width = "50%";

        // 2. Fetch Signs if requested
        if (doSigns) {
            statusText.innerText = "Fetching Road Signs...";
            const sResponse = await fetch(SIGNS_URL);
            const sData = await sResponse.json();
            localStorage.setItem('road_signs', JSON.stringify(sData));
            progressBar.style.width = "100%";
        } else {
            // If later is clicked, ensure signs is at least an empty array
            localStorage.setItem('road_signs', '[]');
            progressBar.style.width = "100%";
        }

        statusText.innerText = "Sync Complete!";
        setTimeout(() => {
            document.getElementById('sync-modal').style.display = 'none';
            updateDebug();
        }, 1000);

    } catch (error) {
        statusText.innerText = "Error: Check connection.";
        btnContainer.style.display = 'flex';
        console.error("Sync Error:", error);
    }
}
