import { Interpreter } from "./Interpreter";
import * as assert from "assert";
import { Scanner } from "./Scanner";
import { Parser } from "./Parser";
import { Expr, Stmt } from "./Expr";

function parseExpression(source: string): Expr {
    const tokens = new Scanner(source).scanTokens();
    const parser = new Parser(tokens);

    return parser.parseExpression()!;
}

function parseStatement(source: string): Array<Stmt> {
    const tokens = new Scanner(source).scanTokens();
    const parser = new Parser(tokens);

    return parser.parse()!;
}

describe("Interpreter", () => {
    it("should be able to interpret a single expression", () => {
        const interpreter = new Interpreter();
        const result = interpreter.interpret(parseExpression("1 + 2"));
        assert.equal(result, 3);
    });

    it("should be able to interpret a single expression with grouping", () => {
        const interpreter = new Interpreter();
        const result = interpreter.interpret(parseExpression("(1 + 2 * 6) - 13"));
        assert.equal(result, 0);
    });

    it("should be able to interpret a single expression with grouping and unary", () => {
        const interpreter = new Interpreter();
        const result = interpreter.interpret(parseExpression("-(1 + 2 * 6) - 13"));
        assert.equal(result, -26);
    });

    it("should report runtime errors", () => {
        let called = false;
        const errorReporter = {
            error: (line: number, message: string) => {},
            runtimeError: () => {
                called = true;
            },
        };
        const interpreter = new Interpreter(errorReporter);

        interpreter.interpret(parseExpression('1 + "2"'));
        assert.ok(called);
    });

    it("should report runtime errors for division by zero", () => {
        let called = false;
        const errorReporter = {
            error: (line: number, message: string) => {},
            runtimeError: () => {
                called = true;
            },
        };
        const interpreter = new Interpreter(errorReporter);

        interpreter.interpret(parseExpression("1 / 0"));
        assert.ok(called);
    });

    it("should define variables", () => {
        const interpreter = new Interpreter();
        interpreter.evaluate(parseStatement("var a = 1+1;"));

        assert.equal(interpreter.environment.getByName("a"), 2);
    });
});
