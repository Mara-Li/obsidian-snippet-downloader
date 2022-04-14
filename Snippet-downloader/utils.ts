import {snippetDownloaderSettings} from "./settings";

export function searchExcluded(settings: snippetDownloaderSettings, name: string): boolean {
	const excluded = settings.excludedSnippet.split(",");
	if (excluded.length <= 1) {
		return false;
	}
	for (const excl of excluded){
		if (excl.trim() === name.replace('.css', '')){
			return true;
		}
		const regExcl = new RegExp(excl.trim());
		if (name.match(regExcl)){
			return true;
		}
	}
}

export function basename(path: string) {
   return path.split('/').reverse()[0];
}
