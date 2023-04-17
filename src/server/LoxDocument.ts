import { Diagnostic, DiagnosticSeverity, DocumentSymbol, Position } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ErrorReporter } from "../jslox/Error";
import { Scanner } from "../jslox/Scanner";
import { Parser } from "../jslox/Parser";
import { Resolver } from "../jslox/Resolver";
import { Token } from "../jslox/Token";
import { SemanticToken, SemanticTokenAnalyzer } from "./SemanticTokenAnalyzer";

export class LoxDocument {
    public diagnostics: Diagnostic[] = [];
    public hadError: boolean = false;
    public definitions: Map<Token, Token[]> = new Map();
    public references: Map<Token, Token> = new Map();
    public semanticTokens: SemanticToken[] = [];
    public documentSymbols?: DocumentSymbol[];

    constructor(public document: TextDocument) {}

    analyze() {
        const source = this.document.getText();

        this.diagnostics = [];
        this.semanticTokens = [];

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

        if (statements && !this.hadError) {
            const analyzer = new SemanticTokenAnalyzer();
            analyzer.analyze(statements, resolver);
            this.semanticTokens = analyzer.tokens;
            this.documentSymbols = analyzer.documentSymbols;
        }

        this.definitions = resolver.definitions;
        this.references = resolver.references;
    }

    findAllFromPosition(position: Position): Token[] {
        const offset = this.document.offsetAt(position);
        let definition: Token | undefined = undefined;
        for (const [def, references] of this.definitions) {
            if (def.start <= offset && def.end >= offset) {
                definition = def;
                break;
            }

            for (const reference of references || []) {
                if (reference.start <= offset && reference.end >= offset) {
                    definition = def;
                    break;
                }
            }
        }
        if (!definition) {
            return [];
        }

        return [definition, ...(this.definitions.get(definition) || [])];
    }
}
