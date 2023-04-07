import { Token } from "./Token";

export interface ErrorReporter {
    error(line: number, message: string): void;
    runtimeError(error: RuntimeError): void;
}

export const defaultErrorReporter: ErrorReporter = {
    error: (line: number, message: string) => {
        console.error(`[line ${line}] Error: ${message}`);
    },

    runtimeError: function (error: RuntimeError): void {
        console.error(error.message);
    },
};

export const silentErrorReporter: ErrorReporter = {
    error: (line: number, message: string) => {},

    runtimeError: function (error: RuntimeError): void {},
};

export class RuntimeError extends Error {
    constructor(readonly token: Token | undefined, message: string) {
        super(`[line ${token?.line || 0}] Error: ${message}`);
    }
}
