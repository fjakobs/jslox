import { ErrorReporter, defaultErrorReporter } from "./Error";
import { Binary, Expr, Grouping, Literal, Unary } from "./Expr";
import { Token, TokenType } from "./Token";

export class ParseError extends Error {
    constructor(token: Token | undefined, message: string) {
        super(`[line ${token?.line || 0}] Error: ${message}`);
    }
}

export class Parser {
    private current: Token | undefined = undefined;
    private previous: Token | undefined = undefined;
    private isAtEnd: boolean = false;

    constructor(
        private readonly tokens: Generator<Token>,
        private readonly errorReporter: ErrorReporter = defaultErrorReporter
    ) {}

    parse(): Expr | null {
        try {
            this.advance();
            return this.expression();
        } catch (e) {
            if (e instanceof ParseError) {
                return null;
            } else {
                throw e;
            }
        }
    }

    private expression(): Expr {
        return this.equality();
    }

    private equality(): Expr {
        let expr = this.comparison();

        while (this.match("BANG_EQUAL", "EQUAL_EQUAL")) {
            const operator = this.previous;
            const right = this.comparison();
            expr = new Binary(expr, operator!, right);
        }

        return expr;
    }

    private comparison(): Expr {
        let expr = this.term();

        while (this.match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
            const operator = this.previous;
            const right = this.term();
            expr = new Binary(expr, operator!, right);
        }

        return expr;
    }

    private term(): Expr {
        let expr = this.factor();

        while (this.match("MINUS", "PLUS")) {
            const operator = this.previous;
            const right = this.factor();
            expr = new Binary(expr, operator!, right);
        }

        return expr;
    }

    private factor(): Expr {
        let expr = this.unary();

        while (this.match("SLASH", "STAR")) {
            const operator = this.previous;
            const right = this.unary();
            expr = new Binary(expr, operator!, right);
        }

        return expr;
    }

    private unary(): Expr {
        if (this.match("BANG", "MINUS")) {
            const operator = this.previous;
            const right = this.unary();
            return new Unary(operator!, right);
        }

        return this.primary();
    }

    private primary(): Expr {
        if (this.match("FALSE")) {
            return new Literal(false);
        }

        if (this.match("TRUE")) {
            return new Literal(true);
        }

        if (this.match("NIL")) {
            return new Literal(null);
        }

        if (this.match("NUMBER", "STRING")) {
            return new Literal(this.previous!.literal!);
        }

        if (this.match("LEFT_PAREN")) {
            const expr = this.expression();
            this.consume("RIGHT_PAREN", "Expect ')' after expression.");
            return new Grouping(expr);
        }

        this.error(this.current!, "Expect expression.");
    }

    private synchronize(): void {
        this.advance();

        while (!this.isAtEnd) {
            if (this.previous?.type === "SEMICOLON") {
                return;
            }

            switch (this.current?.type) {
                case "CLASS":
                case "FUN":
                case "VAR":
                case "FOR":
                case "IF":
                case "WHILE":
                case "PRINT":
                case "RETURN":
                    return;
            }

            this.advance();
        }
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    private advance(): Token | undefined {
        this.previous = this.current;
        const next = this.tokens.next();
        this.current = next.value;
        if (next.done) {
            this.isAtEnd = true;
        }

        return this.previous;
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd) {
            return false;
        }

        return this.current?.type === type;
    }

    private consume(type: TokenType, message: string): Token | undefined {
        if (this.check(type)) {
            return this.advance();
        }

        this.error(this.current!, message);
    }

    private error(token: Token | undefined, message: string): never {
        this.errorReporter.error(token?.line || 0, message);
        throw new ParseError(token, message);
    }
}
