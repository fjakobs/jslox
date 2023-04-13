import { RuntimeError, TokenPosition, silentErrorReporter } from "./Error";
import { Interpreter } from "./Interpreter";
import { Parser } from "./Parser";
import { Resolver } from "./Resolver";
import { Scanner } from "./Scanner";

export class Lox {
    public hadError = false;
    public hadRuntimeError = false;

    readonly interpreter: Interpreter;

    constructor() {
        this.interpreter = new Interpreter(this);
    }

    error(token: TokenPosition, message: string) {
        console.error(`[line ${token.line}] Error: ${message}`);
        this.hadError = true;
    }

    warn(token: TokenPosition, message: string) {
        console.warn(`[line ${token.line}] Warning: ${message}`);
    }

    runtimeError(error: RuntimeError) {
        console.error(error.message);
        this.hadRuntimeError = true;
    }

    isExpression(source: string): boolean {
        try {
            const tokens = new Scanner(source, silentErrorReporter).scanTokens();
            const parser = new Parser(tokens, silentErrorReporter);

            const expression = parser.parseExpression();

            if (this.hadError || !expression) {
                this.hadError = false;
                return false;
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    evaluateExpression(source: string): any {
        const tokens = new Scanner(source, this).scanTokens();
        const parser = new Parser(tokens, this);

        const expression = parser.parseExpression();
        if (this.hadError || !expression) {
            return;
        }

        const resolver = new Resolver(this);
        resolver.resolve([expression]);

        if (this.hadError) {
            return;
        }

        return this.interpreter.interpret(expression, resolver.resolved);
    }

    run(source: string): any {
        const tokens = new Scanner(source, this).scanTokens();
        const parser = new Parser(tokens, this);

        const statements = parser.parse();
        if (this.hadError || !statements) {
            return;
        }

        const resolver = new Resolver(this);
        resolver.resolve(statements);

        if (this.hadError) {
            return;
        }

        return this.interpreter.evaluate(statements, resolver.resolved);
    }
}
