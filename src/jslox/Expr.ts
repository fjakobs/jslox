import { Token } from "./Token";

export interface Expr {
    visit<R>(visitor: Visitor<R>): R;
}

export interface Stmt {
    visit<R>(visitor: Visitor<R>): R;
}

export interface Visitor<R> {
    visitBinary(binary: Binary): R;
    visitGrouping(grouping: Grouping): R;
    visitLiteral(literal: Literal): R;
    visitVariable(variable: Variable): R;
    visitUnary(unary: Unary): R;
    visitExpression(expression: Expression): R;
    visitPrint(print: Print): R;
    visitVariableDeclaration(variabledeclaration: VariableDeclaration): R;
}

export class Binary implements Expr {
    constructor(readonly left: Expr, readonly operator: Token, readonly right: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitBinary(this);
    }
}

export class Grouping implements Expr {
    constructor(readonly expression: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitGrouping(this);
    }
}

export class Literal implements Expr {
    constructor(readonly value: string|number|null|boolean) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitLiteral(this);
    }
}

export class Variable implements Expr {
    constructor(readonly name: Token) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitVariable(this);
    }
}

export class Unary implements Expr {
    constructor(readonly operator: Token, readonly right: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitUnary(this);
    }
}

export class Expression implements Stmt {
    constructor(readonly expression: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitExpression(this);
    }
}

export class Print implements Stmt {
    constructor(readonly expression: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitPrint(this);
    }
}

export class VariableDeclaration implements Stmt {
    constructor(readonly name: Token, readonly initializer: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitVariableDeclaration(this);
    }
}


