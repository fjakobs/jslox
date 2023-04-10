import * as vscode from "vscode";
import { activateLanguageClient, deactivateLanguageClient } from "./lsp-client";

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "jslox" is now active!');

    let disposable = vscode.commands.registerCommand("jslox.helloWorld", () => {
        vscode.window.showInformationMessage("Hello World from jslox!");
    });

    context.subscriptions.push(disposable);

    activateLanguageClient(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
    deactivateLanguageClient();
}
