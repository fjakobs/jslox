import { Interpreter } from "./Interpreter";
import * as assert from "assert";
import { Scanner } from "./Scanner";
import { Parser } from "./Parser";
import { Expr, Stmt } from "./Expr";
import { ErrorReporter, RuntimeError, TokenPosition } from "./Error";
import { Resolver } from "./Resolver";
import exp = require("constants");

export const testErrorReporter: ErrorReporter = {
    error: (token: TokenPosition, message: string) => {
        assert.fail(message);
    },
    warn: (token: TokenPosition, message: string) => {},
    runtimeError: function (error: RuntimeError): void {
        console.error(error.message);
        assert.fail(error.message);
    },
};

function parseExpression(source: string): [Expr, Map<Expr, number>] {
    const tokens = new Scanner(source, testErrorReporter).scanTokens();
    const parser = new Parser(tokens, testErrorReporter);

    const expr = parser.parseExpression()!;

    const resolver = new Resolver(testErrorReporter);
    expr.visit(resolver);

    return [expr, resolver.resolved];
}

function parseStatements(source: string): [Array<Stmt>, Map<Expr, number>] {
    const tokens = new Scanner(source, testErrorReporter).scanTokens();
    const parser = new Parser(tokens, testErrorReporter);

    const statements = parser.parse()!;

    const resolver = new Resolver(testErrorReporter);
    resolver.resolve(statements);

    return [statements, resolver.resolved];
}

describe("Interpreter", () => {
    it("should be able to interpret a single expression", () => {
        const interpreter = new Interpreter(testErrorReporter);
        const result = interpreter.interpret(...parseExpression("1 + 2"));
        assert.equal(result, 3);
    });

    it("should be able to interpret a single expression with grouping", () => {
        const interpreter = new Interpreter(testErrorReporter);
        const result = interpreter.interpret(...parseExpression("(1 + 2 * 6) - 13"));
        assert.equal(result, 0);
    });

    it("should be able to interpret a single expression with grouping and unary", () => {
        const interpreter = new Interpreter(testErrorReporter);
        const result = interpreter.interpret(...parseExpression("-(1 + 2 * 6) - 13"));
        assert.equal(result, -26);
    });

    it("should report runtime errors", () => {
        let called = false;
        const errorReporter = {
            error: (token: TokenPosition, message: string) => {},
            warn: (token: TokenPosition, message: string) => {},
            runtimeError: () => {
                called = true;
            },
        };
        const interpreter = new Interpreter(errorReporter);

        interpreter.interpret(...parseExpression('1 + "2"'));
        assert.ok(called);
    });

    it("should report runtime errors for division by zero", () => {
        let called = false;
        const errorReporter = {
            error: (token: TokenPosition, message: string) => {},
            warn: (token: TokenPosition, message: string) => {},
            runtimeError: () => {
                called = true;
            },
        };
        const interpreter = new Interpreter(errorReporter);

        interpreter.interpret(...parseExpression("1 / 0"));
        assert.ok(called);
    });

    it("should define variables", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(...parseStatements("var a = 1+1;"));

        assert.equal(interpreter.environment.getByName("a"), 2);
    });

    it("should allow multiple statments", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(...parseStatements("var a = 1+1; print a;"));

        assert.equal(interpreter.environment.getByName("a"), 2);
    });

    it("should assign variables", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(...parseStatements("var a; a = 1+1;"));

        assert.equal(interpreter.environment.getByName("a"), 2);
    });

    it("should have block scoped variables", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(...parseStatements("var a = 1; { var a = 2; }"));

        assert.equal(interpreter.environment.getByName("a"), 1);
    });

    it("should support if statements", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(...parseStatements("var a = 1; if (true) a=2;"));
        assert.equal(interpreter.environment.getByName("a"), 2);

        interpreter.evaluate(...parseStatements("var a = 1; if (false) a=2; else a=3;"));
        assert.equal(interpreter.environment.getByName("a"), 3);
    });

    it("should support logical AND and OR statements", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(...parseStatements("var a = true and 12;"));
        assert.equal(interpreter.environment.getByName("a"), 12);

        interpreter.evaluate(...parseStatements("var a = false and 12;"));
        assert.equal(interpreter.environment.getByName("a"), false);

        interpreter.evaluate(...parseStatements("var a = true or 12;"));
        assert.equal(interpreter.environment.getByName("a"), true);

        interpreter.evaluate(...parseStatements("var a = false or 12;"));
        assert.equal(interpreter.environment.getByName("a"), 12);

        interpreter.evaluate(...parseStatements("var a = false and nil;"));
        assert.equal(interpreter.environment.getByName("a"), false);
    });

    it("should support while statements", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(...parseStatements("var a = 0; while (a < 10) { a = a + 1; }"));
        assert.equal(interpreter.environment.getByName("a"), 10);
    });

    it("should support for statements", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(...parseStatements("var a = 0; for (var i = 0; i < 10; i = i + 1) { a = a + 1; }"));
        assert.equal(interpreter.environment.getByName("a"), 10);
    });

    it("should suoport break statements", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(...parseStatements("var a = 0; while (true) { a = a + 1; break; }"));
        assert.equal(interpreter.environment.getByName("a"), 1);
    });

    it("should support continue statements", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(
            ...parseStatements("var a = 0; for (var i = 0; i < 10; i = i + 1) { if (i == 5) continue; a = a + 1; }")
        );
        assert.equal(interpreter.environment.getByName("a"), 9);
    });

    it("should support functions", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(...parseStatements("fun foo() { return 11; } var j = foo();"));
        assert.equal(interpreter.environment.getByName("j"), 11);
    });

    it("should not call numbers", () => {
        let called = false;
        const errorReporter = {
            error: (token: TokenPosition, message: string) => {},
            warn: (token: TokenPosition, message: string) => {},
            runtimeError: () => {
                called = true;
            },
        };

        const interpreter = new Interpreter(errorReporter);
        interpreter.evaluate(...parseStatements("var a = 1();"));
        assert.ok(called);
    });

    it("should properly resolve variables in closures", () => {
        const interpreter = new Interpreter(testErrorReporter);
        interpreter.evaluate(
            ...parseStatements(`
            var a = 1; 
            var b;
            var c;
            {
                fun getA() { 
                    return a;
                }
                b = getA();
                var a = "local";
                c = getA();
            }`)
        );

        assert.equal(interpreter.environment.getByName("b"), 1);
        assert.equal(interpreter.environment.getByName("c"), 1);
    });
});
