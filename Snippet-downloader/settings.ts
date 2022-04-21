import {
	App,
	PluginSettingTab,
	Setting,
	ButtonComponent
} from "obsidian";
import snippetDownloader from "./main";
import {removeSnippet} from "./removeSnippet";

export interface SnippetInformation {
  name: string;
  lastUpdate: string;
}

export interface SnippetRepo {
	repo: string;
	snippetsContents: SnippetInformation[];
}

export interface SnippetDownloaderSettings {
	snippetList:SnippetRepo[];
	excludedSnippet:string;
	errorSnippet: string;
}

export const DEFAULT_SETTINGS: SnippetDownloaderSettings = {
	snippetList: [],
	excludedSnippet: "",
	errorSnippet: "",
};

export class SnippetDownloaderTabs extends PluginSettingTab {
	plugin: snippetDownloader;

	constructor(app: App, plugin: snippetDownloader) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Snippet Manager Settings'});

		new Setting(containerEl)
			.setName('Excluded Snippet')
			.setDesc('Type the snippet name you want to exclude from the list, without the extension. Glob and regex can work. Separate by comma.')
			.addTextArea(text => text
				.setPlaceholder('BadCSS I hate, badCSS*')
				.setValue(this.plugin.settings.excludedSnippet)
				.onChange(async (value) => {
					this.plugin.settings.excludedSnippet = value;
					await this.plugin.saveSettings();
				}));
		containerEl.createEl("hr");
		containerEl.createEl("h2", { text: "Repository Snippet List" });
		containerEl.createEl("div", { text: `The following is a list of the repository added via the command palette ` });
		containerEl.createEl("p");
		containerEl.createEl("div", { text: `Click the x button next to a repository to remove it from the list.` });
		containerEl.createEl("p");
		containerEl.createEl("span")
			.createEl("b", { text: "Note: " })
		containerEl.createSpan({ text: "This does not delete the linked snippet, this should be done from your .obsidian/snippet folder." });

		for (const repoPath of this.plugin.settings.snippetList) {
			const repoName = repoPath.repo.replace('https://github.com/','')
			new Setting(containerEl)
				.setName(repoName)
				.addButton((btn:ButtonComponent)=>{
					btn.setIcon("cross");
					btn.setTooltip("Delete this repository from the list");
					btn.onClick(async()=>{
						btn.buttonEl.parentElement.remove();
						const newSettings=removeSnippet(repoPath.repo, this.plugin.settings.snippetList, this.plugin.settings.errorSnippet);
						this.plugin.settings.snippetList=<SnippetRepo[]>newSettings[0]
						this.plugin.settings.errorSnippet=<string>newSettings[1]
						await this.plugin.saveSettings();
					})
				})

		}
	}
}

