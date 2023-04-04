import { Parser } from "./Parser";
import * as assert from "assert";
import { Scanner } from "./Scanner";
import { PrettyPrinter } from "./PrettyPrinter";
import { RuntimeError } from "./Error";

describe("Parser", () => {
    it("should be able to parse a single expression", () => {
        const parser = new Parser(new Scanner("1 + 2").scanTokens(), {
            error: (line: number, message: string) => {
                assert.fail(`[line ${line}] Error: ${message}`);
            },
            runtimeError: (error: RuntimeError) => {
                assert.fail(error.message);
            },
        });
        const program = parser.parse();

        assert.ok(program !== null);
        const pretty = program.visit(new PrettyPrinter());

        assert.equal(pretty, "(+ 1 2)");
    });

    it("should be able to parse a single expression with grouping", () => {
        const parser = new Parser(new Scanner("(1 + 2 * 6) - 13").scanTokens(), {
            error: (line: number, message: string) => {
                assert.fail(`[line ${line}] Error: ${message}`);
            },
            runtimeError: (error: RuntimeError) => {
                assert.fail(error.message);
            },
        });
        const program = parser.parse();

        assert.ok(program !== null);
        const pretty = program.visit(new PrettyPrinter());

        assert.equal(pretty, "(- ((+ 1 (* 2 6))) 13)");
    });
});
