import { Buildins } from "./Buildins";
import { Callable, LoxFunction, ReturnException } from "./Callable";
import { Environment } from "./Environment";
import { RuntimeError, defaultErrorReporter } from "./Error";
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
    Stmt,
    Unary,
    Variable,
    VariableDeclaration,
    Visitor,
    WhileStmt,
} from "./Expr";
import { Token } from "./Token";

export type LoxType = null | number | string | boolean | Callable;

export class BreakException extends Error {}
export class ContinueException extends Error {}

export class Interpreter implements Visitor<LoxType> {
    constructor(
        private readonly errorReporter = defaultErrorReporter,
        private _environment: Environment = new Buildins()
    ) {}

    get environment() {
        return this._environment;
    }

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

    visitIfStmt(branch: IfStmt): LoxType {
        if (this.isTruthy(branch.condition.visit(this))) {
            branch.thenBranch.visit(this);
        } else {
            branch.elseBranch?.visit(this);
        }
        return null;
    }

    visitWhileStmt(whilestmt: WhileStmt): LoxType {
        while (this.isTruthy(whilestmt.condition.visit(this))) {
            try {
                whilestmt.body.visit(this);
            } catch (e) {
                if (e instanceof BreakException) {
                    break;
                } else if (e instanceof ContinueException) {
                    continue;
                } else {
                    throw e;
                }
            }
        }

        return null;
    }

    visitFunctionStmt(functiondecl: FunctionStmt): LoxType {
        this._environment.define(functiondecl.name.lexeme, new LoxFunction(functiondecl, this._environment));
        return null;
    }

    visitReturnStmt(returnstmt: ReturnStmt): LoxType {
        throw new ReturnException(returnstmt?.value?.visit(this) || null);
    }

    visitCall(call: Call): LoxType {
        const callee = call.callee.visit(this);

        const args = call.args.map((arg) => arg.visit(this));

        if (!(callee instanceof Callable)) {
            throw new RuntimeError(call.paren, "Can only call functions and classes.");
        }

        if (args.length !== callee.arity) {
            throw new RuntimeError(call.paren, `Expected ${callee.arity} arguments but got ${args.length}.`);
        }

        return callee.call(this, args);
    }

    visitForStmt(forstmt: ForStmt): LoxType {
        const oldEnvironment = this._environment;
        this._environment = new Environment(this._environment);

        try {
            forstmt.initializer?.visit(this);

            const condition = forstmt.condition || new Literal(true);

            while (this.isTruthy(condition.visit(this))) {
                try {
                    forstmt.body.visit(this);
                } catch (e) {
                    if (e instanceof BreakException) {
                        break;
                    } else if (e instanceof ContinueException) {
                        // consume exception and execute the increment
                    } else {
                        throw e;
                    }
                }
                forstmt.increment?.visit(this);
            }
        } finally {
            this._environment = oldEnvironment;
        }

        return null;
    }

    visitBreakStmt(breakstmt: BreakStmt): LoxType {
        throw new BreakException();
    }

    visitContinueStmt(continuestmt: ContinueStmt): LoxType {
        throw new ContinueException();
    }

    visitLogical(logical: Logical): LoxType {
        const left = logical.left.visit(this);

        if (logical.operator.type === "OR") {
            if (this.isTruthy(left)) {
                return left;
            }
        } else {
            if (!this.isTruthy(left)) {
                return left;
            }
        }

        return logical.right.visit(this);
    }

    visitAssign(assign: Assign): LoxType {
        const value = assign.value.visit(this);
        this._environment.assign(assign.name, value);
        return value;
    }

    visitVariable(variable: Variable): LoxType {
        return this._environment.get(variable.name);
    }

    visitVariableDeclaration(variabledeclaration: VariableDeclaration): LoxType {
        this._environment.define(variabledeclaration.name.lexeme, variabledeclaration.initializer.visit(this));
        return null;
    }

    visitExpression(expression: Expression): LoxType {
        return null;
    }

    visitBlock(block: Block): LoxType {
        this.executeBlock(block.statements, new Environment(this._environment));
        return null;
    }

    visitPrintStmt(print: PrintStmt): LoxType {
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

    executeBlock(statements: Array<Stmt>, environment: Environment): void {
        const previous = this._environment;
        try {
            this._environment = environment;
            for (const statement of statements) {
                statement.visit(this);
            }
        } finally {
            this._environment = previous;
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
