import {snippetRepo} from "./settings";
import {Notice} from "obsidian";
import {searchExcluded} from "./utils";

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

export function removeSnippetFromExcluded(repoPath: string, snippetList: snippetRepo[], errorSnippet: string, excludedSnippet: string) {
	const repo = snippetList.find(snippet => snippet.repo === repoPath)
	repo.snippetsContents=repo.snippetsContents.filter(snippet=>!searchExcluded(excludedSnippet, snippet.name) && !(searchExcluded(errorSnippet, snippet.name)))
	return snippetList
}
