import {App, FuzzySuggestModal} from "obsidian";
import {snippetDownloaderSettings, snippetRepo} from "../settings";
import {updateSnippet} from "../downloader";
import snippetDownloader from "../main";

interface repoUpdate {
	repoName: string;
	repoUrl: string;
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
