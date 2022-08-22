import {SnippetDownloaderSettings, SnippetRepo} from "./settings";
import {Notice, Vault} from "obsidian";
import {
	checkLastUpdate,
	downloadSnippet, grabLastCommitDate,
	listSnippetfromRepo
} from "./downloader";
import {basename, searchExcluded} from "./utils";
import {SnippetUpdate} from "./modals/updateSnippets";
import {removeSnippetFromExcluded} from "./removeSnippet"

export async function addSnippet(repoPath: string, settings: SnippetDownloaderSettings, vault: Vault) {
	const snippetList = settings.snippetList;
	let excludedSnippet = settings.errorSnippet;
	const catchErrors: string[] = [];
	if (!snippetList.some(snippet => snippet.repo === repoPath)) {
		const newSnippetList = await listSnippetfromRepo(repoPath, settings);
		if (newSnippetList.length === 0) {
			new Notice('Error 😿, snippet or repository not found')
			return snippetList;
		}
		snippetList.push({
			repo: repoPath,
			snippetsContents: await listSnippetfromRepo(repoPath, settings)
		})
		const snippet = snippetList.find(snippet => snippet.repo === repoPath)
		for (const snippetContents of snippet.snippetsContents) {
			const success=await downloadSnippet(repoPath, snippetContents.name, vault)
			if (!success) {
				excludedSnippet += snippetContents.name.replace('.css', '') + ', ';
				catchErrors.push(snippetContents.name.replace('.css', ''));
			}
		}
		let messageNotice = `Successfully added ${repoPath}. ${newSnippetList.length} snippets added. 🎉`
		if (catchErrors.length > 0) {
			messageNotice += `\n${catchErrors.length} snippets not added😿: ${catchErrors.join(', ')}`
		}
		new Notice(messageNotice);
		return [snippetList, excludedSnippet]
	}
	new Notice ('Error : this repo is already in the list 😿');
	return [snippetList, excludedSnippet]
}

export async function updateRepo(repoPath: string, snippetList: SnippetRepo[], vault: Vault, excludedSnippets: string, errorSnippets: string) {
	const snippet = snippetList.find(snippet => snippet.repo === repoPath);
	if (snippet) {
		for (const snippetContent of snippet.snippetsContents) {
			if (await checkLastUpdate(snippetContent, repoPath) && (snippetContent.name !== 'obsidian.css') && (!searchExcluded(excludedSnippets, snippetContent.name)) && (!searchExcluded(errorSnippets, snippetContent.name)))
			{
				const successDownloaded=await downloadSnippet(repoPath, snippetContent.name, vault)
				if (successDownloaded) {
					snippetContent.lastUpdate = await grabLastCommitDate(repoPath, snippetContent.name);
				} else {
					errorSnippets += snippetContent.name.replace('.css', '') + ', ';
				}
			}
		}
	}
	snippetList = removeSnippetFromExcluded(repoPath,snippetList, errorSnippets, excludedSnippets);
	new Notice(`${repoPath} successfully updated 🎉`);
	return [snippetList, errorSnippets];
}

export async function updateSpecificSnippet(item: SnippetUpdate, settings: SnippetDownloaderSettings) {
	let listSnippet = settings.snippetList
	let excludedSnippet = settings.errorSnippet
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
			excludedSnippet =excludedSnippet + item.snippetPath.replace('.css', '') + ', ';
			listSnippet = removeSnippetFromExcluded(item.repo,listSnippet, excludedSnippet, settings.excludedSnippet);
			return [listSnippet,
						excludedSnippet];
		}
	}
	listSnippet = removeSnippetFromExcluded(item.repo,listSnippet, excludedSnippet, settings.excludedSnippet);
	new Notice (`${basename(item.snippetPath)} is already up to date 💡`);
	return [listSnippet,
			excludedSnippet];
}
