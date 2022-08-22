import {Plugin} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	SnippetDownloaderSettings,
	SnippetDownloaderTabs, SnippetRepo
} from "./settings";
import {SnippetDownloaderModals} from "./modals/simpleCommands";
import {RepoDownloader, SpecificSnippetDownloader} from "./modals/updateSnippets";
import {ExcludeSnippet} from "./modals/excludeSnippet";
import {addSnippet, updateRepo} from "./addSnippets";

export default class snippetDownloader extends Plugin {
	settings: SnippetDownloaderSettings;

	async updateAllSnippets() {
		if (this.settings.snippetList.length > 0) {
			const snippetList = this.settings.snippetList;
			const errorSnippet = this.settings.errorSnippet;
			const excludedSnippet = this.settings.excludedSnippet;
			let updatedSettings = [errorSnippet, snippetList];
			for (const repoName of snippetList) {
				//@ts-ignore
				updatedSettings= await updateRepo(repoName.repo, snippetList, this.app.vault, excludedSnippet, errorSnippet);
				this.settings.snippetList = <SnippetRepo[]>updatedSettings[1];
				this.settings.errorSnippet = <string>updatedSettings[0];
			}
			await this.saveSettings();
		}
	}
	
	async updateList(newSettings: SnippetRepo[] | (string | SnippetRepo[])[]){
		this.settings.snippetList = <SnippetRepo[]>newSettings[0];
		this.settings.errorSnippet = <string>newSettings[1];
		await this.saveSettings();
	}

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'add-snippet',
			name: 'Adding new snippet',
			callback: ()=> {
				new SnippetDownloaderModals(this.app, async (result) => {
					if (result) {
						const newSettings = await addSnippet(result.trim(), this.settings, this.app.vault);
						await this.updateList(newSettings);
					}
				}).open();
			}
		});

		this.addCommand({
			id: 'update-all-snippets',
			name: 'Update all snippets',
			//@ts-ignore
			checkCallback: async (checking: boolean) => {
				if (this.settings.snippetList.length > 0) {
					if (!checking) {
						const snippetList = this.settings.snippetList;
						const errorSnippet = this.settings.errorSnippet;
						const excludedSnippet = this.settings.excludedSnippet;
						let updatedSettings = [errorSnippet, snippetList];
						for (const repoName of snippetList) {
							//@ts-ignore
							updatedSettings= await updateRepo(repoName.repo, snippetList, this.app.vault, excludedSnippet, errorSnippet);
							await this.updateList(updatedSettings);
						}
						await this.saveSettings();
					}
					return true;

				} return false;
			}
		});

		this.addCommand({
			id: 'update-specific-repo',
			name: 'Update specific repository',
			hotkeys:[],
			checkCallback: (checking:boolean) => {
				if (this.settings.snippetList.length > 0){
					if (!checking) {
						new RepoDownloader(this.app, this.settings, this).open();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'update-specific-snippet',
			name: 'Update specific snippet',
			hotkeys:[],
			checkCallback: (checking:boolean) => {
				if (this.settings.snippetList.length > 0) {
					if (!checking) {
						new SpecificSnippetDownloader(this.app, this.settings, this).open();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'remove-specific-snippet',
			name: 'Exclude specific snippet',
			hotkeys:[],
			checkCallback: (checking:boolean) => {
				if (this.settings.snippetList.length > 0) {
					if (!checking) {
						new ExcludeSnippet(this.app, this.settings, this).open();
					}
					return true;
				}
				return false;
			}
		})

		this.addSettingTab(new SnippetDownloaderTabs(this.app, this));


	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
