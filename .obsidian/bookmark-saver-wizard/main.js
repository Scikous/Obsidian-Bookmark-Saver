// const { Plugin, PluginSettingTab, Setting, TFile } = require('obsidian');
// const http = require('http');

// // --- SETTINGS DEFINITION ---
// const DEFAULT_SETTINGS = {
//     basePath: 'Bookmarks',
//     charactersFolder: 'Characters'
// };

// // --- SETTINGS UI CLASS ---
// class CharacterNoteFinderSettingTab extends PluginSettingTab {
//     constructor(app, plugin) {
//         super(app, plugin);
//         this.plugin = plugin;
//     }

//     display() {
//         const { containerEl } = this;
//         containerEl.empty();
//         containerEl.createEl('h2', { text: 'Character Note Finder Settings' });

//         new Setting(containerEl)
//             .setName('Base Folder for Bookmarks')
//             .setDesc('The main folder where notes are saved. Must match the Chrome Extension settings.')
//             .addText(text => text
//                 .setPlaceholder('e.g., Bookmarks')
//                 .setValue(this.plugin.settings.basePath)
//                 .onChange(async (value) => {
//                     this.plugin.settings.basePath = value;
//                     await this.plugin.saveSettings();
//                 }));
        
//         new Setting(containerEl)
//             .setName('Characters Folder Sub-path')
//             .setDesc('The sub-folder containing character notes. Must match the Chrome Extension settings.')
//             .addText(text => text
//                 .setPlaceholder('e.g., Characters')
//                 .setValue(this.plugin.settings.charactersFolder)
//                 .onChange(async (value) => {
//                     this.plugin.settings.charactersFolder = value;
//                     await this.plugin.saveSettings();
//                 }));
//     }
// }


// // --- MAIN PLUGIN LOGIC ---
// module.exports = class CharacterNoteFinder extends Plugin {
//     async onload() {
//         await this.loadSettings();
//         this.addSettingTab(new CharacterNoteFinderSettingTab(this.app, this));

//         this.server = http.createServer(async (req, res) => {
//             res.setHeader('Access-Control-Allow-Origin', '*');
//             res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//             res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//             if (req.method === 'OPTIONS') {
//                 res.writeHead(204);
//                 res.end();
//                 return;
//             }
            
//             const url = new URL(req.url, `http://${req.headers.host}`);

//             if (req.method === 'GET' && url.pathname === '/get-characters') {
//                 const characterNoteTitles = this.getCharacterNotes(); // This now correctly uses settings
//                 res.writeHead(200, { 'Content-Type': 'application/json' });
//                 res.end(JSON.stringify(characterNoteTitles));
//                 return;
//             }

//             if (req.method === 'POST' && url.pathname === '/save-url') {
//                 try {
//                     const body = await this.getPostBody(req);
//                     const { notePath, urlToSave } = body;
//                     if (!notePath || !urlToSave) throw new Error("Missing notePath or urlToSave");
                    
//                     const status = await this.appendUrlToNote(notePath, urlToSave);
//                     res.writeHead(200, { 'Content-Type': 'application/json' });
//                     res.end(JSON.stringify({ status }));
//                 } catch (e) {
//                     console.error("Obsidian Plugin Error:", e);
//                     res.writeHead(500, { 'Content-Type': 'application/json' });
//                     res.end(JSON.stringify({ status: 'ERROR', message: e.message }));
//                 }
//                 return;
//             }

//             console.log(`Obsidian Plugin: Received unhandled request for ${req.method} ${req.url}`);
//             res.writeHead(404).end();
//         }).listen(8123, '127.0.0.1');
//     }

//     onunload() { if (this.server) this.server.close(); }

//     async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
//     async saveSettings() { await this.saveData(this.settings); }
    
//     getPostBody(req) {
//         return new Promise((resolve, reject) => {
//             let body = '';
//             req.on('data', chunk => body += chunk.toString());
//             req.on('end', () => resolve(JSON.parse(body)));
//             req.on('error', err => reject(err));
//         });
//     }

//     getCharacterNotes() {
//         if (!this.settings.basePath || !this.settings.charactersFolder) {
//             console.error("Character Note Finder: Paths are not configured in plugin settings.");
//             return [];
//         }
        
//         const characterFolderPath = `${this.settings.basePath}/${this.settings.charactersFolder}`;
//         const files = this.app.vault.getMarkdownFiles();
        
//         return files
//             .filter(file => file.path.startsWith(characterFolderPath + '/'))
//             .map(file => file.basename);
//     }

//     async readNoteContent(notePath) {
//         const file = this.app.vault.getAbstractFileByPath(`${notePath}.md`);
//         if (file instanceof TFile) {
//             return await this.app.vault.read(file);
//         }
//         return '';
//     }

