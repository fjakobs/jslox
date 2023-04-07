import { Environment } from "./Environment";
import * as assert from "assert";

describe("Environment", () => {
    it("should allow scoped variables", () => {
        const environment = new Environment();
        environment.define("a", 1);
        environment.define("b", 2);

        const inner = new Environment(environment);
        inner.define("a", 3);
        inner.define("c", 4);

        assert.equal(environment.getByName("a"), 1);
        assert.equal(environment.getByName("b"), 2);
        assert.equal(inner.getByName("a"), 3);
        assert.equal(inner.getByName("b"), 2);
        assert.equal(inner.getByName("c"), 4);
    });
});
