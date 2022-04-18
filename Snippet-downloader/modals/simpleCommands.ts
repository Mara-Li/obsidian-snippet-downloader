import { App, Modal, Setting } from "obsidian";
export class SnippetDownloaderModals extends Modal {
	result: string;
	onSubmit: (result: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.createEl("h1", { text: "Repo Links" });
		new Setting(contentEl)
			.setName("Repo Link")
			.addText((text) => {
				text.onChange((value) => {
					this.result = value;
				});
			})
		new Setting(contentEl)
			.addButton((btn) =>{
				btn
					.setButtonText("Submit")
					.setCta()
					.onClick(() => {
						this.close()
						this.onSubmit(this.result);
					});
			})
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
