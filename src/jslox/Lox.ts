import { RuntimeError, silentErrorReporter } from "./Error";
import { Interpreter } from "./Interpreter";
import { Parser } from "./Parser";
import { Scanner } from "./Scanner";

export class Lox {
    public hadError = false;
    public hadRuntimeError = false;

    readonly interpreter: Interpreter;

    constructor() {
        this.interpreter = new Interpreter(this);
    }

    error(line: number, message: string) {
        this.report(line, "", message);
    }

    report(line: number, where: string, message: string) {
        console.error(`[line ${line}] Error${where}: ${message}`);
        this.hadError = true;
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

        return this.interpreter.interpret(expression);
    }

    run(source: string): any {
        const tokens = new Scanner(source, this).scanTokens();
        const parser = new Parser(tokens, this);

        const statements = parser.parse();
        if (this.hadError || !statements) {
            return;
        }

        return this.interpreter.evaluate(statements);
    }
}
