import {App, FuzzySuggestModal, Notice} from "obsidian";
import {snippetDownloaderSettings, snippetRepo} from "../settings";
import snippetDownloader from "../main";
import {basename, searchExcluded} from "../utils";
import {removeSnippetFromExcluded} from "../removeSnippet";

interface snippetExclude {
	repo: string;
	snippetPath: string;
}

function getAllSnippet(settings: snippetDownloaderSettings) {
	const allSnippet: snippetExclude[] = [];
	for (const snippet of settings.snippetList) {
		for (const snippetContent of snippet.snippetsContents) {
			if (snippetContent.name !== 'obsidian.css' && !searchExcluded(settings.excludedSnippet, snippetContent.name) && !searchExcluded(settings.errorSnippet, snippetContent.name)) {
				allSnippet.push({
				repo: snippet.repo,
				snippetPath: snippetContent.name,
			});
			}
		}
	}
	return allSnippet
}

async function addExcludedSnippet(item: snippetExclude, settings: snippetDownloaderSettings){
	let excludedSnippet = settings.excludedSnippet;
	excludedSnippet = excludedSnippet + ', ' + item.snippetPath;
	const snippetList = removeSnippetFromExcluded(item.repo, settings.snippetList, settings.errorSnippet, excludedSnippet);
	return [snippetList, excludedSnippet];
}

export class excludeSnippet extends FuzzySuggestModal<snippetExclude> {
	app: App;
	settings: snippetDownloaderSettings;
	plugin: snippetDownloader;

	constructor(app: App, settings: snippetDownloaderSettings, plugin:snippetDownloader){
		super(app);
		this.settings = settings;
		this.plugin = plugin;
	}

	getItemText(item: snippetExclude): string {
		return basename(item.snippetPath);
	}

	getItems(): snippetExclude[] {
		return getAllSnippet(this.settings)
	}

	async onChooseItem(item: snippetExclude, evt: MouseEvent | KeyboardEvent) {
		const newSettings=await addExcludedSnippet(item, this.settings);
		this.settings.snippetList = <snippetRepo[]>newSettings[0];
		this.settings.excludedSnippet = <string>newSettings[1];
		await this.plugin.saveSettings();
		new Notice(`${basename(item.snippetPath)} has been excluded! 🎉`)
	}
}
