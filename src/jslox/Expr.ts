import { Token } from "./Token";

export interface Expr {
    visit<R>(visitor: Visitor<R>): R;
}

export interface Stmt {
    visit<R>(visitor: Visitor<R>): R;
}

export interface Visitor<R> {
    visitAssign(assign: Assign): R;
    visitBinary(binary: Binary): R;
    visitGrouping(grouping: Grouping): R;
    visitLiteral(literal: Literal): R;
    visitLogical(logical: Logical): R;
    visitVariable(variable: Variable): R;
    visitUnary(unary: Unary): R;
    visitCall(call: Call): R;
    visitExpression(expression: Expression): R;
    visitFunctionStmt(functionstmt: FunctionStmt): R;
    visitBreakStmt(breakstmt: BreakStmt): R;
    visitContinueStmt(continuestmt: ContinueStmt): R;
    visitIfStmt(ifstmt: IfStmt): R;
    visitBlock(block: Block): R;
    visitPrintStmt(printstmt: PrintStmt): R;
    visitReturnStmt(returnstmt: ReturnStmt): R;
    visitWhileStmt(whilestmt: WhileStmt): R;
    visitForStmt(forstmt: ForStmt): R;
    visitVariableDeclaration(variabledeclaration: VariableDeclaration): R;
}

export class Assign implements Expr {
    constructor(readonly name: Token, readonly value: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitAssign(this);
    }
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
    constructor(readonly value: string | number | null | boolean) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitLiteral(this);
    }
}

export class Logical implements Expr {
    constructor(readonly left: Expr, readonly operator: Token, readonly right: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitLogical(this);
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

export class Call implements Expr {
    constructor(readonly callee: Expr, readonly paren: Token, readonly args: Array<Expr>) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitCall(this);
    }
}

export class Expression implements Stmt {
    constructor(readonly expression: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitExpression(this);
    }
}

export class FunctionStmt implements Stmt {
    constructor(readonly name: Token, readonly params: Array<Token>, readonly body: Array<Stmt>) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitFunctionStmt(this);
    }
}

export class BreakStmt implements Stmt {
    constructor(readonly keyword: Token) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitBreakStmt(this);
    }
}

export class ContinueStmt implements Stmt {
    constructor(readonly keyword: Token) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitContinueStmt(this);
    }
}

export class IfStmt implements Stmt {
    constructor(readonly condition: Expr, readonly thenBranch: Stmt, readonly elseBranch: Stmt | null) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitIfStmt(this);
    }
}

export class Block implements Stmt {
    constructor(readonly statements: Array<Stmt>) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitBlock(this);
    }
}

export class PrintStmt implements Stmt {
    constructor(readonly expression: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitPrintStmt(this);
    }
}

export class ReturnStmt implements Stmt {
    constructor(readonly keyword: Token, readonly value: Expr | null) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitReturnStmt(this);
    }
}

export class WhileStmt implements Stmt {
    constructor(readonly condition: Expr, readonly body: Stmt) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitWhileStmt(this);
    }
}

export class ForStmt implements Stmt {
    constructor(
        readonly initializer: Stmt | null,
        readonly condition: Expr | null,
        readonly increment: Expr | null,
        readonly body: Stmt
    ) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitForStmt(this);
    }
}

export class VariableDeclaration implements Stmt {
    constructor(readonly name: Token, readonly initializer: Expr) {}

    visit<R>(visitor: Visitor<R>): R {
        return visitor.visitVariableDeclaration(this);
    }
}
