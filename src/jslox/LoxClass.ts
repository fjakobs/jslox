import { Callable, LoxFunction } from "./LoxFunction";
import { Interpreter, LoxType } from "./Interpreter";
import { LoxInstance } from "./LoxInstance";

export class LoxClass extends Callable {
    constructor(public name: string, public methods: Map<string, LoxFunction>) {
        super();
    }

    get arity(): number {
        const initializer = this.findMethod("init");
        if (initializer) {
            return initializer.arity;
        }
        return 0;
    }

    findMethod(lexeme: string): LoxFunction | undefined {
        if (this.methods.has(lexeme)) {
            return this.methods.get(lexeme);
        }

        return;
    }

    call(interpreter: Interpreter, args: LoxType[]): LoxType {
        const instance = new LoxInstance(this);
        const initializer = this.findMethod("init");
        if (initializer) {
            initializer.bind(instance).call(interpreter, args);
        }
        return instance;
    }

    toString(): string {
        return `<class ${this.name}>`;
    }
}
