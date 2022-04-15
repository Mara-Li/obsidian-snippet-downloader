import {App, FuzzySuggestModal, Notice} from "obsidian";
import {snippetDownloaderSettings, snippetRepo} from "../settings";
import {updateSnippet, checkLastUpdate, downloadSnippet, grabLastCommitDate} from "../downloader";
import snippetDownloader from "../main";
import {basename, searchExcluded} from "../utils";

interface repoUpdate {
	repoName: string;
	repoUrl: string;
}

interface snippetUpdate {
	repo: string;
	snippetPath: string;
}

async function updateSpecificSnippet(item: snippetUpdate, settings: snippetDownloaderSettings) {
	const listSnippet = settings.snippetList
	const excludedSnippet = settings.excludedSnippet
	const snippet = listSnippet.find(snippet => snippet.repo === item.repo);
	const snippetsRep = snippet.snippetsContents.find(snippet => snippet.name === item.snippetPath);
	if (await checkLastUpdate(snippetsRep, item.repo)) {
		const successDownload = await downloadSnippet(item.repo, snippetsRep.name, this.app.vault);
		if (successDownload) {
			snippetsRep.lastUpdate = await grabLastCommitDate(item.repo, snippetsRep.name);
			new Notice(`${basename(item.snippetPath)} has been updated 🎉`);
				return [listSnippet,
						excludedSnippet];
		} else {
				return [listSnippet,
						excludedSnippet + ", " + item.snippetPath.replace('.css', '')];
		}
	}
	new Notice (`${basename(item.snippetPath)} is already up to date 💡`);
	return [listSnippet,
			excludedSnippet];
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
			if (snippetContent.name !== 'obsidian.css' && !searchExcluded(settings.excludedSnippet, snippetContent.name)) {
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
		const allSettings = await updateSnippet(item.repoName, this.settings.snippetList, this.app.vault, this.settings.excludedSnippet);
		this.settings.snippetList =<snippetRepo[]>allSettings[0];
		this.settings.excludedSnippet=<string>allSettings[1];
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
		this.settings.excludedSnippet = <string>newList[1];
		await this.plugin.saveSettings();
	}
}
