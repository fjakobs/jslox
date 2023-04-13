import { Scanner } from "./Scanner";
import * as assert from "node:assert";
import { Token, TokenType } from "./Token";
import { TokenPosition } from "./Error";

function assertToken(token: Token, type: TokenType, lexeme: string, literal: any, line: number) {
    assert.equal(token.type, type);
    assert.equal(token.lexeme, lexeme);
    assert.equal(token.literal, literal);
    assert.equal(token.line, line);
}

describe("Scanner", () => {
    it("should scan simple tokens", () => {
        const scanner = new Scanner("(){}>=<,.;+-*!");

        const tokens = [...scanner.scanTokens()];
        assert.equal(tokens.length, 14);
        assertToken(tokens[0], "LEFT_PAREN", "(", undefined, 1);
        assertToken(tokens[1], "RIGHT_PAREN", ")", undefined, 1);
        assertToken(tokens[2], "LEFT_BRACE", "{", undefined, 1);
        assertToken(tokens[3], "RIGHT_BRACE", "}", undefined, 1);
        assertToken(tokens[4], "GREATER_EQUAL", ">=", undefined, 1);
        assertToken(tokens[5], "LESS", "<", undefined, 1);
        assertToken(tokens[6], "COMMA", ",", undefined, 1);
        assertToken(tokens[7], "DOT", ".", undefined, 1);
        assertToken(tokens[8], "SEMICOLON", ";", undefined, 1);
        assertToken(tokens[9], "PLUS", "+", undefined, 1);
        assertToken(tokens[10], "MINUS", "-", undefined, 1);
        assertToken(tokens[11], "STAR", "*", undefined, 1);
        assertToken(tokens[12], "BANG", "!", undefined, 1);
        assertToken(tokens[13], "EOF", "", undefined, 1);
    });

    it("should ignore white space and comments", () => {
        const scanner = new Scanner(`+ \t// comment
-`);
        const tokens = [...scanner.scanTokens()];
        assert.equal(tokens.length, 3);
        assertToken(tokens[0], "PLUS", "+", undefined, 1);
        assertToken(tokens[1], "MINUS", "-", undefined, 2);
        assertToken(tokens[2], "EOF", "", undefined, 2);
    });

    it("should scan strings", () => {
        const scanner = new Scanner(`"hello" "world"`);
        const tokens = [...scanner.scanTokens()];
        assert.equal(tokens.length, 3);
        assertToken(tokens[0], "STRING", `"hello"`, "hello", 1);
        assertToken(tokens[1], "STRING", `"world"`, "world", 1);
        assertToken(tokens[2], "EOF", "", undefined, 1);
    });

    it("should give an error for unterminated strings", () => {
        let called = false;
        const scanner = new Scanner(`"hello`, {
            error: (token: TokenPosition, message: string) => {
                assert.equal(token.line, 1);
                assert.equal(message, "Unterminated string.");
                called = true;
            },
            warn: (token: TokenPosition, message: string) => {
                assert.fail("Unexpected warning");
            },
            runtimeError(error) {
                assert.fail("Unexpected runtime error");
            },
        });

        const tokens = [...scanner.scanTokens()];
        assert.equal(tokens.length, 1);
        assertToken(tokens[0], "EOF", "", undefined, 1);
        assert.ok(called);
    });

    it("should scan numbers", () => {
        const scanner = new Scanner(`123 456.789`);
        const tokens = [...scanner.scanTokens()];

        assert.equal(tokens.length, 3);
        assertToken(tokens[0], "NUMBER", "123", 123, 1);
        assertToken(tokens[1], "NUMBER", "456.789", 456.789, 1);
        assertToken(tokens[2], "EOF", "", undefined, 1);
    });

    it("should scan identifiers", () => {
        const scanner = new Scanner(`foo bar baz`);
        const tokens = [...scanner.scanTokens()];

        assert.equal(tokens.length, 4);
        assertToken(tokens[0], "IDENTIFIER", "foo", undefined, 1);
        assertToken(tokens[1], "IDENTIFIER", "bar", undefined, 1);
        assertToken(tokens[2], "IDENTIFIER", "baz", undefined, 1);
        assertToken(tokens[3], "EOF", "", undefined, 1);
    });

    it("should scan keywords", () => {
        const scanner = new Scanner(`and class else false for fun if nil or print return super this true var while`);
        const tokens = [...scanner.scanTokens()];

        // assert.equal(tokens.length, 17);
        assertToken(tokens[0], "AND", "and", undefined, 1);
        assertToken(tokens[1], "CLASS", "class", undefined, 1);
        assertToken(tokens[2], "ELSE", "else", undefined, 1);
        assertToken(tokens[3], "FALSE", "false", undefined, 1);
        assertToken(tokens[4], "FOR", "for", undefined, 1);
        assertToken(tokens[5], "FUN", "fun", undefined, 1);
        assertToken(tokens[6], "IF", "if", undefined, 1);
        assertToken(tokens[7], "NIL", "nil", undefined, 1);
        assertToken(tokens[8], "OR", "or", undefined, 1);
        assertToken(tokens[9], "PRINT", "print", undefined, 1);
        assertToken(tokens[10], "RETURN", "return", undefined, 1);
        assertToken(tokens[11], "SUPER", "super", undefined, 1);
        assertToken(tokens[12], "THIS", "this", undefined, 1);
        assertToken(tokens[13], "TRUE", "true", undefined, 1);
        assertToken(tokens[14], "VAR", "var", undefined, 1);
        assertToken(tokens[15], "WHILE", "while", undefined, 1);
        assertToken(tokens[16], "EOF", "", undefined, 1);
    });
});
