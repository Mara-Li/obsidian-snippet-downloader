import {Octokit} from "@octokit/core";
import { Base64 } from "js-base64";

import { ResponseHeaders } from "@octokit/types";
import {normalizePath, Notice, Vault, request} from "obsidian";
import {
	snippetDownloaderSettings,
	snippetInformation,
	snippetRepo
} from "./settings";
import {searchExcluded, basename} from "./utils";

//@ts-ignore
async function fetchListSnippet(repoRecur: { headers?: ResponseHeaders; status?: 200; url?: string; data: any; }, snippetList: snippetInformation[], settings: snippetDownloaderSettings, repoPath: string) {
	for (const data of repoRecur.data.tree) {
		if (data.path.endsWith('.css') && !searchExcluded(settings.excludedSnippet, data.path) && data.path != 'obsidian.css' && !searchExcluded(settings.errorSnippet, data.path)) {
			const snippetName = data.path
			const snippetLastUpdate = await grabLastCommitDate(repoPath, data.path);
			snippetList.push({
				name: snippetName,
				lastUpdate: snippetLastUpdate
			})
		}
	}
	return snippetList;
}

async function grabLastCommitInfo(repoPath: string, filepath:string) {
	const repoName = repoPath.replace('https://github.com/', '');
	const url = `https://api.github.com/repos/${repoName}/commits?path=${encodeURIComponent(filepath)}&page=1&per_page=1`;
	try {
		const response = await request({url:url})
		return (response === "404: Not Found" ? null : JSON.parse(response));
	} catch (error) {
		console.log("error in grabcommitinfo", error)
	}
}

export async function grabLastCommitDate(repoPath:string, filepath:string) {
	const test = await grabLastCommitInfo(repoPath, filepath);
	console.log(`Testing from ${repoPath} : ${filepath} => ${test[0].commit.author.date}`)
	//@ts-ignore
	if (test[0].commit.author.date) {
		//@ts-ignore
		return test[0].commit.author.date;
	} else {
		return "";
	}
}


async function listSnippetfromRepo(repoPath: string, settings: snippetDownloaderSettings): Promise<snippetInformation[]> {
	const octokit = new Octokit();
	const repo = repoPath.replace('https://github.com/', '')
	const owner = repo.split('/')[0]
	const repoName = repo.split('/')[1]
	console.log(`Repo: ${repoPath}, owner: ${owner}, repoName: ${repoName}`)
	const snippetList: snippetInformation[] | PromiseLike<snippetInformation[]> = [];
	try {
		const repoRecur = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
			owner: owner,
			repo: repoName,
			tree_sha: 'main',
			recursive: "true"
		});
		return await fetchListSnippet(repoRecur, snippetList, settings, repoPath);

	} catch (e) {
		try {
			const repoRecur = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
				owner: owner,
				repo: repoName,
				tree_sha: 'main',
				recursive: "true"
			});
			return await fetchListSnippet(repoRecur, snippetList, settings, repoPath);
		} catch (e) {
			console.log(e)
			return [];
		}
	}
}


export async function addSnippet(repoPath: string, settings: snippetDownloaderSettings, vault: Vault) {
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
			const Success=await downloadSnippet(repoPath, snippetContents.name, vault)
			if (!Success) {
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

function removeErrorSnippet(repoPath: string, errorSnippet: string, snippetList: snippetRepo[]){
	const snippet = snippetList.find(snippet => snippet.repo === repoPath)
	let errorSnippetList = errorSnippet.split(', ');
	for (const snippetContents of snippet.snippetsContents) {
		errorSnippetList=errorSnippetList.filter(v=>v!=snippetContents.name.replace('.css', '').trim());
	}
	console.log(errorSnippetList)
	return errorSnippetList.join(', ');
}

export function removeSnippet(repoPath: string, snippetList: snippetRepo[], errorSnippet: string) {
	if (snippetList.some(snippet => snippet.repo === repoPath)) {
		errorSnippet = removeErrorSnippet(repoPath, errorSnippet, snippetList)
		snippetList.splice(snippetList.findIndex(snippet => snippet.repo === repoPath), 1)
		new Notice('Repository successfully removed 🎉');
		return [snippetList, errorSnippet]
	}
	new Notice ('Error : this repo is not in the list 😿');
	return [snippetList, errorSnippet]

}

export async function checkLastUpdate(snippetName:snippetInformation, repoPath: string) {
	const oldDate = new Date (snippetName.lastUpdate);
	const newDate= new Date(await grabLastCommitDate(repoPath, snippetName.name));
	return (oldDate < newDate)
}

export async function updateSnippet(repoPath: string, snippetList: snippetRepo[], vault: Vault, excludedSnippets: string, errorSnippets: string) {
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
	new Notice(`${repoPath} successfully updated 🎉`);
	return [errorSnippets, snippetList];
}

export async function downloadSnippet(repoPath: string, snippetName: string, vault:Vault) {
	const repo = repoPath.replace('https://github.com/', '')
	const owner = repo.split('/')[0]
	const repoName = repo.split('/')[1]
	const octokit = new Octokit();
	const fileName = basename(snippetName)
	const filePath = normalizePath(vault.configDir + "/snippets/" + fileName)
	try {
		const file = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
			owner: owner,
			repo: repoName,
			path: snippetName
		});
		if (file.status === 200) {
			// @ts-ignore
			const fileContent = Base64.decode(file.data.content);
			const adapter = vault.adapter
			await adapter.write(filePath, fileContent)
			return true
		} else {
			return false
		}
	} catch (e) {
		console.log(e)
	}
}

