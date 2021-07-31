import { Token } from '../Token'

export interface Binary {
    left: Expr
    operator: Token
    right: Expr
}

export interface Grouping {
    expression: Expr
}

export interface Literal {
    value: Object
}

export interface Unary {
    operator: Token
    right: Expr
}

export interface Expr {
}
