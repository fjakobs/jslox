import { Callable } from "./LoxFunction";
import { Environment } from "./Environment";
import { Interpreter, LoxType } from "./Interpreter";

export class Buildins extends Environment {
    constructor() {
        super();
        this.addBuildin("clock", 0, () => Date.now() / 1000);
    }

    private addBuildin(name: string, arity: number, fn: (args: Array<LoxType>) => LoxType) {
        this.define(name, new BuildinCallable(name, arity, fn));
    }
}

export class BuildinCallable extends Callable {
    constructor(private name: string, readonly arity: number, private readonly fn: (args: Array<LoxType>) => LoxType) {
        super();
    }

    call(interpreter: Interpreter, args: Array<LoxType>): LoxType {
        return this.fn(args);
    }

    toString(): string {
        return `<native ${this.name}>`;
    }
}
