/**
 * File: jpgmgr.js
 * Version: v1.1.0
 * Description: Full Image Manager with Bulk Audit (All) and Update Check (Check).
 */

const JPGMGR_VERSION = "1.1.0";
const IMAGE_CACHE_NAME = 'orion-image-cache';
// Replace with your actual GitHub path
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
                message: `Verified: Image ${id} is in local memory.`,
                source: "LOCAL CACHE",
                id: id
            };
        }

        try {
            const response = await fetch(remoteUrl);
            if (response.ok) {
                await cache.put(imagePath, response.clone());
                return {
                    success: true,
                    message: `Downloaded: Image ${id} saved to cache.`,
                    source: "INTERNET (GITHUB)",
                    id: id
                };
            } else {
                return { success: false, message: `Not Found: ${id} (404)`, source: "NONE" };
            }
        } catch (netError) {
            return { success: false, message: "Network Error.", source: "OFFLINE" };
        }
    } catch (e) {
        return { success: false, message: "Cache Error: " + e.message };
    }
}

/**
 * Mode: 'all' - Library Audit
 * Fills any missing gaps based on orion_master.json
 */
async function handleAllMode() {
    const masterData = localStorage.getItem('orion_master.json');
    if (!masterData) return { success: false, message: "Master DB missing." };

    const master = JSON.parse(masterData);
    let downloaded = 0;
    let skipped = 0;

    for (const q of master) {
        if (q.id) {
            const res = await handleSingleId(q.id);
            if (res.source === "INTERNET (GITHUB)") downloaded++;
            else skipped++;
        }
    }

    return {
        success: true,
        message: `Audit Complete. New: ${downloaded}, Existing: ${skipped}.`,
        source: "BULK ALL"
    };
}

/**
 * Mode: 'check' - Header Peek logic
 * Compares Local vs GitHub timestamps. Downloads if GitHub is newer.
 */
async function handleCheckMode() {
    const masterData = localStorage.getItem('orion_master.json');
    if (!masterData) return { success: false, message: "Master DB missing." };

    const master = JSON.parse(masterData);
    const cache = await caches.open(IMAGE_CACHE_NAME);
    let updated = 0;

    for (const q of master) {
        if (!q.id) continue;
        const imagePath = `images/${q.id}.jpeg`;
        const remoteUrl = GITHUB_BASE + `${q.id}.jpeg`;

        const local = await cache.match(imagePath);
        if (!local) {
            // If missing entirely, just fetch it
            await handleSingleId(q.id);
            continue;
        }

        try {
            // Perform the "Header Peek"
            const remoteHead = await fetch(remoteUrl, { method: 'HEAD' });
            const remoteDate = new Date(remoteHead.headers.get('Last-Modified'));
            const localDate = new Date(local.headers.get('Date'));

            if (remoteDate > localDate) {
                // Remote is newer, update local cache
                const response = await fetch(remoteUrl);
                if (response.ok) {
                    await cache.put(imagePath, response.clone());
                    updated++;
                }
            }
        } catch (e) {
            console.log("Check failed for ID " + q.id);
        }
    }

    return {
        success: true,
        message: `Check Complete. Updated ${updated} images.`,
        source: "BULK CHECK"
    };
}
