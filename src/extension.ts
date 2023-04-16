import * as vscode from "vscode";
import { activateLanguageClient, deactivateLanguageClient } from "./lsp-client";

export function activate(context: vscode.ExtensionContext) {
    activateLanguageClient(context);
}

export function deactivate() {
    deactivateLanguageClient();
}
