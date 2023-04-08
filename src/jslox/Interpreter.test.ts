import { Interpreter } from "./Interpreter";
import * as assert from "assert";
import { Scanner } from "./Scanner";
import { Parser } from "./Parser";
import { Expr, Stmt } from "./Expr";
import { ErrorReporter, RuntimeError } from "./Error";

export const testErrorReporter: ErrorReporter = {
    error: (line: number, message: string) => {
        console.error(`[line ${line}] Error: ${message}`);
        assert.fail(message);
    },

    runtimeError: function (error: RuntimeError): void {
        console.error(error.message);
        assert.fail(error.message);
    },
};

function parseExpression(source: string): Expr {
    const tokens = new Scanner(source, testErrorReporter).scanTokens();
    const parser = new Parser(tokens, testErrorReporter);

    return parser.parseExpression()!;
}

function parseStatements(source: string): Array<Stmt> {
    const tokens = new Scanner(source, testErrorReporter).scanTokens();
    const parser = new Parser(tokens, testErrorReporter);

    return parser.parse()!;
}

describe("Interpreter", () => {
    it("should be able to interpret a single expression", () => {
        const interpreter = new Interpreter(testErrorReporter);
        const result = interpreter.interpret(parseExpression("1 + 2"));
        assert.equal(result, 3);
    });

    it("should be able to interpret a single expression with grouping", () => {
        const interpreter = new Interpreter(testErrorReporter);
        const result = interpreter.interpret(parseExpression("(1 + 2 * 6) - 13"));
        assert.equal(result, 0);
    });

    it("should be able to interpret a single expression with grouping and unary", () => {
        const interpreter = new Interpreter(testErrorReporter);
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
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(parseStatements("var a = 1+1;"));

        assert.equal(interpreter.environment.getByName("a"), 2);
    });

    it("should allow multiple statments", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(parseStatements("var a = 1+1; print a;"));

        assert.equal(interpreter.environment.getByName("a"), 2);
    });

    it("should assign variables", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(parseStatements("var a; a = 1+1;"));

        assert.equal(interpreter.environment.getByName("a"), 2);
    });

    it("should have block scoped variables", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(parseStatements("var a = 1; { var a = 2; }"));

        assert.equal(interpreter.environment.getByName("a"), 1);
    });

    it("should support if statements", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(parseStatements("var a = 1; if (true) a=2;"));
        assert.equal(interpreter.environment.getByName("a"), 2);

        interpreter.evaluate(parseStatements("var a = 1; if (false) a=2; else a=3;"));
        assert.equal(interpreter.environment.getByName("a"), 3);
    });

    it("should support logical AND and OR statements", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(parseStatements("var a = true and 12;"));
        assert.equal(interpreter.environment.getByName("a"), 12);

        interpreter.evaluate(parseStatements("var a = false and 12;"));
        assert.equal(interpreter.environment.getByName("a"), false);

        interpreter.evaluate(parseStatements("var a = true or 12;"));
        assert.equal(interpreter.environment.getByName("a"), true);

        interpreter.evaluate(parseStatements("var a = false or 12;"));
        assert.equal(interpreter.environment.getByName("a"), 12);

        interpreter.evaluate(parseStatements("var a = false and nil;"));
        assert.equal(interpreter.environment.getByName("a"), false);
    });

    it("should support while statements", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(parseStatements("var a = 0; while (a < 10) { a = a + 1; }"));
        assert.equal(interpreter.environment.getByName("a"), 10);
    });

    it("should support for statements", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(parseStatements("var a = 0; for (var i = 0; i < 10; i = i + 1) { a = a + 1; }"));
        assert.equal(interpreter.environment.getByName("a"), 10);
    });
});
