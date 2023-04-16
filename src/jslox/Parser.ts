import { ErrorReporter, defaultErrorReporter } from "./Error";
import {
    Assign,
    Binary,
    Block,
    BreakStmt,
    Call,
    ClassStmt,
    ContinueStmt,
    Expr,
    ForStmt,
    FunctionStmt,
    Get,
    Set,
    Grouping,
    IfStmt,
    Literal,
    Logical,
    PrintStmt,
    ReturnStmt,
    Stmt,
    Unary,
    Variable,
    VariableDeclaration,
    WhileStmt,
    ThisExpr,
    SuperExpr,
} from "./Expr";
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
            const expr = this.expression();
            if (this.isAtEnd) {
                return expr;
            }

            return null;
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
            if (this.match("FUN")) {
                return this.functionDeclaration("function");
            } else if (this.match("CLASS")) {
                return this.classDeclaration();
            } else if (this.match("VAR")) {
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

    private classDeclaration(): Stmt {
        const name = this.consume("IDENTIFIER", "Expect class name.");

        let superclass: Variable | null = null;
        if (this.match("LESS")) {
            this.consume("IDENTIFIER", "Expect superclass name.");
            superclass = new Variable(this.previous!);
        }

        this.consume("LEFT_BRACE", "Expect '{' before class body.");

        const methods: Array<FunctionStmt> = [];
        while (!this.check("RIGHT_BRACE") && !this.isAtEnd) {
            methods.push(this.functionDeclaration("method"));
        }

        this.consume("RIGHT_BRACE", "Expect '}' after class body.");

        return new ClassStmt(name, superclass, methods);
    }

    private functionDeclaration(kind: "function" | "method"): FunctionStmt {
        const name = this.consume("IDENTIFIER", `Expect ${kind} name.`);

        this.consume("LEFT_PAREN", `Expect '(' after ${kind} name.`);

        const parameters: Array<Token> = [];
        if (!this.check("RIGHT_PAREN")) {
            do {
                if (parameters.length >= 255) {
                    this.error(this.current, "Cannot have more than 255 parameters.");
                    break;
                }
                parameters.push(this.consume("IDENTIFIER", "Expect parameter name."));
            } while (this.match("COMMA"));
        }

        this.consume("RIGHT_PAREN", "Expect ')' after parameters.");
        this.consume("LEFT_BRACE", `Expect '{' before ${kind} body.`);

        const body = this.block();
        return new FunctionStmt(name, parameters, body);
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
        } else if (this.match("LEFT_BRACE")) {
            return new Block(this.block());
        } else if (this.match("IF")) {
            return this.ifStatement();
        } else if (this.match("WHILE")) {
            return this.whileStatement();
        } else if (this.match("FOR")) {
            return this.forStatement();
        } else if (this.match("BREAK")) {
            const token = this.previous!;
            this.consume("SEMICOLON", "Expect ';' after 'break'.");
            return new BreakStmt(token);
        } else if (this.match("CONTINUE")) {
            const token = this.previous!;
            this.consume("SEMICOLON", "Expect ';' after 'continue'.");
            return new ContinueStmt(token);
        } else if (this.match("RETURN")) {
            return this.returnStatement();
        }

        return this.expressionStatement();
    }

    private returnStatement(): Stmt {
        const keyword = this.previous;
        let value: Expr | null = null;
        if (!this.check("SEMICOLON")) {
            value = this.expression();
        }

        this.consume("SEMICOLON", "Expect ';' after return value.");
        return new ReturnStmt(keyword!, value);
    }

    private ifStatement(): Stmt {
        this.consume("LEFT_PAREN", "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume("RIGHT_PAREN", "Expect ')' after if condition.");

        const thenBranch = this.statement();
        let elseBranch: Stmt | undefined;

        if (this.match("ELSE")) {
            elseBranch = this.statement();
        }

        return new IfStmt(condition, thenBranch, elseBranch || null);
    }

    private whileStatement(): Stmt {
        this.consume("LEFT_PAREN", "Expect '(' after 'while'.");
        const condition = this.expression();
        this.consume("RIGHT_PAREN", "Expect ')' after while condition.");

        const body = this.statement();

        return new WhileStmt(condition, body);
    }

    private forStatement(): Stmt {
        this.consume("LEFT_PAREN", "Expect '(' after 'for'.");
        let initializer: Stmt | null = null;
        if (this.match("SEMICOLON")) {
            initializer = null;
        } else if (this.match("VAR")) {
            initializer = this.varDeclaration();
        } else {
            initializer = this.expressionStatement();
        }

        let condition: Expr | null = null;
        if (!this.check("SEMICOLON")) {
            condition = this.expression();
        }
        this.consume("SEMICOLON", "Expect ';' after loop condition.");

        let increment: Expr | null = null;
        if (!this.check("RIGHT_PAREN")) {
            increment = this.expression();
        }
        this.consume("RIGHT_PAREN", "Expect ')' after for clauses.");

        let body = this.statement();

        return new ForStmt(initializer, condition, increment, body);
    }

    private block(): Array<Stmt> {
        const statements: Array<Stmt> = [];

        while (!this.check("RIGHT_BRACE") && !this.isAtEnd) {
            const declaration = this.declaration();
            if (declaration) {
                statements.push(declaration);
            }
        }

        this.consume("RIGHT_BRACE", "Expect '}' after block.");
        return statements;
    }

    private printStatement(): Stmt {
        const value = this.expression();
        this.consume("SEMICOLON", "Expect ';' after value.");
        return new PrintStmt(value);
    }

    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume("SEMICOLON", "Expect ';' after expression.");
        return expr;
    }

    private expression(): Expr {
        return this.assignment();
    }

    private assignment(): Expr {
        const expr = this.or();

        if (this.match("EQUAL")) {
            const equals = this.previous;
            const value = this.assignment();

            if (expr instanceof Variable) {
                const name = expr.name;
                return new Assign(name, value);
            } else if (expr instanceof Get) {
                const get = expr;
                return new Set(get.object, get.name, value);
            }

            this.error(equals, "Invalid assignment target.");
        }

        return expr;
    }

    private or(): Expr {
        let expr = this.and();

        while (this.match("OR")) {
            const operator = this.previous;
            const right = this.and();
            expr = new Logical(expr, operator!, right);
        }

        return expr;
    }

    private and(): Expr {
        let expr = this.equality();

        while (this.match("AND")) {
            const operator = this.previous;
            const right = this.equality();
            expr = new Logical(expr, operator!, right);
        }

        return expr;
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

        return this.call();
    }

    private call(): Expr {
        let expr = this.primary();

        while (true) {
            if (this.match("LEFT_PAREN")) {
                expr = this.finishCall(expr);
            } else if (this.match("DOT")) {
                const name = this.consume("IDENTIFIER", "Expect property name after '.'.");
                expr = new Get(expr, name!);
            } else {
                break;
            }
        }

        return expr;
    }

    private finishCall(callee: Expr): Expr {
        const args: Array<Expr> = [];
        if (!this.check("RIGHT_PAREN")) {
            do {
                if (args.length >= 255) {
                    this.error(this.current, "Cannot have more than 255 arguments.");
                    break;
                }
                args.push(this.expression());
            } while (this.match("COMMA"));
        }

        const paren = this.consume("RIGHT_PAREN", "Expect ')' after arguments.");

        return new Call(callee, paren, args);
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

        if (this.match("THIS")) {
            return new ThisExpr(this.previous!);
        }

        if (this.match("SUPER")) {
            const keyword = this.previous;
            this.consume("DOT", "Expect '.' after 'super'.");

            const method = this.consume("IDENTIFIER", "Expect superclass method name.");
            return new SuperExpr(keyword!, method!);
        }

        throw this.error(this.current!, "Expect expression.");
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

        throw this.error(this.current!, message);
    }

    private error(token: Token | undefined, message: string): ParseError {
        this.errorReporter.error(
            token || {
                line: 0,
                start: 0,
                end: 0,
            },
            message
        );
        return new ParseError(token, message);
    }
}
