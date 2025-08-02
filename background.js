// ===================================================================
//
//               1. CONFIGURATION AND NOTIFICATION
//
// ===================================================================

const DEFAULTS = {
    vaultName: 'YourVaultName',
    basePath: 'Bookmarks',
    generalNote: 'General',
    charactersFolder: 'Characters',
    showsFolder: 'Shows',
    immediateNote: 'Immediate',
    extraNote: 'Extra'
};

function getConfig() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULTS, (items) => resolve(items));
    });
}

async function showNotification(tabId, message, type = 'success') {
    const colors = {
        success: { bg: '#28a745', text: '#ffffff' },
        warning: { bg: '#ffc107', text: '#212529' },
        error: { bg: '#dc3545', text: '#ffffff' }
    };
    const style = colors[type];
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (msg, bgColor, textColor) => {
                const el = document.createElement('div');
                Object.assign(el.style, {
                    position: 'fixed', top: '20px', right: '20px', padding: '12px 20px',
                    backgroundColor: bgColor, color: textColor, borderRadius: '8px',
                    zIndex: '999999999', fontSize: '16px', fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'opacity 0.5s ease-out',
                    opacity: '1',
                    whiteSpace: 'pre-wrap' // This makes newlines render as line breaks
                });
                el.textContent = msg;
                document.body.appendChild(el);
                setTimeout(() => {
                    el.style.opacity = '0';
                    setTimeout(() => el.remove(), 2000);
                }, 3000);
            },
            args: [message, style.bg, style.text]
        });
    } catch (e) {
        console.error(`Failed to show notification on tab ${tabId}: ${e.message}`);
    }
}


// ===================================================================
//
//               2. CORE LOGIC
//
// ===================================================================
/**
 * Finds all matching note names using a strict, context-aware process.
 * A match requires BOTH a character/show name AND a source material name to be
 * present in the title, unless the note is marked with "-- OGFAV".
 * @param {string} title The page title to search within.
 * @param {string[]} names The array of all character/show note names.
 * @returns {string[]} An array of the most relevant full note names.
 */

function findAllMatches(title, names) {
    const canonicalTitleFlat = title.toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '');
    const canonicalTitleWords = title.toLowerCase().split(/[\p{P}\p{Z}\s]+/u).filter(Boolean);
    let finalMatches = [];
    for (const fullName of names) {
        let primaryName;
        const separator = ' -- ';
        const separatorIndex = fullName.indexOf(separator);
        if (separatorIndex !== -1) { primaryName = fullName.substring(0, separatorIndex).trim(); } else { primaryName = fullName.trim(); }
        if (!primaryName) continue;
        if (fullName.toUpperCase().includes('-- OGFAV')) {
            const aliases = primaryName.toLowerCase().split(',').map(alias => alias.trim());
            const isOgFavMatch = aliases.some(alias => {
                if (!alias) return false;
                const canonicalAliasWords = alias.split(/[\p{P}\p{Z}\s]+/u).filter(Boolean);
                return canonicalAliasWords.length > 0 && canonicalAliasWords.every(word => canonicalTitleWords.includes(word));
            });
            if (isOgFavMatch) finalMatches.push(fullName);
            continue;
        }
        const characterAliases = primaryName.toLowerCase().split(',').map(alias => alias.trim());
        const isCharacterMatch = characterAliases.some(alias => {
            if (!alias) return false;
            const canonicalAliasPhrase = alias.replace(/[\p{P}\p{Z}\s]/gu, '');
            return canonicalAliasPhrase && canonicalTitleFlat.includes(canonicalAliasPhrase);
        });
        if (!isCharacterMatch) continue;
        const details = (separatorIndex !== -1 ? fullName.substring(separatorIndex + separator.length) : '').trim();
        if (!details) continue;
        const sourceAliases = details.toLowerCase().split(',').map(alias => alias.trim());
        const isSourceMatch = sourceAliases.some(alias => {
            if (!alias) return false;
            const canonicalSourcePhrase = alias.replace(/[\p{P}\p{Z}\s]/gu, '');
            return canonicalSourcePhrase && canonicalTitleFlat.includes(canonicalSourcePhrase);
        });
        if (isCharacterMatch && isSourceMatch) {
            finalMatches.push(fullName);
        }
    }
    return finalMatches;
}
/**
 * Finds the single "closest" match for a user's query using a "fuzzy"
 * string-matching algorithm that handles partial inputs ("fill-in-the-blank").
 * @param {string} query The user's typed search query.
 * @param {string[]} names The array of all character/show note names.
 * @returns {string|null} The full, original name of the best-matched note, or null.
 */