//     async appendUrlToNote(notePath, urlToSave) {
//         const fullPath = `${notePath}.md`;
//         const currentContent = await this.readNoteContent(notePath);

//         if (currentContent.includes(urlToSave)) {
//             return 'DUPLICATE';
//         }

//         const lines = currentContent.trim().split('\n');
//         let lastNumber = lines.reduce((acc, line) => {
//             const match = line.match(/^(\d+)\./);
//             return match ? Math.max(acc, parseInt(match[1], 10)) : acc;
//         }, 0);
        
//         const lineToAppend = `${lastNumber + 1}. ${urlToSave}`;
//         const contentToAppend = currentContent.trim() === '' ? lineToAppend : '\n' + lineToAppend;

//         const file = this.app.vault.getAbstractFileByPath(fullPath);
//         if (file instanceof TFile) {
//             await this.app.vault.append(file, contentToAppend);
//         } else {
//             await this.app.vault.create(fullPath, lineToAppend);
//         }
//         return 'SAVED';
//     }
// };


const { Plugin, PluginSettingTab, Setting, TFile } = require('obsidian');
const http = require('http');

const DEFAULT_SETTINGS = {
    basePath: 'Bookmarks',
    charactersFolder: 'Characters',
    showsFolder: 'Shows'
};

class CompanionPluginSettingTab extends PluginSettingTab {
    constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Bookmark Saver Companion Settings' });
        new Setting(containerEl).setName('Base Folder for Bookmarks').setDesc('Must match Chrome Extension settings.').addText(text => text.setValue(this.plugin.settings.basePath).onChange(async (v) => { this.plugin.settings.basePath = v; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('Characters Folder Sub-path').setDesc('Sub-folder with character notes. Must match extension settings.').addText(text => text.setValue(this.plugin.settings.charactersFolder).onChange(async (v) => { this.plugin.settings.charactersFolder = v; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('Shows Folder Sub-path').setDesc('Sub-folder with show notes. Must match extension settings.').addText(text => text.setValue(this.plugin.settings.showsFolder).onChange(async (v) => { this.plugin.settings.showsFolder = v; await this.plugin.saveSettings(); }));
    }
}

module.exports = class BookmarkSaverCompanion extends Plugin {
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new CompanionPluginSettingTab(this.app, this));
        this.server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
            const url = new URL(req.url, `http://${req.headers.host}`);
            if (req.method === 'GET' && url.pathname === '/get-all-notes') {
                const allNotes = {
                    characters: this.getNotesFromSubfolder(this.settings.charactersFolder),
                    shows: this.getNotesFromSubfolder(this.settings.showsFolder)
                };
                res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(allNotes));
                return;
            }
            if (req.method === 'POST' && url.pathname === '/save-url') {
                try {
                    const body = await this.getPostBody(req);
                    const { notePath, urlToSave } = body;
                    if (!notePath || !urlToSave) throw new Error("Missing notePath or urlToSave");
                    const status = await this.appendUrlToNote(notePath, urlToSave);
                    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ status }));
                } catch (e) {
                    console.error("Obsidian Plugin Error:", e);
                    res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ status: 'ERROR', message: e.message }));
                }
                return;
            }
            res.writeHead(404).end();
        }).listen(8123, '127.0.0.1');
    }
    onunload() { if (this.server) this.server.close(); }
    async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
    async saveSettings() { await this.saveData(this.settings); }
    getPostBody(req) { return new Promise((resolve, reject) => { let b = ''; req.on('data', c => b += c); req.on('end', () => resolve(JSON.parse(b))); req.on('error', e => reject(e)); }); }
    getNotesFromSubfolder(subfolder) {
        if (!this.settings.basePath || !subfolder) return [];
        const fullPath = `${this.settings.basePath}/${subfolder}`;
        return this.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(fullPath + '/')).map(f => f.basename);
    }
    async readNoteContent(notePath) {
        const file = this.app.vault.getAbstractFileByPath(`${notePath}.md`);
        return file instanceof TFile ? await this.app.vault.read(file) : '';
    }
    async appendUrlToNote(notePath, urlToSave) {
        const fullPath = `${notePath}.md`;
        const content = await this.readNoteContent(notePath);
        if (content.includes(urlToSave)) return 'DUPLICATE';
        const lastNum = content.trim().split('\n').reduce((a, l) => { const m = l.match(/^(\d+)\./); return m ? Math.max(a, parseInt(m[1])) : a; }, 0);
        const line = `${lastNum + 1}. ${urlToSave}`;
        const newContent = content.trim() === '' ? line : '\n' + line;
        const file = this.app.vault.getAbstractFileByPath(fullPath);
        if (file instanceof TFile) await this.app.vault.append(file, newContent);
        else await this.app.vault.create(fullPath, line);
        return 'SAVED';
    }
};