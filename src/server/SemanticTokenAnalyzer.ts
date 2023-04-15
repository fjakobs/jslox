import {
    Assign,
    Binary,
    Block,
    BreakStmt,
    Call,
    ContinueStmt,
    Expression,
    ForStmt,
    FunctionStmt,
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
    Visitor,
    WhileStmt,
} from "../jslox/Expr";
import { Resolver } from "../jslox/Resolver";

export interface SemanticToken {
    start: number;
    end: number;
    type: string;
}

export class SemanticTokenAnalyzer implements Visitor<void> {
    private tokens: Array<SemanticToken> = [];
    private resolver?: Resolver;

    analyze(statemens: Stmt[], resolver: Resolver): SemanticToken[] {
        this.resolver = resolver;
        this.tokens = [];
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
        let type = "variable";

        if (this.resolver) {
            const def = this.resolver.references.get(variable.name);
            if (def) {
                if (this.resolver.definitionType.has(def)) {
                    type = "parameter";
                }
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

    visitFunctionStmt(functionstmt: FunctionStmt): void {
        this.tokens.push({
            start: functionstmt.name.start,
            end: functionstmt.name.end,
            type: "function",
        });

        for (const param of functionstmt.params) {
            this.tokens.push({
                start: param.start,
                end: param.end,
                type: "parameter",
            });
        }
        functionstmt.body.forEach((stmt) => stmt.visit(this));
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
}
