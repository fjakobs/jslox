import { RuntimeError } from "./Error";
import { LoxType } from "./Interpreter";
import { LoxClass } from "./LoxClass";
import { Token } from "./Token";

export class LoxInstance {
    private fields = new Map<string, LoxType>();

    constructor(public klass: LoxClass) {}

    get(name: Token): LoxType {
        if (this.fields.has(name.lexeme)) {
            return this.fields.get(name.lexeme)!;
        }

        const method = this.klass.findMethod(name.lexeme);
        if (method) {
            return method.bind(this);
        }

        throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
    }

    set(name: Token, value: LoxType): void {
        this.fields.set(name.lexeme, value);
    }

    toString(): string {
        return `<instance of ${this.klass.name}>`;
    }
}
