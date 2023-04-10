/* eslint-disable @typescript-eslint/naming-convention */

export type TokenType =
    // Single-character tokens.
    | "LEFT_PAREN"
    | "RIGHT_PAREN"
    | "LEFT_BRACE"
    | "RIGHT_BRACE"
    | "COMMA"
    | "DOT"
    | "MINUS"
    | "PLUS"
    | "SEMICOLON"
    | "SLASH"
    | "STAR"

    // One or two character tokens.
    | "BANG"
    | "BANG_EQUAL"
    | "EQUAL"
    | "EQUAL_EQUAL"
    | "GREATER"
    | "GREATER_EQUAL"
    | "LESS"
    | "LESS_EQUAL"

    // Literals
    | "IDENTIFIER"
    | "STRING"
    | "NUMBER"

    // Keywords
    | "AND"
    | "CLASS"
    | "ELSE"
    | "FALSE"
    | "FUN"
    | "FOR"
    | "IF"
    | "NIL"
    | "OR"
    | "PRINT"
    | "RETURN"
    | "SUPER"
    | "THIS"
    | "TRUE"
    | "VAR"
    | "WHILE"
    | "EOF"
    | "BREAK"
    | "CONTINUE";

export class Token {
    constructor(
        readonly type: TokenType,
        readonly lexeme: string,
        readonly literal: string | number | boolean | undefined,
        readonly line: number,
        readonly start: number,
        readonly end: number
    ) {}

    toString(): string {
        return `${this.type} ${this.lexeme} ${this.literal || ""}`;
    }
}
