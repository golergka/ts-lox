import { Expr } from './Expr'
import { Token } from '../Token'

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
    initializer: Expr|null
}

export function varStmt(
    name: Token,
    initializer: Expr|null,
): VarStmt {
    return {
        type: 'var',
        name,
        initializer,
    }
}

export type Stmt =
    | ExpressionStmt
    | PrintStmt
    | VarStmt

