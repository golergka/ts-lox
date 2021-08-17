import { Expr } from './Expr'
import { Token } from '../Token'

export interface BlockStmt {
    type: 'block'
    statements: Stmt[]
}

export function blockStmt(
    statements: Stmt[],
): BlockStmt {
    return {
        type: 'block',
        statements,
    }
}

export interface ExpressionStmt {
    type: 'expression'
    expression: Expr
}

export function expressionStmt(
    expression: Expr,
): ExpressionStmt {
    return {
        type: 'expression',
        expression,
    }
}

export interface IfStmt {
    type: 'if'
    condition: Expr
    consequent: Stmt
    alternative: Stmt|null
}

export function ifStmt(
    condition: Expr,
    consequent: Stmt,
    alternative: Stmt|null,
): IfStmt {
    return {
        type: 'if',
        condition,
        consequent,
        alternative,
    }
}

export interface PrintStmt {
    type: 'print'
    expression: Expr
}

export function printStmt(
    expression: Expr,
): PrintStmt {
    return {
        type: 'print',
        expression,
    }
}

export interface VarStmt {
    type: 'var'
    name: Token
    initializer: Expr|null|undefined
}

export function varStmt(
    name: Token,
    initializer: Expr|null|undefined,
): VarStmt {
    return {
        type: 'var',
        name,
        initializer,
    }
}

export interface WhileStmt {
    type: 'while'
    condition: Expr
    body: Stmt
}

export function whileStmt(
    condition: Expr,
    body: Stmt,
): WhileStmt {
    return {
        type: 'while',
        condition,
        body,
    }
}

export interface BreakStmt {
    type: 'break'
    body: Token
}

export function breakStmt(
    body: Token,
): BreakStmt {
    return {
        type: 'break',
        body,
    }
}

export interface ContinueStmt {
    type: 'continue'
    body: Token
}

export function continueStmt(
    body: Token,
): ContinueStmt {
    return {
        type: 'continue',
        body,
    }
}

export interface BreakErrorStmt {
    type: 'breakError'
    body: Token
}

export function breakErrorStmt(
    body: Token,
): BreakErrorStmt {
    return {
        type: 'breakError',
        body,
    }
}

export interface ContinueErrorStmt {
    type: 'continueError'
    body: Token
}

export function continueErrorStmt(
    body: Token,
): ContinueErrorStmt {
    return {
        type: 'continueError',
        body,
    }
}

export type Stmt =
    | BlockStmt
    | ExpressionStmt
    | IfStmt
    | PrintStmt
    | VarStmt
    | WhileStmt
    | BreakStmt
    | ContinueStmt
    | BreakErrorStmt
    | ContinueErrorStmt

