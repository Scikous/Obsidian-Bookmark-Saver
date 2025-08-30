// Function to send a message to the background script and close the popup.
function sendMessage(action, data = {}) {
    chrome.runtime.sendMessage({ action, ...data });
    window.close();
}

// --- Event Listeners ---
document.getElementById('smartSaveBtn').addEventListener('click', () => sendMessage('saveSmart'));
document.getElementById('immediateSaveBtn').addEventListener('click', () => sendMessage('saveImmediate'));
document.getElementById('basicSaveBtn').addEventListener('click', () => sendMessage('saveBasic'));
document.getElementById('extraSaveBtn').addEventListener('click', () => sendMessage('saveExtra'));

document.getElementById('deleteBtn').addEventListener('click', () => {
    // CRUCIAL: Add a confirmation dialog to prevent accidental deletion.
    if (window.confirm("Are you sure you want to remove this page's URL from ALL relevant Obsidian notes? This cannot be undone.")) {
        chrome.runtime.sendMessage({ action: 'deleteBookmark' });
        window.close();
    }
});

document.getElementById('targetedSaveBtn').addEventListener('click', () => {
    const query = document.getElementById('noteQuery').value;
    if (query) {
        sendMessage('saveTargeted', { query });
    }
});

// Allow pressing Enter in the text box to trigger the Targeted Save
document.getElementById('noteQuery').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('targetedSaveBtn').click();
    }
});

// --- THE FIX: Autofocus on the input field when the popup opens ---
//document.getElementById('noteQuery').focus();
