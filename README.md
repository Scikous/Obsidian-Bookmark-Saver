# Obsidian Bookmark Saver & Companion Plugin

> **Note for Firefox Users:** This README is for the Firefox version of the extension, located in the `firefox` branch. The original Chrome version can be found on the `main` branch.

This project is a powerful, two-part system designed to silently save browser tabs from Mozilla Firefox directly into your Obsidian vault with intelligent, configurable sorting.

It consists of:
1.  **A Mozilla Firefox Add-on:** Captures tab information, provides the user interface (popup & shortcuts), and communicates with the plugin.
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

This is a two-part setup. You must install **both** the Obsidian plugin and the Firefox add-on for the system to work.

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
    *   **Crucially, these paths must exactly match the settings in the Firefox Add-on.**

### Part 2: Firefox Add-on Setup

Due to Firefox's security policies, permanently installing a local, unsigned add-on requires a few extra steps compared to Chrome. Here are the two best methods.

#### Option A: The Developer Method (Recommended for personal use)

This method uses a special version of Firefox to disable signature checking, making it easy to install and update the add-on locally.

1.  **Install Firefox Developer Edition or Nightly:** Download and install either of these versions, as they allow you to disable signature enforcement.
2.  **Disable Signature Requirement:**
    *   Open a new tab and navigate to `about:config`.
    *   Accept the "Proceed with Caution" warning.
    *   In the search bar, type `xpinstall.signatures.required`.
    *   Click the toggle button to set its value to **`false`**.
3.  **Install the Add-on:**
    *   Navigate to `about:addons`.
    *   Click the gear icon (Tools for all add-ons) in the top-right.
    *   Select **Install Add-on From File...**.
    *   Navigate to the root folder of this repository and select the `manifest.json` file.

#### Option B: The Official Method (Standard Firefox)

This method involves creating a free Firefox Developer account to have Mozilla "sign" your personal copy of the add-on.

1.  **Package the Add-on:** Create a `.zip` file containing all the files and folders from the root of this repository.
2.  **Create a Firefox Add-ons Account:** If you don't have one, sign up at [addons.mozilla.org](https://addons.mozilla.org/).
3.  **Submit for Signing:**
    *   Go to the [Developer Hub](https://addons.mozilla.org/en-US/developers/) and click "Submit a New Add-on".
    *   When asked "How do you want to distribute this version?", choose **On your own**. This keeps it private and unlisted.
    *   Upload your `.zip` file and follow the prompts. The automated review is usually very fast.
4.  **Install the Signed File:**
    *   Once it's signed, you will be given a link to download the `.xpi` file (e.g., `some_name-1.0-fx.xpi`).
    *   Drag and drop this `.xpi` file directly into your Firefox window to install it.

#### Final Configuration Steps (For both methods)

1.  **Configure the Add-on:**
    *   Navigate to `about:addons`.
    *   Find "Obsidian Bookmark Saver" in your list, click the `...` menu, and select **Preferences**.
    *   Fill out all the fields to match your vault name and the paths you configured in the Obsidian plugin.
    *   Click "Save Settings".
2.  **(Optional) Configure Keyboard Shortcuts:**
    *   Navigate to `about:addons`, click the gear icon, and select **Manage Extension Shortcuts** to view and change shortcuts for all save actions.

Congratulations! The setup is complete.

***

## How to Use

#### Smart Save
This is the primary action. It saves the URL to your general note and to any notes where **both the primary name and the source material** are found in the page title.
*   **Keyboard Shortcut:** Check your shortcuts via `about:addons`.
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

*   **Problem:** When I open the popup, the text field for 'Targeted Save' isn't focused automatically.
    *   **Solution:** This is a known quirk with Firefox. For unknown reasons, the auto-focus is inconsistent. Simply press the **`Tab`** key once after opening the popup to focus the input field.

*   **Problem:** I changed the plugin's `main.js` file, but it's not working.
    *   **Solution:** You must force Obsidian to reload the plugin. Go to `Settings > Community plugins`, toggle the plugin OFF, and then back ON.

## The Why
I built this plugin for speed and convenience. Built-in bookmark managers tend to lag heavily at higher bookmark counts. Having all of your bookmarks with one sole browser provider is not super ideal for being able to conveniently swap between browsers and overall have access to one's bookmarks.

## Can The Setup Be Simpler?
Not really, I highly doubt Obsidian and a browser would truly allow for an extension that requires a 3rd-party program with its own plugin and extra setup. Unless proven otherwise this is the way.
