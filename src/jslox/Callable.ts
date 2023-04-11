import { Environment } from "./Environment";
import { Block, FunctionStmt } from "./Expr";
import { Interpreter, LoxType } from "./Interpreter";

export class ReturnException extends Error {
    constructor(public value: LoxType) {
        super();
    }
}

export abstract class Callable {
    abstract get arity(): number;
    abstract call(interpreter: Interpreter, args: Array<LoxType>): LoxType;
    abstract toString(): string;
}

export class LoxFunction extends Callable {
    constructor(private readonly declaration: FunctionStmt, private readonly closure: Environment) {
        super();
    }

    get arity() {
        return this.declaration.params.length;
    }

    call(interpreter: Interpreter, args: Array<LoxType>): LoxType {
        const environment = new Environment(this.closure);

        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (e) {
            if (e instanceof ReturnException) {
                return e.value;
            }
        }

        return null;
    }

    toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}
