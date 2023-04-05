import { ErrorReporter, defaultErrorReporter } from "./Error";
import { Binary, Expr, Grouping, Literal, Print, Stmt, Unary, Variable, VariableDeclaration } from "./Expr";
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

    parse(): Array<Stmt> | null {
        this.advance();
        if (this.isAtEnd) {
            return [];
        }

        const statements: Array<Stmt> = [];
        while (!this.isAtEnd) {
            const declaration = this.declaration();
            if (declaration) {
                statements.push(declaration);
            }
        }
        return statements;
    }

    parseExpression(): Expr | null {
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

    private declaration(): Stmt | null {
        try {
            if (this.match("VAR")) {
                return this.varDeclaration();
            } else {
                return this.statement();
            }
        } catch (e) {
            if (e instanceof ParseError) {
                this.synchronize();
                return null;
            } else {
                throw e;
            }
        }
    }

    private varDeclaration(): Stmt {
        const name = this.consume("IDENTIFIER", "Expect variable name.");

        let initializer: Expr | null = null;
        if (this.match("EQUAL")) {
            initializer = this.expression();
        }

        this.consume("SEMICOLON", "Expect ';' after variable declaration.");
        return new VariableDeclaration(name, initializer || new Literal(null));
    }

    private statement(): Stmt {
        if (this.match("PRINT")) {
            return this.printStatement();
        }

        return this.expressionStatement();
    }

    private printStatement(): Stmt {
        const value = this.expression();
        this.consume("SEMICOLON", "Expect ';' after value.");
        return new Print(value);
    }

    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume("SEMICOLON", "Expect ';' after expression.");
        return expr;
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

        if (this.match("IDENTIFIER")) {
            return new Variable(this.previous!);
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

    private advance(): Token {
        this.previous = this.current;
        const next = this.tokens.next();
        this.current = next.value;
        if (next.done || next.value.type === "EOF") {
            this.isAtEnd = true;
        }

        return this.previous!;
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd) {
            return false;
        }

        return this.current?.type === type;
    }

    private consume(type: TokenType, message: string): Token {
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
