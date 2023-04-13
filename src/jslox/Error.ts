import { Token } from "./Token";

export interface ErrorReporter {
    error(token: TokenPosition, message: string): void;
    warn(token: TokenPosition, message: string): void;
    runtimeError(error: RuntimeError): void;
}

export interface TokenPosition {
    line: number;
    start: number;
    end: number;
}

export const defaultErrorReporter: ErrorReporter = {
    error: function (token: TokenPosition, message: string) {
        console.error(`[line ${token.line}] Error: ${message}`);
    },

    warn: (token: TokenPosition, message: string) => {
        console.warn(`[line ${token.line}] Warning: ${message}`);
    },

    runtimeError: function (error: RuntimeError): void {
        console.error(error.message);
    },
};

export const silentErrorReporter: ErrorReporter = {
    error: (token: TokenPosition, message: string) => {},
    warn: (token: TokenPosition, message: string) => {},
    runtimeError: function (error: RuntimeError): void {},
};

export class RuntimeError extends Error {
    constructor(readonly token: TokenPosition | undefined, message: string) {
        super(`[line ${token?.line || 0}] Error: ${message}`);
    }
}
