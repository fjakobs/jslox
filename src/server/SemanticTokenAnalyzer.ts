import { DocumentSymbol, SymbolKind } from "vscode-languageserver";
import {
    Assign,
    Binary,
    Block,
    BreakStmt,
    Call,
    ClassStmt,
    ContinueStmt,
    Expression,
    ForStmt,
    FunctionStmt,
    Get,
    Grouping,
    IfStmt,
    Literal,
    Logical,
    PrintStmt,
    ReturnStmt,
    Set,
    Stmt,
    SuperExpr,
    ThisExpr,
    Unary,
    Variable,
    VariableDeclaration,
    Visitor,
    WhileStmt,
} from "../jslox/Expr";
import { Resolver } from "../jslox/Resolver";

export const TOKEN_LEGEND = ["class", "function", "variable", "parameter", "property"] as const;
export type TokenType = (typeof TOKEN_LEGEND)[number];

export const TOKEN_TO_ID = TOKEN_LEGEND.reduce((map, token, index) => {
    map[token] = index;
    return map;
}, {} as { [key: string]: number });

export interface SemanticToken {
    start: number;
    end: number;
    type: TokenType;
}

export class SemanticTokenAnalyzer implements Visitor<void> {
    public tokens: Array<SemanticToken> = [];
    public documentSymbols: Array<DocumentSymbol> = [];

    private resolver?: Resolver;
    private currentSymbol?: DocumentSymbol;

    analyze(statemens: Stmt[], resolver: Resolver) {
        this.resolver = resolver;
        this.tokens = [];
        this.documentSymbols = [];
        this.currentSymbol = undefined;

        for (const statement of statemens) {
            statement.visit(this);
        }

        return this.tokens;
    }

    visitAssign(assign: Assign): void {
        this.tokens.push({
            start: assign.name.start,
            end: assign.name.end,
            type: "variable",
        });
        assign.value.visit(this);
    }

    visitBinary(binary: Binary): void {
        binary.left.visit(this);
        binary.right.visit(this);
    }

    visitGrouping(grouping: Grouping): void {
        grouping.expression.visit(this);
    }

    visitLiteral(literal: Literal): void {}

    visitLogical(logical: Logical): void {
        logical.left.visit(this);
        logical.right.visit(this);
    }

    visitVariable(variable: Variable): void {
        let type: TokenType = "variable";

        if (this.resolver) {
            const def = this.resolver.references.get(variable.name);
            if (def) {
                type = this.resolver.definitionType.get(def) || "parameter";
            }
        }

        this.tokens.push({
            start: variable.name.start,
            end: variable.name.end,
            type,
        });
    }

    visitUnary(unary: Unary): void {
        unary.right.visit(this);
    }

    visitCall(call: Call): void {
        call.callee.visit(this);
        for (const argument of call.args) {
            argument.visit(this);
        }
    }

    visitExpression(expression: Expression): void {
        expression.expression.visit(this);
    }

    visitSuperExpr(superexpr: SuperExpr): void {}

    visitClassStmt(classstmt: ClassStmt): void {
        this.tokens.push({
            start: classstmt.name.start,
            end: classstmt.name.end,
            type: "class",
        });

        if (classstmt.superclass) {
            classstmt.superclass.visit(this);

            this.tokens.push({
                start: classstmt.superclass.name.start,
                end: classstmt.superclass.name.end,
                type: "class",
            });
        }

        const enclosingSymbol = this.startBlock({
            name: classstmt.name.lexeme,
            kind: SymbolKind.Class,
            range: {
                start: classstmt.name,
                end: classstmt.name,
            },
            selectionRange: {
                start: classstmt.name,
                end: classstmt.name,
            },
            children: [],
        });

        for (const method of classstmt.methods) {
            method.visit(this);
        }

        this.endBlock(enclosingSymbol);
    }

    visitGet(get: Get): void {
        get.object.visit(this);
        this.tokens.push({
            start: get.name.start,
            end: get.name.end,
            type: "property",
        });
    }

    visitSet(set: Set): void {
        set.object.visit(this);
        this.tokens.push({
            start: set.name.start,
            end: set.name.end,
            type: "property",
        });

        set.value.visit(this);
    }

    visitThisExpr(thisexpr: ThisExpr): void {}

    visitFunctionStmt(functionstmt: FunctionStmt): void {
        const isMethod = this.currentSymbol?.kind === SymbolKind.Class;

        this.tokens.push({
            start: functionstmt.name.start,
            end: functionstmt.name.end,
            type: isMethod ? "property" : "function",
        });

        const enclosingSymbol = this.startBlock({
            name: functionstmt.name.lexeme,
            kind: isMethod ? SymbolKind.Method : SymbolKind.Function,
            range: {
                start: functionstmt.name,
                end: functionstmt.name,
            },
            selectionRange: {
                start: functionstmt.name,
                end: functionstmt.name,
            },
            children: [],
        });

        for (const param of functionstmt.params) {
            this.tokens.push({
                start: param.start,
                end: param.end,
                type: "parameter",
            });
        }
        functionstmt.body.forEach((stmt) => stmt.visit(this));

        this.endBlock(enclosingSymbol);
    }

    visitBreakStmt(breakstmt: BreakStmt): void {}
    visitContinueStmt(continuestmt: ContinueStmt): void {}

    visitIfStmt(ifstmt: IfStmt): void {
        ifstmt.condition.visit(this);
        ifstmt.thenBranch.visit(this);
        ifstmt.elseBranch?.visit(this);
    }

    visitBlock(block: Block): void {
        block.statements.forEach((stmt) => stmt.visit(this));
    }

    visitPrintStmt(printstmt: PrintStmt): void {
        printstmt.expression.visit(this);
    }

    visitReturnStmt(returnstmt: ReturnStmt): void {
        returnstmt.value?.visit(this);
    }

    visitWhileStmt(whilestmt: WhileStmt): void {
        whilestmt.condition.visit(this);
        whilestmt.body.visit(this);
    }

    visitForStmt(forstmt: ForStmt): void {
        forstmt.initializer?.visit(this);
        forstmt.condition?.visit(this);
        forstmt.increment?.visit(this);
        forstmt.body.visit(this);
    }

    visitVariableDeclaration(variabledeclaration: VariableDeclaration): void {
        this.tokens.push({
            start: variabledeclaration.name.start,
            end: variabledeclaration.name.end,
            type: "variable",
        });
        variabledeclaration.initializer?.visit(this);
    }

    private startBlock(newSymbol: DocumentSymbol) {
        const enclosingSymbol = this.currentSymbol;
        this.currentSymbol = newSymbol;

        return enclosingSymbol;
    }

    private endBlock(enclosingSymbol: DocumentSymbol | undefined) {
        if (this.currentSymbol) {
            if (enclosingSymbol) {
                enclosingSymbol.children?.push(this.currentSymbol);
            } else {
                this.documentSymbols.push(this.currentSymbol);
            }
        }
        this.currentSymbol = enclosingSymbol;
    }
}
