import { Parser } from "./Parser";
import * as assert from "assert";
import { Scanner } from "./Scanner";
import { PrettyPrinter } from "./PrettyPrinter";
import { RuntimeError, TokenPosition } from "./Error";

describe("Parser", () => {
    it("should be able to parse a single expression", () => {
        const parser = new Parser(new Scanner("1 + 2").scanTokens(), {
            error: (token: TokenPosition, message: string) => {
                assert.fail(`[line ${token.line}] Error: ${message}`);
            },
            warn: (token: TokenPosition, message: string) => {
                assert.fail(`[line ${token.line}] Warning: ${message}`);
            },
            runtimeError: (error: RuntimeError) => {
                assert.fail(error.message);
            },
        });
        const program = parser.parseExpression();

        assert.ok(program !== null);
        const pretty = program.visit(new PrettyPrinter());

        assert.equal(pretty, "(+ 1 2)");
    });

    it("should be able to parse a single expression with grouping", () => {
        const parser = new Parser(new Scanner("(1 + 2 * 6) - 13").scanTokens(), {
            error: (token: TokenPosition, message: string) => {
                assert.fail(`[line ${token.line}] Error: ${message}`);
            },
            warn: (token: TokenPosition, message: string) => {
                assert.fail(`[line ${token.line}] Warning: ${message}`);
            },
            runtimeError: (error: RuntimeError) => {
                assert.fail(error.message);
            },
        });
        const program = parser.parseExpression();

        assert.ok(program !== null);
        const pretty = program.visit(new PrettyPrinter());

        assert.equal(pretty, "(- ((+ 1 (* 2 6))) 13)");
    });

    it("should be able to parse multiple statement expressions", () => {
        const parser = new Parser(new Scanner("1 + 2; 3 * 4;").scanTokens(), {
            error: (token: TokenPosition, message: string) => {
                assert.fail(`[line ${token.line}] Error: ${message}`);
            },
            warn: (token: TokenPosition, message: string) => {
                assert.fail(`[line ${token.line}] Warning: ${message}`);
            },
            runtimeError: (error: RuntimeError) => {
                assert.fail(error.message);
            },
        });
        const program = parser.parse();

        assert.ok(program !== null);
        const pretty = program.map((stmt) => stmt.visit(new PrettyPrinter()));

        assert.deepEqual(pretty, ["(+ 1 2)", "(* 3 4)"]);
    });

    it("should parse variable declarations", () => {
        const parser = new Parser(new Scanner("var a = 1; print a;").scanTokens(), {
            error: (token: TokenPosition, message: string) => {
                assert.fail(`[line ${token.line}] Error: ${message}`);
            },
            warn: (token: TokenPosition, message: string) => {
                assert.fail(`[line ${token.line}] Warning: ${message}`);
            },
            runtimeError: (error: RuntimeError) => {
                assert.fail(error.message);
            },
        });
        const program = parser.parse();

        assert.ok(program !== null);
        const pretty = program.map((stmt) => stmt.visit(new PrettyPrinter()));

        assert.deepEqual(pretty, ["(var a 1)", "(print a)"]);
    });
});