function findClosestMatch(query, names) {
    // 1. Create a canonical version of the user's query by removing all
    //    punctuation, separators, and spaces. e.g., "John Smi" -> "johnsmi"
    const canonicalQuery = query.toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '');
    if (!canonicalQuery) return null;

    let scoredMatches = [];

    for (const fullName of names) {
        let primaryName;
        const separator = ' -- ';
        const separatorIndex = fullName.indexOf(separator);
        if (separatorIndex !== -1) { primaryName = fullName.substring(0, separatorIndex).trim(); } else { primaryName = fullName.trim(); }
        if (!primaryName) continue;

        // 2. Create canonical versions of the note's names.
        const canonicalFullName = fullName.toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '');
        const canonicalPrimaryName = primaryName.toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '');

        let score = 0;

        // 3. Score the match based on priority. A higher score is better.
        if (canonicalFullName.startsWith(canonicalQuery)) {
            // Highest priority: The query matches the start of the FULL note name.
            // e.g., query "John Smith -- John's Adv" matches.
            score = 3;
        } else if (canonicalPrimaryName.startsWith(canonicalQuery)) {
            // High priority: The query matches the start of the PRIMARY name.
            // e.g., query "John Smi" matches.
            score = 2;
        } else if (canonicalFullName.includes(canonicalQuery)) {
            // Lower priority: The query is found somewhere else inside the full name.
            // This catches typos or partial matches in the middle.
            score = 1;
        }
        
        if (score > 0) {
            scoredMatches.push({ name: fullName, score: score, length: canonicalFullName.length });
        }
    }

    if (scoredMatches.length === 0) return null;

    // Sort to find the best match:
    // 1. Higher score is always better.
    // 2. If scores are equal, a shorter name is a "closer" match.
    scoredMatches.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score; // Sort by score descending
        return a.length - b.length;                       // Then by length ascending
    });

    // The best match is the first item in the sorted list.
    return scoredMatches[0].name;
}

async function appendToNote(tabId, vaultName, notePath, urlToSave) {
    try {
        const response = await fetch('http://127.0.0.1:8123/save-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notePath, urlToSave })
        });
        if (!response.ok) {
            console.error(`Plugin returned an error: ${response.status}`);
            return 'ERROR';
        }
        const data = await response.json();
        return data.status;
    } catch (e) {
        console.error("A network error occurred trying to contact the Obsidian plugin.", e);
        return 'ERROR';
    }
}

// ===================================================================
//
//               3. ACTION HANDLERS
//
// ===================================================================

