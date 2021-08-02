import { Token } from '../Token'

export interface BinaryExpr {
    type: 'binary'
    left: Expr
    operator: Token
    right: Expr
}

export function binaryExpr(
    left: Expr,
    operator: Token,
    right: Expr,
): BinaryExpr {
    return {
        type: 'binary',
        left,
        operator,
        right,
    }
}

export interface GroupingExpr {
    type: 'grouping'
    expression: Expr
}

export function groupingExpr(
    expression: Expr,
): GroupingExpr {
    return {
        type: 'grouping',
        expression,
    }
}

export interface LiteralExpr {
    type: 'literal'
    value: Object
}

export function literalExpr(
    value: Object,
): LiteralExpr {
    return {
        type: 'literal',
        value,
    }
}

export interface UnaryExpr {
    type: 'unary'
    operator: Token
    right: Expr
}

export function unaryExpr(
    operator: Token,
    right: Expr,
): UnaryExpr {
    return {
        type: 'unary',
        operator,
        right,
    }
}

export type Expr =
    | BinaryExpr
    | GroupingExpr
    | LiteralExpr
    | UnaryExpr

