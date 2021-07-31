import { Token } from '../Token'

export interface Binary {
    type: 'binary'
    left: Expr
    operator: Token
    right: Expr
}

export interface Grouping {
    type: 'grouping'
    expression: Expr
}

export interface Literal {
    type: 'literal'
    value: Object
}

export interface Unary {
    type: 'unary'
    operator: Token
    right: Expr
}

export type Expr =
    | Binary
    | Grouping
    | Literal
    | Unary