async function handleSmartSave(tab) {
    const config = await getConfig();
    try {
        // 1. Fetch all note names from the plugin
        const response = await fetch('http://127.0.0.1:8123/get-all-notes');
        if (!response.ok) throw new Error(`Cannot connect to Obsidian plugin (HTTP ${response.status})`);
        
        const { characters, shows } = await response.json();
        // Find all matches in both lists
        const matchedCharacterNames = findAllMatches(tab.title, characters);
        const matchedShowNames = findAllMatches(tab.title, shows);

        // --- 2. Perform all save operations and collect detailed results ---
        let savedNoteNames = [];
        let duplicateCount = 0;
        let errorCount = 0;

        // A. Handle the General note
        const generalNotePath = `${config.basePath}/${config.generalNote}`;
        const generalResult = await appendToNote(tab.id, config.vaultName, generalNotePath, tab.url);
        if (generalResult === 'SAVED') {
            savedNoteNames.push(config.generalNote); // Add the name of the General note
        } else if (generalResult === 'DUPLICATE') {
            duplicateCount++;
        } else if (generalResult === 'ERROR') {
            errorCount++;
        }
        
        // B. Handle all matched character and show notes
        const specificSavePromises = [
            ...matchedCharacterNames.map(async (name) => {
                const path = `${config.basePath}/${config.charactersFolder}/${name}`;
                const status = await appendToNote(tab.id, config.vaultName, path, tab.url);
                return { name, status }; // Return an object with the name and status
            }),
            ...matchedShowNames.map(async (name) => {
                const path = `${config.basePath}/${config.showsFolder}/${name}`;
                const status = await appendToNote(tab.id, config.vaultName, path, tab.url);
                return { name, status }; // Return an object with the name and status
            })
        ];

        // Wait for all specific saves to complete
        const specificResults = await Promise.all(specificSavePromises);

        // Process the results of the specific saves
        specificResults.forEach(result => {
            if (result.status === 'SAVED') {
                savedNoteNames.push(result.name);
            } else if (result.status === 'DUPLICATE') {
                duplicateCount++;
            } else if (result.status === 'ERROR') {
                errorCount++;
            }
        });

        console.log(tab.title);
        // --- 3. Craft the final notification based on the collected results ---
        if (errorCount > 0) {
            showNotification(tab.id, 'Error: One or more saves failed. See console.', 'error');
        } else if (savedNoteNames.length > 0) {
            // THE NEW NOTIFICATION: List all the notes it was saved to.
            //could potentially break
            const notificationMessage = `Saved to:\n${savedNoteNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}`;
            //safer but slightly less readable
            // const notificationMessage = `(${savedNoteNames.length})Saved to:\n${savedNoteNames.join('\n')}`;
            showNotification(tab.id, notificationMessage, 'success');
        } else if (duplicateCount > 0) {
            // This now correctly reports that everything already existed.
            showNotification(tab.id, `Already exists in Obsidian.`, 'warning');
        }

    } catch (e) {
        console.error("Could not connect to the Obsidian plugin or an error occurred.", e);
        showNotification(tab.id, 'Error: Could not save. Is Obsidian running?', 'error');
    }
}
async function handleImmediateSave(tab) {
    const config = await getConfig();
    const immediateNotePath = `${config.basePath}/${config.immediateNote}`;
    const result = await appendToNote(tab.id, config.vaultName, immediateNotePath, tab.url);
    if (result === 'SAVED') {
        showNotification(tab.id, `Saved to ${config.immediateNote} note!`, 'success');
    } else if (result === 'DUPLICATE') {
        showNotification(tab.id, `Already exists in ${config.immediateNote} note.`, 'warning');
    } else {
        showNotification(tab.id, 'Error: Could not save link. See console.', 'error');
    }
}


async function handleBasicSave(tab) {
    const config = await getConfig();
    const generalNotePath = `${config.basePath}/${config.generalNote}`;

    const result = await appendToNote(tab.id, config.vaultName, generalNotePath, tab.url);
    if (result === 'SAVED') {
        showNotification(tab.id, `Saved to ${config.generalNote} note!`, 'success');
    } else if (result === 'DUPLICATE') {
        showNotification(tab.id, `Already exists in ${config.generalNote} note.`, 'warning');
    } else {
        showNotification(tab.id, 'Error: Could not save link. See console.', 'error');
    }
}


