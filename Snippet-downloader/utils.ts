export function searchExcluded(excludedSnippet: string, name: string): boolean {
	if (excludedSnippet.length < 1) {
		return false;
	}
	const excluded = excludedSnippet.split(",").map(e => {return e.trim();}).filter(x=>x.length>0)
	for (const excl of excluded){
		if (excl === name.replace('.css', '').trim()){
			return true;
		}
		if (name.match(new RegExp(excl))){
			return true;
		}
	}
	return false;
}

export function basename(path: string) {
   return path.split('/').reverse()[0];
}
