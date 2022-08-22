import {App, FuzzySuggestModal, Notice} from "obsidian";
import {SnippetDownloaderSettings} from "../settings";
import snippetDownloader from "../main";
import {basename, searchExcluded} from "../utils";
import {removeSnippetFromExcluded} from "../removeSnippet";

export interface SnippetExclude {
	repo: string;
	snippetPath: string;
}

export function getExcludedSnippets(settings: SnippetDownloaderSettings) {
	const allSnippet: SnippetExclude[] = [];
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

export async function addExcludedSnippet(item: SnippetExclude, settings: SnippetDownloaderSettings){
	let excludedSnippet = settings.excludedSnippet;
	excludedSnippet = excludedSnippet + ', ' + item.snippetPath;
	const snippetList = removeSnippetFromExcluded(item.repo, settings.snippetList, settings.errorSnippet, excludedSnippet);
	return [snippetList, excludedSnippet];
}

export class ExcludeSnippet extends FuzzySuggestModal<SnippetExclude> {
	app: App;
	settings: SnippetDownloaderSettings;
	plugin: snippetDownloader;

	constructor(app: App, settings: SnippetDownloaderSettings, plugin:snippetDownloader){
		super(app);
		this.settings = settings;
		this.plugin = plugin;
	}

	getItemText(item: SnippetExclude): string {
		return basename(item.snippetPath);
	}

	getItems(): SnippetExclude[] {
		return getExcludedSnippets(this.settings)
	}

	async onChooseItem(item: SnippetExclude, evt: MouseEvent | KeyboardEvent) {
		const newSettings=await addExcludedSnippet(item, this.settings);
		await this.plugin.updateList(newSettings);
		new Notice(`${basename(item.snippetPath)} has been excluded! 🎉`)
	}
}
