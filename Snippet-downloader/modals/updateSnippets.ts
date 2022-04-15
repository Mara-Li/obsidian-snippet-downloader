import {App, FuzzySuggestModal} from "obsidian";
import {snippetDownloaderSettings, snippetRepo} from "../settings";
import {updateRepo, updateSpecificSnippet} from "../addSnippets";
import snippetDownloader from "../main";
import {basename, searchExcluded} from "../utils";

interface repoUpdate {
	repoName: string;
	repoUrl: string;
}

export interface snippetUpdate {
	repo: string;
	snippetPath: string;
}

function getAllRepo(settings: snippetDownloaderSettings){
	const repoAll=[];
	for(const repo of settings.snippetList){
		repoAll.push({
			repoName: repo.repo,
			repoUrl: ''
		});
	}
	return repoAll
}

function getAllSnippet(settings: snippetDownloaderSettings) {
	const allSnippet: snippetUpdate[] = [];
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

export class repoDownloader extends FuzzySuggestModal<repoUpdate> {
	app: App;
	settings: snippetDownloaderSettings;
	plugin: snippetDownloader;

	constructor(app: App, settings: snippetDownloaderSettings, plugin:snippetDownloader){
		super(app);
		this.settings = settings;
		this.plugin = plugin;
	}

	getItemText(item: repoUpdate): string {
		return item.repoName
	}
	getItems(): repoUpdate[] {
		return getAllRepo(this.settings)
	}

	async onChooseItem(item: repoUpdate, evt: MouseEvent | KeyboardEvent) {
		const allSettings = await updateRepo(item.repoName, this.settings.snippetList, this.app.vault, this.settings.excludedSnippet, this.settings.errorSnippet);
		this.settings.snippetList =<snippetRepo[]>allSettings[1];
		this.settings.errorSnippet=<string>allSettings[0];
		await this.plugin.saveSettings();
	}

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
		const newList = await updateSpecificSnippet(item, this.settings);
		this.settings.snippetList = <snippetRepo[]>newList[0];
		this.settings.errorSnippet = <string>newList[1];
		await this.plugin.saveSettings();
	}
}
