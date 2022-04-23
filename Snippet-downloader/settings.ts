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
		const desc_excluder = document.createDocumentFragment();
		desc_excluder.createEl('span', null, (span)=>{
			span.innerText='Type the snippet name you want to exclude from the list, without the extension.\nYou can also use regex, for example: ';
			span.createEl('code', {text: '^(.*)$'});
			span.createEl('span', {text:' will match all snippets.\n\n'});
			span.createEl('a', null, (link)=>{
				link.innerText='You can check your regex here.';
				link.href='https://regex101.com/';
			})
		})
		new Setting(containerEl)
			.setName('Excluded Snippet')
			.setDesc(desc_excluder)
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
		containerEl.createEl("span",{ text: "This does not delete the linked snippet, this should be done from your " });
		containerEl.createEl("code", { text: ".obsidian/snippets" }).setAttribute("style", "font-family: var(--font-monospace)");
		containerEl.createSpan({ text: " folder" });

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

