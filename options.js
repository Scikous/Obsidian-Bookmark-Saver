// Defines the default settings for the extension.
const DEFAULTS = {
    vaultName: 'YourVaultName',
    basePath: 'Bookmarks',
    generalNote: 'General',
    charactersFolder: 'Characters',
    immediateNote: 'Immediate',
    extraNote: 'Extra'
};

// Saves options to chrome.storage
function saveOptions() {
    const vaultName = document.getElementById('vaultName').value;
    const basePath = document.getElementById('basePath').value;
    const generalNote = document.getElementById('generalNote').value;
    const charactersFolder = document.getElementById('charactersFolder').value;
    const immediateNote = document.getElementById('immediateNote').value;
    const extraNote = document.getElementById('extraNote').value;

    chrome.storage.sync.set({
        vaultName,
        basePath,
        generalNote,
        charactersFolder,
        immediateNote,
        extraNote
    }, () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Settings saved.';
        setTimeout(() => {
            status.textContent = '';
        }, 1500);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    // Use default values if nothing is stored yet
    chrome.storage.sync.get(DEFAULTS, (items) => {
        document.getElementById('vaultName').value = items.vaultName;
        document.getElementById('basePath').value = items.basePath;
        document.getElementById('generalNote').value = items.generalNote;
        document.getElementById('charactersFolder').value = items.charactersFolder;
        document.getElementById('immediateNote').value = items.immediateNote;
        document.getElementById('extraNote').value = items.extraNote;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);