# Obsidian Snippet Downloader

This plugin is here to help you to download and update css snippet that are on a GitHub repository.

The plugin will download all css snippet on a repository, unless :
- There are two big (< 1MB)
- There are named `obsidian.css` (use BRAT for themes)
- There are present in the settings for exclude snippet.

In setting, you can :
- Delete a repository. Warning ! It will not delete the snippet from your `.obsidian/snippet` folder.
- Exclude file from the download / update. You can use the name, or a regex. 

⚠️ The plugin can't work without the `snippets` folder in your `.obsidian` : you need to create it before use the plugin for the first time.

## Installation
- Use [BRAT-42](https://github.com/TfTHacker/obsidian42-brat) to install the plugin.
- Use the community plugin market.

## Developpements
- `git clone git@github.com:Mara-Li/obsidian-snippet-downloader.git`
- `npm install`
- `npm run dev`
