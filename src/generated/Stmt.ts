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

export type Stmt =
    | BlockStmt
    | ExpressionStmt
    | PrintStmt
    | VarStmt

