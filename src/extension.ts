import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	vscode.languages.registerDefinitionProvider('html', new MyProvider());
	let disposable = vscode.commands.registerCommand('extension.openAngularComponent', () => { });
	context.subscriptions.push(disposable);
}

class MyProvider implements vscode.DefinitionProvider {
	provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition> {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const cursorPosition = editor.selection.start;
			const wordRange = editor.document.getWordRangeAtPosition(cursorPosition);
			const selectedText = editor.document.getText(wordRange);
			const workspace = vscode.workspace.getWorkspaceFolder(document.uri);
			const root = workspace ? workspace.uri : document.uri;

			return this.searchAndOpenFile(`${root.fsPath}/src/app`, selectedText, root);
		}
	}

	async searchAndOpenFile(dirname: string, searchTerm: string, root: any) {
		const fs = require('fs');
		const { promisify } = require('util');
		const path = require('path');
		const readdir = promisify(fs.readdir);
		const readfile = promisify(fs.readFile);
		const stat = promisify(fs.stat);
		let targetFile = "";

		const files = await readdir(dirname);
		for (let index = 0; index < files.length; index++) {
			let file = path.resolve(dirname, files[index]);

			file = await stat(file);

			if (file.isDirectory()) {
				const file: any = await this.searchAndOpenFile(dirname + '/' + files[index], searchTerm, root);
				if (file && file['uri'].path !== "/") {
					return file;
				}
			} else if (files[index].includes('component.ts')) {
				const content = await readfile(dirname + '/' + files[index], 'utf-8');
				if (content.includes("selector: '" + searchTerm + "'")) {
					targetFile = `${dirname}/${files[index]}`;
				}
			}
		}
		return new vscode.Location(
			root.with({
				path: targetFile
			}),
			new vscode.Position(0, 0));
	}
}