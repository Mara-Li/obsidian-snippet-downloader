import globRegex from 'glob-regex';

export function searchExcluded(excludedSnippet: string, name: string): boolean {
	if (excludedSnippet.length < 1) {
		return false;
	}
	const excluded = excludedSnippet.split(",");
	for (const excl of excluded){
		if (excl.trim() === name.replace('.css', '').trim()){
			return true;
		}
		const regExcl = globRegex(excl.trim());
		if (name.match(regExcl)){
			return true;
		}
	}
	return false;
}

export function basename(path: string) {
   return path.split('/').reverse()[0];
}
