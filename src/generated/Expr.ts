import { Token } from '../Token'

export interface ConditionalExpr {
    type: 'conditional'
    condition: Expr
    consequent: Expr
    alternative: Expr
}

export function conditionalExpr(
    condition: Expr,
    consequent: Expr,
    alternative: Expr,
): ConditionalExpr {
    return {
        type: 'conditional',
        condition,
        consequent,
        alternative,
    }
}

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

export interface BinaryErrorExpr {
    type: 'binaryError'
    operator: Token
    right: Expr
}

export function binaryErrorExpr(
    operator: Token,
    right: Expr,
): BinaryErrorExpr {
    return {
        type: 'binaryError',
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
    value: Object|null
}

export function literalExpr(
    value: Object|null,
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
    | ConditionalExpr
    | BinaryExpr
    | BinaryErrorExpr
    | GroupingExpr
    | LiteralExpr
    | UnaryExpr

