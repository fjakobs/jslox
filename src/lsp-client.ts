/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import { ExtensionContext } from "vscode";

import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node";

let client: LanguageClient;

export async function activateLanguageClient(context: ExtensionContext) {
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join("out", "server", "server.js"));

    let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions,
        },
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for lox documents
        documentSelector: [{ scheme: "file", language: "lox" }],
    };

    // Create the language client and start the client.
    client = new LanguageClient("loxLanguageServer", "Lox Language Server", serverOptions, clientOptions);

    // Start the client. This will also launch the server
    await client.start();
}

export function deactivateLanguageClient(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
