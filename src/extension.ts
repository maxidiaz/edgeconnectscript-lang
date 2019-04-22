import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "edge-completion" is now active!');
	const extPath = path.join(__dirname, "../commands/")

	const completionItems = {};

	fs.readdir(extPath, (err, files) => {
		if (!err) {
			files.forEach(file => {
				const currentCompItems = [];
				const compItemName = file.split('.')[0];

				fs.readFile(path.join(extPath, file), 'UTF-8', (err, fileData) => {
					if (err) return;
					const compItemArray = JSON.parse(fileData);

					compItemArray.forEach(data => {
						const compItem = new vscode.CompletionItem(data.name, vscode.CompletionItemKind.Method);
						compItem.documentation = data.documentation;
						if (data.snippet) {
							compItem.insertText = new vscode.SnippetString(data.snippet);
						} else {
							if (data.insertText) {
								compItem.insertText = data.insertText;
							}
						}
						currentCompItems.push(compItem);
					});

					completionItems[compItemName] = currentCompItems;
				})
			})
		}
	})

	function buildCompletionProvider(selectors: string[], completionListName: string, triggerChar: string) {
		return vscode.languages.registerCompletionItemProvider(
			[{ language: "*", scheme: 'file' }, { language: "*", scheme: 'untitled' }],
			{
				provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
					let linePrefix = document.lineAt(position).text.substr(0, position.character);

					let runProvider = false;

					if (selectors) {
						for (let i = 0; i < selectors.length; i++) {
							if (linePrefix.endsWith(selectors[i])) {
								runProvider = true;
							}
						}
					} else {
						runProvider = true;
					}

					if (!runProvider) {
						return undefined;
					}
					console.log("should show suggestions " + completionListName);

					return completionItems[completionListName];
				}
			}, triggerChar
		);
	}

	const completionProviders = [
		buildCompletionProvider(["$"], "COMMAND", "$"),
		buildCompletionProvider(["ITEM."], "ITEM", "."),
		buildCompletionProvider(["ITEM.DATAGROUP()."], "DATAGROUP", "."),
		buildCompletionProvider(["ITEM.DATAITEM()."], "DATAITEM", "."),
		buildCompletionProvider(["ITEM.DATAITEM().LISTITEM()."], "DATAITEM_LISTITEM", "."),
		buildCompletionProvider(["ITEM.DATAITEM().VALUE()."], "DATAITEM_VALUE", "."),
		buildCompletionProvider(["ITEM.DATAITEM().TYPE()."], "DATAITEM_TYPE", "."),
		buildCompletionProvider(["PHASE."], "PHASE", "."),
		buildCompletionProvider(["PROCESS."], "PROCESS", "."),
		buildCompletionProvider(["TABLE."], "TABLE", "."),
		buildCompletionProvider(null, "WIDGET_KEYWORDS", null),
		buildCompletionProvider(null, "SYSTEM_WORDS", null),
		buildCompletionProvider(["DEVICE_INFO."], "DEVICE_INFO", "."),
	]

	context.subscriptions.push(...completionProviders);
}

// this method is called when your extension is deactivated
export function deactivate() { }