async function handleExtraSave(tab) {
    const config = await getConfig();
    const extraNotePath = `${config.basePath}/${config.extraNote}`;
    const result = await appendToNote(tab.id, config.vaultName, extraNotePath, tab.url);
    if (result === 'SAVED') {
        showNotification(tab.id, `Saved to ${config.extraNote} note!`, 'success');
    } else if (result === 'DUPLICATE') {
        showNotification(tab.id, `Already exists in ${config.extraNote} note.`, 'warning');
    } else {
        showNotification(tab.id, 'Error: Could not save link. See console.', 'error');
    }
}


//save to specific note
async function handleTargetedSave(tab, query) {
    const config = await getConfig();
    try {
        const response = await fetch('http://127.0.0.1:8123/get-all-notes');
        if (!response.ok) throw new Error("Could not fetch notes from Obsidian.");

        const { characters, shows } = await response.json();
        
        // --- THE KEY CHANGE: Use the new "fuzzy" matching function ---
        const matchedName = findClosestMatch(query, [...characters, ...shows]);

        // If the fuzzy search still finds nothing, notify the user.
        if (!matchedName) {
            showNotification(tab.id, `Note not found for: "${query}"`, 'warning');
            return;
        }

        // The rest of the logic proceeds with the single best match.
        let targetFolder;
        if (characters.includes(matchedName)) {
            targetFolder = config.charactersFolder;
        } else if (shows.includes(matchedName)) {
            targetFolder = config.showsFolder;
        } else {
            throw new Error(`Matched note "${matchedName}" not found in any category.`);
        }

        const notePath = `${config.basePath}/${targetFolder}/${matchedName}`;
        const result = await appendToNote(tab.id, config.vaultName, notePath, tab.url);

        if (result === 'SAVED') {
            showNotification(tab.id, `Saved to: ${matchedName}`, 'success');
        } else if (result === 'DUPLICATE') {
            showNotification(tab.id, `Already exists in: ${matchedName}`, 'warning');
        } else {
            throw new Error("Failed to save to the specified note.");
        }

    } catch (e) {
        console.error("Error during Targeted Save:", e);
        showNotification(tab.id, 'Error: Could not perform targeted save.', 'error');
    }
}

// Add this new function
async function handleDeleteBookmark(tab) {
    try {
        const response = await fetch('http://127.0.0.1:8123/delete-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urlToDelete: tab.url })
        });
        if (!response.ok) throw new Error("Plugin returned an error during deletion.");
        const { deletedFrom } = await response.json();
        if (deletedFrom && deletedFrom.length > 0) {
            showNotification(tab.id, `Deleted from: ${deletedFrom.join(', ')}`, 'success');
        } else {
            showNotification(tab.id, `Bookmark ${tab.url} not found in any notes.`, 'warning');
        }
    } catch (e) {
        console.error("Error during bookmark deletion:", e);
        showNotification(tab.id, 'Error: Could not delete bookmark.', 'error');
    }
}

// ===================================================================
//
//               4. EVENT LISTENERS
//
// ===================================================================

// --- UNIFIED MESSAGE LISTENER ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        const tab = tabs[0];

        // This switch statement correctly routes the new action names
        switch (message.action) {
            case 'saveSmart':
                handleSmartSave(tab);
                break;
            case 'saveImmediate':
                handleImmediateSave(tab);
                break;
            case 'saveBasic':
                handleBasicSave(tab);
                break;
            case 'saveExtra':
                handleExtraSave(tab);
                break;
            case 'saveTargeted':
                handleTargetedSave(tab, message.query);
                break;
            case 'deleteBookmark':
                handleDeleteBookmark(tab);
                break;
        }
    });
    return true; // Indicates an asynchronous response
});

// --- UNIFIED COMMAND LISTENER ---
// This listens for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        const tab = tabs[0];

        // Map command names to action handlers
        if (command === 'save-smart') handleSmartSave(tab);
        else if (command === 'save-immediate') handleImmediateSave(tab);
        else if (command === 'save-basic') handleBasicSave(tab);
        else if (command === 'save-extra') handleExtraSave(tab);
        // Targeted Save cannot be a command as it requires user input.
    });
});
