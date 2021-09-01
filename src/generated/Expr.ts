import { Token } from '../Token'
import { Stmt } from './Stmt'

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

export interface AssignmentExpr {
    type: 'assignment'
    name: Token
    value: Expr
}

export function assignmentExpr(
    name: Token,
    value: Expr,
): AssignmentExpr {
    return {
        type: 'assignment',
        name,
        value,
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

export interface CallExpr {
    type: 'call'
    callee: Expr
    paren: Token
    args: Expr[]
}

export function callExpr(
    callee: Expr,
    paren: Token,
    args: Expr[],
): CallExpr {
    return {
        type: 'call',
        callee,
        paren,
        args,
    }
}

export interface GetExpr {
    type: 'get'
    object: Expr
    name: Token
}

export function getExpr(
    object: Expr,
    name: Token,
): GetExpr {
    return {
        type: 'get',
        object,
        name,
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

export interface VariableExpr {
    type: 'variable'
    name: Token
}

export function variableExpr(
    name: Token,
): VariableExpr {
    return {
        type: 'variable',
        name,
    }
}

export interface LambdaExpr {
    type: 'lambda'
    params: Token[]
    body: Stmt[]
}

export function lambdaExpr(
    params: Token[],
    body: Stmt[],
): LambdaExpr {
    return {
        type: 'lambda',
        params,
        body,
    }
}

export type Expr =
    | ConditionalExpr
    | AssignmentExpr
    | BinaryExpr
    | BinaryErrorExpr
    | CallExpr
    | GetExpr
    | GroupingExpr
    | LiteralExpr
    | UnaryExpr
    | VariableExpr
    | LambdaExpr

