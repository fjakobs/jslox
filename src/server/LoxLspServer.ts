import {
    Definition,
    DefinitionLink,
    Diagnostic,
    DiagnosticSeverity,
    HandlerResult,
    Location,
    Position,
    PublishDiagnosticsParams,
    TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ErrorReporter } from "../jslox/Error";
import { Scanner } from "../jslox/Scanner";
import { Parser } from "../jslox/Parser";
import { Resolver } from "../jslox/Resolver";
import { Token } from "../jslox/Token";

export class LoxDocument {
    public diagnostics: Diagnostic[] = [];
    public hadError: boolean = false;
    public definitions: Map<Token, Token[]> = new Map();
    public references: Map<Token, Token> = new Map();

    constructor(public document: TextDocument) {}

    analyze() {
        const source = this.document.getText();

        this.diagnostics = [];
        this.hadError = false;
        const reporter: ErrorReporter = {
            error: (token: Token, message: string) => {
                this.hadError = true;
                const diagnostic: Diagnostic = {
                    severity: DiagnosticSeverity.Error,
                    range: {
                        start: this.document.positionAt(token.start),
                        end: this.document.positionAt(token.end),
                    },
                    message: message,
                    source: "Lox",
                };
                this.diagnostics.push(diagnostic);
            },
            warn: (token: Token, message: string) => {
                const diagnostic: Diagnostic = {
                    severity: DiagnosticSeverity.Warning,
                    range: {
                        start: this.document.positionAt(token.start),
                        end: this.document.positionAt(token.end),
                    },
                    message: message,
                    source: "Lox",
                };
                this.diagnostics.push(diagnostic);
            },
            runtimeError: function (): void {},
        };

        const tokens = new Scanner(source, reporter).scanTokens();
        const parser = new Parser(tokens, reporter);

        const statements = parser.parse();
        if (!statements || this.hadError) {
            return;
        }

        const resolver = new Resolver(reporter);
        resolver.resolve(statements);

        this.definitions = resolver.definitions;
        this.references = resolver.references;
    }
}

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
}
