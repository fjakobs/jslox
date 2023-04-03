import { Binary, Grouping, Literal, Unary, Visitor } from "./Expr";

export class PrettyPrinter implements Visitor<string> {
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
