import { Binary, Expression, Grouping, Literal, Print, Unary, Variable, VariableDeclaration, Visitor } from "./Expr";

export class PrettyPrinter implements Visitor<string> {
    visitVariable(variable: Variable): string {
        return variable.name.lexeme;
    }

    visitVariableDeclaration(variabledeclaration: VariableDeclaration): string {
        return `(var ${variabledeclaration.name.lexeme} ${variabledeclaration.initializer.visit(this)})`;
    }

    visitExpression(expression: Expression): string {
        return expression.expression.visit(this);
    }

    visitPrint(print: Print): string {
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
