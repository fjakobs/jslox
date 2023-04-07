import { RuntimeError } from "./Error";
import { LoxType } from "./Interpreter";
import { Token } from "./Token";

export class Environment {
    private readonly values: Map<string, LoxType> = new Map();

    constructor() {}

    define(name: string, value: LoxType): void {
        this.values.set(name, value);
    }

    get(name: Token): LoxType {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme)!;
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    assign(name: Token, value: LoxType): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    // mostly for testing
    getByName(name: string): LoxType {
        return this.values.get(name)!;
    }
}
