import {
	App,
	PluginSettingTab,
	Setting, ExtraButtonComponent, ButtonComponent
} from "obsidian";
import snippetDownloader from "./main";
import {removeSnippet} from "./removeSnippet";
import {SnippetDownloaderModals} from "./modals/simpleCommands";
import {addSnippet, updateRepo, updateSpecificSnippet} from "./addSnippets";
import {getAllSnippet} from "./modals/updateSnippets";
import {basename} from "./utils";
import {addExcludedSnippet, getExcludedSnippets} from "./modals/excludeSnippet";

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

function getDetailsState(name: string) {
	for (let i=0; i < document.getElementsByTagName('details').length; i++) {
		const details = document.getElementsByTagName('details')[i] as HTMLDetailsElement;
		if (details.innerText.split('\n')[0] === name) {
			return details.hasAttribute('open');
		}
	}
	return true;
}

function openDetails(name: string, detailsState: boolean) {
	const allDetails = document.getElementsByTagName('details');
	for (let i = 0; i<allDetails.length; i++) {
		const details = allDetails[i] as HTMLDetailsElement;
		if (details.innerText.split('\n')[0] === name && detailsState) {
			details.setAttr('open', 'true');
			details.open = true;
			details.setAttribute('open', 'true');
		} else if (details.innerText.split('\n')[0] === name && !detailsState) {
			details.removeAttribute('open');
			details.setAttribute('open', 'false');
		}
	}
}


export class SnippetDownloaderTabs extends PluginSettingTab {
	plugin: snippetDownloader;

	constructor(app: App, plugin: snippetDownloader) {
		super(app, plugin);
		this.plugin = plugin;
	}


	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		const allSnippets = getAllSnippet(this.plugin.settings);

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
		const desc_plugins = document.createDocumentFragment();
		desc_plugins.createEl('span', {text:`The following is a list of the repository added via the command palette `
	});
		desc_plugins.createEl('div', {text:`Click the x button next to a repository to remove it from the list.`
	})
		desc_plugins.createEl("b", { text: "Note: " });
		desc_plugins.createEl('span', {text:"This does not delete the linked snippet, this should be done from your "});
		desc_plugins.createEl("code", { text: ".obsidian/snippets" }).setAttribute("style", "font-family: var(--font-monospace)");
		desc_plugins.createEl('span', {text:" folder"} );
		new Setting(containerEl)
			.setName('Repository Snippet List')
			.setDesc(desc_plugins)
			.addButton((btn:ButtonComponent)=>{
				btn
					.setIcon('plus')
					.setTooltip('Add new repository')
					.onClick(async () => {
						new SnippetDownloaderModals(this.app, async (result) => {
						if (result) {
							const newSettings = await addSnippet(result.trim(), this.plugin.settings, this.app.vault);
							await this.plugin.updateList(newSettings);
							const detailState = getDetailsState(result);
							this.display();
							openDetails(result, detailState);
							}
						}).open();
					})
			})
			.addButton((btn:ButtonComponent)=>{
				btn
					.setIcon('install')
					.setTooltip('Update all repository')
					.onClick(async () => {
						this.plugin.updateAllSnippets();
					})
			});
		for (const repoPath of this.plugin.settings.snippetList) {
			const details = containerEl.createEl('details');

			const repoName = repoPath.repo.replace('https://github.com/','')
			const summary = details.createEl('summary', { text: repoName });
			summary.addClass('snippets-downloader-summary');
			new Setting(summary)
				.setClass('snippets-downloader-options')
				.addButton((btn:ButtonComponent)=>{
					btn
						.setClass('snippets-downloader-options-button')
						.setIcon("cross")
						.setTooltip("Delete this repository from the list")
						.onClick(async()=>{
							btn.buttonEl.parentElement.remove();
							const newSettings=removeSnippet(repoPath.repo, this.plugin.settings.snippetList, this.plugin.settings.errorSnippet);
							await this.plugin.updateList(newSettings);
							const detailState = getDetailsState(repoName);
							this.display();
							openDetails(repoName, detailState);
						})
					})
				.addButton((btn:ButtonComponent)=>{
					btn
						.setClass('snippets-downloader-options-button')
						.setIcon("sync")
						.setTooltip("Update this repository")
						.onClick(async()=>{
							const allSettings = await updateRepo(repoPath.repo, this.plugin.settings.snippetList, this.app.vault, this.plugin.settings.excludedSnippet, this.plugin.settings.errorSnippet);
							await this.plugin.updateList(allSettings);
						})
				})
			for(const snippets of repoPath.snippetsContents) {
				new Setting(details)
					.setName(basename(snippets.name))
					.setClass('snippets-downloader-settings')
					.addExtraButton((btn:ExtraButtonComponent)=>{
						btn
							.setTooltip('Update this snippet')
							.setIcon('install')
							.onClick(async ()=>{
								const updatedList = await updateSpecificSnippet(allSnippets.find(s => snippets.name === s.snippetPath), this.plugin.settings);
								await this.plugin.updateList(updatedList);
							})

					})
					.addExtraButton((btn:ExtraButtonComponent)=>{
						btn
							.setTooltip('Remove this snippet')
							.setIcon('trash')
							.onClick(async ()=>{
								btn.extraSettingsEl.parentElement.parentElement.remove();
								const updatedList = await addExcludedSnippet(getExcludedSnippets(this.plugin.settings).find(s => snippets.name === s.snippetPath), this.plugin.settings);
								await this.plugin.updateList(updatedList);
							})
					})
			}

		}
	}
}

