import { Binary, Unary, Literal, Grouping } from "./Expr";
import { PrettyPrinter } from "./PrettyPrinter";
import { Token } from "./Token";
import * as assert from "assert";

describe("PrettyPrinter", () => {
    it("should be able to print an  expression", () => {
        const expr = new Binary(
            new Unary(new Token("MINUS", "-", undefined, 1, 0, 1), new Literal(123)),
            new Token("STAR", "*", undefined, 1, 0, 1),
            new Grouping(new Literal(45.67))
        );

        const pretty = expr.visit(new PrettyPrinter());
        assert.equal(pretty, "(* (- 123) (45.67))");
    });
});
