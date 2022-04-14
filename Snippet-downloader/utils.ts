import {snippetDownloaderSettings} from "./settings";
import globRegex from 'glob-regex';
export function searchExcluded(settings: snippetDownloaderSettings, name: string): boolean {
	if (settings.excludedSnippet.length < 1) {
		return false;
	}
	const excluded = settings.excludedSnippet.split(",");
	for (const excl of excluded){
		if (excl.trim() === name.replace('.css', '')){
			return true;
		}
		const regExcl = globRegex(excl.trim());
		if (name.match(regExcl)){
			return true;
		}
	}
}

export function basename(path: string) {
   return path.split('/').reverse()[0];
}
