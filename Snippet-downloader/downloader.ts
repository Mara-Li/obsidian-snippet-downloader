import {Octokit} from "@octokit/core";
import { Base64 } from "js-base64";
import { ResponseHeaders } from "@octokit/types";
import {normalizePath, Vault, request} from "obsidian";
import {
	SnippetDownloaderSettings,
	SnippetInformation,
} from "./settings";
import {searchExcluded, basename} from "./utils";

//@ts-ignore
async function fetchListSnippet(repoRecur: { headers?: ResponseHeaders; status?: 200; url?: string; data: any; }, snippetList: SnippetInformation[], settings: SnippetDownloaderSettings, repoPath: string) {
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

export async function listSnippetfromRepo(repoPath: string, settings: SnippetDownloaderSettings): Promise<SnippetInformation[]> {
	const octokit = new Octokit();
	const repo = repoPath.replace('https://github.com/', '')
	const owner = repo.split('/')[0]
	const repoName = repo.split('/')[1]
	console.log(`Repo: ${repoPath}, owner: ${owner}, repoName: ${repoName}`)
	const snippetList: SnippetInformation[] | PromiseLike<SnippetInformation[]> = [];
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

export async function checkLastUpdate(snippetName:SnippetInformation, repoPath: string) {
	const oldDate = new Date (snippetName.lastUpdate);
	const newDate= new Date(await grabLastCommitDate(repoPath, snippetName.name));
	return (oldDate < newDate)
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
		console.log(file.status)
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

