import { RuntimeError } from "./Error";
import { LoxType } from "./Interpreter";
import { Token } from "./Token";

export class Environment {
    private readonly values: Map<string, LoxType> = new Map();

    constructor(readonly enclosing?: Environment) {}

    define(name: string, value: LoxType): void {
        this.values.set(name, value);
    }

    get(name: Token): LoxType {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme)!;
        }

        if (this.enclosing) {
            return this.enclosing.get(name);
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    getAt(distance: number, lexeme: string): LoxType {
        return this.ancestor(distance).values.get(lexeme)!;
    }

    ancestor(distance: number): Environment {
        let environment: Environment = this;
        for (let i = 0; i < distance; i++) {
            environment = environment.enclosing!;
        }
        return environment;
    }

    assign(name: Token, value: LoxType): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }

        if (this.enclosing) {
            this.enclosing.assign(name, value);
            return;
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    assignAt(distance: number, name: Token, value: LoxType) {
        this.ancestor(distance).values.set(name.lexeme, value);
    }

    // mostly for testing
    getByName(name: string): LoxType {
        if (this.values.has(name)) {
            return this.values.get(name)!;
        }

        if (this.enclosing) {
            return this.enclosing.getByName(name);
        }

        throw new Error(`Undefined variable '${name}'.`);
    }
}
