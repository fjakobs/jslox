import * as assert from "assert";
import { Parser } from "./Parser";
import { Scanner } from "./Scanner";
import { Resolver } from "./Resolver";
import { TokenPosition } from "./Error";

describe("Resolver", () => {
    it("should resolve local variables", () => {
        const parser = new Parser(new Scanner("var a; print a;").scanTokens());
        const program = parser.parse();

        assert.ok(program !== null);
        const resolver = new Resolver();
        resolver.resolve(program);

        assert.equal([...resolver.references.entries()].length, 1);
        assert.equal([...resolver.definitions.entries()].length, 1);

        for (const [reference, definition] of resolver.references) {
            assert.equal(reference.lexeme, "a");
            assert.equal(definition.lexeme, "a");

            assert.ok(resolver.definitions.has(definition));
        }
    });

    it("should give an error on re-defined variables", () => {
        const parser = new Parser(new Scanner("var a; var a;").scanTokens());
        const program = parser.parse();

        assert.ok(program !== null);

        let called = false;
        const resolver = new Resolver({
            error: (token: TokenPosition, message: string) => {
                called = true;
                assert.equal(message, "Variable with this name already declared in this scope.");
            },
            warn: () => {},
            runtimeError: () => {},
        });
        resolver.resolve(program);
        assert.ok(called);
    });

    it("should give an error on top level return", () => {
        const parser = new Parser(new Scanner("return 12;").scanTokens());
        const program = parser.parse();

        assert.ok(program !== null);

        let called = false;
        const resolver = new Resolver({
            error: (token: TokenPosition, message: string) => {
                called = true;
                assert.equal(message, "Cannot return from top-level code.");
            },
            warn: () => {},
            runtimeError: () => {},
        });
        resolver.resolve(program);
        assert.ok(called);
    });

    it("should give an error on top level break", () => {
        const parser = new Parser(new Scanner("break;").scanTokens());
        const program = parser.parse();

        assert.ok(program !== null);

        let called = false;
        const resolver = new Resolver({
            error: (token: TokenPosition, message: string) => {
                called = true;
                assert.equal(message, "Cannot break from top-level code.");
            },
            warn: () => {},
            runtimeError: () => {},
        });
        resolver.resolve(program);
        assert.ok(called);
    });

    it("should give a warning if variable is never used", () => {
        const parser = new Parser(new Scanner("var a;").scanTokens());
        const program = parser.parse();

        assert.ok(program !== null);

        let called = false;
        const resolver = new Resolver({
            error: () => {},
            warn: (token: TokenPosition, message: string) => {
                called = true;
                assert.equal(message, "Variable 'a' is declared but never used.");
            },
            runtimeError: () => {},
        });
        resolver.resolve(program);
        assert.ok(called);
    });
});
