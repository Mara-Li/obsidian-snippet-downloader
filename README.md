# Obsidian Snippet Downloader

This plugin is here to help you to download and update css snippet that are on a GitHub repository.

The plugin will download all css snippet on a repository, unless :
- There are two big (< 1MB)
- There are named `obsidian.css` (use BRAT for themes)
- There are excluded (see settings & excluded)

In setting, you can :
- Delete a repository. Warning ! It will not delete the snippet from your `.obsidian/snippet` folder.
- Exclude file from the download / update. You can use the name, or a wildcard. 


So, the commands added by the plugins are :
- **Adding new Snippet** : Use `https://github.com/username/repo` or `username/repo` to add a new repository and download the present css snippet.
- **Update All snippet** : Update all repository and their snippet (unless you exclude them).
- **Update Specific snippet** : You can just update one snippet using its name.
- **Update Specific Repository** : You can just update one repository using its name.

💡Note : The file will be updated only if there is a new commit ! It's not based on the file contents.

<table>
<tbody>
	<tr>
		<td>⚠️</td>
		<td><ul><li>The plugin can't work without the <code>snippets</code> folder in your <code>obsidian</code> : you need to create it before use the plugin for the first time.</li><li> Each update will erase any edit you made on the snippet !</li></ul></td>
	</tr>
</tbody>
</table>

## Installation
- Use [BRAT-42](https://github.com/TfTHacker/obsidian42-brat) to install the plugin.
- Use the community plugin market.

## Developpements
- `git clone git@github.com:Mara-Li/obsidian-snippet-downloader.git`
- `npm install`
- `npm run dev`

*Credit to BRAT-42, where I take some idea and code !*

💡If one day BRAT-42 or Obsidian add a similary function, this plugin will be deleted !

🗒️It exists a limit of 60 API call for non identified user... That's mean you can download more than 60 times in a row ! 
