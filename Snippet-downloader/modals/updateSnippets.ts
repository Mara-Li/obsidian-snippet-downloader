import {App, FuzzySuggestModal} from "obsidian";
import {SnippetDownloaderSettings, SnippetRepo} from "../settings";
import {updateRepo, updateSpecificSnippet} from "../addSnippets";
import snippetDownloader from "../main";
import {basename, searchExcluded} from "../utils";

interface RepoUpdate {
	repoName: string;
	repoUrl: string;
}

export interface SnippetUpdate {
	repo: string;
	snippetPath: string;
}

function getAllRepo(settings: SnippetDownloaderSettings){
	const repoAll=[];
	for(const repo of settings.snippetList){
		repoAll.push({
			repoName: repo.repo,
			repoUrl: ''
		});
	}
	return repoAll
}

export function getAllSnippet(settings: SnippetDownloaderSettings) {
	const allSnippet: SnippetUpdate[] = [];
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

export class RepoDownloader extends FuzzySuggestModal<RepoUpdate> {
	app: App;
	settings: SnippetDownloaderSettings;
	plugin: snippetDownloader;

	constructor(app: App, settings: SnippetDownloaderSettings, plugin:snippetDownloader){
		super(app);
		this.settings = settings;
		this.plugin = plugin;
	}

	getItemText(item: RepoUpdate): string {
		return item.repoName
	}
	getItems(): RepoUpdate[] {
		return getAllRepo(this.settings)
	}

	async onChooseItem(item: RepoUpdate, evt: MouseEvent | KeyboardEvent) {
		const allSettings = await updateRepo(item.repoName, this.settings.snippetList, this.app.vault, this.settings.excludedSnippet, this.settings.errorSnippet);
		this.settings.snippetList =<SnippetRepo[]>allSettings[1];
		this.settings.errorSnippet=<string>allSettings[0];
		await this.plugin.saveSettings();
	}

}

export class SpecificSnippetDownloader extends FuzzySuggestModal<SnippetUpdate> {
	app: App;
	settings: SnippetDownloaderSettings;
	plugin: snippetDownloader;

	constructor(app: App, settings: SnippetDownloaderSettings, plugin: snippetDownloader) {
		super(app);
		this.settings = settings;
		this.plugin = plugin;
	}

	getItemText(item: SnippetUpdate): string {
		return basename(item.snippetPath);
	}

	getItems(): SnippetUpdate[] {
		return getAllSnippet(this.settings)
	}

	async onChooseItem(item: SnippetUpdate, evt: MouseEvent | KeyboardEvent) {
		const newList = await updateSpecificSnippet(item, this.settings);
		this.settings.snippetList = <SnippetRepo[]>newList[0];
		this.settings.errorSnippet = <string>newList[1];
		await this.plugin.saveSettings();
	}
}
