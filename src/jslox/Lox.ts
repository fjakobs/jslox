import { RuntimeError } from "./Error";
import { Interpreter } from "./Interpreter";
import { Parser } from "./Parser";
import { PrettyPrinter } from "./PrettyPrinter";
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

    async run(source: string): Promise<any> {
        const tokens = new Scanner(source, this).scanTokens();
        const parser = new Parser(tokens, this);

        const statements = parser.parse();
        if (this.hadError || !statements) {
            return;
        }

        return this.interpreter.evaluate(statements);
    }
}
