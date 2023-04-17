/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { LoxLspServer } from "./LoxLspServer";
import { TOKEN_LEGEND } from "./SemanticTokenAnalyzer";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const loxServer = new LoxLspServer(documents, (type, params) => {
    switch (type) {
        case "diagnostics":
            connection.sendDiagnostics(params);
            break;

        default:
            break;
    }
});

let hasWorkspaceFolderCapability = false;
let hasSemanticTokensCapability = false;
let hasSymbolProviderCapability = false;
let hasRenameCapability = false;

connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities;

    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasSemanticTokensCapability = !!capabilities.textDocument?.semanticTokens?.requests?.full;
    hasSymbolProviderCapability = !!capabilities.textDocument?.documentSymbol?.hierarchicalDocumentSymbolSupport;
    hasRenameCapability = !!capabilities.textDocument?.rename?.prepareSupport;

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            definitionProvider: true,
            referencesProvider: true,
        },
    };

    if (hasRenameCapability) {
        result.capabilities.renameProvider = {
            prepareProvider: true,
        };
    }

    if (hasSymbolProviderCapability) {
        console.log(capabilities.textDocument?.semanticTokens);
        result.capabilities.documentSymbolProvider = true;
    }

    if (hasSemanticTokensCapability) {
        console.log(capabilities.textDocument?.semanticTokens);
        result.capabilities.semanticTokensProvider = {
            legend: {
                tokenTypes: TOKEN_LEGEND.concat(),
                tokenModifiers: [],
            },
            range: false,
            full: true,
        };
    }

    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }
    return result;
});

connection.onInitialized(() => {
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders((_event) => {
            connection.console.log("Workspace folder change event received.");
        });
    }
});

connection.onPrepareRename((params: TextDocumentPositionParams) => {
    return loxServer.onPrepareRename(params.textDocument.uri, params.position);
});

connection.onRenameRequest((params) => {
    return loxServer.onRename(params.textDocument.uri, params.position, params.newName);
});

connection.onDefinition((params: TextDocumentPositionParams) => {
    return loxServer.onDefinition(params.textDocument.uri, params.position);
});

connection.onReferences((params: TextDocumentPositionParams) => {
    return loxServer.onReferences(params.textDocument.uri, params.position);
});

connection.onDocumentSymbol((params) => {
    return loxServer.onDocumentSymbol(params.textDocument.uri);
});

connection.languages.semanticTokens.on((params) => {
    return loxServer.onSemanticTokens(params.textDocument.uri);
});

documents.listen(connection);
connection.listen();
