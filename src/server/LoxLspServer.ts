import {
    Definition,
    DefinitionLink,
    DocumentHighlight,
    DocumentHighlightKind,
    DocumentSymbol,
    HandlerResult,
    Location,
    Position,
    PublishDiagnosticsParams,
    Range,
    SemanticTokens,
    SemanticTokensBuilder,
    SymbolInformation,
    TextDocuments,
    TextEdit,
    WorkspaceEdit,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Token } from "../jslox/Token";
import { TOKEN_TO_ID } from "./SemanticTokenAnalyzer";
import { LoxDocument } from "./LoxDocument";

type LspEventListner = ((type: "diagnostics", params: PublishDiagnosticsParams) => void) &
    ((type: "foo", params: any) => void);

export class LoxLspServer {
    loxDocuments: Map<string, LoxDocument> = new Map();

    constructor(private documents: TextDocuments<TextDocument>, private listener: LspEventListner) {
        this.documents.onDidChangeContent((change) => {
            this.onDidChangeContent(change.document.uri);
        });

        this.documents.onDidClose((event) => {
            this.loxDocuments.delete(event.document.uri);
        });
    }

    onDidChangeContent(uri: string) {
        let loxDocument = this.loxDocuments.get(uri);
        if (!loxDocument) {
            const document = this.documents.get(uri);
            if (document) {
                loxDocument = new LoxDocument(document);
                this.loxDocuments.set(uri, loxDocument);
            }
        }

        if (loxDocument) {
            loxDocument.analyze();
            this.listener("diagnostics", {
                uri: uri,
                diagnostics: loxDocument.diagnostics,
            });
        }
    }

    onDefinition(uri: string, position: Position): Definition | DefinitionLink[] | null {
        const loxDocument = this.loxDocuments.get(uri);
        if (!loxDocument) {
            return null;
        }

        const offset = loxDocument.document.offsetAt(position);
        for (const [reference, definition] of loxDocument.references) {
            if (reference.start <= offset && reference.end >= offset) {
                return {
                    uri: loxDocument.document.uri,
                    range: {
                        start: loxDocument.document.positionAt(definition.start),
                        end: loxDocument.document.positionAt(definition.end),
                    },
                };
            }
        }
        return null;
    }

    onReferences(uri: string, position: Position): HandlerResult<Location[] | null | undefined, void> {
        const loxDocument = this.loxDocuments.get(uri);
        if (!loxDocument) {
            return null;
        }

        const offset = loxDocument.document.offsetAt(position);

        for (const [definition, references] of loxDocument.definitions) {
            if (definition.start <= offset && definition.end >= offset) {
                const locations: Location[] = [];
                for (const reference of references || []) {
                    locations.push({
                        uri: loxDocument.document.uri,
                        range: {
                            start: loxDocument.document.positionAt(reference.start),
                            end: loxDocument.document.positionAt(reference.end),
                        },
                    });
                }
                return locations;
            }
        }
        return null;
    }

    onSemanticTokens(uri: string): HandlerResult<SemanticTokens, void> {
        const loxDocument = this.loxDocuments.get(uri);
        if (!loxDocument || !loxDocument.semanticTokens) {
            return { data: [] };
        }

        const builder = new SemanticTokensBuilder();
        for (const token of loxDocument.semanticTokens) {
            const { line, character } = loxDocument.document.positionAt(token.start);
            const length = token.end - token.start;
            const typeId = TOKEN_TO_ID[token.type];

            console.log(token, typeId);
            builder.push(line, character, length, typeId, 0);
        }

        return builder.build();
    }

    onDocumentSymbol(uri: string): HandlerResult<SymbolInformation[] | DocumentSymbol[] | null | undefined, void> {
        const loxDocument = this.loxDocuments.get(uri);
        if (!loxDocument || !loxDocument.documentSymbols) {
            return [];
        }

        return loxDocument.documentSymbols;
    }

    onRename(uri: string, position: Position, newName: string): HandlerResult<WorkspaceEdit | null | undefined, void> {
        const loxDocument = this.loxDocuments.get(uri);
        if (!loxDocument || !loxDocument.definitions) {
            return null;
        }

        const edits: Array<TextEdit> = loxDocument.findAllFromPosition(position).map((token) => {
            return {
                range: {
                    start: loxDocument.document.positionAt(token.start),
                    end: loxDocument.document.positionAt(token.end),
                },
                newText: newName,
            };
        });

        return {
            changes: {
                [uri]: edits,
            },
        };
    }

    onPrepareRename(
        uri: string,
        position: Position
    ): HandlerResult<
        Range | { range: Range; placeholder: string } | { defaultBehavior: boolean } | null | undefined,
        void
    > {
        const loxDocument = this.loxDocuments.get(uri);
        if (!loxDocument || !loxDocument.definitions) {
            return null;
        }

        const offset = loxDocument.document.offsetAt(position);
        for (const definition of loxDocument.definitions.keys()) {
            if (definition.start <= offset && definition.end >= offset) {
                return {
                    range: {
                        start: loxDocument.document.positionAt(definition.start),
                        end: loxDocument.document.positionAt(definition.end),
                    },
                    placeholder: definition.lexeme,
                };
            }
            for (const reference of loxDocument.definitions.get(definition) || []) {
                if (reference.start <= offset && reference.end >= offset) {
                    return {
                        range: {
                            start: loxDocument.document.positionAt(reference.start),
                            end: loxDocument.document.positionAt(reference.end),
                        },
                        placeholder: reference.lexeme,
                    };
                }
            }
        }
        return null;
    }

    onDocumentHighlight(uri: string, position: Position): HandlerResult<DocumentHighlight[] | null | undefined, void> {
        const loxDocument = this.loxDocuments.get(uri);
        if (!loxDocument || !loxDocument.definitions) {
            return null;
        }

        const symbols = loxDocument.findAllFromPosition(position);
        if (!symbols.length) {
            return null;
        }

        return symbols.map((symbol) => {
            return {
                range: {
                    start: loxDocument.document.positionAt(symbol.start),
                    end: loxDocument.document.positionAt(symbol.end),
                },
                kind: DocumentHighlightKind.Text,
            };
        });
    }
}
