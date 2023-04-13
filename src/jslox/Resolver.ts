import {
    Assign,
    Binary,
    Block,
    BreakStmt,
    Call,
    ContinueStmt,
    Expr,
    Expression,
    ForStmt,
    FunctionStmt,
    Grouping,
    IfStmt,
    Literal,
    Logical,
    PrintStmt,
    ReturnStmt,
    Unary,
    Variable,
    VariableDeclaration,
    Visitor,
    WhileStmt,
} from "./Expr";
import { Token } from "./Token";
import { ErrorReporter, defaultErrorReporter } from "./Error";

export type FunctionType = "none" | "function";

export class Resolver implements Visitor<void> {
    private scopes: Array<Map<string, false | Token>> = [new Map()];
    readonly resolved: Map<Expr, number> = new Map();

    // map of variable name to list of tokens where it is used
    readonly definitions: Map<Token, Array<Token>> = new Map();

    // map of variable name to token where it is declared
    readonly references: Map<Token, Token> = new Map();

    private currentFunction: FunctionType = "none";
    private loopDepth = 0;

    constructor(private errorReporter: ErrorReporter = defaultErrorReporter) {}

    visitAssign(assign: Assign) {
        assign.value.visit(this);
        this.resolveLocal(assign, assign.name);
    }

    visitBinary(binary: Binary) {
        binary.left.visit(this);
        binary.right.visit(this);
    }

    visitGrouping(grouping: Grouping) {
        grouping.expression.visit(this);
    }

    visitLiteral(literal: Literal) {}

    visitLogical(logical: Logical) {
        logical.left.visit(this);
        logical.right.visit(this);
    }

    visitVariable(variable: Variable) {
        if (this.scopes.length !== 0) {
            const scope = this.scopes[this.scopes.length - 1];
            if (scope.has(variable.name.lexeme) && !scope.get(variable.name.lexeme)) {
                this.errorReporter.error(
                    variable.name.line,
                    variable.name.start,
                    variable.name.end,
                    "Cannot read local variable in its own initializer."
                );
            }
        }

        this.resolveLocal(variable, variable.name);
    }

    visitUnary(unary: Unary) {
        unary.right.visit(this);
    }

    visitCall(call: Call) {
        call.callee.visit(this);
        call.args.forEach((arg) => arg.visit(this));
    }

    visitExpression(expression: Expression) {
        expression.expression.visit(this);
    }

    visitFunctionStmt(functionstmt: FunctionStmt) {
        this.declare(functionstmt.name);
        this.define(functionstmt.name);

        this.resolveFunction(functionstmt, "function");
    }

    visitBreakStmt(breakstmt: BreakStmt) {
        if (this.loopDepth === 0) {
            this.errorReporter.error(
                breakstmt.keyword.line,
                breakstmt.keyword.start,
                breakstmt.keyword.end,
                "Cannot break from top-level code."
            );
        }
    }

    visitContinueStmt(continuestmt: ContinueStmt) {
        if (this.loopDepth === 0) {
            this.errorReporter.error(
                continuestmt.keyword.line,
                continuestmt.keyword.start,
                continuestmt.keyword.end,
                "Cannot continue from top-level code."
            );
        }
    }

    visitIfStmt(ifstmt: IfStmt) {
        ifstmt.condition.visit(this);
        ifstmt.thenBranch.visit(this);
        ifstmt.elseBranch?.visit(this);
    }

    visitBlock(block: Block) {
        this.beginScope();
        block.statements.forEach((statement) => statement.visit(this));
        this.endScope();
    }
    visitPrintStmt(printstmt: PrintStmt) {
        printstmt.expression.visit(this);
    }

    visitReturnStmt(returnstmt: ReturnStmt) {
        if (this.currentFunction === "none") {
            this.errorReporter.error(
                returnstmt.keyword.line,
                returnstmt.keyword.start,
                returnstmt.keyword.end,
                "Cannot return from top-level code."
            );
        }
        returnstmt.value?.visit(this);
    }

    visitWhileStmt(whilestmt: WhileStmt) {
        whilestmt.condition.visit(this);
        this.loopDepth++;
        whilestmt.body.visit(this);
        this.loopDepth--;
    }

    visitForStmt(forstmt: ForStmt) {
        this.beginScope();
        forstmt.initializer?.visit(this);
        forstmt.condition?.visit(this);
        forstmt.increment?.visit(this);
        this.loopDepth++;
        forstmt.body.visit(this);
        this.loopDepth--;
        this.endScope();
    }

    visitVariableDeclaration(variabledeclaration: VariableDeclaration) {
        this.declare(variabledeclaration.name);
        if (variabledeclaration.initializer !== null) {
            variabledeclaration.initializer.visit(this);
        }
        this.define(variabledeclaration.name);
    }

    private beginScope() {
        this.scopes.push(new Map<string, false | Token>());
    }

    private endScope() {
        this.scopes.pop();
    }

    private declare(name: Token) {
        if (this.scopes.length === 0) {
            return;
        }

        const scope = this.scopes[this.scopes.length - 1];
        if (scope.has(name.lexeme)) {
            this.errorReporter.error(
                name.line,
                name.start,
                name.end,
                "Variable with this name already declared in this scope."
            );
        }

        scope.set(name.lexeme, false);
    }

    private define(name: Token) {
        this.scopes[this.scopes.length - 1].set(name.lexeme, name);
        this.definitions.set(name, []);
    }

    private resolveFunction(functionstmt: FunctionStmt, functionType: FunctionType) {
        const enclosingFunction = this.currentFunction;
        this.currentFunction = functionType;

        this.beginScope();
        functionstmt.params.forEach((param) => {
            this.declare(param);
            this.define(param);
        });
        functionstmt.body.forEach((statement) => statement.visit(this));
        this.endScope();

        this.currentFunction = enclosingFunction;
    }

    private resolveLocal(expr: Expr, name: Token) {
        for (let i = 0; i < this.scopes.length; i++) {
            if (this.scopes[i].has(name.lexeme)) {
                this.resolved.set(expr, this.scopes.length - 1 - i);

                const definition = this.scopes[i].get(name.lexeme);
                if (definition instanceof Token) {
                    this.definitions.get(definition)?.push(name);
                    this.references.set(name, definition);
                }
                return;
            }
        }
    }
}
