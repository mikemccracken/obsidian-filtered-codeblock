import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { execSync } from "child_process";

import {
    default as AnsiUp
} from 'ansi_up';

interface AllFilterSettings {
	filters: FilterArray;
}


interface FilterSettings {
	codeblocklabel: string;
	binpath: string;
	colorize: boolean;
	outputfont: string;
	firstlineextraargs: string; // TODO use first line as extra args if available
}

interface FilterArray extends Array<FilterSettings> {}

const SLOG = "slog"

const DEFAULT_SETTINGS: AllFilterSettings = {
	"filters": [{
		codeblocklabel: SLOG,
		binpath: 'hl',
		colorize: true,
		outputfont: 'IBM Plex Mono',
	},
				{
		codeblocklabel: "haha",
		binpath: 'hl',
		colorize: false,
		outputfont: 'Comic Sans',
	}]
}

export default class FilterBlock extends Plugin {
	settings: AllFilterSettings;

	async onload() {
		await this.loadSettings();

		for (let fidx = 0; fidx < this.settings.filters.length; fidx++) {
			let filter	= this.settings.filters[fidx]
			this.registerMarkdownCodeBlockProcessor(filter.codeblocklabel, (source, el, ctx) => {

				const dest = document.createElement('div')
				try{
   					const opts = {input: source, timeout: 60000}
					const output = execSync(filter.binpath + " -", opts)
					const ansi_up = new AnsiUp();

					const rows = output.toString().split("\n")
					for (let i = 0; i < rows.length; i++) {
						let htmlized = rows[i]
						if (filter.colorize){
							htmlized = ansi_up.ansi_to_html(htmlized)
						}
						let line = dest.createEl("div")
						line.innerHTML = htmlized
						line.style.fontFamily = "monospace"
						line.style.font = filter.outputfont
					}
				}catch (e){
					dest.createDiv(e.message)
				}
				el.replaceWith(dest)
			});
		}

		this.addSettingTab(new FilterSettingTab(this.app, this));

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class FilterSettingTab extends PluginSettingTab {
	plugin: FilterBlock;

	constructor(app: App, plugin: FilterBlock) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h1', {text: 'Settings for filtering code blocks through local cmdline tools.'});

		for (let i = 0; i < this.plugin.settings.filters.length; i++){

			let filterSetting = this.plugin.settings.filters[i]

			containerEl.createEl('h2', {text: 'Filter'});

			new Setting(containerEl)
				.setName('code block label')
				.setDesc('label you add to code block to run this filter')
				.addText(text => text
				.setPlaceholder('label')
				.setValue(filterSetting.codeblocklabel)
				.onChange(async (value) => {
					filterSetting.codeblocklabel = value;
					await this.plugin.saveSettings();
				}));

			new Setting(containerEl)
				.setName('filter binary')
				.setDesc('path and args to binary to filter the code block')
				.addText(text => text
				.setPlaceholder('path to binary and any cmdline args')
				.setValue(filterSetting.binpath)
				.onChange(async (value) => {
					filterSetting.binpath = value;
					await this.plugin.saveSettings();
				}));

			new Setting(containerEl)
				.setName('colorize')
				.setDesc('should we try to convert ansi color escapes')
				.addToggle(toggle => toggle
				.setValue(filterSetting.colorize)
				.onChange(async (value) => {
					filterSetting.colorize = value;
					await this.plugin.saveSettings();
				}));

			new Setting(containerEl)
				.setName('output font')
				.setDesc('font name to use for output')
				.addText(text => text
				.setPlaceholder('font name')
				.setValue(filterSetting.outputfont)
				.onChange(async (value) => {
					filterSetting.outputfont = value;
					await this.plugin.saveSettings();
				}));
			// todo add a button to remove the filter
		}
		// todo: add a button to add a filter
	}
}
