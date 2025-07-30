const { Plugin, PluginSettingTab, Setting, TFile } = require('obsidian');
const http = require('http');

const DEFAULT_SETTINGS = {
    basePath: 'Bookmarks',
    charactersFolder: 'Characters',
    showsFolder: 'Shows',
    generalNote: 'General',
    immediateNote: 'Immediate',
    extraNote: 'Extra'
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
        new Setting(containerEl).setName('General Note Sub-path').setDesc('Contains general bookmarks. Must match extension settings.').addText(text => text.setValue(this.plugin.settings.generalNote).onChange(async (v) => { this.plugin.settings.generalNote = v; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('Immediate Note Sub-path').setDesc('Contains immediate bookmarks. Must match extension settings.').addText(text => text.setValue(this.plugin.settings.immediateNote).onChange(async (v) => { this.plugin.settings.immediateNote = v; await this.plugin.saveSettings(); }));
        new Setting(containerEl).setName('Extra Note Sub-path').setDesc('Contains extra bookmarks. Must match extension settings.').addText(text => text.setValue(this.plugin.settings.extraNote).onChange(async (v) => { this.plugin.settings.extraNote = v; await this.plugin.saveSettings(); }));
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
            if (req.method === 'POST' && url.pathname === '/delete-url') {
            try {
                const body = await this.getPostBody(req);
                const { urlToDelete } = body;
                if (!urlToDelete) throw new Error("Missing urlToDelete in request");

                const deletedFrom = await this.deleteUrlFromAllNotes(urlToDelete);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'OK', deletedFrom }));
            } catch (e) {
                console.error("Obsidian Plugin Delete Error:", e);
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


    //delete bookmarks logic
    async deleteUrlFromAllNotes(urlToDelete) {
        const notesToCheck = await this.getAllBookmarkNotePaths();
        const modifiedNoteNames = [];
        console.log("WHWHWYWYWWYWY");
        for (const notePath of notesToCheck) {
            const file = this.app.vault.getAbstractFileByPath(`${notePath}.md`);
            if (!(file instanceof TFile)) continue;
            const originalContent = await this.app.vault.read(file);
            // LOG 4: The crucial check. What is the result of the comparison?
            const found = originalContent.includes(urlToDelete);
            console.log(`- Checking [${notePath}]: Found? ${found}`);

            if (!originalContent.includes(urlToDelete)) continue;
            const lines = originalContent.split('\n');
            const filteredLines = lines.filter(line => !line.includes(urlToDelete));
            let counter = 1;
            const newLines = filteredLines.map(line => line.trim().match(/^\d+\./) ? line.replace(/^\d+\./, `${counter++}.`) : line);
            await this.app.vault.modify(file, newLines.join('\n'));
            modifiedNoteNames.push(file.basename);
        }
        return modifiedNoteNames;
    }
    async getAllBookmarkNotePaths() {
        const c = this.settings; const p = [];
        if (c.basePath && c.generalNote) p.push(`${c.basePath}/${c.generalNote}`);
        if (c.basePath && c.immediateNote) p.push(`${c.basePath}/${c.immediateNote}`);
        if (c.basePath && c.extraNote) p.push(`${c.basePath}/${c.extraNote}`);
        const charNotes = this.getNotesFromSubfolder(c.charactersFolder).map(n => `${c.basePath}/${c.charactersFolder}/${n}`);
        const showNotes = this.getNotesFromSubfolder(c.showsFolder).map(n => `${c.basePath}/${c.showsFolder}/${n}`);
        return [...p, ...charNotes, ...showNotes];
    }
};