// // --- Consistent Action Senders ---

// document.getElementById('smartSaveBtn').addEventListener('click', () => {
//     chrome.runtime.sendMessage({ action: 'saveSmart' });
//     window.close();
// });

// document.getElementById('immediateSaveBtn').addEventListener('click', () => {
//     chrome.runtime.sendMessage({ action: 'saveImmediate' });
//     window.close();
// });

// document.getElementById('basicSaveBtn').addEventListener('click', () => {
//     chrome.runtime.sendMessage({ action: 'saveBasic' });
//     window.close();
// });

// document.getElementById('extraSaveBtn').addEventListener('click', () => {
//     chrome.runtime.sendMessage({ action: 'saveExtra' });
//     window.close();
// });

// document.getElementById('targetedSaveBtn').addEventListener('click', () => {
//     const query = document.getElementById('noteQuery').value;
//     if (query) {
//         chrome.runtime.sendMessage({ action: 'saveTargeted', query: query });
//         window.close();
//     }
// });

// // Allow pressing Enter in the text box to trigger the Targeted Save
// document.getElementById('noteQuery').addEventListener('keydown', (event) => {
//     if (event.key === 'Enter') {
//         event.preventDefault();
//         document.getElementById('targetedSaveBtn').click();
//     }
// });


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
document.getElementById('noteQuery').focus();