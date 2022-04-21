import globRegex from 'glob-regex';

export function searchExcluded(excludedSnippet: string, name: string): boolean {
	if (excludedSnippet.length < 1) {
		return false;
	}
const excluded = test.split(",").map(e => {return e.trim();}).filter(x=>x.length>0)
	for (const excl of excluded){
		if (excl === name.replace('.css', '').trim()){
			return true;
		}
		const regExcl = globRegex(excl);
		if (name.match(regExcl)){
			return true;
		}
		const regPureExcl= new RegExp(excl)
		if (name.match(regPureExcl)) {
			return true;
		}	
	}
	return false;
}

export function basename(path: string) {
   return path.split('/').reverse()[0];
}
