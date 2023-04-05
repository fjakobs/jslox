import { stringify } from "node:querystring";
import { RuntimeError, defaultErrorReporter } from "./Error";
import { Binary, Expr, Expression, Grouping, Literal, Print, Stmt, Unary, Visitor } from "./Expr";
import { Token } from "./Token";

export type LoxType = null | number | string | boolean;

export class Interpreter implements Visitor<LoxType> {
    constructor(private readonly errorReporter = defaultErrorReporter) {}

    interpret(expr: Expr): LoxType {
        try {
            return this.stringify(expr.visit(this));
        } catch (e) {
            if (e instanceof RuntimeError) {
                this.errorReporter.runtimeError(e);
                return null;
            } else {
                throw e;
            }
        }
    }

    evaluate(stmt: Array<Stmt>): void {
        try {
            for (const statement of stmt) {
                statement.visit(this);
            }
        } catch (e) {
            if (e instanceof RuntimeError) {
                this.errorReporter.runtimeError(e);
            } else {
                throw e;
            }
        }
    }

    stringify(value: LoxType): string {
        if (value === null) {
            return "nil";
        } else {
            return value.toString();
        }
    }

    visitExpression(expression: Expression): LoxType {
        return null;
    }

    visitPrint(print: Print): LoxType {
        console.log(this.stringify(print.expression.visit(this)));
        return null;
    }

    visitBinary(binary: Binary): LoxType {
        const left = binary.left.visit(this);
        const right = binary.right.visit(this);

        switch (binary.operator.type) {
            case "MINUS":
                this.assertNumberOperand(binary.operator, left);
                this.assertNumberOperand(binary.operator, right);
                return left - right;

            case "SLASH":
                this.assertNumberOperand(binary.operator, left);
                this.assertNumberOperand(binary.operator, right);
                if (right === 0) {
                    throw new RuntimeError(binary.operator, "Division by zero.");
                }
                return left / right;

            case "STAR":
                this.assertNumberOperand(binary.operator, left);
                this.assertNumberOperand(binary.operator, right);
                return left * right;

            case "PLUS":
                if (typeof left === "number" && typeof right === "number") {
                    return left + right;
                }
                if (typeof left === "string" && typeof right === "string") {
                    return left + right;
                }
                throw new RuntimeError(binary.operator, "Operands must be two numbers or two strings.");

            case "GREATER":
                this.assertNumberOperand(binary.operator, left);
                this.assertNumberOperand(binary.operator, right);
                return left > right;

            case "GREATER_EQUAL":
                this.assertNumberOperand(binary.operator, left);
                this.assertNumberOperand(binary.operator, right);
                return left >= right;

            case "LESS":
                this.assertNumberOperand(binary.operator, left);
                this.assertNumberOperand(binary.operator, right);
                return left < right;

            case "LESS_EQUAL":
                this.assertNumberOperand(binary.operator, left);
                this.assertNumberOperand(binary.operator, right);
                return left <= right;

            case "BANG_EQUAL":
                return left !== right;

            case "EQUAL_EQUAL":
                return left === right;

            default:
                throw new RuntimeError(binary.operator, "Unknown binary operator.");
        }
    }

    visitGrouping(grouping: Grouping): LoxType {
        return grouping.expression.visit(this);
    }

    visitLiteral(literal: Literal): LoxType {
        return literal.value;
    }

    visitUnary(unary: Unary): LoxType {
        const right = unary.right.visit(this);
        switch (unary.operator.type) {
            case "MINUS":
                this.assertNumberOperand(unary.operator, right);
                return -right;

            case "BANG":
                return !this.isTruthy(right);

            default:
                throw new Error("Unknown unary operator.");
        }
    }

    private isTruthy(right: LoxType): boolean {
        return right !== null && right !== false;
    }

    private assertNumberOperand(operation: Token, operand: LoxType): asserts operand is number {
        if (typeof operand === "number") {
            return;
        }

        throw new RuntimeError(operation, `Operand must be a number but found ${typeof operand}`);
    }
}
