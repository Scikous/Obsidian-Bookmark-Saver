# Obsidian Bookmark Saver & Companion Plugin

This project is a powerful, two-part system designed to silently save browser tabs from Google Chrome directly into your Obsidian vault with intelligent, configurable sorting.

It consists of:
1.  **A Google Chrome Extension:** Captures tab information, provides the user interface (popup & shortcuts), and communicates with the plugin.
2.  **An Obsidian Companion Plugin:** Runs a local server inside Obsidian, giving the extension secure access to read note lists and write to files in the background.

## Key Features

*   **Silent Background Saving:** Saves and deletes bookmarks without ever pulling you out of your browser window.
*   **Context-Aware Smart Sorting:** Accurately finds notes by requiring a match for **both** the primary name (e.g., character) AND the source material (e.g., show name), preventing false positives.
*   **Bookmark Deletion:** Easily remove a URL from all notes it was saved to directly from your browser, with a confirmation to prevent accidents.
*   **Forgiving Targeted Save:** Manually save to a specific note with a "fuzzy" search that finds the closest match, even with typos or partial names.
*   **Flexible Alias Matching:** Define multiple names or source materials for a single note (e.g., `Main Name, Nickname -- Source, Alt Source`) for broader matching.
*   **Order-Agnostic Name Matching:** Correctly identifies multi-word names regardless of their order in the title.
*   **Robust Punctuation & Unicode Handling:** Correctly matches titles with different punctuation (`Re:Zero` vs. `Re-Zero`) and handles non-English characters gracefully.
*   **Duplicate Prevention:** Checks if a URL already exists in a note before saving.
*   **Fully Configurable & Detailed Notifications:** All paths are customizable, and notifications tell you exactly which notes were modified.

***

## Installation and Setup

This is a two-part setup. You must install **both** the Obsidian plugin and the Chrome extension for the system to work.

### Part 1: Obsidian Plugin Setup

1.  **Locate the Plugin Folder:** In this repository, find the `.obsidian` directory. Inside it is a folder named `bookmark-saver-wizard`. This is the plugin.

2.  **Move the Plugin Folder:** Copy the entire `bookmark-saver-wizard` folder and place it inside your own Obsidian vault's plugin directory, which is located at `YourVault/.obsidian/plugins/`.

    > **Note:** The `.obsidian` folder is hidden by default. You may need to enable "Show Hidden Files" on your operating system to see it.

3.  **Activate the Plugin:**
    *   Open Obsidian. Go to `Settings` > `Community plugins`.
    *   You should see "Bookmark Saver Wizard" in your list. **Click the toggle switch to enable it.**

4.  **Configure the Plugin:**
    *   In `Settings`, under "Community Plugins", click on the "Bookmark Saver Wizard" tab.
    *   Set the "Base Folder", "Characters Folder", and "Shows Folder" to match your desired structure (e.g., `Bookmarks`, `Characters`, `Shows`).
    *   **Crucially, these paths must exactly match the settings in the Chrome Extension.**

### Part 2: Chrome Extension Setup

1.  **Load the Extension:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Toggle on **Developer mode** in the top-right corner.
    *   Click **Load unpacked** and select the root folder of this repository.

2.  **Configure the Extension:**
    *   The "Obsidian Bookmark Saver" will now appear in your list.
    *   **Right-click** on its icon in the Chrome toolbar and select **Options**.
    *   Fill out all the fields to match your vault name and the paths you configured in the Obsidian plugin.
    *   Click "Save Settings".

3.  **(Optional) Configure Keyboard Shortcuts:**
    *   Navigate to `chrome://extensions/shortcuts` to view and change shortcuts for all save actions.

Congratulations! The setup is complete.

***

## How to Use

#### Smart Save
This is the primary action. It saves the URL to your general note and to any notes where **both the primary name and the source material** are found in the page title.
*   **Keyboard Shortcut:** Check `chrome://extensions/shortcuts`.
*   **Popup Button:** Click the extension icon, then click "Smart Save".

#### Targeted Save (Manual Override)
The perfect solution for pages that lack clear title information.
1.  Click the extension icon.
2.  Type a partial or full note name into the "Save to a specific note" input field. The search is forgiving.
3.  Click "Targeted Save" or press Enter. The extension will find the single best match and save to it.

#### Delete Bookmark
Removes the current page's URL from all notes it exists in, automatically re-numbering the lists.
1.  Click the extension icon.
2.  Click the "Delete Bookmark from Notes" button.
3.  Confirm the action in the dialog box that appears.

#### Other Save Actions
The popup also contains buttons for direct saves (`Immediate`, `Basic`, etc.) to specific, pre-configured notes without any smart matching.

## Formatting Smart-Sort Notes

To get the most out of the **Smart Save**, you must name your notes using the following format:

**`Primary Name -- Details`**

*   **Primary Name:** The character or show name.
    *   Can contain multiple aliases separated by a comma (e.g., `Main Name, Nickname`).
    *   Multi-word names are order-agnostic.
*   **Separator:** Two dashes surrounded by spaces (` -- `).
*   **Details:** The source material (e.g., series, game).
    *   Can also contain multiple aliases separated by a comma (e.g., `Full Source Name, Abbreviation`).
*   **Exception:** For special favorite notes that should match on name alone, use `OGFAV` as the detail (e.g., `My Favorite Character -- OGFAV`).

#### Examples:
*   `Character A, Alias A -- Source Series, SSS`
*   `Show Title`
*   `Favorite Character -- OGFAV`

***

## Troubleshooting

*   **Problem:** I get an error notification: "Error: Could not save. Is Obsidian running?"
    *   **Solution:** The Obsidian application must be running with the "Bookmark Saver Wizard" plugin enabled.

*   **Problem:** Smart Save isn't finding a match.
    *   **Solution:** Remember that Smart Save is strict. It requires a match for BOTH the name and the source material from the note's title. For name-only matching, use the `OGFAV` tag or Targeted Save.

*   **Problem:** I changed the plugin's `main.js` file, but it's not working.
    *   **Solution:** You must force Obsidian to reload the plugin. Go to `Settings > Community plugins`, toggle the plugin OFF, and then back ON.

## The Why
I built this plugin for speed and convenience. Built-in bookmark managers tend to lag heavily at higher bookmark counts. Having all of your bookmarks with one sole browser provider is not super ideal for being able to conveniently swap between browsers and overall have access to one's bookmarks.

## Can The Setup Be Simpler?
Not really, I highly doubt Obsidian and Chrome would truly allow for an extension that requires a 3rd-party program with its own plugin and extra setup... well... Chrome might allow. Unless proven otherwise this is the way.
