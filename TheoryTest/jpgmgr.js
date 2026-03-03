/**
 * File: jpgmgr.js
 * Version: v1.0.1
 * Update: Fully functional logic for Single ID and 'All' modes.
 */

const JPGMGR_VERSION = "1.0.1";
const IMAGE_CACHE_NAME = 'orion-image-cache';
// UPDATED: Standard GitHub Raw path structure
const GITHUB_BASE = "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/images/";

async function jpgmgr(input) {
    if (input === 'all') {
        return await handleAllMode();
    }

    if (input === 'check') {
        return await handleCheckMode();
    }

    // Default to Single ID mode
    return await handleSingleId(input);
}

/**
 * Logic for a single image: Check Local -> Fetch Remote -> Store
 */
async function handleSingleId(id) {
    const fileName = `${id}.jpeg`;
    const imagePath = `images/${fileName}`;
    const remoteUrl = GITHUB_BASE + fileName;

    try {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const cachedResponse = await cache.match(imagePath);

        if (cachedResponse) {
            return {
                success: true,
                message: `Verified: Image ${id} is already in local memory.`,
                source: "LOCAL CACHE",
                id: id
            };
        }

        // Fetch from GitHub if missing
        try {
            const response = await fetch(remoteUrl);
            if (response.ok) {
                // Store in cache exactly like mainmenu.js does
                await cache.put(imagePath, response.clone());
                return {
                    success: true,
                    message: `Downloaded: Image ${id} was missing and has been saved.`,
                    source: "INTERNET (GITHUB)",
                    id: id
                };
            } else {
                return {
                    success: false,
                    message: `Not Found: Image ${id} does not exist on GitHub.`,
                    source: "404 ERROR",
                    id: id
                };
            }
        } catch (netError) {
            return {
                success: false,
                message: "Network Error: Could not reach GitHub.",
                source: "OFFLINE",
                id: id
            };
        }
    } catch (e) {
        return { success: false, message: "Cache System Error: " + e.message };
    }
}

/**
 * Mode: 'all' - Library Audit
 * Loops through orion_master.json and fills any missing gaps.
 */
async function handleAllMode() {
    const masterData = localStorage.getItem('orion_master.json');
    if (!masterData) {
        return { success: false, message: "Master Database not found. Sync required." };
    }

    const master = JSON.parse(masterData);
    let downloadedCount = 0;
    let existingCount = 0;

    for (const q of master) {
        if (q.id) {
            const res = await handleSingleId(q.id);
            if (res.source === "INTERNET (GITHUB)") downloadedCount++;
            else if (res.source === "LOCAL CACHE") existingCount++;
        }
    }

    return {
        success: true,
        message: `Audit Complete. New: ${downloadedCount}, Existing: ${existingCount}.`,
        source: "BULK PROCESS"
    };
}

/**
 * Mode: 'check' - Header Peek logic
 * RESERVED: This will compare local dates vs remote dates.
 */
async function handleCheckMode() {
    // Logic for Header Peeking to be added here.
    return { 
        success: false, 
        message: "Header Peek (Check Mode) is currently under development.",
        source: "RESERVED"
    };
}
