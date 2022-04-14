import {Plugin} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	snippetDownloaderSettings,
	snippetDownloaderTabs
} from "./settings";
import {snippetDownloaderModals} from "./modals/simpleCommands";
import {repoDownloader} from "./modals/specificRepo";
import {specificSnippetDownloader} from "./modals/specificSnippet";
import {addSnippet, updateSnippet} from "./downloader";

export default class snippetDownloader extends Plugin {
	settings: snippetDownloaderSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'add-snippet',
			name: 'Adding new snippet',
			callback: ()=> {
				new snippetDownloaderModals(this.app, async (result) => {
					if (result) {
						this.settings.snippetList = await addSnippet(result, this.settings, this.app.vault);
						await this.saveSettings();
					}
				}).open();
			}
		});

		this.addCommand({
			id: 'update-all-snippets',
			name: 'Update all snippets',
			callback: async () => {
				const snippetList = this.settings.snippetList;
				for (const repoName of snippetList) {
					await updateSnippet(repoName.repo, snippetList, this.app.vault)
				}
				this.settings.snippetList = snippetList;
				await this.saveSettings();
			}
		});
		this.addCommand({
			id: 'update-specific-repo',
			name: 'Update specific repository',
			hotkeys:[],
			callback: async() => {
				new repoDownloader(this.app, this.settings, this).open();
		}
		});

		this.addCommand({
			id: 'update-specific-snippet',
			name: 'Update specific snippet',
			hotkeys:[],
			callback: async() => {
				new specificSnippetDownloader(this.app, this.settings, this).open();
		}
		});

		this.addSettingTab(new snippetDownloaderTabs(this.app, this));


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
