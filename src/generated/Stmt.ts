import { Expr } from './Expr'

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

export type Stmt =
    | ExpressionStmt
    | PrintStmt

