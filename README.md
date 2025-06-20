# Obsidian Bookmark Saver & Companion Plugin

This project is a powerful, two-part system designed to silently save browser tabs from Google Chrome directly into your Obsidian vault with intelligent, configurable sorting.

It consists of:
1.  **A Google Chrome Extension:** Captures tab information, provides the user interface (popup & shortcuts), and communicates with the plugin.
2.  **An Obsidian Companion Plugin:** Runs a local server inside Obsidian, giving the extension secure access to read note lists and write to files in the background.

## Key Features

*   **Silent Background Saving:** Saves bookmarks without ever pulling you out of your browser window.
*   **Multi-Category Smart Sorting:** Automatically finds relevant notes from both your `Characters` and `Shows` folders based on the page title.
*   **Multi-Match Saving:** If a title mentions multiple entities (e.g., "Character A and Show B"), it saves the link to *all* corresponding notes.
*   **Targeted Manual Saving:** A popup UI allows you to manually type a note name and save directly to it, perfect for pages without clear titles.
*   **Flexible Alias Matching:** Define multiple names or nicknames for a single note (e.g., `Main Name, Nickname`) for broader matching.
*   **Order-Agnostic Matching:** Correctly identifies names regardless of word order (e.g., "Firstname Lastname" is the same as "Lastname Firstname").
*   **Robust Punctuation & Unicode Handling:** Correctly matches titles with different punctuation (`Re:Zero` vs. `Re-Zero`) and handles non-English characters gracefully.
*   **Duplicate Prevention:** Checks if a URL already exists in a note before saving to prevent duplicate entries.
*   **Fully Configurable:** All vault names and folder paths can be customized to match your setup.
*   **Keyboard Shortcuts:** Save bookmarks instantly without ever clicking a button.
*   **On-Screen Notifications:** Get immediate visual feedback on the success, status (duplicate), or failure of a save operation.

***

## Installation and Setup

This is a two-part setup. You must install **both** the Obsidian plugin and the Chrome extension for the system to work.

### Part 1: Obsidian Plugin Setup

The Obsidian plugin must be running for the extension to connect.

1.  **Locate the Plugin Folder:** In this repository, find the `.obsidian` directory. Inside it is a folder named `bookmark-saver-wizard`. This is the plugin.

2.  **Move the Plugin Folder:** Copy the entire `bookmark-saver-wizard` folder and place it inside your own Obsidian vault's plugin directory, which is located at `YourVault/.obsidian/plugins/`.

    > **Note:** The `.obsidian` folder is hidden by default. You may need to enable "Show Hidden Files" on your operating system to see it.

3.  **Activate the Plugin:**
    *   Open Obsidian.
    *   Go to `Settings` > `Community plugins`.
    *   You should see "Bookmark Saver Wizard" in your list of community plugins. **Click the toggle switch to enable it.**

4.  **Configure the Plugin:**
    *   In the `Settings` menu, look under the "Community Plugins" heading on the left sidebar. You will see a new tab for "Bookmark Saver Wizard". Click on it.
    *   You will see fields for "Base Folder for Bookmarks", "Characters Folder Sub-path", and **"Shows Folder Sub-path"**.
    *   Set these to match your desired folder structure (e.g., `Bookmarks`, `Characters`, and `Shows`).
    *   **Crucially, these paths must exactly match the settings you will configure in the Chrome Extension.**

### Part 2: Chrome Extension Setup

1.  **Load the Extension:**
    *   Open Google Chrome and navigate to `chrome://extensions`.
    *   In the top-right corner, toggle on **Developer mode**.
    *   Three new buttons will appear. Click on **Load unpacked**.
    *   A file selection dialog will open. Navigate to and select the root folder of this repository (the one containing `manifest.json`).

2.  **Configure the Extension:**
    *   The "Obsidian Bookmark Saver" will now appear in your extensions list.
    *   **Right-click** on the extension's icon in your Chrome toolbar and select **Options**.
    *   Fill out all the fields. Make sure to configure the paths for your `Characters` and `Shows` folders here.
        *   **Vault Name:** The exact name of your Obsidian vault.
        *   **Base Folder / Sub-paths:** These paths **must match** what you configured in the Obsidian plugin settings in Step 4 above.
    *   Click "Save Settings".

3.  **(Optional) Configure Keyboard Shortcuts:**
    *   Navigate to `chrome://extensions/shortcuts`.
    *   Find "Obsidian Bookmark Saver" in the list.
    *   You can view and change the shortcuts for all save actions here.

Congratulations! The setup is complete.

***

## How to Use

#### Smart Save
This is the primary action. It saves the URL to your general bookmarks note and also intelligently finds and saves to any relevant notes in your `Characters` and `Shows` folders based on the page title.
*   **Keyboard Shortcut:** Check `chrome://extensions/shortcuts` for the current key.
*   **Popup Button:** Click the extension icon, then click "Smart Save".

#### Targeted Save (Manual Override)
This is the perfect solution for pages where the title doesn't contain the information you need to sort it automatically.
1.  Click the extension icon in your toolbar.
2.  In the popup, type a name into the "Save to a specific note" input field. The name of the note can be "close enough", does not need to be the full note name.
3.  Click the "Targeted Save" button or press Enter.
4.  The extension will find the best match for your query in both your `Characters` and `Shows` folders and save the link directly to that note.

#### Other Save Actions
The popup also contains buttons for other direct save actions (`Immediate`, `Basic`, etc.) that save to specific, pre-configured notes without any smart matching.

## Formatting Smart-Sort Notes (for Characters and Shows)

To get the most out of the smart matching, you should name your notes in the `Characters` and `Shows` folders using the following format:

**`Primary Name -- Details`**

*   **Primary Name:** The name used for matching.
    *   Can contain multiple words (e.g., "Firstname Lastname"). The matching logic is order-agnostic.
    *   **Can include multiple aliases separated by a comma.** For example: `Main Name, Nickname`.
*   **Separator:** Two dashes surrounded by spaces (` -- `).
*   **Details:** Any extra information, like the series or studio.

#### Examples:
*   `Main Name, Nickname -- Source Series A.md`
*   `Firstname Lastname -- Source Series B.md`
*   `Show Name.md` (works perfectly fine without a separator)

***

## Troubleshooting

*   **Problem:** I get an error notification: "Error: Could not save. Is Obsidian running?"
    *   **Solution:** The Obsidian application must be running with the "Bookmark Saver Wizard" plugin enabled for the extension to work.

*   **Problem:** The `General` note saves, but `Character` or `Show` notes never do.
    *   **Solution:** This almost always means the paths in the Obsidian plugin's settings do not match the paths in the Chrome Extension's options. Ensure they are identical.

*   **Problem:** Nothing saves and no notification appears.
    *   **Solution:** You are likely on a page where Chrome forbids extensions from running, such as the New Tab page or `chrome://` pages. This is a security feature of Chrome. Try saving from a normal website.

*   **Problem:** I changed the code in the plugin's `main.js` file, but it's not working.
    *   **Solution:** You must force Obsidian to reload the plugin. The easiest way is to go to `Settings > Community plugins`, toggle the plugin OFF, and then toggle it back ON.

## The Why
I built this plugin for speed and convenience. Built-in bookmark managers tend to lag heavily at higher bookmark counts. Having all of your bookmarks with one sole browser provider is not super ideal for being able to conveniently swap between browsers and overall have access to one's bookmarks.

## Can The Setup Be Simpler?
Not really, I highly doubt Obsidian and Chrome would truly allow for an extension that requires a 3rd-party program with its own plugin and extra setup... well... Chrome might allow. Unless proven otherwise this is the way.