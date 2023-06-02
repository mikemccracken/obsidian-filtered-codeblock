import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { execSync } from "child_process";
//import { Convert } from "@rburns/ansi-to-html";

import {
    default as AnsiUp
} from 'ansi_up';

interface SlogBlockSettings {
	binpath: string;
}

const DEFAULT_SETTINGS: SlogBlockSettings = {
	binpath: 'hl'
}

export default class SlogBlock extends Plugin {
	settings: SlogBlockSettings;

	async onload() {
		await this.loadSettings();


    this.registerMarkdownCodeBlockProcessor("slog", (source, el, ctx) => {
		const dest = document.createElement('div')
   		const opts = {input: source, timeout: 60000}
		const output = execSync(this.settings.binpath + " -", opts)
    const ansi_up = new AnsiUp();

		const rows = output.toString().split("\n")
      for (let i = 0; i < rows.length; i++) {
		  let htmlized = ansi_up.ansi_to_html(rows[i]);
          let line = dest.createEl("div")
		  line.innerHTML = htmlized
		  line.style.fontFamily = "monospace"
		  line.style.font = "IBM Plex Mono"
       }
		el.replaceWith(dest)
    });

	//   This adds a settings tab so the user can configure various aspects of the plugin
	this.addSettingTab(new SlogBlockSettingTab(this.app, this));

			// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
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


class SlogBlockSettingTab extends PluginSettingTab {
	plugin: SlogBlock;

	constructor(app: App, plugin: SlogBlock) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for structured logging rewriting.'});

		new Setting(containerEl)
			.setName('filter binary')
			.setDesc('path to binary to filter the code block')
			.addText(text => text
				.setPlaceholder('hl')
				.setValue(this.plugin.settings.binpath)
				.onChange(async (value) => {
					console.log('bin path: ' + value);
					this.plugin.settings.binpath = value;
					await this.plugin.saveSettings();
				}));
	}
}
