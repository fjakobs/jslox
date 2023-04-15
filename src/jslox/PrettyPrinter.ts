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
    ThisExpr,
    Unary,
    Variable,
    VariableDeclaration,
    Visitor,
    WhileStmt,
} from "./Expr";

export class PrettyPrinter implements Visitor<string> {
    visitThisExpr(thisexpr: ThisExpr): string {
        return "(this)";
    }

    visitSet(set: Set): string {
        return `(set ${set.object.visit(this)} ${set.name.lexeme} ${set.value.visit(this)})`;
    }

    visitGet(get: Get): string {
        return `(get ${get.object.visit(this)} ${get.name.lexeme})`;
    }

    visitClassStmt(classstmt: ClassStmt): string {
        throw new Error("Method not implemented.");
    }

    visitReturnStmt(returnstmt: ReturnStmt): string {
        return `(return ${returnstmt.value?.visit(this) || ""})`;
    }

    visitLogical(logical: Logical): string {
        return `(logical ${logical.operator.lexeme} ${logical.left.visit(this)} ${logical.right.visit(this)})`;
    }

    visitBreakStmt(breakstmt: BreakStmt): string {
        return "(break)";
    }

    visitContinueStmt(continuestmt: ContinueStmt): string {
        return "(continue)";
    }

    visitIfStmt(ifstmt: IfStmt): string {
        return `(if ${ifstmt.condition.visit(this)} ${ifstmt.thenBranch.visit(this)} ${ifstmt.elseBranch?.visit(
            this
        )})`;
    }

    visitWhileStmt(whilestmt: WhileStmt): string {
        return `(while ${whilestmt.condition.visit(this)} ${whilestmt.body.visit(this)})`;
    }

    visitForStmt(forstmt: ForStmt): string {
        return `(for ${forstmt.initializer?.visit(this)} ${forstmt.condition?.visit(this)} ${forstmt.increment?.visit(
            this
        )} ${forstmt.body.visit(this)})`;
    }

    visitAssign(assign: Assign): string {
        return `(set ${assign.name.lexeme} ${assign.value.visit(this)})`;
    }

    visitVariable(variable: Variable): string {
        return variable.name.lexeme;
    }

    visitVariableDeclaration(variabledeclaration: VariableDeclaration): string {
        return `(var ${variabledeclaration.name.lexeme} ${variabledeclaration.initializer.visit(this)})`;
    }

    visitFunctionStmt(functiondecl: FunctionStmt): string {
        return `(fun ${functiondecl.name.lexeme} ${functiondecl.params
            .map((param) => param.lexeme)
            .join(" ")} (${functiondecl.body.map((statement) => statement.visit(this)).join(" ")})}))`;
    }

    visitCall(call: Call): string {
        return `(call ${call.callee.visit(this)} ${call.args.map((arg) => arg.visit(this)).join(" ")})`;
    }

    visitBlock(block: Block): string {
        return `(block ${block.statements.map((statement) => statement.visit(this)).join(" ")})`;
    }

    visitExpression(expression: Expression): string {
        return expression.expression.visit(this);
    }

    visitPrintStmt(print: PrintStmt): string {
        return `(print ${print.expression.visit(this)})`;
    }

    visitBinary(binary: Binary): string {
        return `(${binary.operator.lexeme} ${binary.left.visit(this)} ${binary.right.visit(this)})`;
    }

    visitGrouping(grouping: Grouping): string {
        return `(${grouping.expression.visit(this)})`;
    }

    visitLiteral(literal: Literal): string {
        return literal?.value?.toString() || "nil";
    }

    visitUnary(unary: Unary): string {
        return `(${unary.operator.lexeme} ${unary.right.visit(this)})`;
    }
}
