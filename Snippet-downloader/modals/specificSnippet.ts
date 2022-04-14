import {App, FuzzySuggestModal, Notice} from "obsidian";
import snippetDownloader from "../main";
import {snippetDownloaderSettings} from "../settings";
import {
	checkLastUpdate,
	downloadSnippet,
	grabLastCommitDate
} from "../downloader";
import {basename, searchExcluded} from "../utils";

interface snippetUpdate {
	repo: string;
	snippetPath: string;
}

async function updateSpecificSnippet(item: snippetUpdate, settings: snippetDownloaderSettings) {
	const listSnippet = settings.snippetList
	const snippet = listSnippet.find(snippet => snippet.repo === item.repo);
	for (const contents of snippet.snippetsContents) {
		if (contents.name === item.snippetPath && await checkLastUpdate(contents, item.repo)) {
			const successDownload = await downloadSnippet(item.repo, contents.name, this.app.vault);
			if (successDownload) {
				contents.lastUpdate = await grabLastCommitDate(item.repo, contents.name);
				new Notice (`${basename(item.snippetPath)} has been updated 🎉`);
				return listSnippet;
			} else {
				console.log("Error downloading snippet");
			}
		}
	}
	new Notice (`${basename(item.snippetPath)} is already up to date 💡`);
	return listSnippet;
}


function getAllSnippet(settings: snippetDownloaderSettings) {
	const allSnippet: snippetUpdate[] = [];
	for (const snippet of settings.snippetList) {
		for (const snippetContent of snippet.snippetsContents) {
			if (snippetContent.name !== 'obsidian.css' && !searchExcluded(settings, snippetContent.name)) {
				allSnippet.push({
				repo: snippet.repo,
				snippetPath: snippetContent.name,
			});
			}
		}
	}
	return allSnippet
}

export class specificSnippetDownloader extends FuzzySuggestModal<snippetUpdate> {
	app: App;
	settings: snippetDownloaderSettings;
	plugin: snippetDownloader;

	constructor(app: App, settings: snippetDownloaderSettings, plugin: snippetDownloader) {
		super(app);
		this.settings = settings;
		this.plugin = plugin;
	}

	getItemText(item: snippetUpdate): string {
		return basename(item.snippetPath);
	}

	getItems(): snippetUpdate[] {
		return getAllSnippet(this.settings)
	}

	async onChooseItem(item: snippetUpdate, evt: MouseEvent | KeyboardEvent) {
		this.settings.snippetList = await updateSpecificSnippet(item, this.settings);
		await this.plugin.saveSettings();
	}
}
