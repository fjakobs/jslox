import * as fs from "fs/promises";
import * as repl from "node:repl";
import { Lox } from "./Lox";

export async function runFile(filename: string) {
    const lox = new Lox();
    const source = await fs.readFile(filename, "utf8");
    await lox.run(source);
    if (lox.hadError) {
        process.exit(65);
    }
    if (lox.hadRuntimeError) {
        process.exit(70);
    }
}

export async function runPrompt() {
    const lox = new Lox();

    return await new Promise<void>((resolve, reject) => {
        const replServer = repl.start({
            prompt: "jslox> ",
            eval: (cmd, context, filename, callback) => {
                if (lox.isExpression(cmd)) {
                    const result = lox.evaluateExpression(cmd);
                    lox.hadError = false;
                    lox.hadRuntimeError = false;
                    callback(null, result);
                } else {
                    lox.run(cmd);
                    lox.hadError = false;
                    lox.hadRuntimeError = false;
                    callback(null, null);
                }
            },
        });

        replServer.on("exit", () => {
            resolve();
        });
    });
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length > 1) {
        console.log("Usage: jlox [script]");
        process.exit(64);
    } else if (args.length === 1) {
        await runFile(args[0]);
    } else {
        await runPrompt();
    }
}

if (require.main === module) {
    main();
}
