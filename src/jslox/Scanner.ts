import { ErrorReporter, defaultErrorReporter } from "./Error";
import { Token, TokenType } from "./Token";

const keywords: Record<string, TokenType> = {
    and: "AND",
    class: "CLASS",
    else: "ELSE",
    false: "FALSE",
    for: "FOR",
    fun: "FUN",
    if: "IF",
    nil: "NIL",
    or: "OR",
    print: "PRINT",
    return: "RETURN",
    super: "SUPER",
    this: "THIS",
    true: "TRUE",
    var: "VAR",
    while: "WHILE",
    break: "BREAK", // non standard
    continue: "CONTINUE", // non standard
};

export class Scanner {
    private start = 0;
    private current = 0;
    private line = 1;

    constructor(private readonly source: string, readonly errorReporter: ErrorReporter = defaultErrorReporter) {}

    *scanTokens(): Generator<Token> {
        while (!this.isAtEnd()) {
            this.start = this.current;
            yield* this.scanToken();
        }

        yield new Token("EOF", "", undefined, this.line, this.start, this.current);
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private *scanToken(): Generator<Token> {
        const c = this.advance();
        switch (c) {
            case "(":
                yield this.makeToken("LEFT_PAREN");
                break;
            case ")":
                yield this.makeToken("RIGHT_PAREN");
                break;
            case "{":
                yield this.makeToken("LEFT_BRACE");
                break;
            case "}":
                yield this.makeToken("RIGHT_BRACE");
                break;
            case ",":
                yield this.makeToken("COMMA");
                break;
            case ".":
                yield this.makeToken("DOT");
                break;
            case "-":
                yield this.makeToken("MINUS");
                break;
            case "+":
                yield this.makeToken("PLUS");
                break;
            case ";":
                yield this.makeToken("SEMICOLON");
                break;
            case "*":
                yield this.makeToken("STAR");
                break;
            case "!":
                yield this.makeToken(this.match("=") ? "BANG_EQUAL" : "BANG");
                break;
            case "=":
                yield this.makeToken(this.match("=") ? "EQUAL_EQUAL" : "EQUAL");
                break;
            case "<":
                yield this.makeToken(this.match("=") ? "LESS_EQUAL" : "LESS");
                break;
            case ">":
                yield this.makeToken(this.match("=") ? "GREATER_EQUAL" : "GREATER");
                break;
            case "/":
                if (this.match("/")) {
                    while (this.peek() !== "\n" && !this.isAtEnd()) {
                        this.advance();
                    }
                } else {
                    yield this.makeToken("SLASH");
                }
                break;

            case " ":
            case "\r":
            case "\t":
                break;

            case "\n":
                this.line++;
                break;

            case '"':
                yield* this.string();
                break;

            default:
                if (this.isDigit(c)) {
                    yield* this.number();
                } else if (this.isAlpha(c)) {
                    yield* this.identifier();
                } else {
                    this.errorReporter.error(
                        {
                            line: this.line,
                            start: this.current,
                            end: this.current + 1,
                        },
                        "Unexpected character."
                    );
                }
                break;
        }
    }

    private advance() {
        return this.source.charAt(this.current++);
    }

    private peek(): string {
        if (this.isAtEnd()) {
            return "\0";
        }
        return this.source.charAt(this.current);
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) {
            return "\0";
        }

        return this.source.charAt(this.current + 1);
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) {
            return false;
        }
        if (this.source.charAt(this.current) !== expected) {
            return false;
        }

        this.current++;
        return true;
    }

    private isDigit(c: string): boolean {
        return c.charCodeAt(0) >= "0".charCodeAt(0) && c.charCodeAt(0) <= "9".charCodeAt(0);
    }

    private isAlpha(c: string): boolean {
        return (
            (c.charCodeAt(0) >= "a".charCodeAt(0) && c.charCodeAt(0) <= "z".charCodeAt(0)) ||
            (c.charCodeAt(0) >= "A".charCodeAt(0) && c.charCodeAt(0) <= "Z".charCodeAt(0)) ||
            c === "_"
        );
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private *string(): Generator<Token> {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() === "\n") {
                this.line++;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            this.errorReporter.error(
                {
                    line: this.line,
                    start: this.current,
                    end: this.current + 1,
                },
                "Unterminated string."
            );
            return;
        }

        // The closing "
        this.advance();

        const value = this.source.substring(this.start + 1, this.current - 1);
        yield this.makeToken("STRING", value);
    }

    private *identifier(): Generator<Token> {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }

        const text = this.source.substring(this.start, this.current);
        yield this.makeToken(keywords[text] || "IDENTIFIER");
    }

    private *number(): Generator<Token> {
        while (this.isDigit(this.peek())) {
            this.advance();
        }

        if (this.peek() === "." && this.isDigit(this.peekNext())) {
            this.advance();

            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }

        yield this.makeToken("NUMBER", parseFloat(this.source.substring(this.start, this.current)));
    }

    private makeToken(type: TokenType, literal?: string | number | boolean): Token {
        const text = this.source.substring(this.start, this.current);
        return new Token(type, text, literal, this.line, this.start, this.current);
    }
}
