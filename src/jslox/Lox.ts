import { Scanner } from "./Scanner";

export interface ErrorReporter {
    error(line: number, message: string): void;
}

export class Lox {
    public hadError = false;

    error(line: number, message: string) {
        this.report(line, "", message);
    }

    report(line: number, where: string, message: string) {
        console.error(`[line ${line}] Error${where}: ${message}`);
        this.hadError = true;
    }

    async run(source: string): Promise<any> {
        console.log(source);

        const tokens = new Scanner(source, this).scanTokens();

        return "kinners";
    }
}
