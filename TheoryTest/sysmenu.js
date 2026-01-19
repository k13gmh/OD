/**
 * File: sysmenu.js
 * Version: v1.0.1
 * Feature: Dual-load menu for Admin and User options
 */

const SCRIPT_VERSION = "v1.0.1";

async function init() {
    // 1. Security Check: Local Storage Only [cite: 2026-01-11, 2026-01-17]
    if (!localStorage.getItem('orion_session_token')) {
        window.location.href = 'mainmenu.html';
        return;
    }

    // 2. Load User Test Options
    await loadMenuSection('options.json', 'test-options', 'btn');

    // 3. Load Admin Options
    await loadMenuSection('sysmenu.json', 'admin-options', 'btn btn-admin');
}

/**
 * Fetches JSON data and builds buttons for a specific container
 */
async function loadMenuSection(jsonFile, containerId, buttonClass) {
    const container = document.getElementById(containerId);
    try {
        const response = await fetch(jsonFile);
        if (!response.ok) throw new Error(`Failed to load ${jsonFile}`);
        
        const options = await response.json();
        container.innerHTML = ''; 

        options.forEach(opt => {
            const anchor = document.createElement('a');
            anchor.href = opt.htmlName;
            anchor.className = buttonClass;
            anchor.innerText = opt.description;
            container.appendChild(anchor);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color:#ff3b30; font-size:0.7rem;">Error loading ${jsonFile}</p>`;
    }
}

window.onload = init;
