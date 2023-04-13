import * as assert from "assert";
import { Parser } from "./Parser";
import { Scanner } from "./Scanner";
import { Resolver } from "./Resolver";

describe("Resolver", () => {
    it("should resolve local variables", () => {
        const parser = new Parser(new Scanner("var a; print a;").scanTokens());
        const program = parser.parse();

        assert.ok(program !== null);
        const resolver = new Resolver();
        program.forEach((stmt) => stmt.visit(resolver));

        assert.equal([...resolver.references.entries()].length, 1);
        assert.equal([...resolver.definitions.entries()].length, 1);

        for (const [reference, definition] of resolver.references) {
            assert.equal(reference.lexeme, "a");
            assert.equal(definition.lexeme, "a");

            assert.ok(resolver.definitions.has(definition));
        }
    });
});
