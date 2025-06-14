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
                    opacity: '1'
                });
                el.textContent = msg;
                document.body.appendChild(el);
                setTimeout(() => {
                    el.style.opacity = '0';
                    setTimeout(() => el.remove(), 500);
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
 * Finds all matching note names in a title and filters out less-specific duplicates.
 * @param {string} title The page title to search within.
 * @param {string[]} names The array of all character note names.
 * @returns {string[]} An array of the full, original note names that were matched.
*/
function findAllMatches(title, names) {
    // 1. Create a "canonical" version of the title: lowercase and all punctuation
    //    and separator characters removed. The 'u' flag enables Unicode awareness.
    //    e.g., "Art of Re:Zero" -> "artofrezero"
    //    e.g., "ベアトリスのアート"
    const canonicalTitle = title.toLowerCase().replace(/[\p{P}\p{Z}]/gu, '');

    let rawMatches = [];

    for (const fullName of names) {
        let primaryName;
        const separator = ' -- ';
        const separatorIndex = fullName.indexOf(separator);

        if (separatorIndex !== -1) {
            primaryName = fullName.substring(0, separatorIndex).trim();
        } else {
            primaryName = fullName.trim();
        }

        if (!primaryName) continue;

        const aliases = primaryName.split(',').map(alias => alias.trim());

        const isMatch = aliases.some(alias => {
            if (!alias) return false;

            const aliasWords = alias.toLowerCase().split(' ');
            
            // Create a list of meaningful, canonical words from the alias.
            const canonicalAliasWords = aliasWords
                .map(word => word.replace(/[\p{P}\p{Z}]/gu, ''))
                .filter(Boolean); // The filter(Boolean) removes any empty strings.

            // If an alias has no meaningful words (e.g., it was just "--"), it cannot match.
            if (canonicalAliasWords.length === 0) {
                return false;
            }

            // Check if ALL of the meaningful canonical words are present in the canonical title.
            return canonicalAliasWords.every(canonicalWord => {
                return canonicalTitle.includes(canonicalWord);
            });
        });

        if (isMatch) {
            rawMatches.push(fullName);
        }
    }

    // --- Filter out less-specific matches (unchanged) ---
    if (rawMatches.length <= 1) {
        return rawMatches;
    }

    const finalMatches = rawMatches.filter(match => {
        const isSubsetOfAnother = rawMatches.some(otherMatch => {
            return otherMatch !== match && otherMatch.includes(match);
        });
        return !isSubsetOfAnother;
    });

    return finalMatches;
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
        // Call the new, more powerful endpoint
        const response = await fetch('http://127.0.0.1:8123/get-all-notes');
        if (!response.ok) throw new Error(`Cannot connect to Obsidian plugin (HTTP ${response.status})`);
        
        // The response now contains two lists
        const { characters, shows } = await response.json();
        
        // Find matches in each list separately
        const matchedCharacterNames = findAllMatches(tab.title, characters);
        const matchedShowNames = findAllMatches(tab.title, shows);

        // --- Step 1: Save to the General note ---
        const generalResult = await appendToNote(tab.id, config.vaultName, `${config.basePath}/${config.generalNote}`, tab.url);
        console.log(tab.title);
        // --- Step 2: Create save promises for all matches ---
        const characterSavePromises = (matchedCharacterNames || []).map(name => {
            const path = `${config.basePath}/${config.charactersFolder}/${name}`;
            return appendToNote(tab.id, config.vaultName, path, tab.url);
        });

        const showSavePromises = (matchedShowNames || []).map(name => {
            const path = `${config.basePath}/${config.showsFolder}/${name}`;
            return appendToNote(tab.id, config.vaultName, path, tab.url);
        });

        // Wait for all character and show saves to complete
        const specificResults = await Promise.all([...characterSavePromises, ...showSavePromises]);

        // --- Step 3: Aggregate all results for the final notification ---
        const allResults = [generalResult, ...specificResults];
        const savedCount = allResults.filter(r => r === 'SAVED').length;
        const duplicateCount = allResults.filter(r => r === 'DUPLICATE').length;
        const errorCount = allResults.filter(r => r === 'ERROR').length;

        if (errorCount > 0) {
            showNotification(tab.id, 'Error: Could not save one or more links.', 'error');
        } else if (savedCount > 0) {
            showNotification(tab.id, `Saved to Obsidian (${savedCount} new)!`, 'success');
        } else if (duplicateCount > 0) {
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


// --- NEW ACTION HANDLER FOR TARGETED SAVE ---
async function handleTargetedSave(tab, query) {
    const config = await getConfig();
    try {
        const response = await fetch('http://127.0.0.1:8123/get-all-notes');
        if (!response.ok) throw new Error("Could not fetch notes from Obsidian.");

        const { characters, shows } = await response.json();
        const matchedNames = findAllMatches(query, [...characters, ...shows]);

        if (!matchedNames || matchedNames.length === 0) {
            showNotification(tab.id, `Note not found for: "${query}"`, 'warning');
            return;
        }

        const noteToSaveTo = matchedNames[0];
        let targetFolder;

        if (characters.includes(noteToSaveTo)) {
            targetFolder = config.charactersFolder;
        } else if (shows.includes(noteToSaveTo)) {
            targetFolder = config.showsFolder;
        } else {
            throw new Error(`Matched note "${noteToSaveTo}" not found in any category.`);
        }

        const notePath = `${config.basePath}/${targetFolder}/${noteToSaveTo}`;
        const result = await appendToNote(tab.id, config.vaultName, notePath, tab.url);

        if (result === 'SAVED') {
            showNotification(tab.id, `Saved to: ${noteToSaveTo}`, 'success');
        } else if (result === 'DUPLICATE') {
            showNotification(tab.id, `Already exists in: ${noteToSaveTo}`, 'warning');
        } else {
            throw new Error("Failed to save to the specified note.");
        }
    } catch (e) {
        console.error("Error during Targeted Save:", e);
        showNotification(tab.id, 'Error: Could not perform targeted save.', 'error');
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